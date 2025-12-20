# 阿里云ECS已有系统更新部署指南

**清绿氢能物料管理系统 - 已有系统更新部署步骤**

本指南适用于在阿里云ECS上已经有运行中的系统，需要更新到最新版本的情况。

---

## 📋 目录

1. [准备工作](#准备工作)
2. [方式一：使用更新脚本（推荐）](#方式一使用更新脚本推荐)
3. [方式二：手动更新部署](#方式二手动更新部署)
4. [验证部署](#验证部署)
5. [常见问题](#常见问题)

---

## 🔍 准备工作

### 1. 确认当前系统状态

**连接到ECS服务器：**
```bash
ssh root@你的服务器IP
# 或
ssh 用户名@你的服务器IP
```

**检查当前服务状态：**
```bash
# 查看Docker容器状态
docker ps | grep mms-app

# 或使用docker-compose查看
cd /opt/QLM  # 根据你的实际项目目录调整
docker-compose -f docker-compose.prod.yml ps

# 查看应用是否可访问
curl http://localhost:3000/api/health
```

### 2. 确认项目目录

通常项目部署在以下目录之一：
- `/opt/QLM`
- `/home/用户名/QLM`
- `/var/www/QLM`

**查找项目目录：**
```bash
# 查找docker-compose.prod.yml文件
find / -name "docker-compose.prod.yml" 2>/dev/null

# 或查找项目目录
find / -type d -name "QLM" 2>/dev/null
```

### 3. 记录关键信息

```bash
# 进入项目目录（假设是 /opt/QLM）
cd /opt/QLM  # 替换为你的实际目录

# 记录当前Git状态
git log --oneline -1 > /tmp/current_version.txt
cat /tmp/current_version.txt

# 记录当前容器ID
docker ps | grep mms-app > /tmp/current_container.txt
cat /tmp/current_container.txt
```

---

## 🚀 方式一：使用更新脚本（推荐）

这是最简单、最安全的方式，脚本会自动处理所有步骤。

### 步骤1：检查更新脚本是否存在

```bash
cd /opt/QLM  # 替换为你的实际目录

# 检查脚本是否存在
ls -la scripts/update.sh

# 如果不存在，需要从Git拉取或手动创建
```

**如果脚本不存在，有两种方式获取：**

**方式A：如果目录是Git仓库，拉取最新代码：**
```bash
cd /opt/QLM
git pull origin main
```

**方式B：如果目录不是Git仓库，需要先初始化：**
```bash
cd /opt/QLM
git init
git remote add origin https://github.com/xinxinzai98/QLM.git
git fetch origin main
git checkout -b main origin/main
```

### 步骤2：设置脚本权限

```bash
cd /opt/QLM
chmod +x scripts/update.sh
```

### 步骤3：执行更新脚本

```bash
cd /opt/QLM
./scripts/update.sh
```

**脚本会自动完成以下操作：**
1. ✅ 检查必要文件
2. ✅ 检查并配置Git远程仓库（确保指向正确的GitHub地址）
3. ✅ 备份数据目录（`data/`）
4. ✅ 拉取最新代码
5. ✅ 停止旧容器
6. ✅ 重新构建Docker镜像
7. ✅ 启动新容器
8. ✅ 等待服务启动
9. ✅ 执行健康检查

**预期输出：**
```
==========================================
[INFO] 开始代码更新流程
==========================================

[INFO] 检查必要文件...
[SUCCESS] 文件检查通过
[INFO] 检查Git远程仓库配置...
[INFO] 远程仓库配置正确: https://github.com/xinxinzai98/QLM.git
[INFO] 备份数据...
[SUCCESS] 数据备份完成: backups/backup_20240101_120000.tar.gz
[INFO] 拉取最新代码（分支: main，仓库: https://github.com/xinxinzai98/QLM.git）...
[SUCCESS] 代码拉取成功
[SUCCESS] 代码合并成功
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

---

## 🔧 方式二：手动更新部署

如果你想要更多控制，或者脚本执行失败，可以手动执行以下步骤。

### 步骤1：连接到服务器

```bash
ssh root@你的服务器IP
```

### 步骤2：进入项目目录

```bash
cd /opt/QLM  # 根据你的实际部署目录调整
```

### 步骤3：配置Git仓库（如果还没有配置）

**检查是否是Git仓库：**
```bash
ls -la .git
```

**如果不是Git仓库，初始化并配置：**
```bash
# 初始化Git仓库
git init

# 添加远程仓库
git remote add origin https://github.com/xinxinzai98/QLM.git

# 拉取远程代码
git fetch origin main

# 创建本地分支并跟踪远程分支
git checkout -b main origin/main
```

**如果已经是Git仓库，检查远程仓库配置：**
```bash
# 查看远程仓库地址
git remote -v

# 如果地址不正确，更新为正确的地址
git remote set-url origin https://github.com/xinxinzai98/QLM.git

# 验证远程仓库
git remote -v
```

### 步骤4：备份数据（重要！）

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

### 步骤5：拉取最新代码

```bash
# 记录更新前的版本（用于回滚）
OLD_VERSION=$(git rev-parse HEAD)
echo "更新前版本: $OLD_VERSION"

# 如果有未提交的更改，先暂存
if [ -n "$(git status --porcelain 2>/dev/null)" ]; then
    echo "检测到未提交的更改，正在暂存..."
    git stash push -m "Auto-stash before update $(date +%Y%m%d_%H%M%S)"
fi

# 拉取最新代码
git fetch origin main

# 确保在main分支上
git checkout main

# 合并最新代码
git pull origin main

# 查看更新后的版本
NEW_VERSION=$(git rev-parse HEAD)
echo "更新后版本: $NEW_VERSION"

# 查看更新了哪些内容
git log --oneline "$OLD_VERSION..$NEW_VERSION"
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

## ✅ 验证部署

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

## ❓ 常见问题

### 问题1：项目目录不是Git仓库

**症状**：执行 `git pull` 时提示 "not a git repository"

**解决方法：**
```bash
cd /opt/QLM  # 你的项目目录

# 初始化Git仓库
git init

# 添加远程仓库
git remote add origin https://github.com/xinxinzai98/QLM.git

# 拉取代码
git fetch origin main
git checkout -b main origin/main
```

### 问题2：Git远程仓库地址不正确

**症状**：`git remote -v` 显示的地址不是 `https://github.com/xinxinzai98/QLM.git`

**解决方法：**
```bash
# 更新远程仓库地址
git remote set-url origin https://github.com/xinxinzai98/QLM.git

# 验证
git remote -v
```

### 问题3：拉取代码时出现冲突

**症状**：`git pull` 提示合并冲突

**解决方法：**
```bash
# 查看冲突文件
git status

# 如果有重要更改，先备份
cp -r . ../backup_before_merge/

# 强制使用远程版本（会覆盖本地更改）
git fetch origin main
git reset --hard origin/main

# 或者保留本地更改，手动解决冲突
git stash  # 暂存本地更改
git pull origin main
git stash pop  # 恢复本地更改，手动解决冲突
```

### 问题4：Docker构建失败

**症状**：`docker-compose build` 失败

**解决方法：**
```bash
# 1. 检查磁盘空间
df -h

# 2. 清理Docker缓存
docker system prune -a

# 3. 重新构建（不使用缓存）
docker-compose -f docker-compose.prod.yml build --no-cache

# 4. 查看详细错误
docker-compose -f docker-compose.prod.yml build 2>&1 | tee build.log
```

### 问题5：容器启动后立即退出

**症状**：`docker ps` 看不到容器，或状态显示 `Exited`

**解决方法：**
```bash
# 1. 查看容器日志
docker-compose -f docker-compose.prod.yml logs

# 2. 检查环境变量
cat .env  # 或 docker-compose.prod.yml 中的环境变量

# 3. 检查端口是否被占用
netstat -tlnp | grep 3000

# 4. 尝试在前台运行查看详细错误
docker-compose -f docker-compose.prod.yml up
```

### 问题6：更新后数据丢失

**症状**：更新后数据库中的数据显示为空或丢失

**解决方法：**
```bash
# 1. 检查数据目录是否存在
ls -la data/database/

# 2. 检查Docker卷挂载
docker inspect mms-app | grep -A 10 Mounts

# 3. 如果数据丢失，从备份恢复
cd /opt/QLM
tar -xzf backups/backup_最新备份文件.tar.gz

# 4. 重新启动容器
docker-compose -f docker-compose.prod.yml restart
```

### 问题7：更新脚本执行失败

**症状**：`./scripts/update.sh` 执行过程中出错

**解决方法：**
```bash
# 1. 查看脚本详细输出
bash -x scripts/update.sh

# 2. 检查脚本权限
ls -l scripts/update.sh
chmod +x scripts/update.sh

# 3. 手动执行失败的步骤（参考方式二）

# 4. 检查错误日志
tail -f /var/log/syslog  # 系统日志
dmesg | tail -20  # 内核日志
```

---

## 📝 快速参考命令

### 最常用的更新命令（一行搞定）

```bash
# 使用更新脚本（推荐）
cd /opt/QLM && ./scripts/update.sh

# 或手动更新（三行命令）
cd /opt/QLM && git pull origin main && docker-compose -f docker-compose.prod.yml stop && docker-compose -f docker-compose.prod.yml up -d --build
```

### 常用检查命令

```bash
# 查看服务状态
docker-compose -f docker-compose.prod.yml ps

# 查看日志
docker-compose -f docker-compose.prod.yml logs -f

# 查看容器资源使用
docker stats mms-app

# 查看磁盘使用
df -h

# 查看内存使用
free -h
```

---

## 🎯 最佳实践

1. **定期更新**：建议每周或每次重要功能发布后及时更新
2. **备份优先**：更新前一定要备份，更新后保留备份至少3天
3. **维护窗口**：建议在业务低峰期（如凌晨）进行更新
4. **测试验证**：更新后立即进行功能测试，确保系统正常
5. **监控告警**：更新后密切关注服务器资源使用情况和应用日志
6. **版本记录**：记录每次更新的版本号和更新内容

---

## 📞 需要帮助？

如果遇到问题无法解决，请：

1. 查看本文档的[常见问题](#常见问题)部分
2. 查看详细的错误日志：`docker-compose -f docker-compose.prod.yml logs`
3. 检查服务器资源使用情况：`docker stats`、`df -h`、`free -h`
4. 查看更新脚本日志
5. 联系技术支持或查看项目文档

---

**最后更新：2024-01-XX**  
**适用于：清绿氢能物料管理系统 v1.0+**  
**GitHub仓库：https://github.com/xinxinzai98/QLM.git**

