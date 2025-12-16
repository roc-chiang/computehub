from typing import List, Dict, Any
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from app.core.db import get_session
from app.core.models import Provider
from app.core.provider_manager import ProviderManager

router = APIRouter()

# Simple in-memory cache (5 minutes TTL)
_price_cache: Dict[str, tuple[Dict[str, Any], datetime]] = {}
CACHE_TTL_MINUTES = 5

@router.get("/compare")
async def compare_prices(
    gpu_type: str,
    session: Session = Depends(get_session)
) -> Dict[str, Any]:
    """
    Compare prices across all enabled providers for a given GPU type.
    
    Returns:
        {
            "gpu_type": "RTX4090",
            "providers": [
                {
                    "name": "runpod",
                    "price_per_hour": 0.34,
                    "available": true,
                    "currency": "USD"
                },
                ...
            ],
            "recommended": "vast",
            "cached_at": "2025-12-06T10:00:00Z"
        }
    """
    # Check cache
    cache_key = gpu_type
    if cache_key in _price_cache:
        cached_data, cached_time = _price_cache[cache_key]
        if datetime.utcnow() - cached_time < timedelta(minutes=CACHE_TTL_MINUTES):
            return cached_data
    
    # Get enabled providers
    providers = session.exec(select(Provider).where(Provider.is_enabled == True)).all()
    
    if not providers:
        return {
            "gpu_type": gpu_type,
            "providers": [],
            "recommended": None,
            "cached_at": datetime.utcnow().isoformat() + "Z",
            "error": "No providers configured"
        }
    
    # Fetch prices from all providers
    provider_prices = []
    
    for provider in providers:
        try:
            adapter = ProviderManager.get_adapter(provider.type, session)
            price = await adapter.get_pricing(gpu_type)
            
            # Determine display name and test flag
            display_name = provider.name
            is_test = provider.type == "local"
            
            provider_prices.append({
                "name": provider.type,
                "display_name": display_name,
                "price_per_hour": price,
                "available": price is not None,
                "currency": "USD",
                "is_test": is_test
            })
        except Exception as e:
            print(f"[Pricing] Failed to get price from {provider.type}: {e}")
            import traceback
            traceback.print_exc()
            provider_prices.append({
                "name": provider.type,
                "display_name": provider.name,
                "price_per_hour": None,
                "available": False,
                "currency": "USD",
                "is_test": provider.type == "local"
            })
    
    # Sort by price (None values go to end)
    provider_prices.sort(key=lambda x: (x["price_per_hour"] is None, x["price_per_hour"] or float('inf')))
    
    # Find recommended (cheapest available)
    recommended = None
    for p in provider_prices:
        if p["available"] and p["price_per_hour"] is not None:
            recommended = p["name"]
            break
    
    result = {
        "gpu_type": gpu_type,
        "providers": provider_prices,
        "recommended": recommended,
        "cached_at": datetime.utcnow().isoformat() + "Z"
    }
    
    # Cache the result
    _price_cache[cache_key] = (result, datetime.utcnow())
    
    return result
