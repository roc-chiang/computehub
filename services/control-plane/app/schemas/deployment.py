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
    # Configuration details
    vcpu_count: Optional[int] = None
    ram_gb: Optional[int] = None
    storage_gb: Optional[int] = None
    # Runtime information
    uptime_seconds: Optional[int] = None
    gpu_utilization: Optional[int] = None
    gpu_memory_utilization: Optional[int] = None
    created_at: datetime
    updated_at: datetime
