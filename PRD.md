# ComputeHub — Product Requirements Document (PRD) V2.0 (Open Source Edition)

## 📌 1. 产品定位

### 核心定位
**ComputeHub = 开源的 GPU 聚合平台 + 跨云自动化工具**

- GPU 聚合与价格对比
- 跨供应商统一控制台
- 自动化调度层（Pro 功能）

### 战略转型（V2.0）
**从 SaaS 订阅制 → 开源 + Pro License**

**为什么转型**：
- ✅ 技术品牌价值 > 小额订阅收入
- ✅ GitHub Stars → 技术背书 → 助力硬件项目
- ✅ 无运维压力，专注核心业务
- ✅ 社区驱动，长期可持续

### 我们不是什么
- ❌ 不是 GPU 服务商
- ❌ 不是代售/代租平台
- ❌ 不承担 GPU 成本
- ❌ 不是 SaaS 订阅服务（V2.0 变更）

### 我们是什么
- ✅ 开源的跨云管理工具
- ✅ Self-Hosted 部署方案
- ✅ 可选的 Pro 功能（Lifetime License）
- ✅ AI 部署领域的开源标准

---

## 📌 2. 商业模式（V2.0 更新）

### 开源 + Freemium 模式

#### Free 版（开源，GitHub）
**功能**：
- ✅ Provider 绑定（Vast、RunPod）
- ✅ 部署管理（创建、启动、停止、删除）
- ✅ 价格对比（实时聚合）
- ✅ 统一控制台
- ✅ 基础模板（Jupyter、PyTorch）
- ✅ 组织/项目管理
- ✅ SSH 连接信息
- ✅ 成本统计

**部署**：Self-Hosted（Docker Compose）  
**成本**：$0  
**支持**：Community（GitHub Issues）

---

#### Pro 版（Lifetime License $49）
**功能**：
- 🔒 **自动化调度引擎**
  - 宕机检测与自动重启
  - 成本上限自动关机
  - 自动化规则引擎（IF-THEN）
  
- 🔒 **通知系统**
  - Email 通知
  - Telegram Bot
  - Webhook 集成
  
- 🔒 **高级监控**
  - GPU 利用率实时图表
  - 显存占用趋势
  - 成本趋势分析
  
- 🔒 **批量操作**
  - 批量启动/停止/删除
  - 批量应用模板
  
- 🔒 **高级模板**
  - ComfyUI（预配置）
  - Stable Diffusion WebUI
  - Llama 推理优化版

**部署**：Self-Hosted  
**价格**：$49（一次性付费）  
**支持**：Email Support  
**声明**："Sold as is, no SLA"

---

#### 咨询服务（可选）
**服务**：
- 私有部署支持
- 定制开发
- 企业培训

**定价**：$200-500/小时（按需）

---

## 📌 3. 产品价值（核心三层）

### ① 聚合层（Aggregation Layer）

**目的**: 让用户找到最便宜/最合适的 GPU

**当前状态**: ✅ 70% 已完成

**功能**:
- ✅ 多供应商价格对比
- ✅ 实例类型比对（VRAM、PCIe、Local Disk）
- ⚠️ 历史价格趋势（部分完成）
- ✅ 最佳性价比推荐
- ⚠️ 已绑定 Provider 的实时可用性显示（待完善）

**价值**:
- SEO 自然流量入口
- 用户增长核心
- 开源社区吸引力

**优先级**: ✅ P0（基础已完成，持续优化）

---

### ② 体验层（Experience Layer）

**目的**: 统一控制台，消灭不同供应商的 UI 异构问题

**当前状态**: ⚠️ 50% 已完成

**功能**:
- ✅ 统一实例列表（跨供应商）
- ✅ 批量操作（启动/停止/删除）- Pro 功能
- ✅ 部署模板（自动生成启动脚本）
- ✅ 成本面板（跨云汇总）
- ✅ Provider API Key 管理
- ✅ 组织/项目管理
- ⏳ 通知系统（待开发，Pro 功能）
- ⏳ 实时监控（待开发，Pro 功能）

**价值**:
- 用户完全不想在 Vast / RunPod / Lambda 之间切 UI
- ComputeHub 是"它们的上位 UI"
- 强用户粘性

**优先级**: 🔥 P0（核心用户体验）

---

### ③ 调度层（Automation Layer）- Pro 功能

**目的**: ComputeHub 的护城河、竞争壁垒

**当前状态**: ❌ 0%，但最有价值

**功能**:
- ⏳ 实例宕机自动重启（Pro）
- ⏳ 成本上限自动关机（Pro）
- ⏳ 自动化规则引擎（Pro）
- ⏳ 跨供应商 Failover（Pro，未来）
- ⏳ 批处理任务队列（Pro，未来）

