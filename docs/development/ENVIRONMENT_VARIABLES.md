# 环境变量配置指南

## 概述

物料管理系统使用环境变量来配置敏感信息和运行参数。所有环境变量都存储在 `backend/.env` 文件中。

## 快速设置

### 方法1：自动生成（推荐）

运行以下命令自动生成JWT密钥：

```bash
cd backend
node generate-jwt-secret.js
```

这会自动创建 `.env` 文件并生成一个安全的64字符JWT密钥。

### 方法2：手动创建

1. 复制 `.env.example` 为 `.env`：
   ```bash
   cd backend
   copy .env.example .env  # Windows
   # 或
   cp .env.example .env     # Mac/Linux
   ```

2. 编辑 `.env` 文件，设置 `JWT_SECRET`：
   ```
   JWT_SECRET=your-strong-secret-key-at-least-32-characters-long
   ```

## 环境变量说明

### 必需变量

#### JWT_SECRET
- **说明**: JWT令牌签名密钥
- **要求**: 至少32个字符，推荐64字符
- **生成方法**:
  ```bash
  # 使用Node.js生成
  node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
  
  # 或运行工具脚本
  node generate-jwt-secret.js
  ```
- **示例**: `JWT_SECRET=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6`

### 可选变量

#### JWT_REFRESH_SECRET
- **说明**: JWT刷新令牌密钥（可选）
- **默认**: `JWT_SECRET + '_refresh'`
- **示例**: `JWT_REFRESH_SECRET=your-refresh-secret-key`

#### JWT_EXPIRES_IN
- **说明**: Access Token过期时间
- **默认**: `1h`（1小时）
- **格式**: 数字+单位（s=秒, m=分钟, h=小时, d=天）
- **示例**: `JWT_EXPIRES_IN=2h`

#### JWT_REFRESH_EXPIRES_IN
- **说明**: Refresh Token过期时间
- **默认**: `30d`（30天）
- **示例**: `JWT_REFRESH_EXPIRES_IN=7d`

#### PORT
- **说明**: 服务器监听端口
- **默认**: `3000`
- **示例**: `PORT=8080`

#### NODE_ENV
- **说明**: 运行环境
- **可选值**: `development`（开发）或 `production`（生产）
- **默认**: `development`
- **示例**: `NODE_ENV=production`

#### DB_PATH
- **说明**: SQLite数据库文件路径
- **默认**: `./database/mms.db`
- **示例**: `DB_PATH=/var/lib/mms/mms.db`

## 完整配置示例

```env
# JWT配置
# ⚠️ 重要：必须使用强随机生成的密钥（至少32个字符）
# 生成命令：node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
JWT_SECRET=<your-strong-random-secret-at-least-32-characters>
JWT_REFRESH_SECRET=<your-refresh-secret-key>  # 可选
JWT_EXPIRES_IN=1h
JWT_REFRESH_EXPIRES_IN=30d

# 服务器配置
PORT=3000
NODE_ENV=development

# 数据库配置
DB_PATH=./database/mms.db
```

## 安全注意事项

### ⚠️ 重要安全提示

1. **不要提交 `.env` 文件到Git**
   - `.env` 文件已添加到 `.gitignore`
   - 包含敏感信息，不应公开

2. **生产环境必须设置强密钥**
   - 至少64字符的随机字符串
   - 使用 `generate-jwt-secret.js` 生成

3. **定期轮换密钥**
   - 建议每3-6个月更换一次JWT_SECRET
   - 更换后所有用户需要重新登录

4. **保护环境变量文件**
   - 设置适当的文件权限（仅所有者可读）
   - 不要通过邮件或聊天工具分享

### 文件权限设置（Linux/Mac）

```bash
chmod 600 backend/.env
```

## 常见问题

### Q1: 启动时看到JWT_SECRET警告

**原因**: 未设置 `JWT_SECRET` 或使用了默认值

**解决**:
```bash
cd backend
node generate-jwt-secret.js
```

### Q2: 如何生成强密钥？

**方法1**: 使用工具脚本（推荐）
```bash
node generate-jwt-secret.js
```

**方法2**: 使用Node.js命令
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**方法3**: 使用在线工具
- https://www.random.org/strings/
- 生成64字符的随机字符串

### Q3: 修改JWT_SECRET后需要做什么？

修改JWT_SECRET后：
1. 重启后端服务
2. 所有用户需要重新登录（旧的token将失效）

### Q4: 生产环境配置

生产环境建议配置：
```env
NODE_ENV=production
JWT_SECRET=<强密钥，至少64字符>
JWT_EXPIRES_IN=1h
JWT_REFRESH_EXPIRES_IN=7d
PORT=3000
```

## 验证配置

启动后端服务后，检查控制台输出：
- ✅ 没有JWT_SECRET警告 = 配置正确
- ⚠️ 有警告 = 需要设置JWT_SECRET

## 相关文件

- `backend/.env` - 环境变量文件（不提交到Git）
- `backend/.env.example` - 环境变量模板（可提交到Git）
- `backend/generate-jwt-secret.js` - JWT密钥生成工具
- `backend/.gitignore` - Git忽略配置（包含.env）





