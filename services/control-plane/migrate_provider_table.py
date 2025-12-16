"""
Add missing columns to provider table
"""
from sqlmodel import Session, create_engine, text
from app.core.config import settings

# Create engine
engine = create_engine(str(settings.DATABASE_URL))

with Session(engine) as session:
    try:
        # Add display_name column if it doesn't exist
        session.exec(text("""
            ALTER TABLE provider ADD COLUMN display_name VARCHAR
        """))
        print("✅ Added display_name column to provider table")
    except Exception as e:
        if "duplicate column name" in str(e).lower() or "already exists" in str(e).lower():
            print("ℹ️  display_name column already exists")
        else:
            print(f"⚠️  Error adding display_name: {e}")
    
    try:
        # Add weight column if it doesn't exist (for scheduling)
        session.exec(text("""
            ALTER TABLE provider ADD COLUMN weight INTEGER DEFAULT 100
        """))
        print("✅ Added weight column to provider table")
    except Exception as e:
        if "duplicate column name" in str(e).lower() or "already exists" in str(e).lower():
            print("ℹ️  weight column already exists")
        else:
            print(f"⚠️  Error adding weight: {e}")
    
    session.commit()
    print("\n✅ Database migration completed!")
