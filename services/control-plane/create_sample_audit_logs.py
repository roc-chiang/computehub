"""
Script to create sample audit logs for testing
"""
from sqlmodel import Session, create_engine
from app.core.models import AuditLog
from app.core.config import settings
from datetime import datetime, timedelta
import random

# Create engine
engine = create_engine(str(settings.DATABASE_URL))

# Sample data
actions = ["CREATE", "UPDATE", "DELETE", "LOGIN", "LOGOUT"]
resources = ["user", "deployment", "provider", "setting"]
users = [
    ("test1@example.com", "user_test1"),
    ("test2@example.com", "user_test2"),
    ("admin@example.com", "user_admin"),
]
statuses = ["success", "success", "success", "success", "failed"]  # 80% success rate

descriptions = {
    "CREATE": "Created new {resource}",
    "UPDATE": "Updated {resource} configuration",
    "DELETE": "Deleted {resource}",
    "LOGIN": "User logged in",
    "LOGOUT": "User logged out",
}

# Create sample logs
sample_logs = []
for i in range(50):
    action = random.choice(actions)
    resource = random.choice(resources)
    user_email, user_id = random.choice(users)
    status = random.choice(statuses)
    
    # Create timestamp (spread over last 7 days)
    days_ago = random.randint(0, 7)
    hours_ago = random.randint(0, 23)
    timestamp = datetime.utcnow() - timedelta(days=days_ago, hours=hours_ago)
    
    log = AuditLog(
        timestamp=timestamp,
        action_type=action,
        resource_type=resource,
        resource_id=f"{resource}_{random.randint(1, 100)}",
        user_id=user_id,
        user_email=user_email,
        is_admin=user_email == "admin@example.com",
        ip_address=f"192.168.1.{random.randint(1, 255)}",
        user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        description=descriptions[action].format(resource=resource),
        details_json='{"key": "value"}',
        status=status,
        error_message="Operation failed" if status == "failed" else None
    )
    sample_logs.append(log)

with Session(engine) as session:
    for log in sample_logs:
        session.add(log)
    
    session.commit()
    print(f"\n✅ Created {len(sample_logs)} sample audit logs!")
    print(f"   - Actions: {', '.join(set(actions))}")
    print(f"   - Resources: {', '.join(set(resources))}")
    print(f"   - Time range: Last 7 days")
