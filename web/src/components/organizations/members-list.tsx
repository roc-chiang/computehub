"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@clerk/nextjs";
import { UserPlus, MoreVertical, Mail, Trash2 } from "lucide-react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    getMembers,
    updateMemberRole,
    removeMember,
    OrganizationMember,
} from "@/lib/organization-api";
import { setAuthToken } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { InviteMemberDialog } from "./invite-member-dialog";

interface MembersListProps {
    organizationId: number;
    currentUserRole: string;
}

export function MembersList({ organizationId, currentUserRole }: MembersListProps) {
    const [members, setMembers] = useState<OrganizationMember[]>([]);
    const [loading, setLoading] = useState(true);
    const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
    const { toast } = useToast();
    const { getToken } = useAuth();

    useEffect(() => {
        const initAuth = async () => {
            const token = await getToken();
            if (token) {
                setAuthToken(token);
                loadMembers();
            } else {
                setLoading(false);
            }
        };
        initAuth();
    }, [organizationId]);

    const loadMembers = async () => {
        try {
            const data = await getMembers(organizationId);
            setMembers(data);
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to load members",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const handleRoleChange = async (userId: number, newRole: string) => {
        try {
            await updateMemberRole(organizationId, userId, newRole);
            toast({
                title: "Success",
                description: "Member role updated",
            });
            loadMembers();
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to update role",
                variant: "destructive",
            });
        }
    };

    const handleRemoveMember = async (userId: number) => {
        if (!confirm("Are you sure you want to remove this member?")) return;

        try {
            await removeMember(organizationId, userId);
            toast({
                title: "Success",
                description: "Member removed",
            });
            loadMembers();
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to remove member",
                variant: "destructive",
            });
        }
    };

    const canManageMembers = currentUserRole === "owner" || currentUserRole === "admin";

    if (loading) {
        return <div className="text-center py-8">Loading members...</div>;
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Members ({members.length})</h3>
                {canManageMembers && (
                    <Button onClick={() => setInviteDialogOpen(true)}>
                        <UserPlus className="mr-2 h-4 w-4" />
                        Invite Member
                    </Button>
                )}
            </div>

            <div className="border rounded-lg">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Email</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead>Joined</TableHead>
                            <TableHead className="w-[50px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {members.map((member) => (
                            <TableRow key={member.id}>
                                <TableCell className="font-medium">{member.email}</TableCell>
                                <TableCell>
                                    {canManageMembers && member.role !== "owner" ? (
                                        <Select
                                            value={member.role}
                                            onValueChange={(value) => handleRoleChange(member.user_id, value)}
                                        >
                                            <SelectTrigger className="w-[120px]">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="admin">Admin</SelectItem>
                                                <SelectItem value="member">Member</SelectItem>
                                                <SelectItem value="viewer">Viewer</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    ) : (
                                        <Badge variant={member.role === "owner" ? "default" : "secondary"}>
                                            {member.role}
                                        </Badge>
                                    )}
                                </TableCell>
                                <TableCell className="text-muted-foreground">
                                    {new Date(member.joined_at).toLocaleDateString()}
                                </TableCell>
                                <TableCell>
                                    {canManageMembers && member.role !== "owner" && (
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="sm">
                                                    <MoreVertical className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem
                                                    className="text-destructive"
                                                    onClick={() => handleRemoveMember(member.user_id)}
                                                >
                                                    <Trash2 className="mr-2 h-4 w-4" />
                                                    Remove
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    )}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            <InviteMemberDialog
                organizationId={organizationId}
                open={inviteDialogOpen}
                onOpenChange={setInviteDialogOpen}
                onSuccess={loadMembers}
            />
        </div>
    );
}
