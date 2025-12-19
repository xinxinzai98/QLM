# 检查服务运行状态

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "检查服务运行状态" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 检查后端服务（端口3000）
$backendPort = Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue
if ($backendPort) {
    Write-Host "[OK] 后端服务正在运行 (端口3000)" -ForegroundColor Green
    Write-Host "     PID: $($backendPort.OwningProcess)" -ForegroundColor Gray
} else {
    Write-Host "[X] 后端服务未运行 (端口3000)" -ForegroundColor Red
}

Write-Host ""

# 检查前端服务（端口5173）
$frontendPort = Get-NetTCPConnection -LocalPort 5173 -State Listen -ErrorAction SilentlyContinue
if ($frontendPort) {
    Write-Host "[OK] 前端服务正在运行 (端口5173)" -ForegroundColor Green
    Write-Host "     PID: $($frontendPort.OwningProcess)" -ForegroundColor Gray
} else {
    Write-Host "[X] 前端服务未运行 (端口5173)" -ForegroundColor Red
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 提供启动建议
if (-not $backendPort -or -not $frontendPort) {
    Write-Host "建议操作：" -ForegroundColor Yellow
    Write-Host "1. 手动启动后端服务：" -ForegroundColor White
    Write-Host "   cd backend" -ForegroundColor Gray
    Write-Host "   npm start" -ForegroundColor Gray
    Write-Host ""
    Write-Host "2. 手动启动前端服务（新开一个终端）：" -ForegroundColor White
    Write-Host "   cd frontend" -ForegroundColor Gray
    Write-Host "   npm run dev" -ForegroundColor Gray
    Write-Host ""
    Write-Host "3. 或重新运行启动脚本：" -ForegroundColor White
    Write-Host "   .\start.bat" -ForegroundColor Gray
    Write-Host "   或" -ForegroundColor Gray
    Write-Host "   .\start.ps1" -ForegroundColor Gray
}

