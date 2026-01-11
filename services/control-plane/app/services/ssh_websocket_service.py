"""
SSH WebSocket Bridge Service

INPUT: WebSocket connection, SSH credentials
OUTPUT: Bidirectional terminal data stream
POS: Core service for WebSSH terminal functionality
"""

import asyncio
import asyncssh
from fastapi import WebSocket
from typing import Optional
import json


class SSHWebSocketBridge:
    """
    Manages SSH connection and WebSocket bidirectional data forwarding
    """
    
    def __init__(self, websocket: WebSocket):
        self.websocket = websocket
        self.ssh_conn: Optional[asyncssh.SSHClientConnection] = None
        self.ssh_process: Optional[asyncssh.SSHClientProcess] = None
        self.running = False
        
    async def connect(self, host: str, username: str, password: str, port: int = 22):
        """
        Establish SSH connection to remote server
        
        Args:
            host: SSH server hostname/IP
            username: SSH username
            password: SSH password
            port: SSH port (default 22)
        """
        try:
            print(f"[SSH] Connecting to {username}@{host}:{port}")
            
            # Connect to SSH server
            self.ssh_conn = await asyncssh.connect(
                host=host,
                port=port,
                username=username,
                password=password,
                known_hosts=None,  # Skip host key verification (for development)
                # In production, you should verify host keys
            )
            
            print(f"[SSH] Connected successfully")
            return True
            
        except Exception as e:
            print(f"[SSH ERROR] Connection failed: {str(e)}")
            await self.websocket.send_json({
                "type": "error",
                "message": f"SSH connection failed: {str(e)}"
            })
            return False
    
    async def create_terminal(self, rows: int = 24, cols: int = 80):
        """
        Create interactive PTY terminal session
        
        Args:
            rows: Terminal rows
            cols: Terminal columns
        """
        try:
            print(f"[SSH] Creating terminal session ({rows}x{cols})")
            
            # Create interactive shell with PTY
            self.ssh_process = await self.ssh_conn.create_process(
                term_type='xterm-256color',
                term_size=(cols, rows)
            )
            
            print(f"[SSH] Terminal created")
            return True
            
        except Exception as e:
            print(f"[SSH ERROR] Failed to create terminal: {str(e)}")
            await self.websocket.send_json({
                "type": "error",
                "message": f"Failed to create terminal: {str(e)}"
            })
            return False
    
    async def forward_data(self):
        """
        Bidirectional data forwarding between WebSocket and SSH
        
        This runs two concurrent tasks:
        1. WebSocket -> SSH: Forward user input
        2. SSH -> WebSocket: Forward command output
        """
        self.running = True
        
        try:
            # Run both directions concurrently
            await asyncio.gather(
                self._forward_ws_to_ssh(),
                self._forward_ssh_to_ws()
            )
        except Exception as e:
            print(f"[SSH ERROR] Data forwarding error: {str(e)}")
        finally:
            self.running = False
            await self.cleanup()
    
    async def _forward_ws_to_ssh(self):
        """Forward data from WebSocket to SSH (user input)"""
        try:
            while self.running:
                # Receive data from WebSocket
                data = await self.websocket.receive_text()
                
                # Parse message
                try:
                    message = json.loads(data)
                    msg_type = message.get('type')
                    
                    if msg_type == 'input':
                        # User input - send to SSH
                        input_data = message.get('data', '')
                        self.ssh_process.stdin.write(input_data)
                        
                    elif msg_type == 'resize':
                        # Terminal resize
                        rows = message.get('rows', 24)
                        cols = message.get('cols', 80)
                        await self.resize_terminal(rows, cols)
                        
                except json.JSONDecodeError:
                    # If not JSON, treat as raw input
                    self.ssh_process.stdin.write(data)
                    
        except Exception as e:
            print(f"[WS->SSH ERROR] {str(e)}")
            self.running = False
    
    async def _forward_ssh_to_ws(self):
        """Forward data from SSH to WebSocket (command output)"""
        try:
            while self.running:
                # Read output from SSH
                output = await self.ssh_process.stdout.read(4096)
                
                if output:
                    # Send to WebSocket
                    await self.websocket.send_json({
                        "type": "output",
                        "data": output
                    })
                else:
                    # No more output, connection closed
                    break
                    
        except Exception as e:
            print(f"[SSH->WS ERROR] {str(e)}")
            self.running = False
    
    async def resize_terminal(self, rows: int, cols: int):
        """
        Resize terminal window
        
        Args:
            rows: New terminal rows
            cols: New terminal columns
        """
        try:
            print(f"[SSH] Resizing terminal to {rows}x{cols}")
            self.ssh_process.change_terminal_size(cols, rows)
        except Exception as e:
            print(f"[SSH ERROR] Failed to resize terminal: {str(e)}")
    
    async def cleanup(self):
        """Clean up SSH connection and process"""
        print("[SSH] Cleaning up connection")
        
        try:
            if self.ssh_process:
                self.ssh_process.close()
                await self.ssh_process.wait_closed()
                
            if self.ssh_conn:
                self.ssh_conn.close()
                await self.ssh_conn.wait_closed()
                
        except Exception as e:
            print(f"[SSH ERROR] Cleanup error: {str(e)}")
        
        print("[SSH] Connection closed")


# Connection pool to manage multiple SSH sessions
class SSHConnectionPool:
    """
    Manages multiple SSH connections
    Limits concurrent connections per deployment
    """
    
    def __init__(self, max_connections_per_deployment: int = 5):
        self.connections = {}  # deployment_id -> list of bridges
        self.max_connections = max_connections_per_deployment
    
    def add_connection(self, deployment_id: int, bridge: SSHWebSocketBridge):
        """Add a new connection to the pool"""
        if deployment_id not in self.connections:
            self.connections[deployment_id] = []
        
        # Check limit
        if len(self.connections[deployment_id]) >= self.max_connections:
            raise Exception(f"Maximum {self.max_connections} connections reached for this deployment")
        
        self.connections[deployment_id].append(bridge)
        print(f"[POOL] Added connection for deployment {deployment_id}. Total: {len(self.connections[deployment_id])}")
    
    def remove_connection(self, deployment_id: int, bridge: SSHWebSocketBridge):
        """Remove a connection from the pool"""
        if deployment_id in self.connections:
            try:
                self.connections[deployment_id].remove(bridge)
                print(f"[POOL] Removed connection for deployment {deployment_id}. Remaining: {len(self.connections[deployment_id])}")
                
                # Clean up empty lists
                if not self.connections[deployment_id]:
                    del self.connections[deployment_id]
            except ValueError:
                pass
    
    def get_connection_count(self, deployment_id: int) -> int:
        """Get number of active connections for a deployment"""
        return len(self.connections.get(deployment_id, []))


# Global connection pool instance
ssh_pool = SSHConnectionPool()
