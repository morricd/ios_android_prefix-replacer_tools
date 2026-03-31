#!/bin/bash

echo "======================================"
echo "Swift 类前缀替换工具 - 安装向导"
echo "======================================"
echo ""

# 检查 Node.js
if ! command -v node &> /dev/null; then
    echo "❌ 未检测到 Node.js"
    echo "请先安装 Node.js: https://nodejs.org/"
    exit 1
fi

echo "✅ Node.js 版本: $(node -v)"
echo ""

# 进入项目根目录
ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

# 安装依赖
echo "📦 正在安装依赖..."
npm install

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ 安装完成！"
    echo ""
    echo "======================================"
    echo "启动应用："
    echo "======================================"
    echo ""
    echo "方法 1: 运行命令"
    echo "  npm start"
    echo ""
    echo "方法 2: 运行此脚本"
    echo "  ./scripts/start.sh"
    echo ""
    echo "======================================"
    echo "打包应用："
    echo "======================================"
    echo ""
    echo "  npm run build"
    echo ""
    echo "打包后的应用在 dist 目录中"
    echo ""
else
    echo "❌ 安装失败，请检查错误信息"
    exit 1
fi
