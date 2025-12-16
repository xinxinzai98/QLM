# 阿里云ECS迁移准备清单
## 青绿氢能物料管理系统 (MMS) - 云迁移指南

**文档版本**: v1.0  
**最后更新**: 2025年12月  
**目标环境**: 阿里云ECS + 容器化部署

---

## 总体迁移流程图

```
┌─────────────────────────────────────────────────────────────┐
│                    迁移准备阶段                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │容器化改造│→ │配置外部化│→ │数据迁移  │→ │安全加固  │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                    云资源配置阶段                            │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │ECS实例  │→ │安全组    │→ │SLB负载   │→ │OSS存储   │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                    部署与验证阶段                            │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │镜像构建  │→ │容器部署  │→ │功能验证  │→ │性能测试  │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                    监控与运维阶段                            │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                  │
│  │日志收集  │→ │监控告警  │→ │备份策略  │                  │
│  └──────────┘  └──────────┘  └──────────┘                  │
└─────────────────────────────────────────────────────────────┘
```

---

## 第一阶段：容器化改造（关键前提）

### 1.1 Dockerfile创建

#### ✅ 任务1.1.1: 后端Dockerfile

**文件路径**: `backend/Dockerfile`

**状态**: ⬜ 待开始

**内容**:
```dockerfile
# 多阶段构建 - 构建阶段
FROM node:18-alpine AS builder

WORKDIR /app

# 复制package文件
COPY package*.json ./

# 安装依赖
RUN npm ci --only=production

# 复制源代码
COPY . .

# 运行阶段
FROM node:18-alpine

WORKDIR /app

# 从构建阶段复制依赖和代码
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app .

# 创建非root用户
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# 创建数据目录（SQLite数据库）
RUN mkdir -p /data && chown -R nodejs:nodejs /data

USER nodejs

# 暴露端口
EXPOSE 3000

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# 启动命令
CMD ["node", "server.js"]
```

**验收标准**:
- ✅ 镜像大小 < 200MB
- ✅ 使用非root用户运行
- ✅ 包含健康检查
- ✅ 多阶段构建优化

#### ✅ 任务1.1.2: 前端Dockerfile

**文件路径**: `frontend/Dockerfile`

**状态**: ⬜ 待开始

**内容**:
```dockerfile
# 多阶段构建 - 构建阶段
FROM node:18-alpine AS builder

WORKDIR /app

# 复制package文件
COPY package*.json ./

# 安装依赖
RUN npm ci

# 复制源代码
COPY . .

# 构建生产版本
RUN npm run build

# 运行阶段 - 使用Nginx
FROM nginx:alpine

# 复制构建产物
COPY --from=builder /app/dist /usr/share/nginx/html

# 复制Nginx配置
COPY nginx.conf /etc/nginx/conf.d/default.conf

# 暴露端口
EXPOSE 80

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
```

**验收标准**:
- ✅ 使用Nginx服务静态文件
- ✅ 包含健康检查
- ✅ 镜像大小 < 50MB

#### ✅ 任务1.1.3: Nginx配置文件

**文件路径**: `frontend/nginx.conf`

**状态**: ⬜ 待开始

**内容**:
```nginx
server {
    listen 80;
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html;

    # Gzip压缩
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/json application/javascript application/xml+rss;

    # 静态资源缓存
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # SPA路由支持
    location / {
        try_files $uri $uri/ /index.html;
    }

    # API代理（可选，如果前端和后端在同一域名）
    location /api {
        proxy_pass http://backend:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

**验收标准**:
- ✅ 支持SPA路由
- ✅ 配置Gzip压缩
- ✅ 静态资源缓存策略

### 1.2 镜像构建与测试

#### ✅ 任务1.2.1: 本地镜像构建

**状态**: ⬜ 待开始

**命令**:
```bash
# 构建后端镜像
cd backend
docker build -t mms-backend:latest .

