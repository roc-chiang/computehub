
import jwt
import requests
import os
from jwt.algorithms import RSAAlgorithm
from fastapi import HTTPException, status
from sqlmodel import Session, select
from app.core.models import SystemSetting

# Cache for JWKS keys to avoid fetching on every request
_jwks_cache = {}

def get_clerk_issuer() -> str:
    """Get Clerk issuer URL from environment variable"""
    # Try to get from CLERK_ISSUER_URL env var first
    issuer = os.getenv("CLERK_ISSUER_URL")
    
    if not issuer:
        # Try to construct from CLERK_SECRET_KEY
        clerk_secret = os.getenv("CLERK_SECRET_KEY", "")
        if clerk_secret.startswith("sk_test_"):
            # Development key - use clerk.accounts.dev
            issuer = "https://clerk.accounts.dev"
        elif clerk_secret.startswith("sk_live_"):
            # Production key - need to be configured
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="CLERK_ISSUER_URL environment variable required for production"
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Authentication not configured (CLERK_SECRET_KEY or CLERK_ISSUER_URL missing)"
            )
    
    return issuer

def verify_token(token: str, session: Session) -> dict:
    issuer = get_clerk_issuer()
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
