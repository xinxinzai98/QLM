# Docker构建失败修复指南

## 问题描述

Docker构建时出现错误：
```
[vite:css] Preprocessor dependency "sass-embedded" not found. Did you install it?
```

## 原因分析

1. `DataManagement.vue` 文件使用了 `<style lang="scss">`，需要 `sass-embedded` 依赖
2. `sass-embedded` 在 Alpine Linux 上需要编译，需要额外的构建工具
3. Dockerfile 中缺少必要的构建工具（python3, make, g++）

## 解决方案

已修复 `Dockerfile`，添加了必要的构建工具：

```dockerfile
# 安装必要的构建工具（sass-embedded需要）
RUN apk add --no-cache python3 make g++
```

## 修复后的Dockerfile（前端构建部分）

```dockerfile
# 多阶段构建 - 前端构建阶段
FROM node:18-alpine AS frontend-builder

WORKDIR /app/frontend

# 安装必要的构建工具（sass-embedded需要）
RUN apk add --no-cache python3 make g++

# 复制前端package文件
COPY frontend/package*.json ./

# 安装前端依赖（npm ci默认会安装devDependencies）
RUN npm config set registry https://registry.npmmirror.com
RUN npm ci

# 复制前端源代码
COPY frontend/ .

# 构建前端生产版本
RUN npm run build
```

## 验证修复

修复后，在ECS服务器上重新构建：

```bash
cd /opt/QLM
docker-compose -f docker-compose.prod.yml build
```

应该可以成功构建。

## 如果仍然失败

1. **清理Docker缓存**：
   ```bash
   docker system prune -a
   docker-compose -f docker-compose.prod.yml build --no-cache
   ```

2. **检查网络连接**：
   ```bash
   ping registry.npmmirror.com
   ```

3. **手动测试依赖安装**：
   ```bash
   docker run --rm -it node:18-alpine sh
   apk add --no-cache python3 make g++
   npm config set registry https://registry.npmmirror.com
   npm install -D sass-embedded
   ```

---

**修复时间**: 2024-01-XX  
**相关文件**: `Dockerfile`

