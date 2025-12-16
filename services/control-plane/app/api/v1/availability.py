from fastapi import APIRouter, Depends, Query, HTTPException
from sqlmodel import Session
from typing import List, Optional
from app.core.db import get_session
from app.services.availability_service import AvailabilityService
from app.api.v1.deployments import get_current_user, User

router = APIRouter()

@router.get("/availability/check")
async def check_availability(
    gpu_type: str = Query(..., description="GPU type to check (e.g., 'RTX 4090')"),
    providers: Optional[str] = Query(None, description="Comma-separated provider names (e.g., 'runpod,vastai')"),
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """
    Check GPU availability across providers
    
    Example: /api/v1/availability/check?gpu_type=RTX 4090&providers=runpod,vastai
    
    Returns:
    {
        "gpu_type": "RTX 4090",
        "availability": {
            "runpod": {
                "available": true,
                "count": 5,
                "price_per_hour": 0.28,
                "regions": [],
                "cached": true,
                "checked_at": "2025-12-12T20:00:00Z"
            },
            "vastai": {...}
        },
        "alternatives": [
            {
                "gpu": "RTX 4080",
                "performance_ratio": 0.85,
                "use_case": "Good for inference, 15% slower"
            }
        ]
    }
    """
    try:
        provider_list = providers.split(",") if providers else None
        
        service = AvailabilityService(session)
        availability = await service.check_gpu_availability(gpu_type, provider_list)
        
        # Get alternatives
        alternatives = service.get_gpu_alternatives(gpu_type)
        
        return {
            "gpu_type": gpu_type,
            "availability": availability,
            "alternatives": alternatives
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to check availability: {str(e)}"
        )

@router.post("/availability/clear-cache")
async def clear_availability_cache(
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """
    Clear expired availability cache entries
    
    Admin endpoint to manually clear cache
    """
    try:
        service = AvailabilityService(session)
        cleared_count = service.clear_expired_cache()
        
        return {
            "message": f"Cleared {cleared_count} expired cache entries",
            "cleared_count": cleared_count
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to clear cache: {str(e)}"
        )
