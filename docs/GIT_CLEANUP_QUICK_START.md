# Git清理快速开始指南

## 🚀 快速清理步骤（推荐）

如果你在GitHub上看到分支中有很多不应该提交的文件，按以下步骤操作：

### 步骤1：检查当前状态

```bash
cd QLM

# 查看当前分支
git branch --show-current

# 检查是否有不应提交的文件
git ls-files | Select-String -Pattern "\.db$|coverage/|node_modules/"
```

### 步骤2：从Git索引中删除（保留本地文件）

```powershell
# Windows PowerShell

# 删除数据库文件
git rm --cached backend/src/database/*.db 2>$null

# 删除coverage目录
git rm --cached -r backend/coverage/ 2>$null

# 删除node_modules（如果存在）
git rm --cached -r backend/node_modules/ 2>$null
git rm --cached -r frontend/node_modules/ 2>$null

# 删除日志文件
git ls-files | Where-Object { $_ -match "\.log$" } | ForEach-Object { git rm --cached $_ }

# 删除环境变量文件（保留.env.example）
git ls-files | Where-Object { $_ -match "\.env$" -and $_ -notmatch "\.env\.example" } | ForEach-Object { git rm --cached $_ }
```

### 步骤3：提交更改

```bash
git add .gitignore
git commit -m "chore: 从Git中删除不应提交的文件"

# 查看将要提交的更改
git status
```

### 步骤4：推送到远程

```bash
git push
```

---

## 🔥 如果需要清理Git历史（高级操作）

**⚠️ 警告**：这会重写Git历史，需要强制推送，会影响其他团队成员！

### 使用git filter-repo（推荐）

```bash
# 1. 安装git-filter-repo
pip install git-filter-repo

# 2. 备份仓库
git clone --mirror <repo-url> backup-repo.git

# 3. 清理历史
git filter-repo --path-glob "backend/src/database/*.db" --invert-paths --force
git filter-repo --path-glob "backend/coverage/**" --invert-paths --force
git filter-repo --path-glob "**/node_modules/**" --invert-paths --force

# 4. 强制推送
git push origin --force --all
git push origin --force --tags
```

---

## ✅ 验证结果

清理后验证：

```bash
# 检查文件是否还在Git中
git ls-files | Select-String -Pattern "\.db$|coverage/|node_modules/"

# 应该没有输出（或者只有预期的文件，如.env.example）
```

---

## 📝 常见问题

### Q: 删除后文件还在本地吗？

A: 是的，`git rm --cached` 只从Git索引中删除，本地文件保留。

### Q: 会影响其他团队成员吗？

A: 
- 如果只是从索引删除（步骤1-4）：不会，正常推送即可
- 如果清理历史：会，需要通知他们重新clone

### Q: 如何防止以后再提交这些文件？

A: 确保 `.gitignore` 规则正确（已更新），未来新文件会自动被忽略。

---

**建议**：先执行步骤1-4（从索引删除），这样简单安全。如果需要完全清理历史，再考虑使用git-filter-repo。

