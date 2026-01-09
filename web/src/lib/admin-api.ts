import { User, Deployment } from "./api";

// Use absolute URL for API calls in production
const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

export interface UserListItem {
    id: number;
    email: string;
    clerk_id: string | null;
    plan: string;
    created_at: string;
    total_deployments: number;
    active_deployments: number;
    total_cost: number;
    last_active: string | null;
}

export interface UserStats {
    total_deployments: number;
    active_deployments: number;
    total_gpu_hours: number;
    total_cost: number;
    last_active: string | null;
}

export interface UserDetail {
    id: number;
    email: string;
    clerk_id: string | null;
    auth_provider: string;
    plan: string;
    created_at: string;
    stats: UserStats;
}

// Platform Statistics
export interface PlatformStats {
    users: {
        total: number;
        by_plan: {
            free: number;
            pro: number;
            team: number;
            enterprise: number;
        };
        new_this_week: number;
    };
    deployments: {
        total: number;
        active: number;
        by_status: {
            running: number;
            stopped: number;
            creating: number;
            error: number;
            deleted: number;
        };
    };
    usage: {
        total_gpu_hours: number;
        total_cost: number;
    };
    revenue: {
        total: number;
        this_month: number;
    };
    providers: {
        total: number;
        enabled: number;
    };
}

export interface ActivityItem {
    type: string;
    timestamp: string;
    description: string;
    user_email?: string;
    plan?: string;
    deployment_name?: string;
    gpu_type?: string;
}

// API Functions
export async function getUsers(params?: {
    search?: string;
    plan?: string;
    skip?: number;
    limit?: number;
}): Promise<UserListItem[]> {
    const queryParams = new URLSearchParams();
    if (params?.search) queryParams.append('search', params.search);
    if (params?.plan) queryParams.append('plan', params.plan);
    if (params?.skip !== undefined) queryParams.append('skip', params.skip.toString());
    if (params?.limit !== undefined) queryParams.append('limit', params.limit.toString());

    const response = await fetch(`${API_URL}/api/v1/admin/users?${queryParams}`);
    if (!response.ok) throw new Error('Failed to fetch users');
    return response.json();
}

export async function getUserDetails(userId: number): Promise<UserDetail> {
    const response = await fetch(`${API_URL}/api/v1/admin/users/${userId}`);
    if (!response.ok) throw new Error('Failed to fetch user details');
    return response.json();
}

export async function updateUser(userId: number, data: { plan?: string; email?: string }) {
    const response = await fetch(`${API_URL}/api/v1/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to update user');
    return response.json();
}

export async function disableUser(userId: number) {
    const response = await fetch(`${API_URL}/api/v1/admin/users/${userId}/disable`, {
        method: 'POST',
    });
    if (!response.ok) throw new Error('Failed to disable user');
    return response.json();
}

export async function enableUser(userId: number) {
    const response = await fetch(`${API_URL}/api/v1/admin/users/${userId}/enable`, {
        method: 'POST',
    });
    if (!response.ok) throw new Error('Failed to enable user');
    return response.json();
}

export async function getUserDeployments(userId: number, limit = 10): Promise<Deployment[]> {
    const response = await fetch(`${API_URL}/api/v1/admin/users/${userId}/deployments?limit=${limit}`);
    if (!response.ok) throw new Error('Failed to fetch user deployments');
    return response.json();
}

export async function getPlatformStats(): Promise<PlatformStats> {
    const response = await fetch(`${API_URL}/api/v1/admin/stats`);
    if (!response.ok) throw new Error('Failed to fetch platform stats');
    return response.json();
}

export async function getRecentActivity(limit = 10): Promise<ActivityItem[]> {
    const response = await fetch(`${API_URL}/api/v1/admin/activity/recent?limit=${limit}`);
    if (!response.ok) throw new Error('Failed to fetch recent activity');
    return response.json();
}

id: number;
email: string;
clerk_id: string | null;
plan: string;
created_at: string;
total_deployments: number;
active_deployments: number;
total_cost: number;
last_active: string | null;
}

export interface UserStats {
    total_deployments: number;
    active_deployments: number;
    total_gpu_hours: number;
    total_cost: number;
    last_active: string | null;
}

export interface UserDetail {
    id: number;
    email: string;
    clerk_id: string | null;
    auth_provider: string;
    plan: string;
    created_at: string;
    stats: UserStats;
}

// Platform Statistics
export interface PlatformStats {
    users: {
        total: number;
        by_plan: {
            free: number;
            pro: number;
            team: number;
            enterprise: number;
        };
        new_this_week: number;
    };
    deployments: {
        total: number;
        active: number;
        by_status: {
            running: number;
            stopped: number;
            creating: number;
            error: number;
            deleted: number;
        };
    };
    usage: {
        total_gpu_hours: number;
        total_cost: number;
    };
    revenue: {
        total: number;
        this_month: number;
    };
    providers: {
        total: number;
        enabled: number;
    };
}

export interface ActivityItem {
    type: string;
    timestamp: string;
    description: string;
    user_email?: string;
    plan?: string;
    deployment_name?: string;
    gpu_type?: string;
}

// API Functions
export async function getUsers(params?: {
    search?: string;
    plan?: string;
    skip?: number;
    limit?: number;
}): Promise<UserListItem[]> {
    const queryParams = new URLSearchParams();
    if (params?.search) queryParams.append('search', params.search);
    if (params?.plan) queryParams.append('plan', params.plan);
    if (params?.skip !== undefined) queryParams.append('skip', params.skip.toString());
    if (params?.limit !== undefined) queryParams.append('limit', params.limit.toString());

    const response = await fetch(`/api/v1/admin/users?${queryParams}`);
    if (!response.ok) throw new Error('Failed to fetch users');
    return response.json();
}

export async function getUserDetails(userId: number): Promise<UserDetail> {
    const response = await fetch(`/api/v1/admin/users/${userId}`);
    if (!response.ok) throw new Error('Failed to fetch user details');
    return response.json();
}

export async function updateUser(userId: number, data: { plan?: string; email?: string }) {
    const response = await fetch(`/api/v1/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to update user');
    return response.json();
}

export async function disableUser(userId: number) {
    const response = await fetch(`/api/v1/admin/users/${userId}/disable`, {
        method: 'POST',
    });
    if (!response.ok) throw new Error('Failed to disable user');
    return response.json();
}

export async function enableUser(userId: number) {
    const response = await fetch(`/api/v1/admin/users/${userId}/enable`, {
        method: 'POST',
    });
    if (!response.ok) throw new Error('Failed to enable user');
    return response.json();
}

export async function getUserDeployments(userId: number, limit = 10): Promise<Deployment[]> {
    const response = await fetch(`/api/v1/admin/users/${userId}/deployments?limit=${limit}`);
    if (!response.ok) throw new Error('Failed to fetch user deployments');
    return response.json();
}

export async function getPlatformStats(): Promise<PlatformStats> {
    const response = await fetch('/api/v1/admin/stats');
    if (!response.ok) throw new Error('Failed to fetch platform stats');
    return response.json();
}

export async function getRecentActivity(limit = 10): Promise<ActivityItem[]> {
    const response = await fetch(`/api/v1/admin/activity/recent?limit=${limit}`);
    if (!response.ok) throw new Error('Failed to fetch recent activity');
    return response.json();
}
