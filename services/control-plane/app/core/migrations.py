"""
Automatic database migration script for deployment_template.is_pro field

This script runs automatically on application startup to ensure the database
schema is up to date.
"""

import sqlite3
from pathlib import Path
from sqlalchemy import inspect, text
from sqlmodel import Session
from app.core.db import engine

def migrate_add_is_pro_column():
    """Add is_pro column to deployment_template table if it doesn't exist"""
    
    try:
        # Check if we're using SQLite or PostgreSQL
        db_url = str(engine.url)
        
        if "sqlite" in db_url:
            # SQLite migration
            migrate_sqlite()
        elif "postgresql" in db_url:
            # PostgreSQL migration
            migrate_postgresql()
        else:
            print(f"[MIGRATION] Unknown database type: {db_url}")
            
    except Exception as e:
        print(f"[MIGRATION ERROR] Failed to migrate: {e}")
        # Don't raise - let the app try to start anyway
        
def migrate_sqlite():
    """Migrate SQLite database"""
    print("[MIGRATION] Checking SQLite database schema...")
    
    # Get inspector
    inspector = inspect(engine)
    
    # Check if deployment_template table exists
    if "deployment_template" not in inspector.get_table_names():
        print("[MIGRATION] deployment_template table doesn't exist yet, skipping migration")
        return
    
    # Check if is_pro column exists
    columns = [col["name"] for col in inspector.get_columns("deployment_template")]
    
    if "is_pro" in columns:
        print("[MIGRATION] is_pro column already exists, skipping migration")
        return
    
    print("[MIGRATION] Adding is_pro column to deployment_template table...")
    
    # Add the column using raw SQL
    with engine.begin() as conn:
        conn.execute(text("""
            ALTER TABLE deployment_template 
            ADD COLUMN is_pro BOOLEAN NOT NULL DEFAULT 0
        """))
        
        conn.execute(text("""
            CREATE INDEX IF NOT EXISTS idx_deployment_template_is_pro 
            ON deployment_template(is_pro)
        """))
    
    print("[MIGRATION] ✅ Successfully added is_pro column")

def migrate_postgresql():
    """Migrate PostgreSQL database"""
    print("[MIGRATION] Checking PostgreSQL database schema...")
    
    # Get inspector
    inspector = inspect(engine)
    
    # Check if deployment_template table exists
    if "deployment_template" not in inspector.get_table_names():
        print("[MIGRATION] deployment_template table doesn't exist yet, skipping migration")
        return
    
    # Check if is_pro column exists
    columns = [col["name"] for col in inspector.get_columns("deployment_template")]
    
    if "is_pro" in columns:
        print("[MIGRATION] is_pro column already exists, skipping migration")
        return
    
    print("[MIGRATION] Adding is_pro column to deployment_template table...")
    
    # Add the column using raw SQL
    with engine.begin() as conn:
        conn.execute(text("""
            ALTER TABLE deployment_template 
            ADD COLUMN is_pro BOOLEAN NOT NULL DEFAULT FALSE
        """))
        
        conn.execute(text("""
            CREATE INDEX IF NOT EXISTS idx_deployment_template_is_pro 
            ON deployment_template(is_pro)
        """))
    
    print("[MIGRATION] ✅ Successfully added is_pro column")

def run_migrations():
    """Run all pending migrations"""
    print("[MIGRATION] Running database migrations...")
    migrate_add_is_pro_column()
    print("[MIGRATION] Migrations complete")
