import { API_BASE_URL, getHeaders } from "./api";

export interface SettingItem {
    key: string;
    value: string;
    description: string | null;
    is_secret: boolean;
}

// API Functions
export async function getAllSettings(includeSecrets = false): Promise<SettingItem[]> {
    const response = await fetch(`${API_BASE_URL}/admin/settings?include_secrets=${includeSecrets}`, {
        headers: getHeaders()
    });
    if (!response.ok) throw new Error('Failed to fetch settings');
    return response.json();
}

export async function getSetting(key: string, includeSecret = false): Promise<SettingItem> {
    const response = await fetch(`${API_BASE_URL}/admin/settings/${key}?include_secret=${includeSecret}`, {
        headers: getHeaders()
    });
    if (!response.ok) throw new Error('Failed to fetch setting');
    return response.json();
}

export async function updateSetting(key: string, value: string) {
    const response = await fetch(`${API_BASE_URL}/admin/settings/${key}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({ value }),
    });
    if (!response.ok) throw new Error('Failed to update setting');
    return response.json();
}

export async function bulkUpdateSettings(settings: Record<string, string>) {
    const response = await fetch(`${API_BASE_URL}/admin/settings/bulk`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ settings }),
    });
    if (!response.ok) throw new Error('Failed to bulk update settings');
    return response.json();
}

export async function getSettingsByCategory(category: 'platform' | 'pricing' | 'features' | 'limits'): Promise<SettingItem[]> {
    const response = await fetch(`${API_BASE_URL}/admin/settings/category/${category}`, {
        headers: getHeaders()
    });
    if (!response.ok) throw new Error('Failed to fetch settings by category');
    return response.json();
}
