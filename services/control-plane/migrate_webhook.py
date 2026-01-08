"""
Database migration for Phase 10: Webhook Notifications

Adds webhook fields to notification_settings table:
- webhook_url
- webhook_secret
- enable_webhook

Usage:
    python migrate_webhook.py
"""

import sqlite3
from pathlib import Path


def get_db_path():
    """Get the database file path"""
    db_files = list(Path('.').glob('*.db'))
    if db_files:
        return str(db_files[0])
    return 'computehub.db'


def migrate():
    """Add webhook fields to notification_settings table"""
    db_path = get_db_path()
    print(f"[Migration] Using database: {db_path}")
    
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    try:
        # Check if columns already exist
        cursor.execute("PRAGMA table_info(notification_settings)")
        columns = [col[1] for col in cursor.fetchall()]
        
        # Add webhook_url if not exists
        if 'webhook_url' not in columns:
            print("[Migration] Adding webhook_url column...")
            cursor.execute("""
                ALTER TABLE notification_settings 
                ADD COLUMN webhook_url TEXT
            """)
            print("[Migration] ✓ webhook_url column added")
        else:
            print("[Migration] webhook_url column already exists")
        
        # Add webhook_secret if not exists
        if 'webhook_secret' not in columns:
            print("[Migration] Adding webhook_secret column...")
            cursor.execute("""
                ALTER TABLE notification_settings 
                ADD COLUMN webhook_secret TEXT
            """)
            print("[Migration] ✓ webhook_secret column added")
        else:
            print("[Migration] webhook_secret column already exists")
        
        # Add enable_webhook if not exists
        if 'enable_webhook' not in columns:
            print("[Migration] Adding enable_webhook column...")
            cursor.execute("""
                ALTER TABLE notification_settings 
                ADD COLUMN enable_webhook BOOLEAN DEFAULT 0
            """)
            print("[Migration] ✓ enable_webhook column added")
        else:
            print("[Migration] enable_webhook column already exists")
        
        conn.commit()
        print("\n[Migration] ✅ Migration completed successfully!")
        
        # Verify
        cursor.execute("PRAGMA table_info(notification_settings)")
        columns = cursor.fetchall()
        print(f"\n[Migration] notification_settings table now has {len(columns)} columns:")
        for col in columns:
            print(f"  - {col[1]} ({col[2]})")
        
    except sqlite3.Error as e:
        print(f"\n[Migration] ❌ Error: {e}")
        conn.rollback()
        raise
    finally:
        conn.close()


if __name__ == "__main__":
    print("=" * 60)
    print("Phase 10: Webhook Notifications Migration")
    print("=" * 60)
    migrate()
    print("\n[Migration] Done!")
