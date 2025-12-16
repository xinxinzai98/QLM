# 物料管理系统 - API接口文档

## 基础信息

- **Base URL**: `http://localhost:3000/api`
- **认证方式**: JWT Bearer Token
- **请求格式**: JSON
- **响应格式**: JSON

## 通用响应格式

### 成功响应

```json
{
  "success": true,
  "message": "操作成功",
  "data": {
    // 数据内容
  }
}
```

### 错误响应

```json
{
  "success": false,
  "message": "错误信息"
}
```

### HTTP状态码

- `200`: 请求成功
- `201`: 创建成功
- `400`: 请求参数错误
- `401`: 未授权（需要登录）
- `403`: 权限不足
- `404`: 资源不存在
- `500`: 服务器错误

---

## 认证接口

### 1. 用户登录

**接口**: `POST /api/auth/login`

**请求参数**:
```json
{
  "username": "admin",
  "password": "admin123"
}
```

**响应示例**:
```json
{
  "success": true,
  "message": "登录成功",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "username": "admin",
      "role": "system_admin",
      "realName": "系统管理员",
      "email": "admin@mms.com"
    }
  }
}
```

### 2. 用户注册

**接口**: `POST /api/auth/register`

**权限**: 需要认证（仅系统管理员可注册其他用户）

**请求参数**:
```json
{
  "username": "user001",
  "password": "password123",
  "role": "regular_user",
  "realName": "张三",
  "email": "zhangsan@example.com"
}
```

**角色选项**: `system_admin`, `inventory_manager`, `regular_user`

**响应示例**:
```json
{
  "success": true,
  "message": "注册成功",
  "data": {
    "id": 2,
    "username": "user001",
    "role": "regular_user"
  }
}
```

### 3. 获取当前用户信息

**接口**: `GET /api/auth/me`

**权限**: 需要认证

**响应示例**:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "username": "admin",
    "role": "system_admin",
    "realName": "系统管理员",
    "email": "admin@mms.com",
    "createdAt": "2024-01-01 00:00:00"
  }
}
```

---

## 物料管理接口

### 1. 获取物料列表

**接口**: `GET /api/materials`

**权限**: 需要认证

**查询参数**:
- `page`: 页码（默认1）
- `pageSize`: 每页数量（默认10）
- `keyword`: 搜索关键词（物料编码或名称）
- `category`: 类别筛选（`chemical` 或 `metal`）

**请求示例**:
```
GET /api/materials?page=1&pageSize=10&keyword=硫酸&category=chemical
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "list": [
      {
        "id": 1,
        "material_code": "CHEM001",
        "material_name": "硫酸",
        "category": "chemical",
        "unit": "L",
        "current_stock": 100.5,
        "min_stock": 50,
        "max_stock": 500,
        "location": "A区-1号仓库",
        "description": "工业用硫酸",
        "created_by": 1,
        "creator_name": "系统管理员",
        "created_at": "2024-01-01 00:00:00",
        "updated_at": "2024-01-01 00:00:00"
      }
    ],
    "total": 1,
    "page": 1,
    "pageSize": 10
  }
}
```

### 2. 获取物料详情

**接口**: `GET /api/materials/:id`

**权限**: 需要认证

**响应示例**:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "material_code": "CHEM001",
    "material_name": "硫酸",
    "category": "chemical",
    "unit": "L",
    "current_stock": 100.5,
    "min_stock": 50,
    "max_stock": 500,
    "location": "A区-1号仓库",
    "description": "工业用硫酸",
    "created_by": 1,
    "creator_name": "系统管理员",
    "created_at": "2024-01-01 00:00:00",
    "updated_at": "2024-01-01 00:00:00"
  }
}
```

### 3. 创建物料

**接口**: `POST /api/materials`

**权限**: 需要认证（系统管理员或库存管理员）

**请求参数**:
```json
{
  "materialCode": "CHEM002",
  "materialName": "盐酸",
  "category": "chemical",
  "unit": "L",
  "minStock": 30,
  "maxStock": 300,
  "location": "A区-2号仓库",
  "description": "工业用盐酸"
}
```

**必填字段**: `materialCode`, `materialName`, `category`, `unit`

**响应示例**:
```json
{
  "success": true,
  "message": "物料创建成功",
  "data": {
    "id": 2,
    "materialCode": "CHEM002",
    "materialName": "盐酸"
  }
}
```

### 4. 更新物料

**接口**: `PUT /api/materials/:id`

**权限**: 需要认证（系统管理员或库存管理员）

**请求参数**:
```json
{
  "materialName": "盐酸（更新）",
  "category": "chemical",
  "unit": "kg",
  "minStock": 40,
  "maxStock": 400,
  "location": "A区-3号仓库",
  "description": "更新后的描述"
}
```

**注意**: 物料编码不可修改

**响应示例**:
```json
{
  "success": true,
  "message": "物料更新成功",
  "data": {
    "id": 2
  }
}
```

### 5. 删除物料

**接口**: `DELETE /api/materials/:id`

**权限**: 需要认证（仅系统管理员）

**响应示例**:
```json
{
  "success": true,
  "message": "物料删除成功"
}
```

