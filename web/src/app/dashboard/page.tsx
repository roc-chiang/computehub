"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth, useUser } from "@clerk/nextjs";
import {
    Rocket,
    DollarSign,
    CreditCard,
    Server,
    Plus,
    BookTemplate,
    TrendingUp,
    ArrowRight
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { getDeployments, type Deployment } from "@/lib/api";
import { getUserProfile, type UserProfile } from "@/lib/user-profile-api";
import { getCostSummary, getCostTimeline } from "@/lib/costs-api";
import { setAuthToken } from "@/lib/api";
import { StatusBadge } from "@/components/deploy/deployment-status";
import { Badge } from "@/components/ui/badge";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useLicense } from "@/contexts/license-context";

export default function DashboardPage() {
    const [loading, setLoading] = useState(true);
    const [deployments, setDeployments] = useState<Deployment[]>([]);
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [costSummary, setCostSummary] = useState<any>(null);
    const [costTimeline, setCostTimeline] = useState<any[]>([]);
    const { getToken, isLoaded, isSignedIn } = useAuth();
    const { user } = useUser();
    const { license } = useLicense();

    useEffect(() => {
        console.log('[Dashboard] Auth State: Loaded=' + isLoaded + ', SignedIn=' + isSignedIn + ', User=' + user?.id);

        const fetchData = async () => {
            if (!isLoaded) {
                console.log('[Dashboard] Clerk not loaded yet, waiting...');
                return;
            }

            if (!isSignedIn) {
                console.log('[Dashboard] User not signed in');
                setLoading(false);
                return;
            }

            try {
                const token = await getToken();
                console.log('[Dashboard] Token received:', token ? `${token.substring(0, 20)}...` : 'NULL');

                if (!token) {
                    console.log('[Dashboard] No token available');
                    setLoading(false);
                    return;
                }

                setAuthToken(token);
                console.log('[Dashboard] Token set, making API calls...');

                const [deploymentsData, summaryData, timelineData] = await Promise.all([
                    getDeployments(),
                    getCostSummary(),
                    getCostTimeline(7), // Last 7 days
                ]);


                setDeployments(deploymentsData.sort((a, b) =>
                    new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
                ));
                setCostSummary(summaryData);
                setCostTimeline(timelineData);
            } catch (error) {
                console.error("Failed to fetch dashboard data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [isLoaded, isSignedIn, getToken, user]);

    const activeDeployments = deployments.filter(d => d.status.toLowerCase() === "running").length;
    const recentDeployments = deployments.slice(0, 5);
    const isNewUser = deployments.length === 0;

    return (
        <div className="space-y-8 pb-20">
            {/* Welcome Header */}
            <div>
                <h1 className="text-3xl font-bold tracking-tight">
                    👋 Welcome back{user?.firstName ? `, ${user.firstName}` : ""}!
                </h1>
                <p className="text-text-secondary mt-1">
                    Here's what's happening with your GPU deployments
                </p>
            </div>

            {/* Statistics Cards */}
            {loading ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {[1, 2, 3, 4].map((i) => (
                        <Skeleton key={i} className="h-32" />
                    ))}
                </div>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {/* Active Deployments */}
                    <Card className="hover:border-primary transition-colors cursor-pointer">
                        <Link href="/deploy">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">
                                    Active Deployments
                                </CardTitle>
                                <Rocket className="h-4 w-4 text-blue-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{activeDeployments}</div>
                                <p className="text-xs text-text-secondary">
                                    {deployments.length} total deployments
                                </p>
                            </CardContent>
                        </Link>
                    </Card>

                    {/* This Month Cost */}
                    <Card className="hover:border-primary transition-colors cursor-pointer">
                        <Link href="/costs">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">
                                    This Month
                                </CardTitle>
                                <DollarSign className="h-4 w-4 text-green-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">
                                    ${costSummary?.month_cost?.toFixed(2) || "0.00"}
                                </div>
                                <p className="text-xs text-text-secondary">
                                    ${costSummary?.week_cost?.toFixed(2) || "0.00"} this week
                                </p>
                            </CardContent>
                        </Link>
                    </Card>

                    {/* License Status */}
                    <Card className="hover:border-primary transition-colors cursor-pointer">
                        <Link href="/settings/license">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">
                                    License
                                </CardTitle>
                                <CreditCard className="h-4 w-4 text-purple-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold capitalize">
                                    {license.isProEnabled ? 'Pro' : 'Community'}
                                </div>
                                <div className="flex items-center gap-2 mt-1">
                                    {!license.isProEnabled ? (
                                        <>
                                            <Badge variant="secondary" className="text-xs">Free</Badge>
                                            <Button variant="link" className="h-auto p-0 text-xs">
                                                Upgrade to Pro →
                                            </Button>
                                        </>
                                    ) : (
                                        <Badge variant="default" className="text-xs">
                                            Active
                                        </Badge>
                                    )}
                                </div>
                            </CardContent>
                        </Link>
                    </Card>

                    {/* Total Deployments */}
                    <Card className="hover:border-primary transition-colors cursor-pointer">
                        <Link href="/deploy">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">
                                    Total Deployments
                                </CardTitle>
                                <Server className="h-4 w-4 text-orange-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{deployments.length}</div>
                                <p className="text-xs text-text-secondary">
                                    All-time deployments
                                </p>
                            </CardContent>
                        </Link>
                    </Card>
                </div>
            )}

            {/* Quick Actions */}
            <Card>
                <CardHeader>
                    <CardTitle>🚀 Quick Actions</CardTitle>
                    <CardDescription>Get started with common tasks</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-4 md:grid-cols-3">
                        <Link href="/deploy/new">
                            <Button className="w-full h-20" size="lg">
                                <Plus className="h-5 w-5 mr-2" />
                                New Deployment
                            </Button>
                        </Link>
                        <Link href="/settings/templates">
                            <Button variant="outline" className="w-full h-20" size="lg">
                                <BookTemplate className="h-5 w-5 mr-2" />
                                Templates
                            </Button>
                        </Link>
                        <Link href="/gpu-prices">
                            <Button variant="outline" className="w-full h-20" size="lg">
                                <TrendingUp className="h-5 w-5 mr-2" />
                                GPU Prices
                            </Button>
                        </Link>
                    </div>
                </CardContent>
            </Card>

            {/* New User Welcome */}
            {isNewUser && !loading && (
                <Card className="border-primary">
                    <CardHeader>
                        <CardTitle>🎉 Welcome to ComputeHub!</CardTitle>
                        <CardDescription>
                            Get started by creating your first GPU deployment
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p className="text-sm text-text-secondary">
                            ComputeHub makes it easy to deploy and manage GPU instances across multiple cloud providers.
                            Start by creating your first deployment or browse our GPU pricing to find the best deal.
                        </p>
                        <div className="flex gap-4">
                            <Link href="/deploy/new">
                                <Button>
                                    <Plus className="h-4 w-4 mr-2" />
                                    Create First Deployment
                                </Button>
                            </Link>
                            <Link href="/gpu-prices">
                                <Button variant="outline">
                                    <TrendingUp className="h-4 w-4 mr-2" />
                                    Browse GPU Prices
                                </Button>
                            </Link>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Recent Deployments */}
            {!isNewUser && !loading && (
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle>📋 Recent Deployments</CardTitle>
                                <CardDescription>Your latest GPU instances</CardDescription>
                            </div>
                            <Link href="/deploy">
                                <Button variant="ghost" size="sm">
                                    View All
                                    <ArrowRight className="h-4 w-4 ml-2" />
                                </Button>
                            </Link>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {recentDeployments.map((deployment) => (
                                <Link
                                    key={deployment.id}
                                    href={`/deploy/${deployment.id}`}
                                    className="flex items-center justify-between p-4 border border-cream-200 rounded-lg hover:bg-cream-50 transition-colors"
                                >
                                    <div className="flex-1">
                                        <div className="font-medium">{deployment.name}</div>
                                        <div className="text-sm text-text-secondary">
                                            {deployment.gpu_type} x{deployment.gpu_count} • {deployment.provider}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <StatusBadge status={deployment.status} />
                                        <div className="text-xs text-text-secondary">
                                            {new Date(deployment.created_at).toLocaleDateString()}
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Cost Trend */}
            {!isNewUser && !loading && costTimeline.length > 0 && (
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle>📈 Cost Trend (Last 7 Days)</CardTitle>
                                <CardDescription>Daily spending overview</CardDescription>
                            </div>
                            <Link href="/costs">
                                <Button variant="ghost" size="sm">
                                    View Details
                                    <ArrowRight className="h-4 w-4 ml-2" />
                                </Button>
                            </Link>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={200}>
                            <LineChart data={costTimeline}>
                                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                                <XAxis
                                    dataKey="date"
                                    className="text-xs"
                                    tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                />
                                <YAxis className="text-xs" tickFormatter={(value) => `$${value}`} />
                                <Tooltip
                                    content={({ active, payload }) => {
                                        if (active && payload && payload.length) {
                                            return (
                                                <div className="bg-background border rounded-lg p-2 shadow-lg">
                                                    <p className="text-sm font-medium">
                                                        {new Date(payload[0].payload.date).toLocaleDateString()}
                                                    </p>
                                                    <p className="text-sm text-text-secondary">
                                                        ${payload[0].value?.toFixed(2)}
                                                    </p>
                                                </div>
                                            );
                                        }
                                        return null;
                                    }}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="cost"
                                    stroke="hsl(var(--primary))"
                                    strokeWidth={2}
                                    dot={{ fill: "hsl(var(--primary))" }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
