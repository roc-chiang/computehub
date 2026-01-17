"""
License Verification Server - Main Application
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import init_db
from app.api import verify

# Create FastAPI app
app = FastAPI(
    title="ComputeHub License Server",
    description="License verification service for ComputeHub Pro",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, restrict to specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize database
@app.on_event("startup")
def on_startup():
    init_db()
    print("[License Server] Database initialized")

# Include routers
app.include_router(verify.router)

# Health check
@app.get("/health")
def health_check():
    return {"status": "ok", "service": "license-server"}

# Root endpoint
@app.get("/")
def root():
    return {
        "service": "ComputeHub License Verification Server",
        "version": "1.0.0",
        "endpoints": {
            "verify": "POST /api/verify",
            "revoke": "POST /api/revoke (admin only)",
            "health": "GET /health"
        }
    }
