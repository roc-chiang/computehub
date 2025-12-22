"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, Clock, AlertCircle, RefreshCw } from "lucide-react";
import { getHeaders } from "@/lib/api";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface HealthStatusProps {
    deploymentId: number;
}

interface HealthCheck {
    status: string;
    response_time_ms: number | null;
    checked_at: string;
    error_message: string | null;
}

interface HealthData {
    status: string;
    last_check: string | null;
    response_time_ms: number | null;
    uptime_percentage: number;
    recent_checks: HealthCheck[];
}

export function HealthStatus({ deploymentId }: HealthStatusProps) {
    const [healthData, setHealthData] = useState<HealthData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isChecking, setIsChecking] = useState(false);

    useEffect(() => {
        fetchHealthStatus();
        const interval = setInterval(fetchHealthStatus, 30000); // Refresh every 30 seconds
        return () => clearInterval(interval);
    }, [deploymentId]);

    const fetchHealthStatus = async () => {
        try {
            const response = await fetch(
                `/api/v1/automation/deployments/${deploymentId}/health`,
                { headers: getHeaders() }
            );

            if (response.ok) {
                const data = await response.json();
                setHealthData(data);
            }
        } catch (error) {
            console.error("Failed to fetch health status:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const triggerHealthCheck = async () => {
        setIsChecking(true);
        try {
            const response = await fetch(
                `/api/v1/automation/deployments/${deploymentId}/health/check`,
                {
                    method: "POST",
                    headers: getHeaders(),
                }
            );

            if (response.ok) {
                await fetchHealthStatus();
            }
        } catch (error) {
            console.error("Failed to trigger health check:", error);
        } finally {
            setIsChecking(false);
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case "healthy":
                return <CheckCircle2 className="h-5 w-5 text-green-500" />;
            case "unhealthy":
                return <XCircle className="h-5 w-5 text-red-500" />;
            case "timeout":
                return <Clock className="h-5 w-5 text-yellow-500" />;
            default:
                return <AlertCircle className="h-5 w-5 text-gray-500" />;
        }
    };

    const getStatusBadge = (status: string) => {
        const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
            healthy: "default",
            unhealthy: "destructive",
            timeout: "secondary",
            error: "destructive",
        };
        return variants[status] || "outline";
    };

    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Health Status</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="animate-pulse h-32 bg-gray-200 rounded"></div>
                </CardContent>
            </Card>
        );
    }

    if (!healthData) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Health Status</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">No health data available</p>
                </CardContent>
            </Card>
        );
    }

    // Prepare chart data
    const chartData = healthData.recent_checks
        .slice()
        .reverse()
        .map((check, index) => ({
            index: index + 1,
            responseTime: check.response_time_ms || 0,
            status: check.status,
        }));

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle>Health Status</CardTitle>
                        <CardDescription>
                            Real-time health monitoring and uptime tracking
                        </CardDescription>
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={triggerHealthCheck}
                        disabled={isChecking}
                    >
                        <RefreshCw className={`h-4 w-4 mr-2 ${isChecking ? "animate-spin" : ""}`} />
                        Check Now
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Current Status */}
                <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                        {getStatusIcon(healthData.status)}
                        <div>
                            <div className="font-semibold">Current Status</div>
                            <div className="text-sm text-muted-foreground">
                                {healthData.last_check
                                    ? `Last checked: ${new Date(healthData.last_check).toLocaleString()}`
                                    : "Never checked"}
                            </div>
                        </div>
                    </div>
                    <Badge variant={getStatusBadge(healthData.status)}>
                        {healthData.status.toUpperCase()}
                    </Badge>
                </div>

                {/* Metrics */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 border rounded-lg">
                        <div className="text-sm text-muted-foreground mb-1">Uptime (24h)</div>
                        <div className="text-2xl font-bold">
                            {healthData.uptime_percentage.toFixed(1)}%
                        </div>
                    </div>
                    <div className="p-4 border rounded-lg">
                        <div className="text-sm text-muted-foreground mb-1">Response Time</div>
                        <div className="text-2xl font-bold">
                            {healthData.response_time_ms ? `${healthData.response_time_ms}ms` : "N/A"}
                        </div>
                    </div>
                </div>

                {/* Response Time Chart */}
                {chartData.length > 0 && (
                    <div>
                        <h4 className="text-sm font-semibold mb-3">Response Time History</h4>
                        <ResponsiveContainer width="100%" height={200}>
                            <LineChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="index" />
                                <YAxis />
                                <Tooltip />
                                <Line
                                    type="monotone"
                                    dataKey="responseTime"
                                    stroke="#8b5cf6"
                                    strokeWidth={2}
                                    dot={{ fill: "#8b5cf6" }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                )}

                {/* Recent Checks */}
                <div>
                    <h4 className="text-sm font-semibold mb-3">Recent Checks</h4>
                    <div className="space-y-2">
                        {healthData.recent_checks.slice(0, 5).map((check, index) => (
                            <div
                                key={index}
                                className="flex items-center justify-between p-3 border rounded-lg text-sm"
                            >
                                <div className="flex items-center gap-2">
                                    {getStatusIcon(check.status)}
                                    <span className="text-muted-foreground">
                                        {new Date(check.checked_at).toLocaleTimeString()}
                                    </span>
                                </div>
                                <div className="flex items-center gap-3">
                                    {check.response_time_ms && (
                                        <span className="text-muted-foreground">
                                            {check.response_time_ms}ms
                                        </span>
                                    )}
                                    <Badge variant={getStatusBadge(check.status)} className="text-xs">
                                        {check.status}
                                    </Badge>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
