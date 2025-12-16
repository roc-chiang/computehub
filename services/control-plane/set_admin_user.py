"""
Script to set admin role for specific user email in Clerk
Run this once to make gujian8@gmail.com an admin
"""
import os
import requests
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

CLERK_SECRET_KEY = os.getenv("CLERK_SECRET_KEY")
ADMIN_EMAIL = "gujian8@gmail.com"

if not CLERK_SECRET_KEY:
    print("❌ CLERK_SECRET_KEY not found in .env file")
    exit(1)

# Clerk API endpoint
BASE_URL = "https://api.clerk.com/v1"
headers = {
    "Authorization": f"Bearer {CLERK_SECRET_KEY}",
    "Content-Type": "application/json"
}

def get_user_by_email(email):
    """Get user by email address"""
    response = requests.get(
        f"{BASE_URL}/users",
        headers=headers,
        params={"email_address": [email]}
    )
    
    if response.status_code != 200:
        print(f"❌ Failed to fetch user: {response.status_code}")
        print(response.text)
        return None
    
    users = response.json()
    if not users:
        print(f"❌ No user found with email: {email}")
        return None
    
    return users[0]

def set_admin_role(user_id):
    """Set admin role in user's public metadata"""
    response = requests.patch(
        f"{BASE_URL}/users/{user_id}",
        headers=headers,
        json={
            "public_metadata": {
                "role": "admin"
            }
        }
    )
    
    if response.status_code != 200:
        print(f"❌ Failed to update user: {response.status_code}")
        print(response.text)
        return False
    
    return True

def main():
    print(f"🔍 Looking for user: {ADMIN_EMAIL}")
    user = get_user_by_email(ADMIN_EMAIL)
    
    if not user:
        print("\n⚠️  User not found. Please:")
        print("   1. Sign up at http://localhost:3000")
        print(f"   2. Use email: {ADMIN_EMAIL}")
        print("   3. Run this script again")
        return
    
    user_id = user["id"]
    print(f"✅ Found user: {user_id}")
    
    print(f"🔧 Setting admin role...")
    if set_admin_role(user_id):
        print(f"✅ Successfully set {ADMIN_EMAIL} as admin!")
        print(f"\n📋 User Details:")
        print(f"   ID: {user_id}")
        print(f"   Email: {user.get('email_addresses', [{}])[0].get('email_address')}")
        print(f"   Role: admin")
    else:
        print("❌ Failed to set admin role")

if __name__ == "__main__":
    main()
