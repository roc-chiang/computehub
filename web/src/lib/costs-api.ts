/**
 * Cost tracking API client
 */

import { getHeaders, API_BASE_URL } from "./api";

export interface CostSummary {
    total_all_time: number;
    total_this_month: number;
    total_this_week: number;
    total_today: number;
    active_cost_per_hour: number;
    projected_monthly: number;
    currency: string;
}

export interface TimelinePoint {
    date: string;
    cost: number;
}

export interface CostBreakdownItem {
    gpu_type?: string;
    provider?: string;
    cost: number;
    percentage: number;
}

export interface CostBreakdown {
    by_gpu_type: CostBreakdownItem[];
    by_provider: CostBreakdownItem[];
}

export async function getCostSummary(): Promise<CostSummary> {
    const res = await fetch(`${API_BASE_URL}/costs/summary`, {
        headers: getHeaders(),
    });
    if (!res.ok) throw new Error("Failed to fetch cost summary");
    return res.json();
}

export async function getCostTimeline(days: number = 30): Promise<TimelinePoint[]> {
    const res = await fetch(`${API_BASE_URL}/costs/timeline?days=${days}`, {
        headers: getHeaders(),
    });
    if (!res.ok) throw new Error("Failed to fetch cost timeline");
    return res.json();
}

export async function getCostBreakdown(): Promise<CostBreakdown> {
    const res = await fetch(`${API_BASE_URL}/costs/breakdown`, {
        headers: getHeaders(),
    });
    if (!res.ok) throw new Error("Failed to fetch cost breakdown");
    return res.json();
}
