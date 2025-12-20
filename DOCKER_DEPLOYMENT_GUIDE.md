# 🐳 Docker部署到阿里云ECS - 超详细教程

> **本教程专为零基础用户设计，假设你从未部署过项目，每一步都有详细说明和命令示例。**

---

## 📋 目录

1. [准备工作](#准备工作)
2. [第一步：购买和配置阿里云ECS](#第一步购买和配置阿里云ecs)
3. [第二步：连接服务器](#第二步连接服务器)
4. [第三步：安装Docker和Docker Compose](#第三步安装docker和docker-compose)
5. [第四步：上传项目代码](#第四步上传项目代码)
6. [第五步：配置环境变量](#第五步配置环境变量)
7. [第六步：构建和启动Docker容器](#第六步构建和启动docker容器)
8. [第七步：配置安全组（开放端口）](#第七步配置安全组开放端口)
9. [第八步：验证部署](#第八步验证部署)
10. [可选：配置Nginx反向代理](#可选配置nginx反向代理)
11. [可选：配置域名](#可选配置域名)
12. [日常维护](#日常维护)
13. [故障排查](#故障排查)

---

## 准备工作

### 你需要准备的东西：

1. ✅ **阿里云账号**（如果没有，去 https://www.aliyun.com 注册）
2. ✅ **一台Windows/Mac电脑**（用于连接服务器）
3. ✅ **项目代码**（本地的QLM项目文件夹）
4. ✅ **30-60分钟时间**（首次部署）

### 系统要求：

- **ECS配置建议**：
  - CPU：2核或以上
  - 内存：2GB或以上
  - 系统盘：40GB或以上
  - 操作系统：CentOS 7+ / Ubuntu 18.04+ / Alibaba Cloud Linux 2.0+

---

## 第一步：购买和配置阿里云ECS

### 1.1 购买ECS实例

1. **登录阿里云控制台**
   - 访问：https://ecs.console.aliyun.com
   - 使用你的阿里云账号登录

2. **创建ECS实例**
   - 点击左侧菜单「实例与镜像」→「实例」
   - 点击右上角「创建实例」按钮

3. **选择配置**（按需选择，以下为最低配置）
   ```
   付费模式：包年包月 或 按量付费（测试用按量付费更便宜）
   地域：选择离你最近的地域（如：华东1-杭州）
   实例规格：ecs.t6-c1m2.large（2核2GB，约30元/月）
   镜像：CentOS 7.9 或 Alibaba Cloud Linux 2.1903
   系统盘：40GB 高效云盘
   网络：专有网络VPC（默认即可）
   公网IP：分配公网IPv4地址（必须！）
   安全组：选择默认安全组（后面会配置）
   ```

4. **设置密码**
   - 登录凭证选择「自定义密码」
   - 设置一个强密码（记住它！后面连接服务器要用）
   - 用户名：`root`（CentOS/Alibaba Cloud Linux）

5. **确认订单并支付**
   - 检查配置无误后，点击「确认订单」
   - 完成支付

6. **等待实例创建完成**
   - 通常1-2分钟即可创建完成
   - 创建完成后，在实例列表中可以看到你的服务器

### 1.2 记录重要信息

创建完成后，记录以下信息（后面会用到）：

```
服务器公网IP：例如 47.xxx.xxx.xxx
登录用户名：root
登录密码：你刚才设置的密码
```

---

## 第二步：连接服务器

### Windows用户（使用PuTTY或PowerShell）

#### 方式一：使用PowerShell（推荐，Windows 10自带）

1. **打开PowerShell**
   - 按 `Win + X`，选择「Windows PowerShell」或「终端」
   - 或者在开始菜单搜索「PowerShell」

2. **连接服务器**
   ```powershell
   ssh root@你的服务器IP
   ```
   例如：
   ```powershell
   ssh root@47.xxx.xxx.xxx
   ```

3. **输入密码**
   - 第一次连接会提示「Are you sure you want to continue connecting?」
   - 输入 `yes` 并回车
   - 然后输入你设置的密码（输入时屏幕不会显示，输完直接回车）

4. **连接成功**
   - 看到类似 `[root@iZxxx ~]#` 的提示符，说明连接成功！

#### 方式二：使用PuTTY（如果PowerShell不能用）

1. **下载PuTTY**
   - 访问：https://www.putty.org/
   - 下载并安装

2. **连接服务器**
   - 打开PuTTY
   - Host Name: 输入你的服务器IP
   - Port: 22
   - Connection type: SSH
   - 点击「Open」
   - 输入用户名：`root`
   - 输入密码（输入时不会显示）

### Mac/Linux用户

1. **打开终端（Terminal）**

2. **连接服务器**
   ```bash
   ssh root@你的服务器IP
   ```
   例如：
   ```bash
   ssh root@47.xxx.xxx.xxx
   ```

3. **输入密码**
   - 输入你设置的密码（输入时不会显示）
   - 输完直接回车

4. **连接成功**
   - 看到类似 `[root@iZxxx ~]#` 的提示符，说明连接成功！

---

## 第三步：安装Docker和Docker Compose

> ⚠️ **重要**：以下命令需要一行一行复制执行，不要一次性复制全部！

### 3.1 检查系统版本

首先确认你的系统版本：

```bash
cat /etc/os-release
```

根据输出结果，选择对应的安装命令：

### 3.2 CentOS 7 / Alibaba Cloud Linux 2.0（推荐）

```bash
# 1. 更新系统软件包
yum update -y

# 2. 安装必要的工具
yum install -y yum-utils device-mapper-persistent-data lvm2

# 3. 添加Docker官方仓库（使用阿里云镜像加速）
yum-config-manager --add-repo https://mirrors.aliyun.com/docker-ce/linux/centos/docker-ce.repo

# 4. 安装Docker
yum install -y docker-ce docker-ce-cli containerd.io

# 5. 启动Docker服务
systemctl start docker

# 6. 设置Docker开机自启
systemctl enable docker

# 7. 验证Docker安装
docker --version
```

如果看到类似 `Docker version 24.0.x` 的输出，说明Docker安装成功！

### 3.3 Ubuntu 18.04+ / Debian

```bash
# 1. 更新软件包索引
apt-get update

# 2. 安装必要的工具
apt-get install -y apt-transport-https ca-certificates curl gnupg lsb-release

# 3. 添加Docker官方GPG密钥
curl -fsSL https://mirrors.aliyun.com/docker-ce/linux/ubuntu/gpg | gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

# 4. 添加Docker仓库
echo "deb [arch=amd64 signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://mirrors.aliyun.com/docker-ce/linux/ubuntu $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null

# 5. 安装Docker
apt-get update
apt-get install -y docker-ce docker-ce-cli containerd.io

# 6. 启动Docker服务
systemctl start docker

# 7. 设置Docker开机自启
systemctl enable docker

# 8. 验证Docker安装
docker --version
```

### 3.4 配置Docker镜像加速（重要！）

为了加快Docker镜像下载速度，配置阿里云镜像加速：

```bash
# 创建Docker配置目录
mkdir -p /etc/docker

# 配置镜像加速（使用阿里云公共镜像加速器）
cat > /etc/docker/daemon.json <<EOF
{
  "registry-mirrors": [
    "https://frz7i079.mirror.aliyuncs.com",
    "https://registry.docker-cn.com",
    "https://docker.mirrors.ustc.edu.cn"
  ]
}
EOF

# 重新加载配置
systemctl daemon-reload

# 重启Docker服务
systemctl restart docker

# 验证配置
docker info | grep -A 10 "Registry Mirrors"
```

如果看到镜像地址列表，说明配置成功！

> 💡 **提示**：如果你有阿里云账号，可以登录阿里云控制台 → 容器镜像服务 → 镜像加速器，获取专属加速地址（速度更快）。

### 3.5 安装Docker Compose

```bash
# 下载Docker Compose（使用国内镜像）
curl -L "https://get.daocloud.io/docker/compose/releases/download/v2.20.2/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose

# 或者使用GitHub官方源（如果上面的不行）
# curl -L "https://github.com/docker/compose/releases/download/v2.20.2/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose

# 添加执行权限
chmod +x /usr/local/bin/docker-compose

# 创建软链接（可选，方便使用）
ln -s /usr/local/bin/docker-compose /usr/bin/docker-compose

# 验证安装
docker-compose --version
```

如果看到类似 `Docker Compose version v2.20.2` 的输出，说明安装成功！

---

## 第四步：上传项目代码

有几种方式上传代码，选择最适合你的：

### 方式一：使用Git克隆（推荐，如果代码在GitHub/GitLab）

```bash
# 1. 安装Git（如果还没安装）
yum install -y git  # CentOS/Alibaba Cloud Linux
# 或
apt-get install -y git  # Ubuntu/Debian

# 2. 进入项目目录（我们放在 /opt 目录下）
cd /opt

# 3. 克隆项目（替换为你的Git仓库地址）
git clone https://github.com/your-username/QLM.git

# 4. 进入项目目录
cd QLM
```

### 方式二：使用SCP上传（适合本地已有代码）

#### Windows用户（使用PowerShell）

1. **打开新的PowerShell窗口**（不要关闭SSH连接窗口）

2. **进入项目目录**
   ```powershell
   cd C:\Users\92852\Desktop\QLM
   ```

3. **上传整个项目文件夹**
   ```powershell
   scp -r QLM root@你的服务器IP:/opt/
   ```
   例如：
   ```powershell
   scp -r QLM root@47.xxx.xxx.xxx:/opt/
   ```

4. **输入密码**（输入时不会显示）

5. **等待上传完成**（可能需要几分钟）

#### Mac/Linux用户

1. **打开新的终端窗口**

2. **进入项目目录**
   ```bash
   cd ~/Desktop/QLM
   ```

3. **上传整个项目文件夹**
   ```bash
   scp -r QLM root@你的服务器IP:/opt/
   ```

4. **输入密码**

5. **等待上传完成**

### 方式三：使用FTP工具（如FileZilla）

1. **下载FileZilla**
   - 访问：https://filezilla-project.org/
   - 下载并安装

2. **连接服务器**
   - 主机：`sftp://你的服务器IP`
   - 用户名：`root`
   - 密码：你的服务器密码
   - 端口：22

3. **上传文件**
   - 左侧：本地文件（找到你的QLM项目文件夹）
   - 右侧：服务器文件（进入 `/opt` 目录）
   - 拖拽整个 `QLM` 文件夹到右侧

### 验证上传成功

回到SSH连接窗口，执行：

```bash
# 进入项目目录
cd /opt/QLM

# 查看文件列表
ls -la

# 应该能看到以下文件：
# - Dockerfile
# - docker-compose.yml
# - docker-compose.prod.yml
# - backend/
# - frontend/
# - README.md
```

如果能看到这些文件，说明上传成功！

---

## 第五步：配置环境变量

### 5.1 创建环境变量文件

在项目根目录创建 `.env` 文件：

```bash
# 确保在项目根目录
cd /opt/QLM

# ⚠️ 重要：先生成强随机JWT密钥
# 方法1：使用OpenSSL（推荐）
JWT_SECRET=$(openssl rand -hex 32)

# 方法2：如果没有OpenSSL，使用Node.js
# JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")

# 创建.env文件
cat > .env <<EOF
# 生产环境配置
NODE_ENV=production
PORT=3000

# ⚠️ 安全警告：必须使用强随机生成的密钥（至少32个字符）
# 已自动生成随机密钥，请妥善保管！
JWT_SECRET=${JWT_SECRET}

# JWT过期时间（7天）
JWT_EXPIRES_IN=7d

# 数据库路径
DB_PATH=./database/mms.db
EOF

echo "⚠️  重要：JWT_SECRET已生成，请妥善保管！"
echo "⚠️  密钥值：${JWT_SECRET:0:20}..."
```

### 5.2 生成强随机JWT密钥（推荐）

为了安全，建议使用随机生成的密钥：

```bash
# 生成32位随机字符串
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

如果没有Node.js，可以用这个命令：

```bash
# 使用OpenSSL生成随机字符串
openssl rand -hex 32
```

复制生成的字符串，然后编辑 `.env` 文件：

```bash
# 编辑.env文件
nano .env
```

或者使用vi编辑器：

```bash
vi .env
```

**vi编辑器使用说明**：
- 按 `i` 进入编辑模式
- 找到 `JWT_SECRET=` 这一行，替换后面的值为刚才生成的随机字符串
- 按 `Esc` 退出编辑模式
- 输入 `:wq` 保存并退出

### 5.3 创建数据目录

```bash
# 创建数据持久化目录
mkdir -p data/database
mkdir -p data/uploads
mkdir -p data/logs

# 设置权限
chmod -R 755 data
```

---

## 第六步：构建和启动Docker容器

### 6.1 构建Docker镜像

```bash
# 确保在项目根目录
cd /opt/QLM

# 构建镜像（这可能需要5-10分钟，请耐心等待）
docker-compose -f docker-compose.prod.yml build
```

**说明**：
- `-f docker-compose.prod.yml`：指定使用生产环境配置文件
- 第一次构建会下载基础镜像，需要一些时间
- 如果看到 `Successfully built` 或 `Successfully tagged`，说明构建成功

### 6.2 启动容器

```bash
# 启动容器（后台运行）
docker-compose -f docker-compose.prod.yml up -d
```

**说明**：
- `up`：启动服务
- `-d`：后台运行（detached mode）
- 启动后会自动创建并运行容器

### 6.3 查看容器状态

```bash
# 查看容器运行状态
docker-compose -f docker-compose.prod.yml ps
```

**期望输出**：
```
NAME      IMAGE           COMMAND             STATUS          PORTS
mms-app   mms-app:latest  "node server.js"   Up 2 minutes    0.0.0.0:3000->3000/tcp
```

如果 `STATUS` 显示 `Up`，说明容器正在运行！

### 6.4 查看日志（可选）

如果容器没有正常启动，可以查看日志：

```bash
# 查看实时日志
docker-compose -f docker-compose.prod.yml logs -f

# 查看最近100行日志
docker-compose -f docker-compose.prod.yml logs --tail=100

# 按 Ctrl+C 退出日志查看
```

**常见日志信息**：
- ✅ `物料管理系统后端服务运行在 http://localhost:3000` - 启动成功
- ❌ `Error:` - 有错误，需要检查配置

---

## 第七步：配置安全组（开放端口）

### 7.1 为什么需要配置安全组？

阿里云ECS默认只开放22端口（SSH），我们需要开放3000端口才能访问应用。

### 7.2 配置步骤

1. **登录阿里云控制台**
   - 访问：https://ecs.console.aliyun.com

2. **进入实例管理**
   - 左侧菜单「实例与镜像」→「实例」
   - 找到你的ECS实例，点击实例ID

3. **配置安全组**
   - 点击「安全组」标签页
   - 点击安全组ID（如：sg-xxxxx）

4. **添加入站规则**
   - 点击「入方向」标签页
   - 点击「添加安全组规则」

5. **配置规则**
   ```
   规则方向：入方向
   授权策略：允许
   优先级：1（默认）
   协议类型：自定义TCP
   端口范围：3000/3000
   授权对象：0.0.0.0/0（允许所有IP访问，生产环境建议限制IP）
   描述：MMS应用端口
   ```

6. **保存规则**
   - 点击「保存」
   - 规则立即生效

### 7.3 验证端口是否开放

在本地电脑打开浏览器，访问：

```
http://你的服务器IP:3000
```

例如：`http://47.xxx.xxx.xxx:3000`

如果能看到登录页面或应用界面，说明端口已开放！

---

## 第八步：验证部署

### 8.1 检查容器健康状态

```bash
# 查看容器健康状态
docker ps

# 查看健康检查详情
docker inspect mms-app | grep -A 10 Health
```

### 8.2 测试API接口

```bash
# 测试健康检查接口
curl http://localhost:3000/api/health
```

**期望输出**：
```json
{"status":"ok","message":"MMS Backend is running"}
```

### 8.3 浏览器访问测试

1. **打开浏览器**
   - Chrome、Firefox、Edge等都可以

2. **访问应用**
   ```
   http://你的服务器IP:3000
   ```

3. **登录测试**
   - 默认账号：`admin`
   - 默认密码：`admin123`
   - 如果能成功登录，说明部署成功！🎉

### 8.4 常见问题

如果无法访问，检查以下几点：

1. **容器是否运行**
   ```bash
   docker ps
   ```
   如果看不到容器，检查日志：
   ```bash
   docker-compose -f docker-compose.prod.yml logs
   ```

2. **端口是否开放**
   - 检查阿里云安全组配置
   - 检查服务器防火墙（CentOS 7）：
     ```bash
     firewall-cmd --list-ports
     # 如果没有3000，添加：
     firewall-cmd --permanent --add-port=3000/tcp
     firewall-cmd --reload
     ```

3. **网络连接**
   ```bash
   # 在服务器上测试
   curl http://localhost:3000/api/health
   ```
   如果服务器上能访问，但外网不能访问，问题在安全组配置。

---

## 可选：配置Nginx反向代理

> **为什么要配置Nginx？**
> - 可以使用80端口（HTTP默认端口，访问时不需要输入端口号）
> - 可以配置HTTPS（SSL证书）
> - 更好的性能和安全性

### 安装Nginx

```bash
# CentOS/Alibaba Cloud Linux
yum install -y nginx

# Ubuntu/Debian
apt-get install -y nginx

# 启动Nginx
systemctl start nginx
systemctl enable nginx
```

### 配置Nginx

```bash
# 创建Nginx配置文件
cat > /etc/nginx/conf.d/mms.conf <<EOF
server {
    listen 80;
    server_name 你的服务器IP;  # 或你的域名，如：mms.example.com

    # 前端静态文件
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }

    # 后端API代理
    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    # 上传文件代理
    location /uploads {
        proxy_pass http://localhost:3000;
        proxy_set_header Host \$host;
    }
}
EOF

# 测试Nginx配置
nginx -t

# 重新加载Nginx配置
systemctl reload nginx
```

### 配置安全组开放80端口

按照第七步的方法，添加80端口规则。

### 访问测试

现在可以通过80端口访问（不需要输入端口号）：

```
http://你的服务器IP
```

---

## 可选：配置域名

### 前提条件

1. 拥有一个域名（如：example.com）
2. 域名已备案（如果使用国内服务器）

### 配置步骤

1. **添加域名解析**
   - 登录域名服务商控制台（如：阿里云域名控制台）
   - 添加A记录：
     ```
     记录类型：A
     主机记录：mms（或@，表示主域名）
     记录值：你的服务器IP
     TTL：600（默认）
     ```

2. **等待DNS生效**
   - 通常5-30分钟生效
   - 可以用 `ping mms.example.com` 测试是否解析成功

3. **修改Nginx配置**
   ```bash
   # 编辑Nginx配置
   nano /etc/nginx/conf.d/mms.conf
   ```
   修改 `server_name` 为你的域名：
   ```nginx
   server_name mms.example.com;
   ```
   保存后重新加载：
   ```bash
   nginx -t
   systemctl reload nginx
   ```

4. **访问测试**
   ```
   http://mms.example.com
   ```

---

## 日常维护

### 查看日志

```bash
# 查看应用日志
docker-compose -f docker-compose.prod.yml logs -f

# 查看最近100行日志
docker-compose -f docker-compose.prod.yml logs --tail=100

# 查看特定服务的日志
docker logs mms-app -f
```

### 重启服务

```bash
# 重启容器
docker-compose -f docker-compose.prod.yml restart

# 或停止后启动
docker-compose -f docker-compose.prod.yml stop
docker-compose -f docker-compose.prod.yml up -d
```

### 更新代码

```bash
# 1. 进入项目目录
cd /opt/QLM

# 2. 如果使用Git，拉取最新代码
git pull

# 3. 重新构建并启动
docker-compose -f docker-compose.prod.yml up -d --build
```

### 备份数据

```bash
# 备份数据库和上传文件
tar -czf backup-$(date +%Y%m%d-%H%M%S).tar.gz data/

# 备份到本地（使用SCP）
# 在本地电脑执行：
scp root@你的服务器IP:/opt/QLM/backup-*.tar.gz ./
```

### 恢复数据

```bash
# 1. 停止容器
docker-compose -f docker-compose.prod.yml stop

# 2. 恢复备份文件
tar -xzf backup-20240101-120000.tar.gz

# 3. 启动容器
docker-compose -f docker-compose.prod.yml up -d
```

### 查看资源使用情况

```bash
# 查看容器资源使用
docker stats mms-app

# 查看磁盘使用
df -h

# 查看内存使用
free -h
```

---

## 故障排查

### 问题1：容器无法启动

**症状**：`docker ps` 看不到容器，或状态显示 `Exited`

**解决方法**：
```bash
# 1. 查看日志
docker-compose -f docker-compose.prod.yml logs

# 2. 检查环境变量
cat .env

# 3. 检查端口是否被占用
netstat -tlnp | grep 3000

# 4. 重新构建并启动
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml up -d --build
```

### 问题2：无法访问应用

**症状**：浏览器显示「无法访问此网站」或「连接超时」

**解决方法**：
1. **检查容器是否运行**
   ```bash
   docker ps
   ```

2. **检查安全组配置**
   - 确认3000端口已开放
   - 授权对象为 `0.0.0.0/0`

3. **检查服务器防火墙**
   ```bash
   # CentOS 7
   firewall-cmd --list-ports
   firewall-cmd --permanent --add-port=3000/tcp
   firewall-cmd --reload
   ```

4. **测试本地访问**
   ```bash
   curl http://localhost:3000/api/health
   ```

### 问题3：数据库错误

**症状**：日志显示数据库相关错误

**解决方法**：
```bash
# 1. 检查数据目录权限
ls -la data/database

# 2. 修复权限
chmod -R 755 data/

# 3. 重启容器
docker-compose -f docker-compose.prod.yml restart
```

### 问题4：JWT密钥错误

**症状**：登录后提示「Token无效」

**解决方法**：
```bash
# 1. 检查.env文件中的JWT_SECRET
cat .env | grep JWT_SECRET

# 2. 确保JWT_SECRET至少32个字符
# 3. 重新生成并更新JWT_SECRET
# 4. 重启容器
docker-compose -f docker-compose.prod.yml restart
```

### 问题5：内存不足

**症状**：容器频繁重启，日志显示内存相关错误

**解决方法**：
1. **检查内存使用**
   ```bash
   free -h
   docker stats mms-app
   ```

2. **增加ECS内存**（需要升级ECS配置）

3. **优化Docker配置**
   ```bash
   # 限制容器内存使用
   # 编辑 docker-compose.prod.yml，添加：
   # mem_limit: 1g
   ```

### 问题6：构建镜像失败

**症状**：`docker-compose build` 失败

**解决方法**：
```bash
# 1. 检查网络连接
ping mirrors.aliyun.com

# 2. 清理Docker缓存
docker system prune -a

# 3. 重新构建（不使用缓存）
docker-compose -f docker-compose.prod.yml build --no-cache
```

### 问题7：端口被占用

**症状**：启动容器时提示端口已被占用

**解决方法**：
```bash
# 1. 查找占用端口的进程
netstat -tlnp | grep 3000

# 2. 停止占用端口的进程
kill -9 <PID>

# 3. 或修改docker-compose.prod.yml中的端口映射
# 将 "3000:3000" 改为 "3001:3000"
```

---

## 📞 获取帮助

如果遇到问题无法解决：

1. **查看日志**
   ```bash
   docker-compose -f docker-compose.prod.yml logs
   ```

2. **检查配置文件**
   ```bash
   cat .env
   cat docker-compose.prod.yml
   ```

3. **查看容器状态**
   ```bash
   docker ps -a
   docker inspect mms-app
   ```

4. **联系技术支持**
   - 提供错误日志
   - 提供系统信息：`uname -a`
   - 提供Docker版本：`docker --version`

---

## ✅ 部署检查清单

部署完成后，请确认以下项目：

- [ ] Docker和Docker Compose已安装
- [ ] 项目代码已上传到服务器
- [ ] `.env` 文件已创建并配置JWT_SECRET
- [ ] 数据目录已创建（data/database, data/uploads）
- [ ] Docker镜像构建成功
- [ ] 容器正在运行（`docker ps` 显示 Up）
- [ ] 安全组已开放3000端口
- [ ] 可以通过浏览器访问应用
- [ ] 可以正常登录（admin/admin123）
- [ ] API健康检查通过（`/api/health`）

---

## 🎉 恭喜！

如果你完成了以上所有步骤，恭喜你成功部署了物料管理系统！

现在你可以：
- ✅ 通过浏览器访问系统
- ✅ 使用默认账号登录（admin/admin123）⚠️ **仅开发环境**
- ✅ 开始使用系统管理物料

**⚠️ 重要安全提醒**：
- 🔒 **生产环境**：首次登录后，请立即修改默认密码！
- 🔒 **生产环境**：默认密码 `admin123` 存在安全风险，必须修改！
- 💾 定期备份 `data/` 目录
- 💾 定期备份 `data/` 目录
- 📊 定期查看日志，确保系统正常运行
- 🔄 定期更新代码和依赖

---

**最后更新**：2024年

**文档版本**：v1.0

