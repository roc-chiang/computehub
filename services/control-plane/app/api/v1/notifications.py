"""
Notifications API
Handles notification settings, history, and Telegram binding
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from pydantic import BaseModel, EmailStr
from datetime import datetime
import secrets

from app.core.db import get_session
from app.core.models import (
    NotificationSettings,
    NotificationHistory,
    NotificationEventType,
    NotificationChannel,
    NotificationStatus
)
from app.services.notification_service import get_notification_service
from app.api.v1.deployments import get_current_user, User

router = APIRouter()

# ============================================================================
# Request/Response Models
# ============================================================================

class NotificationSettingsResponse(BaseModel):
    """Notification settings response"""
    telegram_chat_id: Optional[str] = None
    telegram_username: Optional[str] = None
    email: Optional[str] = None
    webhook_url: Optional[str] = None
    webhook_secret: Optional[str] = None
    enable_telegram: bool = True
    enable_email: bool = True
    enable_webhook: bool = False
    enable_deployment_success: bool = True
    enable_deployment_failure: bool = True
    enable_instance_down: bool = True
    enable_cost_alert: bool = True
    enable_price_change: bool = False
    cost_alert_threshold: float = 100.00

class NotificationSettingsUpdate(BaseModel):
    """Update notification settings"""
    email: Optional[str] = None
    webhook_url: Optional[str] = None
    webhook_secret: Optional[str] = None
    enable_telegram: Optional[bool] = None
    enable_email: Optional[bool] = None
    enable_webhook: Optional[bool] = None
    enable_deployment_success: Optional[bool] = None
    enable_deployment_failure: Optional[bool] = None
    enable_instance_down: Optional[bool] = None
    enable_cost_alert: Optional[bool] = None
    enable_price_change: Optional[bool] = None
    cost_alert_threshold: Optional[float] = None

class TelegramBindResponse(BaseModel):
    """Telegram binding response"""
    bind_token: str
    bot_username: str
    bind_url: str
    expires_at: datetime

class TelegramStatusResponse(BaseModel):
    """Telegram binding status"""
    is_bound: bool
    chat_id: Optional[str] = None
    username: Optional[str] = None
    bound_at: Optional[datetime] = None

class NotificationHistoryItem(BaseModel):
    """Notification history item"""
    id: int
    event_type: str
    channel: str
    title: Optional[str]
    message: Optional[str]
    status: str
    error_message: Optional[str] = None
    created_at: datetime

class NotificationHistoryResponse(BaseModel):
    """Notification history response"""
    total: int
    items: List[NotificationHistoryItem]

class TestNotificationRequest(BaseModel):
    """Test notification request"""
    channel: str  # telegram or email

class TestNotificationResponse(BaseModel):
    """Test notification response"""
    message: str
    results: dict

# ============================================================================
# Notification Settings Endpoints
# ============================================================================

@router.get("/notifications/settings", response_model=NotificationSettingsResponse)
async def get_notification_settings(
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """Get user's notification settings"""
    
    # Save user_id to avoid accessing detached object after rollback
    user_id = current_user.clerk_id
    
    statement = select(NotificationSettings).where(
        NotificationSettings.user_id == user_id
    )
    settings = session.exec(statement).first()
    
    # Create default settings if not exist
    if not settings:
        from sqlalchemy.exc import IntegrityError
        try:
            settings = NotificationSettings(user_id=user_id)
            session.add(settings)
            session.commit()
            session.refresh(settings)
        except IntegrityError:
            # Handle race condition - another request may have created it
            session.rollback()
            
            # Use raw SQL to bypass session cache
            from sqlalchemy import text
            result = session.execute(
                text("SELECT * FROM notification_settings WHERE user_id = :user_id"),
                {"user_id": user_id}
            ).first()
            
            if result:
                # Manually create the object from raw result
                settings = NotificationSettings(
                    id=result[0],
                    user_id=result[1],
                    telegram_chat_id=result[2],
                    telegram_username=result[3],
                    email=result[4],
                    enable_telegram=bool(result[5]),
                    enable_email=bool(result[6]),
                    enable_deployment_success=bool(result[7]),
                    enable_deployment_failure=bool(result[8]),
                    enable_instance_down=bool(result[9]),
                    enable_cost_alert=bool(result[10]),
                    enable_price_change=bool(result[11]),
                    cost_alert_threshold=float(result[12]),
                    created_at=result[13],
                    updated_at=result[14]
                )
            else:
                raise HTTPException(
                    status_code=500, 
                    detail="Failed to create notification settings"
                )
    
    if not settings:
        raise HTTPException(status_code=500, detail="Settings not found")
    
    return NotificationSettingsResponse(
        telegram_chat_id=settings.telegram_chat_id,
        telegram_username=settings.telegram_username,
        email=settings.email,
        enable_telegram=settings.enable_telegram,
        enable_email=settings.enable_email,
        enable_deployment_success=settings.enable_deployment_success,
        enable_deployment_failure=settings.enable_deployment_failure,
        enable_instance_down=settings.enable_instance_down,
        enable_cost_alert=settings.enable_cost_alert,
        enable_price_change=settings.enable_price_change,
        cost_alert_threshold=settings.cost_alert_threshold
    )

