# ComputeHub 启动指南

> **ComputeHub 是一个开源的 GPU 管理平台**  
> 完全免费，自托管，可选 Pro License ($49 终身) 解锁自动化功能

---

## 🎯 项目简介

ComputeHub 帮助您：
- 🔍 在多个云提供商之间管理 GPU 实例
- 💰 比较价格，找到最便宜的 GPU
- 🎛️ 从一个控制台管理所有部署
- 🤖 自动化调度和监控 (Pro 功能)

**Free vs Pro**:
- **Free (开源)**: 核心管理功能，价格对比，部署管理
- **Pro ($49 终身)**: 自动化、通知、高级监控、批量操作

---

## 📋 项目配置信息

### 数据库
- **类型**: SQLite (开发环境)
- **文件**: `services/control-plane/test.db`
- **配置**: `.env` 中 `DATABASE_URL=sqlite:///./test.db`
- **生产环境**: PostgreSQL (配置在 `.env` 中)

### 端口
- **后端 API**: `http://localhost:8000`
- **API 文档**: `http://localhost:8000/docs`
- **前端 Web**: `http://localhost:3000`

### 关键配置文件
- **后端环境**: `services/control-plane/.env`
- **加密密钥**: `ENCRYPTION_KEY` (用于敏感数据加密)
- **Clerk 认证**: 前端 `.env.local` 中配置

---

## 1. 准备工作

