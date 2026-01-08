"""
Input: Database Session, Deployment 数据, CostTracking 记录, NotificationService
Output: 成本检查结果, 自动关机触发, 成本告警通知
Pos: Phase 9 Week 3 成本上限管理器,监控部署成本并在超限时自动关机

一旦我被更新,务必更新我的开头注释,以及所属的文件夹的 README.md
"""

from datetime import datetime, timedelta
from typing import List, Dict, Optional
from sqlmodel import Session, select
from app.core.models import Deployment, DeploymentStatus
from app.core.automation_models import CostLimit, CostTracking, CostLimitPeriod
from app.services.notification_service import NotificationService


class CostLimitManager:
    """
    Cost Limit Manager - Monitors deployment costs and triggers auto-shutdown.
    
    Features:
    - Track deployment costs in real-time
    - Send alerts when approaching limit (80%)
    - Auto-shutdown when limit exceeded
    - Support multiple time periods (daily, weekly, monthly, total)
    """
    
    def __init__(self):
        self.notification_service = None
    
    async def check_cost_limits(self, session: Session, provider_adapters: Dict) -> List[CostLimit]:
        """
        Check all cost limits and trigger actions if needed.
        
        Returns:
            List of CostLimit configurations that triggered actions
        """
        print(f"[CostLimit] Checking cost limits at {datetime.utcnow()}")
        
        # Get all active cost limit configurations
        cost_limits = session.exec(
            select(CostLimit).where(
                CostLimit.auto_shutdown_enabled == True,
                CostLimit.limit_reached == False
            )
        ).all()
        
        triggered_limits = []
        
        for cost_limit in cost_limits:
            # Get deployment
            deployment = session.get(Deployment, cost_limit.deployment_id)
            if not deployment:
                continue
            
            # Calculate current cost
            current_cost = await self.calculate_current_cost(
                deployment, cost_limit, session
            )
            
            # Update current cost
            cost_limit.current_cost = current_cost
            session.add(cost_limit)
            
            # Check if limit reached
            percentage = (current_cost / cost_limit.limit_amount) * 100
            
            # Send alert at threshold (default 80%)
            if percentage >= cost_limit.notify_at_percentage and not cost_limit.last_notified_at:
                await self.send_cost_alert(
                    deployment, cost_limit, percentage, session
                )
                cost_limit.last_notified_at = datetime.utcnow()
                session.add(cost_limit)
            
            # Trigger shutdown if limit exceeded
            if current_cost >= cost_limit.limit_amount:
                print(f"[CostLimit] Cost limit exceeded for deployment {deployment.id}")
                success = await self.trigger_shutdown(
                    deployment, cost_limit, session, provider_adapters
                )
                
                if success:
                    cost_limit.limit_reached = True
                    cost_limit.shutdown_at = datetime.utcnow()
                    session.add(cost_limit)
                    triggered_limits.append(cost_limit)
        
        session.commit()
        return triggered_limits
    
    async def calculate_current_cost(
        self, 
        deployment: Deployment, 
        cost_limit: CostLimit,
        session: Session
    ) -> float:
        """
        Calculate current cost for a deployment based on the limit period.
        
        Args:
            deployment: Deployment instance
            cost_limit: CostLimit configuration
            session: Database session
        
        Returns:
            Current cost in USD
        """
        now = datetime.utcnow()
        
        # Determine time range based on period
        if cost_limit.limit_period == CostLimitPeriod.DAILY.value:
            start_time = now.replace(hour=0, minute=0, second=0, microsecond=0)
        elif cost_limit.limit_period == CostLimitPeriod.WEEKLY.value:
            start_time = now - timedelta(days=now.weekday())
            start_time = start_time.replace(hour=0, minute=0, second=0, microsecond=0)
        elif cost_limit.limit_period == CostLimitPeriod.MONTHLY.value:
            start_time = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        else:  # TOTAL
            start_time = deployment.created_at
        
        # Query cost tracking records
        cost_records = session.exec(
            select(CostTracking).where(
                CostTracking.deployment_id == deployment.id,
                CostTracking.recorded_at >= start_time
            )
        ).all()
        
        # Sum up costs
        total_cost = sum(record.cost_amount for record in cost_records)
        
        return total_cost
    
    async def trigger_shutdown(
        self,
        deployment: Deployment,
        cost_limit: CostLimit,
        session: Session,
        provider_adapters: Dict
    ) -> bool:
        """
        Trigger auto-shutdown for a deployment that exceeded cost limit.
        
        Args:
            deployment: Deployment to shutdown
            cost_limit: CostLimit configuration
            session: Database session
            provider_adapters: Provider adapters for shutdown
        
        Returns:
            True if shutdown successful, False otherwise
        """
        try:
            print(f"[CostLimit] Triggering auto-shutdown for deployment {deployment.id}")
            
            # Get provider adapter
            from app.core.provider_manager import ProviderManager
            adapter = ProviderManager.get_adapter(
                deployment.provider,
                session,
                user_api_key=None  # Use system credentials
            )
            
            # Stop the deployment
            result = await adapter.stop_deployment(deployment.provider_deployment_id)
            
            if result.get("success"):
                # Update deployment status
                deployment.status = DeploymentStatus.STOPPED
                deployment.updated_at = datetime.utcnow()
                session.add(deployment)
                
                # Send shutdown notification
                await self.send_shutdown_notification(
                    deployment, cost_limit, session
                )
                
                print(f"[CostLimit] ✓ Deployment {deployment.id} shut down successfully")
                return True
            else:
                print(f"[CostLimit] ✗ Failed to shutdown deployment {deployment.id}: {result.get('error')}")
                return False
                
        except Exception as e:
            print(f"[CostLimit] ✗ Error shutting down deployment {deployment.id}: {e}")
            import traceback
            traceback.print_exc()
            return False
    
    async def send_cost_alert(
        self,
        deployment: Deployment,
        cost_limit: CostLimit,
        percentage: float,
        session: Session
    ):
        """
        Send cost alert notification when approaching limit.
        
        Args:
            deployment: Deployment instance
            cost_limit: CostLimit configuration
            percentage: Current percentage of limit
            session: Database session
        """
        try:
            if not self.notification_service:
                self.notification_service = NotificationService(session)
            
            message = (
                f"⚠️ Cost Alert: Deployment '{deployment.name}' "
                f"has reached {percentage:.1f}% of its cost limit.\n\n"
                f"Current Cost: ${cost_limit.current_cost:.2f}\n"
                f"Limit: ${cost_limit.limit_amount:.2f}\n"
                f"Period: {cost_limit.limit_period}\n\n"
                f"Auto-shutdown will trigger at 100%."
            )
            
            await self.notification_service.send_notification(
                user_id=cost_limit.user_id,
                title="Cost Limit Alert",
                message=message,
                notification_type="cost_alert",
                related_deployment_id=deployment.id
            )
            
            print(f"[CostLimit] ✓ Cost alert sent for deployment {deployment.id}")
            
        except Exception as e:
            print(f"[CostLimit] ✗ Failed to send cost alert: {e}")
    
    async def send_shutdown_notification(
        self,
        deployment: Deployment,
        cost_limit: CostLimit,
        session: Session
    ):
        """
        Send notification after auto-shutdown.
        
        Args:
            deployment: Deployment instance
            cost_limit: CostLimit configuration
            session: Database session
        """
        try:
            if not self.notification_service:
                self.notification_service = NotificationService(session)
            
            message = (
                f"🛑 Auto-Shutdown: Deployment '{deployment.name}' "
                f"has been automatically shut down due to cost limit exceeded.\n\n"
                f"Final Cost: ${cost_limit.current_cost:.2f}\n"
                f"Limit: ${cost_limit.limit_amount:.2f}\n"
                f"Period: {cost_limit.limit_period}\n\n"
                f"The deployment has been stopped to prevent further costs."
            )
            
            await self.notification_service.send_notification(
                user_id=cost_limit.user_id,
                title="Deployment Auto-Shutdown",
                message=message,
                notification_type="auto_shutdown",
                related_deployment_id=deployment.id
            )
            
            print(f"[CostLimit] ✓ Shutdown notification sent for deployment {deployment.id}")
            
        except Exception as e:
            print(f"[CostLimit] ✗ Failed to send shutdown notification: {e}")
    
    async def get_cost_status(
        self,
        deployment_id: int,
        session: Session
    ) -> Optional[Dict]:
        """
        Get current cost status for a deployment.
        
        Args:
            deployment_id: Deployment ID
            session: Database session
        
        Returns:
            Dict with cost status or None if no limit configured
        """
        cost_limit = session.exec(
            select(CostLimit).where(CostLimit.deployment_id == deployment_id)
        ).first()
        
        if not cost_limit:
            return None
        
        deployment = session.get(Deployment, deployment_id)
        if not deployment:
            return None
        
        # Calculate current cost
        current_cost = await self.calculate_current_cost(
            deployment, cost_limit, session
        )
        
        percentage = (current_cost / cost_limit.limit_amount) * 100 if cost_limit.limit_amount > 0 else 0
        
        return {
            "deployment_id": deployment_id,
            "deployment_name": deployment.name,
            "current_cost": current_cost,
            "limit_amount": cost_limit.limit_amount,
            "limit_period": cost_limit.limit_period,
            "percentage": percentage,
            "limit_reached": cost_limit.limit_reached,
            "auto_shutdown_enabled": cost_limit.auto_shutdown_enabled,
            "notify_at_percentage": cost_limit.notify_at_percentage,
            "last_notified_at": cost_limit.last_notified_at.isoformat() if cost_limit.last_notified_at else None,
            "shutdown_at": cost_limit.shutdown_at.isoformat() if cost_limit.shutdown_at else None
        }
