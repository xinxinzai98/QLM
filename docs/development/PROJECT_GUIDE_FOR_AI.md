# 物料管理系统 (MMS) - AI开发指南

## 项目概述

物料管理系统（Material Management System, MMS）是一个基于Web的本地部署物料管理解决方案，支持化学物料和金属物料的完整生命周期管理，包括物料信息管理、出入库流程、审批工作流和数据分析。

## 技术架构

### 前端技术栈
- **框架**: Vue 3 (Composition API)
- **构建工具**: Vite 5
- **UI组件库**: Element Plus 2.4
- **状态管理**: Pinia 2.1
- **路由**: Vue Router 4.2
- **HTTP客户端**: Axios 1.6
- **图表库**: ECharts 5.4

### 后端技术栈
- **运行时**: Node.js
- **Web框架**: Express 4.18
- **数据库**: SQLite3 5.1
- **身份认证**: JWT (jsonwebtoken 9.0)
- **密码加密**: bcryptjs 2.4

### 项目结构

```
物料管理系统/
├── frontend/                 # 前端项目
│   ├── src/
│   │   ├── views/           # 页面组件
│   │   │   ├── Login.vue           # 登录页
│   │   │   ├── Dashboard.vue       # 仪表盘
│   │   │   ├── Materials.vue       # 物料管理
│   │   │   ├── Inventory.vue       # 出入库管理
│   │   │   └── Users.vue           # 用户管理（仅系统管理员）
│   │   ├── layouts/         # 布局组件
│   │   │   └── MainLayout.vue      # 主布局（侧边栏+头部+内容区）
│   │   ├── router/          # 路由配置
│   │   │   └── index.js            # 路由定义和权限守卫
│   │   ├── stores/          # Pinia状态管理
│   │   │   └── user.js             # 用户状态（登录、角色、权限）
│   │   ├── utils/           # 工具函数
│   │   │   └── api.js              # Axios封装（请求/响应拦截器）
│   │   ├── App.vue          # 根组件
│   │   └── main.js          # 入口文件
│   ├── index.html           # HTML模板
│   ├── vite.config.js       # Vite配置
│   └── package.json         # 前端依赖
│
├── backend/                  # 后端项目
│   ├── routes/              # 路由模块
│   │   ├── authRoutes.js           # 认证路由（登录、注册、获取当前用户）
│   │   ├── materialRoutes.js       # 物料路由（CRUD）
│   │   ├── inventoryRoutes.js     # 出入库路由（创建、审批、查询）
│   │   ├── dashboardRoutes.js     # 仪表盘路由（统计数据、图表数据）
│   │   └── userRoutes.js           # 用户管理路由（仅系统管理员）
│   ├── middleware/          # 中间件
│   │   └── authMiddleware.js       # JWT认证和角色权限检查
│   ├── database/            # 数据库模块
│   │   └── database.js             # SQLite连接、表初始化、默认管理员创建
│   ├── server.js            # Express服务器入口
│   ├── package.json         # 后端依赖
│   └── mms.db               # SQLite数据库文件（自动生成）
│
└── 文档/
    ├── README.md                    # 项目说明和快速启动指南
    ├── PROJECT_GUIDE_FOR_AI.md     # 本文件（AI开发指南）
    ├── USER_MANUAL.md              # 用户操作手册
    ├── DEPLOYMENT.md               # 部署指南
    └── API.md                      # API接口文档
```

## 核心业务逻辑

### 1. 用户角色与权限体系

系统定义了三种角色，每种角色具有不同的权限：

- **系统管理员 (system_admin)**
  - 权限：所有功能
  - 可操作：用户管理、物料管理、出入库审批、查看所有数据

- **库存管理员 (inventory_manager)**
  - 权限：物料管理和出入库审批
  - 可操作：创建/编辑物料、审批出入库单、查看待审批单

- **普通人员 (regular_user)**
  - 权限：创建出入库单
  - 可操作：创建出入库单、查看自己创建的出入库单、查看物料列表

**权限控制实现位置：**
- 前端：`frontend/src/router/index.js` (路由守卫)、各视图组件的 `v-if` 指令
- 后端：`backend/middleware/authMiddleware.js` (checkRole中间件)

### 2. 物料管理流程

**数据模型：**
- 物料编码（唯一）
- 物料名称
- 类别（chemical/metal）
- 单位（kg、L、个等）
- 当前库存
- 最低/最高库存阈值
- 存放位置
- 描述信息

