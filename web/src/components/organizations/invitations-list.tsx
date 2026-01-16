"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@clerk/nextjs";
import { Mail, X, Clock } from "lucide-react";
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
    getInvitations,
    cancelInvitation,
    OrganizationInvitation,
} from "@/lib/organization-api";
import { setAuthToken } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

interface InvitationsListProps {
    organizationId: number;
}

export function InvitationsList({ organizationId }: InvitationsListProps) {
    const [invitations, setInvitations] = useState<OrganizationInvitation[]>([]);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();
    const { getToken } = useAuth();

    useEffect(() => {
        const initAuth = async () => {
            const token = await getToken();
            if (token) {
                setAuthToken(token);
                loadInvitations();
            } else {
                setLoading(false);
            }
        };
        initAuth();
    }, [organizationId, getToken]);

    const loadInvitations = async () => {
        try {
            const data = await getInvitations(organizationId);
            setInvitations(data);
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to load invitations",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const handleCancelInvitation = async (invitationId: number) => {
        try {
            await cancelInvitation(organizationId, invitationId);
            toast({
                title: "Success",
                description: "Invitation cancelled",
            });
            loadInvitations();
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to cancel invitation",
                variant: "destructive",
            });
        }
    };

    if (loading) {
        return <div className="text-center py-4">Loading invitations...</div>;
    }

    if (invitations.length === 0) {
        return (
            <div className="text-center py-8 text-muted-foreground">
                <Mail className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No pending invitations</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <h4 className="text-sm font-semibold">Pending Invitations ({invitations.length})</h4>
            <div className="border rounded-lg">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Email</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead>Sent</TableHead>
                            <TableHead>Expires</TableHead>
                            <TableHead className="w-[50px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {invitations.map((invitation) => (
                            <TableRow key={invitation.id}>
                                <TableCell className="font-medium">{invitation.email}</TableCell>
                                <TableCell>
                                    <Badge variant="outline">{invitation.role}</Badge>
                                </TableCell>
                                <TableCell className="text-muted-foreground text-sm">
                                    {new Date(invitation.created_at).toLocaleDateString()}
                                </TableCell>
                                <TableCell className="text-muted-foreground text-sm">
                                    <div className="flex items-center">
                                        <Clock className="h-3 w-3 mr-1" />
                                        {new Date(invitation.expires_at).toLocaleDateString()}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleCancelInvitation(invitation.id)}
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
