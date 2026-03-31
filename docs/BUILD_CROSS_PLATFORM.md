# 跨平台打包指南（Mac + Windows）

## 📦 支持的平台

- ✅ macOS (Intel & Apple Silicon)
- ✅ Windows (64-bit & 32-bit)

## 🚀 快速开始

### 在 macOS 上打包

```bash
cd prefix-replacer

# 方法 1: 使用交互式脚本（推荐）
./build-all.sh

# 方法 2: 分别打包
./build-dmg.sh          # 只打包 macOS
npm run build:win       # 只打包 Windows

# 方法 3: 同时打包两个平台
npm run build:all
```

### 在 Windows 上打包

```cmd
cd prefix-replacer

REM 方法 1: 使用批处理脚本（推荐）
build-win.bat

REM 方法 2: 使用 npm 命令
npm run build:win

REM 方法 3: 同时打包（需要额外配置）
npm run build:all
```

### 在 Linux 上打包

```bash
cd prefix-replacer

# 使用交互式脚本
./build-all.sh

# 或直接打包
npm run build:win       # 打包 Windows 版本
```

## 📁 生成的文件

打包成功后，在 `dist` 目录会生成：

### macOS
```
dist/
├── iOS Android Refactor Tool-2.0.0.dmg                    # Intel + Apple Silicon
├── iOS Android Refactor Tool-2.0.0-arm64.dmg             # Apple Silicon 专用
├── iOS Android Refactor Tool-2.0.0-x64.dmg               # Intel 专用
└── iOS Android Refactor Tool-2.0.0-mac.zip               # ZIP 格式
```

### Windows
```
dist/
├── iOS Android Refactor Tool Setup 2.0.0.exe             # 安装程序 (64-bit)
├── iOS Android Refactor Tool Setup 2.0.0-ia32.exe        # 安装程序 (32-bit)
├── iOS Android Refactor Tool-2.0.0-portable.exe          # 便携版 (无需安装)
└── iOS Android Refactor Tool-2.0.0-win.zip               # ZIP 格式
```

## 💻 详细打包命令

### 1. 只打包 macOS

```bash
# 打包当前架构
npm run build:mac

# 打包 Intel 版本
npx electron-builder --mac --x64

# 打包 Apple Silicon 版本
npx electron-builder --mac --arm64

# 打包通用版本（同时支持两种架构）
npx electron-builder --mac --universal
```

### 2. 只打包 Windows

```bash
# 打包 64-bit 版本
npm run build:win

# 同时打包 64-bit 和 32-bit
npx electron-builder --win --x64 --ia32

# 只打包便携版
npx electron-builder --win portable
```

### 3. 同时打包两个平台

```bash
# 打包 macOS + Windows
npm run build:all

# 或者
npx electron-builder --mac --win
```

## 🔧 跨平台打包注意事项

### 在 Mac 上打包 Windows 应用

✅ **可以直接打包**，但需要注意：

1. 首次打包会自动下载 Windows 相关工具
2. 不需要安装 wine（electron-builder 会处理）
3. 生成的 .exe 文件在 Mac 上无法运行，但在 Windows 上可以正常使用

### 在 Windows 上打包 Mac 应用

❌ **不推荐**，因为：

1. 需要安装额外的工具
2. 无法生成 .dmg 文件（Mac 专用格式）
3. 可能遇到签名问题

**建议：** 在 Windows 上只打包 Windows 版本

### 在 Linux 上打包

✅ 可以打包 Windows 和 Linux 版本
❌ 无法打包 macOS 版本（需要 macOS 系统）

## 📋 完整打包流程

### 方案 1：在 Mac 上打包所有平台（推荐）

```bash
# 1. 安装依赖
npm install

# 2. 使用交互式脚本
./build-all.sh

# 3. 选择选项 "3" (同时打包 Mac 和 Windows)

# 4. 等待完成，在 dist 目录获取所有文件
```

### 方案 2：分别在不同平台上打包

**在 macOS 上：**
```bash
npm install
npm run build:mac
# 得到 .dmg 文件
```

**在 Windows 上：**
```cmd
npm install
build-win.bat
REM 得到 .exe 文件
```

## 🎯 推荐的打包策略

### 个人使用
```bash
# 只打包当前平台
npm run build
```

### 分发给他人
```bash
# 在 Mac 上同时打包两个平台
npm run build:all
```

### 正式发布
```bash
# 1. 在 Mac 上打包
npm run build:all

# 2. 测试所有生成的文件
# - 在 Mac 上测试 .dmg
# - 在 Windows 上测试 .exe

# 3. 上传到 GitHub Releases 或其他分发平台
```

## 📦 安装包类型说明

### macOS

