import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Deployment } from "@/lib/api";
import { CircularProgress } from "@/components/ui/circular-progress";
import { Progress } from "@/components/ui/progress";
import { HardDrive, Clock, Activity, Cpu, MemoryStick } from "lucide-react";

interface DeploymentTelemetryProps {
    deployment: Deployment;
}

export function DeploymentTelemetry({ deployment }: DeploymentTelemetryProps) {
    // Helper to format uptime
    const formatUptime = (seconds?: number) => {
        if (!seconds) return "0s";
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        if (h > 0) return `${h}h ${m}m ${s}s`;
        if (m > 0) return `${m}m ${s}s`;
        return `${s}s`;
    };

    return (
        <div className="space-y-6">
            {/* Top Row: Disk, Volume, Uptime, Processes */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Disk Usage */}
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                            <HardDrive className="h-4 w-4" />
                            Disk usage
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            <Progress value={0} className="h-2" />
                            <div className="flex justify-between text-xs text-muted-foreground">
                                <span>0 GB (0%)</span>
                                <span>{deployment.storage_gb || 20} GB</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Volume Usage */}
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                            <HardDrive className="h-4 w-4" />
                            Volume usage
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            <Progress value={0} className="h-2" />
                            <div className="flex justify-between text-xs text-muted-foreground">
                                <span>0 GB (0%)</span>
                                <span>{deployment.storage_gb || 20} GB</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Uptime */}
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            Uptime
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold font-mono">
                            {formatUptime(deployment.uptime_seconds)}
                        </div>
                    </CardContent>
                </Card>

                {/* Processes */}
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                            <Activity className="h-4 w-4" />
                            Processes
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold font-mono">
                            -
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Middle Row: CPU & Memory */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* CPU Load */}
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                            <Cpu className="h-4 w-4" />
                            CPU load
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-col items-center justify-center py-4">
                        <CircularProgress
                            value={0}
                            label="Load"
                            color="text-blue-500"
                        />
                        <div className="mt-4 text-sm font-medium text-muted-foreground">
                            {deployment.vcpu_count || 2} vCPU
                        </div>
                    </CardContent>
                </Card>

                {/* Memory */}
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                            <MemoryStick className="h-4 w-4" />
                            Memory
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-col items-center justify-center py-4">
                        <CircularProgress
                            value={0}
                            label="Used"
                            color="text-blue-500"
                        />
                        <div className="mt-4 text-sm font-medium text-muted-foreground">
                            0 GB / {deployment.ram_gb || 15} GB
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Bottom Row: GPU */}
            <Card>
                <CardHeader className="pb-2 border-b">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <Activity className="h-4 w-4 text-primary" />
                        {deployment.gpu_type}
                        <span className="text-muted-foreground text-xs font-normal ml-auto">GPU 0</span>
                    </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="flex flex-col items-center">
                            <div className="mb-2 text-sm font-medium text-muted-foreground">VRAM</div>
                            <CircularProgress
                                value={deployment.gpu_memory_utilization || 0}
                                label="VRAM"
                                color="text-purple-500"
                            />
                            <div className="mt-2 text-xs text-muted-foreground">
                                {deployment.gpu_memory_utilization || 0}% Used
                            </div>
                        </div>
                        <div className="flex flex-col items-center">
                            <div className="mb-2 text-sm font-medium text-muted-foreground">Utilization</div>
                            <CircularProgress
                                value={deployment.gpu_utilization || 0}
                                label="Util"
                                color="text-purple-500"
                            />
                            <div className="mt-2 text-xs text-muted-foreground">
                                {deployment.gpu_utilization || 0}% Load
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
