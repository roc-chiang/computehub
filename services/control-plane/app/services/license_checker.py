"""
License verification service for Pro features.

This module handles:
- License key validation
- License activation/deactivation
- Pro feature status checking
"""

import re
from datetime import datetime
from typing import Optional, Dict
from sqlmodel import Session, select
from app.core.models import SystemSetting


class LicenseChecker:
    """Service for managing and validating Pro License keys."""
    
    LICENSE_KEY_PATTERN = r'^COMPUTEHUB-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$'
    LICENSE_KEY_SETTING = "pro_license_key"
    LICENSE_ACTIVATED_AT_SETTING = "pro_license_activated_at"
    
    def __init__(self, db: Session):
        self.db = db
    
    def validate_format(self, license_key: str) -> bool:
        """
        Validate License Key format.
        
        Expected format: COMPUTEHUB-XXXX-XXXX-XXXX-XXXX
        where X is alphanumeric (A-Z, 0-9)
        
        Args:
            license_key: The license key to validate
            
        Returns:
            True if format is valid, False otherwise
        """
        if not license_key:
            return False
        
        license_key = license_key.strip().upper()
        return bool(re.match(self.LICENSE_KEY_PATTERN, license_key))
    
    def activate_license(self, license_key: str) -> Dict:
        """
        Activate a Pro License.
        
        Steps:
        1. Validate format
        2. Verify with remote license server (if configured)
        3. Save to local database
        
        Args:
            license_key: License key to activate
            
        Returns:
            Dict with activation details
            
        Raises:
            ValueError: If license key is invalid
        """
        # Step 1: Validate format
        if not self.validate_format(license_key):
            raise ValueError("Invalid license key format. Expected: COMPUTEHUB-XXXX-XXXX-XXXX-XXXX")
        
        # Step 2: Remote verification (if configured)
        import os
        license_server_url = os.getenv("LICENSE_SERVER_URL")
        
        if license_server_url:
            try:
                import httpx
                import asyncio
                
                async def verify_remote():
                    async with httpx.AsyncClient(timeout=10.0) as client:
                        response = await client.post(
                            f"{license_server_url}/api/verify",
                            json={"license_key": license_key}
                        )
                        return response.json()
                
                # Run async verification
                loop = asyncio.new_event_loop()
                asyncio.set_event_loop(loop)
                result = loop.run_until_complete(verify_remote())
                loop.close()
                
                if not result.get("valid"):
                    raise ValueError(result.get("message", "License verification failed"))
                    
            except Exception as e:
                # Log warning but don't fail activation if server is unreachable
                print(f"[WARNING] Remote license verification failed: {str(e)}")
                print("[WARNING] Proceeding with local activation only")
        
        # Step 3: Save to local database
        encrypted_key = self._encrypt_license_key(license_key)
        masked_key = self._mask_license_key(license_key)
        activated_at = datetime.utcnow().isoformat()
        
        # Store license key
        key_setting = self.db.exec(
            select(SystemSetting).where(SystemSetting.key == self.LICENSE_KEY_SETTING)
        ).first()
        
        if key_setting:
            key_setting.value = encrypted_key
            key_setting.updated_at = datetime.utcnow()
        else:
            key_setting = SystemSetting(
                key=self.LICENSE_KEY_SETTING,
                value=encrypted_key,
                description="Pro License Key (encrypted)",
                is_secret=True
            )
        
        self.db.add(key_setting)
        
        # Store activation timestamp
        time_setting = self.db.exec(
            select(SystemSetting).where(SystemSetting.key == self.LICENSE_ACTIVATED_AT_SETTING)
        ).first()
        
        if time_setting:
            time_setting.value = activated_at
            time_setting.updated_at = datetime.utcnow()
        else:
            time_setting = SystemSetting(
                key=self.LICENSE_ACTIVATED_AT_SETTING,
                value=activated_at,
                description="Pro License Activation Time"
            )
        
        self.db.add(time_setting)
        self.db.commit()
        
        return {
            "success": True,
            "message": "Pro License activated successfully",
            "license_key": masked_key,
            "activated_at": activated_at,
            "is_pro_enabled": True
        }
    
    def get_license_status(self) -> Dict:
        """
        Get current License status.
        
        Returns:
            Dict with license status information
        """
        license_setting = self.db.exec(
            select(SystemSetting).where(SystemSetting.key == self.LICENSE_KEY_SETTING)
        ).first()
        
        if not license_setting:
            return {
                "is_pro_enabled": False,
                "message": "No Pro License activated"
            }
        
        activated_at_setting = self.db.exec(
            select(SystemSetting).where(
                SystemSetting.key == self.LICENSE_ACTIVATED_AT_SETTING
            )
        ).first()
        
        return {
            "is_pro_enabled": True,
            "license_key": self._mask_license_key(license_setting.value),
            "activated_at": activated_at_setting.value if activated_at_setting else None,
            "message": "Pro License is active"
        }
    
    def is_pro_enabled(self) -> bool:
        """
        Quick check if Pro features are enabled.
        
        This is optimized for use in decorators and middleware.
        
        Returns:
            True if Pro License is active, False otherwise
        """
        license_setting = self.db.exec(
            select(SystemSetting).where(SystemSetting.key == self.LICENSE_KEY_SETTING)
        ).first()
        
        return license_setting is not None
    
    def deactivate_license(self) -> bool:
        """
        Deactivate the current Pro License.
        
        Returns:
            True if deactivation was successful, False if no license was active
        """
        license_setting = self.db.exec(
            select(SystemSetting).where(SystemSetting.key == self.LICENSE_KEY_SETTING)
        ).first()
        
        if not license_setting:
            return False
        
        # Delete license key
        self.db.delete(license_setting)
        
        # Delete activation timestamp
        activated_at_setting = self.db.exec(
            select(SystemSetting).where(
                SystemSetting.key == self.LICENSE_ACTIVATED_AT_SETTING
            )
        ).first()
        
        if activated_at_setting:
            self.db.delete(activated_at_setting)
        
        self.db.commit()
        
        return True
    
    def _mask_license_key(self, license_key: str) -> str:
        """
        Mask license key for display.
        
        Example: COMPUTEHUB-A1B2-C3D4-E5F6-G7H8 -> COMPUTEHUB-****-****-****-G7H8
        
        Args:
            license_key: The full license key
            
        Returns:
            Masked license key
        """
        parts = license_key.split('-')
        if len(parts) != 5:
            return "****-****-****-****"
        
        return f"{parts[0]}-****-****-****-{parts[4]}"
    
    def _encrypt_license_key(self, license_key: str) -> str:
        """
        Encrypt license key for secure storage.
        
        Uses Fernet encryption (same as API keys).
        
        Args:
            license_key: The license key to encrypt
            
        Returns:
            Encrypted license key (base64 encoded)
        """
        from cryptography.fernet import Fernet
        import os
        
        # Get encryption key from environment
        encryption_key = os.getenv("ENCRYPTION_KEY")
        if not encryption_key:
            # Fallback: store unencrypted (not recommended for production)
            print("[WARNING] ENCRYPTION_KEY not set, storing license key unencrypted")
            return license_key
        
        try:
            fernet = Fernet(encryption_key.encode())
            encrypted = fernet.encrypt(license_key.encode())
            return encrypted.decode()
        except Exception as e:
            print(f"[ERROR] Failed to encrypt license key: {str(e)}")
            return license_key
    
    def _decrypt_license_key(self, encrypted_key: str) -> str:
        """
        Decrypt license key from storage.
        
        Args:
            encrypted_key: The encrypted license key
            
        Returns:
            Decrypted license key
        """
        from cryptography.fernet import Fernet
        import os
        
        encryption_key = os.getenv("ENCRYPTION_KEY")
        if not encryption_key:
            # Assume it's unencrypted
            return encrypted_key
        
        try:
            fernet = Fernet(encryption_key.encode())
            decrypted = fernet.decrypt(encrypted_key.encode())
            return decrypted.decode()
        except Exception as e:
            # If decryption fails, assume it's already decrypted
            print(f"[WARNING] Failed to decrypt license key, using as-is: {str(e)}")
            return encrypted_key
