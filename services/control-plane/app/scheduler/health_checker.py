"""
Health Checker Module
Monitors deployment health and records status.
"""

import asyncio
import time
from datetime import datetime
from typing import Optional
from sqlmodel import Session, select
import httpx

from app.core.models import Deployment, DeploymentStatus
from app.core.automation_models import HealthCheckLog, HealthStatus
from app.core.db import get_session


class HealthChecker:
    """
    Health checker for deployments.
    Performs HTTP/TCP checks and records results.
    """
    
    def __init__(self, timeout_seconds: int = 10):
        self.timeout_seconds = timeout_seconds
    
    async def check_deployment(
        self, 
        deployment: Deployment,
        session: Session
    ) -> HealthCheckLog:
        """
        Check the health of a single deployment.
        
        Args:
            deployment: Deployment to check
            session: Database session
            
        Returns:
            HealthCheckLog with check results
        """
        start_time = time.time()
        
        # Determine endpoint to check
        endpoint_url = deployment.endpoint_url or f"http://localhost:8080"
        
        try:
            # Perform HTTP health check
            status, response_time_ms, error_msg = await self._http_check(endpoint_url)
            
        except Exception as e:
            status = HealthStatus.ERROR
            response_time_ms = None
            error_msg = str(e)
        
        # Create health check log
        health_log = HealthCheckLog(
            deployment_id=deployment.id,
            status=status.value if isinstance(status, HealthStatus) else status,
            response_time_ms=response_time_ms,
            error_message=error_msg,
            endpoint_url=endpoint_url,
            check_method="http",
            checked_at=datetime.utcnow()
        )
        
        # Save to database
        session.add(health_log)
        session.commit()
        session.refresh(health_log)
        
        return health_log
    
    async def _http_check(
        self, 
        endpoint_url: str
    ) -> tuple[HealthStatus, Optional[int], Optional[str]]:
        """
        Perform HTTP health check.
        
        Returns:
            (status, response_time_ms, error_message)
        """
        start_time = time.time()
        
        try:
            async with httpx.AsyncClient(timeout=self.timeout_seconds) as client:
                response = await client.get(endpoint_url)
                
                response_time_ms = int((time.time() - start_time) * 1000)
                
                if response.status_code == 200:
                    return HealthStatus.HEALTHY, response_time_ms, None
                else:
                    return (
                        HealthStatus.UNHEALTHY, 
                        response_time_ms, 
                        f"HTTP {response.status_code}"
                    )
                    
        except httpx.TimeoutException:
            response_time_ms = int((time.time() - start_time) * 1000)
            return HealthStatus.TIMEOUT, response_time_ms, "Request timeout"
            
        except Exception as e:
            response_time_ms = int((time.time() - start_time) * 1000)
            return HealthStatus.ERROR, response_time_ms, str(e)
    
    async def check_all_running_deployments(self, session: Session) -> list[HealthCheckLog]:
        """
        Check health of all running deployments.
        
        Args:
            session: Database session
            
        Returns:
            List of health check logs
        """
        # Get all running deployments
        statement = select(Deployment).where(
            Deployment.status == DeploymentStatus.RUNNING
        )
        deployments = session.exec(statement).all()
        
        print(f"[HealthChecker] Checking {len(deployments)} running deployments")
        
        # Check each deployment
        health_logs = []
        for deployment in deployments:
            try:
                health_log = await self.check_deployment(deployment, session)
                health_logs.append(health_log)
                
                print(f"[HealthChecker] Deployment {deployment.id}: {health_log.status}")
                
            except Exception as e:
                print(f"[HealthChecker] Error checking deployment {deployment.id}: {e}")
        
        return health_logs
    
    def get_deployment_health_history(
        self,
        deployment_id: int,
        session: Session,
        limit: int = 100
    ) -> list[HealthCheckLog]:
        """
        Get health check history for a deployment.
        
        Args:
            deployment_id: Deployment ID
            session: Database session
            limit: Maximum number of records to return
            
        Returns:
            List of health check logs
        """
        statement = (
            select(HealthCheckLog)
            .where(HealthCheckLog.deployment_id == deployment_id)
            .order_by(HealthCheckLog.checked_at.desc())
            .limit(limit)
        )
        
        return list(session.exec(statement).all())
    
    def get_deployment_uptime_percentage(
        self,
        deployment_id: int,
        session: Session,
        hours: int = 24
    ) -> float:
        """
        Calculate deployment uptime percentage.
        
        Args:
            deployment_id: Deployment ID
            session: Database session
            hours: Time window in hours
            
        Returns:
            Uptime percentage (0-100)
        """
        from datetime import timedelta
        
        since = datetime.utcnow() - timedelta(hours=hours)
        
        statement = (
            select(HealthCheckLog)
            .where(
                HealthCheckLog.deployment_id == deployment_id,
                HealthCheckLog.checked_at >= since
            )
        )
        
        logs = list(session.exec(statement).all())
        
        if not logs:
            return 0.0
        
        healthy_count = sum(1 for log in logs if log.status == HealthStatus.HEALTHY.value)
        
        return (healthy_count / len(logs)) * 100
