from fastapi import APIRouter, Depends
from sqlmodel import Session
from app.core.db import get_session
from app.core.models import SystemSetting

router = APIRouter()
public_router = APIRouter()

@public_router.get("/config/public")
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

__all__ = ["public_router"]
