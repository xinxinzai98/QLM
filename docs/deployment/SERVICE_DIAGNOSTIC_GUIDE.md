# 服务访问问题诊断指南

## 🚨 问题：构建完成但远程无法访问

如果 Docker 构建成功，但无法通过浏览器访问服务，请按照以下步骤排查。

---

## 📋 快速诊断（推荐）

### 方法一：使用诊断脚本（最简单）

```bash
# 1. 进入项目目录
cd /opt/QLM

# 2. 拉取最新代码（包含诊断脚本）
git pull origin main

# 3. 给脚本添加执行权限
chmod +x scripts/diagnose_service.sh

# 4. 运行诊断脚本
./scripts/diagnose_service.sh
```

脚本会自动检查：
- ✅ 容器是否运行
- ✅ 端口映射是否正常
- ✅ 容器内服务是否监听
- ✅ 服务响应是否正常
- ✅ 环境变量配置
- ✅ 防火墙配置
- ✅ 错误日志

---

## 🔍 手动诊断步骤

如果不想使用脚本，可以手动执行以下命令：

### 1. 检查容器状态

```bash
docker ps -a | grep mms-app
```

**预期结果**：应该看到 `mms-app` 容器的状态为 `Up`

**如果容器未运行**：
```bash
# 查看容器日志
docker logs --tail=100 mms-app

# 重启容器
docker-compose -f docker-compose.prod.yml restart

# 如果重启失败，查看完整日志
docker logs -f mms-app
```

---

### 2. 检查端口映射

```bash
docker port mms-app
```

**预期结果**：应该显示 `3000/tcp -> 0.0.0.0:3000`

**如果端口映射异常**：
```bash
# 检查 docker-compose.prod.yml 中的端口配置
cat docker-compose.prod.yml | grep -A 2 "ports:"

# 重启容器
docker-compose -f docker-compose.prod.yml restart
```

---

### 3. 测试容器内服务

```bash
# 进入容器测试
docker exec mms-app wget -qO- http://localhost:3000/api/health

# 或者使用 curl
docker exec mms-app curl -s http://localhost:3000/api/health
```

**预期结果**：应该返回 JSON 响应，如 `{"status":"ok"}`

**如果容器内无法访问**：
```bash
# 查看容器日志，查找启动错误
docker logs --tail=100 mms-app | grep -i error

# 检查环境变量
docker exec mms-app env | grep JWT_SECRET
```

---

### 4. 测试宿主机本地访问

```bash
curl http://localhost:3000/api/health
```

**预期结果**：应该返回 JSON 响应

**如果本地无法访问，但容器内可以访问**：
- 问题在端口映射，检查 `docker-compose.prod.yml`
- 检查是否有其他进程占用 3000 端口：`netstat -tlnp | grep 3000`

**如果本地可以访问，但外网无法访问**：
- 问题在防火墙或安全组配置（见步骤 5、6）

---

### 5. 检查服务器防火墙

#### CentOS/Alibaba Cloud Linux

```bash
# 查看防火墙状态
systemctl status firewalld

# 查看已开放端口
firewall-cmd --list-ports

# 如果未开放3000端口，添加并重启
firewall-cmd --permanent --add-port=3000/tcp
firewall-cmd --reload

# 验证
firewall-cmd --list-ports
```

#### Ubuntu/Debian

```bash
# 查看 UFW 状态
ufw status

# 如果未开放3000端口，添加
ufw allow 3000/tcp
ufw reload
```

---

### 6. 检查阿里云安全组

**这是最常见的原因！**

1. 登录阿里云控制台
2. 进入 **ECS** → **实例** → 选择你的服务器
3. 点击 **安全组** → **配置规则**
4. 检查 **入方向** 规则中是否有 **3000 端口**
5. 如果没有，点击 **添加安全组规则**：
   - **端口范围**：`3000/3000`
   - **授权对象**：`0.0.0.0/0`（或你的特定IP）
   - **协议类型**：`TCP`
   - **描述**：`MMS Application`

---

### 7. 检查应用日志

```bash
# 查看最近100行日志
docker logs --tail=100 mms-app

# 实时查看日志
docker logs -f mms-app

# 查找错误
docker logs mms-app 2>&1 | grep -i "error\|fatal\|exception"
```

