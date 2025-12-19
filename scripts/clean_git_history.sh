#!/bin/bash

# ============================================
# Git历史清理脚本
# 用于从Git历史中删除不应该提交的文件
# ============================================

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

# 检查是否在Git仓库中
if [ ! -d .git ]; then
    error "当前目录不是Git仓库"
    exit 1
fi

# 检查是否有未提交的更改
if [ -n "$(git status --porcelain)" ]; then
    warn "检测到未提交的更改，建议先提交或暂存"
    read -p "是否继续？(y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

info "开始清理Git历史中的不应提交的文件..."

# 需要从Git历史中删除的文件/目录列表
FILES_TO_REMOVE=(
    "backend/src/database/*.db"
    "backend/src/database/*.sqlite"
    "backend/src/database/*.sqlite3"
    "backend/coverage/"
    "backend/node_modules/"
    "frontend/node_modules/"
    "frontend/dist/"
    "*.log"
    ".env"
    ".env.local"
    ".env.production"
    ".env.development"
)

# 使用git filter-repo（推荐）或git filter-branch
if command -v git-filter-repo &> /dev/null; then
    info "使用 git-filter-repo 清理历史..."
    
    for pattern in "${FILES_TO_REMOVE[@]}"; do
        if git ls-tree -r --name-only HEAD | grep -q "$pattern"; then
            info "删除: $pattern"
            git filter-repo --path-glob "$pattern" --invert-paths --force
        fi
    done
    
    success "Git历史清理完成"
else
    warn "未安装 git-filter-repo，使用 git filter-branch（较慢）..."
    warn "建议安装 git-filter-repo: pip install git-filter-repo"
    
    # 使用git filter-branch（较慢但兼容性好）
    for pattern in "${FILES_TO_REMOVE[@]}"; do
        if git ls-tree -r --name-only HEAD | grep -q "$pattern"; then
            info "删除: $pattern"
            git filter-branch --force --index-filter \
                "git rm -rf --cached --ignore-unmatch '$pattern'" \
                --prune-empty --tag-name-filter cat -- --all
        fi
    done
    
    success "Git历史清理完成"
    warn "建议运行: git for-each-ref --format='delete %(refname)' refs/original | git update-ref --stdin"
    warn "然后运行: git reflog expire --expire=now --all && git gc --prune=now --aggressive"
fi

info "清理完成！"
info "下一步操作："
info "1. 检查清理结果: git log --all --oneline"
info "2. 如果满意，强制推送到远程（谨慎！）:"
info "   git push origin --force --all"
info "   git push origin --force --tags"

