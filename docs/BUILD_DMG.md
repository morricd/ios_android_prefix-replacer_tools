# 打包 DMG 安装包指南

## 📦 方法一：使用 electron-builder（推荐）

### 1. 确保已安装依赖

```bash
cd prefix-replacer
npm install
```

### 2. 直接打包

```bash
# 打包为 dmg（仅当前架构）
npm run build

# 或使用 electron-builder 命令
npx electron-builder --mac dmg
```

### 3. 打包为通用版本（支持 Intel 和 Apple Silicon）

```bash
# 同时打包 x64 和 arm64
npx electron-builder --mac --x64 --arm64

# 或者打包为 Universal（通用二进制）
npx electron-builder --mac --universal
```

### 4. 查看生成的文件

打包完成后，在 `dist` 目录中会生成：
- `iOS Android Refactor Tool-2.0.0.dmg` - DMG 安装包
- `iOS Android Refactor Tool-2.0.0-mac.zip` - ZIP 压缩包（如果配置了）

## 📦 方法二：手动配置图标和背景

### 1. 创建应用图标

#### 准备图标文件

你需要一个 1024x1024 的 PNG 图标文件。

#### 转换为 .icns 格式

```bash
# 方法 1: 使用在线工具
# 访问 https://cloudconvert.com/png-to-icns
# 上传你的 PNG 文件，转换为 .icns

# 方法 2: 使用 iconutil（Mac 自带）
# 创建图标集文件夹
mkdir -p assets/icon.iconset

# 创建不同尺寸的图标（需要原始 1024x1024 PNG）
# 使用 sips 命令调整大小
sips -z 16 16     icon-1024.png --out assets/icon.iconset/icon_16x16.png
sips -z 32 32     icon-1024.png --out assets/icon.iconset/icon_16x16@2x.png
sips -z 32 32     icon-1024.png --out assets/icon.iconset/icon_32x32.png
sips -z 64 64     icon-1024.png --out assets/icon.iconset/icon_32x32@2x.png
sips -z 128 128   icon-1024.png --out assets/icon.iconset/icon_128x128.png
sips -z 256 256   icon-1024.png --out assets/icon.iconset/icon_128x128@2x.png
sips -z 256 256   icon-1024.png --out assets/icon.iconset/icon_256x256.png
sips -z 512 512   icon-1024.png --out assets/icon.iconset/icon_256x256@2x.png
sips -z 512 512   icon-1024.png --out assets/icon.iconset/icon_512x512.png
sips -z 1024 1024 icon-1024.png --out assets/icon.iconset/icon_512x512@2x.png

# 生成 .icns 文件
iconutil -c icns assets/icon.iconset -o assets/icon.icns

# 清理临时文件
rm -rf assets/icon.iconset
```

### 2. 创建 DMG 背景图（可选）

创建一个 600x400 的背景图片：

```bash
# 创建 assets 目录
mkdir -p assets

# 将你的背景图片复制到这里
cp your-background.png assets/dmg-background.png
```

### 3. 重新打包

```bash
npm run build
```

## 📦 方法三：不使用图标（快速打包）

如果你暂时不需要自定义图标，可以简化配置：

### 1. 修改 package.json

```json
{
  "build": {
    "appId": "com.refactortool.app",
    "productName": "iOS Android Refactor Tool",
    "mac": {
      "category": "public.app-category.developer-tools",
      "target": ["dmg", "zip"]
    },
    "dmg": {
      "title": "iOS/Android Refactor Tool"
    }
  }
}
```

### 2. 打包

```bash
npm run build
```

## 🚀 快速打包脚本

创建一个快速打包脚本 `build.sh`：

```bash
#!/bin/bash

echo "======================================"
echo "开始打包 macOS 应用"
echo "======================================"

# 清理旧的构建
rm -rf dist/

# 打包
echo "正在打包..."
npm run build

# 检查是否成功
if [ -d "dist" ]; then
    echo ""
    echo "✅ 打包成功！"
    echo ""
    echo "生成的文件："
    ls -lh dist/*.dmg dist/*.zip 2>/dev/null
    echo ""
    echo "======================================"
    echo "安装包位置: $(pwd)/dist"
    echo "======================================"
else
    echo "❌ 打包失败"
    exit 1
fi
```