# 构建前端镜像
cd ../frontend
docker build -t mms-frontend:latest .
```

**验收标准**:
- ✅ 镜像构建成功
- ✅ 无构建警告
- ✅ 镜像大小符合预期

#### ✅ 任务1.2.2: 本地容器测试

**状态**: ⬜ 待开始

**命令**:
```bash
# 启动后端容器
docker run -d \
  --name mms-backend \
  -p 3000:3000 \
  -e NODE_ENV=development \
  -e JWT_SECRET=test-secret-key \
  -v $(pwd)/data:/data \
  mms-backend:latest

# 启动前端容器
docker run -d \
  --name mms-frontend \
  -p 80:80 \
  mms-frontend:latest
```

**验收标准**:
- ✅ 容器启动成功
- ✅ 健康检查通过
- ✅ 功能测试通过

### 1.3 docker-compose.yml编写

#### ✅ 任务1.3.1: 开发环境docker-compose

**文件路径**: `docker-compose.dev.yml`

**状态**: ⬜ 待开始

**内容**:
```yaml
version: '3.8'

services:
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: mms-backend-dev
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=development
      - PORT=3000
      - JWT_SECRET=${JWT_SECRET:-dev-secret-key-change-in-production}
      - JWT_EXPIRES_IN=7d
      - DB_PATH=/data/mms.db
    volumes:
      - ./backend/uploads:/app/uploads
      - ./data:/data
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "node", "-e", "require('http').get('http://localhost:3000/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"]
      interval: 30s
      timeout: 3s
      retries: 3
      start_period: 10s

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: mms-frontend-dev
    ports:
      - "80:80"
    depends_on:
      - backend
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost/"]
      interval: 30s
      timeout: 3s
      retries: 3

volumes:
  data:
    driver: local
```

**验收标准**:
- ✅ 服务可正常启动
- ✅ 服务间通信正常
- ✅ 数据持久化正常

#### ✅ 任务1.3.2: 生产环境docker-compose

**文件路径**: `docker-compose.prod.yml`

**状态**: ⬜ 待开始

**内容**:
```yaml
version: '3.8'

services:
  backend:
    image: registry.cn-hangzhou.aliyuncs.com/your-namespace/mms-backend:latest
    container_name: mms-backend-prod
    environment:
      - NODE_ENV=production
      - PORT=3000
      - JWT_SECRET=${JWT_SECRET}
      - JWT_EXPIRES_IN=${JWT_EXPIRES_IN:-7d}
      - DB_PATH=/data/mms.db
      - LOG_LEVEL=${LOG_LEVEL:-info}
    volumes:
      - /data/mms/uploads:/app/uploads
      - /data/mms/db:/data
    restart: always
    healthcheck:
      test: ["CMD", "node", "-e", "require('http').get('http://localhost:3000/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"]
      interval: 30s
      timeout: 3s
      retries: 3

  frontend:
    image: registry.cn-hangzhou.aliyuncs.com/your-namespace/mms-frontend:latest
    container_name: mms-frontend-prod
    depends_on:
      - backend
    restart: always
    healthcheck:
      test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost/"]
      interval: 30s
      timeout: 3s
      retries: 3

  nginx:
    image: nginx:alpine
    container_name: mms-nginx-prod
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./nginx/ssl:/etc/nginx/ssl:ro
    depends_on:
      - frontend
      - backend
    restart: always
```

**验收标准**:
- ✅ 使用生产镜像
- ✅ 环境变量外部化
- ✅ 数据卷持久化

---

## 第二阶段：应用配置与密钥管理

### 2.1 环境变量化

#### ✅ 任务2.1.1: 后端环境变量清单

**状态**: ⬜ 待开始

**必需环境变量**:
```bash
# 应用配置
NODE_ENV=production
PORT=3000

# 安全配置
JWT_SECRET=<32位以上强密钥>
JWT_EXPIRES_IN=7d

# 数据库配置
DB_PATH=/data/mms.db

