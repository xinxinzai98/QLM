# 物料管理系统 - 部署指南

## 目录

1. [系统要求](#系统要求)
2. [快速部署](#快速部署)
3. [手动部署](#手动部署)
4. [配置说明](#配置说明)
5. [生产环境部署](#生产环境部署)
6. [故障排查](#故障排查)

---

## 系统要求

### 必需环境

- **Node.js**: >= 16.0.0
- **npm**: >= 8.0.0
- **操作系统**: Windows 7+, macOS 10.12+, Linux (主流发行版)

### 推荐配置

- **内存**: >= 2GB RAM
- **磁盘空间**: >= 500MB 可用空间
- **浏览器**: Chrome, Firefox, Edge, Safari (最新版本)

### 网络要求

- 本地部署无需网络连接
- 如需远程访问，需要配置网络和防火墙

---

## 快速部署

### Windows系统

1. **解压项目文件**
   ```bash
   # 将项目解压到任意目录，如 C:\MMS
   ```

2. **一键启动**
   - 双击 `start.bat` 文件
   - 系统会自动：
     - 检查Node.js环境
     - 安装依赖（如需要）
     - 启动后端服务（端口3000）
     - 启动前端服务（端口5173）
     - 打开浏览器

3. **访问系统**
   - 浏览器会自动打开 http://localhost:5173
   - 或手动访问该地址

### Mac/Linux系统

1. **解压项目文件**
   ```bash
   # 将项目解压到任意目录
   cd /path/to/mms
   ```

2. **设置执行权限**
   ```bash
   chmod +x start.sh
   ```

3. **一键启动**
   ```bash
   ./start.sh
   ```

4. **访问系统**
   - 浏览器会自动打开 http://localhost:5173
   - 或手动访问该地址

---

## 手动部署

如果一键启动脚本无法使用，可以手动部署：

### 步骤1: 安装后端依赖

```bash
cd backend
npm install
```

### 步骤2: 安装前端依赖

```bash
cd frontend
npm install
```

### 步骤3: 启动后端服务

```bash
cd backend
npm start
```

后端服务将在 http://localhost:3000 启动

### 步骤4: 启动前端服务（新开终端）

```bash
cd frontend
npm run dev
```

前端服务将在 http://localhost:5173 启动

### 步骤5: 访问系统

打开浏览器访问：http://localhost:5173

---

## 配置说明

### 后端配置

配置文件：`backend/.env`

```env
# 服务器端口（默认3000）
PORT=3000

# 运行环境（development/production）
NODE_ENV=development

# JWT密钥（生产环境必须修改）
JWT_SECRET=your-super-secret-jwt-key-change-in-production

# JWT过期时间（默认7天）
JWT_EXPIRES_IN=7d
```

**重要提示：**
- 生产环境必须修改 `JWT_SECRET` 为强密码
- 建议使用随机字符串生成器生成

### 前端配置

配置文件：`frontend/vite.config.js`

```javascript
export default defineConfig({
  server: {
    port: 5173,  // 前端端口
    proxy: {
      '/api': {
        target: 'http://localhost:3000',  // 后端地址
        changeOrigin: true
      }
    }
  }
});
```

### 修改端口

#### 修改后端端口

编辑 `backend/.env`：
```env
PORT=3001  # 修改为你想要的端口
```

#### 修改前端端口

编辑 `frontend/vite.config.js`：
```javascript
server: {
  port: 5174,  // 修改为你想要的端口
}
```

**注意**: 修改端口后，需要同时更新前端的代理配置。

---

## 生产环境部署

### 1. 环境准备

```bash
# 确保Node.js版本 >= 16.0.0
node --version

# 确保npm版本 >= 8.0.0
npm --version
```

### 2. 修改配置

#### 后端配置

编辑 `backend/.env`：
```env
PORT=3000
NODE_ENV=production
JWT_SECRET=<生成强随机密钥>
JWT_EXPIRES_IN=7d
```

#### 前端配置

构建生产版本：
```bash
cd frontend
npm run build
```

构建产物在 `frontend/dist` 目录

### 3. 使用进程管理器（推荐）

#### 使用PM2（Node.js进程管理器）

```bash
# 安装PM2
npm install -g pm2

# 启动后端
cd backend
pm2 start server.js --name mms-backend

# 启动前端（如果使用Node.js服务）
# 或使用Nginx等Web服务器托管dist目录
```

#### PM2常用命令

```bash
# 查看进程状态
pm2 list

# 查看日志
pm2 logs mms-backend

# 重启服务
pm2 restart mms-backend

# 停止服务
pm2 stop mms-backend

# 设置开机自启
pm2 startup
pm2 save
```

### 4. 使用Nginx反向代理（推荐）

#### Nginx配置示例

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # 前端静态文件
    location / {
        root /path/to/mms/frontend/dist;
        try_files $uri $uri/ /index.html;
    }

    # 后端API代理
    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 5. 数据库备份

定期备份数据库文件：
```bash
# 备份
cp backend/mms.db backend/mms.db.backup

# 恢复
cp backend/mms.db.backup backend/mms.db
```

**建议**: 设置定时任务自动备份数据库

### 6. 安全建议

1. **修改默认管理员密码**
   - 首次登录后立即修改密码

2. **使用HTTPS**
   - 生产环境建议配置SSL证书

3. **防火墙配置**
   - 只开放必要的端口
   - 限制访问来源

4. **定期更新**
   - 定期更新依赖包
   - 关注安全公告

---

## 故障排查

### 问题1: 端口被占用

**错误信息**: `EADDRINUSE: address already in use`

**解决方法**:
1. 查找占用端口的进程：
   ```bash
   # Windows
   netstat -ano | findstr :3000
   
   # Mac/Linux
   lsof -i :3000
   ```
2. 结束进程或修改端口配置

### 问题2: 依赖安装失败

**错误信息**: `npm ERR!` 相关错误

**解决方法**:
1. 清除npm缓存：
   ```bash
   npm cache clean --force
   ```
2. 删除 `node_modules` 和 `package-lock.json`
3. 重新安装：
   ```bash
   npm install
   ```

### 问题3: 数据库初始化失败

**错误信息**: 数据库相关错误

**解决方法**:
1. 检查 `backend/database/` 目录权限
2. 删除 `backend/mms.db` 文件，重新启动
3. 检查磁盘空间是否充足

### 问题4: 前端无法连接后端

**错误信息**: `Network Error` 或 `CORS Error`

**解决方法**:
1. 检查后端服务是否启动
2. 检查 `frontend/vite.config.js` 中的代理配置
3. 检查后端CORS配置（`backend/server.js`）

### 问题5: 登录后提示Token无效

**错误信息**: `访问令牌无效或已过期`

**解决方法**:
1. 清除浏览器缓存和localStorage
2. 检查 `backend/.env` 中的 `JWT_SECRET` 配置
3. 重新登录

### 问题6: 权限不足错误

**错误信息**: `权限不足，无法执行此操作`

**解决方法**:
1. 检查用户角色是否正确
2. 确认操作是否需要特定权限
3. 联系系统管理员

### 问题7: 库存更新不正确

**解决方法**:
1. 检查出入库单的审批状态
2. 查看库存历史记录
3. 检查是否有并发操作冲突

---

## 性能优化

### 数据库优化

1. **定期清理历史数据**
   - 删除过期的库存历史记录
   - 归档旧的出入库单

2. **索引优化**
   - SQLite会自动创建索引
   - 大量数据时考虑添加额外索引

### 前端优化

1. **启用Gzip压缩**
   - 在Nginx中启用Gzip

2. **CDN加速**
   - 将静态资源部署到CDN

3. **代码分割**
   - Vite已自动进行代码分割

---

## 监控与日志

### 后端日志

日志输出到控制台，建议：
- 使用PM2时，日志自动保存
- 或重定向到文件：
  ```bash
  npm start > backend.log 2>&1
  ```

### 前端日志

开发环境日志在浏览器控制台
生产环境建议：
- 集成错误监控服务（如Sentry）
- 记录用户操作日志

---

## 升级指南

### 升级步骤

1. **备份数据**
   ```bash
   cp backend/mms.db backend/mms.db.backup
   ```

2. **备份代码**
   ```bash
   # 使用Git或直接复制整个目录
   ```

3. **更新代码**
   ```bash
   # 拉取最新代码或替换文件
   ```

4. **更新依赖**
   ```bash
   cd backend
   npm install
   
   cd ../frontend
   npm install
   ```

5. **重启服务**
   ```bash
   # 使用PM2
   pm2 restart mms-backend
   ```

---

## 技术支持

如遇到部署问题：
1. 查看本文档的"故障排查"部分
2. 查看 `README.md` 快速开始指南
3. 查看 `API.md` API文档
4. 检查系统日志

---

**最后更新**: 2024年

