"use client";

import { useEffect, useState, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Copy, Download, Search, Pause, Play } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getHeaders } from "@/lib/api";

interface LogViewerProps {
    deploymentId: number;
}

interface LogEntry {
    line: string;
    timestamp: string;
}

export function LogViewer({ deploymentId }: LogViewerProps) {
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [isFollowing, setIsFollowing] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [isConnected, setIsConnected] = useState(false);
    const logContainerRef = useRef<HTMLDivElement>(null);
    const eventSourceRef = useRef<EventSource | null>(null);
    const { toast } = useToast();

    // Auto-scroll to bottom when new logs arrive
    useEffect(() => {
        if (isFollowing && logContainerRef.current) {
            logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
        }
    }, [logs, isFollowing]);

    // Connect to log stream with polling
    useEffect(() => {
        if (!isFollowing) return;

        let isMounted = true;

        const fetchLogs = async () => {
            try {
                const response = await fetch(
                    `/api/v1/deployments/${deploymentId}/logs?lines=100`,
                    { headers: getHeaders() }
                );

                if (!response.ok) {
                    const errorText = await response.text();
                    console.error(`[LogViewer] HTTP ${response.status}:`, errorText);
                    throw new Error(`HTTP ${response.status}: ${errorText}`);
                }

                const data = await response.json();
                console.log("[LogViewer] Received data:", data);

                if (isMounted && data.logs) {
                    // Handle both array and string responses
                    let logsArray: string[];
                    if (Array.isArray(data.logs)) {
                        logsArray = data.logs;
                    } else if (typeof data.logs === 'string') {
                        // Single string message (error or info)
                        logsArray = [data.logs];
                    } else {
                        logsArray = [];
                    }

                    setLogs(logsArray.map((line: string) => ({
                        line,
                        timestamp: new Date().toISOString()
                    })));
                    setIsConnected(true);
                }
            } catch (error) {
                console.error("[LogViewer] Failed to fetch logs:", error);
                if (isMounted) {
                    setIsConnected(false);
                    // Don't show toast on every poll failure
                }
            }
        };

        // Initial fetch
        fetchLogs();

        // Poll every 2 seconds
        const interval = setInterval(fetchLogs, 2000);

        return () => {
            isMounted = false;
            clearInterval(interval);
            setIsConnected(false);
        };
    }, [deploymentId, isFollowing, toast]);

    const handleCopyLogs = () => {
        const logText = logs.map((log) => log.line).join("\n");
        navigator.clipboard.writeText(logText);
        toast({
            title: "Copied!",
            description: "Logs copied to clipboard",
        });
    };

    const handleDownloadLogs = () => {
        const logText = logs.map((log) => log.line).join("\n");
        const blob = new Blob([logText], { type: "text/plain" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `deployment-${deploymentId}-logs.txt`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const toggleFollow = () => {
        setIsFollowing(!isFollowing);
    };

    // Filter logs by search term
    const filteredLogs = searchTerm
        ? logs.filter((log) =>
            log.line.toLowerCase().includes(searchTerm.toLowerCase())
        )
        : logs;

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle>Container Logs</CardTitle>
                        <CardDescription>
                            Real-time logs from your deployment
                            {isConnected && (
                                <span className="ml-2 text-green-500">● Live</span>
                            )}
                        </CardDescription>
                    </div>
                    <div className="flex gap-2">
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={toggleFollow}
                            title={isFollowing ? "Pause" : "Resume"}
                        >
                            {isFollowing ? (
                                <Pause className="h-4 w-4" />
                            ) : (
                                <Play className="h-4 w-4" />
                            )}
                        </Button>
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={handleCopyLogs}
                            title="Copy logs"
                        >
                            <Copy className="h-4 w-4" />
                        </Button>
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={handleDownloadLogs}
                            title="Download logs"
                        >
                            <Download className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
                <div className="mt-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search logs..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <div
                    ref={logContainerRef}
                    className="bg-black text-green-400 p-4 rounded-md font-mono text-sm h-96 overflow-y-auto whitespace-pre-wrap break-all"
                >
                    {filteredLogs.length === 0 ? (
                        <div className="text-muted-foreground">
                            {searchTerm
                                ? "No logs match your search"
                                : "Waiting for logs..."}
                        </div>
                    ) : (
                        filteredLogs.map((log, i) => (
                            <div key={i} className="hover:bg-gray-900">
                                {log.line}
                            </div>
                        ))
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
