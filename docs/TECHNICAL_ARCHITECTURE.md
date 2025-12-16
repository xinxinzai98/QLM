# 技术架构文档

**项目名称**: 清绿氢能物料管理系统 (QingGreen Hydrogen Energy Material Management System)  
**版本**: 1.0.0  
**最后更新**: 2025年12月

---

## 目录

1. [系统概述](#系统概述)
2. [系统架构](#系统架构)
3. [技术栈](#技术栈)
4. [系统层次结构](#系统层次结构)
5. [数据流](#数据流)
6. [核心模块](#核心模块)
7. [关键设计决策](#关键设计决策)
8. [安全架构](#安全架构)
9. [性能优化](#性能优化)
10. [扩展性设计](#扩展性设计)

---

## 系统概述

清绿氢能物料管理系统是一个基于Web的物料管理解决方案，支持化学物料和金属物料的完整生命周期管理。系统采用前后端分离架构，前端使用Vue 3构建，后端使用Node.js + Express，数据库使用SQLite3。

### 核心功能

- **用户认证与权限管理**: 基于JWT的双令牌认证机制，支持三种角色权限体系
- **物料管理**: 物料的增删改查、搜索筛选、批量操作
- **出入库管理**: 出入库单创建、审批流程、库存自动更新
- **物料盘点**: 盘点任务创建、实际数量录入、差异分析、报告生成
- **数据分析**: 仪表盘统计、图表展示、趋势分析
- **操作审计**: 完整的操作日志记录
- **消息通知**: 待办任务通知、系统公告

---

## 系统架构

### 整体架构图

```
┌─────────────────────────────────────────────────────────────┐
│                        前端层 (Frontend)                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Vue 3      │  │  Element Plus │  │   Pinia      │     │
│  │ Composition  │  │   UI组件库    │  │  状态管理    │     │
│  │    API       │  │              │  │              │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ Vue Router   │  │    Axios     │  │   ECharts    │     │
│  │   路由管理   │  │  HTTP客户端  │  │   图表库     │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
                            ↕ HTTP/REST API
┌─────────────────────────────────────────────────────────────┐
│                        后端层 (Backend)                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Express    │  │  Middleware  │  │   Routes     │     │
│  │  Web框架     │  │   中间件     │  │   路由层     │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   JWT        │  │  Validators  │  │  Helpers     │     │
│  │   认证       │  │   验证器    │  │   工具函数   │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
                            ↕ SQL
┌─────────────────────────────────────────────────────────────┐
│                        数据层 (Database)                      │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              SQLite3 数据库                            │  │
│  │  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐        │  │
│  │  │ users  │ │materials│ │inventory│ │stock...│        │  │
│  │  └────────┘ └────────┘ └────────┘ └────────┘        │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### 架构模式

- **前端**: MVVM模式（Model-View-ViewModel）
- **后端**: MVC模式（Model-View-Controller）
- **通信**: RESTful API
- **数据存储**: 关系型数据库（SQLite3）

---

## 技术栈

### 前端技术栈

| 技术 | 版本 | 用途 |
|------|------|------|
| Vue | ^3.3.4 | 核心框架（Composition API） |
| Vite | ^5.0.5 | 构建工具和开发服务器 |
| Vue Router | ^4.2.5 | 路由管理和导航守卫 |
| Pinia | ^2.1.7 | 状态管理（替代Vuex） |
| Element Plus | ^2.4.2 | UI组件库 |
| Axios | ^1.6.2 | HTTP客户端 |
| ECharts | ^5.4.3 | 数据可视化图表库 |
| @element-plus/icons-vue | ^2.3.1 | 图标库 |

### 后端技术栈

| 技术 | 版本 | 用途 |
|------|------|------|
| Node.js | >=16.0.0 | 运行时环境 |
| Express | ^4.18.2 | Web框架 |
| SQLite3 | ^5.1.6 | 数据库 |
| jsonwebtoken | ^9.0.2 | JWT认证 |
| bcryptjs | ^2.4.3 | 密码加密 |
| cors | ^2.8.5 | 跨域支持 |
| dotenv | ^16.3.1 | 环境变量管理 |
| body-parser | ^1.20.2 | 请求体解析 |
| multer | ^1.4.5-lts.1 | 文件上传 |
| compression | ^1.7.4 | 响应压缩 |
| express-rate-limit | ^7.1.5 | 请求限流 |
| express-validator | ^7.0.1 | 输入验证 |
| xlsx | ^0.18.5 | Excel文件生成 |

---

## 系统层次结构

### 前端层次结构

```
frontend/
├── src/
│   ├── views/              # 页面组件层
│   │   ├── Login.vue              # 登录页
│   │   ├── Dashboard.vue          # 仪表盘
│   │   ├── Materials.vue          # 物料管理
│   │   ├── Inventory.vue          # 出入库管理
│   │   ├── Stocktaking.vue        # 物料盘点
│   │   ├── Users.vue              # 用户管理
│   │   ├── Profile.vue            # 个人中心
│   │   ├── OperationLogs.vue      # 操作日志
│   │   ├── Settings.vue           # 系统设置
│   │   └── Help.vue               # 帮助中心
│   │
│   ├── layouts/            # 布局组件层
│   │   └── MainLayout.vue         # 主布局（侧边栏+头部+内容区）
│   │
│   ├── components/         # 公共组件层
│   │   ├── Breadcrumb.vue         # 面包屑导航
│   │   ├── GlobalSearch.vue       # 全局搜索
│   │   ├── NotificationCenter.vue # 消息中心
│   │   └── DashboardCustomizer.vue # 仪表盘自定义
│   │
│   ├── router/             # 路由层
│   │   └── index.js               # 路由定义和权限守卫
│   │
│   ├── stores/             # 状态管理层
│   │   └── user.js                # 用户状态（登录、角色、权限）
│   │
│   ├── utils/              # 工具函数层
│   │   ├── api.js                 # Axios封装（请求/响应拦截器）
│   │   ├── errorHandler.js        # 统一错误处理
│   │   └── debounce.js            # 防抖函数
│   │
│   ├── styles/             # 样式层
│   │   ├── tokens.css             # 设计令牌（颜色、字体、间距）
│   │   ├── components.css          # 组件样式覆盖
│   │   ├── global.css              # 全局样式
│   │   └── theme-dark.css         # 暗色主题
│   │
│   ├── App.vue             # 根组件
│   └── main.js             # 入口文件
│
├── index.html              # HTML模板
├── vite.config.js          # Vite配置
└── package.json            # 依赖配置
```

### 后端层次结构

```
backend/
├── routes/                 # 路由层
│   ├── authRoutes.js              # 认证路由（登录、注册、刷新Token）
│   ├── materialRoutes.js          # 物料路由（CRUD）
│   ├── inventoryRoutes.js         # 出入库路由（创建、审批、查询）
│   ├── stocktakingRoutes.js       # 盘点路由（任务、明细、报告）
│   ├── dashboardRoutes.js         # 仪表盘路由（统计数据、图表数据）
│   ├── userRoutes.js              # 用户管理路由（仅系统管理员）
│   ├── profileRoutes.js           # 个人中心路由（信息、头像）
│   ├── operationLogRoutes.js      # 操作日志路由
│   ├── notificationRoutes.js      # 通知路由
│   ├── searchRoutes.js            # 全局搜索路由
│   └── exportRoutes.js            # 数据导出路由
│
├── middleware/             # 中间件层
│   ├── authMiddleware.js          # JWT认证和角色权限检查
│   └── validators.js              # 输入验证器（express-validator）
│
├── database/               # 数据库层
│   └── database.js                # SQLite连接、表初始化、默认管理员创建
│
├── utils/                  # 工具函数层
│   ├── dbHelper.js                # 数据库操作封装（Promise化）
│   └── notificationHelper.js      # 通知创建辅助函数
│
├── uploads/                # 文件存储层
│   └── avatars/                   # 用户头像存储目录
│
├── server.js               # 服务器入口
├── .env                    # 环境变量配置
└── package.json            # 依赖配置
```

---

## 数据流

### 1. 用户认证流程

```
┌─────────┐                    ┌─────────┐                    ┌─────────┐
│  前端   │                    │  后端   │                    │ 数据库  │
└────┬────┘                    └────┬────┘                    └────┬────┘
     │                               │                               │
     │  1. POST /api/auth/login      │                               │
     │     {username, password}      │                               │
     ├──────────────────────────────>│                               │
     │                               │  2. 查询用户                  │
     │                               ├──────────────────────────────>│
     │                               │  3. 验证密码 (bcrypt)        │
     │                               │<──────────────────────────────┤
     │                               │  4. 生成JWT Token             │
     │                               │     (Access + Refresh)        │
     │  5. 返回Token                 │                               │
     │<──────────────────────────────┤                               │
     │  6. 存储Token到localStorage    │                               │
     │  7. 存储用户信息到Pinia Store │                               │
     │                               │                               │
```

### 2. API请求流程（带Token刷新）

```
┌─────────┐                    ┌─────────┐                    ┌─────────┐
│  前端   │                    │  后端   │                    │ 数据库  │
└────┬────┘                    └────┬────┘                    └────┬────┘
     │                               │                               │
     │  1. 请求API (带Access Token)  │                               │
     ├──────────────────────────────>│                               │
     │                               │  2. 验证Token                 │
     │                               │                               │
     │  3a. Token有效                │                               │
     │<──────────────────────────────┤                               │
     │                               │                               │
     │  3b. Token过期 (401)          │                               │
     │<──────────────────────────────┤                               │
     │  4. 自动刷新Token              │                               │
     │     POST /api/auth/refresh    │                               │
     │     {refreshToken}            │                               │
     ├──────────────────────────────>│                               │
     │                               │  5. 验证Refresh Token        │
     │                               ├──────────────────────────────>│
     │                               │  6. 生成新Access Token        │
     │  7. 返回新Token                │                               │
     │<──────────────────────────────┤                               │
     │  8. 重试原始请求               │                               │
     ├──────────────────────────────>│                               │
     │                               │                               │
```

### 3. 出入库审批流程

```
┌──────────┐                  ┌──────────┐                  ┌──────────┐
│普通用户  │                  │  后端    │                  │ 数据库   │
└────┬─────┘                  └────┬─────┘                  └────┬─────┘
     │                            │                              │
     │  1. 创建出入库单            │                              │
     │     POST /api/inventory    │                              │
     ├───────────────────────────>│                              │
     │                            │  2. 检查物料存在              │
     │                            ├──────────────────────────────>│
     │                            │  3. 检查库存（出库时）         │
     │                            │<──────────────────────────────┤
     │                            │  4. 创建出入库单记录           │
     │                            │     (status='pending')        │
     │                            ├──────────────────────────────>│
     │                            │  5. 创建通知（异步）           │
     │                            │<──────────────────────────────┤
     │  6. 返回成功                │                              │
     │<───────────────────────────┤                              │
     │                            │                              │
┌──────────┐                  ┌──────────┐                  ┌──────────┐
│库存管理员│                  │  后端    │                  │ 数据库   │
└────┬─────┘                  └────┬─────┘                  └────┬─────┘
     │                            │                              │
     │  7. 查看待审批单            │                              │
     │     GET /api/inventory?    │                              │
     │         status=pending     │                              │
     ├───────────────────────────>│                              │
     │                            │  8. 查询待审批单              │
     │                            ├──────────────────────────────>│
     │  9. 返回待审批单列表        │                              │
     │<───────────────────────────┤                              │
     │                            │                              │
     │  10. 审批操作               │                              │
     │      PUT /api/inventory/   │                              │
     │          :id/approve       │                              │
     ├───────────────────────────>│                              │
     │                            │  11. 查询出入库单             │
     │                            ├──────────────────────────────>│
     │                            │  12. 更新物料库存             │
     │                            │<──────────────────────────────┤
     │                            │  13. 记录库存历史             │
     │                            ├──────────────────────────────>│
     │                            │  14. 更新出入库单状态         │
     │                            │<──────────────────────────────┤
     │  15. 返回审批结果           │                              │
     │<───────────────────────────┤                              │
     │                            │                              │
```

### 4. 数据查询流程（并行优化）

```
┌─────────┐                    ┌─────────┐                    ┌─────────┐
│  前端   │                    │  后端   │                    │ 数据库  │
└────┬────┘                    └────┬────┘                    └────┬────┘
     │                               │                               │
     │  1. GET /api/materials?      │                               │
     │     page=1&pageSize=10       │                               │
     ├──────────────────────────────>│                               │
     │                               │  2. 并行查询                  │
     │                               │     ├─ COUNT(*)              │
     │                               │     └─ SELECT * LIMIT...     │
     │                               │     (Promise.all)             │
     │                               ├──────────────────────────────>│
     │                               │                               │
     │                               │  3. 返回结果                 │
     │                               │<──────────────────────────────┤
     │  4. 返回分页数据              │                               │
     │     {list, total, page}      │                               │
     │<──────────────────────────────┤                               │
     │                               │                               │
```

---

## 核心模块

### 前端核心模块

#### 1. 路由模块 (`router/index.js`)

**职责：**
- 定义所有路由路径
- 实现路由守卫（检查登录状态）
- 实现权限守卫（检查角色权限）
- 未登录用户重定向到登录页
- 权限不足用户重定向到仪表盘

**关键代码：**
```javascript
// 路由守卫
router.beforeEach((to, from, next) => {
  const userStore = useUserStore();
  
  // 检查登录状态
  if (!userStore.isLoggedIn && to.path !== '/login') {
    next('/login');
    return;
  }
  
  // 检查权限
  if (to.meta.requiresRole && !userStore.hasRole(to.meta.requiresRole)) {
    next('/dashboard');
    return;
  }
  
  next();
});
```

#### 2. 状态管理模块 (`stores/user.js`)

**职责：**
- 管理用户登录状态
- 存储Access Token和Refresh Token
- 存储用户信息（角色、权限）
- 提供角色判断方法（isSystemAdmin、isInventoryManager等）
- 处理登录、登出、获取当前用户信息

**关键数据结构：**
```javascript
{
  accessToken: string,
  refreshToken: string,
  user: {
    id: number,
    username: string,
    role: 'system_admin' | 'inventory_manager' | 'regular_user',
    real_name: string,
    email: string,
    avatar: string
  }
}
```

#### 3. API封装模块 (`utils/api.js`)

**职责：**
- 封装Axios实例
- 请求拦截器：自动添加Authorization Header
- 响应拦截器：统一错误处理
- Token自动刷新机制
- 401/403/500错误统一处理

**关键代码：**
```javascript
// 请求拦截器
api.interceptors.request.use((config) => {
  const userStore = useUserStore();
  if (userStore.accessToken) {
    config.headers.Authorization = `Bearer ${userStore.accessToken}`;
  }
  return config;
});

// 响应拦截器 - Token自动刷新
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // 尝试刷新Token
      const userStore = useUserStore();
      if (userStore.refreshToken && !error.config._retry) {
        error.config._retry = true;
        try {
          const refreshResponse = await api.post('/auth/refresh', {
            refreshToken: userStore.refreshToken
          });
          userStore.setAccessToken(refreshResponse.data.data.accessToken);
          error.config.headers.Authorization = `Bearer ${refreshResponse.data.data.accessToken}`;
          return api(error.config);
        } catch (refreshError) {
          userStore.logout();
          router.push('/login');
        }
      }
    }
    return Promise.reject(error);
  }
);
```

#### 4. 错误处理模块 (`utils/errorHandler.js`)

**职责：**
- 统一错误处理函数
- 根据错误类型显示用户友好的提示
- 区分网络错误、业务错误、服务器错误

**关键代码：**
```javascript
export function handleApiError(error, defaultMessage = '操作失败，请稍后重试') {
  if (error.response) {
    const status = error.response.status;
    let message = defaultMessage;
    
    if (status === 400) {
      message = error.response.data.message || '请求参数错误';
    } else if (status === 401) {
      message = '登录已过期，请重新登录';
    } else if (status === 403) {
      message = '权限不足';
    } else if (status === 404) {
      message = '请求的资源不存在';
    } else if (status >= 500) {
      message = '服务器错误，请稍后重试';
    } else {
      message = error.response.data.message || defaultMessage;
    }
    
    ElMessage.error(message);
  } else if (error.message) {
    ElMessage.error(error.message);
  } else {
    ElMessage.error(defaultMessage);
  }
  
  console.error('Error details:', error);
}
```

### 后端核心模块

#### 1. 认证中间件 (`middleware/authMiddleware.js`)

**职责：**
- JWT Token验证
- 用户信息解析到 `req.user`
- 角色权限检查（checkRole）

**关键代码：**
```javascript
// Token验证
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ success: false, message: '未提供认证令牌' });
  }
  
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ success: false, message: '令牌无效或已过期' });
    }
    req.user = user;
    next();
  });
};

