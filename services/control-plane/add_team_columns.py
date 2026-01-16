"""
Simple migration to add organization_id and project_id to deployment table
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlmodel import Session, create_engine, text
from dotenv import load_dotenv

load_dotenv()

def get_database_url():
    return os.getenv("DATABASE_URL", "sqlite:///./test.db")

def add_columns_to_deployment():
    """Add organization_id and project_id columns to deployment table"""
    database_url = get_database_url()
    if "sqlite" in database_url:
        engine = create_engine(database_url, connect_args={"check_same_thread": False}, echo=False)
    else:
        engine = create_engine(database_url, echo=False)
    
    print("[Migration] Adding columns to deployment table...")
    
    with Session(engine) as session:
        try:
            # Add organization_id column
            session.exec(text("""
                ALTER TABLE deployment 
                ADD COLUMN organization_id INTEGER REFERENCES organization(id)
            """))
            print("[Migration] ✅ Added organization_id column")
        except Exception as e:
            print(f"[Migration] organization_id column may already exist: {e}")
            session.rollback()
        
        try:
            # Add project_id column
            session.exec(text("""
                ALTER TABLE deployment 
                ADD COLUMN project_id INTEGER REFERENCES project(id)
            """))
            print("[Migration] ✅ Added project_id column")
        except Exception as e:
            print(f"[Migration] project_id column may already exist: {e}")
            session.rollback()
        
        session.commit()
    
    print("[Migration] ✅ Deployment table updated")

if __name__ == "__main__":
    add_columns_to_deployment()