**注意**: 如果物料存在相关出入库记录，无法删除

---

## 出入库管理接口

### 1. 创建出入库单

**接口**: `POST /api/inventory`

**权限**: 需要认证（所有用户）

**请求参数**:
```json
{
  "transactionType": "out",
  "materialId": 1,
  "quantity": 10.5,
  "unitPrice": 50.0,
  "remark": "出库备注"
}
```

**字段说明**:
- `transactionType`: `in`（入库）或 `out`（出库）
- `materialId`: 物料ID
- `quantity`: 数量（必填，必须大于0）
- `unitPrice`: 单价（可选）
- `remark`: 备注（可选）

**响应示例**:
```json
{
  "success": true,
  "message": "出入库单创建成功，等待审批",
  "data": {
    "id": 1,
    "transactionCode": "OUT1704067200000123",
    "status": "pending"
  }
}
```

### 2. 获取出入库单列表

**接口**: `GET /api/inventory`

**权限**: 需要认证

**查询参数**:
- `page`: 页码（默认1）
- `pageSize`: 每页数量（默认10）
- `status`: 状态筛选（`pending`, `approved`, `rejected`, `cancelled`）
- `transactionType`: 类型筛选（`in`, `out`）
- `materialId`: 物料ID筛选

**响应示例**:
```json
{
  "success": true,
  "data": {
    "list": [
      {
        "id": 1,
        "transaction_code": "OUT1704067200000123",
        "transaction_type": "out",
        "material_id": 1,
        "material_code": "CHEM001",
        "material_name": "硫酸",
        "category": "chemical",
        "unit": "L",
        "quantity": 10.5,
        "unit_price": 50.0,
        "total_amount": 525.0,
        "applicant_id": 2,
        "applicant_name": "张三",
        "approver_id": null,
        "approver_name": null,
        "status": "pending",
        "remark": "出库备注",
        "created_at": "2024-01-01 00:00:00",
        "updated_at": "2024-01-01 00:00:00",
        "approved_at": null
      }
    ],
    "total": 1,
    "page": 1,
    "pageSize": 10
  }
}
```

### 3. 获取出入库单详情

**接口**: `GET /api/inventory/:id`

**权限**: 需要认证

**响应示例**:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "transaction_code": "OUT1704067200000123",
    "transaction_type": "out",
    "material_id": 1,
    "material_code": "CHEM001",
    "material_name": "硫酸",
    "category": "chemical",
    "unit": "L",
    "current_stock": 90.0,
    "quantity": 10.5,
    "unit_price": 50.0,
    "total_amount": 525.0,
    "applicant_id": 2,
    "applicant_name": "张三",
    "approver_id": 3,
    "approver_name": "李四",
    "status": "approved",
    "remark": "出库备注",
    "created_at": "2024-01-01 00:00:00",
    "updated_at": "2024-01-01 00:00:00",
    "approved_at": "2024-01-01 01:00:00"
  }
}
```

### 4. 审批出入库单

**接口**: `PUT /api/inventory/:id/approve`

**权限**: 需要认证（库存管理员或系统管理员）

**请求参数**:
```json
{
  "action": "approve",
  "remark": "审批通过"
}
```

**字段说明**:
- `action`: `approve`（批准）或 `reject`（拒绝）
- `remark`: 审批备注（可选）

**响应示例**:
```json
{
  "success": true,
  "message": "出入库单已批准",
  "data": {
    "id": 1,
    "status": "approved"
  }
}
```

**注意**: 
- 批准出库单时，系统会检查库存是否充足
- 批准后，系统自动更新物料库存
- 拒绝时，不更新库存

### 5. 取消出入库单

**接口**: `PUT /api/inventory/:id/cancel`

**权限**: 需要认证（仅申请人可以取消自己创建的待审批单据）

**响应示例**:
```json
{
  "success": true,
  "message": "出入库单已取消"
}
```

---

## 仪表盘接口

### 1. 获取统计数据

**接口**: `GET /api/dashboard/stats`

**权限**: 需要认证

**响应示例**:
```json
{
  "success": true,
  "data": {
    "totalMaterials": 50,
    "pendingTransactions": 5,
    "todayTransactions": 10,
    "lowStockMaterials": 3,
    "totalInventoryValue": 125000.50
  }
}
```

### 2. 获取物料分类统计

**接口**: `GET /api/dashboard/materials-by-category`

**权限**: 需要认证

**响应示例**:
```json
{
  "success": true,
  "data": [
    {
      "category": "chemical",
      "count": 30,
      "total_stock": 1500.5
    },
    {
      "category": "metal",
      "count": 20,
      "total_stock": 800.0
    }
  ]
}
```

### 3. 获取出入库趋势

**接口**: `GET /api/dashboard/transaction-trend`

**权限**: 需要认证

**响应示例**:
```json
{
  "success": true,
  "data": [
    {
      "date": "2024-01-01",
      "transaction_type": "in",
      "count": 5,
      "total_quantity": 100.0
    },
    {
      "date": "2024-01-01",
      "transaction_type": "out",
      "count": 3,
      "total_quantity": 50.0
    }
  ]
}
```

### 4. 获取低库存物料

**接口**: `GET /api/dashboard/low-stock-materials`

**权限**: 需要认证

**响应示例**:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "material_code": "CHEM001",
      "material_name": "硫酸",
      "category": "chemical",
      "current_stock": 30.0,
      "min_stock": 50.0,
      "unit": "L"
    }
  ]
}
```

