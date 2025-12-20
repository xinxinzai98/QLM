# 网易云ECS热更新部署教程

**清绿氢能物料管理系统 - 生产环境热更新指南**

本教程适用于已在网易云ECS上运行的系统，需要更新代码到最新版本。

---

## 📋 目录

1. [更新前准备](#更新前准备)
2. [方式一：使用更新脚本（推荐）](#方式一使用更新脚本推荐)
3. [方式二：手动更新（详细步骤）](#方式二手动更新详细步骤)
4. [验证更新](#验证更新)
5. [回滚操作](#回滚操作)
6. [常见问题](#常见问题)

---

## 🔍 更新前准备

### 1. 确认当前状态

**在本地电脑执行以下检查：**

```bash
# 1. 确认代码已提交并推送到Git仓库
git status
git log --oneline -5

# 2. 确认当前分支
git branch

# 3. 确认要部署的分支（通常是 main 或 master）
```

**在服务器上执行以下检查：**

```bash
# 1. SSH连接到服务器
ssh root@你的服务器IP

# 2. 检查当前服务状态
cd /opt/QLM  # 或你的项目目录
docker-compose -f docker-compose.prod.yml ps

# 3. 检查容器是否正常运行
docker ps | grep mms-app

# 4. 测试应用是否可访问
curl http://localhost:3000/api/health
```

### 2. 记录关键信息

在更新前，请记录以下信息，以便出问题时可以快速回滚：

```bash
# 记录当前Git提交版本
cd /opt/QLM
git rev-parse HEAD > /tmp/current_version.txt
cat /tmp/current_version.txt

# 记录当前容器ID
docker ps | grep mms-app > /tmp/current_container.txt
cat /tmp/current_container.txt
```

---

## 🚀 方式一：使用更新脚本（推荐）

这是最简单、最安全的方式，脚本会自动处理备份、更新、重启等所有步骤。

### 步骤1：上传更新脚本到服务器（如未上传）

如果服务器上还没有 `update.sh` 脚本，从本地电脑上传：

```bash
# 在本地电脑执行
scp scripts/update.sh root@你的服务器IP:/opt/QLM/scripts/
```

### 步骤2：设置脚本权限

```bash
# SSH到服务器后执行
cd /opt/QLM
chmod +x scripts/update.sh
```

### 步骤3：执行更新脚本

```bash
# 在项目根目录执行
cd /opt/QLM
./scripts/update.sh
```

**脚本会自动完成以下操作：**
1. ✅ 检查必要文件
2. ✅ 备份数据目录（`data/`）
3. ✅ 拉取最新代码
4. ✅ 停止旧容器
5. ✅ 重新构建Docker镜像
6. ✅ 启动新容器
7. ✅ 等待服务启动
8. ✅ 执行健康检查

**预期输出：**
```
==========================================
[INFO] 开始代码更新流程
==========================================

[INFO] 检查必要文件...
[SUCCESS] 文件检查通过
[INFO] 备份数据...
[SUCCESS] 数据备份完成: backups/backup_20240101_120000.tar.gz
[INFO] 拉取最新代码（分支: main）...
[SUCCESS] 代码已更新
更新前: abc1234
更新后: def5678
[INFO] 停止容器...
[SUCCESS] 容器已停止
[INFO] 重新构建Docker镜像（这可能需要5-10分钟）...
[SUCCESS] 镜像构建完成
[INFO] 启动容器...
[SUCCESS] 容器已启动
[INFO] 等待服务启动...
[SUCCESS] 容器运行正常
[INFO] 检查服务健康状态...
[SUCCESS] 服务健康检查通过！

==========================================
[SUCCESS] 更新完成！
==========================================
```

### 步骤4：查看更新结果

```bash
# 查看最新日志
docker-compose -f docker-compose.prod.yml logs --tail=50

# 查看容器状态
docker-compose -f docker-compose.prod.yml ps

# 查看更新的代码版本
git log --oneline -1
```

---

## 🔧 方式二：手动更新（详细步骤）

如果你想要更多控制，或者脚本执行失败，可以手动执行以下步骤。

### 步骤1：连接到服务器

```bash
ssh root@你的服务器IP
```

### 步骤2：进入项目目录

```bash
cd /opt/QLM  # 根据你的实际部署目录调整
```

### 步骤3：备份数据（重要！）

**⚠️ 警告：更新前必须备份，以防万一需要回滚！**

```bash
# 创建备份目录（如果不存在）
mkdir -p backups

# 备份数据目录（包含数据库和上传文件）
BACKUP_FILE="backups/backup_$(date +%Y%m%d_%H%M%S).tar.gz"
tar -czf "$BACKUP_FILE" data/

# 查看备份文件
ls -lh "$BACKUP_FILE"
echo "备份文件: $BACKUP_FILE"

# 验证备份是否成功
if [ -f "$BACKUP_FILE" ]; then
    echo "✅ 备份成功！"
else
    echo "❌ 备份失败，请检查后重试！"
    exit 1
fi
```

### 步骤4：检查Git状态

```bash
# 查看当前分支
git branch

# 查看当前状态
git status

# 如果有未提交的更改，建议先暂存或提交
# git stash  # 暂存更改
# 或者
# git add . && git commit -m "临时提交"
```

### 步骤5：拉取最新代码

```bash
# 记录更新前的版本（用于回滚）
OLD_VERSION=$(git rev-parse HEAD)
echo "更新前版本: $OLD_VERSION"

# 拉取最新代码
git fetch origin

# 切换到主分支（根据你的实际分支名称调整）
git checkout main  # 或 master

# 拉取最新代码
git pull origin main  # 或 master

# 查看更新后的版本
NEW_VERSION=$(git rev-parse HEAD)
echo "更新后版本: $NEW_VERSION"

# 查看更新了哪些内容
git log --oneline "$OLD_VERSION..$NEW_VERSION"
```

**如果出现冲突：**
```bash
# 如果有冲突，需要手动解决
git status  # 查看冲突文件

# 解决冲突后
git add .
git commit -m "解决合并冲突"
```

### 步骤6：停止旧容器

```bash
# 停止容器（优雅停止，给服务时间完成当前请求）
docker-compose -f docker-compose.prod.yml stop

# 等待5秒确保容器完全停止
sleep 5

# 查看容器状态（应该是Exited状态）
docker-compose -f docker-compose.prod.yml ps
```

### 步骤7：重新构建Docker镜像

```bash
# 重新构建镜像（这可能需要5-10分钟，请耐心等待）
docker-compose -f docker-compose.prod.yml build

# 如果构建成功，你会看到：
# Successfully built xxxxx
# Successfully tagged mms-app:latest
```

**如果构建失败：**
```bash
# 查看详细错误信息
docker-compose -f docker-compose.prod.yml build --no-cache

# 常见问题：
# 1. 网络问题：检查网络连接
# 2. 磁盘空间不足：df -h 查看磁盘使用情况
# 3. Docker daemon问题：systemctl status docker
```

### 步骤8：启动新容器

```bash
# 启动容器（后台运行）
docker-compose -f docker-compose.prod.yml up -d

# 等待几秒让容器启动
sleep 5

# 查看容器状态（应该是Up状态）
docker-compose -f docker-compose.prod.yml ps
```

### 步骤9：验证服务启动

```bash
# 等待服务完全启动（数据库初始化可能需要时间）
sleep 10

# 查看容器日志
docker-compose -f docker-compose.prod.yml logs --tail=50

# 检查容器是否运行
docker ps | grep mms-app

# 测试健康检查接口
curl http://localhost:3000/api/health

# 如果返回 {"status":"ok","message":"MMS Backend is running"} 说明启动成功
```

---

## ✅ 验证更新

更新完成后，需要进行全面验证，确保系统正常运行。

### 1. 服务状态检查

```bash
# 检查容器状态
docker-compose -f docker-compose.prod.yml ps

# 期望输出：
# NAME      IMAGE           STATUS          PORTS
# mms-app   mms-app:latest  Up X minutes    0.0.0.0:3000->3000/tcp
```

### 2. 健康检查

```bash
# 本地健康检查
curl http://localhost:3000/api/health

# 期望返回：
# {"status":"ok","message":"MMS Backend is running"}
```

### 3. 浏览器访问测试

在浏览器中访问：`http://你的服务器IP:3000`

**检查清单：**
- [ ] 能够打开登录页面
- [ ] 能够使用管理员账号登录（admin / admin123）
- [ ] 仪表盘能够正常显示
- [ ] 各个功能模块（物料管理、出入库管理等）能够正常访问
- [ ] 数据没有丢失（检查物料列表、出入库记录等）

### 4. 功能测试

**建议测试以下关键功能：**
1. **登录功能**：使用管理员账号登录
2. **物料管理**：查看物料列表，创建/编辑物料
3. **出入库管理**：查看出入库单列表，创建出入库单
4. **仪表盘**：查看统计数据是否正常
5. **操作日志**：检查IP地址记录功能是否正常

### 5. 日志检查

```bash
# 查看最新日志，确保没有错误
docker-compose -f docker-compose.prod.yml logs --tail=100 | grep -i error

# 如果看到错误信息，需要根据错误内容进行排查
```

---

## 🔄 回滚操作

如果更新后发现问题，可以快速回滚到之前的版本。

### 方法1：使用Git回滚代码（推荐）

```bash
# 1. 进入项目目录
cd /opt/QLM

# 2. 查看之前的版本（使用步骤3记录的OLD_VERSION）
git log --oneline -10

# 3. 回滚到指定版本（替换COMMIT_HASH为实际版本号）
git reset --hard COMMIT_HASH

# 4. 重新构建并启动
docker-compose -f docker-compose.prod.yml stop
docker-compose -f docker-compose.prod.yml build
docker-compose -f docker-compose.prod.yml up -d

# 5. 验证回滚
docker-compose -f docker-compose.prod.yml ps
curl http://localhost:3000/api/health
```

### 方法2：恢复数据备份

如果数据出现问题，可以恢复备份：

```bash
# 1. 停止容器
docker-compose -f docker-compose.prod.yml stop

# 2. 恢复备份（替换BACKUP_FILE为实际的备份文件名）
tar -xzf backups/backup_20240101_120000.tar.gz

# 3. 启动容器
docker-compose -f docker-compose.prod.yml up -d

# 4. 验证恢复
docker-compose -f docker-compose.prod.yml ps
```

### 方法3：使用Docker镜像回滚

如果你之前保存了旧版本的Docker镜像：

```bash
# 1. 查看所有镜像
docker images | grep mms-app

# 2. 如果有旧版本镜像，可以直接使用
# 需要手动修改 docker-compose.prod.yml 指定旧镜像版本
# 或者直接使用 docker run 命令启动旧容器
```

---

## ❓ 常见问题

### 问题1：Git pull 失败，提示 "Your local changes would be overwritten"

**原因**：服务器上有未提交的本地更改

**解决方法**：
```bash
# 查看有哪些文件被修改
git status

# 方案1：暂存更改（推荐，可以保留你的修改）
git stash
git pull
git stash pop  # 如果需要恢复之前的修改

# 方案2：放弃本地修改（危险，会丢失所有本地修改）
git reset --hard
git pull
```

### 问题2：Docker构建失败，提示 "no space left on device"

**原因**：磁盘空间不足

**解决方法**：
```bash
# 1. 查看磁盘使用情况
df -h

# 2. 清理Docker无用镜像和容器
docker system prune -a

# 3. 清理旧备份文件
find backups/ -name "*.tar.gz" -mtime +7 -delete  # 删除7天前的备份

# 4. 重新构建
docker-compose -f docker-compose.prod.yml build
```

### 问题3：容器启动后立即退出

**原因**：可能有配置错误或代码错误

**解决方法**：
```bash
# 1. 查看详细日志
docker-compose -f docker-compose.prod.yml logs

# 2. 检查环境变量配置
cat .env  # 或 docker-compose.prod.yml 中的环境变量

# 3. 检查端口是否被占用
netstat -tlnp | grep 3000

# 4. 尝试在前台运行查看详细错误
docker-compose -f docker-compose.prod.yml up
```

### 问题4：更新后无法访问应用

**解决方法**：
```bash
# 1. 检查容器是否运行
docker ps | grep mms-app

# 2. 检查端口映射
docker port mms-app

# 3. 检查服务器防火墙
# CentOS
firewall-cmd --list-ports
# Ubuntu
ufw status

# 4. 检查安全组配置（在网易云控制台）
# 确保3000端口已开放

# 5. 测试本地访问
curl http://localhost:3000/api/health
```

### 问题5：更新后数据丢失

**原因**：可能数据目录没有正确挂载

**解决方法**：
```bash
# 1. 检查数据目录是否存在
ls -la data/

# 2. 检查Docker卷挂载
docker inspect mms-app | grep -A 10 Mounts

# 3. 如果数据丢失，从备份恢复
tar -xzf backups/backup_最新备份文件.tar.gz

# 4. 重新启动容器
docker-compose -f docker-compose.prod.yml restart
```

### 问题6：更新脚本执行失败

**解决方法**：
```bash
# 1. 查看脚本详细输出
bash -x scripts/update.sh

# 2. 检查脚本权限
ls -l scripts/update.sh
chmod +x scripts/update.sh

# 3. 手动执行失败的步骤（参考方式二）
```

---

## 📝 更新检查清单

更新前请确认：

- [ ] 本地代码已提交并推送到Git仓库
- [ ] 服务器可以正常SSH连接
- [ ] 服务器上Docker和Docker Compose正常运行
- [ ] 当前服务运行正常
- [ ] 已记录当前版本号
- [ ] 已备份数据

更新后请验证：

- [ ] 容器状态正常（Up）
- [ ] 健康检查通过
- [ ] 浏览器可以正常访问
- [ ] 登录功能正常
- [ ] 关键功能模块正常
- [ ] 数据没有丢失
- [ ] 日志中没有严重错误

---

## 🎯 最佳实践

1. **定期更新**：建议每周或每次重要功能发布后及时更新
2. **测试环境验证**：如果有测试环境，先在测试环境验证后再更新生产环境
3. **备份优先**：更新前一定要备份，更新后保留备份至少3天
4. **维护窗口**：建议在业务低峰期（如凌晨）进行更新
5. **监控告警**：更新后密切关注服务器资源使用情况和应用日志
6. **版本记录**：记录每次更新的版本号和更新内容

---

## 📞 需要帮助？

如果遇到问题无法解决，请：

1. 查看本文档的[常见问题](#常见问题)部分
2. 查看详细的错误日志：`docker-compose -f docker-compose.prod.yml logs`
3. 检查服务器资源使用情况：`docker stats`、`df -h`、`free -h`
4. 联系技术支持或查看项目文档

---

**最后更新：2024-01-XX**
**适用于：清绿氢能物料管理系统 v1.0+**

