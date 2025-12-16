import { Button } from "@/components/ui/button";
import {
    Play,
    Square,
    RotateCw,
    Trash2,
    AlertTriangle
} from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { deleteDeployment, stopDeployment, startDeployment, restartDeployment } from "@/lib/api";

interface DeploymentControlsProps {
    deploymentId: number;
    status: string;
}

export function DeploymentControls({ deploymentId, status }: DeploymentControlsProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [stopDialogOpen, setStopDialogOpen] = useState(false);
    const [startDialogOpen, setStartDialogOpen] = useState(false);
    const [restartDialogOpen, setRestartDialogOpen] = useState(false);

    const handleDelete = async () => {
        setLoading(true);
        try {
            await deleteDeployment(deploymentId);
            router.push("/deploy");
        } catch (error) {
            alert("Failed to delete deployment");
            setLoading(false);
            setDeleteDialogOpen(false);
        }
    };

    const handleStop = async () => {
        setActionLoading("stop");
        setStopDialogOpen(false);
        try {
            await stopDeployment(deploymentId);
            // Status will be updated by polling
        } catch (error) {
            console.error("Stop error:", error);
            alert("Failed to stop deployment: " + (error as Error).message);
        } finally {
            setActionLoading(null);
        }
    };

    const handleStart = async () => {
        setActionLoading("start");
        setStartDialogOpen(false);
        try {
            await startDeployment(deploymentId);
            // Status will be updated by polling
        } catch (error) {
            console.error("Start error:", error);
            alert("Failed to start deployment: " + (error as Error).message);
        } finally {
            setActionLoading(null);
        }
    };

    const handleRestart = async () => {
        setActionLoading("restart");
        setRestartDialogOpen(false);
        try {
            await restartDeployment(deploymentId);
            // Status will be updated by polling
        } catch (error) {
            console.error("Restart error:", error);
            alert("Failed to restart deployment: " + (error as Error).message);
        } finally {
            setActionLoading(null);
        }
    };

    const isRunning = status.toLowerCase() === "running";
    const isStopped = status.toLowerCase() === "stopped";

    return (
        <div className="flex gap-2">
            {/* Start Dialog */}
            <Dialog open={startDialogOpen} onOpenChange={setStartDialogOpen}>
                <DialogTrigger asChild>
                    <Button
                        variant="outline"
                        size="sm"
                        disabled={!isStopped || actionLoading !== null}
                    >
                        {actionLoading === "start" ? (
                            <>Starting...</>
                        ) : (
                            <><Play className="h-4 w-4 mr-2" /> Start</>
                        )}
                    </Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Start Instance</DialogTitle>
                        <DialogDescription>
                            Your instance will be started with the same configuration.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                            <span className="text-sm font-medium">GPU Count</span>
                            <span className="text-sm font-semibold">1 GPU</span>
                        </div>
                        <div className="text-sm text-muted-foreground">
                            <p>Estimated cost: <span className="font-semibold text-foreground">$0.34/hr</span></p>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setStartDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleStart}>
                            Start Instance
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Stop Dialog */}
            <Dialog open={stopDialogOpen} onOpenChange={setStopDialogOpen}>
                <DialogTrigger asChild>
                    <Button
                        variant="outline"
                        size="sm"
                        disabled={!isRunning || actionLoading !== null}
                    >
                        {actionLoading === "stop" ? (
                            <>Stopping...</>
                        ) : (
                            <><Square className="h-4 w-4 mr-2" /> Stop</>
                        )}
                    </Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Stop Instance?</DialogTitle>
                        <DialogDescription>
                            Your instance will be stopped and all processes will be terminated.
                            You can start it again later, but availability may be based on the machine.
                        </DialogDescription>
                    </DialogHeader>
                    <Alert variant="destructive">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                            All data that is not currently stored in <code className="bg-muted px-1 py-0.5 rounded">/workspace</code> will be lost!
                        </AlertDescription>
                    </Alert>
                    <div className="text-sm text-muted-foreground">
                        <p>Idle Disk Cost: <span className="font-semibold">$0.006/hr</span> (when stopped)</p>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setStopDialogOpen(false)}>Cancel</Button>
                        <Button variant="destructive" onClick={handleStop}>
                            Stop Instance
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Restart Dialog */}
            <Dialog open={restartDialogOpen} onOpenChange={setRestartDialogOpen}>
                <DialogTrigger asChild>
                    <Button
                        variant="outline"
                        size="sm"
                        disabled={!isRunning || actionLoading !== null}
                    >
                        {actionLoading === "restart" ? (
                            <>Restarting...</>
                        ) : (
                            <><RotateCw className="h-4 w-4 mr-2" /> Restart</>
                        )}
                    </Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Restart Instance?</DialogTitle>
                        <DialogDescription>
                            Your instance will be restarted. All running processes will be terminated.
                        </DialogDescription>
                    </DialogHeader>
                    <Alert>
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                            This will interrupt any running tasks. Make sure to save your work.
                        </AlertDescription>
                    </Alert>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setRestartDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleRestart}>
                            Restart Instance
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Dialog */}
            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogTrigger asChild>
                    <Button variant="destructive" size="sm">
                        <Trash2 className="h-4 w-4 mr-2" /> Delete
                    </Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-destructive">
                            <AlertTriangle className="h-5 w-5" />
                            Delete Deployment?
                        </DialogTitle>
                        <DialogDescription>
                            This action cannot be undone. This will permanently delete your deployment
                            and remove all data associated with it.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
                        <Button variant="destructive" onClick={handleDelete} disabled={loading}>
                            {loading ? "Deleting..." : "Confirm Delete"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
