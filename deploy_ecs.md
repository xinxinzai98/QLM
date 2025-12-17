# 傻瓜式 ECS 部署指南 (保姆级教程)

本教程假设你从来没有部署过项目，只会使用 SSH 连接到服务器。请严格按照以下步骤，一行一行复制命令执行。

## 第一步：连接服务器

1. 打开你的终端（Terminal）。
2. 输入 `ssh root@你的服务器IP` 并回车。
   （例如：`ssh root@123.45.67.89`，如果有密码会提示你输入，输入时屏幕不会显示任何字符，输完回车即可）

---

## 第二步：准备环境 (已安装可跳过，不确定就全跑一遍)

复制下面的命令块，粘贴到服务器终端中运行。这会帮你安装 Git 和 Docker。

**如果是 CentOS / Alibaba Cloud Linux (通常是这个):**
```bash
# 1. 更新系统软件
yum update -y

# 2. 安装 Git
yum install -y git

# 3. 安装 Docker
yum install -y docker
systemctl start docker
systemctl enable docker

# 4. 安装 Docker Compose (新版命令)
curl -L https://github.com/docker/compose/releases/download/v2.20.2/docker-compose-linux-x86_64 -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose
ln -s /usr/local/bin/docker-compose /usr/bin/docker-compose

# 5. 验证安装 (出现版本号说明成功)
git --version
docker --version
docker-compose --version
```

**如果是 Ubuntu / Debian:**
```bash
# 1. 更新软件源
apt-get update
apt-get install -y git docker.io docker-compose

# 2. 启动 Docker
systemctl start docker
systemctl enable docker

# 3. 验证安装
git --version
docker --version
docker-compose --version
```

---

## 第二步 (补充)：配置 Docker 镜像加速 (推荐！)

为了下载镜像飞快，请直接复制下面整段执行。

```bash
mkdir -p /etc/docker
tee /etc/docker/daemon.json <<-'EOF'
{
  "registry-mirrors": ["https://frz7i079.mirror.aliyuncs.com"]
}
EOF
systemctl daemon-reload
systemctl restart docker
```
*注：这里使用的是公共加速地址，如果你有阿里云账号，也可以去容器镜像服务通过【镜像加速器】获取专属地址，速度更快。*

---

## 第三步：下载代码

1. **进入目录** (我们将项目放在 /opt 目录下)
   ```bash
   cd /opt
   ```

2. **拉取代码** (注意：如果项目是私有的，可能需要输入 GitHub 账号密码，或者配置 SSH Key。如果是公开的直接跑)
   ```bash
   # 如果目录已存在，先删除
   rm -rf QLM
   
   # 克隆代码
   git clone https://github.com/xinxinzai98/QLM.git
   ```

3. **进入项目文件夹**
   ```bash
   cd QLM
   ```

---

## 第四步：配置密钥 (最重要的一步)

你需要创建一个配置文件。请直接复制下面整段代码，粘贴到终端里按回车：

```bash
cat > .env <<EOF
# 这里是生产环境配置
NODE_ENV=production
PORT=3000

# !!! 注意：为了安全，下面这行乱码建议随便改几个字母，变得不一样就行 !!!
JWT_SECRET=super_long_secret_key_change_this_to_something_random_123456
EOF
```

然后创建需要的数据文件夹：
```bash
mkdir -p data/database
mkdir -p data/uploads
chmod 755 data/uploads
```

---

## 第五步：启动服务

输入下面这行命令，开始下载和启动：

```bash
docker-compose -f docker-compose.prod.yml up -d --build
```
*解释：`up` 启动, `-d` 后台运行, `--build` 重新构建镜像*

**等待几分钟...** 直到看到全是 `Started` 或者 `Running`。

查看是否启动成功：
```bash
docker-compose -f docker-compose.prod.yml ps
```
如果状态显示 `Up`，那就成功了！

---

## 第六步：最后确认

打开浏览器，访问：
`http://你的服务器IP:3000`

如果不通：
1. **检查阿里云安全组**：去阿里云控制台 -> 实例 -> 安全组 -> 配置规则 -> 添加一条：
   - 协议: TCP
   - 端口: 3000
   - 源IP: 0.0.0.0/0
2. **看报错日志**：
   ```bash
   docker-compose -f docker-compose.prod.yml logs --tail=100 -f
   ```
   (按 Ctrl+C 退出日志查看)

## 以后怎么更新？

下次你修改了代码，只需要做三件事：

1. 进入目录：
   ```bash
   cd /opt/QLM
   ```
2. 拉取最新代码：
   ```bash
   git pull
   ```
3. 重启服务：
   ```bash
   docker-compose -f docker-compose.prod.yml up -d --build
   ```
