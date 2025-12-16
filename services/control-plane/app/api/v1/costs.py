"""
Cost tracking API endpoints
"""
from typing import List, Dict
from fastapi import APIRouter, Depends, Query
from sqlmodel import Session
from pydantic import BaseModel

from app.core.db import get_session
from app.core.models import User
from app.api.v1.deployments import get_current_user
from app.utils.cost_calculator import (
    get_user_cost_summary,
    get_cost_timeline,
    get_cost_breakdown
)

router = APIRouter()


class CostSummary(BaseModel):
    total_all_time: float
    total_this_month: float
    total_this_week: float
    total_today: float
    active_cost_per_hour: float
    projected_monthly: float
    currency: str


class TimelinePoint(BaseModel):
    date: str
    cost: float


class CostBreakdownItem(BaseModel):
    gpu_type: str | None = None
    provider: str | None = None
    cost: float
    percentage: float


class CostBreakdown(BaseModel):
    by_gpu_type: List[CostBreakdownItem]
    by_provider: List[CostBreakdownItem]


@router.get("/summary", response_model=CostSummary)
async def get_cost_summary(
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """
    Get cost summary for the current user
    """
    summary = await get_user_cost_summary(current_user.id, session)
    return summary


@router.get("/timeline", response_model=List[TimelinePoint])
async def get_timeline(
    days: int = Query(default=30, ge=1, le=365),
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """
    Get daily cost timeline for the current user
    """
    timeline = await get_cost_timeline(current_user.id, session, days)
    return timeline


@router.get("/breakdown", response_model=CostBreakdown)
async def get_breakdown(
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """
    Get cost breakdown by GPU type and provider
    """
    breakdown = await get_cost_breakdown(current_user.id, session)
    return breakdown