请确保你的电脑安装了以下软件：
*   **Python 3.10 或 3.11**: [下载 Python](https://www.python.org/downloads/)
*   **Node.js (v18 或更高)**: [下载 Node.js](https://nodejs.org/)

---

## 2. 启动后端 (Backend)

后端负责处理数据和逻辑。

1.  **打开终端 (Terminal / PowerShell)**，进入后端目录：
    ```powershell
    cd d:\code\suanli\compute-hub\services\control-plane
    ```

2.  **安装依赖库**：
    ```powershell
    pip install -r requirements.txt
    ```

3.  **启动服务**：
    ```powershell
    uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
    ```

    ✅ **成功标志**：看到 `Application startup complete` 和 `Uvicorn running on http://0.0.0.0:8000`。
    
    📝 **注意**: Telegram Bot 会在启动时自动启动（如果配置了 Bot Token）。

    (不要关闭这个窗口)

---

## 3. 启动前端 (Frontend)

前端是你看到的网页界面。

1.  **打开一个新的终端窗口**。

2.  **进入前端目录**：
    ```powershell
    cd d:\code\suanli\compute-hub\web
    ```

3.  **安装依赖** (第一次运行需要)：
    ```powershell
    npm install
    ```

4.  **启动开发服务器**：
    ```powershell
    npm run dev
    ```

    ✅ **成功标志**：看到 `Ready in Xms` 和 `Local: http://localhost:3000`。

---

## 4. 访问应用

打开浏览器，访问：**http://localhost:3000**

**API 文档**: http://localhost:8000/docs (FastAPI 自动生成的 API 文档)

---

## 5. 功能导航

### 主要页面

1. **Dashboard** (`/dashboard`) - 首页
   - 统计概览
   - 快速操作
   - 最近部署
   - 成本趋势

2. **Deployments** (`/deploy`) - 部署管理
   - 查看所有部署
   - 批量操作 (Pro 功能)
   - 启动/停止/删除

3. **New Deployment** (`/deploy/new`) - 创建部署
   - 选择 GPU 和 Provider
   - 使用模板
   - 保存为模板

4. **Templates** (`/settings/templates`) - 模板管理
   - 查看所有模板
   - 创建/删除模板
   - 使用模板创建部署

5. **Costs** (`/costs`) - 成本追踪
   - 成本汇总
   - 趋势图表
   - 成本分组
   - CSV 导出

6. **GPU Prices** (`/gpu-prices`) - GPU 价格对比
   - 多 Provider 价格对比
   - GPU 规格对比
   - 最佳性价比

7. **Settings** (`/settings`) - 设置
   - Provider 绑定
   - API 密钥管理
   - License 激活 (Pro 功能，开发中)

---

## 6. 快速测试流程

### 测试 1: 创建部署
1. 访问 `/deploy/new`
2. 选择 GPU 类型
3. 选择 Provider
4. 填写部署名称
5. 点击 "Deploy"

### 测试 2: 使用模板
1. 在 `/deploy/new` 创建部署
2. 点击 "Save as Template"
3. 访问 `/settings/templates`
4. 点击 "Use" 使用模板

### 测试 3: 批量操作 (Pro 功能)
1. 访问 `/deploy`
2. 选择多个部署
3. 点击 "Start" / "Stop" / "Delete"
4. 确认操作

### 测试 4: 查看成本
1. 访问 `/costs`
2. 查看成本汇总
3. 查看趋势图表
4. 导出 CSV

---

## 7. 常见问题

### Q1: 后端启动失败？
**A**: 检查 Python 版本和依赖是否安装完整。

### Q2: 前端无法连接后端？
**A**: 确保后端运行在 `http://localhost:8000`。

### Q3: 登录后看不到数据？
**A**: 检查 Clerk 认证是否正常，查看浏览器控制台错误。

### Q4: 部署创建失败？
**A**: 确保已在 Settings 中绑定 Provider API 密钥。

### Q5: 如何激活 Pro License？
**A**: License 系统正在开发中 (v0.9.0)，完成后可在 `/settings/license` 激活。

---

## 8. 开发工具

### API 文档
访问：`http://localhost:8000/docs`

**特点**:
- 自动生成的 API 文档
- 可直接测试 API
- 查看请求/响应格式

### 数据库
- 类型：SQLite (开发) / PostgreSQL (生产)
- 位置：根据 `.env` 配置
- 工具：DB Browser for SQLite

### 环境变量
后端 `.env` 文件位置：`services/control-plane/.env`

前端 `.env.local` 文件位置：`web/.env.local`

---

## 9. 已完成功能清单

### ✅ 核心功能 (Free)
- Provider 绑定管理
- GPU 价格对比
- 成本追踪和分析
- 部署模板
- Overview Dashboard
- 用户认证 (Clerk)
- 响应式设计
- 组织/项目管理

### 🔒 Pro 功能 (开发中)
- 批量操作
- 自动化引擎
- 通知系统 (Email, Telegram, Webhook)
- 高级监控
- WebSSH 终端

---

## 10. 下一步开发

查看 `ROADMAP.md` 了解开发计划：

**当前重点** (v0.9.0):
- License 系统开发
- Pro 功能激活机制
- 自动化引擎

---

## 11. 开源贡献

ComputeHub 是开源项目，欢迎贡献！

### 如何贡献
1. Fork 仓库
2. 创建功能分支
3. 提交 Pull Request

### 贡献指南
- 遵循现有代码风格
- 为新功能编写测试
- 更新相关文档

**GitHub**: https://github.com/roc-chiang/computehub  
**License**: MIT (Core) + Pro License ($49 lifetime)

---

## 🔑 认证和权限系统

**认证方式**: Clerk (第三方认证服务)

**权限级别**:
- **普通用户**: 可访问 `/deploy`, `/tickets`
- **管理员**: 可访问所有页面，包括 `/admin`

**设置管理员**:
1. 登录 Clerk Dashboard
2. 找到用户，编辑 Public Metadata
3. 添加: `{"role": "admin"}`
4. 详见: `ADMIN_SETUP.md`

**开发工具**:
- 右下角 "Dev Login/Info" 按钮（仅开发环境）
- 快速登录和查看用户信息

---

## 📁 重要文件位置

- **后端**: `services/control-plane/`
- **前端**: `web/`
- **数据库**: `services/control-plane/test.db` (SQLite)
- **API 文档**: http://localhost:8000/docs (后端启动后访问)
- **项目文档**: `PRD.md`, `ROADMAP.md`, `README.md`

---

## 📚 技术栈

**后端:**
- FastAPI + SQLModel
- SQLite (开发) / PostgreSQL (生产)
- Pydantic for validation
- Clerk JWT 认证

**前端:**
- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS + shadcn/ui
- Recharts (图表库)
- Clerk 认证

---

**需要帮助？** 查看 [GitHub Issues](https://github.com/roc-chiang/computehub/issues) 或加入社区讨论。🚀
