"""
Deployment Templates API
Handles template marketplace, official templates, and custom templates
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel
import json

from app.core.db import get_session
from app.core.models import (
    DeploymentTemplate,
    TemplateCategory,
    Deployment,
    DeploymentStatus,
    ProviderType,
    User
)
from app.api.v1.deployments import get_current_user

router = APIRouter()


# ============================================================================
# Request/Response Models
# ============================================================================

class TemplateResponse(BaseModel):
    """Template response model"""
    id: int
    name: str
    description: Optional[str]
    category: str
    image: str
    gpu_type: str
    gpu_count: int
    exposed_port: Optional[int]
    is_official: bool
    is_public: bool
    is_pro: bool  # Pro License required
    usage_count: int
    icon_url: Optional[str]
    preview_image_url: Optional[str]
    created_at: datetime


class TemplateDetailResponse(TemplateResponse):
    """Detailed template response"""
    vcpu_count: Optional[int]
    ram_gb: Optional[int]
    storage_gb: Optional[int]
    env_vars: Optional[dict]
    readme: Optional[str]
    user_id: Optional[str]


class TemplateCreateRequest(BaseModel):
    """Create template request"""
    name: str
    description: Optional[str] = None
    category: str = "other"
    image: str
    gpu_type: str
    gpu_count: int = 1
    vcpu_count: Optional[int] = None
    ram_gb: Optional[int] = None
    storage_gb: Optional[int] = None
    exposed_port: Optional[int] = None
    env_vars: Optional[dict] = None
    is_public: bool = False
    readme: Optional[str] = None


class DeployFromTemplateRequest(BaseModel):
    """Deploy from template request"""
    name: str
    provider: Optional[str] = "auto"


# ============================================================================
# Template Endpoints
# ============================================================================

@router.get("/templates", response_model=List[TemplateResponse])
async def list_templates(
    category: Optional[str] = None,
    official_only: bool = False,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """List all available templates"""
    
    # Build query
    statement = select(DeploymentTemplate)
    
    # Filter by category
    if category:
        statement = statement.where(DeploymentTemplate.category == category)
    
    # Filter official only
    if official_only:
        statement = statement.where(DeploymentTemplate.is_official == True)
    else:
        # Show official + public + user's own templates
        statement = statement.where(
            (DeploymentTemplate.is_official == True) |
            (DeploymentTemplate.is_public == True) |
            (DeploymentTemplate.user_id == current_user.clerk_id)
        )
    
    # Order by usage count and creation date
    statement = statement.order_by(
        DeploymentTemplate.is_official.desc(),
        DeploymentTemplate.usage_count.desc(),
        DeploymentTemplate.created_at.desc()
    )
    
    templates = session.exec(statement).all()
    
    return [
        TemplateResponse(
            id=t.id,
            name=t.name,
            description=t.description,
            category=t.category,
            image=t.image,
            gpu_type=t.gpu_type,
            gpu_count=t.gpu_count,
            exposed_port=t.exposed_port,
            is_official=t.is_official,
            is_public=t.is_public,
            is_pro=t.is_pro,
            usage_count=t.usage_count,
            icon_url=t.icon_url,
            preview_image_url=t.preview_image_url,
            created_at=t.created_at
        )
        for t in templates
    ]


@router.get("/templates/official", response_model=List[TemplateResponse])
async def list_official_templates(
    session: Session = Depends(get_session)
):
    """List official templates (no auth required)"""
    
    statement = select(DeploymentTemplate).where(
        DeploymentTemplate.is_official == True
    ).order_by(DeploymentTemplate.usage_count.desc())
    
    templates = session.exec(statement).all()
    
    return [
        TemplateResponse(
            id=t.id,
            name=t.name,
            description=t.description,
            category=t.category,
            image=t.image,
            gpu_type=t.gpu_type,
            gpu_count=t.gpu_count,
            exposed_port=t.exposed_port,
            is_official=t.is_official,
            is_public=t.is_public,
            is_pro=t.is_pro,
            usage_count=t.usage_count,
            icon_url=t.icon_url,
            preview_image_url=t.preview_image_url,
            created_at=t.created_at
        )
        for t in templates
    ]


@router.get("/templates/my", response_model=List[TemplateResponse])
async def list_my_templates(
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """List user's own templates"""
    
    statement = select(DeploymentTemplate).where(
        DeploymentTemplate.user_id == current_user.clerk_id
    ).order_by(DeploymentTemplate.created_at.desc())
    
    templates = session.exec(statement).all()
    
    return [
        TemplateResponse(
            id=t.id,
            name=t.name,
            description=t.description,
            category=t.category,
            image=t.image,
            gpu_type=t.gpu_type,
            gpu_count=t.gpu_count,
            exposed_port=t.exposed_port,
            is_official=t.is_official,
            is_public=t.is_public,
            is_pro=t.is_pro,
            usage_count=t.usage_count,
            icon_url=t.icon_url,
            preview_image_url=t.preview_image_url,
            created_at=t.created_at
        )
        for t in templates
    ]


