"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Play, Trash2, Edit, Power, Zap, AlertCircle } from "lucide-react";

interface AutomationRule {
    id: number;
    name: string;
    description: string | null;
    is_enabled: boolean;
    trigger_type: string;
    trigger_config: any;
    action_type: string;
    action_config: any;
    target_type: string;
    target_id: number | null;
    last_triggered_at: string | null;
    trigger_count: number;
    created_at: string;
}

interface Deployment {
    id: number;
    name: string;
}

const TRIGGER_TYPES = [
    { value: "cost_threshold", label: "Cost Threshold", description: "Trigger when cost exceeds a threshold" },
    { value: "price_change", label: "Price Change", description: "Trigger when GPU price changes" },
    { value: "health_check_failed", label: "Health Check Failed", description: "Trigger after consecutive health check failures" },
    { value: "time_based", label: "Time Based", description: "Trigger at specific times" }
];

const ACTION_TYPES = [
    { value: "shutdown", label: "Shutdown", description: "Stop the deployment" },
    { value: "restart", label: "Restart", description: "Restart the deployment" },
    { value: "migrate", label: "Migrate", description: "Migrate to another provider" },
    { value: "notify", label: "Notify", description: "Send a notification" }
];

export function RuleBuilder() {
    const [rules, setRules] = useState<AutomationRule[]>([]);
    const [deployments, setDeployments] = useState<Deployment[]>([]);
    const [loading, setLoading] = useState(true);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingRule, setEditingRule] = useState<AutomationRule | null>(null);

    // Form state
    const [ruleName, setRuleName] = useState("");
    const [ruleDescription, setRuleDescription] = useState("");
    const [triggerType, setTriggerType] = useState("cost_threshold");
    const [actionType, setActionType] = useState("notify");
    const [targetType, setTargetType] = useState("deployment");
    const [targetId, setTargetId] = useState<number | null>(null);
    const [isEnabled, setIsEnabled] = useState(true);

    // Trigger config
    const [costThreshold, setCostThreshold] = useState("10");
    const [costPeriod, setCostPeriod] = useState("daily");
    const [consecutiveFailures, setConsecutiveFailures] = useState("3");
    const [targetTime, setTargetTime] = useState("00:00");

    // Action config
    const [notifyTitle, setNotifyTitle] = useState("");
    const [notifyMessage, setNotifyMessage] = useState("");

    useEffect(() => {
        fetchRules();
        fetchDeployments();
    }, []);

    const fetchRules = async () => {
        try {
            const response = await fetch("/api/v1/rules", {
                headers: {
                    "Authorization": `Bearer ${localStorage.getItem("token")}`
                }
            });
            if (response.ok) {
                const data = await response.json();
                setRules(data);
            }
        } catch (error) {
            console.error("Failed to fetch rules:", error);
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

    const buildTriggerConfig = () => {
        switch (triggerType) {
            case "cost_threshold":
                return {
                    threshold: parseFloat(costThreshold),
                    period: costPeriod
                };
            case "health_check_failed":
                return {
                    consecutive_failures: parseInt(consecutiveFailures)
                };
            case "time_based":
                return {
                    schedule_type: "daily",
                    target_time: targetTime
                };
            default:
                return {};
        }
    };

    const buildActionConfig = () => {
        switch (actionType) {
            case "notify":
                return {
                    title: notifyTitle || `Rule: ${ruleName}`,
                    message: notifyMessage || "Rule triggered"
                };
            default:
                return {};
        }
    };

    const handleCreateOrUpdate = async () => {
        const data = {
            name: ruleName,
            description: ruleDescription || null,
            trigger_type: triggerType,
            trigger_config: buildTriggerConfig(),
            action_type: actionType,
            action_config: buildActionConfig(),
            target_type: targetType,
            target_id: targetType === "deployment" ? targetId : null,
            is_enabled: isEnabled
        };

        try {
            const url = editingRule
                ? `/api/v1/rules/${editingRule.id}`
                : "/api/v1/rules";

            const method = editingRule ? "PUT" : "POST";

            const response = await fetch(url, {
                method,
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${localStorage.getItem("token")}`
                },
                body: JSON.stringify(data)
            });

            if (response.ok) {
                fetchRules();
                setDialogOpen(false);
                resetForm();
            }
        } catch (error) {
            console.error("Failed to save rule:", error);
        }
    };

    const handleToggle = async (ruleId: number) => {
        try {
            const response = await fetch(`/api/v1/rules/${ruleId}/toggle`, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${localStorage.getItem("token")}`
                }
            });

            if (response.ok) {
                fetchRules();
            }
        } catch (error) {
            console.error("Failed to toggle rule:", error);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm("Are you sure you want to delete this rule?")) return;

        try {
            const response = await fetch(`/api/v1/rules/${id}`, {
                method: "DELETE",
                headers: {
                    "Authorization": `Bearer ${localStorage.getItem("token")}`
                }
            });

            if (response.ok) {
                fetchRules();
            }
        } catch (error) {
            console.error("Failed to delete rule:", error);
        }
    };

    const handleTest = async (ruleId: number) => {
        try {
            const response = await fetch(`/api/v1/rules/${ruleId}/test`, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${localStorage.getItem("token")}`
                }
            });

            if (response.ok) {
                const result = await response.json();
                alert(result.should_trigger
                    ? `Rule would trigger: ${result.trigger_reason}`
                    : "Rule would not trigger with current conditions"
                );
            }
        } catch (error) {
            console.error("Failed to test rule:", error);
        }
    };

    const resetForm = () => {
        setEditingRule(null);
        setRuleName("");
        setRuleDescription("");
        setTriggerType("cost_threshold");
        setActionType("notify");
        setTargetType("deployment");
        setTargetId(null);
        setIsEnabled(true);
        setCostThreshold("10");
        setCostPeriod("daily");
        setConsecutiveFailures("3");
        setTargetTime("00:00");
        setNotifyTitle("");
        setNotifyMessage("");
    };

    const getTriggerLabel = (type: string) => {
        return TRIGGER_TYPES.find(t => t.value === type)?.label || type;
    };

    const getActionLabel = (type: string) => {
        return ACTION_TYPES.find(a => a.value === type)?.label || type;
    };

    const getDeploymentName = (deploymentId: number | null) => {
        if (!deploymentId) return "All Deployments";
        const deployment = deployments.find(d => d.id === deploymentId);
        return deployment?.name || `Deployment ${deploymentId}`;
    };

    if (loading) {
        return <div className="text-center py-8">Loading rules...</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h3 className="text-lg font-semibold">Automation Rules</h3>
                    <p className="text-sm text-muted-foreground">
                        Create custom automation rules with triggers and actions
                    </p>
                </div>
                <Dialog open={dialogOpen} onOpenChange={(open) => {
                    setDialogOpen(open);
                    if (!open) resetForm();
                }}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="h-4 w-4 mr-2" />
                            Create Rule
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>{editingRule ? "Edit" : "Create"} Automation Rule</DialogTitle>
                            <DialogDescription>
                                Configure triggers and actions for automated deployment management
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label>Rule Name</Label>
                                <Input
                                    value={ruleName}
                                    onChange={(e) => setRuleName(e.target.value)}
                                    placeholder="e.g., Auto-shutdown on high cost"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>Description (Optional)</Label>
                                <Textarea
                                    value={ruleDescription}
                                    onChange={(e) => setRuleDescription(e.target.value)}
                                    placeholder="Describe what this rule does..."
                                    rows={2}
                                />
                            </div>

                            <div className="border-t pt-4">
                                <h4 className="font-semibold mb-3">Trigger Condition</h4>
                                <div className="space-y-3">
                                    <div className="space-y-2">
                                        <Label>Trigger Type</Label>
                                        <Select value={triggerType} onValueChange={setTriggerType}>
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {TRIGGER_TYPES.map((type) => (
                                                    <SelectItem key={type.value} value={type.value}>
                                                        {type.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {triggerType === "cost_threshold" && (
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="space-y-2">
                                                <Label>Threshold (USD)</Label>
                                                <Input
                                                    type="number"
                                                    value={costThreshold}
                                                    onChange={(e) => setCostThreshold(e.target.value)}
                                                    step="0.01"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Period</Label>
                                                <Select value={costPeriod} onValueChange={setCostPeriod}>
                                                    <SelectTrigger>
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="daily">Daily</SelectItem>
                                                        <SelectItem value="weekly">Weekly</SelectItem>
                                                        <SelectItem value="monthly">Monthly</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>
                                    )}

                                    {triggerType === "health_check_failed" && (
                                        <div className="space-y-2">
                                            <Label>Consecutive Failures</Label>
                                            <Input
                                                type="number"
                                                value={consecutiveFailures}
                                                onChange={(e) => setConsecutiveFailures(e.target.value)}
                                                min="1"
                                            />
                                        </div>
                                    )}

                                    {triggerType === "time_based" && (
                                        <div className="space-y-2">
                                            <Label>Time (HH:MM)</Label>
                                            <Input
                                                type="time"
                                                value={targetTime}
                                                onChange={(e) => setTargetTime(e.target.value)}
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="border-t pt-4">
                                <h4 className="font-semibold mb-3">Action</h4>
                                <div className="space-y-3">
                                    <div className="space-y-2">
                                        <Label>Action Type</Label>
                                        <Select value={actionType} onValueChange={setActionType}>
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {ACTION_TYPES.map((type) => (
                                                    <SelectItem key={type.value} value={type.value}>
                                                        {type.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {actionType === "notify" && (
                                        <>
                                            <div className="space-y-2">
                                                <Label>Notification Title</Label>
                                                <Input
                                                    value={notifyTitle}
                                                    onChange={(e) => setNotifyTitle(e.target.value)}
                                                    placeholder="Alert title"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Message</Label>
                                                <Textarea
                                                    value={notifyMessage}
                                                    onChange={(e) => setNotifyMessage(e.target.value)}
                                                    placeholder="Notification message..."
                                                    rows={2}
                                                />
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>

                            <div className="border-t pt-4">
                                <h4 className="font-semibold mb-3">Target</h4>
                                <div className="space-y-3">
                                    <div className="space-y-2">
                                        <Label>Target Type</Label>
                                        <Select value={targetType} onValueChange={setTargetType}>
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="deployment">Specific Deployment</SelectItem>
                                                <SelectItem value="all_deployments">All Deployments</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {targetType === "deployment" && (
                                        <div className="space-y-2">
                                            <Label>Deployment</Label>
                                            <Select
                                                value={targetId?.toString()}
                                                onValueChange={(value) => setTargetId(parseInt(value))}
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
                                    )}
                                </div>
                            </div>

                            <div className="flex items-center justify-between border-t pt-4">
                                <div>
                                    <Label>Enable Rule</Label>
                                    <p className="text-xs text-muted-foreground">
                                        Rule will be active immediately
                                    </p>
                                </div>
                                <Switch checked={isEnabled} onCheckedChange={setIsEnabled} />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setDialogOpen(false)}>
                                Cancel
                            </Button>
                            <Button onClick={handleCreateOrUpdate}>
                                {editingRule ? "Update" : "Create"} Rule
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            {rules.length === 0 ? (
                <Card>
                    <CardContent className="py-8 text-center text-muted-foreground">
                        No automation rules configured. Click "Create Rule" to get started.
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-4">
                    {rules.map((rule) => (
                        <Card key={rule.id} className={!rule.is_enabled ? "opacity-60" : ""}>
                            <CardHeader>
                                <div className="flex justify-between items-start">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <CardTitle className="text-base">{rule.name}</CardTitle>
                                            {rule.is_enabled ? (
                                                <Badge variant="default" className="bg-green-500">Active</Badge>
                                            ) : (
                                                <Badge variant="secondary">Disabled</Badge>
                                            )}
                                        </div>
                                        {rule.description && (
                                            <CardDescription>{rule.description}</CardDescription>
                                        )}
                                    </div>
                                    <div className="flex gap-2">
                                        <Button variant="ghost" size="icon" onClick={() => handleTest(rule.id)} title="Test Rule">
                                            <Play className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleToggle(rule.id)}
                                            title={rule.is_enabled ? "Disable" : "Enable"}
                                        >
                                            <Power className={`h-4 w-4 ${rule.is_enabled ? "text-green-500" : "text-gray-400"}`} />
                                        </Button>
                                        <Button variant="ghost" size="icon" onClick={() => handleDelete(rule.id)}>
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <span className="text-muted-foreground">Trigger:</span>
                                        <div className="font-medium flex items-center gap-2 mt-1">
                                            <Zap className="h-4 w-4" />
                                            {getTriggerLabel(rule.trigger_type)}
                                        </div>
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground">Action:</span>
                                        <div className="font-medium flex items-center gap-2 mt-1">
                                            <AlertCircle className="h-4 w-4" />
                                            {getActionLabel(rule.action_type)}
                                        </div>
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground">Target:</span>
                                        <div className="font-medium mt-1">
                                            {getDeploymentName(rule.target_id)}
                                        </div>
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground">Triggered:</span>
                                        <div className="font-medium mt-1">
                                            {rule.trigger_count} times
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
