"""
Database migration script to add is_pro field to deployment_template table

Run this script to update your existing database:
    python migrate_add_is_pro.py
"""

import sqlite3
import os
from pathlib import Path

def migrate_database():
    """Add is_pro column to deployment_template table"""
    
    # Find the database file
    db_path = Path(__file__).parent.parent / "data" / "app.db"
    
    # Alternative path if using default SQLite location
    if not db_path.exists():
        db_path = Path(__file__).parent.parent / "app.db"
    
    if not db_path.exists():
        print(f"❌ Database not found at {db_path}")
        print("Please specify the correct database path.")
        return False
    
    print(f"📁 Found database at: {db_path}")
    
    try:
        # Connect to database
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Check if column already exists
        cursor.execute("PRAGMA table_info(deployment_template)")
        columns = [row[1] for row in cursor.fetchall()]
        
        if 'is_pro' in columns:
            print("✅ Column 'is_pro' already exists in deployment_template table")
            conn.close()
            return True
        
        # Add the new column
        print("🔧 Adding 'is_pro' column to deployment_template table...")
        cursor.execute("""
            ALTER TABLE deployment_template 
            ADD COLUMN is_pro INTEGER NOT NULL DEFAULT 0
        """)
        
        # Create index for better performance
        print("🔧 Creating index on 'is_pro' column...")
        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_deployment_template_is_pro 
            ON deployment_template(is_pro)
        """)
        
        # Commit changes
        conn.commit()
        conn.close()
        
        print("✅ Migration completed successfully!")
        print("   - Added 'is_pro' column (default: False)")
        print("   - Created index on 'is_pro'")
        
        return True
        
    except Exception as e:
        print(f"❌ Migration failed: {e}")
        return False

if __name__ == "__main__":
    print("=" * 60)
    print("Database Migration: Add is_pro to deployment_template")
    print("=" * 60)
    print()
    
    success = migrate_database()
    
    print()
    if success:
        print("✅ You can now start the application!")
    else:
        print("❌ Please fix the errors and try again.")
    print("=" * 60)
