# Changelog

所有重要的变更都会记录在这个文件中。

格式基于 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.0.0/)，
版本号遵循 [语义化版本](https://semver.org/lang/zh-CN/)。

---

## [0.9.0] - 2026-01-16

### 🎉 重大变更：开源转型 (Phase 0)

**战略转型**：从 SaaS 订阅模式转变为开源 + Pro License 模式

### Removed
- 🗑️ **订阅系统清理**
  - 删除所有 Stripe 集成代码 (`stripe_webhook.py`, `stripe_service.py`)
  - 删除订阅 API 端点 (`subscriptions.py`)
  - 删除订阅数据模型 (`UserSubscription`, `SubscriptionEvent` 等)
  - 移除 Stripe 依赖 (`requirements.txt`)
  - 删除前端订阅页面 (`/settings/subscription`, `/admin/stripe-settings`)
  - 删除订阅相关 API 客户端 (`subscription-api.ts`)

- 🧹 **废弃文件清理**
  - 删除 `stripe_config.py`
  - 删除订阅迁移脚本 (`007_create_subscriptions.py`)
  - 删除备份文件 (`permission_service.py.bak`)
  - 删除临时脚本 (`fix_deployments.py`)

### Changed
- 📄 **页面更新为开源模式**
  - Pricing 页面：从 4 个订阅计划改为 Free + Pro ($49 Lifetime)
  - Hero Section：添加 "Open Source • Self-Hosted" 徽章
  - About 页面：添加作者 roc-chiang 信息和社交媒体链接
  - Privacy 页面：强调自托管和数据所有权
  - Terms 页面：更新为 MIT License + Pro License 条款
  - Footer：更新社交媒体链接（GitHub、X、LinkedIn）

- 📚 **文档完全重写**
  - README.md：完全重写为开源项目模式
  - ROADMAP.md：更新为 License 系统开发路线图
  - DOCS_INDEX.md：更新文档索引为开源模式
  - CHANGELOG.md：添加开源转型记录
  - Help.md：添加开源项目说明
  - backend.md：移除计费系统，添加 License 验证

- 🔧 **FastAPI 文档更新**
  - API 标题：ComputeHub Control Plane → ComputeHub API
  - 添加开源项目描述和功能列表
  - 添加 GitHub 仓库和文档链接
  - 添加 MIT License 信息
  - 版本更新：0.1.0 → 0.9.0

### Added
- 🔗 **社交媒体链接**
  - About 页面：GitHub、X/Twitter、LinkedIn 按钮
  - Footer：3 个社交媒体图标链接
  - 作者信息：roc-chiang (@rocchiang1)

- 🌐 **GitHub 仓库链接**
  - 替换所有占位符链接为实际仓库地址
  - 更新 7 个文件中的 GitHub 链接

### Technical Details
- **后端修改**:
  - `services/control-plane/app/main.py` - FastAPI 文档更新
  - `services/control-plane/requirements.txt` - 移除 Stripe
  - `services/control-plane/app/core/models.py` - 删除订阅模型
  - `services/control-plane/app/api/v1/settings.py` - 移除 Stripe 配置

- **前端修改**:
  - `web/src/app/pricing/page.tsx` - 完全重写
  - `web/src/components/landing/*` - 多个组件更新
  - `web/src/app/about/page.tsx` - 添加作者信息
  - `web/src/app/privacy/page.tsx` - 自托管说明
  - `web/src/app/terms/page.tsx` - MIT + Pro License

- **文档修改**:
  - `README.md` - 完全重写
  - `ROADMAP.md` - 更新路线图
  - `DOCS_INDEX.md` - 更新索引
  - `Help.md` - 添加开源说明
  - `backend.md` - 移除计费系统

---

## [0.8.1] - 2025-12-12

### Added
- 🎨 **双模式部署界面**
  - 专业模式 (`/deploy/new`) - 完整功能的部署界面
  - 快速部署模式 (`/deploy/quick`) - 简化的 3 步工作流
- 🤖 **自动生成部署名称** - 基于模板/工作负载 + 时间戳
- 🎮 **RTX 4080 GPU 支持** - 添加到 RunPod 适配器映射
- 📊 **模板画廊** - 4 个预配置环境（PyTorch、TensorFlow、Stable Diffusion、Base CUDA）
- 💰 **实时成本估算器** - 在专业模式中显示成本预估
- 🔄 **保存为模板功能** - 将部署配置保存为可重用模板

### Fixed
- ✅ **Provider 选择逻辑** - 优先选择最便宜的付费 Provider（排除 "local (free)"）
- ✅ **GPU 价格显示** - 与选中的 Provider 同步，而非总是显示最便宜的
- ✅ **API 统一** - 两种部署模式都使用 `comparePrices` API
- ✅ **LocalAdapter 可用性检查** - 添加缺失的 `check_gpu_availability` 方法
- ✅ **Provider 查询逻辑** - 可用性服务现在查询系统级 Provider

### Changed
- 🧹 **移除重复组件** - 删除专业模式中重复的 GPU 可用性组件
- 🎨 **优化 UI/UX** - 改进 Provider 选择界面，添加 "推荐" vs "已选择" 徽章
- 📱 **响应式设计** - 两种模式都支持移动端和桌面端

---

## [0.8.0] - 2025-12-08

### Added
- 🔧 **Provider 管理系统**
  - 后端 API: 统计、性能指标、CRUD 操作
  - 前端页面: `/admin/providers` (4 个标签页)
  - 数据库: 添加 `provider_id` 外键到 Deployment 表
  - 审计日志: 所有 Provider 操作都会记录

- 🎫 **工单系统**
  - 完整的工单管理系统
  - 管理员和用户界面

- ⚙️ **系统设置**
  - 后端 API 完成
  - 数据库模型完成

### Changed
- 🔐 **认证系统**: 使用 Clerk 第三方认证服务
- 👥 **权限系统**: 普通用户 vs 管理员权限分离

---

## [Unreleased]

### Planned for v1.0.0 (License 系统)
- 🔑 License 激活和验证系统
- 🤖 自动化引擎 (Pro 功能)
- 🔔 通知系统 (Pro 功能)
- 📊 高级监控 (Pro 功能)

### Planned for v1.1.0
- 🎨 部署模板市场
- 👥 团队协作功能
- 🌐 更多 Provider 集成

---

## 版本说明

- **[0.9.x]** - 开源转型版本，License 系统开发
- **[0.8.x]** - 功能开发版本 (SaaS 时期)
- **[1.0.0]** - 正式发布版本，生产就绪
- **日期格式**: YYYY-MM-DD

---

**GitHub**: https://github.com/roc-chiang/computehub  
**License**: MIT (Core) + Pro License ($49 lifetime)
