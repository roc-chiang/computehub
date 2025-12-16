"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DollarSign, TrendingUp, Calendar, Activity, Download, PieChart as PieChartIcon, BarChart3 } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, Legend } from "recharts";
import { getCostSummary, getCostTimeline, getCostBreakdown, type CostSummary, type TimelinePoint, type CostBreakdown } from "@/lib/costs-api";
import { useAuth } from "@clerk/nextjs";
import { setAuthToken } from "@/lib/api";
import { getDeployments, type Deployment } from "@/lib/api";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

export default function CostsPage() {
    const [summary, setSummary] = useState<CostSummary | null>(null);
    const [timeline, setTimeline] = useState<TimelinePoint[]>([]);
    const [breakdown, setBreakdown] = useState<CostBreakdown | null>(null);
    const [deployments, setDeployments] = useState<Deployment[]>([]);
    const [loading, setLoading] = useState(true);
    const { getToken, isLoaded, isSignedIn } = useAuth();

    useEffect(() => {
        async function fetchData() {
            if (!isLoaded || !isSignedIn) {
                setLoading(false);
                return;
            }

            try {
                const token = await getToken();
                setAuthToken(token);

                const [summaryData, timelineData, breakdownData, deploymentsData] = await Promise.all([
                    getCostSummary(),
                    getCostTimeline(30),
                    getCostBreakdown(),
                    getDeployments()
                ]);
                setSummary(summaryData);
                setTimeline(timelineData);
                setBreakdown(breakdownData);
                setDeployments(deploymentsData);
            } catch (error) {
                console.error("Error fetching cost data:", error);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, [isLoaded, isSignedIn, getToken]);

    // Export to CSV
    const exportToCSV = () => {
        const csvRows = [
            ["Date", "Deployment", "GPU Type", "Provider", "Status", "Cost (Estimated)"],
            ...deployments.map(d => [
                new Date(d.created_at || "").toLocaleDateString(),
                d.name,
                d.gpu_type,
                d.provider,
                d.status,
                "$0.00" // Placeholder - would calculate based on uptime
            ])
        ];
        const csvContent = csvRows.map(row => row.join(",")).join("\n");
        const blob = new Blob([csvContent], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `cost-report-${new Date().toISOString().split("T")[0]}.csv`;
        a.click();
    };

    return (
        <div className="space-y-6 pb-20">
            <div>
                <h3 className="text-3xl font-bold tracking-tight">Cost Tracking</h3>
                <p className="text-muted-foreground">
                    Monitor your GPU spending and usage
                </p>
            </div>

            {/* Summary Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {/* Total All Time */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Total Spent
                        </CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <Skeleton className="h-8 w-24" />
                        ) : (
                            <>
                                <div className="text-2xl font-bold">
                                    ${summary?.total_all_time.toFixed(2) || "0.00"}
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    All time
                                </p>
                            </>
                        )}
                    </CardContent>
                </Card>

                {/* This Month */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            This Month
                        </CardTitle>
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <Skeleton className="h-8 w-24" />
                        ) : (
                            <>
                                <div className="text-2xl font-bold">
                                    ${summary?.total_this_month.toFixed(2) || "0.00"}
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                                </p>
                            </>
                        )}
                    </CardContent>
                </Card>

                {/* This Week */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            This Week
                        </CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <Skeleton className="h-8 w-24" />
                        ) : (
                            <>
                                <div className="text-2xl font-bold">
                                    ${summary?.total_this_week.toFixed(2) || "0.00"}
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Last 7 days
                                </p>
                            </>
                        )}
                    </CardContent>
                </Card>

                {/* Active Cost */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Active Cost
                        </CardTitle>
                        <Activity className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <Skeleton className="h-8 w-24" />
                        ) : (
                            <>
                                <div className="text-2xl font-bold">
                                    ${summary?.active_cost_per_hour.toFixed(2) || "0.00"}/h
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Running deployments
                                </p>
                            </>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Cost Trend Chart */}
            <Card>
                <CardHeader>
                    <CardTitle>Cost Trend</CardTitle>
                    <CardDescription>
                        Daily spending over the last 30 days
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <Skeleton className="h-[300px] w-full" />
                    ) : timeline.length === 0 ? (
                        <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                            No cost data available yet. Create a deployment to start tracking costs.
                        </div>
                    ) : (
                        <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={timeline}>
                                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                                <XAxis
                                    dataKey="date"
                                    className="text-xs"
                                    tickFormatter={(value) => {
                                        const date = new Date(value);
                                        return `${date.getMonth() + 1}/${date.getDate()}`;
                                    }}
                                />
                                <YAxis
                                    className="text-xs"
                                    tickFormatter={(value) => `$${value}`}
                                />
                                <Tooltip
                                    content={({ active, payload }) => {
                                        if (active && payload && payload.length) {
                                            return (
                                                <div className="bg-background border rounded-lg p-2 shadow-lg">
                                                    <p className="text-sm font-medium">
                                                        {new Date(payload[0].payload.date).toLocaleDateString()}
                                                    </p>
                                                    <p className="text-sm text-muted-foreground">
                                                        Cost: ${payload[0].value?.toFixed(2)}
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
                                    dot={{ fill: "hsl(var(--primary))", r: 3 }}
                                    activeDot={{ r: 5 }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    )}
                </CardContent>
            </Card>

            {/* Projected Monthly Cost */}
            {summary && summary.active_cost_per_hour > 0 && (
                <Card className="border-yellow-500/50 bg-yellow-500/5">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <TrendingUp className="h-5 w-5 text-yellow-600" />
                            Projected Monthly Cost
                        </CardTitle>
                        <CardDescription>
                            Based on your current active deployments
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-yellow-600">
                            ${summary.projected_monthly.toFixed(2)}
                        </div>
                        <p className="text-sm text-muted-foreground mt-2">
                            If you keep your current deployments running for the entire month
                        </p>
                    </CardContent>
                </Card>
            )}

            {/* Cost Breakdown Charts */}
            {breakdown && (breakdown.by_gpu_type.length > 0 || breakdown.by_provider.length > 0) && (
                <div className="grid gap-6 md:grid-cols-2">
                    {/* By GPU Type */}
                    {breakdown.by_gpu_type.length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <PieChartIcon className="h-5 w-5" />
                                    Cost by GPU Type
                                </CardTitle>
                                <CardDescription>
                                    Distribution of costs across GPU models
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ResponsiveContainer width="100%" height={300}>
                                    <PieChart>
                                        <Pie
                                            data={breakdown.by_gpu_type as any}
                                            cx="50%"
                                            cy="50%"
                                            labelLine={false}
                                            label={(entry: any) => `${entry.gpu_type}: ${entry.percentage}%`}
                                            outerRadius={80}
                                            fill="#8884d8"
                                            dataKey="cost"
                                        >
                                            {breakdown.by_gpu_type.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            content={({ active, payload }) => {
                                                if (active && payload && payload.length) {
                                                    const data = payload[0].payload;
                                                    return (
                                                        <div className="bg-background border rounded-lg p-2 shadow-lg">
                                                            <p className="text-sm font-medium">{data.gpu_type}</p>
                                                            <p className="text-sm text-muted-foreground">
                                                                ${data.cost.toFixed(2)} ({data.percentage}%)
                                                            </p>
                                                        </div>
                                                    );
                                                }
                                                return null;
                                            }}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                    )}

                    {/* By Provider */}
                    {breakdown.by_provider.length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <BarChart3 className="h-5 w-5" />
                                    Cost by Provider
                                </CardTitle>
                                <CardDescription>
                                    Comparison across cloud providers
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ResponsiveContainer width="100%" height={300}>
                                    <BarChart data={breakdown.by_provider}>
                                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                                        <XAxis dataKey="provider" className="text-xs" />
                                        <YAxis className="text-xs" tickFormatter={(value) => `$${value}`} />
                                        <Tooltip
                                            content={({ active, payload }) => {
                                                if (active && payload && payload.length) {
                                                    const data = payload[0].payload;
                                                    return (
                                                        <div className="bg-background border rounded-lg p-2 shadow-lg">
                                                            <p className="text-sm font-medium">{data.provider}</p>
                                                            <p className="text-sm text-muted-foreground">
                                                                ${data.cost.toFixed(2)} ({data.percentage}%)
                                                            </p>
                                                        </div>
                                                    );
                                                }
                                                return null;
                                            }}
                                        />
                                        <Bar dataKey="cost">
                                            {breakdown.by_provider.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                    )}
                </div>
            )}

            {/* Cost History Table */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>Cost History</CardTitle>
                            <CardDescription>
                                Detailed breakdown of your deployments
                            </CardDescription>
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={exportToCSV}
                            disabled={deployments.length === 0}
                        >
                            <Download className="h-4 w-4 mr-2" />
                            Export CSV
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <Skeleton className="h-[200px] w-full" />
                    ) : deployments.length === 0 ? (
                        <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                            No deployments yet. Create a deployment to start tracking costs.
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Deployment</TableHead>
                                        <TableHead>GPU Type</TableHead>
                                        <TableHead>Provider</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Est. Cost</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {deployments.slice(0, 10).map((deployment) => (
                                        <TableRow key={deployment.id}>
                                            <TableCell className="text-sm">
                                                {new Date(deployment.created_at || "").toLocaleDateString()}
                                            </TableCell>
                                            <TableCell className="font-medium">{deployment.name}</TableCell>
                                            <TableCell>{deployment.gpu_type}</TableCell>
                                            <TableCell className="capitalize">{deployment.provider}</TableCell>
                                            <TableCell>
                                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${deployment.status === 'running' ? 'bg-green-500/10 text-green-600' :
                                                    deployment.status === 'stopped' ? 'bg-gray-500/10 text-gray-600' :
                                                        'bg-yellow-500/10 text-yellow-600'
                                                    }`}>
                                                    {deployment.status}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                $0.00
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                            {deployments.length > 10 && (
                                <p className="text-sm text-muted-foreground text-center mt-4">
                                    Showing 10 of {deployments.length} deployments. Export CSV for full history.
                                </p>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
