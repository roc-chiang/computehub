"""
Cost calculation utilities for deployment tracking
"""
from datetime import datetime, timedelta
from typing import Dict, List, Optional
from sqlmodel import Session, select, func
from app.core.models import Deployment, DeploymentStatus, Usage, ActivityLog

async def calculate_deployment_cost(
    deployment: Deployment,
    price_per_hour: float,
    end_time: Optional[datetime] = None
) -> float:
    """
    Calculate cost for a single deployment
    
    Args:
        deployment: Deployment object
        price_per_hour: GPU price per hour
        end_time: End time for calculation (default: now)
    
    Returns:
        Total cost in USD
    """
    if not end_time:
        end_time = datetime.utcnow()
    
    # Calculate duration in hours
    start_time = deployment.created_at
    
    # If deployment is stopped, use the stop time from activity log
    if deployment.status == DeploymentStatus.STOPPED:
        # Find the last STOP action
        # For now, use end_time as approximation
        pass
    
    duration_seconds = (end_time - start_time).total_seconds()
    duration_hours = duration_seconds / 3600
    
    # Calculate cost
    cost = duration_hours * price_per_hour * deployment.gpu_count
    
    return round(cost, 2)


async def get_user_cost_summary(
    user_id: int,
    session: Session
) -> Dict:
    """
    Get cost summary for a user
    
    Returns:
        {
            "total_all_time": float,
            "total_this_month": float,
            "total_this_week": float,
            "total_today": float,
            "active_cost_per_hour": float,
            "currency": "USD"
        }
    """
    # Get all user deployments
    deployments = session.exec(
        select(Deployment).where(Deployment.user_id == user_id)
    ).all()
    
    # Time boundaries
    now = datetime.utcnow()
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    week_start = now - timedelta(days=now.weekday())
    week_start = week_start.replace(hour=0, minute=0, second=0, microsecond=0)
    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    
    total_all_time = 0.0
    total_this_month = 0.0
    total_this_week = 0.0
    total_today = 0.0
    active_cost_per_hour = 0.0
    
    # Default price (should fetch from pricing API in production)
    default_price_per_hour = 0.69  # RTX 4090 average
    
    for deployment in deployments:
        # Use deployment uptime if available, otherwise calculate
        if deployment.uptime_seconds:
            duration_hours = deployment.uptime_seconds / 3600
        else:
            duration_seconds = (now - deployment.created_at).total_seconds()
            duration_hours = duration_seconds / 3600
        
        cost = duration_hours * default_price_per_hour * deployment.gpu_count
        
        # Add to total
        total_all_time += cost
        
        # Add to month if created this month
        if deployment.created_at >= month_start:
            total_this_month += cost
        
        # Add to week if created this week
        if deployment.created_at >= week_start:
            total_this_week += cost
        
        # Add to today if created today
        if deployment.created_at >= today_start:
            total_today += cost
        
        # Add to active cost if running
        if deployment.status == DeploymentStatus.RUNNING:
            active_cost_per_hour += default_price_per_hour * deployment.gpu_count
    
    # Calculate projected monthly cost based on current active deployments
    projected_monthly = active_cost_per_hour * 24 * 30
    
    return {
        "total_all_time": round(total_all_time, 2),
        "total_this_month": round(total_this_month, 2),
        "total_this_week": round(total_this_week, 2),
        "total_today": round(total_today, 2),
        "active_cost_per_hour": round(active_cost_per_hour, 2),
        "projected_monthly": round(projected_monthly, 2),
        "currency": "USD"
    }


async def get_cost_timeline(
    user_id: int,
    session: Session,
    days: int = 30
) -> List[Dict]:
    """
    Get daily cost timeline for a user
    
    Returns:
        [
            {"date": "2025-12-11", "cost": 12.34},
            ...
        ]
    """
    # Get all user deployments
    deployments = session.exec(
        select(Deployment).where(Deployment.user_id == user_id)
    ).all()
    
    # Generate date range
    now = datetime.utcnow()
    timeline = []
    
    default_price_per_hour = 0.69
    
    for i in range(days):
        date = now - timedelta(days=days - i - 1)
        date_start = date.replace(hour=0, minute=0, second=0, microsecond=0)
        date_end = date_start + timedelta(days=1)
        
        daily_cost = 0.0
        
        for deployment in deployments:
            # Check if deployment was active on this date
            deployment_start = deployment.created_at
            deployment_end = now  # Assume still running or stopped at now
            
            # If deployment started after this date, skip
            if deployment_start >= date_end:
                continue
            
            # If deployment ended before this date, skip
            # (For now, assume all deployments are still active or stopped at now)
            
            # Calculate overlap hours
            overlap_start = max(deployment_start, date_start)
            overlap_end = min(deployment_end, date_end)
            
            if overlap_start < overlap_end:
                overlap_hours = (overlap_end - overlap_start).total_seconds() / 3600
                daily_cost += overlap_hours * default_price_per_hour * deployment.gpu_count
        
        timeline.append({
            "date": date_start.strftime("%Y-%m-%d"),
            "cost": round(daily_cost, 2)
        })
    
    return timeline


async def get_cost_breakdown(
    user_id: int,
    session: Session
) -> Dict:
    """
    Get cost breakdown by GPU type and provider
    
    Returns:
        {
            "by_gpu_type": [...],
            "by_provider": [...]
        }
    """
    deployments = session.exec(
        select(Deployment).where(Deployment.user_id == user_id)
    ).all()
    
    now = datetime.utcnow()
    default_price_per_hour = 0.69
    
    # Breakdown by GPU type
    gpu_costs: Dict[str, float] = {}
    provider_costs: Dict[str, float] = {}
    
    for deployment in deployments:
        if deployment.uptime_seconds:
            duration_hours = deployment.uptime_seconds / 3600
        else:
            duration_seconds = (now - deployment.created_at).total_seconds()
            duration_hours = duration_seconds / 3600
        
        cost = duration_hours * default_price_per_hour * deployment.gpu_count
        
        # Add to GPU type
        gpu_type = deployment.gpu_type
        gpu_costs[gpu_type] = gpu_costs.get(gpu_type, 0) + cost
        
        # Add to provider
        provider = deployment.provider.value if hasattr(deployment.provider, 'value') else str(deployment.provider)
        provider_costs[provider] = provider_costs.get(provider, 0) + cost
    
    # Calculate total for percentages
    total_cost = sum(gpu_costs.values())
    
    # Format results
    by_gpu_type = [
        {
            "gpu_type": gpu,
            "cost": round(cost, 2),
            "percentage": round((cost / total_cost * 100) if total_cost > 0 else 0, 1)
        }
        for gpu, cost in sorted(gpu_costs.items(), key=lambda x: x[1], reverse=True)
    ]
    
    by_provider = [
        {
            "provider": provider,
            "cost": round(cost, 2),
            "percentage": round((cost / total_cost * 100) if total_cost > 0 else 0, 1)
        }
        for provider, cost in sorted(provider_costs.items(), key=lambda x: x[1], reverse=True)
    ]
    
    return {
        "by_gpu_type": by_gpu_type,
        "by_provider": by_provider
    }
