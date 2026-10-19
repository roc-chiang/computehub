import os
import posixpath
import stat
from datetime import datetime, timezone
from typing import Optional

import asyncssh


class SSHService:
    @staticmethod
    def _connection_options() -> dict:
        known_hosts = os.getenv("SSH_KNOWN_HOSTS")
        if os.getenv("ENVIRONMENT", "development") == "production" and not known_hosts:
            raise RuntimeError("SSH_KNOWN_HOSTS is required in production")
        return {"known_hosts": known_hosts}

    @staticmethod
    def _workspace_path(path: str) -> str:
        normalized = posixpath.normpath(path if path.startswith("/") else f"/workspace/{path}")
        if normalized != "/workspace" and not normalized.startswith("/workspace/"):
            raise ValueError("Path must stay inside /workspace")
        return normalized

    @classmethod
    async def get_logs(
        cls,
        host: str,
        port: int,
        username: str,
        password: Optional[str] = None,
        private_key: Optional[str] = None,
        lines: int = 100,
    ) -> str:
        client_keys = [asyncssh.import_private_key(private_key)] if private_key else None
        safe_lines = max(1, min(lines, 1000))
        try:
            async with asyncssh.connect(
                host,
                port=port,
                username=username,
                password=password,
                client_keys=client_keys,
                **cls._connection_options(),
            ) as conn:
                result = await conn.run(
                    f"tail -n {safe_lines} /workspace/jupyter.log 2>/dev/null",
                    check=False,
                )
                return result.stdout if result.exit_status == 0 else "Log file not found at /workspace/jupyter.log"
        except (OSError, asyncssh.Error) as exc:
            return f"Failed to connect or retrieve logs: {exc}"

    @classmethod
    async def list_files(
        cls,
        host: str,
        port: int,
        username: str,
        path: str,
        password: Optional[str] = None,
        private_key: Optional[str] = None,
    ) -> list:
        target_path = cls._workspace_path(path)
        client_keys = [asyncssh.import_private_key(private_key)] if private_key else None
        async with asyncssh.connect(
            host,
            port=port,
            username=username,
            password=password,
            client_keys=client_keys,
            **cls._connection_options(),
        ) as conn:
            async with conn.start_sftp_client() as sftp:
                files = []
                async for entry in sftp.scandir(target_path):
                    attrs = entry.attrs
                    permissions = attrs.permissions or 0
                    modified = ""
                    if attrs.mtime is not None:
                        modified = datetime.fromtimestamp(attrs.mtime, timezone.utc).isoformat()
                    files.append({
                        "name": entry.filename,
                        "size": str(attrs.size or 0),
                        "type": "directory" if stat.S_ISDIR(permissions) else "file",
                        "permissions": stat.filemode(permissions) if permissions else "",
                        "modified": modified,
                    })
                return sorted(files, key=lambda item: (item["type"] != "directory", item["name"].lower()))

    @classmethod
    async def read_file(
        cls,
        host: str,
        port: int,
        username: str,
        path: str,
        password: Optional[str] = None,
        private_key: Optional[str] = None,
    ) -> str:
        target_path = cls._workspace_path(path)
        client_keys = [asyncssh.import_private_key(private_key)] if private_key else None
        async with asyncssh.connect(
            host,
            port=port,
            username=username,
            password=password,
            client_keys=client_keys,
            **cls._connection_options(),
        ) as conn:
            async with conn.start_sftp_client() as sftp:
                attrs = await sftp.stat(target_path)
                if attrs.size is not None and attrs.size > 1_048_576:
                    raise ValueError("File is too large to preview")
                async with sftp.open(target_path, "r") as remote_file:
                    return await remote_file.read(1_048_577)


ssh_service = SSHService()
