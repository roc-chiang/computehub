# ComputeHub 开发路线图

**最后更新**: 2026-01-16  
**当前版本**: v0.9.0  
**产品定位**: 开源 GPU 管理平台 + 可选 Pro License (参考 PRD.md)

---

## 🎯 产品核心定位

> **ComputeHub = 开源的 GPU 聚合平台 + 自托管部署方案**

### 我们不是什么
- ❌ 不是 GPU 提供商
- ❌ 不按 GPU 使用量计费
- ❌ 不承担 GPU 成本
- ❌ 不是 SaaS 订阅服务

### 我们是什么
- ✅ **开源管理平台** - 统一控制台管理多个 Provider
- ✅ **自托管方案** - 用户完全控制数据和部署
- ✅ **可选 Pro License** - $49 终身解锁自动化功能
- ✅ **社区驱动** - MIT License，欢迎贡献

### 商业模式
- **Free (开源)**: $0 - 核心功能，自托管
- **Pro (终身)**: $49 一次性 - 自动化、通知、高级功能

---

## ✅ 已完成功能 (Phase 0-8.1)

### 🟢 Phase 0-4: 基础设施 (100%)
- ✅ 用户系统 (Clerk 认证)
- ✅ 数据库模型 (SQLModel + PostgreSQL)
- ✅ FastAPI 后端框架
- ✅ Next.js 前端框架
- ✅ Provider Adapter 架构

### 🟢 Phase 5: 多 Provider 支持 (100%)
- ✅ RunPod Adapter (完整实现)
- ✅ Vast.ai Adapter (基础实现)
- ✅ Local Adapter (Mock 测试)
- ✅ Provider 管理后台
- ✅ 用户 Provider 绑定 (API Key 加密存储)

### 🟢 Phase 6: 部署管理 (100%)
- ✅ 创建部署 (支持多 Provider)
- ✅ 部署列表页面
- ✅ 启动/停止/重启/删除
- ✅ SSH 连接信息
- ✅ 状态同步 (后台任务)

### 🟢 Phase 7: 价格比较 (100%)
- ✅ 实时价格聚合
- ✅ GPU 规格对比
- ✅ 最佳性价比推荐
- ✅ 价格比较抽屉

### 🟢 Phase 8.1: 部署详情页增强 (100%)
- ✅ 实时日志查看器 (每 2 秒刷新)
- ✅ 性能监控图表 (GPU/CPU/RAM,每 5 秒刷新)
- ✅ 文件浏览器 (UI 完成,标注开发中)
- ✅ 审计日志 (显示部署历史)
- ✅ 状态指示器 (Live/Starting/Stopped/Error)

### 🟢 Phase 0: 开源转型 (100%) ✨ 最新完成
- ✅ 移除所有 Stripe/订阅代码
- ✅ 清理订阅相关数据模型和路由
- ✅ 更新所有页面为开源模式
- ✅ 重写 README 为开源项目
- ✅ 更新 FastAPI 文档
- ✅ 添加作者社交媒体链接
- ✅ 替换所有 GitHub 仓库链接

---

## ⏳ 待开发功能 (按优先级排序)

### 🔥🔥🔥 P0 - License 系统 (最高优先级)

#### Phase 1: License 系统开发 (2-3 天)
**目标**: 实现 Pro License 激活和验证

**后端开发**:
- ⏳ 创建 SystemSetting 模型
- ⏳ 实现 LicenseChecker 类
- ⏳ 实现 @require_pro_license 装饰器
- ⏳ 创建 License API 端点 (激活/状态/禁用)

**前端开发**:
- ⏳ 创建 License Context
- ⏳ 创建 License 激活页面 (`/settings/license`)
- ⏳ 创建 ProBadge 组件
- ⏳ 创建 UpgradePrompt 组件

**Pro 功能标记**:
- ⏳ 标记批量操作功能
- ⏳ 准备自动化功能接口

**工作量**: 2-3 天  
**商业价值**: ⭐⭐⭐⭐⭐ (变现核心)

---

#### Phase 2: License 验证服务器 (1-2 天)
**目标**: 部署远程 License 验证服务

**功能**:
- ⏳ 创建 Vercel 项目
- ⏳ 配置 Supabase 数据库
- ⏳ 实现验证 API (验证/撤销)
- ⏳ 部署和测试

**工作量**: 1-2 天  
**商业价值**: ⭐⭐⭐⭐⭐ (License 保护)

---

### 🔥🔥 P1 - 核心功能完善

#### Phase 3: 自动化引擎 (2-3 周) - Pro 功能
**目标**: ComputeHub 的核心差异化功能

**基础自动化**:
- ⏳ 健康检查 (每 30 秒 ping 实例)
- ⏳ 宕机自动重启
- ⏳ 成本上限自动关机
- ⏳ 实例状态监控

