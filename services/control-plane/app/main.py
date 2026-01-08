from dotenv import load_dotenv
import os

# Load environment variables FIRST before any other imports
load_dotenv()
print(f"[STARTUP] ENCRYPTION_KEY loaded: {bool(os.getenv('ENCRYPTION_KEY'))}")

from fastapi import FastAPI
from app.core.config import settings
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="ComputeHub Control Plane",
    version="0.1.0",
    openapi_url="/api/v1/openapi.json",
    docs_url="/api/v1/docs",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def on_startup():
    from app.core.db import init_db
    init_db()
    
    # Start Telegram bot
    import asyncio
    from app.services.telegram_bot_handler import start_telegram_bot
    app.state.telegram_bot = await start_telegram_bot()
    
    # Start background scheduler for deployment status sync
    from apscheduler.schedulers.asyncio import AsyncIOScheduler
    from app.tasks.sync_deployments import sync_deployment_status, mark_stale_deployments
    
    scheduler = AsyncIOScheduler()
    
    # Sync deployment status every 30 seconds
    scheduler.add_job(
        sync_deployment_status,
        'interval',
        seconds=30,
        id='sync_deployments',
        name='Sync Deployment Status'
    )
    
    # Mark stale deployments every hour
    scheduler.add_job(
        mark_stale_deployments,
        'interval',
        hours=1,
        id='mark_stale_deployments',
        name='Mark Stale Deployments'
    )
    
    scheduler.start()
    app.state.scheduler = scheduler
    print("[STARTUP] Background scheduler started")
    
    # Start automation tasks (Phase 9)
    from app.tasks.automation_tasks import start_automation_tasks
    start_automation_tasks()
    print("[STARTUP] Automation tasks started")
    
    # Start advanced automation tasks (Phase 9 Week 2)
    from app.tasks.advanced_automation_tasks import register_advanced_automation_tasks
    register_advanced_automation_tasks(scheduler)
    print("[STARTUP] Advanced automation tasks registered")

@app.on_event("shutdown")
async def on_shutdown():
    # Stop Telegram bot
    if hasattr(app.state, 'telegram_bot') and app.state.telegram_bot:
        from app.services.telegram_bot_handler import stop_telegram_bot
        await stop_telegram_bot(app.state.telegram_bot)
    
    # Stop scheduler
    if hasattr(app.state, 'scheduler') and app.state.scheduler:
        app.state.scheduler.shutdown()
        print("[SHUTDOWN] Background scheduler stopped")
    
    # Stop automation tasks (Phase 9)
    from app.tasks.automation_tasks import stop_automation_tasks
    stop_automation_tasks()
    print("[SHUTDOWN] Automation tasks stopped")


def get_provider_adapters():
    """
    Get all available provider adapters for advanced automation tasks.
    Returns a dictionary of provider_type -> adapter instance.
    """
    from app.core.provider_manager import ProviderManager
    from app.core.models import ProviderType
    from app.core.db import get_session
    
    adapters = {}
    
    # Get a database session
    with next(get_session()) as session:
        # Get adapters for all known provider types
        for provider_type in [ProviderType.RUNPOD, ProviderType.VAST]:
            try:
                adapter = ProviderManager.get_adapter(provider_type, session)
                adapters[provider_type] = adapter
            except Exception as e:
                print(f"[ProviderAdapters] Failed to load adapter for {provider_type}: {e}")
    
    return adapters


@app.get("/health")
def health_check():
    return {"status": "ok", "version": "0.1.0"}

from app.api.v1 import (
    deployments, deployment_controls, admin, pricing, users, 
    deployments_admin, admin_stats, audit, settings as settings_router, 
    tickets_admin, tickets, providers_stats, providers_crud, public_pricing,
    user_providers, costs, deployment_templates, subscriptions, notifications,
    availability, user_profile, logs, metrics, automation, advanced_automation, rules,
    stripe_webhook, templates, monitoring
)

# Public endpoints (no auth required)
app.include_router(public_pricing.router, prefix="/api/v1", tags=["public"])

# Stripe webhook (no auth - verified by signature)
app.include_router(stripe_webhook.router, prefix="/api/v1", tags=["stripe"])

# User endpoints (auth required)
app.include_router(user_providers.router, prefix="/api/v1", tags=["user-providers"])
app.include_router(costs.router, prefix="/api/v1/costs", tags=["costs"])
app.include_router(deployment_templates.router, prefix="/api/v1", tags=["deployment-templates"])
app.include_router(subscriptions.router, prefix="/api/v1", tags=["subscriptions"])
app.include_router(notifications.router, prefix="/api/v1", tags=["notifications"])
app.include_router(availability.router, prefix="/api/v1", tags=["availability"])
app.include_router(user_profile.router, prefix="/api/v1", tags=["user-profile"])
app.include_router(templates.router, prefix="/api/v1", tags=["templates"])
app.include_router(monitoring.router, prefix="/api/v1", tags=["monitoring"])

# Protected endpoints
app.include_router(deployments.router, prefix="/api/v1/deployments", tags=["deployments"])
app.include_router(logs.router, prefix="/api/v1", tags=["logs"])
app.include_router(metrics.router, prefix="/api/v1", tags=["metrics"])
app.include_router(automation.router, prefix="/api/v1", tags=["automation"])
app.include_router(advanced_automation.router, prefix="/api/v1", tags=["advanced-automation"])
app.include_router(rules.router, prefix="/api/v1", tags=["rules"])
app.include_router(deployment_controls.router, prefix="/api/v1/deployments", tags=["deployment-controls"])
app.include_router(pricing.router, prefix="/api/v1/pricing", tags=["pricing"])
app.include_router(users.router, prefix="/api/v1/admin", tags=["admin-users"])
app.include_router(deployments_admin.router, prefix="/api/v1/admin", tags=["admin-deployments"])
app.include_router(admin_stats.router, prefix="/api/v1/admin", tags=["admin-stats"])
app.include_router(audit.router, prefix="/api/v1/admin", tags=["admin-audit"])
app.include_router(settings_router.router, prefix="/api/v1/admin", tags=["admin-settings"])
app.include_router(tickets_admin.router, prefix="/api/v1/admin", tags=["admin-tickets"])
app.include_router(providers_stats.router, prefix="/api/v1/admin", tags=["admin-providers-stats"])
app.include_router(providers_crud.router, prefix="/api/v1/admin", tags=["admin-providers"])
app.include_router(tickets.router, prefix="/api/v1/tickets", tags=["tickets"])
app.include_router(admin.router, prefix="/api/v1/admin", tags=["admin"])  # Register admin last to avoid conflicts

