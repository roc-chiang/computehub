"""
测试 RunPod 适配器
运行方式: python tests/test_runpod.py
"""
import asyncio
import sys
from pathlib import Path

# 添加父目录到 Python 路径
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.adapters.runpod_adapter import RunPodAdapter

async def test_runpod():
    print("=" * 60)
    print("RunPod 适配器测试")
    print("=" * 60)
    
    adapter = RunPodAdapter()
    
    # 测试 1: 创建实例
    print("\n[1] 测试创建 GPU 实例...")
    try:
        result = await adapter.create_instance(
            deployment_id="test-001",
            gpu_type="RTX4090",
            image="runpod/pytorch:2.0.1-py3.10-cuda11.8.0-devel",
            env={"JUPYTER_PASSWORD": "test123"}
        )
        print(f"✅ 创建成功!")
        print(f"   Instance ID: {result['instance_id']}")
        print(f"   Status: {result['status']}")
        instance_id = result['instance_id']
    except Exception as e:
        print(f"❌ 创建失败: {str(e)}")
        return
    
    # 测试 2: 查询状态
    print(f"\n[2] 测试查询实例状态...")
    try:
        await asyncio.sleep(3)  # 等待 3 秒
        status = await adapter.get_status(instance_id)
        print(f"✅ 查询成功!")
        print(f"   Status: {status['status']}")
        print(f"   Endpoint: {status.get('endpoint', 'N/A')}")
    except Exception as e:
        print(f"❌ 查询失败: {str(e)}")
    
    # 测试 3: 删除实例
    print(f"\n[3] 测试删除实例...")
    confirm = input("⚠️  确认删除实例? (y/n): ")
    if confirm.lower() == 'y':
        try:
            success = await adapter.delete_instance(instance_id)
            if success:
                print(f"✅ 删除成功!")
            else:
                print(f"❌ 删除失败")
        except Exception as e:
            print(f"❌ 删除失败: {str(e)}")
    else:
        print(f"⚠️  跳过删除，请手动在 RunPod 控制台删除实例: {instance_id}")
    
    print("\n" + "=" * 60)
    print("测试完成")
    print("=" * 60)

if __name__ == "__main__":
    asyncio.run(test_runpod())
