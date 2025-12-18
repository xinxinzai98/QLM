# 🔧 维护脚本使用指南

本文档介绍如何使用项目提供的维护脚本进行日常运维工作。

## 📋 脚本列表

| 脚本 | 功能 | 位置 |
|------|------|------|
| `update.sh` | 代码更新和重新部署 | `scripts/update.sh` |
| `backup.sh` | 数据备份 | `scripts/backup.sh` |
| `restore.sh` | 数据恢复 | `scripts/restore.sh` |
| `status.sh` | 查看服务状态 | `scripts/status.sh` |
| `logs.sh` | 查看日志 | `scripts/logs.sh` |

## 🚀 快速开始

### 1. 确保脚本有执行权限

```bash
cd ~/QLM
chmod +x scripts/*.sh
```

## 📖 脚本详细说明

### 1. update.sh - 代码更新脚本

用于更新代码并重新部署应用。

**基本用法：**
```bash
# 完整更新流程（备份 → 拉取代码 → 重新构建 → 启动）
./scripts/update.sh

# 指定 Git 分支
BRANCH=develop ./scripts/update.sh

# 指定备份保留天数
KEEP_BACKUPS_DAYS=30 ./scripts/update.sh
```

**功能：**
- ✅ 自动备份数据（更新前）
- ✅ 拉取最新代码
- ✅ 停止旧容器
- ✅ 重新构建镜像
- ✅ 启动新容器
- ✅ 健康检查
- ✅ 自动清理旧备份

**环境变量：**
- `BACKUP_DIR`: 备份目录（默认: `./backups`）
- `BRANCH`: Git 分支（默认: `main`）
- `KEEP_BACKUPS_DAYS`: 保留备份天数（可选）

---

### 2. backup.sh - 数据备份脚本

用于备份数据库和上传文件。

**基本用法：**
```bash
# 备份所有数据（默认）
./scripts/backup.sh

# 只备份数据库
./scripts/backup.sh database

# 只备份上传文件
./scripts/backup.sh uploads

# 列出所有备份
./scripts/backup.sh --list

# 清理7天前的备份
./scripts/backup.sh --cleanup 7
```

**备份类型：**
- `full`: 备份所有数据（数据库 + 上传文件）
- `database`: 只备份数据库
- `uploads`: 只备份上传文件

**备份文件位置：**
- 默认目录: `./backups/`
- 文件名格式: `backup_[类型]_[时间戳].tar.gz`

**环境变量：**
- `BACKUP_DIR`: 备份目录（默认: `./backups`）

---

### 3. restore.sh - 数据恢复脚本

用于从备份恢复数据。

**基本用法：**
```bash
# 恢复备份（交互式确认）
./scripts/restore.sh backups/backup_full_20241218_120000.tar.gz

# 列出可用备份
./scripts/restore.sh --list

# 恢复前不备份当前数据
./scripts/restore.sh backup_file.tar.gz --no-backup

# 恢复后不重启容器
./scripts/restore.sh backup_file.tar.gz --no-restart
```

**注意事项：**
- ⚠️ 恢复操作会覆盖现有数据
- ⚠️ 默认会在恢复前备份当前数据
- ⚠️ 恢复后会自动重启容器

---

### 4. status.sh - 状态查看脚本

用于查看服务运行状态。

**基本用法：**
```bash
# 显示所有状态信息（默认）
./scripts/status.sh

# 只检查服务健康
./scripts/status.sh --health

# 只查看资源使用
./scripts/status.sh --resources

# 只查看数据目录
./scripts/status.sh --data

# 只显示最近日志
./scripts/status.sh --logs
```

**显示信息：**
- 容器运行状态
- 服务健康检查
- 资源使用情况（CPU、内存）
- 数据目录大小
- 系统信息
- 最近日志

---

### 5. logs.sh - 日志查看脚本

用于查看容器日志。

