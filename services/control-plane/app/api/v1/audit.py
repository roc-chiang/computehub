from typing import List, Optional
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, Query, Request
from sqlmodel import Session, select, or_
from app.core.db import get_session
from app.core.models import AuditLog
from pydantic import BaseModel
import json

router = APIRouter()

# Helper function to create audit log
async def create_audit_log(
    session: Session,
    action_type: str,
    resource_type: str,
    description: str,
    user_id: Optional[str] = None,
    user_email: Optional[str] = None,
    resource_id: Optional[str] = None,
    details: Optional[dict] = None,
    ip_address: Optional[str] = None,
    user_agent: Optional[str] = None,
    is_admin: bool = False,
    status: str = "success",
    error_message: Optional[str] = None
):
    """
    Create an audit log entry.
    This function should be called whenever an important action occurs.
    """
    log = AuditLog(
        action_type=action_type,
        resource_type=resource_type,
        resource_id=resource_id,
        user_id=user_id,
        user_email=user_email,
        is_admin=is_admin,
        ip_address=ip_address,
        user_agent=user_agent,
        description=description,
        details_json=json.dumps(details) if details else None,
        status=status,
        error_message=error_message
    )
    session.add(log)
    session.commit()
    return log


# Response Models
class AuditLogItem(BaseModel):
    id: int
    timestamp: datetime
    action_type: str
    resource_type: str
    resource_id: Optional[str]
    user_email: Optional[str]
    is_admin: bool
    description: str
    status: str
    ip_address: Optional[str]


class AuditLogDetail(BaseModel):
    id: int
    timestamp: datetime
    action_type: str
    resource_type: str
    resource_id: Optional[str]
    user_id: Optional[str]
    user_email: Optional[str]
    is_admin: bool
    ip_address: Optional[str]
    user_agent: Optional[str]
    description: str
    details_json: Optional[str]
    status: str
    error_message: Optional[str]


# API Endpoints

@router.get("/audit/logs", response_model=List[AuditLogItem])
async def list_audit_logs(
    action_type: Optional[str] = Query(None, description="Filter by action type"),
    resource_type: Optional[str] = Query(None, description="Filter by resource type"),
    user_email: Optional[str] = Query(None, description="Filter by user email"),
    status: Optional[str] = Query(None, description="Filter by status (success/failed)"),
    start_date: Optional[str] = Query(None, description="Start date (ISO format)"),
    end_date: Optional[str] = Query(None, description="End date (ISO format)"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    session: Session = Depends(get_session)
):
    """
    List audit logs with filtering and pagination.
    """
    # Build query
    query = select(AuditLog)
    
    # Apply filters
    if action_type:
        query = query.where(AuditLog.action_type == action_type)
    
    if resource_type:
        query = query.where(AuditLog.resource_type == resource_type)
    
    if user_email:
        query = query.where(AuditLog.user_email.contains(user_email))
    
    if status:
        query = query.where(AuditLog.status == status)
    
    # Date range filter
    if start_date:
        start_dt = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
        query = query.where(AuditLog.timestamp >= start_dt)
    
    if end_date:
        end_dt = datetime.fromisoformat(end_date.replace('Z', '+00:00'))
        query = query.where(AuditLog.timestamp <= end_dt)
    
    # Order by timestamp (most recent first)
    query = query.order_by(AuditLog.timestamp.desc())
    
    # Apply pagination
    query = query.offset(skip).limit(limit)
    
    logs = session.exec(query).all()
    
    # Convert to response model
    return [
        AuditLogItem(
            id=log.id,
            timestamp=log.timestamp,
            action_type=log.action_type,
            resource_type=log.resource_type,
            resource_id=log.resource_id,
            user_email=log.user_email,
            is_admin=log.is_admin,
            description=log.description,
            status=log.status,
            ip_address=log.ip_address
        )
        for log in logs
    ]


@router.get("/audit/logs/{log_id}", response_model=AuditLogDetail)
async def get_audit_log_detail(
    log_id: int,
    session: Session = Depends(get_session)
):
    """
    Get detailed information about a specific audit log entry.
    """
    log = session.get(AuditLog, log_id)
    if not log:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Audit log not found")
    
    return AuditLogDetail(
        id=log.id,
        timestamp=log.timestamp,
        action_type=log.action_type,
        resource_type=log.resource_type,
        resource_id=log.resource_id,
        user_id=log.user_id,
        user_email=log.user_email,
        is_admin=log.is_admin,
        ip_address=log.ip_address,
        user_agent=log.user_agent,
        description=log.description,
        details_json=log.details_json,
        status=log.status,
        error_message=log.error_message
    )


@router.get("/audit/stats")
async def get_audit_stats(
    session: Session = Depends(get_session)
):
    """
    Get audit log statistics.
    """
    # Get total count
    total_logs = len(session.exec(select(AuditLog)).all())
    
    # Get counts by action type
    logs = session.exec(select(AuditLog)).all()
    
    action_types = {}
    resource_types = {}
    status_counts = {"success": 0, "failed": 0, "error": 0}
    
    for log in logs:
        # Count by action type
        action_types[log.action_type] = action_types.get(log.action_type, 0) + 1
        
        # Count by resource type
        resource_types[log.resource_type] = resource_types.get(log.resource_type, 0) + 1
        
        # Count by status
        if log.status in status_counts:
            status_counts[log.status] += 1
    
    # Get recent activity (last 24 hours)
    yesterday = datetime.utcnow() - timedelta(days=1)
    recent_logs = session.exec(
        select(AuditLog).where(AuditLog.timestamp >= yesterday)
    ).all()
    
    return {
        "total_logs": total_logs,
        "recent_24h": len(recent_logs),
        "by_action_type": action_types,
        "by_resource_type": resource_types,
        "by_status": status_counts
    }
