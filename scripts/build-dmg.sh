#!/bin/bash

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

echo "======================================"
echo "iOS/Android 重构工具 - 打包脚本"
echo "======================================"
echo ""

# 检查是否安装了依赖
if [ ! -d "node_modules" ]; then
    echo "📦 正在安装依赖..."
    npm install
    echo ""
fi

# 清理旧的构建
echo "🧹 清理旧的构建文件..."
rm -rf dist/
echo ""

# 打包
echo "⚙️  开始打包 macOS 应用..."
echo ""

npm run build

# 检查是否成功
if [ -d "dist" ]; then
    echo ""
    echo "======================================"
    echo "✅ 打包成功！"
    echo "======================================"
    echo ""
    
    # 显示生成的文件
    if ls dist/*.dmg 1> /dev/null 2>&1; then
        echo "📦 DMG 安装包："
        ls -lh dist/*.dmg
    fi
    
    if ls dist/*.zip 1> /dev/null 2>&1; then
        echo ""
        echo "📦 ZIP 压缩包："
        ls -lh dist/*.zip
    fi
    
    echo ""
    echo "======================================"
    echo "📁 安装包位置: $(pwd)/dist"
    echo "======================================"
    echo ""
    echo "💡 使用方法："
    echo "   1. 双击 .dmg 文件打开"
    echo "   2. 将应用拖入 Applications 文件夹"
    echo "   3. 从启动台或应用程序文件夹运行"
    echo ""
    
    # 询问是否打开 dist 目录
    read -p "是否打开 dist 目录？(y/n) " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        open dist/
    fi
    
else
    echo ""
    echo "======================================"
    echo "❌ 打包失败"
    echo "======================================"
    echo ""
    echo "请检查错误信息并修复后重试"
    exit 1
fi
