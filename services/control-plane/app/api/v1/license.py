"""
License management API endpoints.

Handles Pro License activation, status checking, and deactivation.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session
from pydantic import BaseModel
from app.core.db import get_session
from app.services.license_checker import LicenseChecker


router = APIRouter(prefix="/license", tags=["license"])


class LicenseActivateRequest(BaseModel):
    """Request model for license activation."""
    license_key: str


class LicenseActivateResponse(BaseModel):
    """Response model for license activation."""
    success: bool
    message: str
    license_key: str
    activated_at: str
    is_pro_enabled: bool


class LicenseStatusResponse(BaseModel):
    """Response model for license status."""
    is_pro_enabled: bool
    message: str
    license_key: str | None = None
    activated_at: str | None = None


class LicenseDeactivateResponse(BaseModel):
    """Response model for license deactivation."""
    success: bool
    message: str


@router.post("/activate", response_model=LicenseActivateResponse)
async def activate_license(
    request: LicenseActivateRequest,
    db: Session = Depends(get_session)
):
    """
    Activate a Pro License.
    
    This endpoint validates and activates a Pro License key.
    Once activated, all Pro features will be unlocked.
    
    Args:
        request: License activation request with license_key
        db: Database session
        
    Returns:
        Activation status and details
        
    Raises:
        HTTPException: 400 if license key is invalid
    """
    checker = LicenseChecker(db)
    
    try:
        result = checker.activate_license(request.license_key)
        return LicenseActivateResponse(**result)
    except ValueError as e:
        raise HTTPException(
            status_code=400,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to activate license: {str(e)}"
        )


@router.get("/status", response_model=LicenseStatusResponse)
async def get_license_status(
    db: Session = Depends(get_session)
):
    """
    Get current License status.
    
    Returns information about the currently activated Pro License,
    or indicates that no license is active.
    
    Args:
        db: Database session
        
    Returns:
        License status information
    """
    checker = LicenseChecker(db)
    status = checker.get_license_status()
    
    return LicenseStatusResponse(**status)


@router.delete("/deactivate", response_model=LicenseDeactivateResponse)
async def deactivate_license(
    db: Session = Depends(get_session)
):
    """
    Deactivate the current Pro License.
    
    This will disable all Pro features. The license key can be
    reactivated later if needed.
    
    Args:
        db: Database session
        
    Returns:
        Deactivation status
    """
    checker = LicenseChecker(db)
    success = checker.deactivate_license()
    
    if success:
        return LicenseDeactivateResponse(
            success=True,
            message="Pro License deactivated successfully"
        )
    else:
        return LicenseDeactivateResponse(
            success=False,
            message="No active license to deactivate"
        )