**CRUD操作：**
- 创建：系统管理员或库存管理员可创建物料
- 查询：所有登录用户可查看物料列表和详情
- 更新：系统管理员或库存管理员可编辑物料信息（除物料编码外）
- 删除：仅系统管理员可删除物料（需检查是否有相关出入库记录）

**实现位置：**
- 前端：`frontend/src/views/Materials.vue`
- 后端：`backend/routes/materialRoutes.js`

### 3. 出入库流程

**流程步骤：**
1. **创建出入库单**：普通人员或系统管理员创建出入库单（类型：in/out）
2. **提交审批**：系统自动将单据状态设为 `pending`
3. **审批处理**：库存管理员或系统管理员审批（approve/reject）
4. **库存更新**：审批通过后，系统自动更新物料库存
   - 入库：`current_stock += quantity`
   - 出库：`current_stock -= quantity`（需检查库存是否充足）
5. **历史记录**：每次库存变更都会记录到 `stock_history` 表

**数据模型：**
- 单号（自动生成，格式：IN/OUT + 时间戳 + 随机数）
- 类型（in/out）
- 物料ID
- 数量
- 单价（可选）
- 总金额（自动计算）
- 申请人ID
- 审批人ID
- 状态（pending/approved/rejected/cancelled）
- 备注

**实现位置：**
- 前端：`frontend/src/views/Inventory.vue`
- 后端：`backend/routes/inventoryRoutes.js`

### 4. 仪表盘数据

**统计指标：**
- 物料总数
- 待审批单数
- 今日出入库单数
- 低库存物料数（current_stock <= min_stock）

**图表数据：**
- 物料分类统计（饼图）：按 chemical/metal 分类统计数量和库存
- 最近30天出入库趋势（折线图）：按日期和类型统计

**实现位置：**
- 前端：`frontend/src/views/Dashboard.vue` (ECharts图表)
- 后端：`backend/routes/dashboardRoutes.js`

## 数据流

### 认证流程
```
用户登录 → POST /api/auth/login
  ↓
后端验证用户名密码 → 生成JWT Token
  ↓
前端存储Token到localStorage
  ↓
后续请求在Header中携带: Authorization: Bearer <token>
  ↓
后端中间件验证Token → 解析用户信息到 req.user
```

### 出入库审批流程
```
普通用户创建出入库单 → POST /api/inventory
  ↓
后端创建记录，状态=pending
  ↓
库存管理员查看待审批单 → GET /api/inventory?status=pending
  ↓
审批操作 → PUT /api/inventory/:id/approve
  ↓
后端检查库存（出库时）→ 更新物料库存 → 记录库存历史 → 更新单据状态
```

## 核心模块职责

### 前端模块

**1. router/index.js**
- 定义所有路由
- 实现路由守卫（检查登录状态和角色权限）
- 未登录用户重定向到登录页
- 权限不足用户重定向到仪表盘

**2. stores/user.js**
- 管理用户登录状态
- 存储用户信息和Token
- 提供角色判断方法（isSystemAdmin、isInventoryManager等）
- 处理登录、登出、获取当前用户信息

**3. utils/api.js**
- 封装Axios实例
- 请求拦截器：自动添加Authorization Header
- 响应拦截器：统一错误处理（401跳转登录、403提示权限不足）

**4. views/Dashboard.vue**
- 展示统计卡片
- 使用ECharts渲染图表
- 显示低库存物料列表和待审批单列表

**5. views/Materials.vue**
- 物料列表展示（支持搜索、分页、筛选）
- 物料CRUD操作（根据角色显示/隐藏按钮）
- 表单验证

**6. views/Inventory.vue**
- 出入库单列表展示
- 创建出入库单（普通用户）
- 审批出入库单（库存管理员）
- 取消出入库单（申请人）

### 后端模块

**1. database/database.js**
- 初始化SQLite数据库连接
- 创建所有数据表（users、materials、inventory_transactions、stock_history）
- 创建默认管理员账户（admin/admin123）
- 启用外键约束

**2. middleware/authMiddleware.js**
- `authenticateToken`: 验证JWT Token，解析用户信息
- `checkRole`: 检查用户角色是否在允许的角色列表中

**3. routes/authRoutes.js**
- POST /register: 用户注册（需要认证，仅系统管理员可注册其他用户）
- POST /login: 用户登录
- GET /me: 获取当前用户信息

**4. routes/materialRoutes.js**
- GET /: 获取物料列表（支持分页、搜索、筛选）
- GET /:id: 获取物料详情
- POST /: 创建物料（需要system_admin或inventory_manager角色）
- PUT /:id: 更新物料（需要system_admin或inventory_manager角色）
- DELETE /:id: 删除物料（仅system_admin）

