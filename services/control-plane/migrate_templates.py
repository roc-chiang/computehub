"""
Database migration for Phase 13: Deployment Templates

Creates deployment_template table and inserts official templates

Usage:
    python migrate_templates.py
"""

import sqlite3
from pathlib import Path
import json
from datetime import datetime


def get_db_path():
    """Get the database file path"""
    # Use test.db as specified in .env
    if Path('test.db').exists():
        return 'test.db'
    
    # Fallback to finding any .db file
    db_files = list(Path('.').glob('*.db'))
    if db_files:
        return str(db_files[0])
    return 'test.db'  # Default to test.db


# Official Templates Data
OFFICIAL_TEMPLATES = [
    {
        "name": "Llama 3 Inference Server",
        "description": "Run Llama 3 models with vLLM for fast inference. Supports OpenAI-compatible API.",
        "category": "ai-inference",
        "image": "vllm/vllm-openai:latest",
        "gpu_type": "RTX 4090",
        "gpu_count": 1,
        "vcpu_count": 8,
        "ram_gb": 32,
        "storage_gb": 100,
        "exposed_port": 8000,
        "env_vars": {
            "MODEL_NAME": "meta-llama/Llama-3-8B",
            "MAX_MODEL_LEN": "4096",
            "GPU_MEMORY_UTILIZATION": "0.9"
        },
        "readme": """# Llama 3 Inference Server

Run Llama 3 models with vLLM for fast and efficient inference.

## Features
- OpenAI-compatible API
- Fast inference with PagedAttention
- Continuous batching
- Optimized for NVIDIA GPUs

## Usage
Access the API at `http://<your-endpoint>:8000/v1/completions`

## Environment Variables
- `MODEL_NAME`: Hugging Face model name
- `MAX_MODEL_LEN`: Maximum sequence length
- `GPU_MEMORY_UTILIZATION`: GPU memory usage (0.0-1.0)
"""
    },
    {
        "name": "ComfyUI - AI Image Generation",
        "description": "Powerful node-based UI for Stable Diffusion. Create stunning AI images with an intuitive interface.",
        "category": "image-generation",
        "image": "yanwk/comfyui-boot:latest",
        "gpu_type": "RTX 4090",
        "gpu_count": 1,
        "vcpu_count": 4,
        "ram_gb": 16,
        "storage_gb": 50,
        "exposed_port": 8188,
        "env_vars": {
            "CLI_ARGS": "--listen 0.0.0.0"
        },
        "readme": """# ComfyUI

Node-based interface for Stable Diffusion image generation.

## Features
- Intuitive node-based workflow
- Support for SD 1.5, SDXL, and more
- Custom nodes and extensions
- Workflow sharing

## Usage
Access ComfyUI at `http://<your-endpoint>:8188`

## Getting Started
1. Load a workflow or create your own
2. Add models to `/models` directory
3. Generate images!
"""
    },
    {
        "name": "Stable Diffusion WebUI",
        "description": "AUTOMATIC1111 Stable Diffusion WebUI. The most popular SD interface with extensive features.",
        "category": "image-generation",
        "image": "sd-webui/stable-diffusion-webui:latest",
        "gpu_type": "RTX 3090",
        "gpu_count": 1,
        "vcpu_count": 4,
        "ram_gb": 16,
        "storage_gb": 50,
        "exposed_port": 7860,
        "env_vars": {
            "COMMANDLINE_ARGS": "--listen --api --xformers"
        },
        "readme": """# Stable Diffusion WebUI

AUTOMATIC1111's Stable Diffusion WebUI - the most feature-rich SD interface.

## Features
- txt2img and img2img
- Inpainting and outpainting
- ControlNet support
- Extensions marketplace
- API access

## Usage
Access the WebUI at `http://<your-endpoint>:7860`

## Tips
- Use `--xformers` for better performance
- Enable API with `--api` flag
- Install extensions from the Extensions tab
"""
    },
    {
        "name": "Jupyter Lab with GPU",
        "description": "Data science environment with GPU support. Perfect for ML experiments and data analysis.",
        "category": "dev-environment",
        "image": "jupyter/tensorflow-notebook:latest",
        "gpu_type": "RTX 3090",
        "gpu_count": 1,
        "vcpu_count": 4,
        "ram_gb": 16,
        "storage_gb": 50,
        "exposed_port": 8888,
        "env_vars": {
            "JUPYTER_ENABLE_LAB": "yes"
        },
        "readme": """# Jupyter Lab with GPU

Full-featured data science environment with GPU acceleration.

## Features
- Jupyter Lab interface
- TensorFlow and PyTorch pre-installed
- GPU-accelerated computing
- Python data science stack

## Usage
Access Jupyter Lab at `http://<your-endpoint>:8888`

## Included Libraries
- NumPy, Pandas, Matplotlib
- TensorFlow, Keras
- Scikit-learn
- And more!

## Getting Started
1. Create a new notebook
2. Import your libraries
3. Start experimenting!
"""
    }
]


