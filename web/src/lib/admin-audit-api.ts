export interface AuditLogItem {
    id: number;
    timestamp: string;
    action_type: string;
    resource_type: string;
    resource_id: string | null;
    user_email: string | null;
    is_admin: boolean;
    description: string;
    status: string;
    ip_address: string | null;
}

export interface AuditLogDetail {
    id: number;
    timestamp: string;
    action_type: string;
    resource_type: string;
    resource_id: string | null;
    user_id: string | null;
    user_email: string | null;
    is_admin: boolean;
    ip_address: string | null;
    user_agent: string | null;
    description: string;
    details_json: string | null;
    status: string;
    error_message: string | null;
}

export interface AuditStats {
    total_logs: number;
    recent_24h: number;
    by_action_type: Record<string, number>;
    by_resource_type: Record<string, number>;
    by_status: {
        success: number;
        failed: number;
        error: number;
    };
}

// API Functions
export async function getAuditLogs(params?: {
    action_type?: string;
    resource_type?: string;
    user_email?: string;
    status?: string;
    start_date?: string;
    end_date?: string;
    skip?: number;
    limit?: number;
}): Promise<AuditLogItem[]> {
    const queryParams = new URLSearchParams();
    if (params?.action_type) queryParams.append('action_type', params.action_type);
    if (params?.resource_type) queryParams.append('resource_type', params.resource_type);
    if (params?.user_email) queryParams.append('user_email', params.user_email);
    if (params?.status) queryParams.append('status', params.status);
    if (params?.start_date) queryParams.append('start_date', params.start_date);
    if (params?.end_date) queryParams.append('end_date', params.end_date);
    if (params?.skip !== undefined) queryParams.append('skip', params.skip.toString());
    if (params?.limit !== undefined) queryParams.append('limit', params.limit.toString());

    const response = await fetch(`/api/v1/admin/audit/logs?${queryParams}`);
    if (!response.ok) throw new Error('Failed to fetch audit logs');
    return response.json();
}

export async function getAuditLogDetail(logId: number): Promise<AuditLogDetail> {
    const response = await fetch(`/api/v1/admin/audit/logs/${logId}`);
    if (!response.ok) throw new Error('Failed to fetch audit log detail');
    return response.json();
}

export async function getAuditStats(): Promise<AuditStats> {
    const response = await fetch('/api/v1/admin/audit/stats');
    if (!response.ok) throw new Error('Failed to fetch audit stats');
    return response.json();
}
