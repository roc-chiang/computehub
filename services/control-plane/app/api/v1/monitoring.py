"""
INPUT: Deployment ID, user authentication
OUTPUT: Real-time monitoring metrics via REST API and WebSocket
POS: API endpoints for Phase 12 monitoring system

监控 API - 提供实时和历史监控数据的 REST 端点
"""

from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect
from sqlmodel import Session, select
from typing import List, Dict, Set
from datetime import datetime, timedelta
import asyncio
import json

from app.core.db import get_session
from app.core.models import User, Deployment
from app.core.auth import _get_or_create_user, verify_token
from app.core.monitoring_models import MetricsSnapshot, MonitoringAlert
from app.api.v1.deployments import get_current_user, get_deployment_ssh_password
from app.services.gpu_monitor import gpu_monitor


router = APIRouter()


# ============================================================================
# WebSocket Connection Manager
# ============================================================================

class ConnectionManager:
    """管理 WebSocket 连接"""
    
    def __init__(self):
        # deployment_id -> Set[WebSocket]
        self.active_connections: Dict[int, Set[WebSocket]] = {}
        self.monitoring_tasks: Dict[int, asyncio.Task] = {}
    
    async def connect(self, websocket: WebSocket, deployment_id: int):
        """接受新的 WebSocket 连接"""
        await websocket.accept()
        
        if deployment_id not in self.active_connections:
            self.active_connections[deployment_id] = set()
        
        self.active_connections[deployment_id].add(websocket)
        print(f"✅ WebSocket connected for deployment {deployment_id}")
    
    def disconnect(self, websocket: WebSocket, deployment_id: int):
        """断开 WebSocket 连接"""
        if deployment_id in self.active_connections:
            self.active_connections[deployment_id].discard(websocket)
            
            # 如果没有连接了,清理
            if not self.active_connections[deployment_id]:
                del self.active_connections[deployment_id]
                print(f"🔌 All connections closed for deployment {deployment_id}")
    
    async def broadcast(self, deployment_id: int, message: dict):
        """广播消息到所有连接的客户端"""
        if deployment_id not in self.active_connections:
            return
        
        # 移除已断开的连接
        disconnected = set()
        
        for connection in self.active_connections[deployment_id]:
            try:
                await connection.send_json(message)
            except Exception as e:
                print(f"⚠️ Failed to send to client: {e}")
                disconnected.add(connection)
        
        # 清理断开的连接
        for conn in disconnected:
            self.disconnect(conn, deployment_id)


manager = ConnectionManager()


# ============================================================================
# REST API Endpoints
# ============================================================================

