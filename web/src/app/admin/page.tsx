"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, Server, Users, DollarSign, Loader2, TrendingUp, Clock } from "lucide-react";
import { getPlatformStats, getRecentActivity, PlatformStats, ActivityItem } from "@/lib/admin-api";

export default function AdminDashboardPage() {
    const [stats, setStats] = useState<PlatformStats | null>(null);
    const [activity, setActivity] = useState<ActivityItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [statsData, activityData] = await Promise.all([
                    getPlatformStats(),
                    getRecentActivity(10)
                ]);
                setStats(statsData);
                setActivity(activityData);
            } catch (error) {
                console.error("Failed to fetch dashboard data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <Loader2 className="h-8 w-8 animate-spin text-brand" />
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-3xl font-bold tracking-tight text-text-primary">Platform Overview</h2>
                <p className="text-text-secondary">Monitor your compute infrastructure and users.</p>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="bg-cream-100 border-cream-200">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-text-primary">
                            Total Users
                        </CardTitle>
                        <Users className="h-4 w-4 text-text-secondary" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-text-primary">
                            {stats?.users.total || 0}
                        </div>
                        <p className="text-xs text-text-secondary">
                            +{stats?.users.new_this_week || 0} this week
                        </p>
                        <div className="mt-2 flex gap-2 text-xs text-text-secondary">
                            <span>Free: {stats?.users.by_plan.free || 0}</span>
                            <span>Pro: {stats?.users.by_plan.pro || 0}</span>
                            <span>Team: {stats?.users.by_plan.team || 0}</span>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-cream-100 border-cream-200">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-text-primary">
                            Active Deployments
                        </CardTitle>
                        <Activity className="h-4 w-4 text-text-secondary" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-500">
                            {stats?.deployments.active || 0}
                        </div>
                        <p className="text-xs text-text-secondary">
                            {stats?.deployments.total || 0} total deployments
                        </p>
                        <div className="mt-2 flex gap-2 text-xs text-text-secondary">
                            <span>Running: {stats?.deployments.by_status.running || 0}</span>
                            <span>Stopped: {stats?.deployments.by_status.stopped || 0}</span>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-cream-100 border-cream-200">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-text-primary">
                            Total GPU Hours
                        </CardTitle>
                        <Clock className="h-4 w-4 text-text-secondary" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-white">
                            {stats?.usage.total_gpu_hours.toFixed(1) || '0.0'}h
                        </div>
                        <p className="text-xs text-text-secondary">
                            Across all deployments
                        </p>
                    </CardContent>
                </Card>

                <Card className="bg-cream-100 border-cream-200">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-text-primary">
                            Estimated Cost
                        </CardTitle>
                        <DollarSign className="h-4 w-4 text-text-secondary" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-white">
                            ${stats?.usage.total_cost.toFixed(2) || '0.00'}
                        </div>
                        <p className="text-xs text-text-secondary">
                            Total platform usage
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Secondary Stats */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card className="bg-cream-100 border-cream-200">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-text-secondary">
                            Providers
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-xl font-bold">
                            {stats?.providers.enabled || 0} Active
                        </div>
                        <p className="text-xs text-text-secondary">
                            {stats?.providers.total || 0} total configured
                        </p>
                    </CardContent>
                </Card>

                <Card className="bg-cream-100 border-cream-200">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-text-secondary">
                            Revenue
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-xl font-bold">
                            ${stats?.revenue.total.toFixed(2) || '0.00'}
                        </div>
                        <p className="text-xs text-text-secondary">
                            Stripe integration pending
                        </p>
                    </CardContent>
                </Card>

                <Card className="bg-cream-100 border-cream-200">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-text-secondary">
                            Deployment Status
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-1 text-sm">
                            <div className="flex justify-between">
                                <span className="text-text-secondary">Creating:</span>
                                <span className="text-brand">{stats?.deployments.by_status.creating || 0}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-text-secondary">Error:</span>
                                <span className="text-red-400">{stats?.deployments.by_status.error || 0}</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Recent Activity */}
            <Card className="bg-cream-100 border-cream-200">
                <CardHeader>
                    <CardTitle className="text-text-primary">Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                    {activity.length === 0 ? (
                        <p className="text-sm text-text-secondary">No recent activity</p>
                    ) : (
                        <div className="space-y-3">
                            {activity.map((item, index) => (
                                <div
                                    key={index}
                                    className="flex items-start gap-3 text-sm border-b border-cream-200 pb-3 last:border-0"
                                >
                                    <div className="mt-0.5">
                                        {item.type === 'user_signup' ? (
                                            <Users className="h-4 w-4 text-blue-500" />
                                        ) : (
                                            <Server className="h-4 w-4 text-green-500" />
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-text-primary">{item.description}</p>
                                        <p className="text-xs text-text-secondary mt-1">
                                            {new Date(item.timestamp).toLocaleString()}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

