// Provider CRUD API Client

const API_BASE_URL = "http://localhost:8000";

export interface ProviderCreate {
    name: string;
    type: "local" | "runpod" | "vastai";
    api_key?: string;
    config_json?: string;
    is_enabled: boolean;
    display_name?: string;
}

export interface ProviderUpdate {
    name?: string;
    api_key?: string;
    config_json?: string;
    is_enabled?: boolean;
    display_name?: string;
    weight?: number;
}

export interface ProviderResponse {
    id: number;
    name: string;
    type: "local" | "runpod" | "vastai" | "vast";
    is_enabled: boolean;
    display_name: string | null;
    api_key?: string;
    weight: number;
    created_at: string;
    updated_at: string;
}

export async function listProviders(): Promise<ProviderResponse[]> {
    const response = await fetch(`${API_BASE_URL}/api/v1/admin/providers`);
    if (!response.ok) throw new Error('Failed to fetch providers');
    return response.json();
}

export async function getProvider(id: number): Promise<ProviderResponse> {
    const response = await fetch(`${API_BASE_URL}/api/v1/admin/providers/${id}`);
    if (!response.ok) throw new Error('Failed to fetch provider');
    return response.json();
}

export async function createProvider(data: ProviderCreate): Promise<ProviderResponse> {
    const response = await fetch(`${API_BASE_URL}/api/v1/admin/providers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to create provider');
    }
    return response.json();
}

export async function updateProvider(id: number, data: ProviderUpdate): Promise<ProviderResponse> {
    const response = await fetch(`${API_BASE_URL}/api/v1/admin/providers/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: 'Failed to update provider' }));
        throw new Error(error.detail || 'Failed to update provider');
    }
    return response.json();
}

export async function deleteProvider(id: number): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/api/v1/admin/providers/${id}`, {
        method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete provider');
}