@router.get("/templates/{template_id}", response_model=TemplateDetailResponse)
async def get_template(
    template_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Get template details"""
    
    template = session.get(DeploymentTemplate, template_id)
    
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    
    # Check access
    if not template.is_official and not template.is_public:
        if template.user_id != current_user.clerk_id:
            raise HTTPException(status_code=403, detail="Access denied")
    
    # Parse env vars
    env_vars = None
    if template.env_vars_json:
        try:
            env_vars = json.loads(template.env_vars_json)
        except:
            pass
    
    return TemplateDetailResponse(
        id=template.id,
        name=template.name,
        description=template.description,
        category=template.category,
        image=template.image,
        gpu_type=template.gpu_type,
        gpu_count=template.gpu_count,
        vcpu_count=template.vcpu_count,
        ram_gb=template.ram_gb,
        storage_gb=template.storage_gb,
        exposed_port=template.exposed_port,
        env_vars=env_vars,
        is_official=template.is_official,
        is_public=template.is_public,
        usage_count=template.usage_count,
        icon_url=template.icon_url,
        preview_image_url=template.preview_image_url,
        readme=template.readme,
        user_id=template.user_id,
        created_at=template.created_at
    )


@router.post("/templates", response_model=TemplateDetailResponse)
async def create_template(
    request: TemplateCreateRequest,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Create a new template"""
    
    # Convert env_vars to JSON
    env_vars_json = None
    if request.env_vars:
        env_vars_json = json.dumps(request.env_vars)
    
    template = DeploymentTemplate(
        user_id=current_user.clerk_id,
        name=request.name,
        description=request.description,
        category=request.category,  # Direct string assignment
        image=request.image,
        gpu_type=request.gpu_type,
        gpu_count=request.gpu_count,
        vcpu_count=request.vcpu_count,
        ram_gb=request.ram_gb,
        storage_gb=request.storage_gb,
        exposed_port=request.exposed_port,
        env_vars_json=env_vars_json,
        is_public=request.is_public,
        readme=request.readme
    )
    
    session.add(template)
    session.commit()
    session.refresh(template)
    
    return TemplateDetailResponse(
        id=template.id,
        name=template.name,
        description=template.description,
        category=template.category,
        image=template.image,
        gpu_type=template.gpu_type,
        gpu_count=template.gpu_count,
        vcpu_count=template.vcpu_count,
        ram_gb=template.ram_gb,
        storage_gb=template.storage_gb,
        exposed_port=template.exposed_port,
        env_vars=request.env_vars,
        is_official=template.is_official,
        is_public=template.is_public,
        usage_count=template.usage_count,
        icon_url=template.icon_url,
        preview_image_url=template.preview_image_url,
        readme=template.readme,
        user_id=template.user_id,
        created_at=template.created_at
    )


@router.post("/templates/{template_id}/deploy")
async def deploy_from_template(
    template_id: int,
    request: DeployFromTemplateRequest,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Deploy from a template"""
    
    # Get template
    template = session.get(DeploymentTemplate, template_id)
    
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    
    # Check access
    if not template.is_official and not template.is_public:
        if template.user_id != current_user.clerk_id:
            raise HTTPException(status_code=403, detail="Access denied")
    
    # Create deployment from template
    deployment = Deployment(
        user_id=current_user.id,
        name=request.name,
        provider=ProviderType(request.provider) if request.provider else ProviderType.AUTO,
        status=DeploymentStatus.CREATING,
        gpu_type=template.gpu_type,
        gpu_count=template.gpu_count,
        image=template.image,
        vcpu_count=template.vcpu_count,
        ram_gb=template.ram_gb,
        storage_gb=template.storage_gb,
        exposed_port=template.exposed_port,
        template_type=f"template_{template.id}"
    )
    
    session.add(deployment)
    
    # Increment usage count
    template.usage_count += 1
    template.updated_at = datetime.utcnow()
    
    session.commit()
    session.refresh(deployment)
    
    return {
        "deployment_id": deployment.id,
        "name": deployment.name,
        "status": deployment.status.value,
        "message": "Deployment created from template successfully"
    }


@router.delete("/templates/{template_id}")
async def delete_template(
    template_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Delete a template"""
    
    template = session.get(DeploymentTemplate, template_id)
    
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    
    # Only owner can delete
    if template.user_id != current_user.clerk_id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Cannot delete official templates
    if template.is_official:
        raise HTTPException(status_code=403, detail="Cannot delete official templates")
    
    session.delete(template)
    session.commit()
    
    return {"message": "Template deleted successfully"}
