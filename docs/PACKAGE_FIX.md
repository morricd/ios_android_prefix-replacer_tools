# macOS 打包错误修复说明

## 问题描述

```
Uncaught Exception: Error: Cannot find module 'fs-extra'
```

## 原因

electron-builder 打包时，虽然 `fs-extra` 在 dependencies 中，但由于 asar 打包机制，导致模块无法正确加载。

## 解决方案

已在 package.json 中添加以下配置：

```json
{
  "build": {
    "asar": true,
    "asarUnpack": [
      "node_modules/fs-extra/**/*"
    ],
    "files": [
      "main.js",
      "renderer.js",
      "index.html",
      "styles.css",
      "ios-processor.js",
      "android-processor.js",
      "fix-xcode-project.js",
      "package.json",
      "!node_modules",
      "node_modules/fs-extra/**/*"
    ]
  }
}
```

### 关键配置说明

1. **asar: true** - 启用 asar 打包
2. **asarUnpack** - 将 fs-extra 从 asar 中解包出来
3. **files** - 明确指定要包含的文件和模块

## 重新打包

### 清理并重新安装依赖

```bash
cd prefix-replacer

# 1. 清理
rm -rf node_modules
rm -rf dist
rm package-lock.json

# 2. 重新安装
npm install

# 3. 打包 macOS
npm run build:mac

# 或打包所有平台
npm run build:all
```

### 验证打包结果

```bash
# 查看生成的文件
ls -la dist/

# macOS 应该生成：
# - iOS Android Refactor Tool-2.4.1.dmg
# - iOS Android Refactor Tool-2.4.1-arm64.dmg
# - iOS Android Refactor Tool-2.4.1-x64.dmg
# - iOS Android Refactor Tool-2.4.1-mac.zip
```

## 测试

安装 dmg 后，打开应用：

```bash
# 方法 1: 从 Applications 打开
open "/Applications/iOS Android Refactor Tool.app"

# 方法 2: 查看日志
# 如果仍有错误，查看控制台日志
# Applications → Utilities → Console.app
# 搜索 "iOS Android Refactor Tool"
```

## 可能的其他问题

### 问题 1: 权限问题

**症状:** 应用无法访问文件系统

**解决:**
```
系统偏好设置 → 安全性与隐私 → 隐私 → 文件和文件夹
允许 "iOS Android Refactor Tool" 访问所需目录
```

### 问题 2: 代码签名

**症状:** "应用已损坏"

**解决:**
```bash
# 移除隔离属性
xattr -cr "/Applications/iOS Android Refactor Tool.app"
```

### 问题 3: M1/M2 Mac 兼容性

**症状:** 在 Apple Silicon 上无法运行

**解决:** 确保使用了 universal 或 arm64 版本的 dmg

## 开发者打包说明

如果你是从源码打包：

```bash
# 1. 克隆或解压源码
cd prefix-replacer

# 2. 安装依赖（重要！）
npm install

# 3. 验证依赖已安装
ls -la node_modules/fs-extra
# 应该看到 fs-extra 目录

# 4. 打包
npm run build:mac

# 5. 测试打包的应用
open "dist/mac/iOS Android Refactor Tool.app"
```

## 验证修复

打包完成后，验证 fs-extra 是否正确包含：

```bash
# 查看 asar 内容
npx asar list "dist/mac/iOS Android Refactor Tool.app/Contents/Resources/app.asar" | grep fs-extra

# 或者检查解包目录
ls -la "dist/mac/iOS Android Refactor Tool.app/Contents/Resources/app.asar.unpacked/node_modules/"
# 应该看到 fs-extra 目录
```

## 总结

修复后的配置确保：

1. ✅ fs-extra 正确包含在打包中
2. ✅ 通过 asarUnpack 解包以确保可访问
3. ✅ files 配置明确指定所需文件
4. ✅ 兼容 Intel 和 Apple Silicon Mac

重新打包后应该不会再出现 "Cannot find module" 错误。
