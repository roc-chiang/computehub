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
        2. (Future) Remote verification via API
        3. Save to database
        4. Return activation status
        
        Args:
            license_key: The license key to activate
            
        Returns:
            Dict with activation status and details
            
        Raises:
            ValueError: If license key format is invalid
        """
        # Normalize license key
        license_key = license_key.strip().upper()
        
        # Validate format
        if not self.validate_format(license_key):
            raise ValueError(
                "Invalid license key format. "
                "Expected format: COMPUTEHUB-XXXX-XXXX-XXXX-XXXX"
            )
        
        # TODO: Remote verification (Phase 2)
        # For now, we accept any valid format
        
        # Check if already activated
        existing = self.db.exec(
            select(SystemSetting).where(SystemSetting.key == self.LICENSE_KEY_SETTING)
        ).first()
        
        if existing:
            # Update existing
            existing.value = license_key
            existing.updated_at = datetime.utcnow()
            self.db.add(existing)
        else:
            # Create new
            setting = SystemSetting(
                key=self.LICENSE_KEY_SETTING,
                value=license_key,
                description="Pro License Key",
                is_secret=True,
                updated_at=datetime.utcnow()
            )
            self.db.add(setting)
        
        # Save activation timestamp
        activated_at_setting = self.db.exec(
            select(SystemSetting).where(
                SystemSetting.key == self.LICENSE_ACTIVATED_AT_SETTING
            )
        ).first()
        
        activation_time = datetime.utcnow().isoformat()
        
        if activated_at_setting:
            activated_at_setting.value = activation_time
            activated_at_setting.updated_at = datetime.utcnow()
            self.db.add(activated_at_setting)
        else:
            activated_at_setting = SystemSetting(
                key=self.LICENSE_ACTIVATED_AT_SETTING,
                value=activation_time,
                description="Pro License Activation Timestamp",
                is_secret=False,
                updated_at=datetime.utcnow()
            )
            self.db.add(activated_at_setting)
        
        self.db.commit()
        
        return {
            "success": True,
            "message": "Pro License activated successfully",
            "license_key": self._mask_license_key(license_key),
            "activated_at": activation_time,
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
