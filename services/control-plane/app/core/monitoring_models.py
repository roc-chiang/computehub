"""
INPUT: None (data models)
OUTPUT: MetricsSnapshot and MonitoringAlert models for monitoring system
POS: Core data models for Phase 12 real-time monitoring
"""

from sqlmodel import SQLModel, Field
from typing import Optional
from datetime import datetime


class MetricsSnapshot(SQLModel, table=True):
    """
    监控指标快照 - 存储部署实例的实时监控数据
    每2-5秒采集一次,用于实时显示和历史查询
    """
    __tablename__ = "metrics_snapshot"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    deployment_id: int = Field(foreign_key="deployment.id", index=True)
    timestamp: datetime = Field(default_factory=datetime.utcnow, index=True)
    
    # GPU 指标 (nvidia-smi)
    gpu_temperature: Optional[float] = None  # 摄氏度 (0-100)
    gpu_utilization: Optional[float] = None  # GPU 利用率百分比 (0-100)
    gpu_memory_used: Optional[int] = None    # 已用显存 MB
    gpu_memory_total: Optional[int] = None   # 总显存 MB
    gpu_power_draw: Optional[float] = None   # 功耗 W
    
    # 系统指标 (psutil / top)
    cpu_percent: Optional[float] = None      # CPU 使用率百分比 (0-100)
    memory_used: Optional[int] = None        # 已用内存 MB
    memory_total: Optional[int] = None       # 总内存 MB
    disk_used: Optional[int] = None          # 已用磁盘 GB
    disk_total: Optional[int] = None         # 总磁盘 GB
    
    # 网络指标
    network_rx_bytes: Optional[int] = None   # 累计接收字节数
    network_tx_bytes: Optional[int] = None   # 累计发送字节数
    
    # 进程信息
    process_count: Optional[int] = None      # 运行进程数
    
    class Config:
        json_schema_extra = {
            "example": {
                "deployment_id": 1,
                "gpu_temperature": 65.0,
                "gpu_utilization": 85.5,
                "gpu_memory_used": 8192,
                "gpu_memory_total": 24576,
                "cpu_percent": 45.2,
                "memory_used": 16384,
                "memory_total": 32768
            }
        }


class MonitoringAlert(SQLModel, table=True):
    """
    监控告警记录 - 当指标超过阈值时触发
    集成通知系统,发送告警通知
    """
    __tablename__ = "monitoring_alert"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    deployment_id: int = Field(foreign_key="deployment.id", index=True)
    user_id: int = Field(foreign_key="user.id", index=True)
    
    # 告警类型
    alert_type: str = Field(index=True)  # gpu_temp, gpu_memory, cpu, memory, disk
    severity: str = Field(default="warning")  # info, warning, critical
    
    # 阈值和当前值
    threshold: float  # 触发阈值
    current_value: float  # 当前值
    
    # 告警信息
    message: str  # 告警消息
    
    # 时间戳
    triggered_at: datetime = Field(default_factory=datetime.utcnow, index=True)
    resolved_at: Optional[datetime] = None
    
    # 通知状态
    notified: bool = Field(default=False)
    notification_sent_at: Optional[datetime] = None
    
    # 告警状态
    is_active: bool = Field(default=True, index=True)
    
    class Config:
        json_schema_extra = {
            "example": {
                "deployment_id": 1,
                "user_id": 1,
                "alert_type": "gpu_temp",
                "severity": "warning",
                "threshold": 80.0,
                "current_value": 85.0,
                "message": "GPU temperature is 85°C, exceeding threshold of 80°C"
            }
        }
