import asyncssh
import asyncio
from typing import Optional

class SSHService:
    @staticmethod
    async def get_logs(
        host: str,
        port: int,
        username: str,
        password: Optional[str] = None,
        private_key: Optional[str] = None,
        lines: int = 100
    ) -> str:
        """
        Connects to the remote server via SSH and fetches the last N lines of the Jupyter log.
        """
        try:
            # Determine authentication method
            client_keys = None
            if private_key:
                client_keys = [asyncssh.import_private_key(private_key)]

            async with asyncssh.connect(
                host, 
                port=port, 
                username=username, 
                password=password, 
                client_keys=client_keys,
                known_hosts=None  # Skip host key verification for simplicity in this context
            ) as conn:
                # Try to find the log file. Common locations for Jupyter logs in RunPod/Docker
                log_files = [
                    "/workspace/jupyter.log",
                    "/var/log/jupyter.log",
                    "/root/.jupyter/jupyter.log"
                ]
                
                # Also check for container logs if we can't find specific app logs
                # But for now, let's just try to tail the jupyter log we redirect to in the start command
                
                cmd = f"tail -n {lines} /workspace/jupyter.log 2>/dev/null || echo 'Log file not found at /workspace/jupyter.log'"
                
                result = await conn.run(cmd)
                return result.stdout

        except (OSError, asyncssh.Error) as e:
            return f"Failed to connect or retrieve logs: {str(e)}"
        except Exception as e:
            return f"An unexpected error occurred: {str(e)}"

    @staticmethod
    async def list_files(
        host: str,
        port: int,
        username: str,
        path: str,
        password: Optional[str] = None,
        private_key: Optional[str] = None
    ) -> list:
        """
        Lists files in the specified directory.
        Returns a list of dictionaries with file details.
        """
        try:
            client_keys = None
            if private_key:
                client_keys = [asyncssh.import_private_key(private_key)]

            async with asyncssh.connect(
                host, 
                port=port, 
                username=username, 
                password=password, 
                client_keys=client_keys,
                known_hosts=None
            ) as conn:
                # Use ls -la --time-style=long-iso to get consistent parsing
                # Format: permissions links owner group size date time name
                cmd = f"ls -la --time-style=long-iso '{path}'"
                print(f"[DEBUG] Executing command: {cmd}")
                result = await conn.run(cmd)
                
                print(f"[DEBUG] Exit status: {result.exit_status}")
                print(f"[DEBUG] Stdout: {result.stdout}")
                print(f"[DEBUG] Stderr: {result.stderr}")
                
                if result.exit_status != 0:
                    # Fallback for systems that don't support --time-style (e.g. Alpine/BusyBox)
                    print("[DEBUG] Command failed, trying simple ls -la")
                    cmd = f"ls -la '{path}'"
                    result = await conn.run(cmd)
                    print(f"[DEBUG] Fallback Stdout: {result.stdout}")

                if result.exit_status != 0:
                    return []

                files = []
                lines = result.stdout.strip().split('\n')
                # Skip total line if present
                if lines and lines[0].startswith('total'):
                    lines = lines[1:]

                for line in lines:
                    parts = line.split(maxsplit=7)
                    if len(parts) < 8:
                        continue
                        
                    permissions, links, owner, group, size, date, time, name = parts
                    
                    # Skip . and ..
                    if name in ['.', '..']:
                        continue
                        
                    is_dir = permissions.startswith('d')
                    
                    files.append({
                        "name": name,
                        "size": size,
                        "type": "directory" if is_dir else "file",
                        "permissions": permissions,
                        "modified": f"{date} {time}"
                    })
                    
                return files

        except Exception as e:
            print(f"Error listing files: {e}")
            return []

    @staticmethod
    async def read_file(
        host: str,
        port: int,
        username: str,
        path: str,
        password: Optional[str] = None,
        private_key: Optional[str] = None
    ) -> str:
        """
        Reads the content of a file.
        """
        try:
            client_keys = None
            if private_key:
                client_keys = [asyncssh.import_private_key(private_key)]

            async with asyncssh.connect(
                host, 
                port=port, 
                username=username, 
                password=password, 
                client_keys=client_keys,
                known_hosts=None
            ) as conn:
                cmd = f"cat '{path}'"
                result = await conn.run(cmd)
                
                if result.exit_status != 0:
                    return f"Error reading file: {result.stderr}"
                
                return result.stdout

        except Exception as e:
            return f"Error reading file: {str(e)}"

ssh_service = SSHService()
