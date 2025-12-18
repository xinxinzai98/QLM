#!/bin/bash

# ============================================
# Docker一键部署脚本
# 用于快速部署到阿里云ECS
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

# 检查命令是否存在
check_command() {
    if ! command -v $1 &> /dev/null; then
        error "$1 未安装，请先安装 $1"
        exit 1
    fi
}

# 检查是否为root用户
check_root() {
    if [ "$EUID" -ne 0 ]; then
        error "请使用root用户运行此脚本"
        exit 1
    fi
}

# 检查Docker是否安装
check_docker() {
    if ! command -v docker &> /dev/null; then
        warn "Docker未安装，正在安装..."
        install_docker
    else
        success "Docker已安装: $(docker --version)"
    fi
}

# 检查Docker Compose是否安装
check_docker_compose() {
    if ! command -v docker-compose &> /dev/null; then
        warn "Docker Compose未安装，正在安装..."
        install_docker_compose
    else
        success "Docker Compose已安装: $(docker-compose --version)"
    fi
}

# 安装Docker（CentOS/Alibaba Cloud Linux）
install_docker() {
    info "正在安装Docker..."
    
    # 检测系统类型
    if [ -f /etc/os-release ]; then
        . /etc/os-release
        OS=$ID
    else
        error "无法检测操作系统类型"
        exit 1
    fi
    
    if [[ "$OS" == "centos" ]] || [[ "$OS" == "almalinux" ]] || [[ "$OS" == "rhel" ]]; then
        yum update -y
        yum install -y yum-utils device-mapper-persistent-data lvm2
        yum-config-manager --add-repo https://mirrors.aliyun.com/docker-ce/linux/centos/docker-ce.repo
        yum install -y docker-ce docker-ce-cli containerd.io
        systemctl start docker
        systemctl enable docker
    elif [[ "$OS" == "ubuntu" ]] || [[ "$OS" == "debian" ]]; then
        apt-get update
        apt-get install -y apt-transport-https ca-certificates curl gnupg lsb-release
        curl -fsSL https://mirrors.aliyun.com/docker-ce/linux/ubuntu/gpg | gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
        echo "deb [arch=amd64 signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://mirrors.aliyun.com/docker-ce/linux/ubuntu $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
        apt-get update
        apt-get install -y docker-ce docker-ce-cli containerd.io
        systemctl start docker
        systemctl enable docker
    else
        error "不支持的操作系统: $OS"
        exit 1
    fi
    
    # 配置Docker镜像加速
    info "配置Docker镜像加速..."
    mkdir -p /etc/docker
    cat > /etc/docker/daemon.json <<EOF
{
  "registry-mirrors": [
    "https://frz7i079.mirror.aliyuncs.com",
    "https://registry.docker-cn.com",
    "https://docker.mirrors.ustc.edu.cn"
  ]
}
EOF
    systemctl daemon-reload
    systemctl restart docker
    
    success "Docker安装完成"
}

# 安装Docker Compose
install_docker_compose() {
    info "正在安装Docker Compose..."
    
    COMPOSE_VERSION="v2.20.2"
    curl -L "https://get.daocloud.io/docker/compose/releases/download/${COMPOSE_VERSION}/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
    ln -sf /usr/local/bin/docker-compose /usr/bin/docker-compose
    
    success "Docker Compose安装完成"
}

# 检查项目文件
check_project_files() {
    info "检查项目文件..."
    
    if [ ! -f "Dockerfile" ]; then
        error "未找到Dockerfile，请确保在项目根目录运行此脚本"
        exit 1
    fi
    
    if [ ! -f "docker-compose.prod.yml" ]; then
        error "未找到docker-compose.prod.yml文件"
        exit 1
    fi
    
    if [ ! -d "backend" ] || [ ! -d "frontend" ]; then
        error "未找到backend或frontend目录"
        exit 1
    fi
    
    success "项目文件检查通过"
}