**价值**:
- **供应商永远不会做的功能，只有你能做**
- 在用户的 GPU 运行链路中形成长期锁定（sticky effect）
- 真正的差异化竞争优势
- **Pro License 的核心卖点**

**优先级**: 🔥🔥🔥 P0（核心护城河 + Pro 功能）

---

## 📌 4. 目标用户

### 🎯 核心用户人群

1. **AI 工程师 / LLM 研发者**
   - 需要训练和微调模型
   - 需要成本优化
   - 需要稳定性（Pro 自动化）

2. **ComfyUI / Stable Diffusion 用户**
   - 图像生成工作流
   - 需要高性价比 GPU
   - 频繁切换供应商

3. **训练小模型的开发者**
   - 预算有限
   - 需要灵活调度
   - 需要自动化（Pro 功能吸引力）

4. **AI 初创公司的 DevOps**
   - 多项目管理
   - 成本控制
   - 团队协作

5. **开源爱好者 / Self-Hoster**
   - 喜欢 Self-Hosted 方案
   - 重视数据隐私
   - 愿意为优质工具付费（Lifetime）

### 用户需求总结

| 需求 | ComputeHub 解决方案 |
|------|---------------------|
| 找便宜 GPU | 聚合层价格对比（Free） |
| 跨平台统一管理 | 体验层统一控制台（Free） |
| 更稳定的训练 | 调度层自动续命（Pro） |
| 数据隐私 | Self-Hosted 部署（Free） |
| 无订阅压力 | Lifetime License（Pro） |

**ComputeHub 正好覆盖所有痛点** ✅

---

## 📌 5. 功能清单（V2.0 更新）

### 🟦 5.1 Account / Billing

#### 用户系统
- ✅ 注册、登录（Clerk）
- ✅ 个人设置
- ⏳ API Key（用于调用 ComputeHub 的后端）

#### License 系统（V2.0 新增）
- ⏳ License Key 激活
- ⏳ License 状态查询
- ⏳ Pro 功能解锁

**状态**: ⏳ 待开发（Phase 2）

---

### 🟧 5.2 Provider Binding

**状态**: ✅ 已完成

**功能**:
- ✅ Provider API 密钥加密（AES-256）
- ✅ Provider 可用性测试
- ✅ 多 Provider 绑定
- ✅ 自动同步实例列表

**支持供应商**:
- ✅ Vast.ai
- ✅ RunPod
- ⏳ Lambda（待开发）
- ⏳ TensorDock（待开发）

---

### 🟩 5.3 Price Comparison Layer

**状态**: ✅ 已完成

**功能**:
- ✅ 实时价格聚合
- ⚠️ 历史价格趋势图（部分完成）
- ✅ GPU 规格对比
- ✅ 最佳性价比推荐
- ✅ Search Filters：GPU、VRAM、Disk、地域

---

### 🟦 5.4 Deployment Templates

**状态**: ✅ 基础版已完成

**Free 模板**:
- ✅ Custom Docker
- ✅ Jupyter Notebook
- ✅ PyTorch

**Pro 模板**（待开发）:
- ⏳ Llama Inference
- ⏳ ComfyUI
- ⏳ SD WebUI
- ⏳ VSCode Server

---

### 🟨 5.5 Instance Management

**状态**: ⚠️ 70% 已完成

#### 基础操作（Free）
- ✅ 启动 / 停止 / 删除
- ✅ 实例信息：GPU/CPU/RAM/Disk
- ✅ SSH 信息
- ✅ 端口映射
- ✅ 跨云统一 UI

#### Pro 功能
- ✅ 批量操作（已完成，需添加 License 保护）
- ⏳ 成本上限策略（待开发）
- ⏳ 自动删除策略（待开发）

---

### 🟥 5.6 Automation Engine（Pro 功能，核心护城河）

**状态**: ❌ 0%（最高优先级）

**时间估算**: 2-3 周

#### Pro 自动化功能

**基础自动化**:
- ⏳ 宕机检测（心跳）
- ⏳ 自动重启

**高级自动化**:
- ⏳ 成本上限自动关机
- ⏳ 自动化规则引擎（IF-THEN）
- ⏳ 价格上涨自动迁移（未来）
- ⏳ Spot GPU 自动补位（未来）

#### 规则引擎（Rule Builder）

**概念**:
```
IF cost_per_hour > X AND gpu_type == "A100"
THEN migrate_to == "RunPod"
```

**功能**:
- 可视化规则画布
- 自定义触发条件
- 多种动作（重启、迁移、通知、关机）

---

### 🟪 5.7 Monitoring（Pro 功能）

**状态**: ⏳ 待开发（P1）

**功能**:
- ⏳ GPU 温度/负载
- ⏳ 显存占用
- ⏳ CPU/内存
- ⏳ 网络流量
- ⏳ 实时日志
- ⏳ WebSSH
- ⏳ 自动报警

---

### 🟦 5.8 Notifications（Pro 功能）

