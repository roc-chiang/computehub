import asyncio
import uuid
from typing import Dict, Any, Optional
from app.adapters.base import ProviderAdapter

class LocalAdapter(ProviderAdapter):
    """
    A mock adapter that simulates GPU provisioning locally without actual resources.
    """
    
    def __init__(self):
        self.instances = {}

    async def create_instance(
        self, 
        deployment_id: str, 
        gpu_type: str, 
        image: str,
        template_type: str = None,
        env: Dict[str, str] = None
    ) -> Dict[str, Any]:
        """
        Create a local mock instance
        Supports template_type for endpoint URL generation
        """
        from app.core.template_config import get_template_port
        
        instance_id = f"local-{uuid.uuid4().hex[:8]}"
        
        # Get port from template configuration
        port_config = get_template_port(template_type or "custom-docker")
        port = port_config["port"]
        
        self.instances[instance_id] = {
            "status": "running",  # Local instances start immediately
            "endpoint": f"http://localhost:{port}"
        }
        
        return {
            "instance_id": instance_id,
            "status": "running",
            "endpoint_url": f"http://localhost:{port}",
            "exposed_port": port
        }

    async def get_status(self, instance_id: str, exposed_port: int = 8080) -> Dict[str, Any]:
        """
        Get status of local mock instance
        """
        return {
            "status": "running",
            "endpoint": f"http://localhost:{exposed_port}",
            "ssh_connection_string": None
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
    
    async def get_pricing(self, gpu_type: str) -> Optional[float]:
        """Mock pricing - always returns 0 for local"""
        return 0.0
    
    async def get_logs(
        self, 
        instance_id: str, 
        lines: int = 100,
        since: Optional[Any] = None
    ) -> list[str]:
        """Get mock logs for local adapter."""
        from datetime import datetime
        
        mock_logs = [
            f"[{datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')}] Local container started",
            f"[{datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')}] Service ready on localhost",
        ]
        
        if since:
            return [f"[{datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')}] Processing..."]
        
        return mock_logs[-lines:]
    
    async def get_metrics(self, instance_id: str) -> Dict[str, Any]:
        """Get mock metrics for local adapter."""
        import random
        
        return {
            "gpu_utilization": random.uniform(50, 75),
            "gpu_memory_utilization": random.uniform(45, 70),
            "cpu_utilization": random.uniform(20, 40),
            "ram_utilization": random.uniform(30, 60),
            "network_rx_bytes": random.randint(500000, 5000000),
            "network_tx_bytes": random.randint(250000, 2500000)
        }
