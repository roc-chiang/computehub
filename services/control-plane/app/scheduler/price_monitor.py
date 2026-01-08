"""
Input: Deployment 对象, Provider Adapters, Database Session
Output: PriceHistory 记录, 价格趋势分析, 更便宜的替代方案列表
Pos: Phase 9 Week 2 价格监控核心,被 advanced_automation_tasks 定时调用

一旦我被更新,务必更新我的开头注释,以及所属的文件夹的 README.md
"""

import asyncio
from datetime import datetime, timedelta
from typing import List, Dict, Optional
from sqlmodel import Session, select

from app.core.models import Deployment, DeploymentStatus
from app.core.automation_models import PriceHistory, AutomationRule, AutomationLog, AutomationActionType, AutomationResultType
from app.adapters.base import ProviderAdapter


class PriceMonitor:
    """
    Price monitoring for deployments.
    Tracks GPU price changes and identifies cheaper alternatives.
    """
    
    def __init__(self, price_change_threshold: float = 0.05):
        """
        Initialize price monitor.
        
        Args:
            price_change_threshold: Minimum price change percentage to record (default: 5%)
        """
        self.price_change_threshold = price_change_threshold
    
    async def track_deployment_prices(
        self,
        session: Session,
        provider_adapters: Dict[str, ProviderAdapter]
    ) -> List[PriceHistory]:
        """
        Track prices for all running deployments.
        
        Args:
            session: Database session
            provider_adapters: Dict of provider name -> adapter instance
            
        Returns:
            List of newly created PriceHistory records
        """
        # Get all running deployments
        statement = select(Deployment).where(
            Deployment.status == DeploymentStatus.RUNNING
        )
        deployments = session.exec(statement).all()
        
        print(f"[PriceMonitor] Tracking prices for {len(deployments)} running deployments")
        
        price_records = []
        for deployment in deployments:
            try:
                # Get current price from provider adapter
                adapter = provider_adapters.get(deployment.provider)
                if not adapter:
                    print(f"[PriceMonitor] No adapter for provider: {deployment.provider}")
                    continue
                
                current_price = await adapter.get_pricing(deployment.gpu_type)
                if current_price is None:
                    print(f"[PriceMonitor] Could not get price for {deployment.gpu_type} on {deployment.provider}")
                    continue
                
                # Get last recorded price
                last_price_record = self._get_last_price_record(deployment.id, session)
                
                # Check if price changed significantly
                should_record = False
                if last_price_record is None:
                    should_record = True  # First time tracking
                else:
                    price_change = abs(current_price - last_price_record.price_per_hour) / last_price_record.price_per_hour
                    if price_change >= self.price_change_threshold:
                        should_record = True
                
                if should_record:
                    # Create price history record
                    price_record = PriceHistory(
                        deployment_id=deployment.id,
                        provider=deployment.provider,
                        gpu_type=deployment.gpu_type,
                        price_per_hour=current_price,
                        recorded_at=datetime.utcnow()
                    )
                    session.add(price_record)
                    session.commit()
                    session.refresh(price_record)
                    price_records.append(price_record)
                    
                    print(f"[PriceMonitor] Recorded price change for deployment {deployment.id}: ${current_price}/hr")
                    
                    # Check if we should trigger price alert
                    await self._check_price_alert(deployment, current_price, session)
                
            except Exception as e:
                print(f"[PriceMonitor] Error tracking price for deployment {deployment.id}: {e}")
        
        return price_records
    
    def _get_last_price_record(
        self,
        deployment_id: int,
        session: Session
    ) -> Optional[PriceHistory]:
        """Get the most recent price record for a deployment."""
        statement = (
            select(PriceHistory)
            .where(PriceHistory.deployment_id == deployment_id)
            .order_by(PriceHistory.recorded_at.desc())
            .limit(1)
        )
        return session.exec(statement).first()
    
    async def _check_price_alert(
        self,
        deployment: Deployment,
        current_price: float,
        session: Session
    ):
        """
        Check if price alert rule should be triggered.
        
        Args:
            deployment: Deployment to check
            current_price: Current price per hour
            session: Database session
        """
        # Find price alert rules for this deployment
        statement = (
            select(AutomationRule)
            .where(
                AutomationRule.deployment_id == deployment.id,
                AutomationRule.rule_type == "price_alert",
                AutomationRule.is_enabled == True
            )
        )
        rules = session.exec(statement).all()
        
        for rule in rules:
            try:
                import json
                config = json.loads(rule.config_json)
                max_price = config.get("max_price_per_hour")
                
                if max_price and current_price > max_price:
                    # Trigger alert
                    log = AutomationLog(
                        deployment_id=deployment.id,
                        rule_id=rule.id,
                        action=AutomationActionType.ALERT.value,
                        trigger_reason=f"Price exceeded limit: ${current_price}/hr > ${max_price}/hr",
                        result=AutomationResultType.SUCCESS.value,
                        created_at=datetime.utcnow()
                    )
                    session.add(log)
                    
                    # Update rule trigger stats
                    rule.last_triggered_at = datetime.utcnow()
                    rule.trigger_count += 1
                    session.add(rule)
                    
                    session.commit()
                    print(f"[PriceMonitor] Price alert triggered for deployment {deployment.id}")
                    
            except Exception as e:
                print(f"[PriceMonitor] Error checking price alert for rule {rule.id}: {e}")
    
    async def get_price_trend(
        self,
        deployment_id: int,
        hours: int,
        session: Session
    ) -> Dict:
        """
        Get price trend for a deployment.
        
        Args:
            deployment_id: Deployment ID
            hours: Time window in hours
            session: Database session
            
        Returns:
            Dictionary with price statistics:
            - min_price: Minimum price in period
            - max_price: Maximum price in period
            - avg_price: Average price in period
            - current_price: Most recent price
            - trend_direction: "up", "down", or "stable"
        """
        since = datetime.utcnow() - timedelta(hours=hours)
        
        statement = (
            select(PriceHistory)
            .where(
                PriceHistory.deployment_id == deployment_id,
                PriceHistory.recorded_at >= since
            )
            .order_by(PriceHistory.recorded_at.asc())
        )
        
        records = list(session.exec(statement).all())
        
        if not records:
            return {
                "min_price": None,
                "max_price": None,
                "avg_price": None,
                "current_price": None,
                "trend_direction": "unknown"
            }
        
        prices = [r.price_per_hour for r in records]
        
        # Calculate statistics
        min_price = min(prices)
        max_price = max(prices)
        avg_price = sum(prices) / len(prices)
        current_price = prices[-1]
        
        # Determine trend direction
        if len(prices) >= 2:
            first_half_avg = sum(prices[:len(prices)//2]) / (len(prices)//2)
            second_half_avg = sum(prices[len(prices)//2:]) / (len(prices) - len(prices)//2)
            
            if second_half_avg > first_half_avg * 1.05:
                trend_direction = "up"
            elif second_half_avg < first_half_avg * 0.95:
                trend_direction = "down"
            else:
                trend_direction = "stable"
        else:
            trend_direction = "stable"
        
        return {
            "min_price": min_price,
            "max_price": max_price,
            "avg_price": avg_price,
            "current_price": current_price,
            "trend_direction": trend_direction,
            "data_points": len(records)
        }
    
    async def check_cheaper_alternatives(
        self,
        deployment: Deployment,
        provider_adapters: Dict[str, ProviderAdapter],
        session: Session
    ) -> List[Dict]:
        """
        Find cheaper alternatives for a deployment.
        
        Args:
            deployment: Deployment to check
            provider_adapters: Dict of provider name -> adapter instance
            session: Database session
            
        Returns:
            List of cheaper alternatives with:
            - provider: Provider name
            - price_per_hour: Price per hour
            - savings_percent: Percentage savings
            - savings_per_hour: Dollar savings per hour
        """
        # Get current price
        current_adapter = provider_adapters.get(deployment.provider)
        if not current_adapter:
            return []
        
        current_price = await current_adapter.get_pricing(deployment.gpu_type)
        if current_price is None:
            return []
        
        # Check all other providers
        alternatives = []
        for provider_name, adapter in provider_adapters.items():
            if provider_name == deployment.provider:
                continue  # Skip current provider
            
            try:
                price = await adapter.get_pricing(deployment.gpu_type)
                if price is not None and price < current_price:
                    savings_per_hour = current_price - price
                    savings_percent = (savings_per_hour / current_price) * 100
                    
                    alternatives.append({
                        "provider": provider_name,
                        "price_per_hour": price,
                        "savings_percent": round(savings_percent, 2),
                        "savings_per_hour": round(savings_per_hour, 2)
                    })
            except Exception as e:
                print(f"[PriceMonitor] Error checking {provider_name} pricing: {e}")
        
        # Sort by savings (highest first)
        alternatives.sort(key=lambda x: x["savings_per_hour"], reverse=True)
        
        return alternatives
    
    def get_price_history(
        self,
        deployment_id: int,
        hours: int,
        session: Session
    ) -> List[PriceHistory]:
        """
        Get price history for a deployment.
        
        Args:
            deployment_id: Deployment ID
            hours: Time window in hours
            session: Database session
            
        Returns:
            List of PriceHistory records
        """
        since = datetime.utcnow() - timedelta(hours=hours)
        
        statement = (
            select(PriceHistory)
            .where(
                PriceHistory.deployment_id == deployment_id,
                PriceHistory.recorded_at >= since
            )
            .order_by(PriceHistory.recorded_at.asc())
        )
        
        return list(session.exec(statement).all())
