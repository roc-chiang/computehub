"""
Input: APScheduler 调度器, Database Session, Scheduler 模块(HealthChecker, AutoRestartManager, CostMonitor)
Output: 定时执行的自动化任务(健康检查30s, 自动重启60s, 成本追踪1h, 成本上限1h)
Pos: Phase 9 自动化引擎的任务调度器,在 app.main 启动时初始化,协调所有自动化功能

一旦我被更新,务必更新我的开头注释,以及所属的文件夹的 README.md
"""

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.interval import IntervalTrigger
from datetime import datetime

from app.core.db import get_session
from app.scheduler.health_checker import HealthChecker
from app.scheduler.auto_restart import AutoRestartManager
from app.scheduler.cost_monitor import CostMonitor


# Global scheduler instance
scheduler = AsyncIOScheduler()

# Module instances
health_checker = HealthChecker()
auto_restart_manager = AutoRestartManager()
cost_monitor = CostMonitor()


async def health_check_task():
    """
    Health check task - runs every 30 seconds.
    Checks all running deployments and records health status.
    """
    print(f"[Task] Running health check at {datetime.utcnow()}")
    
    try:
        with next(get_session()) as session:
            health_logs = await health_checker.check_all_running_deployments(session)
            print(f"[Task] Health check completed: {len(health_logs)} deployments checked")
    except Exception as e:
        print(f"[Task] Health check failed: {e}")


async def auto_restart_task():
    """
    Auto-restart task - runs every 60 seconds.
    Checks unhealthy deployments and restarts if needed.
    """
    print(f"[Task] Running auto-restart check at {datetime.utcnow()}")
    
    try:
        with next(get_session()) as session:
            logs = await auto_restart_manager.process_all_deployments(session)
            if logs:
                print(f"[Task] Auto-restart completed: {len(logs)} deployments restarted")
    except Exception as e:
        print(f"[Task] Auto-restart failed: {e}")


async def cost_tracking_task():
    """
    Cost tracking task - runs every hour.
    Tracks costs for all running deployments.
    """
    print(f"[Task] Running cost tracking at {datetime.utcnow()}")
    
    try:
        from sqlmodel import select
        from app.core.models import Deployment, DeploymentStatus
        
        with next(get_session()) as session:
            # Get all running deployments
            statement = select(Deployment).where(
                Deployment.status == DeploymentStatus.RUNNING
            )
            deployments = session.exec(statement).all()
            
            # Track cost for each
            tracked_count = 0
            for deployment in deployments:
                try:
                    await cost_monitor.track_deployment_cost(deployment, session)
                    tracked_count += 1
                except Exception as e:
                    print(f"[Task] Failed to track cost for deployment {deployment.id}: {e}")
            
            print(f"[Task] Cost tracking completed: {tracked_count} deployments tracked")
    except Exception as e:
        print(f"[Task] Cost tracking failed: {e}")


async def cost_limit_check_task():
    """
    Cost limit check task - runs every hour.
    Checks if deployments have exceeded cost limits and stops them if needed.
    """
    print(f"[Task] Running cost limit check at {datetime.utcnow()}")
    
    try:
        from sqlmodel import select
        from app.core.models import Deployment, DeploymentStatus
        
        with next(get_session()) as session:
            # Get all running deployments
            statement = select(Deployment).where(
                Deployment.status == DeploymentStatus.RUNNING
            )
            deployments = session.exec(statement).all()
            
            # Check cost limit for each
            stopped_count = 0
            for deployment in deployments:
                try:
                    log = await cost_monitor.check_cost_limit(deployment, session)
                    if log:
                        stopped_count += 1
                except Exception as e:
                    print(f"[Task] Failed to check cost limit for deployment {deployment.id}: {e}")
            
            if stopped_count > 0:
                print(f"[Task] Cost limit check completed: {stopped_count} deployments stopped")
    except Exception as e:
        print(f"[Task] Cost limit check failed: {e}")


