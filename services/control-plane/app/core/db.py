from sqlmodel import SQLModel, create_engine, Session
from app.core.config import settings
from app.core.models import (
    User, Deployment, TaskLog, Usage, DeploymentTemplate, 
    UserSubscription, SubscriptionEvent,
    NotificationSettings, NotificationHistory,  # Notification models
    TemplateCategory  # Template category enum
)

# Construct Database URL
if settings.DATABASE_URL:
    DATABASE_URL = settings.DATABASE_URL
else:
    DATABASE_URL = f"postgresql://{settings.POSTGRES_USER}:{settings.POSTGRES_PASSWORD}@{settings.POSTGRES_SERVER}/{settings.POSTGRES_DB}"

if "sqlite" in DATABASE_URL:
    engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False}, echo=False)
else:
    engine = create_engine(DATABASE_URL, echo=False)

def init_db():
    SQLModel.metadata.create_all(engine)
    
    # Seed initial data
    from app.core.seed_data import seed_database
    with Session(engine) as session:
        seed_database(session)

def get_session():
    with Session(engine) as session:
        yield session
