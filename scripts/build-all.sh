#!/bin/bash

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

echo "======================================"
echo "iOS/Android Refactor Tool"
echo "跨平台打包脚本"
echo "======================================"
echo ""

# 检查操作系统
OS="$(uname -s)"
case "${OS}" in
    Linux*)     PLATFORM=Linux;;
    Darwin*)    PLATFORM=Mac;;
    CYGWIN*)    PLATFORM=Windows;;
    MINGW*)     PLATFORM=Windows;;
    *)          PLATFORM="UNKNOWN:${OS}"
esac

echo "检测到系统: $PLATFORM"
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

# 选择打包目标
echo "请选择打包目标："
echo "  1) Mac only (DMG)"
echo "  2) Windows only (EXE)"
echo "  3) 同时打包 Mac 和 Windows"
echo ""
read -p "请输入选项 (1-3): " choice

case $choice in
    1)
        echo ""
        echo "⚙️  正在打包 macOS 版本..."
        echo ""
        npm run build:mac
        ;;
    2)
        echo ""
        echo "⚙️  正在打包 Windows 版本..."
        echo ""
        
        if [ "$PLATFORM" = "Mac" ]; then
            echo "💡 在 Mac 上打包 Windows 应用需要安装 wine"
            echo ""
            read -p "是否继续？(y/n) " continue
            if [[ ! $continue =~ ^[Yy]$ ]]; then
                echo "已取消"
                exit 0
            fi
        fi
        
        npm run build:win
        ;;
    3)
        echo ""
        echo "⚙️  正在同时打包 Mac 和 Windows 版本..."
        echo ""
        
        if [ "$PLATFORM" = "Mac" ]; then
            echo "💡 在 Mac 上打包 Windows 应用需要安装 wine"
            echo ""
        fi
        
        npm run build:all
        ;;
    *)
        echo "无效选项"
        exit 1
        ;;
esac

# 检查是否成功
if [ -d "dist" ]; then
    echo ""
    echo "======================================"
    echo "✅ 打包成功！"
    echo "======================================"
    echo ""
    
    # 显示生成的文件
    echo "📦 生成的安装包："
    echo ""
    
    if ls dist/*.dmg 1> /dev/null 2>&1; then
        echo "macOS:"
        ls -lh dist/*.dmg
        echo ""
    fi
    
    if ls dist/*.exe 1> /dev/null 2>&1; then
        echo "Windows:"
        ls -lh dist/*.exe
        echo ""
    fi
    
    if ls dist/*.zip 1> /dev/null 2>&1; then
        echo "其他格式:"
        ls -lh dist/*.zip
        echo ""
    fi
    
    echo "======================================"
    echo "📁 安装包位置: $(pwd)/dist"
    echo "======================================"
    echo ""
    
    # 显示使用说明
    echo "💡 使用说明："
    echo ""
    
    if ls dist/*.dmg 1> /dev/null 2>&1; then
        echo "macOS (.dmg):"
        echo "  1. 双击 .dmg 文件打开"
        echo "  2. 将应用拖入 Applications 文件夹"
        echo "  3. 从启动台或应用程序文件夹运行"
        echo ""
    fi
    
    if ls dist/*.exe 1> /dev/null 2>&1; then
        echo "Windows (.exe):"
        echo "  1. 运行安装程序"
        echo "  2. 按照安装向导完成安装"
        echo "  3. 从桌面快捷方式或开始菜单运行"
        echo ""
    fi
    
    # 询问是否打开 dist 目录
    read -p "是否打开 dist 目录？(y/n) " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        if [ "$PLATFORM" = "Mac" ]; then
            open dist/
        elif [ "$PLATFORM" = "Linux" ]; then
            xdg-open dist/
        fi
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
