"""
Deployment logs API endpoints
"""

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlmodel import Session, select
from app.core.db import get_session
from app.core.models import Deployment
from app.core.provider_manager import ProviderManager
from app.api.v1.deployments import get_current_user
from app.core.models import User
import asyncio
import json
from datetime import datetime

router = APIRouter()


@router.get("/deployments/{deployment_id}/logs")
async def get_deployment_logs(
    deployment_id: int,
    lines: int = 100,
    follow: bool = False,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """
    Get deployment logs with optional streaming.
    
    Args:
        deployment_id: Deployment ID
        lines: Number of log lines to return (default: 100)
        follow: If true, stream new logs in real-time (SSE)
    
    Returns:
        StreamingResponse with Server-Sent Events if follow=true
        JSON array of log lines if follow=false
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
    
    if not follow:
        # Return static logs
        logs = await adapter.get_logs(deployment.instance_id, lines)
        return {"logs": logs}
    
    # Stream logs with SSE
    async def log_stream():
        try:
            # Send initial logs
            initial_logs = await adapter.get_logs(deployment.instance_id, lines)
            for log in initial_logs:
                yield f"data: {json.dumps({'line': log, 'timestamp': datetime.utcnow().isoformat()})}\n\n"
            
            # Stream new logs
            last_timestamp = datetime.utcnow()
            while True:
                await asyncio.sleep(1)  # Poll every second
                
                # Get new logs since last check
                new_logs = await adapter.get_logs(
                    deployment.instance_id,
                    lines=50,
                    since=last_timestamp
                )
                
                for log in new_logs:
                    yield f"data: {json.dumps({'line': log, 'timestamp': datetime.utcnow().isoformat()})}\n\n"
                
                last_timestamp = datetime.utcnow()
                
        except asyncio.CancelledError:
            # Client disconnected
            yield f"data: {json.dumps({'event': 'closed'})}\n\n"
    
    return StreamingResponse(
        log_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"  # Disable nginx buffering
        }
    )
