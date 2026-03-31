#!/bin/bash

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

if [ ! -d "node_modules" ]; then
    echo "❌ 请先运行 ./scripts/install.sh 安装依赖"
    exit 1
fi

echo "🚀 正在启动 Swift 类前缀替换工具..."
npm start
