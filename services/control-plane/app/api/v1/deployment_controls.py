from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session
from app.core.db import get_session
from app.core.models import Deployment, User, DeploymentStatus, ActivityLog, NotificationEventType
from app.api.v1.deployments import get_current_user
from app.core.provider_manager import ProviderManager
from app.services.notification_service import get_notification_service

router = APIRouter()

@router.post("/{deployment_id}/stop")
async def stop_deployment(
    deployment_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """停止部署实例"""
    deployment = session.get(Deployment, deployment_id)
    if not deployment or deployment.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Deployment not found")
    
    if not deployment.instance_id:
        raise HTTPException(status_code=400, detail="No instance to stop")
    
    deployment_name = deployment.name
    
    try:
        adapter = ProviderManager.get_adapter(deployment.provider, session)
        success = await adapter.stop_instance(deployment.instance_id)
        
        if success:
            deployment.status = DeploymentStatus.STOPPED
            session.add(deployment)
            session.commit()
            session.refresh(deployment)
            
            # Send stop notification
            try:
                notification_service = get_notification_service(session)
                await notification_service.send_notification(
                    user_id=current_user.clerk_id,
                    event_type=NotificationEventType.DEPLOYMENT_SUCCESS,
                    title=f"Deployment Stopped: {deployment_name}",
                    message=f"Deployment '{deployment_name}' has been stopped successfully."
                )
            except Exception as notif_error:
                print(f"[WARNING] Failed to send notification: {str(notif_error)}")
            
            return {"message": "Instance stopped successfully"}
        else:
            raise HTTPException(status_code=500, detail="Failed to stop instance")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{deployment_id}/start")
async def start_deployment(
    deployment_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """启动已停止的部署实例"""
    deployment = session.get(Deployment, deployment_id)
    if not deployment or deployment.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Deployment not found")
    
    if not deployment.instance_id:
        raise HTTPException(status_code=400, detail="No instance to start")
    
    deployment_name = deployment.name
    
    try:
        adapter = ProviderManager.get_adapter(deployment.provider, session)
        success = await adapter.start_instance(deployment.instance_id)
        
        if success:
            deployment.status = DeploymentStatus.CREATING
            session.add(deployment)
            
            # Record Activity
            log = ActivityLog(
                deployment_id=deployment.id,
                action="START",
                status="SUCCESS",
                details="User started the instance"
            )
            session.add(log)
            
            session.commit()
            session.refresh(deployment)
            
            # Send start notification
            try:
                notification_service = get_notification_service(session)
                await notification_service.send_notification(
                    user_id=current_user.clerk_id,
                    event_type=NotificationEventType.DEPLOYMENT_SUCCESS,
                    title=f"Deployment Started: {deployment_name}",
                    message=f"Deployment '{deployment_name}' has been started successfully."
                )
            except Exception as notif_error:
                print(f"[WARNING] Failed to send notification: {str(notif_error)}")
            
            return {"message": "Instance starting"}
        else:
            # Record Failure
            log = ActivityLog(
                deployment_id=deployment.id,
                action="START",
                status="FAILED",
                details="Adapter returned failure"
            )
            session.add(log)
            session.commit()
            
            # Send failure notification
            try:
                notification_service = get_notification_service(session)
                await notification_service.send_notification(
                    user_id=current_user.clerk_id,
                    event_type=NotificationEventType.DEPLOYMENT_FAILURE,
                    title=f"Failed to Start: {deployment_name}",
                    message=f"Unable to start deployment '{deployment_name}'. The provider may be experiencing resource constraints. Please try again later."
                )
            except Exception as notif_error:
                print(f"[WARNING] Failed to send notification: {str(notif_error)}")
            
            raise HTTPException(status_code=500, detail="Failed to start instance")
    except Exception as e:
        # Record Error
        log = ActivityLog(
            deployment_id=deployment.id,
            action="START",
            status="FAILED",
            details=str(e)
        )
        session.add(log)
        session.commit()
        
        # Send error notification with cleaned error message
        error_msg = str(e)
        # Extract user-friendly message from API errors
        if "not enough free GPUs" in error_msg:
            user_message = "No available GPUs on the host machine. Please try again later or use a different GPU type."
        elif "RunPod API Error" in error_msg:
            user_message = "Provider API error. Please check your deployment configuration or try again later."
        else:
            user_message = "An error occurred while starting the deployment. Please try again or contact support."
        
        try:
            notification_service = get_notification_service(session)
            await notification_service.send_notification(
                user_id=current_user.clerk_id,
                event_type=NotificationEventType.DEPLOYMENT_FAILURE,
                title=f"Failed to Start: {deployment_name}",
                message=f"Unable to start '{deployment_name}': {user_message}"
            )
        except Exception as notif_error:
            print(f"[WARNING] Failed to send notification: {str(notif_error)}")
        
        # Return user-friendly error to frontend
        raise HTTPException(status_code=500, detail=user_message)


@router.post("/{deployment_id}/restart")
async def restart_deployment(
    deployment_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """重启运行中的部署实例"""
    deployment = session.get(Deployment, deployment_id)
    if not deployment or deployment.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Deployment not found")
    
    if not deployment.instance_id:
        raise HTTPException(status_code=400, detail="No instance to restart")
    
    try:
        adapter = ProviderManager.get_adapter(deployment.provider, session)
        success = await adapter.restart_instance(deployment.instance_id)
        
        if success:
            deployment.status = DeploymentStatus.CREATING
            session.add(deployment)
            
            # Record Activity
            log = ActivityLog(
                deployment_id=deployment.id,
                action="RESTART",
                status="SUCCESS",
                details="User restarted the instance"
            )
            session.add(log)
            
            session.commit()
            session.refresh(deployment)
            return {"message": "Instance restarting"}
        else:
            # Record Failure
            log = ActivityLog(
                deployment_id=deployment.id,
                action="RESTART",
                status="FAILED",
                details="Adapter returned failure"
            )
            session.add(log)
            session.commit()
            raise HTTPException(status_code=500, detail="Failed to restart instance")
    except Exception as e:
        # Record Error
        log = ActivityLog(
            deployment_id=deployment.id,
            action="RESTART",
            status="FAILED",
            details=str(e)
        )
        session.add(log)
        session.commit()
        raise HTTPException(status_code=500, detail=str(e))


# Batch Operations
from pydantic import BaseModel
from typing import List, Dict, Any

class BatchOperationRequest(BaseModel):
    deployment_ids: List[int]

class BatchOperationResponse(BaseModel):
    success: List[int]
    failed: List[Dict[str, Any]]


@router.post("/batch/start", response_model=BatchOperationResponse)
async def batch_start_deployments(
    request: BatchOperationRequest,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """
    Start multiple deployments at once
    """
    success = []
    failed = []
    
    for deployment_id in request.deployment_ids:
        try:
            deployment = session.get(Deployment, deployment_id)
            
            if not deployment or deployment.user_id != current_user.id:
                failed.append({"id": deployment_id, "error": "Deployment not found"})
                continue
            
            if deployment.status == DeploymentStatus.RUNNING:
                failed.append({"id": deployment_id, "error": "Already running"})
                continue
            
            if not deployment.instance_id:
                failed.append({"id": deployment_id, "error": "No instance to start"})
                continue
            
            adapter = ProviderManager.get_adapter(deployment.provider, session)
            result = await adapter.start_instance(deployment.instance_id)
            
            if result:
                deployment.status = DeploymentStatus.RUNNING
                session.add(deployment)
                session.commit()
                success.append(deployment_id)
            else:
                failed.append({"id": deployment_id, "error": "Failed to start"})
                
        except Exception as e:
            failed.append({"id": deployment_id, "error": str(e)})
    
    return BatchOperationResponse(success=success, failed=failed)


@router.post("/batch/stop", response_model=BatchOperationResponse)
async def batch_stop_deployments(
    request: BatchOperationRequest,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """
    Stop multiple deployments at once
    """
    success = []
    failed = []
    
    for deployment_id in request.deployment_ids:
        try:
            deployment = session.get(Deployment, deployment_id)
            
            if not deployment or deployment.user_id != current_user.id:
                failed.append({"id": deployment_id, "error": "Deployment not found"})
                continue
            
            if deployment.status == DeploymentStatus.STOPPED:
                failed.append({"id": deployment_id, "error": "Already stopped"})
                continue
            
            if not deployment.instance_id:
                failed.append({"id": deployment_id, "error": "No instance to stop"})
                continue
            
            adapter = ProviderManager.get_adapter(deployment.provider, session)
            result = await adapter.stop_instance(deployment.instance_id)
            
            if result:
                deployment.status = DeploymentStatus.STOPPED
                session.add(deployment)
                session.commit()
                success.append(deployment_id)
            else:
                failed.append({"id": deployment_id, "error": "Failed to stop"})
                
        except Exception as e:
            failed.append({"id": deployment_id, "error": str(e)})
    
    return BatchOperationResponse(success=success, failed=failed)


@router.post("/batch/delete", response_model=BatchOperationResponse)
async def batch_delete_deployments(
    request: BatchOperationRequest,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """
    Delete multiple deployments at once
    """
    success = []
    failed = []
    
    for deployment_id in request.deployment_ids:
        try:
            deployment = session.get(Deployment, deployment_id)
            
            if not deployment or deployment.user_id != current_user.id:
                failed.append({"id": deployment_id, "error": "Deployment not found"})
                continue
            
            if deployment.status == DeploymentStatus.RUNNING:
                failed.append({"id": deployment_id, "error": "Cannot delete running deployment"})
                continue
            
            # Delete from provider if instance exists
            if deployment.instance_id:
                try:
                    adapter = ProviderManager.get_adapter(deployment.provider, session)
                    await adapter.delete_instance(deployment.instance_id)
                except:
                    pass  # Continue even if provider deletion fails
            
            # Delete from database
            session.delete(deployment)
            session.commit()
            success.append(deployment_id)
                
        except Exception as e:
            failed.append({"id": deployment_id, "error": str(e)})
    
    return BatchOperationResponse(success=success, failed=failed)
