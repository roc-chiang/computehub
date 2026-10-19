from typing import List, Optional
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session, select, func, or_
from app.core.db import get_session
from app.core.models import User, Deployment, DeploymentStatus
from app.core.automation_models import CostTracking
from pydantic import BaseModel
from app.core.auth import require_admin

router = APIRouter()

# Response Models
class UserStats(BaseModel):
    total_deployments: int
    active_deployments: int
    total_gpu_hours: float
    total_cost: float
    last_active: Optional[datetime]

class UserListItem(BaseModel):
    id: int
    email: str
    clerk_id: Optional[str]
    plan: str
    is_active: bool
    created_at: datetime
    total_deployments: int
    active_deployments: int
    total_cost: float
    last_active: Optional[datetime]

class UserDetail(BaseModel):
    id: int
    email: str
    clerk_id: Optional[str]
    auth_provider: str
    plan: str
    is_active: bool
    created_at: datetime
    stats: UserStats

class UserUpdate(BaseModel):
    plan: Optional[str] = None
    email: Optional[str] = None

# API Endpoints

@router.get("/users", response_model=List[UserListItem])
async def list_users(
    search: Optional[str] = Query(None, description="Search by email or clerk_id"),
    plan: Optional[str] = Query(None, description="Filter by plan (free, pro, team, enterprise)"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    session: Session = Depends(get_session)
):
    """
    List all users with search and filter capabilities.
    Returns user list with basic stats.
    """
    # Build query
    query = select(User)
    
    # Apply search filter
    if search:
        query = query.where(
            or_(
                User.email.contains(search),
                User.clerk_id.contains(search) if search else False
            )
        )
    
    # Apply plan filter
    if plan:
        query = query.where(User.plan == plan)
    
    # Apply pagination
    query = query.offset(skip).limit(limit)
    
    users = session.exec(query).all()
    
    # Enrich with stats
    result = []
    for user in users:
        # Get deployment stats
        deployments = session.exec(
            select(Deployment).where(Deployment.user_id == user.id)
        ).all()
        
        active_deployments = [d for d in deployments if d.status == DeploymentStatus.RUNNING]
        
        total_cost = session.exec(
            select(func.coalesce(func.sum(CostTracking.cost_usd), 0.0)).where(CostTracking.user_id == user.id)
        ).one()
        
        # Get last active time
        last_active = None
        if deployments:
            last_active = max(d.updated_at for d in deployments)
        
        result.append(UserListItem(
            id=user.id,
            email=user.email,
            clerk_id=user.clerk_id,
            plan=user.plan,
            is_active=user.is_active,
            created_at=user.created_at,
            total_deployments=len(deployments),
            active_deployments=len(active_deployments),
            total_cost=total_cost,
            last_active=last_active
        ))
    
    return result


@router.get("/users/{user_id}", response_model=UserDetail)
async def get_user_details(
    user_id: int,
    session: Session = Depends(get_session)
):
    """
    Get detailed information about a specific user.
    Includes comprehensive stats and usage information.
    """
    user = session.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Get all deployments
    deployments = session.exec(
        select(Deployment).where(Deployment.user_id == user_id)
    ).all()
    
    # Calculate stats
    active_deployments = [d for d in deployments if d.status == DeploymentStatus.RUNNING]
    
    usage_totals = session.exec(
        select(
            func.coalesce(func.sum(CostTracking.gpu_hours), 0.0),
            func.coalesce(func.sum(CostTracking.cost_usd), 0.0),
        ).where(CostTracking.user_id == user_id)
    ).one()
    total_gpu_hours, total_cost = usage_totals
    
    # Get last active time
    last_active = None
    if deployments:
        last_active = max(d.updated_at for d in deployments)
    
    stats = UserStats(
        total_deployments=len(deployments),
        active_deployments=len(active_deployments),
        total_gpu_hours=total_gpu_hours,
        total_cost=total_cost,
        last_active=last_active
    )
    
    return UserDetail(
        id=user.id,
        email=user.email,
        clerk_id=user.clerk_id,
        auth_provider=user.auth_provider,
        plan=user.plan,
        is_active=user.is_active,
        created_at=user.created_at,
        stats=stats
    )


@router.patch("/users/{user_id}", response_model=User)
async def update_user(
    user_id: int,
    user_update: UserUpdate,
    session: Session = Depends(get_session)
):
    """
    Update user information.
    Allows changing plan (subscription tier) and email.
    """
    user = session.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Update fields
    if user_update.plan is not None:
        # Validate plan
        valid_plans = ["free", "pro", "team", "enterprise"]
        if user_update.plan not in valid_plans:
            raise HTTPException(status_code=400, detail=f"Invalid plan. Must be one of: {valid_plans}")
        user.plan = user_update.plan
    
    if user_update.email is not None:
        # Check if email already exists
        existing = session.exec(
            select(User).where(User.email == user_update.email, User.id != user_id)
        ).first()
        if existing:
            raise HTTPException(status_code=400, detail="Email already in use")
        user.email = user_update.email
    
    session.add(user)
    session.commit()
    session.refresh(user)
    
    return user


@router.post("/users/{user_id}/disable")
async def disable_user(
    user_id: int,
    session: Session = Depends(get_session),
    admin: User = Depends(require_admin),
):
    """
    Disable a user account.
    This will prevent the user from creating new deployments.
    """
    user = session.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if user.id == admin.id:
        raise HTTPException(status_code=400, detail="You cannot disable your own account")
    user.is_active = False
    session.add(user)
    session.commit()
    return {"ok": True, "is_active": False}


@router.post("/users/{user_id}/enable")
async def enable_user(
    user_id: int,
    session: Session = Depends(get_session),
    admin: User = Depends(require_admin),
):
    """
    Enable a user account.
    """
    user = session.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    user.is_active = True
    session.add(user)
    session.commit()
    return {"ok": True, "is_active": True}


@router.get("/users/{user_id}/deployments", response_model=List[Deployment])
async def get_user_deployments(
    user_id: int,
    limit: int = Query(10, ge=1, le=100),
    session: Session = Depends(get_session)
):
    """
    Get recent deployments for a specific user.
    """
    user = session.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    deployments = session.exec(
        select(Deployment)
        .where(Deployment.user_id == user_id)
        .order_by(Deployment.created_at.desc())
        .limit(limit)
    ).all()
    
    return deployments