**5. routes/inventoryRoutes.js**
- POST /: 创建出入库单（所有登录用户）
- GET /: 获取出入库单列表（根据角色过滤）
- GET /:id: 获取出入库单详情
- PUT /:id/approve: 审批出入库单（inventory_manager或system_admin）
- PUT /:id/cancel: 取消出入库单（仅申请人）

**6. routes/dashboardRoutes.js**
- GET /stats: 获取统计数据
- GET /materials-by-category: 获取物料分类统计
- GET /transaction-trend: 获取最近30天出入库趋势
- GET /low-stock-materials: 获取低库存物料列表
- GET /pending-transactions: 获取待审批单列表

## 扩展方式

### 添加新的物料类别
1. 修改数据库约束：`backend/database/database.js` 中 materials 表的 category 字段 CHECK 约束
2. 修改前端选项：`frontend/src/views/Materials.vue` 中的 el-select 选项
3. 修改后端验证：`backend/routes/materialRoutes.js` 中的类别验证逻辑

### 添加新的用户角色
1. 修改数据库约束：`backend/database/database.js` 中 users 表的 role 字段 CHECK 约束
2. 修改中间件映射：`backend/middleware/authMiddleware.js` 中的 roleMap
3. 修改前端角色判断：`frontend/src/stores/user.js` 中添加新的 computed 属性
4. 修改路由权限：`frontend/src/router/index.js` 和相关视图组件

### 添加新的统计指标
1. 后端：在 `backend/routes/dashboardRoutes.js` 中添加新的路由
2. 前端：在 `frontend/src/views/Dashboard.vue` 中调用新接口并展示数据

### 添加新的审批流程
1. 修改 `inventory_transactions` 表结构，添加新的状态字段或审批步骤字段
2. 修改 `backend/routes/inventoryRoutes.js` 中的审批逻辑
3. 修改前端审批界面：`frontend/src/views/Inventory.vue`

## 数据库设计

### users 表
- id: 主键
- username: 用户名（唯一）
- password: 加密后的密码
- role: 角色（system_admin/inventory_manager/regular_user）
- real_name: 真实姓名
- email: 邮箱
- created_at/updated_at: 时间戳

### materials 表
- id: 主键
- material_code: 物料编码（唯一）
- material_name: 物料名称
- category: 类别（chemical/metal）
- unit: 单位
- current_stock: 当前库存
- min_stock/max_stock: 库存阈值
- location: 存放位置
- description: 描述
- created_by: 创建人ID（外键）
- created_at/updated_at: 时间戳

### inventory_transactions 表
- id: 主键
- transaction_code: 单号（唯一）
- transaction_type: 类型（in/out）
- material_id: 物料ID（外键）
- quantity: 数量
- unit_price: 单价
- total_amount: 总金额
- applicant_id: 申请人ID（外键）
- approver_id: 审批人ID（外键）
- status: 状态（pending/approved/rejected/cancelled）
- remark: 备注
- created_at/updated_at/approved_at: 时间戳

### stock_history 表
- id: 主键
- material_id: 物料ID（外键）
- transaction_id: 出入库单ID（外键，可为空）
- change_type: 变更类型（in/out/adjust）
- quantity_change: 数量变更
- stock_before: 变更前库存
- stock_after: 变更后库存
- operator_id: 操作人ID（外键）
- remark: 备注
- created_at: 时间戳

## 常见问题排查

### 前端无法连接后端
- 检查后端是否启动（默认端口3000）
- 检查 `frontend/vite.config.js` 中的 proxy 配置
- 检查后端CORS配置（`backend/server.js`）

### 登录后提示Token无效
- 检查 `backend/.env` 中的 JWT_SECRET 配置
- 检查前端是否正确存储Token
- 检查请求Header中是否正确携带Token

### 权限不足错误
- 检查用户角色是否正确
- 检查路由权限配置（前端和后端）
- 检查中间件是否正确应用

### 数据库初始化失败
- 检查SQLite3是否已安装
- 检查 `backend/database/` 目录是否有写权限
- 检查数据库文件是否被其他进程占用

## 开发建议

1. **代码风格**：使用描述性极强的英文命名，关键逻辑添加清晰注释
2. **错误处理**：前后端都要有完善的错误处理和用户提示
3. **数据验证**：前后端都要进行数据验证，后端验证是必须的
4. **安全性**：密码必须加密存储，敏感操作需要权限检查
5. **用户体验**：加载状态、操作反馈、表单验证提示要完善

