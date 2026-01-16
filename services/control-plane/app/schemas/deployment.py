from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from app.core.models import DeploymentStatus, ProviderType

class DeploymentCreate(BaseModel):
    name: str
    provider: ProviderType = ProviderType.LOCAL
    gpu_type: str
    image: str
    gpu_count: int = 1
    template_type: Optional[str] = None  # Template identifier (e.g., "image-generation")
    # Team Collaboration (Phase 14+)
    organization_id: Optional[int] = None
    project_id: Optional[int] = None

class DeploymentRead(BaseModel):
    id: int
    user_id: int
    name: str
    provider: ProviderType
    status: DeploymentStatus
    gpu_type: str
    gpu_count: int
    endpoint_url: Optional[str] = None
    ssh_connection_string: Optional[str] = None
    ssh_password: Optional[str] = None
    instance_id: Optional[str] = None
    image: str
    template_type: Optional[str] = None
    exposed_port: Optional[int] = None
    # Configuration details
    vcpu_count: Optional[int] = None
    ram_gb: Optional[int] = None
    storage_gb: Optional[int] = None
    # Runtime information
    uptime_seconds: Optional[int] = None
    gpu_utilization: Optional[int] = None
    gpu_memory_utilization: Optional[int] = None
    # Team Collaboration (Phase 14+)
    organization_id: Optional[int] = None
    project_id: Optional[int] = None
    organization_name: Optional[str] = None
    project_name: Optional[str] = None
    created_at: datetime
    updated_at: datetime
