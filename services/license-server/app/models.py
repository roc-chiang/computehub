"""
Database models for License Verification Server.
"""

from typing import Optional
from datetime import datetime
from sqlmodel import Field, SQLModel


class License(SQLModel, table=True):
    """License record model."""
    __tablename__ = "licenses"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    license_key: str = Field(index=True, unique=True)
    email: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    activated_at: Optional[datetime] = None
    revoked_at: Optional[datetime] = None
    revoked_reason: Optional[str] = None
    is_active: bool = Field(default=True)


class VerificationLog(SQLModel, table=True):
    """Verification log model."""
    __tablename__ = "verification_logs"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    license_key: str = Field(index=True)
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    verified_at: datetime = Field(default_factory=datetime.utcnow)
    success: bool = Field(default=False)
    error_message: Optional[str] = None
