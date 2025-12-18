import sqlite3

# Connect to database
conn = sqlite3.connect('test.db')
cursor = conn.cursor()

# Get all tables
cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
tables = cursor.fetchall()

print("=== Database Tables ===")
for table in tables:
    table_name = table[0]
    print(f"\n{table_name}:")
    
    # Count rows
    cursor.execute(f"SELECT COUNT(*) FROM {table_name}")
    count = cursor.fetchone()[0]
    print(f"  Rows: {count}")
    
    # Show first few rows if any
    if count > 0 and count < 10:
        cursor.execute(f"SELECT * FROM {table_name} LIMIT 5")
        rows = cursor.fetchall()
        for row in rows:
            print(f"  {row}")

conn.close()
print("\n=== Summary ===")
print("If you only have 1 user and no important data, it's safe to delete and recreate.")
