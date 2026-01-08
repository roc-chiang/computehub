"""Check database schema to identify conflicts"""
import sqlite3
import sys
from pathlib import Path
import glob

# Find database file
db_files = list(Path(__file__).parent.glob("*.db"))
if not db_files:
    print("No .db files found in current directory")
    print(f"Current directory: {Path(__file__).parent}")
    sys.exit(1)

db_path = db_files[0]
print(f"Using database: {db_path}\n")

conn = sqlite3.connect(db_path)
cursor = conn.cursor()

# Get all tables
cursor.execute("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;")
tables = cursor.fetchall()

print("=" * 60)
print("Existing Database Tables")
print("=" * 60)
for table in tables:
    print(f"\n📋 Table: {table[0]}")
    
    # Get schema for each table
    cursor.execute(f"PRAGMA table_info({table[0]});")
    columns = cursor.fetchall()
    
    for col in columns:
        col_id, name, type_, notnull, default, pk = col
        pk_str = " PRIMARY KEY" if pk else ""
        null_str = " NOT NULL" if notnull else ""
        default_str = f" DEFAULT {default}" if default else ""
        print(f"  - {name}: {type_}{pk_str}{null_str}{default_str}")

# Check if our target tables exist
print("\n" + "=" * 60)
print("Target Tables for Migration")
print("=" * 60)
target_tables = ['pricehistory', 'migrationtask', 'failoverconfig', 'batchtask']
existing_target_tables = [t[0] for t in tables if t[0] in target_tables]

if existing_target_tables:
    print(f"\n⚠️  These tables already exist:")
    for t in existing_target_tables:
        print(f"  - {t}")
    print("\n✓ No migration needed!")
else:
    print(f"\n✓ None of the target tables exist yet")
    print(f"  Tables to create: {', '.join(target_tables)}")

conn.close()
