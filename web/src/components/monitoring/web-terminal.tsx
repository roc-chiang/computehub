"use client";

import { API_BASE_URL } from "@/lib/api";

import { useEffect, useRef, useState, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Terminal as TerminalIcon, Maximize2, Minimize2, RefreshCw } from "lucide-react";

// Note: xterm.js imports will be done dynamically to avoid SSR issues
let Terminal: any;
let FitAddon: any;

interface WebTerminalProps {
    deploymentId: string | number;
    sshHost?: string;
    sshPort?: number;
    sshUsername?: string;
}

export function WebTerminal({ deploymentId, sshHost, sshPort, sshUsername }: WebTerminalProps) {
    const terminalRef = useRef<HTMLDivElement>(null);
    const [terminal, setTerminal] = useState<any>(null);
    const [fitAddon, setFitAddon] = useState<any>(null);
    const [ws, setWs] = useState<WebSocket | null>(null);
    const [connected, setConnected] = useState(false);
    const [fullscreen, setFullscreen] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [errorType, setErrorType] = useState<string | null>(null);
    const [connecting, setConnecting] = useState(false);
    const [reconnectAttempt, setReconnectAttempt] = useState(0);
    const maxReconnectAttempts = 3;
    const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const wsRef = useRef<WebSocket | null>(null);

    // Load xterm.js dynamically
    useEffect(() => {
        const loadXterm = async () => {
            try {
                const { Terminal: XTerminal } = await import('xterm');
                const { FitAddon: XFitAddon } = await import('xterm-addon-fit');

                // Import CSS
                await import('xterm/css/xterm.css');

                Terminal = XTerminal;
                FitAddon = XFitAddon;
            } catch (err) {
                console.error("Failed to load xterm.js:", err);
                setError("Failed to load terminal library");
            }
        };

        loadXterm();
    }, []);

    // Initialize terminal
    useEffect(() => {
        if (!Terminal || !FitAddon || !terminalRef.current) return;

        const term = new Terminal({
            cursorBlink: true,
            fontSize: 14,
            fontFamily: 'Menlo, Monaco, "Courier New", monospace',
            theme: {
                background: '#1e1e1e',
                foreground: '#d4d4d4',
                cursor: '#d4d4d4',
                black: '#000000',
                red: '#cd3131',
                green: '#0dbc79',
                yellow: '#e5e510',
                blue: '#2472c8',
                magenta: '#bc3fbc',
                cyan: '#11a8cd',
                white: '#e5e5e5',
                brightBlack: '#666666',
                brightRed: '#f14c4c',
                brightGreen: '#23d18b',
                brightYellow: '#f5f543',
                brightBlue: '#3b8eea',
                brightMagenta: '#d670d6',
                brightCyan: '#29b8db',
                brightWhite: '#e5e5e5'
            }
        });

        const fit = new FitAddon();
        term.loadAddon(fit);

        term.open(terminalRef.current);
        fit.fit();

        setTerminal(term);
        setFitAddon(fit);

        // Welcome message
        term.writeln('Welcome to WebSSH Terminal');
        term.writeln('');

        return () => {
            term.dispose();
        };
    }, [Terminal, FitAddon]);

    // WebSocket connection function
    const connectWebSocket = useCallback(async (attempt: number = 0) => {
        if (!terminal) return;

        // Clear any existing reconnect timeout
        if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
            reconnectTimeoutRef.current = null;
        }

        // Close existing connection if any
        if (wsRef.current && wsRef.current.readyState !== WebSocket.CLOSED) {
            wsRef.current.close();
        }

        try {
            setConnecting(true);
            setReconnectAttempt(attempt);

            // Get API URL from environment
            const wsUrlBase = API_BASE_URL.replace(/^http/, 'ws');
            const url = `${wsUrlBase}/deployments/${deploymentId}/terminal`;

            if (attempt === 0) {
                terminal.writeln('Connecting to deployment...');
            } else {
                terminal.writeln(`\r\nReconnecting (attempt ${attempt}/${maxReconnectAttempts})...`);
            }

            const websocket = new WebSocket(url);
            wsRef.current = websocket;

            websocket.onopen = () => {
                setConnected(true);
                setConnecting(false);
                setError(null);
                setErrorType(null);
                setReconnectAttempt(0);
                terminal.writeln('✅ Connected!');
                terminal.writeln('');
            };

            websocket.onmessage = (event) => {
                try {
                    const message = JSON.parse(event.data);

                    if (message.type === 'output') {
                        terminal.write(message.data);
                    } else if (message.type === 'error') {
                        const errorMsg = message.message || 'Unknown error';
                        const errType = message.error_type || 'unknown';

                        terminal.writeln(`\r\n❌ Error: ${errorMsg}`);
                        setError(errorMsg);
                        setErrorType(errType);

                        // Show additional details if available
                        if (message.details && Object.keys(message.details).length > 0) {
                            console.error('[Terminal Error Details]', message.details);
                        }
                    } else if (message.type === 'connected') {
                        terminal.writeln(`✅ ${message.message}`);
                        terminal.writeln('');
                    }
                } catch (e) {
                    // If not JSON, treat as raw data
                    terminal.write(event.data);
                }
            };

            websocket.onerror = (error) => {
                console.error('[WebSocket Error]', error);
                setConnecting(false);
            };

            websocket.onclose = (event) => {
                setConnected(false);
                setConnecting(false);

                if (!event.wasClean) {
                    terminal.writeln('\r\n🔌 Connection lost');

                    // Attempt to reconnect if not at max attempts
                    if (attempt < maxReconnectAttempts) {
                        const delay = Math.min(1000 * Math.pow(2, attempt), 5000); // Exponential backoff: 1s, 2s, 4s, max 5s
                        terminal.writeln(`Reconnecting in ${delay / 1000}s...`);

                        reconnectTimeoutRef.current = setTimeout(() => {
                            connectWebSocket(attempt + 1);
                        }, delay);
                    } else {
                        terminal.writeln('\r\n❌ Maximum reconnection attempts reached');
                        terminal.writeln('Click the reconnect button to try again');
                        setError('Connection failed after multiple attempts');
                    }
                } else {
                    terminal.writeln('\r\n🔌 Connection closed');
                }
            };

            // Send user input to server
            terminal.onData((data: string) => {
                if (websocket.readyState === WebSocket.OPEN) {
                    websocket.send(JSON.stringify({
                        type: 'input',
                        data: data
                    }));
                }
            });

            // Send terminal resize events
            terminal.onResize((size: { cols: number; rows: number }) => {
                if (websocket.readyState === WebSocket.OPEN) {
                    websocket.send(JSON.stringify({
                        type: 'resize',
                        cols: size.cols,
                        rows: size.rows
                    }));
                }
            });

            setWs(websocket);

        } catch (err) {
            console.error('WebSocket connection error:', err);
            terminal.writeln(`\r\n❌ Failed to connect: ${err}`);
            setError('Connection failed');
            setConnecting(false);
        }
    }, [terminal, deploymentId, maxReconnectAttempts]);

    // Connect on mount
    useEffect(() => {
        if (!terminal) return;

        connectWebSocket();

        return () => {
            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current);
            }
            if (wsRef.current) {
                wsRef.current.close();
            }
        };
    }, [terminal, connectWebSocket]);

    // Handle resize
    useEffect(() => {
        if (!fitAddon) return;

        const handleResize = () => {
            fitAddon.fit();
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [fitAddon]);

    const toggleFullscreen = () => {
        setFullscreen(!fullscreen);
        setTimeout(() => {
            fitAddon?.fit();
        }, 100);
    };

    const handleManualReconnect = () => {
        setError(null);
        setErrorType(null);
        setReconnectAttempt(0);
        connectWebSocket(0);
    };

    if (error && !terminal) {
        return (
            <Card className="border-destructive">
                <CardHeader>
                    <CardTitle className="text-destructive">Terminal Error</CardTitle>
                </CardHeader>
                <CardContent>
                    <p>{error}</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className={fullscreen ? "fixed inset-4 z-50" : ""}>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            <TerminalIcon className="h-5 w-5" />
                            SSH Terminal
                        </CardTitle>
                        <CardDescription>
                            Direct terminal access to your deployment
                        </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                        <Badge variant={connected ? "default" : connecting ? "secondary" : "destructive"}>
                            {connected ? "Connected" : connecting ? "Connecting..." : "Disconnected"}
                        </Badge>
                        {reconnectAttempt > 0 && (
                            <Badge variant="outline">
                                Retry {reconnectAttempt}/{maxReconnectAttempts}
                            </Badge>
                        )}
                        {error && !connected && !connecting && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleManualReconnect}
                            >
                                <RefreshCw className="h-4 w-4 mr-1" />
                                Reconnect
                            </Button>
                        )}
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={toggleFullscreen}
                        >
                            {fullscreen ? (
                                <Minimize2 className="h-4 w-4" />
                            ) : (
                                <Maximize2 className="h-4 w-4" />
                            )}
                        </Button>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <div
                    ref={terminalRef}
                    className={fullscreen ? "h-[calc(100vh-12rem)]" : "h-96"}
                />
            </CardContent>
        </Card>
    );
}
