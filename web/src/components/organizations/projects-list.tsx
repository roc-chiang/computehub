"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { Plus, FolderKanban, Trash2, ExternalLink } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    getProjects,
    deleteProject,
    ProjectWithStats,
} from "@/lib/organization-api";
import { setAuthToken } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { CreateProjectDialog } from "./create-project-dialog";

interface ProjectsListProps {
    organizationId: number;
    currentUserRole: string;
}

export function ProjectsList({ organizationId, currentUserRole }: ProjectsListProps) {
    const [projects, setProjects] = useState<ProjectWithStats[]>([]);
    const [loading, setLoading] = useState(true);
    const [createDialogOpen, setCreateDialogOpen] = useState(false);
    const router = useRouter();
    const { toast } = useToast();
    const { getToken } = useAuth();

    useEffect(() => {
        const initAuth = async () => {
            const token = await getToken();
            if (token) {
                setAuthToken(token);
                loadProjects();
            } else {
                setLoading(false);
            }
        };
        initAuth();
    }, [organizationId, getToken]);

    const loadProjects = async () => {
        try {
            const data = await getProjects(organizationId);
            setProjects(data);
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to load projects",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteProject = async (projectId: number) => {
        if (!confirm("Are you sure? Deployments in this project will be orphaned.")) return;

        try {
            await deleteProject(organizationId, projectId);
            toast({
                title: "Success",
                description: "Project deleted",
            });
            loadProjects();
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to delete project",
                variant: "destructive",
            });
        }
    };

    const canCreateProjects = ["owner", "admin", "member"].includes(currentUserRole);
    const canDeleteProjects = ["owner", "admin"].includes(currentUserRole);

    if (loading) {
        return <div className="text-center py-8">Loading projects...</div>;
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Projects ({projects.length})</h3>
                {canCreateProjects && (
                    <Button onClick={() => setCreateDialogOpen(true)}>
                        <Plus className="mr-2 h-4 w-4" />
                        Create Project
                    </Button>
                )}
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {projects.map((project) => (
                    <Card key={project.id} className="hover:shadow-md transition-shadow">
                        <CardHeader>
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <CardTitle className="text-lg">{project.name}</CardTitle>
                                    {project.description && (
                                        <CardDescription className="mt-1 line-clamp-2">
                                            {project.description}
                                        </CardDescription>
                                    )}
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center text-sm text-muted-foreground">
                                    <FolderKanban className="mr-2 h-4 w-4" />
                                    {project.deployment_count} {project.deployment_count === 1 ? "deployment" : "deployments"}
                                </div>
                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => router.push(`/projects/${project.id}`)}
                                    >
                                        View
                                    </Button>
                                    {canDeleteProjects && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleDeleteProject(project.id)}
                                        >
                                            <Trash2 className="h-4 w-4 text-destructive" />
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {projects.length === 0 && (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                        <FolderKanban className="h-12 w-12 text-muted-foreground mb-4" />
                        <h3 className="text-lg font-semibold mb-2">No projects yet</h3>
                        <p className="text-muted-foreground text-center mb-4">
                            Create your first project to organize your deployments
                        </p>
                        {canCreateProjects && (
                            <Button onClick={() => setCreateDialogOpen(true)}>
                                <Plus className="mr-2 h-4 w-4" />
                                Create Project
                            </Button>
                        )}
                    </CardContent>
                </Card>
            )}

            <CreateProjectDialog
                organizationId={organizationId}
                open={createDialogOpen}
                onOpenChange={setCreateDialogOpen}
                onSuccess={loadProjects}
            />
        </div>
    );
}