**状态**: ⏳ 待开发（P0）

**通知渠道**:
- ⏳ Email
- ⏳ Telegram Bot
- ⏳ Webhook

**触发事件**:
- 宕机
- 成本超额
- GPU 断线
- 部署成功/失败
- 价格变化

---

### 🟧 5.9 Team Collaboration

**状态**: ⚠️ 50% 已完成

**已完成**:
- ✅ 组织管理
- ✅ 项目管理
- ✅ 部署关联到组织/项目

**待开发**（可选，非核心）:
- ⏳ 权限（Admin/Dev/Viewer）
- ⏳ 成本中心
- ⏳ 团队审计日志

---

## 📌 6. 商业逻辑（V2.0 更新）

### ComputeHub 解决的问题

> "GPU 供应商几十家，但没有一个开源工具能统一管理，也没有自动调度。"

### 你的定位

> "ComputeHub = AI 部署领域的开源标准工具。"

### 护城河

1. **开源社区**
   - GitHub Stars → 技术品牌
   - 社区贡献 → 免费开发资源
   - 网络效应

2. **自动化调度（Pro）**
   - 供应商无法做
   - 技术壁垒
   - 核心差异化

3. **Self-Hosted**
   - 数据隐私
   - 用户控制
   - 无供应商锁定

### 收入模型

1. **Pro License 销售**
   - Lifetime $49（一次性）
   - 高毛利（>95%）
   - 无运维成本

2. **咨询服务（可选）**
   - 企业部署
   - 定制开发
   - 高客单价

3. **技术品牌价值**
   - GitHub Stars
   - YouTube 内容
   - 助力硬件项目（显示器 Kickstarter）

---

## 📌 7. 当前实现状态总览

| 模块 | 完成度 | 优先级 | 预计时间 |
|------|--------|--------|----------|
| 聚合层 | 70% | ✅ P0 | 持续优化 |
| Provider 绑定 | 80% | ✅ P0 | 1 周（新供应商）|
| 体验层 | 70% | 🔥 P0 | 1-2 周 |
| License 系统 | 0% | 🔥 P0 | 2-3 天 |
| 通知系统（Pro） | 0% | 🔥 P0 | 1 周 |
| 调度层（Pro） | 0% | 🔥🔥🔥 P0 | 2-3 周 |
| 监控系统（Pro） | 0% | 🟡 P1 | 2 周 |
| 预置模板（Pro） | 0% | 🟡 P1 | 1 周 |
| 开源发布 | 0% | 🔥 P0 | 1 天 |

---

## 📌 8. 开发路线图（V2.0 更新）

### Week 1-2: 开源转型基础
- Week 1: License 系统开发
- Week 2: 文档更新 + 开源发布

### Month 1: 核心 Pro 功能
- Week 3-4: 通知系统
- Week 5-6: 自动化调度（开始）

### Month 2: 完善 Pro 功能
- Week 7-8: 自动化调度（完成）
- Week 9-10: 高级监控

### Month 3: 社区建设
- Week 11: 预置模板
- Week 12: 社区推广 + 优化

---

## 📌 9. 成功指标（V2.0 更新）

### 社区增长
- GitHub Stars: 500+ (Month 3)
- Docker Pulls: 1000+ (Month 3)
- Contributors: 10+ (Month 6)

### Pro License 销售
- Month 3: 20-50 个 License
- Month 6: 100-200 个 License
- Year 1: 500+ 个 License

### 收入目标（调整）
- Month 3: $1,000-2,500（20-50 个 License）
- Month 6: $5,000-10,000（100-200 个 License）
- Year 1: $25,000+（500+ 个 License）

### 品牌价值
- 技术博客文章: 5+ 篇
- YouTube 视频: 3-5 个
- Hacker News 讨论: 2-3 次
- **技术背书 → 助力硬件项目**

### 产品指标
- 用户留存率: >60%
- Pro 功能使用率: >80%
- 自动调度成功率: >95%

---

## 📌 10. 与 V1.0 的主要变化

| 项目 | V1.0（SaaS） | V2.0（开源） |
|------|-------------|-------------|
| **商业模式** | 订阅制（$49/月） | Lifetime License（$49 一次性） |
| **部署方式** | 云端 SaaS | Self-Hosted |
| **代码开放** | 闭源 | 开源（GitHub） |
| **运维责任** | 您负责 | 用户自己负责 |
| **收入模式** | MRR（月度经常性收入） | 一次性销售 |
| **支持模式** | 企业级 SLA | Community + Email（Sold as is） |
| **核心价值** | 订阅收入 | 技术品牌 + License 销售 |
| **时间压力** | 高（持续运维） | 低（可专注硬件项目） |

---

**PRD V2.0 完成！** 🎯

**核心理念**：ComputeHub 不是摇钱树，而是技术勋章。
