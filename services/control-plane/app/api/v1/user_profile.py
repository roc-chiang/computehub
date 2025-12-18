from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Header
from sqlmodel import Session, select
from pydantic import BaseModel
import json

from app.core.db import get_session
from app.core.models import User
from app.core.auth import get_current_user_id

router = APIRouter()

# Helper function to extract user_id from Authorization header
def get_user_from_token(
    authorization: str = Header(...),
    session: Session = Depends(get_session)
) -> str:
    """Extract user_id from Authorization header"""
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid authorization header")
    token = authorization.split(" ")[1]
    return get_current_user_id(token, session)

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
    user_id: str = Depends(get_user_from_token),
    session: Session = Depends(get_session)
):
    """
    Get current user's profile information.
    Includes user details and preferences.
    """
    # Get user from database, create if doesn't exist
    user = session.exec(
        select(User).where(User.clerk_id == user_id)
    ).first()
    
    if not user:
        # Create user on first access
        # We don't have email from token, so we'll use a placeholder
        # The email should be updated from Clerk webhook or another source
        user = User(
            clerk_id=user_id,
            email=f"{user_id}@clerk.user",  # Placeholder
            auth_provider="clerk",
            plan="free"
        )
        session.add(user)
        session.commit()
        session.refresh(user)
    
    # Parse preferences
    preferences = UserPreferences()
    if user.preferences_json:
        try:
            prefs_data = json.loads(user.preferences_json)
            preferences = UserPreferences(**prefs_data)
        except (json.JSONDecodeError, ValueError):
            # If parsing fails, use defaults
            pass
    
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
    user_id: str = Depends(get_user_from_token),
    session: Session = Depends(get_session)
):
    """
    Get current user's preferences.
    Returns default preferences if none are set.
    """
    user = session.exec(
        select(User).where(User.clerk_id == user_id)
    ).first()
    
    if not user:
        # Create user on first access
        user = User(
            clerk_id=user_id,
            email=f"{user_id}@clerk.user",
            auth_provider="clerk",
            plan="free"
        )
        session.add(user)
        session.commit()
        session.refresh(user)
    
    # Parse preferences
    if user.preferences_json:
        try:
            prefs_data = json.loads(user.preferences_json)
            return UserPreferences(**prefs_data)
        except (json.JSONDecodeError, ValueError):
            pass
    
    # Return defaults
    return UserPreferences()


@router.patch("/user/preferences", response_model=UserPreferences)
async def update_user_preferences(
    preferences_update: UpdatePreferencesRequest,
    user_id: str = Depends(get_user_from_token),
    session: Session = Depends(get_session)
):
    """
    Update current user's preferences.
    Only updates fields that are provided.
    """
    user = session.exec(
        select(User).where(User.clerk_id == user_id)
    ).first()
    
    if not user:
        # Create user on first access
        user = User(
            clerk_id=user_id,
            email=f"{user_id}@clerk.user",
            auth_provider="clerk",
            plan="free"
        )
        session.add(user)
        session.commit()
        session.refresh(user)
    
    # Get current preferences
    current_prefs = UserPreferences()
    if user.preferences_json:
        try:
            prefs_data = json.loads(user.preferences_json)
            current_prefs = UserPreferences(**prefs_data)
        except (json.JSONDecodeError, ValueError):
            pass
    
    # Update preferences
    update_data = preferences_update.dict(exclude_unset=True)
    for key, value in update_data.items():
        if hasattr(current_prefs, key):
            setattr(current_prefs, key, value)
    
    # Validate values
    if current_prefs.language not in ["en", "zh"]:
        raise HTTPException(status_code=400, detail="Invalid language. Must be 'en' or 'zh'")
    
    if current_prefs.theme not in ["light", "dark", "auto"]:
        raise HTTPException(status_code=400, detail="Invalid theme. Must be 'light', 'dark', or 'auto'")
    
    # Save to database
    user.preferences_json = json.dumps(current_prefs.dict())
    session.add(user)
    session.commit()
    session.refresh(user)
    
    return current_prefs
