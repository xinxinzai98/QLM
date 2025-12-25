# Docker 构建速度优化说明

## 问题描述

在 ECS 服务器上构建 Docker 镜像时，`apk add --no-cache python3 make g++` 步骤耗时过长（超过50分钟），导致构建失败或被取消。

## 原因分析

`frontend-builder` 阶段安装系统包时使用的是 Alpine Linux 官方源（`dl-cdn.alpinelinux.org`），在国内网络环境下下载速度极慢。

## 解决方案

为 `frontend-builder` 阶段添加阿里云镜像源配置，将 Alpine 包管理器源切换为 `mirrors.aliyun.com`。

### 修改内容

**修改前：**
```dockerfile
# 安装必要的构建工具（sass-embedded需要）
RUN apk add --no-cache python3 make g++
```

**修改后：**
```dockerfile
# 配置阿里云镜像源并安装必要的构建工具（sass-embedded需要）
RUN sed -i 's/dl-cdn.alpinelinux.org/mirrors.aliyun.com/g' /etc/apk/repositories \
    && apk add --no-cache python3 make g++ \
    && rm -rf /var/cache/apk/*
```

## 优化效果

- **优化前**：`apk add` 步骤耗时 50+ 分钟（经常超时失败）
- **优化后**：`apk add` 步骤预计耗时 1-3 分钟（使用国内镜像源）

## 在 ECS 上重新构建

### 方法一：使用更新脚本（推荐）

```bash
cd /opt/QLM
bash scripts/update.sh
```

### 方法二：手动构建

```bash
cd /opt/QLM

# 1. 拉取最新代码
git pull origin main

# 2. 清理 Docker 缓存（可选，但建议执行以使用新的镜像源）
docker system prune -f

# 3. 重新构建（现在会快很多）
docker-compose -f docker-compose.prod.yml build

# 4. 启动服务
docker-compose -f docker-compose.prod.yml up -d

# 5. 查看构建日志确认
docker-compose -f docker-compose.prod.yml logs --tail=50
```

## 验证构建速度

构建时观察日志，`apk add` 步骤应该在 1-3 分钟内完成：

```bash
# 查看构建进度
docker-compose -f docker-compose.prod.yml build --progress=plain 2>&1 | grep -E "apk add|python3|g\+\+"
```

预期输出应该显示步骤快速完成，而不是长时间卡住。

## 注意事项

1. **首次构建仍需要时间**：虽然 `apk add` 步骤加快了，但完整的 Docker 构建（包括 npm 安装、前端构建等）仍需要 10-20 分钟，这是正常的。

2. **网络稳定性**：确保 ECS 服务器能够访问阿里云镜像源 `mirrors.aliyun.com`。

3. **缓存利用**：如果之前构建失败，建议先清理 Docker 缓存，以确保使用新的镜像源配置。

4. **构建阶段说明**：
   - `frontend-builder`：已配置阿里云镜像源 ✅
   - `backend-builder`：无需系统包，使用 npm 镜像源 ✅
   - `production`：已配置阿里云镜像源 ✅

## 提交信息

- **提交 ID**: `f5af284`
- **提交信息**: `perf: 为前端构建阶段添加阿里云镜像源以加速apk包下载`
- **日期**: 2025-12-23

