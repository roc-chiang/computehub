"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { ArrowLeft, Play, Square, RotateCw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    getDeployment,
    startDeployment,
    stopDeployment,
    restartDeployment,
    deleteDeployment,
    type Deployment
} from "@/lib/api";
import { useAuth } from "@clerk/nextjs";
import { setAuthToken } from "@/lib/api";
import { DeploymentOverview } from "@/components/deploy/deployment-overview";
import { ConnectionGuide } from "@/components/deploy/connection-guide";
import { AuditLog } from "@/components/deploy/audit-log";
import { UsageStatsCard } from "@/components/deploy/usage-stats-card";
import {
    MetricsChartSkeleton,
    LogViewerSkeleton,
    FileBrowserSkeleton
} from "@/components/skeletons/details-skeletons";
import { useErrorHandler } from "@/lib/error-handler";

// Lazy load heavy components
const MetricsChart = dynamic(
    () => import("@/components/deploy/metrics-chart").then(mod => ({ default: mod.MetricsChart })),
    {
        loading: () => <MetricsChartSkeleton />,
        ssr: false
    }
);

const LogViewer = dynamic(
    () => import("@/components/deploy/log-viewer").then(mod => ({ default: mod.LogViewer })),
    {
        loading: () => <LogViewerSkeleton />,
        ssr: false
    }
);

const FileBrowser = dynamic(
    () => import("@/components/deploy/file-browser").then(mod => ({ default: mod.FileBrowser })),
    {
        loading: () => <FileBrowserSkeleton />,
        ssr: false
    }
);

export default function DeploymentDetailsPage() {
    const params = useParams();
    const router = useRouter();
    const { getToken, isLoaded, isSignedIn } = useAuth();
    const { handleError } = useErrorHandler();

    const [deployment, setDeployment] = useState<Deployment | null>(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    const fetchDeployment = async () => {
        if (!isLoaded || !isSignedIn) return;

        try {
            const token = await getToken();
            setAuthToken(token);
            const data = await getDeployment(Number(params.id));
            setDeployment(data);
        } catch (error) {
            handleError(error, "Failed to load deployment");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isLoaded && isSignedIn) {
            fetchDeployment();
            const interval = setInterval(fetchDeployment, 5000);
            return () => clearInterval(interval);
        }
    }, [isLoaded, isSignedIn, params.id]);

    const handleAction = async (action: string, fn: () => Promise<void>) => {
        setActionLoading(action);
        try {
            await fn();
            await fetchDeployment();
        } catch (error) {
            handleError(error, `Failed to ${action} deployment`);
        } finally {
            setActionLoading(null);
        }
    };

    const handleDelete = async () => {
        if (!confirm("Are you sure you want to delete this deployment?")) return;

        try {
            await deleteDeployment(Number(params.id));
            router.push("/deploy");
        } catch (error) {
            handleError(error, "Failed to delete deployment");
        }
    };

    if (loading || !deployment) {
        return (
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <Button variant="ghost" onClick={() => router.push("/deploy")}>
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Dashboard
                    </Button>
                </div>
                <div className="animate-pulse space-y-4">
                    <div className="h-8 w-64 bg-muted rounded" />
                    <div className="h-32 bg-muted rounded" />
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <Button variant="ghost" onClick={() => router.push("/deploy")}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Dashboard
                </Button>
                <div className="flex gap-2">
                    {deployment.status === "running" && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleAction("stop", () => stopDeployment(deployment.id))}
                            disabled={actionLoading !== null}
                        >
                            <Square className="mr-2 h-4 w-4" />
                            {actionLoading === "stop" ? "Stopping..." : "Stop"}
                        </Button>
                    )}
                    {deployment.status === "stopped" && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleAction("start", () => startDeployment(deployment.id))}
                            disabled={actionLoading !== null}
                        >
                            <Play className="mr-2 h-4 w-4" />
                            {actionLoading === "start" ? "Starting..." : "Start"}
                        </Button>
                    )}
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleAction("restart", () => restartDeployment(deployment.id))}
                        disabled={actionLoading !== null}
                    >
                        <RotateCw className="mr-2 h-4 w-4" />
                        {actionLoading === "restart" ? "Restarting..." : "Restart"}
                    </Button>
                    <Button
                        variant="destructive"
                        size="sm"
                        onClick={handleDelete}
                    >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                    </Button>
                </div>
            </div>

            {/* Overview */}
            <DeploymentOverview deployment={deployment} />

            {/* Usage Stats */}
            <UsageStatsCard deploymentId={deployment.id} />

            {/* Connection Guide */}
            {deployment.status === "running" && (
                <ConnectionGuide deployment={deployment} />
            )}

            {/* Tabs */}
            <Tabs defaultValue="metrics" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="metrics">Metrics</TabsTrigger>
                    <TabsTrigger value="logs">Logs</TabsTrigger>
                    <TabsTrigger value="files">Files</TabsTrigger>
                    <TabsTrigger value="audit">Audit Log</TabsTrigger>
                </TabsList>

                <TabsContent value="metrics" className="space-y-4">
                    <MetricsChart deploymentId={deployment.id} />
                </TabsContent>

                <TabsContent value="logs" className="space-y-4">
                    <LogViewer deploymentId={deployment.id} />
                </TabsContent>

                <TabsContent value="files" className="space-y-4">
                    <FileBrowser deploymentId={deployment.id} />
                </TabsContent>

                <TabsContent value="audit" className="space-y-4">
                    <AuditLog deploymentId={deployment.id} />
                </TabsContent>
            </Tabs>
        </div>
    );
}
