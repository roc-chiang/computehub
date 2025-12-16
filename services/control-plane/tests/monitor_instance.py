"""
持续监控 RunPod 实例状态
每 10 秒检查一次，直到状态变为 running
"""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.adapters.runpod_adapter import RunPodAdapter
import asyncio
import time

async def monitor_instance(instance_id, max_wait=300):
    adapter = RunPodAdapter()
    
    print(f"🔍 开始监控实例: {instance_id}")
    print(f"⏱️  最长等待时间: {max_wait} 秒")
    print("=" * 60)
    
    start_time = time.time()
    check_count = 0
    
    while True:
        check_count += 1
        elapsed = int(time.time() - start_time)
        
        try:
            status_info = await adapter.get_status(instance_id)
            status = status_info.get('status')
            endpoint = status_info.get('endpoint')
            
            print(f"\n[{elapsed}s] 检查 #{check_count}")
            print(f"  状态: {status}")
            print(f"  端点: {endpoint or '无'}")
            
            if status == 'running':
                print("\n✅ 实例已启动!")
                print(f"   总耗时: {elapsed} 秒")
                if endpoint:
                    print(f"   访问地址: {endpoint}")
                break
            elif status == 'error' or status == 'ERROR':
                print("\n❌ 实例启动失败!")
                break
            
            if elapsed >= max_wait:
                print(f"\n⚠️  超时: 已等待 {max_wait} 秒")
                print("   实例可能创建失败，请检查 RunPod 控制台")
                break
            
            # 等待 10 秒再检查
            await asyncio.sleep(10)
            
        except Exception as e:
            print(f"\n❌ 查询失败: {str(e)}")
            break
    
    print("=" * 60)

if __name__ == "__main__":
    instance_id = sys.argv[1] if len(sys.argv) > 1 else "9fusdl3dud1xq8"
    asyncio.run(monitor_instance(instance_id))
