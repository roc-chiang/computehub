"use client";

import { useAuth } from "@clerk/nextjs";
import { setAuthToken } from "@/lib/api";

import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { getOrganizations, getProjects, type OrganizationWithStats, type ProjectWithStats } from "@/lib/organization-api";

interface OrganizationProjectSelectorProps {
    organizationId?: number;
    projectId?: number;
    onOrganizationChange: (orgId: number | undefined) => void;
    onProjectChange: (projectId: number | undefined) => void;
}

export function OrganizationProjectSelector({
    organizationId,
    projectId,
    onOrganizationChange,
    onProjectChange,
}: OrganizationProjectSelectorProps) {
    const [organizations, setOrganizations] = useState<OrganizationWithStats[]>([]);
    const [projects, setProjects] = useState<ProjectWithStats[]>([]);
    const [loading, setLoading] = useState(true);
    const [projectsLoading, setProjectsLoading] = useState(false);
    const { getToken } = useAuth();

    // Load organizations on mount
    useEffect(() => {
        const loadOrganizations = async () => {
            try {
                const token = await getToken();
                if (token) {
                    setAuthToken(token);
                }
                const orgs = await getOrganizations();
                setOrganizations(orgs);

                // Smart default selection: auto-select if only one organization
                if (orgs.length === 1 && !organizationId) {
                    const defaultOrg = orgs[0];
                    onOrganizationChange(defaultOrg.id);
                }
            } catch (error) {
                console.error("Failed to load organizations:", error);
            } finally {
                setLoading(false);
            }
        };
        loadOrganizations();
    }, [getToken]);

    // Load projects when organization changes
    useEffect(() => {
        const loadProjects = async () => {
            if (!organizationId) {
                setProjects([]);
                onProjectChange(undefined);
                return;
            }

            setProjectsLoading(true);
            try {
                const token = await getToken();
                if (token) {
                    setAuthToken(token);
                }
                const projs = await getProjects(organizationId);
                setProjects(projs);

                // Smart default selection
                if (projs.length === 1 && !projectId) {
                    // Auto-select if only one project
                    onProjectChange(projs[0].id);
                } else if (projs.length > 1 && !projectId) {
                    // Default to "Default Project" if exists
                    const defaultProject = projs.find(p => p.name.toLowerCase().includes("default"));
                    if (defaultProject) {
                        onProjectChange(defaultProject.id);
                    }
                }
            } catch (error) {
                console.error("Failed to load projects:", error);
            } finally {
                setProjectsLoading(false);
            }
        };
        loadProjects();
    }, [organizationId, getToken]);

    if (loading) {
        return <div className="text-sm text-text-secondary">Loading organizations...</div>;
    }

    // Hide selector if only one organization and one project (fully automatic)
    const shouldShowOrganizationSelector = organizations.length > 1;
    const shouldShowProjectSelector = projects.length > 1;

    if (!shouldShowOrganizationSelector && !shouldShowProjectSelector) {
        // Fully automatic - show nothing
        return null;
    }

    return (
        <div className="space-y-4">
            {shouldShowOrganizationSelector && (
                <div className="space-y-2">
                    <Label htmlFor="organization">Organization</Label>
                    <Select
                        value={organizationId?.toString()}
                        onValueChange={(value) => onOrganizationChange(parseInt(value))}
                    >
                        <SelectTrigger id="organization">
                            <SelectValue placeholder="Select organization" />
                        </SelectTrigger>
                        <SelectContent>
                            {organizations.map((org) => (
                                <SelectItem key={org.id} value={org.id.toString()}>
                                    {org.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            )}

            {organizationId && shouldShowProjectSelector && (
                <div className="space-y-2">
                    <Label htmlFor="project">Project</Label>
                    <Select
                        value={projectId?.toString()}
                        onValueChange={(value) => onProjectChange(parseInt(value))}
                        disabled={projectsLoading}
                    >
                        <SelectTrigger id="project">
                            <SelectValue placeholder={projectsLoading ? "Loading..." : "Select project"} />
                        </SelectTrigger>
                        <SelectContent>
                            {projects.map((project) => (
                                <SelectItem key={project.id} value={project.id.toString()}>
                                    {project.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            )}
        </div>
    );
}
