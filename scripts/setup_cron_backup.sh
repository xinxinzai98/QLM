#!/bin/bash

# ============================================
# 定时备份配置脚本
# 用于配置cron定时任务自动执行备份
# ============================================

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 打印函数
info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 获取脚本所在目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
BACKUP_SCRIPT="$SCRIPT_DIR/scheduled_backup.sh"

# 默认配置
BACKUP_SCHEDULE="${1:-0 2 * * *}"  # 默认每天凌晨2点
BACKUP_TYPE="${2:-full}"  # full, database, uploads
KEEP_DAYS="${3:-30}"  # 保留30天

# 检查备份脚本是否存在
if [ ! -f "$BACKUP_SCRIPT" ]; then
    error "备份脚本不存在: $BACKUP_SCRIPT"
    exit 1
fi

# 设置脚本执行权限
chmod +x "$BACKUP_SCRIPT"
success "已设置备份脚本执行权限"

# 生成cron任务命令
# 设置环境变量，确保脚本能找到正确的路径
CRON_COMMAND="$BACKUP_SCHEDULE cd $PROJECT_DIR && BACKUP_TYPE=$BACKUP_TYPE KEEP_DAYS=$KEEP_DAYS $BACKUP_SCRIPT >> $PROJECT_DIR/backups/cron_backup.log 2>&1"

# 显示配置信息
echo ""
info "=========================================="
info "定时备份配置"
info "=========================================="
echo ""
info "备份脚本: $BACKUP_SCRIPT"
info "项目目录: $PROJECT_DIR"
info "备份类型: $BACKUP_TYPE"
info "保留天数: $KEEP_DAYS 天"
info "执行时间: $BACKUP_SCHEDULE"
echo ""
info "Cron任务命令:"
echo "  $CRON_COMMAND"
echo ""

# 询问用户确认
read -p "是否添加此定时任务到crontab? (y/N): " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    warn "操作已取消"
    exit 0
fi

# 检查crontab是否存在
if ! command -v crontab &> /dev/null; then
    error "crontab命令不存在，请先安装cron"
    echo ""
    echo "安装方法："
    echo "  CentOS/RHEL: yum install cronie"
    echo "  Ubuntu/Debian: apt-get install cron"
    exit 1
fi

# 备份现有crontab
CRONTAB_BACKUP="/tmp/crontab_backup_$(date +%Y%m%d_%H%M%S).txt"
crontab -l > "$CRONTAB_BACKUP" 2>/dev/null || touch "$CRONTAB_BACKUP"
info "已备份现有crontab到: $CRONTAB_BACKUP"

# 检查是否已存在相同的任务
EXISTING_CRON=$(crontab -l 2>/dev/null | grep -F "$BACKUP_SCRIPT" || true)
if [ -n "$EXISTING_CRON" ]; then
    warn "检测到已存在的备份任务："
    echo "  $EXISTING_CRON"
    echo ""
    read -p "是否删除旧任务并添加新任务? (y/N): " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        # 删除旧任务
        crontab -l 2>/dev/null | grep -v "$BACKUP_SCRIPT" | crontab -
        success "已删除旧任务"
    else
        warn "操作已取消"
        exit 0
    fi
fi

# 添加新任务
(crontab -l 2>/dev/null; echo "$CRON_COMMAND") | crontab -

success "定时备份任务已添加！"
echo ""
info "查看当前crontab:"
crontab -l
echo ""
info "常用时间表达式示例："
echo "  每天凌晨2点:  0 2 * * *"
echo "  每天凌晨3点:  0 3 * * *"
echo "  每6小时:      0 */6 * * *"
echo "  每天2点和14点: 0 2,14 * * *"
echo "  每周日凌晨2点: 0 2 * * 0"
echo ""
info "查看备份日志:"
echo "  tail -f $PROJECT_DIR/backups/backup.log"
echo "  tail -f $PROJECT_DIR/backups/cron_backup.log"
echo ""
info "手动测试备份:"
echo "  $BACKUP_SCRIPT"
echo ""
info "移除定时任务:"
echo "  crontab -e  # 然后删除对应行"
echo "  或运行: crontab -l | grep -v '$BACKUP_SCRIPT' | crontab -"

