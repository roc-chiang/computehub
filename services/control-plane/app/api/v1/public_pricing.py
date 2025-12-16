"""
Public pricing API endpoints for GPU price dashboard
No authentication required - public facing
"""
from typing import List, Optional
from fastapi import APIRouter, Depends
from sqlmodel import Session, select, func
from datetime import datetime, timedelta

from app.core.db import get_session
from app.core.models import PriceHistory, ProviderType, Provider
from app.core.provider_manager import ProviderManager
from pydantic import BaseModel

router = APIRouter()


class ProviderPrice(BaseModel):
    provider: str
    price_per_hour: Optional[float]
    available: bool
    is_best: bool = False


class GPUPriceComparison(BaseModel):
    gpu_type: str
    prices: List[ProviderPrice]
    best_provider: Optional[str]
    best_price: Optional[float]
    trend_percentage: Optional[float] = None  # vs. yesterday


class PriceHistoryPoint(BaseModel):
    date: datetime
    price: Optional[float]
    provider: str


async def fetch_gpu_prices_from_providers(gpu_type: str, session: Session) -> List[ProviderPrice]:
    """Fetch prices from all enabled providers"""
    providers = session.exec(select(Provider).where(Provider.is_enabled == True)).all()
    provider_prices = []
    
    for provider in providers:
        try:
            adapter = ProviderManager.get_adapter(provider.type.value, session)
            price = await adapter.get_pricing(gpu_type)
            
            provider_prices.append(ProviderPrice(
                provider=provider.type.value,
                price_per_hour=price,
                available=price is not None
            ))
        except Exception as e:
            print(f"Error fetching price from {provider.type}: {e}")
            provider_prices.append(ProviderPrice(
                provider=provider.type.value,
                price_per_hour=None,
                available=False
            ))
    
    return provider_prices


@router.get("/public/gpu-prices", response_model=List[GPUPriceComparison])
async def get_all_gpu_prices(session: Session = Depends(get_session)):
    """
    Public endpoint - no auth required
    Returns pricing for all GPU types across all providers
    """
    # Common GPU types to display
    gpu_types = ["A100", "H100", "RTX 4090", "L40S", "A6000", "RTX 3090"]
    results = []
    
    for gpu in gpu_types:
        try:
            # Get current prices from all providers
            provider_prices = await fetch_gpu_prices_from_providers(gpu, session)
            
            # Find best price
            best_price = None
            best_provider = None
            
            for p in provider_prices:
                if p.available and p.price_per_hour is not None:
                    if best_price is None or p.price_per_hour < best_price:
                        best_price = p.price_per_hour
                        best_provider = p.provider
            
            # Mark best price
            for p in provider_prices:
                if p.price_per_hour == best_price and p.available:
                    p.is_best = True
            
            # Calculate trend vs. yesterday
            trend = await calculate_price_trend(gpu, best_provider, session)
            
            results.append(GPUPriceComparison(
                gpu_type=gpu,
                prices=provider_prices,
                best_provider=best_provider,
                best_price=best_price,
                trend_percentage=trend
            ))
        except Exception as e:
            print(f"Error fetching prices for {gpu}: {e}")
            continue
    
    return results


@router.get("/public/gpu-prices/{gpu_type}/history", response_model=List[PriceHistoryPoint])
async def get_price_history(
    gpu_type: str,
    days: int = 7,
    session: Session = Depends(get_session)
):
    """
    Get historical pricing data for a specific GPU type
    Used for price trend charts
    """
    cutoff_date = datetime.utcnow() - timedelta(days=days)
    
    statement = select(PriceHistory).where(
        PriceHistory.gpu_type == gpu_type,
        PriceHistory.recorded_at >= cutoff_date,
        PriceHistory.available == True
    ).order_by(PriceHistory.recorded_at)
    
    history = session.exec(statement).all()
    
    return [
        PriceHistoryPoint(
            date=record.recorded_at,
            price=record.price_per_hour,
            provider=record.provider_type.value
        )
        for record in history
    ]


async def calculate_price_trend(
    gpu_type: str,
    provider: Optional[str],
    session: Session
) -> Optional[float]:
    """
    Calculate price trend percentage vs. yesterday
    Returns: positive = price increase, negative = price decrease
    """
    if not provider:
        return None
    
    try:
        # Get today's average price
        today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
        today_statement = select(func.avg(PriceHistory.price_per_hour)).where(
            PriceHistory.gpu_type == gpu_type,
            PriceHistory.provider_type == provider,
            PriceHistory.recorded_at >= today_start,
            PriceHistory.available == True
        )
        today_avg = session.exec(today_statement).first()
        
        # Get yesterday's average price
        yesterday_start = today_start - timedelta(days=1)
        yesterday_statement = select(func.avg(PriceHistory.price_per_hour)).where(
            PriceHistory.gpu_type == gpu_type,
            PriceHistory.provider_type == provider,
            PriceHistory.recorded_at >= yesterday_start,
            PriceHistory.recorded_at < today_start,
            PriceHistory.available == True
        )
        yesterday_avg = session.exec(yesterday_statement).first()
        
        if today_avg and yesterday_avg and yesterday_avg > 0:
            trend = ((today_avg - yesterday_avg) / yesterday_avg) * 100
            return round(trend, 2)
        
    except Exception as e:
        print(f"Error calculating trend: {e}")
    
    return None


async def store_price_snapshot(session: Session):
    """
    Store current prices for all GPU types
    Should be called by background job every hour
    """
    gpu_types = ["A100", "H100", "RTX 4090", "L40S", "A6000", "RTX 3090"]
    
    for gpu in gpu_types:
        try:
            provider_prices = await fetch_gpu_prices_from_providers(gpu, session)
            
            for price_info in provider_prices:
                price_record = PriceHistory(
                    gpu_type=gpu,
                    provider_type=ProviderType(price_info.provider),
                    price_per_hour=price_info.price_per_hour,
                    available=price_info.available
                )
                session.add(price_record)
            
            session.commit()
        except Exception as e:
            print(f"Error storing price snapshot for {gpu}: {e}")
            session.rollback()