@router.get("/deployments/{deployment_id}/metrics/current")
async def get_current_metrics(
    deployment_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """
    获取部署的当前监控指标
    返回最新的一条指标快照
    """
    # 验证部署所有权
    deployment = session.get(Deployment, deployment_id)
    if not deployment:
        raise HTTPException(status_code=404, detail="Deployment not found")
    
    if deployment.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    # 获取最新指标
    latest_metric = session.exec(
        select(MetricsSnapshot)
        .where(MetricsSnapshot.deployment_id == deployment_id)
        .order_by(MetricsSnapshot.timestamp.desc())
        .limit(1)
    ).first()
    
    if not latest_metric:
        return {
            "deployment_id": deployment_id,
            "message": "No metrics available yet",
            "timestamp": datetime.utcnow().isoformat()
        }
    
    return latest_metric


@router.get("/deployments/{deployment_id}/metrics/history")
async def get_metrics_history(
    deployment_id: int,
    hours: int = 1,  # 默认查询最近1小时
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """
    获取部署的历史监控数据
    
    Args:
        deployment_id: 部署 ID
        hours: 查询最近 N 小时的数据 (默认 1)
    """
    # 验证部署所有权
    deployment = session.get(Deployment, deployment_id)
    if not deployment:
        raise HTTPException(status_code=404, detail="Deployment not found")
    
    if deployment.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    # 计算时间范围
    end_time = datetime.utcnow()
    start_time = end_time - timedelta(hours=hours)
    
    # 查询历史数据
    metrics = session.exec(
        select(MetricsSnapshot)
        .where(MetricsSnapshot.deployment_id == deployment_id)
        .where(MetricsSnapshot.timestamp >= start_time)
        .where(MetricsSnapshot.timestamp <= end_time)
        .order_by(MetricsSnapshot.timestamp)
    ).all()
    
    return {
        "deployment_id": deployment_id,
        "start_time": start_time.isoformat(),
        "end_time": end_time.isoformat(),
        "count": len(metrics),
        "metrics": metrics
    }


@router.get("/deployments/{deployment_id}/alerts")
async def get_alerts(
    deployment_id: int,
    active_only: bool = True,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """
    获取部署的监控告警
    
    Args:
        deployment_id: 部署 ID
        active_only: 只返回活跃的告警 (默认 True)
    """
    # 验证部署所有权
    deployment = session.get(Deployment, deployment_id)
    if not deployment:
        raise HTTPException(status_code=404, detail="Deployment not found")
    
    if deployment.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    # 查询告警
    query = select(MonitoringAlert).where(
        MonitoringAlert.deployment_id == deployment_id
    )
    
    if active_only:
        query = query.where(MonitoringAlert.is_active == True)
    
    alerts = session.exec(
        query.order_by(MonitoringAlert.triggered_at.desc())
    ).all()
    
    return {
        "deployment_id": deployment_id,
        "count": len(alerts),
        "alerts": alerts
    }


# ============================================================================
# WebSocket Endpoint
# ============================================================================

@router.websocket("/deployments/{deployment_id}/metrics/stream")
async def metrics_stream(
    websocket: WebSocket,
    deployment_id: int,
    session: Session = Depends(get_session)
):
    """
    WebSocket 端点 - 实时推送监控指标
    每 2 秒推送一次最新数据
    """
    await manager.connect(websocket, deployment_id)
    
    try:
        token = websocket.query_params.get("token")
        if not token:
            await websocket.send_json({"type": "error", "message": "Authentication required"})
            await websocket.close()
            return

        try:
            current_user = _get_or_create_user(verify_token(token, session), session)
        except HTTPException:
            await websocket.send_json({"type": "error", "message": "Authentication failed"})
            await websocket.close()
            return

        # 获取部署信息
        deployment = session.get(Deployment, deployment_id)
        if not deployment or deployment.user_id != current_user.id:
            await websocket.send_json({"error": "Deployment not found"})
            await websocket.close()
            return
        
        # 实时监控循环
        while True:
            try:
                # 收集监控指标
                if deployment.ssh_host and deployment.ssh_port:
                    metrics = await gpu_monitor.collect_metrics(
                        host=deployment.ssh_host,
                        port=deployment.ssh_port,
                        username=deployment.ssh_username or "root",
                        password=get_deployment_ssh_password(deployment)
                    )
                    
                    # 保存到数据库
                    if "error" not in metrics:
                        snapshot = MetricsSnapshot(
                            deployment_id=deployment_id,
                            **{k: v for k, v in metrics.items() if k != "timestamp"}
                        )
                        session.add(snapshot)
                        session.commit()
                        session.refresh(snapshot)
                        
                        # 推送给客户端
                        await websocket.send_json({
                            "type": "metrics",
                            "data": {
                                "id": snapshot.id,
                                "deployment_id": deployment_id,
                                "timestamp": snapshot.timestamp.isoformat(),
                                **metrics
                            }
                        })
                    else:
                        # 发送错误信息
                        await websocket.send_json({
                            "type": "error",
                            "message": metrics.get("error", "Unknown error")
                        })
                
                # 等待 2 秒
                await asyncio.sleep(2)
                
            except Exception as e:
                print(f"❌ Error in monitoring loop: {e}")
                await websocket.send_json({
                    "type": "error",
                    "message": str(e)
                })
                await asyncio.sleep(5)  # 错误时等待更长时间
    
    except WebSocketDisconnect:
        print(f"🔌 WebSocket disconnected for deployment {deployment_id}")
    finally:
        manager.disconnect(websocket, deployment_id)
