"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, XCircle, Clock, PlayCircle, AlertCircle } from "lucide-react";
import { getHeaders } from "@/lib/api";

interface AuditLogProps {
    deploymentId: number;
}

interface DeploymentHistory {
    status: string;
    timestamp: string;
    created_at: string;
    updated_at: string;
}

export function AuditLog({ deploymentId }: AuditLogProps) {
    const [deployment, setDeployment] = useState<DeploymentHistory | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchDeployment = async () => {
            try {
                const response = await fetch(
                    `/api/v1/deployments/${deploymentId}`,
                    { headers: getHeaders() }
                );

                if (response.ok) {
                    const data = await response.json();
                    setDeployment(data);
                }
            } catch (error) {
                console.error("[AuditLog] Failed to fetch deployment:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchDeployment();
    }, [deploymentId]);

    const getStatusIcon = (status: string) => {
        switch (status) {
            case "running":
                return <CheckCircle2 className="h-5 w-5 text-green-500" />;
            case "creating":
                return <Clock className="h-5 w-5 text-yellow-500" />;
            case "stopped":
                return <XCircle className="h-5 w-5 text-gray-500" />;
            case "error":
                return <AlertCircle className="h-5 w-5 text-red-500" />;
            default:
                return <PlayCircle className="h-5 w-5 text-blue-500" />;
        }
    };

    const getStatusText = (status: string) => {
        const statusMap: Record<string, string> = {
            "running": "Deployment Running",
            "creating": "Deployment Creating",
            "stopped": "Deployment Stopped",
            "error": "Deployment Error",
        };
        return statusMap[status] || "Status Changed";
    };

    const formatTime = (timestamp: string) => {
        const date = new Date(timestamp);
        return date.toLocaleString();
    };

    const getRelativeTime = (timestamp: string) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return "Just now";
        if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
        if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
        return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    };

    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Deployment History</CardTitle>
                    <CardDescription>Loading deployment history...</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="h-32 flex items-center justify-center">
                        <div className="animate-pulse text-muted-foreground">
                            Loading...
                        </div>
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (!deployment) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Deployment History</CardTitle>
                    <CardDescription>Failed to load deployment data</CardDescription>
                </CardHeader>
            </Card>
        );
    }

    // Generate history events from deployment data
    const events = [
        {
            id: 1,
            action: "Deployment Created",
            status: "success",
            timestamp: deployment.created_at,
            details: `Deployment initialized`
        },
        {
            id: 2,
            action: getStatusText(deployment.status),
            status: deployment.status === "error" ? "error" : "success",
            timestamp: deployment.updated_at,
            details: `Current status: ${deployment.status}`
        }
    ];

    return (
        <Card>
            <CardHeader>
                <CardTitle>Deployment History</CardTitle>
                <CardDescription>
                    Status changes and lifecycle events
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    <div className="relative">
                        {/* Timeline line */}
                        <div className="absolute left-[13px] top-0 bottom-0 w-0.5 bg-border" />

                        {/* Events */}
                        <div className="space-y-6">
                            {events.map((event) => (
                                <div key={event.id} className="relative flex gap-4">
                                    {/* Icon */}
                                    <div className="relative z-10 flex-shrink-0 bg-background">
                                        {getStatusIcon(event.status)}
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 pb-4">
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <p className="font-medium">{event.action}</p>
                                                {event.details && (
                                                    <p className="text-sm text-muted-foreground mt-1">
                                                        {event.details}
                                                    </p>
                                                )}
                                                <p className="text-xs text-muted-foreground mt-2">
                                                    {formatTime(event.timestamp)}
                                                </p>
                                            </div>
                                            <span className="text-xs text-muted-foreground whitespace-nowrap ml-4">
                                                {getRelativeTime(event.timestamp)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Info note */}
                    <div className="mt-6 p-3 bg-muted rounded-md">
                        <p className="text-xs text-muted-foreground">
                            💡 Showing deployment lifecycle events. Detailed operation logs are available in the Logs tab.
                        </p>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
