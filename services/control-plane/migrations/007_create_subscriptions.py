"""
Subscription System Database Migration
Creates tables for user subscriptions and subscription events
"""

def upgrade(connection):
    """Create subscription tables"""
    
    # User Subscriptions Table
    connection.execute("""
        CREATE TABLE IF NOT EXISTS user_subscriptions (
            id SERIAL PRIMARY KEY,
            user_id VARCHAR(255) UNIQUE NOT NULL,
            tier VARCHAR(50) NOT NULL DEFAULT 'basic',
            
            stripe_customer_id VARCHAR(255),
            stripe_subscription_id VARCHAR(255),
            stripe_price_id VARCHAR(255),
            
            status VARCHAR(50) NOT NULL DEFAULT 'active',
            
            current_period_start TIMESTAMP,
            current_period_end TIMESTAMP,
            cancel_at_period_end BOOLEAN DEFAULT FALSE,
            
            trial_end TIMESTAMP,
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
        );
    """)
    
    connection.execute("""
        CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user 
        ON user_subscriptions(user_id);
    """)
    
    connection.execute("""
        CREATE INDEX IF NOT EXISTS idx_user_subscriptions_stripe 
        ON user_subscriptions(stripe_subscription_id);
    """)
    
    # Subscription Events Table
    connection.execute("""
        CREATE TABLE IF NOT EXISTS subscription_events (
            id SERIAL PRIMARY KEY,
            user_id VARCHAR(255) NOT NULL,
            event_type VARCHAR(100) NOT NULL,
            from_tier VARCHAR(50),
            to_tier VARCHAR(50),
            stripe_event_id VARCHAR(255),
            metadata JSONB,
            created_at TIMESTAMP DEFAULT NOW()
        );
    """)
    
    connection.execute("""
        CREATE INDEX IF NOT EXISTS idx_subscription_events_user 
        ON subscription_events(user_id);
    """)
    
    connection.execute("""
        CREATE INDEX IF NOT EXISTS idx_subscription_events_type 
        ON subscription_events(event_type);
    """)
    
    print("✅ Subscription tables created successfully")


def downgrade(connection):
    """Drop subscription tables"""
    connection.execute("DROP TABLE IF EXISTS subscription_events;")
    connection.execute("DROP TABLE IF EXISTS user_subscriptions;")
    print("✅ Subscription tables dropped")


if __name__ == "__main__":
    import os
    import psycopg2
    from dotenv import load_dotenv
    from urllib.parse import urlparse
    
    load_dotenv()
    
    # Parse DATABASE_URL
    database_url = os.getenv("DATABASE_URL")
    if not database_url:
        print("❌ DATABASE_URL not found in environment")
        exit(1)
    
    # Parse the URL
    result = urlparse(database_url)
    
    # Connect using parsed components
    conn = psycopg2.connect(
        database=result.path[1:],  # Remove leading slash
        user=result.username,
        password=result.password,
        host=result.hostname,
        port=result.port or 5432
    )
    conn.autocommit = True
    
    try:
        print("Running subscription migration...")
        upgrade(conn)
    except Exception as e:
        print(f"❌ Migration failed: {e}")
        import traceback
        traceback.print_exc()
        raise
    finally:
        conn.close()
