import sqlite3
import requests

# Get bot token from database
conn = sqlite3.connect('test.db')
cursor = conn.cursor()
cursor.execute('SELECT value FROM system_settings WHERE key = "telegram_bot_token"')
result = cursor.fetchone()
conn.close()

if not result:
    print("❌ Telegram bot token not found in database")
    exit(1)

bot_token = result[0]
print(f"✅ Bot token found: {bot_token[:10]}...")

# Delete webhook
url = f"https://api.telegram.org/bot{bot_token}/deleteWebhook?drop_pending_updates=true"
response = requests.get(url)

if response.status_code == 200:
    data = response.json()
    if data.get('ok'):
        print("✅ Webhook deleted successfully!")
        print(f"   Result: {data.get('result')}")
        print(f"   Description: {data.get('description', 'N/A')}")
    else:
        print(f"❌ Failed to delete webhook: {data}")
else:
    print(f"❌ HTTP Error: {response.status_code}")
    print(response.text)

# Get webhook info to verify
url2 = f"https://api.telegram.org/bot{bot_token}/getWebhookInfo"
response2 = requests.get(url2)
if response2.status_code == 200:
    info = response2.json()
    print("\n📋 Current webhook info:")
    print(f"   URL: {info.get('result', {}).get('url', 'None')}")
    print(f"   Pending updates: {info.get('result', {}).get('pending_update_count', 0)}")
