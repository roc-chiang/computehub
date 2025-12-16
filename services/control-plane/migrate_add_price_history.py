"""
Database migration: Add price_history table
"""
import sqlite3
from pathlib import Path

# Connect to database
db_path = Path(__file__).parent / "test.db"
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

# Check if table exists
cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='pricehistory'")
exists = cursor.fetchone()

if not exists:
    print("Creating price_history table...")
    cursor.execute("""
        CREATE TABLE pricehistory (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            gpu_type VARCHAR NOT NULL,
            provider_type VARCHAR(6) NOT NULL,
            price_per_hour FLOAT,
            available BOOLEAN NOT NULL DEFAULT 1,
            recorded_at DATETIME NOT NULL
        )
    """)
    
    # Create indexes for better query performance
    cursor.execute("CREATE INDEX idx_pricehistory_gpu_type ON pricehistory(gpu_type)")
    cursor.execute("CREATE INDEX idx_pricehistory_provider ON pricehistory(provider_type)")
    cursor.execute("CREATE INDEX idx_pricehistory_recorded_at ON pricehistory(recorded_at)")
    
    conn.commit()
    print("✅ price_history table created successfully")
else:
    print("✅ price_history table already exists")

# Verify table structure
cursor.execute("PRAGMA table_info(pricehistory)")
columns = cursor.fetchall()
print("\nTable structure:")
for col in columns:
    print(f"  - {col[1]} ({col[2]})")

conn.close()
