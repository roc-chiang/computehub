"""
Template Configuration
Defines port mappings and settings for different deployment templates
"""

TEMPLATE_PORTS = {
    "image-generation": {
        "port": 7860,
        "protocol": "http",
        "path": "/",
        "description": "Stable Diffusion WebUI"
    },
    "llm-inference": {
        "port": 8000,
        "protocol": "http", 
        "path": "/docs",
        "description": "vLLM / FastAPI Server"
    },
    "comfyui": {
        "port": 8188,
        "protocol": "http",
        "path": "/",
        "description": "ComfyUI Web Interface"
    },
    "jupyter": {
        "port": 8888,
        "protocol": "http",
        "path": "/lab",
        "description": "Jupyter Lab"
    },
    "custom-docker": {
        "port": 8080,
        "protocol": "http",
        "path": "/",
        "description": "Custom Application"
    }
}

def get_template_port(template_type: str) -> dict:
    """
    Get port configuration for a template type
    
    Args:
        template_type: Template identifier (e.g., "image-generation")
        
    Returns:
        Dict with port, protocol, path, description
        Returns default config if template not found
    """
    return TEMPLATE_PORTS.get(template_type, {
        "port": 8080,
        "protocol": "http",
        "path": "/",
        "description": "Application"
    })

def get_endpoint_url(base_url: str, template_type: str) -> str:
    """
    Generate full endpoint URL with path
    
    Args:
        base_url: Base URL from provider (e.g., "https://abc-7860.runpod.net")
        template_type: Template identifier
        
    Returns:
        Full URL with path (e.g., "https://abc-7860.runpod.net/lab")
    """
    config = get_template_port(template_type)
    path = config.get("path", "/")
    
    # Remove trailing slash from base_url
    base_url = base_url.rstrip("/")
    
    # Add path
    if path != "/":
        return f"{base_url}{path}"
    return base_url