# 日志配置
LOG_LEVEL=info
LOG_DIR=/app/logs

# 文件上传配置
UPLOAD_DIR=/app/uploads
MAX_FILE_SIZE=2097152  # 2MB

# CORS配置（生产环境）
CORS_ORIGIN=https://yourdomain.com
```

**修复位置**:
- `backend/server.js` - 端口配置 ✅ 已支持
- `backend/middleware/authMiddleware.js` - JWT密钥 ⚠️ 需强制验证
- `backend/database/database.js` - 数据库路径 ⚠️ 需环境变量化
- `backend/routes/profileRoutes.js` - 上传目录 ⚠️ 需环境变量化

#### ✅ 任务2.1.2: 前端环境变量清单

**状态**: ⬜ 待开始

**必需环境变量**:
```bash
# API地址（构建时注入）
VITE_API_BASE_URL=https://api.yourdomain.com

# 应用配置
VITE_APP_TITLE=青绿氢能物料管理系统
```

**修复位置**:
- `frontend/src/utils/api.js` - API基础URL ⚠️ 需环境变量化

**Vite环境变量配置**:
```javascript
// vite.config.js
export default defineConfig({
  define: {
    'import.meta.env.VITE_API_BASE_URL': JSON.stringify(process.env.VITE_API_BASE_URL || '/api')
  }
});
```

### 2.2 密钥安全管理

#### ✅ 任务2.2.1: 阿里云KMS集成（推荐）

**状态**: ⬜ 待开始

**方案**: 使用阿里云密钥管理服务（KMS）存储JWT密钥

**实现步骤**:
1. 在阿里云KMS创建密钥
2. 安装阿里云SDK: `npm install @alicloud/kms20160120`
3. 应用启动时从KMS获取密钥

**代码示例**:
```javascript
const KMS = require('@alicloud/kms20160120');
const Client = require('@alicloud/kms20160120').default;

const client = new Client({
  accessKeyId: process.env.ALIYUN_ACCESS_KEY_ID,
  accessKeySecret: process.env.ALIYUN_ACCESS_KEY_SECRET,
  endpoint: 'kms.cn-hangzhou.aliyuncs.com'
});

async function getJWTSecret() {
  const response = await client.getSecretValue({
    SecretName: 'mms-jwt-secret'
  });
  return response.body.SecretData;
}
```

#### ✅ 任务2.2.2: ECS实例元数据（备选）

**状态**: ⬜ 待开始

**方案**: 使用ECS实例元数据服务存储密钥

**实现步骤**:
1. 通过ECS控制台设置用户数据（User Data）
2. 应用启动时从元数据服务获取

**代码示例**:
```javascript
const http = require('http');

function getInstanceMetadata(path) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: '100.100.100.200',
      port: 80,
      path: `/latest/meta-data/${path}`,
      timeout: 2000
    };
    http.get(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}
```

#### ✅ 任务2.2.3: 环境变量文件加密（简单方案）

**状态**: ⬜ 待开始

**方案**: 使用加密的环境变量文件，启动时解密

**实现步骤**:
1. 使用 `ansible-vault` 或 `sops` 加密 `.env` 文件
2. 部署时解密并注入容器

---

## 第三阶段：数据迁移与持久化

### 3.1 数据库迁移计划

#### ✅ 任务3.1.1: SQLite数据备份

**状态**: ⬜ 待开始

**备份脚本**: `scripts/backup-sqlite.sh`

```bash
#!/bin/bash
BACKUP_DIR="/backup"
DB_PATH="/data/mms.db"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/mms_backup_${TIMESTAMP}.db"

# 创建备份目录
mkdir -p ${BACKUP_DIR}

# SQLite备份（使用VACUUM INTO）
sqlite3 ${DB_PATH} "VACUUM INTO '${BACKUP_FILE}';"

# 压缩备份
gzip ${BACKUP_FILE}

