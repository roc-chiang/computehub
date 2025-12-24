"""
Input: Deployment 对象, Provider 价格信息, AutomationRule 成本上限配置
Output: CostTracking 成本记录, 成本汇总统计, AutomationLog 停止日志
Pos: Phase 9 自动化引擎的成本监控器,追踪 GPU 使用成本并执行成本上限策略

一旦我被更新,务必更新我的开头注释,以及所属的文件夹的 README.md
"""

from datetime import datetime, timedelta
from typing import Optional
from sqlmodel import Session, select

from app.core.models import Deployment, DeploymentStatus
from app.core.automation_models import (
    CostTracking,
    AutomationLog,
    AutomationActionType,
    AutomationResultType,
    AutomationRule,
    AutomationRuleType
)
from app.core.provider_manager import ProviderManager
import json


class CostMonitor:
    """
    Monitors deployment costs and enforces limits.
    """
    
    async def track_deployment_cost(
        self,
        deployment: Deployment,
        session: Session
    ) -> Optional[CostTracking]:
        """
        Track cost for a deployment over the last hour.
        
        Args:
            deployment: Deployment to track
            session: Database session
            
        Returns:
            CostTracking record
        """
        if deployment.status != DeploymentStatus.RUNNING:
            return None
        
        # Calculate time period (last hour)
        period_end = datetime.utcnow()
        period_start = period_end - timedelta(hours=1)
        
        # Get GPU price from provider
        try:
            adapter = ProviderManager.get_adapter(deployment.provider, session)
            pricing = await adapter.get_pricing(deployment.gpu_type)
            price_per_hour = pricing.get("price_per_hour", 0.0)
        except:
            price_per_hour = 0.0
        
        # Calculate cost (1 hour of usage)
        gpu_hours = 1.0
        cost_usd = gpu_hours * price_per_hour
        
        # Create cost tracking record
        cost_record = CostTracking(
            deployment_id=deployment.id,
            user_id=deployment.user_id,
            cost_usd=cost_usd,
            gpu_hours=gpu_hours,
            period_start=period_start,
            period_end=period_end,
            provider=deployment.provider.value,
            gpu_type=deployment.gpu_type,
            price_per_hour=price_per_hour,
            created_at=datetime.utcnow()
        )
        
        session.add(cost_record)
        session.commit()
        session.refresh(cost_record)
        
        return cost_record
    
    def get_deployment_cost_summary(
        self,
        deployment_id: int,
        session: Session,
        days: int = 30
    ) -> dict:
        """
        Get cost summary for a deployment.
        
        Returns:
            {
                "total_cost": float,
                "total_hours": float,
                "average_price_per_hour": float,
                "period_start": datetime,
                "period_end": datetime
            }
        """
        since = datetime.utcnow() - timedelta(days=days)
        
        statement = (
            select(CostTracking)
            .where(
                CostTracking.deployment_id == deployment_id,
                CostTracking.created_at >= since
            )
        )
        
        records = list(session.exec(statement).all())
        
        if not records:
            return {
                "total_cost": 0.0,
                "total_hours": 0.0,
                "average_price_per_hour": 0.0,
                "period_start": since,
                "period_end": datetime.utcnow()
            }
        
        total_cost = sum(r.cost_usd for r in records)
        total_hours = sum(r.gpu_hours for r in records)
        avg_price = total_cost / total_hours if total_hours > 0 else 0.0
        
        return {
            "total_cost": total_cost,
            "total_hours": total_hours,
            "average_price_per_hour": avg_price,
            "period_start": since,
            "period_end": datetime.utcnow()
        }
    
    async def check_cost_limit(
        self,
        deployment: Deployment,
        session: Session
    ) -> Optional[AutomationLog]:
        """
        Check if deployment has exceeded cost limit and stop if needed.
        
        Returns:
            AutomationLog if action was taken
        """
        # Get cost limit rule
        statement = select(AutomationRule).where(
            AutomationRule.deployment_id == deployment.id,
            AutomationRule.rule_type == AutomationRuleType.COST_LIMIT.value,
            AutomationRule.is_enabled == True
        )
        
        rule = session.exec(statement).first()
        if not rule:
            return None
        
        # Parse config
        try:
            config = json.loads(rule.config_json)
            max_cost_usd = config.get("max_cost_usd", 0)
        except:
            return None
        
        # Get current month cost
        summary = self.get_deployment_cost_summary(deployment.id, session, days=30)
        current_cost = summary["total_cost"]
        
        # Check if limit exceeded
        if current_cost < max_cost_usd:
            return None
        
        # Stop deployment
        return await self._stop_deployment_for_cost_limit(
            deployment, 
            session, 
            current_cost, 
            max_cost_usd
        )
    
    async def _stop_deployment_for_cost_limit(
        self,
        deployment: Deployment,
        session: Session,
        current_cost: float,
        max_cost: float
    ) -> AutomationLog:
        """Stop deployment due to cost limit."""
        import time
        start_time = time.time()
        
        try:
            # Get provider adapter
            adapter = ProviderManager.get_adapter(deployment.provider, session)
            
            # Stop instance
            await adapter.stop_instance(deployment.instance_id)
            
            # Update deployment status
            deployment.status = DeploymentStatus.STOPPED
            session.add(deployment)
            session.commit()
            
            execution_time_ms = int((time.time() - start_time) * 1000)
            
            # Create log
            automation_log = AutomationLog(
                deployment_id=deployment.id,
                action=AutomationActionType.STOP.value,
                trigger_reason=f"Cost limit exceeded: ${current_cost:.2f} >= ${max_cost:.2f}",
                trigger_data_json=json.dumps({
                    "current_cost": current_cost,
                    "max_cost": max_cost
                }),
                result=AutomationResultType.SUCCESS.value,
                execution_time_ms=execution_time_ms,
                created_at=datetime.utcnow()
            )
            
            print(f"[CostMonitor] Stopped deployment {deployment.id} due to cost limit")
            
        except Exception as e:
            execution_time_ms = int((time.time() - start_time) * 1000)
            
            automation_log = AutomationLog(
                deployment_id=deployment.id,
                action=AutomationActionType.STOP.value,
                trigger_reason=f"Cost limit exceeded: ${current_cost:.2f} >= ${max_cost:.2f}",
                result=AutomationResultType.FAILED.value,
                error_message=str(e),
                execution_time_ms=execution_time_ms,
                created_at=datetime.utcnow()
            )
            
            print(f"[CostMonitor] Failed to stop deployment {deployment.id}: {e}")
        
        session.add(automation_log)
        session.commit()
        session.refresh(automation_log)
        
        return automation_log
