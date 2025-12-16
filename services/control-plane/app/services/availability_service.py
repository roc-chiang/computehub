from typing import Dict, List, Optional
from datetime import datetime, timedelta
from sqlmodel import Session, select
from app.core.models import GPUAvailabilityCache
from app.core.provider_manager import ProviderManager
import json
import os

class AvailabilityService:
    """Service for checking GPU availability across providers"""
    
    def __init__(self, session: Session):
        self.session = session
        self.cache_ttl = timedelta(minutes=5)
    
    async def check_gpu_availability(
        self,
        gpu_type: str,
        providers: Optional[List[str]] = None
    ) -> Dict[str, dict]:
        """
        Check GPU availability across providers
        
        Args:
            gpu_type: GPU type to check (e.g., "RTX 4090")
            providers: List of provider names to check. If None, checks all available providers.
        
        Returns:
            {
                "runpod": {
                    "available": True,
                    "count": 5,
                    "price_per_hour": 0.28,
                    "regions": ["us-east", "eu-west"],
                    "cached": True,
                    "checked_at": "2025-12-12T20:00:00Z"
                },
                "vastai": {...}
            }
        """
        if providers is None:
            # Check ALL available providers (not just user-bound ones)
            # This is for price comparison - users can see all options
            providers = ["local", "runpod", "vast"]
        
        results = {}
        
        for provider in providers:
            try:
                # Check cache first
                cached = self._get_cached_availability(provider, gpu_type)
                
                if cached:
                    results[provider] = cached
                else:
                    # Fetch from provider API
                    fresh = await self._fetch_availability(provider, gpu_type)
                    results[provider] = fresh
                    # Cache the result
                    self._cache_availability(provider, gpu_type, fresh)
            except Exception as e:
                print(f"[ERROR] Failed to check availability for {provider}: {e}")
                results[provider] = {
                    "available": False,
                    "count": 0,
                    "price_per_hour": 0,
                    "regions": [],
                    "error": str(e),
                    "cached": False,
                    "checked_at": datetime.utcnow().isoformat()
                }
        
        return results
    
    def _get_cached_availability(
        self,
        provider: str,
        gpu_type: str
    ) -> Optional[dict]:
        """Get cached availability if not expired"""
        statement = select(GPUAvailabilityCache).where(
            GPUAvailabilityCache.provider == provider,
            GPUAvailabilityCache.gpu_type == gpu_type,
            GPUAvailabilityCache.expires_at > datetime.utcnow()
        )
        
        cache = self.session.exec(statement).first()
        
        if cache:
            return {
                "available": cache.available_count > 0,
                "count": cache.available_count,
                "price_per_hour": cache.price_per_hour,
                "regions": json.loads(cache.regions) if cache.regions else [],
                "cached": True,
                "checked_at": cache.checked_at.isoformat()
            }
        
        return None
    
    async def _fetch_availability(
        self,
        provider: str,
        gpu_type: str
    ) -> dict:
        """Fetch fresh availability from provider"""
        try:
            adapter = ProviderManager.get_adapter(provider, self.session)
            
            # Call provider-specific availability check
            availability = await adapter.check_gpu_availability(gpu_type)
            
            return {
                "available": availability.get("available", False),
                "count": availability.get("count", 0),
                "price_per_hour": availability.get("price", 0),
                "regions": availability.get("regions", []),
                "cached": False,
                "checked_at": datetime.utcnow().isoformat()
            }
        except Exception as e:
            raise Exception(f"Failed to fetch availability from {provider}: {e}")
    
    def _cache_availability(
        self,
        provider: str,
        gpu_type: str,
        data: dict
    ):
        """Cache availability data"""
        # Delete old cache entries for this provider+gpu
        statement = select(GPUAvailabilityCache).where(
            GPUAvailabilityCache.provider == provider,
            GPUAvailabilityCache.gpu_type == gpu_type
        )
        old_cache = self.session.exec(statement).first()
        if old_cache:
            self.session.delete(old_cache)
        
        # Create new cache entry
        cache = GPUAvailabilityCache(
            provider=provider,
            gpu_type=gpu_type,
            available_count=data["count"],
            price_per_hour=data["price_per_hour"],
            regions=json.dumps(data["regions"]),
            checked_at=datetime.utcnow(),
            expires_at=datetime.utcnow() + self.cache_ttl
        )
        
        self.session.add(cache)
        self.session.commit()
    
    def get_gpu_alternatives(
        self,
        gpu_type: str
    ) -> List[dict]:
        """Get alternative GPU recommendations"""
        # Load from gpu_performance.json
        json_path = os.path.join(
            os.path.dirname(__file__),
            "../data/gpu_performance.json"
        )
        
        try:
            with open(json_path, "r") as f:
                gpu_data = json.load(f)
            
            if gpu_type in gpu_data:
                return gpu_data[gpu_type].get("alternatives", [])
        except Exception as e:
            print(f"[WARNING] Failed to load GPU alternatives: {e}")
        
        return []
    
    def clear_expired_cache(self):
        """Clear expired cache entries (can be run periodically)"""
        statement = select(GPUAvailabilityCache).where(
            GPUAvailabilityCache.expires_at < datetime.utcnow()
        )
        expired = self.session.exec(statement).all()
        
        for cache in expired:
            self.session.delete(cache)
        
        self.session.commit()
        return len(expired)
