# Middleware 不工作的临时解决方案

## 问题
Next.js 16 的 Turbopack 模式下 middleware 可能不工作

## 解决方案 1：使用 Webpack 模式（推荐）

在 `web` 目录运行：
```bash
# 停止当前服务器 (Ctrl+C)
# 使用 webpack 模式启动
npm run dev -- --no-turbopack
```

或者修改 `package.json`：
```json
{
  "scripts": {
    "dev": "next dev --no-turbopack"
  }
}
```

## 解决方案 2：客户端路由保护

如果 middleware 仍然不工作，我们可以在客户端添加保护：

在 `/admin/layout.tsx` 中添加角色检查，如果不是管理员就重定向。

## 请先尝试

1. 停止当前的 `npm run dev`
2. 运行：`npm run dev -- --no-turbopack`
3. 再次测试访问 `/admin`
4. 查看是否有 middleware 日志
