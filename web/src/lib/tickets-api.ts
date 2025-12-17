// Re-export enums and types from admin-tickets-api
export { TicketStatus, TicketPriority, TicketCategory } from "./admin-tickets-api";
export type { TicketReply } from "./admin-tickets-api";

const API_BASE_URL = "http://localhost:8000";

// User-facing tickets API
export interface CreateTicketRequest {
    subject: string;
    category: TicketCategory;
    priority: TicketPriority;
    message: string;
}

export interface UserTicketListItem {
    id: number;
    subject: string;
    category: TicketCategory;
    priority: TicketPriority;
    status: TicketStatus;
    created_at: string;
    updated_at: string;
    reply_count: number;
    has_unread: boolean;
}

export interface UserTicketDetail {
    id: number;
    subject: string;
    category: TicketCategory;
    priority: TicketPriority;
    status: TicketStatus;
    created_at: string;
    updated_at: string;
    replies: TicketReply[];
}

// User API Functions
export async function createTicket(data: CreateTicketRequest): Promise<UserTicketDetail> {
    const response = await fetch(`${API_BASE_URL}/api/v1/tickets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to create ticket');
    return response.json();
}

export async function getMyTickets(status?: TicketStatus): Promise<UserTicketListItem[]> {
    const url = status
        ? `${API_BASE_URL}/api/v1/tickets?status=${status}`
        : `${API_BASE_URL}/api/v1/tickets`;
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch tickets');
    return response.json();
}

export async function getMyTicketDetail(ticketId: number): Promise<UserTicketDetail> {
    const response = await fetch(`${API_BASE_URL}/api/v1/tickets/${ticketId}`);
    if (!response.ok) throw new Error('Failed to fetch ticket detail');
    return response.json();
}

export async function replyToMyTicket(ticketId: number, message: string): Promise<TicketReply> {
    const response = await fetch(`${API_BASE_URL}/api/v1/tickets/${ticketId}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message }),
    });
    if (!response.ok) throw new Error('Failed to reply to ticket');
    return response.json();
}
