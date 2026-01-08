"""
Webhook Service
Handles webhook notifications via HTTP POST requests
"""

import asyncio
import hmac
import hashlib
import json
from typing import Optional, Dict, Any
from datetime import datetime
import httpx
from sqlmodel import Session, select
from app.core.models import NotificationSettings


class WebhookService:
    """Service for sending webhook notifications"""
    
    def __init__(self, session: Session):
        self.session = session
        self.timeout = 10.0  # 10 seconds timeout
        self.max_retries = 3
    
    def _generate_signature(self, payload: str, secret: str) -> str:
        """
        Generate HMAC-SHA256 signature for webhook payload
        
        Args:
            payload: JSON payload string
            secret: Webhook secret key
        
        Returns:
            Signature in format "sha256=..."
        """
        signature = hmac.new(
            secret.encode('utf-8'),
            payload.encode('utf-8'),
            hashlib.sha256
        ).hexdigest()
        return f"sha256={signature}"
    
    async def send_webhook(
        self,
        url: str,
        payload: Dict[str, Any],
        secret: Optional[str] = None,
        custom_headers: Optional[Dict[str, str]] = None
    ) -> bool:
        """
        Send webhook POST request
        
        Args:
            url: Webhook URL
            payload: JSON payload
            secret: Optional secret for signature
            custom_headers: Optional custom headers
        
        Returns:
            True if successful, False otherwise
        """
        try:
            # Convert payload to JSON string
            payload_str = json.dumps(payload, ensure_ascii=False)
            
            # Prepare headers
            headers = {
                "Content-Type": "application/json",
                "User-Agent": "ComputeHub-Webhook/1.0"
            }
            
            # Add signature if secret provided
            if secret:
                signature = self._generate_signature(payload_str, secret)
                headers["X-ComputeHub-Signature"] = signature
            
            # Add custom headers
            if custom_headers:
                headers.update(custom_headers)
            
            # Send POST request with retries
            for attempt in range(self.max_retries):
                try:
                    async with httpx.AsyncClient(timeout=self.timeout) as client:
                        response = await client.post(
                            url,
                            content=payload_str,
                            headers=headers
                        )
                        
                        # Check if successful (2xx status code)
                        if 200 <= response.status_code < 300:
                            print(f"✅ Webhook sent successfully to {url} (attempt {attempt + 1})")
                            return True
                        else:
                            print(f"⚠️ Webhook failed with status {response.status_code} (attempt {attempt + 1})")
                            
                            # Don't retry on client errors (4xx)
                            if 400 <= response.status_code < 500:
                                return False
                
                except httpx.TimeoutException:
                    print(f"⏱️ Webhook timeout (attempt {attempt + 1})")
                except httpx.RequestError as e:
                    print(f"❌ Webhook request error: {e} (attempt {attempt + 1})")
                
                # Wait before retry (exponential backoff)
                if attempt < self.max_retries - 1:
                    await asyncio.sleep(2 ** attempt)
            
            print(f"❌ Webhook failed after {self.max_retries} attempts")
            return False
            
        except Exception as e:
            print(f"❌ Webhook error: {e}")
            import traceback
            traceback.print_exc()
            return False
    
    async def send_notification(
        self,
        user_id: str,
        title: str,
        message: str,
        event_type: str,
        metadata: Optional[Dict[str, Any]] = None
    ) -> bool:
        """
        Send notification to user via webhook
        
        Args:
            user_id: User ID (Clerk ID)
            title: Notification title
            message: Notification message
            event_type: Type of notification event
            metadata: Additional metadata
        
        Returns:
            True if successful, False otherwise
        """
        # Get user's webhook settings
        statement = select(NotificationSettings).where(
            NotificationSettings.user_id == user_id
        )
        settings = self.session.exec(statement).first()
        
        if not settings or not settings.webhook_url:
            print(f"⚠️ User {user_id} has no webhook URL configured")
            return False
        
        if not settings.enable_webhook:
            print(f"⚠️ User {user_id} has webhook notifications disabled")
            return False
        
        # Prepare webhook payload
        payload = {
            "event_type": event_type,
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "user_id": user_id,
            "title": title,
            "message": message,
            "metadata": metadata or {}
        }
        
        # Send webhook
        return await self.send_webhook(
            url=settings.webhook_url,
            payload=payload,
            secret=settings.webhook_secret
        )
    
    async def test_webhook(
        self,
        url: str,
        secret: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Test webhook endpoint
        
        Args:
            url: Webhook URL to test
            secret: Optional secret for signature
        
        Returns:
            Dict with test results
        """
        test_payload = {
            "event_type": "test",
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "title": "ComputeHub Webhook Test",
            "message": "This is a test notification from ComputeHub",
            "metadata": {
                "test": True
            }
        }
        
        try:
            success = await self.send_webhook(url, test_payload, secret)
            
            return {
                "success": success,
                "message": "Webhook test successful" if success else "Webhook test failed",
                "url": url,
                "timestamp": datetime.utcnow().isoformat()
            }
        except Exception as e:
            return {
                "success": False,
                "message": f"Webhook test error: {str(e)}",
                "url": url,
                "timestamp": datetime.utcnow().isoformat()
            }


def get_webhook_service(session: Session) -> WebhookService:
    """Get webhook service instance"""
    return WebhookService(session)
