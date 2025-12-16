
import jwt
import requests
from jwt.algorithms import RSAAlgorithm
from fastapi import HTTPException, status
from sqlmodel import Session, select
from app.core.models import SystemSetting

# Cache for JWKS keys to avoid fetching on every request
_jwks_cache = {}

def get_clerk_issuer(session: Session) -> str:
    setting = session.get(SystemSetting, "CLERK_ISSUER_URL")
    if not setting or not setting.value:
        # Fallback for dev if not set, or raise error
        # raising error helps dev realize they missed a step
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Authentication not configured (CLERK_ISSUER_URL missing)"
        )
    return setting.value

def verify_token(token: str, session: Session) -> dict:
    issuer = get_clerk_issuer(session)
    jwks_url = f"{issuer}/.well-known/jwks.json"
    
    try:
        # Fetch JWKS if not cached or force refresh on failure
        # For simplicity in this logic, we'll try to use cache, if fail, fetch again
        header = jwt.get_unverified_header(token)
        kid = header.get("kid")
        
        public_key = _jwks_cache.get(kid)
        
        if not public_key:
            # Fetch JWKS
            response = requests.get(jwks_url)
            response.raise_for_status()
            jwks = response.json()
            
            for key in jwks["keys"]:
                _jwks_cache[key["kid"]] = RSAAlgorithm.from_jwk(key)
            
            public_key = _jwks_cache.get(kid)
            
            if not public_key:
                 raise Exception("Public key not found in JWKS")

        # Decode and verify
        payload = jwt.decode(
            token,
            public_key,
            algorithms=["RS256"],
            issuer=issuer,
            # Clerk tokens usually have audience, but often it's the frontend URL or empty? 
            # We can skip audience check or verifying it matches our frontend if configured.
            # verify_audience=True/False depending on Clerk config.
            options={"verify_aud": False} 
        )
        
        return payload

    except Exception as e:
        print(f"[AUTH ERROR] Token verification failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )


def get_current_user_id(token: str, session: Session) -> str:
    """
    Extract user_id from JWT token.
    Convenience function for endpoints that only need the user_id.
    """
    payload = verify_token(token, session)
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User ID not found in token"
        )
    return user_id
