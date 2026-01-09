"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Loader2, TrendingUp, Activity, Clock, AlertCircle, Plus, Trash2, Pencil } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
    PieChart,
    Pie,
    Cell,
    LineChart,
    Line,
    AreaChart,
    Area,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from "recharts";
import {
    getProviderStats,
    getProviderMetrics,
    getProvidersSummary,
    ProviderStats,
    ProviderMetrics,
    ProvidersSummary,
} from "@/lib/provider-stats-api";
import {
    listProviders,
    createProvider,
    updateProvider,
    deleteProvider,
    ProviderResponse,
    ProviderCreate,
} from "@/lib/provider-crud-api";
import { EditProviderDialog } from "@/components/admin/edit-provider-dialog";

const COLORS = {
    running: "#10b981",
    stopped: "#6b7280",
    creating: "#3b82f6",
    error: "#ef4444",
    deleted: "#9ca3af",
};

export default function ProvidersPage() {
    const [stats, setStats] = useState<ProviderStats | null>(null);
    const [metrics, setMetrics] = useState<ProviderMetrics | null>(null);
    const [summary, setSummary] = useState<ProvidersSummary | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedProviderId, setSelectedProviderId] = useState<number | null>(null);

    // Provider CRUD state
    const [providers, setProviders] = useState<ProviderResponse[]>([]);
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [editingProvider, setEditingProvider] = useState<ProviderResponse | null>(null);
    const [newProvider, setNewProvider] = useState<ProviderCreate>({
        name: "",
        type: "runpod",
        is_enabled: true,
    });

    const { toast } = useToast();

    useEffect(() => {
        fetchSummary();
        fetchProvidersList();
    }, []);

    useEffect(() => {
        if (selectedProviderId) {
            fetchProviderData();
        }
    }, [selectedProviderId]);

    const fetchProvidersList = async () => {
        try {
            const data = await listProviders();
            setProviders(data);
        } catch (error) {
            console.error("Failed to load providers list:", error);
        }
    };

    const fetchSummary = async () => {
        try {
            const summaryData = await getProvidersSummary();
            setSummary(summaryData);
            if (summaryData.providers.length > 0) {
                setSelectedProviderId(summaryData.providers[0].id);
            } else {
                setLoading(false);
            }
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to load providers summary",
                variant: "destructive",
            });
            setLoading(false);
        }
    };

    const fetchProviderData = async () => {
        if (!selectedProviderId) return;

        setLoading(true);
        try {
            const [statsData, metricsData] = await Promise.all([
                getProviderStats(selectedProviderId),
                getProviderMetrics(selectedProviderId),
            ]);
            setStats(statsData);
            setMetrics(metricsData);
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to load provider data",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            </div>
        );
    }

    // Don't show early return for empty providers - show tabs so user can add providers

    const statusData = stats
        ? [
            { name: "Running", value: stats.deployment_by_status.running, color: COLORS.running },
            { name: "Stopped", value: stats.deployment_by_status.stopped, color: COLORS.stopped },
            { name: "Creating", value: stats.deployment_by_status.creating, color: COLORS.creating },
            { name: "Error", value: stats.deployment_by_status.error, color: COLORS.error },
            { name: "Deleted", value: stats.deployment_by_status.deleted, color: COLORS.deleted },
        ]
        : [];

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-3xl font-bold tracking-tight text-text-primary">
                    Provider Management
                </h2>
                <p className="text-text-secondary">Monitor and analyze provider performance.</p>
            </div>

            <Tabs defaultValue="overview" className="space-y-4">
                <TabsList className="bg-cream-100">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="statistics">Statistics</TabsTrigger>
                    <TabsTrigger value="comparison">Comparison</TabsTrigger>
                    <TabsTrigger value="management">Management</TabsTrigger>
                </TabsList>

                {/* Overview Tab */}
                <TabsContent value="overview" className="space-y-4">
                    {stats && (
                        <>
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                <Card className="bg-cream-100 border-cream-200">
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <CardTitle className="text-sm font-medium text-text-secondary">
                                            Total Deployments
                                        </CardTitle>
                                        <Activity className="h-4 w-4 text-blue-500" />
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold text-text-primary">
                                            {stats.total_deployments}
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card className="bg-cream-100 border-cream-200">
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <CardTitle className="text-sm font-medium text-text-secondary">
                                            Active Deployments
                                        </CardTitle>
                                        <TrendingUp className="h-4 w-4 text-green-500" />
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold text-text-primary">
                                            {stats.active_deployments}
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card className="bg-cream-100 border-cream-200">
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <CardTitle className="text-sm font-medium text-text-secondary">
                                            Total GPU Hours
                                        </CardTitle>
                                        <Clock className="h-4 w-4 text-purple-500" />
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold text-text-primary">
                                            {stats.total_gpu_hours.toFixed(1)}
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                            <Card className="bg-cream-100 border-cream-200">
                                <CardHeader>
                                    <CardTitle className="text-text-primary">Deployment Distribution</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <ResponsiveContainer width="100%" height={300}>
                                        <PieChart>
                                            <Pie
                                                data={statusData}
                                                cx="50%"
                                                cy="50%"
                                                labelLine={false}
                                                label={({ name, percent }) =>
                                                    percent !== undefined ? `${name}: ${(percent * 100).toFixed(0)}%` : name
                                                }
                                                outerRadius={80}
                                                fill="#8884d8"
                                                dataKey="value"
                                            >
                                                {statusData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                                ))}
                                            </Pie>
                                            <Tooltip
                                                contentStyle={{
                                                    backgroundColor: "#18181b",
                                                    border: "1px solid #27272a",
                                                }}
                                            />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </CardContent>
                            </Card>
                        </>
                    )}
                </TabsContent>

                {/* Statistics Tab */}
                <TabsContent value="statistics" className="space-y-4">
                    {stats && (
                        <>
                            <Card className="bg-cream-100 border-cream-200">
                                <CardHeader>
                                    <CardTitle className="text-text-primary">GPU Hours Trend</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <ResponsiveContainer width="100%" height={300}>
                                        <LineChart data={stats.gpu_hours_by_month}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                                            <XAxis dataKey="month" stroke="#71717a" />
                                            <YAxis stroke="#71717a" />
                                            <Tooltip
                                                contentStyle={{
                                                    backgroundColor: "#18181b",
                                                    border: "1px solid #27272a",
                                                }}
                                            />
                                            <Legend />
                                            <Line type="monotone" dataKey="hours" stroke="#3b82f6" name="GPU Hours" />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </CardContent>
                            </Card>

                            <Card className="bg-cream-100 border-cream-200">
                                <CardHeader>
                                    <CardTitle className="text-text-primary">Cost Trend</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <ResponsiveContainer width="100%" height={300}>
                                        <AreaChart data={stats.cost_by_month}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                                            <XAxis dataKey="month" stroke="#71717a" />
                                            <YAxis stroke="#71717a" />
                                            <Tooltip
                                                contentStyle={{
                                                    backgroundColor: "#18181b",
                                                    border: "1px solid #27272a",
                                                }}
                                            />
                                            <Legend />
                                            <Area type="monotone" dataKey="cost" stroke="#10b981" fill="#10b981" fillOpacity={0.3} name="Cost ($)" />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </CardContent>
                            </Card>
                        </>
                    )}
                </TabsContent>

                {/* Comparison Tab */}
                <TabsContent value="comparison" className="space-y-4">
                    {summary && (
                        <Card className="bg-cream-100 border-cream-200">
                            <CardHeader>
                                <CardTitle className="text-text-primary">Provider Comparison</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="border-b border-cream-200">
                                                <th className="text-left p-3 text-text-secondary font-medium">Provider</th>
                                                <th className="text-left p-3 text-text-secondary font-medium">Status</th>
                                                <th className="text-right p-3 text-text-secondary font-medium">Total Deployments</th>
                                                <th className="text-right p-3 text-text-secondary font-medium">Active</th>
                                                <th className="text-right p-3 text-text-secondary font-medium">GPU Hours</th>
                                                <th className="text-right p-3 text-text-secondary font-medium">Success Rate</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {summary.providers.map((provider) => (
                                                <tr key={provider.id} className="border-b border-cream-200 hover:bg-cream-50">
                                                    <td className="p-3 text-text-primary font-medium">{provider.name}</td>
                                                    <td className="p-3">
                                                        <span
                                                            className={`px-2 py-1 rounded text-xs ${provider.enabled
                                                                ? "bg-green-500/20 text-green-400"
                                                                : "bg-gray-500/20 text-gray-400"
                                                                }`}
                                                        >
                                                            {provider.enabled ? "Enabled" : "Disabled"}
                                                        </span>
                                                    </td>
                                                    <td className="p-3 text-right text-text-primary">{provider.total_deployments}</td>
                                                    <td className="p-3 text-right text-text-primary">{provider.active_deployments}</td>
                                                    <td className="p-3 text-right text-text-primary">{provider.total_gpu_hours.toFixed(1)}</td>
                                                    <td className="p-3 text-right text-text-primary">{provider.success_rate.toFixed(1)}%</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </TabsContent>

                {/* Management Tab */}
                <TabsContent value="management" className="space-y-4">
                    <div className="flex justify-between items-center">
                        <h3 className="text-lg font-semibold text-text-primary">Manage Providers</h3>
                        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                            <DialogTrigger asChild>
                                <Button>
                                    <Plus className="mr-2 h-4 w-4" />
                                    Add Provider
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="bg-cream-100 border-cream-200">
                                <DialogHeader>
                                    <DialogTitle className="text-text-primary">Add New Provider</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4">
                                    <div>
                                        <Label>Name</Label>
                                        <Input
                                            value={newProvider.name}
                                            onChange={(e) => setNewProvider({ ...newProvider, name: e.target.value })}
                                            placeholder="Provider name"
                                            className="border-cream-200"
                                        />
                                    </div>
                                    <div>
                                        <Label>Type</Label>
                                        <Select
                                            value={newProvider.type}
                                            onValueChange={(v: any) => setNewProvider({ ...newProvider, type: v })}
                                        >
                                            <SelectTrigger className="border-cream-200">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="local">Local</SelectItem>
                                                <SelectItem value="runpod">RunPod</SelectItem>
                                                <SelectItem value="vastai">Vast.ai</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div>
                                        <Label>Display Name (Optional)</Label>
                                        <Input
                                            value={newProvider.display_name || ""}
                                            onChange={(e) => setNewProvider({ ...newProvider, display_name: e.target.value })}
                                            placeholder="Display name"
                                            className="border-cream-200"
                                        />
                                    </div>
                                    <div>
                                        <Label>API Key (Optional)</Label>
                                        <Input
                                            value={newProvider.api_key || ""}
                                            onChange={(e) => setNewProvider({ ...newProvider, api_key: e.target.value })}
                                            placeholder="API key"
                                            type="password"
                                            className="border-cream-200"
                                        />
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <Switch
                                            checked={newProvider.is_enabled}
                                            onCheckedChange={(checked) => setNewProvider({ ...newProvider, is_enabled: checked })}
                                        />
                                        <Label>Enabled</Label>
                                    </div>
                                    <Button
                                        onClick={async () => {
                                            try {
                                                await createProvider(newProvider);
                                                toast({ title: "Success", description: "Provider created" });
                                                setIsAddDialogOpen(false);
                                                setNewProvider({ name: "", type: "runpod", is_enabled: true });
                                                fetchProvidersList();
                                                fetchSummary();
                                            } catch (error: any) {
                                                toast({ title: "Error", description: error.message, variant: "destructive" });
                                            }
                                        }}
                                        className="w-full"
                                    >
                                        Create Provider
                                    </Button>
                                </div>
                            </DialogContent>
                        </Dialog>
                    </div>

                    <Card className="bg-cream-100 border-cream-200">
                        <CardContent className="pt-6">
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b border-cream-200">
                                            <th className="text-left p-3 text-text-secondary font-medium">Name</th>
                                            <th className="text-left p-3 text-text-secondary font-medium">Type</th>
                                            <th className="text-left p-3 text-text-secondary font-medium">Display Name</th>
                                            <th className="text-left p-3 text-text-secondary font-medium">Status</th>
                                            <th className="text-right p-3 text-text-secondary font-medium">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {providers.map((provider) => (
                                            <tr key={provider.id} className="border-b border-cream-200 hover:bg-cream-50">
                                                <td className="p-3 text-text-primary font-medium">{provider.name}</td>
                                                <td className="p-3 text-text-primary capitalize">{provider.type}</td>
                                                <td className="p-3 text-text-primary">{provider.display_name || "-"}</td>
                                                <td className="p-3">
                                                    <span
                                                        className={`px-2 py-1 rounded text-xs ${provider.is_enabled
                                                            ? "bg-green-500/20 text-green-400"
                                                            : "bg-gray-500/20 text-gray-400"
                                                            }`}
                                                    >
                                                        {provider.is_enabled ? "Enabled" : "Disabled"}
                                                    </span>
                                                </td>
                                                <td className="p-3 text-right space-x-2">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => setEditingProvider(provider)}
                                                    >
                                                        <Pencil className="h-4 w-4 mr-2" />
                                                        Edit
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={async () => {
                                                            try {
                                                                await updateProvider(provider.id, {
                                                                    is_enabled: !provider.is_enabled,
                                                                });
                                                                toast({
                                                                    title: "Success",
                                                                    description: `Provider ${provider.is_enabled ? "disabled" : "enabled"}`,
                                                                });
                                                                fetchProvidersList();
                                                                fetchSummary();
                                                            } catch (error: any) {
                                                                toast({
                                                                    title: "Error",
                                                                    description: error.message,
                                                                    variant: "destructive",
                                                                });
                                                            }
                                                        }}
                                                    >
                                                        {provider.is_enabled ? "Disable" : "Enable"}
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={async () => {
                                                            if (confirm(`Delete provider "${provider.name}"?`)) {
                                                                try {
                                                                    await deleteProvider(provider.id);
                                                                    toast({ title: "Success", description: "Provider deleted" });
                                                                    fetchProvidersList();
                                                                    fetchSummary();
                                                                } catch (error: any) {
                                                                    toast({
                                                                        title: "Error",
                                                                        description: error.message,
                                                                        variant: "destructive",
                                                                    });
                                                                }
                                                            }
                                                        }}
                                                    >
                                                        <Trash2 className="h-4 w-4 text-red-400" />
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Edit Provider Dialog */}
                    <EditProviderDialog
                        provider={editingProvider}
                        open={editingProvider !== null}
                        onOpenChange={(open) => !open && setEditingProvider(null)}
                        onSuccess={() => {
                            fetchProvidersList();
                            fetchSummary();
                        }}
                    />
                </TabsContent>
            </Tabs>
        </div>
    );
}

