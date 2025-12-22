"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, Clock, RefreshCw, StopCircle, Zap } from "lucide-react";
import { getHeaders } from "@/lib/api";

interface AutomationLogsProps {
    deploymentId: number;
}

interface AutomationLog {
    id: number;
    deployment_id: number;
    rule_id: number | null;
    action: string;
    trigger_reason: string;
    trigger_data_json: string | null;
    result: string;
    error_message: string | null;
    execution_time_ms: number | null;
    created_at: string;
}

export function AutomationLogs({ deploymentId }: AutomationLogsProps) {
    const [logs, setLogs] = useState<AutomationLog[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchLogs();
    }, [deploymentId]);

    const fetchLogs = async () => {
        try {
            const response = await fetch(
                `/api/v1/automation/logs?deployment_id=${deploymentId}&limit=50`,
                { headers: getHeaders() }
            );

            if (response.ok) {
                const data = await response.json();
                setLogs(data);
            }
        } catch (error) {
            console.error("Failed to fetch automation logs:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const getActionIcon = (action: string) => {
        switch (action) {
            case "restart":
                return <RefreshCw className="h-5 w-5 text-blue-500" />;
            case "stop":
                return <StopCircle className="h-5 w-5 text-red-500" />;
            case "migrate":
                return <Zap className="h-5 w-5 text-yellow-500" />;
            case "alert":
                return <Clock className="h-5 w-5 text-orange-500" />;
            default:
                return <CheckCircle2 className="h-5 w-5 text-gray-500" />;
        }
    };

    const getResultBadge = (result: string) => {
        const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
            success: "default",
            failed: "destructive",
            skipped: "secondary",
        };
        return variants[result] || "outline";
    };

    const getActionLabel = (action: string) => {
        const labels: Record<string, string> = {
            restart: "Auto Restart",
            stop: "Auto Stop",
            migrate: "Auto Migrate",
            failover: "Failover",
            alert: "Alert",
        };
        return labels[action] || action;
    };

    const formatRelativeTime = (timestamp: string) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return "Just now";
        if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? "s" : ""} ago`;
        if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
        return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
    };

    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Automation Logs</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="animate-pulse h-64 bg-gray-200 rounded"></div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Automation Logs</CardTitle>
                <CardDescription>
                    History of automated actions and their results
                </CardDescription>
            </CardHeader>
            <CardContent>
                {logs.length === 0 ? (
                    <div className="text-center py-12">
                        <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                        <h3 className="text-lg font-semibold mb-2">No automation logs</h3>
                        <p className="text-muted-foreground">
                            Automated actions will appear here when they occur
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {/* Timeline */}
                        <div className="relative">
                            {/* Timeline line */}
                            <div className="absolute left-[13px] top-0 bottom-0 w-0.5 bg-border" />

                            {/* Events */}
                            <div className="space-y-6">
                                {logs.map((log) => (
                                    <div key={log.id} className="relative flex gap-4">
                                        {/* Icon */}
                                        <div className="relative z-10 flex-shrink-0 bg-background">
                                            {getActionIcon(log.action)}
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 pb-4">
                                            <div className="flex items-start justify-between mb-2">
                                                <div>
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="font-semibold">
                                                            {getActionLabel(log.action)}
                                                        </span>
                                                        <Badge variant={getResultBadge(log.result)} className="text-xs">
                                                            {log.result}
                                                        </Badge>
                                                    </div>
                                                    <p className="text-sm text-muted-foreground">
                                                        {log.trigger_reason}
                                                    </p>
                                                    {log.error_message && (
                                                        <p className="text-sm text-destructive mt-1">
                                                            Error: {log.error_message}
                                                        </p>
                                                    )}
                                                </div>
                                                <div className="text-right">
                                                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                                                        {formatRelativeTime(log.created_at)}
                                                    </span>
                                                    {log.execution_time_ms && (
                                                        <div className="text-xs text-muted-foreground mt-1">
                                                            {log.execution_time_ms}ms
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Additional details */}
                                            {log.trigger_data_json && (
                                                <details className="mt-2">
                                                    <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">
                                                        View details
                                                    </summary>
                                                    <pre className="text-xs bg-accent p-2 rounded mt-1 overflow-x-auto">
                                                        {JSON.stringify(JSON.parse(log.trigger_data_json), null, 2)}
                                                    </pre>
                                                </details>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Info note */}
                        <div className="mt-6 p-3 bg-muted rounded-md">
                            <p className="text-xs text-muted-foreground">
                                💡 Showing last 50 automation events. Configure automation rules in{" "}
                                <a href="/settings/automation" className="underline">
                                    Settings
                                </a>
                                .
                            </p>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
