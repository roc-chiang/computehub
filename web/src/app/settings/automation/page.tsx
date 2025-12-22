"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Plus, Settings, Trash2, Edit } from "lucide-react";
import { getHeaders } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { CreateRuleDialog } from "@/components/deploy/create-rule-dialog";

interface AutomationRule {
    id: number;
    deployment_id: number | null;
    rule_type: string;
    config_json: string;
    is_enabled: boolean;
    last_triggered_at: string | null;
    trigger_count: number;
    created_at: string;
}

export default function AutomationSettingsPage() {
    const [rules, setRules] = useState<AutomationRule[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showCreateDialog, setShowCreateDialog] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        fetchRules();
    }, []);

    const fetchRules = async () => {
        try {
            const response = await fetch("/api/v1/automation/rules", {
                headers: getHeaders(),
            });

            if (response.ok) {
                const data = await response.json();
                setRules(data);
            }
        } catch (error) {
            console.error("Failed to fetch rules:", error);
            toast({
                title: "Error",
                description: "Failed to load automation rules",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    const toggleRule = async (ruleId: number) => {
        try {
            const response = await fetch(`/api/v1/automation/rules/${ruleId}/toggle`, {
                method: "POST",
                headers: getHeaders(),
            });

            if (response.ok) {
                toast({
                    title: "Success",
                    description: "Rule toggled successfully",
                });
                fetchRules();
            }
        } catch (error) {
            console.error("Failed to toggle rule:", error);
            toast({
                title: "Error",
                description: "Failed to toggle rule",
                variant: "destructive",
            });
        }
    };

    const deleteRule = async (ruleId: number) => {
        if (!confirm("Are you sure you want to delete this rule?")) return;

        try {
            const response = await fetch(`/api/v1/automation/rules/${ruleId}`, {
                method: "DELETE",
                headers: getHeaders(),
            });

            if (response.ok) {
                toast({
                    title: "Success",
                    description: "Rule deleted successfully",
                });
                fetchRules();
            }
        } catch (error) {
            console.error("Failed to delete rule:", error);
            toast({
                title: "Error",
                description: "Failed to delete rule",
                variant: "destructive",
            });
        }
    };

    const getRuleTypeLabel = (type: string) => {
        const labels: Record<string, string> = {
            health_check: "Health Check",
            auto_restart: "Auto Restart",
            cost_limit: "Cost Limit",
            price_alert: "Price Alert",
            failover: "Failover",
        };
        return labels[type] || type;
    };

    const getRuleTypeBadge = (type: string) => {
        const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
            health_check: "default",
            auto_restart: "secondary",
            cost_limit: "destructive",
            price_alert: "outline",
            failover: "default",
        };
        return variants[type] || "default";
    };

    if (isLoading) {
        return (
            <div className="container mx-auto py-8">
                <div className="animate-pulse">
                    <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
                    <div className="h-64 bg-gray-200 rounded"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto py-8">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-3xl font-bold">Automation Settings</h1>
                    <p className="text-muted-foreground mt-2">
                        Configure automated actions for your deployments
                    </p>
                </div>
                <Button onClick={() => setShowCreateDialog(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Rule
                </Button>
            </div>

            {/* Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium">Total Rules</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{rules.length}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            {rules.filter((r) => r.is_enabled).length} active
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium">Total Triggers</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {rules.reduce((sum, r) => sum + r.trigger_count, 0)}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">All time</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium">Last Triggered</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {rules.some((r) => r.last_triggered_at) ? "Active" : "Never"}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            {rules.filter((r) => r.last_triggered_at).length} rules triggered
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Rules List */}
            <Card>
                <CardHeader>
                    <CardTitle>Automation Rules</CardTitle>
                    <CardDescription>
                        Manage your automation rules and their configurations
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {rules.length === 0 ? (
                        <div className="text-center py-12">
                            <Settings className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                            <h3 className="text-lg font-semibold mb-2">No automation rules</h3>
                            <p className="text-muted-foreground mb-4">
                                Create your first automation rule to get started
                            </p>
                            <Button onClick={() => setShowCreateDialog(true)}>
                                <Plus className="h-4 w-4 mr-2" />
                                Create Rule
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {rules.map((rule) => (
                                <div
                                    key={rule.id}
                                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                                >
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <Badge variant={getRuleTypeBadge(rule.rule_type)}>
                                                {getRuleTypeLabel(rule.rule_type)}
                                            </Badge>
                                            {rule.deployment_id && (
                                                <span className="text-sm text-muted-foreground">
                                                    Deployment #{rule.deployment_id}
                                                </span>
                                            )}
                                            {!rule.deployment_id && (
                                                <span className="text-sm text-muted-foreground">
                                                    Global rule
                                                </span>
                                            )}
                                        </div>

                                        <div className="text-sm text-muted-foreground">
                                            Triggered {rule.trigger_count} times
                                            {rule.last_triggered_at && (
                                                <span className="ml-2">
                                                    • Last: {new Date(rule.last_triggered_at).toLocaleString()}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <Switch
                                            checked={rule.is_enabled}
                                            onCheckedChange={() => toggleRule(rule.id)}
                                        />
                                        <Button variant="ghost" size="icon">
                                            <Edit className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => deleteRule(rule.id)}
                                        >
                                            <Trash2 className="h-4 w-4 text-destructive" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Feature Info */}
            <Card className="mt-6">
                <CardHeader>
                    <CardTitle>Available Automation Features</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 border rounded-lg">
                            <h4 className="font-semibold mb-2">🔍 Health Check</h4>
                            <p className="text-sm text-muted-foreground">
                                Monitor deployment health and get notified of issues
                            </p>
                        </div>

                        <div className="p-4 border rounded-lg">
                            <h4 className="font-semibold mb-2">🔄 Auto Restart</h4>
                            <p className="text-sm text-muted-foreground">
                                Automatically restart unhealthy deployments
                            </p>
                        </div>

                        <div className="p-4 border rounded-lg">
                            <h4 className="font-semibold mb-2">💰 Cost Limit</h4>
                            <p className="text-sm text-muted-foreground">
                                Stop deployments when cost limit is reached
                            </p>
                        </div>

                        <div className="p-4 border rounded-lg">
                            <h4 className="font-semibold mb-2">📊 Price Alert</h4>
                            <p className="text-sm text-muted-foreground">
                                Get notified when GPU prices change
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Create Rule Dialog */}
            <CreateRuleDialog
                open={showCreateDialog}
                onOpenChange={setShowCreateDialog}
                onSuccess={fetchRules}
            />
        </div>
    );
}
