"""
API Key Encryption utilities using Fernet (AES-128)
"""
from cryptography.fernet import Fernet
import os
from typing import Optional


class APIKeyEncryption:
    """Handles encryption and decryption of sensitive API keys"""
    
    def __init__(self):
        key = os.getenv("ENCRYPTION_KEY")
        if not key:
            raise ValueError(
                "ENCRYPTION_KEY environment variable not set. "
                "Generate one with: python -c \"from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())\""
            )
        self.cipher = Fernet(key.encode())
    
    def encrypt(self, api_key: str) -> str:
        """
        Encrypt an API key
        
        Args:
            api_key: Plain text API key
            
        Returns:
            Encrypted API key as base64 string
        """
        if not api_key:
            raise ValueError("API key cannot be empty")
        return self.cipher.encrypt(api_key.encode()).decode()
    
    def decrypt(self, encrypted_key: str) -> str:
        """
        Decrypt an API key
        
        Args:
            encrypted_key: Encrypted API key (base64 string)
            
        Returns:
            Decrypted plain text API key
        """
        if not encrypted_key:
            raise ValueError("Encrypted key cannot be empty")
        return self.cipher.decrypt(encrypted_key.encode()).decode()


# Global instance
_encryption_instance: Optional[APIKeyEncryption] = None


def get_encryption() -> APIKeyEncryption:
    """Get or create the global encryption instance"""
    global _encryption_instance
    if _encryption_instance is None:
        _encryption_instance = APIKeyEncryption()
    return _encryption_instance


def encrypt_value(value: str) -> str:
    """
    Encrypt a value using the global encryption instance
    
    Args:
        value: Plain text value to encrypt
        
    Returns:
        Encrypted value as base64 string
    """
    return get_encryption().encrypt(value)


def decrypt_value(encrypted_value: str) -> str:
    """
    Decrypt a value using the global encryption instance
    
    Args:
        encrypted_value: Encrypted value (base64 string)
        
    Returns:
        Decrypted plain text value
    """
    return get_encryption().decrypt(encrypted_value)
