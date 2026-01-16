# ComputeHub 后端开发计划 / Backend Development Plan

> **开源项目** - MIT License + Pro License ($49 lifetime)

这份文档追踪 ComputeHub 后端 API 和系统的开发进度。

---

## 🔑 API 密钥配置 / API Key Configuration

**配置文件位置**: `services/control-plane/.env`

需要配置的 API 密钥：
```bash
# RunPod API Key (获取地址: https://www.runpod.io/console/user/settings)
RUNPOD_API_KEY=your_runpod_api_key_here

# Vast.ai API Key (获取地址: https://cloud.vast.ai/api/)
VASTAI_API_KEY=your_vastai_api_key_here

# Lambda Labs API Key (获取地址: https://cloud.lambdalabs.com/api-keys)
LAMBDA_API_KEY=your_lambda_api_key_here

# 加密密钥 (用于加密存储 API Key)
ENCRYPTION_KEY=your_encryption_key_here
```

**设置步骤**:
1. 复制 `.env.example` 为 `.env`
2. 将上述占位符替换为你的真实 API Key
3. 重启后端服务

---

## 1. 核心基础设施 / Core Infrastructure
- [x] **数据库模型 (Database Models)**: SQLModel 定义 (User, Deployment, TaskLog, Usage)
- [x] **数据库连接 (Database Connection)**: SQLite 本地开发 + PostgreSQL 生产环境支持
- [x] **API 框架 (API Framework)**: FastAPI 基础结构与健康检查端点
- [x] **CORS 配置 (CORS)**: 允许前端跨域访问
- [x] **认证系统 (Authentication)**: Clerk JWT Token 认证中间件
- [x] **用户管理 (User Management)**: 用户信息获取、权限验证

---

## 2. 供应商适配器 / Provider Adapters
- [x] **基础接口 (Base Interface)**: ProviderAdapter 抽象类
- [x] **本地适配器 (Local Adapter)**: Mock 模拟器用于开发测试
- [x] **RunPod 适配器 (RunPod Adapter)**: 集成 RunPod API ✅
- [x] **Vast.ai 适配器 (Vast.ai Adapter)**: 集成 Vast.ai API (基础实现)
- [ ] **Lambda Labs 适配器 (Lambda Labs Adapter)**: 集成 Lambda Labs API
- [ ] **供应商管理器 (Provider Manager)**: 多供应商负载均衡与故障转移

---

## 3. 部署管理 API / Deployment Management API
- [x] **创建部署 (Create Deployment)**: POST /api/v1/deployments/
- [x] **获取部署列表 (List Deployments)**: GET /api/v1/deployments/
- [x] **获取单个部署 (Get Deployment)**: GET /api/v1/deployments/{id}
- [x] **删除部署 (Delete Deployment)**: DELETE /api/v1/deployments/{id}
- [x] **状态同步 (Status Sync)**: 列表查询时自动同步供应商状态 ✅
- [x] **启动/停止/重启 (Start/Stop/Restart)**: POST /api/v1/deployments/{id}/{action} ✅
- [x] **连接信息 (Connection Info)**: 存储 SSH 命令与密码 ✅
- [ ] **日志流 (Log Streaming)**: 
  - [ ] WebSocket 端点: /api/v1/ws/logs/{id}
  - [ ] 适配器日志获取接口: `get_logs(lines=100)`
- [ ] **监控指标 (Metrics)**: 
  - [ ] 适配器指标接口: `get_metrics()` (GPU Util, Memory, Temp)
  - [ ] 监控数据缓存 (Redis)
- [ ] **文件管理 (File Management)**: 
  - [ ] 文件列表 API
  - [ ] 上传/下载 代理接口

---

## 4. License 系统 / License System (v0.9.0 - 当前重点)

### 后端 License 验证
- [ ] **SystemSetting 模型**: 存储 License Key 和激活状态
- [ ] **LicenseChecker 类**: 验证 License 有效性
- [ ] **@require_pro_license 装饰器**: 保护 Pro 功能端点
- [ ] **License API 端点**:
  - [ ] POST /api/v1/license/activate - 激活 License
  - [ ] GET /api/v1/license/status - 获取 License 状态
  - [ ] DELETE /api/v1/license/deactivate - 禁用 License

### License 验证服务器 (Vercel + Supabase)
- [ ] **验证 API**: 验证 License Key 有效性
- [ ] **撤销 API**: 远程撤销 License
- [ ] **数据库**: Supabase 存储 License 记录
- [ ] **部署**: Vercel 部署验证服务