echo "备份完成: ${BACKUP_FILE}.gz"
```

**验收标准**:
- ✅ 备份文件可恢复
- ✅ 备份文件大小合理
- ✅ 备份自动化（定时任务）

#### ✅ 任务3.1.2: PostgreSQL迁移评估

**状态**: ⬜ 待开始

**迁移时机评估**:

| 指标 | 当前值 | 迁移阈值 | 建议 |
|------|--------|---------|------|
| 数据量 | < 10万条 | > 100万条 | ⬜ 暂不迁移 |
| 并发用户 | < 20 | > 50 | ⬜ 暂不迁移 |
| 写入频率 | < 10次/秒 | > 100次/秒 | ⬜ 暂不迁移 |

**结论**: 当前阶段**暂不迁移**，但需准备迁移方案

#### ✅ 任务3.1.3: 迁移脚本准备（未来使用）

**状态**: ⬜ 待开始（未来任务）

**迁移工具**: `pgloader` 或自定义脚本

**迁移步骤**:
1. 在阿里云RDS创建PostgreSQL实例
2. 创建表结构（与SQLite一致）
3. 导出SQLite数据为CSV
4. 导入PostgreSQL
5. 验证数据一致性
6. 切换应用连接

**迁移脚本**: `scripts/migrate-to-postgresql.sh`

```bash
#!/bin/bash
# SQLite导出
sqlite3 mms.db <<EOF
.mode csv
.headers on
.output materials.csv
SELECT * FROM materials;
EOF

# PostgreSQL导入
psql -h your-rds-endpoint -U postgres -d mms <<EOF
\COPY materials FROM 'materials.csv' WITH CSV HEADER;
EOF
```

### 3.2 文件存储迁移

#### ✅ 任务3.2.1: 阿里云OSS集成

**状态**: ⬜ 待开始

**当前问题**: 用户头像存储在本地文件系统，容器化后需迁移至OSS

**实现步骤**:
1. 创建OSS Bucket: `mms-uploads`
2. 安装OSS SDK: `npm install ali-oss`
3. 修改上传逻辑

**代码修改**: `backend/routes/profileRoutes.js`

```javascript
const OSS = require('ali-oss');

const client = new OSS({
  region: process.env.OSS_REGION,
  accessKeyId: process.env.OSS_ACCESS_KEY_ID,
  accessKeySecret: process.env.OSS_ACCESS_KEY_SECRET,
  bucket: process.env.OSS_BUCKET
});

// 上传文件到OSS
const uploadToOSS = async (file) => {
  const fileName = `avatars/${Date.now()}_${file.originalname}`;
  const result = await client.put(fileName, file.buffer);
  return result.url;
};
```

**验收标准**:
- ✅ 文件上传到OSS成功
- ✅ 文件访问URL正确
- ✅ OSS权限配置正确（私有读/公共读）

#### ✅ 任务3.2.2: 本地文件迁移至OSS

**状态**: ⬜ 待开始

**迁移脚本**: `scripts/migrate-files-to-oss.js`

```javascript
const OSS = require('ali-oss');
const fs = require('fs');
const path = require('path');

const client = new OSS({
  // OSS配置
});

