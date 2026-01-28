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

def migrate_add_organization_project_columns():
    """Add organization_id and project_id columns to deployment table if they don't exist"""
    
    try:
        db_url = str(engine.url)
        
        if "sqlite" in db_url:
            migrate_deployment_sqlite()
        elif "postgresql" in db_url:
            migrate_deployment_postgresql()
        else:
            print(f"[MIGRATION] Unknown database type: {db_url}")
            
    except Exception as e:
        print(f"[MIGRATION ERROR] Failed to migrate deployment table: {e}")

def migrate_deployment_sqlite():
    """Migrate deployment table for SQLite"""
    print("[MIGRATION] Checking deployment table schema (SQLite)...")
    
    inspector = inspect(engine)
    
    if "deployment" not in inspector.get_table_names():
        print("[MIGRATION] deployment table doesn't exist yet, skipping migration")
        return
    
    columns = [col["name"] for col in inspector.get_columns("deployment")]
    print(f"[MIGRATION] Current columns in deployment: {columns}")
    
    # Check and add organization_id
    if "organization_id" not in columns:
        print("[MIGRATION] Adding organization_id column to deployment table...")
        try:
            with engine.begin() as conn:
                conn.execute(text("""
                    ALTER TABLE deployment 
                    ADD COLUMN organization_id INTEGER
                """))
                conn.execute(text("""
                    CREATE INDEX IF NOT EXISTS idx_deployment_organization_id 
                    ON deployment(organization_id)
                """))
            print("[MIGRATION] ✅ Successfully added organization_id column")
        except Exception as e:
            print(f"[MIGRATION ERROR] Failed to add organization_id: {e}")
    else:
        print("[MIGRATION] organization_id column already exists")
    
    # Check and add project_id
    if "project_id" not in columns:
        print("[MIGRATION] Adding project_id column to deployment table...")
        try:
            with engine.begin() as conn:
                conn.execute(text("""
                    ALTER TABLE deployment 
                    ADD COLUMN project_id INTEGER
                """))
                conn.execute(text("""
                    CREATE INDEX IF NOT EXISTS idx_deployment_project_id 
                    ON deployment(project_id)
                """))
            print("[MIGRATION] ✅ Successfully added project_id column")
        except Exception as e:
            print(f"[MIGRATION ERROR] Failed to add project_id: {e}")
    else:
        print("[MIGRATION] project_id column already exists")

def migrate_deployment_postgresql():
    """Migrate deployment table for PostgreSQL"""
    print("[MIGRATION] Checking deployment table schema (PostgreSQL)...")
    
    inspector = inspect(engine)
    
    if "deployment" not in inspector.get_table_names():
        print("[MIGRATION] deployment table doesn't exist yet, skipping migration")
        return
    
    columns = [col["name"] for col in inspector.get_columns("deployment")]
    print(f"[MIGRATION] Current columns in deployment: {columns}")
    
    # Check and add organization_id
    if "organization_id" not in columns:
        print("[MIGRATION] Adding organization_id column to deployment table...")
        try:
            with engine.begin() as conn:
                conn.execute(text("""
                    ALTER TABLE deployment 
                    ADD COLUMN organization_id INTEGER
                """))
                conn.execute(text("""
                    CREATE INDEX IF NOT EXISTS idx_deployment_organization_id 
                    ON deployment(organization_id)
                """))
            print("[MIGRATION] ✅ Successfully added organization_id column")
        except Exception as e:
            print(f"[MIGRATION ERROR] Failed to add organization_id: {e}")
    else:
        print("[MIGRATION] organization_id column already exists")
    
    # Check and add project_id
    if "project_id" not in columns:
        print("[MIGRATION] Adding project_id column to deployment table...")
        try:
            with engine.begin() as conn:
                conn.execute(text("""
                    ALTER TABLE deployment 
                    ADD COLUMN project_id INTEGER
                """))
                conn.execute(text("""
                    CREATE INDEX IF NOT EXISTS idx_deployment_project_id 
                    ON deployment(project_id)
                """))
            print("[MIGRATION] ✅ Successfully added project_id column")
        except Exception as e:
            print(f"[MIGRATION ERROR] Failed to add project_id: {e}")
    else:
        print("[MIGRATION] project_id column already exists")

def run_migrations():
    """Run all pending migrations"""
    print("[MIGRATION] Running database migrations...")
    migrate_add_is_pro_column()
    migrate_add_organization_project_columns()
    print("[MIGRATION] Migrations complete")
