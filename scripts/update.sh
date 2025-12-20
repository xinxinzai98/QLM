#!/bin/bash

# ============================================
# 代码更新脚本
# 用于更新生产环境代码并重新部署
# ============================================

set -e  # 遇到错误立即退出（在关键步骤）
set +H  # 禁用历史扩展，避免!字符问题

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
GITHUB_REPO="https://github.com/xinxinzai98/QLM.git"

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

# 检查并配置Git远程仓库
check_git_remote() {
    info "检查Git远程仓库配置..."
    
    cd "$PROJECT_DIR"
    
    # 检查是否有远程仓库配置
    if ! git remote | grep -q "^origin$"; then
        warn "未找到origin远程仓库，正在配置..."
        git remote add origin "$GITHUB_REPO"
        success "已添加远程仓库: $GITHUB_REPO"
    else
        # 检查远程仓库URL是否正确
        CURRENT_URL=$(git remote get-url origin 2>/dev/null || echo "")
        if [ "$CURRENT_URL" != "$GITHUB_REPO" ]; then
            warn "远程仓库URL不匹配，正在更新..."
            warn "当前URL: $CURRENT_URL"
            warn "目标URL: $GITHUB_REPO"
            git remote set-url origin "$GITHUB_REPO"
            success "已更新远程仓库URL: $GITHUB_REPO"
        else
            info "远程仓库配置正确: $GITHUB_REPO"
        fi
    fi
    
    # 验证远程仓库连接（可选，如果网络有问题会失败）
    info "验证远程仓库连接..."
    if git ls-remote --heads origin "$BRANCH" &>/dev/null; then
        success "远程仓库连接正常，分支 $BRANCH 存在"
    else
        warn "无法验证远程分支 $BRANCH，但将继续尝试拉取"
        warn "可能是网络问题或分支不存在，脚本将继续执行"
    fi
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
    info "拉取最新代码（分支: $BRANCH，仓库: $GITHUB_REPO）..."
    
    cd "$PROJECT_DIR"
    
    # 检查是否有未提交的更改
    if [ -n "$(git status --porcelain 2>/dev/null)" ]; then
        warn "检测到未提交的更改"
        # 在生产环境中，我们自动暂存更改以避免冲突
        warn "正在暂存本地更改..."
        set +e  # 临时禁用错误退出
        git stash push -m "Auto-stash before update $(date +%Y%m%d_%H%M%S)" 2>&1
        STASH_RESULT=$?
        set -e  # 重新启用错误退出
        if [ $STASH_RESULT -ne 0 ]; then
            warn "暂存失败，尝试清理未跟踪的文件..."
            set +e
            git clean -fd 2>&1
            set -e
        fi
    fi
    
    # 获取更新前的commit
    OLD_COMMIT=$(git rev-parse HEAD 2>/dev/null || echo "unknown")
    
    # 确保在正确的分支上
    CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "unknown")
    if [ "$CURRENT_BRANCH" != "$BRANCH" ]; then
        info "当前分支: $CURRENT_BRANCH，切换到: $BRANCH"
        set +e  # 临时禁用错误退出
        git checkout "$BRANCH" 2>/dev/null
        CHECKOUT_RESULT=$?
        set -e  # 重新启用错误退出
        
        if [ $CHECKOUT_RESULT -ne 0 ]; then
            warn "本地分支 $BRANCH 不存在，正在从远程创建..."
            set +e
            git fetch origin "$BRANCH:$BRANCH" 2>&1 || git checkout -b "$BRANCH" "origin/$BRANCH" 2>&1
            CREATE_RESULT=$?
            set -e
            if [ $CREATE_RESULT -ne 0 ]; then
                error "无法创建分支 $BRANCH"
                error "请检查："
                error "  1. 远程分支 $BRANCH 是否存在"
                error "  2. 是否有足够权限"
                exit 1
            fi
            success "已创建并切换到分支 $BRANCH"
        else
            success "已切换到分支 $BRANCH"
        fi
    else
        info "当前已在分支 $BRANCH"
    fi
    
    # 拉取最新代码（使用重试机制）
    info "正在从远程仓库拉取代码..."
    MAX_RETRIES=3
    RETRY_COUNT=0
    FETCH_SUCCESS=false
    
    while [ $RETRY_COUNT -lt $MAX_RETRIES ] && [ "$FETCH_SUCCESS" = false ]; do
        if git fetch origin "$BRANCH" 2>&1; then
            FETCH_SUCCESS=true
            success "代码拉取成功"
        else
            RETRY_COUNT=$((RETRY_COUNT + 1))
            if [ $RETRY_COUNT -lt $MAX_RETRIES ]; then
                warn "拉取失败，正在重试 ($RETRY_COUNT/$MAX_RETRIES)..."
                sleep 2
            else
                error "拉取代码失败，已重试 $MAX_RETRIES 次"
                error "请检查："
                error "  1. 网络连接是否正常"
                error "  2. GitHub仓库地址是否正确: $GITHUB_REPO"
                error "  3. 分支名称是否正确: $BRANCH"
                exit 1
            fi
        fi
    done
    
    # 合并远程更改
    info "正在合并远程更改..."
    if git pull origin "$BRANCH" 2>&1; then
        success "代码合并成功"
    else
        error "代码合并失败，可能存在冲突"
        error "请手动解决冲突后重试"
        git status
        exit 1
    fi
    
    # 获取更新后的commit
    NEW_COMMIT=$(git rev-parse HEAD 2>/dev/null || echo "unknown")
    
    if [ "$OLD_COMMIT" != "$NEW_COMMIT" ] && [ "$OLD_COMMIT" != "unknown" ]; then
        success "代码已更新"
        info "更新前: ${OLD_COMMIT:0:7}"
        info "更新后: ${NEW_COMMIT:0:7}"
        info "更新内容："
        git log --oneline "$OLD_COMMIT..$NEW_COMMIT" 2>/dev/null | head -10 || info "无法显示更新日志"
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
    check_git_remote
    
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

