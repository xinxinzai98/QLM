#!/bin/bash

# ============================================
# 清绿氢能物料管理系统 - 阿里云ECS部署脚本
# ============================================
# 
# ⚠️ 安全警告：
# 1. 部署前必须设置强JWT_SECRET（至少32个字符）
# 2. 确保服务器防火墙规则已正确配置
# 3. 建议使用HTTPS（配置SSL证书）
# 4. 定期备份数据库和上传文件
#
# 使用方法：
# 1. 修改脚本中的占位符变量（见下方）
# 2. 在本地运行：chmod +x deploy_to_aliyun.sh && ./deploy_to_aliyun.sh
# 3. 或在服务器上直接运行
#
# ============================================

set -e  # 遇到错误立即退出

# ============================================
# ⚠️ 必须修改的配置（部署前请填写）
# ============================================

# 阿里云ECS服务器信息
# 格式：用户名@服务器IP或域名
# 示例：root@47.xxx.xxx.xxx 或 ubuntu@your-domain.com
SERVER_HOST="YOUR_SERVER_USER@YOUR_SERVER_IP"

# 服务器SSH端口（默认22，如果修改了请填写）
SERVER_SSH_PORT="22"

# 服务器部署目录（应用将部署到此目录）
DEPLOY_DIR="/opt/mms"

# 应用端口（确保服务器防火墙已开放此端口）
APP_PORT="3000"

# Docker Compose项目名称
COMPOSE_PROJECT_NAME="mms"

# ============================================
# 可选配置
# ============================================

# 是否在部署后自动启动服务（true/false）
AUTO_START="true"

# 是否在部署前备份现有数据（true/false）
BACKUP_BEFORE_DEPLOY="true"

# 备份保存路径
BACKUP_DIR="/opt/mms-backups"

# ============================================
# 环境变量配置（⚠️ 生产环境必须修改）
# ============================================

# JWT密钥（⚠️ 必须设置为强随机字符串，至少32个字符）
# 生成命令：openssl rand -hex 32
JWT_SECRET="CHANGE_ME_TO_STRONG_RANDOM_SECRET_AT_LEAST_32_CHARS"

# JWT过期时间
JWT_EXPIRES_IN="7d"

# Node环境
NODE_ENV="production"

# ============================================
# 颜色输出函数
# ============================================

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# ============================================
# 配置验证
# ============================================

