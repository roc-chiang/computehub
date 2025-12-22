"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { getHeaders } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

interface CreateRuleDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    deploymentId?: number;
    onSuccess?: () => void;
}

export function CreateRuleDialog({ open, onOpenChange, deploymentId, onSuccess }: CreateRuleDialogProps) {
    const [ruleType, setRuleType] = useState("health_check");
    const [isEnabled, setIsEnabled] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { toast } = useToast();

    // Rule-specific config states
    const [healthCheckInterval, setHealthCheckInterval] = useState("30");
    const [autoRestartThreshold, setAutoRestartThreshold] = useState("90");
    const [costLimit, setCostLimit] = useState("100");
    const [priceChangeThreshold, setPriceChangeThreshold] = useState("10");

    const handleSubmit = async () => {
        setIsSubmitting(true);

        try {
            // Build config based on rule type
            let config: any = {};

            switch (ruleType) {
                case "health_check":
                    config = {
                        check_interval_sec: parseInt(healthCheckInterval),
                        timeout_sec: 10,
                    };
                    break;
                case "auto_restart":
                    config = {
                        unhealthy_threshold_sec: parseInt(autoRestartThreshold),
                        max_retries: 3,
                    };
                    break;
                case "cost_limit":
                    config = {
                        max_cost_usd: parseFloat(costLimit),
                        action: "stop",
                    };
                    break;
                case "price_alert":
                    config = {
                        threshold_percentage: parseFloat(priceChangeThreshold),
                        check_interval_min: 5,
                    };
                    break;
            }

            const response = await fetch("/api/v1/automation/rules", {
                method: "POST",
                headers: {
                    ...getHeaders(),
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    deployment_id: deploymentId || null,
                    rule_type: ruleType,
                    config_json: JSON.stringify(config),
                    is_enabled: isEnabled,
                }),
            });

            if (response.ok) {
                toast({
                    title: "Success",
                    description: "Automation rule created successfully",
                });
                onOpenChange(false);
                onSuccess?.();
                resetForm();
            } else {
                const error = await response.json();
                toast({
                    title: "Error",
                    description: error.detail || "Failed to create rule",
                    variant: "destructive",
                });
            }
        } catch (error) {
            console.error("Failed to create rule:", error);
            toast({
                title: "Error",
                description: "Failed to create rule",
                variant: "destructive",
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const resetForm = () => {
        setRuleType("health_check");
        setIsEnabled(true);
        setHealthCheckInterval("30");
        setAutoRestartThreshold("90");
        setCostLimit("100");
        setPriceChangeThreshold("10");
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Create Automation Rule</DialogTitle>
                    <DialogDescription>
                        Configure automated actions for your {deploymentId ? "deployment" : "account"}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {/* Rule Type */}
                    <div className="space-y-2">
                        <Label htmlFor="rule-type">Rule Type</Label>
                        <Select value={ruleType} onValueChange={setRuleType}>
                            <SelectTrigger id="rule-type">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="health_check">🔍 Health Check</SelectItem>
                                <SelectItem value="auto_restart">🔄 Auto Restart</SelectItem>
                                <SelectItem value="cost_limit">💰 Cost Limit</SelectItem>
                                <SelectItem value="price_alert">📊 Price Alert</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Health Check Config */}
                    {ruleType === "health_check" && (
                        <div className="space-y-2">
                            <Label htmlFor="check-interval">Check Interval (seconds)</Label>
                            <Input
                                id="check-interval"
                                type="number"
                                value={healthCheckInterval}
                                onChange={(e) => setHealthCheckInterval(e.target.value)}
                                placeholder="30"
                            />
                            <p className="text-xs text-muted-foreground">
                                How often to check deployment health
                            </p>
                        </div>
                    )}

                    {/* Auto Restart Config */}
                    {ruleType === "auto_restart" && (
                        <div className="space-y-2">
                            <Label htmlFor="restart-threshold">Unhealthy Threshold (seconds)</Label>
                            <Input
                                id="restart-threshold"
                                type="number"
                                value={autoRestartThreshold}
                                onChange={(e) => setAutoRestartThreshold(e.target.value)}
                                placeholder="90"
                            />
                            <p className="text-xs text-muted-foreground">
                                Restart deployment after being unhealthy for this duration
                            </p>
                        </div>
                    )}

                    {/* Cost Limit Config */}
                    {ruleType === "cost_limit" && (
                        <div className="space-y-2">
                            <Label htmlFor="cost-limit">Monthly Cost Limit (USD)</Label>
                            <Input
                                id="cost-limit"
                                type="number"
                                value={costLimit}
                                onChange={(e) => setCostLimit(e.target.value)}
                                placeholder="100.00"
                                step="0.01"
                            />
                            <p className="text-xs text-muted-foreground">
                                Automatically stop deployment when this limit is reached
                            </p>
                        </div>
                    )}

                    {/* Price Alert Config */}
                    {ruleType === "price_alert" && (
                        <div className="space-y-2">
                            <Label htmlFor="price-threshold">Price Change Threshold (%)</Label>
                            <Input
                                id="price-threshold"
                                type="number"
                                value={priceChangeThreshold}
                                onChange={(e) => setPriceChangeThreshold(e.target.value)}
                                placeholder="10"
                            />
                            <p className="text-xs text-muted-foreground">
                                Get notified when GPU price changes by this percentage
                            </p>
                        </div>
                    )}

                    {/* Enable Switch */}
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label htmlFor="enabled">Enable Rule</Label>
                            <p className="text-xs text-muted-foreground">
                                Rule will be active immediately after creation
                            </p>
                        </div>
                        <Switch
                            id="enabled"
                            checked={isEnabled}
                            onCheckedChange={setIsEnabled}
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button onClick={handleSubmit} disabled={isSubmitting}>
                        {isSubmitting ? "Creating..." : "Create Rule"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
