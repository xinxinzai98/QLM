# 阿里云ECS部署检查清单

**清绿氢能物料管理系统 - 生产环境部署准备清单**

---

## ⚠️ 部署前必读

本清单用于确保系统安全、稳定地部署到阿里云ECS服务器。请逐项检查，确保所有项目都已完成。

---

## 一、服务器准备

### 1.1 ECS实例配置

- [ ] **实例规格**: 至少2核4GB内存（推荐4核8GB）
- [ ] **操作系统**: Ubuntu 20.04/22.04 LTS 或 CentOS 7/8（推荐Ubuntu）
- [ ] **系统盘**: 至少40GB（推荐SSD）
- [ ] **网络**: 已配置公网IP或弹性公网IP
- [ ] **安全组规则**: 已配置（见下方详细说明）

### 1.2 安全组配置

**必须开放的端口：**

- [ ] **SSH (22)**: 用于服务器管理（建议限制来源IP）
- [ ] **应用端口 (3000)**: 用于应用访问（或自定义端口）
- [ ] **HTTPS (443)**: 如果使用HTTPS（推荐）

**安全组规则示例：**

| 协议 | 端口范围 | 授权对象 | 说明 |
|------|---------|---------|------|
| TCP | 22 | 你的IP/32 | SSH访问（限制来源） |
| TCP | 3000 | 0.0.0.0/0 | 应用访问（或配置Nginx反向代理） |
| TCP | 443 | 0.0.0.0/0 | HTTPS（如果使用） |

### 1.3 服务器基础环境

- [ ] **SSH密钥配置**: 已配置SSH密钥对，可以免密登录
- [ ] **系统更新**: 已执行 `apt update && apt upgrade -y`（Ubuntu）或 `yum update -y`（CentOS）
- [ ] **防火墙配置**: 已配置ufw或firewalld（如需要）

---

## 二、Docker环境

### 2.1 Docker安装

- [ ] Docker已安装（版本 >= 20.10）
- [ ] Docker Compose已安装（版本 >= 2.0）
- [ ] Docker服务已启动并设置为开机自启

**安装命令（Ubuntu）：**
```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
systemctl start docker
systemctl enable docker

# 安装Docker Compose
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose
```

### 2.2 Docker配置验证

- [ ] 运行 `docker --version` 验证Docker版本
- [ ] 运行 `docker-compose --version` 验证Docker Compose版本
- [ ] 运行 `docker ps` 验证Docker服务正常

---

## 三、安全配置

### 3.1 JWT密钥配置 ⚠️ 关键

- [ ] **已生成强JWT_SECRET**（至少32个字符的随机字符串）
- [ ] **生成命令**: `openssl rand -hex 32` 或 `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
- [ ] **已记录JWT_SECRET**（保存在安全的地方，不要泄露）

**⚠️ 安全警告：**
- 不要使用默认密钥
- 不要将JWT_SECRET提交到Git仓库
- 生产环境必须使用强随机密钥

### 3.2 环境变量配置

- [ ] 已创建 `.env.production` 文件（或使用docker-compose环境变量）
- [ ] 已设置 `JWT_SECRET`（强随机字符串）
- [ ] 已设置 `JWT_EXPIRES_IN`（推荐7d）
- [ ] 已设置 `NODE_ENV=production`
- [ ] 已设置 `PORT`（默认3000）

**环境变量文件示例：**
```env
NODE_ENV=production
PORT=3000
JWT_SECRET=your-strong-random-secret-at-least-32-characters
JWT_EXPIRES_IN=7d
DB_PATH=./database/mms.db
```

### 3.3 文件权限

- [ ] `.env.production` 文件权限设置为 `600`（仅所有者可读）
- [ ] 数据目录权限正确设置
- [ ] 上传目录权限正确设置

---

## 四、部署文件准备

### 4.1 必需文件检查

- [ ] `Dockerfile` 存在且正确
- [ ] `docker-compose.prod.yml` 存在且正确
- [ ] `.dockerignore` 存在且正确
- [ ] `backend/` 目录完整
- [ ] `frontend/` 目录完整

### 4.2 部署脚本配置

如果使用 `deploy_to_aliyun.sh`：

- [ ] 已修改 `SERVER_HOST`（服务器地址）
- [ ] 已修改 `JWT_SECRET`（强随机密钥）
- [ ] 已修改 `DEPLOY_DIR`（部署目录，默认/opt/mms）
- [ ] 已修改 `APP_PORT`（应用端口）
- [ ] 已检查其他配置项

---

## 五、数据持久化

### 5.1 数据目录规划

- [ ] 已规划数据库存储路径（推荐：`/opt/mms/data/database`）
- [ ] 已规划上传文件存储路径（推荐：`/opt/mms/data/uploads`）
- [ ] 已规划日志存储路径（推荐：`/opt/mms/data/logs`）

### 5.2 备份策略

- [ ] 已制定数据库备份计划（建议每日备份）
- [ ] 已制定上传文件备份计划
- [ ] 已配置自动备份脚本（可选）
- [ ] 已测试备份恢复流程

**备份命令示例：**
```bash
# 备份数据库
tar -czf backup_$(date +%Y%m%d).tar.gz /opt/mms/data/database

