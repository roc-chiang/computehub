"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { ArrowLeft, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getOrganization, Organization } from "@/lib/organization-api";
import { setAuthToken } from "@/lib/api";
import { MembersList } from "@/components/organizations/members-list";
import { ProjectsList } from "@/components/organizations/projects-list";

export default function OrganizationPage() {
    const params = useParams();
    const router = useRouter();
    const { getToken } = useAuth();
    const organizationId = parseInt(params.id as string);

    const [organization, setOrganization] = useState<Organization | null>(null);
    const [loading, setLoading] = useState(true);
    const [currentUserRole, setCurrentUserRole] = useState("viewer");

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
            // TODO: Get current user's role from organizations list
            setCurrentUserRole("admin"); // Placeholder
        } catch (error) {
            console.error("Failed to load organization:", error);
        } finally {
            setLoading(false);
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
        <div className="container mx-auto py-8">
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => router.push("/settings/organizations")}
                    >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold">{organization.name}</h1>
                        <p className="text-muted-foreground mt-1">@{organization.slug}</p>
                    </div>
                </div>
                {(currentUserRole === "owner" || currentUserRole === "admin") && (
                    <Button
                        variant="outline"
                        onClick={() => router.push(`/organizations/${organizationId}/settings`)}
                    >
                        <Settings className="mr-2 h-4 w-4" />
                        Settings
                    </Button>
                )}
            </div>

            <Tabs defaultValue="projects" className="space-y-6">
                <TabsList>
                    <TabsTrigger value="projects">Projects</TabsTrigger>
                    <TabsTrigger value="members">Members</TabsTrigger>
                </TabsList>

                <TabsContent value="projects" className="space-y-4">
                    <ProjectsList
                        organizationId={organizationId}
                        currentUserRole={currentUserRole}
                    />
                </TabsContent>

                <TabsContent value="members" className="space-y-4">
                    <MembersList
                        organizationId={organizationId}
                        currentUserRole={currentUserRole}
                    />
                </TabsContent>
            </Tabs>
        </div>
    );
}
