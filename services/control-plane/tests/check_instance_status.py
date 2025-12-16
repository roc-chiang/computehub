"""
手动查询 RunPod 实例状态
"""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.adapters.runpod_adapter import RunPodAdapter
import asyncio

async def check_instance(instance_id):
    adapter = RunPodAdapter()
    
    print(f"查询实例: {instance_id}")
    print("=" * 60)
    
    try:
        status_info = await adapter.get_status(instance_id)
        print(f"状态: {status_info.get('status')}")
        print(f"端点: {status_info.get('endpoint')}")
        
        if status_info.get('status') == 'creating':
            print("\n⏳ 实例还在创建中，这是正常的")
            print("   通常需要 1-3 分钟")
            print("   前端会每 5 秒自动刷新")
        elif status_info.get('status') == 'running':
            print("\n✅ 实例已经运行!")
            print(f"   可以访问: {status_info.get('endpoint')}")
    except Exception as e:
        print(f"❌ 查询失败: {str(e)}")
    
    print("=" * 60)

if __name__ == "__main__":
    # 从命令行参数获取 instance_id
    if len(sys.argv) > 1:
        instance_id = sys.argv[1]
    else:
        instance_id = "9fusdl3dud1xq8"  # 默认使用日志中的 ID
    
    asyncio.run(check_instance(instance_id))
