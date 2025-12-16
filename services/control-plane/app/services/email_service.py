"""
Email Service
Handles email notifications via SMTP
"""

import os
import asyncio
from typing import Optional
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import aiosmtplib
from jinja2 import Template
from sqlmodel import Session, select
from app.core.models import NotificationSettings, SystemSetting
from app.core.encryption import decrypt_value

class EmailService:
    """Email notification service"""
    
    def __init__(self, session: Session):
        self.session = session
        self.smtp_host = self._get_setting('smtp_host')
        self.smtp_port = int(self._get_setting('smtp_port') or '587')
        self.smtp_user = self._get_setting('smtp_user')
        self.smtp_password = self._get_setting('smtp_password')
        self.from_email = self._get_setting('smtp_from_email')
        self.from_name = self._get_setting('smtp_from_name')
    
    def _get_setting(self, key: str) -> Optional[str]:
        """Get setting from database"""
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
    
    def is_configured(self) -> bool:
        """Check if SMTP is properly configured"""
        return bool(
            self.smtp_host and
            self.smtp_user and
            self.smtp_password and
            self.from_email
        )
    
    async def send_email(
        self,
        to_email: str,
        subject: str,
        html_content: str,
        text_content: Optional[str] = None
    ) -> bool:
        """
        Send an email
        
        Args:
            to_email: Recipient email address
            subject: Email subject
            html_content: HTML email content
            text_content: Plain text content (optional)
        
        Returns:
            True if sent successfully, False otherwise
        """
        if not self.is_configured():
            print("⚠️ SMTP not configured")
            return False
        
        try:
            # Create message
            message = MIMEMultipart('alternative')
            message['Subject'] = subject
            message['From'] = f"{self.from_name} <{self.from_email}>"
            message['To'] = to_email
            
            # Add text part
            if text_content:
                text_part = MIMEText(text_content, 'plain')
                message.attach(text_part)
            
            # Add HTML part
            html_part = MIMEText(html_content, 'html')
            message.attach(html_part)
            
            # Send email
            await aiosmtplib.send(
                message,
                hostname=self.smtp_host,
                port=self.smtp_port,
                username=self.smtp_user,
                password=self.smtp_password,
                start_tls=True
            )
            
            return True
        except Exception as e:
            print(f"❌ Failed to send email: {e}")
            return False
    
    async def send_notification(
        self,
        user_id: str,
        title: str,
        message: str,
        event_type: str = None
    ) -> bool:
        """
        Send notification to user via email
        
        Args:
            user_id: User ID (Clerk ID)
            title: Notification title
            message: Notification message
            event_type: Type of event
        
        Returns:
            True if sent successfully, False otherwise
        """
        # Get user's email settings
        statement = select(NotificationSettings).where(
            NotificationSettings.user_id == user_id
        )
        settings = self.session.exec(statement).first()
        
        if not settings or not settings.email:
            print(f"⚠️ User {user_id} has no email configured")
            return False
        
        if not settings.enable_email:
            print(f"⚠️ User {user_id} has email notifications disabled")
            return False
        
        # Generate HTML content
        html_content = self._generate_html(title, message, event_type)
        
        # Send email
        return await self.send_email(
            to_email=settings.email,
            subject=f"[ComputeHub] {title}",
            html_content=html_content,
            text_content=message
        )
    
    def _generate_html(self, title: str, message: str, event_type: Optional[str]) -> str:
        """Generate HTML email content"""
        emoji = self._get_emoji(event_type)
        
        template = Template("""
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            border-radius: 10px 10px 0 0;
            text-align: center;
        }
        .header h1 {
            margin: 0;
            font-size: 24px;
        }
        .content {
            background: #f9fafb;
            padding: 30px;
            border-radius: 0 0 10px 10px;
        }
        .message {
            background: white;
            padding: 20px;
            border-radius: 8px;
            border-left: 4px solid #667eea;
            margin: 20px 0;
        }
        .footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            color: #6b7280;
            font-size: 14px;
        }
        .button {
            display: inline-block;
            padding: 12px 24px;
            background: #667eea;
            color: white;
            text-decoration: none;
            border-radius: 6px;
            margin-top: 20px;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>{{ emoji }} {{ title }}</h1>
    </div>
    <div class="content">
        <div class="message">
            {{ message | replace('\\n', '<br>') }}
        </div>
        <a href="https://app.computehub.com" class="button">View Dashboard</a>
    </div>
    <div class="footer">
        <p>ComputeHub - GPU Compute Management Platform</p>
        <p><small>You're receiving this because you enabled email notifications</small></p>
    </div>
</body>
</html>
        """)
        
        return template.render(emoji=emoji, title=title, message=message)
    
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


def get_email_service(session: Session) -> EmailService:
    """Get Email service instance"""
    return EmailService(session)
