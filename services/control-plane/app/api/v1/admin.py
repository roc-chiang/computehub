from typing import List
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from app.core.db import get_session
from app.core.models import Provider, User, ProviderType, SystemSetting

router = APIRouter()

@router.get("/config/public")
async def get_public_config(session: Session = Depends(get_session)):
    """Get public configuration for frontend initialization."""
    import os
    # Try env var first, then database
    clerk_key = os.getenv("NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY")
    if not clerk_key:
        setting = session.get(SystemSetting, "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY")
        clerk_key = setting.value if setting else None
        
    return {
        "clerkPublishableKey": clerk_key
    }



@router.get("/settings", response_model=List[SystemSetting])
async def list_settings(session: Session = Depends(get_session)):
    """List all system settings."""
    return session.exec(select(SystemSetting)).all()

@router.post("/settings", response_model=SystemSetting)
async def update_setting(setting: SystemSetting, session: Session = Depends(get_session)):
    """Create or Update a system setting."""
    existing = session.get(SystemSetting, setting.key)
    if existing:
        existing.value = setting.value
        existing.description = setting.description or existing.description
        existing.is_secret = setting.is_secret
        existing.updated_at = datetime.utcnow()
        session.add(existing)
    else:
        setting.updated_at = datetime.utcnow()
        session.add(setting)
    
    session.commit()
    session.refresh(existing if existing else setting)
    return existing if existing else setting

@router.get("/settings/{key}", response_model=SystemSetting)
async def get_setting(key: str, session: Session = Depends(get_session)):
    setting = session.get(SystemSetting, key)
    if not setting:
        raise HTTPException(status_code=404, detail="Setting not found")
    return setting

# For this MVP step, we will make it open or just rely on the fact it's an "admin" route.


@router.get("/providers", response_model=List[Provider])
async def list_providers(session: Session = Depends(get_session)):
    """List all configured providers."""
    providers = session.exec(select(Provider)).all()
    return providers

@router.post("/providers", response_model=Provider)
async def create_provider(provider: Provider, session: Session = Depends(get_session)):
    """Add a new provider configuration."""
    # Check if name exists
    existing = session.exec(select(Provider).where(Provider.name == provider.name)).first()
    if existing:
        raise HTTPException(status_code=400, detail="Provider with this name already exists")
    
    session.add(provider)
    session.commit()
    session.refresh(provider)
    return provider

@router.put("/providers/{provider_id}", response_model=Provider)
async def update_provider(provider_id: int, provider_update: Provider, session: Session = Depends(get_session)):
    """Update a provider configuration."""
    db_provider = session.get(Provider, provider_id)
    if not db_provider:
        raise HTTPException(status_code=404, detail="Provider not found")
    
    provider_data = provider_update.dict(exclude_unset=True)
    for key, value in provider_data.items():
        setattr(db_provider, key, value)
        
    session.add(db_provider)
    session.commit()
    session.refresh(db_provider)
    return db_provider

@router.delete("/providers/{provider_id}")
async def delete_provider(provider_id: int, session: Session = Depends(get_session)):
    """Delete a provider configuration."""
    db_provider = session.get(Provider, provider_id)
    if not db_provider:
        raise HTTPException(status_code=404, detail="Provider not found")
    
    session.delete(db_provider)
    session.commit()
    return {"ok": True}
