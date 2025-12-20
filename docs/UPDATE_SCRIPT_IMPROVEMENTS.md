# update.sh脚本优化说明

**清绿氢能物料管理系统 - 更新脚本优化文档**

---

## 📋 优化概述

针对阿里云ECS部署场景，对 `scripts/update.sh` 脚本进行了全面优化，确保在服务器上运行时稳定可靠。

---

## ✅ 主要改进

### 1. 固定GitHub仓库地址

**问题**：脚本可能使用错误的Git仓库地址

**解决方案**：
```bash
GITHUB_REPO="https://github.com/xinxinzai98/QLM.git"
export GIT_TERMINAL_PROMPT=0  # 禁用Git交互式提示
```

**好处**：
- 确保始终从正确的仓库拉取代码
- 避免Git交互式提示导致脚本挂起

---

### 2. 增强Git仓库检查

**问题**：首次部署时可能没有.git目录

**解决方案**：
- 如果.git目录不存在，自动初始化Git仓库
- 自动添加或更新远程仓库配置
- 验证远程仓库连接

**关键代码**：
```bash
if [ ! -d "$PROJECT_DIR/.git" ]; then
    warn "未找到 .git 目录，这可能是首次部署"
    git init
    git remote add origin "$GITHUB_REPO"
fi
```

---

### 3. 改进错误处理

**问题**：网络问题或Git操作失败时脚本可能崩溃

**解决方案**：
- 使用 `set +e` 和 `set -e` 控制错误退出
- 实现重试机制（最多3次）
- 捕获并显示详细错误信息

**关键代码**：
```bash
MAX_RETRIES=3
RETRY_COUNT=0
while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    if git fetch origin "$BRANCH" 2>&1; then
        FETCH_SUCCESS=true
        break
    else
        RETRY_COUNT=$((RETRY_COUNT + 1))
        sleep 3
    fi
done
```

---

### 4. 支持首次部署场景

**问题**：空仓库无法直接pull

**解决方案**：
- 检测空仓库（无commit历史）
- 使用 `--allow-unrelated-histories` 选项
- 如果pull失败，尝试直接checkout

**关键代码**：
```bash
if ! git rev-parse HEAD &>/dev/null; then
    # 空仓库，使用特殊处理
    git pull origin "$BRANCH" --allow-unrelated-histories
else
    # 正常pull
    git pull origin "$BRANCH"
fi
```

---

### 5. Docker Compose兼容性

**问题**：不同系统可能使用 `docker-compose` 或 `docker compose`

**解决方案**：
- 自动检测可用的compose命令
- 统一使用变量 `$COMPOSE_CMD`

**关键代码**：
```bash
if command -v docker-compose &> /dev/null; then
    COMPOSE_CMD="docker-compose"
else
    COMPOSE_CMD="docker compose"
fi
```

---

### 6. 改进分支切换逻辑

**问题**：分支不存在时可能导致错误

**解决方案**：
- 检查当前分支
- 如果分支不存在，从远程创建
- 提供详细的错误提示

**关键代码**：
```bash
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "unknown")
if [ "$CURRENT_BRANCH" != "$BRANCH" ]; then
    if ! git checkout "$BRANCH" 2>/dev/null; then
        git fetch origin "$BRANCH:$BRANCH" || git checkout -b "$BRANCH" "origin/$BRANCH"
    fi
fi
```

---

### 7. 增强错误提示

**问题**：错误时缺乏诊断信息

**解决方案**：
- 显示详细的错误信息
- 提供检查清单
- 显示当前状态

**示例**：
```bash
error "拉取代码失败，已重试 $MAX_RETRIES 次"
error "请检查："
error "  1. 网络连接是否正常: ping github.com"
error "  2. GitHub仓库地址是否正确: $GITHUB_REPO"
error "  3. 分支名称是否正确: $BRANCH"
error "  4. Git配置是否正确: git config --list"
```

---

## 🔧 配置说明

### 环境变量

可以通过环境变量自定义配置：

```bash
# 设置分支（默认：main）
export BRANCH=main

# 设置备份目录（默认：项目目录/backups）
export BACKUP_DIR=/opt/qlm-backups

# 设置保留备份天数（可选）
export KEEP_BACKUPS_DAYS=7
```

### 固定配置

以下配置已硬编码，确保一致性：

- **GitHub仓库**：`https://github.com/xinxinzai98/QLM.git`
- **默认分支**：`main`
- **Docker Compose文件**：`docker-compose.prod.yml`

---

## 📝 使用示例

### 基本用法

```bash
# 在项目根目录执行
cd /opt/QLM
./scripts/update.sh
```

### 指定分支

```bash
BRANCH=develop ./scripts/update.sh
```

### 自定义备份目录

```bash
BACKUP_DIR=/opt/backups ./scripts/update.sh
```

---

## ⚠️ 注意事项

1. **首次部署**：如果项目目录没有.git目录，脚本会自动初始化
2. **网络要求**：需要能够访问GitHub（可能需要配置代理）
3. **权限要求**：建议使用root用户运行，确保有足够权限
4. **备份**：更新前会自动备份data目录
5. **数据安全**：如果更新失败，可以从backups目录恢复

---

## 🐛 故障排查

### 问题1：无法连接到GitHub

**症状**：拉取代码失败

**解决方法**：
```bash
# 检查网络连接
ping github.com

# 检查Git配置
git config --list

# 手动测试拉取
git ls-remote --heads origin main
```

### 问题2：分支不存在

**症状**：无法切换到指定分支

**解决方法**：
```bash
# 查看远程分支
git ls-remote --heads origin

# 确认分支名称是否正确
git branch -a
```

### 问题3：Docker Compose命令找不到

**症状**：容器操作失败

**解决方法**：
```bash
# 检查Docker是否安装
docker --version

# 检查Docker Compose
docker-compose --version
# 或
docker compose version

# 安装Docker Compose（如果缺失）
```

### 问题4：权限不足

**症状**：文件操作失败

**解决方法**：
```bash
# 使用root用户运行
sudo ./scripts/update.sh

# 或给脚本执行权限
chmod +x scripts/update.sh
```

---

## 📊 改进统计

- **新增代码行数**：+179行
- **修改代码行数**：-27行
- **净增加**：+152行
- **主要改进**：7项核心功能优化

---

## ✅ 测试建议

在部署到生产环境前，建议在测试环境验证：

1. **首次部署测试**：在没有.git目录的新目录测试
2. **网络异常测试**：模拟网络中断场景
3. **分支切换测试**：测试不同分支的切换
4. **冲突处理测试**：测试有本地更改时的处理

---

**最后更新**：2024-01-XX  
**版本**：v2.0