// 角色权限检查
const checkRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: '权限不足' });
    }
    next();
  };
};
```

#### 2. 数据库操作封装 (`utils/dbHelper.js`)

**职责：**
- 将SQLite回调API转换为Promise
- 提供统一的数据库操作接口
- 简化async/await使用

**关键代码：**
```javascript
const dbGet = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) {
        reject(err);
      } else {
        resolve(row || {});
      }
    });
  });
};

const dbAll = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows || []);
      }
    });
  });
};

const dbRun = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) {
        reject(err);
      } else {
        resolve({
          lastID: this.lastID,
          changes: this.changes
        });
      }
    });
  });
};
```

#### 3. 通知辅助模块 (`utils/notificationHelper.js`)

**职责：**
- 创建审批通知
- 查询相关审批人
- 批量创建通知

**关键代码：**
```javascript
const createApprovalNotifications = async (transactionId, transactionType, materialName, quantity, unit) => {
  try {
    const approvers = await dbAll(
      `SELECT id FROM users WHERE role IN ('inventory_manager', 'system_admin')`
    );

    if (approvers && approvers.length > 0) {
      const notificationPromises = approvers.map(approver =>
        dbRun(
          `INSERT INTO notifications (user_id, type, title, content, link, link_type)
           VALUES (?, 'todo', ?, ?, ?, 'transaction')`,
          [
            approver.id,
            `待审批${transactionType === 'in' ? '入库' : '出库'}单`,
            `物料 ${materialName} 的${transactionType === 'in' ? '入库' : '出库'}申请待审批，数量：${quantity} ${unit}`,
            `/inventory?id=${transactionId}`
          ]
        ).catch(err => {
          console.error(`创建通知失败 (用户ID: ${approver.id}):`, err);
          return null;
        })
      );
      await Promise.all(notificationPromises);
    }
  } catch (error) {
    console.error('创建审批通知失败:', error);
  }
};
```

---

## 关键设计决策

### 1. 前后端分离架构

**决策：** 采用前后端分离架构，前端和后端独立开发和部署。

**原因：**
- 提高开发效率（前后端可并行开发）
- 提高可维护性（职责清晰）
- 支持多端复用（Web、移动端可共用API）
- 便于扩展（可独立扩展前端或后端）

### 2. JWT双令牌认证机制

**决策：** 使用Access Token + Refresh Token双令牌机制。

**原因：**
- **安全性**: Access Token短期有效（1小时），减少泄露风险
- **用户体验**: Refresh Token长期有效（30天），减少频繁登录
- **可扩展性**: 支持Token撤销、黑名单等高级功能

**实现：**
- Access Token: 1小时有效期，用于API请求
- Refresh Token: 30天有效期，用于刷新Access Token
- 自动刷新机制：前端检测到401错误时自动刷新Token

### 3. SQLite数据库选择

**决策：** 使用SQLite3作为数据库。

**原因：**
- **简单性**: 无需单独的数据库服务器，文件数据库
- **轻量级**: 适合中小型应用
- **零配置**: 开箱即用，无需额外配置
- **本地部署**: 符合项目本地部署需求

**限制：**
- 并发写入性能有限（适合中小型应用）
- 不支持分布式部署（单文件数据库）

### 4. 设计令牌系统（Design Tokens）

**决策：** 使用CSS自定义属性（CSS Variables）实现设计令牌系统。

**原因：**
- **统一性**: 所有颜色、字体、间距统一管理
- **可维护性**: 修改设计令牌即可全局更新
- **可扩展性**: 支持主题切换（浅色/深色）
- **一致性**: 强制使用设计令牌，避免硬编码

**实现：**
- 颜色系统：50-900色阶
- 字体系统：基于1.25x倍数的字体大小
- 间距系统：基于8px基准的间距
- 阴影系统：6级阴影（xs到xl）

### 5. 异步/等待模式（Async/Await）

**决策：** 后端路由全面使用async/await替代嵌套回调。

**原因：**
- **可读性**: 代码更清晰，易于理解
- **错误处理**: 统一的try/catch错误处理
- **维护性**: 减少回调地狱，便于维护

**实现：**
- 使用 `dbHelper.js` 将SQLite回调API转换为Promise
- 所有路由函数使用async/await
- 并行查询使用 `Promise.all`

### 6. 统一错误处理

**决策：** 前端和后端都实现统一的错误处理机制。

**原因：**
- **用户体验**: 所有错误都有明确的用户提示
- **可维护性**: 错误处理逻辑集中管理
- **一致性**: 错误提示格式统一

**实现：**
- 前端：`errorHandler.js` 统一错误处理函数
- 后端：全局错误处理中间件
- API响应格式统一：`{success, message, data}`

---

## 安全架构

### 1. 认证机制

**JWT双令牌机制：**
- Access Token: 1小时有效期，存储在localStorage
- Refresh Token: 30天有效期，存储在localStorage
- Token刷新：自动刷新机制，无需用户重新登录

**密码安全：**
- 使用bcryptjs加密（10轮加密）
- 密码不存储明文
- 密码最小长度：6位

### 2. 权限控制

**三层权限体系：**
- **系统管理员 (system_admin)**: 所有权限
- **库存管理员 (inventory_manager)**: 物料管理、审批权限
- **普通人员 (regular_user)**: 创建出入库单、查看权限

**权限检查：**
- 前端：路由守卫 + 组件级权限控制
- 后端：中间件级权限检查（checkRole）

### 3. 输入验证

**验证机制：**
- 使用express-validator进行统一验证
- 前端表单验证（Element Plus Form验证）
- 后端API参数验证

**验证内容：**
- 必填字段检查
- 数据类型验证
- 长度限制
- 格式验证（邮箱、日期等）

### 4. 安全措施

**已实现的安全措施：**
- ✅ 请求限流（express-rate-limit）
- ✅ 响应压缩（compression）
- ✅ CORS配置
- ✅ 环境变量管理（.env文件）
- ✅ JWT_SECRET强制要求（生产环境）
- ✅ 错误信息不泄露敏感信息（生产环境）

---

## 性能优化

### 1. 数据库查询优化

**并行查询：**
- 使用 `Promise.all` 并行执行多个查询
- 例如：分页查询时，同时查询总数和列表数据

**索引优化：**
- 为常用查询字段创建索引
- 例如：物料编码、用户名、出入库单号等

### 2. 前端性能优化

**代码分割：**
- 路由级别的代码分割（Vite自动处理）
- 按需加载组件

**响应式优化：**
- 使用防抖（debounce）减少API请求
- 表格分页减少数据量

### 3. 网络优化

**响应压缩：**
- 使用compression中间件压缩响应
- 减少网络传输量

**请求限流：**
- 使用express-rate-limit防止DDoS
- 限制API请求频率

---

## 扩展性设计

### 1. 模块化设计

**前端模块化：**
- 组件化开发（单文件组件）
- 工具函数模块化
- 样式模块化（设计令牌系统）

**后端模块化：**
- 路由模块化（按功能划分）
- 中间件模块化
- 工具函数模块化

### 2. 可扩展性

**数据库扩展：**
- 表结构设计支持扩展字段
- 支持迁移到PostgreSQL/MySQL（如需要）

**API扩展：**
- RESTful API设计，易于扩展
- 统一的响应格式

**功能扩展：**
- 插件化设计（如需要）
- 配置化设计（环境变量）

---

## 总结

本系统采用前后端分离架构，使用Vue 3 + Node.js技术栈，实现了完整的物料管理功能。系统设计注重安全性、可维护性和可扩展性，采用现代化的开发模式和最佳实践。

**核心优势：**
- ✅ 前后端分离，职责清晰
- ✅ JWT双令牌认证，安全可靠
- ✅ 统一错误处理，用户体验好
- ✅ 设计令牌系统，UI统一美观
- ✅ 代码质量高，易于维护

**适用场景：**
- 中小型企业的物料管理
- 本地部署需求
- 需要完整审批流程的场景
- 需要操作审计的场景

---

**文档版本**: 1.0.0  
**最后更新**: 2025年12月  
**维护者**: 开发团队




