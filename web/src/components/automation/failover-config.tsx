"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Shield, Plus, Trash2, CheckCircle2 } from "lucide-react";
import { getHeaders } from "@/lib/api";

interface FailoverConfigProps {
    userId: number;
}

interface FailoverConfig {
    id: number;
    deployment_id: number;
    primary_provider: string;
    backup_providers: string[];
    health_check_interval: number;
    failover_threshold: number;
    auto_failover_enabled: boolean;
    last_failover_at: string | null;
    failover_count: number;
    created_at: string;
}

export function FailoverConfigComponent({ userId }: FailoverConfigProps) {
    const [configs, setConfigs] = useState<FailoverConfig[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [selectedDeployment, setSelectedDeployment] = useState<string>("");
    const [backupProviders, setBackupProviders] = useState<string[]>(["RunPod"]);
    const [healthCheckInterval, setHealthCheckInterval] = useState(300);
    const [failoverThreshold, setFailoverThreshold] = useState(3);
    const [autoFailoverEnabled, setAutoFailoverEnabled] = useState(true);

    useEffect(() => {
        fetchConfigs();
    }, [userId]);

    const fetchConfigs = async () => {
        try {
            const response = await fetch(
                `/api/v1/advanced-automation/failover-configs`,
                { headers: getHeaders() }
            );

            if (response.ok) {
                const data = await response.json();
                setConfigs(data.configs || []);
            }
        } catch (error) {
            console.error("Failed to fetch failover configs:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const createConfig = async () => {
        if (!selectedDeployment || backupProviders.length === 0) return;

        try {
            const response = await fetch(
                `/api/v1/advanced-automation/failover-configs`,
                {
                    method: "POST",
                    headers: getHeaders(),
                    body: JSON.stringify({
                        deployment_id: parseInt(selectedDeployment),
                        primary_provider: "Vast.ai", // This should come from deployment
                        backup_providers: backupProviders,
                        health_check_interval: healthCheckInterval,
                        failover_threshold: failoverThreshold,
                        auto_failover_enabled: autoFailoverEnabled,
                    }),
                }
            );

            if (response.ok) {
                await fetchConfigs();
                setIsDialogOpen(false);
                resetForm();
            }
        } catch (error) {
            console.error("Failed to create failover config:", error);
        }
    };

    const deleteConfig = async (configId: number) => {
        try {
            const response = await fetch(
                `/api/v1/advanced-automation/failover-configs/${configId}`,
                {
                    method: "DELETE",
                    headers: getHeaders(),
                }
            );

            if (response.ok) {
                await fetchConfigs();
            }
        } catch (error) {
            console.error("Failed to delete failover config:", error);
        }
    };

    const toggleAutoFailover = async (configId: number, enabled: boolean) => {
        try {
            const response = await fetch(
                `/api/v1/advanced-automation/failover-configs/${configId}`,
                {
                    method: "PUT",
                    headers: getHeaders(),
                    body: JSON.stringify({
                        auto_failover_enabled: enabled,
                    }),
                }
            );

            if (response.ok) {
                await fetchConfigs();
            }
        } catch (error) {
            console.error("Failed to toggle auto-failover:", error);
        }
    };

    const resetForm = () => {
        setSelectedDeployment("");
        setBackupProviders(["RunPod"]);
        setHealthCheckInterval(300);
        setFailoverThreshold(3);
        setAutoFailoverEnabled(true);
    };

    const addBackupProvider = () => {
        setBackupProviders([...backupProviders, ""]);
    };

    const removeBackupProvider = (index: number) => {
        setBackupProviders(backupProviders.filter((_, i) => i !== index));
    };

    const updateBackupProvider = (index: number, value: string) => {
        const updated = [...backupProviders];
        updated[index] = value;
        setBackupProviders(updated);
    };

    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Failover Configuration</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="animate-pulse h-64 bg-gray-200 rounded"></div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle>Failover Configuration</CardTitle>
                        <CardDescription>
                            Configure automatic failover to backup providers
                        </CardDescription>
                    </div>
                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                            <Button>
                                <Shield className="h-4 w-4 mr-2" />
                                Add Failover
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                            <DialogHeader>
                                <DialogTitle>Configure Failover</DialogTitle>
                                <DialogDescription>
                                    Set up automatic failover for a deployment
                                </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <Label>Deployment</Label>
                                    <Input
                                        type="number"
                                        placeholder="Deployment ID"
                                        value={selectedDeployment}
                                        onChange={(e) => setSelectedDeployment(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Backup Providers (Priority Order)</Label>
                                    {backupProviders.map((provider, index) => (
                                        <div key={index} className="flex gap-2">
                                            <Input
                                                placeholder={`Backup Provider ${index + 1}`}
                                                value={provider}
                                                onChange={(e) => updateBackupProvider(index, e.target.value)}
                                            />
                                            <Button
                                                variant="outline"
                                                size="icon"
                                                onClick={() => removeBackupProvider(index)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    ))}
                                    <Button variant="outline" size="sm" onClick={addBackupProvider}>
                                        <Plus className="h-4 w-4 mr-2" />
                                        Add Provider
                                    </Button>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Health Check Interval (seconds)</Label>
                                        <Input
                                            type="number"
                                            value={healthCheckInterval}
                                            onChange={(e) => setHealthCheckInterval(parseInt(e.target.value))}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Failover Threshold (failed checks)</Label>
                                        <Input
                                            type="number"
                                            value={failoverThreshold}
                                            onChange={(e) => setFailoverThreshold(parseInt(e.target.value))}
                                        />
                                    </div>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Switch
                                        checked={autoFailoverEnabled}
                                        onCheckedChange={setAutoFailoverEnabled}
                                    />
                                    <Label>Enable Auto-Failover</Label>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                                    Cancel
                                </Button>
                                <Button onClick={createConfig}>
                                    Create Configuration
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </CardHeader>
            <CardContent>
                {configs.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                        No failover configurations yet. Add one above.
                    </div>
                ) : (
                    <div className="space-y-4">
                        {configs.map((config) => (
                            <div
                                key={config.id}
                                className="p-4 border rounded-lg space-y-3"
                            >
                                <div className="flex items-center justify-between">
                                    <div>
                                        <div className="font-semibold">
                                            Deployment #{config.deployment_id}
                                        </div>
                                        <div className="text-sm text-muted-foreground">
                                            Primary: {config.primary_provider}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="flex items-center gap-2">
                                            <Switch
                                                checked={config.auto_failover_enabled}
                                                onCheckedChange={(checked) => toggleAutoFailover(config.id, checked)}
                                            />
                                            <span className="text-sm">Auto-Failover</span>
                                        </div>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => deleteConfig(config.id)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <span className="text-muted-foreground">Backup Providers:</span>
                                        <div className="flex gap-1 mt-1">
                                            {config.backup_providers.map((provider, i) => (
                                                <Badge key={i} variant="secondary">
                                                    {i + 1}. {provider}
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground">Settings:</span>
                                        <div className="mt-1">
                                            Check every {config.health_check_interval}s, fail after {config.failover_threshold} checks
                                        </div>
                                    </div>
                                </div>
                                {config.failover_count > 0 && (
                                    <div className="flex items-center gap-2 text-sm">
                                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                                        <span>
                                            Failover triggered {config.failover_count} time(s)
                                            {config.last_failover_at && ` - Last: ${new Date(config.last_failover_at).toLocaleString()}`}
                                        </span>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
