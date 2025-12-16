@echo off
setlocal enabledelayedexpansion
chcp 65001 >nul
echo ========================================
echo 物料管理系统 - 依赖安装脚本
echo ========================================
echo.

:: 检查Node.js是否安装
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo [错误] 未检测到Node.js
    echo.
    echo 请先安装Node.js：
    echo 1. 访问 https://nodejs.org/
    echo 2. 下载并安装LTS版本（推荐v18或更高版本）
    echo 3. 安装完成后重新运行此脚本
    echo.
    echo 或者运行 start.bat 脚本，它会尝试自动安装Node.js
    echo.
    pause
    exit /b 1
)

:: 检查npm是否安装
where npm >nul 2>&1
if %errorlevel% neq 0 (
    echo [错误] 未检测到npm，Node.js安装可能不完整
    echo 请重新安装Node.js: https://nodejs.org/
    pause
    exit /b 1
)

:: 显示Node.js和npm版本
for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
for /f "tokens=*" %%i in ('npm --version') do set NPM_VERSION=%%i
echo 检测到Node.js版本: %NODE_VERSION%
echo 检测到npm版本: %NPM_VERSION%
echo.

echo ========================================
echo 开始安装依赖
echo ========================================
echo.

echo [1/2] 安装后端依赖...
echo 包含依赖: express, sqlite3, jsonwebtoken, bcryptjs, cors, dotenv
echo         body-parser, multer, compression, express-rate-limit
echo         express-validator, xlsx
echo.
pushd backend
call npm install
if %errorlevel% neq 0 (
    echo [错误] 后端依赖安装失败
    echo 尝试使用 --legacy-peer-deps 安装...
    call npm install --legacy-peer-deps
    if %errorlevel% neq 0 (
        echo [错误] 后端依赖安装失败，请检查网络连接或npm配置
        popd
        pause
        exit /b 1
    )
)
echo 后端依赖安装完成！
popd
echo.

echo [2/2] 安装前端依赖...
echo 包含依赖: vue, vue-router, pinia, element-plus, axios
echo         echarts, @element-plus/icons-vue, vuedraggable
echo.
pushd frontend
call npm install
if %errorlevel% neq 0 (
    echo [错误] 前端依赖安装失败
    echo 尝试使用 --legacy-peer-deps 安装...
    call npm install --legacy-peer-deps
    if %errorlevel% neq 0 (
        echo [错误] 前端依赖安装失败，请检查网络连接或npm配置
        popd
        pause
        exit /b 1
    )
)
echo 前端依赖安装完成！
popd
echo.

echo ========================================
echo 依赖安装完成！
echo ========================================
echo.
echo 现在可以运行 start.bat 启动系统了
echo.
pause





