# Changelog

所有重要的变更都会记录在这个文件中。

格式基于 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.0.0/)，
版本号遵循 [语义化版本](https://semver.org/lang/zh-CN/)。

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

### Technical Details
- **前端修改**:
  - `web/src/app/deploy/new/page.tsx` - 专业模式
  - `web/src/app/deploy/quick/page.tsx` - 快速部署模式
  - `web/src/components/deploy/price-comparison-drawer.tsx` - Provider 选择
  - `web/src/components/deploy/gpu-selector.tsx` - GPU 选择器
- **后端修改**:
  - `services/control-plane/app/adapters/runpod_adapter.py` - RTX 4080 映射
  - `services/control-plane/app/adapters/local_adapter.py` - 可用性检查
  - `services/control-plane/app/services/availability_service.py` - Provider 查询

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

### Planned for v0.8.2 (Phase 8 Week 2)
- 🤖 自动 Failover 编排服务
- 🎯 智能推荐引擎
- 🔔 Failover 通知系统
- 🎨 Failover UI 界面

### Planned for v0.9.0 (Phase 9)
- 📊 收入分析系统
- 🎨 系统设置前端集成
- ✏️ Provider 编辑功能

### Planned for v1.0.0 (正式发布)
- 🚀 完整的商业级 GPU 聚合平台
- 📈 生产环境优化
- 📚 完整文档

---

## 版本说明

- **[0.x.x]** - 开发版本，功能逐步完善
- **[1.0.0]** - 正式发布版本，生产就绪
- **日期格式**: YYYY-MM-DD
