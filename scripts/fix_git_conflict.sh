#!/bin/bash

# ============================================
# Git冲突修复脚本
# 用于修复ECS服务器上的Git合并冲突问题
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

# 默认配置
GITHUB_REPO="https://github.com/xinxinzai98/QLM.git"
BRANCH="main"

cd "$PROJECT_DIR"

echo ""
info "=========================================="
info "Git冲突修复工具"
info "=========================================="
echo ""

# 检查Git状态
info "检查当前Git状态..."
git status --short

# 检查是否有未提交的更改
if [ -z "$(git status --porcelain)" ]; then
    success "没有未提交的更改"
    info "尝试拉取最新代码..."
    git fetch origin main
    git pull origin main
    success "代码已更新"
    exit 0
fi

# 显示未提交的更改
echo ""
warn "检测到未提交的更改："
git status --short
echo ""

# 询问用户是否要保存更改
read -p "是否要保存本地更改到补丁文件？(y/N): " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    BACKUP_DIR="/tmp/git_backup_$(date +%Y%m%d_%H%M%S)"
    mkdir -p "$BACKUP_DIR"
    
    info "保存本地更改到: $BACKUP_DIR"
    git diff > "$BACKUP_DIR/all_changes.patch"
    git diff scripts/deploy_docker.sh > "$BACKUP_DIR/deploy_docker.patch" 2>/dev/null || true
    git diff scripts/update.sh > "$BACKUP_DIR/update.patch" 2>/dev/null || true
    
    success "本地更改已保存到: $BACKUP_DIR"
    echo "  可以使用以下命令恢复："
    echo "  git apply $BACKUP_DIR/all_changes.patch"
    echo ""
fi

# 询问用户是否要强制重置
echo ""
warn "⚠️  警告：强制重置会丢失所有未提交的更改！"
read -p "是否要强制重置到远程main分支？(y/N): " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    warn "操作已取消"
    echo ""
    info "你可以手动执行以下操作："
    echo "  1. 查看更改: git diff"
    echo "  2. 暂存更改: git stash"
    echo "  3. 拉取代码: git pull origin main"
    echo "  4. 恢复更改: git stash pop"
    exit 0
fi

# 执行强制重置
info "正在重置到远程main分支..."
git fetch origin main
git reset --hard origin/main
git clean -fd

echo ""
success "✅ 已成功重置到远程main分支"
echo ""

# 验证状态
info "当前Git状态："
git status

echo ""
info "下一步："
echo "  运行更新脚本: ./scripts/update.sh"
echo ""

