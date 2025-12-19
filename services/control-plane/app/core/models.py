from typing import Optional
from datetime import datetime
from sqlmodel import Field, SQLModel
from enum import Enum

class DeploymentStatus(str, Enum):
    CREATING = "creating"
    RUNNING = "running"
    STOPPED = "stopped"
    ERROR = "error"
    DELETED = "deleted"

class ProviderType(str, Enum):
    AUTO = "auto"
    RUNPOD = "runpod"
    VAST = "vast"
    LOCAL = "local"

class TicketStatus(str, Enum):
    OPEN = "open"
    IN_PROGRESS = "in_progress"
    RESOLVED = "resolved"
    CLOSED = "closed"

class TicketPriority(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    URGENT = "urgent"

class TicketCategory(str, Enum):
    TECHNICAL = "technical"
    BILLING = "billing"
    FEATURE_REQUEST = "feature_request"
    BUG_REPORT = "bug_report"
    OTHER = "other"

class User(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    email: str = Field(index=True, unique=True)
    clerk_id: Optional[str] = Field(default=None, index=True, unique=True)
    auth_provider: str = "email"  # email, google, github
    plan: str = "free"  # free, pro, enterprise
    preferences_json: Optional[str] = None  # JSON string for user preferences
    created_at: datetime = Field(default_factory=datetime.utcnow)

class Deployment(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id")
    name: str
    provider: ProviderType  # Keep for backward compatibility
    provider_id: Optional[int] = Field(default=None, foreign_key="provider.id")  # New foreign key
    status: DeploymentStatus = DeploymentStatus.CREATING
    gpu_type: str
    gpu_count: int = 1
    endpoint_url: Optional[str] = None
    ssh_connection_string: Optional[str] = None
    ssh_password: Optional[str] = None
    instance_id: Optional[str] = None  # ID from the provider
    image: str
    template_type: Optional[str] = None  # Template identifier (e.g., "image-generation")
    exposed_port: Optional[int] = None  # Port exposed by the template
    # Configuration details
    vcpu_count: Optional[int] = None
    ram_gb: Optional[int] = None
    storage_gb: Optional[int] = None
    # Runtime information
    uptime_seconds: Optional[int] = None
    gpu_utilization: Optional[int] = None
    gpu_memory_utilization: Optional[int] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class TaskLog(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    task_type: str
    payload: str  # JSON string
    result: Optional[str] = None
    status: str = "pending"
    created_at: datetime = Field(default_factory=datetime.utcnow)

class Usage(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    deployment_id: int = Field(foreign_key="deployment.id")
    gpu_hours: float
    tokens_used: int = 0
    cost_usd: float
    created_at: datetime = Field(default_factory=datetime.utcnow)

class ActivityLog(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    deployment_id: int = Field(foreign_key="deployment.id")
    action: str  # START, STOP, RESTART, CREATE, DELETE
    status: str  # SUCCESS, FAILED
    details: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

class Provider(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(unique=True)
    type: ProviderType
    api_key: Optional[str] = None
    config_json: Optional[str] = None  # JSON string for extra config (region, etc.)
    is_enabled: bool = True
    weight: int = 100  # Priority weight for AUTO provider selection
    display_name: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class PriceHistory(SQLModel, table=True):
    """Store historical GPU pricing data for trend analysis"""
    id: Optional[int] = Field(default=None, primary_key=True)
    gpu_type: str  # e.g., "A100", "H100", "RTX 4090"
    provider_type: ProviderType
    price_per_hour: Optional[float] = None
    available: bool = True
    recorded_at: datetime = Field(default_factory=datetime.utcnow)

class UserProviderBinding(SQLModel, table=True):
    """User-level provider API key bindings"""
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: str  # Clerk user ID
    provider_type: ProviderType
    api_key_encrypted: str  # Encrypted with Fernet
    display_name: Optional[str] = None  # User's custom name for this binding
    is_active: bool = True
    last_verified: Optional[datetime] = None  # Last successful API call
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class SystemSetting(SQLModel, table=True):
    key: str = Field(primary_key=True)
    value: str
    description: Optional[str] = None
    is_secret: bool = False
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class AuditLog(SQLModel, table=True):
    """
    Audit log for tracking all admin and user actions.
    Used for compliance, security monitoring, and debugging.
    """
    id: Optional[int] = Field(default=None, primary_key=True)
    timestamp: datetime = Field(default_factory=datetime.utcnow, index=True)
    
    # Action details
    action_type: str = Field(index=True)  # CREATE, UPDATE, DELETE, LOGIN, etc.
    resource_type: str = Field(index=True)  # user, deployment, provider, setting, etc.
    resource_id: Optional[str] = None  # ID of the affected resource
    
    # User/Actor information
    user_id: Optional[str] = Field(index=True)  # Clerk ID or user ID
    user_email: Optional[str] = None
    is_admin: bool = False
    
    # Request details
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    
    # Action details
    description: str  # Human-readable description
    details_json: Optional[str] = None  # JSON string with additional details
    
    # Result
    status: str = "success"  # success, failed, error
    error_message: Optional[str] = None

class SupportTicket(SQLModel, table=True):
    __tablename__ = "supportticket"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id", index=True)
    user_email: str  # Cached for quick access
    
    # Ticket details
    subject: str
    category: TicketCategory
    priority: TicketPriority = TicketPriority.MEDIUM
    status: TicketStatus = TicketStatus.OPEN
    
    # Assignment
    assigned_to: Optional[str] = None  # Admin user ID/email
    
    # Timestamps
    created_at: datetime = Field(default_factory=datetime.utcnow, index=True)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    resolved_at: Optional[datetime] = None
    closed_at: Optional[datetime] = None

class TicketReply(SQLModel, table=True):
    __tablename__ = "ticketreply"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    ticket_id: int = Field(foreign_key="supportticket.id", index=True)
    
    # Author info
    author_id: str  # User ID or Admin ID
    author_email: str
    is_admin: bool = False
    
    # Content
    message: str
    
    # Attachments (optional, future enhancement)
    attachments_json: Optional[str] = None
    
    # Timestamp
    created_at: datetime = Field(default_factory=datetime.utcnow)

class DeploymentTemplate(SQLModel, table=True):
    """User-created deployment templates for quick deployment creation"""
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: str  # Clerk user ID
    name: str
    description: Optional[str] = None
    
    # Deployment configuration
    gpu_type: str
    gpu_count: int = 1
    provider: Optional[str] = None  # Can be None for auto-selection
    image: str
    
    # Optional configurations
    vcpu_count: Optional[int] = None
    ram_gb: Optional[int] = None
    storage_gb: Optional[int] = None
    env_vars: Optional[str] = None  # JSON string
    
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


# Subscription System Models

class SubscriptionTier(str, Enum):
    BASIC = "basic"
    PRO = "pro"
    ENTERPRISE = "enterprise"

class SubscriptionStatus(str, Enum):
    ACTIVE = "active"
    CANCELED = "canceled"
    PAST_DUE = "past_due"
    TRIALING = "trialing"
    INCOMPLETE = "incomplete"

class SubscriptionEventType(str, Enum):
    CREATED = "created"
    UPGRADED = "upgraded"
    DOWNGRADED = "downgraded"
    CANCELED = "canceled"
    RENEWED = "renewed"
    TRIAL_STARTED = "trial_started"
    TRIAL_ENDED = "trial_ended"

class UserSubscription(SQLModel, table=True):
    """User subscription information"""
    __tablename__ = "user_subscriptions"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: str = Field(index=True, unique=True)  # Clerk user ID
    tier: SubscriptionTier = Field(default=SubscriptionTier.BASIC)
    
    # Stripe fields
    stripe_customer_id: Optional[str] = None
    stripe_subscription_id: Optional[str] = Field(default=None, index=True)
    stripe_price_id: Optional[str] = None
    
    # Status
    status: SubscriptionStatus = Field(default=SubscriptionStatus.ACTIVE)
    
    # Billing period
    current_period_start: Optional[datetime] = None
    current_period_end: Optional[datetime] = None
    cancel_at_period_end: bool = Field(default=False)
    
    # Trial
    trial_end: Optional[datetime] = None
    
    # Timestamps
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class SubscriptionEvent(SQLModel, table=True):
    """Subscription change events log"""
    __tablename__ = "subscription_events"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: str = Field(index=True)
    event_type: SubscriptionEventType
    from_tier: Optional[SubscriptionTier] = None
    to_tier: Optional[SubscriptionTier] = None
    stripe_event_id: Optional[str] = None
    event_metadata: Optional[str] = None  # JSON string (renamed from metadata to avoid SQLModel conflict)
    created_at: datetime = Field(default_factory=datetime.utcnow)

# ============================================================================
# Notification System Models
# ============================================================================

class NotificationEventType(str, Enum):
    """Types of notification events"""
    DEPLOYMENT_SUCCESS = "deployment_success"
    DEPLOYMENT_FAILURE = "deployment_failure"
    INSTANCE_DOWN = "instance_down"
    INSTANCE_RECOVERED = "instance_recovered"
    COST_ALERT = "cost_alert"
    PRICE_CHANGE = "price_change"
    SUBSCRIPTION_EXPIRING = "subscription_expiring"
    SUBSCRIPTION_RENEWED = "subscription_renewed"

class NotificationChannel(str, Enum):
    """Notification delivery channels"""
    TELEGRAM = "telegram"
    EMAIL = "email"
    WEBHOOK = "webhook"

class NotificationStatus(str, Enum):
    """Notification delivery status"""
    PENDING = "pending"
    SENT = "sent"
    FAILED = "failed"
    RETRYING = "retrying"

class NotificationSettings(SQLModel, table=True):
    """User notification preferences"""
    __tablename__ = "notification_settings"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: str = Field(index=True, unique=True)  # Clerk user ID
    
    # Telegram settings
    telegram_chat_id: Optional[str] = None
    telegram_username: Optional[str] = None
    
    # Email settings
    email: Optional[str] = None
    
    # Channel toggles
    enable_telegram: bool = Field(default=True)
    enable_email: bool = Field(default=True)
    
    # Event toggles
    enable_deployment_success: bool = Field(default=True)
    enable_deployment_failure: bool = Field(default=True)
    enable_instance_down: bool = Field(default=True)
    enable_cost_alert: bool = Field(default=True)
    enable_price_change: bool = Field(default=False)
    
    # Alert thresholds
    cost_alert_threshold: float = Field(default=100.00)
    
    # Timestamps
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class NotificationHistory(SQLModel, table=True):
    """Notification delivery history"""
    __tablename__ = "notification_history"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: str = Field(index=True)
    event_type: NotificationEventType
    channel: NotificationChannel
    
    # Message content
    title: Optional[str] = None
    message: Optional[str] = None
    
    # Delivery status
    status: NotificationStatus = Field(default=NotificationStatus.PENDING)
    error_message: Optional[str] = None
    
    # Metadata (JSON string)
    event_metadata: Optional[str] = None  # Renamed from metadata to avoid SQLModel conflict
    
    # Timestamps
    created_at: datetime = Field(default_factory=datetime.utcnow, index=True)

class GPUAvailabilityCache(SQLModel, table=True):
    """Cache for GPU availability data from providers"""
    __tablename__ = "gpu_availability_cache"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    provider: str = Field(max_length=50, index=True)
    gpu_type: str = Field(max_length=100, index=True)
    available_count: int
    price_per_hour: float
    regions: str  # JSON string array
    checked_at: datetime = Field(default_factory=datetime.utcnow)
    expires_at: datetime
