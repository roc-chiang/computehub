import httpx
import json
import urllib.parse
from typing import Dict, Any, Optional, List
from app.adapters.base import ProviderAdapter
from app.core.config import settings

class VastAdapter(ProviderAdapter):
    """
    Vast.ai GPU Adapter
    API Docs: https://console.vast.ai/api/v0/
    """
    
    def __init__(self, api_key: Optional[str] = None, config: Optional[Dict[str, Any]] = None):
        self.api_key = api_key or settings.VAST_API_KEY
        self.api_url = "https://console.vast.ai/api/v0"
        self.headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {self.api_key}"
        }
        self.config = config or {}
    
    async def create_instance(
        self, 
        deployment_id: str, 
        gpu_type: str, 
        image: str, 
        env: Dict[str, str] = None
    ) -> Dict[str, Any]:
        """
        Create (Rent) a Vast.ai instance
        1. Search for offers.
        2. Rent the best (cheapest/verified) one.
        """
        if not self.api_key:
            raise ValueError("VAST_API_KEY not configured")
            
        # 1. Search for offers
        # Query format: URL encoded JSON string in 'q' parameter
        # GPU Name mapping might be needed if user passes "RTX4090" but Vast expects "RTX 4090"
        vast_gpu_name = gpu_type.replace("RTX", "RTX ") if "RTX" in gpu_type and "RTX " not in gpu_type else gpu_type
        
        query = {
            "verified": {"eq": True},
            "rentable": {"eq": True},
            "gpu_name": {"eq": vast_gpu_name},
            "num_gpus": {"eq": 1},
            "disk_space": {"gte": 20.0},
            "external": {"eq": False},
            "order": [["dph_total", "asc"]] # Sort by price/hour ascending
        }
        
        query_str = urllib.parse.quote(json.dumps(query))
        
        try:
            async with httpx.AsyncClient(timeout=30.0, follow_redirects=True) as client:
                # Search
                search_url = f"{self.api_url}/bundles?q={query_str}"
                search_res = await client.get(search_url, headers=self.headers)
                search_res.raise_for_status()
                offers = search_res.json().get("offers", [])
                
                if not offers:
                    # Try relaxed search (unverified)
                    query["verified"] = {"eq": False}
                    query_str = urllib.parse.quote(json.dumps(query))
                    search_url = f"{self.api_url}/bundles?q={query_str}"
                    search_res = await client.get(search_url, headers=self.headers)
                    offers = search_res.json().get("offers", [])
                
                if not offers:
                    raise Exception(f"No available Vast.ai offers found for {gpu_type}")
                
                # Pick the first one (cheapest due to sort)
                best_offer = offers[0]
                ask_id = best_offer["id"]
                price = best_offer["dph_total"]
                
                print(f"[VastAdapter] Selected offer {ask_id}, price: ${price}/hr, Machine: {best_offer.get('machine_id')}")

                # 2. Rent Instance
                # PUT /asks/{id}/
                rent_url = f"{self.api_url}/asks/{ask_id}/"
                rent_payload = {
                    "image": image,
                    "disk": 20.0,
                    "env": env or {},
                    "args_str": "", # Docker args
                    "onstart": "",  # On-start script
                    "runtype": "ssh", # Use SSH
                }
                
                print(f"[VastAdapter] Renting {ask_id} with payload: {rent_payload}")
                
                try:
                    rent_res = await client.put(rent_url, headers=self.headers, json=rent_payload)
                    rent_res.raise_for_status()
                except httpx.HTTPStatusError as e:
                    print(f"[VastAdapter] Rent failed. Status: {e.response.status_code}")
                    print(f"[VastAdapter] Response: {e.response.text}")
                    raise Exception(f"Vast API Error ({e.response.status_code}): {e.response.text}")
                
                rent_data = rent_res.json()
                
                if not rent_data.get("success"):
                     raise Exception(f"Vast rent failed: {rent_data}")
                
                new_instance_id = rent_data.get("new_contract")
                
                return {
                    "instance_id": str(new_instance_id),
                    "status": "creating"
                }

        except httpx.HTTPError as e:
            # Check if we already handled it as HTTPStatusError
            if isinstance(e, httpx.HTTPStatusError):
                raise
            raise Exception(f"Vast API Error: {str(e)}")

    async def get_status(self, instance_id: str) -> Dict[str, Any]:
        """
        Get instance status by listing all instances and finding matching ID.
        """
        if not self.api_key:
            raise ValueError("VAST_API_KEY not configured")
        
        try:
            async with httpx.AsyncClient(timeout=30.0, follow_redirects=True) as client:
                # Vast doesn't have a reliable single-instance GET endpoint docs-wise, 
                # but /instances returns all current rentals.
                res = await client.get(f"{self.api_url}/instances", headers=self.headers)
                res.raise_for_status()
                instances = res.json().get("instances", [])
                
                # Find our instance
                instance = next((i for i in instances if str(i.get("id")) == str(instance_id)), None)
                
                if not instance:
                    return {
                        "status": "deleted", 
                        "endpoint": None, 
                        "ssh_connection_string": None
                    }
                
                # Parse status
                # actual_status: 'running', 'loading', 'creating', 'stopped'
                actual_status = instance.get("actual_status", "unknown").lower()
                status = "unknown"
                
                if actual_status == "running":
                    status = "running"
                elif actual_status in ["loading", "creating", "launching"]:
                    status = "creating"
                elif actual_status in ["stopped", "exited"]:
                    status = "stopped"
                else:
                    status = "error" # or creating?
                
                # Extract Ports
                # Vast provides SSH info directly
                ssh_host = instance.get("ssh_host")
                ssh_port = instance.get("ssh_port")
                ssh_connection_string = None
                if ssh_host and ssh_port:
                    ssh_connection_string = f"ssh root@{ssh_host} -p {ssh_port}"
                
                # Find Jupyter Port (usually mapped from 8888)
                endpoint = None
                ports = instance.get("ports", {})
                # ports structure in Vast json is sometimes dict: {"8888/tcp": [{"HostIp": "...", "HostPort": "..."}]}
                # Or sometimes just list. Need to be robust. 
                # Vast usually exposes direct port mapping.
                # If we don't find 8888 mapping, we rely on SSH tunneling or check docs.
                # For now, MVP: Just implement SSH. Jupyter URL construction requires knowing the mapped port.
                
                # Try to find mapping for 8888
                # Vast 'ports' field is not always populated in the text summary object.
                # However, instance object usually has 'port_mappings'.
                # Let's check keys.
                
                return {
                    "status": status,
                    "endpoint": endpoint, # To be implemented if we can parse port 8888 mapping
                    "ssh_connection_string": ssh_connection_string,
                    "uptime_seconds": instance.get("uptime", 0),
                    "vcpu_count": instance.get("cpu_cores"),
                    "ram_gb": instance.get("cpu_ram") / 1024 if instance.get("cpu_ram") else 0,
                    "storage_gb": instance.get("disk_space"),
                    "gpu_utilization": instance.get("gpu_util"), 
                    "gpu_memory_utilization": None # Vast might check this
                }

        except httpx.HTTPError as e:
            raise Exception(f"Failed to get Vast status: {str(e)}")

    async def delete_instance(self, instance_id: str) -> bool:
        if not self.api_key:
            raise ValueError("VAST_API_KEY not configured")
            
        try:
            async with httpx.AsyncClient(timeout=30.0, follow_redirects=True) as client:
                res = await client.delete(f"{self.api_url}/instances/{instance_id}/", headers=self.headers)
                res.raise_for_status()
                return True
        except httpx.HTTPError as e:
             raise Exception(f"Failed to delete Vast instance: {str(e)}")

    async def stop_instance(self, instance_id: str) -> bool:
        if not self.api_key:
            raise ValueError("VAST_API_KEY not configured")
        
        try:
            async with httpx.AsyncClient(timeout=30.0, follow_redirects=True) as client:
                res = await client.put(f"{self.api_url}/instances/{instance_id}/stop/", headers=self.headers, json={})
                res.raise_for_status()
                return True
        except httpx.HTTPError as e:
             raise Exception(f"Failed to stop Vast instance: {str(e)}")
             
    async def start_instance(self, instance_id: str) -> bool:
        if not self.api_key:
            raise ValueError("VAST_API_KEY not configured")
        
        try:
            async with httpx.AsyncClient(timeout=30.0, follow_redirects=True) as client:
                res = await client.put(f"{self.api_url}/instances/{instance_id}/start/", headers=self.headers, json={})
                res.raise_for_status()
                return True
        except httpx.HTTPError as e:
             raise Exception(f"Failed to start Vast instance: {str(e)}")

    async def restart_instance(self, instance_id: str) -> bool:
         # Vast allows reboot
        if not self.api_key:
            raise ValueError("VAST_API_KEY not configured")
        
        try:
            async with httpx.AsyncClient(timeout=30.0, follow_redirects=True) as client:
                res = await client.put(f"{self.api_url}/instances/{instance_id}/reboot/", headers=self.headers, json={})
                res.raise_for_status()
                return True
        except httpx.HTTPError as e:
             raise Exception(f"Failed to restart Vast instance: {str(e)}")
    
    async def get_pricing(self, gpu_type: str) -> Optional[float]:
        """
        Get current price per hour for the given GPU type from Vast.ai.
        Uses the same search logic as create_instance to find cheapest available offer.
        Falls back to static pricing if API call fails.
        """
        if not self.api_key:
            return self._get_fallback_price(gpu_type)
        
        # Map GPU type (same as in create_instance)
        vast_gpu_name = gpu_type.replace("RTX", "RTX ") if "RTX" in gpu_type and "RTX " not in gpu_type else gpu_type
        
        query = {
            "verified": {"eq": True},
            "rentable": {"eq": True},
            "gpu_name": {"eq": vast_gpu_name},
            "num_gpus": {"eq": 1},
            "disk_space": {"gte": 20.0},
            "external": {"eq": False},
            "order": [["dph_total", "asc"]]  # Sort by price/hour ascending
        }
        
        query_str = urllib.parse.quote(json.dumps(query))
        
        try:
            async with httpx.AsyncClient(timeout=10.0, follow_redirects=True) as client:
                search_url = f"{self.api_url}/bundles?q={query_str}"
                search_res = await client.get(search_url, headers=self.headers)
                
                if not search_res.is_success:
                    print(f"[VastAdapter] API call failed, using fallback pricing")
                    return self._get_fallback_price(gpu_type)
                
                offers = search_res.json().get("offers", [])
                
                if not offers:
                    # Try relaxed search (unverified)
                    query["verified"] = {"eq": False}
                    query_str = urllib.parse.quote(json.dumps(query))
                    search_url = f"{self.api_url}/bundles?q={query_str}"
                    search_res = await client.get(search_url, headers=self.headers)
                    offers = search_res.json().get("offers", [])
                
                if offers:
                    # Return the cheapest price (first one due to sort)
                    return float(offers[0].get("dph_total", 0))
                
                print(f"[VastAdapter] No offers found, using fallback pricing")
                return self._get_fallback_price(gpu_type)
                
        except Exception as e:
            print(f"[VastAdapter] Failed to get pricing: {e}, using fallback pricing")
            return self._get_fallback_price(gpu_type)
    
    def _get_fallback_price(self, gpu_type: str) -> float:
        """Fallback static pricing for common GPU types"""
        fallback_prices = {
            "RTX4090": 0.59,
            "RTX 4090": 0.59,
            "RTX3090": 0.39,
            "RTX 3090": 0.39,
            "A100": 1.69,
            "A100_SXM": 1.69,
            "H100": 3.79,
            "A6000": 0.69,
            "A5000": 0.49,
        }
        return fallback_prices.get(gpu_type, 0.45)  # Default to $0.45/hr
    
    async def check_gpu_availability(self, gpu_type: str) -> Dict[str, Any]:
        """
        Check GPU availability on Vast.ai
        
        Returns:
        {
            "available": bool,
            "count": int,
            "price": float,
            "regions": List[str]
        }
        """
        if not self.api_key:
            raise ValueError("VAST_API_KEY not configured")
        
        # Convert GPU type to Vast.ai format
        vast_gpu_name = gpu_type.replace("RTX", "RTX ") if "RTX" in gpu_type and "RTX " not in gpu_type else gpu_type
        
        # Search for offers
        query = {
            "verified": {"eq": True},
            "rentable": {"eq": True},
            "gpu_name": {"eq": vast_gpu_name},
            "order": [["dph_total", "asc"]]  # Sort by price ascending
        }
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.api_url}/bundles/",
                    headers=self.headers,
                    json={"q": query, "type": "on-demand"},
                    timeout=10.0
                )
                response.raise_for_status()
                data = response.json()
                
                offers = data.get("offers", [])
                
                if not offers:
                    return {
                        "available": False,
                        "count": 0,
                        "price": 0,
                        "regions": []
                    }
                
                # Get cheapest offer
                cheapest = min(offers, key=lambda x: x.get("dph_total", float('inf')))
                
                # Get unique regions
                regions = list(set(
                    offer.get("geolocation", "Unknown") 
                    for offer in offers 
                    if offer.get("geolocation")
                ))
                
                return {
                    "available": True,
                    "count": len(offers),
                    "price": cheapest.get("dph_total", 0),
                    "regions": regions
                }
                
        except Exception as e:
            print(f"[VastAdapter] Failed to check availability: {e}")
            raise Exception(f"Vast.ai availability check failed: {e}")
