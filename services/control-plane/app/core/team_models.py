"""
Team Collaboration Models

INPUT: None
OUTPUT: Organization, OrganizationMember, OrganizationInvitation, Project, CostAllocation models
POS: Data models for team collaboration feature (Phase 14)
"""

from typing import Optional, List
from datetime import datetime, timedelta
from sqlmodel import Field, SQLModel, Relationship
from enum import Enum
import secrets


class OrganizationRole(str, Enum):
    """Organization member roles"""
    OWNER = "owner"
    ADMIN = "admin"
    MEMBER = "member"
    VIEWER = "viewer"


class InvitationStatus(str, Enum):
    """Invitation status"""
    PENDING = "pending"
    ACCEPTED = "accepted"
    EXPIRED = "expired"
    CANCELLED = "cancelled"


class Organization(SQLModel, table=True):
    """
    Organization/Team model
    
    Represents a team or organization that can have multiple members,
    projects, and deployments.
    """
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(max_length=100, index=True)
    slug: str = Field(max_length=100, unique=True, index=True)
    owner_id: int = Field(foreign_key="user.id")
    
    # Settings stored as JSON
    settings: Optional[str] = Field(default=None)
    
    # Timestamps
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    def __repr__(self):
        return f"<Organization {self.name}>"


class OrganizationMember(SQLModel, table=True):
    """
    Organization membership model
    
    Links users to organizations with specific roles.
    """
    __tablename__ = "organization_member"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    organization_id: int = Field(foreign_key="organization.id", index=True)
    user_id: int = Field(foreign_key="user.id", index=True)
    
    # Role in organization
    role: str = Field(max_length=20, default=OrganizationRole.MEMBER.value)
    
    # Timestamps
    joined_at: datetime = Field(default_factory=datetime.utcnow)
    invited_by: Optional[int] = Field(default=None, foreign_key="user.id")
    
    def __repr__(self):
        return f"<OrganizationMember org={self.organization_id} user={self.user_id} role={self.role}>"


# Unique constraint on (organization_id, user_id)
# This will be added in the migration script


class OrganizationInvitation(SQLModel, table=True):
    """
    Organization invitation model
    
    Tracks pending invitations to join an organization.
    """
    __tablename__ = "organization_invitation"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    organization_id: int = Field(foreign_key="organization.id", index=True)
    email: str = Field(max_length=255, index=True)
    role: str = Field(max_length=20, default=OrganizationRole.MEMBER.value)
    
    # Invitation token (secure random string)
    token: str = Field(max_length=100, unique=True, index=True)
    
    # Status
    status: str = Field(max_length=20, default=InvitationStatus.PENDING.value)
    
    # Timestamps
    invited_by: int = Field(foreign_key="user.id")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    expires_at: datetime
    accepted_at: Optional[datetime] = None
    
    @classmethod
    def generate_token(cls) -> str:
        """Generate a secure random token"""
        return secrets.token_urlsafe(32)
    
    @classmethod
    def create_invitation(
        cls,
        organization_id: int,
        email: str,
        role: str,
        invited_by: int,
        expires_in_days: int = 7
    ) -> "OrganizationInvitation":
        """Create a new invitation"""
        return cls(
            organization_id=organization_id,
            email=email,
            role=role,
            token=cls.generate_token(),
            invited_by=invited_by,
            expires_at=datetime.utcnow() + timedelta(days=expires_in_days)
        )
    
    def is_expired(self) -> bool:
        """Check if invitation has expired"""
        return datetime.utcnow() > self.expires_at
    
    def __repr__(self):
        return f"<OrganizationInvitation {self.email} to org={self.organization_id}>"


class Project(SQLModel, table=True):
    """
    Project model
    
    Projects are used to organize deployments within an organization.
    """
    id: Optional[int] = Field(default=None, primary_key=True)
    organization_id: int = Field(foreign_key="organization.id", index=True)
    name: str = Field(max_length=100)
    description: Optional[str] = None
    
    # Creator
    created_by: int = Field(foreign_key="user.id")
    
    # Timestamps
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    def __repr__(self):
        return f"<Project {self.name} in org={self.organization_id}>"


class CostAllocation(SQLModel, table=True):
    """
    Cost allocation model
    
    Tracks costs allocated to organizations and projects.
    """
    __tablename__ = "cost_allocation"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    organization_id: int = Field(foreign_key="organization.id", index=True)
    project_id: Optional[int] = Field(default=None, foreign_key="project.id", index=True)
    deployment_id: int = Field(foreign_key="deployment.id", index=True)
    
    # Cost details
    amount: float
    currency: str = Field(default="USD", max_length=3)
    
    # Time period
    period_start: datetime
    period_end: datetime
    
    # Timestamp
    recorded_at: datetime = Field(default_factory=datetime.utcnow)
    
    def __repr__(self):
        return f"<CostAllocation {self.amount} {self.currency} for deployment={self.deployment_id}>"


# Read models for API responses
class OrganizationRead(SQLModel):
    """Organization response model"""
    id: int
    name: str
    slug: str
    owner_id: int
    created_at: datetime
    updated_at: datetime


class OrganizationMemberRead(SQLModel):
    """Organization member response model"""
    id: int
    organization_id: int
    user_id: int
    role: str
    joined_at: datetime


class OrganizationInvitationRead(SQLModel):
    """Organization invitation response model"""
    id: int
    organization_id: int
    email: str
    role: str
    status: str
    created_at: datetime
    expires_at: datetime


class ProjectRead(SQLModel):
    """Project response model"""
    id: int
    organization_id: int
    name: str
    description: Optional[str]
    created_by: int
    created_at: datetime
    updated_at: datetime


class CostAllocationRead(SQLModel):
    """Cost allocation response model"""
    id: int
    organization_id: int
    project_id: Optional[int]
    deployment_id: int
    amount: float
    currency: str
    period_start: datetime
    period_end: datetime
