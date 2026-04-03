# iOS Android Refactor Tool

一个基于 Electron 的 iOS / Android 项目重构工具，支持：
- iOS Swift 类前缀替换
- Android 包名与类前缀替换
- 项目图片批量替换（支持仅图片模式）
- 可选未替换图片重编码（用于统一图片产物）

## 功能概览

### 1. iOS 重构能力
- Swift 类名前缀替换
- Objective-C（.h/.m/.mm）前缀替换
- 可选重命名文件与 Xcode Group
- 可选工程名一键重命名（`.xcodeproj/.xcworkspace/Podfile/plist`）
- 可选 xcassets 批量资源前缀重命名
- 可选复制 Pods
- 可选添加随机代码（用于产物差异化）
- 可选输出独立垃圾代码文件（Extension/Helper）

### 2. Android 重构能力
- Kotlin / Java 包名替换
- Android XML 包名引用替换
- Gradle `applicationId` / `namespace` 更新
- 包目录结构自动重组
- 可选类前缀替换
- 可选添加随机代码
- 可选输出独立垃圾代码文件（Helper）

### 3. 图片替换能力
- 支持 iOS / Android 图片资源替换
- 支持“只替换项目图片”模式（不处理代码）
- 支持先扫描后替换，展示可替换列表与总数
- 支持手动映射规则
- 支持自动同名匹配（不配置规则时）
- 可选替换后使用新文件名
- 可选未替换图片重编码（PNG/JPEG）

### 4. 通用工程能力
- 可配置忽略目录（`ignoreDirNames`）
- 可选清理代码注释（Swift/ObjC/Kotlin/Java）

## 界面模式

### A. 完整重构模式
适用于“代码 + 资源”一起处理：
1. 选择平台（iOS / Android）
2. 选择源文件夹与目标文件夹
3. 配置前缀 / 包名参数
4. （可选）启用图片替换
5. 点击“扫描文件”后执行替换

### B. 只替换项目图片模式
适用于“仅换图，不改代码”：
1. 勾选 `只替换项目图片`
2. 选择平台（iOS / Android）
3. 选择目标文件夹（项目目录）
4. 选择新图片文件夹
5. 点击“扫描文件”查看可替换列表
6. 确认后点击“开始替换”

## 环境要求

- Node.js 18+（推荐 Node.js 22）
- npm 9+
- macOS / Windows

## 安装与运行

```bash
npm install
npm run start
```

## CLI 模式

```bash
npm run cli -- --help
```

示例（iOS）：

```bash
npm run cli -- \
  --platform ios \
  --source /path/to/src \
  --target /path/to/out \
  --old-prefix OLD \
  --new-prefix NEW \
  --ignore-dirs "Pods,build,.git" \
  --delete-comments \
  --replace-images /path/to/new_images \
  --image-auto-match \
  --spam-code-out Spam:3
```

## 测试

```bash
npm run test:regression
```

## 打包

```bash
# 通用
npm run build

# macOS
npm run build:mac
npm run build:dmg

# Windows
npm run build:win
npm run build:exe

# 全平台
npm run build:all
```

## 项目结构

```text
src/
  core/         # 核心处理逻辑（iOS/Android/图片）
  main/         # Electron 主进程
  renderer/     # 前端页面与交互逻辑
tests/          # 回归测试脚本
docs/           # 详细文档
```

## 关键文档

- `docs/ANDROID_CODE_REPLACEMENT.md`
- `docs/XML_REPLACEMENT_RULES.md`
- `docs/QUICK_BUILD.md`
- `docs/DEVELOPER.md`
- `docs/CONFIG_MANAGEMENT_GUIDE.md`

## 注意事项

- 建议操作前备份原项目
- 源文件夹与目标文件夹不要设置为同一路径（完整重构模式）
- 图片替换前建议先扫描，确认命中列表
- 启用“替换后使用新图片名”后，请同步检查资源引用
- 启用“未替换图片重编码”后，图片二进制会变化，但应尽量保持视觉不变
