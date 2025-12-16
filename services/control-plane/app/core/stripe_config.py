"""
Stripe configuration helper
Loads Stripe keys from database settings with fallback to environment variables
"""

import os
from typing import Optional
from sqlmodel import Session, select
from app.core.models import SystemSetting
from app.core.encryption import decrypt_value

class StripeConfig:
    """Stripe configuration manager with database and env fallback"""
    
    def __init__(self, session: Session):
        self.session = session
    
    def _get_setting(self, key: str, env_key: str = None) -> Optional[str]:
        """Get setting from database, fallback to environment variable"""
        # Try database first
        statement = select(SystemSetting).where(SystemSetting.key == key)
        setting = self.session.exec(statement).first()
        
        if setting and setting.value:
            # Decrypt if it's a secret
            if setting.is_secret and setting.value:
                try:
                    return decrypt_value(setting.value)
                except:
                    pass
            return setting.value
        
        # Fallback to environment variable
        if env_key:
            return os.getenv(env_key)
        
        return None
    
    @property
    def secret_key(self) -> Optional[str]:
        """Get Stripe secret key"""
        return self._get_setting('stripe_secret_key', 'STRIPE_SECRET_KEY')
    
    @property
    def publishable_key(self) -> Optional[str]:
        """Get Stripe publishable key"""
        return self._get_setting('stripe_publishable_key', 'STRIPE_PUBLISHABLE_KEY')
    
    @property
    def webhook_secret(self) -> Optional[str]:
        """Get Stripe webhook secret"""
        return self._get_setting('stripe_webhook_secret', 'STRIPE_WEBHOOK_SECRET')
    
    @property
    def pro_price_id(self) -> Optional[str]:
        """Get Pro plan price ID"""
        return self._get_setting('stripe_pro_price_id', 'STRIPE_PRO_PRICE_ID')
    
    @property
    def team_price_id(self) -> Optional[str]:
        """Get Team plan price ID"""
        return self._get_setting('stripe_team_price_id', 'STRIPE_TEAM_PRICE_ID')
    
    @property
    def mode(self) -> str:
        """Get Stripe mode (test or live)"""
        return self._get_setting('stripe_mode') or 'test'
    
    @property
    def is_configured(self) -> bool:
        """Check if Stripe is properly configured"""
        return bool(self.secret_key and self.publishable_key)


def get_stripe_config(session: Session) -> StripeConfig:
    """Get Stripe configuration"""
    return StripeConfig(session)
