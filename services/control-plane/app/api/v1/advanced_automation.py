"""
Input: HTTP 请求(FastAPI), 用户认证 token, 请求参数(价格查询、迁移配置、Failover规则、任务配置)
Output: REST API 响应(价格历史、迁移任务、Failover配置、批量任务)
Pos: Phase 9 Week 2 高级自动化的 API 层,提供 16 个端点供前端调用,管理价格监控、迁移、Failover和任务队列

一旦我被更新,务必更新我的开头注释,以及所属的文件夹的 README.md
"""

from typing import Optional, List
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session, select
from pydantic import BaseModel

from app.core.db import get_session
from app.core.auth import verify_token
from app.core.models import User, Deployment
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

security = HTTPBearer()

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    session: Session = Depends(get_session)
) -> User:
    token = credentials.credentials
    payload = verify_token(token, session)
    
    clerk_id = payload.get("sub")
    if not clerk_id:
        raise HTTPException(status_code=401, detail="Invalid token: missing sub")
        
    # Lazy User Creation / Sync
    user = session.exec(select(User).where(User.clerk_id == clerk_id)).first()
    
    if not user:
        email = payload.get("email")
        if not email:
            email = f"{clerk_id}@clerk.user" 
            
        existing_email_user = session.exec(select(User).where(User.email == email)).first()
        if existing_email_user:
            existing_email_user.clerk_id = clerk_id
            existing_email_user.auth_provider = "clerk"
            session.add(existing_email_user)
            session.commit()
            session.refresh(existing_email_user)
            return existing_email_user
        
        user = User(
            email=email,
            clerk_id=clerk_id,
            auth_provider="clerk",
            plan="free"
        )
        session.add(user)
        session.commit()
        session.refresh(user)
        
    return user

from app.core.automation_models import (
    PriceHistory,
    MigrationTask,
    FailoverConfig,
    BatchTask,
    MigrationStatus,
    TaskStatus,
    TaskType
)
from app.scheduler.price_monitor import PriceMonitor
from app.scheduler.auto_migration import MigrationManager
from app.scheduler.failover_manager import FailoverManager
from app.scheduler.task_queue import TaskQueueManager

router = APIRouter(prefix="/advanced-automation", tags=["advanced-automation"])


# ==================== Request/Response Models ====================

class MigrationTaskCreate(BaseModel):
    source_deployment_id: int
    target_provider: str
    target_config: dict


class FailoverConfigCreate(BaseModel):
    deployment_id: int
    primary_provider: str
    backup_providers: List[str]
    health_check_interval: int = 300
    failover_threshold: int = 3
    auto_failover_enabled: bool = True


class FailoverConfigUpdate(BaseModel):
    backup_providers: Optional[List[str]] = None
    health_check_interval: Optional[int] = None
    failover_threshold: Optional[int] = None
    auto_failover_enabled: Optional[bool] = None


class BatchTaskCreate(BaseModel):
    task_type: str  # TaskType enum value
    task_config: dict
    priority: int = 5
    scheduled_at: Optional[datetime] = None


# ==================== Price Monitoring ====================

