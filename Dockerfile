# 多阶段构建 - 前端构建阶段
FROM node:18-alpine AS frontend-builder

WORKDIR /app/frontend

# 复制前端package文件
COPY frontend/package*.json ./

# 安装前端依赖
RUN npm config set registry https://registry.npmmirror.com
RUN npm ci --only=production=false

# 复制前端源代码
COPY frontend/ .

# 构建前端生产版本
RUN npm run build

# 多阶段构建 - 后端构建阶段
FROM node:18-alpine AS backend-builder

WORKDIR /app/backend

# 复制后端package文件
COPY backend/package*.json ./

# 安装后端依赖（包括生产依赖）
RUN npm config set registry https://registry.npmmirror.com
RUN npm ci --only=production

# 多阶段构建 - 生产运行阶段
FROM node:18-alpine AS production

# 安装必要的系统工具（用于数据库操作等）
RUN sed -i 's/dl-cdn.alpinelinux.org/mirrors.aliyun.com/g' /etc/apk/repositories \
    && apk add --no-cache \
    sqlite \
    && rm -rf /var/cache/apk/*

WORKDIR /app

# 从后端构建阶段复制node_modules和package文件
COPY --from=backend-builder /app/backend/node_modules ./backend/node_modules
COPY --from=backend-builder /app/backend/package*.json ./backend/

# 复制后端源代码
COPY backend/ ./backend/

# 从前端构建阶段复制构建产物
COPY --from=frontend-builder /app/frontend/dist ./backend/public

# 创建必要的目录
RUN mkdir -p /app/backend/database \
    && mkdir -p /app/backend/uploads/avatars \
    && chmod -R 755 /app/backend/uploads

# 设置工作目录为后端目录
WORKDIR /app/backend

# 暴露端口
EXPOSE 3000

# 设置环境变量
ENV NODE_ENV=production
ENV PORT=3000

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})" || exit 1

# 启动应用
CMD ["node", "server.js"]