### 5. 获取待审批单列表

**接口**: `GET /api/dashboard/pending-transactions`

**权限**: 需要认证

**响应示例**:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "transaction_code": "OUT1704067200000123",
      "transaction_type": "out",
      "quantity": 10.5,
      "created_at": "2024-01-01 00:00:00",
      "material_code": "CHEM001",
      "material_name": "硫酸",
      "applicant_name": "张三"
    }
  ]
}
```

---

## 用户管理接口

### 1. 获取用户列表

**接口**: `GET /api/users`

**权限**: 需要认证（仅系统管理员）

**查询参数**:
- `page`: 页码（默认1）
- `pageSize`: 每页数量（默认10）
- `keyword`: 搜索关键词（用户名、姓名或邮箱）
- `role`: 角色筛选

**响应示例**:
```json
{
  "success": true,
  "data": {
    "list": [
      {
        "id": 1,
        "username": "admin",
        "role": "system_admin",
        "real_name": "系统管理员",
        "email": "admin@mms.com",
        "created_at": "2024-01-01 00:00:00",
        "updated_at": "2024-01-01 00:00:00"
      }
    ],
    "total": 1,
    "page": 1,
    "pageSize": 10
  }
}
```

### 2. 获取用户详情

**接口**: `GET /api/users/:id`

**权限**: 需要认证（仅系统管理员）

**响应示例**:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "username": "admin",
    "role": "system_admin",
    "real_name": "系统管理员",
    "email": "admin@mms.com",
    "created_at": "2024-01-01 00:00:00",
    "updated_at": "2024-01-01 00:00:00"
  }
}
```

### 3. 创建用户

**接口**: `POST /api/users`

**权限**: 需要认证（仅系统管理员）

**请求参数**:
```json
{
  "username": "user002",
  "password": "password123",
  "role": "inventory_manager",
  "realName": "李四",
  "email": "lisi@example.com"
}
```

**响应示例**:
```json
{
  "success": true,
  "message": "用户创建成功",
  "data": {
    "id": 3,
    "username": "user002",
    "role": "inventory_manager"
  }
}
```

### 4. 更新用户

**接口**: `PUT /api/users/:id`

**权限**: 需要认证（仅系统管理员）

**请求参数**:
```json
{
  "username": "user002_updated",
  "password": "newpassword123",
  "role": "system_admin",
  "realName": "李四（更新）",
  "email": "lisi_new@example.com"
}
```

**注意**: 
- 密码留空则不修改
- 不能修改自己的账户

**响应示例**:
```json
{
  "success": true,
  "message": "用户更新成功",
  "data": {
    "id": 3
  }
}
```

### 5. 删除用户

**接口**: `DELETE /api/users/:id`

**权限**: 需要认证（仅系统管理员）

**响应示例**:
```json
{
  "success": true,
  "message": "用户删除成功"
}
```

**注意**: 不能删除自己的账户

---

## 健康检查接口

### 健康检查

**接口**: `GET /api/health`

**权限**: 无需认证

**响应示例**:
```json
{
  "status": "ok",
  "message": "MMS Backend is running"
}
```

---

## 认证说明

### 使用JWT Token

所有需要认证的接口，需要在请求头中携带Token：

```
Authorization: Bearer <your-token>
```

### Token获取

通过登录接口获取Token，Token有效期为7天（可在配置中修改）。

### Token刷新

目前系统不支持Token自动刷新，Token过期后需要重新登录。

---

## 错误码说明

| 状态码 | 说明 |
|--------|------|
| 200 | 请求成功 |
| 201 | 创建成功 |
| 400 | 请求参数错误 |
| 401 | 未授权（需要登录） |
| 403 | 权限不足 |
| 404 | 资源不存在 |
| 500 | 服务器错误 |

---

## 请求示例

### 使用curl

```bash
# 登录
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'

# 获取物料列表（需要Token）
curl -X GET http://localhost:3000/api/materials \
  -H "Authorization: Bearer <your-token>"
```

### 使用JavaScript (Axios)

```javascript
import axios from 'axios';

// 登录
const loginResponse = await axios.post('http://localhost:3000/api/auth/login', {
  username: 'admin',
  password: 'admin123'
});

const token = loginResponse.data.data.token;

// 获取物料列表
const materialsResponse = await axios.get('http://localhost:3000/api/materials', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

---

## 注意事项

1. **时间格式**: 所有时间字段使用 `YYYY-MM-DD HH:mm:ss` 格式
2. **数量精度**: 数量字段支持小数，建议保留2位小数
3. **分页**: 所有列表接口都支持分页，默认每页10条
4. **搜索**: 搜索功能支持模糊匹配
5. **权限**: 不同角色有不同的接口访问权限

---

**最后更新**: 2024年

