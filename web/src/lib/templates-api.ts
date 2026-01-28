/**
 * Deployment Templates API Client
 */

import { getHeaders, API_BASE_URL } from "./api";

export interface DeploymentTemplate {
    id: number;
    user_id: string;
    name: string;
    description: string | null;
    gpu_type: string;
    gpu_count: number;
    provider: string | null;
    image: string;
    vcpu_count: number | null;
    ram_gb: number | null;
    storage_gb: number | null;
    env_vars: string | null;
    created_at: string;
    updated_at: string;
}

export interface CreateTemplateRequest {
    name: string;
    description?: string;
    gpu_type: string;
    gpu_count: number;
    provider?: string;
    image: string;
    vcpu_count?: number;
    ram_gb?: number;
    storage_gb?: number;
    env_vars?: string;
}

export async function getTemplates(): Promise<DeploymentTemplate[]> {
    const res = await fetch(`${API_BASE_URL}/templates/my`, {
        headers: getHeaders(),
    });
    if (!res.ok) throw new Error("Failed to fetch templates");
    return res.json();
}

export async function createTemplate(data: CreateTemplateRequest): Promise<DeploymentTemplate> {
    const res = await fetch(`${API_BASE_URL}/deployment-templates`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(data),
    });
    if (!res.ok) {
        const error = await res.json();
        throw new Error(error.detail || "Failed to create template");
    }
    return res.json();
}

export async function updateTemplate(id: number, data: Partial<CreateTemplateRequest>): Promise<DeploymentTemplate> {
    const res = await fetch(`${API_BASE_URL}/deployment-templates/${id}`, {
        method: "PATCH",
        headers: getHeaders(),
        body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to update template");
    return res.json();
}

export async function deleteTemplate(id: number): Promise<void> {
    const res = await fetch(`${API_BASE_URL}/deployment-templates/${id}`, {
        method: "DELETE",
        headers: getHeaders(),
    });
    if (!res.ok) throw new Error("Failed to delete template");
}
