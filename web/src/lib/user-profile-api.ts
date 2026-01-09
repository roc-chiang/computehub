/**
 * User Profile and Preferences API Client
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';

export interface UserPreferences {
    language: string;
    timezone: string;
    default_gpu_type: string | null;
    default_provider: string | null;
    theme: string;
}

export interface UserProfile {
    id: number;
    email: string;
    clerk_id: string | null;
    auth_provider: string;
    plan: string;
    preferences: UserPreferences;
    created_at: string;
}

export interface UpdatePreferencesRequest {
    language?: string;
    timezone?: string;
    default_gpu_type?: string | null;
    default_provider?: string | null;
    theme?: string;
}

/**
 * Get current user's profile
 */
export async function getUserProfile(token: string | null): Promise<UserProfile> {
    const response = await fetch(`${API_BASE_URL}/api/v1/user/profile`, {
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
    });

    if (!response.ok) {
        throw new Error('Failed to fetch user profile');
    }

    return response.json();
}

/**
 * Get current user's preferences
 */
export async function getUserPreferences(token: string | null): Promise<UserPreferences> {
    const response = await fetch(`${API_BASE_URL}/api/v1/user/preferences`, {
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
    });

    if (!response.ok) {
        throw new Error('Failed to fetch user preferences');
    }

    return response.json();
}

/**
 * Update current user's preferences
 */
export async function updateUserPreferences(
    token: string | null,
    preferences: UpdatePreferencesRequest
): Promise<UserPreferences> {
    const response = await fetch(`${API_BASE_URL}/api/v1/user/preferences`, {
        method: 'PATCH',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(preferences),
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: 'Failed to update preferences' }));
        throw new Error(error.detail || 'Failed to update preferences');
    }

    return response.json();
}
