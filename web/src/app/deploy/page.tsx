"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, RefreshCw, Play, Square, Trash2, CheckSquare } from "lucide-react";
import { getDeployments, deleteDeployment, type Deployment } from "@/lib/api";
import { batchStartDeployments, batchStopDeployments, batchDeleteDeployments } from "@/lib/batch-api";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { DeploymentTable } from "@/components/deploy/deployment-table";
import { EmptyState } from "@/components/deploy/empty-state";
import { DeploymentTableSkeleton } from "@/components/skeletons/deployment-table-skeleton";
import { useToast } from "@/hooks/use-toast";
import { useLicense } from "@/contexts/license-context";
import { ProBadge } from "@/components/ui/pro-badge";
import { UpgradePrompt } from "@/components/ui/upgrade-prompt";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import { useAuth } from "@clerk/nextjs";
import { setAuthToken } from "@/lib/api";

export default function Dashboard() {
    const [deployments, setDeployments] = useState<Deployment[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
    const [batchAction, setBatchAction] = useState<"start" | "stop" | "delete" | null>(null);
    const [batchLoading, setBatchLoading] = useState(false);
    const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);
    const { getToken, isLoaded, isSignedIn, userId } = useAuth();
    const { toast } = useToast();
    const { license } = useLicense();

    console.log(`[Dashboard] Auth State: Loaded=${isLoaded}, SignedIn=${isSignedIn}, User=${userId}`);

    const fetchDeployments = async () => {
        if (!isLoaded || !isSignedIn) {
            console.log("[Dashboard] Not ready to fetch.");
            return;
        }

        try {
            const token = await getToken();
            if (!token) {
                console.log("[Dashboard] No token available");
                setLoading(false);
                return;
            }
            setAuthToken(token);

            const data = await getDeployments();
            // Sort by created_at descending (newest first)
            const sortedData = data.sort((a, b) => {
                const dateA = new Date(a.created_at || 0).getTime();
                const dateB = new Date(b.created_at || 0).getTime();
                return dateB - dateA; // Descending order
            });
            setDeployments(sortedData);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isLoaded) {
            if (isSignedIn) {
                fetchDeployments();
                const interval = setInterval(fetchDeployments, 5000);
                return () => clearInterval(interval);
            } else {
                setLoading(false);
                console.log("[Dashboard] Not signed in, stopping load.");
            }
        }
    }, [isLoaded, isSignedIn]);

    const handleDelete = async (id: number) => {
        if (!confirm("Are you sure you want to delete this deployment?")) return;
        try {
            await deleteDeployment(id);
            fetchDeployments();
        } catch (error) {
            alert("Failed to delete deployment");
        }
    };

    const handleRefresh = async () => {
        setRefreshing(true);
        await fetchDeployments();
        setRefreshing(false);
    };

    // Batch selection handlers
    const toggleSelection = (id: number) => {
        const newSelected = new Set(selectedIds);
        if (newSelected.has(id)) {
            newSelected.delete(id);
        } else {
            newSelected.add(id);
        }
        setSelectedIds(newSelected);
    };

    const toggleSelectAll = () => {
        if (selectedIds.size === deployments.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(deployments.map(d => d.id)));
        }
    };

    // Batch operations
    const handleBatchOperation = async () => {
        if (!batchAction || selectedIds.size === 0) return;

        setBatchLoading(true);
        const ids = Array.from(selectedIds);

        try {
            let result;
            switch (batchAction) {
                case "start":
                    result = await batchStartDeployments(ids);
                    break;
                case "stop":
                    result = await batchStopDeployments(ids);
                    break;
                case "delete":
                    result = await batchDeleteDeployments(ids);
                    break;
            }

            if (result) {
                const successCount = result.success.length;
                const failedCount = result.failed.length;

                toast({
                    title: "Batch Operation Complete",
                    description: `${successCount} succeeded, ${failedCount} failed`,
                    variant: successCount > 0 ? "default" : "destructive",
                });

                // Show detailed errors if any
                if (result.failed.length > 0) {
                    console.error("Failed operations:", result.failed);
                }

                // Refresh deployments
                await fetchDeployments();
                setSelectedIds(new Set());
            }
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Batch operation failed",
                variant: "destructive",
            });
        } finally {
            setBatchLoading(false);
            setBatchAction(null);
        }
    };

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Deployments</h2>
                    <p className="text-text-secondary">Manage your GPU instances</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={handleRefresh}
                        disabled={refreshing}
                    >
                        <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                    </Button>
                    <Link href="/deploy/new">
                        <Button>
                            <Plus className="mr-2 h-4 w-4" /> New Deployment
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Batch Actions Bar */}
            {selectedIds.size > 0 && (
                <div className="p-4 border border-cream-200 rounded-lg bg-cream-100 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <CheckSquare className="h-5 w-5 text-brand" />
                        <span className="font-medium">{selectedIds.size} selected</span>
                    </div>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                                if (!license.isProEnabled) {
                                    setShowUpgradePrompt(true);
                                } else {
                                    setBatchAction("start");
                                }
                            }}
                            disabled={batchLoading}
                            className="relative"
                        >
                            <Play className="h-4 w-4 mr-2" />
                            Start
                            {!license.isProEnabled && <ProBadge className="ml-2" />}
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                                if (!license.isProEnabled) {
                                    setShowUpgradePrompt(true);
                                } else {
                                    setBatchAction("stop");
                                }
                            }}
                            disabled={batchLoading}
                            className="relative"
                        >
                            <Square className="h-4 w-4 mr-2" />
                            Stop
                            {!license.isProEnabled && <ProBadge className="ml-2" />}
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                                if (!license.isProEnabled) {
                                    setShowUpgradePrompt(true);
                                } else {
                                    setBatchAction("delete");
                                }
                            }}
                            disabled={batchLoading}
                            className="relative"
                        >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                            {!license.isProEnabled && <ProBadge className="ml-2" />}
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedIds(new Set())}
                        >
                            Clear
                        </Button>
                    </div>
                </div>
            )}

            {loading ? (
                <DeploymentTableSkeleton />
            ) : deployments.length === 0 ? (
                <EmptyState />
            ) : (
                <>
                    {/* Select All Checkbox - aligned with deployment checkboxes */}
                    <div className="flex items-center gap-4 px-2 py-3 border-b">
                        <div className="flex items-center gap-3">
                            <Checkbox
                                id="select-all"
                                checked={selectedIds.size === deployments.length && deployments.length > 0}
                                onCheckedChange={toggleSelectAll}
                            />
                            <label
                                htmlFor="select-all"
                                className="text-sm font-medium cursor-pointer select-none"
                            >
                                Select All ({deployments.length})
                            </label>
                        </div>
                    </div>

                    {/* Deployment Table with individual checkboxes */}
                    <div className="space-y-0">
                        {deployments.map((deployment) => (
                            <div key={deployment.id} className="flex items-start gap-4 border-b border-cream-200 last:border-b-0 py-2 px-2 hover:bg-cream-50 transition-colors">
                                <div className="pt-4">
                                    <Checkbox
                                        id={`deployment-${deployment.id}`}
                                        checked={selectedIds.has(deployment.id)}
                                        onCheckedChange={() => toggleSelection(deployment.id)}
                                    />
                                </div>
                                <div className="flex-1 min-w-0">
                                    {/* Render single deployment without filter */}
                                    <DeploymentTable data={[deployment]} onDelete={handleDelete} showFilter={false} />
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            )}

            {/* Upgrade Prompt Dialog */}
            {showUpgradePrompt && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="max-w-2xl w-full">
                        <UpgradePrompt
                            feature="Batch Operations"
                            description="Batch operations allow you to start, stop, or delete multiple deployments at once, saving you time and effort."
                        />
                        <div className="mt-4 text-center">
                            <Button
                                variant="ghost"
                                onClick={() => setShowUpgradePrompt(false)}
                                className="text-white hover:text-white/80"
                            >
                                Close
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Batch Action Confirmation Dialog */}
            <AlertDialog open={batchAction !== null} onOpenChange={() => setBatchAction(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            Confirm Batch {batchAction === "start" ? "Start" : batchAction === "stop" ? "Stop" : "Delete"}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to {batchAction} {selectedIds.size} deployment(s)?
                            {batchAction === "delete" && " This action cannot be undone."}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={batchLoading}>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleBatchOperation} disabled={batchLoading}>
                            {batchLoading ? "Processing..." : "Confirm"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
