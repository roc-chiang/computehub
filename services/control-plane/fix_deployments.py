from app.core.db import engine
from sqlalchemy import text

with engine.connect() as conn:
    # Update user_id for deployments 1 and 24
    result = conn.execute(text("UPDATE deployment SET user_id = 2 WHERE id IN (1, 24)"))
    conn.commit()
    print(f"Updated {result.rowcount} deployments")
    
    # Verify the update
    result = conn.execute(text("SELECT id, name, user_id FROM deployment WHERE id IN (1, 24)"))
    rows = result.fetchall()
    print("\nUpdated deployments:")
    for row in rows:
        print(f"  ID: {row[0]}, Name: {row[1]}, User ID: {row[2]}")
