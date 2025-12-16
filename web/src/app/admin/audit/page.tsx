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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, Eye, Loader2, FileText, Shield, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
    getAuditLogs,
    getAuditLogDetail,
    getAuditStats,
    AuditLogItem,
    AuditLogDetail,
    AuditStats,
} from "@/lib/admin-audit-api";

export default function AuditLogsPage() {
    const [logs, setLogs] = useState<AuditLogItem[]>([]);
    const [stats, setStats] = useState<AuditStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [actionFilter, setActionFilter] = useState<string>("all");
    const [resourceFilter, setResourceFilter] = useState<string>("all");
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [selectedLog, setSelectedLog] = useState<AuditLogDetail | null>(null);
    const [detailsOpen, setDetailsOpen] = useState(false);
    const { toast } = useToast();

    const fetchData = async () => {
        setLoading(true);
        try {
            const [logsData, statsData] = await Promise.all([
                getAuditLogs({
                    user_email: search || undefined,
                    action_type: actionFilter !== "all" ? actionFilter : undefined,
                    resource_type: resourceFilter !== "all" ? resourceFilter : undefined,
                    status: statusFilter !== "all" ? statusFilter : undefined,
                    limit: 100,
                }),
                getAuditStats(),
            ]);
            setLogs(logsData);
            setStats(statsData);
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to load audit logs",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [search, actionFilter, resourceFilter, statusFilter]);

    const handleViewDetails = async (logId: number) => {
        try {
            const details = await getAuditLogDetail(logId);
            setSelectedLog(details);
            setDetailsOpen(true);
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to load log details",
                variant: "destructive",
            });
        }
    };

    const getStatusBadgeColor = (status: string) => {
        switch (status) {
            case "success":
                return "bg-green-600";
            case "failed":
                return "bg-red-600";
            case "error":
                return "bg-orange-600";
            default:
                return "bg-zinc-700";
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-3xl font-bold tracking-tight text-text-primary">Audit Logs</h2>
                <p className="text-text-secondary">Track all system activities and admin operations.</p>
            </div>

            {/* Stats Cards */}
            {stats && (
                <div className="grid gap-4 md:grid-cols-4">
                    <Card className="bg-cream-100 border-cream-200">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-text-secondary">
                                Total Logs
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.total_logs}</div>
                        </CardContent>
                    </Card>
                    <Card className="bg-cream-100 border-cream-200">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-text-secondary">
                                Last 24 Hours
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-blue-500">
                                {stats.recent_24h}
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="bg-cream-100 border-cream-200">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-text-secondary">
                                Success Rate
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-green-500">
                                {stats.total_logs > 0
                                    ? ((stats.by_status.success / stats.total_logs) * 100).toFixed(1)
                                    : 0}
                                %
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="bg-cream-100 border-cream-200">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-text-secondary">
                                Failed Actions
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-red-500">
                                {stats.by_status.failed + stats.by_status.error}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Filters */}
            <div className="flex flex-wrap gap-4">
                <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-secondary" />
                    <Input
                        placeholder="Search by user email..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-10"
                    />
                </div>
                <Select value={actionFilter} onValueChange={setActionFilter}>
                    <SelectTrigger className="w-[150px]">
                        <SelectValue placeholder="Action" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Actions</SelectItem>
                        <SelectItem value="CREATE">Create</SelectItem>
                        <SelectItem value="UPDATE">Update</SelectItem>
                        <SelectItem value="DELETE">Delete</SelectItem>
                        <SelectItem value="LOGIN">Login</SelectItem>
                    </SelectContent>
                </Select>
                <Select value={resourceFilter} onValueChange={setResourceFilter}>
                    <SelectTrigger className="w-[150px]">
                        <SelectValue placeholder="Resource" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Resources</SelectItem>
                        <SelectItem value="user">User</SelectItem>
                        <SelectItem value="deployment">Deployment</SelectItem>
                        <SelectItem value="provider">Provider</SelectItem>
                        <SelectItem value="setting">Setting</SelectItem>
                    </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[150px]">
                        <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="success">Success</SelectItem>
                        <SelectItem value="failed">Failed</SelectItem>
                        <SelectItem value="error">Error</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Logs Table */}
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
                                    <TableHead>Timestamp</TableHead>
                                    <TableHead>Action</TableHead>
                                    <TableHead>Resource</TableHead>
                                    <TableHead>User</TableHead>
                                    <TableHead>Description</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {logs.length === 0 ? (
                                    <TableRow>
                                        <TableCell
                                            colSpan={7}
                                            className="text-center py-8 text-text-secondary"
                                        >
                                            No audit logs found
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    logs.map((log) => (
                                        <TableRow key={log.id} className="border-cream-200">
                                            <TableCell className="text-sm">
                                                {new Date(log.timestamp).toLocaleString()}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline">{log.action_type}</Badge>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline">{log.resource_type}</Badge>
                                            </TableCell>
                                            <TableCell className="text-sm">
                                                {log.user_email || "System"}
                                                {log.is_admin && (
                                                    <Shield className="inline h-3 w-3 ml-1 text-amber-500" />
                                                )}
                                            </TableCell>
                                            <TableCell className="max-w-md truncate">
                                                {log.description}
                                            </TableCell>
                                            <TableCell>
                                                <Badge className={getStatusBadgeColor(log.status)}>
                                                    {log.status.toUpperCase()}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleViewDetails(log.id)}
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            {/* Log Details Dialog */}
            <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
                <DialogContent className="max-w-3xl">
                    <DialogHeader>
                        <DialogTitle>Audit Log Details</DialogTitle>
                    </DialogHeader>
                    {selectedLog && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm text-text-secondary">Timestamp</p>
                                    <p className="font-medium">
                                        {new Date(selectedLog.timestamp).toLocaleString()}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-text-secondary">Status</p>
                                    <Badge className={getStatusBadgeColor(selectedLog.status)}>
                                        {selectedLog.status.toUpperCase()}
                                    </Badge>
                                </div>
                                <div>
                                    <p className="text-sm text-text-secondary">Action Type</p>
                                    <p className="font-medium">{selectedLog.action_type}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-text-secondary">Resource Type</p>
                                    <p className="font-medium">{selectedLog.resource_type}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-text-secondary">Resource ID</p>
                                    <p className="font-mono text-sm">
                                        {selectedLog.resource_id || "N/A"}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-text-secondary">User</p>
                                    <p className="font-medium">
                                        {selectedLog.user_email || "System"}
                                        {selectedLog.is_admin && " (Admin)"}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-text-secondary">IP Address</p>
                                    <p className="font-mono text-sm">
                                        {selectedLog.ip_address || "N/A"}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-text-secondary">User Agent</p>
                                    <p className="text-sm truncate">
                                        {selectedLog.user_agent || "N/A"}
                                    </p>
                                </div>
                            </div>

                            <div>
                                <p className="text-sm text-text-secondary mb-2">Description</p>
                                <p className="text-sm bg-zinc-800 p-3 rounded">
                                    {selectedLog.description}
                                </p>
                            </div>

                            {selectedLog.details_json && (
                                <div>
                                    <p className="text-sm text-text-secondary mb-2">Details (JSON)</p>
                                    <pre className="text-xs bg-zinc-800 p-3 rounded overflow-auto max-h-48">
                                        {JSON.stringify(JSON.parse(selectedLog.details_json), null, 2)}
                                    </pre>
                                </div>
                            )}

                            {selectedLog.error_message && (
                                <div>
                                    <p className="text-sm text-text-secondary mb-2">Error Message</p>
                                    <p className="text-sm text-red-400 bg-zinc-800 p-3 rounded">
                                        {selectedLog.error_message}
                                    </p>
                                </div>
                            )}
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}

