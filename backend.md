# ComputeHub 后端开发计划 (商业级) / Backend Development Plan

这份文档追踪 ComputeHub 后端 API 和调度系统的开发进度。
This document tracks the progress of building the backend API and scheduling system for ComputeHub.

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
- [ ] **认证系统 (Authentication)**: JWT Token 认证中间件
- [ ] **用户管理 (User Management)**: 注册、登录、个人资料 API

## 2. 供应商适配器 / Provider Adapters
- [x] **基础接口 (Base Interface)**: ProviderAdapter 抽象类
- [x] **本地适配器 (Local Adapter)**: Mock 模拟器用于开发测试
- [x] **RunPod 适配器 (RunPod Adapter)**: 集成 RunPod API ✅
- [ ] **Vast.ai 适配器 (Vast.ai Adapter)**: 集成 Vast.ai API
- [ ] **Lambda Labs 适配器 (Lambda Labs Adapter)**: 集成 Lambda Labs API
- [ ] **供应商管理器 (Provider Manager)**: 多供应商负载均衡与故障转移

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

**今日进度**:
- ✅ 成功集成 RunPod 适配器
- ✅ 前端供应商选择功能
- ✅ 端到端测试通过（创建真实 GPU 实例）
- ⏳ 状态同步调试中（添加了详细日志）

## 4. 任务队列与后台工作 / Task Queue & Background Workers
- [ ] **Redis 集成 (Redis Integration)**: 配置 Redis 连接
- [ ] **RQ 队列 (RQ Queue)**: 设置任务队列
- [ ] **Worker 进程 (Worker Process)**: 独立 Worker 服务
- [ ] **异步任务 (Async Tasks)**: 
  - [ ] 部署创建任务
  - [ ] 状态轮询任务
  - [ ] 资源清理任务

## 5. 监控与日志 / Monitoring & Logging
- [ ] **日志收集 (Log Collection)**: 从供应商拉取容器日志
- [ ] **日志存储 (Log Storage)**: MinIO 或 S3 存储
- [ ] **指标收集 (Metrics Collection)**: GPU/CPU 使用率数据
- [ ] **时序数据库 (Time-Series DB)**: InfluxDB 或 Prometheus 集成
- [ ] **告警系统 (Alerting)**: 资源异常告警

## 6. 计费与用量追踪 / Billing & Usage Tracking
- [ ] **用量记录 (Usage Recording)**: 实时记录 GPU 使用时长
- [ ] **成本计算 (Cost Calculation)**: 基于供应商价格计算费用
- [ ] **账单生成 (Invoice Generation)**: 月度账单自动生成
- [ ] **支付集成 (Payment Integration)**: Stripe 或支付宝集成 (仅 UI Mock)

## 7. API 密钥管理 / API Key Management
- [ ] **密钥生成 (Key Generation)**: 为用户生成 API Token
- [ ] **密钥验证 (Key Validation)**: 中间件验证 API 请求
- [ ] **密钥撤销 (Key Revocation)**: 撤销已泄露的密钥
- [ ] **权限控制 (Permissions)**: 基于角色的访问控制 (RBAC)

## 8. 高级功能 / Advanced Features
- [ ] **GPU 选择优化 (GPU Selection)**: 智能推荐最优 GPU 类型
- [ ] **自动扩缩容 (Auto-scaling)**: 基于负载自动调整实例数量
- [ ] **多区域部署 (Multi-region)**: 支持跨区域部署
- [ ] **数据持久化 (Data Persistence)**: 卷挂载与快照管理
- [ ] **网络配置 (Networking)**: 自定义端口映射与防火墙规则

## 9. 测试与文档 / Testing & Documentation
- [ ] **单元测试 (Unit Tests)**: pytest 覆盖核心逻辑
- [ ] **集成测试 (Integration Tests)**: 测试 API 端到端流程
- [ ] **API 文档 (API Docs)**: Swagger/OpenAPI 自动生成文档
- [ ] **部署文档 (Deployment Docs)**: Docker Compose 与 K8s 部署指南

## 10. 性能优化 / Performance Optimization
- [ ] **数据库索引 (Database Indexes)**: 优化查询性能
- [ ] **缓存策略 (Caching)**: Redis 缓存热点数据
- [ ] **连接池 (Connection Pooling)**: 数据库连接池配置
- [ ] **限流 (Rate Limiting)**: API 请求速率限制
- [ ] **异步处理 (Async Processing)**: 使用 asyncio 提升并发性能
