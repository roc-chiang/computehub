"""
Deployment metrics API endpoints
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from app.core.db import get_session
from app.core.models import Deployment
from app.core.provider_manager import ProviderManager
from app.api.v1.deployments import get_current_user
from app.core.models import User
from typing import List, Dict, Any
from datetime import datetime

router = APIRouter()


@router.get("/deployments/{deployment_id}/metrics")
async def get_deployment_metrics(
    deployment_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Get deployment performance metrics.
    
    Returns current GPU, CPU, RAM usage and other metrics.
    """
    # Get deployment
    deployment = session.exec(
        select(Deployment).where(
            Deployment.id == deployment_id,
            Deployment.user_id == current_user.id
        )
    ).first()
    
    if not deployment:
        raise HTTPException(status_code=404, detail="Deployment not found")
    
    # Get provider adapter
    adapter = ProviderManager.get_adapter(deployment.provider, session)
    
    # Get metrics from adapter
    try:
        metrics = await adapter.get_metrics(deployment.instance_id)
        
        # Add timestamp
        metrics["timestamp"] = datetime.utcnow().isoformat()
        
        return metrics
    except Exception as e:
        # Return empty metrics on error
        return {
            "timestamp": datetime.utcnow().isoformat(),
            "gpu_utilization": 0,
            "gpu_memory_utilization": 0,
            "cpu_utilization": 0,
            "ram_utilization": 0,
            "network_rx_bytes": 0,
            "network_tx_bytes": 0,
            "error": str(e)
        }
