"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowRight, CheckCircle2, XCircle, Clock, RotateCcw, Loader2 } from "lucide-react";
import { getHeaders } from "@/lib/api";

interface MigrationManagerProps {
    userId: number;
}

interface Migration {
    id: number;
    source_deployment_id: number;
    target_deployment_id: number | null;
    target_provider: string;
    status: string;
    started_at: string | null;
    completed_at: string | null;
    error_message: string | null;
    created_at: string;
}

export function MigrationManager({ userId }: MigrationManagerProps) {
    const [migrations, setMigrations] = useState<Migration[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [selectedDeployment, setSelectedDeployment] = useState<string>("");
    const [targetProvider, setTargetProvider] = useState<string>("");
    const [isMigrating, setIsMigrating] = useState(false);

    useEffect(() => {
        fetchMigrations();
        const interval = setInterval(fetchMigrations, 30000); // Refresh every 30 seconds
        return () => clearInterval(interval);
    }, [userId]);

    const fetchMigrations = async () => {
        try {
            const response = await fetch(
                `/api/v1/advanced-automation/migrations?limit=50`,
                { headers: getHeaders() }
            );

            if (response.ok) {
                const data = await response.json();
                setMigrations(data.migrations || []);
            }
        } catch (error) {
            console.error("Failed to fetch migrations:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const startMigration = async () => {
        if (!selectedDeployment || !targetProvider) return;

        setIsMigrating(true);
        try {
            const response = await fetch(
                `/api/v1/advanced-automation/migrations`,
                {
                    method: "POST",
                    headers: getHeaders(),
                    body: JSON.stringify({
                        source_deployment_id: parseInt(selectedDeployment),
                        target_provider: targetProvider,
                        target_config: {
                            gpu_type: "RTX 4090", // This should come from deployment
                            image: "ubuntu:22.04"
                        }
                    }),
                }
            );

            if (response.ok) {
                await fetchMigrations();
                setIsDialogOpen(false);
                setSelectedDeployment("");
                setTargetProvider("");
            }
        } catch (error) {
            console.error("Failed to start migration:", error);
        } finally {
            setIsMigrating(false);
        }
    };

    const rollbackMigration = async (migrationId: number) => {
        try {
            const response = await fetch(
                `/api/v1/advanced-automation/migrations/${migrationId}/rollback`,
                {
                    method: "POST",
                    headers: getHeaders(),
                }
            );

            if (response.ok) {
                await fetchMigrations();
            }
        } catch (error) {
            console.error("Failed to rollback migration:", error);
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case "completed":
                return <CheckCircle2 className="h-5 w-5 text-green-500" />;
            case "failed":
            case "rolled_back":
                return <XCircle className="h-5 w-5 text-red-500" />;
            case "in_progress":
                return <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />;
            default:
                return <Clock className="h-5 w-5 text-yellow-500" />;
        }
    };

    const getStatusBadge = (status: string) => {
        const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
            completed: "default",
            failed: "destructive",
            in_progress: "secondary",
            pending: "outline",
            rolled_back: "destructive",
        };
        return variants[status] || "outline";
    };

    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Migration Manager</CardTitle>
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
                        <CardTitle>Migration Manager</CardTitle>
                        <CardDescription>
                            Migrate deployments across providers
                        </CardDescription>
                    </div>
                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                            <Button>
                                <ArrowRight className="h-4 w-4 mr-2" />
                                Start Migration
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Start Migration</DialogTitle>
                                <DialogDescription>
                                    Migrate a deployment to a different provider
                                </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Source Deployment</label>
                                    <Select value={selectedDeployment} onValueChange={setSelectedDeployment}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select deployment" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="1">Deployment #1</SelectItem>
                                            <SelectItem value="2">Deployment #2</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Target Provider</label>
                                    <Select value={targetProvider} onValueChange={setTargetProvider}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select provider" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="RunPod">RunPod</SelectItem>
                                            <SelectItem value="Vast.ai">Vast.ai</SelectItem>
                                            <SelectItem value="Lambda">Lambda</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                                    Cancel
                                </Button>
                                <Button onClick={startMigration} disabled={isMigrating || !selectedDeployment || !targetProvider}>
                                    {isMigrating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                                    Start Migration
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </CardHeader>
            <CardContent>
                {migrations.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                        No migrations yet. Start your first migration above.
                    </div>
                ) : (
                    <div className="space-y-3">
                        {migrations.map((migration) => (
                            <div
                                key={migration.id}
                                className="flex items-center justify-between p-4 border rounded-lg"
                            >
                                <div className="flex items-center gap-4">
                                    {getStatusIcon(migration.status)}
                                    <div>
                                        <div className="font-semibold">
                                            Deployment #{migration.source_deployment_id} → {migration.target_provider}
                                        </div>
                                        <div className="text-sm text-muted-foreground">
                                            {migration.started_at
                                                ? `Started: ${new Date(migration.started_at).toLocaleString()}`
                                                : `Created: ${new Date(migration.created_at).toLocaleString()}`}
                                        </div>
                                        {migration.error_message && (
                                            <div className="text-sm text-red-500 mt-1">
                                                Error: {migration.error_message}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Badge variant={getStatusBadge(migration.status)}>
                                        {migration.status.replace("_", " ").toUpperCase()}
                                    </Badge>
                                    {migration.status === "failed" && (
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => rollbackMigration(migration.id)}
                                        >
                                            <RotateCcw className="h-4 w-4 mr-1" />
                                            Rollback
                                        </Button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
