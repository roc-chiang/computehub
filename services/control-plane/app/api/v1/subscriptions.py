"""
Subscription API Endpoints
Handles user subscriptions, Stripe integration, and feature permissions
"""

from fastapi import APIRouter, Depends, HTTPException, Header, Request
from sqlmodel import Session, select
from typing import Optional, Dict, Any
from datetime import datetime
from pydantic import BaseModel

from app.core.db import get_session
from app.core.models import (
    UserSubscription, 
    SubscriptionEvent,
    SubscriptionTier,
    SubscriptionStatus,
    SubscriptionEventType,
    User
)
from app.api.v1.deployments import get_current_user

router = APIRouter()

# Feature permissions matrix
FEATURE_PERMISSIONS = {
    'basic': {
        'max_providers': 1,
        'templates': False,
        'batch_operations': False,
        'auto_restart': False,
        'auto_migration': False,
        'auto_failover': False,
        'notifications': False,
        'monitoring': False,
        'price_history': False,
        'api_access': False,
        'team_members': 1,
        'project_isolation': False,
        'cost_prediction': False,
    },
    'pro': {
        'max_providers': 3,  # Limited to 3 providers
        'templates': True,
        'batch_operations': True,
        'auto_restart': True,  # Basic automation: auto-restart only
        'auto_migration': False,  # No cross-provider migration
        'auto_failover': False,
        'notifications': True,
        'monitoring': True,  # Advanced monitoring
        'price_history': True,
        'api_access': True,
        'team_members': 3,  # Up to 3 team members
        'project_isolation': False,
        'cost_prediction': False,
    },
    'team': {
        'max_providers': -1,  # Unlimited
        'templates': True,
        'batch_operations': True,
        'auto_restart': True,
        'auto_migration': True,  # Advanced: cross-provider migration
        'auto_failover': True,  # Advanced: auto failover
        'batch_queue': True,  # Advanced: batch processing queue
        'notifications': True,
        'monitoring': True,
        'price_history': True,
        'api_access': True,
        'team_members': -1,  # Unlimited
        'project_isolation': True,
        'cost_prediction': True,
        'sla': '99.5%',
        'priority_support': True,
    },
    'enterprise': {
        'max_providers': -1,
        'templates': True,
        'batch_operations': True,
        'auto_restart': True,
        'auto_migration': True,
        'auto_failover': True,
        'batch_queue': True,
        'notifications': True,
        'monitoring': True,
        'price_history': True,
        'api_access': True,
        'team_members': -1,
        'project_isolation': True,
        'cost_prediction': True,
        'sla': '99.9%',
        'priority_support': True,
        'compliance': True,  # SOC 2, HIPAA, GDPR
        'private_deployment': True,
        'custom_development': True,
        'dedicated_support': True,
    }
}

# Pydantic models
class SubscriptionResponse(BaseModel):
    user_id: str
    tier: str
    status: str
    current_period_end: Optional[datetime]
    cancel_at_period_end: bool
    features: Dict[str, Any]

class CheckoutRequest(BaseModel):
    tier: str  # 'pro' or 'enterprise'

class CheckoutResponse(BaseModel):
    checkout_url: str
    session_id: str

class PortalResponse(BaseModel):
    portal_url: str

class CancelRequest(BaseModel):
    immediate: bool = False


# Helper functions
def get_or_create_subscription(user_id: str, session: Session) -> UserSubscription:
    """Get existing subscription or create new one with Basic tier"""
    statement = select(UserSubscription).where(UserSubscription.user_id == user_id)
    subscription = session.exec(statement).first()
    
    if not subscription:
        # Create new subscription with Basic tier
        subscription = UserSubscription(
            user_id=user_id,
            tier=SubscriptionTier.BASIC,
            status=SubscriptionStatus.ACTIVE
        )
        session.add(subscription)
        session.commit()
        session.refresh(subscription)
        
        # Log event
        event = SubscriptionEvent(
            user_id=user_id,
            event_type=SubscriptionEventType.CREATED,
            to_tier=SubscriptionTier.BASIC
        )
        session.add(event)
        session.commit()
    
    return subscription