def migrate():
    """Create deployment_template table and insert official templates"""
    db_path = get_db_path()
    print(f"[Migration] Using database: {db_path}")
    
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    try:
        # Create deployment_template table
        print("[Migration] Creating deployment_template table...")
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS deployment_template (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id TEXT,
                name TEXT NOT NULL,
                description TEXT,
                category TEXT NOT NULL DEFAULT 'other',
                image TEXT NOT NULL,
                gpu_type TEXT NOT NULL,
                gpu_count INTEGER NOT NULL DEFAULT 1,
                vcpu_count INTEGER,
                ram_gb INTEGER,
                storage_gb INTEGER,
                exposed_port INTEGER,
                env_vars_json TEXT,
                is_official BOOLEAN NOT NULL DEFAULT 0,
                is_public BOOLEAN NOT NULL DEFAULT 0,
                usage_count INTEGER NOT NULL DEFAULT 0,
                icon_url TEXT,
                preview_image_url TEXT,
                readme TEXT,
                created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        # Create indexes
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_template_user_id ON deployment_template(user_id)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_template_name ON deployment_template(name)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_template_category ON deployment_template(category)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_template_official ON deployment_template(is_official)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_template_public ON deployment_template(is_public)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_template_created ON deployment_template(created_at)")
        
        print("[Migration] ✓ deployment_template table created")
        
        # Check if official templates already exist
        cursor.execute("SELECT COUNT(*) FROM deployment_template WHERE is_official = 1")
        count = cursor.fetchone()[0]
        
        if count > 0:
            print(f"[Migration] Official templates already exist ({count} templates)")
        else:
            # Insert official templates
            print("[Migration] Inserting official templates...")
            
            for template in OFFICIAL_TEMPLATES:
                env_vars_json = json.dumps(template["env_vars"]) if template.get("env_vars") else None
                
                cursor.execute("""
                    INSERT INTO deployment_template (
                        user_id, name, description, category, image,
                        gpu_type, gpu_count, vcpu_count, ram_gb, storage_gb,
                        exposed_port, env_vars_json, is_official, is_public,
                        usage_count, readme, created_at, updated_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    None,  # user_id (null for official)
                    template["name"],
                    template["description"],
                    template["category"],
                    template["image"],
                    template["gpu_type"],
                    template["gpu_count"],
                    template.get("vcpu_count"),
                    template.get("ram_gb"),
                    template.get("storage_gb"),
                    template.get("exposed_port"),
                    env_vars_json,
                    1,  # is_official
                    1,  # is_public
                    0,  # usage_count
                    template.get("readme"),
                    datetime.utcnow().isoformat(),
                    datetime.utcnow().isoformat()
                ))
                
                print(f"  ✓ Inserted: {template['name']}")
        
        conn.commit()
        print("\n[Migration] ✅ Migration completed successfully!")
        
        # Verify
        cursor.execute("SELECT COUNT(*) FROM deployment_template")
        total = cursor.fetchone()[0]
        cursor.execute("SELECT COUNT(*) FROM deployment_template WHERE is_official = 1")
        official = cursor.fetchone()[0]
        
        print(f"\n[Migration] Total templates: {total}")
        print(f"[Migration] Official templates: {official}")
        
    except sqlite3.Error as e:
        print(f"\n[Migration] ❌ Error: {e}")
        conn.rollback()
        raise
    finally:
        conn.close()


if __name__ == "__main__":
    print("=" * 60)
    print("Phase 13: Deployment Templates Migration")
    print("=" * 60)
    migrate()
    print("\n[Migration] Done!")
