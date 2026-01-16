"""
Member Management API

INPUT: HTTP requests for member and invitation operations
OUTPUT: Member and invitation data
POS: API layer for team collaboration - member management
"""

from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from datetime import datetime
from pydantic import BaseModel, EmailStr

from app.core.db import get_session
from app.core.models import User
from app.core.team_models import (
    Organization,
    OrganizationMember,
    OrganizationInvitation,
    OrganizationRole,
    InvitationStatus,
    OrganizationMemberRead,
    OrganizationInvitationRead
)
from app.api.v1.deployments import get_current_user
from app.api.v1.organizations import require_organization_role

router = APIRouter()


# Request models
class InviteMemberRequest(BaseModel):
    email: EmailStr
    role: str = OrganizationRole.MEMBER.value


class UpdateMemberRoleRequest(BaseModel):
    role: str


class MemberWithUser(BaseModel):
    id: int
    user_id: int
    email: str
    role: str
    joined_at: datetime


@router.get("/organizations/{organization_id}/members", response_model=List[MemberWithUser])
async def list_members(
    organization_id: int,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """
    List all members of an organization
    
    Requires: Viewer role or higher
    """
    # Check membership
    require_organization_role(OrganizationRole.VIEWER.value)(
        organization_id, current_user, session
    )
    
    # Get all members
    members = session.exec(
        select(OrganizationMember)
        .where(OrganizationMember.organization_id == organization_id)
    ).all()
    
    result = []
    for member in members:
        user = session.get(User, member.user_id)
        if user:
            result.append(MemberWithUser(
                id=member.id,
                user_id=user.id,
                email=user.email,
                role=member.role,
                joined_at=member.joined_at
            ))
    
    return result


@router.post("/organizations/{organization_id}/invitations", response_model=OrganizationInvitationRead)
async def invite_member(
    organization_id: int,
    invite_data: InviteMemberRequest,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """
    Invite a new member to the organization
    
    Requires: Admin role or higher
    """
    # Check permissions
    require_organization_role(OrganizationRole.ADMIN.value)(
        organization_id, current_user, session
    )
    
    # Validate role
    valid_roles = [r.value for r in OrganizationRole]
    if invite_data.role not in valid_roles:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid role. Must be one of: {', '.join(valid_roles)}"
        )
    
    # Check if user is already a member
    existing_user = session.exec(
        select(User).where(User.email == invite_data.email)
    ).first()
    
    if existing_user:
        existing_member = session.exec(
            select(OrganizationMember)
            .where(OrganizationMember.organization_id == organization_id)
            .where(OrganizationMember.user_id == existing_user.id)
        ).first()
        
        if existing_member:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User is already a member of this organization"
            )
    
    # Check if there's already a pending invitation
    existing_invitation = session.exec(
        select(OrganizationInvitation)
        .where(OrganizationInvitation.organization_id == organization_id)
        .where(OrganizationInvitation.email == invite_data.email)
        .where(OrganizationInvitation.status == InvitationStatus.PENDING.value)
    ).first()
    
    if existing_invitation:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An invitation has already been sent to this email"
        )
    
    # Create invitation
    invitation = OrganizationInvitation.create_invitation(
        organization_id=organization_id,
        email=invite_data.email,
        role=invite_data.role,
        invited_by=current_user.id
    )
    
    session.add(invitation)
    session.commit()
    session.refresh(invitation)
    
    # TODO: Send invitation email
    
    return invitation


@router.get("/organizations/{organization_id}/invitations", response_model=List[OrganizationInvitationRead])
async def list_invitations(
    organization_id: int,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """
    List all pending invitations for an organization
    
    Requires: Admin role or higher
    """
    # Check permissions
    require_organization_role(OrganizationRole.ADMIN.value)(
        organization_id, current_user, session
    )
    
    invitations = session.exec(
        select(OrganizationInvitation)
        .where(OrganizationInvitation.organization_id == organization_id)
        .where(OrganizationInvitation.status == InvitationStatus.PENDING.value)
    ).all()
    
    return invitations


@router.delete("/organizations/{organization_id}/invitations/{invitation_id}", status_code=status.HTTP_204_NO_CONTENT)
async def cancel_invitation(
    organization_id: int,
    invitation_id: int,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """
    Cancel a pending invitation
    
    Requires: Admin role or higher
    """
    # Check permissions
    require_organization_role(OrganizationRole.ADMIN.value)(
        organization_id, current_user, session
    )
    
    invitation = session.get(OrganizationInvitation, invitation_id)
    if not invitation or invitation.organization_id != organization_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invitation not found"
        )
    
    if invitation.status != InvitationStatus.PENDING.value:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Can only cancel pending invitations"
        )
    
    invitation.status = InvitationStatus.CANCELLED.value
    session.add(invitation)
    session.commit()
    
    return None


