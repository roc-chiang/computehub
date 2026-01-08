"""
Input: Deployment 对象, FailoverConfig, Provider Adapters, Database Session
Output: Failover 执行结果, 新部署实例, AutomationLog 记录
Pos: Phase 9 Week 2 Failover 管理核心,处理 Provider 故障切换

一旦我被更新,务必更新我的开头注释,以及所属的文件夹的 README.md
"""

import asyncio
import json
from datetime import datetime, timedelta
from typing import Dict, List, Optional
from sqlmodel import Session, select

from app.core.models import Deployment, DeploymentStatus
from app.core.automation_models import (
    FailoverConfig, HealthCheckLog, HealthStatus,
    AutomationLog, AutomationActionType, AutomationResultType
)
from app.adapters.base import ProviderAdapter


class FailoverManager:
    """
    Manages failover for deployments.
    Monitors provider health and triggers failover to backup providers.
    """
    
    def __init__(self):
        pass
    
    async def check_provider_health(
        self,
        provider: str,
        adapter: ProviderAdapter
    ) -> bool:
        """
        Check if a provider is healthy.
        
        Args:
            provider: Provider name
            adapter: Provider adapter instance
            
        Returns:
            True if provider is healthy
        """
        try:
            # Try to get pricing as a health check
            test_price = await adapter.get_pricing("RTX 4090")
            return test_price is not None
        except Exception as e:
            print(f"[FailoverManager] Provider {provider} health check failed: {e}")
            return False
    
    async def trigger_failover(
        self,
        deployment: Deployment,
        failover_config: FailoverConfig,
        session: Session,
        provider_adapters: Dict[str, ProviderAdapter]
    ) -> Optional[AutomationLog]:
        """
        Trigger failover for a deployment.
        
        Args:
            deployment: Deployment to failover
            failover_config: Failover configuration
            session: Database session
            provider_adapters: Dict of provider name -> adapter instance
            
        Returns:
            AutomationLog if failover successful, None otherwise
        """
        try:
            print(f"[FailoverManager] Triggering failover for deployment {deployment.id}")
            
            # Parse backup providers
            backup_providers = json.loads(failover_config.backup_providers_json)
            
            # Try each backup provider in order
            for backup_provider in backup_providers:
                adapter = provider_adapters.get(backup_provider)
                if not adapter:
                    print(f"[FailoverManager] No adapter for backup provider: {backup_provider}")
                    continue
                
                # Check if backup provider is healthy
                is_healthy = await self.check_provider_health(backup_provider, adapter)
                if not is_healthy:
                    print(f"[FailoverManager] Backup provider {backup_provider} is not healthy")
                    continue
                
                # Create new deployment on backup provider
                print(f"[FailoverManager] Creating deployment on backup provider {backup_provider}")
                
                try:
                    create_result = await adapter.create_instance(
                        deployment_id=f"failover-{deployment.id}",
                        gpu_type=deployment.gpu_type,
                        image=deployment.image,
                        env={}
                    )
                    
                    # Create new deployment record
                    new_deployment = Deployment(
                        user_id=deployment.user_id,
                        name=f"{deployment.name}-failover",
                        provider=backup_provider,
                        gpu_type=deployment.gpu_type,
                        instance_id=create_result["instance_id"],
                        status=DeploymentStatus.CREATING,
                        image=deployment.image,
                        created_at=datetime.utcnow()
                    )
                    session.add(new_deployment)
                    session.commit()
                    session.refresh(new_deployment)
                    
                    # Stop primary deployment
                    primary_adapter = provider_adapters.get(deployment.provider)
                    if primary_adapter:
                        await primary_adapter.stop_instance(deployment.instance_id)
                        deployment.status = DeploymentStatus.STOPPED
                        session.add(deployment)
                        session.commit()
                    
                    # Update failover config
                    failover_config.last_failover_at = datetime.utcnow()
                    failover_config.failover_count += 1
                    session.add(failover_config)
                    session.commit()
                    
                    # Create automation log
                    log = AutomationLog(
                        deployment_id=deployment.id,
                        action=AutomationActionType.FAILOVER.value,
                        trigger_reason=f"Failover to {backup_provider}",
                        trigger_data_json=json.dumps({
                            "backup_provider": backup_provider,
                            "new_deployment_id": new_deployment.id
                        }),
                        result=AutomationResultType.SUCCESS.value,
                        created_at=datetime.utcnow()
                    )
                    session.add(log)
                    session.commit()
                    
                    print(f"[FailoverManager] Failover successful to {backup_provider}")
                    return log
                    
                except Exception as e:
                    print(f"[FailoverManager] Failed to create deployment on {backup_provider}: {e}")
                    continue
            
            # All backup providers failed
            print(f"[FailoverManager] All backup providers failed for deployment {deployment.id}")
            
            # Create failed automation log
            log = AutomationLog(
                deployment_id=deployment.id,
                action=AutomationActionType.FAILOVER.value,
                trigger_reason="Failover attempted",
                result=AutomationResultType.FAILED.value,
                error_message="All backup providers failed",
                created_at=datetime.utcnow()
            )
            session.add(log)
            session.commit()
            
            return None
            
        except Exception as e:
            print(f"[FailoverManager] Failover error: {e}")
            
            # Create failed automation log
            log = AutomationLog(
                deployment_id=deployment.id,
                action=AutomationActionType.FAILOVER.value,
                trigger_reason="Failover attempted",
                result=AutomationResultType.FAILED.value,
                error_message=str(e),
                created_at=datetime.utcnow()
            )
            session.add(log)
            session.commit()
            
            return None
    
    async def process_failover_checks(
        self,
        session: Session,
        provider_adapters: Dict[str, ProviderAdapter]
    ) -> List[AutomationLog]:
        """
        Process failover checks for all configured deployments.
        
        Args:
            session: Database session
            provider_adapters: Dict of provider name -> adapter instance
            
        Returns:
            List of automation logs for triggered failovers
        """
        # Get all failover configs with auto-failover enabled
        statement = (
            select(FailoverConfig)
            .where(FailoverConfig.auto_failover_enabled == True)
        )
        configs = session.exec(statement).all()
        
        print(f"[FailoverManager] Checking {len(configs)} failover configurations")
        
        logs = []
        
        for config in configs:
            try:
                deployment = session.get(Deployment, config.deployment_id)
                if not deployment or deployment.status != DeploymentStatus.RUNNING:
                    continue
                
                # Check if deployment is unhealthy
                is_unhealthy = await self._check_deployment_unhealthy(
                    deployment,
                    config,
                    session
                )
                
                if is_unhealthy:
                    print(f"[FailoverManager] Deployment {deployment.id} is unhealthy, triggering failover")
                    
                    log = await self.trigger_failover(
                        deployment,
                        config,
                        session,
                        provider_adapters
                    )
                    
                    if log:
                        logs.append(log)
                        
            except Exception as e:
                print(f"[FailoverManager] Error processing failover for config {config.id}: {e}")
        
        return logs
    
    async def _check_deployment_unhealthy(
        self,
        deployment: Deployment,
        failover_config: FailoverConfig,
        session: Session
    ) -> bool:
        """
        Check if deployment has been unhealthy for long enough to trigger failover.
        
        Args:
            deployment: Deployment to check
            failover_config: Failover configuration
            session: Database session
            
        Returns:
            True if deployment should failover
        """
        # Get recent health check logs
        threshold_time = datetime.utcnow() - timedelta(
            seconds=failover_config.health_check_interval * failover_config.failover_threshold
        )
        
        statement = (
            select(HealthCheckLog)
            .where(
                HealthCheckLog.deployment_id == deployment.id,
                HealthCheckLog.checked_at >= threshold_time
            )
            .order_by(HealthCheckLog.checked_at.desc())
            .limit(failover_config.failover_threshold)
        )
        
        recent_checks = list(session.exec(statement).all())
        
        # Need at least failover_threshold checks
        if len(recent_checks) < failover_config.failover_threshold:
            return False
        
        # Check if all recent checks are unhealthy
        unhealthy_count = sum(
            1 for check in recent_checks 
            if check.status in [HealthStatus.UNHEALTHY.value, HealthStatus.TIMEOUT.value, HealthStatus.ERROR.value]
        )
        
        return unhealthy_count >= failover_config.failover_threshold
