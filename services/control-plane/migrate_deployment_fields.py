"""
Database migration script to add template_type and exposed_port fields
Run this script to update the database schema
"""
import sqlite3

print("Starting database migration...")

try:
    conn = sqlite3.connect('test.db')
    cursor = conn.cursor()
    
    # Add template_type field
    try:
        cursor.execute("ALTER TABLE deployment ADD COLUMN template_type TEXT;")
        print("✅ Added template_type column")
    except sqlite3.OperationalError as e:
        if "duplicate column name" in str(e):
            print("⚠️  template_type column already exists")
        else:
            raise
    
    # Add exposed_port field
    try:
        cursor.execute("ALTER TABLE deployment ADD COLUMN exposed_port INTEGER;")
        print("✅ Added exposed_port column")
    except sqlite3.OperationalError as e:
        if "duplicate column name" in str(e):
            print("⚠️  exposed_port column already exists")
        else:
            raise
    
    conn.commit()
    conn.close()
    
    print("\n✅ Migration completed successfully!")
    print("You can now restart the backend server.")
    
except Exception as e:
    print(f"❌ Migration failed: {e}")
    import traceback
    traceback.print_exc()