# 备份所有数据
tar -czf backup_full_$(date +%Y%m%d).tar.gz /opt/mms/data
```

---

## 六、网络和安全

### 6.1 域名和SSL（推荐）

- [ ] 已购买域名（如需要）
- [ ] 已配置域名DNS解析到服务器IP
- [ ] 已申请SSL证书（Let's Encrypt免费证书或商业证书）
- [ ] 已配置Nginx反向代理（如使用）
- [ ] 已配置HTTPS重定向

### 6.2 Nginx配置（可选但推荐）

如果使用Nginx作为反向代理：

- [ ] Nginx已安装
- [ ] 已创建Nginx配置文件
- [ ] 已配置SSL证书
- [ ] 已配置反向代理到应用端口
- [ ] 已测试HTTPS访问

**Nginx配置示例：**
```nginx
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;
    
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 6.3 防火墙配置

- [ ] 已配置防火墙规则（仅开放必要端口）
- [ ] 已限制SSH访问来源IP（如可能）
- [ ] 已测试防火墙规则

---

## 七、监控和日志

### 7.1 日志管理

- [ ] 已配置日志轮转（logrotate）
- [ ] 已规划日志存储位置
- [ ] 已了解如何查看Docker日志

**查看日志命令：**
```bash
# 查看应用日志
cd /opt/mms
docker-compose logs -f

# 查看最近100行日志
docker-compose logs --tail=100
```

### 7.2 监控配置（可选）

- [ ] 已配置服务器监控（阿里云云监控）
- [ ] 已配置应用健康检查
- [ ] 已设置告警规则（CPU、内存、磁盘）

---

## 八、部署执行

### 8.1 部署前最后检查

- [ ] 所有配置项已填写
- [ ] JWT_SECRET已设置为强随机字符串
- [ ] 服务器资源充足（CPU、内存、磁盘）
- [ ] 网络连接正常
- [ ] 已备份现有数据（如适用）

### 8.2 执行部署

**方式一：使用部署脚本**
```bash
chmod +x deploy_to_aliyun.sh
./deploy_to_aliyun.sh
```

**方式二：手动部署**
```bash
# 1. 上传文件到服务器
scp -r . user@server:/opt/mms

# 2. SSH登录服务器
ssh user@server

# 3. 进入部署目录
cd /opt/mms

# 4. 构建和启动
docker-compose up -d --build
```

### 8.3 部署后验证

- [ ] 检查容器状态：`docker-compose ps`
- [ ] 检查健康端点：`curl http://localhost:3000/api/health`
- [ ] 检查应用日志：`docker-compose logs`
- [ ] 测试登录功能
- [ ] 测试核心功能（物料管理、出入库等）

---

## 九、部署后维护

### 9.1 日常维护

- [ ] 定期检查服务器资源使用情况
- [ ] 定期检查应用日志
- [ ] 定期执行数据备份
- [ ] 定期更新系统安全补丁
- [ ] 定期检查Docker镜像更新

### 9.2 更新部署

**更新步骤：**
```bash
# 1. 备份数据
cd /opt/mms
tar -czf ../backup_$(date +%Y%m%d).tar.gz data

# 2. 拉取最新代码（或上传新版本）
# ...

# 3. 重新构建和启动
docker-compose down
docker-compose up -d --build

# 4. 验证更新
docker-compose ps
curl http://localhost:3000/api/health
```

### 9.3 故障排查

**常见问题：**

1. **容器无法启动**
   - 检查日志：`docker-compose logs`
   - 检查环境变量配置
   - 检查端口占用：`netstat -tulpn | grep 3000`

2. **数据库连接失败**
   - 检查数据库文件权限
   - 检查数据目录挂载

3. **应用无法访问**
   - 检查防火墙规则
   - 检查安全组配置
   - 检查Nginx配置（如使用）

---

## 十、安全检查清单

### 10.1 安全配置

- [ ] JWT_SECRET已设置为强随机字符串（至少32字符）
- [ ] 环境变量文件权限设置为600
- [ ] 已配置防火墙规则（仅开放必要端口）
- [ ] SSH访问已限制来源IP（如可能）
- [ ] 已配置HTTPS（推荐）
- [ ] 已禁用不必要的服务

### 10.2 数据安全

- [ ] 数据库文件权限正确
- [ ] 已配置定期备份
- [ ] 备份文件已加密或存储在安全位置
- [ ] 已测试备份恢复流程

### 10.3 访问安全

- [ ] 默认管理员密码已修改
- [ ] 已创建专用管理员账户（如需要）
- [ ] 已配置用户权限管理
- [ ] 已启用操作日志记录

---

## 十一、性能优化（可选）

### 11.1 服务器优化

- [ ] 已配置swap分区（如内存不足）
- [ ] 已优化系统参数（如文件描述符限制）
- [ ] 已配置定时任务清理日志

### 11.2 应用优化

- [ ] 已配置Nginx缓存（如使用）
- [ ] 已配置CDN（如需要）
- [ ] 已优化数据库查询（如需要）

---

## 十二、联系和支持

### 12.1 文档资源

- [技术架构文档](../TECHNICAL_ARCHITECTURE.md)
- [用户管理员手册](../USER_ADMIN_MANUAL.md)
- [部署脚本说明](../../deploy_to_aliyun.sh)

### 12.2 故障报告

如遇到问题，请收集以下信息：
- 服务器系统信息
- Docker版本信息
- 应用日志
- 错误截图或描述

---

## ✅ 部署确认

完成所有检查项后，请在下方签名确认：

- **部署人员**: ________________
- **部署日期**: ________________
- **服务器IP**: ________________
- **应用地址**: ________________

---

**最后更新**: 2025年12月  
**版本**: 1.0



