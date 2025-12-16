"""
Database migration: Add user_provider_binding table
"""
import sqlite3
from pathlib import Path

# Connect to database
db_path = Path(__file__).parent / "test.db"
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

# Check if table exists
cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='userproviderbinding'")
exists = cursor.fetchone()

if not exists:
    print("Creating user_provider_binding table...")
    cursor.execute("""
        CREATE TABLE userproviderbinding (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id VARCHAR NOT NULL,
            provider_type VARCHAR(6) NOT NULL,
            api_key_encrypted TEXT NOT NULL,
            display_name VARCHAR,
            is_active BOOLEAN NOT NULL DEFAULT 1,
            last_verified DATETIME,
            created_at DATETIME NOT NULL,
            updated_at DATETIME NOT NULL
        )
    """)
    
    # Create indexes for better query performance
    cursor.execute("CREATE INDEX idx_upb_user_id ON userproviderbinding(user_id)")
    cursor.execute("CREATE INDEX idx_upb_provider_type ON userproviderbinding(provider_type)")
    cursor.execute("CREATE UNIQUE INDEX idx_upb_user_provider ON userproviderbinding(user_id, provider_type)")
    
    conn.commit()
    print("✅ user_provider_binding table created successfully")
else:
    print("✅ user_provider_binding table already exists")

# Verify table structure
cursor.execute("PRAGMA table_info(userproviderbinding)")
columns = cursor.fetchall()
print("\nTable structure:")
for col in columns:
    print(f"  - {col[1]} ({col[2]})")

conn.close()
