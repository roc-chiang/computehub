"""
Decorators for protecting Pro features and other common functionality.
"""

from functools import wraps
from fastapi import HTTPException
from sqlmodel import Session
from app.services.license_checker import LicenseChecker


def require_pro_license(func):
    """
    Decorator to protect Pro-only features.
    
    Usage:
        @router.post("/batch/start")
        @require_pro_license
        async def batch_start_deployments(...):
            ...
    
    Raises:
        HTTPException: 403 if Pro License is not activated
    """
    @wraps(func)
    async def wrapper(*args, **kwargs):
        db = kwargs.get("session") or kwargs.get("db")
        if db is None:
            db = next((arg for arg in args if isinstance(arg, Session)), None)

        if not isinstance(db, Session):
            raise HTTPException(
                status_code=500,
                detail="Database session not available"
            )
        
        # Check Pro License status
        checker = LicenseChecker(db)
        if not checker.is_pro_enabled():
            raise HTTPException(
                status_code=403,
                detail={
                    "error": "Pro License Required",
                    "message": "This feature requires an active Pro License.",
                    "action": "Visit /settings/license to activate your license",
                    "purchase_url": "https://gumroad.com/l/computehub-pro"
                }
            )
        
        return await func(*args, **kwargs)
    
    return wrapper
