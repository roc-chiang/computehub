from abc import ABC, abstractmethod
from typing import Dict, Any, Optional

class ProviderAdapter(ABC):
    @abstractmethod
    async def create_instance(self, deployment_id: str, gpu_type: str, image: str, env: Dict[str, str] = None) -> Dict[str, Any]:
        """
        Create a GPU instance.
        Returns a dict containing 'instance_id' and initial 'status'.
        """
        pass

    @abstractmethod
    async def get_status(self, instance_id: str) -> Dict[str, Any]:
        """
        Get the status of an instance.
        Returns a dict containing 'status' and optionally 'endpoint_url'.
        """
        pass

    @abstractmethod
    async def delete_instance(self, instance_id: str) -> bool:
        """
        Delete an instance.
        Returns True if successful.
        """
        pass
    
    @abstractmethod
    async def stop_instance(self, instance_id: str) -> bool:
        """Stop instance (keep data, stop billing)"""
        pass
    
    @abstractmethod
    async def start_instance(self, instance_id: str) -> bool:
        """Start a stopped instance"""
        pass
    
    @abstractmethod
    async def restart_instance(self, instance_id: str) -> bool:
        """Restart a running instance"""
        pass
    
    @abstractmethod
    async def get_pricing(self, gpu_type: str) -> Optional[float]:
        """
        Get current price per hour for the given GPU type.
        Returns None if unavailable or if there's an error.
        """
        pass


class ProviderAdapterTemplate(ProviderAdapter):
    """
    Template base class for provider adapters with standardized availability checking.
    
    New providers only need to implement 3 methods:
    1. _fetch_availability_data() - Call provider API
    2. _parse_availability_response() - Parse API response
    3. _map_gpu_type() - Map GPU type to provider format
    
    Example:
        class NewProviderAdapter(ProviderAdapterTemplate):
            async def _fetch_availability_data(self, gpu_type: str):
                return await self.get(f"/api/gpu/{gpu_type}/availability")
            
            def _parse_availability_response(self, data: dict):
                return {
                    "available": data["in_stock"],
                    "count": data["available_count"],
                    "price": data["price_per_hour"],
                    "regions": data["regions"]
                }
            
            def _map_gpu_type(self, gpu_type: str):
                return GPU_TYPE_MAPPING.get(gpu_type, gpu_type)
    """
    
    async def check_gpu_availability(self, gpu_type: str) -> Dict[str, Any]:
        """
        Check GPU availability (standardized implementation)
        
        Returns:
        {
            "available": bool,
            "count": int,
            "price": float,
            "regions": List[str]
        }
        """
        try:
            # Step 1: Map GPU type to provider format
            mapped_gpu = self._map_gpu_type(gpu_type)
            
            # Step 2: Fetch data from provider API
            raw_data = await self._fetch_availability_data(mapped_gpu)
            
            # Step 3: Parse and return standardized response
            return self._parse_availability_response(raw_data)
            
        except Exception as e:
            print(f"[{self.__class__.__name__}] Availability check failed: {e}")
            raise Exception(f"{self.__class__.__name__} availability check failed: {e}")
    
    # ===== Methods to implement in subclasses =====
    
    @abstractmethod
    async def _fetch_availability_data(self, gpu_type: str) -> Any:
        """
        Fetch availability data from provider API
        
        Args:
            gpu_type: GPU type in provider format (already mapped)
        
        Returns:
            Raw API response data
        """
        pass
    
    @abstractmethod
    def _parse_availability_response(self, data: Any) -> Dict[str, Any]:
        """
        Parse provider API response into standardized format
        
        Args:
            data: Raw API response
        
        Returns:
            {
                "available": bool,
                "count": int,
                "price": float,
                "regions": List[str]
            }
        """
        pass
    
    @abstractmethod
    def _map_gpu_type(self, gpu_type: str) -> str:
        """
        Map generic GPU type to provider-specific format
        
        Args:
            gpu_type: Generic GPU type (e.g., "RTX 4090")
        
        Returns:
            Provider-specific GPU type (e.g., "NVIDIA GeForce RTX 4090")
        """
        pass
