"""
INPUT: Deployment SSH connection info
OUTPUT: GPU and system metrics data
POS: Core monitoring service for collecting real-time metrics from GPU servers

GPU 监控服务 - 通过 SSH 连接到部署实例,收集 GPU 和系统指标
"""

import asyncio
import asyncssh
from typing import Dict, Optional
from datetime import datetime
import re


class GPUMonitorService:
    """GPU 和系统监控服务"""
    
    def __init__(self):
        self.ssh_timeout = 10  # SSH 命令超时时间(秒)
    
    async def collect_metrics(
        self,
        host: str,
        port: int,
        username: str,
        password: Optional[str] = None,
        ssh_key: Optional[str] = None
    ) -> Dict:
        """
        收集完整的监控指标
        
        Args:
            host: SSH 主机地址
            port: SSH 端口
            username: SSH 用户名
            password: SSH 密码 (可选)
            ssh_key: SSH 私钥 (可选)
        
        Returns:
            包含所有监控指标的字典
        """
        try:
            # 建立 SSH 连接
            async with asyncssh.connect(
                host,
                port=port,
                username=username,
                password=password,
                client_keys=[ssh_key] if ssh_key else None,
                known_hosts=None,  # 生产环境应该验证 known_hosts
                connect_timeout=self.ssh_timeout
            ) as conn:
                # 并发收集所有指标
                gpu_metrics, system_metrics, network_metrics = await asyncio.gather(
                    self._get_gpu_metrics(conn),
                    self._get_system_metrics(conn),
                    self._get_network_metrics(conn),
                    return_exceptions=True
                )
                
                # 合并所有指标
                metrics = {
                    "timestamp": datetime.utcnow().isoformat(),
                    **(gpu_metrics if isinstance(gpu_metrics, dict) else {}),
                    **(system_metrics if isinstance(system_metrics, dict) else {}),
                    **(network_metrics if isinstance(network_metrics, dict) else {})
                }
                
                return metrics
                
        except Exception as e:
            print(f"❌ Failed to collect metrics: {e}")
            return {"error": str(e)}
    
    async def _get_gpu_metrics(self, conn: asyncssh.SSHClientConnection) -> Dict:
        """
        获取 GPU 指标
        使用 nvidia-smi 命令
        """
        try:
            # nvidia-smi 查询命令
            cmd = (
                "nvidia-smi "
                "--query-gpu=temperature.gpu,utilization.gpu,memory.used,memory.total,power.draw "
                "--format=csv,noheader,nounits"
            )
            
            result = await conn.run(cmd, check=True, timeout=self.ssh_timeout)
            output = result.stdout.strip()
            
            if not output:
                return {}
            
            # 解析输出: temp, util, mem_used, mem_total, power
            parts = [p.strip() for p in output.split(',')]
            
            if len(parts) >= 5:
                return {
                    "gpu_temperature": float(parts[0]) if parts[0] != 'N/A' else None,
                    "gpu_utilization": float(parts[1]) if parts[1] != 'N/A' else None,
                    "gpu_memory_used": int(float(parts[2])) if parts[2] != 'N/A' else None,
                    "gpu_memory_total": int(float(parts[3])) if parts[3] != 'N/A' else None,
                    "gpu_power_draw": float(parts[4]) if parts[4] != 'N/A' else None
                }
            
            return {}
            
        except Exception as e:
            print(f"⚠️ GPU metrics collection failed: {e}")
            return {}
    
    async def _get_system_metrics(self, conn: asyncssh.SSHClientConnection) -> Dict:
        """
        获取系统指标
        使用 top, free, df 命令
        """
        try:
            # CPU 使用率
            cpu_cmd = "top -bn1 | grep 'Cpu(s)' | awk '{print $2}' | cut -d'%' -f1"
            cpu_result = await conn.run(cpu_cmd, check=False, timeout=self.ssh_timeout)
            cpu_percent = float(cpu_result.stdout.strip()) if cpu_result.stdout.strip() else None
            
            # 内存使用
            mem_cmd = "free -m | awk 'NR==2{print $3,$2}'"
            mem_result = await conn.run(mem_cmd, check=False, timeout=self.ssh_timeout)
            mem_parts = mem_result.stdout.strip().split()
            memory_used = int(mem_parts[0]) if len(mem_parts) >= 1 else None
            memory_total = int(mem_parts[1]) if len(mem_parts) >= 2 else None
            
            # 磁盘使用
            disk_cmd = "df -BG / | awk 'NR==2{gsub(\"G\",\"\"); print $3,$2}'"
            disk_result = await conn.run(disk_cmd, check=False, timeout=self.ssh_timeout)
            disk_parts = disk_result.stdout.strip().split()
            disk_used = int(disk_parts[0]) if len(disk_parts) >= 1 else None
            disk_total = int(disk_parts[1]) if len(disk_parts) >= 2 else None
            
            # 进程数
            proc_cmd = "ps aux | wc -l"
            proc_result = await conn.run(proc_cmd, check=False, timeout=self.ssh_timeout)
            process_count = int(proc_result.stdout.strip()) if proc_result.stdout.strip() else None
            
            return {
                "cpu_percent": cpu_percent,
                "memory_used": memory_used,
                "memory_total": memory_total,
                "disk_used": disk_used,
                "disk_total": disk_total,
                "process_count": process_count
            }
            
        except Exception as e:
            print(f"⚠️ System metrics collection failed: {e}")
            return {}
    
    async def _get_network_metrics(self, conn: asyncssh.SSHClientConnection) -> Dict:
        """
        获取网络指标
        从 /proc/net/dev 读取
        """
        try:
            # 读取网络统计 (通常是 eth0 或 ens3)
            net_cmd = "cat /proc/net/dev | grep -E 'eth0|ens3' | head -1"
            net_result = await conn.run(net_cmd, check=False, timeout=self.ssh_timeout)
            output = net_result.stdout.strip()
            
            if not output:
                return {}
            
            # 解析输出
            # 格式: interface: rx_bytes rx_packets ... tx_bytes tx_packets ...
            parts = output.split()
            if len(parts) >= 10:
                return {
                    "network_rx_bytes": int(parts[1]),  # 接收字节
                    "network_tx_bytes": int(parts[9])   # 发送字节
                }
            
            return {}
            
        except Exception as e:
            print(f"⚠️ Network metrics collection failed: {e}")
            return {}


# 全局监控服务实例
gpu_monitor = GPUMonitorService()
