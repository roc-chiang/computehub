import httpx
import json
from typing import Dict, Any, Optional
from app.adapters.base import ProviderAdapter
from app.core.config import settings

# GPU 类型映射表 / GPU Type Mapping
GPU_TYPE_MAPPING = {
    "RTX4090": "NVIDIA GeForce RTX 4090",
    "RTX 4090": "NVIDIA GeForce RTX 4090",
    "RTX4080": "NVIDIA GeForce RTX 4080",
    "RTX 4080": "NVIDIA GeForce RTX 4080",
    "RTX3090": "NVIDIA GeForce RTX 3090",
    "RTX 3090": "NVIDIA GeForce RTX 3090",
    "A100": "NVIDIA A100 80GB PCIe",
    "A100_SXM": "NVIDIA A100-SXM4-80GB",
    "H100": "NVIDIA H100 PCIe",
    "A6000": "NVIDIA RTX A6000",
    "A5000": "NVIDIA RTX A5000",
}

class RunPodAdapter(ProviderAdapter):
    """
    RunPod GPU 云服务适配器
    文档: https://docs.runpod.io/reference/graphql-api
    """
    
    def __init__(self, api_key: Optional[str] = None, config: Optional[Dict[str, Any]] = None):
        self.api_key = api_key or settings.RUNPOD_API_KEY
        # RunPod API key is passed as URL parameter, not header
        self.api_url = f"https://api.runpod.io/graphql?api_key={self.api_key}"
        self.headers = {
            "Content-Type": "application/json",
        }
        self.config = config or {}
    
    async def create_instance(
        self, 
        deployment_id: str, 
        gpu_type: str, 
        image: str,
        template_type: str = None,
        env: Dict[str, str] = None
    ) -> Dict[str, Any]:
        """
        创建 RunPod GPU 实例
        支持 DRY_RUN 模式用于测试
        """
        # DRY_RUN 模式 - 不调用真实 API
        if settings.DRY_RUN:
            from uuid import uuid4
            from app.core.template_config import get_template_port
            
            mock_id = f"dry-run-{uuid4().hex[:8]}"
            port_config = get_template_port(template_type or "custom-docker")
            port = port_config["port"]
            
            print(f"[DRY_RUN] Mock creating RunPod instance:")
            print(f"  - ID: {mock_id}")
            print(f"  - GPU: {gpu_type}")
            print(f"  - Image: {image}")
            print(f"  - Template: {template_type}")
            print(f"  - Port: {port}")
            
            return {
                "instance_id": mock_id,
                "status": "creating",  # Start with creating, will be updated by sync task
                "endpoint_url": None,  # Will be set by sync task
                "exposed_port": port
            }
        
        # 真实 API 调用
        if not self.api_key:
            raise ValueError("RUNPOD_API_KEY not configured")
        
        # 映射 GPU 类型
        runpod_gpu_type = GPU_TYPE_MAPPING.get(gpu_type, gpu_type)
        
        # 获取模板端口配置
        from app.core.template_config import get_template_port
        port_config = get_template_port(template_type or "custom-docker")
        port = port_config["port"]
        
        # 构建 GraphQL mutation
        mutation = """
        mutation($input: PodFindAndDeployOnDemandInput!) {
          podFindAndDeployOnDemand(input: $input) {
            id
            imageName
            env
            machineId
            machine {
              podHostId
            }
          }
        }
        """
        
        # 根据模板类型设置不同的启动命令
        docker_args = self._get_docker_args(template_type, port)
        
        # 构建变量
        variables = {
            "input": {
                "cloudType": "ALL",
                "gpuCount": 1,
                "volumeInGb": 20,
                "containerDiskInGb": 20,
                "minVcpuCount": 2,
                "minMemoryInGb": 15,
                "gpuTypeId": runpod_gpu_type,
                "name": f"ch-{deployment_id}",
                "imageName": image,
                "dockerArgs": docker_args,
                "ports": f"{port}/http,22/tcp",
                "volumeMountPath": "/workspace",
                "env": [{"key": k, "value": v} for k, v in (env or {}).items()]
            }
        }
        
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    self.api_url,
                    headers=self.headers,
                    json={"query": mutation, "variables": variables}
                )
                
                print(f"Response status: {response.status_code}")
                print(f"Response body: {response.text}")
                
                response.raise_for_status()
                data = response.json()
                
                if "errors" in data:
                    raise Exception(f"RunPod API Error: {data['errors']}")
                
                pod_data = data["data"]["podFindAndDeployOnDemand"]
                
                return {
                    "instance_id": pod_data["id"],
                    "status": "creating",
                    "exposed_port": port
                }
        except httpx.HTTPError as e:
            raise Exception(f"Failed to create RunPod instance: {str(e)}")
    
    def _get_docker_args(self, template_type: str, port: int) -> str:
        """
        根据模板类型生成 Docker 启动参数
        """
        if template_type == "image-generation":
            # Stable Diffusion WebUI - 通常镜像自带启动脚本
            return ""
        elif template_type == "llm-inference":
            # vLLM 或 FastAPI - 需要启动服务
            return f"bash -c 'python -m vllm.entrypoints.openai.api_server --host 0.0.0.0 --port {port} > /workspace/vllm.log 2>&1 & sleep infinity'"
        elif template_type == "comfyui":
            # ComfyUI - 通常镜像自带启动脚本
            return ""
        elif template_type == "jupyter":
            # Jupyter Lab
            return f"bash -c 'jupyter lab --ip=0.0.0.0 --port={port} --no-browser --allow-root --NotebookApp.token=\"\" --NotebookApp.password=\"\" > /workspace/jupyter.log 2>&1 & sleep infinity'"
        else:
            # Custom Docker - 让镜像自己处理
            return ""
    
    async def get_status(self, instance_id: str, exposed_port: int = 8888) -> Dict[str, Any]:
        """
        查询 RunPod 实例状态
        支持 DRY_RUN 模式
        """
        # DRY_RUN 模式
        if settings.DRY_RUN:
            print(f"[DRY_RUN] Mock getting status for instance: {instance_id}")
            return {
                "status": "running",
                "endpoint": f"http://localhost:{exposed_port}",
                "ssh_connection_string": None,
                "uptime_seconds": 0,
                "vcpu_count": 4,
                "ram_gb": 16,
                "storage_gb": 40,
                "gpu_utilization": 0,
                "gpu_memory_utilization": 0
            }
        
        # 真实 API 调用
        if not self.api_key:
            raise ValueError("RUNPOD_API_KEY not configured")
        
        query = f"""
        query {{
          pod(input: {{podId: "{instance_id}"}}) {{
            id
            name
            desiredStatus
            vcpuCount
            memoryInGb
            containerDiskInGb
            volumeInGb
            runtime {{
              uptimeInSeconds
              ports {{
                ip
                isIpPublic
                privatePort
                publicPort
                type
              }}
              gpus {{
                id
                gpuUtilPercent
                memoryUtilPercent
              }}
            }}
            machine {{
              podHostId
            }}
          }}
        }}
        """
        
        variables = {}
        
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    self.api_url,
                    headers=self.headers,
                    json={"query": query, "variables": variables}
                )
                response.raise_for_status()
                data = response.json()
                
                if "errors" in data:
                    raise Exception(f"RunPod API Error: {data['errors']}")
                
                pod = data["data"]["pod"]
                
                print(f"[DEBUG] Full pod data: {pod}")
                
                if not pod:
                    return {
                        "status": "deleted",
                        "endpoint": None,
                        "ssh_connection_string": None
                    }

                # 判断状态
                desired_status = pod.get("desiredStatus", "").upper()
                
                # 提取运行时信息
                uptime_seconds = 0
                gpu_utilization = 0
                gpu_memory_utilization = 0
                
                if pod.get("runtime"):
                    uptime_seconds = pod["runtime"].get("uptimeInSeconds", 0)
                    gpus = pod["runtime"].get("gpus") or []
                    if gpus:
                        gpu_utilization = gpus[0].get("gpuUtilPercent", 0)
                        gpu_memory_utilization = gpus[0].get("memoryUtilPercent", 0)
                
                # 提取配置信息
                vcpu_count = pod.get("vcpuCount")
                ram_gb = pod.get("memoryInGb")
                storage_gb = (pod.get("containerDiskInGb") or 0) + (pod.get("volumeInGb") or 0)
                
                if desired_status == "RUNNING":
                    if pod["runtime"] is None:
                        # 容器还未启动
                        status = "creating"
                        endpoint = None
                        ssh_connection_string = None
                    else:
                        # 容器已启动
                        status = "running"
                        
                        # 使用传入的 exposed_port 生成 endpoint URL
                        endpoint = f"https://{pod['id']}-{exposed_port}.proxy.runpod.net"
                        
                        # 提取 SSH 信息
                        ports = pod["runtime"].get("ports") or []
                        print(f"[DEBUG] Ports for pod {pod['id']}: {ports}")
                        
                        ssh_port_info = next(
                            (p for p in ports if p.get("privatePort") == 22 and p.get("isIpPublic")),
                            None
                        )
                        
                        if ssh_port_info:
                            ssh_connection_string = f"ssh root@{ssh_port_info['ip']} -p {ssh_port_info['publicPort']}"
                            print(f"[DEBUG] SSH connection string: {ssh_connection_string}")
                        else:
                            print(f"[DEBUG] No suitable SSH port found in ports: {ports}")
                            ssh_connection_string = None
                            
                elif desired_status == "EXITED":
                    status = "stopped"
                    endpoint = None
                    ssh_connection_string = None
                else:
                    status = "creating"
                    endpoint = None
                    ssh_connection_string = None
                
                return {
                    "status": status,
                    "endpoint": endpoint,
                    "ssh_connection_string": ssh_connection_string,
                    "uptime_seconds": uptime_seconds,
                    "vcpu_count": vcpu_count,
                    "ram_gb": ram_gb,
                    "storage_gb": storage_gb,
                    "gpu_utilization": gpu_utilization,
                    "gpu_memory_utilization": gpu_memory_utilization
                }
        except httpx.HTTPError as e:
            raise Exception(f"Failed to get RunPod status: {str(e)}")
    
    async def delete_instance(self, instance_id: str) -> bool:
        """
        删除 RunPod 实例
        """
        if not self.api_key:
            raise ValueError("RUNPOD_API_KEY not configured")
        
        mutation = """
        mutation($input: PodTerminateInput!) {
          podTerminate(input: $input)
        }
        """
        
        variables = {
            "input": {
                "podId": instance_id
            }
        }
        
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    self.api_url,
                    headers=self.headers,
                    json={"query": mutation, "variables": variables}
                )
                response.raise_for_status()
                data = response.json()
                
                if "errors" in data:
                    raise Exception(f"RunPod API Error: {data['errors']}")
                
                return True
        except httpx.HTTPError as e:
            raise Exception(f"Failed to delete RunPod instance: {str(e)}")
    
    async def stop_instance(self, instance_id: str) -> bool:
        """
        停止 RunPod 实例（保留数据，停止计费）
        """
        if not self.api_key:
            raise ValueError("RUNPOD_API_KEY not configured")
        
        mutation = """
        mutation($input: PodStopInput!) {
          podStop(input: $input) {
            id
            desiredStatus
          }
        }
        """
        
        variables = {
            "input": {
                "podId": instance_id
            }
        }
        
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    self.api_url,
                    headers=self.headers,
                    json={"query": mutation, "variables": variables}
                )
                response.raise_for_status()
                data = response.json()
                
                if "errors" in data:
                    raise Exception(f"RunPod API Error: {data['errors']}")
                
                print(f"[DEBUG] Stop instance result: {data}")
                return True
        except httpx.HTTPError as e:
            raise Exception(f"Failed to stop RunPod instance: {str(e)}")
    
    async def start_instance(self, instance_id: str) -> bool:
        """
        启动已停止的 RunPod 实例
        """
        if not self.api_key:
            raise ValueError("RUNPOD_API_KEY not configured")
        
        mutation = """
        mutation($input: PodResumeInput!) {
          podResume(input: $input) {
            id
          }
        }
        """
        
        variables = {
            "input": {
                "podId": instance_id,
                "gpuCount": 1
            }
        }
        
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    self.api_url,
                    headers=self.headers,
                    json={"query": mutation, "variables": variables}
                )
                response.raise_for_status()
                data = response.json()
                
                if "errors" in data:
                    raise Exception(f"RunPod API Error: {data['errors']}")
                
                print(f"[DEBUG] Start instance result: {data}")
                return True
        except httpx.HTTPError as e:
            raise Exception(f"Failed to start RunPod instance: {str(e)}")
    
    async def restart_instance(self, instance_id: str) -> bool:
        """
        重启运行中的 RunPod 实例
        """
        if not self.api_key:
            raise ValueError("RUNPOD_API_KEY not configured")
        
        mutation = """
        mutation($input: PodRestartInput!) {
          podRestart(input: $input) {
            id
            desiredStatus
          }
        }
        """
        
        variables = {
            "input": {
                "podId": instance_id
            }
        }
        
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    self.api_url,
                    headers=self.headers,
                    json={"query": mutation, "variables": variables}
                )
                response.raise_for_status()
                data = response.json()
                
                if "errors" in data:
                    raise Exception(f"RunPod API Error: {data['errors']}")
                
                print(f"[DEBUG] Restart instance result: {data}")
                return True
        except httpx.HTTPError as e:
            raise Exception(f"Failed to restart RunPod instance: {str(e)}")
    
    async def get_pricing(self, gpu_type: str) -> Optional[float]:
        """
        Get current price per hour for the given GPU type from RunPod.
        """
        if not self.api_key:
            return None
        
        # Map GPU type - handle both "RTX4090" and "RTX 4090" formats
        runpod_gpu_type = GPU_TYPE_MAPPING.get(gpu_type, gpu_type)
        
        # GraphQL query
        query = """
        {
          gpuTypes {
            id
            displayName
            lowestPrice(input: {gpuCount: 1}) {
              minimumBidPrice
              uninterruptablePrice
            }
          }
        }
        """
        
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.post(
                    self.api_url,
                    headers=self.headers,
                    json={"query": query}
                )
                
                if not response.is_success:
                    print(f"[RunPodAdapter] API call failed with status {response.status_code}")
                    return None
                
                data = response.json()
                
                if "errors" in data or "data" not in data:
                    print(f"[RunPodAdapter] API returned errors: {data.get('errors')}")
                    return None
                
                # Find the matching GPU type
                gpu_types = data["data"].get("gpuTypes", [])
                for gpu in gpu_types:
                    # Match by displayName (more reliable) or id
                    # displayName examples: "RTX 4090", "RTX 3090"
                    # id examples: "NVIDIA GeForce RTX 4090"
                    display_name = gpu.get("displayName", "")
                    gpu_id = gpu.get("id", "")
                    
                    # Try multiple matching strategies
                    if (display_name == gpu_type or  # Exact match on displayName
                        gpu_id == runpod_gpu_type or  # Exact match on mapped id
                        display_name == runpod_gpu_type or  # displayName matches mapped value
                        gpu_type in display_name or  # Partial match
                        gpu_type in gpu_id):  # Partial match on id
                        
                        lowest_price = gpu.get("lowestPrice", {})
                        # Use uninterruptable (on-demand) price
                        price = lowest_price.get("uninterruptablePrice")
                        if price:
                            print(f"[RunPodAdapter] Found price for {gpu_type}: ${price}/hr (matched: {display_name})")
                            return float(price)
                
                print(f"[RunPodAdapter] No matching GPU type found for: {gpu_type}")
                return None
                
        except Exception as e:
            print(f"[RunPodAdapter] Failed to get pricing: {e}")
            import traceback
            traceback.print_exc()
            return None
    
    async def check_gpu_availability(self, gpu_type: str) -> Dict[str, Any]:
        """
        Check GPU availability on RunPod
        
        Returns:
        {
            "available": bool,
            "count": int (estimated),
            "price": float,
            "regions": [] (RunPod doesn't expose regions)
        }
        """
        if not self.api_key:
            raise ValueError("RUNPOD_API_KEY not configured")
        
        # Map GPU type
        runpod_gpu_type = GPU_TYPE_MAPPING.get(gpu_type, gpu_type)
        
        # GraphQL query to get GPU availability
        query = """
        query($gpuId: String!) {
          gpuTypes(input: {id: $gpuId}) {
            id
            displayName
            lowestPrice(input: {
              gpuCount: 1
              secureCloud: true
            }) {
              stockStatus
              maxUnreservedGpuCount
              uninterruptablePrice
            }
          }
        }
        """
        
        variables = {"gpuId": runpod_gpu_type}
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    self.api_url,
                    headers=self.headers,
                    json={"query": query, "variables": variables},
                    timeout=10.0
                )
                response.raise_for_status()
                data = response.json()
                
                if "errors" in data:
                    raise Exception(f"GraphQL errors: {data['errors']}")
                
                gpu_types = data.get("data", {}).get("gpuTypes", [])
                if not gpu_types:
                    return {
                        "available": False,
                        "count": 0,
                        "price": 0,
                        "regions": []
                    }
                
                gpu_data = gpu_types[0]
                lowest_price = gpu_data.get("lowestPrice", {})
                stock_status = lowest_price.get("stockStatus", "None")
                max_count = lowest_price.get("maxUnreservedGpuCount", 0)
                price = lowest_price.get("uninterruptablePrice", 0)
                
                # Map stock status to estimated count
                stock_map = {
                    "High": 10,
                    "Medium": 5,
                    "Low": 2,
                    "None": 0
                }
                
                estimated_count = stock_map.get(stock_status, 0)
                # Use actual count if available
                if max_count > 0:
                    estimated_count = max_count
                
                return {
                    "available": stock_status != "None" and estimated_count > 0,
                    "count": estimated_count,
                    "price": float(price) if price else 0,
                    "regions": []  # RunPod doesn't expose region info
                }
                
        except Exception as e:
            print(f"[RunPodAdapter] Failed to check availability: {e}")
            raise Exception(f"RunPod availability check failed: {e}")
    
    async def get_logs(
        self, 
        instance_id: str, 
        lines: int = 100,
        since: Optional[Any] = None
    ) -> list[str]:
        """
        Get container logs from RunPod instance.
        """
        from app.core.config import settings
        from datetime import datetime
        import random
        
        if settings.DRY_RUN:
            # Mock logs for testing
            mock_logs = [
                f"[{datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')}] Starting container...",
                f"[{datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')}] Loading environment variables",
                f"[{datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')}] Initializing GPU...",
                f"[{datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')}] GPU detected: NVIDIA RTX 4090",
                f"[{datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')}] Loading model weights...",
                f"[{datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')}] Model loaded successfully",
                f"[{datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')}] Starting web server on port 7860...",
                f"[{datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')}] Server ready! Listening on http://0.0.0.0:7860",
                f"[{datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')}] Waiting for requests...",
            ]
            
            # Simulate new logs if since is provided
            if since:
                return [
                    f"[{datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')}] Processing request #{random.randint(1, 100)}",
                    f"[{datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')}] Request completed in {random.uniform(0.1, 2.0):.2f}s",
                ]
            
            return mock_logs[-lines:]
        
        # Real RunPod API call
        try:
            # RunPod doesn't have a direct logs API, would need to use SSH or other method
            # For now, return placeholder
            return [
                "[INFO] Log retrieval from RunPod requires SSH access",
                "[INFO] Please use SSH connection to view logs",
                f"[INFO] Instance ID: {instance_id}"
            ]
        except Exception as e:
            print(f"[RunPodAdapter] Failed to get logs: {e}")
            return [f"[ERROR] Failed to retrieve logs: {str(e)}"]
    
    async def get_metrics(self, instance_id: str) -> Dict[str, Any]:
        """Get performance metrics from RunPod instance."""
        from app.core.config import settings
        import random
        
        if settings.DRY_RUN:
            # Mock metrics for testing
            return {
                "gpu_utilization": random.uniform(70, 95),
                "gpu_memory_utilization": random.uniform(60, 85),
                "cpu_utilization": random.uniform(30, 50),
                "ram_utilization": random.uniform(40, 70),
                "network_rx_bytes": random.randint(1000000, 10000000),
                "network_tx_bytes": random.randint(500000, 5000000)
            }
        
        # Real RunPod API - would need to implement actual metrics fetching
        # For now, return placeholder
        return {
            "gpu_utilization": 0,
            "gpu_memory_utilization": 0,
            "cpu_utilization": 0,
            "ram_utilization": 0,
            "network_rx_bytes": 0,
            "network_tx_bytes": 0
        }