async function migrateFiles() {
  const uploadDir = path.join(__dirname, '../backend/uploads/avatars');
  const files = fs.readdirSync(uploadDir);
  
  for (const file of files) {
    const filePath = path.join(uploadDir, file);
    const fileContent = fs.readFileSync(filePath);
    await client.put(`avatars/${file}`, fileContent);
    console.log(`已迁移: ${file}`);
  }
}
```

---

## 第四阶段：网络与安全配置

### 4.1 ECS安全组规则

#### ✅ 任务4.1.1: 安全组配置

**状态**: ⬜ 待开始

**安全组规则**:

| 规则类型 | 协议 | 端口范围 | 授权对象 | 说明 |
|---------|------|---------|---------|------|
| 入方向 | TCP | 80 | 0.0.0.0/0 | HTTP访问 |
| 入方向 | TCP | 443 | 0.0.0.0/0 | HTTPS访问 |
| 入方向 | TCP | 22 | 管理IP | SSH管理（限制IP） |
| 出方向 | ALL | ALL | 0.0.0.0/0 | 允许所有出站 |

**配置步骤**:
1. 登录阿里云控制台
2. 进入ECS → 网络与安全 → 安全组
3. 创建安全组：`mms-production-sg`
4. 添加入站规则（仅开放80/443）
5. 添加出站规则（允许所有）

**验收标准**:
- ✅ 仅开放必要端口
- ✅ SSH端口限制IP访问
- ✅ 规则描述清晰

### 4.2 域名与SSL配置

#### ✅ 任务4.2.1: 域名解析配置

**状态**: ⬜ 待开始

**DNS配置**:
- A记录: `api.yourdomain.com` → ECS公网IP
- A记录: `www.yourdomain.com` → ECS公网IP（或CDN）

**配置步骤**:
1. 在域名服务商添加A记录
2. 等待DNS生效（通常5-30分钟）
3. 验证解析: `nslookup api.yourdomain.com`

#### ✅ 任务4.2.2: SSL证书申请与配置

**状态**: ⬜ 待开始

**方案1: 阿里云SSL证书（推荐）**
1. 登录阿里云SSL证书控制台
2. 申请免费DV证书（或购买OV/EV证书）
3. 下载证书文件（Nginx格式）
4. 配置到Nginx

**方案2: Let's Encrypt免费证书**
```bash
# 使用certbot申请证书
certbot certonly --standalone -d api.yourdomain.com -d www.yourdomain.com
```

**Nginx SSL配置**: `nginx/ssl.conf`

```nginx
server {
    listen 443 ssl http2;
    server_name api.yourdomain.com;

    ssl_certificate /etc/nginx/ssl/cert.pem;
    ssl_certificate_key /etc/nginx/ssl/key.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # HTTP重定向到HTTPS
    location / {
        proxy_pass http://backend:3000;
    }
}

server {
    listen 80;
    server_name api.yourdomain.com;
    return 301 https://$server_name$request_uri;
}
```

**验收标准**:
- ✅ HTTPS访问正常
- ✅ 证书有效期 > 30天
- ✅ HTTP自动重定向HTTPS

### 4.3 负载均衡配置（可选）

#### ✅ 任务4.3.1: 阿里云SLB配置

**状态**: ⬜ 待开始（可选）

**适用场景**: 多实例部署、高可用需求

**配置步骤**:
1. 创建SLB实例（应用型负载均衡ALB）
2. 添加后端服务器组（ECS实例）
3. 配置监听规则（80/443端口）
4. 配置健康检查（`/api/health`）

**健康检查配置**:
- 检查路径: `/api/health`
- 检查间隔: 5秒
- 超时时间: 3秒
- 健康阈值: 2次
- 不健康阈值: 3次

---

## 第五阶段：部署与监控

### 5.1 部署脚本编写

#### ✅ 任务5.1.1: 自动化部署脚本

**文件路径**: `scripts/deploy.sh`

**状态**: ⬜ 待开始

**内容**:
```bash
#!/bin/bash
set -e

# 配置变量
REGISTRY="registry.cn-hangzhou.aliyuncs.com"
NAMESPACE="your-namespace"
BACKEND_IMAGE="${REGISTRY}/${NAMESPACE}/mms-backend:latest"
FRONTEND_IMAGE="${REGISTRY}/${NAMESPACE}/mms-frontend:latest"
ECS_HOST="your-ecs-ip"
ECS_USER="root"

echo "开始部署..."

# 1. 构建镜像
echo "构建后端镜像..."
cd backend
docker build -t ${BACKEND_IMAGE} .
docker push ${BACKEND_IMAGE}

echo "构建前端镜像..."
cd ../frontend
docker build -t ${FRONTEND_IMAGE} .
docker push ${FRONTEND_IMAGE}

