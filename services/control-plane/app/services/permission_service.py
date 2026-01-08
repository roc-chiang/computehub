"""
Permission Service
Handles feature access control based on subscription tier
"""

from typing import Optional
from sqlmodel import Session, select
from fastapi import HTTPException

from app.core.models import UserSubscription, SubscriptionTier


class PermissionService:
    """Service for checking feature permissions"""
    
    # Feature limits by tier
    PLAN_LIMITS = {
        "basic": {
            "max_deployments": 3,
            "max_providers": 1,
            "automation": False,
            "advanced_automation": False,
            "notifications": False,
            "team_features": False,
            "priority_support": False
        },
        "pro": {
            "max_deployments": 10,
            "max_providers": 3,
            "automation": True,
            "advanced_automation": False,
            "notifications": True,
            "team_features": False,
            "priority_support": True
        },
        "enterprise": {
            "max_deployments": -1,  # unlimited
            "max_providers": -1,
            "automation": True,
            "advanced_automation": True,
            "notifications": True,
            "team_features": True,
            "priority_support": True
        }
    }
    
    def __init__(self, session: Session):
        self.session = session
    
    def get_user_tier(self, user_id: str) -> str:
        """Get user's subscription tier"""
        statement = select(UserSubscription).where(
            UserSubscription.user_id == user_id
        )
        subscription = self.session.exec(statement).first()
        
        if not subscription:
            return "basic"
        
        return subscription.tier.value
    
    def get_plan_limits(self, tier: str) -> dict:
        """Get plan limits for a tier"""
        return self.PLAN_LIMITS.get(tier, self.PLAN_LIMITS["basic"])
    
    def check_feature_access(self, user_id: str, feature: str) -> bool:
        """
        Check if user has access to a feature
        
        Args:
            user_id: User ID
            feature: Feature name (e.g., 'automation', 'advanced_automation')
        
        Returns:
            True if user has access
        """
        tier = self.get_user_tier(user_id)
        limits = self.get_plan_limits(tier)
        
        return limits.get(feature, False)
    
    def check_deployment_limit(self, user_id: str, current_count: int) -> bool:
        """
        Check if user can create more deployments
        
        Args:
            user_id: User ID
            current_count: Current number of deployments
        
        Returns:
            True if user can create more
        """
        tier = self.get_user_tier(user_id)
        limits = self.get_plan_limits(tier)
        max_deployments = limits.get("max_deployments", 3)
        
        # -1 means unlimited
        if max_deployments == -1:
            return True
        
        return current_count < max_deployments
    
    def check_provider_limit(self, user_id: str, current_count: int) -> bool:
        """
        Check if user can add more providers
        
        Args:
            user_id: User ID
            current_count: Current number of providers
        
        Returns:
            True if user can add more
        """
        tier = self.get_user_tier(user_id)
        limits = self.get_plan_limits(tier)
        max_providers = limits.get("max_providers", 1)
        
        # -1 means unlimited
        if max_providers == -1:
            return True
        
        return current_count < max_providers
    
    def require_feature(self, user_id: str, feature: str, feature_name: str = None):
        """
        Require a feature, raise HTTPException if not available
        
        Args:
            user_id: User ID
            feature: Feature key
            feature_name: Human-readable feature name
        
        Raises:
            HTTPException: If feature not available
        """
        if not self.check_feature_access(user_id, feature):
            tier = self.get_user_tier(user_id)
            required_tier = "Pro" if feature != "advanced_automation" else "Enterprise"
            
            raise HTTPException(
                status_code=402,  # Payment Required
                detail={
                    "error": "feature_not_available",
                    "message": f"{feature_name or feature} requires {required_tier} plan",
                    "current_tier": tier,
                    "required_tier": required_tier.lower()
                }
            )
    
    def require_deployment_limit(self, user_id: str, current_count: int):
        """
        Require deployment limit, raise HTTPException if exceeded
        
        Args:
            user_id: User ID
            current_count: Current deployment count
        
        Raises:
            HTTPException: If limit exceeded
        """
        if not self.check_deployment_limit(user_id, current_count):
            tier = self.get_user_tier(user_id)
            limits = self.get_plan_limits(tier)
            max_deployments = limits.get("max_deployments", 3)
            
            raise HTTPException(
                status_code=402,
                detail={
                    "error": "deployment_limit_exceeded",
                    "message": f"Deployment limit reached ({max_deployments}). Upgrade to create more.",
                    "current_tier": tier,
                    "current_count": current_count,
                    "max_deployments": max_deployments
                }
            )
    
    def require_provider_limit(self, user_id: str, current_count: int):
        """
        Require provider limit, raise HTTPException if exceeded
        
        Args:
            user_id: User ID
            current_count: Current provider count
        
        Raises:
            HTTPException: If limit exceeded
        """
        if not self.check_provider_limit(user_id, current_count):
            tier = self.get_user_tier(user_id)
            limits = self.get_plan_limits(tier)
            max_providers = limits.get("max_providers", 1)
            
            raise HTTPException(
                status_code=402,
                detail={
                    "error": "provider_limit_exceeded",
                    "message": f"Provider limit reached ({max_providers}). Upgrade to add more.",
                    "current_tier": tier,
                    "current_count": current_count,
                    "max_providers": max_providers
                }
            )


def get_permission_service(session: Session) -> PermissionService:
    """Get permission service instance"""
    return PermissionService(session)
