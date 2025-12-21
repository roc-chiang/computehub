# ComputeHub 版本管理指南

## 📚 快速参考

### 查看版本信息
```powershell
# 查看所有版本标签
git tag -l

# 查看当前版本
cat VERSION

# 查看版本详情
git show v0.8.1

# 查看提交历史
git log --oneline --graph --all
```

### 版本回退
```powershell
# 使用回退脚本（推荐）
.\scripts\rollback.ps1 -Version v0.8.1

# 手动回退（临时查看）
git checkout v0.8.1

# 返回最新版本
git checkout main
```

### 日常开发
```powershell
# 切换到开发分支
git checkout develop

# 查看当前状态
git status

# 提交更改
git add .
git commit -m "feat: 添加新功能"

# 合并到主分支（测试通过后）
git checkout main
git merge develop
git tag -a v0.8.2 -m "版本 0.8.2 发布"
```

---

## 🎯 版本号规范

### 格式：`MAJOR.MINOR.PATCH`

- **MAJOR（主版本）**: 重大架构变更或不兼容的 API 修改
  - 例：1.0.0 → 2.0.0
  
- **MINOR（次版本）**: 新功能添加，向后兼容
  - 例：0.8.0 → 0.9.0
  
- **PATCH（补丁版本）**: Bug 修复，向后兼容
  - 例：0.8.1 → 0.8.2

### 当前版本规划

- **v0.8.1** - Phase 8.1 完成（当前版本）
- **v0.8.2** - Phase 8 Week 2 完成
- **v0.9.0** - Phase 9 完成
- **v1.0.0** - 正式发布版本

---

## 🌿 分支策略

### 分支说明

```
main (稳定版本，用于生产)
  ↑
develop (开发版本，日常开发)
  ↑
feature/* (功能分支，可选)
```

1. **main 分支**
   - 永远保持稳定可用
   - 只接受来自 develop 的合并
   - 每次合并都打上版本标签

2. **develop 分支**
   - 日常开发分支
   - 功能开发完成后合并到这里
   - 测试通过后合并到 main

