"""
License verification API endpoints.
"""

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlmodel import Session, select
from pydantic import BaseModel
from datetime import datetime
from app.database import get_session
from app.models import License, VerificationLog

router = APIRouter(prefix="/api", tags=["verification"])


class VerifyRequest(BaseModel):
    """Request model for license verification."""
    license_key: str


class VerifyResponse(BaseModel):
    """Response model for license verification."""
    valid: bool
    message: str
    activated_at: str | None = None


class RevokeRequest(BaseModel):
    """Request model for license revocation."""
    license_key: str
    reason: str
    api_secret: str


class RevokeResponse(BaseModel):
    """Response model for license revocation."""
    success: bool
    message: str


@router.post("/verify", response_model=VerifyResponse)
async def verify_license(
    request_data: VerifyRequest,
    http_request: Request,
    db: Session = Depends(get_session)
):
    """
    Verify a license key.
    
    Returns whether the license is valid and active.
    """
    license_key = request_data.license_key.strip().upper()
    
    # Get client info
    ip_address = http_request.client.host if http_request.client else None
    user_agent = http_request.headers.get("user-agent")
    
    try:
        # Query license
        statement = select(License).where(License.license_key == license_key)
        license_record = db.exec(statement).first()
        
        if not license_record:
            # Log failed verification
            log = VerificationLog(
                license_key=license_key,
                ip_address=ip_address,
                user_agent=user_agent,
                success=False,
                error_message="License key not found"
            )
            db.add(log)
            db.commit()
            
            return VerifyResponse(
                valid=False,
                message="Invalid license key"
            )
        
        # Check if revoked
        if not license_record.is_active or license_record.revoked_at:
            # Log failed verification
            log = VerificationLog(
                license_key=license_key,
                ip_address=ip_address,
                user_agent=user_agent,
                success=False,
                error_message="License revoked"
            )
            db.add(log)
            db.commit()
            
            return VerifyResponse(
                valid=False,
                message=f"License has been revoked: {license_record.revoked_reason or 'No reason provided'}"
            )
        
        # Update activation timestamp if first time
        if not license_record.activated_at:
            license_record.activated_at = datetime.utcnow()
            db.add(license_record)
            db.commit()
        
        # Log successful verification
        log = VerificationLog(
            license_key=license_key,
            ip_address=ip_address,
            user_agent=user_agent,
            success=True
        )
        db.add(log)
        db.commit()
        
        return VerifyResponse(
            valid=True,
            message="License is valid",
            activated_at=license_record.activated_at.isoformat() if license_record.activated_at else None
        )
        
    except Exception as e:
        # Log error
        log = VerificationLog(
            license_key=license_key,
            ip_address=ip_address,
            user_agent=user_agent,
            success=False,
            error_message=str(e)
        )
        db.add(log)
        db.commit()
        
        raise HTTPException(status_code=500, detail="Verification failed")


@router.post("/revoke", response_model=RevokeResponse)
async def revoke_license(
    request_data: RevokeRequest,
    db: Session = Depends(get_session)
):
    """
    Revoke a license key (admin only).
    
    Requires API secret key for authentication.
    """
    # Verify API secret (simple authentication)
    # In production, use proper authentication
    import os
    api_secret = os.getenv("API_SECRET_KEY", "change-me-in-production")
    
    if request_data.api_secret != api_secret:
        raise HTTPException(status_code=403, detail="Invalid API secret")
    
    license_key = request_data.license_key.strip().upper()
    
    # Query license
    statement = select(License).where(License.license_key == license_key)
    license_record = db.exec(statement).first()
    
    if not license_record:
        return RevokeResponse(
            success=False,
            message="License key not found"
        )
    
    # Revoke license
    license_record.is_active = False
    license_record.revoked_at = datetime.utcnow()
    license_record.revoked_reason = request_data.reason
    
    db.add(license_record)
    db.commit()
    
    return RevokeResponse(
        success=True,
        message="License revoked successfully"
    )
