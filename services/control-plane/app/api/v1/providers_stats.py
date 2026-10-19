from typing import List, Dict, Any, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from pydantic import BaseModel

from app.core.db import get_session
from app.core.models import Provider, Deployment, DeploymentStatus
from app.core.automation_models import CostTracking

router = APIRouter()

# ============================================================================
# Response Models
# ============================================================================

class MonthlyData(BaseModel):
    month: str
    hours: float
    cost: float

class DeploymentByStatus(BaseModel):
    running: int
    stopped: int
    creating: int
    error: int
    deleted: int

class ProviderStats(BaseModel):
    provider_id: int
    provider_name: str
    total_deployments: int
    active_deployments: int
    total_gpu_hours: float
    total_cost: float
    avg_deployment_duration_hours: float
    deployment_by_status: DeploymentByStatus
    gpu_hours_by_month: List[MonthlyData]
    cost_by_month: List[MonthlyData]

class PerformanceOverTime(BaseModel):
    date: str
    success_rate: float
    avg_startup_time: Optional[float]

class RecentError(BaseModel):
    deployment_id: int
    error_message: str
    timestamp: str

class ProviderMetrics(BaseModel):
    provider_id: int
    provider_name: str
    success_rate: float
    avg_startup_time_seconds: Optional[float]
    error_rate: float
    uptime_percentage: float
    recent_errors: List[RecentError]
    performance_over_time: List[PerformanceOverTime]

class ProviderSummaryItem(BaseModel):
    id: int
    name: str
    enabled: bool
    total_deployments: int
    active_deployments: int
    total_gpu_hours: float
    success_rate: float

class ProvidersSummary(BaseModel):
    total_providers: int
    enabled_providers: int
    providers: List[ProviderSummaryItem]

# ============================================================================
# API Endpoints
# ============================================================================

@router.get("/providers/{provider_id}/stats", response_model=ProviderStats)
async def get_provider_stats(
    provider_id: int,
    session: Session = Depends(get_session)
):
    """Get usage statistics for a specific provider."""
    provider = session.get(Provider, provider_id)
    if not provider:
        raise HTTPException(status_code=404, detail="Provider not found")
    
    # Get all deployments for this provider
    deployments = session.exec(
        select(Deployment).where(Deployment.provider_id == provider_id)
    ).all()
    
    total_deployments = len(deployments)
    active_deployments = len([d for d in deployments if d.status == DeploymentStatus.RUNNING])
    
    deployment_ids = [deployment.id for deployment in deployments]
    usage_records = session.exec(
        select(CostTracking).where(CostTracking.deployment_id.in_(deployment_ids))
    ).all() if deployment_ids else []
    total_gpu_hours = sum(record.gpu_hours for record in usage_records)
    total_cost = sum(record.cost_usd for record in usage_records)
    
    # Average deployment duration
    avg_duration = total_gpu_hours / total_deployments if total_deployments > 0 else 0.0
    
    # Deployment by status
    deployment_by_status = DeploymentByStatus(
        running=len([d for d in deployments if d.status == DeploymentStatus.RUNNING]),
        stopped=len([d for d in deployments if d.status == DeploymentStatus.STOPPED]),
        creating=len([d for d in deployments if d.status == DeploymentStatus.CREATING]),
        error=len([d for d in deployments if d.status == DeploymentStatus.ERROR]),
        deleted=len([d for d in deployments if d.status == DeploymentStatus.DELETED]),
    )
    
    # GPU hours and cost by month (last 6 months)
    monthly_data: Dict[str, Dict[str, float]] = {}
    for record in usage_records:
        month_key = record.period_end.strftime("%Y-%m")
        if month_key not in monthly_data:
            monthly_data[month_key] = {"hours": 0.0, "cost": 0.0}
        monthly_data[month_key]["hours"] += record.gpu_hours
        monthly_data[month_key]["cost"] += record.cost_usd
    
    # Convert to list and sort
    gpu_hours_by_month = [
        MonthlyData(month=month, hours=data["hours"], cost=data["cost"])
        for month, data in sorted(monthly_data.items())
    ]
    
    cost_by_month = gpu_hours_by_month  # Same data for now
    
    return ProviderStats(
        provider_id=provider.id,
        provider_name=provider.name,
        total_deployments=total_deployments,
        active_deployments=active_deployments,
        total_gpu_hours=round(total_gpu_hours, 2),
        total_cost=round(total_cost, 2),
        avg_deployment_duration_hours=round(avg_duration, 2),
        deployment_by_status=deployment_by_status,
        gpu_hours_by_month=gpu_hours_by_month[-6:],  # Last 6 months
        cost_by_month=cost_by_month[-6:],
    )

