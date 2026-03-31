# 快速打包 DMG 指南

## 🚀 最简单的方法

```bash
cd prefix-replacer

# 确保已安装依赖
npm install

# 运行打包脚本
./build-dmg.sh
```

就这么简单！打包完成后，`.dmg` 文件会在 `dist` 目录中。

## 📦 或者手动打包

```bash
# 方法 1: 使用 npm script
npm run build

# 方法 2: 直接使用 electron-builder
npx electron-builder --mac dmg

# 方法 3: 打包通用版本（支持 Intel 和 Apple Silicon）
npx electron-builder --mac --universal
```

## 📁 生成的文件

打包成功后，在 `dist` 目录会看到：

```
dist/
├── iOS Android Refactor Tool-2.0.0.dmg          # DMG 安装包 ⭐
├── iOS Android Refactor Tool-2.0.0-mac.zip      # ZIP 压缩包
└── mac/
    └── iOS Android Refactor Tool.app            # 应用程序
```

## 🎯 使用 DMG 安装包

1. 双击 `.dmg` 文件打开
2. 将应用拖入 `Applications` 文件夹
3. 从启动台或应用程序文件夹运行

## ⚠️ 首次运行提示

如果 macOS 提示"无法打开，因为它来自身份不明的开发者"：

**方法 1：** 
- 右键点击应用 → 选择"打开"
- 在弹出的对话框中点击"打开"

**方法 2：**
```bash
# 允许运行未签名的应用
sudo spctl --master-disable
```

**方法 3：**
- 系统偏好设置 → 安全性与隐私 → 通用
- 点击"仍要打开"

## 📝 详细文档

查看完整的打包指南：[BUILD_DMG.md](BUILD_DMG.md)

## 🐛 常见问题

### 打包失败？

1. 确保 Node.js 版本 >= 16
2. 删除 `node_modules` 和 `dist`，重新安装：
   ```bash
   rm -rf node_modules dist
   npm install
   npm run build
   ```

### 打包速度慢？

使用国内镜像：
```bash
export ELECTRON_MIRROR=https://npmmirror.com/mirrors/electron/
npm install
npm run build
```

### 需要自定义图标？

查看 [BUILD_DMG.md](BUILD_DMG.md) 中的"创建应用图标"章节。

---

**就这么简单！运行 `./build-dmg.sh` 即可完成打包。**
