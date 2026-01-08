"""
Input: Deployment 对象, Provider Adapters, MigrationTask, Database Session
Output: 迁移任务执行结果, 新部署实例, AutomationLog 记录
Pos: Phase 9 Week 2 自动迁移核心,处理跨 Provider 的部署迁移

一旦我被更新,务必更新我的开头注释,以及所属的文件夹的 README.md
"""

import asyncio
import json
from datetime import datetime
from typing import Dict, List, Optional
from sqlmodel import Session, select

from app.core.models import Deployment, DeploymentStatus
from app.core.automation_models import (
    MigrationTask, MigrationStatus, AutomationLog, 
    AutomationActionType, AutomationResultType, AutomationRule
)
from app.adapters.base import ProviderAdapter


class MigrationManager:
    """
    Manages deployment migrations across providers.
    Handles the complete migration lifecycle including rollback.
    """
    
    def __init__(self):
        pass
    
    async def migrate_deployment(
        self,
        source_deployment: Deployment,
        target_provider: str,
        target_config: Dict,
        user_id: int,
        session: Session,
        provider_adapters: Dict[str, ProviderAdapter]
    ) -> MigrationTask:
        """
        Migrate a deployment to a different provider.
        
        Args:
            source_deployment: Source deployment to migrate
            target_provider: Target provider name
            target_config: Target deployment configuration
            user_id: User ID
            session: Database session
            provider_adapters: Dict of provider name -> adapter instance
            
        Returns:
            MigrationTask with migration status
        """
        # Create migration task
        migration_task = MigrationTask(
            user_id=user_id,
            source_deployment_id=source_deployment.id,
            target_provider=target_provider,
            target_config_json=json.dumps(target_config),
            status=MigrationStatus.PENDING.value,
            created_at=datetime.utcnow()
        )
        session.add(migration_task)
        session.commit()
        session.refresh(migration_task)
        
        print(f"[MigrationManager] Created migration task {migration_task.id}")
        
        try:
            # Update status to in_progress
            migration_task.status = MigrationStatus.IN_PROGRESS.value
            migration_task.started_at = datetime.utcnow()
            session.add(migration_task)
            session.commit()
            
            # Step 1: Validate target provider
            target_adapter = provider_adapters.get(target_provider)
            if not target_adapter:
                raise Exception(f"No adapter found for provider: {target_provider}")
            
            self._update_migration_step(migration_task, "validate", session)
            
            # Step 2: Create new deployment on target provider
            print(f"[MigrationManager] Creating deployment on {target_provider}")
            
            create_result = await target_adapter.create_instance(
                deployment_id=f"migration-{migration_task.id}",
                gpu_type=target_config.get("gpu_type", source_deployment.gpu_type),
                image=target_config.get("image", source_deployment.image),
                env=target_config.get("env", {})
            )
            
            self._update_migration_step(migration_task, "create", session)
            
            # Step 3: Create deployment record
            from app.core.models import User
            user = session.get(User, user_id)
            
            target_deployment = Deployment(
                user_id=user_id,
                name=f"{source_deployment.name}-migrated",
                provider=target_provider,
                gpu_type=target_config.get("gpu_type", source_deployment.gpu_type),
                instance_id=create_result["instance_id"],
                status=DeploymentStatus.CREATING,
                image=target_config.get("image", source_deployment.image),
                created_at=datetime.utcnow()
            )
            session.add(target_deployment)
            session.commit()
            session.refresh(target_deployment)
            
            # Update migration task with target deployment
            migration_task.target_deployment_id = target_deployment.id
            session.add(migration_task)
            session.commit()
            
            self._update_migration_step(migration_task, "deploy", session)
            
            # Step 4: Wait for target deployment to be ready
            print(f"[MigrationManager] Waiting for target deployment {target_deployment.id} to be ready")
            await self._wait_for_deployment_ready(target_deployment, target_adapter, session, timeout=300)
            
            self._update_migration_step(migration_task, "verify", session)
            
            # Step 5: Stop source deployment
            print(f"[MigrationManager] Stopping source deployment {source_deployment.id}")
            source_adapter = provider_adapters.get(source_deployment.provider)
            if source_adapter:
                await source_adapter.stop_instance(source_deployment.instance_id)
                source_deployment.status = DeploymentStatus.STOPPED
                session.add(source_deployment)
                session.commit()
            
            self._update_migration_step(migration_task, "cleanup", session)
            
            # Step 6: Mark migration as completed
            migration_task.status = MigrationStatus.COMPLETED.value
            migration_task.completed_at = datetime.utcnow()
            session.add(migration_task)
            session.commit()
            
            # Create automation log
            log = AutomationLog(
                deployment_id=source_deployment.id,
                action=AutomationActionType.MIGRATE.value,
                trigger_reason=f"Migration to {target_provider}",
                trigger_data_json=json.dumps({
                    "migration_task_id": migration_task.id,
                    "target_provider": target_provider,
                    "target_deployment_id": target_deployment.id
                }),
                result=AutomationResultType.SUCCESS.value,
                created_at=datetime.utcnow()
            )
            session.add(log)
            session.commit()
            
            print(f"[MigrationManager] Migration {migration_task.id} completed successfully")
            
        except Exception as e:
            # Mark migration as failed
            migration_task.status = MigrationStatus.FAILED.value
            migration_task.error_message = str(e)
            migration_task.completed_at = datetime.utcnow()
            session.add(migration_task)
            session.commit()
            
            # Create automation log
            log = AutomationLog(
                deployment_id=source_deployment.id,
                action=AutomationActionType.MIGRATE.value,
                trigger_reason=f"Migration to {target_provider}",
                result=AutomationResultType.FAILED.value,
                error_message=str(e),
                created_at=datetime.utcnow()
            )
            session.add(log)
            session.commit()
            
            print(f"[MigrationManager] Migration {migration_task.id} failed: {e}")
        
        return migration_task
    
    def _update_migration_step(
        self,
        migration_task: MigrationTask,
        step: str,
        session: Session
    ):
        """Update migration steps JSON."""
        try:
            steps = json.loads(migration_task.migration_steps_json) if migration_task.migration_steps_json else []
        except:
            steps = []
        
        steps.append({
            "step": step,
            "timestamp": datetime.utcnow().isoformat()
        })
        
        migration_task.migration_steps_json = json.dumps(steps)
        session.add(migration_task)
        session.commit()
    
    async def _wait_for_deployment_ready(
        self,
        deployment: Deployment,
        adapter: ProviderAdapter,
        session: Session,
        timeout: int = 300
    ):
        """Wait for deployment to be ready."""
        start_time = datetime.utcnow()
        
        while (datetime.utcnow() - start_time).seconds < timeout:
            status_result = await adapter.get_status(deployment.instance_id)
            status = status_result.get("status")
            
            if status == "running":
                deployment.status = DeploymentStatus.RUNNING
                deployment.endpoint_url = status_result.get("endpoint_url")
                session.add(deployment)
                session.commit()
                return
            
            await asyncio.sleep(10)
        
        raise Exception("Timeout waiting for deployment to be ready")
    
    async def rollback_migration(
        self,
        migration_task: MigrationTask,
        session: Session,
        provider_adapters: Dict[str, ProviderAdapter]
    ) -> bool:
        """
        Rollback a failed migration.
        
        Args:
            migration_task: Migration task to rollback
            session: Database session
            provider_adapters: Dict of provider name -> adapter instance
            
        Returns:
            True if rollback successful
        """
        try:
            print(f"[MigrationManager] Rolling back migration {migration_task.id}")
            
            # Get source deployment
            source_deployment = session.get(Deployment, migration_task.source_deployment_id)
            if not source_deployment:
                raise Exception("Source deployment not found")
            
            # Restart source deployment
            source_adapter = provider_adapters.get(source_deployment.provider)
            if source_adapter:
                await source_adapter.start_instance(source_deployment.instance_id)
                source_deployment.status = DeploymentStatus.RUNNING
                session.add(source_deployment)
                session.commit()
            
            # Delete target deployment if it exists
            if migration_task.target_deployment_id:
                target_deployment = session.get(Deployment, migration_task.target_deployment_id)
                if target_deployment:
                    target_adapter = provider_adapters.get(target_deployment.provider)
                    if target_adapter:
                        await target_adapter.delete_instance(target_deployment.instance_id)
                    
                    session.delete(target_deployment)
                    session.commit()
            
            # Update migration task status
            migration_task.status = MigrationStatus.ROLLED_BACK.value
            session.add(migration_task)
            session.commit()
            
            print(f"[MigrationManager] Migration {migration_task.id} rolled back successfully")
            return True
            
        except Exception as e:
            print(f"[MigrationManager] Rollback failed: {e}")
            return False
    
    async def check_migration_triggers(
        self,
        session: Session,
        provider_adapters: Dict[str, ProviderAdapter]
    ) -> List[MigrationTask]:
        """
        Check if any deployments should trigger auto-migration.
        
        Args:
            session: Database session
            provider_adapters: Dict of provider name -> adapter instance
            
        Returns:
            List of triggered migration tasks
        """
        # Find deployments with auto-migration rules
        statement = (
            select(AutomationRule)
            .where(
                AutomationRule.rule_type == "auto_migrate",
                AutomationRule.is_enabled == True
            )
        )
        rules = session.exec(statement).all()
        
        migration_tasks = []
        
        for rule in rules:
            try:
                deployment = session.get(Deployment, rule.deployment_id)
                if not deployment or deployment.status != DeploymentStatus.RUNNING:
                    continue
                
                config = json.loads(rule.config_json)
                max_price = config.get("max_price_per_hour")
                target_provider = config.get("target_provider")
                
                if not max_price or not target_provider:
                    continue
                
                # Get current price
                current_adapter = provider_adapters.get(deployment.provider)
                if not current_adapter:
                    continue
                
                current_price = await current_adapter.get_pricing(deployment.gpu_type)
                if current_price is None:
                    continue
                
                # Check if price exceeds limit
                if current_price > max_price:
                    print(f"[MigrationManager] Auto-migration triggered for deployment {deployment.id}")
                    
                    # Trigger migration
                    migration_task = await self.migrate_deployment(
                        source_deployment=deployment,
                        target_provider=target_provider,
                        target_config={
                            "gpu_type": deployment.gpu_type,
                            "image": deployment.image
                        },
                        user_id=deployment.user_id,
                        session=session,
                        provider_adapters=provider_adapters
                    )
                    
                    migration_tasks.append(migration_task)
                    
            except Exception as e:
                print(f"[MigrationManager] Error checking migration trigger for rule {rule.id}: {e}")
        
        return migration_tasks
