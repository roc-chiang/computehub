import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertTriangle, StopCircle } from "lucide-react";
import { stopDeployment } from "@/lib/api";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface CostAlertProps {
    deploymentId: number;
    gpuUtilization: number;
    status: string;
}

export function CostAlert({ deploymentId, gpuUtilization, status }: CostAlertProps) {
    const [stopping, setStopping] = useState(false);
    const { toast } = useToast();

    // Only show alert if running and utilization is low (e.g., < 5%)
    // In a real app, we might want to check if this persists for some time, 
    // but for now immediate feedback is fine for demo.
    if (status.toUpperCase() !== "RUNNING" || gpuUtilization >= 5) {
        return null;
    }

    const handleStop = async () => {
        setStopping(true);
        try {
            await stopDeployment(deploymentId);
            toast({
                title: "Stopping instance",
                description: "Instance stop requested to save costs.",
            });
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to stop instance.",
                variant: "destructive",
            });
        } finally {
            setStopping(false);
        }
    };

    return (
        <Alert variant="destructive" className="mb-6 border-yellow-600/50 bg-yellow-950/20 text-yellow-200">
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
            <AlertTitle className="text-yellow-500 flex items-center gap-2">
                High Cost Warning
            </AlertTitle>
            <AlertDescription className="flex items-center justify-between mt-2">
                <span className="text-yellow-200/80">
                    GPU utilization is very low ({gpuUtilization}%). You are being charged for this idle instance.
                </span>
                <Button
                    variant="outline"
                    size="sm"
                    className="border-yellow-600/50 text-yellow-500 hover:bg-yellow-950/50 hover:text-yellow-400"
                    onClick={handleStop}
                    disabled={stopping}
                >
                    <StopCircle className="h-3 w-3 mr-2" />
                    {stopping ? "Stopping..." : "Stop Instance"}
                </Button>
            </AlertDescription>
        </Alert>
    );
}
