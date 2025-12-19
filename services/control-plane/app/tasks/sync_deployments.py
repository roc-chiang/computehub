"""
Deployment Status Synchronization Task

Polls provider APIs every 30 seconds to update deployment status and endpoint URLs.
"""

import asyncio
from datetime import datetime, timedelta
from sqlmodel import Session, select
from app.core.db import engine
from app.core.models import Deployment, DeploymentStatus
from app.core.provider_manager import ProviderManager
import logging

logger = logging.getLogger(__name__)


async def sync_deployment_status():
    """
    Sync deployment status from provider APIs.
    
    - Queries all deployments with status='creating'
    - Calls provider API to get latest status
    - Updates database with new status and endpoint_url
    """
    try:
        with Session(engine) as session:
            # Query deployments that need syncing
            cutoff_time = datetime.utcnow() - timedelta(hours=24)
            
            deployments = session.exec(
                select(Deployment).where(
                    Deployment.status == DeploymentStatus.CREATING,
                    Deployment.instance_id.isnot(None),
                    Deployment.created_at > cutoff_time
                )
            ).all()
            
            if not deployments:
                return
            
            logger.info(f"🔄 Syncing {len(deployments)} deployment(s)...")
            
            # Process each deployment
            for deployment in deployments:
                try:
                    await sync_single_deployment(session, deployment)
                except Exception as e:
                    logger.error(f"❌ Error syncing deployment {deployment.id}: {str(e)}")
                    continue
            
            # Commit all changes
            session.commit()
            
    except Exception as e:
        logger.error(f"❌ Error in sync_deployment_status: {str(e)}")


async def sync_single_deployment(session: Session, deployment: Deployment):
    """
    Sync a single deployment's status.
    
    Args:
        session: Database session
        deployment: Deployment to sync
    """
    try:
        # Get provider adapter
        adapter = ProviderManager.get_adapter(deployment.provider, session)
        
        # Call get_status with exposed_port
        status_info = await adapter.get_status(
            deployment.instance_id,
            deployment.exposed_port or 8888  # Default port if not set
        )
        
        # Extract status
        new_status = status_info.get("status", "unknown")
        
        # Map provider status to our status
        status_mapping = {
            "running": DeploymentStatus.RUNNING,
            "creating": DeploymentStatus.CREATING,
            "stopped": DeploymentStatus.STOPPED,
            "error": DeploymentStatus.ERROR,
            "deleted": DeploymentStatus.DELETED
        }
        
        mapped_status = status_mapping.get(new_status, DeploymentStatus.ERROR)
        
        # Update deployment
        old_status = deployment.status
        deployment.status = mapped_status
        
        # Update endpoint_url if available
        if status_info.get("endpoint"):
            deployment.endpoint_url = status_info["endpoint"]
        
        # Update SSH info if available
        if status_info.get("ssh_connection_string"):
            deployment.ssh_connection_string = status_info["ssh_connection_string"]
        if status_info.get("ssh_password"):
            deployment.ssh_password = status_info["ssh_password"]
        
        # Update runtime info if available
        if status_info.get("uptime_seconds") is not None:
            deployment.uptime_seconds = status_info["uptime_seconds"]
        if status_info.get("vcpu_count"):
            deployment.vcpu_count = status_info["vcpu_count"]
        if status_info.get("ram_gb"):
            deployment.ram_gb = status_info["ram_gb"]
        if status_info.get("storage_gb"):
            deployment.storage_gb = status_info["storage_gb"]
        if status_info.get("gpu_utilization") is not None:
            deployment.gpu_utilization = status_info["gpu_utilization"]
        if status_info.get("gpu_memory_utilization") is not None:
            deployment.gpu_memory_utilization = status_info["gpu_memory_utilization"]
        
        # Update timestamp
        deployment.updated_at = datetime.utcnow()
        
        # Add to session (will be committed by caller)
        session.add(deployment)
        
        # Log status change
        if old_status != mapped_status:
            logger.info(
                f"✅ Deployment #{deployment.id} ({deployment.name}): "
                f"{old_status} → {mapped_status}"
            )
            if deployment.endpoint_url:
                logger.info(f"   🌐 Endpoint: {deployment.endpoint_url}")
        
    except Exception as e:
        logger.error(f"Error syncing deployment {deployment.id}: {str(e)}")
        # Don't update status on error - will retry next cycle
        raise


async def mark_stale_deployments():
    """
    Mark deployments that have been 'creating' for >24 hours as 'error'.
    """
    try:
        with Session(engine) as session:
            cutoff_time = datetime.utcnow() - timedelta(hours=24)
            
            stale_deployments = session.exec(
                select(Deployment).where(
                    Deployment.status == DeploymentStatus.CREATING,
                    Deployment.created_at < cutoff_time
                )
            ).all()
            
            if stale_deployments:
                logger.warning(f"Marking {len(stale_deployments)} stale deployment(s) as error")
                
                for deployment in stale_deployments:
                    deployment.status = DeploymentStatus.ERROR
                    deployment.updated_at = datetime.utcnow()
                    session.add(deployment)
                
                session.commit()
    
    except Exception as e:
        logger.error(f"Error marking stale deployments: {str(e)}")