# 2. 部署到ECS
echo "部署到ECS..."
ssh ${ECS_USER}@${ECS_HOST} <<EOF
  # 拉取最新镜像
  docker pull ${BACKEND_IMAGE}
  docker pull ${FRONTEND_IMAGE}

  # 停止旧容器
  docker stop mms-backend-prod mms-frontend-prod || true
  docker rm mms-backend-prod mms-frontend-prod || true

  # 启动新容器
  docker run -d \\
    --name mms-backend-prod \\
    --restart always \\
    -e NODE_ENV=production \\
    -e JWT_SECRET=\${JWT_SECRET} \\
    -v /data/mms/db:/data \\
    ${BACKEND_IMAGE}

  docker run -d \\
    --name mms-frontend-prod \\
    --restart always \\
    ${FRONTEND_IMAGE}

  # 健康检查
  sleep 10
  curl -f http://localhost:3000/api/health || exit 1
EOF

echo "部署完成！"
```

**验收标准**:
- ✅ 脚本可执行
- ✅ 部署过程无错误
- ✅ 服务启动正常

### 5.2 监控基线配置

#### ✅ 任务5.2.1: 健康检查端点增强

**状态**: ⬜ 待开始

**当前**: `/api/health` 仅返回简单状态

**增强方案**: `backend/routes/healthRoutes.js`

```javascript
router.get('/health', async (req, res) => {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    checks: {
      database: 'unknown',
      memory: 'unknown'
    }
  };

  // 数据库连接检查
  try {
    await new Promise((resolve, reject) => {
      db.get('SELECT 1', (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
    health.checks.database = 'ok';
  } catch (err) {
    health.checks.database = 'error';
    health.status = 'degraded';
  }

  // 内存检查
  const memUsage = process.memoryUsage();
  const memUsageMB = {
    rss: Math.round(memUsage.rss / 1024 / 1024),
    heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
    heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024)
  };
  health.checks.memory = memUsageMB;

  const statusCode = health.status === 'ok' ? 200 : 503;
  res.status(statusCode).json(health);
});
```

#### ✅ 任务5.2.2: 阿里云云监控配置

**状态**: ⬜ 待开始

**监控指标**:
- CPU使用率（阈值: > 80%）
- 内存使用率（阈值: > 85%）
- 磁盘使用率（阈值: > 90%）
- 网络入流量（异常检测）
- 网络出流量（异常检测）

**配置步骤**:
1. 登录阿里云云监控控制台
2. 创建监控组：`MMS生产环境`
3. 添加ECS实例到监控组
4. 配置告警规则
5. 设置告警通知（邮件/短信）

### 5.3 日志收集配置

#### ✅ 任务5.3.1: 容器日志驱动配置

**状态**: ⬜ 待开始

**方案**: 使用 `json-file` 日志驱动，配置日志轮转

**docker-compose配置**:
```yaml
services:
  backend:
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
        labels: "service=backend"
```

#### ✅ 任务5.3.2: 阿里云SLS日志收集（推荐）

**状态**: ⬜ 待开始

**配置步骤**:
1. 创建SLS项目：`mms-logs`
2. 创建Logstore：`backend-logs`, `frontend-logs`
3. 安装Logtail（日志采集Agent）
4. 配置采集规则

**Logtail配置**: `/etc/ilogtail/user_log_config.json`

```json
{
  "inputs": [
    {
      "type": "service_docker_stdout",
      "detail": {
        "IncludeLabel": {
          "service": "backend"
        }
      }
    }
  ]
}
```

**验收标准**:
- ✅ 日志实时采集
- ✅ 日志可查询
- ✅ 日志保留策略配置

---

## 分阶段任务清单

### 阶段1: 容器化改造（1-2周）

| 任务ID | 任务描述 | 状态 | 负责人 | 预计工时 |
|--------|---------|------|--------|---------|
| 1.1.1 | 创建后端Dockerfile | ⬜ 待开始 | 后端开发 | 4h |
| 1.1.2 | 创建前端Dockerfile | ⬜ 待开始 | 前端开发 | 4h |
| 1.1.3 | 创建Nginx配置 | ⬜ 待开始 | 运维 | 2h |
| 1.2.1 | 本地镜像构建测试 | ⬜ 待开始 | 全栈开发 | 4h |
| 1.2.2 | 本地容器功能测试 | ⬜ 待开始 | 全栈开发 | 4h |
| 1.3.1 | 编写docker-compose.dev.yml | ⬜ 待开始 | 运维 | 2h |
| 1.3.2 | 编写docker-compose.prod.yml | ⬜ 待开始 | 运维 | 2h |

**阶段1总计**: 22小时

### 阶段2: 配置与密钥管理（1周）

| 任务ID | 任务描述 | 状态 | 负责人 | 预计工时 |
|--------|---------|------|--------|---------|
| 2.1.1 | 后端环境变量化 | ⬜ 待开始 | 后端开发 | 4h |
| 2.1.2 | 前端环境变量化 | ⬜ 待开始 | 前端开发 | 2h |
| 2.2.1 | 阿里云KMS集成 | ⬜ 待开始 | 后端开发 | 6h |
| 2.2.2 | ECS元数据备选方案 | ⬜ 待开始 | 后端开发 | 2h |

**阶段2总计**: 14小时

### 阶段3: 数据迁移（1周）

| 任务ID | 任务描述 | 状态 | 负责人 | 预计工时 |
|--------|---------|------|--------|---------|
| 3.1.1 | SQLite备份脚本 | ⬜ 待开始 | 运维 | 2h |
| 3.1.2 | PostgreSQL迁移评估 | ⬜ 待开始 | 架构师 | 4h |
| 3.2.1 | 阿里云OSS集成 | ⬜ 待开始 | 后端开发 | 6h |
| 3.2.2 | 文件迁移脚本 | ⬜ 待开始 | 运维 | 2h |

**阶段3总计**: 14小时

### 阶段4: 网络与安全（1周）

| 任务ID | 任务描述 | 状态 | 负责人 | 预计工时 |
|--------|---------|------|--------|---------|
| 4.1.1 | ECS安全组配置 | ⬜ 待开始 | 运维 | 2h |
| 4.2.1 | 域名解析配置 | ⬜ 待开始 | 运维 | 1h |
| 4.2.2 | SSL证书申请配置 | ⬜ 待开始 | 运维 | 4h |
| 4.3.1 | SLB负载均衡（可选） | ⬜ 待开始 | 运维 | 4h |

**阶段4总计**: 11小时（含可选）

### 阶段5: 部署与监控（1周）

| 任务ID | 任务描述 | 状态 | 负责人 | 预计工时 |
|--------|---------|------|--------|---------|
| 5.1.1 | 自动化部署脚本 | ⬜ 待开始 | 运维 | 6h |
| 5.2.1 | 健康检查端点增强 | ⬜ 待开始 | 后端开发 | 2h |
| 5.2.2 | 云监控配置 | ⬜ 待开始 | 运维 | 2h |
| 5.3.1 | 容器日志驱动配置 | ⬜ 待开始 | 运维 | 2h |
| 5.3.2 | SLS日志收集配置 | ⬜ 待开始 | 运维 | 4h |

**阶段5总计**: 16小时

**总预计工时**: 77小时（约2周全职工作）

---

## 风险与依赖项说明

### 技术风险

#### 🔴 高风险项

1. **SQLite数据持久化问题**
   - **风险**: 容器重启可能导致数据丢失
   - **缓解**: 使用Volume挂载数据目录，定期备份
   - **长期方案**: 迁移至PostgreSQL

2. **镜像构建失败**
   - **风险**: 依赖下载失败、构建环境不一致
   - **缓解**: 使用国内镜像源，锁定依赖版本

3. **容器网络问题**
   - **风险**: 容器间通信失败
   - **缓解**: 使用docker-compose网络，充分测试

#### 🟡 中风险项

4. **密钥泄露风险**
   - **风险**: 环境变量或镜像中包含密钥
   - **缓解**: 使用KMS或加密存储，不在镜像中包含密钥

5. **性能下降风险**
   - **风险**: 容器化后性能可能下降
   - **缓解**: 性能测试，优化资源配置

### 依赖项

#### 外部依赖

1. **阿里云服务**:
   - ECS实例（必需）
   - OSS存储（必需）
   - KMS密钥管理（推荐）
   - SLS日志服务（推荐）
   - SLB负载均衡（可选）

2. **域名与证书**:
   - 已备案域名（必需）
   - SSL证书（必需）

#### 团队依赖

1. **技能要求**:
   - Docker容器化经验
   - 阿里云平台操作经验
   - Linux运维经验

2. **人员配置**:
   - 后端开发（1人）
   - 前端开发（1人）
   - 运维/DevOps（1人）

#### 时间依赖

1. **顺序依赖**:
   - 阶段1必须在阶段2之前完成
   - 阶段2必须在阶段3之前完成
   - 阶段4和阶段5可并行进行

2. **外部依赖**:
   - 域名备案（如未备案，需1-2周）
   - SSL证书申请（1-3天）

---

## 迁移检查清单

### 迁移前检查

- [ ] 所有P0安全问题已修复（见《系统优化与演进路线图》）
- [ ] 数据库索引已创建
- [ ] 环境变量已全部外部化
- [ ] 代码已提交到版本控制系统
- [ ] 本地容器测试通过

### 迁移中检查

- [ ] Dockerfile构建成功
- [ ] 镜像推送到阿里云容器镜像服务
- [ ] ECS实例创建并配置
- [ ] 安全组规则配置正确
- [ ] 域名解析生效
- [ ] SSL证书配置正确

### 迁移后检查

- [ ] 容器启动成功
- [ ] 健康检查通过
- [ ] 功能测试通过
- [ ] 性能测试通过
- [ ] 日志收集正常
- [ ] 监控告警配置正确
- [ ] 备份策略已实施

---

## 附录

### A. 阿里云资源清单

| 资源类型 | 规格 | 数量 | 预估成本/月 |
|---------|------|------|-----------|
| ECS实例 | 2核4G | 1台 | ¥200-300 |
| OSS存储 | 标准存储 | 10GB | ¥2 |
| SLB负载均衡 | 应用型 | 1个 | ¥18 |
| SLS日志服务 | 按量付费 | - | ¥10-50 |
| 带宽 | 5Mbps | - | ¥23/Mbps |

**总计**: 约¥300-400/月（不含带宽）

### B. 常用命令参考

```bash
# 构建镜像
docker build -t mms-backend:latest ./backend

# 运行容器
docker run -d -p 3000:3000 --name mms-backend mms-backend:latest

# 查看日志
docker logs -f mms-backend

# 进入容器
docker exec -it mms-backend sh

# 停止并删除容器
docker stop mms-backend && docker rm mms-backend

# docker-compose启动
docker-compose -f docker-compose.prod.yml up -d

# docker-compose停止
docker-compose -f docker-compose.prod.yml down
```

### C. 故障排查指南

#### 容器无法启动
1. 检查日志: `docker logs mms-backend`
2. 检查环境变量: `docker inspect mms-backend`
3. 检查端口占用: `netstat -tulpn | grep 3000`

#### 数据库连接失败
1. 检查数据库文件权限
2. 检查Volume挂载: `docker inspect mms-backend | grep Mounts`
3. 检查数据库路径环境变量

#### 健康检查失败
1. 检查健康检查端点: `curl http://localhost:3000/api/health`
2. 检查容器状态: `docker ps -a`
3. 检查资源使用: `docker stats mms-backend`

---

**文档结束**

