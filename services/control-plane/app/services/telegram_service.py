"""
Telegram Bot Service
Handles Telegram notifications and user binding
"""

import os
import asyncio
from typing import Optional

try:
    from telegram import Bot, Update
    from telegram.ext import Application, CommandHandler, ContextTypes
    TELEGRAM_AVAILABLE = True
except ImportError:
    TELEGRAM_AVAILABLE = False
    Bot = None
    Update = None

from sqlmodel import Session, select
from app.core.models import NotificationSettings
from app.core.encryption import decrypt_value

class TelegramService:
    """Telegram notification service"""
    
    def __init__(self, session: Session):
        self.session = session
        self.bot_token = self._get_bot_token()
        self.bot_username = self._get_bot_username()
        self.bot: Optional[Bot] = None
        
        if TELEGRAM_AVAILABLE and self.bot_token:
            self.bot = Bot(token=self.bot_token)
    
    def _get_setting(self, key: str) -> Optional[str]:
        """Get setting from database"""
        from app.core.models import SystemSetting
        statement = select(SystemSetting).where(SystemSetting.key == key)
        setting = self.session.exec(statement).first()
        
        if setting and setting.value:
            if setting.is_secret and setting.value:
                try:
                    return decrypt_value(setting.value)
                except:
                    pass
            return setting.value
        
        # Fallback to environment variable
        env_key = key.upper()
        return os.getenv(env_key)
    
    def _get_bot_token(self) -> Optional[str]:
        """Get Telegram bot token"""
        return self._get_setting('telegram_bot_token')
    
    def _get_bot_username(self) -> Optional[str]:
        """Get Telegram bot username"""
        return self._get_setting('telegram_bot_username')
    
    def is_configured(self) -> bool:
        """Check if Telegram is properly configured"""
        return bool(self.bot_token and self.bot)
    
    async def send_message(self, chat_id: str, text: str, parse_mode: str = "HTML") -> bool:
        """
        Send a message to a Telegram chat
        
        Args:
            chat_id: Telegram chat ID
            text: Message text
            parse_mode: Parse mode (HTML or Markdown)
        
        Returns:
            True if sent successfully, False otherwise
        """
        if not self.is_configured():
            print("⚠️ Telegram bot not configured")
            return False
        
        try:
            await self.bot.send_message(
                chat_id=chat_id,
                text=text,
                parse_mode=parse_mode
            )
            return True
        except Exception as e:
            print(f"❌ Failed to send Telegram message: {e}")
            return False
    
    async def send_notification(
        self,
        user_id: str,
        title: str,
        message: str,
        event_type: str = None
    ) -> bool:
        """
        Send notification to user via Telegram
        
        Args:
            user_id: User ID (Clerk ID)
            title: Notification title
            message: Notification message
            event_type: Type of event (for emoji)
        
        Returns:
            True if sent successfully, False otherwise
        """
        # Get user's Telegram settings
        statement = select(NotificationSettings).where(
            NotificationSettings.user_id == user_id
        )
        settings = self.session.exec(statement).first()
        
        if not settings or not settings.telegram_chat_id:
            print(f"⚠️ User {user_id} has no Telegram chat ID")
            return False
        
        if not settings.enable_telegram:
            print(f"⚠️ User {user_id} has Telegram notifications disabled")
            return False
        
        # Format message
        emoji = self._get_emoji(event_type)
        formatted_text = f"{emoji} <b>{title}</b>\n\n{message}"
        
        # Send message
        return await self.send_message(settings.telegram_chat_id, formatted_text)
    
    def _get_emoji(self, event_type: Optional[str]) -> str:
        """Get emoji for event type"""
        emoji_map = {
            "deployment_success": "✅",
            "deployment_failure": "❌",
            "instance_down": "⚠️",
            "instance_recovered": "✅",
            "cost_alert": "💰",
            "price_change": "📊",
            "subscription_expiring": "⏰",
            "subscription_renewed": "🎉",
        }
        return emoji_map.get(event_type, "📢")
    
    async def verify_chat_id(self, chat_id: str) -> bool:
        """
        Verify if a chat ID is valid
        
        Args:
            chat_id: Telegram chat ID
        
        Returns:
            True if valid, False otherwise
        """
        if not self.is_configured():
            return False
        
        try:
            chat = await self.bot.get_chat(chat_id)
            return True
        except Exception as e:
            print(f"❌ Invalid chat ID {chat_id}: {e}")
            return False


def get_telegram_service(session: Session) -> TelegramService:
    """Get Telegram service instance"""
    return TelegramService(session)
