export const API_BASE_URL = `${process.env.NEXT_PUBLIC_API_URL || ''}/api/v1`;
console.log('[API] API_BASE_URL:', API_BASE_URL, 'NEXT_PUBLIC_API_URL:', process.env.NEXT_PUBLIC_API_URL);

let authToken: string | null = null;

export function setAuthToken(token: string | null) {
    authToken = token;
}

export function getHeaders() {
    const headers: Record<string, string> = {
        "Content-Type": "application/json",
    };
    if (authToken) {
        headers["Authorization"] = `Bearer ${authToken}`;
    }
    return headers;
}

export interface Deployment {
    id: number;
    name: string;
    provider: string;
    status: string;
    gpu_type: string;
    gpu_count: number;
    endpoint_url?: string;
    ssh_connection_string?: string;
    ssh_password?: string;
    image: string;
    instance_id?: string;
    vcpu_count?: number;
    ram_gb?: number;
    storage_gb?: number;
    uptime_seconds?: number;
    gpu_utilization?: number;
    gpu_memory_utilization?: number;
    // Team Collaboration (Phase 14+)
    organization_id?: number;
    project_id?: number;
    organization_name?: string;
    project_name?: string;
    created_at: string;
}

export interface DeploymentCreate {
    name: string;
    provider: string;
    gpu_type: string;
    image: string;
    gpu_count: number;
    template_type?: string;
    // Team Collaboration (Phase 14+)
    organization_id?: number;
    project_id?: number;
}

export async function getDeployments(): Promise<Deployment[]> {
    // In a real app, we would list deployments. 
    // Since our API currently only gets by ID, we might need to add a list endpoint.
    // For MVP, let's just mock a list or try to fetch a few known IDs if we can't list.
    // WAIT: I missed adding a list endpoint in the backend plan!
    // I will add a list endpoint to the backend now as well, or just mock it here for a second.
    // Let's assume I will add GET /deployments/ to backend.
    const res = await fetch(`${API_BASE_URL}/deployments/`, { headers: getHeaders() });
    if (!res.ok) throw new Error("Failed to fetch deployments");
    return res.json();
}

export async function getDeployment(id: number): Promise<Deployment> {
    const res = await fetch(`${API_BASE_URL}/deployments/${id}`, { headers: getHeaders() });
    if (!res.ok) throw new Error("Failed to fetch deployment");
    return res.json();
}

export async function createDeployment(data: DeploymentCreate): Promise<Deployment> {
    const res = await fetch(`${API_BASE_URL}/deployments/`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(data),
    });

    if (!res.ok) {
        // Try to parse error response
        const responseText = await res.text();
        console.log("Error response:", responseText);

        let errorDetail = null;

        // Try to parse as JSON
        try {
            const errorData = JSON.parse(responseText);
            console.log("Parsed error data:", errorData);
            errorDetail = errorData.detail;
        } catch (parseError) {
            console.error("Failed to parse JSON, treating as text error");

            // Extract provider name from error message if possible
            const providerMatch = responseText.match(/connect your (\w+) account/i);
            const provider = providerMatch ? providerMatch[1] : null;

            // Create error detail structure from text
            errorDetail = {
                error: "provider_not_connected",
                message: responseText,
                provider: provider
            };
        }

        // Now throw the error with proper structure (outside try-catch)
        const error: any = new Error(errorDetail?.message || "Failed to create deployment");
        error.response = { data: { detail: errorDetail } };
        throw error;
    }

    return res.json();
}

export async function deleteDeployment(id: number): Promise<void> {
    const res = await fetch(`${API_BASE_URL}/deployments/${id}`, {
        method: "DELETE",
        headers: getHeaders(),
    });
    if (!res.ok) throw new Error("Failed to delete deployment");
}

export async function stopDeployment(id: number): Promise<void> {
    const res = await fetch(`${API_BASE_URL}/deployments/${id}/stop`, {
        method: "POST",
        headers: getHeaders(),
    });
    if (!res.ok) {
        const error = await res.json().catch(() => ({ detail: "Failed to stop deployment" }));
        throw new Error(error.detail || "Failed to stop deployment");
    }
}

export async function startDeployment(id: number): Promise<void> {
    const res = await fetch(`${API_BASE_URL}/deployments/${id}/start`, {
        method: "POST",
        headers: getHeaders(),
    });
    if (!res.ok) {
        const error = await res.json().catch(() => ({ detail: "Failed to start deployment" }));
        throw new Error(error.detail || "Failed to start deployment");
    }
}

export async function restartDeployment(id: number): Promise<void> {
    const res = await fetch(`${API_BASE_URL}/deployments/${id}/restart`, {
        method: "POST",
        headers: getHeaders(),
    });
    if (!res.ok) throw new Error("Failed to restart deployment");
}

