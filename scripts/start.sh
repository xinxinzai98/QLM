#!/bin/bash

echo "========================================"
echo "物料管理系统 - 一键启动脚本"
echo "========================================"
echo ""

# 检查Node.js版本并尝试使用NVM切换
REQUIRED_NODE_VERSION=16
NODE_VERSION_STR=$(node --version)
NODE_MAJOR_VERSION=$(echo $NODE_VERSION_STR | cut -d'v' -f2 | cut -d'.' -f1)

echo "检测到 Node.js 版本: $NODE_VERSION_STR"

if [ "$NODE_MAJOR_VERSION" -lt "$REQUIRED_NODE_VERSION" ]; then
    echo "[警告] Node.js 版本过低 ($NODE_VERSION_STR < v$REQUIRED_NODE_VERSION)"
    
    # 尝试加载 NVM
    export NVM_DIR="$HOME/.nvm"
    [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
    
    if command -v nvm &> /dev/null; then
        echo "检测到 NVM，尝试切换到 Node.js 18..."
        nvm install 18
        nvm use 18
        # 更新版本变量
        NODE_VERSION_STR=$(node --version)
        echo "已切换到: $NODE_VERSION_STR"
    else
        echo "[错误] 未检测到 NVM 且当前 Node 版本过低。"
        echo "请执行以下命令升级环境："
        echo "  curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.5/install.sh | bash"
        echo "  source ~/.zshrc"
        echo "  nvm install 18"
        echo ""
        echo "或者尝试强行运行（可能会失败）："
        echo "  export FORCE_INSTALL=true"
        echo ""
        
        if [ "$FORCE_INSTALL" != "true" ]; then
            exit 1
        else
            echo "[警告] 正在强行继续..."
        fi
    fi
fi
echo ""

# 清除端口3000（后端）
echo "[清理] 检查并清理端口3000（后端）..."
PIDS_3000=$(lsof -ti:3000 2>/dev/null)
if [ -n "$PIDS_3000" ]; then
    for PID in $PIDS_3000; do
        echo "发现端口3000被进程 $PID 占用，正在结束..."
        kill -9 $PID 2>/dev/null
        if [ $? -eq 0 ]; then
            echo "已成功结束占用端口3000的进程 $PID"
        else
            echo "警告: 无法结束进程 $PID，可能需要sudo权限"
            echo "请手动执行: sudo kill -9 $PID"
        fi
    done
    sleep 1
else
    echo "端口3000未被占用"
fi

# 清除端口5173（前端）
echo "[清理] 检查并清理端口5173（前端）..."
PIDS_5173=$(lsof -ti:5173 2>/dev/null)
if [ -n "$PIDS_5173" ]; then
    for PID in $PIDS_5173; do
        echo "发现端口5173被进程 $PID 占用，正在结束..."
        kill -9 $PID 2>/dev/null
        if [ $? -eq 0 ]; then
            echo "已成功结束占用端口5173的进程 $PID"
        else
            echo "警告: 无法结束进程 $PID，可能需要sudo权限"
            echo "请手动执行: sudo kill -9 $PID"
        fi
    done
    sleep 1
else
    echo "端口5173未被占用"
fi
echo ""

echo "[1/4] 检查后端依赖..."
cd backend
if [ ! -d "node_modules" ]; then
    echo "正在安装后端依赖，请稍候..."
    echo "包含P1优化新增依赖: compression, express-rate-limit, express-validator"
    echo "包含P2新增依赖: xlsx"
    npm install
    if [ $? -ne 0 ]; then
        echo "[错误] 后端依赖安装失败"
        cd ..
        exit 1
    fi
    echo "后端依赖安装完成"
else
    echo "检查依赖完整性（包括P1优化新增依赖）..."
    npm install > /dev/null 2>&1
    if [ $? -ne 0 ]; then
        echo "[警告] 依赖检查失败，尝试重新安装..."
        npm install --force > /dev/null 2>&1
        if [ $? -ne 0 ]; then
            echo "[错误] 后端依赖安装失败"
            cd ..
            exit 1
        fi
    fi
    echo "后端依赖检查完成"
    echo "提示: 如看到安全漏洞警告，可运行 npm audit fix 修复（不影响使用）"
fi
cd ..

echo "[2/4] 检查前端依赖..."
cd frontend
if [ ! -d "node_modules" ]; then
    echo "正在安装前端依赖，请稍候..."
    echo "包含P2新增依赖: vuedraggable"
    npm install
    if [ $? -ne 0 ]; then
        echo "[错误] 前端依赖安装失败"
        cd ..
        exit 1
    fi
else
    echo "检查依赖完整性（包括P2新增依赖）..."
    npm install > /dev/null 2>&1
    if [ $? -ne 0 ]; then
        echo "[警告] 依赖检查失败，尝试重新安装..."
        npm install --force > /dev/null 2>&1
        if [ $? -ne 0 ]; then
            echo "[错误] 前端依赖安装失败"
            cd ..
            exit 1
        fi
    fi
    echo "前端依赖检查完成"
    echo "提示: 如看到安全漏洞警告，可运行 npm audit fix 修复（不影响使用）"
fi
cd ..

echo "[3/4] 检查环境变量配置..."
cd backend
if [ ! -f ".env" ]; then
    echo "[提示] .env文件不存在，正在生成..."
    node generate-jwt-secret.js
    if [ $? -ne 0 ]; then
        echo "[警告] 无法自动生成.env文件"
        echo "请手动创建backend/.env文件并设置JWT_SECRET"
        echo "参考: backend/.env.example"
    fi
fi
cd ..

echo "[4/4] 启动后端服务..."
cd backend
npm start > ../backend.log 2>&1 &
BACKEND_PID=$!
cd ..
echo "后端服务已启动 (PID: $BACKEND_PID)"

# 等待后端启动
sleep 3

echo "[5/5] 启动前端服务..."
cd frontend
npm run dev > ../frontend.log 2>&1 &
FRONTEND_PID=$!
cd ..
echo "前端服务已启动 (PID: $FRONTEND_PID)"

# 等待前端启动
sleep 5

echo ""
echo "========================================"
echo "启动完成！"
echo "========================================"
echo "后端服务: http://localhost:3000"
echo "前端服务: http://localhost:5173"
echo ""
echo "后端进程ID: $BACKEND_PID"
echo "前端进程ID: $FRONTEND_PID"
echo ""

# 尝试打开浏览器
if command -v open &> /dev/null; then
    # macOS
    open http://localhost:5173
elif command -v xdg-open &> /dev/null; then
    # Linux
    xdg-open http://localhost:5173
fi

echo "提示："
echo "- 要停止服务，请执行: kill $BACKEND_PID $FRONTEND_PID"
echo "- 或使用 Ctrl+C 停止当前进程"
echo "- 默认管理员账户: admin / admin123"
echo ""
echo "日志文件:"
echo "- 后端日志: backend.log"
echo "- 前端日志: frontend.log"
echo ""

# 等待用户中断
trap "echo ''; echo '正在停止服务...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" INT TERM

wait