validate_config() {
    info "验证部署配置..."
    
    if [ "$SERVER_HOST" = "YOUR_SERVER_USER@YOUR_SERVER_IP" ]; then
        error "请修改 SERVER_HOST 变量为实际的服务器地址"
        exit 1
    fi
    
    if [ "$JWT_SECRET" = "CHANGE_ME_TO_STRONG_RANDOM_SECRET_AT_LEAST_32_CHARS" ]; then
        error "⚠️  安全警告：请修改 JWT_SECRET 为强随机字符串（至少32个字符）"
        error "生成命令：openssl rand -hex 32"
        read -p "是否继续部署？（y/N）: " confirm
        if [ "$confirm" != "y" ] && [ "$confirm" != "Y" ]; then
            exit 1
        fi
    fi
    
    if [ ${#JWT_SECRET} -lt 32 ]; then
        warn "JWT_SECRET 长度不足32个字符，建议使用更长的密钥"
        read -p "是否继续部署？（y/N）: " confirm
        if [ "$confirm" != "y" ] && [ "$confirm" != "Y" ]; then
            exit 1
        fi
    fi
    
    info "配置验证通过"
}

# ============================================
# 本地构建检查
# ============================================

check_local_build() {
    info "检查本地构建环境..."
    
    if ! command -v docker &> /dev/null; then
        error "Docker 未安装，请先安装 Docker"
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        error "Docker Compose 未安装，请先安装 Docker Compose"
        exit 1
    fi
    
    info "本地环境检查通过"
}

# ============================================
# 服务器连接检查
# ============================================

check_server_connection() {
    info "检查服务器连接..."
    
    if ! ssh -p "$SERVER_SSH_PORT" -o ConnectTimeout=10 "$SERVER_HOST" "echo 'Connection successful'" &> /dev/null; then
        error "无法连接到服务器 $SERVER_HOST"
        error "请检查："
        error "  1. 服务器IP地址是否正确"
        error "  2. SSH密钥是否已配置"
        error "  3. 服务器防火墙是否允许SSH连接"
        exit 1
    fi
    
    info "服务器连接成功"
}

# ============================================
# 服务器环境准备
# ============================================

prepare_server() {
    info "准备服务器环境..."
    
    ssh -p "$SERVER_SSH_PORT" "$SERVER_HOST" << EOF
        # 检查Docker是否安装
        if ! command -v docker &> /dev/null; then
            echo "安装Docker..."
            curl -fsSL https://get.docker.com -o get-docker.sh
            sh get-docker.sh
            systemctl start docker
            systemctl enable docker
            rm get-docker.sh
        fi
        
        # 检查Docker Compose是否安装
        if ! command -v docker-compose &> /dev/null; then
            echo "安装Docker Compose..."
            curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-\$(uname -s)-\$(uname -m)" -o /usr/local/bin/docker-compose
            chmod +x /usr/local/bin/docker-compose
        fi
        
        # 创建部署目录
        mkdir -p $DEPLOY_DIR
        mkdir -p $BACKUP_DIR
        
        # 创建数据目录
        mkdir -p $DEPLOY_DIR/data/database
        mkdir -p $DEPLOY_DIR/data/uploads
        mkdir -p $DEPLOY_DIR/data/logs
        
        echo "服务器环境准备完成"
EOF
    
    info "服务器环境准备完成"
}

# ============================================
# 备份现有数据
# ============================================

backup_data() {
    if [ "$BACKUP_BEFORE_DEPLOY" = "true" ]; then
        info "备份现有数据..."
        
        BACKUP_TIMESTAMP=$(date +%Y%m%d_%H%M%S)
        
        ssh -p "$SERVER_SSH_PORT" "$SERVER_HOST" << EOF
            if [ -d "$DEPLOY_DIR/data" ]; then
                tar -czf "$BACKUP_DIR/backup_\$BACKUP_TIMESTAMP.tar.gz" -C "$DEPLOY_DIR" data
                echo "备份完成: $BACKUP_DIR/backup_\$BACKUP_TIMESTAMP.tar.gz"
            else
                echo "未找到现有数据，跳过备份"
            fi
EOF
        
        info "数据备份完成"
    fi
}

# ============================================
# 部署应用
# ============================================

deploy_app() {
    info "开始部署应用..."
    
    # 创建临时部署包
    TEMP_DIR=$(mktemp -d)
    info "创建部署包到临时目录: $TEMP_DIR"
    
    # 复制必要文件
    cp Dockerfile "$TEMP_DIR/"
    cp docker-compose.prod.yml "$TEMP_DIR/"
    cp .dockerignore "$TEMP_DIR/"
    cp -r backend "$TEMP_DIR/"
    cp -r frontend "$TEMP_DIR/"
    
    # 创建生产环境变量文件
    cat > "$TEMP_DIR/.env.production" << EOF
NODE_ENV=$NODE_ENV
PORT=$APP_PORT
JWT_SECRET=$JWT_SECRET
JWT_EXPIRES_IN=$JWT_EXPIRES_IN
DB_PATH=./database/mms.db
EOF
    
    # 创建docker-compose覆盖文件
    cat > "$TEMP_DIR/docker-compose.override.yml" << EOF
version: '3.8'
services:
  mms-app:
    environment:
      - JWT_SECRET=$JWT_SECRET
      - JWT_EXPIRES_IN=$JWT_EXPIRES_IN
EOF
    
    # 打包部署文件
    cd "$TEMP_DIR"
    tar -czf deploy.tar.gz .
    cd - > /dev/null
    
    # 上传到服务器
    info "上传部署包到服务器..."
    scp -P "$SERVER_SSH_PORT" "$TEMP_DIR/deploy.tar.gz" "$SERVER_HOST:$DEPLOY_DIR/"
    
    # 在服务器上解压和启动
    ssh -p "$SERVER_SSH_PORT" "$SERVER_HOST" << EOF
        cd $DEPLOY_DIR
        
        # 停止现有容器
        if [ -f docker-compose.prod.yml ]; then
            docker-compose -f docker-compose.prod.yml -p $COMPOSE_PROJECT_NAME down || true
        fi
        
        # 解压新版本
        tar -xzf deploy.tar.gz
        rm deploy.tar.gz
        
        # 设置文件权限
        chmod 600 .env.production
        chmod 644 docker-compose.prod.yml
        
        # 构建和启动（如果需要）
        if [ "$AUTO_START" = "true" ]; then
            docker-compose -p $COMPOSE_PROJECT_NAME up -d --build
            echo "等待服务启动..."
            sleep 10
            docker-compose -p $COMPOSE_PROJECT_NAME ps
        fi
EOF
    
    # 清理临时文件
    rm -rf "$TEMP_DIR"
    
    info "部署完成"
}

# ============================================
# 部署后验证
# ============================================

verify_deployment() {
    info "验证部署..."
    
    # 提取服务器IP
    SERVER_IP=$(echo "$SERVER_HOST" | cut -d'@' -f2)
    
    # 检查健康端点
    sleep 5
    if curl -f "http://$SERVER_IP:$APP_PORT/api/health" &> /dev/null; then
        info "✅ 健康检查通过"
        info "应用运行在: http://$SERVER_IP:$APP_PORT"
    else
        warn "⚠️  健康检查失败，请检查服务日志"
        warn "查看日志命令: ssh $SERVER_HOST 'cd $DEPLOY_DIR && docker-compose logs'"
    fi
}

# ============================================
# 主执行流程
# ============================================

main() {
    info "============================================"
    info "清绿氢能物料管理系统 - 阿里云ECS部署"
    info "============================================"
    echo ""
    
    validate_config
    check_local_build
    check_server_connection
    prepare_server
    backup_data
    deploy_app
    verify_deployment
    
    echo ""
    info "============================================"
    info "部署完成！"
    info "============================================"
    info "应用地址: http://$(echo $SERVER_HOST | cut -d'@' -f2):$APP_PORT"
    info ""
    info "常用命令："
    info "  查看日志: ssh $SERVER_HOST 'cd $DEPLOY_DIR && docker-compose logs -f'"
    info "  停止服务: ssh $SERVER_HOST 'cd $DEPLOY_DIR && docker-compose down'"
    info "  重启服务: ssh $SERVER_HOST 'cd $DEPLOY_DIR && docker-compose restart'"
    info "  查看状态: ssh $SERVER_HOST 'cd $DEPLOY_DIR && docker-compose ps'"
    info ""
    warn "⚠️  安全提醒："
    warn "  1. 确保已配置防火墙规则"
    warn "  2. 建议配置HTTPS（SSL证书）"
    warn "  3. 定期备份数据库和上传文件"
    warn "  4. 监控服务器资源使用情况"
}

# 执行主流程
main



