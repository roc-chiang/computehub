"""
Stripe Service
Handles Stripe payment processing and subscription management
"""

import stripe
from typing import Optional, Dict, Any, List
from sqlmodel import Session, select
from datetime import datetime

from app.core.models import SystemSetting, UserSubscription, SubscriptionTier, SubscriptionStatus


class StripeService:
    """Service for Stripe payment processing"""
    
    def __init__(self, session: Session):
        self.session = session
        self._configure_stripe()
    
    def _get_setting(self, key: str) -> Optional[str]:
        """Get system setting value"""
        statement = select(SystemSetting).where(SystemSetting.key == key)
        setting = self.session.exec(statement).first()
        return setting.value if setting else None
    
    def _configure_stripe(self):
        """Configure Stripe API key from system settings"""
        api_key = self._get_setting('stripe_secret_key')
        if api_key:
            stripe.api_key = api_key
    
    def is_configured(self) -> bool:
        """Check if Stripe is properly configured"""
        return self._get_setting('stripe_secret_key') is not None
    
    async def create_customer(
        self,
        user_id: str,
        email: str,
        name: Optional[str] = None
    ) -> Optional[str]:
        """
        Create a Stripe customer
        
        Args:
            user_id: User ID (Clerk ID)
            email: Customer email
            name: Customer name
        
        Returns:
            Stripe customer ID or None if failed
        """
        if not self.is_configured():
            print("⚠️ Stripe is not configured")
            return None
        
        try:
            customer = stripe.Customer.create(
                email=email,
                name=name,
                metadata={"user_id": user_id}
            )
            print(f"✅ Created Stripe customer: {customer.id}")
            return customer.id
        except Exception as e:
            print(f"❌ Failed to create Stripe customer: {e}")
            return None
    
    async def create_checkout_session(
        self,
        user_id: str,
        tier: SubscriptionTier,
        success_url: str,
        cancel_url: str
    ) -> Optional[Dict[str, Any]]:
        """
        Create a Stripe Checkout session for subscription
        
        Args:
            user_id: User ID
            tier: Subscription tier (pro or enterprise)
            success_url: URL to redirect after success
            cancel_url: URL to redirect after cancel
        
        Returns:
            Dict with session_id and url, or None if failed
        """
        if not self.is_configured():
            return None
        
        # Get price ID from settings
        price_key = f'stripe_price_{tier.value}_monthly'
        price_id = self._get_setting(price_key)
        
        if not price_id:
            print(f"⚠️ Price ID not configured for {tier.value}")
            return None
        
        # Get or create customer
        statement = select(UserSubscription).where(
            UserSubscription.user_id == user_id
        )
        subscription = self.session.exec(statement).first()
        
        customer_id = subscription.stripe_customer_id if subscription else None
        
        try:
            session = stripe.checkout.Session.create(
                customer=customer_id,
                mode='subscription',
                payment_method_types=['card'],
                line_items=[{
                    'price': price_id,
                    'quantity': 1
                }],
                success_url=success_url,
                cancel_url=cancel_url,
                metadata={
                    'user_id': user_id,
                    'tier': tier.value
                }
            )
            
            return {
                'session_id': session.id,
                'url': session.url
            }
        except Exception as e:
            print(f"❌ Failed to create checkout session: {e}")
            return None
    
    async def create_portal_session(
        self,
        customer_id: str,
        return_url: str
    ) -> Optional[str]:
        """
        Create a Stripe Customer Portal session
        
        Args:
            customer_id: Stripe customer ID
            return_url: URL to return to
        
        Returns:
            Portal URL or None if failed
        """
        if not self.is_configured():
            return None
        
        try:
            session = stripe.billing_portal.Session.create(
                customer=customer_id,
                return_url=return_url
            )
            return session.url
        except Exception as e:
            print(f"❌ Failed to create portal session: {e}")
            return None
    
    async def cancel_subscription(
        self,
        subscription_id: str,
        at_period_end: bool = True
    ) -> bool:
        """
        Cancel a subscription
        
        Args:
            subscription_id: Stripe subscription ID
            at_period_end: Cancel at period end or immediately
        
        Returns:
            True if successful
        """
        if not self.is_configured():
            return False
        
        try:
            if at_period_end:
                stripe.Subscription.modify(
                    subscription_id,
                    cancel_at_period_end=True
                )
            else:
                stripe.Subscription.delete(subscription_id)
            
            print(f"✅ Cancelled subscription: {subscription_id}")
            return True
        except Exception as e:
            print(f"❌ Failed to cancel subscription: {e}")
            return False
    
    async def get_invoices(
        self,
        customer_id: str,
        limit: int = 10
    ) -> List[Dict[str, Any]]:
        """
        Get customer invoices
        
        Args:
            customer_id: Stripe customer ID
            limit: Number of invoices to retrieve
        
        Returns:
            List of invoice dicts
        """
        if not self.is_configured():
            return []
        
        try:
            invoices = stripe.Invoice.list(
                customer=customer_id,
                limit=limit
            )
            
            return [{
                'id': inv.id,
                'amount': inv.amount_paid / 100,  # Convert cents to dollars
                'currency': inv.currency.upper(),
                'status': inv.status,
                'created': datetime.fromtimestamp(inv.created),
                'invoice_pdf': inv.invoice_pdf,
                'hosted_invoice_url': inv.hosted_invoice_url
            } for inv in invoices.data]
        except Exception as e:
            print(f"❌ Failed to get invoices: {e}")
            return []
    
    async def get_subscription(
        self,
        subscription_id: str
    ) -> Optional[Dict[str, Any]]:
        """
        Get subscription details
        
        Args:
            subscription_id: Stripe subscription ID
        
        Returns:
            Subscription dict or None
        """
        if not self.is_configured():
            return None
        
        try:
            sub = stripe.Subscription.retrieve(subscription_id)
            
            return {
                'id': sub.id,
                'status': sub.status,
                'current_period_start': datetime.fromtimestamp(sub.current_period_start),
                'current_period_end': datetime.fromtimestamp(sub.current_period_end),
                'cancel_at_period_end': sub.cancel_at_period_end,
                'canceled_at': datetime.fromtimestamp(sub.canceled_at) if sub.canceled_at else None
            }
        except Exception as e:
            print(f"❌ Failed to get subscription: {e}")
            return None


def get_stripe_service(session: Session) -> StripeService:
    """Get Stripe service instance"""
    return StripeService(session)
