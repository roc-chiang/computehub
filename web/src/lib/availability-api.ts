import { API_BASE_URL } from "./api";

export interface ProviderAvailability {
    available: boolean;
    count: number;
    price_per_hour: number;
    regions: string[];
    cached: boolean;
    checked_at: string;
    error?: string;
}

export interface GPUAlternative {
    gpu: string;
    performance_ratio: number;
    use_case: string;
}

export interface AvailabilityResponse {
    gpu_type: string;
    availability: Record<string, ProviderAvailability>;
    alternatives: GPUAlternative[];
}

export async function checkGPUAvailability(
    token: string,
    gpuType: string,
    providers?: string[]
): Promise<AvailabilityResponse> {
    const params = new URLSearchParams({ gpu_type: gpuType });
    if (providers && providers.length > 0) {
        params.append("providers", providers.join(","));
    }

    const response = await fetch(
        `${API_BASE_URL}/availability/check?${params}`,
        {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        }
    );

    if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: "Failed to check availability" }));
        throw new Error(error.detail || "Failed to check availability");
    }

    return response.json();
}

export async function clearAvailabilityCache(token: string): Promise<{ message: string; cleared_count: number }> {
    const response = await fetch(
        `${API_BASE_URL}/availability/clear-cache`,
        {
            method: "POST",
            headers: {
                Authorization: `Bearer ${token}`,
            },
        }
    );

    if (!response.ok) {
        throw new Error("Failed to clear cache");
    }

    return response.json();
}
