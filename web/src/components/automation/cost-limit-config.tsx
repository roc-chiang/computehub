"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { DollarSign, AlertTriangle, Power, Plus, Trash2, Edit } from "lucide-react";

interface CostLimit {
    id: number;
    deployment_id: number;
    limit_amount: number;
    limit_period: string;
    current_cost: number;
    auto_shutdown_enabled: boolean;
    notify_at_percentage: number;
    limit_reached: boolean;
    last_notified_at: string | null;
    shutdown_at: string | null;
    created_at: string;
}

interface Deployment {
    id: number;
    name: string;
}

export function CostLimitConfig() {
    const [costLimits, setCostLimits] = useState<CostLimit[]>([]);
    const [deployments, setDeployments] = useState<Deployment[]>([]);
    const [loading, setLoading] = useState(true);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingLimit, setEditingLimit] = useState<CostLimit | null>(null);

    // Form state
    const [selectedDeployment, setSelectedDeployment] = useState<number | null>(null);
    const [limitAmount, setLimitAmount] = useState("10");
    const [limitPeriod, setLimitPeriod] = useState("daily");
    const [autoShutdown, setAutoShutdown] = useState(true);
    const [notifyPercentage, setNotifyPercentage] = useState(80);

    useEffect(() => {
        fetchCostLimits();
        fetchDeployments();
    }, []);

    const fetchCostLimits = async () => {
        try {
            const response = await fetch("/api/v1/cost-limits", {
                headers: {
                    "Authorization": `Bearer ${localStorage.getItem("token")}`
                }
            });
            if (response.ok) {
                const data = await response.json();
                setCostLimits(data);
            }
        } catch (error) {
            console.error("Failed to fetch cost limits:", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchDeployments = async () => {
        try {
            const response = await fetch("/api/v1/deployments/", {
                headers: {
                    "Authorization": `Bearer ${localStorage.getItem("token")}`
                }
            });
            if (response.ok) {
                const data = await response.json();
                setDeployments(data);
            }
        } catch (error) {
            console.error("Failed to fetch deployments:", error);
        }
    };

    const handleCreateOrUpdate = async () => {
        const data = {
            deployment_id: selectedDeployment,
            limit_amount: parseFloat(limitAmount),
            limit_period: limitPeriod,
            auto_shutdown_enabled: autoShutdown,
            notify_at_percentage: notifyPercentage
        };

        try {
            const url = editingLimit
                ? `/api/v1/cost-limits/${editingLimit.id}`
                : "/api/v1/cost-limits";

            const method = editingLimit ? "PUT" : "POST";

            const response = await fetch(url, {
                method,
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${localStorage.getItem("token")}`
                },
                body: JSON.stringify(data)
            });

            if (response.ok) {
                fetchCostLimits();
                setDialogOpen(false);
                resetForm();
            }
        } catch (error) {
            console.error("Failed to save cost limit:", error);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm("Are you sure you want to delete this cost limit?")) return;

        try {
            const response = await fetch(`/api/v1/cost-limits/${id}`, {
                method: "DELETE",
                headers: {
                    "Authorization": `Bearer ${localStorage.getItem("token")}`
                }
            });

            if (response.ok) {
                fetchCostLimits();
            }
        } catch (error) {
            console.error("Failed to delete cost limit:", error);
        }
    };

    const handleEdit = (limit: CostLimit) => {
        setEditingLimit(limit);
        setSelectedDeployment(limit.deployment_id);
        setLimitAmount(limit.limit_amount.toString());
        setLimitPeriod(limit.limit_period);
        setAutoShutdown(limit.auto_shutdown_enabled);
        setNotifyPercentage(limit.notify_at_percentage);
        setDialogOpen(true);
    };

    const resetForm = () => {
        setEditingLimit(null);
        setSelectedDeployment(null);
        setLimitAmount("10");
        setLimitPeriod("daily");
        setAutoShutdown(true);
        setNotifyPercentage(80);
    };

    const getDeploymentName = (deploymentId: number) => {
        const deployment = deployments.find(d => d.id === deploymentId);
        return deployment?.name || `Deployment ${deploymentId}`;
    };

    const calculatePercentage = (current: number, limit: number) => {
        return limit > 0 ? (current / limit) * 100 : 0;
    };

    if (loading) {
        return <div className="text-center py-8">Loading cost limits...</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h3 className="text-lg font-semibold">Cost Limit Management</h3>
                    <p className="text-sm text-muted-foreground">
                        Set cost limits to automatically shutdown deployments when budget is exceeded
                    </p>
                </div>
                <Dialog open={dialogOpen} onOpenChange={(open) => {
                    setDialogOpen(open);
                    if (!open) resetForm();
                }}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="h-4 w-4 mr-2" />
                            Add Cost Limit
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[500px]">
                        <DialogHeader>
                            <DialogTitle>{editingLimit ? "Edit" : "Create"} Cost Limit</DialogTitle>
                            <DialogDescription>
                                Configure automatic shutdown when cost exceeds your budget
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label>Deployment</Label>
                                <Select
                                    value={selectedDeployment?.toString()}
                                    onValueChange={(value) => setSelectedDeployment(parseInt(value))}
                                    disabled={!!editingLimit}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select deployment" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {deployments.map((deployment) => (
                                            <SelectItem key={deployment.id} value={deployment.id.toString()}>
                                                {deployment.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label>Cost Limit (USD)</Label>
                                <Input
                                    type="number"
                                    value={limitAmount}
                                    onChange={(e) => setLimitAmount(e.target.value)}
                                    placeholder="10.00"
                                    step="0.01"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>Period</Label>
                                <Select value={limitPeriod} onValueChange={setLimitPeriod}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="daily">Daily</SelectItem>
                                        <SelectItem value="weekly">Weekly</SelectItem>
                                        <SelectItem value="monthly">Monthly</SelectItem>
                                        <SelectItem value="total">Total (Lifetime)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label>Alert Threshold: {notifyPercentage}%</Label>
                                <Slider
                                    value={[notifyPercentage]}
                                    onValueChange={(value) => setNotifyPercentage(value[0])}
                                    min={50}
                                    max={95}
                                    step={5}
                                />
                                <p className="text-xs text-muted-foreground">
                                    You'll be notified when cost reaches this percentage
                                </p>
                            </div>

                            <div className="flex items-center justify-between">
                                <div>
                                    <Label>Auto-Shutdown</Label>
                                    <p className="text-xs text-muted-foreground">
                                        Automatically stop deployment when limit is exceeded
                                    </p>
                                </div>
                                <Switch checked={autoShutdown} onCheckedChange={setAutoShutdown} />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setDialogOpen(false)}>
                                Cancel
                            </Button>
                            <Button onClick={handleCreateOrUpdate}>
                                {editingLimit ? "Update" : "Create"}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            {costLimits.length === 0 ? (
                <Card>
                    <CardContent className="py-8 text-center text-muted-foreground">
                        No cost limits configured. Click "Add Cost Limit" to create one.
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-4">
                    {costLimits.map((limit) => {
                        const percentage = calculatePercentage(limit.current_cost, limit.limit_amount);
                        const isNearLimit = percentage >= limit.notify_at_percentage;
                        const isOverLimit = limit.limit_reached;

                        return (
                            <Card key={limit.id} className={isOverLimit ? "border-red-500" : isNearLimit ? "border-yellow-500" : ""}>
                                <CardHeader>
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <CardTitle className="text-base">
                                                {getDeploymentName(limit.deployment_id)}
                                            </CardTitle>
                                            <CardDescription>
                                                {limit.limit_period.charAt(0).toUpperCase() + limit.limit_period.slice(1)} limit
                                            </CardDescription>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button variant="ghost" size="icon" onClick={() => handleEdit(limit)}>
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" onClick={() => handleDelete(limit.id)}>
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-muted-foreground">Current Cost</span>
                                            <span className="font-semibold">
                                                ${limit.current_cost.toFixed(2)} / ${limit.limit_amount.toFixed(2)}
                                            </span>
                                        </div>
                                        <Progress value={percentage} className={percentage >= 100 ? "bg-red-100" : percentage >= limit.notify_at_percentage ? "bg-yellow-100" : ""} />
                                        <div className="flex justify-between text-xs text-muted-foreground">
                                            <span>{percentage.toFixed(1)}% used</span>
                                            <span>Alert at {limit.notify_at_percentage}%</span>
                                        </div>
                                    </div>

                                    {isOverLimit && (
                                        <Alert variant="destructive">
                                            <AlertTriangle className="h-4 w-4" />
                                            <AlertDescription>
                                                Cost limit exceeded! Deployment was automatically shut down.
                                            </AlertDescription>
                                        </Alert>
                                    )}

                                    {isNearLimit && !isOverLimit && (
                                        <Alert>
                                            <AlertTriangle className="h-4 w-4" />
                                            <AlertDescription>
                                                Approaching cost limit. Auto-shutdown will trigger at 100%.
                                            </AlertDescription>
                                        </Alert>
                                    )}

                                    <div className="flex items-center gap-4 text-sm">
                                        <div className="flex items-center gap-2">
                                            <Power className={`h-4 w-4 ${limit.auto_shutdown_enabled ? "text-green-500" : "text-gray-400"}`} />
                                            <span className="text-muted-foreground">
                                                Auto-shutdown: {limit.auto_shutdown_enabled ? "Enabled" : "Disabled"}
                                            </span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
