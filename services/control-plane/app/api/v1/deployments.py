from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from typing import List

from app.core.db import get_session
from app.core.models import Deployment, User, DeploymentStatus, ActivityLog, NotificationEventType
from app.schemas.deployment import DeploymentCreate, DeploymentRead
from app.core.provider_manager import ProviderManager
from app.services.notification_service import get_notification_service

router = APIRouter()

from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.core.auth import verify_token

security = HTTPBearer()

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    session: Session = Depends(get_session)
) -> User:
    print(f"[DEBUG] get_current_user called")
    try:
        token = credentials.credentials
        print(f"[DEBUG] Token received: {token[:20]}...")
        payload = verify_token(token, session)
        print(f"[DEBUG] Token verified, payload: {payload}")
        
        clerk_id = payload.get("sub")
        if not clerk_id:
            print("[ERROR] Invalid token: missing sub")
            raise HTTPException(status_code=401, detail="Invalid token: missing sub")
            
        # Lazy User Creation / Sync
        user = session.exec(select(User).where(User.clerk_id == clerk_id)).first()
        
        if not user:
            email = payload.get("email")
            if not email:
                email = f"{clerk_id}@clerk.user" 
                
            existing_email_user = session.exec(select(User).where(User.email == email)).first()
            if existing_email_user:
                existing_email_user.clerk_id = clerk_id
                existing_email_user.auth_provider = "clerk"
                session.add(existing_email_user)
                session.commit()
                session.refresh(existing_email_user)
                print(f"[DEBUG] Updated existing user: {existing_email_user.email}")
                return existing_email_user
            
            user = User(
                email=email,
                clerk_id=clerk_id,
                auth_provider="clerk",
                plan="free"
            )
            session.add(user)
            session.commit()
            session.refresh(user)
            print(f"[DEBUG] Created new user: {user.email}")
        
        print(f"[DEBUG] Returning user: {user.email}, id: {user.id}")
        return user
    except Exception as e:
        print(f"[ERROR] get_current_user failed: {str(e)}")
        import traceback
        traceback.print_exc()
        raise

