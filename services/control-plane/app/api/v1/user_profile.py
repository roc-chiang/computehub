from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session
from pydantic import BaseModel
import json

from app.core.db import get_session
from app.core.models import User
from app.core.auth import get_current_user

router = APIRouter()

# Request/Response Models

class UserPreferences(BaseModel):
    """User preferences model"""
    language: str = "en"  # en, zh
    timezone: str = "UTC"
    default_gpu_type: Optional[str] = None
    default_provider: Optional[str] = None
    theme: str = "light"  # light, dark, auto

class UserProfileResponse(BaseModel):
    """User profile information"""
    id: int
    email: str
    clerk_id: Optional[str]
    auth_provider: str
    plan: str
    preferences: UserPreferences
    created_at: str

class UpdatePreferencesRequest(BaseModel):
    """Request model for updating preferences"""
    language: Optional[str] = None
    timezone: Optional[str] = None
    default_gpu_type: Optional[str] = None
    default_provider: Optional[str] = None
    theme: Optional[str] = None


# API Endpoints

@router.get("/user/profile", response_model=UserProfileResponse)
async def get_user_profile(
    user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """
    Get current user's profile information.
    Includes user details and preferences.
    """
    # Parse preferences
    preferences = UserPreferences()
    if user.preferences_json:
        try:
            prefs_data = json.loads(user.preferences_json)
            preferences = UserPreferences(**prefs_data)
        except (json.JSONDecodeError, ValueError) as exc:
            raise HTTPException(status_code=500, detail="Stored user preferences are invalid") from exc
    
    return UserProfileResponse(
        id=user.id,
        email=user.email,
        clerk_id=user.clerk_id,
        auth_provider=user.auth_provider,
        plan=user.plan,
        preferences=preferences,
        created_at=user.created_at.isoformat()
    )


@router.get("/user/preferences", response_model=UserPreferences)
async def get_user_preferences(
    user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """
    Get current user's preferences.
    Returns default preferences if none are set.
    """
    # Parse preferences
    if user.preferences_json:
        try:
            prefs_data = json.loads(user.preferences_json)
            return UserPreferences(**prefs_data)
        except (json.JSONDecodeError, ValueError) as exc:
            raise HTTPException(status_code=500, detail="Stored user preferences are invalid") from exc
    
    # Return defaults
    return UserPreferences()


@router.patch("/user/preferences", response_model=UserPreferences)
async def update_user_preferences(
    preferences_update: UpdatePreferencesRequest,
    user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """
    Update current user's preferences.
    Only updates fields that are provided.
    """
    # Get current preferences
    current_prefs = UserPreferences()
    if user.preferences_json:
        try:
            prefs_data = json.loads(user.preferences_json)
            current_prefs = UserPreferences(**prefs_data)
        except (json.JSONDecodeError, ValueError) as exc:
            raise HTTPException(status_code=500, detail="Stored user preferences are invalid") from exc
    
    # Update preferences
    update_data = preferences_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        if hasattr(current_prefs, key):
            setattr(current_prefs, key, value)
    
    # Validate values
    if current_prefs.language not in ["en", "zh"]:
        raise HTTPException(status_code=400, detail="Invalid language. Must be 'en' or 'zh'")
    
    if current_prefs.theme not in ["light", "dark", "auto"]:
        raise HTTPException(status_code=400, detail="Invalid theme. Must be 'light', 'dark', or 'auto'")
    
    # Save to database
    user.preferences_json = json.dumps(current_prefs.model_dump())
    session.add(user)
    session.commit()
    session.refresh(user)
    
    return current_prefs