@router.post("/invitations/{token}/accept", response_model=OrganizationMemberRead)
async def accept_invitation(
    token: str,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """
    Accept an organization invitation
    
    The invitation token is sent via email.
    """
    # Find invitation
    invitation = session.exec(
        select(OrganizationInvitation)
        .where(OrganizationInvitation.token == token)
    ).first()
    
    if not invitation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invitation not found"
        )
    
    # Check if invitation is valid
    if invitation.status != InvitationStatus.PENDING.value:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invitation is no longer valid"
        )
    
    if invitation.is_expired():
        invitation.status = InvitationStatus.EXPIRED.value
        session.add(invitation)
        session.commit()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invitation has expired"
        )
    
    # Check if email matches
    if invitation.email != current_user.email:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This invitation was sent to a different email address"
        )
    
    # Check if already a member
    existing_member = session.exec(
        select(OrganizationMember)
        .where(OrganizationMember.organization_id == invitation.organization_id)
        .where(OrganizationMember.user_id == current_user.id)
    ).first()
    
    if existing_member:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You are already a member of this organization"
        )
    
    # Create membership
    member = OrganizationMember(
        organization_id=invitation.organization_id,
        user_id=current_user.id,
        role=invitation.role,
        invited_by=invitation.invited_by
    )
    session.add(member)
    
    # Update invitation status
    invitation.status = InvitationStatus.ACCEPTED.value
    invitation.accepted_at = datetime.utcnow()
    session.add(invitation)
    
    session.commit()
    session.refresh(member)
    
    return member


@router.patch("/organizations/{organization_id}/members/{user_id}", response_model=OrganizationMemberRead)
async def update_member_role(
    organization_id: int,
    user_id: int,
    role_data: UpdateMemberRoleRequest,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """
    Update a member's role
    
    Requires: Admin role or higher
    Cannot change the owner's role
    """
    # Check permissions
    require_organization_role(OrganizationRole.ADMIN.value)(
        organization_id, current_user, session
    )
    
    # Validate role
    valid_roles = [r.value for r in OrganizationRole]
    if role_data.role not in valid_roles:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid role. Must be one of: {', '.join(valid_roles)}"
        )
    
    # Get member
    member = session.exec(
        select(OrganizationMember)
        .where(OrganizationMember.organization_id == organization_id)
        .where(OrganizationMember.user_id == user_id)
    ).first()
    
    if not member:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Member not found"
        )
    
    # Check if trying to change owner's role
    org = session.get(Organization, organization_id)
    if org and org.owner_id == user_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot change the owner's role"
        )
    
    # Update role
    member.role = role_data.role
    session.add(member)
    session.commit()
    session.refresh(member)
    
    return member


@router.delete("/organizations/{organization_id}/members/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_member(
    organization_id: int,
    user_id: int,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """
    Remove a member from the organization
    
    Requires: Admin role or higher
    Cannot remove the owner
    """
    # Check permissions
    require_organization_role(OrganizationRole.ADMIN.value)(
        organization_id, current_user, session
    )
    
    # Get member
    member = session.exec(
        select(OrganizationMember)
        .where(OrganizationMember.organization_id == organization_id)
        .where(OrganizationMember.user_id == user_id)
    ).first()
    
    if not member:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Member not found"
        )
    
    # Check if trying to remove owner
    org = session.get(Organization, organization_id)
    if org and org.owner_id == user_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot remove the owner from the organization"
        )
    
    # Cannot remove yourself if you're the last admin
    if user_id == current_user.id:
        admin_count = len(session.exec(
            select(OrganizationMember)
            .where(OrganizationMember.organization_id == organization_id)
            .where(OrganizationMember.role.in_([OrganizationRole.OWNER.value, OrganizationRole.ADMIN.value]))
        ).all())
        
        if admin_count <= 1:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot remove yourself as the last admin"
            )
    
    session.delete(member)
    session.commit()
    
    return None
