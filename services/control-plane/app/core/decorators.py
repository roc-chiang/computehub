"""
Decorators for protecting Pro features and other common functionality.
"""

from functools import wraps
from fastapi import HTTPException, Depends
from sqlmodel import Session
from app.core.db import get_session
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
    async def wrapper(*args, db: Session = Depends(get_session), **kwargs):
        # Get database session from kwargs or args
        if 'db' not in kwargs:
            # Try to find db in args (usually first positional arg after self)
            for arg in args:
                if isinstance(arg, Session):
                    db = arg
                    break
        
        if db is None:
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
        
        return await func(*args, db=db, **kwargs)
    
    return wrapper
