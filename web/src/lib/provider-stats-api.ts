// Provider Statistics Types and API

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';

export interface MonthlyData {
    month: string;
    hours: number;
    cost: number;
}

export interface DeploymentByStatus {
    running: number;
    stopped: number;
    creating: number;
    error: number;
    deleted: number;
}

export interface ProviderStats {
    provider_id: number;
    provider_name: string;
    total_deployments: number;
    active_deployments: number;
    total_gpu_hours: number;
    total_cost: number;
    avg_deployment_duration_hours: number;
    deployment_by_status: DeploymentByStatus;
    gpu_hours_by_month: MonthlyData[];
    cost_by_month: MonthlyData[];
}

export interface PerformanceOverTime {
    date: string;
    success_rate: number;
    avg_startup_time: number;
}

export interface RecentError {
    deployment_id: number;
    error_message: string;
    timestamp: string;
}

export interface ProviderMetrics {
    provider_id: number;
    provider_name: string;
    success_rate: number;
    avg_startup_time_seconds: number;
    error_rate: number;
    uptime_percentage: number;
    recent_errors: RecentError[];
    performance_over_time: PerformanceOverTime[];
}

export interface ProviderSummaryItem {
    id: number;
    name: string;
    enabled: boolean;
    total_deployments: number;
    active_deployments: number;
    total_gpu_hours: number;
    success_rate: number;
}

export interface ProvidersSummary {
    total_providers: number;
    enabled_providers: number;
    providers: ProviderSummaryItem[];
}

// API Functions

export async function getProviderStats(providerId: number): Promise<ProviderStats> {
    const response = await fetch(`${API_BASE_URL}/api/v1/admin/providers/${providerId}/stats`);
    if (!response.ok) throw new Error('Failed to fetch provider stats');
    return response.json();
}

export async function getProviderMetrics(providerId: number): Promise<ProviderMetrics> {
    const response = await fetch(`${API_BASE_URL}/api/v1/admin/providers/${providerId}/metrics`);
    if (!response.ok) throw new Error('Failed to fetch provider metrics');
    return response.json();
}

export async function getProvidersSummary(): Promise<ProvidersSummary> {
    const response = await fetch(`${API_BASE_URL}/api/v1/admin/providers/summary`);
    if (!response.ok) throw new Error('Failed to fetch providers summary');
    return response.json();
}
