"""Cost summaries derived exclusively from recorded usage."""

from collections import defaultdict
from datetime import datetime, timedelta
from typing import Dict, List

from sqlmodel import Session, select

from app.core.automation_models import CostTracking
from app.core.models import Deployment, DeploymentStatus


async def get_user_cost_summary(user_id: int, session: Session) -> Dict:
    records = list(session.exec(select(CostTracking).where(CostTracking.user_id == user_id)).all())
    now = datetime.utcnow()
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    week_start = (now - timedelta(days=now.weekday())).replace(hour=0, minute=0, second=0, microsecond=0)
    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

    def total_since(start: datetime) -> float:
        return sum(record.cost_usd for record in records if record.period_end >= start)

    running_ids = set(session.exec(
        select(Deployment.id).where(
            Deployment.user_id == user_id,
            Deployment.status == DeploymentStatus.RUNNING,
        )
    ).all())
    latest_by_deployment: Dict[int, CostTracking] = {}
    for record in records:
        current = latest_by_deployment.get(record.deployment_id)
        if current is None or record.period_end > current.period_end:
            latest_by_deployment[record.deployment_id] = record

    active_cost_per_hour = sum(
        record.price_per_hour
        for deployment_id, record in latest_by_deployment.items()
        if deployment_id in running_ids
    )

    return {
        "total_all_time": round(sum(record.cost_usd for record in records), 2),
        "total_this_month": round(total_since(month_start), 2),
        "total_this_week": round(total_since(week_start), 2),
        "total_today": round(total_since(today_start), 2),
        "active_cost_per_hour": round(active_cost_per_hour, 2),
        "projected_monthly": round(active_cost_per_hour * 24 * 30, 2),
        "currency": "USD",
    }


async def get_cost_timeline(user_id: int, session: Session, days: int = 30) -> List[Dict]:
    now = datetime.utcnow()
    start = (now - timedelta(days=days - 1)).replace(hour=0, minute=0, second=0, microsecond=0)
    records = session.exec(
        select(CostTracking).where(
            CostTracking.user_id == user_id,
            CostTracking.period_end >= start,
        )
    ).all()
    totals = defaultdict(float)
    for record in records:
        totals[record.period_end.strftime("%Y-%m-%d")] += record.cost_usd

    return [
        {
            "date": (start + timedelta(days=index)).strftime("%Y-%m-%d"),
            "cost": round(totals[(start + timedelta(days=index)).strftime("%Y-%m-%d")], 2),
        }
        for index in range(days)
    ]


async def get_cost_breakdown(user_id: int, session: Session) -> Dict:
    records = session.exec(select(CostTracking).where(CostTracking.user_id == user_id)).all()
    gpu_costs = defaultdict(float)
    provider_costs = defaultdict(float)
    for record in records:
        gpu_costs[record.gpu_type] += record.cost_usd
        provider_costs[record.provider] += record.cost_usd

    total_cost = sum(gpu_costs.values())

    def format_items(values: Dict[str, float], key: str) -> List[Dict]:
        return [
            {
                key: name,
                "cost": round(cost, 2),
                "percentage": round(cost / total_cost * 100, 1) if total_cost else 0.0,
            }
            for name, cost in sorted(values.items(), key=lambda item: item[1], reverse=True)
        ]

    return {
        "by_gpu_type": format_items(gpu_costs, "gpu_type"),
        "by_provider": format_items(provider_costs, "provider"),
    }
