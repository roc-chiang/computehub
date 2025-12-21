# ComputeHub - Multi-Provider GPU Compute Platform

**Version**: v0.8.1  
**Product Type**: SaaS Platform (Subscription-based)  
**Core Value**: GPU Aggregation + Automation + Unified Management

---

## 🎯 What is ComputeHub?

> **ComputeHub = Skyscanner for GPU + Cross-Cloud Orchestration**

ComputeHub is a **management platform** that helps users:
- 🔍 Find the cheapest GPU across multiple providers
- 🎛️ Manage all GPU instances in one unified console
- 🤖 Automate scheduling, failover, and cost optimization

### What We Are NOT
- ❌ Not a GPU provider
- ❌ Not charging for GPU usage
- ❌ Not承担 GPU costs

### What We ARE
- ✅ **Management Platform** - Unified control panel for RunPod, Vast.ai, etc.
- ✅ **Automation Tool** - Smart scheduling, auto-restart, cost alerts
- ✅ **SaaS Subscription** - Users pay monthly for management features

---

## 💰 Business Model

### Subscription Plans
| Plan | Price | Features |
|------|-------|----------|
| **Free** | $0/month | 1 Provider, Basic management, Price comparison |
| **Pro** | $49/month | 3 Providers, Automation, Notifications, Templates |
| **Team** | $299/month | Unlimited Providers, Advanced automation, Team collaboration |
| **Enterprise** | Custom | Compliance, Private deployment, Custom development |

### Revenue Model
- Users pay ComputeHub for **management and automation services**
- GPU costs are paid directly to providers (RunPod, Vast.ai, etc.)
- High margin SaaS business (>80%)

---

## ✨ Key Features

### 🟢 Completed (v0.8.1)
- ✅ Multi-provider deployment (RunPod, Vast.ai, Local)
- ✅ Real-time price comparison
- ✅ User authentication (Clerk)
- ✅ Provider API key management (encrypted)
- ✅ Deployment management (Create/Start/Stop/Delete)
- ✅ Real-time logs viewer
- ✅ Performance metrics charts (GPU/CPU/RAM)
- ✅ Admin dashboard

### 🚧 In Progress
- 🚧 Documentation reorganization
- 🚧 Development roadmap

### ⏳ Planned (Priority Order)
1. **Automation Engine** (P0 - Core Moat)
   - Health checks & auto-restart
   - Cost-based auto-migration
   - Cross-provider failover
   
2. **Notification System** (P0)
   - Email, Telegram, Webhook
   - Downtime, cost alerts
   
3. **Subscription System** (P1)
   - Stripe integration
   - Plan management
   
4. **Real-time Monitoring** (P1)
   - GPU temperature, utilization
   - WebSSH terminal

---

## 🏗️ Architecture

```
┌─────────────┐
│   Next.js   │  Frontend (TypeScript + shadcn/ui)
│   Frontend  │
└──────┬──────┘
       │
┌──────▼──────┐
│   FastAPI   │  Control Plane (Python 3.11)
│   Backend   │
└──────┬──────┘
       │
┌──────▼──────────────────────────┐
│  Provider Adapters              │
│  ├─ RunPod (GraphQL)           │
│  ├─ Vast.ai (REST)             │
│  └─ Local (Mock)               │
└─────────────────────────────────┘
```

---

## 🚀 Quick Start

### Prerequisites
- Docker & Docker Compose
- Node.js 18+
- Python 3.11+

### Local Development

1. **Start Backend**
```bash
cd services/control-plane
pip install -r requirements.txt
uvicorn app.main:app --reload
```

2. **Start Frontend**
```bash
cd web
npm install
npm run dev
```

3. **Access Application**
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

---

## 📖 Documentation

### Essential Docs (Must Read)
- **[PRD.md](./PRD.md)** ⭐⭐⭐ - Product positioning and business model
- **[Help.md](./Help.md)** ⭐⭐⭐ - Developer quick start guide
- **[ROADMAP.md](./ROADMAP.md)** ⭐⭐⭐ - Development roadmap and priorities
- **[DOCS_INDEX.md](./DOCS_INDEX.md)** - Complete documentation index

### Additional Docs
- [CHANGELOG.md](./CHANGELOG.md) - Version history
- [backend.md](./backend.md) - Backend development plan

---

## 🎨 Tech Stack

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **Auth**: Clerk
- **Charts**: Recharts

### Backend
- **Framework**: FastAPI
- **Language**: Python 3.11
- **ORM**: SQLModel (SQLAlchemy)
- **Database**: PostgreSQL (SQLite for dev)
- **Cache**: Redis
- **Auth**: Clerk JWT validation

---

## 📊 Current Status

### Completed Features (70%)
- ✅ Core infrastructure
- ✅ Multi-provider support
- ✅ Deployment management
- ✅ Price comparison
- ✅ Real-time monitoring

### Next Priorities
1. **Automation Engine** (2-3 weeks) - Core competitive advantage
2. **Notification System** (1 week) - User experience
3. **Subscription System** (1 week) - Monetization

---

## 🎯 Success Metrics

### User Growth
- Month 3: 1000+ Free users
- Month 6: 5-10% Pro conversion
- Year 1: $50,000 MRR

### Product Metrics
- User retention: >60%
- Pro feature usage: >80%
- Auto-scheduling success: >95%

---

## 🤝 Contributing

This is a private project. For questions or suggestions, please contact the development team.

---

## 📝 Important Notes

### Core Principles
```
ComputeHub = Management Platform, NOT GPU Provider
Revenue = Subscription Fees, NOT GPU Usage
Value = Automation + Unified Management
```

### Development Guidelines
1. Always refer to **PRD.md** for product positioning
2. Check **ROADMAP.md** for current priorities
3. Use **Help.md** for technical implementation
4. All features must align with subscription-based SaaS model

---

**Last Updated**: 2025-12-21  
**Current Version**: v0.8.1  
**Next Release**: v0.9.0 (Automation Engine)

For detailed product requirements, see [PRD.md](./PRD.md)
