"""
Input: Deployment 对象, HealthCheckLog 历史记录, AutomationRule 配置
Output: AutomationLog 操作日志, 重启命令执行结果
Pos: Phase 9 自动化引擎的自动重启管理器,根据健康检查结果自动重启不健康部署

一旦我被更新,务必更新我的开头注释,以及所属的文件夹的 README.md
"""

from datetime import datetime, timedelta
from typing import Optional
from sqlmodel import Session, select

from app.core.models import Deployment, DeploymentStatus
from app.core.automation_models import (
    HealthCheckLog, 
    HealthStatus,
    AutomationLog,
    AutomationActionType,
    AutomationResultType,
    AutomationRule,
    AutomationRuleType
)
from app.core.provider_manager import ProviderManager


class AutoRestartManager:
    """
    Manages automatic restart of unhealthy deployments.
    """
    
    def __init__(self, unhealthy_threshold_seconds: int = 90):
        """
        Args:
            unhealthy_threshold_seconds: Seconds of unhealthy status before restart
        """
        self.unhealthy_threshold_seconds = unhealthy_threshold_seconds
    
    async def check_and_restart_if_needed(
        self,
        deployment: Deployment,
        session: Session
    ) -> Optional[AutomationLog]:
        """
        Check if deployment needs restart and perform it if necessary.
        
        Args:
            deployment: Deployment to check
            session: Database session
            
        Returns:
            AutomationLog if restart was attempted, None otherwise
        """
        # Check if auto-restart is enabled for this deployment
        if not self._is_auto_restart_enabled(deployment, session):
            return None
        
        # Check if deployment has been unhealthy long enough
        if not await self._should_restart(deployment, session):
            return None
        
        # Perform restart
        return await self._restart_deployment(deployment, session)
    
    def _is_auto_restart_enabled(
        self,
        deployment: Deployment,
        session: Session
    ) -> bool:
        """Check if auto-restart is enabled for deployment."""
        statement = select(AutomationRule).where(
            AutomationRule.deployment_id == deployment.id,
            AutomationRule.rule_type == AutomationRuleType.AUTO_RESTART.value,
            AutomationRule.is_enabled == True
        )
        
        rule = session.exec(statement).first()
        return rule is not None
    
    async def _should_restart(
        self,
        deployment: Deployment,
        session: Session
    ) -> bool:
        """
        Check if deployment should be restarted based on health history.
        
        Returns True if deployment has been unhealthy for threshold duration.
        """
        threshold_time = datetime.utcnow() - timedelta(
            seconds=self.unhealthy_threshold_seconds
        )
        
        # Get recent health checks
        statement = (
            select(HealthCheckLog)
            .where(
                HealthCheckLog.deployment_id == deployment.id,
                HealthCheckLog.checked_at >= threshold_time
            )
            .order_by(HealthCheckLog.checked_at.desc())
        )
        
        recent_checks = list(session.exec(statement).all())
        
        if not recent_checks:
            return False
        
        # Check if all recent checks are unhealthy
        all_unhealthy = all(
            check.status in [
                HealthStatus.UNHEALTHY.value,
                HealthStatus.TIMEOUT.value,
                HealthStatus.ERROR.value
            ]
            for check in recent_checks
        )
        
        return all_unhealthy and len(recent_checks) >= 3  # At least 3 failed checks
    
    async def _restart_deployment(
        self,
        deployment: Deployment,
        session: Session
    ) -> AutomationLog:
        """
        Restart the deployment and log the action.
        
        Returns:
            AutomationLog with restart result
        """
        import time
        start_time = time.time()
        
        try:
            # Get provider adapter
            adapter = ProviderManager.get_adapter(deployment.provider, session)
            
            # Attempt restart
            await adapter.restart_instance(deployment.instance_id)
            
            # Calculate execution time
            execution_time_ms = int((time.time() - start_time) * 1000)
            
            # Create success log
            automation_log = AutomationLog(
                deployment_id=deployment.id,
                action=AutomationActionType.RESTART.value,
                trigger_reason=f"Unhealthy for >{self.unhealthy_threshold_seconds}s",
                result=AutomationResultType.SUCCESS.value,
                execution_time_ms=execution_time_ms,
                created_at=datetime.utcnow()
            )
            
            print(f"[AutoRestart] Successfully restarted deployment {deployment.id}")
            
        except Exception as e:
            execution_time_ms = int((time.time() - start_time) * 1000)
            
            # Create failure log
            automation_log = AutomationLog(
                deployment_id=deployment.id,
                action=AutomationActionType.RESTART.value,
                trigger_reason=f"Unhealthy for >{self.unhealthy_threshold_seconds}s",
                result=AutomationResultType.FAILED.value,
                error_message=str(e),
                execution_time_ms=execution_time_ms,
                created_at=datetime.utcnow()
            )
            
            print(f"[AutoRestart] Failed to restart deployment {deployment.id}: {e}")
        
        # Save log
        session.add(automation_log)
        session.commit()
        session.refresh(automation_log)
        
        # Update rule trigger time
        self._update_rule_trigger_time(deployment, session)
        
        return automation_log
    
    def _update_rule_trigger_time(
        self,
        deployment: Deployment,
        session: Session
    ):
        """Update the last triggered time for auto-restart rule."""
        statement = select(AutomationRule).where(
            AutomationRule.deployment_id == deployment.id,
            AutomationRule.rule_type == AutomationRuleType.AUTO_RESTART.value
        )
        
        rule = session.exec(statement).first()
        if rule:
            rule.last_triggered_at = datetime.utcnow()
            rule.trigger_count += 1
            session.add(rule)
            session.commit()
    
    async def process_all_deployments(self, session: Session) -> list[AutomationLog]:
        """
        Check all running deployments and restart if needed.
        
        Returns:
            List of automation logs for restart actions
        """
        # Get all running deployments
        statement = select(Deployment).where(
            Deployment.status == DeploymentStatus.RUNNING
        )
        deployments = session.exec(statement).all()
        
        print(f"[AutoRestart] Checking {len(deployments)} deployments for restart")
        
        # Check each deployment
        logs = []
        for deployment in deployments:
            try:
                log = await self.check_and_restart_if_needed(deployment, session)
                if log:
                    logs.append(log)
            except Exception as e:
                print(f"[AutoRestart] Error processing deployment {deployment.id}: {e}")
        
        return logs
