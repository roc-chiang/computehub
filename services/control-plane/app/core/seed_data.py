"""
Database seeding script for initial data
"""
from sqlmodel import Session, select
from app.core.models import DeploymentTemplate, TemplateCategory
from datetime import datetime


def seed_official_templates(session: Session):
    """
    Seed official deployment templates if they don't exist
    """
    # Check if we already have official templates
    existing = session.exec(
        select(DeploymentTemplate).where(DeploymentTemplate.is_official == True)
    ).first()
    
    if existing:
        print("[Seed] Official templates already exist, skipping...")
        return
    
    print("[Seed] Creating official templates...")
    
    official_templates = [
        {
            "name": "PyTorch Training",
            "description": "Pre-configured environment for PyTorch deep learning training with CUDA support",
            "category": TemplateCategory.MACHINE_LEARNING,
            "docker_image": "pytorch/pytorch:2.1.0-cuda12.1-cudnn8-runtime",
            "gpu_type": "RTX 4090",
            "gpu_count": 1,
            "disk_size_gb": 50,
            "container_disk_size_gb": 20,
            "volume_mount_path": "/workspace",
            "ports": "8888:8888,6006:6006",
            "env_vars": "JUPYTER_ENABLE_LAB=yes",
            "docker_args": "--shm-size=8g",
            "is_official": True,
            "is_public": True,
            "usage_count": 0,
        },
        {
            "name": "TensorFlow Training",
            "description": "TensorFlow environment optimized for GPU training with Jupyter notebook",
            "category": TemplateCategory.MACHINE_LEARNING,
            "docker_image": "tensorflow/tensorflow:2.14.0-gpu-jupyter",
            "gpu_type": "RTX 4090",
            "gpu_count": 1,
            "disk_size_gb": 50,
            "container_disk_size_gb": 20,
            "volume_mount_path": "/tf",
            "ports": "8888:8888",
            "env_vars": "JUPYTER_ENABLE_LAB=yes",
            "docker_args": "--shm-size=8g",
            "is_official": True,
            "is_public": True,
            "usage_count": 0,
        },
        {
            "name": "Stable Diffusion WebUI",
            "description": "AUTOMATIC1111 Stable Diffusion WebUI for AI image generation",
            "category": TemplateCategory.AI_INFERENCE,
            "docker_image": "universonic/stable-diffusion-webui:latest",
            "gpu_type": "RTX 4090",
            "gpu_count": 1,
            "disk_size_gb": 100,
            "container_disk_size_gb": 50,
            "volume_mount_path": "/workspace",
            "ports": "7860:7860",
            "env_vars": "CLI_ARGS=--xformers --api",
            "docker_args": "--shm-size=8g",
            "is_official": True,
            "is_public": True,
            "usage_count": 0,
        },
        {
            "name": "ComfyUI",
            "description": "ComfyUI node-based interface for Stable Diffusion workflows",
            "category": TemplateCategory.AI_INFERENCE,
            "docker_image": "yanwk/comfyui-boot:latest",
            "gpu_type": "RTX 4090",
            "gpu_count": 1,
            "disk_size_gb": 80,
            "container_disk_size_gb": 40,
            "volume_mount_path": "/workspace",
            "ports": "8188:8188",
            "env_vars": "",
            "docker_args": "--shm-size=8g",
            "is_official": True,
            "is_public": True,
            "usage_count": 0,
        },
        {
            "name": "Jupyter Data Science",
            "description": "Complete data science environment with Jupyter, pandas, scikit-learn, and more",
            "category": TemplateCategory.DATA_SCIENCE,
            "docker_image": "jupyter/datascience-notebook:latest",
            "gpu_type": "RTX 3090",
            "gpu_count": 1,
            "disk_size_gb": 30,
            "container_disk_size_gb": 15,
            "volume_mount_path": "/home/jovyan/work",
            "ports": "8888:8888",
            "env_vars": "JUPYTER_ENABLE_LAB=yes",
            "docker_args": "",
            "is_official": True,
            "is_public": True,
            "usage_count": 0,
        },
        {
            "name": "LLM Inference (vLLM)",
            "description": "High-performance LLM inference server using vLLM",
            "category": TemplateCategory.AI_INFERENCE,
            "docker_image": "vllm/vllm-openai:latest",
            "gpu_type": "A100",
            "gpu_count": 1,
            "disk_size_gb": 100,
            "container_disk_size_gb": 50,
            "volume_mount_path": "/workspace",
            "ports": "8000:8000",
            "env_vars": "",
            "docker_args": "--shm-size=16g",
            "is_official": True,
            "is_public": True,
            "usage_count": 0,
        },
        {
            "name": "CUDA Development",
            "description": "NVIDIA CUDA development environment with compilers and tools",
            "category": TemplateCategory.DEVELOPMENT,
            "docker_image": "nvidia/cuda:12.1.0-devel-ubuntu22.04",
            "gpu_type": "RTX 4090",
            "gpu_count": 1,
            "disk_size_gb": 40,
            "container_disk_size_gb": 20,
            "volume_mount_path": "/workspace",
            "ports": "22:22",
            "env_vars": "",
            "docker_args": "",
            "is_official": True,
            "is_public": True,
            "usage_count": 0,
        },
        {
            "name": "Blender Rendering",
            "description": "Blender 3D rendering with GPU acceleration",
            "category": TemplateCategory.RENDERING,
            "docker_image": "nytimes/blender:latest",
            "gpu_type": "RTX 3090",
            "gpu_count": 1,
            "disk_size_gb": 50,
            "container_disk_size_gb": 25,
            "volume_mount_path": "/workspace",
            "ports": "",
            "env_vars": "",
            "docker_args": "",
            "is_official": True,
            "is_public": True,
            "usage_count": 0,
        },
    ]
    
    for template_data in official_templates:
        template = DeploymentTemplate(**template_data)
        session.add(template)
    
    session.commit()
    print(f"[Seed] Created {len(official_templates)} official templates")


def seed_database(session: Session):
    """
    Main seeding function - add all seed functions here
    """
    seed_official_templates(session)
