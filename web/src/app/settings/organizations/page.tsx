"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { Plus, Users, FolderKanban, Settings } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getOrganizations, OrganizationWithStats } from "@/lib/organization-api";
import { setAuthToken } from "@/lib/api";
import { CreateOrganizationDialog } from "@/components/organizations/create-organization-dialog";

export default function OrganizationsPage() {
    const [organizations, setOrganizations] = useState<OrganizationWithStats[]>([]);
    const [loading, setLoading] = useState(true);
    const [createDialogOpen, setCreateDialogOpen] = useState(false);
    const router = useRouter();
    const { getToken } = useAuth();

    useEffect(() => {
        const initAuth = async () => {
            const token = await getToken();
            if (token) {
                setAuthToken(token);
                loadOrganizations();
            } else {
                setLoading(false);
            }
        };
        initAuth();
    }, []);

    const loadOrganizations = async () => {
        try {
            const orgs = await getOrganizations();
            setOrganizations(orgs);
        } catch (error) {
            console.error("Failed to load organizations:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleOrganizationCreated = () => {
        setCreateDialogOpen(false);
        loadOrganizations();
    };

    const getRoleBadgeVariant = (role: string) => {
        switch (role) {
            case "owner":
                return "default";
            case "admin":
                return "secondary";
            default:
                return "outline";
        }
    };

    if (loading) {
        return (
            <div className="container mx-auto py-8">
                <div className="flex items-center justify-center h-64">
                    <p className="text-muted-foreground">Loading organizations...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto py-8">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold">Organizations</h1>
                    <p className="text-muted-foreground mt-2">
                        Manage your teams and collaborate with others
                    </p>
                </div>
                <Button onClick={() => setCreateDialogOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Organization
                </Button>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {organizations.map((org) => (
                    <Card key={org.id} className="hover:shadow-lg transition-shadow">
                        <CardHeader>
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <CardTitle className="text-xl">{org.name}</CardTitle>
                                    <CardDescription className="mt-1">
                                        @{org.slug}
                                    </CardDescription>
                                </div>
                                <Badge variant={getRoleBadgeVariant(org.role)}>
                                    {org.role}
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between text-sm">
                                    <div className="flex items-center text-muted-foreground">
                                        <Users className="mr-2 h-4 w-4" />
                                        {org.member_count} {org.member_count === 1 ? "member" : "members"}
                                    </div>
                                    <div className="flex items-center text-muted-foreground">
                                        <FolderKanban className="mr-2 h-4 w-4" />
                                        {org.project_count} {org.project_count === 1 ? "project" : "projects"}
                                    </div>
                                </div>

                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        className="flex-1"
                                        onClick={() => router.push(`/organizations/${org.id}`)}
                                    >
                                        View
                                    </Button>
                                    {(org.role === "owner" || org.role === "admin") && (
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => router.push(`/organizations/${org.id}/settings`)}
                                        >
                                            <Settings className="h-4 w-4" />
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {organizations.length === 0 && (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                        <Users className="h-12 w-12 text-muted-foreground mb-4" />
                        <h3 className="text-lg font-semibold mb-2">No organizations yet</h3>
                        <p className="text-muted-foreground text-center mb-4">
                            Create your first organization to start collaborating with your team
                        </p>
                        <Button onClick={() => setCreateDialogOpen(true)}>
                            <Plus className="mr-2 h-4 w-4" />
                            Create Organization
                        </Button>
                    </CardContent>
                </Card>
            )}

            <CreateOrganizationDialog
                open={createDialogOpen}
                onOpenChange={setCreateDialogOpen}
                onSuccess={handleOrganizationCreated}
            />
        </div>
    );
}
