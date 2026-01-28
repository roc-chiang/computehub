"use client";

import { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Activity, Cpu, HardDrive, Wifi, Zap, AlertTriangle, CheckCircle } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { API_BASE_URL } from "@/lib/api";
import { useAuth } from "@clerk/nextjs";

interface Metrics {
    timestamp: string;
    gpu_temperature?: number;
    gpu_utilization?: number;
    gpu_memory_used?: number;
    gpu_memory_total?: number;
    gpu_power_draw?: number;
    cpu_percent?: number;
    memory_used?: number;
    memory_total?: number;
    disk_used?: number;
    disk_total?: number;
    network_rx_bytes?: number;
    network_tx_bytes?: number;
}

export default function MonitoringPage() {
    const params = useParams();
    const deploymentId = params.id as string;
    const { getToken } = useAuth();

    const [metrics, setMetrics] = useState<Metrics | null>(null);
    const [history, setHistory] = useState<Metrics[]>([]);
    const [connected, setConnected] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const wsRef = useRef<WebSocket | null>(null);

    useEffect(() => {
        const connectWs = async () => {
            const token = await getToken();
            const wsUrlBase = API_BASE_URL.replace(/^http/, 'ws');
            const wsUrl = `${wsUrlBase}/deployments/${deploymentId}/metrics/stream`;

            const ws = new WebSocket(wsUrl);

            ws.onopen = () => {
                console.log("✅ WebSocket connected");
                setConnected(true);
                setError(null);
            };

            ws.onmessage = (event) => {
                const data = JSON.parse(event.data);

                if (data.type === "metrics") {
                    setMetrics(data.data);
                    setHistory(prev => {
                        const newHistory = [...prev, data.data];
                        return newHistory.slice(-30);
                    });
                } else if (data.type === "error") {
                    setError(data.message);
                }
            };

            ws.onerror = (error) => {
                console.error("❌ WebSocket error:", error);
                setError("Connection error");
                setConnected(false);
            };

            ws.onclose = () => {
                console.log("🔌 WebSocket disconnected");
                setConnected(false);
            };

            wsRef.current = ws;
        };

        connectWs();

        return () => {
            if (wsRef.current) {
                wsRef.current.close();
            }
        };
    }, [deploymentId, getToken]);

    if (error) {
        return (
            <div className="container mx-auto py-8">
                <Card className="border-destructive">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-destructive">
                            <AlertTriangle className="h-5 w-5" />
                            Connection Error
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p>{error}</p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="container mx-auto py-8 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Real-time Monitoring</h1>
                    <p className="text-muted-foreground">Deployment #{deploymentId}</p>
                </div>
                <Badge variant={connected ? "default" : "secondary"}>
                    {connected ? (
                        <>
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Connected
                        </>
                    ) : (
                        <>
                            <Activity className="h-3 w-3 mr-1 animate-pulse" />
                            Connecting...
                        </>
                    )}
                </Badge>
            </div>

            {/* Metrics Grid */}
            <div className="grid md:grid-cols-2 gap-6">
                {/* GPU Metrics */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Zap className="h-5 w-5 text-yellow-500" />
                            GPU Metrics
                        </CardTitle>
                        <CardDescription>NVIDIA GPU monitoring</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {/* Temperature */}
                        <div>
                            <div className="flex justify-between mb-2">
                                <span className="text-sm font-medium">Temperature</span>
                                <span className="text-sm font-bold">
                                    {metrics?.gpu_temperature?.toFixed(1) || '--'}°C
                                </span>
                            </div>
                            <Progress
                                value={metrics?.gpu_temperature || 0}
                                max={100}
                                className={
                                    (metrics?.gpu_temperature || 0) > 80
                                        ? "bg-red-200"
                                        : "bg-green-200"
                                }
                            />
                        </div>

                        {/* Utilization */}
                        <div>
                            <div className="flex justify-between mb-2">
                                <span className="text-sm font-medium">Utilization</span>
                                <span className="text-sm font-bold">
                                    {metrics?.gpu_utilization?.toFixed(1) || '--'}%
                                </span>
                            </div>
                            <Progress value={metrics?.gpu_utilization || 0} />
                        </div>

                        {/* Memory */}
                        <div>
                            <div className="flex justify-between mb-2">
                                <span className="text-sm font-medium">Memory</span>
                                <span className="text-sm font-bold">
                                    {metrics?.gpu_memory_used || '--'} / {metrics?.gpu_memory_total || '--'} MB
                                </span>
                            </div>
                            <Progress
                                value={
                                    metrics?.gpu_memory_used && metrics?.gpu_memory_total
                                        ? (metrics.gpu_memory_used / metrics.gpu_memory_total) * 100
                                        : 0
                                }
                            />
                        </div>

                        {/* Power */}
                        {metrics?.gpu_power_draw && (
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Power Draw</span>
                                <span className="font-medium">{metrics.gpu_power_draw.toFixed(1)} W</span>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* System Metrics */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Cpu className="h-5 w-5 text-blue-500" />
                            System Metrics
                        </CardTitle>
                        <CardDescription>CPU, Memory, Disk</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {/* CPU */}
                        <div>
                            <div className="flex justify-between mb-2">
                                <span className="text-sm font-medium">CPU Usage</span>
                                <span className="text-sm font-bold">
                                    {metrics?.cpu_percent?.toFixed(1) || '--'}%
                                </span>
                            </div>
                            <Progress value={metrics?.cpu_percent || 0} />
                        </div>

                        {/* Memory */}
                        <div>
                            <div className="flex justify-between mb-2">
                                <span className="text-sm font-medium">Memory</span>
                                <span className="text-sm font-bold">
                                    {metrics?.memory_used || '--'} / {metrics?.memory_total || '--'} MB
                                </span>
                            </div>
                            <Progress
                                value={
                                    metrics?.memory_used && metrics?.memory_total
                                        ? (metrics.memory_used / metrics.memory_total) * 100
                                        : 0
                                }
                            />
                        </div>

                        {/* Disk */}
                        <div>
                            <div className="flex justify-between mb-2">
                                <span className="text-sm font-medium">Disk</span>
                                <span className="text-sm font-bold">
                                    {metrics?.disk_used || '--'} / {metrics?.disk_total || '--'} GB
                                </span>
                            </div>
                            <Progress
                                value={
                                    metrics?.disk_used && metrics?.disk_total
                                        ? (metrics.disk_used / metrics.disk_total) * 100
                                        : 0
                                }
                            />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Charts */}
            <Card>
                <CardHeader>
                    <CardTitle>Performance History</CardTitle>
                    <CardDescription>Last 60 seconds</CardDescription>
                </CardHeader>
                <CardContent>
                    <Tabs defaultValue="gpu">
                        <TabsList>
                            <TabsTrigger value="gpu">GPU</TabsTrigger>
                            <TabsTrigger value="cpu">CPU</TabsTrigger>
                            <TabsTrigger value="memory">Memory</TabsTrigger>
                        </TabsList>

                        <TabsContent value="gpu" className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={history}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis
                                        dataKey="timestamp"
                                        tickFormatter={(value) => new Date(value).toLocaleTimeString()}
                                    />
                                    <YAxis domain={[0, 100]} />
                                    <Tooltip
                                        labelFormatter={(value) => new Date(value).toLocaleTimeString()}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="gpu_utilization"
                                        stroke="#eab308"
                                        name="GPU Utilization (%)"
                                        dot={false}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="gpu_temperature"
                                        stroke="#ef4444"
                                        name="Temperature (°C)"
                                        dot={false}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </TabsContent>

                        <TabsContent value="cpu" className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={history}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis
                                        dataKey="timestamp"
                                        tickFormatter={(value) => new Date(value).toLocaleTimeString()}
                                    />
                                    <YAxis domain={[0, 100]} />
                                    <Tooltip
                                        labelFormatter={(value) => new Date(value).toLocaleTimeString()}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="cpu_percent"
                                        stroke="#3b82f6"
                                        name="CPU Usage (%)"
                                        dot={false}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </TabsContent>

                        <TabsContent value="memory" className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={history}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis
                                        dataKey="timestamp"
                                        tickFormatter={(value) => new Date(value).toLocaleTimeString()}
                                    />
                                    <YAxis />
                                    <Tooltip
                                        labelFormatter={(value) => new Date(value).toLocaleTimeString()}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="memory_used"
                                        stroke="#8b5cf6"
                                        name="Memory Used (MB)"
                                        dot={false}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>
        </div>
    );
}