# 创建.env文件
create_env_file() {
    info "检查环境变量配置..."
    
    if [ ! -f ".env" ]; then
        warn ".env文件不存在，正在创建..."
        
        # 生成随机JWT密钥
        if command -v openssl &> /dev/null; then
            JWT_SECRET=$(openssl rand -hex 32)
        elif command -v node &> /dev/null; then
            JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
        else
            warn "无法生成随机密钥，使用默认密钥（生产环境请手动修改）"
            JWT_SECRET="your_super_secret_jwt_key_change_this_to_random_string_at_least_32_chars_long_123456789"
        fi
        
        cat > .env <<EOF
# 生产环境配置
NODE_ENV=production
PORT=3000

# JWT密钥（已自动生成，建议保存备份）
JWT_SECRET=${JWT_SECRET}

# JWT过期时间（7天）
JWT_EXPIRES_IN=7d

# 数据库路径
DB_PATH=./database/mms.db
EOF
        
        success ".env文件已创建"
        warn "JWT_SECRET已自动生成，请妥善保管: ${JWT_SECRET:0:20}..."
    else
        success ".env文件已存在"
        
        # 检查JWT_SECRET是否已配置
        if grep -q "JWT_SECRET=your_super_secret_jwt_key_change_this" .env || grep -q "JWT_SECRET=CHANGE_ME" .env; then
            warn "检测到默认JWT_SECRET，建议修改为随机字符串"
        fi
    fi
}

# 创建数据目录
create_data_dirs() {
    info "创建数据目录..."
    
    mkdir -p data/database
    mkdir -p data/uploads
    mkdir -p data/logs
    
    chmod -R 755 data
    
    success "数据目录创建完成"
}

# 构建Docker镜像
build_image() {
    info "开始构建Docker镜像（这可能需要5-10分钟）..."
    
    docker-compose -f docker-compose.prod.yml build
    
    success "Docker镜像构建完成"
}

# 启动容器
start_container() {
    info "启动Docker容器..."
    
    docker-compose -f docker-compose.prod.yml up -d
    
    success "容器启动完成"
}

# 检查容器状态
check_container_status() {
    info "检查容器状态..."
    
    sleep 5  # 等待容器启动
    
    if docker ps | grep -q mms-app; then
        success "容器运行正常"
        docker-compose -f docker-compose.prod.yml ps
    else
        error "容器启动失败，请查看日志:"
        docker-compose -f docker-compose.prod.yml logs --tail=50
        exit 1
    fi
}

# 健康检查
health_check() {
    info "执行健康检查..."
    
    sleep 10  # 等待服务完全启动
    
    if curl -f http://localhost:3000/api/health &> /dev/null; then
        success "健康检查通过！"
        info "应用运行在: http://$(hostname -I | awk '{print $1}'):3000"
    else
        warn "健康检查失败，但容器可能仍在启动中"
        warn "请稍后访问: http://$(hostname -I | awk '{print $1}'):3000"
    fi
}

# 显示部署信息
show_deployment_info() {
    echo ""
    echo "=========================================="
    success "部署完成！"
    echo "=========================================="
    echo ""
    info "访问地址: http://$(hostname -I | awk '{print $1}'):3000"
    info "默认账号: admin"
    info "默认密码: admin123"
    echo ""
    warn "重要提醒："
    echo "1. 请确保阿里云安全组已开放3000端口"
    echo "2. 首次登录后请立即修改默认密码"
    echo "3. 定期备份 data/ 目录"
    echo ""
    info "常用命令："
    echo "  查看日志: docker-compose -f docker-compose.prod.yml logs -f"
    echo "  重启服务: docker-compose -f docker-compose.prod.yml restart"
    echo "  停止服务: docker-compose -f docker-compose.prod.yml stop"
    echo "  查看状态: docker-compose -f docker-compose.prod.yml ps"
    echo ""
}

# 主函数
main() {
    echo ""
    echo "=========================================="
    info "开始Docker部署流程"
    echo "=========================================="
    echo ""
    
    # 检查root权限
    check_root
    
    # 检查Docker和Docker Compose
    check_docker
    check_docker_compose
    
    # 检查项目文件
    check_project_files
    
    # 创建环境变量文件
    create_env_file
    
    # 创建数据目录
    create_data_dirs
    
    # 构建镜像
    build_image
    
    # 启动容器
    start_container
    
    # 检查容器状态
    check_container_status
    
    # 健康检查
    health_check
    
    # 显示部署信息
    show_deployment_info
}

# 运行主函数
main

