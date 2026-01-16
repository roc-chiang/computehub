"""
Update Organization Names to be User-Friendly

This script updates organization names from Clerk IDs to actual user names.
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlmodel import Session, create_engine, text, select
from dotenv import load_dotenv
from app.core.models import User
from app.core.team_models import Organization

load_dotenv()

def get_database_url():
    return os.getenv("DATABASE_URL", "sqlite:///./test.db")

def get_friendly_name(email: str) -> str:
    """
    Extract a friendly name from email
    Examples:
    - john.doe@example.com -> John Doe
    - user_123@clerk.user -> User 123
    """
    # Get the part before @
    local_part = email.split('@')[0]
    
    # If it's a clerk user ID, extract the readable part
    if local_part.startswith('user_'):
        # user_36TuRmo2wEgdG8yGwlYKfJ4txWx -> User
        return "My"
    
    # Replace dots and underscores with spaces and title case
    name = local_part.replace('.', ' ').replace('_', ' ')
    return name.title()

def update_organization_names():
    """Update all organization names to be more friendly"""
    database_url = get_database_url()
    if "sqlite" in database_url:
        engine = create_engine(database_url, connect_args={"check_same_thread": False}, echo=False)
    else:
        engine = create_engine(database_url, echo=False)
    
    print("[Update] Updating organization names...")
    
    with Session(engine) as session:
        # Get all organizations
        organizations = session.exec(select(Organization)).all()
        
        for org in organizations:
            # Skip if name doesn't end with "'s Organization"
            if not org.name.endswith("'s Organization"):
                print(f"[Update] Skipping '{org.name}' - doesn't match pattern")
                continue
            
            # Get the owner
            owner = session.get(User, org.owner_id)
            if not owner:
                print(f"[Update] Warning: Owner not found for org {org.id}")
                continue
            
            # Generate friendly name
            friendly_name = get_friendly_name(owner.email)
            new_org_name = f"{friendly_name}'s Organization"
            
            print(f"[Update] Updating: '{org.name}' -> '{new_org_name}'")
            
            # Update organization name
            org.name = new_org_name
            session.add(org)
        
        session.commit()
        print("[Update] ✅ Organization names updated successfully!")

if __name__ == "__main__":
    try:
        update_organization_names()
    except Exception as e:
        print(f"\n[Update ERROR] {str(e)}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
