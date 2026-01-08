"""
Phase 12: 实时监控系统 - 数据库迁移

创建监控相关的数据表:
- metrics_snapshot: 存储监控指标快照
- monitoring_alert: 存储监控告警记录

Usage:
    python migrate_monitoring.py
"""

import sqlite3
from pathlib import Path
from datetime import datetime


def get_db_path():
    """Get the database file path"""
    # Use test.db as specified in .env
    if Path('test.db').exists():
        return 'test.db'
    
    # Fallback to finding any .db file
    db_files = list(Path('.').glob('*.db'))
    if db_files:
        return str(db_files[0])
    return 'test.db'  # Default to test.db


def migrate():
    """Create monitoring tables"""
    db_path = get_db_path()
    print(f"[Migration] Using database: {db_path}")
    
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    try:
        # ====================================================================
        # Create metrics_snapshot table
        # ====================================================================
        print("[Migration] Creating metrics_snapshot table...")
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS metrics_snapshot (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                deployment_id INTEGER NOT NULL,
                timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                
                -- GPU metrics
                gpu_temperature REAL,
                gpu_utilization REAL,
                gpu_memory_used INTEGER,
                gpu_memory_total INTEGER,
                gpu_power_draw REAL,
                
                -- System metrics
                cpu_percent REAL,
                memory_used INTEGER,
                memory_total INTEGER,
                disk_used INTEGER,
                disk_total INTEGER,
                
                -- Network metrics
                network_rx_bytes INTEGER,
                network_tx_bytes INTEGER,
                
                -- Process info
                process_count INTEGER,
                
                FOREIGN KEY (deployment_id) REFERENCES deployment(id) ON DELETE CASCADE
            )
        """)
        
        # Create indexes for metrics_snapshot
        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_metrics_deployment 
            ON metrics_snapshot(deployment_id)
        """)
        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_metrics_timestamp 
            ON metrics_snapshot(timestamp)
        """)
        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_metrics_deployment_timestamp 
            ON metrics_snapshot(deployment_id, timestamp DESC)
        """)
        
        print("[Migration] ✓ metrics_snapshot table created")
        
        # ====================================================================
        # Create monitoring_alert table
        # ====================================================================
        print("[Migration] Creating monitoring_alert table...")
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS monitoring_alert (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                deployment_id INTEGER NOT NULL,
                user_id INTEGER NOT NULL,
                
                -- Alert type and severity
                alert_type TEXT NOT NULL,
                severity TEXT NOT NULL DEFAULT 'warning',
                
                -- Threshold and value
                threshold REAL NOT NULL,
                current_value REAL NOT NULL,
                
                -- Alert message
                message TEXT NOT NULL,
                
                -- Timestamps
                triggered_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                resolved_at TIMESTAMP,
                
                -- Notification status
                notified BOOLEAN NOT NULL DEFAULT 0,
                notification_sent_at TIMESTAMP,
                
                -- Alert status
                is_active BOOLEAN NOT NULL DEFAULT 1,
                
                FOREIGN KEY (deployment_id) REFERENCES deployment(id) ON DELETE CASCADE,
                FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE
            )
        """)
        
        # Create indexes for monitoring_alert
        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_alert_deployment 
            ON monitoring_alert(deployment_id)
        """)
        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_alert_user 
            ON monitoring_alert(user_id)
        """)
        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_alert_type 
            ON monitoring_alert(alert_type)
        """)
        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_alert_triggered 
            ON monitoring_alert(triggered_at)
        """)
        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_alert_active 
            ON monitoring_alert(is_active)
        """)
        
        print("[Migration] ✓ monitoring_alert table created")
        
        conn.commit()
        print("\n[Migration] ✅ Migration completed successfully!")
        
        # Verify tables
        cursor.execute("""
            SELECT name FROM sqlite_master 
            WHERE type='table' AND name IN ('metrics_snapshot', 'monitoring_alert')
        """)
        tables = cursor.fetchall()
        print(f"\n[Migration] Created tables: {[t[0] for t in tables]}")
        
    except sqlite3.Error as e:
        print(f"\n[Migration] ❌ Error: {e}")
        conn.rollback()
        raise
    finally:
        conn.close()


if __name__ == "__main__":
    print("=" * 60)
    print("Phase 12: Real-time Monitoring Migration")
    print("=" * 60)
    migrate()
    print("\n[Migration] Done!")
