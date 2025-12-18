#!/bin/bash

# ============================================
# 代码更新脚本
# 用于更新生产环境代码并重新部署
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
COMPOSE_FILE="docker-compose.prod.yml"
BRANCH="${BRANCH:-main}"

# 创建备份目录
mkdir -p "$BACKUP_DIR"

# 检查是否为root用户（可选，建议使用root）
check_root() {
    if [ "$EUID" -ne 0 ]; then
        warn "建议使用root用户运行此脚本，以确保有足够权限"
    fi
}

# 检查必要文件
check_files() {
    info "检查必要文件..."
    
    if [ ! -f "$PROJECT_DIR/$COMPOSE_FILE" ]; then
        error "未找到 $COMPOSE_FILE 文件"
        exit 1
    fi
    
    if [ ! -d "$PROJECT_DIR/.git" ]; then
        error "未找到 .git 目录，请确保在项目根目录运行"
        exit 1
    fi
    
    success "文件检查通过"
}

# 备份数据
backup_data() {
    info "备份数据..."
    
    if [ ! -d "$PROJECT_DIR/data" ]; then
        warn "data 目录不存在，跳过备份（首次部署）"
        return 0
    fi
    
    BACKUP_TIMESTAMP=$(date +%Y%m%d_%H%M%S)
    BACKUP_FILE="$BACKUP_DIR/backup_${BACKUP_TIMESTAMP}.tar.gz"
    
    # 备份数据目录
    tar -czf "$BACKUP_FILE" -C "$PROJECT_DIR" data/
    
    if [ $? -eq 0 ]; then
        success "数据备份完成: $BACKUP_FILE"
        
        # 显示备份文件大小
        BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
        info "备份文件大小: $BACKUP_SIZE"
    else
        error "数据备份失败"
        exit 1
    fi
}

# 拉取最新代码
pull_code() {
    info "拉取最新代码（分支: $BRANCH）..."
    
    # 检查是否有未提交的更改
    if [ -n "$(git status --porcelain)" ]; then
        warn "检测到未提交的更改，建议先提交或暂存"
        read -p "是否继续？(y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            error "操作已取消"
            exit 1
        fi
    fi
    
    # 获取更新前的commit
    OLD_COMMIT=$(git rev-parse HEAD)
    
    # 拉取最新代码
    git fetch origin "$BRANCH"
    git checkout "$BRANCH"
    git pull origin "$BRANCH"
    
    # 获取更新后的commit
    NEW_COMMIT=$(git rev-parse HEAD)
    
    if [ "$OLD_COMMIT" != "$NEW_COMMIT" ]; then
        success "代码已更新"
        info "更新前: ${OLD_COMMIT:0:7}"
        info "更新后: ${NEW_COMMIT:0:7}"
        git log --oneline "$OLD_COMMIT..$NEW_COMMIT" | head -5
    else
        info "代码已是最新版本"
    fi
}

# 停止容器
stop_container() {
    info "停止容器..."
    
    cd "$PROJECT_DIR"
    docker-compose -f "$COMPOSE_FILE" stop
    
    success "容器已停止"
}

# 重新构建镜像
build_image() {
    info "重新构建Docker镜像（这可能需要5-10分钟）..."
    
    cd "$PROJECT_DIR"
    docker-compose -f "$COMPOSE_FILE" build
    
    success "镜像构建完成"
}

# 启动容器
start_container() {
    info "启动容器..."
    
    cd "$PROJECT_DIR"
    docker-compose -f "$COMPOSE_FILE" up -d
    
    success "容器已启动"
}

# 等待服务启动
wait_for_service() {
    info "等待服务启动..."
    
    sleep 5
    
    # 检查容器状态
    if docker ps | grep -q mms-app; then
        success "容器运行正常"
    else
        error "容器启动失败，请查看日志"
        docker-compose -f "$COMPOSE_FILE" logs --tail=50
        exit 1
    fi
}

# 检查服务健康
check_health() {
    info "检查服务健康状态..."
    
    sleep 3
    
    # 尝试访问健康检查接口
    if curl -f http://localhost:3000/api/health &> /dev/null; then
        success "服务健康检查通过！"
    else
        warn "健康检查失败，但容器可能仍在启动中"
        warn "请稍后访问: http://$(hostname -I | awk '{print $1}'):3000"
    fi
}

# 显示更新信息
show_info() {
    echo ""
    echo "=========================================="
    success "更新完成！"
    echo "=========================================="
    echo ""
    info "访问地址: http://$(hostname -I | awk '{print $1}'):3000"
    echo ""
    info "常用命令："
    echo "  查看日志: docker-compose -f $COMPOSE_FILE logs -f"
    echo "  查看状态: docker-compose -f $COMPOSE_FILE ps"
    echo "  重启服务: docker-compose -f $COMPOSE_FILE restart"
    echo ""
}

# 清理旧备份（可选）
cleanup_old_backups() {
    if [ -n "$KEEP_BACKUPS_DAYS" ]; then
        info "清理 $KEEP_BACKUPS_DAYS 天前的备份..."
        find "$BACKUP_DIR" -name "backup_*.tar.gz" -mtime +$KEEP_BACKUPS_DAYS -delete
        success "旧备份已清理"
    fi
}

# 主函数
main() {
    echo ""
    echo "=========================================="
    info "开始代码更新流程"
    echo "=========================================="
    echo ""
    
    # 检查
    check_root
    check_files
    
    # 备份
    backup_data
    
    # 更新代码
    pull_code
    
    # 停止容器
    stop_container
    
    # 重新构建
    build_image
    
    # 启动容器
    start_container
    
    # 等待启动
    wait_for_service
    
    # 健康检查
    check_health
    
    # 清理旧备份
    cleanup_old_backups
    
    # 显示信息
    show_info
}

# 运行主函数
main

