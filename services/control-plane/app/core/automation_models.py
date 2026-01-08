"""
Input: SQLModel 基类, Enum 类型定义
Output: 11 个数据库表模型 和相关 Enum
  Week 1 基础: AutomationRule, HealthCheckLog, AutomationLog, CostTracking
  Week 2 高级: PriceHistory, MigrationTask, FailoverConfig, BatchTask
  Week 3 规则: CostLimit, AutomationRuleV2, RuleExecutionLog
Pos: Phase 9 自动化引擎的数据模型层,定义自动化系统的所有数据结构

一旦我被更新,务必更新我的开头注释,以及所属的文件夹的 README.md
"""

# Phase 9: Automation Engine Models
# Added: 2025-12-21
# Updated: 2026-01-07 - Added Week 2 (advanced automation) + Week 3 (cost limit & rules)

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


class MigrationStatus(str, Enum):
    """Migration task status"""
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    FAILED = "failed"
    ROLLED_BACK = "rolled_back"


class TaskStatus(str, Enum):
    """Batch task status"""
    QUEUED = "queued"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


class TaskType(str, Enum):
    """Batch task types"""
    BATCH_DEPLOY = "batch_deploy"
    BATCH_STOP = "batch_stop"
    BATCH_DELETE = "batch_delete"
    SCHEDULED_MIGRATION = "scheduled_migration"


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


# ===== Advanced Automation Models (Phase 9 Week 2) =====


class PriceHistory(SQLModel, table=True):
    """
    Price history tracking for deployments.
    Records GPU price changes over time for trend analysis and alerts.
    """
    __tablename__ = "pricehistory"
    __table_args__ = {'extend_existing': True}
    
    id: Optional[int] = Field(default=None, primary_key=True)
    deployment_id: int = Field(foreign_key="deployment.id", index=True)
    
    # Price information
    provider: str = Field(index=True)
    gpu_type: str
    price_per_hour: float
    
    # Metadata
    metadata_json: Optional[str] = None  # Additional provider-specific data
    recorded_at: datetime = Field(default_factory=datetime.utcnow, index=True)


class MigrationTask(SQLModel, table=True):
    """
    Migration task tracking.
    Records deployment migration from one provider to another.
    """
    __tablename__ = "migrationtask"
    __table_args__ = {'extend_existing': True}
    
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id", index=True)
    source_deployment_id: int = Field(foreign_key="deployment.id", index=True)
    
    # Target configuration
    target_provider: str
    target_config_json: str  # JSON string with target deployment config
    
    # Migration status
    status: str = Field(index=True)  # MigrationStatus
    migration_steps_json: Optional[str] = None  # Track progress: backup, create, transfer, verify, cleanup
    
    # Target deployment (created during migration)
    target_deployment_id: Optional[int] = Field(default=None, foreign_key="deployment.id")
    
    # Timing
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    
    # Error handling
    error_message: Optional[str] = None
    
    # Metadata
    created_at: datetime = Field(default_factory=datetime.utcnow, index=True)


class FailoverConfig(SQLModel, table=True):
    """
    Failover configuration for deployments.
    Defines backup providers and failover rules.
    """
    __tablename__ = "failoverconfig"
    __table_args__ = {'extend_existing': True}
    
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id", index=True)
    deployment_id: int = Field(foreign_key="deployment.id", index=True, unique=True)
    
    # Provider configuration
    primary_provider: str
    backup_providers_json: str  # JSON array of backup provider names in priority order
    
    # Health check settings
    health_check_interval: int = 300  # seconds (default: 5 minutes)
    failover_threshold: int = 3  # number of failed checks before failover
    
    # Status
    auto_failover_enabled: bool = True
    last_failover_at: Optional[datetime] = None
    failover_count: int = 0
    
    # Metadata
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class BatchTask(SQLModel, table=True):
    """
    Batch task queue.
    Manages scheduled and batch processing tasks.
    """
    __tablename__ = "batchtask"
    __table_args__ = {'extend_existing': True}
    
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id", index=True)
    
    # Task configuration
    task_type: str = Field(index=True)  # TaskType
    task_config_json: str  # JSON string with task-specific configuration
    
    # Status
    status: str = Field(index=True)  # TaskStatus
    priority: int = 5  # 1-10, higher = more important
    
    # Timing
    scheduled_at: datetime = Field(index=True)  # When to execute
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    
    # Result
    result_json: Optional[str] = None  # JSON string with execution result
    error_message: Optional[str] = None
    
    # Metadata
    created_at: datetime = Field(default_factory=datetime.utcnow, index=True)