使用方法：

```bash
chmod +x build.sh
./build.sh
```

## 📋 常见问题

### Q1: 打包时提示找不到图标文件

**解决方法：**

方法 1 - 删除图标配置：
```json
{
  "build": {
    "mac": {
      // 删除或注释掉 icon 配置
      // "icon": "assets/icon.icns"
    }
  }
}
```

方法 2 - 创建简单图标：
```bash
# 使用系统默认图标或创建一个简单的图标
mkdir -p assets
# 然后添加你的图标文件
```

### Q2: 打包速度慢

**原因：** electron-builder 需要下载依赖

**解决方法：**
```bash
# 使用国内镜像
export ELECTRON_MIRROR=https://npmmirror.com/mirrors/electron/
npm run build
```

### Q3: 打包后无法运行

**原因：** 可能是权限问题或签名问题

**解决方法：**
```bash
# 允许运行未签名的应用
# 在"系统偏好设置" -> "安全性与隐私" -> "通用"中允许
# 或使用命令：
sudo spctl --master-disable
```

### Q4: 如何签名和公证应用？

**需要 Apple Developer 账号：**

```json
{
  "build": {
    "mac": {
      "identity": "你的开发者证书名称",
      "hardenedRuntime": true,
      "gatekeeperAssess": false,
      "entitlements": "build/entitlements.mac.plist",
      "entitlementsInherit": "build/entitlements.mac.plist"
    },
    "afterSign": "build/notarize.js"
  }
}
```

## 🎯 推荐的完整流程

### 第一次打包（快速测试）

```bash
# 1. 进入项目
cd prefix-replacer

# 2. 安装依赖
npm install

# 3. 简化配置（删除图标引用）
# 编辑 package.json，注释掉 icon 配置

# 4. 打包
npm run build

# 5. 测试
open dist/*.dmg
```

### 正式发布（带图标）

```bash
# 1. 准备图标（1024x1024 PNG）
# 使用在线工具转换为 .icns

# 2. 创建 assets 目录
mkdir -p assets
cp your-icon.icns assets/icon.icns

# 3. 恢复 package.json 中的图标配置

# 4. 打包
npm run build

# 5. 分发
# dist 目录中的 .dmg 文件就是最终产品
```

## 📊 打包输出说明

成功打包后，`dist` 目录结构：

```
dist/
├── iOS Android Refactor Tool-2.0.0.dmg          # DMG 安装包
├── iOS Android Refactor Tool-2.0.0-mac.zip      # ZIP 压缩包
├── mac/                                          # 临时文件夹
│   └── iOS Android Refactor Tool.app            # 应用程序包
└── builder-effective-config.yaml                # 构建配置
```

**分发文件：**
- `.dmg` - 推荐分发格式，用户双击安装
- `.zip` - 备用格式，直接解压使用

## 🎨 自定义 DMG 外观

### 1. 背景图片

创建 600x400 的 PNG 图片：

```bash
# 使用设计工具创建，或使用命令行
convert -size 600x400 gradient:#667eea-#764ba2 assets/dmg-background.png
```

### 2. 窗口布局

在 `package.json` 中配置：

```json
{
  "dmg": {
    "background": "assets/dmg-background.png",
    "window": {
      "width": 600,
      "height": 400
    },
    "contents": [
      {
        "x": 150,
        "y": 180,
        "type": "file"
      },
      {
        "x": 450,
        "y": 180,
        "type": "link",
        "path": "/Applications"
      }
    ]
  }
}
```

## 💻 命令速查

```bash
# 基本打包
npm run build

# 只打包 DMG
npx electron-builder --mac dmg

# 只打包 ZIP
npx electron-builder --mac zip

# 打包通用版本
npx electron-builder --mac --universal

# 清理后重新打包
rm -rf dist/ && npm run build

# 查看打包日志
npx electron-builder --mac --publish never --config.electronDist=/path/to/electron
```

## 🎉 总结

**最简单的方法：**
```bash
cd prefix-replacer
npm install
npm run build
```

生成的 `.dmg` 文件就在 `dist` 目录中！

如有问题，随时问我！
