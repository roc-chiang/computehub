import asyncio
import uuid
from typing import Dict, Any
from app.adapters.base import ProviderAdapter

class LocalAdapter(ProviderAdapter):
    """
    A mock adapter that simulates GPU provisioning locally without actual resources.
    """
    
    def __init__(self):
        self.instances = {}

    async def create_instance(self, deployment_id: str, gpu_type: str, image: str, env: Dict[str, str] = None) -> Dict[str, Any]:
        instance_id = f"local-{uuid.uuid4().hex[:8]}"
        self.instances[instance_id] = {
            "status": "creating",
            "endpoint": f"http://localhost:8000/mock-endpoint/{instance_id}"
        }
        # Simulate startup delay in background (in a real app this state would be in DB/Provider)
        # For this mock, we just return 'creating' and let the next get_status call return 'running' 
        # or we can rely on the caller to poll.
        return {
            "instance_id": instance_id,
            "status": "creating"
        }

    async def get_status(self, instance_id: str) -> Dict[str, Any]:
        # Mock logic: always return running if it exists
        # In a real scenario, we might query Docker or a local agent
        return {
            "status": "running",
            "endpoint": f"http://localhost:8000/mock-endpoint/{instance_id}"
        }

    async def delete_instance(self, instance_id: str) -> bool:
        return True
    
    async def stop_instance(self, instance_id: str) -> bool:
        """Mock stop - always succeeds"""
        return True
    
    async def start_instance(self, instance_id: str) -> bool:
        """Mock start - always succeeds"""
        return True
    
    async def restart_instance(self, instance_id: str) -> bool:
        """Mock restart - always succeeds"""
        return True
    
    async def check_gpu_availability(self, gpu_type: str) -> Dict[str, Any]:
        """Mock GPU availability - always available for testing"""
        return {
            "available": True,
            "count": 999,  # Unlimited for local testing
            "price_per_hour": 0.0,  # Free for local testing
            "regions": ["local"]
        }
    
    async def get_pricing(self, gpu_type: str) -> float:
        """Local instances are free"""
        return 0.0
