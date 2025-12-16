"""
User Provider Binding API endpoints
Allows users to manage their own GPU provider API keys
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Header
from sqlmodel import Session, select
from datetime import datetime
from pydantic import BaseModel

from app.core.db import get_session
from app.core.models import UserProviderBinding, ProviderType
from app.core.encryption import get_encryption
from app.core.auth import get_current_user_id, verify_token
from app.core.provider_manager import ProviderManager

router = APIRouter()


# Pydantic models for requests/responses
class ProviderBindingCreate(BaseModel):
    provider_type: ProviderType
    api_key: str
    display_name: Optional[str] = None


class ProviderBindingUpdate(BaseModel):
    api_key: Optional[str] = None
    display_name: Optional[str] = None
    is_active: Optional[bool] = None


class ProviderBindingResponse(BaseModel):
    id: int
    provider_type: ProviderType
    display_name: Optional[str]
    is_active: bool
    last_verified: Optional[datetime]
    created_at: datetime
    updated_at: datetime
    # Note: api_key is NOT included in response for security


def get_user_from_token(
    authorization: str = Header(...),
    session: Session = Depends(get_session)
) -> str:
    """Extract user_id from Authorization header"""
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid authorization header")
    token = authorization.split(" ")[1]
    return get_current_user_id(token, session)


@router.get("/user-providers", response_model=List[ProviderBindingResponse])
async def list_user_provider_bindings(
    user_id: str = Depends(get_user_from_token),
    session: Session = Depends(get_session)
):
    """List all provider bindings for the current user"""
    statement = select(UserProviderBinding).where(
        UserProviderBinding.user_id == user_id
    )
    bindings = session.exec(statement).all()
    
    return [
        ProviderBindingResponse(
            id=b.id,
            provider_type=b.provider_type,
            display_name=b.display_name,
            is_active=b.is_active,
            last_verified=b.last_verified,
            created_at=b.created_at,
            updated_at=b.updated_at
        )
        for b in bindings
    ]


@router.post("/user-providers", response_model=ProviderBindingResponse)
async def create_provider_binding(
    binding_data: ProviderBindingCreate,
    user_id: str = Depends(get_user_from_token),
    session: Session = Depends(get_session)
):
    """Create a new provider binding for the current user"""
    
    try:
        print(f"[DEBUG] Creating binding for user: {user_id}, provider: {binding_data.provider_type}")
        
        # Check if binding already exists for this provider
        existing = session.exec(
            select(UserProviderBinding).where(
                UserProviderBinding.user_id == user_id,
                UserProviderBinding.provider_type == binding_data.provider_type
            )
        ).first()
        
        if existing:
            raise HTTPException(
                status_code=400,
                detail=f"Binding for {binding_data.provider_type} already exists. Use PATCH to update."
            )
        
        # Encrypt the API key
        print(f"[DEBUG] Encrypting API key...")
        encryption = get_encryption()
        encrypted_key = encryption.encrypt(binding_data.api_key)
        print(f"[DEBUG] API key encrypted successfully")
        
        # Create binding
        binding = UserProviderBinding(
            user_id=user_id,
            provider_type=binding_data.provider_type,
            api_key_encrypted=encrypted_key,
            display_name=binding_data.display_name
        )
        
        print(f"[DEBUG] Saving binding to database...")
        session.add(binding)
        session.commit()
        session.refresh(binding)
        print(f"[DEBUG] Binding created successfully with ID: {binding.id}")
        
        return ProviderBindingResponse(
            id=binding.id,
            provider_type=binding.provider_type,
            display_name=binding.display_name,
            is_active=binding.is_active,
            last_verified=binding.last_verified,
            created_at=binding.created_at,
            updated_at=binding.updated_at
        )
    except HTTPException:
        raise
    except Exception as e:
        print(f"[ERROR] Failed to create provider binding: {type(e).__name__}: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail=f"Failed to create provider binding: {str(e)}"
        )


@router.patch("/user-providers/{binding_id}", response_model=ProviderBindingResponse)
async def update_provider_binding(
    binding_id: int,
    binding_data: ProviderBindingUpdate,
    user_id: str = Depends(get_user_from_token),
    session: Session = Depends(get_session)
):
    """Update an existing provider binding"""
    
    # Get binding and verify ownership
    binding = session.get(UserProviderBinding, binding_id)
    if not binding or binding.user_id != user_id:
        raise HTTPException(status_code=404, detail="Binding not found")
    
    # Update fields
    if binding_data.api_key is not None:
        encryption = get_encryption()
        binding.api_key_encrypted = encryption.encrypt(binding_data.api_key)
    
    if binding_data.display_name is not None:
        binding.display_name = binding_data.display_name
    
    if binding_data.is_active is not None:
        binding.is_active = binding_data.is_active
    
    binding.updated_at = datetime.utcnow()
    
    session.add(binding)
    session.commit()
    session.refresh(binding)
    
    return ProviderBindingResponse(
        id=binding.id,
        provider_type=binding.provider_type,
        display_name=binding.display_name,
        is_active=binding.is_active,
        last_verified=binding.last_verified,
        created_at=binding.created_at,
        updated_at=binding.updated_at
    )


@router.delete("/user-providers/{binding_id}")
async def delete_provider_binding(
    binding_id: int,
    user_id: str = Depends(get_user_from_token),
    session: Session = Depends(get_session)
):
    """Delete a provider binding"""
    
    # Get binding and verify ownership
    binding = session.get(UserProviderBinding, binding_id)
    if not binding or binding.user_id != user_id:
        raise HTTPException(status_code=404, detail="Binding not found")
    
    session.delete(binding)
    session.commit()
    
    return {"message": "Binding deleted successfully"}


@router.post("/user-providers/{binding_id}/verify")
async def verify_provider_binding(
    binding_id: int,
    user_id: str = Depends(get_user_from_token),
    session: Session = Depends(get_session)
):
    """Verify that the API key works by making a test call to the provider"""
    
    # Get binding and verify ownership
    binding = session.get(UserProviderBinding, binding_id)
    if not binding or binding.user_id != user_id:
        raise HTTPException(status_code=404, detail="Binding not found")
    
    # Decrypt API key
    encryption = get_encryption()
    api_key = encryption.decrypt(binding.api_key_encrypted)
    
    # Test the API key with the provider
    try:
        adapter = ProviderManager.get_adapter(binding.provider_type.value, session)
        # Try to get pricing as a simple test
        test_result = await adapter.get_pricing("RTX 4090")
        
        # Update last_verified timestamp
        binding.last_verified = datetime.utcnow()
        session.add(binding)
        session.commit()
        
        return {
            "verified": True,
            "message": "API key verified successfully",
            "last_verified": binding.last_verified
        }
    except Exception as e:
        return {
            "verified": False,
            "message": f"Verification failed: {str(e)}"
        }
