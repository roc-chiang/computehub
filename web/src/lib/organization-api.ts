/**
 * Organization API Client
 * 
 * INPUT: None
 * OUTPUT: Organization API functions
 * POS: API client for team collaboration - organization operations
 */

import { getHeaders, API_BASE_URL } from './api';

export interface Organization {
    id: number;
    name: string;
    slug: string;
    owner_id: number;
    created_at: string;
    updated_at: string;
}

export interface OrganizationWithStats extends Organization {
    role: string;
    member_count: number;
    project_count: number;
}

export interface OrganizationMember {
    id: number;
    user_id: number;
    email: string;
    role: string;
    joined_at: string;
}

export interface OrganizationInvitation {
    id: number;
    organization_id: number;
    email: string;
    role: string;
    status: string;
    created_at: string;
    expires_at: string;
}

export interface Project {
    id: number;
    organization_id: number;
    name: string;
    description?: string;
    created_by: number;
    created_at: string;
    updated_at: string;
}

export interface ProjectWithStats extends Project {
    deployment_count: number;
}

// Organization Management
export async function getOrganizations(): Promise<OrganizationWithStats[]> {
    const res = await fetch(`${API_BASE_URL}/organizations`, {
        headers: getHeaders(),
    });
    if (!res.ok) {
        const errorText = await res.text();
        console.error('API Error:', res.status, errorText);
        throw new Error(`Failed to fetch organizations (${res.status}): ${errorText}`);
    }
    return res.json();
}

export async function getOrganization(id: number): Promise<Organization> {
    const res = await fetch(`${API_BASE_URL}/organizations/${id}`, {
        headers: getHeaders(),
    });
    if (!res.ok) {
        const errorText = await res.text();
        console.error('API Error:', res.status, errorText);
        throw new Error(`Failed to fetch organization (${res.status}): ${errorText}`);
    }
    return res.json();
}

export async function createOrganization(data: {
    name: string;
    slug?: string;
}): Promise<Organization> {
    const res = await fetch(`${API_BASE_URL}/organizations`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to create organization');
    return res.json();
}

export async function updateOrganization(
    id: number,
    data: { name?: string }
): Promise<Organization> {
    const res = await fetch(`${API_BASE_URL}/organizations/${id}`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update organization');
    return res.json();
}

export async function deleteOrganization(id: number): Promise<void> {
    const res = await fetch(`${API_BASE_URL}/organizations/${id}`, {
        method: 'DELETE',
        headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to delete organization');
}

// Member Management
export async function getMembers(organizationId: number): Promise<OrganizationMember[]> {
    const res = await fetch(`${API_BASE_URL}/organizations/${organizationId}/members`, {
        headers: getHeaders(),
    });
    if (!res.ok) {
        const errorText = await res.text();
        console.error('Get Members API Error:', res.status, errorText);
        throw new Error(`Failed to fetch members (${res.status}): ${errorText}`);
    }
    return res.json();
}

export async function inviteMember(
    organizationId: number,
    data: { email: string; role: string }
): Promise<OrganizationInvitation> {
    const res = await fetch(
        `${API_BASE_URL}/organizations/${organizationId}/invitations`,
        {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(data),
        }
    );
    if (!res.ok) throw new Error('Failed to invite member');
    return res.json();
}

export async function getInvitations(
    organizationId: number
): Promise<OrganizationInvitation[]> {
    const res = await fetch(
        `${API_BASE_URL}/organizations/${organizationId}/invitations`,
        { headers: getHeaders() }
    );
    if (!res.ok) {
        const errorText = await res.text();
        console.error('Get Invitations API Error:', res.status, errorText);
        throw new Error(`Failed to fetch invitations (${res.status}): ${errorText}`);
    }
    return res.json();
}

export async function cancelInvitation(
    organizationId: number,
    invitationId: number
): Promise<void> {
    const res = await fetch(
        `${API_BASE_URL}/organizations/${organizationId}/invitations/${invitationId}`,
        {
            method: 'DELETE',
            headers: getHeaders(),
        }
    );
    if (!res.ok) throw new Error('Failed to cancel invitation');
}

export async function acceptInvitation(token: string): Promise<OrganizationMember> {
    const res = await fetch(`${API_BASE_URL}/invitations/${token}/accept`, {
        method: 'POST',
        headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to accept invitation');
    return res.json();
}

export async function updateMemberRole(
    organizationId: number,
    userId: number,
    role: string
): Promise<OrganizationMember> {
    const res = await fetch(
        `${API_BASE_URL}/organizations/${organizationId}/members/${userId}`,
        {
            method: 'PATCH',
            headers: getHeaders(),
            body: JSON.stringify({ role }),
        }
    );
    if (!res.ok) throw new Error('Failed to update member role');
    return res.json();
}

export async function removeMember(
    organizationId: number,
    userId: number
): Promise<void> {
    const res = await fetch(
        `${API_BASE_URL}/organizations/${organizationId}/members/${userId}`,
        {
            method: 'DELETE',
            headers: getHeaders(),
        }
    );
    if (!res.ok) throw new Error('Failed to remove member');
}

// Project Management
export async function getProjects(
    organizationId: number
): Promise<ProjectWithStats[]> {
    const res = await fetch(
        `${API_BASE_URL}/organizations/${organizationId}/projects`,
        { headers: getHeaders() }
    );
    if (!res.ok) {
        const errorText = await res.text();
        console.error('Get Projects API Error:', res.status, errorText);
        throw new Error(`Failed to fetch projects (${res.status}): ${errorText}`);
    }
    return res.json();
}

export async function getProject(projectId: number): Promise<Project> {
    const res = await fetch(`${API_BASE_URL}/projects/${projectId}`, {
        headers: getHeaders(),
    });
    if (!res.ok) {
        const errorText = await res.text();
        console.error('Get Project API Error:', res.status, errorText);
        throw new Error(`Failed to fetch project (${res.status}): ${errorText}`);
    }
    return res.json();
}

export async function createProject(
    organizationId: number,
    data: { name: string; description?: string }
): Promise<Project> {
    const res = await fetch(`${API_BASE_URL}/organizations/${organizationId}/projects`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(data),
    });
    if (!res.ok) {
        const errorText = await res.text();
        console.error('Create Project API Error:', res.status, errorText);
        throw new Error(`Failed to create project (${res.status}): ${errorText}`);
    }
    return res.json();
}

export async function updateProject(
    id: number,
    data: { name?: string; description?: string }
): Promise<Project> {
    const res = await fetch(`${API_BASE_URL}/projects/${id}`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update project');
    return res.json();
}

export async function deleteProject(
    organizationId: number,
    projectId: number
): Promise<void> {
    const res = await fetch(`${API_BASE_URL}/organizations/${organizationId}/projects/${projectId}`, {
        method: 'DELETE',
        headers: getHeaders(),
    });
    if (!res.ok) {
        const errorText = await res.text();
        console.error('Delete Project API Error:', res.status, errorText);
        throw new Error(`Failed to delete project (${res.status}): ${errorText}`);
    }
}
