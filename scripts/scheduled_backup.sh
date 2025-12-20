#!/bin/bash

# ============================================
# 定时备份脚本
# 用于定期自动备份数据库和上传文件
# 支持cron定时任务调用
# ============================================

set -e  # 遇到错误立即退出

# 颜色定义（如果终端支持）
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 检测是否在tty终端运行（cron运行时通常不是）
if [ -t 1 ]; then
    USE_COLOR=true
else
    USE_COLOR=false
fi

# 打印函数
info() {
    if [ "$USE_COLOR" = true ]; then
        echo -e "${BLUE}[INFO]${NC} $(date '+%Y-%m-%d %H:%M:%S') $1"
    else
        echo "[INFO] $(date '+%Y-%m-%d %H:%M:%S') $1"
    fi
}

success() {
    if [ "$USE_COLOR" = true ]; then
        echo -e "${GREEN}[SUCCESS]${NC} $(date '+%Y-%m-%d %H:%M:%S') $1"
    else
        echo "[SUCCESS] $(date '+%Y-%m-%d %H:%M:%S') $1"
    fi
}

warn() {
    if [ "$USE_COLOR" = true ]; then
        echo -e "${YELLOW}[WARN]${NC} $(date '+%Y-%m-%d %H:%M:%S') $1"
    else
        echo "[WARN] $(date '+%Y-%m-%d %H:%M:%S') $1"
    fi
}

error() {
    if [ "$USE_COLOR" = true ]; then
        echo -e "${RED}[ERROR]${NC} $(date '+%Y-%m-%d %H:%M:%S') $1" >&2
    else
        echo "[ERROR] $(date '+%Y-%m-%d %H:%M:%S') $1" >&2
    fi
}

# 获取脚本所在目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

# 默认配置（可通过环境变量覆盖）
BACKUP_DIR="${BACKUP_DIR:-$PROJECT_DIR/backups}"
DATA_DIR="${DATA_DIR:-$PROJECT_DIR/data}"
BACKUP_TYPE="${BACKUP_TYPE:-full}"  # full, database, uploads
KEEP_DAYS="${KEEP_DAYS:-30}"  # 保留备份的天数
LOG_FILE="${LOG_FILE:-$BACKUP_DIR/backup.log}"

# 创建备份目录和日志目录
mkdir -p "$BACKUP_DIR"
mkdir -p "$(dirname "$LOG_FILE")"

# 日志函数
log_to_file() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') $1" >> "$LOG_FILE"
}

# 检查数据目录
check_data_dir() {
    if [ ! -d "$DATA_DIR" ]; then
        error "数据目录不存在: $DATA_DIR"
        log_to_file "ERROR: 数据目录不存在: $DATA_DIR"
        exit 1
    fi
    
    if [ "$BACKUP_TYPE" = "full" ] || [ "$BACKUP_TYPE" = "database" ]; then
        if [ ! -d "$DATA_DIR/database" ]; then
            error "数据库目录不存在: $DATA_DIR/database"
            log_to_file "ERROR: 数据库目录不存在: $DATA_DIR/database"
            exit 1
        fi
    fi
    
    if [ "$BACKUP_TYPE" = "full" ] || [ "$BACKUP_TYPE" = "uploads" ]; then
        if [ ! -d "$DATA_DIR/uploads" ]; then
            warn "上传文件目录不存在: $DATA_DIR/uploads（将跳过）"
            log_to_file "WARN: 上传文件目录不存在: $DATA_DIR/uploads"
        fi
    fi
}

# 备份数据库
backup_database() {
    info "开始备份数据库..."
    log_to_file "INFO: 开始备份数据库"
    
    TIMESTAMP=$(date +%Y%m%d_%H%M%S)
    BACKUP_FILE="$BACKUP_DIR/backup_database_${TIMESTAMP}.tar.gz"
    
    # 检查数据库文件是否存在
    DB_FILE="$DATA_DIR/database/mms.db"
    if [ ! -f "$DB_FILE" ]; then
        error "数据库文件不存在: $DB_FILE"
        log_to_file "ERROR: 数据库文件不存在: $DB_FILE"
        return 1
    fi
    
    # 备份数据库目录
    if tar -czf "$BACKUP_FILE" -C "$PROJECT_DIR" data/database/ 2>>"$LOG_FILE"; then
        BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
        success "数据库备份完成: $BACKUP_FILE ($BACKUP_SIZE)"
        log_to_file "SUCCESS: 数据库备份完成: $BACKUP_FILE ($BACKUP_SIZE)"
        
        # 保存最新备份路径
        echo "$BACKUP_FILE" > "$BACKUP_DIR/latest_database_backup.txt"
        return 0
    else
        error "数据库备份失败"
        log_to_file "ERROR: 数据库备份失败"
        return 1
    fi
}

# 备份上传文件
backup_uploads() {
    info "开始备份上传文件..."
    log_to_file "INFO: 开始备份上传文件"
    
    if [ ! -d "$DATA_DIR/uploads" ]; then
        warn "上传文件目录不存在，跳过"
        log_to_file "WARN: 上传文件目录不存在，跳过"
        return 0
    fi
    
    TIMESTAMP=$(date +%Y%m%d_%H%M%S)
    BACKUP_FILE="$BACKUP_DIR/backup_uploads_${TIMESTAMP}.tar.gz"
    
    # 备份上传文件目录
    if tar -czf "$BACKUP_FILE" -C "$PROJECT_DIR" data/uploads/ 2>>"$LOG_FILE"; then
        BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
        success "上传文件备份完成: $BACKUP_FILE ($BACKUP_SIZE)"
        log_to_file "SUCCESS: 上传文件备份完成: $BACKUP_FILE ($BACKUP_SIZE)"
        
        # 保存最新备份路径
        echo "$BACKUP_FILE" > "$BACKUP_DIR/latest_uploads_backup.txt"
        return 0
    else
        error "上传文件备份失败"
        log_to_file "ERROR: 上传文件备份失败"
        return 1
    fi
}

