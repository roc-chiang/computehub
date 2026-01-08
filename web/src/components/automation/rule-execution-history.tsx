"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, Clock, AlertCircle } from "lucide-react";

interface ExecutionLog {
    id: number;
    rule_id: number;
    trigger_reason: string;
    action_taken: string;
    target_deployment_id: number | null;
    status: string;
    result_message: string | null;
    error_message: string | null;
    executed_at: string;
}

export function RuleExecutionHistory({ ruleId }: { ruleId?: number }) {
    const [logs, setLogs] = useState<ExecutionLog[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchLogs();
    }, [ruleId]);

    const fetchLogs = async () => {
        try {
            const url = ruleId
                ? `/api/v1/rules/${ruleId}/executions?limit=50`
                : `/api/v1/execution-logs?limit=100`;

            const response = await fetch(url, {
                headers: {
                    "Authorization": `Bearer ${localStorage.getItem("token")}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                setLogs(data);
            }
        } catch (error) {
            console.error("Failed to fetch execution logs:", error);
        } finally {
            setLoading(false);
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case "success":
                return <CheckCircle2 className="h-5 w-5 text-green-500" />;
            case "failed":
                return <XCircle className="h-5 w-5 text-red-500" />;
            case "skipped":
                return <Clock className="h-5 w-5 text-gray-400" />;
            default:
                return <AlertCircle className="h-5 w-5 text-yellow-500" />;
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "success":
                return <Badge variant="default" className="bg-green-500">Success</Badge>;
            case "failed":
                return <Badge variant="destructive">Failed</Badge>;
            case "skipped":
                return <Badge variant="secondary">Skipped</Badge>;
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }).format(date);
    };

    if (loading) {
        return <div className="text-center py-8">Loading execution history...</div>;
    }

    return (
        <div className="space-y-4">
            <div>
                <h3 className="text-lg font-semibold">Execution History</h3>
                <p className="text-sm text-muted-foreground">
                    View when rules were triggered and what actions were taken
                </p>
            </div>

            {logs.length === 0 ? (
                <Card>
                    <CardContent className="py-8 text-center text-muted-foreground">
                        No execution history yet. Rules will appear here when they are triggered.
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-3">
                    {logs.map((log) => (
                        <Card key={log.id}>
                            <CardContent className="py-4">
                                <div className="flex items-start gap-4">
                                    <div className="mt-0.5">
                                        {getStatusIcon(log.status)}
                                    </div>
                                    <div className="flex-1 space-y-2">
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <div className="font-medium">{log.trigger_reason}</div>
                                                <div className="text-sm text-muted-foreground">
                                                    Action: {log.action_taken}
                                                    {log.target_deployment_id && ` • Deployment #${log.target_deployment_id}`}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {getStatusBadge(log.status)}
                                                <span className="text-xs text-muted-foreground">
                                                    {formatDate(log.executed_at)}
                                                </span>
                                            </div>
                                        </div>

                                        {log.result_message && (
                                            <div className="text-sm text-muted-foreground bg-muted p-2 rounded">
                                                {log.result_message}
                                            </div>
                                        )}

                                        {log.error_message && (
                                            <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
                                                Error: {log.error_message}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