**常见错误及解决方法**：

#### 错误：`JWT_SECRET must be set in production environment`
**原因**：缺少 JWT_SECRET 环境变量
**解决**：
```bash
# 检查 .env 文件
cat .env | grep JWT_SECRET

# 如果不存在，生成并设置
JWT_SECRET=$(openssl rand -hex 32)
echo "JWT_SECRET=$JWT_SECRET" >> .env

# 重启容器
docker-compose -f docker-compose.prod.yml restart
```

#### 错误：`EADDRINUSE: address already in use :::3000`
**原因**：端口被占用
**解决**：
```bash
# 查找占用端口的进程
netstat -tlnp | grep 3000

# 停止占用端口的进程
kill -9 <PID>

# 或修改 docker-compose.prod.yml 中的端口映射
# 将 "3000:3000" 改为 "3001:3000"
```

#### 错误：数据库相关错误
**原因**：数据库文件权限或路径问题
**解决**：
```bash
# 检查数据目录权限
ls -la data/database

# 修复权限
chmod -R 755 data/

# 重启容器
docker-compose -f docker-compose.prod.yml restart
```

---

## 🎯 快速修复清单

按照以下顺序检查：

- [ ] **步骤1**：容器是否运行？`docker ps | grep mms-app`
- [ ] **步骤2**：容器内服务是否正常？`docker exec mms-app curl http://localhost:3000/api/health`
- [ ] **步骤3**：宿主机本地是否能访问？`curl http://localhost:3000/api/health`
- [ ] **步骤4**：防火墙是否开放3000端口？`firewall-cmd --list-ports`
- [ ] **步骤5**：阿里云安全组是否配置3000端口？
- [ ] **步骤6**：查看日志是否有错误？`docker logs --tail=100 mms-app`

---

## 🔧 常用修复命令

### 完整重启服务

```bash
cd /opt/QLM

# 停止服务
docker-compose -f docker-compose.prod.yml stop

# 启动服务
docker-compose -f docker-compose.prod.yml up -d

# 查看状态
docker-compose -f docker-compose.prod.yml ps

# 查看日志
docker-compose -f docker-compose.prod.yml logs -f
```

### 重新构建并启动

```bash
cd /opt/QLM

# 重新构建（如果代码有更新）
docker-compose -f docker-compose.prod.yml build

# 启动服务
docker-compose -f docker-compose.prod.yml up -d

# 查看日志
docker-compose -f docker-compose.prod.yml logs -f
```

### 完全重置（谨慎使用）

```bash
cd /opt/QLM

# 停止并删除容器
docker-compose -f docker-compose.prod.yml down

# 重新构建并启动
docker-compose -f docker-compose.prod.yml up -d --build

# 查看日志
docker-compose -f docker-compose.prod.yml logs -f
```

---

## 📞 如果问题仍未解决

1. **收集诊断信息**：
   ```bash
   # 运行诊断脚本
   ./scripts/diagnose_service.sh > diagnostic_report.txt
   
   # 查看日志
   docker logs mms-app > app_logs.txt
   
   # 查看配置
   cat docker-compose.prod.yml > config.txt
   cat .env > env.txt
   ```

2. **检查系统资源**：
   ```bash
   # 检查内存
   free -h
   
   # 检查磁盘空间
   df -h
   
   # 检查 Docker 资源
   docker stats mms-app
   ```

3. **查看详细日志**：
   ```bash
   # 查看所有日志
   docker logs mms-app 2>&1 | tee full_logs.txt
   ```

---

## ✅ 验证服务正常运行

如果所有检查都通过，验证服务：

```bash
# 1. 容器状态
docker ps | grep mms-app

# 2. 本地健康检查
curl http://localhost:3000/api/health

# 3. 外网访问（替换为你的服务器IP）
curl http://你的服务器IP:3000/api/health

# 4. 浏览器访问
# http://你的服务器IP:3000
```

---

## 📝 注意事项

1. **首次部署必须配置 JWT_SECRET**（至少32个字符）
2. **确保数据目录有正确权限**：`chmod -R 755 data/`
3. **定期检查日志**：`docker logs --tail=50 mms-app`
4. **备份数据**：部署前使用 `scripts/scheduled_backup.sh`

