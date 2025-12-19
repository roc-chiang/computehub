"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { getHeaders } from "@/lib/api";

interface MetricsChartProps {
    deploymentId: number;
}

interface MetricData {
    timestamp: string;
    gpu_utilization: number;
    gpu_memory_utilization: number;
    cpu_utilization: number;
    ram_utilization: number;
}

export function MetricsChart({ deploymentId }: MetricsChartProps) {
    const [metrics, setMetrics] = useState<MetricData[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;

        const fetchMetrics = async () => {
            try {
                const response = await fetch(
                    `/api/v1/deployments/${deploymentId}/metrics`,
                    { headers: getHeaders() }
                );

                if (!response.ok) {
                    console.error(`Failed to fetch metrics: HTTP ${response.status}`);
                    return;
                }

                const data = await response.json();

                if (isMounted) {
                    // Add new metric to history (keep last 20 points)
                    setMetrics(prev => {
                        const newMetrics = [...prev, {
                            timestamp: new Date(data.timestamp).toLocaleTimeString(),
                            gpu_utilization: Math.round(data.gpu_utilization || 0),
                            gpu_memory_utilization: Math.round(data.gpu_memory_utilization || 0),
                            cpu_utilization: Math.round(data.cpu_utilization || 0),
                            ram_utilization: Math.round(data.ram_utilization || 0),
                        }];
                        return newMetrics.slice(-20); // Keep last 20 data points
                    });
                    setIsLoading(false);
                }
            } catch (error) {
                console.error("[MetricsChart] Failed to fetch metrics:", error);
            }
        };

        // Initial fetch
        fetchMetrics();

        // Poll every 5 seconds
        const interval = setInterval(fetchMetrics, 5000);

        return () => {
            isMounted = false;
            clearInterval(interval);
        };
    }, [deploymentId]);

    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Performance Metrics</CardTitle>
                    <CardDescription>Loading metrics...</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="h-64 flex items-center justify-center">
                        <div className="animate-pulse text-muted-foreground">
                            Loading performance data...
                        </div>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Performance Metrics</CardTitle>
                <CardDescription>
                    Real-time GPU, CPU, and memory usage
                </CardDescription>
            </CardHeader>
            <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={metrics}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                            dataKey="timestamp"
                            tick={{ fontSize: 12 }}
                        />
                        <YAxis
                            domain={[0, 100]}
                            tick={{ fontSize: 12 }}
                            label={{ value: 'Usage (%)', angle: -90, position: 'insideLeft' }}
                        />
                        <Tooltip />
                        <Legend />
                        <Line
                            type="monotone"
                            dataKey="gpu_utilization"
                            stroke="#8b5cf6"
                            name="GPU"
                            strokeWidth={2}
                        />
                        <Line
                            type="monotone"
                            dataKey="gpu_memory_utilization"
                            stroke="#ec4899"
                            name="GPU Memory"
                            strokeWidth={2}
                        />
                        <Line
                            type="monotone"
                            dataKey="cpu_utilization"
                            stroke="#3b82f6"
                            name="CPU"
                            strokeWidth={2}
                        />
                        <Line
                            type="monotone"
                            dataKey="ram_utilization"
                            stroke="#10b981"
                            name="RAM"
                            strokeWidth={2}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}
