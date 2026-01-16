from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from app.core.db import get_session
from app.core.models import SystemSetting
from pydantic import BaseModel
import json

router = APIRouter()

# Response Models
class SettingItem(BaseModel):
    key: str
    value: str
    description: Optional[str]
    is_secret: bool

class SettingUpdate(BaseModel):
    value: str

class BulkSettingUpdate(BaseModel):
    settings: Dict[str, str]

# Predefined setting categories and defaults
DEFAULT_SETTINGS = {
    # Platform Information
    "platform_name": {
        "value": "ComputeHub",
        "description": "Platform display name",
        "is_secret": False
    },
    "support_email": {
        "value": "support@computehub.com",
        "description": "Support contact email",
        "is_secret": False
    },
    "platform_url": {
        "value": "https://computehub.com",
        "description": "Platform URL",
        "is_secret": False
    },
    
    # Pricing Configuration
    "service_fee_percentage": {
        "value": "10",
        "description": "Service fee percentage (0-100)",
        "is_secret": False
    },
    "free_tier_gpu_hours": {
        "value": "10",
        "description": "Free tier GPU hours per month",
        "is_secret": False
    },
    "pro_monthly_price": {
        "value": "29.99",
        "description": "Pro plan monthly price (USD)",
        "is_secret": False
    },
    "team_monthly_price": {
        "value": "99.99",
        "description": "Team plan monthly price (USD)",
        "is_secret": False
    },
    "enterprise_monthly_price": {
        "value": "499.99",
        "description": "Enterprise plan monthly price (USD)",
        "is_secret": False
    },
    
    # Feature Toggles
    "enable_new_signups": {
        "value": "true",
        "description": "Allow new user registrations",
        "is_secret": False
    },
    "enable_service_fee": {
        "value": "true",
        "description": "Enable service fee on deployments",
        "is_secret": False
    },
    "enable_auto_scheduling": {
        "value": "true",
        "description": "Enable automatic provider scheduling",
        "is_secret": False
    },
    "enable_auto_recovery": {
        "value": "false",
        "description": "Enable automatic deployment recovery",
        "is_secret": False
    },
    
    # Limits
    "max_deployments_per_user": {
        "value": "10",
        "description": "Maximum deployments per user (free tier)",
        "is_secret": False
    },
    "max_gpu_hours_per_month": {
        "value": "100",
        "description": "Maximum GPU hours per month (free tier)",
        "is_secret": False
    },
    
    
    # Stripe Payment Configuration - REMOVED
    # Migrating to License-based system
    

    # Notification System Configuration
    "telegram_bot_token": {
        "value": "",
        "description": "Telegram Bot Token (encrypted)",
        "is_secret": True
    },
    "telegram_bot_username": {
        "value": "",
        "description": "Telegram Bot Username (e.g., ComputeHubBot)",
        "is_secret": False
    },
    "smtp_host": {
        "value": "smtp.gmail.com",
        "description": "SMTP Server Host",
        "is_secret": False
    },
    "smtp_port": {
        "value": "587",
        "description": "SMTP Server Port",
        "is_secret": False
    },
    "smtp_user": {
        "value": "",
        "description": "SMTP Username/Email",
        "is_secret": False
    },
    "smtp_password": {
        "value": "",
        "description": "SMTP Password (encrypted)",
        "is_secret": True
    },
    "smtp_from_email": {
        "value": "noreply@computehub.com",
        "description": "From Email Address",
        "is_secret": False
    },
    "smtp_from_name": {
        "value": "ComputeHub",
        "description": "From Name",
        "is_secret": False
    },
}

# Helper function to initialize default settings
async def init_default_settings(session: Session):
    """Initialize default settings if they don't exist."""
    for key, config in DEFAULT_SETTINGS.items():
        existing = session.get(SystemSetting, key)
        if not existing:
            setting = SystemSetting(
                key=key,
                value=config["value"],
                description=config["description"],
                is_secret=config["is_secret"]
            )
            session.add(setting)
    session.commit()

