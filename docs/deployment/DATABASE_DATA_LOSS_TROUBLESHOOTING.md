# 数据库数据丢失问题排查和解决方案

**清绿氢能物料管理系统 - 数据库数据丢失问题诊断**

---

## 🔍 问题描述

更新ECS系统后，发现之前的数据库数据都被清除了。

---

## 🎯 可能的原因

### 原因1：数据目录挂载位置不匹配（最可能）

**问题分析：**

系统使用Docker Volume挂载来持久化数据：
```yaml
volumes:
  - ./data/database:/app/backend/database
```

但是代码中的数据库路径是：
```javascript
const DB_PATH = path.join(__dirname, 'mms.db');
// __dirname 在容器内是 /app/backend/src/database
```

**问题：**
- 挂载的是 `/app/backend/database`
- 但代码实际使用 `/app/backend/src/database/mms.db`
- 两个路径不一致！

**解决方案：**

需要在代码中支持环境变量 `DB_PATH`，或者修改挂载路径。

### 原因2：数据目录不存在或为空

**问题分析：**

如果ECS上的 `data/database` 目录不存在或为空，Docker Volume挂载会用空目录覆盖容器内的默认目录。

**检查方法：**
```bash
# 在ECS服务器上执行
cd /opt/QLM  # 或你的项目目录
ls -la data/database/
```

如果看到目录是空的或不存在，说明这就是问题所在。

### 原因3：数据库文件在其他位置

**问题分析：**

如果之前部署时，数据库文件在容器内的其他位置（比如 `/app/backend/src/database/mms.db`），而新的挂载配置指向了新的位置（`/app/backend/database`），导致找不到旧数据。

---

## 🔧 解决方案

### 方案1：检查并恢复备份数据（推荐第一步）

**步骤1：检查备份文件**

```bash
cd /opt/QLM  # 或你的项目目录

# 查看备份目录
ls -lh backups/

# 找到最新的备份文件（通常是update.sh脚本自动创建的）
# 文件名格式：backup_YYYYMMDD_HHMMSS.tar.gz
```

**步骤2：恢复备份**

```bash
# 停止容器
docker-compose -f docker-compose.prod.yml stop

# 恢复到临时位置查看
cd /tmp
tar -xzf /opt/QLM/backups/backup_最新备份文件.tar.gz

# 查看备份中是否有数据库文件
ls -la data/database/

# 如果有数据库文件，恢复到项目目录
cd /opt/QLM
tar -xzf backups/backup_最新备份文件.tar.gz

# 确保权限正确
chmod -R 755 data/

# 重新启动容器
docker-compose -f docker-compose.prod.yml up -d
```

### 方案2：检查容器内的数据库文件

**步骤1：进入容器查看**

```bash
# 查看容器是否运行
docker ps | grep mms-app

# 进入容器
docker exec -it mms-app sh

# 在容器内查找数据库文件
find /app -name "*.db" -type f

# 查看可能的数据库位置
ls -la /app/backend/database/
ls -la /app/backend/src/database/
```

**步骤2：如果找到数据库文件，复制出来**

```bash
# 从容器复制数据库文件到宿主机
docker cp mms-app:/app/backend/src/database/mms.db ./data/database/mms.db

# 或从其他位置复制
docker cp mms-app:/app/backend/database/mms.db ./data/database/mms.db
```

### 方案3：检查旧的容器或镜像

**步骤1：查看Docker历史记录**

```bash
# 查看所有容器（包括已停止的）
docker ps -a

# 如果旧容器还在，可以从旧容器复制数据
docker cp 旧容器ID:/app/backend/src/database/mms.db ./data/database/mms.db
```

### 方案4：修复数据库路径配置问题

**临时解决方案（修改docker-compose.prod.yml）：**

```yaml
volumes:
  # 修改为挂载到代码实际使用的路径
  - ./data/database:/app/backend/src/database
  - ./data/uploads:/app/backend/uploads
```

