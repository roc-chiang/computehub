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
        env: Dict[str, str] = None
    ) -> Dict[str, Any]:
        """
        创建 RunPod GPU 实例
        """
        if not self.api_key:
            raise ValueError("RUNPOD_API_KEY not configured")
        
        # 映射 GPU 类型
        runpod_gpu_type = GPU_TYPE_MAPPING.get(gpu_type, gpu_type)
        
        # 构建 GraphQL mutation (使用 JSON 变量)
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
                "dockerArgs": "bash -c 'jupyter lab --ip=0.0.0.0 --port=8888 --no-browser --allow-root --NotebookApp.token=\"\" --NotebookApp.password=\"\" > /workspace/jupyter.log 2>&1 & sleep infinity'",
                "ports": "8888/http,22/tcp",
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
                
                # 打印响应以便调试
                print(f"Response status: {response.status_code}")
                print(f"Response body: {response.text}")
                
                response.raise_for_status()
                data = response.json()
                
                if "errors" in data:
                    raise Exception(f"RunPod API Error: {data['errors']}")
                
                pod_data = data["data"]["podFindAndDeployOnDemand"]
                
                return {
                    "instance_id": pod_data["id"],
                    "status": "creating"
                }
        except httpx.HTTPError as e:
            raise Exception(f"Failed to create RunPod instance: {str(e)}")
    
    async def get_status(self, instance_id: str) -> Dict[str, Any]:
        """
        查询 RunPod 实例状态
        """
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
        
        # variables = {
        #     "input": {
        #         "podId": instance_id
        #     }
        # }
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
                
                # 打印完整的 pod 数据用于调试
                print(f"[DEBUG] Full pod data: {pod}")
                
                if not pod:
                    return {
                        "status": "deleted",
                        "endpoint": None,
                        "ssh_connection_string": None
                    }

                # 判断状态 - 使用 desiredStatus 来区分
                desired_status = pod.get("desiredStatus", "").upper()
                
                # 提取运行时信息
                uptime_seconds = 0
                gpu_utilization = 0
                gpu_memory_utilization = 0
                
                if pod.get("runtime"):
                    uptime_seconds = pod["runtime"].get("uptimeInSeconds", 0)
                    gpus = pod["runtime"].get("gpus") or []
                    if gpus:
                        # 取第一个 GPU 的数据（目前只支持单 GPU 监控）
                        gpu_utilization = gpus[0].get("gpuUtilPercent", 0)
                        gpu_memory_utilization = gpus[0].get("memoryUtilPercent", 0)
                
                # 提取配置信息
                vcpu_count = pod.get("vcpuCount")
                ram_gb = pod.get("memoryInGb")
                # 存储 = 容器磁盘 + 卷存储
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
                        
                        # 总是生成 JupyterLab URL（使用 RunPod Proxy 格式）
                        endpoint = f"https://{pod['id']}-8888.proxy.runpod.net"
                        
                        # 尝试从 ports 提取 SSH 信息
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
                    status = "stopped"  # 已停止
                    endpoint = None
                    ssh_connection_string = None
                else:
                    # 其他状态（如 CREATED, EXITED 等）
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