# API Endpoints

@router.get("/settings", response_model=List[SettingItem])
async def get_all_settings(
    include_secrets: bool = False,
    session: Session = Depends(get_session)
):
    """
    Get all system settings.
    Secrets are masked unless include_secrets=true.
    """
    # Initialize defaults if needed
    await init_default_settings(session)
    
    settings = session.exec(select(SystemSetting)).all()
    
    result = []
    for setting in settings:
        value = setting.value
        # Mask secret values unless explicitly requested
        if setting.is_secret and not include_secrets:
            value = "********"
        
        result.append(SettingItem(
            key=setting.key,
            value=value,
            description=setting.description,
            is_secret=setting.is_secret
        ))
    
    return result


@router.get("/settings/{key}", response_model=SettingItem)
async def get_setting(
    key: str,
    include_secret: bool = False,
    session: Session = Depends(get_session)
):
    """Get a specific setting by key."""
    setting = session.get(SystemSetting, key)
    if not setting:
        raise HTTPException(status_code=404, detail="Setting not found")
    
    value = setting.value
    if setting.is_secret and not include_secret:
        value = "********"
    
    return SettingItem(
        key=setting.key,
        value=value,
        description=setting.description,
        is_secret=setting.is_secret
    )


@router.put("/settings/{key}")
async def update_setting(
    key: str,
    update: SettingUpdate,
    session: Session = Depends(get_session)
):
    """Update a specific setting."""
    setting = session.get(SystemSetting, key)
    
    if not setting:
        # Create new setting if it doesn't exist
        setting = SystemSetting(
            key=key,
            value=update.value,
            description=None,
            is_secret=False
        )
        session.add(setting)
    else:
        setting.value = update.value
        session.add(setting)
    
    session.commit()
    session.refresh(setting)
    
    return {
        "ok": True,
        "message": f"Setting '{key}' updated successfully",
        "key": setting.key,
        "value": setting.value
    }


@router.post("/settings/bulk")
async def bulk_update_settings(
    updates: BulkSettingUpdate,
    session: Session = Depends(get_session)
):
    """Update multiple settings at once."""
    updated = []
    failed = []
    
    for key, value in updates.settings.items():
        try:
            setting = session.get(SystemSetting, key)
            
            if not setting:
                setting = SystemSetting(
                    key=key,
                    value=value,
                    description=None,
                    is_secret=False
                )
                session.add(setting)
            else:
                setting.value = value
                session.add(setting)
            
            updated.append(key)
        except Exception as e:
            failed.append({"key": key, "error": str(e)})
    
    session.commit()
    
    return {
        "ok": True,
        "updated": len(updated),
        "failed": len(failed),
        "updated_keys": updated,
        "failed_items": failed
    }


@router.get("/settings/category/{category}")
async def get_settings_by_category(
    category: str,
    session: Session = Depends(get_session)
):
    """
    Get settings by category.
    Categories: platform, pricing, features, limits
    """
    # Initialize defaults if needed
    await init_default_settings(session)
    
    category_prefixes = {
        "platform": ["platform_", "support_"],
        "pricing": ["_price", "service_fee", "free_tier"],
        "features": ["enable_"],
        "limits": ["max_"]
    }
    
    if category not in category_prefixes:
        raise HTTPException(status_code=400, detail="Invalid category")
    
    all_settings = session.exec(select(SystemSetting)).all()
    
    # Filter settings by category
    prefixes = category_prefixes[category]
    filtered = []
    
    for setting in all_settings:
        if any(prefix in setting.key for prefix in prefixes):
            value = setting.value
            if setting.is_secret:
                value = "********"
            
            filtered.append(SettingItem(
                key=setting.key,
                value=value,
                description=setting.description,
                is_secret=setting.is_secret
            ))
    
    return filtered
