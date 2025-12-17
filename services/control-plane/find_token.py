import sqlite3
import requests

conn = sqlite3.connect('test.db')
c = conn.cursor()

# Correct table name is 'systemsetting'
c.execute('SELECT value FROM systemsetting WHERE key = "telegram_bot_token"')
result = c.fetchone()
conn.close()

if not result or not result[0]:
    print("❌ Bot token not found or empty")
    exit(1)

bot_token = result[0]
print(f"✅ Bot token found: {bot_token[:20]}...")

# Delete webhook
url = f"https://api.telegram.org/bot{bot_token}/deleteWebhook?drop_pending_updates=true"
print(f"\n🔄 Deleting webhook...")
response = requests.get(url)

if response.status_code == 200:
    data = response.json()
    if data.get('ok'):
        print("✅ Webhook deleted successfully!")
    else:
        print(f"❌ Failed: {data}")
else:
    print(f"❌ HTTP Error: {response.status_code}")

# Verify
url2 = f"https://api.telegram.org/bot{bot_token}/getWebhookInfo"
response2 = requests.get(url2)
if response2.status_code == 200:
    info = response2.json()
    webhook_url = info.get('result', {}).get('url', '')
    print(f"\n📋 Current webhook: {webhook_url if webhook_url else 'None (cleared!)'}")

