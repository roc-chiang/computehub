"use client";

import { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Terminal as TerminalIcon, X, Maximize2, Minimize2 } from "lucide-react";

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
        term.writeln('Connecting to deployment...');
        term.writeln('');

        return () => {
            term.dispose();
        };
    }, [Terminal, FitAddon]);

    // Connect WebSocket
    useEffect(() => {
        if (!terminal) return;

        // TODO: Replace with actual WebSSH endpoint when backend is ready
        // For now, show a message
        terminal.writeln('⚠️  WebSSH backend not yet implemented');
        terminal.writeln('');
        terminal.writeln('Connection details:');
        terminal.writeln(`  Host: ${sshHost || 'N/A'}`);
        terminal.writeln(`  Port: ${sshPort || 'N/A'}`);
        terminal.writeln(`  User: ${sshUsername || 'root'}`);
        terminal.writeln('');
        terminal.writeln('Use SSH client to connect manually for now.');

        // Uncomment when backend is ready:
        /*
        const websocket = new WebSocket(
            `ws://localhost:8000/api/v1/deployments/${deploymentId}/ssh`
        );

        websocket.onopen = () => {
            setConnected(true);
            terminal.writeln('✅ Connected!');
        };

        websocket.onmessage = (event) => {
            terminal.write(event.data);
        };

        websocket.onerror = (error) => {
            setError("Connection failed");
            terminal.writeln('\r\n❌ Connection error');
        };

        websocket.onclose = () => {
            setConnected(false);
            terminal.writeln('\r\n🔌 Connection closed');
        };

        terminal.onData((data: string) => {
            websocket.send(data);
        });

        setWs(websocket);

        return () => {
            websocket.close();
        };
        */
    }, [terminal, deploymentId]);

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

    if (error) {
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
                        <Badge variant={connected ? "default" : "secondary"}>
                            {connected ? "Connected" : "Disconnected"}
                        </Badge>
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
