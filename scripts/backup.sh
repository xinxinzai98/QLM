#!/bin/bash

# ============================================
# 数据备份脚本
# 用于备份数据库和上传文件
# ============================================

set -e  # 遇到错误立即退出

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

# 默认配置
BACKUP_DIR="${BACKUP_DIR:-$PROJECT_DIR/backups}"
DATA_DIR="$PROJECT_DIR/data"
BACKUP_TYPE="${1:-full}"  # full, database, uploads

# 创建备份目录
mkdir -p "$BACKUP_DIR"

# 检查数据目录
check_data_dir() {
    if [ ! -d "$DATA_DIR" ]; then
        error "数据目录不存在: $DATA_DIR"
        exit 1
    fi
}

# 备份所有数据
backup_full() {
    info "备份所有数据（数据库 + 上传文件）..."
    
    TIMESTAMP=$(date +%Y%m%d_%H%M%S)
    BACKUP_FILE="$BACKUP_DIR/backup_full_${TIMESTAMP}.tar.gz"
    
    tar -czf "$BACKUP_FILE" -C "$PROJECT_DIR" data/
    
    if [ $? -eq 0 ]; then
        BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
        success "备份完成: $BACKUP_FILE"
        info "备份文件大小: $BACKUP_SIZE"
        echo "$BACKUP_FILE" > "$BACKUP_DIR/latest_full_backup.txt"
    else
        error "备份失败"
        exit 1
    fi
}

# 只备份数据库
backup_database() {
    info "备份数据库..."
    
    if [ ! -d "$DATA_DIR/database" ]; then
        error "数据库目录不存在: $DATA_DIR/database"
        exit 1
    fi
    
    TIMESTAMP=$(date +%Y%m%d_%H%M%S)
    BACKUP_FILE="$BACKUP_DIR/backup_database_${TIMESTAMP}.tar.gz"
    
    tar -czf "$BACKUP_FILE" -C "$PROJECT_DIR" data/database/
    
    if [ $? -eq 0 ]; then
        BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
        success "数据库备份完成: $BACKUP_FILE"
        info "备份文件大小: $BACKUP_SIZE"
        echo "$BACKUP_FILE" > "$BACKUP_DIR/latest_database_backup.txt"
    else
        error "数据库备份失败"
        exit 1
    fi
}

# 只备份上传文件
backup_uploads() {
    info "备份上传文件..."
    
    if [ ! -d "$DATA_DIR/uploads" ]; then
        error "上传文件目录不存在: $DATA_DIR/uploads"
        exit 1
    fi
    
    TIMESTAMP=$(date +%Y%m%d_%H%M%S)
    BACKUP_FILE="$BACKUP_DIR/backup_uploads_${TIMESTAMP}.tar.gz"
    
    tar -czf "$BACKUP_FILE" -C "$PROJECT_DIR" data/uploads/
    
    if [ $? -eq 0 ]; then
        BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
        success "上传文件备份完成: $BACKUP_FILE"
        info "备份文件大小: $BACKUP_SIZE"
        echo "$BACKUP_FILE" > "$BACKUP_DIR/latest_uploads_backup.txt"
    else
        error "上传文件备份失败"
        exit 1
    fi
}

# 列出备份文件
list_backups() {
    info "备份文件列表："
    echo ""
    
    if [ -d "$BACKUP_DIR" ] && [ -n "$(ls -A "$BACKUP_DIR"/*.tar.gz 2>/dev/null)" ]; then
        ls -lh "$BACKUP_DIR"/*.tar.gz | awk '{print $9, "(" $5 ")"}'
        echo ""
        info "备份目录: $BACKUP_DIR"
    else
        warn "未找到备份文件"
    fi
}

# 清理旧备份
cleanup_old_backups() {
    local days=${1:-7}
    
    info "清理 $days 天前的备份..."
    
    find "$BACKUP_DIR" -name "backup_*.tar.gz" -mtime +$days -delete
    
    success "旧备份已清理（保留最近 $days 天）"
}

# 显示使用说明
show_usage() {
    echo "用法: $0 [backup_type] [options]"
    echo ""
    echo "备份类型:"
    echo "  full       - 备份所有数据（默认）"
    echo "  database   - 只备份数据库"
    echo "  uploads    - 只备份上传文件"
    echo ""
    echo "选项:"
    echo "  --list              - 列出所有备份文件"
    echo "  --cleanup [days]    - 清理指定天数前的备份（默认7天）"
    echo "  --help              - 显示帮助信息"
    echo ""
    echo "示例:"
    echo "  $0                  # 备份所有数据"
    echo "  $0 database         # 只备份数据库"
    echo "  $0 --list           # 列出备份文件"
    echo "  $0 --cleanup 30     # 清理30天前的备份"
}

# 主函数
main() {
    # 处理参数
    if [ "$1" = "--help" ] || [ "$1" = "-h" ]; then
        show_usage
        exit 0
    fi
    
    if [ "$1" = "--list" ]; then
        list_backups
        exit 0
    fi
    
    if [ "$1" = "--cleanup" ]; then
        cleanup_old_backups "${2:-7}"
        exit 0
    fi
    
    # 执行备份
    echo ""
    echo "=========================================="
    info "开始数据备份"
    echo "=========================================="
    echo ""
    
    check_data_dir
    
    case "$BACKUP_TYPE" in
        full)
            backup_full
            ;;
        database)
            backup_database
            ;;
        uploads)
            backup_uploads
            ;;
        *)
            error "未知的备份类型: $BACKUP_TYPE"
            show_usage
            exit 1
            ;;
    esac
    
    echo ""
    success "备份流程完成！"
}

# 运行主函数
main "$@"

