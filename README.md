# 青绿氢能物料管理系统

**QingGreen Hydrogen Energy Material Management System**

一个功能完整的本地部署物料管理系统，支持化学物料和金属物料的完整生命周期管理。

[![Vue 3](https://img.shields.io/badge/Vue-3.3.4-4FC08D?logo=vue.js)](https://vuejs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-16+-339933?logo=node.js)](https://nodejs.org/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

---

## 🚀 一键启动

**只需双击 `start.bat` (Windows CMD) 或运行 `.\start.ps1` (Windows PowerShell) 或运行 `./start.sh` (Mac/Linux) 即可启动系统！**

### Windows用户

**方式一：使用批处理脚本（推荐）**
```
双击 start.bat 文件
```

**方式二：使用PowerShell脚本**
```powershell
.\start.ps1
```

如果遇到执行策略限制，请先运行：
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Mac/Linux用户
```bash
chmod +x start.sh
./start.sh
```

启动脚本会自动完成：
1. ✅ 检查Node.js环境
2. ✅ 安装前后端依赖（如需要）
3. ✅ 检查并生成环境变量配置（.env文件）
4. ✅ 启动后端服务（端口3000）
5. ✅ 启动前端服务（端口5173）
6. ✅ 自动打开浏览器访问系统

**默认账户**: `admin` / `admin123`

---

## 快速开始

### 默认账户

- **用户名**: `admin`
- **密码**: `admin123`
- **角色**: 系统管理员

## 系统功能

### 核心功能

1. **用户管理**（仅系统管理员）
   - 创建、编辑、删除用户
   - 分配用户角色（系统管理员、库存管理员、普通人员）

2. **物料管理**
   - 物料的增删改查
   - 支持化学物料和金属物料两种类别
   - 库存阈值设置（最低/最高库存）
   - 物料搜索和筛选

3. **出入库管理**
   - 创建出入库单（普通人员）
   - 出入库单审批流程（库存管理员）
   - 自动库存更新
   - 出入库历史记录

4. **仪表盘**
   - 实时统计数据
   - 物料分类图表
   - 出入库趋势分析
   - 低库存预警
   - 待审批单提醒

### 角色权限

- **系统管理员**: 拥有所有功能权限
- **库存管理员**: 可管理物料和审批出入库单
- **普通人员**: 可创建出入库单和查看物料信息

## 技术栈

### 前端
- Vue 3 + Vite
- Element Plus
- Pinia
- ECharts

### 后端
- Node.js + Express
- SQLite3
- JWT认证

## 手动安装（如需要）

### 环境要求
- Node.js >= 16.0.0
- npm >= 8.0.0

### 安装步骤

1. **安装后端依赖**
```bash
cd backend
npm install
```

2. **安装前端依赖**
```bash
cd frontend
npm install
```

3. **启动后端服务**
```bash
cd backend
npm start
```

4. **启动前端服务**（新开一个终端）
```bash
cd frontend
npm run dev
```

5. **访问系统**
打开浏览器访问：http://localhost:5173

## 项目结构

```
物料管理系统/
├── frontend/          # 前端源代码
│   ├── src/           # 源代码目录
│   │   ├── components/    # 公共组件
│   │   ├── layouts/       # 布局组件
│   │   ├── views/         # 页面组件
│   │   ├── router/        # 路由配置
│   │   ├── stores/        # 状态管理
│   │   ├── styles/        # 样式文件
│   │   └── utils/         # 工具函数
│   └── package.json
├── backend/           # 后端源代码
│   ├── routes/        # 路由文件
│   ├── database/      # 数据库相关
│   ├── middleware/    # 中间件
│   └── uploads/       # 上传文件目录
├── docs/              # 文档目录
│   ├── api/           # API文档
│   ├── deployment/    # 部署文档
│   ├── user-guide/    # 用户手册
│   ├── development/   # 开发文档
│   └── reports/       # 审查报告
├── start.bat          # Windows一键启动脚本
├── start.ps1          # Windows PowerShell启动脚本
├── start.sh           # Mac/Linux一键启动脚本
└── README.md          # 本文件
```

## 配置说明

### 后端配置

后端配置文件：`backend/.env`（首次运行请复制 `backend/.env.example` 为 `.env`）

**⚠️ 重要安全提示**：
- 生产环境**必须**设置强JWT密钥（至少32个字符）
- 生成强密钥命令：`node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
- 不要使用默认密钥 `your-super-secret-jwt-key-change-in-production`

```env
PORT=3000
NODE_ENV=development
JWT_SECRET=your-super-secret-jwt-key-change-in-production  # ⚠️ 生产环境必须修改
JWT_EXPIRES_IN=7d
DB_PATH=./database/mms.db
```

### 前端配置

前端代理配置：`frontend/vite.config.js`

默认代理后端API到 `http://localhost:3000`

## 数据库

系统使用SQLite数据库，数据库文件自动创建在 `backend/mms.db`

首次启动时会自动：
- 创建所有数据表
- 创建默认管理员账户（admin/admin123）

## 常见问题

### 端口被占用

如果3000或5173端口被占用，可以：

1. **修改后端端口**：编辑 `backend/.env` 中的 `PORT`
2. **修改前端端口**：编辑 `frontend/vite.config.js` 中的 `server.port`

### 依赖安装失败

尝试清除缓存后重新安装：
```bash
npm cache clean --force
npm install
```

### 数据库初始化失败

删除 `backend/mms.db` 文件后重新启动，系统会自动重新初始化数据库。

## 📚 文档

### 核心文档
- [技术架构文档](docs/TECHNICAL_ARCHITECTURE.md) - 系统架构、数据流、核心模块、设计决策
- [用户管理员手册](docs/USER_ADMIN_MANUAL.md) - 系统使用指南、操作步骤、故障排除

### 开发文档
- [AI开发指南](docs/development/PROJECT_GUIDE_FOR_AI.md) - 面向AI的系统架构和开发指南
- [UI设计系统](docs/development/UI_DESIGN_SYSTEM.md) - 前端设计系统规范
- [依赖管理](docs/development/DEPENDENCIES.md) - 依赖版本和说明

### API文档
- [API接口文档](docs/api/API.md) - 完整的API接口文档

### 部署文档
- [Docker部署到阿里云ECS - 超详细教程](DOCKER_DEPLOYMENT_GUIDE.md) - 🐳 **零基础Docker部署教程（推荐）**
- [快速部署指南](DEPLOYMENT_QUICK_START.md) - 5分钟快速部署（适合有经验的用户）
- [部署指南](docs/deployment/DEPLOYMENT.md) - 详细的部署和配置说明

### 项目报告
- [阶段0：环境与规范同步报告](docs/reports/阶段0_环境与规范同步报告.md)
- [阶段1：代码审查与逻辑重构摘要报告](docs/reports/阶段1_代码审查与逻辑重构摘要报告.md)
- [阶段2：前端风格统一摘要报告](docs/reports/阶段2_前端风格统一摘要报告.md)
- [阶段3：功能完整性验证与错误修复报告](docs/reports/阶段3_功能完整性验证与错误修复报告.md)
- [阶段4：文档工程化构建报告](docs/reports/阶段4_文档工程化构建报告.md)
- [系统优化与演进路线图](docs/reports/系统优化与演进路线图.md)

## 许可证

MIT License

## 支持

如有问题或建议，请查看相关文档或联系开发团队。

