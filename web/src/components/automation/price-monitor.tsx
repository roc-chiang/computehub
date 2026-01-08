"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TrendingDown, TrendingUp, Minus, DollarSign, ArrowRight } from "lucide-react";
import { getHeaders } from "@/lib/api";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface PriceMonitorProps {
    deploymentId: number;
}

interface PriceHistoryData {
    price_per_hour: number;
    provider: string;
    gpu_type: string;
    recorded_at: string;
}

interface PriceTrend {
    min_price: number;
    max_price: number;
    avg_price: number;
    current_price: number;
    trend_direction: "up" | "down" | "stable";
    data_points: number;
}

interface Alternative {
    provider: string;
    price_per_hour: number;
    savings_percent: number;
    savings_per_hour: number;
}

export function PriceMonitor({ deploymentId }: PriceMonitorProps) {
    const [priceHistory, setPriceHistory] = useState<PriceHistoryData[]>([]);
    const [priceTrend, setPriceTrend] = useState<PriceTrend | null>(null);
    const [alternatives, setAlternatives] = useState<Alternative[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [hours, setHours] = useState(168); // 7 days

    useEffect(() => {
        fetchPriceData();
        const interval = setInterval(fetchPriceData, 3600000); // Refresh every hour
        return () => clearInterval(interval);
    }, [deploymentId, hours]);

    const fetchPriceData = async () => {
        try {
            // Fetch price history
            const historyResponse = await fetch(
                `/api/v1/advanced-automation/price-history?deployment_id=${deploymentId}&hours=${hours}`,
                { headers: getHeaders() }
            );

            if (historyResponse.ok) {
                const historyData = await historyResponse.json();
                setPriceHistory(historyData.history || []);
            }

            // Fetch price trends
            const trendResponse = await fetch(
                `/api/v1/advanced-automation/price-trends?deployment_id=${deploymentId}&hours=${hours}`,
                { headers: getHeaders() }
            );

            if (trendResponse.ok) {
                const trendData = await trendResponse.json();
                setPriceTrend(trendData);
            }

            // Fetch cheaper alternatives
            const altResponse = await fetch(
                `/api/v1/advanced-automation/cheaper-alternatives?deployment_id=${deploymentId}`,
                { headers: getHeaders() }
            );

            if (altResponse.ok) {
                const altData = await altResponse.json();
                setAlternatives(altData.alternatives || []);
            }
        } catch (error) {
            console.error("Failed to fetch price data:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const getTrendIcon = (direction: string) => {
        switch (direction) {
            case "up":
                return <TrendingUp className="h-5 w-5 text-red-500" />;
            case "down":
                return <TrendingDown className="h-5 w-5 text-green-500" />;
            default:
                return <Minus className="h-5 w-5 text-gray-500" />;
        }
    };

    const getTrendBadge = (direction: string) => {
        const variants: Record<string, "default" | "secondary" | "destructive"> = {
            up: "destructive",
            down: "default",
            stable: "secondary",
        };
        return variants[direction] || "secondary";
    };

    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Price Monitoring</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="animate-pulse h-64 bg-gray-200 rounded"></div>
                </CardContent>
            </Card>
        );
    }

    // Prepare chart data
    const chartData = priceHistory.map((record, index) => ({
        index: index + 1,
        price: record.price_per_hour,
        time: new Date(record.recorded_at).toLocaleDateString(),
    }));

    return (
        <div className="space-y-6">
            {/* Price Trend Overview */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>Price Monitoring</CardTitle>
                            <CardDescription>
                                Track GPU price changes and find better deals
                            </CardDescription>
                        </div>
                        <div className="flex gap-2">
                            <Button
                                variant={hours === 24 ? "default" : "outline"}
                                size="sm"
                                onClick={() => setHours(24)}
                            >
                                24h
                            </Button>
                            <Button
                                variant={hours === 168 ? "default" : "outline"}
                                size="sm"
                                onClick={() => setHours(168)}
                            >
                                7d
                            </Button>
                            <Button
                                variant={hours === 720 ? "default" : "outline"}
                                size="sm"
                                onClick={() => setHours(720)}
                            >
                                30d
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Current Price & Trend */}
                    {priceTrend && (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="p-4 border rounded-lg">
                                <div className="text-sm text-muted-foreground mb-1">Current Price</div>
                                <div className="text-2xl font-bold">
                                    ${priceTrend.current_price?.toFixed(3)}/hr
                                </div>
                            </div>
                            <div className="p-4 border rounded-lg">
                                <div className="text-sm text-muted-foreground mb-1">Average Price</div>
                                <div className="text-2xl font-bold">
                                    ${priceTrend.avg_price?.toFixed(3)}/hr
                                </div>
                            </div>
                            <div className="p-4 border rounded-lg">
                                <div className="text-sm text-muted-foreground mb-1">Min / Max</div>
                                <div className="text-lg font-bold">
                                    ${priceTrend.min_price?.toFixed(3)} / ${priceTrend.max_price?.toFixed(3)}
                                </div>
                            </div>
                            <div className="p-4 border rounded-lg">
                                <div className="text-sm text-muted-foreground mb-1">Trend</div>
                                <div className="flex items-center gap-2">
                                    {getTrendIcon(priceTrend.trend_direction)}
                                    <Badge variant={getTrendBadge(priceTrend.trend_direction)}>
                                        {priceTrend.trend_direction.toUpperCase()}
                                    </Badge>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Price History Chart */}
                    {chartData.length > 0 ? (
                        <div>
                            <h4 className="text-sm font-semibold mb-3">Price History</h4>
                            <ResponsiveContainer width="100%" height={250}>
                                <LineChart data={chartData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="time" />
                                    <YAxis />
                                    <Tooltip />
                                    <Line
                                        type="monotone"
                                        dataKey="price"
                                        stroke="#10b981"
                                        strokeWidth={2}
                                        dot={{ fill: "#10b981" }}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <div className="text-center py-8 text-muted-foreground">
                            No price history available yet
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Cheaper Alternatives */}
            {alternatives.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Cheaper Alternatives</CardTitle>
                        <CardDescription>
                            Save money by migrating to these providers
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {alternatives.map((alt, index) => (
                                <div
                                    key={index}
                                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                                >
                                    <div className="flex items-center gap-4">
                                        <div>
                                            <div className="font-semibold">{alt.provider}</div>
                                            <div className="text-sm text-muted-foreground">
                                                ${alt.price_per_hour.toFixed(3)}/hr
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="text-right">
                                            <div className="text-green-600 font-semibold">
                                                Save {alt.savings_percent.toFixed(1)}%
                                            </div>
                                            <div className="text-sm text-muted-foreground">
                                                ${alt.savings_per_hour.toFixed(3)}/hr
                                            </div>
                                        </div>
                                        <Button size="sm" variant="outline">
                                            <ArrowRight className="h-4 w-4 mr-1" />
                                            Migrate
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
