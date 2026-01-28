/**
 * Batch Operations API Client
 */

import { getHeaders, API_BASE_URL } from "./api";

export interface BatchOperationResult {
    success: number[];
    failed: Array<{ id: number; error: string }>;
}

export async function batchStartDeployments(deploymentIds: number[]): Promise<BatchOperationResult> {
    const res = await fetch(`${API_BASE_URL}/deployments/batch/start`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({ deployment_ids: deploymentIds }),
    });
    if (!res.ok) throw new Error("Failed to start deployments");
    return res.json();
}

export async function batchStopDeployments(deploymentIds: number[]): Promise<BatchOperationResult> {
    const res = await fetch(`${API_BASE_URL}/deployments/batch/stop`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({ deployment_ids: deploymentIds }),
    });
    if (!res.ok) throw new Error("Failed to stop deployments");
    return res.json();
}

export async function batchDeleteDeployments(deploymentIds: number[]): Promise<BatchOperationResult> {
    const res = await fetch(`${API_BASE_URL}/deployments/batch/delete`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({ deployment_ids: deploymentIds }),
    });
    if (!res.ok) throw new Error("Failed to delete deployments");
    return res.json();
}
