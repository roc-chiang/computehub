# Scheduler 模块架构说明

**地位**: Phase 9 自动化引擎的核心调度模块,负责健康检查、自动重启、成本监控等自动化任务。

**依赖**: app.core.models, app.core.automation_models, app.core.db, app.core.provider_manager

**对外提供**: 自动化调度服务,供后台任务(app.tasks.automation_tasks)调用

---

## 文件清单

### `__init__.py`
- **地位**: 模块导出文件
- **功能**: 导出 HealthChecker, AutoRestartManager, CostMonitor 三个核心类

### `health_checker.py`
- **地位**: 健康检查核心模块
- **功能**: 
  - HTTP/TCP 健康检查
  - 健康状态记录
  - Uptime 计算
  - 健康历史查询

### `auto_restart.py`
- **地位**: 自动重启管理模块
- **功能**:
  - 检测持续不健康的部署
  - 自动重启逻辑
  - 重启操作日志
  - 规则触发管理

### `cost_monitor.py`
- **地位**: 成本监控模块
- **功能**:
  - 小时级成本追踪
  - 成本汇总统计
  - 成本上限检查
  - 超限自动停止

---

**更新声明**: 一旦此文件夹有所变化,请更新此 README.md
