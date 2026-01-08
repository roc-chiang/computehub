"""
Input: Database Session, AutomationRuleV2 规则, Provider Adapters, 部署状态
Output: 规则评估结果, 规则执行动作, RuleExecutionLog 日志
Pos: Phase 9 Week 3 规则引擎核心,评估和执行用户自定义的自动化规则

一旦我被更新,务必更新我的开头注释,以及所属的文件夹的 README.md
"""

import json
from datetime import datetime, timedelta
from typing import List, Dict, Optional, Any
from sqlmodel import Session, select
from app.core.models import Deployment, DeploymentStatus
from app.core.automation_models import (
    AutomationRuleV2, RuleExecutionLog, RuleTriggerType, 
    RuleActionType, RuleExecutionStatus, CostTracking, HealthCheckLog
)
from app.services.notification_service import NotificationService


class RuleEngine:
    """
    Rule Engine - Evaluates and executes custom automation rules.
    
    Features:
    - Evaluate trigger conditions (cost, price, health, time)
    - Execute actions (shutdown, restart, migrate, notify)
    - Log all executions
    - Support complex rule configurations
    """
    
    def __init__(self):
        self.notification_service = None
    
    async def process_all_rules(
        self, 
        session: Session, 
        provider_adapters: Dict
    ) -> List[RuleExecutionLog]:
        """
        Process all enabled rules and execute matching ones.
        
        Args:
            session: Database session
            provider_adapters: Provider adapters for actions
        
        Returns:
            List of execution logs
        """
        print(f"[RuleEngine] Processing rules at {datetime.utcnow()}")
        
        # Get all enabled rules
        rules = session.exec(
            select(AutomationRuleV2).where(AutomationRuleV2.is_enabled == True)
        ).all()
        
        execution_logs = []
        
        for rule in rules:
            try:
                # Evaluate rule
                should_trigger, context = await self.evaluate_rule(rule, session)
                
                if should_trigger:
                    print(f"[RuleEngine] Rule '{rule.name}' triggered")
                    
                    # Execute rule
                    execution_log = await self.execute_rule(
                        rule, context, session, provider_adapters
                    )
                    
                    if execution_log:
                        execution_logs.append(execution_log)
                        
                        # Update rule stats
                        rule.last_triggered_at = datetime.utcnow()
                        rule.trigger_count += 1
                        rule.updated_at = datetime.utcnow()
                        session.add(rule)
                
            except Exception as e:
                print(f"[RuleEngine] Error processing rule {rule.id}: {e}")
                import traceback
                traceback.print_exc()
        
        session.commit()
        return execution_logs
    
    async def evaluate_rule(
        self, 
        rule: AutomationRuleV2, 
        session: Session
    ) -> tuple[bool, Dict]:
        """
        Evaluate if a rule should trigger.
        
        Args:
            rule: AutomationRuleV2 instance
            session: Database session
        
        Returns:
            (should_trigger, context) tuple
        """
        trigger_config = json.loads(rule.trigger_config_json)
        context = {"rule_id": rule.id, "trigger_config": trigger_config}
        
        # Get target deployment(s)
        if rule.target_type == "deployment" and rule.target_id:
            deployments = [session.get(Deployment, rule.target_id)]
        elif rule.target_type == "all_deployments":
            deployments = session.exec(
                select(Deployment).where(
                    Deployment.user_id == rule.user_id,
                    Deployment.status == DeploymentStatus.RUNNING
                )
            ).all()
        else:
            deployments = []
        
        context["deployments"] = deployments
        
        # Evaluate based on trigger type
        if rule.trigger_type == RuleTriggerType.COST_THRESHOLD.value:
            return await self._evaluate_cost_threshold(trigger_config, deployments, session, context)
        
        elif rule.trigger_type == RuleTriggerType.PRICE_CHANGE.value:
            return await self._evaluate_price_change(trigger_config, deployments, session, context)
        
        elif rule.trigger_type == RuleTriggerType.HEALTH_CHECK_FAILED.value:
            return await self._evaluate_health_check(trigger_config, deployments, session, context)
        
        elif rule.trigger_type == RuleTriggerType.TIME_BASED.value:
            return await self._evaluate_time_based(trigger_config, context)
        
        else:
            print(f"[RuleEngine] Unknown trigger type: {rule.trigger_type}")
            return False, context
    
    async def _evaluate_cost_threshold(
        self, 
        config: Dict, 
        deployments: List[Deployment],
        session: Session,
        context: Dict
    ) -> tuple[bool, Dict]:
        """Evaluate cost threshold trigger"""
        threshold = config.get("threshold", 0)  # USD
        period = config.get("period", "daily")  # daily, weekly, monthly, total
        
        for deployment in deployments:
            if not deployment:
                continue
            
            # Calculate cost for period
            now = datetime.utcnow()
            if period == "daily":
                start_time = now.replace(hour=0, minute=0, second=0, microsecond=0)
            elif period == "weekly":
                start_time = now - timedelta(days=now.weekday())
            elif period == "monthly":
                start_time = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
            else:  # total
                start_time = deployment.created_at
            
            cost_records = session.exec(
                select(CostTracking).where(
                    CostTracking.deployment_id == deployment.id,
                    CostTracking.recorded_at >= start_time
                )
            ).all()
            
            total_cost = sum(record.cost_amount for record in cost_records)
            
            if total_cost >= threshold:
                context["triggered_deployment"] = deployment
                context["current_cost"] = total_cost
                context["threshold"] = threshold
                return True, context
        
        return False, context
    
    async def _evaluate_price_change(
        self,
        config: Dict,
        deployments: List[Deployment],
        session: Session,
        context: Dict
    ) -> tuple[bool, Dict]:
        """Evaluate price change trigger"""
        change_percentage = config.get("change_percentage", 10)  # %
        direction = config.get("direction", "increase")  # increase or decrease
        
        # This would need PriceHistory integration
        # For now, return False
        return False, context
    
    async def _evaluate_health_check(
        self,
        config: Dict,
        deployments: List[Deployment],
        session: Session,
        context: Dict
    ) -> tuple[bool, Dict]:
        """Evaluate health check failed trigger"""
        consecutive_failures = config.get("consecutive_failures", 3)
        
        for deployment in deployments:
            if not deployment:
                continue
            
            # Get recent health check logs
            recent_logs = session.exec(
                select(HealthCheckLog).where(
                    HealthCheckLog.deployment_id == deployment.id
                ).order_by(HealthCheckLog.checked_at.desc()).limit(consecutive_failures)
            ).all()
            
            if len(recent_logs) >= consecutive_failures:
                # Check if all are failures
                all_failed = all(log.status in ["unhealthy", "error", "timeout"] for log in recent_logs)
                
                if all_failed:
                    context["triggered_deployment"] = deployment
                    context["failed_checks"] = len(recent_logs)
                    return True, context
        
        return False, context
    
    async def _evaluate_time_based(
        self,
        config: Dict,
        context: Dict
    ) -> tuple[bool, Dict]:
        """Evaluate time-based trigger"""
        schedule_type = config.get("schedule_type", "daily")  # daily, weekly, specific_time
        target_time = config.get("target_time", "00:00")  # HH:MM format
        
        now = datetime.utcnow()
        current_time = now.strftime("%H:%M")
        
        # Simple time matching (can be enhanced with cron-like syntax)
        if current_time == target_time:
            context["triggered_time"] = now.isoformat()
            return True, context
        
        return False, context
    
    async def execute_rule(
        self,
        rule: AutomationRuleV2,
        context: Dict,
        session: Session,
        provider_adapters: Dict
    ) -> Optional[RuleExecutionLog]:
        """
        Execute a rule's action.
        
        Args:
            rule: AutomationRuleV2 instance
            context: Evaluation context
            session: Database session
            provider_adapters: Provider adapters
        
        Returns:
            RuleExecutionLog or None
        """
        action_config = json.loads(rule.action_config_json)
        triggered_deployment = context.get("triggered_deployment")
        
        execution_log = RuleExecutionLog(
            rule_id=rule.id,
            user_id=rule.user_id,
            trigger_reason=self._format_trigger_reason(rule, context),
            action_taken=rule.action_type,
            target_deployment_id=triggered_deployment.id if triggered_deployment else None,
            status=RuleExecutionStatus.SUCCESS.value,
            executed_at=datetime.utcnow()
        )
        
        try:
            # Execute based on action type
            if rule.action_type == RuleActionType.SHUTDOWN.value:
                result = await self._execute_shutdown(triggered_deployment, session, provider_adapters)
            
            elif rule.action_type == RuleActionType.RESTART.value:
                result = await self._execute_restart(triggered_deployment, session, provider_adapters)
            
            elif rule.action_type == RuleActionType.MIGRATE.value:
                result = await self._execute_migrate(triggered_deployment, action_config, session, provider_adapters)
            
            elif rule.action_type == RuleActionType.NOTIFY.value:
                result = await self._execute_notify(rule, context, action_config, session)
            
            else:
                result = {"success": False, "error": f"Unknown action type: {rule.action_type}"}
            
            # Update execution log
            if result.get("success"):
                execution_log.status = RuleExecutionStatus.SUCCESS.value
                execution_log.result_message = result.get("message", "Action completed successfully")
            else:
                execution_log.status = RuleExecutionStatus.FAILED.value
                execution_log.error_message = result.get("error", "Action failed")
            
        except Exception as e:
            execution_log.status = RuleExecutionStatus.FAILED.value
            execution_log.error_message = str(e)
            print(f"[RuleEngine] Error executing rule {rule.id}: {e}")
        
        session.add(execution_log)
        session.commit()
        
        return execution_log
    
    async def _execute_shutdown(
        self,
        deployment: Deployment,
        session: Session,
        provider_adapters: Dict
    ) -> Dict:
        """Execute shutdown action"""
        try:
            from app.core.provider_manager import ProviderManager
            adapter = ProviderManager.get_adapter(deployment.provider, session)
            
            result = await adapter.stop_deployment(deployment.provider_deployment_id)
            
            if result.get("success"):
                deployment.status = DeploymentStatus.STOPPED
                deployment.updated_at = datetime.utcnow()
                session.add(deployment)
                session.commit()
                
                return {"success": True, "message": f"Deployment {deployment.id} shut down"}
            else:
                return {"success": False, "error": result.get("error", "Shutdown failed")}
                
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    async def _execute_restart(
        self,
        deployment: Deployment,
        session: Session,
        provider_adapters: Dict
    ) -> Dict:
        """Execute restart action"""
        try:
            from app.core.provider_manager import ProviderManager
            adapter = ProviderManager.get_adapter(deployment.provider, session)
            
            # Stop then start
            stop_result = await adapter.stop_deployment(deployment.provider_deployment_id)
            if not stop_result.get("success"):
                return {"success": False, "error": "Failed to stop deployment"}
            
            start_result = await adapter.start_deployment(deployment.provider_deployment_id)
            if start_result.get("success"):
                deployment.status = DeploymentStatus.RUNNING
                deployment.updated_at = datetime.utcnow()
                session.add(deployment)
                session.commit()
                
                return {"success": True, "message": f"Deployment {deployment.id} restarted"}
            else:
                return {"success": False, "error": start_result.get("error", "Restart failed")}
                
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    async def _execute_migrate(
        self,
        deployment: Deployment,
        action_config: Dict,
        session: Session,
        provider_adapters: Dict
    ) -> Dict:
        """Execute migrate action"""
        # This would integrate with MigrationManager
        # For now, return placeholder
        return {"success": False, "error": "Migration not yet implemented in rule engine"}
    
    async def _execute_notify(
        self,
        rule: AutomationRuleV2,
        context: Dict,
        action_config: Dict,
        session: Session
    ) -> Dict:
        """Execute notify action"""
        try:
            if not self.notification_service:
                self.notification_service = NotificationService(session)
            
            message = action_config.get("message", "Rule triggered")
            title = action_config.get("title", f"Rule: {rule.name}")
            
            # Format message with context
            formatted_message = message.format(**context)
            
            await self.notification_service.send_notification(
                user_id=rule.user_id,
                title=title,
                message=formatted_message,
                notification_type="rule_trigger",
                related_deployment_id=context.get("triggered_deployment", {}).get("id")
            )
            
            return {"success": True, "message": "Notification sent"}
            
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def _format_trigger_reason(self, rule: AutomationRuleV2, context: Dict) -> str:
        """Format trigger reason for logging"""
        if rule.trigger_type == RuleTriggerType.COST_THRESHOLD.value:
            return f"Cost threshold exceeded: ${context.get('current_cost', 0):.2f} >= ${context.get('threshold', 0):.2f}"
        
        elif rule.trigger_type == RuleTriggerType.HEALTH_CHECK_FAILED.value:
            return f"Health check failed {context.get('failed_checks', 0)} times consecutively"
        
        elif rule.trigger_type == RuleTriggerType.TIME_BASED.value:
            return f"Scheduled time reached: {context.get('triggered_time', 'N/A')}"
        
        else:
            return f"Rule triggered: {rule.trigger_type}"
