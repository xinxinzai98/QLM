#!/bin/bash

# 服务诊断脚本
# 用于诊断Docker服务无法访问的问题

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 打印带颜色的消息
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
echo "服务诊断工具"
echo "=========================================="
echo ""

# 1. 检查容器状态
info "1. 检查容器状态..."
if docker ps -a | grep -q mms-app; then
    CONTAINER_STATUS=$(docker ps -a | grep mms-app | awk '{print $7}')
    if [ "$CONTAINER_STATUS" == "Up" ]; then
        success "容器 mms-app 正在运行"
    else
        error "容器 mms-app 未运行，状态: $CONTAINER_STATUS"
        echo ""
        info "查看容器日志（最近50行）..."
        docker logs --tail=50 mms-app
        exit 1
    fi
else
    error "容器 mms-app 不存在"
    exit 1
fi
echo ""

# 2. 检查端口映射
info "2. 检查端口映射..."
PORT_CHECK=$(docker port mms-app 2>/dev/null | grep 3000 || echo "")
if [ -n "$PORT_CHECK" ]; then
    success "端口映射正常: $PORT_CHECK"
else
    error "端口映射异常"
fi
echo ""

# 3. 检查容器内服务是否监听
info "3. 检查容器内端口监听..."
CONTAINER_PORT=$(docker exec mms-app sh -c "netstat -tln 2>/dev/null | grep :3000 || ss -tln 2>/dev/null | grep :3000 || echo ''")
if [ -n "$CONTAINER_PORT" ]; then
    success "容器内端口3000正在监听"
    echo "   详情: $CONTAINER_PORT"
else
    error "容器内端口3000未监听"
fi
echo ""

# 4. 测试容器内服务响应
info "4. 测试容器内服务响应..."
CONTAINER_RESPONSE=$(docker exec mms-app sh -c "wget -qO- http://localhost:3000/api/health 2>/dev/null || curl -s http://localhost:3000/api/health 2>/dev/null || echo 'FAILED'")
if [ "$CONTAINER_RESPONSE" != "FAILED" ] && [ -n "$CONTAINER_RESPONSE" ]; then
    success "容器内服务响应正常"
    echo "   响应: $CONTAINER_RESPONSE"
else
    error "容器内服务无响应"
    echo "   这通常意味着应用启动失败"
fi
echo ""

# 5. 测试宿主机本地访问
info "5. 测试宿主机本地访问..."
HOST_RESPONSE=$(curl -s -m 5 http://localhost:3000/api/health 2>/dev/null || echo "FAILED")
if [ "$HOST_RESPONSE" != "FAILED" ] && [ -n "$HOST_RESPONSE" ]; then
    success "宿主机本地访问正常"
    echo "   响应: $HOST_RESPONSE"
else
    error "宿主机本地访问失败"
    echo "   这通常意味着端口映射有问题"
fi
echo ""

# 6. 检查容器日志（错误）
info "6. 检查容器日志中的错误..."
ERROR_LOG=$(docker logs mms-app 2>&1 | grep -i "error\|fatal\|exception\|failed" | tail -10 || echo "")
if [ -n "$ERROR_LOG" ]; then
    warn "发现日志中的错误/警告："
    echo "$ERROR_LOG" | sed 's/^/   /'
else
    success "未发现明显的错误日志"
fi
echo ""

# 7. 检查环境变量（JWT_SECRET）
info "7. 检查关键环境变量..."
JWT_SECRET=$(docker exec mms-app sh -c 'echo $JWT_SECRET' 2>/dev/null || echo "")
if [ -z "$JWT_SECRET" ]; then
    error "JWT_SECRET 环境变量未设置"
    echo "   这可能导致服务无法正常启动"
elif [ ${#JWT_SECRET} -lt 32 ]; then
    warn "JWT_SECRET 长度不足32个字符（当前: ${#JWT_SECRET}）"
    echo "   生产环境建议使用至少32个字符的强密钥"
else
    success "JWT_SECRET 已设置（长度: ${#JWT_SECRET}）"
fi
echo ""

# 8. 检查防火墙（如果存在）
info "8. 检查防火墙配置..."
if command -v firewall-cmd &> /dev/null; then
    FIREWALL_PORTS=$(firewall-cmd --list-ports 2>/dev/null || echo "")
    if echo "$FIREWALL_PORTS" | grep -q "3000"; then
        success "防火墙已开放3000端口"
    else
        warn "防火墙未开放3000端口"
        echo "   如需开放，执行: firewall-cmd --permanent --add-port=3000/tcp && firewall-cmd --reload"
    fi
elif command -v ufw &> /dev/null; then
    UFW_STATUS=$(ufw status | grep "3000" || echo "")
    if [ -n "$UFW_STATUS" ]; then
        success "UFW防火墙已配置3000端口"
    else
        warn "UFW防火墙未配置3000端口"
    fi
else
    info "未检测到常见防火墙工具（firewall-cmd/ufw）"
fi
echo ""

# 9. 检查安全组提示
info "9. 安全组配置检查提示..."
echo "   ⚠️  如果宿主机本地访问正常，但外网无法访问，请检查："
echo "      1. 阿里云ECS安全组是否开放3000端口"
echo "      2. 安全组规则："
echo "         - 端口范围: 3000/3000"
echo "         - 授权对象: 0.0.0.0/0 (或你的IP)"
echo "         - 协议: TCP"
echo ""

# 10. 生成诊断报告
echo "=========================================="
info "诊断完成"
echo "=========================================="
echo ""
info "查看完整容器日志:"
echo "   docker logs -f mms-app"
echo ""
info "查看最近100行日志:"
echo "   docker logs --tail=100 mms-app"
echo ""
info "重启服务:"
echo "   docker-compose -f docker-compose.prod.yml restart"
echo ""
info "重新构建并启动:"
echo "   docker-compose -f docker-compose.prod.yml up -d --build"
echo ""