@router.put("/notifications/settings", response_model=NotificationSettingsResponse)
async def update_notification_settings(
    update: NotificationSettingsUpdate,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """Update user's notification settings"""
    
    statement = select(NotificationSettings).where(
        NotificationSettings.user_id == current_user.clerk_id
    )
    settings = session.exec(statement).first()
    
    # Create if not exist
    if not settings:
        settings = NotificationSettings(user_id=current_user.clerk_id)
        session.add(settings)
    
    # Update fields
    if update.email is not None:
        settings.email = update.email
    if update.enable_telegram is not None:
        settings.enable_telegram = update.enable_telegram
    if update.enable_email is not None:
        settings.enable_email = update.enable_email
    if update.enable_deployment_success is not None:
        settings.enable_deployment_success = update.enable_deployment_success
    if update.enable_deployment_failure is not None:
        settings.enable_deployment_failure = update.enable_deployment_failure
    if update.enable_instance_down is not None:
        settings.enable_instance_down = update.enable_instance_down
    if update.enable_cost_alert is not None:
        settings.enable_cost_alert = update.enable_cost_alert
    if update.enable_price_change is not None:
        settings.enable_price_change = update.enable_price_change
    if update.cost_alert_threshold is not None:
        settings.cost_alert_threshold = update.cost_alert_threshold
    
    settings.updated_at = datetime.utcnow()
    
    session.commit()
    session.refresh(settings)
    
    return NotificationSettingsResponse(
        telegram_chat_id=settings.telegram_chat_id,
        telegram_username=settings.telegram_username,
        email=settings.email,
        enable_telegram=settings.enable_telegram,
        enable_email=settings.enable_email,
        enable_deployment_success=settings.enable_deployment_success,
        enable_deployment_failure=settings.enable_deployment_failure,
        enable_instance_down=settings.enable_instance_down,
        enable_cost_alert=settings.enable_cost_alert,
        enable_price_change=settings.enable_price_change,
        cost_alert_threshold=settings.cost_alert_threshold
    )

# ============================================================================
# Telegram Binding Endpoints
# ============================================================================

# In-memory storage for bind tokens (in production, use Redis)
bind_tokens = {}

@router.post("/notifications/telegram/bind", response_model=TelegramBindResponse)
async def create_telegram_bind_token(
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """Generate Telegram binding token"""
    
    from app.services.telegram_service import get_telegram_service
    telegram = get_telegram_service(session)
    
    if not telegram.is_configured():
        raise HTTPException(
            status_code=503,
            detail="Telegram bot is not configured. Please contact administrator."
        )
    
    # Generate token
    token = secrets.token_urlsafe(16)
    from datetime import timedelta
    expires_at = datetime.utcnow() + timedelta(hours=24)
    
    # Store token
    bind_tokens[token] = {
        "user_id": current_user.clerk_id,
        "expires_at": expires_at
    }
    
    # Create bind URL
    bind_url = f"https://t.me/{telegram.bot_username}?start={token}"
    
    return TelegramBindResponse(
        bind_token=token,
        bot_username=telegram.bot_username,
        bind_url=bind_url,
        expires_at=expires_at
    )

@router.get("/notifications/telegram/status", response_model=TelegramStatusResponse)
async def get_telegram_status(
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """Get Telegram binding status"""
    
    statement = select(NotificationSettings).where(
        NotificationSettings.user_id == current_user.clerk_id
    )
    settings = session.exec(statement).first()
    
    if not settings or not settings.telegram_chat_id:
        return TelegramStatusResponse(is_bound=False)
    
    return TelegramStatusResponse(
        is_bound=True,
        chat_id=settings.telegram_chat_id,
        username=settings.telegram_username,
        bound_at=settings.created_at
    )

@router.post("/notifications/telegram/unbind")
async def unbind_telegram(
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """Unbind Telegram"""
    
    statement = select(NotificationSettings).where(
        NotificationSettings.user_id == current_user.clerk_id
    )
    settings = session.exec(statement).first()
    
    if settings:
        settings.telegram_chat_id = None
        settings.telegram_username = None
        settings.updated_at = datetime.utcnow()
        session.commit()
    
    return {"message": "Telegram unbound successfully"}

# ============================================================================
# Notification History Endpoints
# ============================================================================

@router.get("/notifications/history", response_model=NotificationHistoryResponse)
async def get_notification_history(
    limit: int = 50,
    offset: int = 0,
    channel: Optional[str] = None,
    status: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """Get notification history"""
    
    # Build query
    statement = select(NotificationHistory).where(
        NotificationHistory.user_id == current_user.clerk_id
    )
    
    if channel:
        statement = statement.where(NotificationHistory.channel == channel)
    if status:
        statement = statement.where(NotificationHistory.status == status)
    
    # Get total count
    count_statement = select(NotificationHistory).where(
        NotificationHistory.user_id == current_user.clerk_id
    )
    if channel:
        count_statement = count_statement.where(NotificationHistory.channel == channel)
    if status:
        count_statement = count_statement.where(NotificationHistory.status == status)
    
    total = len(session.exec(count_statement).all())
    
    # Get items
    statement = statement.order_by(NotificationHistory.created_at.desc())
    statement = statement.offset(offset).limit(limit)
    
    items = session.exec(statement).all()
    
    return NotificationHistoryResponse(
        total=total,
        items=[
            NotificationHistoryItem(
                id=item.id,
                event_type=item.event_type.value,
                channel=item.channel.value,
                title=item.title,
                message=item.message,
                status=item.status.value,
                error_message=item.error_message,
                created_at=item.created_at
            )
            for item in items
        ]
    )

# ============================================================================
# Test Notification Endpoint
# ============================================================================

@router.post("/notifications/test", response_model=TestNotificationResponse)
async def test_notification(
    request: TestNotificationRequest,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """Send a test notification"""
    
    notification_service = get_notification_service(session)
    
    title = "Test Notification"
    message = "This is a test notification from ComputeHub. If you received this, your notifications are working correctly!"
    
    results = await notification_service.send_notification(
        user_id=current_user.clerk_id,
        event_type=NotificationEventType.DEPLOYMENT_SUCCESS,
        title=title,
        message=message
    )
    
    if not results:
        raise HTTPException(
            status_code=400,
            detail="No notification channels are configured or enabled"
        )
    
    return TestNotificationResponse(
        message="Test notification sent successfully",
        results=results
    )


# ============================================================================
# Webhook Test Endpoint (Phase 10)
# ============================================================================

class WebhookTestRequest(BaseModel):
    """Webhook test request"""
    url: str
    secret: Optional[str] = None

class WebhookTestResponse(BaseModel):
    """Webhook test response"""
    success: bool
    message: str
    url: str
    timestamp: str

@router.post("/notifications/webhook/test", response_model=WebhookTestResponse)
async def test_webhook(
    request: WebhookTestRequest,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """Test webhook endpoint"""
    
    from app.services.webhook_service import get_webhook_service
    webhook_service = get_webhook_service(session)
    
    result = await webhook_service.test_webhook(
        url=request.url,
        secret=request.secret
    )
    
    return WebhookTestResponse(**result)
