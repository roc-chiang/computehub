"""
Database migration for notification system
Creates notification_settings and notification_history tables
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import text, create_engine
from app.core.config import settings

engine = create_engine(settings.DATABASE_URL)

def upgrade():
    """Create notification tables"""
    
    with engine.connect() as conn:
        # Create notification_settings table
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS notification_settings (
                id SERIAL PRIMARY KEY,
                user_id VARCHAR(255) NOT NULL UNIQUE,
                telegram_chat_id VARCHAR(255),
                telegram_username VARCHAR(255),
                email VARCHAR(255),
                enable_telegram BOOLEAN DEFAULT true,
                enable_email BOOLEAN DEFAULT true,
                enable_deployment_success BOOLEAN DEFAULT true,
                enable_deployment_failure BOOLEAN DEFAULT true,
                enable_instance_down BOOLEAN DEFAULT true,
                enable_cost_alert BOOLEAN DEFAULT true,
                enable_price_change BOOLEAN DEFAULT false,
                cost_alert_threshold DECIMAL(10,2) DEFAULT 100.00,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """))
        
        # Create notification_history table
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS notification_history (
                id SERIAL PRIMARY KEY,
                user_id VARCHAR(255) NOT NULL,
                event_type VARCHAR(50) NOT NULL,
                channel VARCHAR(20) NOT NULL,
                title VARCHAR(255),
                message TEXT,
                status VARCHAR(20) DEFAULT 'pending',
                error_message TEXT,
                event_metadata JSONB,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """))
        
        # Create index on user_id for faster queries
        conn.execute(text("""
            CREATE INDEX IF NOT EXISTS idx_notification_history_user_id 
            ON notification_history(user_id)
        """))
        
        # Create index on created_at for sorting
        conn.execute(text("""
            CREATE INDEX IF NOT EXISTS idx_notification_history_created_at 
            ON notification_history(created_at DESC)
        """))
        
        conn.commit()
        print("✅ Notification tables created successfully")

def downgrade():
    """Drop notification tables"""
    
    with engine.connect() as conn:
        conn.execute(text("DROP TABLE IF EXISTS notification_history"))
        conn.execute(text("DROP TABLE IF EXISTS notification_settings"))
        conn.commit()
        print("✅ Notification tables dropped successfully")

if __name__ == "__main__":
    print("Running notification system migration...")
    upgrade()
    print("Migration completed!")
