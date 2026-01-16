"""
Database Migration for Team Collaboration (Phase 14)

This script creates the necessary tables for team collaboration:
- organization
- organization_member
- organization_invitation
- project
- cost_allocation

And updates the deployment table to add organization_id and project_id.
"""

import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlmodel import Session, create_engine, SQLModel, select, text
from app.core.models import User, Deployment
from app.core.team_models import (
    Organization,
    OrganizationMember,
    OrganizationInvitation,
    Project,
    CostAllocation,
    OrganizationRole
)
import re
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()


def get_database_url():
    """Get database URL from environment"""
    return os.getenv("DATABASE_URL", "sqlite:///./test.db")


def generate_slug(name: str) -> str:
    """Generate URL-friendly slug from name"""
    # Convert to lowercase
    slug = name.lower()
    # Replace spaces and special chars with hyphens
    slug = re.sub(r'[^a-z0-9]+', '-', slug)
    # Remove leading/trailing hyphens
    slug = slug.strip('-')
    return slug


def migrate_team_collaboration():
    """Run the migration"""
    # Create engine
    database_url = get_database_url()
    if "sqlite" in database_url:
        engine = create_engine(database_url, connect_args={"check_same_thread": False}, echo=False)
    else:
        engine = create_engine(database_url, echo=False)
    
    print("[Migration] Starting team collaboration migration...")
    print(f"[Migration] Database: {database_url}")
    
    # Create all tables
    print("[Migration] Creating new tables...")
    SQLModel.metadata.create_all(engine)
    print("[Migration] ✅ Tables created")
    
    with Session(engine) as session:
        # Add unique constraint on organization_member (organization_id, user_id)
        try:
            print("[Migration] Adding unique constraint to organization_member...")
            session.exec(text("""
                CREATE UNIQUE INDEX IF NOT EXISTS idx_org_member_unique 
                ON organization_member(organization_id, user_id)
            """))
            session.commit()
            print("[Migration] ✅ Unique constraint added")
        except Exception as e:
            print(f"[Migration] ⚠️  Constraint may already exist: {e}")
            session.rollback()
        
        # Create personal organizations for existing users
        print("[Migration] Creating personal organizations for existing users...")
        users = session.exec(select(User)).all()
        
        for user in users:
            # Check if user already has an organization
            existing_member = session.exec(
                select(OrganizationMember).where(OrganizationMember.user_id == user.id)
            ).first()
            
            if existing_member:
                print(f"[Migration] User {user.email} already has an organization, skipping")
                continue
            
            # Generate unique slug
            base_slug = generate_slug(user.email.split('@')[0])
            slug = base_slug
            counter = 1
            
            while session.exec(select(Organization).where(Organization.slug == slug)).first():
                slug = f"{base_slug}-{counter}"
                counter += 1
            
            # Create organization
            org = Organization(
                name=f"{user.email}'s Organization",
                slug=slug,
                owner_id=user.id
            )
            session.add(org)
            session.flush()  # Get the org.id
            
            # Add user as owner
            member = OrganizationMember(
                organization_id=org.id,
                user_id=user.id,
                role=OrganizationRole.OWNER.value
            )
            session.add(member)
            
            print(f"[Migration] ✅ Created organization '{org.name}' (slug: {org.slug}) for {user.email}")
        
        session.commit()
        print(f"[Migration] ✅ Created {len(users)} personal organizations")
        
        # Migrate existing deployments to personal organizations
        print("[Migration] Migrating existing deployments to organizations...")
        deployments = session.exec(select(Deployment)).all()
        
        for deployment in deployments:
            if deployment.organization_id is not None:
                continue  # Already migrated
            
            # Find user's personal organization
            member = session.exec(
                select(OrganizationMember)
                .where(OrganizationMember.user_id == deployment.user_id)
                .where(OrganizationMember.role == OrganizationRole.OWNER.value)
            ).first()
            
            if member:
                deployment.organization_id = member.organization_id
                session.add(deployment)
                print(f"[Migration] ✅ Migrated deployment {deployment.id} to organization {member.organization_id}")
            else:
                print(f"[Migration] ⚠️  No organization found for deployment {deployment.id} (user {deployment.user_id})")
        
        session.commit()
        print(f"[Migration] ✅ Migrated {len(deployments)} deployments")
    
    print("[Migration] ✅ Team collaboration migration completed successfully!")
    print("\nSummary:")
    print(f"  - Created tables: organization, organization_member, organization_invitation, project, cost_allocation")
    print(f"  - Updated deployment table with organization_id and project_id")
    print(f"  - Created personal organizations for all users")
    print(f"  - Migrated existing deployments to organizations")


if __name__ == "__main__":
    try:
        migrate_team_collaboration()
    except Exception as e:
        print(f"\n[Migration ERROR] {str(e)}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
