"""
WebSSH Terminal API Endpoint

INPUT: WebSocket connection request with deployment ID
OUTPUT: Interactive terminal session
POS: API layer for WebSSH terminal access
"""

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, HTTPException
from sqlmodel import Session, select
from app.core.db import get_session
from app.core.models import Deployment, User
from app.services.ssh_websocket_service import SSHWebSocketBridge, ssh_pool
from app.core.encryption import get_encryption
import json

router = APIRouter()


async def get_current_user_ws(websocket: WebSocket, session: Session) -> User:
    """
    Get current user from WebSocket connection
    
    For WebSocket, we need to extract token from query parameters
    since WebSocket doesn't support custom headers in browsers
    """
    import os
    
    # Development mode: skip authentication
    if os.getenv("ENVIRONMENT") == "development":
        print("[DEBUG] Development mode: using test user for WebSocket")
        test_user = session.exec(select(User).where(User.email == "dev@test.local")).first()
        if test_user:
            return test_user
        # Create if not exists
        test_user = User(
            email="dev@test.local",
            clerk_id="dev_user_local",
            auth_provider="local",
            plan="free"
        )
        session.add(test_user)
        session.commit()
        session.refresh(test_user)
        return test_user
    
    # Production mode: get token from query params
    # Frontend should connect with: ws://...?token=xxx
    token = websocket.query_params.get("token")
    if not token:
        raise HTTPException(status_code=401, detail="Missing authentication token")
    
    # Verify token and get user (reuse existing auth logic)
    from app.core.auth import verify_token
    payload = verify_token(token, session)
    
    clerk_id = payload.get("sub")
    if not clerk_id:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    user = session.exec(select(User).where(User.clerk_id == clerk_id)).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    
    return user


@router.websocket("/deployments/{deployment_id}/terminal")
async def terminal_websocket(
    websocket: WebSocket,
    deployment_id: int,
    session: Session = Depends(get_session)
):
    """
    WebSocket endpoint for interactive terminal access
    
    Protocol:
    - Client -> Server: {"type": "input", "data": "command"}
    - Client -> Server: {"type": "resize", "rows": 24, "cols": 80}
    - Server -> Client: {"type": "output", "data": "output"}
    - Server -> Client: {"type": "error", "message": "error message"}
    """
    
    # Accept WebSocket connection
    await websocket.accept()
    
    bridge = None
    
    try:
        print(f"[WebSocket] New connection for deployment {deployment_id}")
        
        # 1. Authenticate user
        try:
            current_user = await get_current_user_ws(websocket, session)
            print(f"[WebSocket] Authenticated user: {current_user.email}")
        except Exception as e:
            await websocket.send_json({
                "type": "error",
                "message": f"Authentication failed: {str(e)}"
            })
            await websocket.close()
            return
        
        # 2. Get deployment
        deployment = session.get(Deployment, deployment_id)
        if not deployment:
            await websocket.send_json({
                "type": "error",
                "message": "Deployment not found"
            })
            await websocket.close()
            return
        
        # 3. Check ownership
        if deployment.user_id != current_user.id:
            await websocket.send_json({
                "type": "error",
                "message": "You don't have permission to access this deployment"
            })
            await websocket.close()
            return
        
        # 4. Check SSH information
        if not deployment.ssh_connection_string:
            await websocket.send_json({
                "type": "error",
                "message": "SSH information not available for this deployment"
            })
            await websocket.close()
            return
        
        # 5. Parse SSH connection string
        # Format: user@host or user@host:port
        ssh_info = deployment.ssh_connection_string
        
        try:
            if '@' not in ssh_info:
                raise ValueError("Invalid SSH connection string format")
            
            username, host_part = ssh_info.split('@', 1)
            
            # Check for custom port
            if ':' in host_part:
                host, port_str = host_part.rsplit(':', 1)
                port = int(port_str)
            else:
                host = host_part
                port = 22
                
        except Exception as e:
            await websocket.send_json({
                "type": "error",
                "message": f"Invalid SSH connection string: {str(e)}"
            })
            await websocket.close()
            return
        
        # 6. Get SSH password (decrypt if encrypted)
        password = deployment.ssh_password
        if not password:
            await websocket.send_json({
                "type": "error",
                "message": "SSH password not available"
            })
            await websocket.close()
            return
        
        # Decrypt password if it's encrypted
        try:
            encryption = get_encryption()
            password = encryption.decrypt(password)
        except Exception as e:
            # If decryption fails, assume it's plain text (for backward compatibility)
            print(f"[WebSocket] Password decryption failed, using as-is: {str(e)}")
        
        # 7. Create SSH bridge
        bridge = SSHWebSocketBridge(websocket)
        
        # 8. Add to connection pool (with limit check)
        try:
            ssh_pool.add_connection(deployment_id, bridge)
        except Exception as e:
            await websocket.send_json({
                "type": "error",
                "message": str(e)
            })
            await websocket.close()
            return
        
        # 9. Connect to SSH server
        connected = await bridge.connect(host, username, password, port)
        if not connected:
            ssh_pool.remove_connection(deployment_id, bridge)
            await websocket.close()
            return
        
        # 10. Create terminal
        terminal_created = await bridge.create_terminal()
        if not terminal_created:
            ssh_pool.remove_connection(deployment_id, bridge)
            await websocket.close()
            return
        
        # 11. Send success message
        await websocket.send_json({
            "type": "connected",
            "message": f"Connected to {username}@{host}"
        })
        
        # 12. Start bidirectional data forwarding
        print(f"[WebSocket] Starting data forwarding for deployment {deployment_id}")
        await bridge.forward_data()
        
    except WebSocketDisconnect:
        print(f"[WebSocket] Client disconnected for deployment {deployment_id}")
        
    except Exception as e:
        print(f"[WebSocket ERROR] {str(e)}")
        import traceback
        traceback.print_exc()
        
        try:
            await websocket.send_json({
                "type": "error",
                "message": f"Terminal error: {str(e)}"
            })
        except:
            pass
    
    finally:
        # Cleanup
        if bridge:
            ssh_pool.remove_connection(deployment_id, bridge)
            await bridge.cleanup()
        
        try:
            await websocket.close()
        except:
            pass
        
        print(f"[WebSocket] Connection closed for deployment {deployment_id}")
