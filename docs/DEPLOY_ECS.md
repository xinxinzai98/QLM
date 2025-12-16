# 阿里云 ECS (CentOS 7.2) 部署手册

本指南指导如何将物料管理系统部署到阿里云 ECS (CentOS 7.2) 环境。

## 1. 准备工作

### 1.1 前置要求
*   阿里云 ECS 实例 (CentOS 7.x)
*   安全组已开放端口：22 (SSH), 80 (HTTP), 3000 (应用直连, 可选)
*   Root 权限或 sudo 权限

### 1.2 安装 Docker & Docker Compose
CentOS 7.2 内核较旧，建议先更新 yum 包：

```bash
# 1. 更新系统包
yum update -y

# 2. 安装必要工具
yum install -y yum-utils device-mapper-persistent-data lvm2

# 3. 添加 Docker 源
yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo

# 4. 安装 Docker CE
yum install -y docker-ce docker-ce-cli containerd.io

# 5. 启动 Docker 并设置开机自启
systemctl start docker
systemctl enable docker

# 6. 安装 Docker Compose (独立二进制)
curl -L "https://github.com/docker/compose/releases/download/v2.23.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose
ln -s /usr/local/bin/docker-compose /usr/bin/docker-compose
```

---

## 2. 部署步骤 (Docker Compose)

### 2.1 上传代码
在本地项目根目录执行（假设目标目录为 `/opt/mms`）：

```bash
# 方法 A: 仅打包必要文件上传
tar -czvf mms-deploy.tar.gz backend frontend ops docker-compose.prod.yml Dockerfile .env.example
scp mms-deploy.tar.gz root@<ECS_IP>:/opt/
# 在服务器解压
ssh root@<ECS_IP> "mkdir -p /opt/mms && tar -xzvf /opt/mms-deploy.tar.gz -C /opt/mms"
```

### 2.2 配置环境变量
登录服务器，进入目录配置 `.env`：

```bash
cd /opt/mms
cp .env.example .env

# 编辑 .env 设置生产密钥
vi .env
# 修改 JWT_SECRET 为强随机字符串 !important
```

### 2.3 启动服务
```bash
# 构建并后台启动
docker-compose -f docker-compose.prod.yml up -d --build

# 查看日志
docker-compose -f docker-compose.prod.yml logs -f
```

---

## 3. Nginx 反向代理配置 (推荐)

不要直接暴露 3000 端口，建议使用 Nginx 监听 80 端口转发。

### 3.1 安装 Nginx
```bash
yum install -y epel-release
yum install -y nginx
systemctl enable nginx
```

### 3.2 部署配置文件
```bash
# 复制我们准备好的配置
cp /opt/mms/ops/nginx/mms.conf /etc/nginx/conf.d/default.conf

# 检查配置
nginx -t

# 重载 Nginx
systemctl reload nginx
```

此时访问 `http://<ECS_IP>` 即可看到系统。

---

## 4. 运维维护

### 4.1 数据备份
数据库文件位于 `/opt/mms/data/database/mms.db`。
上传文件位于 `/opt/mms/data/uploads`。

建议添加 crontab 定时备份：
```bash
# 每天凌晨 2 点备份数据库
0 2 * * * cp /opt/mms/data/database/mms.db /opt/mms-backups/mms_$(date +\%F).db
```

### 4.2 更新发布
1. 上传新代码包覆盖。
2. 重建容器：
   ```bash
   docker-compose -f docker-compose.prod.yml up -d --build
   ```

### 4.3 常用命令
```bash
# 停止服务
docker-compose -f docker-compose.prod.yml down

# 查看服务状态
docker-compose -f docker-compose.prod.yml ps
```
