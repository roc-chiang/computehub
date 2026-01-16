"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { ArrowLeft, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
    getOrganization,
    updateOrganization,
    deleteOrganization,
    Organization,
} from "@/lib/organization-api";
import { setAuthToken } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { InvitationsList } from "@/components/organizations/invitations-list";

export default function OrganizationSettingsPage() {
    const params = useParams();
    const router = useRouter();
    const { getToken } = useAuth();
    const organizationId = parseInt(params.id as string);

    const [organization, setOrganization] = useState<Organization | null>(null);
    const [name, setName] = useState("");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        const initAuth = async () => {
            const token = await getToken();
            if (token) {
                setAuthToken(token);
                loadOrganization();
            } else {
                setLoading(false);
            }
        };
        initAuth();
    }, [organizationId]);

    const loadOrganization = async () => {
        try {
            const org = await getOrganization(organizationId);
            setOrganization(org);
            setName(org.name);
        } catch (error) {
            console.error("Failed to load organization:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!name.trim()) {
            toast({
                title: "Error",
                description: "Organization name is required",
                variant: "destructive",
            });
            return;
        }

        setSaving(true);
        try {
            await updateOrganization(organizationId, { name: name.trim() });
            toast({
                title: "Success",
                description: "Organization updated",
            });
            loadOrganization();
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to update organization",
                variant: "destructive",
            });
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm(
            "Are you sure you want to delete this organization? This action cannot be undone. All projects and members will be removed."
        )) {
            return;
        }

        try {
            await deleteOrganization(organizationId);
            toast({
                title: "Success",
                description: "Organization deleted",
            });
            router.push("/settings/organizations");
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to delete organization",
                variant: "destructive",
            });
        }
    };

    if (loading) {
        return (
            <div className="container mx-auto py-8">
                <div className="flex items-center justify-center h-64">
                    <p className="text-muted-foreground">Loading...</p>
                </div>
            </div>
        );
    }

    if (!organization) {
        return (
            <div className="container mx-auto py-8">
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                        <h3 className="text-lg font-semibold mb-2">Organization not found</h3>
                        <Button onClick={() => router.push("/settings/organizations")}>
                            Back to Organizations
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="container mx-auto py-8 max-w-4xl">
            <div className="flex items-center gap-4 mb-8">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => router.push(`/organizations/${organizationId}`)}
                >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back
                </Button>
                <div>
                    <h1 className="text-3xl font-bold">Organization Settings</h1>
                    <p className="text-muted-foreground mt-1">{organization.name}</p>
                </div>
            </div>

            <div className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>General</CardTitle>
                        <CardDescription>
                            Update your organization's basic information
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Organization Name</Label>
                            <Input
                                id="name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Slug</Label>
                            <Input value={organization.slug} disabled />
                            <p className="text-xs text-muted-foreground">
                                The slug cannot be changed after creation
                            </p>
                        </div>

                        <Button onClick={handleSave} disabled={saving}>
                            {saving ? "Saving..." : "Save Changes"}
                        </Button>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Pending Invitations</CardTitle>
                        <CardDescription>
                            Manage pending member invitations
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <InvitationsList organizationId={organizationId} />
                    </CardContent>
                </Card>

                <Card className="border-destructive">
                    <CardHeader>
                        <CardTitle className="text-destructive">Danger Zone</CardTitle>
                        <CardDescription>
                            Irreversible actions that affect your organization
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div>
                                <h4 className="font-semibold mb-2">Delete Organization</h4>
                                <p className="text-sm text-muted-foreground mb-4">
                                    Once you delete an organization, there is no going back. All projects,
                                    members, and associated data will be permanently removed.
                                </p>
                                <Button variant="destructive" onClick={handleDelete}>
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete Organization
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
