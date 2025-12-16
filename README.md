# ComputeHub - Multi-Provider GPU Compute Platform

A unified platform for managing GPU compute instances across multiple providers (RunPod, Vast.ai, Local).

## ✨ Key Features

### 🚀 **Smart Deployment**
- **User-Centric Flow**: Simplified 3-step deployment (Templates → GPU → Configuration)
- **Real-Time Price Comparison**: Dynamic pricing from all providers with 5-minute caching
- **Auto-Selection**: Automatically recommends the cheapest available provider
- **Manual Override**: Full control to select specific providers when needed

### 💰 **Transparent Pricing**
- Live pricing from RunPod, Vast.ai, and Local providers
- Price comparison drawer integrated into GPU selection
- Real-time cost estimation with hourly/daily/monthly breakdowns
- Visual indicators for best prices (🏆) and test providers

### 🎯 **Multi-Provider Support**
- **RunPod**: GraphQL API integration with on-demand pricing
- **Vast.ai**: REST API with verified offers and price sorting
- **Local**: Mock provider for testing (free)

### 🔐 **Authentication & Security**
- Clerk integration for user authentication
- JWT-based API security
- User synchronization and session management

### 🛠️ **Admin & Management**
- **Provider Management**: Add, edit, delete compute providers
- **API Key Management**: Secure storage with visibility toggle
- **Enable/Disable Providers**: Control which providers are active
- **System Settings**: Centralized configuration management

### 📊 **Advanced Monitoring**
- Real-time GPU utilization metrics
- Live log streaming from instances
- Activity audit logs for all operations
- Cost alerts and idle warnings

### 🛠️ **Instance Management**
- One-click deployment with templates
- Start/Stop/Restart controls
- SSH and JupyterLab access
- Web-based file browser
- Custom Docker image support

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

## 🚀 Quick Start

### Prerequisites
- Docker & Docker Compose
- Node.js 18+ (for frontend development)
- Python 3.11+ (for backend development)

### Local Development

1. **Start Infrastructure**
```bash
cd infra
docker-compose up -d
```

2. **Start Backend**
```bash
cd services/control-plane
pip install -r requirements.txt
uvicorn app.main:app --reload
```

3. **Start Frontend**
```bash
cd web
npm install
npm run dev
```

4. **Access Application**
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

## 📖 Documentation

- [Task Tracker](./brain/task.md) - Development progress and roadmap
- [Price Comparison Walkthrough](./brain/walkthrough_price_comparison.md) - Detailed implementation guide
- [Clerk Auth Walkthrough](./brain/walkthrough_clerk_auth.md) - Authentication setup
- [API Documentation](http://localhost:8000/docs) - Interactive API docs (when running)

## 🔧 Configuration

### Environment Variables

**Backend** (`services/control-plane/.env`):
```env
DATABASE_URL=postgresql://user:pass@localhost:5432/computehub
REDIS_URL=redis://localhost:6379
RUNPOD_API_KEY=your_runpod_key
VAST_API_KEY=your_vast_key
CLERK_SECRET_KEY=your_clerk_secret
```

**Frontend** (`web/.env.local`):
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_key
CLERK_SECRET_KEY=your_clerk_secret
```

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
- **Database**: PostgreSQL
- **Cache**: Redis
- **Auth**: Clerk JWT validation

### Infrastructure
- **Containerization**: Docker
- **Orchestration**: Docker Compose
- **Reverse Proxy**: Caddy
- **Object Storage**: MinIO (S3-compatible)

## 📊 Features Roadmap

### ✅ Completed (Phase 0-6)
- [x] Multi-provider deployment system
- [x] Real-time price comparison
- [x] User-centric deployment flow
- [x] Clerk authentication
- [x] GPU metrics dashboard
- [x] Log streaming
- [x] File management
- [x] Cost alerts
- [x] Admin provider management

### 🚧 In Progress
- [ ] Stripe payment integration
- [ ] Usage analytics
- [ ] Team collaboration features

### 📅 Planned
- [ ] Spot instance support
- [ ] Auto-scaling policies
- [ ] Price history charts
- [ ] Email notifications
- [ ] API rate limiting
- [ ] Webhook support

## 🤝 Contributing

This is a private project. For questions or suggestions, please contact the development team.

## 📝 License

Proprietary - All rights reserved

## 🙏 Acknowledgments

- Built with [FastAPI](https://fastapi.tiangolo.com/)
- UI components from [shadcn/ui](https://ui.shadcn.com/)
- Authentication by [Clerk](https://clerk.com/)
- Deployed on [RunPod](https://runpod.io/) and [Vast.ai](https://vast.ai/)

---

**Last Updated**: 2025-12-07
**Version**: 0.6.0 (Phase 6 - Production Readiness)