**规则引擎**:
- ⏳ IF-THEN 规则配置
- ⏳ 自定义触发条件
- ⏳ 多种动作 (重启/关机/通知)

**工作量**: 2-3 周  
**商业价值**: ⭐⭐⭐⭐⭐ (Pro 核心卖点)

---

#### Phase 4: 通知系统 (1 周) - Pro 功能
**目标**: 及时告知用户重要事件

**通知渠道**:
- ⏳ Email 通知
- ⏳ Telegram Bot
- ⏳ Webhook

**触发事件**:
- ⏳ 实例宕机
- ⏳ 成本超额
- ⏳ 部署成功/失败
- ⏳ 价格变化告警

**工作量**: 1 周  
**商业价值**: ⭐⭐⭐⭐ (Pro 用户体验)

---

#### Phase 5: 实时监控 (2 周) - Pro 功能
**目标**: 提供详细的实例监控

**功能**:
- ⏳ GPU 温度/负载实时显示
- ⏳ 显存占用
- ⏳ CPU/内存监控
- ⏳ 网络流量
- ⏳ WebSSH 终端
- ⏳ 自动报警

**工作量**: 2 周  
**商业价值**: ⭐⭐⭐⭐ (Pro 功能)

---

#### Phase 6: 部署模板系统 (1 周)
**目标**: 简化常见场景部署

**预置模板**:
- ⏳ Llama Inference
- ⏳ ComfyUI
- ⏳ Stable Diffusion WebUI
- ⏳ Jupyter / VSCode Server

**功能**:
- ⏳ 模板市场
- ⏳ 自定义模板
- ⏳ 一键部署

**工作量**: 1 周  
**商业价值**: ⭐⭐⭐ (用户体验)

---

### 🔥 P2 - 增值功能

#### Phase 7: 团队协作 (2-3 周) - Pro 功能
**目标**: 支持团队使用

**功能**:
- ⏳ 多用户管理
- ⏳ 权限控制 (Admin/Dev/Viewer)
- ⏳ 成本中心
- ⏳ 项目隔离
- ⏳ 团队审计日志

**工作量**: 2-3 周  
**商业价值**: ⭐⭐⭐⭐ (Pro 高级功能)

---

#### Phase 8: 新 Provider 集成
**目标**: 扩大供应商覆盖

**待集成**:
- ⏳ Lambda Labs
- ⏳ TensorDock
- ⏳ Akash Network
- ⏳ Paperspace

**工作量**: 每个 3-5 天  
**商业价值**: ⭐⭐⭐ (用户选择)

---

## 📅 开发时间表

### Month 1: License 系统 (当前)
- Week 1: Phase 1 - License 系统开发
- Week 2: Phase 2 - License 验证服务器
- Week 3-4: Phase 3 - 自动化引擎 (开始)

### Month 2: 核心 Pro 功能
- Week 5-6: Phase 3 - 自动化引擎 (完成)
- Week 7: Phase 4 - 通知系统
- Week 8: Phase 5 - 实时监控 (开始)

### Month 3: 完善与发布
- Week 9-10: Phase 5 - 实时监控 (完成)
- Week 11: Phase 6 - 部署模板
- Week 12: 测试 + 优化 + v1.0 发布

---

## 🎯 成功指标

### 社区增长目标
- Month 3: 100+ GitHub Stars
- Month 6: 500+ Stars, 10+ Contributors
- Year 1: 2000+ Stars, 活跃社区

### 产品指标
- Pro License 转化率: 5-10%
- 用户留存率: >60%
- 自动化成功率: >95%

### 商业目标
- Month 6: 50+ Pro License 销售
- Year 1: 200+ Pro License 销售 ($10,000 收入)

---

## 🚀 下一步行动

### 立即开始 (本周)
1. ✅ 完成开源转型 (Phase 0)
2. ⏳ 开始 Phase 1: License 系统开发
3. ⏳ 设计 License 验证架构

### 本月目标
- 完成 License 系统
- 完成 License 验证服务器
- 开始自动化引擎开发

---

## 📝 开发原则

### 决策参考顺序
1. **PRD.md** - 产品定位和商业模式
2. **ROADMAP.md** - 当前优先级
3. **Help.md** - 技术实现细节

### 核心原则
- ✅ 所有功能必须符合开源 + Pro License 模式
- ✅ 优先开发 License 系统和核心 Pro 功能
- ✅ 保持代码质量和可维护性
- ✅ 及时更新文档
- ✅ 社区优先，长期价值

---

**参考文档**: PRD.md, README.md, DOCS_INDEX.md, Help.md  
**GitHub**: https://github.com/roc-chiang/computehub  
**License**: MIT (Core) + Pro License ($49 lifetime)
