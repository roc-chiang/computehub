# ComputeHub

**Open-source GPU management platform for multi-cloud deployments**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![GitHub Stars](https://img.shields.io/github/stars/roc-chiang/computehub?style=social)](https://github.com/roc-chiang/computehub)

---

## 🎯 What is ComputeHub?

ComputeHub is an **open-source, self-hosted platform** that helps you manage GPU deployments across multiple cloud providers from a single dashboard.

### Key Features

- 🔍 **Multi-Provider Support** - Deploy GPUs on RunPod, Vast.ai, and more
- 💰 **Price Comparison** - Find the cheapest GPU across providers
- 🎛️ **Unified Dashboard** - Manage all instances in one place
- 🤖 **Automation** (Pro) - Auto-restart, cost limits, smart scheduling
- 📊 **Real-time Monitoring** - GPU metrics, logs, and performance charts
- 🔐 **Self-Hosted** - Your data stays on your servers

---

## 💡 Why ComputeHub?

### The Problem
Managing GPU deployments across multiple cloud providers is complex:
- Fragmented dashboards for each provider
- Manual cost tracking and forgotten instances
- No automation for failures or cost overruns
- Vendor lock-in

### The Solution
ComputeHub provides:
- ✅ **One dashboard** for all your GPU instances
- ✅ **Open-source** - No vendor lock-in, modify as needed
- ✅ **Self-hosted** - Full control over your data
- ✅ **Optional Pro features** - Advanced automation for $49 lifetime

---

## 🚀 Quick Start

### Prerequisites
- Docker & Docker Compose
- Node.js 18+
- Python 3.11+

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/roc-chiang/computehub.git
cd computehub
```

2. **Start the backend**
```bash
cd services/control-plane
pip install -r requirements.txt
uvicorn app.main:app --reload
```

3. **Start the frontend**
```bash
cd web
npm install
npm run dev
```

4. **Access the application**
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

---

## 📦 What's Included

### Free (Open Source)
- Multi-provider GPU management
- Deployment dashboard
- Price comparison across providers
- Organization & project management
- Basic deployment templates
- SSH access to instances
- Cost tracking
- Community support

### Pro ($49 Lifetime)
Unlock advanced automation features:
- 🤖 Automation engine with IF-THEN rules
- 🔄 Auto-restart on failure
- 💰 Cost limit auto-shutdown
- 📧 Email notifications
- 📱 Telegram notifications
- 🔗 Webhook integration
- 📊 Advanced monitoring
- ⚡ Batch operations
- 🎨 Advanced templates (ComfyUI, SD WebUI, Llama)
- ✉️ Email support

[**Buy Pro License →**](https://gumroad.com/l/computehub-pro)

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

## 📖 Documentation

- **[PRD.md](./PRD.md)** - Product requirements and roadmap
- **[Help.md](./Help.md)** - Developer guide
- **[DOCS_INDEX.md](./DOCS_INDEX.md)** - Complete documentation index

---

## 🤝 Contributing

We welcome contributions! ComputeHub is open-source under the MIT License.

### How to Contribute
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow existing code style
- Write tests for new features
- Update documentation as needed
- Keep commits atomic and well-described

---

## 📝 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

### Pro License
The Pro License is an optional add-on that unlocks advanced automation features. It is:
- **One-time payment** ($49)
- **Lifetime access** to all Pro features
- **All future updates** included
- **Non-transferable**

Pro features are implemented in the open-source codebase but require a valid license key to activate.

---

## 🌟 Roadmap

### ✅ Completed (v0.8)
- Multi-provider deployment (RunPod, Vast.ai)
- Real-time price comparison
- Deployment management
- Real-time logs and metrics
- Organization & project support

### 🚧 In Progress (v0.9)
- License system implementation
- Pro feature activation
- Advanced automation engine

### 📅 Planned (v1.0)
- More provider integrations
- Advanced monitoring dashboards
- Team collaboration features
- API improvements

---

## 👨‍💻 Author

Created by **roc-chiang** - A technology enthusiast with experience across gaming, smart hardware, blockchain, and 3D digital humans.

> "An idealistic thinker and a pragmatic doer — holding the line in compromise, staying flexible in persistence."

- **GitHub**: [@roc-chiang](https://github.com/roc-chiang)
- **X/Twitter**: [@rocchiang1](https://x.com/rocchiang1)
- **LinkedIn**: [pengjiang8](https://www.linkedin.com/in/pengjiang8/)

---

## 💬 Community & Support

- **GitHub Issues**: [Report bugs or request features](https://github.com/roc-chiang/computehub/issues)
- **Discussions**: [Join the community](https://github.com/roc-chiang/computehub/discussions)
- **Pro Support**: Email support for Pro license holders

---

## ⭐ Star History

If you find ComputeHub useful, please consider giving it a star on GitHub!

[![Star History Chart](https://api.star-history.com/svg?repos=roc-chiang/computehub&type=Date)](https://star-history.com/#roc-chiang/computehub&Date)

---

**Last Updated**: 2026-01-16  
**Current Version**: v0.8.1  
**License**: MIT  
**Pro License**: $49 Lifetime

[**Get Started**](https://github.com/roc-chiang/computehub) • [**Buy Pro**](https://gumroad.com/l/computehub-pro) • [**Documentation**](./DOCS_INDEX.md)
