"""
Database migration to create deployment_templates table
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import text
from app.core.db import engine

def upgrade():
    """Create deployment_templates table"""
    with engine.connect() as conn:
        # Create table
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS deployment_template (
                id SERIAL PRIMARY KEY,
                user_id VARCHAR(255) NOT NULL,
                name VARCHAR(255) NOT NULL,
                description TEXT,
                
                gpu_type VARCHAR(100) NOT NULL,
                gpu_count INTEGER DEFAULT 1,
                provider VARCHAR(50),
                image VARCHAR(500) NOT NULL,
                
                vcpu_count INTEGER,
                ram_gb INTEGER,
                storage_gb INTEGER,
                env_vars TEXT,
                
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW(),
                
                UNIQUE(user_id, name)
            )
        """))
        
        # Create index
        conn.execute(text("""
            CREATE INDEX IF NOT EXISTS idx_deployment_template_user 
            ON deployment_template(user_id)
        """))
        
        conn.commit()
        print("✅ Created deployment_template table")

def downgrade():
    """Drop deployment_templates table"""
    with engine.connect() as conn:
        conn.execute(text("DROP TABLE IF EXISTS deployment_template CASCADE;"))
        conn.commit()
        print("✅ Dropped deployment_template table")

if __name__ == "__main__":
    print("Running migration: create deployment_template table")
    upgrade()
    print("Migration complete!")
