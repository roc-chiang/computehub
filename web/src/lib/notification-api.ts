/**
 * Notification API Client
 * Handles notification settings, history, and Telegram bindin
 */

import { getHeaders, API_BASE_URL } from "./api"; // Import standardized URL

// Removed local API_BASE definition

// ... Types ...
// (I will not replace types, just the usage. Wait, replace_file_content replaces specific chunks or can replace whole file. 
// I should use multi_replace for efficiency and precision)
// Let me switch to multi_replace for this file as it's large and I only need to change specific lines.


// ============================================================================
// Types
// ============================================================================

export interface NotificationSettings {
    telegram_chat_id?: string;
    telegram_username?: string;
    email?: string;
    enable_telegram: boolean;
    enable_email: boolean;
    enable_deployment_success: boolean;
    enable_deployment_failure: boolean;
    enable_instance_down: boolean;
    enable_cost_alert: boolean;
    enable_price_change: boolean;
    cost_alert_threshold: number;
}

export interface NotificationSettingsUpdate {
    email?: string;
    enable_telegram?: boolean;
    enable_email?: boolean;
    enable_deployment_success?: boolean;
    enable_deployment_failure?: boolean;
    enable_instance_down?: boolean;
    enable_cost_alert?: boolean;
    enable_price_change?: boolean;
    cost_alert_threshold?: number;
}

export interface TelegramBindResponse {
    bind_token: string;
    bot_username: string;
    bind_url: string;
    expires_at: string;
}

export interface TelegramStatus {
    is_bound: boolean;
    chat_id?: string;
    username?: string;
    bound_at?: string;
}

export interface NotificationHistoryItem {
    id: number;
    event_type: string;
    channel: string;
    title?: string;
    message?: string;
    status: string;
    error_message?: string;
    created_at: string;
}

export interface NotificationHistoryResponse {
    total: number;
    items: NotificationHistoryItem[];
}

// ============================================================================
// API Functions
// ============================================================================

/**
 * Get notification settings
 */
export async function getNotificationSettings(token: string): Promise<NotificationSettings> {
    const response = await fetch(`${API_BASE_URL}/notifications/settings`, {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        },
    });

    if (!response.ok) {
        throw new Error('Failed to fetch notification settings');
    }

    return response.json();
}

/**
 * Update notification settings
 */
export async function updateNotificationSettings(
    token: string,
    update: NotificationSettingsUpdate
): Promise<NotificationSettings> {
    const response = await fetch(`${API_BASE_URL}/notifications/settings`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(update),
    });

    if (!response.ok) {
        throw new Error('Failed to update notification settings');
    }

    return response.json();
}

/**
 * Create Telegram bind token
 */
export async function createTelegramBindToken(token: string): Promise<TelegramBindResponse> {
    const response = await fetch(`${API_BASE_URL}/notifications/telegram/bind`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        },
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to create bind token');
    }

    return response.json();
}

/**
 * Get Telegram binding status
 */
export async function getTelegramStatus(token: string): Promise<TelegramStatus> {
    const response = await fetch(`${API_BASE_URL}/notifications/telegram/status`, {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        },
    });

    if (!response.ok) {
        throw new Error('Failed to fetch Telegram status');
    }

    return response.json();
}

/**
 * Unbind Telegram
 */
export async function unbindTelegram(token: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/notifications/telegram/unbind`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        },
    });

    if (!response.ok) {
        throw new Error('Failed to unbind Telegram');
    }
}

/**
 * Get notification history
 */
export async function getNotificationHistory(
    token: string,
    limit: number = 50,
    offset: number = 0,
    channel?: string,
    status?: string
): Promise<NotificationHistoryResponse> {
    const params = new URLSearchParams({
        limit: limit.toString(),
        offset: offset.toString(),
    });

    if (channel) params.append('channel', channel);
    if (status) params.append('status', status);

    const response = await fetch(
        `${API_BASE_URL}/notifications/history?${params}`,
        {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
        }
    );

    if (!response.ok) {
        throw new Error('Failed to fetch notification history');
    }

    return response.json();
}

/**
 * Send test notification
 */
export async function sendTestNotification(token: string, channel: string): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/notifications/test`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ channel }),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to send test notification');
    }

    return response.json();
}
