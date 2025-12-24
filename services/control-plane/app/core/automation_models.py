"""
Input: SQLModel 基类, Enum 类型定义
Output: 4 个数据库表模型(AutomationRule, HealthCheckLog, AutomationLog, CostTracking) 和相关 Enum
Pos: Phase 9 自动化引擎的数据模型层,定义自动化系统的所有数据结构

一旦我被更新,务必更新我的开头注释,以及所属的文件夹的 README.md
"""

# Phase 9: Automation Engine Models
# Added: 2025-12-21

from typing import Optional
from datetime import datetime
from sqlmodel import Field, SQLModel
from enum import Enum


class AutomationRuleType(str, Enum):
    """Automation rule types"""
    HEALTH_CHECK = "health_check"
    AUTO_RESTART = "auto_restart"
    COST_LIMIT = "cost_limit"
    PRICE_ALERT = "price_alert"
    FAILOVER = "failover"


class HealthStatus(str, Enum):
    """Health check status"""
    HEALTHY = "healthy"
    UNHEALTHY = "unhealthy"
    TIMEOUT = "timeout"
    ERROR = "error"


class AutomationActionType(str, Enum):
    """Automation action types"""
    RESTART = "restart"
    STOP = "stop"
    MIGRATE = "migrate"
    FAILOVER = "failover"
    ALERT = "alert"


class AutomationResultType(str, Enum):
    """Automation execution result"""
    SUCCESS = "success"
    FAILED = "failed"
    SKIPPED = "skipped"


class AutomationRule(SQLModel, table=True):
    """
    Automation rules configuration.
    Users can configure various automation behaviors for their deployments.
    """
    __tablename__ = "automationrule"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id", index=True)
    deployment_id: Optional[int] = Field(default=None, foreign_key="deployment.id", index=True)
    
    # Rule type and configuration
    rule_type: str = Field(index=True)  # AutomationRuleType
    config_json: str  # JSON string for rule-specific configuration
    
    # Status
    is_enabled: bool = True
    last_triggered_at: Optional[datetime] = None
    trigger_count: int = 0
    
    # Metadata
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class HealthCheckLog(SQLModel, table=True):
    """
    Health check logs for deployments.
    Records the health status of each deployment over time.
    """
    __tablename__ = "healthchecklog"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    deployment_id: int = Field(foreign_key="deployment.id", index=True)
    
    # Check result
    status: str  # HealthStatus
    response_time_ms: Optional[int] = None
    error_message: Optional[str] = None
    
    # Check details
    endpoint_url: str
    check_method: str = "http"  # http, tcp, ssh
    
    # Timestamp
    checked_at: datetime = Field(default_factory=datetime.utcnow, index=True)


class AutomationLog(SQLModel, table=True):
    """
    Automation operation logs.
    Records all automated actions taken by the system.
    """
    __tablename__ = "automationlog"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    deployment_id: int = Field(foreign_key="deployment.id", index=True)
    rule_id: Optional[int] = Field(default=None, foreign_key="automationrule.id")
    
    # Action type
    action: str = Field(index=True)  # AutomationActionType
    
    # Trigger information
    trigger_reason: str
    trigger_data_json: Optional[str] = None
    
    # Execution result
    result: str  # AutomationResultType
    error_message: Optional[str] = None
    execution_time_ms: Optional[int] = None
    
    # Timestamp
    created_at: datetime = Field(default_factory=datetime.utcnow, index=True)


class CostTracking(SQLModel, table=True):
    """
    Cost tracking for deployments.
    Records GPU usage and costs for billing and monitoring.
    """
    __tablename__ = "costtracking"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    deployment_id: int = Field(foreign_key="deployment.id", index=True)
    user_id: int = Field(foreign_key="user.id", index=True)
    
    # Cost information
    cost_usd: float
    gpu_hours: float
    
    # Time period
    period_start: datetime = Field(index=True)
    period_end: datetime = Field(index=True)
    
    # Provider information
    provider: str
    gpu_type: str
    price_per_hour: float
    
    # Metadata
    created_at: datetime = Field(default_factory=datetime.utcnow)
