/**
 * Subscription API Client
 * Handles subscription management, checkout, and billing
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export interface Subscription {
    user_id: string;
    tier: 'basic' | 'pro' | 'team' | 'enterprise';
    status: string;
    current_period_end: string | null;
    cancel_at_period_end: boolean;
    features: Record<string, any>;
}

export interface CheckoutSession {
    checkout_url: string;
    session_id: string;
}

export interface PortalSession {
    portal_url: string;
}

/**
 * Get current user's subscription
 */
export async function getCurrentSubscription(): Promise<Subscription> {
    const response = await fetch(`${API_BASE}/api/v1/subscriptions/current`, {
        headers: {
            'Content-Type': 'application/json',
        },
        credentials: 'include',
    });

    if (!response.ok) {
        throw new Error('Failed to fetch subscription');
    }

    return response.json();
}

/**
 * Create checkout session for upgrade
 */
export async function createCheckoutSession(tier: 'pro' | 'team' | 'enterprise'): Promise<CheckoutSession> {
    const response = await fetch(`${API_BASE}/api/v1/subscriptions/checkout`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ tier }),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to create checkout session');
    }

    return response.json();
}

/**
 * Create customer portal session
 */
export async function createPortalSession(): Promise<PortalSession> {
    const response = await fetch(`${API_BASE}/api/v1/subscriptions/portal`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        credentials: 'include',
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to create portal session');
    }

    return response.json();
}

/**
 * Cancel subscription
 */
export async function cancelSubscription(immediate: boolean = false): Promise<any> {
    const response = await fetch(`${API_BASE}/api/v1/subscriptions/cancel`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ immediate }),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to cancel subscription');
    }

    return response.json();
}
