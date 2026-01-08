"""
Input: BatchTask 配置, Database Session, Provider Adapters
Output: 任务执行结果, 批量操作日志
Pos: Phase 9 Week 2 任务队列核心,处理批量和定时任务

一旦我被更新,务必更新我的开头注释,以及所属的文件夹的 README.md
"""

import asyncio
import json
from datetime import datetime
from typing import Dict, List, Optional
from sqlmodel import Session, select

from app.core.models import Deployment, DeploymentStatus
from app.core.automation_models import BatchTask, TaskStatus, TaskType
from app.adapters.base import ProviderAdapter


class TaskQueueManager:
    """
    Manages batch task queue.
    Executes scheduled and batch processing tasks.
    """
    
    def __init__(self):
        pass
    
    async def enqueue_task(
        self,
        user_id: int,
        task_type: str,
        task_config: Dict,
        priority: int,
        scheduled_at: datetime,
        session: Session
    ) -> BatchTask:
        """
        Enqueue a new batch task.
        
        Args:
            user_id: User ID
            task_type: Task type (TaskType enum value)
            task_config: Task configuration dict
            priority: Task priority (1-10)
            scheduled_at: When to execute the task
            session: Database session
            
        Returns:
            Created BatchTask
        """
        task = BatchTask(
            user_id=user_id,
            task_type=task_type,
            task_config_json=json.dumps(task_config),
            status=TaskStatus.QUEUED.value,
            priority=max(1, min(10, priority)),  # Clamp to 1-10
            scheduled_at=scheduled_at,
            created_at=datetime.utcnow()
        )
        
        session.add(task)
        session.commit()
        session.refresh(task)
        
        print(f"[TaskQueueManager] Enqueued task {task.id} (type: {task_type}, priority: {priority})")
        
        return task
    
    async def process_task_queue(
        self,
        session: Session,
        provider_adapters: Dict[str, ProviderAdapter]
    ) -> List[BatchTask]:
        """
        Process queued tasks that are ready to execute.
        
        Args:
            session: Database session
            provider_adapters: Dict of provider name -> adapter instance
            
        Returns:
            List of processed tasks
        """
        # Get queued tasks that are ready to execute
        statement = (
            select(BatchTask)
            .where(
                BatchTask.status == TaskStatus.QUEUED.value,
                BatchTask.scheduled_at <= datetime.utcnow()
            )
            .order_by(BatchTask.priority.desc(), BatchTask.scheduled_at.asc())
            .limit(10)  # Process up to 10 tasks at a time
        )
        
        tasks = list(session.exec(statement).all())
        
        if not tasks:
            return []
        
        print(f"[TaskQueueManager] Processing {len(tasks)} queued tasks")
        
        processed_tasks = []
        
        for task in tasks:
            try:
                # Update status to running
                task.status = TaskStatus.RUNNING.value
                task.started_at = datetime.utcnow()
                session.add(task)
                session.commit()
                
                # Execute task
                result = await self.execute_task(task, session, provider_adapters)
                
                # Update task with result
                task.status = TaskStatus.COMPLETED.value
                task.completed_at = datetime.utcnow()
                task.result_json = json.dumps(result)
                session.add(task)
                session.commit()
                
                print(f"[TaskQueueManager] Task {task.id} completed successfully")
                processed_tasks.append(task)
                
            except Exception as e:
                # Mark task as failed
                task.status = TaskStatus.FAILED.value
                task.completed_at = datetime.utcnow()
                task.error_message = str(e)
                session.add(task)
                session.commit()
                
                print(f"[TaskQueueManager] Task {task.id} failed: {e}")
        
        return processed_tasks
    
    async def execute_task(
        self,
        task: BatchTask,
        session: Session,
        provider_adapters: Dict[str, ProviderAdapter]
    ) -> Dict:
        """
        Execute a batch task.
        
        Args:
            task: Task to execute
            session: Database session
            provider_adapters: Dict of provider name -> adapter instance
            
        Returns:
            Result dictionary
        """
        config = json.loads(task.task_config_json)
        
        if task.task_type == TaskType.BATCH_DEPLOY.value:
            return await self._execute_batch_deploy(task, config, session, provider_adapters)
        
        elif task.task_type == TaskType.BATCH_STOP.value:
            return await self._execute_batch_stop(task, config, session, provider_adapters)
        
        elif task.task_type == TaskType.BATCH_DELETE.value:
            return await self._execute_batch_delete(task, config, session, provider_adapters)
        
        elif task.task_type == TaskType.SCHEDULED_MIGRATION.value:
            return await self._execute_scheduled_migration(task, config, session, provider_adapters)
        
        else:
            raise Exception(f"Unknown task type: {task.task_type}")
    
    async def _execute_batch_deploy(
        self,
        task: BatchTask,
        config: Dict,
        session: Session,
        provider_adapters: Dict[str, ProviderAdapter]
    ) -> Dict:
        """Execute batch deployment creation."""
        deployments_config = config.get("deployments", [])
        
        created_deployments = []
        failed_deployments = []
        
        for deploy_config in deployments_config:
            try:
                provider = deploy_config["provider"]
                gpu_type = deploy_config["gpu_type"]
                image = deploy_config.get("image", "ubuntu:22.04")
                name = deploy_config.get("name", f"batch-{task.id}")
                
                adapter = provider_adapters.get(provider)
                if not adapter:
                    raise Exception(f"No adapter for provider: {provider}")
                
                # Create instance
                create_result = await adapter.create_instance(
                    deployment_id=f"batch-{task.id}",
                    gpu_type=gpu_type,
                    image=image,
                    env=deploy_config.get("env", {})
                )
                
                # Create deployment record
                deployment = Deployment(
                    user_id=task.user_id,
                    name=name,
                    provider=provider,
                    gpu_type=gpu_type,
                    instance_id=create_result["instance_id"],
                    status=DeploymentStatus.CREATING,
                    image=image,
                    created_at=datetime.utcnow()
                )
                session.add(deployment)
                session.commit()
                session.refresh(deployment)
                
                created_deployments.append(deployment.id)
                
            except Exception as e:
                failed_deployments.append({
                    "config": deploy_config,
                    "error": str(e)
                })
        
        return {
            "created_count": len(created_deployments),
            "failed_count": len(failed_deployments),
            "created_deployment_ids": created_deployments,
            "failed_deployments": failed_deployments
        }
    
    async def _execute_batch_stop(
        self,
        task: BatchTask,
        config: Dict,
        session: Session,
        provider_adapters: Dict[str, ProviderAdapter]
    ) -> Dict:
        """Execute batch deployment stop."""
        deployment_ids = config.get("deployment_ids", [])
        
        stopped_count = 0
        failed_count = 0
        
        for deployment_id in deployment_ids:
            try:
                deployment = session.get(Deployment, deployment_id)
                if not deployment:
                    failed_count += 1
                    continue
                
                # Check user permission
                if deployment.user_id != task.user_id:
                    failed_count += 1
                    continue
                
                adapter = provider_adapters.get(deployment.provider)
                if not adapter:
                    failed_count += 1
                    continue
                
                # Stop instance
                await adapter.stop_instance(deployment.instance_id)
                deployment.status = DeploymentStatus.STOPPED
                session.add(deployment)
                session.commit()
                
                stopped_count += 1
                
            except Exception as e:
                print(f"[TaskQueueManager] Failed to stop deployment {deployment_id}: {e}")
                failed_count += 1
        
        return {
            "stopped_count": stopped_count,
            "failed_count": failed_count
        }
    
    async def _execute_batch_delete(
        self,
        task: BatchTask,
        config: Dict,
        session: Session,
        provider_adapters: Dict[str, ProviderAdapter]
    ) -> Dict:
        """Execute batch deployment deletion."""
        deployment_ids = config.get("deployment_ids", [])
        
        deleted_count = 0
        failed_count = 0
        
        for deployment_id in deployment_ids:
            try:
                deployment = session.get(Deployment, deployment_id)
                if not deployment:
                    failed_count += 1
                    continue
                
                # Check user permission
                if deployment.user_id != task.user_id:
                    failed_count += 1
                    continue
                
                adapter = provider_adapters.get(deployment.provider)
                if not adapter:
                    failed_count += 1
                    continue
                
                # Delete instance
                await adapter.delete_instance(deployment.instance_id)
                session.delete(deployment)
                session.commit()
                
                deleted_count += 1
                
            except Exception as e:
                print(f"[TaskQueueManager] Failed to delete deployment {deployment_id}: {e}")
                failed_count += 1
        
        return {
            "deleted_count": deleted_count,
            "failed_count": failed_count
        }
    
    async def _execute_scheduled_migration(
        self,
        task: BatchTask,
        config: Dict,
        session: Session,
        provider_adapters: Dict[str, ProviderAdapter]
    ) -> Dict:
        """Execute scheduled migration."""
        from app.scheduler.auto_migration import MigrationManager
        
        deployment_id = config.get("deployment_id")
        target_provider = config.get("target_provider")
        target_config = config.get("target_config", {})
        
        deployment = session.get(Deployment, deployment_id)
        if not deployment:
            raise Exception(f"Deployment {deployment_id} not found")
        
        # Check user permission
        if deployment.user_id != task.user_id:
            raise Exception("Permission denied")
        
        # Execute migration
        migration_manager = MigrationManager()
        migration_task = await migration_manager.migrate_deployment(
            source_deployment=deployment,
            target_provider=target_provider,
            target_config=target_config,
            user_id=task.user_id,
            session=session,
            provider_adapters=provider_adapters
        )
        
        return {
            "migration_task_id": migration_task.id,
            "status": migration_task.status
        }
    
    async def cancel_task(
        self,
        task_id: int,
        session: Session
    ) -> bool:
        """
        Cancel a queued task.
        
        Args:
            task_id: Task ID
            session: Database session
            
        Returns:
            True if cancelled successfully
        """
        task = session.get(BatchTask, task_id)
        if not task:
            return False
        
        # Can only cancel queued tasks
        if task.status != TaskStatus.QUEUED.value:
            return False
        
        task.status = TaskStatus.CANCELLED.value
        task.completed_at = datetime.utcnow()
        session.add(task)
        session.commit()
        
        print(f"[TaskQueueManager] Task {task_id} cancelled")
        return True
