"""
Database migration script for Phase 9 Automation Engine.
Adds automation tables: AutomationRule, HealthCheckLog, AutomationLog, CostTracking
"""

import sqlite3
from datetime import datetime

print("=" * 60)
print("Phase 9 Automation Engine - Database Migration")
print("=" * 60)
print()

# Connect to database
conn = sqlite3.connect('test.db')
cursor = conn.cursor()

try:
    # 1. Create AutomationRule table
    print("Creating AutomationRule table...")
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS automationrule (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            deployment_id INTEGER,
            rule_type TEXT NOT NULL,
            config_json TEXT NOT NULL,
            is_enabled BOOLEAN NOT NULL DEFAULT 1,
            last_triggered_at TIMESTAMP,
            trigger_count INTEGER NOT NULL DEFAULT 0,
            created_at TIMESTAMP NOT NULL,
            updated_at TIMESTAMP NOT NULL,
            FOREIGN KEY (user_id) REFERENCES user(id),
            FOREIGN KEY (deployment_id) REFERENCES deployment(id)
        )
    """)
    
    # Create indexes
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_automationrule_user_id ON automationrule(user_id)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_automationrule_deployment_id ON automationrule(deployment_id)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_automationrule_rule_type ON automationrule(rule_type)")
    print("✅ AutomationRule table created")
    print()
    
    # 2. Create HealthCheckLog table
    print("Creating HealthCheckLog table...")
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS healthchecklog (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            deployment_id INTEGER NOT NULL,
            status TEXT NOT NULL,
            response_time_ms INTEGER,
            error_message TEXT,
            endpoint_url TEXT NOT NULL,
            check_method TEXT NOT NULL DEFAULT 'http',
            checked_at TIMESTAMP NOT NULL,
            FOREIGN KEY (deployment_id) REFERENCES deployment(id)
        )
    """)
    
    # Create indexes
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_healthchecklog_deployment_id ON healthchecklog(deployment_id)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_healthchecklog_checked_at ON healthchecklog(checked_at)")
    print("✅ HealthCheckLog table created")
    print()
    
    # 3. Create AutomationLog table
    print("Creating AutomationLog table...")
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS automationlog (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            deployment_id INTEGER NOT NULL,
            rule_id INTEGER,
            action TEXT NOT NULL,
            trigger_reason TEXT NOT NULL,
            trigger_data_json TEXT,
            result TEXT NOT NULL,
            error_message TEXT,
            execution_time_ms INTEGER,
            created_at TIMESTAMP NOT NULL,
            FOREIGN KEY (deployment_id) REFERENCES deployment(id),
            FOREIGN KEY (rule_id) REFERENCES automationrule(id)
        )
    """)
    
    # Create indexes
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_automationlog_deployment_id ON automationlog(deployment_id)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_automationlog_action ON automationlog(action)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_automationlog_created_at ON automationlog(created_at)")
    print("✅ AutomationLog table created")
    print()
    
    # 4. Create CostTracking table
    print("Creating CostTracking table...")
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS costtracking (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            deployment_id INTEGER NOT NULL,
            user_id INTEGER NOT NULL,
            cost_usd REAL NOT NULL,
            gpu_hours REAL NOT NULL,
            period_start TIMESTAMP NOT NULL,
            period_end TIMESTAMP NOT NULL,
            provider TEXT NOT NULL,
            gpu_type TEXT NOT NULL,
            price_per_hour REAL NOT NULL,
            created_at TIMESTAMP NOT NULL,
            FOREIGN KEY (deployment_id) REFERENCES deployment(id),
            FOREIGN KEY (user_id) REFERENCES user(id)
        )
    """)
    
    # Create indexes
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_costtracking_deployment_id ON costtracking(deployment_id)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_costtracking_user_id ON costtracking(user_id)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_costtracking_period_start ON costtracking(period_start)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_costtracking_period_end ON costtracking(period_end)")
    print("✅ CostTracking table created")
    print()
    
    # Commit changes
    conn.commit()
    
    print("=" * 60)
    print("✅ Migration completed successfully!")
    print("=" * 60)
    print()
    print("Created tables:")
    print("  - automationrule (automation rules configuration)")
    print("  - healthchecklog (health check history)")
    print("  - automationlog (automation operation logs)")
    print("  - costtracking (cost tracking records)")
    print()
    print("You can now restart the backend server.")
    
except Exception as e:
    print(f"❌ Migration failed: {e}")
    import traceback
    traceback.print_exc()
    conn.rollback()
finally:
    conn.close()
