"""
Automation API endpoints.
Manage automation rules, view logs, and check health status.
"""

from typing import Optional
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session, select
from pydantic import BaseModel

from app.core.db import get_session
from app.core.auth import get_current_user
from app.core.models import User, Deployment
from app.core.automation_models import (
    AutomationRule,
    AutomationLog,
    HealthCheckLog,
    CostTracking,
    AutomationRuleType,
    HealthStatus
)
from app.scheduler.health_checker import HealthChecker
from app.scheduler.cost_monitor import CostMonitor

router = APIRouter(prefix="/automation", tags=["automation"])


# ==================== Request/Response Models ====================

class AutomationRuleCreate(BaseModel):
    deployment_id: Optional[int] = None
    rule_type: str  # AutomationRuleType
    config_json: str
    is_enabled: bool = True


class AutomationRuleUpdate(BaseModel):
    config_json: Optional[str] = None
    is_enabled: Optional[bool] = None


class AutomationRuleResponse(BaseModel):
    id: int
    user_id: int
    deployment_id: Optional[int]
    rule_type: str
    config_json: str
    is_enabled: bool
    last_triggered_at: Optional[datetime]
    trigger_count: int
    created_at: datetime
    updated_at: datetime


class HealthStatusResponse(BaseModel):
    status: str
    last_check: Optional[datetime]
    response_time_ms: Optional[int]
    uptime_percentage: float
    recent_checks: list[dict]


class CostSummaryResponse(BaseModel):
    current_month_cost: float
    cost_limit: Optional[float]
    percentage_used: Optional[float]
    estimated_month_end: float
    total_hours: float


# ==================== Automation Rules ====================

