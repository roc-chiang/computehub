"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DollarSign, TrendingUp, AlertTriangle, Settings } from "lucide-react";
import { getHeaders } from "@/lib/api";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface CostMonitorProps {
    deploymentId: number;
}

interface CostSummary {
    current_month_cost: number;
    cost_limit: number | null;
    percentage_used: number | null;
    estimated_month_end: number;
    total_hours: number;
}

export function CostMonitor({ deploymentId }: CostMonitorProps) {
    const [costData, setCostData] = useState<CostSummary | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isEditingLimit, setIsEditingLimit] = useState(false);
    const [newLimit, setNewLimit] = useState("");

    useEffect(() => {
        fetchCostData();
    }, [deploymentId]);

    const fetchCostData = async () => {
        try {
            const response = await fetch(
                `/api/v1/automation/deployments/${deploymentId}/cost`,
                { headers: getHeaders() }
            );

            if (response.ok) {
                const data = await response.json();
                setCostData(data);
                if (data.cost_limit) {
                    setNewLimit(data.cost_limit.toString());
                }
            }
        } catch (error) {
            console.error("Failed to fetch cost data:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const saveCostLimit = async () => {
        // TODO: Implement save cost limit API call
        setIsEditingLimit(false);
    };

    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Cost Monitor</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="animate-pulse h-32 bg-gray-200 rounded"></div>
                </CardContent>
            </Card>
        );
    }

    if (!costData) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Cost Monitor</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">No cost data available</p>
                </CardContent>
            </Card>
        );
    }

    const isNearLimit =
        costData.cost_limit &&
        costData.percentage_used &&
        costData.percentage_used > 80;

    const isOverLimit =
        costData.cost_limit &&
        costData.percentage_used &&
        costData.percentage_used >= 100;

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle>Cost Monitor</CardTitle>
                        <CardDescription>
                            Track GPU usage costs and set spending limits
                        </CardDescription>
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsEditingLimit(!isEditingLimit)}
                    >
                        <Settings className="h-4 w-4 mr-2" />
                        {isEditingLimit ? "Cancel" : "Set Limit"}
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Current Cost */}
                <div className="p-4 border rounded-lg bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                            <DollarSign className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                            <span className="text-sm font-medium">Current Month Cost</span>
                        </div>
                        {isNearLimit && !isOverLimit && (
                            <Badge variant="secondary" className="gap-1">
                                <AlertTriangle className="h-3 w-3" />
                                Near Limit
                            </Badge>
                        )}
                        {isOverLimit && (
                            <Badge variant="destructive" className="gap-1">
                                <AlertTriangle className="h-3 w-3" />
                                Over Limit
                            </Badge>
                        )}
                    </div>
                    <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                        ${costData.current_month_cost.toFixed(2)}
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                        {costData.total_hours.toFixed(2)} GPU hours
                    </div>
                </div>

                {/* Cost Limit Progress */}
                {costData.cost_limit && (
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium">Cost Limit</span>
                            <span className="text-sm text-muted-foreground">
                                ${costData.current_month_cost.toFixed(2)} / ${costData.cost_limit.toFixed(2)}
                            </span>
                        </div>
                        <Progress
                            value={costData.percentage_used || 0}
                            className="h-2"
                        />
                        <div className="flex items-center justify-between mt-1">
                            <span className="text-xs text-muted-foreground">
                                {costData.percentage_used?.toFixed(1)}% used
                            </span>
                            <span className="text-xs text-muted-foreground">
                                ${(costData.cost_limit - costData.current_month_cost).toFixed(2)} remaining
                            </span>
                        </div>
                    </div>
                )}

                {/* Edit Cost Limit */}
                {isEditingLimit && (
                    <div className="p-4 border rounded-lg bg-accent/50">
                        <Label htmlFor="cost-limit" className="text-sm font-medium">
                            Monthly Cost Limit (USD)
                        </Label>
                        <div className="flex gap-2 mt-2">
                            <Input
                                id="cost-limit"
                                type="number"
                                value={newLimit}
                                onChange={(e) => setNewLimit(e.target.value)}
                                placeholder="100.00"
                                className="flex-1"
                            />
                            <Button onClick={saveCostLimit}>Save</Button>
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">
                            Deployment will be automatically stopped when this limit is reached
                        </p>
                    </div>
                )}

                {/* Estimated Month-End Cost */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 border rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                            <TrendingUp className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">Estimated Month-End</span>
                        </div>
                        <div className="text-2xl font-bold">
                            ${costData.estimated_month_end.toFixed(2)}
                        </div>
                    </div>

                    <div className="p-4 border rounded-lg">
                        <div className="text-sm text-muted-foreground mb-2">Average Daily Cost</div>
                        <div className="text-2xl font-bold">
                            ${(costData.current_month_cost / (new Date().getDate() || 1)).toFixed(2)}
                        </div>
                    </div>
                </div>

                {/* Cost Breakdown */}
                <div>
                    <h4 className="text-sm font-semibold mb-3">Cost Breakdown</h4>
                    <div className="space-y-2">
                        <div className="flex items-center justify-between p-3 border rounded-lg">
                            <span className="text-sm">GPU Usage</span>
                            <span className="font-semibold">${costData.current_month_cost.toFixed(2)}</span>
                        </div>
                        <div className="flex items-center justify-between p-3 border rounded-lg">
                            <span className="text-sm">Total Hours</span>
                            <span className="font-semibold">{costData.total_hours.toFixed(2)}h</span>
                        </div>
                        <div className="flex items-center justify-between p-3 border rounded-lg">
                            <span className="text-sm">Average Rate</span>
                            <span className="font-semibold">
                                ${costData.total_hours > 0
                                    ? (costData.current_month_cost / costData.total_hours).toFixed(3)
                                    : "0.00"}/h
                            </span>
                        </div>
                    </div>
                </div>

                {/* Warning Message */}
                {isNearLimit && (
                    <div className="p-4 border border-yellow-500 rounded-lg bg-yellow-50 dark:bg-yellow-950">
                        <div className="flex items-start gap-3">
                            <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                            <div>
                                <h4 className="font-semibold text-yellow-900 dark:text-yellow-100">
                                    Approaching Cost Limit
                                </h4>
                                <p className="text-sm text-yellow-800 dark:text-yellow-200 mt-1">
                                    You've used {costData.percentage_used?.toFixed(1)}% of your monthly budget.
                                    Consider stopping the deployment or increasing your limit.
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
