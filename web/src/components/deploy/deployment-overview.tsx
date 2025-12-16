import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy, Terminal, ExternalLink, Cpu, HardDrive } from "lucide-react";
import { Deployment } from "@/lib/api";

interface DeploymentOverviewProps {
    deployment: Deployment;
}

export function DeploymentOverview({ deployment }: DeploymentOverviewProps) {
    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        // TODO: Show toast success
    };

    return (
        <div className="grid gap-6 md:grid-cols-2">
            {/* Hardware Specs */}
            <Card className="md:col-span-2">
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Cpu className="h-5 w-5 text-primary" />
                        Hardware Specification
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm font-medium text-muted-foreground">GPU Model</label>
                            <div className="font-medium text-lg">{deployment.gpu_type}</div>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-muted-foreground">GPU Count</label>
                            <div className="font-medium text-lg">x{deployment.gpu_count}</div>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-muted-foreground">vCPU</label>
                            <div className="font-medium text-lg">16 vCPU</div>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-muted-foreground">RAM</label>
                            <div className="font-medium text-lg">64 GB</div>
                        </div>
                    </div>

                    <div className="pt-4 border-t">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <HardDrive className="h-4 w-4" />
                            <span>100GB NVMe Storage Mounted</span>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
