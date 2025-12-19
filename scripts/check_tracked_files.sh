#!/bin/bash

# ============================================
# 检查Git中跟踪的文件
# 找出不应该被提交的文件
# ============================================

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

echo "=========================================="
echo "检查Git中跟踪的文件"
echo "=========================================="
echo ""

# 检查数据库文件
info "检查数据库文件..."
DB_FILES=$(git ls-files | grep -E "\.(db|sqlite|sqlite3)$" || true)
if [ -n "$DB_FILES" ]; then
    warn "发现数据库文件在Git中："
    echo "$DB_FILES" | while read file; do
        echo "  ❌ $file"
    done
else
    echo "  ✅ 没有数据库文件"
fi
echo ""

# 检查coverage目录
info "检查测试覆盖率报告..."
COVERAGE_FILES=$(git ls-files | grep "coverage/" || true)
if [ -n "$COVERAGE_FILES" ]; then
    warn "发现coverage文件在Git中："
    echo "$COVERAGE_FILES" | head -5 | while read file; do
        echo "  ❌ $file"
    done
    if [ $(echo "$COVERAGE_FILES" | wc -l) -gt 5 ]; then
        echo "  ... (还有更多文件)"
    fi
else
    echo "  ✅ 没有coverage文件"
fi
echo ""

# 检查node_modules
info "检查node_modules目录..."
NODE_MODULES=$(git ls-files | grep "node_modules/" || true)
if [ -n "$NODE_MODULES" ]; then
    warn "发现node_modules文件在Git中："
    echo "$NODE_MODULES" | head -5 | while read file; do
        echo "  ❌ $file"
    done
    if [ $(echo "$NODE_MODULES" | wc -l) -gt 5 ]; then
        echo "  ... (还有更多文件)"
    fi
else
    echo "  ✅ 没有node_modules文件"
fi
echo ""

# 检查日志文件
info "检查日志文件..."
LOG_FILES=$(git ls-files | grep "\.log$" || true)
if [ -n "$LOG_FILES" ]; then
    warn "发现日志文件在Git中："
    echo "$LOG_FILES" | while read file; do
        echo "  ❌ $file"
    done
else
    echo "  ✅ 没有日志文件"
fi
echo ""

# 检查环境变量文件
info "检查环境变量文件..."
ENV_FILES=$(git ls-files | grep -E "\.env$|\.env\." | grep -v ".env.example" || true)
if [ -n "$ENV_FILES" ]; then
    warn "发现环境变量文件在Git中（.env.example除外）："
    echo "$ENV_FILES" | while read file; do
        echo "  ❌ $file"
    done
else
    echo "  ✅ 没有环境变量文件（.env.example可以提交）"
fi
echo ""

# 检查dist目录
info "检查构建输出目录..."
DIST_FILES=$(git ls-files | grep "dist/" || true)
if [ -n "$DIST_FILES" ]; then
    warn "发现dist文件在Git中："
    echo "$DIST_FILES" | head -5 | while read file; do
        echo "  ❌ $file"
    done
    if [ $(echo "$DIST_FILES" | wc -l) -gt 5 ]; then
        echo "  ... (还有更多文件)"
    fi
else
    echo "  ✅ 没有dist文件"
fi
echo ""

echo "=========================================="
echo "检查完成"
echo "=========================================="
echo ""
echo "如果有问题文件，可以使用以下命令清理："
echo "1. 从Git索引中删除（保留本地文件）："
echo "   git rm --cached <文件路径>"
echo ""
echo "2. 从Git历史中删除（需要重写历史）："
echo "   使用 scripts/clean_git_history.sh 脚本"
echo "   或使用 git filter-repo 工具"

