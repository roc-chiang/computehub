# ComputeHub 启动指南

这份文档会教你如何在本地电脑上启动 ComputeHub 的前后端。

## 📋 项目配置信息

### 数据库
- **类型**: SQLite (开发环境)
- **文件**: `services/control-plane/test.db`
- **配置**: `.env` 中 `DATABASE_URL=sqlite:///./test.db`
- **生产环境**: PostgreSQL (配置在 `.env` 中)

### 端口
- **后端 API**: `http://localhost:8000`
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
    pip install fastapi uvicorn pydantic-settings sqlmodel psycopg2-binary redis rq requests cryptography python-telegram-bot aiosmtplib python-dateutil
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
   - 批量操作
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

### 测试 3: 批量操作
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

---

## 8. 开发工具

### API 文档
访问：`http://localhost:8000/docs`

### 数据库
- 类型：PostgreSQL
- 位置：根据 `.env` 配置

### 环境变量
后端 `.env` 文件位置：`services/control-plane/.env`

前端 `.env.local` 文件位置：`web/.env.local`

---

## 9. 已完成功能清单

✅ Provider 绑定管理  
✅ GPU 价格对比  
✅ 成本追踪和分析  
✅ 部署模板  
✅ 批量操作  
✅ Overview Dashboard  
✅ 用户认证 (Clerk)  
✅ 响应式设计  

---

## 10. 下一步开发

查看 `NEXT_STEPS.md` 了解计划中的功能。

---

**需要帮助？** 查看项目文档或联系开发团队。🚀
    npm install
    ```

4.  **启动网页**：
    ```powershell
    npm run dev
    ```

    ✅ **成功标志**：看到 `Ready in ... ms` 和 `Local: http://localhost:3000`。

---

## 4. 开始使用

1.  打开浏览器，访问：[http://localhost:3000](http://localhost:3000)
2.  点击 **"Start Deploying"** 或 **"Console"**。
3.  点击 **"New Deployment"**。
4.  随便填一个名字，Provider 选 **Local (Mock)**，点击 **Create Deployment**。
5.  你应该能看到部署成功，状态会从 `creating` 变为 `running`。

---

## 常见问题

*   **后端报错 `ModuleNotFoundError`**：请检查 `pip install` 是否成功。
*   **前端报错 `fetch failed`**：请检查后端窗口是否还在运行，且端口是 8000。
*   **Docker 方式**：如果你修好了 Docker，可以直接运行 `./scripts/dev_up.ps1` 一键启动所有服务。

---

## 📊 项目当前状态 (2025-12-08)

### ✅ 已完成功能

1. **Provider Management (Provider 管理)** ⭐ 最新完成
   - 后端 API: 统计、性能指标、CRUD 操作
   - 前端页面: `/admin/providers` (4个标签页)
     - Overview: 统计卡片 + 饼图
     - Statistics: GPU使用趋势 + 成本趋势
     - Comparison: Provider 对比表格
     - Management: 添加/启用/禁用/删除 Provider
   - 数据库: 已添加 `provider_id` 外键到 Deployment 表
   - 审计日志: 所有 Provider 操作都会记录

2. **Support Tickets (工单系统)**
   - 完整的工单管理系统
   - 管理员和用户界面

3. **System Settings (系统设置)**
   - 后端 API 完成
   - 数据库模型完成

### 🔄 待开发功能

1. **Revenue Analytics (收入分析)** - 已规划但未开始
2. **System Settings Frontend** - 后端完成，前端待集成
3. **Provider Edit功能** - 当前只能删除后重新添加

### 🔑 认证和权限系统

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

### 📁 重要文件位置

- **后端**: `services/control-plane/`
- **前端**: `web/`
- **数据库**: `services/control-plane/test.db` (SQLite)
- **API 文档**: http://localhost:8000/docs (后端启动后访问)

### 🔑 数据库信息

- 类型: SQLite
- 文件: `test.db`
- 位置: `services/control-plane/test.db`
- 环境变量: `DATABASE_URL=sqlite:///./test.db`

### 📚 技术栈

**后端:**
- FastAPI + SQLModel
- SQLite 数据库
- Pydantic for validation

**前端:**
- Next.js (App Router)
- TypeScript
- Tailwind CSS + shadcn/ui
- Recharts (图表库)
