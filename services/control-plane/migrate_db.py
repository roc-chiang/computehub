# 数据库迁移脚本 - 添加 preferences_json 字段

import sqlite3

print("开始迁移数据库...")

try:
    conn = sqlite3.connect('test.db')
    cursor = conn.cursor()
    
    # 添加 preferences_json 字段
    cursor.execute("ALTER TABLE user ADD COLUMN preferences_json TEXT;")
    
    conn.commit()
    conn.close()
    
    print("✅ 迁移成功!")
    print("现在可以重启后端了")
    
except sqlite3.OperationalError as e:
    if "duplicate column name" in str(e):
        print("⚠️ 字段已存在,无需迁移")
    else:
        print(f"❌ 迁移失败: {e}")
except Exception as e:
    print(f"❌ 错误: {e}")
