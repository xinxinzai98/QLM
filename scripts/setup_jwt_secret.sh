#!/bin/bash

# JWT_SECRET配置脚本
# 用于在ECS服务器上快速配置JWT_SECRET环境变量

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

echo "=========================================="
echo "JWT_SECRET 配置脚本"
echo "=========================================="
echo ""

# 检查是否在项目根目录
if [ ! -f "docker-compose.prod.yml" ]; then
    error "请在项目根目录执行此脚本"
    exit 1
fi

# 检查.env文件是否存在
if [ -f ".env" ]; then
    info "检测到 .env 文件已存在"
    
    # 检查是否已有JWT_SECRET
    if grep -q "^JWT_SECRET=" .env 2>/dev/null; then
        warn "JWT_SECRET 已存在"
        CURRENT_SECRET=$(grep "^JWT_SECRET=" .env | cut -d '=' -f2 | tr -d '"' | tr -d "'")
        SECRET_LENGTH=${#CURRENT_SECRET}
        
        if [ $SECRET_LENGTH -ge 32 ]; then
            success "JWT_SECRET 已配置（长度: $SECRET_LENGTH 字符）"
            echo ""
            read -p "是否要重新生成新的JWT_SECRET？(y/N): " REGENERATE
            if [[ ! "$REGENERATE" =~ ^[Yy]$ ]]; then
                info "保持现有JWT_SECRET"
                exit 0
            fi
        else
            warn "当前JWT_SECRET长度不足32字符（当前: $SECRET_LENGTH），需要重新生成"
        fi
    fi
fi

# 生成新的JWT_SECRET
info "正在生成强随机JWT_SECRET..."

if command -v openssl &> /dev/null; then
    JWT_SECRET=$(openssl rand -hex 32)
    success "使用 OpenSSL 生成密钥"
elif command -v node &> /dev/null; then
    JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
    success "使用 Node.js 生成密钥"
else
    error "未找到 openssl 或 node，无法生成密钥"
    exit 1
fi

SECRET_LENGTH=${#JWT_SECRET}
info "生成的密钥长度: $SECRET_LENGTH 字符"

# 备份现有.env文件（如果存在）
if [ -f ".env" ]; then
    BACKUP_FILE=".env.backup.$(date +%Y%m%d_%H%M%S)"
    cp .env "$BACKUP_FILE"
    info "已备份现有.env文件到: $BACKUP_FILE"
fi

# 创建或更新.env文件
if [ -f ".env" ]; then
    # 更新现有文件
    if grep -q "^JWT_SECRET=" .env 2>/dev/null; then
        # 替换现有JWT_SECRET
        if [[ "$OSTYPE" == "darwin"* ]]; then
            # macOS
            sed -i '' "s|^JWT_SECRET=.*|JWT_SECRET=$JWT_SECRET|" .env
        else
            # Linux
            sed -i "s|^JWT_SECRET=.*|JWT_SECRET=$JWT_SECRET|" .env
        fi
        success "已更新 .env 文件中的 JWT_SECRET"
    else
        # 添加JWT_SECRET到文件末尾
        echo "" >> .env
        echo "# JWT密钥配置（自动生成）" >> .env
        echo "JWT_SECRET=$JWT_SECRET" >> .env
        success "已在 .env 文件中添加 JWT_SECRET"
    fi
else
    # 创建新文件
    cat > .env <<EOF
# 生产环境配置
NODE_ENV=production
PORT=3000

# JWT密钥配置（自动生成）
# ⚠️  重要：请妥善保管此密钥，不要泄露！
JWT_SECRET=$JWT_SECRET

# JWT过期时间
JWT_EXPIRES_IN=7d

# 数据库路径
DB_PATH=./database/mms.db
EOF
    success "已创建 .env 文件"
fi

# 设置文件权限（仅所有者可读）
chmod 600 .env
success "已设置 .env 文件权限为 600（仅所有者可读）"

echo ""
echo "=========================================="
success "JWT_SECRET 配置完成！"
echo "=========================================="
echo ""
warn "⚠️  重要提示："
echo "   1. JWT_SECRET已生成并保存到 .env 文件"
echo "   2. 请妥善保管此密钥，不要泄露给他人"
echo "   3. 如果丢失密钥，所有用户需要重新登录"
echo ""
info "密钥前20个字符: ${JWT_SECRET:0:20}..."
echo ""
info "下一步操作："
echo "   1. 重启Docker容器以应用新配置："
echo "      docker-compose -f docker-compose.prod.yml restart"
echo ""
echo "   2. 或者重新构建并启动："
echo "      docker-compose -f docker-compose.prod.yml up -d --build"
echo ""

