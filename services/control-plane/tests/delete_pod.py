"""
删除失败的 RunPod 实例
"""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.adapters.runpod_adapter import RunPodAdapter
import asyncio

async def delete_pod(instance_id):
    adapter = RunPodAdapter()
    
    print(f"删除实例: {instance_id}")
    
    try:
        result = await adapter.delete_instance(instance_id)
        if result:
            print("✅ 删除成功!")
        else:
            print("❌ 删除失败")
    except Exception as e:
        print(f"❌ 错误: {str(e)}")

if __name__ == "__main__":
    instance_id = sys.argv[1] if len(sys.argv) > 1 else "9fusdl3dud1xq8"
    asyncio.run(delete_pod(instance_id))
