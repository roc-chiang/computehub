"""
Input: APScheduler 调度器, Database Session, Provider Adapters, 高级自动化 Scheduler 模块
Output: 定时执行的高级自动化任务(价格监控1h, 迁移检查6h, Failover检查5min, 任务队列1min)
Pos: Phase 9 Week 2 高级自动化的任务调度器,在 app.main 启动时初始化,协调所有高级自动化功能

一旦我被更新,务必更新我的开头注释,以及所属的文件夹的 README.md
"""

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.interval import IntervalTrigger
from datetime import datetime

from app.core.db import get_session
from app.scheduler.price_monitor import PriceMonitor
from app.scheduler.auto_migration import MigrationManager
from app.scheduler.failover_manager import FailoverManager
from app.scheduler.task_queue import TaskQueueManager


# Module instances
price_monitor = PriceMonitor()
migration_manager = MigrationManager()
failover_manager = FailoverManager()
task_queue_manager = TaskQueueManager()


async def price_monitoring_task():
    """
    Price monitoring task - runs every 1 hour.
    Tracks GPU price changes for all running deployments.
    """
    print(f"[AdvancedTask] Running price monitoring at {datetime.utcnow()}")
    
    try:
        from app.main import get_provider_adapters
        provider_adapters = get_provider_adapters()
        
        with next(get_session()) as session:
            price_records = await price_monitor.track_deployment_prices(
                session, provider_adapters
            )
            print(f"[AdvancedTask] Price monitoring completed: {len(price_records)} price changes recorded")
    except Exception as e:
        print(f"[AdvancedTask] Price monitoring failed: {e}")


async def migration_check_task():
    """
    Migration check task - runs every 6 hours.
    Checks if any deployments should trigger auto-migration based on price rules.
    """
    print(f"[AdvancedTask] Running migration check at {datetime.utcnow()}")
    
    try:
        from app.main import get_provider_adapters
        provider_adapters = get_provider_adapters()
        
        with next(get_session()) as session:
            migration_tasks = await migration_manager.check_migration_triggers(
                session, provider_adapters
            )
            if migration_tasks:
                print(f"[AdvancedTask] Migration check completed: {len(migration_tasks)} migrations triggered")
    except Exception as e:
        print(f"[AdvancedTask] Migration check failed: {e}")


async def failover_check_task():
    """
    Failover check task - runs every 5 minutes.
    Monitors provider health and triggers failover if needed.
    """
    print(f"[AdvancedTask] Running failover check at {datetime.utcnow()}")
    
    try:
        from app.main import get_provider_adapters
        provider_adapters = get_provider_adapters()
        
        with next(get_session()) as session:
            logs = await failover_manager.process_failover_checks(
                session, provider_adapters
            )
            if logs:
                print(f"[AdvancedTask] Failover check completed: {len(logs)} failovers triggered")
    except Exception as e:
        print(f"[AdvancedTask] Failover check failed: {e}")


async def task_queue_processor():
    """
    Task queue processor - runs every 1 minute.
    Processes queued batch tasks that are ready to execute.
    """
    print(f"[AdvancedTask] Running task queue processor at {datetime.utcnow()}")
    
    try:
        # Get provider adapters
        from app.main import get_provider_adapters
        provider_adapters = get_provider_adapters()
        
        with next(get_session()) as session:
            processed_tasks = await task_queue_manager.process_task_queue(
                session, provider_adapters
            )
            if processed_tasks:
                print(f"[AdvancedTask] Processed {processed_tasks} tasks")
        
    except Exception as e:
        print(f"[AdvancedTask] Error in task queue processor: {e}")
        import traceback
        traceback.print_exc()


def register_advanced_automation_tasks(scheduler):
    """
    Register advanced automation background tasks with APScheduler.
    
    Args:
        scheduler: AsyncIOScheduler instance from main.py
    """
    print("[AdvancedScheduler] Registering advanced automation tasks...")
    
    # Price monitoring every 1 hour
    scheduler.add_job(
        price_monitoring_task,
        trigger=IntervalTrigger(hours=1),
        id="price_monitoring",
        name="Price Monitoring Task",
        replace_existing=True
    )
    
    # Migration check every 6 hours
    scheduler.add_job(
        migration_check_task,
        trigger=IntervalTrigger(hours=6),
        id="migration_check",
        name="Migration Check Task",
        replace_existing=True
    )
    
    # Failover check every 5 minutes
    scheduler.add_job(
        failover_check_task,
        trigger=IntervalTrigger(minutes=5),
        id="failover_check",
        name="Failover Check Task",
        replace_existing=True
    )
    
    # Task queue processor every 1 minute
    scheduler.add_job(
        task_queue_processor,
        trigger=IntervalTrigger(minutes=1),
        id="task_queue_processor",
        name="Task Queue Processor",
        replace_existing=True
    )
    
    print("[AdvancedScheduler] Advanced automation tasks registered successfully")
