#!/bin/bash

# ============================================
# 数据恢复脚本
# 用于从备份恢复数据
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
COMPOSE_FILE="docker-compose.prod.yml"

# 检查备份文件是否存在
check_backup_file() {
    local backup_file="$1"
    
    if [ ! -f "$backup_file" ]; then
        error "备份文件不存在: $backup_file"
        exit 1
    fi
    
    if [ ! -r "$backup_file" ]; then
        error "无法读取备份文件: $backup_file"
        exit 1
    fi
}

# 确认恢复操作
confirm_restore() {
    warn "⚠️  警告：此操作将覆盖现有数据！"
    warn "备份文件: $1"
    
    if [ -d "$DATA_DIR" ] && [ -n "$(ls -A "$DATA_DIR" 2>/dev/null)" ]; then
        warn "当前数据目录不为空，将被覆盖"
    fi
    
    read -p "确认要继续恢复吗？(yes/No): " -r
    echo
    if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
        info "操作已取消"
        exit 0
    fi
}

# 停止容器
stop_container() {
    info "停止容器..."
    
    cd "$PROJECT_DIR"
    
    if [ -f "$COMPOSE_FILE" ]; then
        docker-compose -f "$COMPOSE_FILE" stop 2>/dev/null || warn "容器可能未运行"
    fi
    
    success "容器已停止"
}

# 备份当前数据（恢复前的备份）
backup_current_data() {
    if [ -d "$DATA_DIR" ] && [ -n "$(ls -A "$DATA_DIR" 2>/dev/null)" ]; then
        info "备份当前数据（恢复前）..."
        
        TIMESTAMP=$(date +%Y%m%d_%H%M%S)
        CURRENT_BACKUP="$BACKUP_DIR/pre_restore_backup_${TIMESTAMP}.tar.gz"
        
        tar -czf "$CURRENT_BACKUP" -C "$PROJECT_DIR" data/ 2>/dev/null || warn "备份当前数据失败，继续恢复"
        
        if [ -f "$CURRENT_BACKUP" ]; then
            success "当前数据已备份: $CURRENT_BACKUP"
        fi
    fi
}

# 恢复数据
restore_data() {
    local backup_file="$1"
    
    info "恢复数据..."
    
    # 创建数据目录（如果不存在）
    mkdir -p "$DATA_DIR"
    
    # 解压备份文件
    tar -xzf "$backup_file" -C "$PROJECT_DIR"
    
    if [ $? -eq 0 ]; then
        success "数据恢复完成"
    else
        error "数据恢复失败"
        exit 1
    fi
}

# 设置权限
set_permissions() {
    info "设置文件权限..."
    
    if [ -d "$DATA_DIR" ]; then
        chmod -R 755 "$DATA_DIR"
        success "权限设置完成"
    fi
}

# 启动容器
start_container() {
    info "启动容器..."
    
    cd "$PROJECT_DIR"
    
    if [ -f "$COMPOSE_FILE" ]; then
        docker-compose -f "$COMPOSE_FILE" up -d
        
        sleep 5
        
        if docker ps | grep -q mms-app; then
            success "容器启动成功"
        else
            warn "容器启动可能有问题，请检查日志"
        fi
    else
        warn "未找到 $COMPOSE_FILE，跳过容器启动"
    fi
}

# 显示使用说明
show_usage() {
    echo "用法: $0 <backup_file> [options]"
    echo ""
    echo "参数:"
    echo "  backup_file    - 备份文件路径（必需）"
    echo ""
    echo "选项:"
    echo "  --no-backup    - 恢复前不备份当前数据"
    echo "  --no-restart   - 恢复后不重启容器"
    echo "  --help         - 显示帮助信息"
    echo ""
    echo "示例:"
    echo "  $0 backups/backup_full_20241218_120000.tar.gz"
    echo "  $0 backups/backup_database_20241218_120000.tar.gz --no-backup"
    echo "  $0 backups/backup_full_20241218_120000.tar.gz --no-restart"
}

# 列出可用备份
list_backups() {
    info "可用备份文件："
    echo ""
    
    if [ -d "$BACKUP_DIR" ] && [ -n "$(ls -A "$BACKUP_DIR"/*.tar.gz 2>/dev/null)" ]; then
        ls -lht "$BACKUP_DIR"/*.tar.gz | head -10 | awk '{print NR". "$9, "(" $5 ")"}'
        echo ""
        info "备份目录: $BACKUP_DIR"
    else
        warn "未找到备份文件"
    fi
}

# 主函数
main() {
    local backup_file=""
    local backup_current=true
    local restart_container=true
    
    # 处理参数
    if [ "$1" = "--help" ] || [ "$1" = "-h" ]; then
        show_usage
        exit 0
    fi
    
    if [ "$1" = "--list" ] || [ "$1" = "-l" ]; then
        list_backups
        exit 0
    fi
    
    # 解析参数
    while [[ $# -gt 0 ]]; do
        case $1 in
            --no-backup)
                backup_current=false
                shift
                ;;
            --no-restart)
                restart_container=false
                shift
                ;;
            --help|-h)
                show_usage
                exit 0
                ;;
            --list|-l)
                list_backups
                exit 0
                ;;
            *)
                if [ -z "$backup_file" ]; then
                    backup_file="$1"
                else
                    error "未知参数: $1"
                    show_usage
                    exit 1
                fi
                shift
                ;;
        esac
    done
    
    # 检查备份文件参数
    if [ -z "$backup_file" ]; then
        error "请指定备份文件"
        echo ""
        list_backups
        echo ""
        show_usage
        exit 1
    fi
    
    # 如果是相对路径，尝试在备份目录中查找
    if [[ ! "$backup_file" =~ ^/ ]]; then
        if [ -f "$BACKUP_DIR/$backup_file" ]; then
            backup_file="$BACKUP_DIR/$backup_file"
        elif [ ! -f "$backup_file" ]; then
            error "备份文件不存在: $backup_file"
            list_backups
            exit 1
        fi
    fi
    
    # 执行恢复
    echo ""
    echo "=========================================="
    info "开始数据恢复"
    echo "=========================================="
    echo ""
    
    check_backup_file "$backup_file"
    confirm_restore "$backup_file"
    
    # 停止容器
    stop_container
    
    # 备份当前数据
    if [ "$backup_current" = true ]; then
        backup_current_data
    fi
    
    # 恢复数据
    restore_data "$backup_file"
    
    # 设置权限
    set_permissions
    
    # 启动容器
    if [ "$restart_container" = true ]; then
        start_container
    fi
    
    echo ""
    success "恢复流程完成！"
    info "如果容器未自动启动，请手动执行: docker-compose -f $COMPOSE_FILE up -d"
}

# 运行主函数
main "$@"

