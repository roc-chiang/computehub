"""
Project Management API

INPUT: HTTP requests for project CRUD operations
OUTPUT: Project data and responses
POS: API layer for team collaboration - project management
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from datetime import datetime
from pydantic import BaseModel, Field

from app.core.db import get_session
from app.core.models import User, Deployment
from app.core.team_models import (
    Project,
    ProjectRead,
    OrganizationRole
)
from app.api.v1.deployments import get_current_user
from app.api.v1.organizations import require_organization_role

router = APIRouter()


# Request models
class ProjectCreate(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    description: Optional[str] = None


class ProjectUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    description: Optional[str] = None


class ProjectWithStats(BaseModel):
    id: int
    organization_id: int
    name: str
    description: Optional[str]
    created_by: int
    deployment_count: int
    created_at: datetime
    updated_at: datetime


@router.post("/organizations/{organization_id}/projects", response_model=ProjectRead)
async def create_project(
    organization_id: int,
    project_data: ProjectCreate,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """
    Create a new project in an organization
    
    Requires: Member role or higher
    """
    # Check permissions
    require_organization_role(OrganizationRole.MEMBER.value)(
        organization_id, current_user, session
    )
    
    # Create project
    project = Project(
        organization_id=organization_id,
        name=project_data.name,
        description=project_data.description,
        created_by=current_user.id
    )
    
    session.add(project)
    session.commit()
    session.refresh(project)
    
    return project


@router.get("/organizations/{organization_id}/projects", response_model=List[ProjectWithStats])
async def list_projects(
    organization_id: int,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """
    List all projects in an organization
    
    Requires: Viewer role or higher
    """
    # Check membership
    require_organization_role(OrganizationRole.VIEWER.value)(
        organization_id, current_user, session
    )
    
    # Get all projects
    projects = session.exec(
        select(Project)
        .where(Project.organization_id == organization_id)
    ).all()
    
    result = []
    for project in projects:
        # Count deployments
        deployment_count = len(session.exec(
            select(Deployment)
            .where(Deployment.project_id == project.id)
        ).all())
        
        result.append(ProjectWithStats(
            id=project.id,
            organization_id=project.organization_id,
            name=project.name,
            description=project.description,
            created_by=project.created_by,
            deployment_count=deployment_count,
            created_at=project.created_at,
            updated_at=project.updated_at
        ))
    
    return result


@router.get("/projects/{project_id}", response_model=ProjectRead)
async def get_project(
    project_id: int,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """
    Get project details
    
    Requires: Viewer role or higher in the organization
    """
    project = session.get(Project, project_id)
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )
    
    # Check membership in organization
    require_organization_role(OrganizationRole.VIEWER.value)(
        project.organization_id, current_user, session
    )
    
    return project


@router.patch("/projects/{project_id}", response_model=ProjectRead)
async def update_project(
    project_id: int,
    project_data: ProjectUpdate,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """
    Update project details
    
    Requires: Member role or higher
    """
    project = session.get(Project, project_id)
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )
    
    # Check permissions
    require_organization_role(OrganizationRole.MEMBER.value)(
        project.organization_id, current_user, session
    )
    
    # Update fields
    if project_data.name is not None:
        project.name = project_data.name
    if project_data.description is not None:
        project.description = project_data.description
    
    project.updated_at = datetime.utcnow()
    
    session.add(project)
    session.commit()
    session.refresh(project)
    
    return project


@router.delete("/organizations/{organization_id}/projects/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_project_by_org(
    organization_id: int,
    project_id: int,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """
    Delete a project (via organization path)
    
    Requires: Admin role or higher
    
    WARNING: Deployments in this project will be orphaned (project_id set to NULL)
    """
    # Check permissions first
    require_organization_role(OrganizationRole.ADMIN.value)(
        organization_id, current_user, session
    )
    
    project = session.get(Project, project_id)
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )
    
    # Verify project belongs to organization
    if project.organization_id != organization_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found in this organization"
        )
    
    # Orphan deployments (set project_id to NULL)
    deployments = session.exec(
        select(Deployment)
        .where(Deployment.project_id == project_id)
    ).all()
    
    for deployment in deployments:
        deployment.project_id = None
        session.add(deployment)
    
    # Delete project
    session.delete(project)
    session.commit()
    
    return None


@router.delete("/projects/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_project(
    project_id: int,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """
    Delete a project (direct path)
    
    Requires: Admin role or higher
    
    WARNING: Deployments in this project will be orphaned (project_id set to NULL)
    """
    project = session.get(Project, project_id)
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )
    
    # Check permissions - admin or higher
    require_organization_role(OrganizationRole.ADMIN.value)(
        project.organization_id, current_user, session
    )
    
    # Orphan deployments (set project_id to NULL)
    deployments = session.exec(
        select(Deployment)
        .where(Deployment.project_id == project_id)
    ).all()
    
    for deployment in deployments:
        deployment.project_id = None
        session.add(deployment)
    
    # Delete project
    session.delete(project)
    session.commit()
    
    return None


@router.get("/projects/{project_id}/deployments", response_model=List[dict])
async def list_project_deployments(
    project_id: int,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """
    List all deployments in a project
    
    Requires: Viewer role or higher
    """
    project = session.get(Project, project_id)
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )
    
    # Check membership
    require_organization_role(OrganizationRole.VIEWER.value)(
        project.organization_id, current_user, session
    )
    
    # Get deployments
    deployments = session.exec(
        select(Deployment)
        .where(Deployment.project_id == project_id)
    ).all()
    
    # Return simplified deployment info
    return [
        {
            "id": d.id,
            "name": d.name,
            "status": d.status,
            "gpu_type": d.gpu_type,
            "created_at": d.created_at
        }
        for d in deployments
    ]
