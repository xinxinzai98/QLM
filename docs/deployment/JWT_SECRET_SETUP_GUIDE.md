# JWT_SECRET 配置指南

## 🚨 错误信息

如果看到以下错误，说明 `JWT_SECRET` 环境变量未设置：

```
FATAL: JWT_SECRET must be set in production environment. 
Please set a strong secret key (minimum 32 characters) in environment variables.
```

---

## ⚡ 快速修复（推荐）

### 方法一：使用配置脚本（最简单）

```bash
# 1. 进入项目目录
cd /opt/QLM

# 2. 拉取最新代码（包含配置脚本）
git pull origin main

# 3. 给脚本添加执行权限
chmod +x scripts/setup_jwt_secret.sh

# 4. 运行配置脚本
./scripts/setup_jwt_secret.sh
```

脚本会自动：
- ✅ 生成强随机 JWT_SECRET（64字符）
- ✅ 创建或更新 `.env` 文件
- ✅ 设置正确的文件权限
- ✅ 备份现有的 `.env` 文件（如果存在）

---

### 方法二：手动配置

#### 步骤1：生成强随机密钥

```bash
# 方法1：使用 OpenSSL（推荐）
JWT_SECRET=$(openssl rand -hex 32)

# 方法2：使用 Node.js
JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")

# 查看生成的密钥（用于验证）
echo $JWT_SECRET
```

#### 步骤2：创建或更新 .env 文件

```bash
cd /opt/QLM

# 如果 .env 文件不存在，创建它
if [ ! -f .env ]; then
    cat > .env <<EOF
NODE_ENV=production
PORT=3000
JWT_SECRET=$JWT_SECRET
JWT_EXPIRES_IN=7d
DB_PATH=./database/mms.db
EOF
else
    # 如果文件已存在，更新 JWT_SECRET
    if grep -q "^JWT_SECRET=" .env; then
        sed -i "s|^JWT_SECRET=.*|JWT_SECRET=$JWT_SECRET|" .env
    else
        echo "JWT_SECRET=$JWT_SECRET" >> .env
    fi
fi

# 设置文件权限（仅所有者可读）
chmod 600 .env
```

#### 步骤3：重启服务

```bash
# 重启容器以应用新配置
docker-compose -f docker-compose.prod.yml restart

# 或重新构建并启动
docker-compose -f docker-compose.prod.yml up -d --build

# 查看日志确认服务正常启动
docker logs -f mms-app
```

---

## 🔍 验证配置

### 检查 .env 文件

```bash
# 查看 .env 文件内容（密钥会被隐藏）
cat .env | grep JWT_SECRET

# 检查密钥长度
JWT_SECRET_VALUE=$(grep "^JWT_SECRET=" .env | cut -d '=' -f2)
echo "密钥长度: ${#JWT_SECRET_VALUE} 字符"
```

**要求**：JWT_SECRET 必须至少 32 个字符，推荐 64 个字符。

### 检查容器环境变量

```bash
# 查看容器内的 JWT_SECRET 环境变量
docker exec mms-app env | grep JWT_SECRET

# 检查密钥长度（如果已设置）
docker exec mms-app sh -c 'echo ${#JWT_SECRET}'
```

### 验证服务启动

```bash
# 查看容器日志，应该没有 JWT_SECRET 错误
docker logs mms-app | grep -i "jwt_secret\|fatal"

# 测试健康检查
curl http://localhost:3000/api/health
```

---

## 📋 完整配置示例

`.env` 文件示例：

```env
# 生产环境配置
NODE_ENV=production
PORT=3000

# JWT密钥配置
# ⚠️  重要：必须使用强随机生成的密钥（至少32个字符）
# 生成命令：openssl rand -hex 32
JWT_SECRET=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2

# JWT过期时间
JWT_EXPIRES_IN=7d

# 数据库路径
DB_PATH=./database/mms.db
```

---

## ⚠️ 重要安全提示

1. **不要使用弱密钥**
   - ❌ 不要使用默认密钥
   - ❌ 不要使用简单密码
   - ✅ 必须使用强随机生成的密钥（至少32字符）

2. **保护密钥安全**
   - `.env` 文件已添加到 `.gitignore`，不会提交到Git
   - 设置文件权限为 `600`（仅所有者可读）
   - 不要通过邮件、聊天工具分享密钥

3. **定期轮换密钥**
   - 建议每 3-6 个月更换一次 JWT_SECRET
   - 更换后所有用户需要重新登录

4. **备份密钥**
   - 将密钥保存在安全的地方（密码管理器等）
   - 如果丢失密钥，所有用户需要重新登录

---

## 🔧 常见问题

### Q1: 为什么需要 JWT_SECRET？

JWT_SECRET 用于签名和验证 JWT 令牌，确保令牌的安全性。没有这个密钥，系统无法正常启动。

### Q2: 密钥长度要求是多少？

- **最小长度**：32 个字符
- **推荐长度**：64 个字符（使用 `openssl rand -hex 32` 生成）

### Q3: 修改 JWT_SECRET 后需要做什么？

1. 更新 `.env` 文件中的 `JWT_SECRET`
2. 重启 Docker 容器：`docker-compose -f docker-compose.prod.yml restart`
3. **注意**：所有用户的登录令牌将失效，需要重新登录

### Q4: 如何生成强随机密钥？

```bash
# 方法1：使用 OpenSSL（推荐，生成64字符）
openssl rand -hex 32

# 方法2：使用 Node.js（生成64字符）
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# 方法3：使用 Python
python3 -c "import secrets; print(secrets.token_hex(32))"
```

### Q5: 容器重启后仍然报错？

可能的原因：
1. `.env` 文件不在项目根目录
2. `.env` 文件权限不正确
3. Docker Compose 未正确读取 `.env` 文件

**解决方法**：
```bash
# 检查 .env 文件位置
ls -la .env

# 检查文件权限
ls -l .env  # 应该是 -rw------- (600)

# 确认 docker-compose.prod.yml 中使用了 ${JWT_SECRET}
grep JWT_SECRET docker-compose.prod.yml

# 重新启动（使用 --force-recreate）
docker-compose -f docker-compose.prod.yml up -d --force-recreate
```

---

## 📞 获取帮助

如果按照以上步骤操作后仍然无法解决问题：

1. **查看完整日志**：
   ```bash
   docker logs mms-app 2>&1 | tail -100
   ```

2. **运行诊断脚本**：
   ```bash
   ./scripts/diagnose_service.sh
   ```

3. **检查环境变量**：
   ```bash
   docker exec mms-app env | grep -E "JWT|NODE_ENV"
   ```

