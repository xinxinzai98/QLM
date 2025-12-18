# 🔧 维护脚本

本目录包含用于维护和运维生产环境的脚本。

## 📋 脚本列表

| 脚本 | 功能 | 用法 |
|------|------|------|
| `update.sh` | 代码更新和重新部署 | `./scripts/update.sh` |
| `backup.sh` | 数据备份 | `./scripts/backup.sh [full\|database\|uploads]` |
| `restore.sh` | 数据恢复 | `./scripts/restore.sh <backup_file>` |
| `status.sh` | 查看服务状态 | `./scripts/status.sh` |
| `logs.sh` | 查看日志 | `./scripts/logs.sh [lines]` |

## 🚀 快速开始

### 1. 设置执行权限（在服务器上）

```bash
cd ~/QLM
chmod +x scripts/*.sh
```

### 2. 常用命令

```bash
# 更新代码并重新部署
./scripts/update.sh

# 备份数据
./scripts/backup.sh

# 查看状态
./scripts/status.sh

# 查看日志
./scripts/logs.sh

# 查看帮助
./scripts/update.sh --help
./scripts/backup.sh --help
./scripts/restore.sh --help
```

## 📖 详细文档

查看完整文档：[MAINTENANCE.md](../docs/MAINTENANCE.md)

