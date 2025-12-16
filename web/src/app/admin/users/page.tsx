"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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
    DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, Eye, Edit, Ban, CheckCircle, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getUsers, getUserDetails, updateUser, disableUser, enableUser, UserListItem, UserDetail } from "@/lib/admin-api";

export default function UsersPage() {
    const [users, setUsers] = useState<UserListItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [planFilter, setPlanFilter] = useState<string>("all");
    const [selectedUser, setSelectedUser] = useState<UserDetail | null>(null);
    const [detailsOpen, setDetailsOpen] = useState(false);
    const [editOpen, setEditOpen] = useState(false);
    const [editPlan, setEditPlan] = useState("");
    const { toast } = useToast();

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const data = await getUsers({
                search: search || undefined,
                plan: planFilter !== "all" ? planFilter : undefined,
                limit: 100,
            });
            setUsers(data);
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to load users",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, [search, planFilter]);

    const handleViewDetails = async (userId: number) => {
        try {
            const details = await getUserDetails(userId);
            setSelectedUser(details);
            setDetailsOpen(true);
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to load user details",
                variant: "destructive",
            });
        }
    };

    const handleEditPlan = (user: UserListItem) => {
        setSelectedUser(user as any);
        setEditPlan(user.plan);
        setEditOpen(true);
    };

    const handleSavePlan = async () => {
        if (!selectedUser) return;

        try {
            await updateUser(selectedUser.id, { plan: editPlan });
            toast({
                title: "Success",
                description: "User plan updated successfully",
            });
            setEditOpen(false);
            fetchUsers();
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to update user plan",
                variant: "destructive",
            });
        }
    };

    const handleDisableUser = async (userId: number) => {
        try {
            await disableUser(userId);
            toast({
                title: "Success",
                description: "User disabled successfully",
            });
            fetchUsers();
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to disable user",
                variant: "destructive",
            });
        }
    };

    const getPlanBadgeColor = (plan: string) => {
        switch (plan) {
            case "free":
                return "bg-zinc-700";
            case "pro":
                return "bg-blue-600";
            case "team":
                return "bg-purple-600";
            case "enterprise":
                return "bg-amber-600";
            default:
                return "bg-zinc-700";
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-3xl font-bold tracking-tight text-text-primary">User Management</h2>
                <p className="text-text-secondary">Manage users, subscriptions, and access control.</p>
            </div>

            {/* Filters */}
            <div className="flex gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-secondary" />
                    <Input
                        placeholder="Search by email or Clerk ID..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-10"
                    />
                </div>
                <Select value={planFilter} onValueChange={setPlanFilter}>
                    <SelectTrigger className="w-[200px]">
                        <SelectValue placeholder="Filter by plan" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Plans</SelectItem>
                        <SelectItem value="free">Free</SelectItem>
                        <SelectItem value="pro">Pro</SelectItem>
                        <SelectItem value="team">Team</SelectItem>
                        <SelectItem value="enterprise">Enterprise</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Users Table */}
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
                                    <TableHead>Email</TableHead>
                                    <TableHead>Plan</TableHead>
                                    <TableHead>Deployments</TableHead>
                                    <TableHead>Total Cost</TableHead>
                                    <TableHead>Joined</TableHead>
                                    <TableHead>Last Active</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {users.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="text-center py-8 text-text-secondary">
                                            No users found
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    users.map((user) => (
                                        <TableRow key={user.id} className="border-cream-200">
                                            <TableCell className="font-medium">{user.email}</TableCell>
                                            <TableCell>
                                                <Badge className={getPlanBadgeColor(user.plan)}>
                                                    {user.plan.toUpperCase()}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                {user.total_deployments} ({user.active_deployments} active)
                                            </TableCell>
                                            <TableCell>${user.total_cost.toFixed(2)}</TableCell>
                                            <TableCell>
                                                {new Date(user.created_at).toLocaleDateString()}
                                            </TableCell>
                                            <TableCell>
                                                {user.last_active
                                                    ? new Date(user.last_active).toLocaleDateString()
                                                    : "Never"}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => handleViewDetails(user.id)}
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => handleEditPlan(user)}
                                                    >
                                                        <Edit className="h-4 w-4" />
                                                    </Button>
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

            {/* User Details Dialog */}
            <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>User Details</DialogTitle>
                    </DialogHeader>
                    {selectedUser && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label className="text-text-secondary">Email</Label>
                                    <p className="font-medium">{selectedUser.email}</p>
                                </div>
                                <div>
                                    <Label className="text-text-secondary">Plan</Label>
                                    <p>
                                        <Badge className={getPlanBadgeColor(selectedUser.plan)}>
                                            {selectedUser.plan.toUpperCase()}
                                        </Badge>
                                    </p>
                                </div>
                                <div>
                                    <Label className="text-text-secondary">Clerk ID</Label>
                                    <p className="font-mono text-sm">{selectedUser.clerk_id || "N/A"}</p>
                                </div>
                                <div>
                                    <Label className="text-text-secondary">Auth Provider</Label>
                                    <p>{selectedUser.auth_provider}</p>
                                </div>
                            </div>

                            <div className="border-t border-cream-200 pt-4">
                                <h4 className="font-semibold mb-3">Usage Statistics</h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label className="text-text-secondary">Total Deployments</Label>
                                        <p className="text-2xl font-bold">{selectedUser.stats.total_deployments}</p>
                                    </div>
                                    <div>
                                        <Label className="text-text-secondary">Active Deployments</Label>
                                        <p className="text-2xl font-bold">{selectedUser.stats.active_deployments}</p>
                                    </div>
                                    <div>
                                        <Label className="text-text-secondary">GPU Hours</Label>
                                        <p className="text-2xl font-bold">
                                            {selectedUser.stats.total_gpu_hours.toFixed(2)}h
                                        </p>
                                    </div>
                                    <div>
                                        <Label className="text-text-secondary">Total Cost</Label>
                                        <p className="text-2xl font-bold">
                                            ${selectedUser.stats.total_cost.toFixed(2)}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Edit Plan Dialog */}
            <Dialog open={editOpen} onOpenChange={setEditOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit User Plan</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <Label>Subscription Plan</Label>
                            <Select value={editPlan} onValueChange={setEditPlan}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="free">Free</SelectItem>
                                    <SelectItem value="pro">Pro</SelectItem>
                                    <SelectItem value="team">Team</SelectItem>
                                    <SelectItem value="enterprise">Enterprise</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setEditOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleSavePlan}>Save Changes</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

