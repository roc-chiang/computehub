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

@app.on_event("shutdown")
async def on_shutdown():
    # Stop Telegram bot
    if hasattr(app.state, 'telegram_bot') and app.state.telegram_bot:
        from app.services.telegram_bot_handler import stop_telegram_bot
        await stop_telegram_bot(app.state.telegram_bot)

@app.get("/health")
def health_check():
    return {"status": "ok", "version": "0.1.0"}

from app.api.v1 import (
    deployments, deployment_controls, admin, pricing, users, 
    deployments_admin, admin_stats, audit, settings as settings_router, 
    tickets_admin, tickets, providers_stats, providers_crud, public_pricing,
    user_providers, costs, deployment_templates, subscriptions, notifications,
    availability
)

# Public endpoints (no auth required)
app.include_router(public_pricing.router, prefix="/api/v1", tags=["public"])

# User endpoints (auth required)
app.include_router(user_providers.router, prefix="/api/v1", tags=["user-providers"])
app.include_router(costs.router, prefix="/api/v1/costs", tags=["costs"])
app.include_router(deployment_templates.router, prefix="/api/v1", tags=["deployment-templates"])
app.include_router(subscriptions.router, prefix="/api/v1", tags=["subscriptions"])
app.include_router(notifications.router, prefix="/api/v1", tags=["notifications"])
app.include_router(availability.router, prefix="/api/v1", tags=["availability"])

# Protected endpoints
app.include_router(deployments.router, prefix="/api/v1/deployments", tags=["deployments"])
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

