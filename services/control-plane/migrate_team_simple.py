"""
Simplified Team Collaboration Migration

Creates tables using raw SQL to avoid SQLAlchemy metadata issues.
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlmodel import Session, create_engine, text, select
from dotenv import load_dotenv
import re

load_dotenv()

def get_database_url():
    return os.getenv("DATABASE_URL", "sqlite:///./test.db")

def generate_slug(name: str) -> str:
    """Generate URL-friendly slug from name"""
    slug = name.lower()
    slug = re.sub(r'[^a-z0-9]+', '-', slug)
    slug = slug.strip('-')
    return slug

def run_migration():
    """Run the simplified migration"""
    database_url = get_database_url()
    if "sqlite" in database_url:
        engine = create_engine(database_url, connect_args={"check_same_thread": False}, echo=False)
    else:
        engine = create_engine(database_url, echo=False)
    
    print("[Migration] Starting team collaboration migration...")
    print(f"[Migration] Database: {database_url}")
    
    with Session(engine) as session:
        # Step 1: Create organization table
        print("[Migration] Creating organization table...")
        try:
            session.exec(text("""
                CREATE TABLE IF NOT EXISTS organization (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name VARCHAR(100) NOT NULL,
                    slug VARCHAR(100) NOT NULL UNIQUE,
                    owner_id INTEGER NOT NULL,
                    settings TEXT,
                    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (owner_id) REFERENCES user(id)
                )
            """))
            session.commit()
            print("[Migration] ✅ organization table created")
        except Exception as e:
            print(f"[Migration] organization table may already exist: {e}")
            session.rollback()
        
        # Step 2: Create organization_member table
        print("[Migration] Creating organization_member table...")
        try:
            session.exec(text("""
                CREATE TABLE IF NOT EXISTS organization_member (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    organization_id INTEGER NOT NULL,
                    user_id INTEGER NOT NULL,
                    role VARCHAR(20) NOT NULL DEFAULT 'member',
                    joined_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    invited_by INTEGER,
                    FOREIGN KEY (organization_id) REFERENCES organization(id),
                    FOREIGN KEY (user_id) REFERENCES user(id),
                    FOREIGN KEY (invited_by) REFERENCES user(id),
                    UNIQUE(organization_id, user_id)
                )
            """))
            session.commit()
            print("[Migration] ✅ organization_member table created")
        except Exception as e:
            print(f"[Migration] organization_member table may already exist: {e}")
            session.rollback()
        
        # Step 3: Create organization_invitation table
        print("[Migration] Creating organization_invitation table...")
        try:
            session.exec(text("""
                CREATE TABLE IF NOT EXISTS organization_invitation (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    organization_id INTEGER NOT NULL,
                    email VARCHAR(255) NOT NULL,
                    role VARCHAR(20) NOT NULL DEFAULT 'member',
                    token VARCHAR(100) NOT NULL UNIQUE,
                    status VARCHAR(20) NOT NULL DEFAULT 'pending',
                    invited_by INTEGER NOT NULL,
                    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    expires_at TIMESTAMP NOT NULL,
                    accepted_at TIMESTAMP,
                    FOREIGN KEY (organization_id) REFERENCES organization(id),
                    FOREIGN KEY (invited_by) REFERENCES user(id)
                )
            """))
            session.commit()
            print("[Migration] ✅ organization_invitation table created")
        except Exception as e:
            print(f"[Migration] organization_invitation table may already exist: {e}")
            session.rollback()
        
        # Step 4: Create project table
        print("[Migration] Creating project table...")
        try:
            session.exec(text("""
                CREATE TABLE IF NOT EXISTS project (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    organization_id INTEGER NOT NULL,
                    name VARCHAR(100) NOT NULL,
                    description TEXT,
                    created_by INTEGER NOT NULL,
                    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (organization_id) REFERENCES organization(id),
                    FOREIGN KEY (created_by) REFERENCES user(id)
                )
            """))
            session.commit()
            print("[Migration] ✅ project table created")
        except Exception as e:
            print(f"[Migration] project table may already exist: {e}")
            session.rollback()
        
        # Step 5: Create cost_allocation table
        print("[Migration] Creating cost_allocation table...")
        try:
            session.exec(text("""
                CREATE TABLE IF NOT EXISTS cost_allocation (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    organization_id INTEGER NOT NULL,
                    project_id INTEGER,
                    deployment_id INTEGER NOT NULL,
                    amount REAL NOT NULL,
                    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
                    period_start TIMESTAMP NOT NULL,
                    period_end TIMESTAMP NOT NULL,
                    recorded_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (organization_id) REFERENCES organization(id),
                    FOREIGN KEY (project_id) REFERENCES project(id),
                    FOREIGN KEY (deployment_id) REFERENCES deployment(id)
                )
            """))
            session.commit()
            print("[Migration] ✅ cost_allocation table created")
        except Exception as e:
            print(f"[Migration] cost_allocation table may already exist: {e}")
            session.rollback()
        
        # Step 6: Add columns to deployment table
        print("[Migration] Adding columns to deployment table...")
        try:
            session.exec(text("ALTER TABLE deployment ADD COLUMN organization_id INTEGER"))
            print("[Migration] ✅ Added organization_id column")
        except Exception as e:
            print(f"[Migration] organization_id column may already exist: {e}")
            session.rollback()
        
        try:
            session.exec(text("ALTER TABLE deployment ADD COLUMN project_id INTEGER"))
            print("[Migration] ✅ Added project_id column")
        except Exception as e:
            print(f"[Migration] project_id column may already exist: {e}")
            session.rollback()
        
        # Step 7: Create personal organizations for existing users
        print("[Migration] Creating personal organizations for users...")
        users = session.exec(text("SELECT id, email FROM user")).all()
        
        for user_id, email in users:
            # Check if user already has an organization
            existing = session.exec(text(
                "SELECT id FROM organization_member WHERE user_id = :user_id"
            ).bindparams(user_id=user_id)).first()
            
            if existing:
                print(f"[Migration] User {email} already has an organization")
                continue
            
            counter = 1
            
            while session.exec(text("SELECT id FROM organization WHERE slug = :slug").bindparams(slug=slug)).first():
                slug = f"{base_slug}-{counter}"
                counter += 1
            
            # Create organization
            result = session.exec(text("""
                INSERT INTO organization (name, slug, owner_id)
                VALUES (:name, :slug, :owner_id)
            """).bindparams(
                name=f"{email}'s Organization",
                slug=slug,
                owner_id=user_id
            ))
            session.commit()
            
            org_id = result.lastrowid
            
            # Add user as owner
            session.exec(text("""
                INSERT INTO organization_member (organization_id, user_id, role)
                VALUES (:org_id, :user_id, 'owner')
            """).bindparams(org_id=org_id, user_id=user_id))
            session.commit()
            
            print(f"[Migration] ✅ Created organization for {email}")
        
        # Step 8: Migrate deployments to organizations
        print("[Migration] Migrating deployments...")
        deployments = session.exec(text("SELECT id, user_id FROM deployment WHERE organization_id IS NULL")).all()
        
        for deployment_id, user_id in deployments:
            # Find user's organization
            org_member = session.exec(text("""
                SELECT organization_id FROM organization_member 
                WHERE user_id = :user_id AND role = 'owner'
            """).bindparams(user_id=user_id)).first()
            
            if org_member:
                org_id = org_member[0]
                session.exec(text("""
                    UPDATE deployment SET organization_id = :org_id WHERE id = :deployment_id
                """).bindparams(org_id=org_id, deployment_id=deployment_id))
                session.commit()
                print(f"[Migration] ✅ Migrated deployment {deployment_id}")
        
    print("[Migration] ✅ Migration completed successfully!")

if __name__ == "__main__":
    try:
        run_migration()
    except Exception as e:
        print(f"\n[Migration ERROR] {str(e)}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
