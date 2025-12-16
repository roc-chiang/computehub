"""
Migration script to add provider_id column to deployment table
"""
import sqlite3
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlmodel import Session, select
from app.core.db import engine
from app.core.models import Provider, ProviderType

def add_provider_id_column():
    """Add provider_id column to deployment table and populate it."""
    
    # Connect directly to SQLite (use test.db as per config)
    conn = sqlite3.connect('test.db')
    cursor = conn.cursor()
    
    try:
        # Check if column already exists
        cursor.execute("PRAGMA table_info(deployment)")
        columns = cursor.fetchall()
        column_names = [col[1] for col in columns]
        
        if 'provider_id' in column_names:
            print("✓ provider_id column already exists")
        else:
            print("Adding provider_id column...")
            cursor.execute("ALTER TABLE deployment ADD COLUMN provider_id INTEGER")
            conn.commit()
            print("✓ provider_id column added")
        
        # Get provider mapping
        with Session(engine) as session:
            providers = session.exec(select(Provider)).all()
            provider_map = {p.type.value: p.id for p in providers}
            
            print(f"\nProvider mapping:")
            for ptype, pid in provider_map.items():
                print(f"  {ptype} -> ID {pid}")
        
        # Update deployments with provider_id
        print(f"\nUpdating deployments...")
        for provider_type, provider_id in provider_map.items():
            cursor.execute(
                "UPDATE deployment SET provider_id = ? WHERE provider = ?",
                (provider_id, provider_type)
            )
            updated = cursor.rowcount
            print(f"  Updated {updated} deployments with provider type '{provider_type}' to provider_id {provider_id}")
        
        conn.commit()
        
        # Verify
        cursor.execute("SELECT COUNT(*) FROM deployment WHERE provider_id IS NOT NULL")
        count = cursor.fetchone()[0]
        print(f"\n✅ Migration complete! {count} deployments now have provider_id")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        conn.rollback()
        raise
    finally:
        conn.close()

if __name__ == "__main__":
    print("Starting deployment provider_id migration...")
    print("=" * 60)
    add_provider_id_column()
    print("=" * 60)
    print("Migration complete!")