**基本用法：**
```bash
# 显示最近100行日志（默认）
./scripts/logs.sh

# 显示最近50行日志
./scripts/logs.sh 50

# 实时跟踪日志（类似 tail -f）
./scripts/logs.sh --follow

# 只显示错误日志
./scripts/logs.sh --error

# 显示最近1小时的日志
./scripts/logs.sh --since 1h
```

**时间格式：**
- `10m` - 10分钟前
- `1h` - 1小时前
- `2024-12-18T12:00:00` - 指定时间

---

## 🔄 常见维护场景

### 场景1: 日常代码更新

```bash
# 1. 进入项目目录
cd ~/QLM

# 2. 执行更新脚本（自动备份 + 更新 + 部署）
./scripts/update.sh
```

### 场景2: 定期备份

```bash
# 手动备份
./scripts/backup.sh

# 或设置定时任务（每日凌晨2点备份）
crontab -e
# 添加：
0 2 * * * cd /root/QLM && ./scripts/backup.sh
```

### 场景3: 查看服务状态

```bash
# 快速查看所有状态
./scripts/status.sh

# 只检查健康状态
./scripts/status.sh --health
```

### 场景4: 故障排查

```bash
# 查看最近日志
./scripts/logs.sh 200

# 实时跟踪日志
./scripts/logs.sh --follow

# 查看错误日志
./scripts/logs.sh --error
```

### 场景5: 数据恢复

```bash
# 1. 列出可用备份
./scripts/restore.sh --list

# 2. 恢复指定备份
./scripts/restore.sh backups/backup_full_20241218_120000.tar.gz
```

---

## 🛡️ 数据备份策略

### 推荐备份策略

1. **更新前备份**: `update.sh` 会自动备份
2. **每日备份**: 设置 crontab 定时任务
3. **重要操作前备份**: 手动执行备份

### 备份保留策略

```bash
# 清理7天前的备份
./scripts/backup.sh --cleanup 7

# 或设置环境变量在更新时自动清理
KEEP_BACKUPS_DAYS=7 ./scripts/update.sh
```

### 备份存储位置

- 本地备份: `./backups/`
- 建议定期将备份文件下载到本地或上传到云存储

---

## ⚙️ 环境变量配置

可以在 `~/.bashrc` 或脚本中设置环境变量：

```bash
# 备份目录
export BACKUP_DIR="/backups/mms"

# Git 分支
export BRANCH="main"

# 备份保留天数
export KEEP_BACKUPS_DAYS=7
```

---

## 🔍 故障排查

### 问题1: 脚本无执行权限

```bash
chmod +x scripts/*.sh
```

### 问题2: 找不到 docker-compose

```bash
# 检查是否安装
docker-compose --version

# 或使用 docker compose（新版本）
# 需要修改脚本中的 docker-compose 为 docker compose
```

### 问题3: 备份失败

```bash
# 检查磁盘空间
df -h

# 检查数据目录权限
ls -la data/
chmod -R 755 data/
```

### 问题4: 容器启动失败

```bash
# 查看日志
./scripts/logs.sh --error

# 查看状态
./scripts/status.sh

# 检查配置
cat docker-compose.prod.yml
cat .env
```

---

## 📝 最佳实践

1. **更新前备份**: 始终在执行更新前备份数据
2. **测试备份恢复**: 定期测试备份文件是否可以正常恢复
3. **监控资源**: 定期使用 `status.sh` 检查资源使用情况
4. **日志轮转**: 定期清理旧日志，避免磁盘空间不足
5. **文档记录**: 记录重要操作和配置变更

---

## 🔗 相关文档

- [部署指南](./DEPLOYMENT.md)
- [Docker部署指南](../DOCKER_DEPLOYMENT_GUIDE.md)
- [API文档](./api/API.md)

---

## 💡 提示

- 所有脚本都支持 `--help` 参数查看帮助
- 建议使用 root 用户运行脚本，确保有足够权限
- 重要操作前建议先测试
- 定期检查备份文件是否完整

