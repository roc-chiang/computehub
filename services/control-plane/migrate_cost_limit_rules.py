"""
Database migration script for Phase 9 Week 3: Cost Limit Auto-Shutdown + Rule Engine

Creates 3 new tables:
1. costlimit - Cost limit configurations
2. automationrulev2 - Advanced automation rules
3. ruleexecutionlog - Rule execution history

Usage:
    python migrate_cost_limit_rules.py
"""

import sqlite3
import os
from pathlib import Path


def get_db_path():
    """Get the database file path"""
    # Look for .db files in the current directory
    db_files = list(Path('.').glob('*.db'))
    if db_files:
        return str(db_files[0])
    return 'computehub.db'  # Default


def create_tables():
    """Create the new tables using direct SQL"""
    db_path = get_db_path()
    print(f"[Migration] Using database: {db_path}")
    
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    try:
        # 1. Create costlimit table
        print("[Migration] Creating costlimit table...")
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS costlimit (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                deployment_id INTEGER NOT NULL UNIQUE,
                limit_amount REAL NOT NULL,
                limit_period TEXT NOT NULL DEFAULT 'daily',
                current_cost REAL NOT NULL DEFAULT 0.0,
                auto_shutdown_enabled BOOLEAN NOT NULL DEFAULT 1,
                notify_at_percentage INTEGER NOT NULL DEFAULT 80,
                limit_reached BOOLEAN NOT NULL DEFAULT 0,
                last_notified_at TIMESTAMP,
                shutdown_at TIMESTAMP,
                created_at TIMESTAMP NOT NULL,
                updated_at TIMESTAMP NOT NULL,
                FOREIGN KEY (user_id) REFERENCES user (id),
                FOREIGN KEY (deployment_id) REFERENCES deployment (id)
            )
        """)
        
        # Create indexes for costlimit
        cursor.execute("CREATE INDEX IF NOT EXISTS ix_costlimit_user_id ON costlimit (user_id)")
        cursor.execute("CREATE INDEX IF NOT EXISTS ix_costlimit_deployment_id ON costlimit (deployment_id)")
        cursor.execute("CREATE INDEX IF NOT EXISTS ix_costlimit_limit_period ON costlimit (limit_period)")
        cursor.execute("CREATE INDEX IF NOT EXISTS ix_costlimit_created_at ON costlimit (created_at)")
        print("[Migration] ✓ costlimit table created")
        
        # 2. Create automationrulev2 table
        print("[Migration] Creating automationrulev2 table...")
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS automationrulev2 (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                name TEXT NOT NULL,
                description TEXT,
                is_enabled BOOLEAN NOT NULL DEFAULT 1,
                trigger_type TEXT NOT NULL,
                trigger_config_json TEXT NOT NULL,
                action_type TEXT NOT NULL,
                action_config_json TEXT NOT NULL,
                target_type TEXT NOT NULL DEFAULT 'deployment',
                target_id INTEGER,
                last_triggered_at TIMESTAMP,
                trigger_count INTEGER NOT NULL DEFAULT 0,
                created_at TIMESTAMP NOT NULL,
                updated_at TIMESTAMP NOT NULL,
                FOREIGN KEY (user_id) REFERENCES user (id)
            )
        """)
        
        # Create indexes for automationrulev2
        cursor.execute("CREATE INDEX IF NOT EXISTS ix_automationrulev2_user_id ON automationrulev2 (user_id)")
        cursor.execute("CREATE INDEX IF NOT EXISTS ix_automationrulev2_trigger_type ON automationrulev2 (trigger_type)")
        cursor.execute("CREATE INDEX IF NOT EXISTS ix_automationrulev2_created_at ON automationrulev2 (created_at)")
        print("[Migration] ✓ automationrulev2 table created")
        
        # 3. Create ruleexecutionlog table
        print("[Migration] Creating ruleexecutionlog table...")
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS ruleexecutionlog (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                rule_id INTEGER NOT NULL,
                user_id INTEGER NOT NULL,
                trigger_reason TEXT NOT NULL,
                action_taken TEXT NOT NULL,
                target_deployment_id INTEGER,
                status TEXT NOT NULL,
                result_message TEXT,
                error_message TEXT,
                executed_at TIMESTAMP NOT NULL,
                FOREIGN KEY (rule_id) REFERENCES automationrulev2 (id),
                FOREIGN KEY (user_id) REFERENCES user (id),
                FOREIGN KEY (target_deployment_id) REFERENCES deployment (id)
            )
        """)
        
        # Create indexes for ruleexecutionlog
        cursor.execute("CREATE INDEX IF NOT EXISTS ix_ruleexecutionlog_rule_id ON ruleexecutionlog (rule_id)")
        cursor.execute("CREATE INDEX IF NOT EXISTS ix_ruleexecutionlog_user_id ON ruleexecutionlog (user_id)")
        cursor.execute("CREATE INDEX IF NOT EXISTS ix_ruleexecutionlog_executed_at ON ruleexecutionlog (executed_at)")
        print("[Migration] ✓ ruleexecutionlog table created")
        
        conn.commit()
        print("\n[Migration] ✅ All tables created successfully!")
        
        # Verify tables
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
        tables = cursor.fetchall()
        print(f"\n[Migration] Total tables in database: {len(tables)}")
        
        # Check for our new tables
        new_tables = ['costlimit', 'automationrulev2', 'ruleexecutionlog']
        for table_name in new_tables:
            cursor.execute(f"SELECT name FROM sqlite_master WHERE type='table' AND name='{table_name}'")
            if cursor.fetchone():
                print(f"[Migration] ✓ {table_name} exists")
            else:
                print(f"[Migration] ✗ {table_name} NOT found!")
        
    except sqlite3.Error as e:
        print(f"\n[Migration] ❌ Error: {e}")
        conn.rollback()
        raise
    finally:
        conn.close()


if __name__ == "__main__":
    print("=" * 60)
    print("Phase 9 Week 3: Cost Limit + Rule Engine Migration")
    print("=" * 60)
    create_tables()
    print("\n[Migration] Migration completed!")
