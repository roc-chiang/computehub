// Enums
export enum TicketStatus {
    OPEN = "open",
    IN_PROGRESS = "in_progress",
    RESOLVED = "resolved",
    CLOSED = "closed"
}

export enum TicketPriority {
    LOW = "low",
    MEDIUM = "medium",
    HIGH = "high",
    URGENT = "urgent"
}

export enum TicketCategory {
    TECHNICAL = "technical",
    BILLING = "billing",
    FEATURE_REQUEST = "feature_request",
    BUG_REPORT = "bug_report",
    OTHER = "other"
}

// Interfaces
export interface TicketReply {
    id: number;
    ticket_id: number;
    author_id: string;
    author_email: string;
    is_admin: boolean;
    message: string;
    created_at: string;
}

export interface TicketListItem {
    id: number;
    user_id: number;
    user_email: string;
    subject: string;
    category: TicketCategory;
    priority: TicketPriority;
    status: TicketStatus;
    assigned_to: string | null;
    created_at: string;
    updated_at: string;
    reply_count: number;
}

export interface TicketDetail {
    id: number;
    user_id: number;
    user_email: string;
    subject: string;
    category: TicketCategory;
    priority: TicketPriority;
    status: TicketStatus;
    assigned_to: string | null;
    created_at: string;
    updated_at: string;
    resolved_at: string | null;
    closed_at: string | null;
    replies: TicketReply[];
}

export interface TicketStats {
    total: number;
    open: number;
    in_progress: number;
    resolved: number;
    closed: number;
    avg_response_time_hours: number | null;
}

export interface TicketUpdateRequest {
    status?: TicketStatus;
    priority?: TicketPriority;
    assigned_to?: string;
}

export interface ReplyRequest {
    message: string;
}

import { API_BASE_URL } from "./api";

// Admin API Functions
export async function getTicketStats(): Promise<TicketStats> {
    const response = await fetch(`${API_BASE_URL}/admin/tickets/stats`);
    if (!response.ok) throw new Error('Failed to fetch ticket stats');
    return response.json();
}

export async function getTickets(params?: {
    status?: TicketStatus;
    priority?: TicketPriority;
    category?: TicketCategory;
    assigned_to?: string;
    search?: string;
    skip?: number;
    limit?: number;
}): Promise<TicketListItem[]> {
    const queryParams = new URLSearchParams();
    if (params?.status) queryParams.append('status', params.status);
    if (params?.priority) queryParams.append('priority', params.priority);
    if (params?.category) queryParams.append('category', params.category);
    if (params?.assigned_to) queryParams.append('assigned_to', params.assigned_to);
    if (params?.search) queryParams.append('search', params.search);
    if (params?.skip !== undefined) queryParams.append('skip', params.skip.toString());
    if (params?.limit !== undefined) queryParams.append('limit', params.limit.toString());

    if (params?.limit !== undefined) queryParams.append('limit', params.limit.toString());

    const url = `${API_BASE_URL}/admin/tickets${queryParams.toString() ? `?${queryParams}` : ''}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch tickets');
    return response.json();
}

export async function getTicketDetail(ticketId: number): Promise<TicketDetail> {
    const response = await fetch(`${API_BASE_URL}/admin/tickets/${ticketId}`);
    if (!response.ok) throw new Error('Failed to fetch ticket detail');
    return response.json();
}

export async function updateTicket(ticketId: number, update: TicketUpdateRequest): Promise<TicketDetail> {
    const response = await fetch(`${API_BASE_URL}/admin/tickets/${ticketId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(update),
    });
    if (!response.ok) throw new Error('Failed to update ticket');
    return response.json();
}

export async function replyToTicket(ticketId: number, message: string): Promise<TicketReply> {
    const response = await fetch(`${API_BASE_URL}/admin/tickets/${ticketId}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message }),
    });
    if (!response.ok) throw new Error('Failed to reply to ticket');
    return response.json();
}
