from typing import Dict, Any
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends
from sqlmodel import Session, select, func
from app.core.db import get_session
from app.core.models import User, Deployment, DeploymentStatus, Provider

router = APIRouter()

@router.get("/stats")
async def get_platform_stats(session: Session = Depends(get_session)):
    """
    Get comprehensive platform statistics.
    Aggregates data from users, deployments, and providers.
    """
    # Get all users
    users = session.exec(select(User)).all()
    
    # Calculate user stats
    user_stats = {
        "total": len(users),
        "by_plan": {
            "free": len([u for u in users if u.plan == "free"]),
            "pro": len([u for u in users if u.plan == "pro"]),
            "team": len([u for u in users if u.plan == "team"]),
            "enterprise": len([u for u in users if u.plan == "enterprise"])
        },
        "new_this_week": 0  # TODO: Calculate based on created_at
    }
    
    # Calculate new users this week
    week_ago = datetime.utcnow() - timedelta(days=7)
    new_users = [u for u in users if u.created_at >= week_ago]
    user_stats["new_this_week"] = len(new_users)
    
    # Get all deployments
    deployments = session.exec(select(Deployment)).all()
    
    # Calculate deployment stats
    deployment_stats = {
        "total": len(deployments),
        "active": len([d for d in deployments if d.status == DeploymentStatus.RUNNING]),
        "by_status": {
            "running": len([d for d in deployments if d.status == DeploymentStatus.RUNNING]),
            "stopped": len([d for d in deployments if d.status == DeploymentStatus.STOPPED]),
            "creating": len([d for d in deployments if d.status == DeploymentStatus.CREATING]),
            "error": len([d for d in deployments if d.status == DeploymentStatus.ERROR]),
            "deleted": len([d for d in deployments if d.status == DeploymentStatus.DELETED])
        }
    }
    
    # Calculate usage statistics
    total_gpu_hours = 0.0
    for deployment in deployments:
        if deployment.uptime_seconds:
            total_gpu_hours += deployment.uptime_seconds / 3600.0
    
    # Calculate estimated cost ($0.50/hour average)
    total_cost = total_gpu_hours * 0.50
    
    usage_stats = {
        "total_gpu_hours": round(total_gpu_hours, 2),
        "total_cost": round(total_cost, 2)
    }
    
    # Get provider stats
    providers = session.exec(select(Provider)).all()
    provider_stats = {
        "total": len(providers),
        "enabled": len([p for p in providers if p.is_enabled])
    }
    
    # Revenue stats (placeholder for now)
    revenue_stats = {
        "total": 0.0,  # TODO: Implement when Stripe integrated
        "this_month": 0.0
    }
    
    return {
        "users": user_stats,
        "deployments": deployment_stats,
        "usage": usage_stats,
        "revenue": revenue_stats,
        "providers": provider_stats
    }


@router.get("/activity/recent")
async def get_recent_activity(
    limit: int = 10,
    session: Session = Depends(get_session)
):
    """
    Get recent platform activity.
    Returns recent user signups and deployments.
    """
    # Get recent users
    recent_users = session.exec(
        select(User).order_by(User.created_at.desc()).limit(limit)
    ).all()
    
    # Get recent deployments with user info
    recent_deployments_query = (
        select(Deployment, User)
        .join(User, Deployment.user_id == User.id)
        .order_by(Deployment.created_at.desc())
        .limit(limit)
    )
    recent_deployments_raw = session.exec(recent_deployments_query).all()
    
    # Format activity items
    activity = []
    
    # Add user signups
    for user in recent_users:
        activity.append({
            "type": "user_signup",
            "timestamp": user.created_at.isoformat(),
            "description": f"{user.email} signed up ({user.plan.upper()})",
            "user_email": user.email,
            "plan": user.plan
        })
    
    # Add deployments
    for deployment, user in recent_deployments_raw:
        activity.append({
            "type": "deployment_created",
            "timestamp": deployment.created_at.isoformat(),
            "description": f"{deployment.name} created by {user.email}",
            "deployment_name": deployment.name,
            "user_email": user.email,
            "gpu_type": deployment.gpu_type
        })
    
    # Sort by timestamp (most recent first)
    activity.sort(key=lambda x: x["timestamp"], reverse=True)
    
    return activity[:limit]
