"""
测试 RunPod API Key 是否正确加载
"""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.core.config import settings

print("=" * 60)
print("配置检查")
print("=" * 60)
print(f"RUNPOD_API_KEY 是否配置: {'是' if settings.RUNPOD_API_KEY else '否'}")
if settings.RUNPOD_API_KEY:
    print(f"API Key 长度: {len(settings.RUNPOD_API_KEY)}")
    print(f"API Key 前10位: {settings.RUNPOD_API_KEY[:10]}...")
else:
    print("⚠️  警告: RUNPOD_API_KEY 未配置!")
print("=" * 60)