| 文件类型 | 说明 | 推荐度 |
|---------|------|--------|
| .dmg | 标准安装包，双击打开拖拽安装 | ⭐⭐⭐⭐⭐ |
| .zip | 压缩包，解压即用 | ⭐⭐⭐ |
| -arm64.dmg | 仅支持 Apple Silicon (M1/M2/M3) | ⭐⭐⭐ |
| -x64.dmg | 仅支持 Intel 处理器 | ⭐⭐⭐ |

### Windows

| 文件类型 | 说明 | 推荐度 |
|---------|------|--------|
| Setup.exe | 标准安装程序，完整安装 | ⭐⭐⭐⭐⭐ |
| portable.exe | 便携版，无需安装，双击运行 | ⭐⭐⭐⭐ |
| .zip | 压缩包，解压即用 | ⭐⭐⭐ |

## 🔍 打包配置详解

### NSIS 安装程序配置

```json
{
  "nsis": {
    "oneClick": false,                    // 显示安装向导
    "allowToChangeInstallationDirectory": true,  // 允许选择安装路径
    "createDesktopShortcut": true,       // 创建桌面快捷方式
    "createStartMenuShortcut": true,     // 创建开始菜单快捷方式
    "perMachine": false,                 // 为当前用户安装
    "runAfterFinish": true               // 安装后运行
  }
}
```

### 便携版配置

```json
{
  "portable": {
    "artifactName": "${productName}-${version}-portable.${ext}"
  }
}
```

## 🐛 常见问题

### Q1: Mac 上打包 Windows 时失败

**错误信息：** "wine not found"

**解决方法：**
```bash
# electron-builder 会自动处理，不需要手动安装 wine
# 如果仍然失败，尝试：
rm -rf dist/ node_modules/
npm install
npm run build:all
```

### Q2: Windows 上打包失败

**错误信息：** "ENOENT: no such file or directory"

**解决方法：**
```cmd
REM 以管理员身份运行命令提示符
REM 清理并重新安装
rmdir /s /q node_modules dist
npm install
npm run build:win
```

### Q3: 生成的文件太大

**原因：** electron-builder 会打包整个 Electron 运行时

**解决方法：**
- 这是正常的，Electron 应用通常在 80-150MB
- 可以使用 `asar` 压缩
- 分发时使用 .zip 或安装程序，不会重复下载

### Q4: 打包速度慢

**原因：** 首次打包需要下载依赖

**解决方法：**
```bash
# 使用国内镜像
export ELECTRON_MIRROR=https://npmmirror.com/mirrors/electron/
npm install
npm run build:all
```

### Q5: 如何减小安装包大小？

1. **不打包开发依赖**（已自动处理）
2. **使用 asar 压缩**：
   ```json
   {
     "build": {
       "asar": true
     }
   }
   ```
3. **只打包必要文件**（已配置）
4. **分别打包 32-bit 和 64-bit**，而不是同时打包

## 🎨 自定义图标（可选）

### macOS (.icns)

1. 准备 1024x1024 PNG 图标
2. 使用在线工具转换为 .icns：https://cloudconvert.com/png-to-icns
3. 保存为 `build/icon.icns`

### Windows (.ico)

1. 准备 256x256 PNG 图标
2. 使用在线工具转换为 .ico：https://convertio.co/png-ico/
3. 保存为 `build/icon.ico`

### 更新配置

```json
{
  "build": {
    "mac": {
      "icon": "build/icon.icns"
    },
    "win": {
      "icon": "build/icon.ico"
    }
  }
}
```

## 📊 打包时间参考

| 平台 | 首次打包 | 后续打包 |
|------|---------|---------|
| macOS only | 5-10 分钟 | 2-3 分钟 |
| Windows only | 5-10 分钟 | 2-3 分钟 |
| Mac + Windows | 10-15 分钟 | 4-6 分钟 |

## 💡 最佳实践

1. **开发阶段**：使用 `npm start` 测试，不要频繁打包
2. **测试阶段**：只打包当前平台 `npm run build:mac` 或 `npm run build:win`
3. **发布阶段**：在 Mac 上同时打包两个平台 `npm run build:all`
4. **版本管理**：每次发布前更新 `package.json` 中的版本号
5. **测试安装**：在干净的系统上测试安装包

## 🚀 快速命令参考

```bash
# 安装依赖
npm install

# 开发运行
npm start

# 打包当前平台
npm run build

# 只打包 macOS
npm run build:mac

# 只打包 Windows
npm run build:win

# 同时打包 macOS + Windows
npm run build:all

# 清理后重新打包
rm -rf dist/ && npm run build:all
```

## 🎉 总结

### 最简单的方法

**在 macOS 上：**
```bash
./build-all.sh
# 选择选项 3
```

**在 Windows 上：**
```cmd
build-win.bat
```

就这么简单！生成的安装包可以直接分发给用户使用。
