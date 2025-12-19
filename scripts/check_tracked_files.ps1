# ============================================
# 检查Git中跟踪的文件（PowerShell版本）
# 找出不应该被提交的文件
# ============================================

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "检查Git中跟踪的文件" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

$hasIssues = $false

# 检查数据库文件
Write-Host "检查数据库文件..." -ForegroundColor Blue
$dbFiles = git ls-files | Select-String -Pattern "\.(db|sqlite|sqlite3)$"
if ($dbFiles) {
    $hasIssues = $true
    Write-Host "发现数据库文件在Git中：" -ForegroundColor Yellow
    $dbFiles | ForEach-Object {
        Write-Host "  [X] $_" -ForegroundColor Red
    }
} else {
    Write-Host "  OK 没有数据库文件" -ForegroundColor Green
}
Write-Host ""

# 检查coverage目录
Write-Host "检查测试覆盖率报告..." -ForegroundColor Blue
$coverageFiles = git ls-files | Select-String -Pattern "coverage/"
if ($coverageFiles) {
    $hasIssues = $true
    Write-Host "发现coverage文件在Git中：" -ForegroundColor Yellow
    $coverageFiles | Select-Object -First 10 | ForEach-Object {
        Write-Host "  [X] $_" -ForegroundColor Red
    }
    if ($coverageFiles.Count -gt 10) {
        Write-Host "  ... (还有 $($coverageFiles.Count - 10) 个文件)" -ForegroundColor Yellow
    }
} else {
    Write-Host "  OK 没有coverage文件" -ForegroundColor Green
}
Write-Host ""

# 检查node_modules
Write-Host "检查node_modules目录..." -ForegroundColor Blue
$nodeModules = git ls-files | Select-String -Pattern "node_modules/"
if ($nodeModules) {
    $hasIssues = $true
    Write-Host "发现node_modules文件在Git中：" -ForegroundColor Yellow
    $nodeModules | Select-Object -First 10 | ForEach-Object {
        Write-Host "  [X] $_" -ForegroundColor Red
    }
    if ($nodeModules.Count -gt 10) {
        Write-Host "  ... (还有 $($nodeModules.Count - 10) 个文件)" -ForegroundColor Yellow
    }
} else {
    Write-Host "  OK 没有node_modules文件" -ForegroundColor Green
}
Write-Host ""

# 检查日志文件
Write-Host "检查日志文件..." -ForegroundColor Blue
$logFiles = git ls-files | Select-String -Pattern "\.log$"
if ($logFiles) {
    $hasIssues = $true
    Write-Host "发现日志文件在Git中：" -ForegroundColor Yellow
    $logFiles | ForEach-Object {
        Write-Host "  [X] $_" -ForegroundColor Red
    }
} else {
    Write-Host "  OK 没有日志文件" -ForegroundColor Green
}
Write-Host ""

# 检查环境变量文件
Write-Host "检查环境变量文件..." -ForegroundColor Blue
$envFiles = git ls-files | Select-String -Pattern "\.env$|\.env\." | Where-Object { $_ -notmatch "\.env\.example" }
if ($envFiles) {
    $hasIssues = $true
    Write-Host "发现环境变量文件在Git中（.env.example除外）：" -ForegroundColor Yellow
    $envFiles | ForEach-Object {
        Write-Host "  [X] $_" -ForegroundColor Red
    }
} else {
    Write-Host "  OK 没有环境变量文件（.env.example可以提交）" -ForegroundColor Green
}
Write-Host ""

# 检查dist目录
Write-Host "检查构建输出目录..." -ForegroundColor Blue
$distFiles = git ls-files | Select-String -Pattern "dist/"
if ($distFiles) {
    $hasIssues = $true
    Write-Host "发现dist文件在Git中：" -ForegroundColor Yellow
    $distFiles | Select-Object -First 10 | ForEach-Object {
        Write-Host "  [X] $_" -ForegroundColor Red
    }
    if ($distFiles.Count -gt 10) {
        Write-Host "  ... (还有 $($distFiles.Count - 10) 个文件)" -ForegroundColor Yellow
    }
} else {
    Write-Host "  OK 没有dist文件" -ForegroundColor Green
}
Write-Host ""

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "检查完成" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

if ($hasIssues) {
    Write-Host "[!] 发现问题文件！" -ForegroundColor Red
    Write-Host ""
    Write-Host "建议操作：" -ForegroundColor Yellow
    Write-Host "1. 从Git索引中删除（保留本地文件）：" -ForegroundColor White
    Write-Host "   git rm --cached <文件路径>" -ForegroundColor Gray
    Write-Host ""
    Write-Host "2. 查看详细清理指南：" -ForegroundColor White
    Write-Host "   docs/GIT_CLEANUP_QUICK_START.md" -ForegroundColor Gray
    Write-Host "   docs/GIT_HISTORY_CLEANUP_GUIDE.md" -ForegroundColor Gray
} else {
    Write-Host "OK 没有发现问题文件！" -ForegroundColor Green
}

