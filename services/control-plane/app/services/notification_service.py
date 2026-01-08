"""
Notification Service
Unified service for sending notifications via multiple channels
"""

import asyncio
from typing import Optional, Dict, Any
from sqlmodel import Session, select
from datetime import datetime
from app.core.models import (
    NotificationSettings,
    NotificationHistory,
    NotificationEventType,
    NotificationChannel,
    NotificationStatus
)
from app.services.telegram_service import get_telegram_service
from app.services.email_service import get_email_service
from app.services.webhook_service import get_webhook_service
import json

class NotificationService:
    """Unified notification service"""
    
    def __init__(self, session: Session):
        self.session = session
        self.telegram = get_telegram_service(session)
        self.email = get_email_service(session)
        self.webhook = get_webhook_service(session)
    
    async def send_notification(
        self,
        user_id: str,
        event_type: NotificationEventType,
        title: str,
        message: str,
        metadata: Optional[Dict[str, Any]] = None
    ) -> Dict[str, bool]:
        """
        Send notification to user via all enabled channels
        
        Args:
            user_id: User ID (Clerk ID)
            event_type: Type of notification event
            title: Notification title
            message: Notification message
            metadata: Additional metadata
        
        Returns:
            Dict with channel names and success status
        """
        # Get user settings
        statement = select(NotificationSettings).where(
            NotificationSettings.user_id == user_id
        )
        settings = self.session.exec(statement).first()
        
        # Create default settings if not exist
        if not settings:
            settings = NotificationSettings(user_id=user_id)
            self.session.add(settings)
            self.session.commit()
            self.session.refresh(settings)
        
        # Check if event is enabled
        if not self._is_event_enabled(settings, event_type):
            print(f"⚠️ Event {event_type} is disabled for user {user_id}")
            return {}
        
        results = {}
        
        # Send via Telegram
        if settings.enable_telegram and settings.telegram_chat_id:
            try:
                success = await self.telegram.send_notification(
                    user_id, title, message, event_type.value
                )
                results['telegram'] = success
                self._log_notification(
                    user_id, event_type, NotificationChannel.TELEGRAM,
                    title, message, metadata,
                    NotificationStatus.SENT if success else NotificationStatus.FAILED
                )
            except Exception as e:
                print(f"❌ Telegram error: {e}")
                results['telegram'] = False
                self._log_notification(
                    user_id, event_type, NotificationChannel.TELEGRAM,
                    title, message, metadata,
                    NotificationStatus.FAILED, str(e)
                )
        
        # Send via Email
        if settings.enable_email and settings.email:
            try:
                success = await self.email.send_notification(
                    user_id, title, message, event_type.value
                )
                results['email'] = success
                self._log_notification(
                    user_id, event_type, NotificationChannel.EMAIL,
                    title, message, metadata,
                    NotificationStatus.SENT if success else NotificationStatus.FAILED
                )
            except Exception as e:
                print(f"❌ Email error: {e}")
                results['email'] = False
                self._log_notification(
                    user_id, event_type, NotificationChannel.EMAIL,
                    title, message, metadata,
                    NotificationStatus.FAILED, str(e)
                )
        
        # Send via Webhook
        if settings.enable_webhook and settings.webhook_url:
            try:
                success = await self.webhook.send_notification(
                    user_id, title, message, event_type.value, metadata
                )
                results['webhook'] = success
                self._log_notification(
                    user_id, event_type, NotificationChannel.WEBHOOK,
                    title, message, metadata,
                    NotificationStatus.SENT if success else NotificationStatus.FAILED
                )
            except Exception as e:
                print(f"❌ Webhook error: {e}")
                results['webhook'] = False
                self._log_notification(
                    user_id, event_type, NotificationChannel.WEBHOOK,
                    title, message, metadata,
                    NotificationStatus.FAILED, str(e)
                )
        
        return results
    
    def _is_event_enabled(self, settings: NotificationSettings, event_type: NotificationEventType) -> bool:
        """Check if event type is enabled"""
        event_map = {
            NotificationEventType.DEPLOYMENT_SUCCESS: settings.enable_deployment_success,
            NotificationEventType.DEPLOYMENT_FAILURE: settings.enable_deployment_failure,
            NotificationEventType.INSTANCE_DOWN: settings.enable_instance_down,
            NotificationEventType.COST_ALERT: settings.enable_cost_alert,
            NotificationEventType.PRICE_CHANGE: settings.enable_price_change,
        }
        return event_map.get(event_type, True)
    
    def _log_notification(
        self,
        user_id: str,
        event_type: NotificationEventType,
        channel: NotificationChannel,
        title: str,
        message: str,
        metadata: Optional[Dict[str, Any]],
        status: NotificationStatus,
        error_message: Optional[str] = None
    ):
        """Log notification to history"""
        history = NotificationHistory(
            user_id=user_id,
            event_type=event_type,
            channel=channel,
            title=title,
            message=message,
            status=status,
            error_message=error_message,
            event_metadata=json.dumps(metadata) if metadata else None
        )
        self.session.add(history)
        self.session.commit()


def get_notification_service(session: Session) -> NotificationService:
    """Get notification service instance"""
    return NotificationService(session)