def start_automation_tasks():
    """
    Start all automation background tasks.
    """
    print("[Scheduler] Starting automation tasks...")
    
    # Health check every 30 seconds
    scheduler.add_job(
        health_check_task,
        trigger=IntervalTrigger(seconds=30),
        id="health_check",
        name="Health Check Task",
        replace_existing=True
    )
    
    # Auto-restart check every 60 seconds
    scheduler.add_job(
        auto_restart_task,
        trigger=IntervalTrigger(seconds=60),
        id="auto_restart",
        name="Auto Restart Task",
        replace_existing=True
    )
    
    # Cost tracking every hour
    scheduler.add_job(
        cost_tracking_task,
        trigger=IntervalTrigger(hours=1),
        id="cost_tracking",
        name="Cost Tracking Task",
        replace_existing=True
    )
    
    # Cost limit check every hour
    scheduler.add_job(
        cost_limit_check_task,
        trigger=IntervalTrigger(hours=1),
        id="cost_limit_check",
        name="Cost Limit Check Task",
        replace_existing=True
    )
    
    # Register Week 3 tasks (will be defined below)
    # This will be called after the function is defined
    
    # Start scheduler
    scheduler.start()
    print("[Scheduler] Automation tasks started successfully")
    
    # Register Week 3 tasks after scheduler starts
    try:
        register_week3_tasks()
    except Exception as e:
        print(f"[Scheduler] Warning: Could not register Week 3 tasks: {e}")


def stop_automation_tasks():
    """Stop all automation tasks"""
    if scheduler.running:
        scheduler.shutdown()
        print("[Scheduler] Automation tasks stopped")


# ============================================================================
# Phase 9 Week 3: Cost Limit + Rule Engine Tasks
# ============================================================================

from app.scheduler.cost_limit_manager import CostLimitManager
from app.scheduler.rule_engine import RuleEngine

# Module instances
cost_limit_manager = CostLimitManager()
rule_engine = RuleEngine()


async def cost_limit_check_task():
    """
    Cost limit check task - runs every 10 minutes.
    Checks all cost limits and triggers auto-shutdown if needed.
    """
    print(f"[Task] Running cost limit check at {datetime.utcnow()}")
    
    try:
        from app.main import get_provider_adapters
        provider_adapters = get_provider_adapters()
        
        with next(get_session()) as session:
            triggered_limits = await cost_limit_manager.check_cost_limits(
                session, provider_adapters
            )
            if triggered_limits:
                print(f"[Task] Cost limit check completed: {len(triggered_limits)} limits triggered")
    except Exception as e:
        print(f"[Task] Cost limit check failed: {e}")
        import traceback
        traceback.print_exc()


async def rule_engine_task():
    """
    Rule engine task - runs every 1 minute.
    Processes all enabled automation rules.
    """
    print(f"[Task] Running rule engine at {datetime.utcnow()}")
    
    try:
        from app.main import get_provider_adapters
        provider_adapters = get_provider_adapters()
        
        with next(get_session()) as session:
            execution_logs = await rule_engine.process_all_rules(
                session, provider_adapters
            )
            if execution_logs:
                print(f"[Task] Rule engine completed: {len(execution_logs)} rules executed")
    except Exception as e:
        print(f"[Task] Rule engine failed: {e}")
        import traceback
        traceback.print_exc()


def register_week3_tasks():
    """Register Phase 9 Week 3 tasks with the scheduler"""
    print("[Scheduler] Registering Week 3 tasks...")
    
    # Cost limit check every 10 minutes
    scheduler.add_job(
        cost_limit_check_task,
        trigger=IntervalTrigger(minutes=10),
        id="cost_limit_check",
        name="Cost Limit Check Task",
        replace_existing=True
    )
    print("[Scheduler] ✓ Cost limit check task registered (every 10 minutes)")
    
    # Rule engine every 1 minute
    scheduler.add_job(
        rule_engine_task,
        trigger=IntervalTrigger(minutes=1),
        id="rule_engine",
        name="Rule Engine Task",
        replace_existing=True
    )
    print("[Scheduler] ✓ Rule engine task registered (every 1 minute)")
    
    print("[Scheduler] Week 3 tasks registered successfully")
