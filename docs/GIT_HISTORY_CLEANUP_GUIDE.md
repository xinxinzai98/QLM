# Git历史清理指南

## 📋 问题说明

如果在GitHub上看到分支中有很多不应该提交的文件（如数据库文件、node_modules、coverage报告等），说明这些文件在之前已经被提交到Git历史中了。

**重要**：即使现在 `.gitignore` 中已经添加了这些文件的忽略规则，它们仍然存在于Git历史记录中，需要手动清理。

---

## 🔍 检查当前状态

### 1. 检查Git中跟踪的文件

```bash
# 检查数据库文件
git ls-files | grep -E "\.(db|sqlite|sqlite3)$"

# 检查coverage目录
git ls-files | grep "coverage/"

# 检查node_modules
git ls-files | grep "node_modules/"

# 检查日志文件
git ls-files | grep "\.log$"

# 检查环境变量文件（.env.example除外）
git ls-files | grep "\.env" | grep -v ".env.example"
```

或者使用提供的检查脚本：

```bash
# Windows PowerShell
cd QLM
bash scripts/check_tracked_files.sh

# 或者使用Git Bash执行
```

---

## 🛠️ 清理方案

### 方案1：从Git索引中删除（保留本地文件，不清理历史）

**适用场景**：
- 文件还没有被推送到远程
- 或者这些文件是最近才添加的
- 不需要重写Git历史

**操作步骤**：

```bash
# 1. 从Git索引中删除文件（保留本地文件）
git rm --cached backend/src/database/mms.db
git rm --cached -r backend/coverage/
git rm --cached -r backend/node_modules/
git rm --cached -r frontend/node_modules/

# 2. 提交更改
git add .gitignore
git commit -m "chore: 从Git中删除不应提交的文件"

# 3. 推送到远程
git push
```

**优点**：
- 简单快速
- 不重写Git历史
- 安全

**缺点**：
- 文件仍在Git历史中（可以通过历史记录访问）

---

### 方案2：从Git历史中完全删除（重写历史）

**适用场景**：
- 文件已经被推送到远程
- 需要完全从历史中删除（如敏感信息）
- 仓库历史可以重写

**⚠️ 警告**：
- 这会**重写Git历史**
- 如果其他人已经clone了仓库，需要重新clone
- 需要**强制推送**（force push）

#### 方法2.1：使用 git filter-repo（推荐）

**安装git-filter-repo**：

```bash
# Windows (使用pip)
pip install git-filter-repo

# macOS
brew install git-filter-repo

# Linux
pip3 install git-filter-repo
```

**使用步骤**：

```bash
# 1. 备份仓库（重要！）
git clone --mirror <repo-url> backup-repo.git

# 2. 删除数据库文件
git filter-repo --path-glob "backend/src/database/*.db" --invert-paths --force

# 3. 删除coverage目录
git filter-repo --path-glob "backend/coverage/**" --invert-paths --force

# 4. 删除node_modules
git filter-repo --path-glob "backend/node_modules/**" --invert-paths --force
git filter-repo --path-glob "frontend/node_modules/**" --invert-paths --force

# 5. 强制推送到远程
git push origin --force --all
git push origin --force --tags
```

#### 方法2.2：使用 git filter-branch（兼容性好但较慢）

```bash
# 删除数据库文件
git filter-branch --force --index-filter \
    "git rm -rf --cached --ignore-unmatch 'backend/src/database/*.db'" \
    --prune-empty --tag-name-filter cat -- --all

# 删除coverage目录
git filter-branch --force --index-filter \
    "git rm -rf --cached --ignore-unmatch 'backend/coverage'" \
    --prune-empty --tag-name-filter cat -- --all

# 清理引用
git for-each-ref --format='delete %(refname)' refs/original | git update-ref --stdin
git reflog expire --expire=now --all
git gc --prune=now --aggressive

# 强制推送
git push origin --force --all
git push origin --force --tags
```

#### 方法2.3：使用BFG Repo-Cleaner（快速但需要Java）

```bash
# 下载BFG: https://rtyley.github.io/bfg-repo-cleaner/

# 删除文件
java -jar bfg.jar --delete-files "*.db" <repo-path>
java -jar bfg.jar --delete-folders "coverage" <repo-path>
java -jar bfg.jar --delete-folders "node_modules" <repo-path>

# 清理
cd <repo-path>
git reflog expire --expire=now --all
git gc --prune=now --aggressive

# 强制推送
git push origin --force --all
```

---

## 📝 使用自动化脚本

项目中提供了自动化清理脚本：

```bash
# 1. 检查需要清理的文件
bash scripts/check_tracked_files.sh

# 2. 清理Git历史（需要git-filter-repo）
bash scripts/clean_git_history.sh
```

---

## ⚠️ 重要注意事项

### 1. 强制推送的风险

- **影响团队成员**：如果其他人已经clone了仓库，他们需要重新clone
- **破坏历史**：Git历史会被重写，之前基于这些提交的分支可能失效
- **备份重要**：清理前务必备份仓库

### 2. 通知团队成员

如果选择重写历史，需要通知所有团队成员：

```markdown
⚠️ 重要通知：我们将清理Git历史，删除不应提交的文件

请执行以下操作：
1. 备份你的本地更改
2. 删除本地仓库
3. 重新clone仓库：
   git clone <repo-url>
4. 如果有本地分支，需要重新创建
```

### 3. 更新远程分支

清理后，需要强制推送：

```bash
git push origin --force --all
git push origin --force --tags
```

---

## 🎯 推荐方案

### 对于个人项目或小团队

**推荐**：方案1（从索引删除）+ 方案2（清理历史）

```bash
# 步骤1：先从索引删除
git rm --cached -r backend/coverage/ backend/node_modules/ frontend/node_modules/
git rm --cached backend/src/database/*.db 2>/dev/null || true

# 步骤2：提交更改
git add .gitignore
git commit -m "chore: 从Git中删除不应提交的文件"

# 步骤3：清理历史（可选，如果历史中确实有大量文件）
git filter-repo --path-glob "backend/coverage/**" --invert-paths --force
git filter-repo --path-glob "**/node_modules/**" --invert-paths --force

# 步骤4：强制推送
git push origin --force --all
```

### 对于大型团队项目

**推荐**：方案1（从索引删除），**不清理历史**

- 避免影响团队成员
- 未来新提交会遵循 `.gitignore` 规则
- 历史文件虽然存在，但不会继续增长

---

## ✅ 验证清理结果

清理后，验证是否成功：

```bash
# 检查文件是否还在Git中
git ls-files | grep -E "\.(db|sqlite)$"
git ls-files | grep "coverage/"
git ls-files | grep "node_modules/"

# 检查.gitignore是否生效
git check-ignore backend/src/database/mms.db
# 应该输出匹配的规则

# 检查仓库大小（可选）
du -sh .git
```

---

## 📚 参考资料

- [Git Filter Repo文档](https://github.com/newren/git-filter-repo)
- [BFG Repo-Cleaner](https://rtyley.github.io/bfg-repo-cleaner/)
- [Git官方文档 - 重写历史](https://git-scm.com/book/zh/v2/Git-%E5%B7%A5%E5%85%B7-%E9%87%8D%E5%86%99%E5%8E%86%E5%8F%B2)

---

**重要提醒**：清理Git历史是一个不可逆的操作，请务必在清理前做好备份！

