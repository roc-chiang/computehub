"""
Clean migration script using direct SQL to avoid SQLAlchemy metadata conflicts.
Creates 4 new tables for Phase 9 Week 2 Advanced Automation.
"""

import sqlite3
from pathlib import Path

def run_migration():
    """Run the migration using direct SQL."""
    print("=" * 60)
    print("Phase 9 Week 2: Advanced Automation Migration")
    print("=" * 60)
    
    # Find database
    db_files = list(Path(__file__).parent.glob("*.db"))
    if not db_files:
        print("\n❌ No database file found!")
        return False
    
    db_path = db_files[0]
    print(f"\nDatabase: {db_path}")
    
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    try:
        print("\nCreating tables...")
        
        # 1. PriceHistory
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS pricehistory (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                deployment_id INTEGER NOT NULL,
                provider VARCHAR NOT NULL,
                gpu_type VARCHAR NOT NULL,
                price_per_hour REAL NOT NULL,
                metadata_json TEXT,
                recorded_at TIMESTAMP NOT NULL,
                FOREIGN KEY(deployment_id) REFERENCES deployment(id)
            )
        """)
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_pricehistory_deployment ON pricehistory(deployment_id)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_pricehistory_provider ON pricehistory(provider)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_pricehistory_recorded ON pricehistory(recorded_at)")
        print("  ✓ pricehistory")
        
        # 2. MigrationTask
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS migrationtask (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                source_deployment_id INTEGER NOT NULL,
                target_provider VARCHAR NOT NULL,
                target_config_json TEXT NOT NULL,
                status VARCHAR NOT NULL,
                migration_steps_json TEXT,
                target_deployment_id INTEGER,
                started_at TIMESTAMP,
                completed_at TIMESTAMP,
                error_message TEXT,
                created_at TIMESTAMP NOT NULL,
                FOREIGN KEY(user_id) REFERENCES user(id),
                FOREIGN KEY(source_deployment_id) REFERENCES deployment(id),
                FOREIGN KEY(target_deployment_id) REFERENCES deployment(id)
            )
        """)
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_migrationtask_user ON migrationtask(user_id)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_migrationtask_source ON migrationtask(source_deployment_id)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_migrationtask_status ON migrationtask(status)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_migrationtask_created ON migrationtask(created_at)")
        print("  ✓ migrationtask")
        
        # 3. FailoverConfig
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS failoverconfig (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                deployment_id INTEGER NOT NULL UNIQUE,
                primary_provider VARCHAR NOT NULL,
                backup_providers_json TEXT NOT NULL,
                health_check_interval INTEGER DEFAULT 300,
                failover_threshold INTEGER DEFAULT 3,
                auto_failover_enabled INTEGER DEFAULT 1,
                last_failover_at TIMESTAMP,
                failover_count INTEGER DEFAULT 0,
                created_at TIMESTAMP NOT NULL,
                updated_at TIMESTAMP NOT NULL,
                FOREIGN KEY(user_id) REFERENCES user(id),
                FOREIGN KEY(deployment_id) REFERENCES deployment(id)
            )
        """)
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_failoverconfig_user ON failoverconfig(user_id)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_failoverconfig_deployment ON failoverconfig(deployment_id)")
        print("  ✓ failoverconfig")
        
        # 4. BatchTask
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS batchtask (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                task_type VARCHAR NOT NULL,
                task_config_json TEXT NOT NULL,
                status VARCHAR NOT NULL,
                priority INTEGER DEFAULT 5,
                scheduled_at TIMESTAMP NOT NULL,
                started_at TIMESTAMP,
                completed_at TIMESTAMP,
                result_json TEXT,
                error_message TEXT,
                created_at TIMESTAMP NOT NULL,
                FOREIGN KEY(user_id) REFERENCES user(id)
            )
        """)
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_batchtask_user ON batchtask(user_id)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_batchtask_type ON batchtask(task_type)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_batchtask_status ON batchtask(status)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_batchtask_scheduled ON batchtask(scheduled_at)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_batchtask_created ON batchtask(created_at)")
        print("  ✓ batchtask")
        
        conn.commit()
        
        # Verify tables were created
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name IN ('pricehistory', 'migrationtask', 'failoverconfig', 'batchtask')")
        created_tables = cursor.fetchall()
        
        print("\n✅ Migration completed successfully!")
        print(f"\nCreated {len(created_tables)} tables:")
        for table in created_tables:
            print(f"  ✓ {table[0]}")
        
        print("\n" + "=" * 60)
        return True
        
    except Exception as e:
        print(f"\n❌ Migration failed: {e}")
        conn.rollback()
        import traceback
        traceback.print_exc()
        return False
    finally:
        conn.close()


if __name__ == "__main__":
    success = run_migration()
    exit(0 if success else 1)
