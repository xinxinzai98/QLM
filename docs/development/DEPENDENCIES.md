# 依赖项清单

本文档列出了物料管理系统所需的所有依赖项，包括新增的依赖。

## 前端依赖 (frontend/package.json)

### 生产依赖 (dependencies)
- `vue`: ^3.3.4 - Vue 3框架
- `vue-router`: ^4.2.5 - Vue路由
- `pinia`: ^2.1.7 - 状态管理
- `element-plus`: ^2.4.2 - UI组件库
- `axios`: ^1.6.2 - HTTP客户端
- `echarts`: ^5.4.3 - 图表库
- `@element-plus/icons-vue`: ^2.3.1 - Element Plus图标
- `vuedraggable`: ^4.1.0 - **新增** 拖拽排序功能（用于Dashboard个性化定制）

### 开发依赖 (devDependencies)
- `@vitejs/plugin-vue`: ^4.5.0 - Vite Vue插件
- `vite`: ^5.0.5 - 构建工具

## 后端依赖 (backend/package.json)

### 生产依赖 (dependencies)
- `express`: ^4.18.2 - Web框架
- `sqlite3`: ^5.1.6 - SQLite数据库
- `jsonwebtoken`: ^9.0.2 - JWT认证
- `bcryptjs`: ^2.4.3 - 密码加密
- `cors`: ^2.8.5 - CORS中间件
- `dotenv`: ^16.3.1 - 环境变量管理
- `body-parser`: ^1.20.2 - 请求体解析
- `multer`: ^1.4.5-lts.1 - 文件上传
- `compression`: ^1.7.4 - **P1新增** 响应压缩
- `express-rate-limit`: ^7.1.5 - **P1新增** 请求限流
- `express-validator`: ^7.0.1 - **P1新增** 输入验证
- `xlsx`: ^0.18.5 - **P2新增** Excel导出功能

### 开发依赖 (devDependencies)
- `nodemon`: ^3.0.1 - 开发时自动重启

## 安装方法

### 方法1：使用一键启动脚本（推荐）

直接运行 `start.bat`（Windows）或 `start.sh`（Mac/Linux），脚本会自动检查并安装所有依赖。

### 方法2：手动安装

**安装后端依赖：**
```bash
cd backend
npm install
```

**安装前端依赖：**
```bash
cd frontend
npm install
```

## 新增依赖说明

### P1阶段新增（性能和安全优化）
- `compression`: 用于压缩HTTP响应，减少网络传输
- `express-rate-limit`: 用于防止恶意请求和DDoS攻击
- `express-validator`: 用于输入验证，防止注入攻击

### P2阶段新增（功能增强）
- `vuedraggable`: 用于Dashboard模块的拖拽排序功能
- `xlsx`: 用于数据导出为Excel格式

## 依赖检查

运行以下命令检查依赖是否已正确安装：

**检查前端依赖：**
```bash
cd frontend
npm list --depth=0
```

**检查后端依赖：**
```bash
cd backend
npm list --depth=0
```

## 常见问题

### 1. npm install 失败
- 检查Node.js版本（需要 >= 16.0.0）
- 清除npm缓存：`npm cache clean --force`
- 删除node_modules和package-lock.json后重新安装

### 2. 依赖版本冲突
- 使用 `npm install --legacy-peer-deps` 安装
- 或使用 `npm install --force` 强制安装

### 3. 某些依赖无法安装
- 检查网络连接
- 尝试使用国内镜像：`npm config set registry https://registry.npmmirror.com`
- 或使用cnpm：`npm install -g cnpm --registry=https://registry.npmmirror.com`

## 更新记录

- 2025-12-08: 添加P2阶段新增依赖（vuedraggable, xlsx）
- 2025-12-07: 添加P1阶段新增依赖（compression, express-rate-limit, express-validator）





