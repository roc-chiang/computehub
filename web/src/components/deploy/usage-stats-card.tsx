"use client";

import { useCallback, useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getDeploymentUsageStats, type UsageStats } from "@/lib/api";
import { Clock, DollarSign, Zap, TrendingUp } from "lucide-react";

interface UsageStatsCardProps {
    deploymentId: number;
}

export function UsageStatsCard({ deploymentId }: UsageStatsCardProps) {
    const [stats, setStats] = useState<UsageStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchStats = useCallback(async () => {
        try {
            const data = await getDeploymentUsageStats(deploymentId);
            setStats(data);
            setError(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to load usage stats");
        } finally {
            setLoading(false);
        }
    }, [deploymentId]);

    useEffect(() => {
        fetchStats();
        // Refresh every 30 seconds
        const interval = setInterval(() => void fetchStats(), 30000);
        return () => clearInterval(interval);
    }, [fetchStats]);

    if (loading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Usage & Cost</CardTitle>
                    <CardDescription>Recorded GPU usage and cost</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="animate-pulse space-y-3">
                        <div className="h-16 bg-muted rounded" />
                        <div className="h-16 bg-muted rounded" />
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (error) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Usage & Cost</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-destructive">{error}</p>
                </CardContent>
            </Card>
        );
    }

    if (!stats) return null;

    const formatUptime = (seconds: number) => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        if (hours > 0) {
            return `${hours}h ${minutes}m`;
        }
        return `${minutes}m`;
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-primary" />
                    Usage & Cost
                </CardTitle>
                <CardDescription>Recorded GPU usage and cost</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-2 gap-4">
                    {/* Uptime */}
                    <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Clock className="h-4 w-4" />
                            Uptime
                        </div>
                        <p className="text-2xl font-bold">{formatUptime(stats.uptime_seconds)}</p>
                        <p className="text-xs text-muted-foreground">
                            {stats.uptime_hours.toFixed(2)} hours
                        </p>
                    </div>

                    {/* GPU Hours */}
                    <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Zap className="h-4 w-4" />
                            GPU Hours
                        </div>
                        <p className="text-2xl font-bold">{stats.total_gpu_hours.toFixed(2)}</p>
                        <p className="text-xs text-muted-foreground">
                            {stats.gpu_count} × {stats.gpu_type}
                        </p>
                    </div>

                    {/* Cost per Hour */}
                    <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <DollarSign className="h-4 w-4" />
                            Cost/Hour
                        </div>
                        <p className="text-2xl font-bold">
                            {stats.cost_per_hour === null ? "No data" : `$${stats.cost_per_hour.toFixed(2)}`}
                        </p>
                        <p className="text-xs text-muted-foreground">
                            {stats.cost_per_gpu_hour === null
                                ? "Awaiting a usage record"
                                : `$${stats.cost_per_gpu_hour.toFixed(2)} per GPU`}
                        </p>
                    </div>

                    {/* Total Cost */}
                    <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <DollarSign className="h-4 w-4" />
                            Total Cost
                        </div>
                        <p className="text-2xl font-bold text-primary">
                            ${stats.recorded_cost_usd.toFixed(2)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                            Recorded
                        </p>
                    </div>
                </div>

                {/* Info Banner */}
                <div className="mt-4 p-3 bg-muted rounded-lg">
                    <p className="text-xs text-muted-foreground">
                        Costs shown here come from recorded usage data.
                        {stats.status === "running" && " Updates every 30 seconds."}
                    </p>
                </div>
            </CardContent>
        </Card>
    );
}
