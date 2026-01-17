# ComputeHub Pro License Guide

Complete guide for purchasing, activating, and managing your ComputeHub Pro License.

---

## 📋 Table of Contents

- [What is Pro License?](#what-is-pro-license)
- [Purchasing a License](#purchasing-a-license)
- [Activating Your License](#activating-your-license)
- [Managing Your License](#managing-your-license)
- [Pro Features](#pro-features)
- [Troubleshooting](#troubleshooting)
- [FAQ](#faq)

---

## 🎯 What is Pro License?

ComputeHub Pro License is an **optional lifetime add-on** that unlocks advanced automation and management features.

### Key Points
- **One-time payment**: $49 (no subscription)
- **Lifetime access**: Never expires
- **All updates included**: Future Pro features at no extra cost
- **Self-hosted**: License verification works offline after initial activation
- **Non-transferable**: Tied to your installation

### Free vs Pro

| Feature | Free | Pro |
|---------|------|-----|
| Multi-provider deployment | ✅ | ✅ |
| Price comparison | ✅ | ✅ |
| Real-time monitoring | ✅ | ✅ |
| **Batch operations** | ❌ | ✅ |
| **Automation engine** | ❌ | ✅ |
| **Email notifications** | ❌ | ✅ |
| **Telegram notifications** | ❌ | ✅ |
| **Webhook integration** | ❌ | ✅ |
| **Advanced templates** | ❌ | ✅ |
| **Priority support** | ❌ | ✅ |

---

## 💳 Purchasing a License

### Step 1: Visit Gumroad
Go to: **[https://gumroad.com/l/computehub-pro](https://gumroad.com/l/computehub-pro)**

### Step 2: Complete Purchase
1. Click "I want this!"
2. Enter your email address
3. Complete payment ($49 USD)
4. Check your email for the license key

### Step 3: Save Your License Key
You will receive an email with your license key in this format:
```
COMPUTEHUB-XXXX-XXXX-XXXX-XXXX
```

**Important**: Keep this key safe! You'll need it to activate Pro features.

---

## 🔑 Activating Your License

### Web Interface (Recommended)

1. **Log in to ComputeHub**
   - Navigate to your ComputeHub installation
   - Sign in with your account

2. **Go to License Settings**
   - Click on your profile icon
   - Select "Settings" → "License"
   - Or visit: `https://your-domain.com/settings/license`

3. **Enter License Key**
   - Paste your license key in the input field
   - Format: `COMPUTEHUB-XXXX-XXXX-XXXX-XXXX`
   - Click "Activate License"

4. **Confirmation**
   - You should see a success message
   - Pro badge will appear next to Pro features
   - Batch operations and automation features are now unlocked

### API Activation (Advanced)

If you prefer to activate via API:

```bash
curl -X POST https://your-domain.com/api/v1/license/activate \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"license_key": "COMPUTEHUB-XXXX-XXXX-XXXX-XXXX"}'
```

**Response**:
```json
{
  "success": true,
  "message": "Pro License activated successfully",
  "license_key": "COMPUTEHUB-****-****-****-XXXX",
  "activated_at": "2024-01-16T12:00:00Z",
  "is_pro_enabled": true
}
```

---

## 🛠️ Managing Your License

### Checking License Status

**Web Interface**:
- Visit `/settings/license`
- View activation status, license key (masked), and activation date

**API**:
```bash
curl https://your-domain.com/api/v1/license/status \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Deactivating License

If you need to deactivate your license (e.g., moving to a new server):

**Web Interface**:
1. Go to `/settings/license`
2. Click "Deactivate License"
3. Confirm deactivation

**API**:
```bash
curl -X DELETE https://your-domain.com/api/v1/license/deactivate \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Note**: After deactivation, you can reactivate the same license key on a different installation.

---

## ✨ Pro Features

### 1. Batch Operations
Manage multiple deployments simultaneously:
- **Batch Start**: Start multiple stopped instances at once
- **Batch Stop**: Stop multiple running instances
- **Batch Delete**: Delete multiple deployments

**How to use**:
1. Go to Deployments page
2. Select multiple deployments using checkboxes
3. Click "Start", "Stop", or "Delete" in the batch actions bar

### 2. Automation Engine
Automate deployment management:
- **Auto-restart on failure**: Automatically restart crashed instances
- **Cost limits**: Stop deployments when cost exceeds threshold
- **Health checks**: Monitor and restart unhealthy instances
- **Scheduled actions**: Start/stop deployments on schedule

**How to configure**:
1. Go to Deployment Details
2. Click "Automation" tab
3. Enable desired automation rules

### 3. Email Notifications
Receive email alerts for:
- Deployment failures
- Cost threshold exceeded
- Automation actions
- System updates

**How to configure**:
1. Go to Settings → Notifications
2. Enable email notifications
3. Configure notification preferences

### 4. Telegram Notifications
Get instant Telegram alerts:
- Real-time deployment status
- Cost alerts
- Automation notifications

**How to configure**:
1. Create a Telegram bot via @BotFather
2. Go to Settings → Notifications
3. Enter your bot token and chat ID

### 5. Webhook Integration
Integrate with your own systems:
- Custom webhooks for deployment events
- Payload customization
- Retry logic

**How to configure**:
1. Go to Settings → Webhooks
2. Add webhook URL
3. Select events to trigger

### 6. Advanced Templates
Pre-configured templates for:
- **ComfyUI**: AI image generation
- **Stable Diffusion WebUI**: AI art creation
- **Llama.cpp**: LLM inference
- **Custom templates**: Create your own

**How to use**:
1. Go to "New Deployment"
2. Select "Advanced Templates" tab
3. Choose a template and deploy

---

## 🔧 Troubleshooting

### License Key Not Working

**Problem**: "Invalid license key" error

**Solutions**:
1. **Check format**: Ensure key is `COMPUTEHUB-XXXX-XXXX-XXXX-XXXX`
2. **Remove spaces**: Copy-paste might add extra spaces
3. **Uppercase**: License keys are case-sensitive (use uppercase)
4. **Verify purchase**: Check your Gumroad email

### License Already Activated

**Problem**: "License already activated on another installation"

**Solutions**:
1. **Deactivate first**: Deactivate from the old installation
2. **Contact support**: If you can't access the old installation

### Pro Features Not Working

**Problem**: Pro badge shows but features don't work

**Solutions**:
1. **Refresh page**: Hard refresh (Ctrl+Shift+R)
2. **Check status**: Visit `/settings/license` to verify activation
3. **Restart backend**: Restart the backend service
4. **Check logs**: Look for errors in backend logs

### Remote Verification Failed

**Problem**: "Remote license verification failed" warning

**Solutions**:
1. **Check internet**: Ensure server has internet access
2. **Firewall**: Allow outbound connections to license server
3. **Local fallback**: License will still work locally
4. **Contact support**: If issue persists

---

## ❓ FAQ

### Can I use one license on multiple servers?
No, each license is tied to one installation. You need separate licenses for multiple servers.

### What happens if I reinstall ComputeHub?
You can reactivate your license on the new installation. Deactivate from the old one first if possible.

### Do I need internet for Pro features to work?
No, after initial activation, Pro features work offline. Remote verification is optional.

### Can I transfer my license to someone else?
No, licenses are non-transferable and tied to the purchaser.

### What if I lose my license key?
Check your Gumroad purchase email. You can also contact support with your purchase receipt.

### Are there refunds?
Due to the nature of digital products, we don't offer refunds. Please try the free version first.

### How do I get support?
- **Community**: GitHub Discussions
- **Pro users**: Priority email support (support@computehub.dev)
- **Issues**: GitHub Issues for bugs

### Will future Pro features cost extra?
No, all future Pro features are included in your lifetime license at no extra cost.

### Can I use Pro features in a commercial project?
Yes, the Pro License allows commercial use. See the MIT License for details.

### How is my license key stored?
License keys are encrypted using Fernet encryption and stored securely in your database.

---

## 📞 Support

### For Pro License Holders
- **Email**: support@computehub.dev
- **Response time**: Within 24 hours

### For Everyone
- **GitHub Issues**: [Report bugs](https://github.com/roc-chiang/computehub/issues)
- **GitHub Discussions**: [Ask questions](https://github.com/roc-chiang/computehub/discussions)
- **Documentation**: [Full docs](./DOCS_INDEX.md)

---

## 🔒 Security & Privacy

- License keys are **encrypted** before storage
- Verification happens **locally** after initial activation
- **No tracking** or analytics on license usage
- **Open source**: Verify the code yourself

---

**Thank you for supporting ComputeHub!** 🎉

Your purchase helps maintain and improve this open-source project.
