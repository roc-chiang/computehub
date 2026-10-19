"""
Input: APScheduler 调度器, Database Session, 高级自动化 Scheduler 模块
Output: 定时执行的价格监控和批量任务队列
Pos: 高级自动化任务调度器；迁移和故障转移在安全实现完成前不注册

一旦我被更新,务必更新我的开头注释,以及所属的文件夹的 README.md
"""

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.interval import IntervalTrigger
from datetime import datetime

from app.core.db import get_session
from app.scheduler.price_monitor import PriceMonitor
from app.scheduler.task_queue import TaskQueueManager


# Module instances
price_monitor = PriceMonitor()
task_queue_manager = TaskQueueManager()


async def price_monitoring_task():
    """
    Price monitoring task - runs every 1 hour.
    Tracks GPU price changes for all running deployments.
    """
    print(f"[AdvancedTask] Running price monitoring at {datetime.utcnow()}")
    
    try:
        with next(get_session()) as session:
            price_records = await price_monitor.track_deployment_prices(
                session, {}
            )
            print(f"[AdvancedTask] Price monitoring completed: {len(price_records)} price changes recorded")
    except Exception as e:
        print(f"[AdvancedTask] Price monitoring failed: {e}")


async def task_queue_processor():
    """
    Task queue processor - runs every 1 minute.
    Processes queued batch tasks that are ready to execute.
    """
    print(f"[AdvancedTask] Running task queue processor at {datetime.utcnow()}")
    
    try:
        with next(get_session()) as session:
            processed_tasks = await task_queue_manager.process_task_queue(
                session, {}
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
    
    # Task queue processor every 1 minute
    scheduler.add_job(
        task_queue_processor,
        trigger=IntervalTrigger(minutes=1),
        id="task_queue_processor",
        name="Task Queue Processor",
        replace_existing=True
    )
    
    print("[AdvancedScheduler] Advanced automation tasks registered successfully")
