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
   - 物料编码历史追踪（支持非唯一编码）
   - 物料编码变更记录和原因追溯

3. **出入库管理**
   - 创建出入库单（普通人员）
   - 出入库单审批流程（库存管理员）
   - 自动库存更新
   - 出入库历史记录
   - 单价可选（支持不填写单价的出入库）

4. **物料盘点**
   - 创建盘点任务
   - 批量物料盘点录入
   - 自动计算盘盈盘亏
   - 盘点差异报告生成
   - 盘点完成自动更新库存
   - 盘点历史记录查询

5. **仪表盘**
   - 实时统计数据（可点击跳转到对应页面）
   - 物料分类图表
   - 出入库趋势分析
   - 低库存预警
   - 待审批单提醒
   - 实时日期时间显示（支持时间同步）

### 角色权限

- **系统管理员**: 拥有所有功能权限
- **库存管理员**: 可管理物料和审批出入库单
- **普通人员**: 可创建出入库单和查看物料信息

## 技术栈

### 前端
- Vue 3 + Vite
- Element Plus（响应式设计，支持移动端、平板、桌面）
- Pinia（状态管理）
- ECharts（数据可视化）
- Composition API（现代化开发模式）

### 后端
- Node.js + Express
- SQLite3（轻量级数据库）
- JWT认证（安全的用户认证）
- Express中间件（验证、错误处理、日志记录）

### 测试
- Jest（单元测试和集成测试）
- 测试覆盖率统计

### 部署
- Docker & Docker Compose
- 支持开发、测试、生产环境

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
│   ├── src/           # 源代码目录
│   │   ├── api/       # API路由
│   │   ├── database/  # 数据库相关
│   │   ├── middleware/# 中间件
│   │   ├── models/    # 数据模型
│   │   ├── services/  # 业务逻辑层
│   │   └── utils/     # 工具函数
│   ├── __tests__/     # 后端测试文件
│   │   ├── unit/      # 单元测试
│   │   └── integration/ # 集成测试
│   └── uploads/       # 上传文件目录
├── docs/              # 文档目录
│   ├── api/           # API文档
│   ├── deployment/    # 部署文档
│   ├── user-guide/    # 用户手册
│   ├── development/   # 开发文档
│   └── _archive/      # 历史文档归档
├── scripts/           # 脚本目录
│   ├── windows/       # Windows脚本
│   ├── *.sh           # Linux/Mac脚本
│   ├── *.ps1          # PowerShell脚本
│   ├── update.sh      # 代码更新脚本
│   ├── backup.sh      # 数据备份脚本
│   ├── restore.sh     # 数据恢复脚本
│   ├── status.sh      # 服务状态检查脚本
│   └── logs.sh        # 日志查看脚本
├── ops/               # 运维配置
│   └── nginx/         # Nginx配置
├── Dockerfile         # Docker构建文件
├── docker-compose*.yml # Docker Compose配置（dev/test/prod）
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

## 系统特性

### 响应式设计
- ✅ 完整支持移动端、平板、桌面设备
- ✅ 自适应布局和响应式表格
- ✅ 移动端优化的表单和对话框
- ✅ 触摸友好的交互设计

### 安全特性
- ✅ JWT身份认证和授权
- ✅ SQL注入防护（参数化查询）
- ✅ XSS防护（输入验证和输出转义）
- ✅ 文件上传验证
- ✅ 基于角色的访问控制（RBAC）

### 性能优化
- ✅ 前端代码分割和懒加载
- ✅ API响应压缩
- ✅ 数据库查询优化
- ✅ 前端防抖和节流

### 测试覆盖
- ✅ 单元测试（物料计算、权限检查、工具函数）
- ✅ 集成测试（出入库流程、盘点功能、权限切换）
- ✅ 测试覆盖率统计

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

### 运行测试

```bash
# 后端测试
cd backend
npm test

# 查看测试覆盖率
npm run test:unit
npm run test:integration
```

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

### 更多文档
- [文档索引](docs/INDEX.md) - 完整文档导航
- [维护指南](docs/MAINTENANCE.md) - 系统维护和运维指南
- [Git清理指南](docs/GIT_CLEANUP_QUICK_START.md) - Git历史清理快速指南

### 项目优化阶段报告

项目已完成7个阶段的系统性优化：

- [阶段1：项目结构优化](docs/PHASE1_CLEANUP_SUMMARY.md) - 项目结构清理和文档整理
- [阶段2：响应式布局优化](docs/PHASE2_RESPONSIVE_FIX_SUMMARY.md) - 移动端和平板适配
- [阶段3：前端界面优化](docs/PHASE3_FRONTEND_OPTIMIZATION_SUMMARY.md) - 日期时间显示、Dashboard优化
- [阶段4：物料盘点模块](docs/PHASE4_STOCKTAKING_SUMMARY.md) - 完整的盘点功能实现
- [阶段5：业务逻辑优化](docs/PHASE5_BUSINESS_LOGIC_CHANGES_SUMMARY.md) - 物料编码非唯一、单价可选
- [阶段6：代码审计](docs/PHASE6_CODE_AUDIT_REPORT.md) - 安全性和性能审计
- [阶段7：测试实施](docs/PHASE7_TESTING_SUMMARY.md) - 单元测试和集成测试

> **历史报告**：项目历史报告和审查报告已归档到 `docs/_archive/reports/` 目录，可通过文档索引访问。

## 许可证

MIT License

## 支持

如有问题或建议，请查看相关文档或联系开发团队。

