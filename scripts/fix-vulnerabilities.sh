#!/bin/bash

echo "========================================"
echo "安全漏洞修复脚本"
echo "========================================"
echo ""

# 检查Node.js是否安装
if ! command -v node &> /dev/null; then
    echo "[错误] 未检测到Node.js"
    echo "请先安装Node.js: https://nodejs.org/"
    exit 1
fi

echo "[1/2] 检查并修复后端安全漏洞..."
cd backend
echo ""
echo "当前漏洞情况:"
npm audit --audit-level=moderate
echo ""
echo "正在尝试自动修复..."
npm audit fix
if [ $? -ne 0 ]; then
    echo "[警告] 自动修复失败，某些漏洞可能需要手动处理"
    echo "运行 npm audit 查看详细信息"
fi
cd ..

echo ""
echo "[2/2] 检查并修复前端安全漏洞..."
cd frontend
echo ""
echo "当前漏洞情况:"
npm audit --audit-level=moderate
echo ""
echo "正在尝试自动修复..."
npm audit fix
if [ $? -ne 0 ]; then
    echo "[警告] 自动修复失败，某些漏洞可能需要手动处理"
    echo "运行 npm audit 查看详细信息"
fi
cd ..

echo ""
echo "========================================"
echo "安全漏洞修复完成！"
echo "========================================"
echo ""
echo "提示："
echo "- 如果仍有漏洞，可能需要手动更新依赖版本"
echo "- 运行 npm audit 查看详细漏洞信息"
echo "- 查看 docs/development/SECURITY_AUDIT.md 了解更多"
echo ""





