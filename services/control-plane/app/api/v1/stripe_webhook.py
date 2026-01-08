"""
Stripe Webhook Handler
Processes Stripe webhook events for subscription management
"""

from fastapi import APIRouter, Request, HTTPException, Depends
from sqlmodel import Session, select
import stripe
from datetime import datetime

from app.core.db import get_session
from app.core.models import (
    SystemSetting,
    UserSubscription,
    SubscriptionEvent,
    SubscriptionTier,
    SubscriptionStatus,
    SubscriptionEventType
)

router = APIRouter()


def get_webhook_secret(session: Session) -> str:
    """Get Stripe webhook secret from settings"""
    statement = select(SystemSetting).where(
        SystemSetting.key == 'stripe_webhook_secret'
    )
    setting = session.exec(statement).first()
    return setting.value if setting else ""


@router.post("/stripe/webhook")
async def handle_stripe_webhook(
    request: Request,
    session: Session = Depends(get_session)
):
    """
    Handle Stripe webhook events
    
    Events handled:
    - checkout.session.completed
    - customer.subscription.created
    - customer.subscription.updated
    - customer.subscription.deleted
    - invoice.paid
    - invoice.payment_failed
    """
    
    # Get webhook secret
    webhook_secret = get_webhook_secret(session)
    if not webhook_secret:
        raise HTTPException(status_code=500, detail="Webhook secret not configured")
    
    # Get request body and signature
    payload = await request.body()
    sig_header = request.headers.get('stripe-signature')
    
    if not sig_header:
        raise HTTPException(status_code=400, detail="Missing signature")
    
    try:
        # Verify webhook signature
        event = stripe.Webhook.construct_event(
            payload, sig_header, webhook_secret
        )
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid payload")
    except stripe.error.SignatureVerificationError:
        raise HTTPException(status_code=400, detail="Invalid signature")
    
    # Handle the event
    event_type = event['type']
    data = event['data']['object']
    
    print(f"[Stripe Webhook] Received event: {event_type}")
    
    try:
        if event_type == 'checkout.session.completed':
            await handle_checkout_completed(session, data)
        
        elif event_type == 'customer.subscription.created':
            await handle_subscription_created(session, data)
        
        elif event_type == 'customer.subscription.updated':
            await handle_subscription_updated(session, data)
        
        elif event_type == 'customer.subscription.deleted':
            await handle_subscription_deleted(session, data)
        
        elif event_type == 'invoice.paid':
            await handle_invoice_paid(session, data)
        
        elif event_type == 'invoice.payment_failed':
            await handle_invoice_failed(session, data)
        
        else:
            print(f"[Stripe Webhook] Unhandled event type: {event_type}")
    
    except Exception as e:
        print(f"[Stripe Webhook] Error handling event: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
    
    return {"status": "success"}


async def handle_checkout_completed(session: Session, data: dict):
    """Handle checkout.session.completed event"""
    user_id = data['metadata'].get('user_id')
    tier = data['metadata'].get('tier')
    customer_id = data['customer']
    subscription_id = data['subscription']
    
    if not user_id or not tier:
        print("[Stripe] Missing metadata in checkout session")
        return
    
    # Get or create subscription record
    statement = select(UserSubscription).where(
        UserSubscription.user_id == user_id
    )
    subscription = session.exec(statement).first()
    
    if not subscription:
        subscription = UserSubscription(user_id=user_id)
        session.add(subscription)
    
    # Update subscription
    subscription.tier = SubscriptionTier(tier)
    subscription.stripe_customer_id = customer_id
    subscription.stripe_subscription_id = subscription_id
    subscription.status = SubscriptionStatus.ACTIVE
    subscription.updated_at = datetime.utcnow()
    
    # Log event
    event = SubscriptionEvent(
        user_id=user_id,
        event_type=SubscriptionEventType.CREATED,
        to_tier=SubscriptionTier(tier),
        stripe_event_id=data['id']
    )
    session.add(event)
    
    session.commit()
    print(f"[Stripe] Subscription created for user {user_id}: {tier}")


async def handle_subscription_created(session: Session, data: dict):
    """Handle customer.subscription.created event"""
    customer_id = data['customer']
    subscription_id = data['id']
    
    # Find user by customer ID
    statement = select(UserSubscription).where(
        UserSubscription.stripe_customer_id == customer_id
    )
    subscription = session.exec(statement).first()
    
    if subscription:
        subscription.stripe_subscription_id = subscription_id
        subscription.status = SubscriptionStatus.ACTIVE
        subscription.current_period_start = datetime.fromtimestamp(data['current_period_start'])
        subscription.current_period_end = datetime.fromtimestamp(data['current_period_end'])
        subscription.updated_at = datetime.utcnow()
        session.commit()
        print(f"[Stripe] Subscription created: {subscription_id}")


async def handle_subscription_updated(session: Session, data: dict):
    """Handle customer.subscription.updated event"""
    subscription_id = data['id']
    
    # Find subscription
    statement = select(UserSubscription).where(
        UserSubscription.stripe_subscription_id == subscription_id
    )
    subscription = session.exec(statement).first()
    
    if subscription:
        subscription.status = SubscriptionStatus(data['status'])
        subscription.current_period_start = datetime.fromtimestamp(data['current_period_start'])
        subscription.current_period_end = datetime.fromtimestamp(data['current_period_end'])
        subscription.cancel_at_period_end = data.get('cancel_at_period_end', False)
        subscription.updated_at = datetime.utcnow()
        session.commit()
        print(f"[Stripe] Subscription updated: {subscription_id}")


async def handle_subscription_deleted(session: Session, data: dict):
    """Handle customer.subscription.deleted event"""
    subscription_id = data['id']
    
    # Find subscription
    statement = select(UserSubscription).where(
        UserSubscription.stripe_subscription_id == subscription_id
    )
    subscription = session.exec(statement).first()
    
    if subscription:
        old_tier = subscription.tier
        subscription.tier = SubscriptionTier.BASIC
        subscription.status = SubscriptionStatus.CANCELED
        subscription.updated_at = datetime.utcnow()
        
        # Log event
        event = SubscriptionEvent(
            user_id=subscription.user_id,
            event_type=SubscriptionEventType.CANCELED,
            from_tier=old_tier,
            to_tier=SubscriptionTier.BASIC,
            stripe_event_id=data['id']
        )
        session.add(event)
        
        session.commit()
        print(f"[Stripe] Subscription canceled: {subscription_id}")


async def handle_invoice_paid(session: Session, data: dict):
    """Handle invoice.paid event"""
    subscription_id = data.get('subscription')
    
    if subscription_id:
        statement = select(UserSubscription).where(
            UserSubscription.stripe_subscription_id == subscription_id
        )
        subscription = session.exec(statement).first()
        
        if subscription:
            # Log renewal event
            event = SubscriptionEvent(
                user_id=subscription.user_id,
                event_type=SubscriptionEventType.RENEWED,
                to_tier=subscription.tier,
                stripe_event_id=data['id']
            )
            session.add(event)
            session.commit()
            print(f"[Stripe] Invoice paid for subscription: {subscription_id}")


async def handle_invoice_failed(session: Session, data: dict):
    """Handle invoice.payment_failed event"""
    subscription_id = data.get('subscription')
    
    if subscription_id:
        statement = select(UserSubscription).where(
            UserSubscription.stripe_subscription_id == subscription_id
        )
        subscription = session.exec(statement).first()
        
        if subscription:
            subscription.status = SubscriptionStatus.PAST_DUE
            subscription.updated_at = datetime.utcnow()
            session.commit()
            print(f"[Stripe] Payment failed for subscription: {subscription_id}")
