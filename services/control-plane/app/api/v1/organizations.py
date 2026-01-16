"""
Organization Management API

INPUT: HTTP requests for organization CRUD operations
OUTPUT: Organization data and responses
POS: API layer for team collaboration - organization management
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from datetime import datetime

from app.core.db import get_session
from app.core.models import User
from app.core.team_models import (
    Organization,
    OrganizationMember,
    OrganizationRole,
    OrganizationRead
)
from app.api.v1.deployments import get_current_user
import re

router = APIRouter()


def generate_slug(name: str) -> str:
    """Generate URL-friendly slug from name"""
    slug = name.lower()
    slug = re.sub(r'[^a-z0-9]+', '-', slug)
    slug = slug.strip('-')
    return slug


def get_user_organization_role(
    organization_id: int,
    user_id: int,
    session: Session
) -> Optional[str]:
    """Get user's role in an organization"""
    member = session.exec(
        select(OrganizationMember)
        .where(OrganizationMember.organization_id == organization_id)
        .where(OrganizationMember.user_id == user_id)
    ).first()
    
    return member.role if member else None


def require_organization_role(min_role: str):
    """
    Decorator to check if user has required role in organization
    
    Role hierarchy: owner > admin > member > viewer
    """
    role_hierarchy = {
        OrganizationRole.VIEWER.value: 0,
        OrganizationRole.MEMBER.value: 1,
        OrganizationRole.ADMIN.value: 2,
        OrganizationRole.OWNER.value: 3
    }
    
    def check_role(
        organization_id: int,
        current_user: User,
        session: Session
    ):
        user_role = get_user_organization_role(organization_id, current_user.id, session)
        
        if not user_role:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You are not a member of this organization"
            )
        
        if role_hierarchy.get(user_role, 0) < role_hierarchy.get(min_role, 0):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Insufficient permissions. Required role: {min_role}"
            )
        
        return user_role
    
    return check_role


# Pydantic models for requests
from pydantic import BaseModel, Field

class OrganizationCreate(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    slug: Optional[str] = None


class OrganizationUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)


class OrganizationWithStats(BaseModel):
    id: int
    name: str
    slug: str
    owner_id: int
    role: str
    member_count: int
    project_count: int
    created_at: datetime


@router.post("/organizations", response_model=OrganizationRead)
async def create_organization(
    org_data: OrganizationCreate,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """
    Create a new organization
    
    The creator becomes the owner of the organization.
    A default project is automatically created.
    """
    # Generate slug if not provided
    slug = org_data.slug or generate_slug(org_data.name)
    
    # Ensure slug is unique
    base_slug = slug
    counter = 1
    while session.exec(select(Organization).where(Organization.slug == slug)).first():
        slug = f"{base_slug}-{counter}"
        counter += 1
    
    # Create organization
    organization = Organization(
        name=org_data.name,
        slug=slug,
        owner_id=current_user.id
    )
    session.add(organization)
    session.flush()  # Get the ID
    
    # Add creator as owner
    member = OrganizationMember(
        organization_id=organization.id,
        user_id=current_user.id,
        role=OrganizationRole.OWNER.value
    )
    session.add(member)
    
    # Create default project
    from app.core.team_models import Project
    default_project = Project(
        organization_id=organization.id,
        name="Default",
        description="Default project for deployments",
        created_by=current_user.id
    )
    session.add(default_project)
    
    session.commit()
    session.refresh(organization)
    
    return organization


@router.get("/organizations", response_model=List[OrganizationWithStats])
async def list_organizations(
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """
    List all organizations the current user is a member of
    """
    # Get user's memberships
    memberships = session.exec(
        select(OrganizationMember)
        .where(OrganizationMember.user_id == current_user.id)
    ).all()
    
    result = []
    for membership in memberships:
        org = session.get(Organization, membership.organization_id)
        if not org:
            continue
        
        # Count members
        member_count = len(session.exec(
            select(OrganizationMember)
            .where(OrganizationMember.organization_id == org.id)
        ).all())
        
        # Count projects
        from app.core.team_models import Project
        project_count = len(session.exec(
            select(Project)
            .where(Project.organization_id == org.id)
        ).all())
        
        result.append(OrganizationWithStats(
            id=org.id,
            name=org.name,
            slug=org.slug,
            owner_id=org.owner_id,
            role=membership.role,
            member_count=member_count,
            project_count=project_count,
            created_at=org.created_at
        ))
    
    return result


@router.get("/organizations/{organization_id}", response_model=OrganizationRead)
async def get_organization(
    organization_id: int,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """
    Get organization details
    
    Requires: Member role or higher
    """
    # Check membership
    require_organization_role(OrganizationRole.VIEWER.value)(
        organization_id, current_user, session
    )
    
    organization = session.get(Organization, organization_id)
    if not organization:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Organization not found"
        )
    
    return organization


@router.patch("/organizations/{organization_id}", response_model=OrganizationRead)
async def update_organization(
    organization_id: int,
    org_data: OrganizationUpdate,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """
    Update organization details
    
    Requires: Admin role or higher
    """
    # Check permissions
    require_organization_role(OrganizationRole.ADMIN.value)(
        organization_id, current_user, session
    )
    
    organization = session.get(Organization, organization_id)
    if not organization:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Organization not found"
        )
    
    # Update fields
    if org_data.name is not None:
        organization.name = org_data.name
    
    organization.updated_at = datetime.utcnow()
    
    session.add(organization)
    session.commit()
    session.refresh(organization)
    
    return organization


@router.delete("/organizations/{organization_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_organization(
    organization_id: int,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """
    Delete an organization
    
    Requires: Owner role
    
    WARNING: This will delete all associated data including projects,
    members, and invitations. Deployments will be orphaned.
    """
    # Check permissions - only owner can delete
    user_role = require_organization_role(OrganizationRole.OWNER.value)(
        organization_id, current_user, session
    )
    
    organization = session.get(Organization, organization_id)
    if not organization:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Organization not found"
        )
    
    # Delete all members
    members = session.exec(
        select(OrganizationMember)
        .where(OrganizationMember.organization_id == organization_id)
    ).all()
    for member in members:
        session.delete(member)
    
    # Delete all invitations
    from app.core.team_models import OrganizationInvitation
    invitations = session.exec(
        select(OrganizationInvitation)
        .where(OrganizationInvitation.organization_id == organization_id)
    ).all()
    for invitation in invitations:
        session.delete(invitation)
    
    # Delete all projects
    from app.core.team_models import Project
    projects = session.exec(
        select(Project)
        .where(Project.organization_id == organization_id)
    ).all()
    for project in projects:
        session.delete(project)
    
    # Delete organization
    session.delete(organization)
    session.commit()
    
    return None
