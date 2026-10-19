from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session, select, or_, func
from app.core.db import get_session
from app.core.models import Deployment, DeploymentStatus, User
from app.core.provider_manager import ProviderManager
from app.core.automation_models import CostTracking
from pydantic import BaseModel

router = APIRouter()

# Response Models
class DeploymentListItem(BaseModel):
    id: int
    name: str
    user_id: int
    user_email: str
    provider: str
    gpu_type: str
    status: str
    created_at: datetime
    uptime_seconds: Optional[int]
    estimated_cost: float

class DeploymentStats(BaseModel):
    total_deployments: int
    active_deployments: int
    total_gpu_hours: float
    total_cost: float

class BatchOperation(BaseModel):
    deployment_ids: List[int]
    operation: str  # "stop" or "delete"

# API Endpoints

@router.get("/deployments", response_model=List[DeploymentListItem])
async def list_all_deployments(
    search: Optional[str] = Query(None, description="Search by name or user email"),
    status: Optional[str] = Query(None, description="Filter by status"),
    provider: Optional[str] = Query(None, description="Filter by provider"),
    user_id: Optional[int] = Query(None, description="Filter by user ID"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    session: Session = Depends(get_session)
):
    """
    List all deployments across all users.
    Admin can search, filter, and paginate.
    """
    # Build query with join to get user email
    query = select(Deployment, User).join(User, Deployment.user_id == User.id)
    
    # Apply search filter
    if search:
        query = query.where(
            or_(
                Deployment.name.contains(search),
                User.email.contains(search)
            )
        )
    
    # Apply status filter
    if status:
        query = query.where(Deployment.status == status)
    
    # Apply provider filter
    if provider:
        query = query.where(Deployment.provider == provider)
    
    # Apply user filter
    if user_id:
        query = query.where(Deployment.user_id == user_id)
    
    # Apply pagination
    query = query.offset(skip).limit(limit)
    
    results = session.exec(query).all()
    
    # Build response
    deployments = []
    for deployment, user in results:
        estimated_cost = session.exec(
            select(func.coalesce(func.sum(CostTracking.cost_usd), 0.0)).where(
                CostTracking.deployment_id == deployment.id
            )
        ).one()
        
        deployments.append(DeploymentListItem(
            id=deployment.id,
            name=deployment.name,
            user_id=deployment.user_id,
            user_email=user.email,
            provider=deployment.provider.value,
            gpu_type=deployment.gpu_type,
            status=deployment.status.value,
            created_at=deployment.created_at,
            uptime_seconds=deployment.uptime_seconds,
            estimated_cost=estimated_cost
        ))
    
    return deployments


@router.get("/deployments/stats", response_model=DeploymentStats)
async def get_deployment_stats(
    session: Session = Depends(get_session)
):
    """
    Get overall deployment statistics.
    """
    # Get all deployments
    deployments = session.exec(select(Deployment)).all()
    
    # Calculate stats
    total_deployments = len(deployments)
    active_deployments = len([d for d in deployments if d.status == DeploymentStatus.RUNNING])
    
    total_gpu_hours, total_cost = session.exec(
        select(
            func.coalesce(func.sum(CostTracking.gpu_hours), 0.0),
            func.coalesce(func.sum(CostTracking.cost_usd), 0.0),
        )
    ).one()
    
    return DeploymentStats(
        total_deployments=total_deployments,
        active_deployments=active_deployments,
        total_gpu_hours=total_gpu_hours,
        total_cost=total_cost
    )


@router.post("/deployments/batch")
async def batch_operation(
    batch_op: BatchOperation,
    session: Session = Depends(get_session)
):
    """
    Perform batch operations on deployments.
    Supports: stop, delete
    """
    if batch_op.operation not in ["stop", "delete"]:
        raise HTTPException(status_code=400, detail="Invalid operation. Must be 'stop' or 'delete'")
    
    results = {
        "success": [],
        "failed": []
    }
    
    for deployment_id in batch_op.deployment_ids:
        deployment = session.get(Deployment, deployment_id)
        if not deployment:
            results["failed"].append({
                "id": deployment_id,
                "reason": "Deployment not found"
            })
            continue
        
        try:
            if batch_op.operation == "stop":
                if not deployment.instance_id:
                    raise ValueError("Deployment has no provider instance")
                adapter = ProviderManager.get_deployment_adapter(deployment, session)
                if not await adapter.stop_instance(deployment.instance_id):
                    raise RuntimeError("Provider did not stop the instance")
                deployment.status = DeploymentStatus.STOPPED
                session.add(deployment)
                results["success"].append(deployment_id)
            
            elif batch_op.operation == "delete":
                if deployment.instance_id:
                    adapter = ProviderManager.get_deployment_adapter(deployment, session)
                    if not await adapter.delete_instance(deployment.instance_id):
                        raise RuntimeError("Provider did not delete the instance")
                session.delete(deployment)
                results["success"].append(deployment_id)
        
        except Exception as e:
            results["failed"].append({
                "id": deployment_id,
                "reason": str(e)
            })
    
    session.commit()
    
    return {
        "operation": batch_op.operation,
        "total": len(batch_op.deployment_ids),
        "succeeded": len(results["success"]),
        "failed": len(results["failed"]),
        "results": results
    }


@router.delete("/deployments/{deployment_id}")
async def delete_deployment(
    deployment_id: int,
    session: Session = Depends(get_session)
):
    """
    Delete a specific deployment.
    """
    deployment = session.get(Deployment, deployment_id)
    if not deployment:
        raise HTTPException(status_code=404, detail="Deployment not found")
    
    if deployment.instance_id:
        try:
            adapter = ProviderManager.get_deployment_adapter(deployment, session)
            if not await adapter.delete_instance(deployment.instance_id):
                raise HTTPException(status_code=502, detail="Provider did not delete the instance")
        except HTTPException:
            raise
        except Exception as exc:
            raise HTTPException(status_code=502, detail="Provider deletion failed") from exc
    session.delete(deployment)
    session.commit()
    
    return {"ok": True, "message": "Deployment deleted"}


@router.post("/deployments/{deployment_id}/stop")
async def stop_deployment(
    deployment_id: int,
    session: Session = Depends(get_session)
):
    """
    Stop a specific deployment.
    """
    deployment = session.get(Deployment, deployment_id)
    if not deployment:
        raise HTTPException(status_code=404, detail="Deployment not found")
    
    if not deployment.instance_id:
        raise HTTPException(status_code=400, detail="Deployment has no provider instance")
    try:
        adapter = ProviderManager.get_deployment_adapter(deployment, session)
        if not await adapter.stop_instance(deployment.instance_id):
            raise HTTPException(status_code=502, detail="Provider did not stop the instance")
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=502, detail="Provider stop failed") from exc
    deployment.status = DeploymentStatus.STOPPED
    session.add(deployment)
    session.commit()
    
    return {"ok": True, "message": "Deployment stopped"}