**永久解决方案（修改代码支持环境变量）：**

需要修改 `backend/src/database/database.js`，让它优先使用环境变量 `DB_PATH`：

```javascript
const path = require('path');

// 优先使用环境变量，否则使用默认路径
const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'mms.db');

// 确保目录存在
const dbDir = path.dirname(DB_PATH);
const fs = require('fs');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}
```

---

## 🔍 诊断步骤

### 步骤1：检查数据目录状态

```bash
cd /opt/QLM  # 或你的项目目录

# 检查data目录是否存在
ls -la data/

# 检查database目录
ls -la data/database/

# 检查文件大小（如果是空文件，大小会是0）
du -sh data/database/*.db 2>/dev/null || echo "数据库文件不存在"
```

### 步骤2：检查Docker Volume挂载

```bash
# 查看容器挂载信息
docker inspect mms-app | grep -A 10 Mounts

# 查看挂载源路径
docker inspect mms-app | grep -A 5 "Source"
```

### 步骤3：检查容器内的数据库文件

```bash
# 进入容器
docker exec -it mms-app sh

# 查找所有.db文件
find /app -name "*.db" -type f -exec ls -lh {} \;

# 检查可能的数据库位置
ls -la /app/backend/database/
ls -la /app/backend/src/database/
```

### 步骤4：检查备份文件

```bash
# 查看备份目录
ls -lh backups/

# 如果 backups 目录在项目外，可能需要查找
find /opt -name "backup_*.tar.gz" -type f 2>/dev/null

# 查看备份内容（不解压）
tar -tzf backups/backup_最新备份.tar.gz | grep "\.db$"
```

---

## ⚠️ 预防措施

### 1. 确保备份正常工作

在更新前，确保：
- `data/` 目录存在且包含数据
- 备份脚本能够正常执行
- 备份文件大小合理（不是0字节）

### 2. 验证数据持久化配置

确保 `docker-compose.prod.yml` 中的数据卷挂载配置正确：

```yaml
volumes:
  - ./data/database:/app/backend/database  # 确保路径正确
  - ./data/uploads:/app/backend/uploads
```

### 3. 更新前手动备份

在运行更新脚本前，手动创建备份：

```bash
cd /opt/QLM
tar -czf /tmp/manual_backup_$(date +%Y%m%d_%H%M%S).tar.gz data/
```

### 4. 测试数据恢复流程

定期测试备份和恢复流程，确保在需要时能够恢复数据。

---

## 📞 如果数据无法恢复

如果以上方法都无法恢复数据，可能需要：

1. **从业务日志恢复**：如果有操作日志，可以尝试重建关键数据
2. **从用户上传文件恢复**：检查 `data/uploads/` 目录，可能有相关文件
3. **联系技术支持**：提供详细的错误信息和诊断结果

---

## 🔧 修复脚本路径配置的建议

为了彻底解决这个问题，建议修改代码以支持环境变量：

**修改 `backend/src/database/database.js`：**

```javascript
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// 优先使用环境变量DB_PATH，否则使用默认路径
const DEFAULT_DB_PATH = path.join(__dirname, 'mms.db');
const DB_PATH = process.env.DB_PATH || DEFAULT_DB_PATH;

// 确保数据库目录存在
const dbDir = path.dirname(DB_PATH);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
  console.log(`创建数据库目录: ${dbDir}`);
}

console.log(`数据库路径: ${DB_PATH}`);

// 创建数据库连接
const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('数据库连接失败:', err.message);
  } else {
    console.log(`已连接到SQLite数据库: ${DB_PATH}`);
  }
});
```

然后在 `docker-compose.prod.yml` 中设置正确的环境变量：

```yaml
environment:
  - DB_PATH=/app/backend/database/mms.db
volumes:
  - ./data/database:/app/backend/database
```

这样就能确保代码使用的路径和挂载的路径一致。

---

**最后更新：2024-01-XX**  
**问题严重性：高 - 数据丢失**