@router.get("/rules", response_model=list[AutomationRuleResponse])
async def get_automation_rules(
    deployment_id: Optional[int] = Query(None),
    rule_type: Optional[str] = Query(None),
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Get user's automation rules."""
    statement = select(AutomationRule).where(
        AutomationRule.user_id == current_user.id
    )
    
    if deployment_id:
        statement = statement.where(AutomationRule.deployment_id == deployment_id)
    
    if rule_type:
        statement = statement.where(AutomationRule.rule_type == rule_type)
    
    rules = session.exec(statement).all()
    
    return [
        AutomationRuleResponse(
            id=rule.id,
            user_id=rule.user_id,
            deployment_id=rule.deployment_id,
            rule_type=rule.rule_type,
            config_json=rule.config_json,
            is_enabled=rule.is_enabled,
            last_triggered_at=rule.last_triggered_at,
            trigger_count=rule.trigger_count,
            created_at=rule.created_at,
            updated_at=rule.updated_at
        )
        for rule in rules
    ]


@router.post("/rules", response_model=AutomationRuleResponse)
async def create_automation_rule(
    rule_data: AutomationRuleCreate,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Create a new automation rule."""
    # Verify deployment ownership if deployment_id is provided
    if rule_data.deployment_id:
        deployment = session.get(Deployment, rule_data.deployment_id)
        if not deployment or deployment.user_id != current_user.id:
            raise HTTPException(status_code=404, detail="Deployment not found")
    
    # Create rule
    rule = AutomationRule(
        user_id=current_user.id,
        deployment_id=rule_data.deployment_id,
        rule_type=rule_data.rule_type,
        config_json=rule_data.config_json,
        is_enabled=rule_data.is_enabled,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )
    
    session.add(rule)
    session.commit()
    session.refresh(rule)
    
    return AutomationRuleResponse(
        id=rule.id,
        user_id=rule.user_id,
        deployment_id=rule.deployment_id,
        rule_type=rule.rule_type,
        config_json=rule.config_json,
        is_enabled=rule.is_enabled,
        last_triggered_at=rule.last_triggered_at,
        trigger_count=rule.trigger_count,
        created_at=rule.created_at,
        updated_at=rule.updated_at
    )


@router.put("/rules/{rule_id}", response_model=AutomationRuleResponse)
async def update_automation_rule(
    rule_id: int,
    rule_data: AutomationRuleUpdate,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Update an automation rule."""
    rule = session.get(AutomationRule, rule_id)
    
    if not rule or rule.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Rule not found")
    
    # Update fields
    if rule_data.config_json is not None:
        rule.config_json = rule_data.config_json
    
    if rule_data.is_enabled is not None:
        rule.is_enabled = rule_data.is_enabled
    
    rule.updated_at = datetime.utcnow()
    
    session.add(rule)
    session.commit()
    session.refresh(rule)
    
    return AutomationRuleResponse(
        id=rule.id,
        user_id=rule.user_id,
        deployment_id=rule.deployment_id,
        rule_type=rule.rule_type,
        config_json=rule.config_json,
        is_enabled=rule.is_enabled,
        last_triggered_at=rule.last_triggered_at,
        trigger_count=rule.trigger_count,
        created_at=rule.created_at,
        updated_at=rule.updated_at
    )


@router.delete("/rules/{rule_id}")
async def delete_automation_rule(
    rule_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Delete an automation rule."""
    rule = session.get(AutomationRule, rule_id)
    
    if not rule or rule.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Rule not found")
    
    session.delete(rule)
    session.commit()
    
    return {"message": "Rule deleted successfully"}


@router.post("/rules/{rule_id}/toggle")
async def toggle_automation_rule(
    rule_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Toggle automation rule enabled/disabled."""
    rule = session.get(AutomationRule, rule_id)
    
    if not rule or rule.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Rule not found")
    
    rule.is_enabled = not rule.is_enabled
    rule.updated_at = datetime.utcnow()
    
    session.add(rule)
    session.commit()
    session.refresh(rule)
    
    return {
        "id": rule.id,
        "is_enabled": rule.is_enabled
    }


# ==================== Automation Logs ====================

@router.get("/logs")
async def get_automation_logs(
    deployment_id: Optional[int] = Query(None),
    action: Optional[str] = Query(None),
    limit: int = Query(100, le=500),
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Get automation operation logs."""
    # Build query
    statement = (
        select(AutomationLog)
        .join(Deployment, AutomationLog.deployment_id == Deployment.id)
        .where(Deployment.user_id == current_user.id)
    )
    
    if deployment_id:
        statement = statement.where(AutomationLog.deployment_id == deployment_id)
    
    if action:
        statement = statement.where(AutomationLog.action == action)
    
    statement = statement.order_by(AutomationLog.created_at.desc()).limit(limit)
    
    logs = session.exec(statement).all()
    
    return [
        {
            "id": log.id,
            "deployment_id": log.deployment_id,
            "rule_id": log.rule_id,
            "action": log.action,
            "trigger_reason": log.trigger_reason,
            "trigger_data_json": log.trigger_data_json,
            "result": log.result,
            "error_message": log.error_message,
            "execution_time_ms": log.execution_time_ms,
            "created_at": log.created_at
        }
        for log in logs
    ]


# ==================== Health Status ====================

@router.get("/deployments/{deployment_id}/health", response_model=HealthStatusResponse)
async def get_deployment_health(
    deployment_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Get deployment health status."""
    # Verify ownership
    deployment = session.get(Deployment, deployment_id)
    if not deployment or deployment.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Deployment not found")
    
    # Get health checker
    health_checker = HealthChecker()
    
    # Get recent health checks
    recent_checks = health_checker.get_deployment_health_history(
        deployment_id, session, limit=10
    )
    
    # Get uptime percentage
    uptime = health_checker.get_deployment_uptime_percentage(
        deployment_id, session, hours=24
    )
    
    # Get latest check
    latest_check = recent_checks[0] if recent_checks else None
    
    return HealthStatusResponse(
        status=latest_check.status if latest_check else "unknown",
        last_check=latest_check.checked_at if latest_check else None,
        response_time_ms=latest_check.response_time_ms if latest_check else None,
        uptime_percentage=uptime,
        recent_checks=[
            {
                "status": check.status,
                "response_time_ms": check.response_time_ms,
                "checked_at": check.checked_at.isoformat(),
                "error_message": check.error_message
            }
            for check in recent_checks
        ]
    )


@router.post("/deployments/{deployment_id}/health/check")
async def trigger_health_check(
    deployment_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Manually trigger a health check."""
    # Verify ownership
    deployment = session.get(Deployment, deployment_id)
    if not deployment or deployment.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Deployment not found")
    
    # Perform health check
    health_checker = HealthChecker()
    health_log = await health_checker.check_deployment(deployment, session)
    
    return {
        "status": health_log.status,
        "response_time_ms": health_log.response_time_ms,
        "checked_at": health_log.checked_at,
        "error_message": health_log.error_message
    }


# ==================== Cost Tracking ====================

@router.get("/deployments/{deployment_id}/cost", response_model=CostSummaryResponse)
async def get_deployment_cost(
    deployment_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Get deployment cost summary."""
    # Verify ownership
    deployment = session.get(Deployment, deployment_id)
    if not deployment or deployment.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Deployment not found")
    
    # Get cost monitor
    cost_monitor = CostMonitor()
    
    # Get cost summary
    summary = cost_monitor.get_deployment_cost_summary(
        deployment_id, session, days=30
    )
    
    # Get cost limit rule
    statement = select(AutomationRule).where(
        AutomationRule.deployment_id == deployment_id,
        AutomationRule.rule_type == AutomationRuleType.COST_LIMIT.value,
        AutomationRule.is_enabled == True
    )
    cost_rule = session.exec(statement).first()
    
    cost_limit = None
    percentage_used = None
    
    if cost_rule:
        import json
        try:
            config = json.loads(cost_rule.config_json)
            cost_limit = config.get("max_cost_usd", 0)
            if cost_limit > 0:
                percentage_used = (summary["total_cost"] / cost_limit) * 100
        except:
            pass
    
    # Estimate month-end cost
    days_in_month = 30
    days_elapsed = (datetime.utcnow() - summary["period_start"]).days or 1
    daily_avg = summary["total_cost"] / days_elapsed
    estimated_month_end = daily_avg * days_in_month
    
    return CostSummaryResponse(
        current_month_cost=summary["total_cost"],
        cost_limit=cost_limit,
        percentage_used=percentage_used,
        estimated_month_end=estimated_month_end,
        total_hours=summary["total_hours"]
    )


@router.get("/users/me/cost-summary")
async def get_user_cost_summary(
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Get user's total cost summary across all deployments."""
    since = datetime.utcnow() - timedelta(days=30)
    
    statement = (
        select(CostTracking)
        .where(
            CostTracking.user_id == current_user.id,
            CostTracking.created_at >= since
        )
    )
    
    records = list(session.exec(statement).all())
    
    total_cost = sum(r.cost_usd for r in records)
    total_hours = sum(r.gpu_hours for r in records)
    
    # Group by deployment
    deployment_costs = {}
    for record in records:
        if record.deployment_id not in deployment_costs:
            deployment_costs[record.deployment_id] = 0
        deployment_costs[record.deployment_id] += record.cost_usd
    
    return {
        "total_cost": total_cost,
        "total_hours": total_hours,
        "period_start": since,
        "period_end": datetime.utcnow(),
        "deployment_count": len(deployment_costs),
        "deployments": [
            {"deployment_id": dep_id, "cost": cost}
            for dep_id, cost in deployment_costs.items()
        ]
    }
