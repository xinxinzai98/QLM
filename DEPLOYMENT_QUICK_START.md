# 🚀 快速部署指南（5分钟版）

> 这是简化版部署指南，适合有经验的用户。详细教程请查看 [DOCKER_DEPLOYMENT_GUIDE.md](./DOCKER_DEPLOYMENT_GUIDE.md)

## 前置条件

- ✅ 已购买阿里云ECS实例
- ✅ 已获取服务器IP和root密码
- ✅ 已连接SSH到服务器

## 一键部署（推荐）

```bash
# 1. 上传项目到服务器（使用Git或SCP）
cd /opt
git clone https://github.com/your-username/QLM.git
# 或使用SCP从本地上传

# 2. 进入项目目录
cd QLM

# 3. 运行一键部署脚本
chmod +x scripts/deploy_docker.sh
./scripts/deploy_docker.sh
```

脚本会自动完成：
- ✅ 安装Docker和Docker Compose
- ✅ 配置Docker镜像加速
- ✅ 创建环境变量文件
- ✅ 构建Docker镜像
- ✅ 启动容器

## 手动部署

### 1. 安装Docker和Docker Compose

**CentOS/Alibaba Cloud Linux:**
```bash
yum update -y
yum install -y docker docker-compose
systemctl start docker
systemctl enable docker
```

**Ubuntu/Debian:**
```bash
apt-get update
apt-get install -y docker.io docker-compose
systemctl start docker
systemctl enable docker
```

### 2. 配置Docker镜像加速

```bash
mkdir -p /etc/docker
cat > /etc/docker/daemon.json <<EOF
{
  "registry-mirrors": ["https://frz7i079.mirror.aliyuncs.com"]
}
EOF
systemctl daemon-reload
systemctl restart docker
```

### 3. 上传项目代码

```bash
cd /opt
# 使用Git克隆或SCP上传
git clone <your-repo-url> QLM
cd QLM
```

### 4. 创建环境变量文件

```bash
# 生成随机JWT密钥
JWT_SECRET=$(openssl rand -hex 32)

cat > .env <<EOF
NODE_ENV=production
PORT=3000
JWT_SECRET=${JWT_SECRET}
JWT_EXPIRES_IN=7d
DB_PATH=./database/mms.db
EOF
```

### 5. 创建数据目录

```bash
mkdir -p data/database data/uploads data/logs
chmod -R 755 data
```

### 6. 构建并启动

```bash
docker-compose -f docker-compose.prod.yml up -d --build
```

### 7. 检查状态

```bash
docker-compose -f docker-compose.prod.yml ps
curl http://localhost:3000/api/health
```

### 8. 配置安全组

在阿里云控制台 → ECS → 安全组 → 添加入站规则：
- 端口：3000
- 协议：TCP
- 授权对象：0.0.0.0/0

## 访问应用

```
http://你的服务器IP:3000
默认账号：admin / admin123
```

## 常用命令

```bash
# 查看日志
docker-compose -f docker-compose.prod.yml logs -f

# 重启服务
docker-compose -f docker-compose.prod.yml restart

# 停止服务
docker-compose -f docker-compose.prod.yml stop

# 更新代码后重新部署
git pull
docker-compose -f docker-compose.prod.yml up -d --build
```

## 故障排查

1. **容器无法启动**：查看日志 `docker-compose -f docker-compose.prod.yml logs`
2. **无法访问**：检查安全组是否开放3000端口
3. **端口被占用**：修改 `docker-compose.prod.yml` 中的端口映射

## 详细文档

遇到问题？查看完整教程：[DOCKER_DEPLOYMENT_GUIDE.md](./DOCKER_DEPLOYMENT_GUIDE.md)

