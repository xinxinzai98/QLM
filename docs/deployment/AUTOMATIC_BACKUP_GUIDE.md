# 数据库定时备份功能使用指南

**清绿氢能物料管理系统 - 自动备份配置指南**

---

## 📋 目录

1. [功能概述](#功能概述)
2. [快速开始](#快速开始)
3. [配置定时备份](#配置定时备份)
4. [备份脚本说明](#备份脚本说明)
5. [备份恢复](#备份恢复)
6. [常见问题](#常见问题)

---

## 🎯 功能概述

定时备份功能可以自动定期备份数据库和上传文件，支持：

- ✅ **自动备份**：通过cron定时任务自动执行
- ✅ **多种备份类型**：完整备份、仅数据库、仅上传文件
- ✅ **自动清理**：自动删除超过保留期限的旧备份
- ✅ **日志记录**：详细的备份日志记录
- ✅ **灵活配置**：可自定义备份时间、类型、保留天数

---

## 🚀 快速开始

### 1. 设置备份脚本权限

```bash
cd /opt/QLM  # 或你的项目目录

# 设置执行权限
chmod +x scripts/scheduled_backup.sh
chmod +x scripts/setup_cron_backup.sh
```

### 2. 手动测试备份（确保脚本正常）

```bash
# 测试完整备份
./scripts/scheduled_backup.sh

# 或指定备份类型
BACKUP_TYPE=database ./scripts/scheduled_backup.sh
```

### 3. 配置定时任务

```bash
# 使用配置脚本（推荐）
./scripts/setup_cron_backup.sh

# 或手动配置（见下方详细说明）
```

---

## ⚙️ 配置定时备份

### 方式一：使用配置脚本（推荐）

```bash
cd /opt/QLM
./scripts/setup_cron_backup.sh
```

**配置脚本会引导你：**
1. 选择备份类型（full/database/uploads）
2. 设置执行时间（cron表达式）
3. 设置保留天数
4. 自动添加到crontab

**示例：**

```bash
# 每天凌晨2点完整备份，保留30天
./scripts/setup_cron_backup.sh "0 2 * * *" full 30

# 每天凌晨3点只备份数据库，保留7天
./scripts/setup_cron_backup.sh "0 3 * * *" database 7

# 每小时备份一次（测试用）
./scripts/setup_cron_backup.sh "0 * * * *" database 3
```

### 方式二：手动配置crontab

```bash
# 编辑crontab
crontab -e

# 添加以下行（根据你的需求修改）
# 每天凌晨2点完整备份
0 2 * * * cd /opt/QLM && BACKUP_TYPE=full KEEP_DAYS=30 /opt/QLM/scripts/scheduled_backup.sh >> /opt/QLM/backups/cron_backup.log 2>&1

# 或每天凌晨2点和14点各备份一次
0 2,14 * * * cd /opt/QLM && BACKUP_TYPE=database KEEP_DAYS=7 /opt/QLM/scripts/scheduled_backup.sh >> /opt/QLM/backups/cron_backup.log 2>&1
```

### Cron时间表达式说明

| 表达式 | 说明 | 示例 |
|--------|------|------|
| `0 2 * * *` | 每天凌晨2点 | 每天02:00 |
| `0 */6 * * *` | 每6小时 | 00:00, 06:00, 12:00, 18:00 |
| `0 2,14 * * *` | 每天2点和14点 | 每天02:00和14:00 |
| `0 2 * * 0` | 每周日凌晨2点 | 每周日02:00 |
| `0 0 1 * *` | 每月1号凌晨 | 每月1号00:00 |
| `*/30 * * * *` | 每30分钟 | 每小时的第0和第30分钟 |

---

## 📝 备份脚本说明

### 环境变量配置

可以通过环境变量自定义备份行为：

```bash
# 备份目录（默认: 项目目录/backups）
BACKUP_DIR=/path/to/backups

# 数据目录（默认: 项目目录/data）
DATA_DIR=/path/to/data

# 备份类型: full, database, uploads（默认: full）
BACKUP_TYPE=full

# 保留天数（默认: 30天）
KEEP_DAYS=30

# 日志文件路径（默认: backups/backup.log）
LOG_FILE=/path/to/backup.log
```

### 使用示例

```bash
# 完整备份
BACKUP_TYPE=full KEEP_DAYS=30 ./scripts/scheduled_backup.sh

# 只备份数据库
BACKUP_TYPE=database KEEP_DAYS=7 ./scripts/scheduled_backup.sh

# 只备份上传文件
BACKUP_TYPE=uploads KEEP_DAYS=14 ./scripts/scheduled_backup.sh

# 自定义备份目录和保留天数
BACKUP_DIR=/opt/backups KEEP_DAYS=60 ./scripts/scheduled_backup.sh
```

---

## 🔄 备份恢复

### 查看备份列表

```bash
cd /opt/QLM

# 查看所有备份文件
ls -lh backups/

# 查看最新备份
cat backups/latest_full_backup.txt
cat backups/latest_database_backup.txt
```

### 恢复备份

**使用恢复脚本（推荐）：**

```bash
# 恢复完整备份
./scripts/restore.sh backups/backup_full_20240101_020000.tar.gz

# 恢复数据库备份
./scripts/restore.sh backups/backup_database_20240101_020000.tar.gz
```

**手动恢复：**

```bash
# 停止容器
docker-compose -f docker-compose.prod.yml stop

# 恢复备份
cd /opt/QLM
tar -xzf backups/backup_full_20240101_020000.tar.gz

# 确保权限正确
chmod -R 755 data/

# 启动容器
docker-compose -f docker-compose.prod.yml up -d
```

---

## 📊 备份日志

### 查看备份日志

```bash
# 查看备份日志
tail -f /opt/QLM/backups/backup.log

# 查看cron执行日志
tail -f /opt/QLM/backups/cron_backup.log

# 查看最近的备份记录
grep "SUCCESS" /opt/QLM/backups/backup.log | tail -10
```

### 日志格式

日志文件包含以下信息：
- 备份开始和结束时间
- 备份类型和路径
- 备份文件大小
- 清理操作记录
- 错误信息（如果有）

---

## ❓ 常见问题

### 问题1：cron任务没有执行

**检查方法：**

```bash
# 查看cron服务状态
systemctl status cron  # Ubuntu/Debian
systemctl status crond  # CentOS/RHEL

# 查看crontab任务
crontab -l

# 查看cron日志（系统日志）
grep CRON /var/log/syslog  # Ubuntu/Debian
grep CRON /var/log/cron  # CentOS/RHEL
```

**解决方法：**

```bash
# 启动cron服务
sudo systemctl start cron  # Ubuntu/Debian
sudo systemctl start crond  # CentOS/RHEL

# 设置开机自启
sudo systemctl enable cron
```

### 问题2：备份脚本找不到路径

**原因：** cron执行时环境变量可能不同

**解决方法：**

在crontab中使用绝对路径：

```bash
0 2 * * * cd /opt/QLM && /opt/QLM/scripts/scheduled_backup.sh >> /opt/QLM/backups/cron_backup.log 2>&1
```

### 问题3：备份文件权限问题

**解决方法：**

```bash
# 确保备份目录有写权限
chmod 755 backups/
chown -R $(whoami) backups/

# 确保备份脚本有执行权限
chmod +x scripts/scheduled_backup.sh
```

### 问题4：磁盘空间不足

**检查磁盘使用：**

```bash
# 查看磁盘使用情况
df -h

# 查看备份目录大小
du -sh backups/

# 手动清理旧备份
find backups/ -name "backup_*.tar.gz" -mtime +30 -delete
```

### 问题5：如何临时禁用定时备份

**方法1：注释cron任务**

```bash
crontab -e
# 在对应行前添加 # 注释掉
```

**方法2：删除cron任务**

```bash
# 编辑crontab删除对应行
crontab -e

# 或使用命令删除
crontab -l | grep -v "scheduled_backup.sh" | crontab -
```

---

## 🔧 高级配置

### 配置多个备份任务

可以配置多个不同的备份任务：

```bash
# 每天凌晨2点完整备份
0 2 * * * cd /opt/QLM && BACKUP_TYPE=full KEEP_DAYS=30 /opt/QLM/scripts/scheduled_backup.sh >> /opt/QLM/backups/cron_backup.log 2>&1

# 每小时备份一次数据库（快速恢复）
0 * * * * cd /opt/QLM && BACKUP_TYPE=database KEEP_DAYS=1 /opt/QLM/scripts/scheduled_backup.sh >> /opt/QLM/backups/cron_db_backup.log 2>&1
```

### 备份到远程服务器

可以修改备份脚本，在备份完成后上传到远程服务器：

```bash
# 在脚本中添加（需要配置SSH密钥）
rsync -avz backups/ user@remote-server:/backups/qlm/
```

### 备份通知

可以在备份脚本中添加通知功能（邮件、Slack等）：

```bash
# 备份成功后发送邮件
if [ $? -eq 0 ]; then
    echo "备份成功" | mail -s "QLM备份成功" admin@example.com
fi
```

---

## 📋 备份策略建议

### 小型系统（数据量<1GB）

- **完整备份**：每天凌晨2点
- **保留时间**：7-14天
- **备份类型**：full

### 中型系统（数据量1-10GB）

- **完整备份**：每天凌晨2点
- **增量备份**：每6小时备份数据库
- **保留时间**：完整备份30天，增量备份3天
- **备份类型**：full + database

### 大型系统（数据量>10GB）

- **完整备份**：每周日凌晨2点
- **数据库备份**：每天凌晨2点
- **增量备份**：每3小时备份数据库
- **保留时间**：完整备份90天，数据库备份30天，增量备份1天

---

## ✅ 验证备份功能

### 1. 手动执行备份

```bash
cd /opt/QLM
./scripts/scheduled_backup.sh
```

### 2. 检查备份文件

```bash
ls -lh backups/
cat backups/latest_full_backup.txt
```

### 3. 测试恢复

```bash
# 使用恢复脚本测试
./scripts/restore.sh backups/backup_full_最新备份.tar.gz
```

### 4. 查看cron任务

```bash
crontab -l
```

### 5. 等待下一次执行并查看日志

```bash
tail -f backups/cron_backup.log
```

---

**最后更新：2024-01-XX**  
**适用于：清绿氢能物料管理系统 v1.0+**

