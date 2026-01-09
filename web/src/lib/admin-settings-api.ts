// Use absolute URL for API calls in production
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';

export interface SettingItem {
    key: string;
    value: string;
    description: string | null;
    is_secret: boolean;
}

// API Functions
export async function getAllSettings(includeSecrets = false): Promise<SettingItem[]> {
    const response = await fetch(`${API_BASE_URL}/api/v1/admin/settings?include_secrets=${includeSecrets}`);
    if (!response.ok) throw new Error('Failed to fetch settings');
    return response.json();
}

export async function getSetting(key: string, includeSecret = false): Promise<SettingItem> {
    const response = await fetch(`${API_BASE_URL}/api/v1/admin/settings/${key}?include_secret=${includeSecret}`);
    if (!response.ok) throw new Error('Failed to fetch setting');
    return response.json();
}

export async function updateSetting(key: string, value: string) {
    const response = await fetch(`${API_BASE_URL}/api/v1/admin/settings/${key}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value }),
    });
    if (!response.ok) throw new Error('Failed to update setting');
    return response.json();
}

export async function bulkUpdateSettings(settings: Record<string, string>) {
    const response = await fetch(`${API_BASE_URL}/api/v1/admin/settings/bulk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings }),
    });
    if (!response.ok) throw new Error('Failed to bulk update settings');
    return response.json();
}

export async function getSettingsByCategory(category: 'platform' | 'pricing' | 'features' | 'limits'): Promise<SettingItem[]> {
    const response = await fetch(`${API_BASE_URL}/api/v1/admin/settings/category/${category}`);
    if (!response.ok) throw new Error('Failed to fetch settings by category');
    return response.json();
}
