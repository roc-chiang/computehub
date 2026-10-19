from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from pydantic import BaseModel, ConfigDict
from datetime import datetime

from app.core.db import get_session
from app.core.models import Provider, ProviderType
from app.api.v1.audit import create_audit_log
from app.core.encryption import encrypt_value

router = APIRouter()

# ============================================================================
# Request/Response Models
# ============================================================================

class ProviderCreate(BaseModel):
    name: str
    type: ProviderType
    api_key: Optional[str] = None
    config_json: Optional[str] = None
    is_enabled: bool = True
    display_name: Optional[str] = None

class ProviderUpdate(BaseModel):
    name: Optional[str] = None
    api_key: Optional[str] = None
    config_json: Optional[str] = None
    is_enabled: Optional[bool] = None
    display_name: Optional[str] = None
    weight: Optional[int] = None

class ProviderResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    name: str
    type: ProviderType
    is_enabled: bool
    display_name: Optional[str]
    weight: int
    created_at: datetime
    updated_at: datetime

# ============================================================================
# CRUD Endpoints
# ============================================================================

@router.get("/providers", response_model=List[ProviderResponse])
async def list_providers(
    session: Session = Depends(get_session)
):
    """List all providers."""
    providers = session.exec(select(Provider)).all()
    return providers

@router.get("/providers/{provider_id}", response_model=ProviderResponse)
async def get_provider(
    provider_id: int,
    session: Session = Depends(get_session)
):
    """Get a specific provider."""
    provider = session.get(Provider, provider_id)
    if not provider:
        raise HTTPException(status_code=404, detail="Provider not found")
    return provider

@router.post("/providers", response_model=ProviderResponse)
async def create_provider(
    provider_data: ProviderCreate,
    session: Session = Depends(get_session)
):
    """Create a new provider."""
    # Check if provider with same name exists
    existing = session.exec(
        select(Provider).where(Provider.name == provider_data.name)
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Provider with this name already exists")
    
    create_data = provider_data.model_dump()
    if create_data.get("api_key"):
        create_data["api_key"] = encrypt_value(create_data["api_key"])
    provider = Provider(**create_data)
    session.add(provider)
    session.commit()
    session.refresh(provider)
    
    # Create audit log
    create_audit_log(
        session=session,
        action_type="CREATE",
        resource_type="provider",
        resource_id=str(provider.id),
        user_id="admin",
        user_email="admin@system",
        is_admin=True,
        description=f"Created provider: {provider.name}",
        status="success"
    )
    
    return provider

@router.patch("/providers/{provider_id}", response_model=ProviderResponse)
async def update_provider(
    provider_id: int,
    provider_data: ProviderUpdate,
    session: Session = Depends(get_session)
):
    """Update a provider."""
    provider = session.get(Provider, provider_id)
    if not provider:
        raise HTTPException(status_code=404, detail="Provider not found")
    
    # Update fields
    update_data = provider_data.model_dump(exclude_unset=True)
    if update_data.get("api_key"):
        update_data["api_key"] = encrypt_value(update_data["api_key"])
    for key, value in update_data.items():
        setattr(provider, key, value)
    
    provider.updated_at = datetime.utcnow()
    session.add(provider)
    session.commit()
    session.refresh(provider)
    
    # Create audit log
    create_audit_log(
        session=session,
        action_type="UPDATE",
        resource_type="provider",
        resource_id=str(provider.id),
        user_id="admin",
        user_email="admin@system",
        is_admin=True,
        description=f"Updated provider: {provider.name}",
        details_json=str(update_data),
        status="success"
    )
    
    return provider

@router.delete("/providers/{provider_id}")
async def delete_provider(
    provider_id: int,
    session: Session = Depends(get_session)
):
    """Delete a provider."""
    provider = session.get(Provider, provider_id)
    if not provider:
        raise HTTPException(status_code=404, detail="Provider not found")
    
    provider_name = provider.name
    session.delete(provider)
    session.commit()
    
    # Create audit log
    create_audit_log(
        session=session,
        action_type="DELETE",
        resource_type="provider",
        resource_id=str(provider_id),
        user_id="admin",
        user_email="admin@system",
        is_admin=True,
        description=f"Deleted provider: {provider_name}",
        status="success"
    )
    
    return {"message": "Provider deleted successfully"}
