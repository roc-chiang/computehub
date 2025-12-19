from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "ComputeHub"
    POSTGRES_SERVER: str
    POSTGRES_USER: str
    POSTGRES_PASSWORD: str
    POSTGRES_DB: str = "computehub"
    REDIS_HOST: str = "localhost"
    REDIS_PORT: int = 6379
    DATABASE_URL: str = None
    
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
