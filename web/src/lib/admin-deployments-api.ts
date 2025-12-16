import { Deployment } from "./api";

export interface DeploymentListItem {
    id: number;
    name: string;
    user_id: number;
    user_email: string;
    provider: string;
    gpu_type: string;
    status: string;
    created_at: string;
    uptime_seconds: number | null;
    estimated_cost: number;
}

export interface DeploymentStats {
    total_deployments: number;
    active_deployments: number;
    total_gpu_hours: number;
    total_cost: number;
}

// API Functions
export async function getAllDeployments(params?: {
    search?: string;
    status?: string;
    provider?: string;
    user_id?: number;
    skip?: number;
    limit?: number;
}): Promise<DeploymentListItem[]> {
    const queryParams = new URLSearchParams();
    if (params?.search) queryParams.append('search', params.search);
    if (params?.status) queryParams.append('status', params.status);
    if (params?.provider) queryParams.append('provider', params.provider);
    if (params?.user_id !== undefined) queryParams.append('user_id', params.user_id.toString());
    if (params?.skip !== undefined) queryParams.append('skip', params.skip.toString());
    if (params?.limit !== undefined) queryParams.append('limit', params.limit.toString());

    const response = await fetch(`/api/v1/admin/deployments?${queryParams}`);
    if (!response.ok) throw new Error('Failed to fetch deployments');
    return response.json();
}

export async function getDeploymentStats(): Promise<DeploymentStats> {
    const response = await fetch('/api/v1/admin/deployments/stats');
    if (!response.ok) throw new Error('Failed to fetch deployment stats');
    return response.json();
}

export async function batchDeploymentOperation(deploymentIds: number[], operation: 'stop' | 'delete') {
    const response = await fetch('/api/v1/admin/deployments/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            deployment_ids: deploymentIds,
            operation
        }),
    });
    if (!response.ok) throw new Error('Failed to perform batch operation');
    return response.json();
}

export async function stopDeployment(deploymentId: number) {
    const response = await fetch(`/api/v1/admin/deployments/${deploymentId}/stop`, {
        method: 'POST',
    });
    if (!response.ok) throw new Error('Failed to stop deployment');
    return response.json();
}

export async function deleteDeployment(deploymentId: number) {
    const response = await fetch(`/api/v1/admin/deployments/${deploymentId}`, {
        method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete deployment');
    return response.json();
}
