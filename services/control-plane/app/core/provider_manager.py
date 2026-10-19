from typing import Optional
from sqlmodel import Session, select
from app.adapters.base import ProviderAdapter
from app.adapters.local_adapter import LocalAdapter
from app.adapters.runpod_adapter import RunPodAdapter
from app.adapters.vast_adapter import VastAdapter
from app.core.models import Deployment, ProviderType, Provider, User, UserProviderBinding
from app.core.encryption import decrypt_value, get_encryption

class ProviderManager:
    _adapters = {}

    @classmethod
    def get_deployment_adapter(cls, deployment: Deployment, session: Session) -> ProviderAdapter:
        if deployment.provider == ProviderType.LOCAL:
            return cls.get_adapter(deployment.provider, session)

        owner = session.get(User, deployment.user_id)
        if not owner or not owner.clerk_id:
            raise ValueError("Deployment owner is not connected to an authentication account")

        binding = session.exec(
            select(UserProviderBinding).where(
                UserProviderBinding.user_id == owner.clerk_id,
                UserProviderBinding.provider_type == deployment.provider,
                UserProviderBinding.is_active == True,
            )
        ).first()
        if not binding:
            raise ValueError(f"No active {deployment.provider.value} connection for deployment owner")

        api_key = get_encryption().decrypt(binding.api_key_encrypted)
        return cls.get_adapter(deployment.provider, session, user_api_key=api_key)

    @classmethod
    def get_user_adapter(cls, user: User, provider_type: ProviderType, session: Session) -> ProviderAdapter:
        if provider_type == ProviderType.LOCAL:
            return cls.get_adapter(provider_type, session)
        if not user.clerk_id:
            raise ValueError("User is not connected to an authentication account")
        binding = session.exec(
            select(UserProviderBinding).where(
                UserProviderBinding.user_id == user.clerk_id,
                UserProviderBinding.provider_type == provider_type,
                UserProviderBinding.is_active == True,
            )
        ).first()
        if not binding:
            raise ValueError(f"No active {provider_type.value} connection for user")
        api_key = get_encryption().decrypt(binding.api_key_encrypted)
        return cls.get_adapter(provider_type, session, user_api_key=api_key)

    @classmethod
    def get_adapter(cls, provider_type: str, session: Optional[Session] = None, user_api_key: Optional[str] = None) -> ProviderAdapter:
        """
        Get provider adapter instance.
        
        Args:
            provider_type: Type of provider (runpod, vast, etc.)
            session: Database session for loading provider config
            user_api_key: Optional user-specific API key (takes precedence over DB/env config)
        """
        # If user_api_key is provided, use it directly (user provider binding)
        if user_api_key:
            if provider_type == ProviderType.RUNPOD:
                return RunPodAdapter(api_key=user_api_key, config=None)
            elif provider_type == ProviderType.VAST:
                return VastAdapter(api_key=user_api_key, config=None)
            # Add other provider types as needed
        
        # If session is provided, try to load specific provider config from DB
        if session:
            provider_config = None
            
            if provider_type == ProviderType.AUTO:
                # Smart Scheduling Logic: Pick highest weighted enabled provider
                provider_config = session.exec(
                    select(Provider)
                    .where(Provider.is_enabled == True)
                    .order_by(Provider.weight.desc())
                ).first()
                if provider_config:
                    # Update provider_type to the concrete type selected
                    provider_type = provider_config.type
            else:
                # Specific provider type requested
                provider_config = session.exec(
                    select(Provider)
                    .where(Provider.type == provider_type)
                    .where(Provider.is_enabled == True)
                    .order_by(Provider.weight.desc())
                ).first()
            
            if provider_config:
                api_key = decrypt_value(provider_config.api_key) if provider_config.api_key else None
                # Dynamically instantiate adapter with DB config
                if provider_config.type == ProviderType.RUNPOD:
                    return RunPodAdapter(
                        api_key=api_key,
                        config=None 
                    )
                elif provider_config.type == ProviderType.VAST:
                    return VastAdapter(
                        api_key=api_key,
                        config=None
                    )
                # Add other types here
        
        # Fallback to static/env-based configuration if no DB config found or no session
        if provider_type == ProviderType.AUTO:
            # Fallback for AUTO if no DB session or no enabled providers: Default to RunPod (env)
            provider_type = ProviderType.RUNPOD

        if provider_type not in cls._adapters:
            if provider_type == ProviderType.LOCAL:
                cls._adapters[provider_type] = LocalAdapter()
            elif provider_type == ProviderType.RUNPOD:
                cls._adapters[provider_type] = RunPodAdapter()
            elif provider_type == ProviderType.VAST:
                cls._adapters[provider_type] = VastAdapter()
            else:
                # If we are here, it might be a new dynamic provider type or error
                # For now assume it's one of the known types
                raise ValueError(f"Unknown provider type: {provider_type}")
        
        return cls._adapters[provider_type]

    @classmethod
    def resolve_provider(cls, provider_type: str, session: Session) -> str:
        """
        Resolve AUTO request to a concrete provider type based on weights.
        Returns the concrete provider type (e.g., 'runpod', 'vast').
        """
        if provider_type != ProviderType.AUTO:
            return provider_type
            
        # Smart Scheduling Logic
        provider_config = session.exec(
            select(Provider)
            .where(Provider.is_enabled == True)
            .order_by(Provider.weight.desc())
        ).first()
        
        if provider_config:
            return provider_config.type
            
        # Fallback
        return ProviderType.RUNPOD
