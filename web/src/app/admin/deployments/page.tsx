"use client";

import { useEffect, useState } from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, Trash2, Square, Loader2, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
    getAllDeployments,
    getDeploymentStats,
    batchDeploymentOperation,
    stopDeployment,
    deleteDeployment,
    DeploymentListItem,
    DeploymentStats,
} from "@/lib/admin-deployments-api";
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

export default function DeploymentsPage() {
    const [deployments, setDeployments] = useState<DeploymentListItem[]>([]);
    const [stats, setStats] = useState<DeploymentStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [providerFilter, setProviderFilter] = useState<string>("all");
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [batchOperation, setBatchOperation] = useState<'stop' | 'delete' | null>(null);
    const { toast } = useToast();

    const fetchData = async () => {
        setLoading(true);
        try {
            const [deploymentsData, statsData] = await Promise.all([
                getAllDeployments({
                    search: search || undefined,
                    status: statusFilter !== "all" ? statusFilter : undefined,
                    provider: providerFilter !== "all" ? providerFilter : undefined,
                    limit: 100,
                }),
                getDeploymentStats(),
            ]);
            setDeployments(deploymentsData);
            setStats(statsData);
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to load deployments",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [search, statusFilter, providerFilter]);

    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            setSelectedIds(deployments.map((d) => d.id));
        } else {
            setSelectedIds([]);
        }
    };

    const handleSelectOne = (id: number, checked: boolean) => {
        if (checked) {
            setSelectedIds([...selectedIds, id]);
        } else {
            setSelectedIds(selectedIds.filter((selectedId) => selectedId !== id));
        }
    };

    const handleBatchOperation = async (operation: 'stop' | 'delete') => {
        if (selectedIds.length === 0) {
            toast({
                title: "No selection",
                description: "Please select deployments first",
                variant: "destructive",
            });
            return;
        }

        setBatchOperation(operation);
        if (operation === 'delete') {
            setDeleteDialogOpen(true);
        } else {
            await executeBatchOperation(operation);
        }
    };

    const executeBatchOperation = async (operation: 'stop' | 'delete') => {
        try {
            const result = await batchDeploymentOperation(selectedIds, operation);
            toast({
                title: "Success",
                description: `${operation === 'stop' ? 'Stopped' : 'Deleted'} ${result.succeeded} deployment(s)`,
            });
            setSelectedIds([]);
            setDeleteDialogOpen(false);
            fetchData();
        } catch (error) {
            toast({
                title: "Error",
                description: `Failed to ${operation} deployments`,
                variant: "destructive",
            });
        }
    };

    const handleStopDeployment = async (id: number) => {
        try {
            await stopDeployment(id);
            toast({
                title: "Success",
                description: "Deployment stopped",
            });
            fetchData();
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to stop deployment",
                variant: "destructive",
            });
        }
    };

    const getStatusBadgeColor = (status: string) => {
        switch (status) {
            case "running":
                return "bg-green-600";
            case "stopped":
                return "bg-zinc-600";
            case "creating":
                return "bg-blue-600";
            case "error":
                return "bg-red-600";
            default:
                return "bg-zinc-700";
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-3xl font-bold tracking-tight text-text-primary">
                    Deployment Management
                </h2>
                <p className="text-text-secondary">Monitor and manage all user deployments.</p>
            </div>

            {/* Stats Cards */}
            {stats && (
                <div className="grid gap-4 md:grid-cols-4">
                    <Card className="bg-cream-100 border-cream-200">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-text-secondary">
                                Total Deployments
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.total_deployments}</div>
                        </CardContent>
                    </Card>
                    <Card className="bg-cream-100 border-cream-200">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-text-secondary">
                                Active
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-green-500">
                                {stats.active_deployments}
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="bg-cream-100 border-cream-200">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-text-secondary">
                                Total GPU Hours
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {stats.total_gpu_hours.toFixed(1)}h
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="bg-cream-100 border-cream-200">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-text-secondary">
                                Total Cost
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                ${stats.total_cost.toFixed(2)}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Filters and Actions */}
            <div className="flex flex-wrap gap-4">
                <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-secondary" />
                    <Input
                        placeholder="Search by name or user email..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-10"
                    />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[150px]">
                        <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="running">Running</SelectItem>
                        <SelectItem value="stopped">Stopped</SelectItem>
                        <SelectItem value="creating">Creating</SelectItem>
                        <SelectItem value="error">Error</SelectItem>
                    </SelectContent>
                </Select>
                <Select value={providerFilter} onValueChange={setProviderFilter}>
                    <SelectTrigger className="w-[150px]">
                        <SelectValue placeholder="Provider" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Providers</SelectItem>
                        <SelectItem value="local">Local</SelectItem>
                        <SelectItem value="runpod">RunPod</SelectItem>
                        <SelectItem value="vast">Vast.ai</SelectItem>
                    </SelectContent>
                </Select>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleBatchOperation('stop')}
                        disabled={selectedIds.length === 0}
                    >
                        <Square className="h-4 w-4 mr-2" />
                        Stop Selected
                    </Button>
                    <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleBatchOperation('delete')}
                        disabled={selectedIds.length === 0}
                    >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Selected
                    </Button>
                </div>
            </div>

            {/* Deployments Table */}
            <Card className="bg-cream-100 border-cream-200">
                <CardContent className="p-0">
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow className="border-cream-200">
                                    <TableHead className="w-12">
                                        <Checkbox
                                            checked={
                                                deployments.length > 0 &&
                                                selectedIds.length === deployments.length
                                            }
                                            onCheckedChange={handleSelectAll}
                                        />
                                    </TableHead>
                                    <TableHead>Name</TableHead>
                                    <TableHead>User</TableHead>
                                    <TableHead>Provider</TableHead>
                                    <TableHead>GPU</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Uptime</TableHead>
                                    <TableHead>Cost</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {deployments.length === 0 ? (
                                    <TableRow>
                                        <TableCell
                                            colSpan={9}
                                            className="text-center py-8 text-text-secondary"
                                        >
                                            No deployments found
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    deployments.map((deployment) => (
                                        <TableRow key={deployment.id} className="border-cream-200">
                                            <TableCell>
                                                <Checkbox
                                                    checked={selectedIds.includes(deployment.id)}
                                                    onCheckedChange={(checked) =>
                                                        handleSelectOne(deployment.id, checked as boolean)
                                                    }
                                                />
                                            </TableCell>
                                            <TableCell className="font-medium">
                                                {deployment.name}
                                            </TableCell>
                                            <TableCell className="text-sm text-text-secondary">
                                                {deployment.user_email}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline">{deployment.provider}</Badge>
                                            </TableCell>
                                            <TableCell>{deployment.gpu_type}</TableCell>
                                            <TableCell>
                                                <Badge className={getStatusBadgeColor(deployment.status)}>
                                                    {deployment.status.toUpperCase()}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                {deployment.uptime_seconds
                                                    ? `${(deployment.uptime_seconds / 3600).toFixed(1)}h`
                                                    : "N/A"}
                                            </TableCell>
                                            <TableCell>${deployment.estimated_cost.toFixed(2)}</TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-2">
                                                    {deployment.status === "running" && (
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => handleStopDeployment(deployment.id)}
                                                        >
                                                            Stop
                                                        </Button>
                                                    )}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete {selectedIds.length} deployment(s). This action
                            cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => batchOperation && executeBatchOperation(batchOperation)}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}

