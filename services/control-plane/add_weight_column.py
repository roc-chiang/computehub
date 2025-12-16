import sqlite3
from pathlib import Path

# Connect to database
db_path = Path(__file__).parent / "test.db"
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

# Check if weight column exists
cursor.execute("PRAGMA table_info(provider)")
columns = cursor.fetchall()
column_names = [col[1] for col in columns]

if 'weight' not in column_names:
    print("Adding weight column to provider table...")
    try:
        cursor.execute("ALTER TABLE provider ADD COLUMN weight INTEGER DEFAULT 100")
        conn.commit()
        print("✅ Successfully added weight column")
    except Exception as e:
        print(f"❌ Error adding column: {e}")
else:
    print("✅ Weight column already exists")

# Verify
cursor.execute("PRAGMA table_info(provider)")
columns = cursor.fetchall()
print("\nCurrent provider table columns:")
for col in columns:
    print(f"  - {col[1]} ({col[2]})")

conn.close()
