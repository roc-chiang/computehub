from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "ComputeHub"

    # Database
    DATABASE_URL: str = None
    
    # PostgreSQL (optional, only if not using DATABASE_URL)
    POSTGRES_SERVER: str = "localhost"
    POSTGRES_USER: str = "postgres"
    POSTGRES_PASSWORD: str = "postgres"
    POSTGRES_DB: str = "computehub"
    REDIS_HOST: str = "localhost"
    REDIS_PORT: int = 6379
    
    # MinIO
    MINIO_ENDPOINT: str = "localhost:9000"
    MINIO_ACCESS_KEY: str = "minio"
    MINIO_SECRET_KEY: str = "minio123"
    MINIO_BUCKET: str = "models"

    # Security & Env
    SECRET_KEY: str = "supersecret"
    ENVIRONMENT: str = "development"

    # Provider API Keys
    RUNPOD_API_KEY: str = ""
    VASTAI_API_KEY: str = ""
    LAMBDA_API_KEY: str = ""
    
    # Testing Mode
    DRY_RUN: bool = False  # If True, don't make real API calls to providers

    class Config:
        env_file = ".env"
        extra = "ignore"  # Ignore other extra fields if any

settings = Settings()