---

## 5. 任务队列与后台工作 / Task Queue & Background Workers
- [x] **后台调度器 (Background Scheduler)**: APScheduler 集成
- [x] **状态同步任务**: 定期同步部署状态
- [ ] **Redis 集成 (Redis Integration)**: 配置 Redis 连接
- [ ] **RQ 队列 (RQ Queue)**: 设置任务队列
- [ ] **Worker 进程 (Worker Process)**: 独立 Worker 服务
- [ ] **异步任务 (Async Tasks)**: 
  - [ ] 部署创建任务
  - [ ] 资源清理任务

---

## 6. 监控与日志 / Monitoring & Logging
- [ ] **日志收集 (Log Collection)**: 从供应商拉取容器日志
- [ ] **日志存储 (Log Storage)**: MinIO 或 S3 存储
- [ ] **指标收集 (Metrics Collection)**: GPU/CPU 使用率数据
- [ ] **时序数据库 (Time-Series DB)**: InfluxDB 或 Prometheus 集成
- [ ] **告警系统 (Alerting)**: 资源异常告警 (Pro 功能)

---

## 7. 自动化引擎 / Automation Engine (Pro 功能)
- [ ] **健康检查 (Health Check)**: 定期 ping 实例
- [ ] **自动重启 (Auto Restart)**: 宕机自动重启
- [ ] **成本限制 (Cost Limit)**: 超额自动关机
- [ ] **规则引擎 (Rule Engine)**: IF-THEN 规则配置
- [ ] **动作执行器 (Action Executor)**: 执行自动化动作

---

## 8. 通知系统 / Notification System (Pro 功能)
- [ ] **Email 通知**: SMTP 集成
- [ ] **Telegram Bot**: Telegram 通知
- [ ] **Webhook**: 自定义 Webhook 通知
- [ ] **通知模板**: 可配置的通知模板
- [ ] **通知历史**: 记录通知发送历史

---

## 9. API 密钥管理 / API Key Management
- [x] **密钥加密存储**: 使用 ENCRYPTION_KEY 加密 Provider API Key
- [x] **密钥验证 (Key Validation)**: Clerk JWT 验证
- [ ] **密钥撤销 (Key Revocation)**: 撤销已泄露的密钥
- [ ] **权限控制 (Permissions)**: 基于角色的访问控制 (RBAC)

---

## 10. 高级功能 / Advanced Features
- [ ] **GPU 选择优化 (GPU Selection)**: 智能推荐最优 GPU 类型
- [ ] **自动扩缩容 (Auto-scaling)**: 基于负载自动调整实例数量 (Pro)
- [ ] **多区域部署 (Multi-region)**: 支持跨区域部署
- [ ] **数据持久化 (Data Persistence)**: 卷挂载与快照管理
- [ ] **网络配置 (Networking)**: 自定义端口映射与防火墙规则

---

## 11. 测试与文档 / Testing & Documentation
- [ ] **单元测试 (Unit Tests)**: pytest 覆盖核心逻辑
- [ ] **集成测试 (Integration Tests)**: 测试 API 端到端流程
- [x] **API 文档 (API Docs)**: Swagger/OpenAPI 自动生成文档 ✅
- [ ] **部署文档 (Deployment Docs)**: Docker Compose 与 K8s 部署指南

---

## 12. 性能优化 / Performance Optimization
- [ ] **数据库索引 (Database Indexes)**: 优化查询性能
- [ ] **缓存策略 (Caching)**: Redis 缓存热点数据
- [ ] **连接池 (Connection Pooling)**: 数据库连接池配置
- [ ] **限流 (Rate Limiting)**: API 请求速率限制
- [ ] **异步处理 (Async Processing)**: 使用 asyncio 提升并发性能

---

## 📅 开发优先级

### P0 - 当前重点 (v0.9.0)
1. License 系统开发
2. License 验证服务器部署
3. Pro 功能标记

### P1 - 核心 Pro 功能
1. 自动化引擎
2. 通知系统
3. 高级监控

### P2 - 增值功能
1. 团队协作
2. 更多 Provider 集成
3. 高级部署功能

---

**GitHub**: https://github.com/roc-chiang/computehub  
**License**: MIT (Core) + Pro License ($49 lifetime)  
**API 文档**: http://localhost:8000/docs
