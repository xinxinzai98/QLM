#!/bin/bash

# ============================================
# 日志查看脚本
# 用于查看容器日志
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
LINES=${1:-100}

# 显示使用说明
show_usage() {
    echo "用法: $0 [lines] [options]"
    echo ""
    echo "参数:"
    echo "  lines          - 显示的行数（默认: 100）"
    echo ""
    echo "选项:"
    echo "  -f, --follow   - 实时跟踪日志（类似 tail -f）"
    echo "  -e, --error    - 只显示错误日志"
    echo "  --since [time] - 显示指定时间之后的日志（如: 10m, 1h, 2024-01-01T00:00:00）"
    echo "  --help         - 显示帮助信息"
    echo ""
    echo "示例:"
    echo "  $0              # 显示最近100行日志"
    echo "  $0 50           # 显示最近50行日志"
    echo "  $0 --follow     # 实时跟踪日志"
    echo "  $0 --error      # 只显示错误日志"
    echo "  $0 --since 1h   # 显示最近1小时的日志"
}

# 查看日志
view_logs() {
    local lines=$1
    local follow=${2:-false}
    local errors_only=${3:-false}
    local since=${4:-""}
    
    cd "$PROJECT_DIR"
    
    local cmd="docker-compose -f $COMPOSE_FILE logs"
    
    if [ "$follow" = true ]; then
        cmd="$cmd -f"
        info "实时跟踪日志（按 Ctrl+C 退出）..."
    else
        cmd="$cmd --tail=$lines"
    fi
    
    if [ -n "$since" ]; then
        cmd="$cmd --since=$since"
    fi
    
    if [ "$errors_only" = true ]; then
        eval "$cmd" | grep -i -E "error|exception|fail|fatal" || info "未找到错误日志"
    else
        eval "$cmd"
    fi
}

# 主函数
main() {
    local follow=false
    local errors_only=false
    local since=""
    local lines=100
    
    # 处理参数
    while [[ $# -gt 0 ]]; do
        case $1 in
            -f|--follow)
                follow=true
                shift
                ;;
            -e|--error)
                errors_only=true
                shift
                ;;
            --since)
                since="$2"
                shift 2
                ;;
            --help|-h)
                show_usage
                exit 0
                ;;
            *)
                # 检查是否为数字（行数）
                if [[ $1 =~ ^[0-9]+$ ]]; then
                    lines=$1
                else
                    error "未知参数: $1"
                    show_usage
                    exit 1
                fi
                shift
                ;;
        esac
    done
    
    # 检查容器是否运行
    if ! docker ps | grep -q mms-app; then
        warn "容器未运行"
        info "尝试查看所有日志..."
    fi
    
    # 显示日志
    view_logs "$lines" "$follow" "$errors_only" "$since"
}

# 运行主函数
main "$@"

