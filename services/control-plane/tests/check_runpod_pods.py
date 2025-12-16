"""
检查 RunPod 运行中的实例
"""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.adapters.runpod_adapter import RunPodAdapter
import asyncio

async def check_pods():
    adapter = RunPodAdapter()
    
    # 使用 GraphQL 查询所有 pods
    query = """
    query {
      myself {
        pods {
          id
          name
          desiredStatus
          runtime {
            uptimeInSeconds
          }
        }
      }
    }
    """
    
    import httpx
    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.post(
            adapter.api_url,
            headers=adapter.headers,
            json={"query": query}
        )
        data = response.json()
        
        if "errors" in data:
            print(f"❌ 错误: {data['errors']}")
            return
        
        pods = data.get("data", {}).get("myself", {}).get("pods", [])
        
        print("=" * 60)
        print("RunPod 实例列表")
        print("=" * 60)
        
        if not pods:
            print("✅ 没有运行中的实例")
        else:
            for pod in pods:
                status = pod.get("desiredStatus", "unknown")
                uptime = pod.get("runtime", {}).get("uptimeInSeconds", 0) if pod.get("runtime") else 0
                print(f"\n📦 Pod ID: {pod['id']}")
                print(f"   名称: {pod['name']}")
                print(f"   状态: {status}")
                if uptime:
                    print(f"   运行时长: {uptime // 60} 分钟")
                
                if status == "RUNNING":
                    print(f"   ⚠️  警告: 此实例正在运行并计费!")
        
        print("\n" + "=" * 60)

if __name__ == "__main__":
    asyncio.run(check_pods())
