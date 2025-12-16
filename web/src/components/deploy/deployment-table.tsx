"use client";

import { useState } from "react";
import Link from "next/link";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    MoreHorizontal,
    Search,
    Terminal,
    Trash2,
    ExternalLink,
    Copy,
    Play,
    Square,
    RotateCw,
    AlertTriangle
} from "lucide-react";
import { Deployment, stopDeployment, startDeployment, restartDeployment } from "@/lib/api";
import { StatusBadge } from "./deployment-status";
import { Badge } from "@/components/ui/badge";

interface DeploymentTableProps {
    data: Deployment[];
    onDelete: (id: number) => void;
    showFilter?: boolean;
}

export function DeploymentTable({ data, onDelete, showFilter = true }: DeploymentTableProps) {
    const [filter, setFilter] = useState("");
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    // Dialog states
    const [selectedDeployment, setSelectedDeployment] = useState<Deployment | null>(null);
    const [startDialogOpen, setStartDialogOpen] = useState(false);
    const [stopDialogOpen, setStopDialogOpen] = useState(false);
    const [restartDialogOpen, setRestartDialogOpen] = useState(false);

    const filteredData = data.filter((item) =>
        item.name.toLowerCase().includes(filter.toLowerCase())
    );

    const handleStart = async () => {
        if (!selectedDeployment) return;
        setActionLoading("start");
        setStartDialogOpen(false);
        try {
            await startDeployment(selectedDeployment.id);
        } catch (error) {
            console.error("Start error:", error);
            alert("Failed to start deployment: " + (error as Error).message);
        } finally {
            setActionLoading(null);
            setSelectedDeployment(null);
        }
    };

    const handleStop = async () => {
        if (!selectedDeployment) return;
        setActionLoading("stop");
        setStopDialogOpen(false);
        try {
            await stopDeployment(selectedDeployment.id);
        } catch (error) {
            console.error("Stop error:", error);
            alert("Failed to stop deployment: " + (error as Error).message);
        } finally {
            setActionLoading(null);
            setSelectedDeployment(null);
        }
    };

    const handleRestart = async () => {
        if (!selectedDeployment) return;
        setActionLoading("restart");
        setRestartDialogOpen(false);
        try {
            await restartDeployment(selectedDeployment.id);
        } catch (error) {
            console.error("Restart error:", error);
            alert("Failed to restart deployment: " + (error as Error).message);
        } finally {
            setActionLoading(null);
            setSelectedDeployment(null);
        }
    };

    const openActionDialog = (deployment: Deployment, action: "start" | "stop" | "restart") => {
        setSelectedDeployment(deployment);
        if (action === "start") setStartDialogOpen(true);
        if (action === "stop") setStopDialogOpen(true);
        if (action === "restart") setRestartDialogOpen(true);
    };

    return (
        <div className="space-y-4">
            {showFilter && (
                <div className="flex items-center justify-between">
                    <div className="relative w-72">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Filter deployments..."
                            value={filter}
                            onChange={(e) => setFilter(e.target.value)}
                            className="pl-8"
                        />
                    </div>
                </div>
            )}

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Provider</TableHead>
                            <TableHead>GPU</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Created At</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredData.map((deploy) => {
                            const isRunning = deploy.status.toLowerCase() === "running";
                            const isStopped = deploy.status.toLowerCase() === "stopped";

                            return (
                                <TableRow key={deploy.id}>
                                    <TableCell className="font-medium">
                                        <Link href={`/deploy/${deploy.id}`} className="flex flex-col hover:underline">
                                            <span>{deploy.name}</span>
                                            <span className="text-xs text-muted-foreground font-mono">ID: {deploy.id}</span>
                                        </Link>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className="uppercase text-xs">
                                            {deploy.provider}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <Badge variant="secondary" className="font-mono text-xs">
                                                {deploy.gpu_type}
                                            </Badge>
                                            <span className="text-xs text-muted-foreground">x{deploy.gpu_count}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <StatusBadge status={deploy.status} />
                                    </TableCell>
                                    <TableCell className="text-muted-foreground text-sm">
                                        {new Date(deploy.created_at).toLocaleDateString()}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" className="h-8 w-8 p-0">
                                                    <span className="sr-only">Open menu</span>
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                <DropdownMenuItem onClick={() => navigator.clipboard.writeText(deploy.id.toString())}>
                                                    <Copy className="mr-2 h-4 w-4" /> Copy ID
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />

                                                {/* Control Actions */}
                                                <DropdownMenuItem
                                                    disabled={!isStopped}
                                                    onClick={() => openActionDialog(deploy, "start")}
                                                >
                                                    <Play className="mr-2 h-4 w-4" /> Start Instance
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    disabled={!isRunning}
                                                    onClick={() => openActionDialog(deploy, "stop")}
                                                >
                                                    <Square className="mr-2 h-4 w-4" /> Stop Instance
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    disabled={!isRunning}
                                                    onClick={() => openActionDialog(deploy, "restart")}
                                                >
                                                    <RotateCw className="mr-2 h-4 w-4" /> Restart Instance
                                                </DropdownMenuItem>

                                                <DropdownMenuSeparator />

                                                {deploy.endpoint_url && (
                                                    <DropdownMenuItem asChild>
                                                        <a href={deploy.endpoint_url} target="_blank" rel="noreferrer">
                                                            <ExternalLink className="mr-2 h-4 w-4" /> Open Endpoint
                                                        </a>
                                                    </DropdownMenuItem>
                                                )}
                                                <DropdownMenuItem>
                                                    <Terminal className="mr-2 h-4 w-4" /> View Logs
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem
                                                    onClick={() => onDelete(deploy.id)}
                                                    className="text-destructive focus:text-destructive"
                                                >
                                                    <Trash2 className="mr-2 h-4 w-4" /> Delete
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </div>

            {/* Start Dialog */}
            <Dialog open={startDialogOpen} onOpenChange={setStartDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Start Instance: {selectedDeployment?.name}</DialogTitle>
                        <DialogDescription>
                            Your instance will be started with the same configuration.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                            <span className="text-sm font-medium">GPU Count</span>
                            <span className="text-sm font-semibold">{selectedDeployment?.gpu_count} GPU</span>
                        </div>
                        <div className="text-sm text-muted-foreground">
                            <p>Estimated cost: <span className="font-semibold text-foreground">$0.34/hr</span></p>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setStartDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleStart}>
                            {actionLoading === "start" ? "Starting..." : "Start Instance"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Stop Dialog */}
            <Dialog open={stopDialogOpen} onOpenChange={setStopDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Stop Instance: {selectedDeployment?.name}?</DialogTitle>
                        <DialogDescription>
                            Your instance will be stopped and all processes will be terminated.
                            You can start it again later.
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
                            {actionLoading === "stop" ? "Stopping..." : "Stop Instance"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Restart Dialog */}
            <Dialog open={restartDialogOpen} onOpenChange={setRestartDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Restart Instance: {selectedDeployment?.name}?</DialogTitle>
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
                            {actionLoading === "restart" ? "Restarting..." : "Restart Instance"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
