"""
Script to create test users for admin panel testing
"""
from sqlmodel import Session, create_engine
from app.core.models import User
from app.core.config import settings
from datetime import datetime

# Create engine
engine = create_engine(str(settings.DATABASE_URL))

# Create test users
test_users = [
    User(
        email="test1@example.com",
        clerk_id="user_test1",
        auth_provider="email",
        plan="free",
        created_at=datetime.utcnow()
    ),
    User(
        email="test2@example.com",
        clerk_id="user_test2",
        auth_provider="email",
        plan="pro",
        created_at=datetime.utcnow()
    ),
    User(
        email="test3@example.com",
        clerk_id="user_test3",
        auth_provider="email",
        plan="team",
        created_at=datetime.utcnow()
    ),
]

with Session(engine) as session:
    for user in test_users:
        # Check if user already exists
        existing = session.query(User).filter(User.email == user.email).first()
        if not existing:
            session.add(user)
            print(f"Created user: {user.email}")
        else:
            print(f"User already exists: {user.email}")
    
    session.commit()
    print("\nTest users created successfully!")
