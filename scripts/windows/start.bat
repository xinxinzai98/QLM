@echo off
setlocal enabledelayedexpansion
chcp 65001 >nul
echo ========================================
echo 物料管理系统 - 一键启动脚本
echo ========================================
echo.

:: 切换到项目根目录（脚本在scripts/windows目录下，需要向上两级）
cd /d %~dp0..\..

:: 检查Node.js是否安装
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo [警告] 未检测到Node.js
    echo.
    echo 正在尝试自动安装Node.js...
    echo 如果自动安装失败，请手动下载安装：
    echo 下载地址: https://nodejs.org/
    echo.
    
    :: 尝试使用chocolatey安装（如果存在）
    where choco >nul 2>&1
    if %errorlevel% equ 0 (
        echo 检测到Chocolatey，正在安装Node.js...
        choco install nodejs -y
        if %errorlevel% neq 0 (
            echo [错误] Chocolatey安装失败，请手动安装Node.js
            pause
            exit /b 1
        )
    ) else (
        :: 尝试使用winget安装（Windows 10/11）
        where winget >nul 2>&1
        if %errorlevel% equ 0 (
            echo 检测到winget，正在安装Node.js...
            winget install OpenJS.NodeJS
            if %errorlevel% neq 0 (
                echo [错误] winget安装失败，请手动安装Node.js
                echo 下载地址: https://nodejs.org/
                pause
                exit /b 1
            )
        ) else (
            echo [错误] 未找到包管理器，请手动安装Node.js
            echo 下载地址: https://nodejs.org/
            start https://nodejs.org/
            pause
            exit /b 1
        )
    )
    echo Node.js安装完成，请重新运行此脚本
    pause
    exit /b 0
)

:: 检查npm是否安装
where npm >nul 2>&1
if %errorlevel% neq 0 (
    echo [错误] 未检测到npm，Node.js安装可能不完整
    echo 请重新安装Node.js: https://nodejs.org/
    pause
    exit /b 1
)

:: 检查Node.js版本
for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
echo 检测到Node.js版本: %NODE_VERSION%

:: 清除端口3000（后端）
echo.
echo [清理] 检查并清理端口3000（后端）...
set PORT_3000_FOUND=0
for /f "tokens=5" %%a in ('netstat -ano 2^>nul ^| findstr :3000 ^| findstr LISTENING') do (
    set PORT_3000_FOUND=1
    echo 发现端口3000被进程 %%a 占用，正在结束...
    taskkill /F /PID %%a >nul 2>&1
    if !errorlevel! equ 0 (
        echo 已成功结束占用端口3000的进程
    ) else (
        echo 警告: 无法结束进程 %%a，可能需要管理员权限
        echo 请以管理员身份运行此脚本，或手动结束该进程
    )
)
if %PORT_3000_FOUND% equ 0 (
    echo 端口3000未被占用
)

:: 清除端口5173（前端）
echo [清理] 检查并清理端口5173（前端）...
set PORT_5173_FOUND=0
for /f "tokens=5" %%a in ('netstat -ano 2^>nul ^| findstr :5173 ^| findstr LISTENING') do (
    set PORT_5173_FOUND=1
    echo 发现端口5173被进程 %%a 占用，正在结束...
    taskkill /F /PID %%a >nul 2>&1
    if !errorlevel! equ 0 (
        echo 已成功结束占用端口5173的进程
    ) else (
        echo 警告: 无法结束进程 %%a，可能需要管理员权限
        echo 请以管理员身份运行此脚本，或手动结束该进程
    )
)
if %PORT_5173_FOUND% equ 0 (
    echo 端口5173未被占用
)
timeout /t 1 /nobreak >nul
echo.

echo [1/4] 检查后端依赖...
pushd backend
if not exist node_modules (
    echo 正在安装后端依赖，请稍候...
    echo 包含P1优化新增依赖: compression, express-rate-limit, express-validator, xlsx
    call npm install
    if %errorlevel% neq 0 (
        echo [错误] 后端依赖安装失败
        popd
        pause
        exit /b 1
    )
    echo 后端依赖安装完成
) else (
    echo 检查依赖完整性（包括P1优化新增依赖）...
    call npm install >nul 2>&1
    if %errorlevel% neq 0 (
        echo [警告] 依赖检查失败，尝试重新安装...
        call npm install --force >nul 2>&1
        if %errorlevel% neq 0 (
            echo [错误] 后端依赖安装失败
            popd
            pause
            exit /b 1
        )
    )
    echo 后端依赖检查完成
    echo 提示: 如看到安全漏洞警告，可运行 npm audit fix 修复（不影响使用）
)
popd

echo [2/4] 检查前端依赖...
pushd frontend
if not exist node_modules (
    echo 正在安装前端依赖，请稍候...
    echo 包含P2新增依赖: vuedraggable
    call npm install
    if %errorlevel% neq 0 (
        echo [错误] 前端依赖安装失败
        popd
        pause
        exit /b 1
    )
) else (
    echo 检查依赖完整性（包括P2新增依赖）...
    call npm install >nul 2>&1
    if %errorlevel% neq 0 (
        echo [警告] 依赖检查失败，尝试重新安装...
        call npm install --force >nul 2>&1
        if %errorlevel% neq 0 (
            echo [错误] 前端依赖安装失败
            popd
            pause
            exit /b 1
        )
    )
    echo 前端依赖检查完成
    echo 提示: 如看到安全漏洞警告，可运行 npm audit fix 修复（不影响使用）
)
popd

echo [3/4] 检查环境变量配置...
pushd backend
if not exist .env (
    echo [提示] .env文件不存在，正在生成...
    if exist scripts\generate-jwt-secret.js (
        call node scripts\generate-jwt-secret.js
        if %errorlevel% neq 0 (
            echo [警告] 无法自动生成.env文件
            echo 请手动创建backend/.env文件并设置JWT_SECRET
        )
    ) else (
        echo [警告] 未找到生成脚本，请手动创建backend/.env文件并设置JWT_SECRET
    )
)
popd

echo [4/4] 启动后端服务...
cd /d %~dp0..
start "MMS后端服务" cmd /k "cd /d %~dp0backend && npm start"
timeout /t 3 /nobreak >nul

echo [5/5] 启动前端服务...
cd /d %~dp0..
start "MMS前端服务" cmd /k "cd /d %~dp0frontend && npm run dev"
timeout /t 5 /nobreak >nul

echo.
echo ========================================
echo 启动完成！
echo ========================================
echo 后端服务: http://localhost:3000
echo 前端服务: http://localhost:5173
echo.
echo 正在打开浏览器...
timeout /t 2 /nobreak >nul
start http://localhost:5173
echo.
echo 提示：
echo - 关闭此窗口不会停止服务
echo - 要停止服务，请关闭对应的命令行窗口
echo - 默认管理员账户: admin / admin123
echo.
pause

