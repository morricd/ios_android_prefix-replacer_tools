# 安装问题修复指南

## ❌ 错误：Cannot find module 'fs-extra'

这是因为打包时缺少了依赖模块。

## ✅ 解决方法

### 方法 1：从源码运行（推荐）⭐

不使用打包的应用，直接从源码运行：

```bash
# 1. 解压源码包
unzip ios-android-refactor-v2.4.1-complete.zip
cd prefix-replacer

# 2. 安装依赖
npm install

# 3. 运行应用
npm start
```

这样可以避免打包问题，而且更新代码也更方便。

### 方法 2：重新打包

如果你一定要使用打包的应用：

```bash
# 1. 解压源码
unzip ios-android-refactor-v2.4.1-complete.zip
cd prefix-replacer

# 2. 清理并重新安装依赖
rm -rf node_modules package-lock.json
npm install

# 3. 重新打包
npm run build:mac

# 4. 查找生成的应用
open dist/
```

生成的 .dmg 或 .app 就不会有这个问题了。

### 方法 3：手动安装依赖（如果方法1失败）

```bash
cd prefix-replacer

# 确保 package.json 中有 fs-extra
cat package.json | grep fs-extra

# 如果没有，手动添加
npm install --save fs-extra

# 然后运行
npm start
```

## 🔍 为什么会出现这个问题？

打包工具（electron-builder）有时会遗漏某些依赖，特别是：
- 动态引入的模块
- 新添加的依赖

## 📝 最佳实践

**开发时：**
```bash
npm start  # 直接运行，方便调试
```

**打包前：**
```bash
# 1. 清理
rm -rf node_modules package-lock.json dist

# 2. 重新安装
npm install

# 3. 测试运行
npm start

# 4. 确认无误后打包
npm run build:mac
```

## 🚀 快速开始（推荐方式）

不想处理打包问题？直接从源码运行：

```bash
# 克隆或解压项目
cd prefix-replacer

# 一键安装并运行
npm install && npm start
```

这样每次都能确保依赖正确！

## ⚠️ 注意

如果使用 `npm start` 运行，不需要打包成应用。
打包主要是为了分发给没有 Node.js 环境的用户。

## 📦 完整的打包步骤

```bash
# 1. 进入项目目录
cd prefix-replacer

# 2. 清理
rm -rf node_modules package-lock.json dist

# 3. 安装依赖
npm install

# 4. 验证依赖
ls node_modules | grep fs-extra  # 应该看到 fs-extra

# 5. 测试运行
npm start

# 6. 打包
npm run build:mac

# 7. 测试打包的应用
open dist/mac/*.app
```

如果还有问题，请使用方法 1 从源码运行！
