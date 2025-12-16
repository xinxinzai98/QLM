# 物料管理系统 - PowerShell一键启动脚本
# 编码: UTF-8

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "物料管理系统 - 一键启动脚本" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 检查Node.js是否安装
$nodeVersion = Get-Command node -ErrorAction SilentlyContinue
if (-not $nodeVersion) {
    Write-Host "[警告] 未检测到Node.js" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "正在尝试自动安装Node.js..." -ForegroundColor Yellow
    Write-Host "如果自动安装失败，请手动下载安装：" -ForegroundColor Yellow
    Write-Host "下载地址: https://nodejs.org/" -ForegroundColor Yellow
    Write-Host ""
    
    # 尝试使用chocolatey安装
    $choco = Get-Command choco -ErrorAction SilentlyContinue
    if ($choco) {
        Write-Host "检测到Chocolatey，正在安装Node.js..." -ForegroundColor Green
        choco install nodejs -y
        if ($LASTEXITCODE -ne 0) {
            Write-Host "[错误] Chocolatey安装失败，请手动安装Node.js" -ForegroundColor Red
            Write-Host "下载地址: https://nodejs.org/" -ForegroundColor Yellow
            Read-Host "按Enter键退出"
            exit 1
        }
    } else {
        # 尝试使用winget安装
        $winget = Get-Command winget -ErrorAction SilentlyContinue
        if ($winget) {
            Write-Host "检测到winget，正在安装Node.js..." -ForegroundColor Green
            winget install OpenJS.NodeJS
            if ($LASTEXITCODE -ne 0) {
                Write-Host "[错误] winget安装失败，请手动安装Node.js" -ForegroundColor Red
                Write-Host "下载地址: https://nodejs.org/" -ForegroundColor Yellow
                Start-Process "https://nodejs.org/"
                Read-Host "按Enter键退出"
                exit 1
            }
        } else {
            Write-Host "[错误] 未找到包管理器，请手动安装Node.js" -ForegroundColor Red
            Write-Host "下载地址: https://nodejs.org/" -ForegroundColor Yellow
            Start-Process "https://nodejs.org/"
            Read-Host "按Enter键退出"
            exit 1
        }
    }
    Write-Host "Node.js安装完成，请重新运行此脚本" -ForegroundColor Green
    Read-Host "按Enter键退出"
    exit 0
}

# 检查npm是否安装
$npmVersion = Get-Command npm -ErrorAction SilentlyContinue
if (-not $npmVersion) {
    Write-Host "[错误] 未检测到npm，Node.js安装可能不完整" -ForegroundColor Red
    Write-Host "请重新安装Node.js: https://nodejs.org/" -ForegroundColor Yellow
    Read-Host "按Enter键退出"
    exit 1
}

# 显示Node.js版本
$nodeVer = node --version
Write-Host "检测到Node.js版本: $nodeVer" -ForegroundColor Green
Write-Host ""

# 清理端口函数
function Clear-Port {
    param([int]$Port)
    
    Write-Host "[清理] 检查并清理端口$Port..." -ForegroundColor Yellow
    
    $connections = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue
    if ($connections) {
        foreach ($conn in $connections) {
            $pid = $conn.OwningProcess
            Write-Host "发现端口$Port被进程 $pid 占用，正在结束..." -ForegroundColor Yellow
            try {
                Stop-Process -Id $pid -Force -ErrorAction Stop
                Write-Host "已成功结束占用端口$Port的进程" -ForegroundColor Green
            } catch {
                Write-Host "警告: 无法结束进程 $pid，可能需要管理员权限" -ForegroundColor Yellow
                Write-Host "请以管理员身份运行此脚本，或手动结束该进程" -ForegroundColor Yellow
            }
        }
    } else {
        Write-Host "端口$Port未被占用" -ForegroundColor Green
    }
}

# 清除端口3000（后端）和5173（前端）
Clear-Port -Port 3000
Clear-Port -Port 5173
Start-Sleep -Seconds 1
Write-Host ""

# 检查后端依赖
Write-Host "[1/4] 检查后端依赖..." -ForegroundColor Cyan
Push-Location backend
if (-not (Test-Path "node_modules")) {
    Write-Host "正在安装后端依赖，请稍候..." -ForegroundColor Yellow
    Write-Host "包含P1优化新增依赖: compression, express-rate-limit, express-validator" -ForegroundColor Gray
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[错误] 后端依赖安装失败" -ForegroundColor Red
        Pop-Location
        Read-Host "按Enter键退出"
        exit 1
    }
    Write-Host "后端依赖安装完成" -ForegroundColor Green
} else {
    Write-Host "检查依赖完整性（包括P1优化新增依赖）..." -ForegroundColor Yellow
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[警告] 依赖检查失败，尝试重新安装..." -ForegroundColor Yellow
        npm install --force
        if ($LASTEXITCODE -ne 0) {
            Write-Host "[错误] 后端依赖安装失败" -ForegroundColor Red
            Pop-Location
            Read-Host "按Enter键退出"
            exit 1
        }
    }
    Write-Host "后端依赖检查完成" -ForegroundColor Green
}
Pop-Location

# 检查前端依赖
Write-Host "[2/4] 检查前端依赖..." -ForegroundColor Cyan
Push-Location frontend
if (-not (Test-Path "node_modules")) {
    Write-Host "正在安装前端依赖，请稍候..." -ForegroundColor Yellow
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[错误] 前端依赖安装失败" -ForegroundColor Red
        Pop-Location
        Read-Host "按Enter键退出"
        exit 1
    }
} else {
    Write-Host "检查依赖完整性..." -ForegroundColor Yellow
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[警告] 依赖检查失败，尝试重新安装..." -ForegroundColor Yellow
        npm install --force
        if ($LASTEXITCODE -ne 0) {
            Write-Host "[错误] 前端依赖安装失败" -ForegroundColor Red
            Pop-Location
            Read-Host "按Enter键退出"
            exit 1
        }
    }
    Write-Host "前端依赖检查完成" -ForegroundColor Green
}
Pop-Location

# 启动后端服务
Write-Host "[3/4] 启动后端服务..." -ForegroundColor Cyan
$backendPath = Join-Path $PSScriptRoot "backend"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$backendPath'; npm start" -WindowStyle Normal
Start-Sleep -Seconds 3

# 启动前端服务
Write-Host "[4/4] 启动前端服务..." -ForegroundColor Cyan
$frontendPath = Join-Path $PSScriptRoot "frontend"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$frontendPath'; npm run dev" -WindowStyle Normal
Start-Sleep -Seconds 5

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "启动完成！" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host "后端服务: http://localhost:3000" -ForegroundColor Cyan
Write-Host "前端服务: http://localhost:5173" -ForegroundColor Cyan
Write-Host ""
Write-Host "正在打开浏览器..." -ForegroundColor Yellow
Start-Sleep -Seconds 2
Start-Process "http://localhost:5173"
Write-Host ""
Write-Host "提示：" -ForegroundColor Yellow
Write-Host "- 关闭此窗口不会停止服务" -ForegroundColor Gray
Write-Host "- 要停止服务，请关闭对应的PowerShell窗口" -ForegroundColor Gray
Write-Host "- 默认管理员账户: admin / admin123" -ForegroundColor Gray
Write-Host ""
Read-Host "按Enter键退出"

