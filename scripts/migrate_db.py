import sqlite3
import os

DB_PATH = "services/control-plane/test.db"

def migrate_db():
    if not os.path.exists(DB_PATH):
        print(f"Database not found at {DB_PATH}")
        return

    print(f"Migrating database at {DB_PATH}...")
    
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    try:
        # Check if columns exist
        cursor.execute("PRAGMA table_info(deployment)")
        columns = [info[1] for info in cursor.fetchall()]
        
        if "ssh_connection_string" not in columns:
            print("Adding ssh_connection_string column...")
            cursor.execute("ALTER TABLE deployment ADD COLUMN ssh_connection_string TEXT")
        else:
            print("ssh_connection_string column already exists.")
            
        if "ssh_password" not in columns:
            print("Adding ssh_password column...")
            cursor.execute("ALTER TABLE deployment ADD COLUMN ssh_password TEXT")
        else:
            print("ssh_password column already exists.")
            
        # New fields for Phase 1 UI Enhancements
        if "vcpu_count" not in columns:
            print("Adding vcpu_count column...")
            cursor.execute("ALTER TABLE deployment ADD COLUMN vcpu_count INTEGER")
            
        if "ram_gb" not in columns:
            print("Adding ram_gb column...")
            cursor.execute("ALTER TABLE deployment ADD COLUMN ram_gb INTEGER")
            
        if "storage_gb" not in columns:
            print("Adding storage_gb column...")
            cursor.execute("ALTER TABLE deployment ADD COLUMN storage_gb INTEGER")
            
        if "uptime_seconds" not in columns:
            print("Adding uptime_seconds column...")
            cursor.execute("ALTER TABLE deployment ADD COLUMN uptime_seconds INTEGER")
            
        if "gpu_utilization" not in columns:
            print("Adding gpu_utilization column...")
            cursor.execute("ALTER TABLE deployment ADD COLUMN gpu_utilization INTEGER")
            
        if "gpu_memory_utilization" not in columns:
            print("Adding gpu_memory_utilization column...")
            cursor.execute("ALTER TABLE deployment ADD COLUMN gpu_memory_utilization INTEGER")
            
        # Create ActivityLog table if not exists
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='activitylog'")
        if not cursor.fetchone():
            print("Creating activitylog table...")
            cursor.execute("""
                CREATE TABLE activitylog (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    deployment_id INTEGER NOT NULL,
                    action TEXT NOT NULL,
                    status TEXT NOT NULL,
                    details TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY(deployment_id) REFERENCES deployment(id)
                )
            """)
        else:
            print("activitylog table already exists.")

        # Create Provider table if not exists
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='provider'")
        if not cursor.fetchone():
            print("Creating provider table...")
            cursor.execute("""
                CREATE TABLE provider (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL UNIQUE,
                    type TEXT NOT NULL,
                    api_key TEXT,
                    config_json TEXT,
                    is_enabled BOOLEAN DEFAULT 1,
                    weight INTEGER DEFAULT 100,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)
        else:
            print("provider table already exists.")
            
        # Create SystemSetting table if not exists
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='systemsetting'")
        if not cursor.fetchone():
            print("Creating systemsetting table...")
            cursor.execute("""
                CREATE TABLE systemsetting (
                    "key" TEXT NOT NULL PRIMARY KEY,
                    value TEXT NOT NULL,
                    description TEXT,
                    is_secret BOOLEAN DEFAULT 0,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)
        else:
            print("systemsetting table already exists.")

        # Add clerk_id to User table if not exists
        cursor.execute("PRAGMA table_info(user)")
        user_columns = [info[1] for info in cursor.fetchall()]
        if "clerk_id" not in user_columns:
            print("Adding clerk_id column to user table...")
            cursor.execute("ALTER TABLE user ADD COLUMN clerk_id TEXT")
            # SQLite doesn't support adding UNIQUE constraints via ALTER TABLE easily without recreating, 
            # but we can add a unique index
            cursor.execute("CREATE UNIQUE INDEX IF NOT EXISTS ix_user_clerk_id ON user (clerk_id)")
        else:
            print("user.clerk_id column already exists.")

        conn.commit()
        print("✅ Database migration completed successfully!")
        
    except Exception as e:
        print(f"❌ Migration failed: {e}")
        conn.rollback()
    finally:
        conn.close()

if __name__ == "__main__":
    migrate_db()
