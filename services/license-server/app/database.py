"""
Database configuration for License Verification Server.
"""

from sqlmodel import SQLModel, create_engine, Session
from app.models import License, VerificationLog

DATABASE_URL = "sqlite:///./data/licenses.db"

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False},
    echo=False
)


def init_db():
    """Initialize database and create tables."""
    SQLModel.metadata.create_all(engine)


def get_session():
    """Get database session."""
    with Session(engine) as session:
        yield session