def get_features(tier: str) -> Dict[str, Any]:
    """Get feature permissions for a tier"""
    return FEATURE_PERMISSIONS.get(tier, FEATURE_PERMISSIONS['basic'])


# API Endpoints

@router.get("/subscriptions/current", response_model=SubscriptionResponse)
async def get_current_subscription(
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """Get current user's subscription information"""
    subscription = get_or_create_subscription(current_user.id, session)
    
    return SubscriptionResponse(
        user_id=subscription.user_id,
        tier=subscription.tier.value,
        status=subscription.status.value,
        current_period_end=subscription.current_period_end,
        cancel_at_period_end=subscription.cancel_at_period_end,
        features=get_features(subscription.tier.value)
    )


@router.post("/subscriptions/checkout", response_model=CheckoutResponse)
async def create_checkout_session(
    request: CheckoutRequest,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """Create Stripe checkout session for subscription upgrade"""
    
    # Validate tier
    if request.tier not in ['pro', 'enterprise']:
        raise HTTPException(status_code=400, detail="Invalid tier. Must be 'pro' or 'enterprise'")
    
    subscription = get_or_create_subscription(current_user.id, session)
    
    # Check if already on this tier
    if subscription.tier.value == request.tier:
        raise HTTPException(status_code=400, detail=f"Already subscribed to {request.tier}")
    
    # TODO: Implement Stripe checkout session creation
    # For now, return placeholder
    return CheckoutResponse(
        checkout_url="https://checkout.stripe.com/placeholder",
        session_id="cs_placeholder"
    )


@router.post("/subscriptions/portal", response_model=PortalResponse)
async def create_portal_session(
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """Create Stripe customer portal session for subscription management"""
    
    subscription = get_or_create_subscription(current_user.id, session)
    
    if not subscription.stripe_customer_id:
        raise HTTPException(status_code=400, detail="No active subscription to manage")
    
    # TODO: Implement Stripe portal session creation
    return PortalResponse(
        portal_url="https://billing.stripe.com/placeholder"
    )


@router.post("/subscriptions/cancel")
async def cancel_subscription(
    request: CancelRequest,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """Cancel user's subscription"""
    
    subscription = get_or_create_subscription(current_user.id, session)
    
    if subscription.tier == SubscriptionTier.BASIC:
        raise HTTPException(status_code=400, detail="Cannot cancel Basic tier")
    
    if request.immediate:
        # Cancel immediately
        subscription.tier = SubscriptionTier.BASIC
        subscription.status = SubscriptionStatus.CANCELED
        subscription.stripe_subscription_id = None
    else:
        # Cancel at period end
        subscription.cancel_at_period_end = True
    
    subscription.updated_at = datetime.utcnow()
    session.add(subscription)
    
    # Log event
    event = SubscriptionEvent(
        user_id=current_user.id,
        event_type=SubscriptionEventType.CANCELED,
        from_tier=subscription.tier,
        to_tier=SubscriptionTier.BASIC
    )
    session.add(event)
    session.commit()
    
    return {
        "status": "canceled" if request.immediate else "will_cancel",
        "cancel_at_period_end": subscription.cancel_at_period_end,
        "current_period_end": subscription.current_period_end
    }


@router.post("/subscriptions/webhook/stripe")
async def stripe_webhook(
    request: Request,
    stripe_signature: str = Header(None, alias="Stripe-Signature"),
    session: Session = Depends(get_session)
):
    """Handle Stripe webhook events"""
    
    # TODO: Implement Stripe webhook verification and processing
    # For now, return success
    return {"status": "received"}


# Feature permission checker (for use in other endpoints)
def require_feature(feature: str):
    """Decorator to check if user has access to a feature"""
    async def checker(
        current_user: User = Depends(get_current_user),
        session: Session = Depends(get_session)
    ):
        subscription = get_or_create_subscription(current_user.id, session)
        features = get_features(subscription.tier.value)
        
        if feature not in features or not features[feature]:
            raise HTTPException(
                status_code=403,
                detail=f"This feature requires {subscription.tier.value} subscription or higher"
            )
        
        return True
    
    return Depends(checker)
