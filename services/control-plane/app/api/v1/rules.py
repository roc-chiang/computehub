"""
Phase 9 Week 3: Rule Engine API Endpoints

Provides REST API for managing automation rules:
- Create, read, update, delete rules
- Enable/disable rules
- View execution history
- Test rules
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
import json

from app.core.db import get_session
from app.core.models import User, Deployment
from app.core.automation_models import (
    AutomationRuleV2, RuleExecutionLog, RuleTriggerType,
    RuleActionType, RuleExecutionStatus
)
from app.scheduler.rule_engine import RuleEngine


router = APIRouter()


# ============================================================================
# Pydantic Models
# ============================================================================

class RuleCreate(BaseModel):
    name: str
    description: Optional[str] = None
    trigger_type: str  # RuleTriggerType
    trigger_config: dict  # Will be JSON serialized
    action_type: str  # RuleActionType
    action_config: dict  # Will be JSON serialized
    target_type: str = "deployment"  # deployment, all_deployments, provider
    target_id: Optional[int] = None
    is_enabled: bool = True


class RuleUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    trigger_config: Optional[dict] = None
    action_config: Optional[dict] = None
    target_type: Optional[str] = None
    target_id: Optional[int] = None
    is_enabled: Optional[bool] = None


# ============================================================================
# Dependency: get_current_user
# ============================================================================

from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

security = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    session: Session = Depends(get_session)
) -> User:
    """Get current user from JWT token"""
    from app.core.auth import verify_token
    
    token = credentials.credentials
    payload = verify_token(token)
    
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid token payload")
    
    user = session.get(User, int(user_id))
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return user


# ============================================================================
# Rule CRUD Endpoints
# ============================================================================

@router.get("/rules")
async def list_rules(
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """List all automation rules for the current user."""
    rules = session.exec(
        select(AutomationRuleV2).where(AutomationRuleV2.user_id == current_user.id)
    ).all()
    
    return [
        {
            "id": rule.id,
            "name": rule.name,
            "description": rule.description,
            "is_enabled": rule.is_enabled,
            "trigger_type": rule.trigger_type,
            "trigger_config": json.loads(rule.trigger_config_json),
            "action_type": rule.action_type,
            "action_config": json.loads(rule.action_config_json),
            "target_type": rule.target_type,
            "target_id": rule.target_id,
            "last_triggered_at": rule.last_triggered_at.isoformat() if rule.last_triggered_at else None,
            "trigger_count": rule.trigger_count,
            "created_at": rule.created_at.isoformat(),
            "updated_at": rule.updated_at.isoformat()
        }
        for rule in rules
    ]


@router.post("/rules")
async def create_rule(
    rule_data: RuleCreate,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Create a new automation rule."""
    # Validate trigger and action types
    try:
        RuleTriggerType(rule_data.trigger_type)
        RuleActionType(rule_data.action_type)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid trigger or action type")
    
    # Validate target if specified
    if rule_data.target_type == "deployment" and rule_data.target_id:
        deployment = session.get(Deployment, rule_data.target_id)
        if not deployment or deployment.user_id != current_user.id:
            raise HTTPException(status_code=404, detail="Deployment not found")
    
    # Create rule
    rule = AutomationRuleV2(
        user_id=current_user.id,
        name=rule_data.name,
        description=rule_data.description,
        is_enabled=rule_data.is_enabled,
        trigger_type=rule_data.trigger_type,
        trigger_config_json=json.dumps(rule_data.trigger_config),
        action_type=rule_data.action_type,
        action_config_json=json.dumps(rule_data.action_config),
        target_type=rule_data.target_type,
        target_id=rule_data.target_id,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )
    
    session.add(rule)
    session.commit()
    session.refresh(rule)
    
    return {
        "id": rule.id,
        "name": rule.name,
        "trigger_type": rule.trigger_type,
        "action_type": rule.action_type,
        "is_enabled": rule.is_enabled,
        "created_at": rule.created_at.isoformat()
    }


