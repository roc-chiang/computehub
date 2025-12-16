import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Deployment } from "@/lib/api";
import { Box, Network, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

interface DeploymentDetailsProps {
    deployment: Deployment;
}

export function DeploymentDetails({ deployment }: DeploymentDetailsProps) {
    const [copiedId, setCopiedId] = useState(false);

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

    const copyInstanceId = () => {
        if (deployment.instance_id) {
            navigator.clipboard.writeText(deployment.instance_id);
            setCopiedId(true);
            setTimeout(() => setCopiedId(false), 2000);
        }
    };

    return (
        <div className="space-y-6">
            {/* Pod Details */}
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Box className="h-5 w-5 text-primary" />
                        Pod details
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <dl className="grid grid-cols-1 gap-y-3 text-sm">
                        <div className="flex justify-between items-center py-2 border-b border-border/50">
                            <dt className="text-muted-foreground">Instance ID</dt>
                            <dd className="font-mono flex items-center gap-2">
                                {deployment.instance_id || "N/A"}
                                {deployment.instance_id && (
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6"
                                        onClick={copyInstanceId}
                                    >
                                        {copiedId ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                                    </Button>
                                )}
                            </dd>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-border/50">
                            <dt className="text-muted-foreground">Uptime</dt>
                            <dd className="font-medium font-mono">{formatUptime(deployment.uptime_seconds)}</dd>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-border/50">
                            <dt className="text-muted-foreground">GPU</dt>
                            <dd className="font-medium">{deployment.gpu_type} x{deployment.gpu_count}</dd>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-border/50">
                            <dt className="text-muted-foreground">vCPU</dt>
                            <dd className="font-medium">{deployment.vcpu_count || "2"} vCPU</dd>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-border/50">
                            <dt className="text-muted-foreground">Memory</dt>
                            <dd className="font-medium">{deployment.ram_gb || "15"} GB</dd>
                        </div>
                        <div className="flex justify-between items-center py-2">
                            <dt className="text-muted-foreground">Container disk</dt>
                            <dd className="font-medium">{deployment.storage_gb || "20"} GB</dd>
                        </div>
                    </dl>
                </CardContent>
            </Card>

            {/* Container Info */}
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Box className="h-5 w-5 text-primary" />
                        Container
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <div className="text-sm text-muted-foreground mb-1">Image</div>
                        <div className="font-mono text-sm bg-muted p-2 rounded border break-all">
                            {deployment.image}
                        </div>
                    </div>
                    <div>
                        <div className="text-sm text-muted-foreground mb-1">Start command</div>
                        <div className="font-mono text-sm bg-muted p-2 rounded border overflow-x-auto whitespace-pre-wrap text-xs">
                            bash -c 'jupyter lab --ip=0.0.0.0 --port=8888 --no-browser --allow-root --NotebookApp.token="" --NotebookApp.password="" &gt; /workspace/jupyter.log 2&gt;&amp;1 &amp;'
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Network */}
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Network className="h-5 w-5 text-primary" />
                        Network
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <dl className="grid grid-cols-1 gap-y-3 text-sm">
                        <div className="flex justify-between items-center py-2 border-b border-border/50">
                            <dt className="text-muted-foreground">Exposed Ports</dt>
                            <dd className="font-medium">8888/http, 22/tcp</dd>
                        </div>
                        <div className="flex justify-between items-center py-2">
                            <dt className="text-muted-foreground">Location</dt>
                            <dd className="font-medium flex items-center gap-1">
                                🌐 Auto
                            </dd>
                        </div>
                    </dl>
                </CardContent>
            </Card>
        </div>
    );
}
