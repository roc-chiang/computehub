import asyncio
import sys
import os

# Add the parent directory to sys.path to allow importing app modules
# sys.path.append(os.path.join(os.getcwd(), "services", "control-plane"))

from app.core.provider_manager import ProviderManager
from app.core.models import ProviderType

async def test_local_adapter():
    print("Testing Local Adapter...")
    adapter = ProviderManager.get_adapter(ProviderType.LOCAL)
    
    # Test Create
    print("Creating instance...")
    result = await adapter.create_instance("deploy-123", "GPU-Mock", "image:latest")
    print(f"Create result: {result}")
    instance_id = result["instance_id"]
    
    # Test Get Status
    print(f"Getting status for {instance_id}...")
    status = await adapter.get_status(instance_id)
    print(f"Status result: {status}")
    
    # Test Delete
    print(f"Deleting {instance_id}...")
    deleted = await adapter.delete_instance(instance_id)
    print(f"Delete result: {deleted}")
    
    if result["status"] == "creating" and status["status"] == "running" and deleted:
        print("SUCCESS: Local Adapter test passed.")
    else:
        print("FAILURE: Local Adapter test failed.")

if __name__ == "__main__":
    asyncio.run(test_local_adapter())
