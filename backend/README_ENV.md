# 环境变量配置说明

## 快速开始

首次运行系统时，启动脚本会自动生成 `.env` 文件并配置JWT密钥。

如果看到JWT_SECRET警告，请运行：

```bash
node generate-jwt-secret.js
```

## 手动配置

1. 确保 `backend/.env` 文件存在
2. 设置 `JWT_SECRET` 变量（至少32字符）

示例：
```
JWT_SECRET=your-strong-secret-key-at-least-32-characters-long
```

## 详细文档

查看 `docs/development/ENVIRONMENT_VARIABLES.md` 了解完整的环境变量配置说明。





