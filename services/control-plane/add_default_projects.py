"""
Add Default Projects to Existing Organizations

This script creates a "Default" project for all existing organizations
that don't have one yet.
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlmodel import Session, create_engine, text
from dotenv import load_dotenv

load_dotenv()

def get_database_url():
    return os.getenv("DATABASE_URL", "sqlite:///./test.db")

def add_default_projects():
    """Add default projects to all organizations"""
    database_url = get_database_url()
    if "sqlite" in database_url:
        engine = create_engine(database_url, connect_args={"check_same_thread": False}, echo=False)
    else:
        engine = create_engine(database_url, echo=False)
    
    print("[Migration] Adding default projects to organizations...")
    
    with Session(engine) as session:
        # Get all organizations
        orgs = session.exec(text("SELECT id, name, owner_id FROM organization")).all()
        
        for org_id, org_name, owner_id in orgs:
            # Check if organization already has a "Default" project
            existing = session.exec(text(
                "SELECT id FROM project WHERE organization_id = :org_id AND name = 'Default'"
            ).bindparams(org_id=org_id)).first()
            
            if existing:
                print(f"[Migration] Organization '{org_name}' already has a Default project")
                continue
            
            # Create default project using raw SQL
            session.exec(text("""
                INSERT INTO project (organization_id, name, description, created_by, created_at, updated_at)
                VALUES (:org_id, 'Default', 'Default project for deployments', :owner_id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            """).bindparams(org_id=org_id, owner_id=owner_id))
            
            print(f"[Migration] ✅ Created Default project for '{org_name}'")
        
        session.commit()
        print("[Migration] ✅ Default projects added successfully!")

if __name__ == "__main__":
    try:
        add_default_projects()
    except Exception as e:
        print(f"\n[Migration ERROR] {str(e)}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