@router.get("/price-history")
async def get_price_history(
    deployment_id: int,
    hours: int = Query(168, description="Time window in hours (default: 7 days)"),
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Get price history for a deployment."""
    # Verify ownership
    deployment = session.get(Deployment, deployment_id)
    if not deployment or deployment.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Deployment not found")
    
    # Get price monitor
    price_monitor = PriceMonitor()
    
    # Get price history
    history = price_monitor.get_price_history(deployment_id, hours, session)
    
    return {
        "deployment_id": deployment_id,
        "hours": hours,
        "data_points": len(history),
        "history": [
            {
                "price_per_hour": record.price_per_hour,
                "provider": record.provider,
                "gpu_type": record.gpu_type,
                "recorded_at": record.recorded_at.isoformat()
            }
            for record in history
        ]
    }


@router.get("/price-trends")
async def get_price_trends(
    deployment_id: int,
    hours: int = Query(168, description="Time window in hours (default: 7 days)"),
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Get price trend analysis for a deployment."""
    # Verify ownership
    deployment = session.get(Deployment, deployment_id)
    if not deployment or deployment.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Deployment not found")
    
    # Get price monitor
    price_monitor = PriceMonitor()
    
    # Get price trend
    trend = await price_monitor.get_price_trend(deployment_id, hours, session)
    
    return {
        "deployment_id": deployment_id,
        **trend
    }


@router.get("/cheaper-alternatives")
async def get_cheaper_alternatives(
    deployment_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Find cheaper alternatives for a deployment."""
    # Verify ownership
    deployment = session.get(Deployment, deployment_id)
    if not deployment or deployment.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Deployment not found")
    
    # Get provider adapters using ProviderManager
    from app.main import get_provider_adapters
    provider_adapters = get_provider_adapters()
    
    # Get price monitor
    price_monitor = PriceMonitor()
    
    # Check cheaper alternatives
    alternatives = await price_monitor.check_cheaper_alternatives(
        deployment, provider_adapters, session
    )
    
    return {
        "deployment_id": deployment_id,
        "current_provider": deployment.provider,
        "alternatives": alternatives
    }


# ==================== Migration Management ====================

@router.post("/migrations")
async def create_migration(
    migration_data: MigrationTaskCreate,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Create a new migration task."""
    # Verify ownership
    deployment = session.get(Deployment, migration_data.source_deployment_id)
    if not deployment or deployment.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Deployment not found")
    
    # Get provider adapters
    from app.main import get_provider_adapters
    provider_adapters = get_provider_adapters()
    
    # Create migration
    migration_manager = MigrationManager()
    migration_task = await migration_manager.migrate_deployment(
        source_deployment=deployment,
        target_provider=migration_data.target_provider,
        target_config=migration_data.target_config,
        user_id=current_user.id,
        session=session,
        provider_adapters=provider_adapters
    )
    
    return {
        "id": migration_task.id,
        "source_deployment_id": migration_task.source_deployment_id,
        "target_provider": migration_task.target_provider,
        "status": migration_task.status,
        "created_at": migration_task.created_at.isoformat()
    }


@router.get("/migrations")
async def list_migrations(
    limit: int = Query(50, le=200),
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """List user's migration tasks."""
    statement = (
        select(MigrationTask)
        .where(MigrationTask.user_id == current_user.id)
        .order_by(MigrationTask.created_at.desc())
        .limit(limit)
    )
    
    migrations = session.exec(statement).all()
    
    return {
        "migrations": [
            {
                "id": m.id,
                "source_deployment_id": m.source_deployment_id,
                "target_deployment_id": m.target_deployment_id,
                "target_provider": m.target_provider,
                "status": m.status,
                "started_at": m.started_at.isoformat() if m.started_at else None,
                "completed_at": m.completed_at.isoformat() if m.completed_at else None,
                "error_message": m.error_message,
                "created_at": m.created_at.isoformat()
            }
            for m in migrations
        ]
    }


@router.get("/migrations/{migration_id}")
async def get_migration(
    migration_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Get migration task details."""
    migration = session.get(MigrationTask, migration_id)
    
    if not migration or migration.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Migration not found")
    
    import json
    steps = []
    if migration.migration_steps_json:
        try:
            steps = json.loads(migration.migration_steps_json)
        except:
            pass
    
    return {
        "id": migration.id,
        "source_deployment_id": migration.source_deployment_id,
        "target_deployment_id": migration.target_deployment_id,
        "target_provider": migration.target_provider,
        "target_config": json.loads(migration.target_config_json),
        "status": migration.status,
        "migration_steps": steps,
        "started_at": migration.started_at.isoformat() if migration.started_at else None,
        "completed_at": migration.completed_at.isoformat() if migration.completed_at else None,
        "error_message": migration.error_message,
        "created_at": migration.created_at.isoformat()
    }


@router.post("/migrations/{migration_id}/rollback")
async def rollback_migration(
    migration_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Rollback a migration."""
    migration = session.get(MigrationTask, migration_id)
    
    if not migration or migration.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Migration not found")
    
    # Can only rollback failed migrations
    if migration.status != MigrationStatus.FAILED.value:
        raise HTTPException(status_code=400, detail="Can only rollback failed migrations")
    
    # Get provider adapters
    from app.main import get_provider_adapters
    provider_adapters = get_provider_adapters()
    
    # Rollback migration
    migration_manager = MigrationManager()
    success = await migration_manager.rollback_migration(
        migration, session, provider_adapters
    )
    
    if not success:
        raise HTTPException(status_code=500, detail="Rollback failed")
    
    return {"message": "Migration rolled back successfully"}


# ==================== Failover Management ====================

@router.get("/failover-configs")
async def list_failover_configs(
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """List user's failover configurations."""
    statement = (
        select(FailoverConfig)
        .where(FailoverConfig.user_id == current_user.id)
        .order_by(FailoverConfig.created_at.desc())
    )
    
    configs = session.exec(statement).all()
    
    import json
    return {
        "configs": [
            {
                "id": c.id,
                "deployment_id": c.deployment_id,
                "primary_provider": c.primary_provider,
                "backup_providers": json.loads(c.backup_providers_json),
                "health_check_interval": c.health_check_interval,
                "failover_threshold": c.failover_threshold,
                "auto_failover_enabled": c.auto_failover_enabled,
                "last_failover_at": c.last_failover_at.isoformat() if c.last_failover_at else None,
                "failover_count": c.failover_count,
                "created_at": c.created_at.isoformat()
            }
            for c in configs
        ]
    }


@router.post("/failover-configs")
async def create_failover_config(
    config_data: FailoverConfigCreate,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Create a failover configuration."""
    # Verify ownership
    deployment = session.get(Deployment, config_data.deployment_id)
    if not deployment or deployment.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Deployment not found")
    
    # Check if config already exists
    existing = session.exec(
        select(FailoverConfig).where(
            FailoverConfig.deployment_id == config_data.deployment_id
        )
    ).first()
    
    if existing:
        raise HTTPException(status_code=400, detail="Failover config already exists for this deployment")
    
    import json
    config = FailoverConfig(
        user_id=current_user.id,
        deployment_id=config_data.deployment_id,
        primary_provider=config_data.primary_provider,
        backup_providers_json=json.dumps(config_data.backup_providers),
        health_check_interval=config_data.health_check_interval,
        failover_threshold=config_data.failover_threshold,
        auto_failover_enabled=config_data.auto_failover_enabled,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )
    
    session.add(config)
    session.commit()
    session.refresh(config)
    
    return {
        "id": config.id,
        "deployment_id": config.deployment_id,
        "primary_provider": config.primary_provider,
        "backup_providers": json.loads(config.backup_providers_json),
        "health_check_interval": config.health_check_interval,
        "failover_threshold": config.failover_threshold,
        "auto_failover_enabled": config.auto_failover_enabled
    }


@router.put("/failover-configs/{config_id}")
async def update_failover_config(
    config_id: int,
    config_data: FailoverConfigUpdate,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Update a failover configuration."""
    config = session.get(FailoverConfig, config_id)
    
    if not config or config.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Config not found")
    
    import json
    
    # Update fields
    if config_data.backup_providers is not None:
        config.backup_providers_json = json.dumps(config_data.backup_providers)
    
    if config_data.health_check_interval is not None:
        config.health_check_interval = config_data.health_check_interval
    
    if config_data.failover_threshold is not None:
        config.failover_threshold = config_data.failover_threshold
    
    if config_data.auto_failover_enabled is not None:
        config.auto_failover_enabled = config_data.auto_failover_enabled
    
    config.updated_at = datetime.utcnow()
    
    session.add(config)
    session.commit()
    session.refresh(config)
    
    return {
        "id": config.id,
        "deployment_id": config.deployment_id,
        "primary_provider": config.primary_provider,
        "backup_providers": json.loads(config.backup_providers_json),
        "health_check_interval": config.health_check_interval,
        "failover_threshold": config.failover_threshold,
        "auto_failover_enabled": config.auto_failover_enabled
    }


@router.delete("/failover-configs/{config_id}")
async def delete_failover_config(
    config_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Delete a failover configuration."""
    config = session.get(FailoverConfig, config_id)
    
    if not config or config.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Config not found")
    
    session.delete(config)
    session.commit()
    
    return {"message": "Failover config deleted successfully"}


# ==================== Task Queue ====================

@router.post("/tasks")
async def create_task(
    task_data: BatchTaskCreate,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Enqueue a new batch task."""
    task_queue = TaskQueueManager()
    
    scheduled_at = task_data.scheduled_at or datetime.utcnow()
    
    task = await task_queue.enqueue_task(
        user_id=current_user.id,
        task_type=task_data.task_type,
        task_config=task_data.task_config,
        priority=task_data.priority,
        scheduled_at=scheduled_at,
        session=session
    )
    
    return {
        "id": task.id,
        "task_type": task.task_type,
        "status": task.status,
        "priority": task.priority,
        "scheduled_at": task.scheduled_at.isoformat(),
        "created_at": task.created_at.isoformat()
    }


@router.get("/tasks")
async def list_tasks(
    status: Optional[str] = Query(None),
    limit: int = Query(50, le=200),
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """List user's batch tasks."""
    statement = (
        select(BatchTask)
        .where(BatchTask.user_id == current_user.id)
    )
    
    if status:
        statement = statement.where(BatchTask.status == status)
    
    statement = statement.order_by(BatchTask.created_at.desc()).limit(limit)
    
    tasks = session.exec(statement).all()
    
    import json
    return {
        "tasks": [
            {
                "id": t.id,
                "task_type": t.task_type,
                "status": t.status,
                "priority": t.priority,
                "scheduled_at": t.scheduled_at.isoformat(),
                "started_at": t.started_at.isoformat() if t.started_at else None,
                "completed_at": t.completed_at.isoformat() if t.completed_at else None,
                "error_message": t.error_message,
                "created_at": t.created_at.isoformat()
            }
            for t in tasks
        ]
    }


@router.get("/tasks/{task_id}")
async def get_task(
    task_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Get task details."""
    task = session.get(BatchTask, task_id)
    
    if not task or task.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Task not found")
    
    import json
    
    task_config = {}
    result = {}
    
    try:
        task_config = json.loads(task.task_config_json)
    except:
        pass
    
    if task.result_json:
        try:
            result = json.loads(task.result_json)
        except:
            pass
    
    return {
        "id": task.id,
        "task_type": task.task_type,
        "task_config": task_config,
        "status": task.status,
        "priority": task.priority,
        "scheduled_at": task.scheduled_at.isoformat(),
        "started_at": task.started_at.isoformat() if task.started_at else None,
        "completed_at": task.completed_at.isoformat() if task.completed_at else None,
        "result": result,
        "error_message": task.error_message,
        "created_at": task.created_at.isoformat()
    }


@router.post("/tasks/{task_id}/cancel")
async def cancel_task(
    task_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Cancel a queued task."""
    task = session.get(BatchTask, task_id)
    
    if not task or task.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Task not found")
    
    task_queue = TaskQueueManager()
    success = await task_queue.cancel_task(task_id, session)
    
    if not success:
        raise HTTPException(status_code=400, detail="Cannot cancel task (not queued)")
    
    return {"message": "Task cancelled successfully"}