@router.post("/", response_model=DeploymentRead)
async def create_deployment(
    deployment_in: DeploymentCreate,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    concrete_provider = ProviderManager.resolve_provider(deployment_in.provider, session)

    # Check if user has a provider binding for this provider
    from app.core.models import UserProviderBinding, ProviderType
    from app.core.encryption import get_encryption
    
    # Convert to ProviderType enum for database comparison
    if isinstance(concrete_provider, ProviderType):
        provider_enum = concrete_provider
    else:
        provider_enum = ProviderType(concrete_provider.lower())
    
    binding = session.exec(
        select(UserProviderBinding).where(
            UserProviderBinding.user_id == current_user.clerk_id,
            UserProviderBinding.provider_type == provider_enum,
            UserProviderBinding.is_active == True
        )
    ).first()
    
    if not binding:
        raise HTTPException(
            status_code=400,
            detail={
                "error": "provider_not_connected",
                "message": f"Please connect your {concrete_provider} account in Settings to create deployments",
                "provider": concrete_provider,
                "settings_url": "/settings?tab=providers"
            }
        )
    
    # Decrypt user's API key
    encryption = get_encryption()
    user_api_key = encryption.decrypt(binding.api_key_encrypted)

    # Get port configuration from template
    from app.core.template_config import get_template_port
    port_config = get_template_port(deployment_in.template_type or "custom-docker")
    exposed_port = port_config["port"]
    
    # Validate organization and project if provided
    if deployment_in.project_id:
        from app.core.team_models import Project
        project = session.get(Project, deployment_in.project_id)
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")
        
        # If organization_id is provided, verify project belongs to it
        if deployment_in.organization_id and project.organization_id != deployment_in.organization_id:
            raise HTTPException(status_code=400, detail="Project does not belong to the specified organization")
        
        # Auto-set organization_id from project if not provided
        if not deployment_in.organization_id:
            deployment_in.organization_id = project.organization_id
    
    deployment = Deployment(
        user_id=current_user.id,
        name=deployment_in.name,
        provider=concrete_provider,
        gpu_type=deployment_in.gpu_type,
        gpu_count=deployment_in.gpu_count,
        image=deployment_in.image,
        template_type=deployment_in.template_type,
        exposed_port=exposed_port,
        status=DeploymentStatus.CREATING,
        organization_id=deployment_in.organization_id,
        project_id=deployment_in.project_id
    )
    session.add(deployment)
    session.commit()
    session.refresh(deployment)

    try:
        # Pass user's API key to adapter
        adapter = ProviderManager.get_adapter(deployment.provider, session, user_api_key=user_api_key)
        result = await adapter.create_instance(
            deployment_id=str(deployment.id),
            gpu_type=deployment.gpu_type,
            image=deployment.image,
            template_type=deployment_in.template_type  # Pass template_type to adapter
        )
        
        deployment.instance_id = result.get("instance_id")
        deployment.status = result.get("status", DeploymentStatus.CREATING)
        
        # Save endpoint_url if returned (DRY_RUN mode returns it immediately)
        if result.get("endpoint_url"):
            deployment.endpoint_url = result.get("endpoint_url")
        
        session.add(deployment)
        session.commit()
        session.refresh(deployment)
        
        # Send success notification
        try:
            notification_service = get_notification_service(session)
            await notification_service.send_notification(
                user_id=current_user.clerk_id,
                event_type=NotificationEventType.DEPLOYMENT_SUCCESS,
                title=f"Deployment Created: {deployment.name}",
                message=f"Successfully created deployment '{deployment.name}' on {deployment.provider} with {deployment.gpu_type}."
            )
        except Exception as notif_error:
            print(f"[WARNING] Failed to send notification: {str(notif_error)}")
        
    except Exception as e:
        print(f"[ERROR] Failed to create instance: {str(e)}")
        print(f"[ERROR] Exception type: {type(e).__name__}")
        import traceback
        traceback.print_exc()
        deployment.status = DeploymentStatus.ERROR
        session.add(deployment)
        session.commit()
        
        # Send failure notification
        try:
            notification_service = get_notification_service(session)
            await notification_service.send_notification(
                user_id=current_user.clerk_id,
                event_type=NotificationEventType.DEPLOYMENT_FAILURE,
                title="Deployment Creation Failed",
                message=f"Failed to create deployment '{deployment_in.name}': {str(e)}"
            )
        except Exception as notif_error:
            print(f"[WARNING] Failed to send notification: {str(notif_error)}")
        
        raise HTTPException(status_code=500, detail=str(e))

    return deployment

@router.get("/", response_model=List[DeploymentRead])
async def list_deployments(
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    try:
        print(f"[DEBUG] list_deployments called for user: {current_user.email}, id: {current_user.id}, clerk_id: {current_user.clerk_id}")
        
        # Import team models for JOIN
        from app.core.team_models import Organization, Project
        
        # Query deployments with organization and project names using LEFT JOIN
        statement = (
            select(Deployment, Organization.name, Project.name)
            .where(Deployment.user_id == current_user.id)
            .outerjoin(Organization, Deployment.organization_id == Organization.id)
            .outerjoin(Project, Deployment.project_id == Project.id)
        )
        
        results = session.exec(statement).all()
        deployments_data = [
            {
                "deployment": deployment,
                "organization_name": org_name,
                "project_name": proj_name
            }
            for deployment, org_name, proj_name in results
        ]
        
        print(f"[DEBUG] Found {len(deployments_data)} deployments")
    except Exception as e:
        print(f"[ERROR] Failed to list deployments: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to list deployments: {str(e)}")
    
    updated_deployments = []
    for data in deployments_data:
        deployment = data["deployment"]
        org_name = data["organization_name"]
        proj_name = data["project_name"]
        
        if deployment.status in [DeploymentStatus.CREATING, DeploymentStatus.RUNNING] and deployment.instance_id:
            try:
                adapter = ProviderManager.get_adapter(deployment.provider, session)
                print(f"[DEBUG] Syncing status for deployment {deployment.id}, instance {deployment.instance_id}")
                status_info = await adapter.get_status(deployment.instance_id)
                print(f"[DEBUG] Got status: {status_info}")
                
                new_status = status_info.get("status")
                new_endpoint = status_info.get("endpoint")
                new_ssh = status_info.get("ssh_connection_string")
                
                deployment.uptime_seconds = status_info.get("uptime_seconds")
                if status_info.get("vcpu_count"):
                    deployment.vcpu_count = status_info.get("vcpu_count")
                if status_info.get("ram_gb"):
                    deployment.ram_gb = status_info.get("ram_gb")
                if status_info.get("storage_gb"):
                    deployment.storage_gb = status_info.get("storage_gb")
                
                if status_info.get("gpu_utilization") is not None:
                    deployment.gpu_utilization = status_info.get("gpu_utilization")
                if status_info.get("gpu_memory_utilization") is not None:
                    deployment.gpu_memory_utilization = status_info.get("gpu_memory_utilization")
                
                updated = False
                if new_status and new_status != deployment.status:
                    print(f"[DEBUG] Status changed: {deployment.status} -> {new_status}")
                    deployment.status = new_status
                    updated = True
                if new_endpoint and new_endpoint != deployment.endpoint_url:
                    print(f"[DEBUG] Endpoint updated: {new_endpoint}")
                    deployment.endpoint_url = new_endpoint
                    updated = True
                if new_ssh and new_ssh != deployment.ssh_connection_string:
                    deployment.ssh_connection_string = new_ssh
                    updated = True
                
                updated = True
                    
                if updated:
                    session.add(deployment)
                    session.commit()
                    session.refresh(deployment)
            except Exception as e:
                print(f"[ERROR] Failed to sync status: {str(e)}")
                pass
        
        # Convert deployment to dict and add organization/project names
        deployment_dict = {
            "id": deployment.id,
            "user_id": deployment.user_id,
            "name": deployment.name,
            "provider": deployment.provider,
            "status": deployment.status,
            "gpu_type": deployment.gpu_type,
            "gpu_count": deployment.gpu_count,
            "endpoint_url": deployment.endpoint_url,
            "ssh_connection_string": deployment.ssh_connection_string,
            "ssh_password": deployment.ssh_password,
            "instance_id": deployment.instance_id,
            "image": deployment.image,
            "template_type": deployment.template_type,
            "exposed_port": deployment.exposed_port,
            "vcpu_count": deployment.vcpu_count,
            "ram_gb": deployment.ram_gb,
            "storage_gb": deployment.storage_gb,
            "uptime_seconds": deployment.uptime_seconds,
            "gpu_utilization": deployment.gpu_utilization,
            "gpu_memory_utilization": deployment.gpu_memory_utilization,
            "organization_id": deployment.organization_id,
            "project_id": deployment.project_id,
            "organization_name": org_name,
            "project_name": proj_name,
            "created_at": deployment.created_at,
            "updated_at": deployment.updated_at
        }
        updated_deployments.append(deployment_dict)
        
    return updated_deployments

@router.get("/{deployment_id}", response_model=DeploymentRead)
async def get_deployment(
    deployment_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    deployment = session.get(Deployment, deployment_id)
    if not deployment:
        raise HTTPException(status_code=404, detail="Deployment not found")
    
    if deployment.status not in [DeploymentStatus.DELETED, DeploymentStatus.ERROR] and deployment.instance_id:
        try:
            adapter = ProviderManager.get_adapter(deployment.provider, session)
            status_info = await adapter.get_status(deployment.instance_id)
            
            new_status = status_info.get("status")
            new_endpoint = status_info.get("endpoint")
            new_ssh = status_info.get("ssh_connection_string")
            
            deployment.uptime_seconds = status_info.get("uptime_seconds")
            if status_info.get("vcpu_count"):
                deployment.vcpu_count = status_info.get("vcpu_count")
            if status_info.get("ram_gb"):
                deployment.ram_gb = status_info.get("ram_gb")
            if status_info.get("storage_gb"):
                deployment.storage_gb = status_info.get("storage_gb")
            
            if status_info.get("gpu_utilization") is not None:
                deployment.gpu_utilization = status_info.get("gpu_utilization")
            if status_info.get("gpu_memory_utilization") is not None:
                deployment.gpu_memory_utilization = status_info.get("gpu_memory_utilization")
            
            updated = False
            if new_status and new_status != deployment.status:
                deployment.status = new_status
                updated = True
            if new_endpoint and new_endpoint != deployment.endpoint_url:
                deployment.endpoint_url = new_endpoint
                updated = True
            if new_ssh and new_ssh != deployment.ssh_connection_string:
                deployment.ssh_connection_string = new_ssh
                updated = True
            
            updated = True
                
            if updated:
                session.add(deployment)
                session.commit()
                session.refresh(deployment)
        except Exception:
            pass

    return deployment

@router.delete("/{deployment_id}")
async def delete_deployment(
    deployment_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    deployment = session.get(Deployment, deployment_id)
    if not deployment:
        raise HTTPException(status_code=404, detail="Deployment not found")
    
    deployment_name = deployment.name

    if deployment.instance_id:
        try:
            adapter = ProviderManager.get_adapter(deployment.provider, session)
            await adapter.delete_instance(deployment.instance_id)
        except Exception:
            pass

    deployment.status = DeploymentStatus.DELETED
    session.add(deployment)
    session.commit()
    
    # Send deletion notification
    try:
        notification_service = get_notification_service(session)
        await notification_service.send_notification(
            user_id=current_user.clerk_id,
            event_type=NotificationEventType.DEPLOYMENT_SUCCESS,
            title=f"Deployment Deleted: {deployment_name}",
            message=f"Deployment '{deployment_name}' has been successfully deleted."
        )
    except Exception as notif_error:
        print(f"[WARNING] Failed to send notification: {str(notif_error)}")
    
    return {"ok": True}

@router.get("/{deployment_id}/activity")
async def get_deployment_activity(
    deployment_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """获取部署实例的操作日志"""
    deployment = session.get(Deployment, deployment_id)
    if not deployment:
        raise HTTPException(status_code=404, detail="Deployment not found")
    
    statement = select(ActivityLog).where(ActivityLog.deployment_id == deployment_id).order_by(ActivityLog.created_at.desc()).limit(50)
    results = session.exec(statement)
    return results.all()

from app.services.ssh_service import ssh_service

@router.get("/{deployment_id}/logs")
async def get_deployment_logs(
    deployment_id: int,
    lines: int = 100,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    deployment = session.get(Deployment, deployment_id)
    if not deployment:
        raise HTTPException(status_code=404, detail="Deployment not found")
    
    if not deployment.ssh_connection_string:
        return {"logs": "SSH connection string not available. Is the instance running?"}
        
    try:
        parts = deployment.ssh_connection_string.split()
        user_host = parts[1]
        username, host = user_host.split('@')
        port = int(parts[3])
        
        logs = await ssh_service.get_logs(
            host=host,
            port=port,
            username=username,
            password=deployment.ssh_password,
            lines=lines
        )
        
        return {"logs": logs}
    except Exception as e:
        return {"logs": f"Failed to parse connection details or fetch logs: {str(e)}"}

@router.get("/{deployment_id}/usage-stats")
async def get_deployment_usage_stats(
    deployment_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """获取部署实例的使用统计和成本估算"""
    deployment = session.get(Deployment, deployment_id)
    if not deployment:
        raise HTTPException(status_code=404, detail="Deployment not found")
    
    # Calculate GPU hours from uptime
    uptime_seconds = deployment.uptime_seconds or 0
    gpu_hours = uptime_seconds / 3600.0
    total_gpu_hours = gpu_hours * deployment.gpu_count
    
    # Cost estimation (example rates, should be configurable)
    # Different GPU types have different costs
    cost_per_gpu_hour = 0.50  # Default rate
    
    # You could add GPU-specific pricing here
    gpu_pricing = {
        "RTX 4090": 0.69,
        "A100": 1.89,
        "H100": 3.99,
        "RTX 3090": 0.49,
    }
    
    # Try to match GPU type
    for gpu_name, price in gpu_pricing.items():
        if gpu_name.lower() in deployment.gpu_type.lower():
            cost_per_gpu_hour = price
            break
    
    estimated_cost = total_gpu_hours * cost_per_gpu_hour
    cost_per_hour = deployment.gpu_count * cost_per_gpu_hour
    
    return {
        "uptime_seconds": uptime_seconds,
        "uptime_hours": round(gpu_hours, 2),
        "gpu_count": deployment.gpu_count,
        "gpu_type": deployment.gpu_type,
        "total_gpu_hours": round(total_gpu_hours, 2),
        "cost_per_gpu_hour": cost_per_gpu_hour,
        "cost_per_hour": round(cost_per_hour, 2),
        "estimated_cost_usd": round(estimated_cost, 2),
        "status": deployment.status
    }

@router.get("/{deployment_id}/files")
async def get_deployment_files(
    deployment_id: int,
    path: str = "/workspace",
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """获取部署实例的文件列表"""
    deployment = session.get(Deployment, deployment_id)
    if not deployment:
        raise HTTPException(status_code=404, detail="Deployment not found")
    
    if not deployment.ssh_connection_string:
        raise HTTPException(status_code=400, detail="SSH connection not available")
        
    try:
        parts = deployment.ssh_connection_string.split()
        user_host = parts[1]
        username, host = user_host.split('@')
        port = int(parts[3])
        
        files = await ssh_service.list_files(
            host=host,
            port=port,
            username=username,
            path=path,
            password=deployment.ssh_password
        )
        return files
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to list files: {str(e)}")

@router.get("/{deployment_id}/files/content")
async def get_deployment_file_content(
    deployment_id: int,
    path: str,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """获取部署实例的文件内容"""
    deployment = session.get(Deployment, deployment_id)
    if not deployment:
        raise HTTPException(status_code=404, detail="Deployment not found")
    
    if not deployment.ssh_connection_string:
        raise HTTPException(status_code=400, detail="SSH connection not available")
        
    try:
        parts = deployment.ssh_connection_string.split()
        user_host = parts[1]
        username, host = user_host.split('@')
        port = int(parts[3])
        
        content = await ssh_service.read_file(
            host=host,
            port=port,
            username=username,
            path=path,
            password=deployment.ssh_password
        )
        return {"content": content}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to read file: {str(e)}")
