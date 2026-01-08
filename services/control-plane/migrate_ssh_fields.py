"""
添加 SSH 字段到 Deployment 表

Usage:
    python migrate_ssh_fields.py
"""

import sqlite3
from pathlib import Path


def get_db_path():
    """Get the database file path"""
    if Path('test.db').exists():
        return 'test.db'
    
    db_files = list(Path('.').glob('*.db'))
    if db_files:
        return str(db_files[0])
    return 'test.db'


def migrate():
    """Add SSH fields to deployment table"""
    db_path = get_db_path()
    print(f"[Migration] Using database: {db_path}")
    
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    try:
        # Check if columns already exist
        cursor.execute("PRAGMA table_info(deployment)")
        columns = [col[1] for col in cursor.fetchall()]
        
        # Add ssh_host if not exists
        if 'ssh_host' not in columns:
            print("[Migration] Adding ssh_host column...")
            cursor.execute("ALTER TABLE deployment ADD COLUMN ssh_host TEXT")
        
        # Add ssh_port if not exists
        if 'ssh_port' not in columns:
            print("[Migration] Adding ssh_port column...")
            cursor.execute("ALTER TABLE deployment ADD COLUMN ssh_port INTEGER DEFAULT 22")
        
        # Add ssh_username if not exists
        if 'ssh_username' not in columns:
            print("[Migration] Adding ssh_username column...")
            cursor.execute("ALTER TABLE deployment ADD COLUMN ssh_username TEXT DEFAULT 'root'")
        
        # Add ssh_password if not exists
        if 'ssh_password' not in columns:
            print("[Migration] Adding ssh_password column...")
            cursor.execute("ALTER TABLE deployment ADD COLUMN ssh_password TEXT")
        
        conn.commit()
        print("\n[Migration] ✅ SSH fields added successfully!")
        
    except sqlite3.Error as e:
        print(f"\n[Migration] ❌ Error: {e}")
        conn.rollback()
        raise
    finally:
        conn.close()


if __name__ == "__main__":
    print("=" * 60)
    print("Adding SSH Fields to Deployment Table")
    print("=" * 60)
    migrate()
    print("\n[Migration] Done!")
