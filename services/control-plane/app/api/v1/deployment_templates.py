"""
Deployment Templates API
Allows users to save and reuse deployment configurations
"""
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from pydantic import BaseModel

from app.core.db import get_session
from app.core.models import DeploymentTemplate
from app.api.v1.deployments import get_current_user
from app.core.models import User

router = APIRouter()


# Pydantic models for request/response
class DeploymentTemplateCreate(BaseModel):
    name: str
    description: str | None = None
    gpu_type: str
    gpu_count: int = 1
    provider: str | None = None
    image: str
    vcpu_count: int | None = None
    ram_gb: int | None = None
    storage_gb: int | None = None
    env_vars: str | None = None  # JSON string


class DeploymentTemplateUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    gpu_type: str | None = None
    gpu_count: int | None = None
    provider: str | None = None
    image: str | None = None
    vcpu_count: int | None = None
    ram_gb: int | None = None
    storage_gb: int | None = None
    env_vars: str | None = None


class DeploymentTemplateResponse(BaseModel):
    id: int
    user_id: str
    name: str
    description: str | None
    gpu_type: str
    gpu_count: int
    provider: str | None
    image: str
    vcpu_count: int | None
    ram_gb: int | None
    storage_gb: int | None
    env_vars: str | None
    created_at: str
    updated_at: str


@router.get("/deployment-templates", response_model=List[DeploymentTemplateResponse])
async def list_templates(
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """
    List all deployment templates for the current user
    """
    templates = session.exec(
        select(DeploymentTemplate).where(DeploymentTemplate.user_id == current_user.clerk_id)
    ).all()
    
    return [
        DeploymentTemplateResponse(
            id=t.id,
            user_id=t.user_id,
            name=t.name,
            description=t.description,
            gpu_type=t.gpu_type,
            gpu_count=t.gpu_count,
            provider=t.provider,
            image=t.image,
            vcpu_count=t.vcpu_count,
            ram_gb=t.ram_gb,
            storage_gb=t.storage_gb,
            env_vars=t.env_vars,
            created_at=t.created_at.isoformat(),
            updated_at=t.updated_at.isoformat()
        )
        for t in templates
    ]


@router.post("/deployment-templates", response_model=DeploymentTemplateResponse, status_code=status.HTTP_201_CREATED)
async def create_template(
    template_data: DeploymentTemplateCreate,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """
    Create a new deployment template
    """
    # Check if template with same name already exists
    existing = session.exec(
        select(DeploymentTemplate).where(
            DeploymentTemplate.user_id == current_user.clerk_id,
            DeploymentTemplate.name == template_data.name
        )
    ).first()
    
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Template with name '{template_data.name}' already exists"
        )
    
    # Create new template
    template = DeploymentTemplate(
        user_id=current_user.clerk_id,
        name=template_data.name,
        description=template_data.description,
        gpu_type=template_data.gpu_type,
        gpu_count=template_data.gpu_count,
        provider=template_data.provider,
        image=template_data.image,
        vcpu_count=template_data.vcpu_count,
        ram_gb=template_data.ram_gb,
        storage_gb=template_data.storage_gb,
        env_vars=template_data.env_vars
    )
    
    session.add(template)
    session.commit()
    session.refresh(template)
    
    return DeploymentTemplateResponse(
        id=template.id,
        user_id=template.user_id,
        name=template.name,
        description=template.description,
        gpu_type=template.gpu_type,
        gpu_count=template.gpu_count,
        provider=template.provider,
        image=template.image,
        vcpu_count=template.vcpu_count,
        ram_gb=template.ram_gb,
        storage_gb=template.storage_gb,
        env_vars=template.env_vars,
        created_at=template.created_at.isoformat(),
        updated_at=template.updated_at.isoformat()
    )


@router.get("/deployment-templates/{template_id}", response_model=DeploymentTemplateResponse)
async def get_template(
    template_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """
    Get a specific deployment template
    """
    template = session.get(DeploymentTemplate, template_id)
    
    if not template:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Template not found"
        )
    
    # Verify ownership
    if template.user_id != current_user.clerk_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this template"
        )
    
    return DeploymentTemplateResponse(
        id=template.id,
        user_id=template.user_id,
        name=template.name,
        description=template.description,
        gpu_type=template.gpu_type,
        gpu_count=template.gpu_count,
        provider=template.provider,
        image=template.image,
        vcpu_count=template.vcpu_count,
        ram_gb=template.ram_gb,
        storage_gb=template.storage_gb,
        env_vars=template.env_vars,
        created_at=template.created_at.isoformat(),
        updated_at=template.updated_at.isoformat()
    )


@router.patch("/deployment-templates/{template_id}", response_model=DeploymentTemplateResponse)
async def update_template(
    template_id: int,
    template_data: DeploymentTemplateUpdate,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """
    Update a deployment template
    """
    template = session.get(DeploymentTemplate, template_id)
    
    if not template:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Template not found"
        )
    
    # Verify ownership
    if template.user_id != current_user.clerk_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to modify this template"
        )
    
    # Update fields
    update_data = template_data.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(template, key, value)
    
    from datetime import datetime
    template.updated_at = datetime.utcnow()
    
    session.add(template)
    session.commit()
    session.refresh(template)
    
    return DeploymentTemplateResponse(
        id=template.id,
        user_id=template.user_id,
        name=template.name,
        description=template.description,
        gpu_type=template.gpu_type,
        gpu_count=template.gpu_count,
        provider=template.provider,
        image=template.image,
        vcpu_count=template.vcpu_count,
        ram_gb=template.ram_gb,
        storage_gb=template.storage_gb,
        env_vars=template.env_vars,
        created_at=template.created_at.isoformat(),
        updated_at=template.updated_at.isoformat()
    )


@router.delete("/deployment-templates/{template_id}")
async def delete_template(
    template_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """
    Delete a deployment template
    """
    template = session.get(DeploymentTemplate, template_id)
    
    if not template:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Template not found"
        )
    
    # Verify ownership
    if template.user_id != current_user.clerk_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete this template"
        )
    
    session.delete(template)
    session.commit()
    
    return {"message": "Template deleted successfully"}