@router.get("/rules/{rule_id}")
async def get_rule(
    rule_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Get a specific automation rule."""
    rule = session.get(AutomationRuleV2, rule_id)
    if not rule or rule.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Rule not found")
    
    return {
        "id": rule.id,
        "name": rule.name,
        "description": rule.description,
        "is_enabled": rule.is_enabled,
        "trigger_type": rule.trigger_type,
        "trigger_config": json.loads(rule.trigger_config_json),
        "action_type": rule.action_type,
        "action_config": json.loads(rule.action_config_json),
        "target_type": rule.target_type,
        "target_id": rule.target_id,
        "last_triggered_at": rule.last_triggered_at.isoformat() if rule.last_triggered_at else None,
        "trigger_count": rule.trigger_count,
        "created_at": rule.created_at.isoformat(),
        "updated_at": rule.updated_at.isoformat()
    }


@router.put("/rules/{rule_id}")
async def update_rule(
    rule_id: int,
    update_data: RuleUpdate,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Update an automation rule."""
    rule = session.get(AutomationRuleV2, rule_id)
    if not rule or rule.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Rule not found")
    
    # Update fields
    if update_data.name is not None:
        rule.name = update_data.name
    
    if update_data.description is not None:
        rule.description = update_data.description
    
    if update_data.trigger_config is not None:
        rule.trigger_config_json = json.dumps(update_data.trigger_config)
    
    if update_data.action_config is not None:
        rule.action_config_json = json.dumps(update_data.action_config)
    
    if update_data.target_type is not None:
        rule.target_type = update_data.target_type
    
    if update_data.target_id is not None:
        rule.target_id = update_data.target_id
    
    if update_data.is_enabled is not None:
        rule.is_enabled = update_data.is_enabled
    
    rule.updated_at = datetime.utcnow()
    session.add(rule)
    session.commit()
    
    return {"message": "Rule updated successfully"}


@router.delete("/rules/{rule_id}")
async def delete_rule(
    rule_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Delete an automation rule."""
    rule = session.get(AutomationRuleV2, rule_id)
    if not rule or rule.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Rule not found")
    
    session.delete(rule)
    session.commit()
    
    return {"message": "Rule deleted successfully"}


@router.post("/rules/{rule_id}/toggle")
async def toggle_rule(
    rule_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Toggle a rule's enabled status."""
    rule = session.get(AutomationRuleV2, rule_id)
    if not rule or rule.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Rule not found")
    
    rule.is_enabled = not rule.is_enabled
    rule.updated_at = datetime.utcnow()
    session.add(rule)
    session.commit()
    
    return {
        "is_enabled": rule.is_enabled,
        "message": f"Rule {'enabled' if rule.is_enabled else 'disabled'}"
    }


# ============================================================================
# Rule Execution Endpoints
# ============================================================================

@router.get("/rules/{rule_id}/executions")
async def get_rule_executions(
    rule_id: int,
    limit: int = 50,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Get execution history for a rule."""
    # Verify rule ownership
    rule = session.get(AutomationRuleV2, rule_id)
    if not rule or rule.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Rule not found")
    
    # Get execution logs
    logs = session.exec(
        select(RuleExecutionLog)
        .where(RuleExecutionLog.rule_id == rule_id)
        .order_by(RuleExecutionLog.executed_at.desc())
        .limit(limit)
    ).all()
    
    return [
        {
            "id": log.id,
            "trigger_reason": log.trigger_reason,
            "action_taken": log.action_taken,
            "target_deployment_id": log.target_deployment_id,
            "status": log.status,
            "result_message": log.result_message,
            "error_message": log.error_message,
            "executed_at": log.executed_at.isoformat()
        }
        for log in logs
    ]


@router.post("/rules/{rule_id}/test")
async def test_rule(
    rule_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Test a rule without actually executing the action."""
    rule = session.get(AutomationRuleV2, rule_id)
    if not rule or rule.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Rule not found")
    
    # Evaluate rule
    rule_engine = RuleEngine()
    should_trigger, context = await rule_engine.evaluate_rule(rule, session)
    
    return {
        "should_trigger": should_trigger,
        "trigger_reason": rule_engine._format_trigger_reason(rule, context) if should_trigger else None,
        "context": {
            "trigger_type": rule.trigger_type,
            "action_type": rule.action_type,
            "target_type": rule.target_type,
            "evaluation_time": datetime.utcnow().isoformat()
        }
    }


# ============================================================================
# Execution Log Endpoints
# ============================================================================

@router.get("/execution-logs")
async def list_execution_logs(
    limit: int = 100,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """List all rule execution logs for the current user."""
    logs = session.exec(
        select(RuleExecutionLog)
        .where(RuleExecutionLog.user_id == current_user.id)
        .order_by(RuleExecutionLog.executed_at.desc())
        .limit(limit)
    ).all()
    
    return [
        {
            "id": log.id,
            "rule_id": log.rule_id,
            "trigger_reason": log.trigger_reason,
            "action_taken": log.action_taken,
            "target_deployment_id": log.target_deployment_id,
            "status": log.status,
            "result_message": log.result_message,
            "error_message": log.error_message,
            "executed_at": log.executed_at.isoformat()
        }
        for log in logs
    ]