# 备份所有数据
backup_full() {
    info "开始完整备份（数据库 + 上传文件）..."
    log_to_file "INFO: 开始完整备份"
    
    TIMESTAMP=$(date +%Y%m%d_%H%M%S)
    BACKUP_FILE="$BACKUP_DIR/backup_full_${TIMESTAMP}.tar.gz"
    
    # 备份整个data目录
    if tar -czf "$BACKUP_FILE" -C "$PROJECT_DIR" data/ 2>>"$LOG_FILE"; then
        BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
        success "完整备份完成: $BACKUP_FILE ($BACKUP_SIZE)"
        log_to_file "SUCCESS: 完整备份完成: $BACKUP_FILE ($BACKUP_SIZE)"
        
        # 保存最新备份路径
        echo "$BACKUP_FILE" > "$BACKUP_DIR/latest_full_backup.txt"
        return 0
    else
        error "完整备份失败"
        log_to_file "ERROR: 完整备份失败"
        return 1
    fi
}

# 清理旧备份
cleanup_old_backups() {
    info "清理 $KEEP_DAYS 天前的备份..."
    log_to_file "INFO: 清理 $KEEP_DAYS 天前的备份"
    
    DELETED_COUNT=0
    DELETED_SIZE=0
    
    # 查找并删除旧备份
    while IFS= read -r file; do
        if [ -f "$file" ]; then
            FILE_SIZE=$(du -b "$file" | cut -f1)
            DELETED_SIZE=$((DELETED_SIZE + FILE_SIZE))
            rm -f "$file"
            DELETED_COUNT=$((DELETED_COUNT + 1))
            info "删除旧备份: $(basename "$file")"
            log_to_file "INFO: 删除旧备份: $(basename "$file")"
        fi
    done < <(find "$BACKUP_DIR" -name "backup_*.tar.gz" -mtime +$KEEP_DAYS -type f)
    
    if [ $DELETED_COUNT -gt 0 ]; then
        DELETED_SIZE_MB=$((DELETED_SIZE / 1024 / 1024))
        success "清理完成：删除 $DELETED_COUNT 个备份文件，释放 ${DELETED_SIZE_MB}MB 空间"
        log_to_file "SUCCESS: 清理完成：删除 $DELETED_COUNT 个备份文件，释放 ${DELETED_SIZE_MB}MB 空间"
    else
        info "没有需要清理的旧备份"
        log_to_file "INFO: 没有需要清理的旧备份"
    fi
}

# 显示备份统计
show_backup_stats() {
    info "备份统计信息："
    echo ""
    
    # 计算备份文件数量和总大小
    BACKUP_COUNT=$(find "$BACKUP_DIR" -name "backup_*.tar.gz" -type f | wc -l)
    BACKUP_TOTAL_SIZE=$(du -sh "$BACKUP_DIR" 2>/dev/null | cut -f1)
    
    echo "  备份目录: $BACKUP_DIR"
    echo "  备份文件数: $BACKUP_COUNT"
    echo "  总大小: $BACKUP_TOTAL_SIZE"
    echo "  保留天数: $KEEP_DAYS 天"
    echo ""
    
    log_to_file "INFO: 备份统计 - 文件数: $BACKUP_COUNT, 总大小: $BACKUP_TOTAL_SIZE"
}

# 主函数
main() {
    # 记录开始时间
    START_TIME=$(date +%s)
    info "=========================================="
    info "开始定时备份任务"
    info "=========================================="
    info "备份类型: $BACKUP_TYPE"
    info "备份目录: $BACKUP_DIR"
    info "数据目录: $DATA_DIR"
    info "保留天数: $KEEP_DAYS 天"
    info "日志文件: $LOG_FILE"
    echo ""
    
    log_to_file "=========================================="
    log_to_file "开始定时备份任务 - 类型: $BACKUP_TYPE"
    log_to_file "=========================================="
    
    # 检查数据目录
    check_data_dir
    
    # 执行备份
    BACKUP_SUCCESS=true
    case "$BACKUP_TYPE" in
        full)
            if ! backup_full; then
                BACKUP_SUCCESS=false
            fi
            ;;
        database)
            if ! backup_database; then
                BACKUP_SUCCESS=false
            fi
            ;;
        uploads)
            if ! backup_uploads; then
                BACKUP_SUCCESS=false
            fi
            ;;
        *)
            error "未知的备份类型: $BACKUP_TYPE"
            error "支持的类型: full, database, uploads"
            log_to_file "ERROR: 未知的备份类型: $BACKUP_TYPE"
            exit 1
            ;;
    esac
    
    # 清理旧备份
    cleanup_old_backups
    
    # 显示统计信息
    show_backup_stats
    
    # 记录结束时间
    END_TIME=$(date +%s)
    DURATION=$((END_TIME - START_TIME))
    
    if [ "$BACKUP_SUCCESS" = true ]; then
        success "备份任务完成（耗时: ${DURATION}秒）"
        log_to_file "SUCCESS: 备份任务完成（耗时: ${DURATION}秒）"
        exit 0
    else
        error "备份任务失败（耗时: ${DURATION}秒）"
        log_to_file "ERROR: 备份任务失败（耗时: ${DURATION}秒）"
        exit 1
    fi
}

# 运行主函数
main "$@"