# ============================================================================
# Phase 9 Week 3: Cost Limit Auto-Shutdown + Rule Engine Models
# Added: 2026-01-07
# ============================================================================

class CostLimitPeriod(str, Enum):
    """Cost limit period types"""
    DAILY = "daily"
    WEEKLY = "weekly"
    MONTHLY = "monthly"
    TOTAL = "total"


class RuleTriggerType(str, Enum):
    """Rule trigger types"""
    COST_THRESHOLD = "cost_threshold"
    PRICE_CHANGE = "price_change"
    HEALTH_CHECK_FAILED = "health_check_failed"
    TIME_BASED = "time_based"
    CUSTOM = "custom"


class RuleActionType(str, Enum):
    """Rule action types"""
    SHUTDOWN = "shutdown"
    RESTART = "restart"
    MIGRATE = "migrate"
    NOTIFY = "notify"
    SCALE = "scale"


class RuleExecutionStatus(str, Enum):
    """Rule execution status"""
    SUCCESS = "success"
    FAILED = "failed"
    SKIPPED = "skipped"


class CostLimit(SQLModel, table=True):
    """
    Cost limit configuration for deployments.
    Automatically shuts down deployment when cost exceeds limit.
    """
    __tablename__ = "costlimit"
    __table_args__ = {'extend_existing': True}
    
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id", index=True)
    deployment_id: int = Field(foreign_key="deployment.id", unique=True, index=True)
    
    # Cost limit settings
    limit_amount: float  # USD
    limit_period: str = Field(default="daily", index=True)  # CostLimitPeriod enum
    current_cost: float = 0.0
    
    # Actions
    auto_shutdown_enabled: bool = True
    notify_at_percentage: int = 80  # Notify when 80% of limit reached
    
    # Status
    limit_reached: bool = False
    last_notified_at: Optional[datetime] = None
    shutdown_at: Optional[datetime] = None
    
    # Timestamps
    created_at: datetime = Field(default_factory=datetime.utcnow, index=True)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class AutomationRuleV2(SQLModel, table=True):
    """
    Advanced automation rule with custom triggers and actions.
    Allows users to create complex automation workflows.
    """
    __tablename__ = "automationrulev2"
    __table_args__ = {'extend_existing': True}
    
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id", index=True)
    
    # Rule metadata
    name: str
    description: Optional[str] = None
    is_enabled: bool = True
    
    # Trigger configuration
    trigger_type: str = Field(index=True)  # RuleTriggerType enum
    trigger_config_json: str  # JSON: conditions, thresholds, etc.
    
    # Action configuration
    action_type: str  # RuleActionType enum
    action_config_json: str  # JSON: action parameters
    
    # Targeting
    target_type: str = "deployment"  # deployment, all_deployments, provider
    target_id: Optional[int] = None  # deployment_id or provider_id
    
    # Execution tracking
    last_triggered_at: Optional[datetime] = None
    trigger_count: int = 0
    
    # Timestamps
    created_at: datetime = Field(default_factory=datetime.utcnow, index=True)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class RuleExecutionLog(SQLModel, table=True):
    """
    Execution log for automation rules.
    Tracks when rules are triggered and what actions were taken.
    """
    __tablename__ = "ruleexecutionlog"
    __table_args__ = {'extend_existing': True}
    
    id: Optional[int] = Field(default=None, primary_key=True)
    rule_id: int = Field(foreign_key="automationrulev2.id", index=True)
    user_id: int = Field(foreign_key="user.id", index=True)
    
    # Execution details
    trigger_reason: str
    action_taken: str
    target_deployment_id: Optional[int] = Field(default=None, foreign_key="deployment.id")
    
    # Result
    status: str  # RuleExecutionStatus enum
    result_message: Optional[str] = None
    error_message: Optional[str] = None
    
    # Timestamp
    executed_at: datetime = Field(default_factory=datetime.utcnow, index=True)