@router.get("/providers/{provider_id}/metrics", response_model=ProviderMetrics)
async def get_provider_metrics(
    provider_id: int,
    session: Session = Depends(get_session)
):
    """Get performance metrics for a specific provider."""
    provider = session.get(Provider, provider_id)
    if not provider:
        raise HTTPException(status_code=404, detail="Provider not found")
    
    # Get all deployments for this provider
    deployments = session.exec(
        select(Deployment).where(Deployment.provider_id == provider_id)
    ).all()
    
    total_deployments = len(deployments)
    if total_deployments == 0:
        return ProviderMetrics(
            provider_id=provider.id,
            provider_name=provider.name,
            success_rate=0.0,
            avg_startup_time_seconds=None,
            error_rate=0.0,
            uptime_percentage=0.0,
            recent_errors=[],
            performance_over_time=[],
        )
    
    # Calculate success rate (non-error deployments)
    successful = len([d for d in deployments if d.status != DeploymentStatus.ERROR])
    success_rate = (successful / total_deployments) * 100
    
    # Calculate error rate
    error_count = len([d for d in deployments if d.status == DeploymentStatus.ERROR])
    error_rate = (error_count / total_deployments) * 100
    
    # Uptime percentage (simplified)
    running_count = len([d for d in deployments if d.status == DeploymentStatus.RUNNING])
    uptime_percentage = (running_count / total_deployments) * 100 if total_deployments > 0 else 0.0
    
    # Recent errors (last 5)
    error_deployments = [d for d in deployments if d.status == DeploymentStatus.ERROR]
    error_deployments.sort(key=lambda x: x.created_at or datetime.min, reverse=True)
    recent_errors = [
        RecentError(
            deployment_id=d.id,
            error_message="Deployment failed",  # Deployment model doesn't have error_message field
            timestamp=d.created_at.isoformat() if d.created_at else ""
        )
        for d in error_deployments[:5]
    ]
    
    return ProviderMetrics(
        provider_id=provider.id,
        provider_name=provider.name,
        success_rate=round(success_rate, 2),
        avg_startup_time_seconds=None,
        error_rate=round(error_rate, 2),
        uptime_percentage=round(uptime_percentage, 2),
        recent_errors=recent_errors,
        performance_over_time=[],
    )

@router.get("/providers/summary", response_model=ProvidersSummary)
async def get_providers_summary(session: Session = Depends(get_session)):
    """Get summary statistics for all providers."""
    providers = session.exec(select(Provider)).all()
    
    total_providers = len(providers)
    enabled_providers = len([p for p in providers if p.is_enabled])
    
    provider_summaries = []
    for provider in providers:
        # Get deployments for this provider
        deployments = session.exec(
            select(Deployment).where(Deployment.provider_id == provider.id)
        ).all()
        
        total_deployments = len(deployments)
        active_deployments = len([d for d in deployments if d.status == DeploymentStatus.RUNNING])
        
        deployment_ids = [deployment.id for deployment in deployments]
        usage_records = session.exec(
            select(CostTracking).where(CostTracking.deployment_id.in_(deployment_ids))
        ).all() if deployment_ids else []
        total_gpu_hours = sum(record.gpu_hours for record in usage_records)
        
        # Calculate success rate
        successful = len([d for d in deployments if d.status != DeploymentStatus.ERROR])
        success_rate = (successful / total_deployments * 100) if total_deployments > 0 else 0.0
        
        provider_summaries.append(
            ProviderSummaryItem(
                id=provider.id,
                name=provider.name,
                enabled=provider.is_enabled,
                total_deployments=total_deployments,
                active_deployments=active_deployments,
                total_gpu_hours=round(total_gpu_hours, 2),
                success_rate=round(success_rate, 2),
            )
        )
    
    return ProvidersSummary(
        total_providers=total_providers,
        enabled_providers=enabled_providers,
        providers=provider_summaries,
    )
