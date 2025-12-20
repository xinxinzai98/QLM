#!/bin/bash

# ============================================
# 服务状态查看脚本
# 用于查看容器、服务、资源使用情况
# ============================================

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
COMPOSE_FILE="docker-compose.prod.yml"

# 检查容器状态
check_container_status() {
    echo ""
    echo "=========================================="
    info "容器状态"
    echo "=========================================="
    
    cd "$PROJECT_DIR"
    
    if [ -f "$COMPOSE_FILE" ]; then
        docker-compose -f "$COMPOSE_FILE" ps
    else
        warn "未找到 $COMPOSE_FILE"
        docker ps | grep mms-app || warn "未找到运行中的容器"
    fi
}

# 检查服务健康
check_service_health() {
    echo ""
    echo "=========================================="
    info "服务健康检查"
    echo "=========================================="
    
    if curl -f http://localhost:3000/api/health &> /dev/null; then
        success "✅ 服务健康检查通过"
        
        # 获取健康检查详情
        HEALTH_RESPONSE=$(curl -s http://localhost:3000/api/health)
        echo "响应: $HEALTH_RESPONSE"
    else
        error "❌ 服务健康检查失败"
        warn "请检查容器日志: docker-compose -f $COMPOSE_FILE logs"
    fi
}

# 查看资源使用情况
check_resources() {
    echo ""
    echo "=========================================="
    info "资源使用情况"
    echo "=========================================="
    
    if docker ps | grep -q mms-app; then
        echo ""
        info "容器资源使用:"
        docker stats --no-stream mms-app
    else
        warn "容器未运行"
    fi
    
    echo ""
    info "系统资源:"
    echo "内存使用:"
    free -h | grep -E "Mem|Swap"
    
    echo ""
    echo "磁盘使用:"
    df -h | grep -E "Filesystem|/$|/opt|/root"
}

# 查看数据目录大小
check_data_size() {
    echo ""
    echo "=========================================="
    info "数据目录大小"
    echo "=========================================="
    
    DATA_DIR="$PROJECT_DIR/data"
    
    if [ -d "$DATA_DIR" ]; then
        echo ""
        du -sh "$DATA_DIR"/* 2>/dev/null | sort -h || warn "数据目录为空或无法访问"
        
        echo ""
        info "数据库文件:"
        if [ -f "$DATA_DIR/database/mms.db" ]; then
            DB_SIZE=$(du -h "$DATA_DIR/database/mms.db" | cut -f1)
            echo "  mms.db: $DB_SIZE"
        else
            warn "  数据库文件不存在"
        fi
    else
        warn "数据目录不存在: $DATA_DIR"
    fi
}

# 查看最近日志
show_recent_logs() {
    echo ""
    echo "=========================================="
    info "最近日志（最后20行）"
    echo "=========================================="
    
    cd "$PROJECT_DIR"
    
    if [ -f "$COMPOSE_FILE" ]; then
        docker-compose -f "$COMPOSE_FILE" logs --tail=20
    else
        docker logs --tail=20 mms-app 2>/dev/null || warn "无法获取日志"
    fi
}

# 显示系统信息
show_system_info() {
    echo ""
    echo "=========================================="
    info "系统信息"
    echo "=========================================="
    
    echo ""
    echo "操作系统: $(cat /etc/os-release | grep PRETTY_NAME | cut -d'"' -f2)"
    echo "内核版本: $(uname -r)"
    echo "Docker版本: $(docker --version 2>/dev/null || echo '未安装')"
    echo "Docker Compose版本: $(docker-compose --version 2>/dev/null || echo '未安装')"
    echo ""
    echo "服务器IP: $(hostname -I | awk '{print $1}')"
    echo "应用访问: http://$(hostname -I | awk '{print $1}'):3000"
}

# 显示使用说明
show_usage() {
    echo "用法: $0 [options]"
    echo ""
    echo "选项:"
    echo "  --health       - 只检查服务健康"
    echo "  --resources    - 只查看资源使用"
    echo "  --data         - 只查看数据目录"
    echo "  --logs         - 只显示最近日志"
    echo "  --all          - 显示所有信息（默认）"
    echo "  --help         - 显示帮助信息"
    echo ""
    echo "示例:"
    echo "  $0              # 显示所有状态信息"
    echo "  $0 --health     # 只检查健康状态"
    echo "  $0 --resources  # 只查看资源使用"
}

# 主函数
main() {
    local show_all=true
    local show_health=false
    local show_resources=false
    local show_data=false
    local show_logs=false
    
    # 处理参数
    while [[ $# -gt 0 ]]; do
        case $1 in
            --health)
                show_all=false
                show_health=true
                shift
                ;;
            --resources)
                show_all=false
                show_resources=true
                shift
                ;;
            --data)
                show_all=false
                show_data=true
                shift
                ;;
            --logs)
                show_all=false
                show_logs=true
                shift
                ;;
            --all)
                show_all=true
                shift
                ;;
            --help|-h)
                show_usage
                exit 0
                ;;
            *)
                error "未知参数: $1"
                show_usage
                exit 1
                ;;
        esac
    done
    
    # 显示信息
    if [ "$show_all" = true ]; then
        check_container_status
        check_service_health
        check_resources
        check_data_size
        show_system_info
        show_recent_logs
    else
        [ "$show_health" = true ] && check_service_health
        [ "$show_resources" = true ] && check_resources
        [ "$show_data" = true ] && check_data_size
        [ "$show_logs" = true ] && show_recent_logs
    fi
    
    echo ""
    echo "=========================================="
    success "状态检查完成"
    echo "=========================================="
}

# 运行主函数
main "$@"