3. **feature/* 分支**（可选）
   - 开发新功能时创建
   - 例：`feature/phase-8-week-2`
   - 完成后合并回 develop

---

## 📝 提交信息规范

### 格式
```
<type>(<scope>): <subject>

<body>

<footer>
```

### Type 类型

- `feat`: 新功能
- `fix`: Bug 修复
- `docs`: 文档更新
- `style`: 代码格式调整
- `refactor`: 重构
- `perf`: 性能优化
- `test`: 测试相关
- `chore`: 构建/工具相关

### 示例

```
feat(deploy): 添加快速部署模式

实现了简化的 3 步部署流程，包括：
- 工作负载类型选择
- 自动配置填充
- 智能 Provider 推荐

Closes #123
```

---

## 🔄 常见操作

### 1. 开发新功能

```powershell
# 切换到开发分支
git checkout develop

# 创建功能分支（可选）
git checkout -b feature/new-feature

# 开发并提交
git add .
git commit -m "feat: 实现新功能"

# 合并回 develop
git checkout develop
git merge feature/new-feature

# 测试通过后发布版本
git checkout main
git merge develop
git tag -a v0.8.2 -m "版本 0.8.2 发布"
```

### 2. 修复 Bug

```powershell
# 在 develop 分支修复
git checkout develop
git add .
git commit -m "fix: 修复 Provider 选择问题"

# 如果是紧急修复，直接合并到 main
git checkout main
git merge develop
git tag -a v0.8.2 -m "修复关键 Bug"
```

### 3. 查看版本历史

```powershell
# 查看所有版本
git tag -l

# 查看版本详情
git show v0.8.1

# 查看提交历史（图形化）
git log --oneline --graph --all --decorate

# 查看某个文件的历史
git log --follow -- path/to/file
```

### 4. 版本回退

#### 方法 1: 使用回退脚本（推荐）

```powershell
# 回退到 v0.8.1
.\scripts\rollback.ps1 -Version v0.8.1

# 脚本会自动：
# 1. 检查版本是否存在
# 2. 显示版本信息
# 3. 创建备份分支
# 4. 回退到指定版本
```

#### 方法 2: 临时查看旧版本

```powershell
# 查看 v0.8.1 版本（不修改代码）
git checkout v0.8.1

# 返回最新版本
git checkout main
```

#### 方法 3: 基于旧版本创建新分支

```powershell
# 基于 v0.8.1 创建修复分支
git checkout -b hotfix-from-v0.8.1 v0.8.1

# 修复后可以合并回 main
git checkout main
git merge hotfix-from-v0.8.1
```

#### 方法 4: 硬回退（谨慎使用）

```powershell
# 回退到 v0.8.1，丢弃之后的所有提交
git reset --hard v0.8.1

# 如果需要恢复，可以使用 reflog
git reflog
git reset --hard HEAD@{n}
```

---

## 🚨 紧急情况处理

### 误删除了重要代码

```powershell
# 查看操作历史
git reflog

# 找到误操作前的提交
git reset --hard HEAD@{n}
```

### 需要恢复备份分支

```powershell
# 查看所有分支
git branch -a

# 切换到备份分支
git checkout backup-20251216-110500

# 如果需要，可以将其设为主分支
git checkout -b main-recovered
```

### 合并冲突

```powershell
# 查看冲突文件
git status

# 手动解决冲突后
git add .
git commit -m "fix: 解决合并冲突"
```

---

## 📊 版本发布流程

### 完整流程

```powershell
# 1. 确保在 develop 分支
git checkout develop

# 2. 确保所有更改已提交
git status

# 3. 更新版本号
echo "0.8.2" > VERSION

# 4. 更新 CHANGELOG.md
# 手动编辑 CHANGELOG.md，添加新版本的变更

# 5. 提交版本更新
git add VERSION CHANGELOG.md
git commit -m "chore: bump version to 0.8.2"

# 6. 合并到 main
git checkout main
git merge develop

# 7. 创建版本标签
git tag -a v0.8.2 -m "Phase 8 Week 2: 自动 Failover 完成

主要功能:
- 自动 Provider 切换
- 资源错误检测
- 智能推荐引擎

状态: 生产就绪"

# 8. 验证
git tag -l
git log --oneline -5
```

---

## 🔧 高级技巧

### 查看两个版本之间的差异

```powershell
# 查看 v0.8.1 和 v0.8.2 之间的差异
git diff v0.8.1..v0.8.2

# 只查看文件列表
git diff --name-only v0.8.1..v0.8.2

# 查看统计信息
git diff --stat v0.8.1..v0.8.2
```

### 导出某个版本的代码

```powershell
# 导出 v0.8.1 版本
git archive --format=zip --output=computehub-v0.8.1.zip v0.8.1
```

### 查找引入 Bug 的提交

```powershell
# 使用二分查找
git bisect start
git bisect bad  # 当前版本有 Bug
git bisect good v0.8.1  # v0.8.1 版本正常

# Git 会自动切换到中间的提交，测试后标记
git bisect good  # 或 git bisect bad

# 重复直到找到问题提交
git bisect reset  # 结束查找
```

---

## 📚 推荐工具

### Git GUI 工具

- **GitHub Desktop** - 简单易用，适合初学者
- **GitKraken** - 功能强大，可视化好
- **SourceTree** - 免费专业工具

### VS Code 扩展

- **GitLens** - 增强 Git 功能
- **Git Graph** - 可视化提交历史
- **Git History** - 查看文件历史

---

## 💡 最佳实践

1. **频繁提交** - 小步提交，便于回退
2. **清晰的提交信息** - 遵循提交规范
3. **定期打标签** - 重要版本都打标签
4. **保持 main 稳定** - 只合并测试通过的代码
5. **使用分支** - 开发新功能时创建分支
6. **备份重要版本** - 使用标签标记里程碑

---

## 🆘 获取帮助

```powershell
# Git 帮助
git help
git help <command>

# 查看配置
git config --list

# 查看远程仓库
git remote -v
```

---

**需要帮助？** 查看 Git 官方文档或联系开发团队。