export interface ActivityLog {
    id: number;
    deployment_id: number;
    action: string;
    status: string;
    details: string;
    created_at: string;
}

export async function getDeploymentLogs(id: number): Promise<{ logs: string }> {
    const res = await fetch(`${API_BASE_URL}/deployments/${id}/logs`, { headers: getHeaders() });
    if (!res.ok) throw new Error("Failed to fetch deployment logs");
    return res.json();
}

export async function getDeploymentActivity(id: number): Promise<ActivityLog[]> {
    const res = await fetch(`${API_BASE_URL}/deployments/${id}/activity`, { headers: getHeaders() });
    if (!res.ok) throw new Error("Failed to fetch deployment activity");
    return res.json();
}

export interface FileItem {
    name: string;
    size: string;
    type: "file" | "directory";
    permissions: string;
    modified: string;
}

export async function getDeploymentFiles(id: number, path: string = "/workspace"): Promise<FileItem[]> {
    const res = await fetch(`${API_BASE_URL}/deployments/${id}/files?path=${encodeURIComponent(path)}`, { headers: getHeaders() });
    if (!res.ok) throw new Error("Failed to fetch files");
    return res.json();
}

export async function getDeploymentFileContent(id: number, path: string): Promise<{ content: string }> {
    const res = await fetch(`${API_BASE_URL}/deployments/${id}/files/content?path=${encodeURIComponent(path)}`, { headers: getHeaders() });
    if (!res.ok) throw new Error("Failed to fetch file content");
    return res.json();
}

export interface UsageStats {
    uptime_seconds: number;
    uptime_hours: number;
    gpu_count: number;
    gpu_type: string;
    total_gpu_hours: number;
    cost_per_gpu_hour: number;
    cost_per_hour: number;
    estimated_cost_usd: number;
    status: string;
}

export async function getDeploymentUsageStats(id: number): Promise<UsageStats> {
    const res = await fetch(`${API_BASE_URL}/deployments/${id}/usage-stats`, { headers: getHeaders() });
    if (!res.ok) throw new Error("Failed to fetch usage stats");
    return res.json();
}

// Admin APIs

export interface Provider {
    id: number;
    name: string;
    type: string;
    api_key?: string;
    config_json?: string;
    is_enabled: boolean;
    weight: number;
    created_at: string;
}

export interface ProviderCreate {
    name: string;
    type: string;
    api_key?: string;
    config_json?: string;
    is_enabled?: boolean;
    weight?: number;
}

export async function getProviders(): Promise<Provider[]> {
    const res = await fetch(`${API_BASE_URL}/admin/providers`, { headers: getHeaders() });
    if (!res.ok) throw new Error("Failed to fetch providers");
    return res.json();
}


export async function createProvider(data: ProviderCreate): Promise<Provider> {
    const res = await fetch(`${API_BASE_URL}/admin/providers`, {
        method: "POST",
        headers: getHeaders(),

        body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to create provider");
    return res.json();
}

export async function updateProvider(id: number, data: Partial<ProviderCreate>): Promise<Provider> {
    const res = await fetch(`${API_BASE_URL}/admin/providers/${id}`, {
        method: "PUT",
        headers: getHeaders(),
        body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to update provider");
    return res.json();
}

export async function deleteProvider(id: number): Promise<void> {
    const res = await fetch(`${API_BASE_URL}/admin/providers/${id}`, {
        method: "DELETE",
        headers: getHeaders(),
    });
    if (!res.ok) throw new Error("Failed to delete provider");
}

export interface SystemSetting {
    key: string;
    value: string;
    description?: string;
    is_secret: boolean;
    updated_at: string;
}

export async function getSettings(): Promise<SystemSetting[]> {
    const res = await fetch(`${API_BASE_URL}/admin/settings`, { headers: getHeaders() });
    if (!res.ok) throw new Error("Failed to fetch settings");
    return res.json();
}

export async function updateSetting(data: Partial<SystemSetting> & { key: string }): Promise<SystemSetting> {
    const res = await fetch(`${API_BASE_URL}/admin/settings`, {
        method: "POST",
        headers: getHeaders(),

        body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to update setting");
    return res.json();
}

// Pricing APIs

export interface ProviderPrice {
    name: string;
    display_name?: string;
    price_per_hour: number | null;
    available: boolean;
    currency: string;
    is_test?: boolean;
}

export interface PriceComparison {
    gpu_type: string;
    providers: ProviderPrice[];
    recommended: string | null;
    cached_at: string;
    error?: string;
}

export async function comparePrices(gpuType: string): Promise<PriceComparison> {
    const res = await fetch(`${API_BASE_URL}/pricing/compare?gpu_type=${encodeURIComponent(gpuType)}`, {
        headers: getHeaders()
    });
    if (!res.ok) throw new Error("Failed to fetch price comparison");
    return res.json();
}
