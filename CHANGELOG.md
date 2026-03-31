# 更新日志

## [2.8.0] - 2026-02-05

### ✨ 完整的配置管理系统 ⭐⭐⭐

- ✅ **📤 导出配置** - 导出配置文件到任意位置
  - 支持导出为 JSON 文件
  - 可用于备份和分享
  - 包含所有配置数据

- ✅ **📥 导入配置** - 从文件导入配置
  - 支持导入 JSON 配置文件
  - 自动验证配置格式
  - 导入后自动加载

- ✅ **📚 模板库** - 内置配置模板
  - iOS 生产/测试环境模板
  - Android 多渠道配置模板
  - 图片替换模板
  - 一键应用模板

- ✅ **🔗 生成分享** - 团队协作功能
  - 生成 JSON 配置文本
  - 复制到剪贴板
  - 保存为文件
  - 团队成员可直接导入

### 📝 内置模板

**iOS 变量模板：**
1. 生产环境配置模板
   - API_URL、DEBUG_MODE、LOG_LEVEL 等
   - SecurityConfig 配置

2. 测试环境配置模板
   - 测试 API、调试模式等

**Android 变量模板：**
1. 生产环境配置模板
   - BASE_URL、DEBUG、VERSION_NAME 等

2. 多渠道配置模板
   - CHANNEL_ID、CHANNEL_NAME、UPDATE_URL 等

**图片模板：**
- App 图标替换模板
- 启动图替换模板

### 🎯 团队协作流程

**开发者 A（分享配置）：**
```
1. 配置好生产环境规则
2. 点击"🔗 生成分享"
3. 复制配置或保存为文件
4. 发送给团队成员
```

**开发者 B（接收配置）：**
```
1. 收到配置文件或文本
2. 点击"📥 导入"
3. 选择文件或粘贴内容
4. 配置自动加载，可以直接使用
```

### 💾 导出/导入说明

**导出配置：**
- 选择要导出的配置
- 点击"📤 导出"
- 选择保存位置
- 配置导出为 .json 文件

**导入配置：**
- 点击"📥 导入"
- 选择 .json 配置文件
- 自动验证并导入
- 配置添加到列表

### 📚 模板库使用

1. 点击"📚 模板库"
2. 浏览所有可用模板
3. 查看模板说明
4. 点击"✅ 使用此模板"
5. 模板规则自动填充
6. 可继续修改

### 🔗 分享功能

**生成分享：**
1. 配置好所有规则
2. 点击"🔗 生成分享"
3. 查看 JSON 配置
4. 选择分享方式：
   - 📋 复制到剪贴板
   - 💾 保存为文件

**接收分享：**
1. 保存为 .json 文件
2. 点击"📥 导入"
3. 选择文件
4. 配置自动加载

### 📁 配置文件格式

```json
{
  "platform": "ios_variable",
  "name": "生产环境",
  "createdAt": "2026-02-05T14:30:00.000Z",
  "data": [
    {
      "className": "AppConfig",
      "expanded": true,
      "variables": [
        {
          "name": "API_URL",
          "value": "\"https://prod-api.com\""
        }
      ]
    }
  ]
}
```

### 🎉 完整功能对比

| 功能 | v2.7.0 | v2.8.0 ⭐ |
|------|--------|----------|
| 保存配置 | ✅ | ✅ |
| 加载配置 | ✅ | ✅ |
| 删除配置 | ✅ | ✅ |
| 导出配置 | ❌ | ✅ 新增 |
| 导入配置 | ❌ | ✅ 新增 |
| 模板库 | ❌ | ✅ 新增 |
| 生成分享 | ❌ | ✅ 新增 |
| 团队协作 | ❌ | ✅ 支持 |

### 📖 详细文档

请查看 [CONFIG_MANAGEMENT_GUIDE.md](CONFIG_MANAGEMENT_GUIDE.md) 获取完整的使用指南，包括：
- 所有功能的详细说明
- 团队协作流程
- 最佳实践
- 常见问题解答

---

## [2.7.0] - 2026-02-05

### ✨ 重大改进 - 配置文件管理系统

- ✅ **配置文件管理系统** ⭐ 重大升级
  - 替换 localStorage，使用文件系统保存配置
  - 支持保存、加载、删除配置文件
  - 每个配置文件独立存储
  - 配置文件带时间戳和名称
  - 可选择历史配置快速应用
  - 配置文件持久化存储

### 📝 配置文件管理说明

**支持的配置类型：**
- iOS 变量配置
- Android 变量配置  
- iOS 图片映射配置
- Android 图片映射配置

**配置文件功能：**
1. **💾 保存配置** - 将当前规则保存为配置文件
2. **📂 选择配置** - 从下拉框选择历史配置
3. **🗑️ 删除配置** - 删除不需要的配置文件
4. **🔄 自动加载** - 选择配置后自动填充规则

### 🎯 使用流程

**保存配置：**
```
1. 配置好变量/图片规则
2. 点击"💾 保存配置"
3. 输入配置名称（如"生产环境"）
4. 配置已保存，可在下拉框中看到
```

**加载配置：**
```
1. 点击配置下拉框
2. 选择之前保存的配置（如"生产环境 (2026-02-05 14:30)"）
3. 规则自动填充到界面
4. 可以直接使用或继续修改
```

**删除配置：**
```
1. 在下拉框选择要删除的配置
2. 点击"🗑️ 删除"
3. 确认删除
4. 配置文件已删除
```

### 💾 配置文件存储

**存储位置：**
- macOS: `~/Library/Application Support/ios-android-refactor-tool/configs/`
- Windows: `%APPDATA%/ios-android-refactor-tool/configs/`

**文件命名格式：**
```
ios_variable_配置名_时间戳.json
android_variable_配置名_时间戳.json
ios_image_配置名_时间戳.json
android_image_配置名_时间戳.json
```

**配置文件内容示例：**
```json
{
  "platform": "ios_variable",
  "name": "生产环境",
  "createdAt": "2026-02-05T14:30:00.000Z",
  "data": [
    {
      "className": "AppConfig",
      "expanded": true,
      "variables": [
        {"name": "API_URL", "value": "\"https://prod-api.com\""},
        {"name": "DEBUG_MODE", "value": "false"}
      ]
    }
  ]
}
```

### ✨ 主要优势

**vs LocalStorage（旧方案）：**

| 特性 | LocalStorage | 配置文件 |
|------|-------------|----------|
| 持久化 | 清除缓存丢失 | ✅ 永久保存 |
| 多配置 | ❌ 只能保存一个 | ✅ 无限个配置 |
| 导入导出 | ❌ 不支持 | ✅ 支持（未来） |
| 管理 | ❌ 无界面 | ✅ 下拉选择 |
| 时间戳 | ❌ 无 | ✅ 有 |
| 命名 | ❌ 无 | ✅ 自定义 |

### 🎯 实际应用场景

**场景 1: 多环境配置**
```
保存配置:
- "测试环境" - API_URL = test-api.com
- "预发布环境" - API_URL = pre-api.com
- "生产环境" - API_URL = prod-api.com

使用时直接选择对应环境的配置
```

**场景 2: 多渠道包**
```
保存配置:
- "Google Play" - 图片映射 + 渠道配置
- "App Store" - 图片映射 + 渠道配置
- "华为商店" - 图片映射 + 渠道配置

打包时选择对应渠道配置
```

**场景 3: 团队协作（未来）**
```
保存配置:
- 导出配置文件
- 分享给团队成员
- 成员导入配置
- 保持配置一致
```

### 🔄 迁移说明

**从 v2.6.0 升级：**

旧版本使用 localStorage 保存的数据会保留，但建议：
1. 打开旧配置
2. 使用"💾 保存配置"功能
3. 保存为配置文件
4. 之后就可以使用新的配置管理系统

---

## [2.6.0] - 2026-02-05

### ✨ 重要新功能 - 修改类变量值

- ✅ **批量修改指定类的变量值** ⭐ 新增
  - 支持 iOS Swift 和 Android Kotlin/Java
  - 可添加多个类规则
  - 每个类可配置多个变量及其新值
  - **记忆功能** - 规则自动保存到 localStorage
  - 下次打开自动加载上次的规则
  - 支持展开/收起每个类的变量列表
  - 可删除类和变量

### 📝 变量修改功能说明

**支持的变量类型：**

**iOS Swift：**
```swift
let API_URL = "old_value"
var API_URL = "old_value"
static let API_URL = "old_value"
static var API_URL = "old_value"
class var API_URL: String = "old_value"
```

**Android Kotlin：**
```kotlin
val API_URL = "old_value"
var API_URL = "old_value"
const val API_URL = "old_value"
```

**Android Java：**
```java
public static final String API_URL = "old_value";
private static String API_URL = "old_value";
String API_URL = "old_value";
```

### 🎯 使用示例

1. 勾选"修改类变量值（可选）"
2. 点击"+ 添加类"
3. 输入类名（如 `AppConfig`）
4. 点击"展开"显示变量列表
5. 点击"+ 添加变量"
6. 输入变量名和新值：
   - 变量名：`API_URL`
   - 新值：`"https://api.new.com"`
7. 可为同一个类添加多个变量
8. 可添加多个类规则
9. 规则自动保存，下次打开自动加载

### 💡 实际应用场景

**场景 1: 修改 API 地址**
```
类名: AppConfig
变量: API_URL = "https://new-api.com"
变量: SOCKET_URL = "wss://new-socket.com"
```

**场景 2: 修改应用配置**
```
类名: Constants
变量: APP_NAME = "New App"
变量: VERSION = "2.0.0"
变量: DEBUG_MODE = false
```

**场景 3: 修改密钥**
```
类名: SecurityConfig
变量: API_KEY = "new_api_key_12345"
变量: SECRET_KEY = "new_secret_key_67890"
```

### 💾 数据持久化

- iOS 规则保存到：`localStorage['classRulesIOS']`
- Android 规则保存到：`localStorage['classRulesAndroid']`
- 每次修改自动保存
- 支持删除和编辑
- 展开/收起状态也会保存

---

## [2.5.0] - 2026-02-05

### ✨ 重要新功能 - 图片资源替换

- ✅ **iOS 和 Android 图片资源批量替换** ⭐ 新增
  - 支持选择图片资源文件夹
  - 添加多个图片映射规则（原图片名 → 新图片名）
  - **记忆功能** - 映射规则自动保存到 localStorage
  - 下次打开自动加载上次的映射规则
  - 可删除和编辑每条映射规则
  - 点击复选框展开/收起配置

### 📝 图片替换功能说明

**iOS 图片替换：**
- 自动查找 Assets.xcassets 目录
- 支持 .imageset 中的图片替换
- 自动处理 @2x、@3x 等不同分辨率

**Android 图片替换：**
- 支持 drawable 和 mipmap 目录
- 自动查找所有分辨率目录（hdpi、xhdpi、xxhdpi等）
- 批量替换同名图片

### 🎯 使用示例

1. 勾选"替换图片资源（可选）"
2. 选择包含新图片的文件夹
3. 点击"+ 添加规则"
4. 输入映射关系：
   - 原图片名：`old_logo.png`
   - 新图片名：`new_logo.png`
5. 可添加多条规则
6. 规则自动保存，下次打开自动加载

### 💾 数据持久化

- iOS 映射规则保存到：`localStorage['imageMappingsIOS']`
- Android 映射规则保存到：`localStorage['imageMappingsAndroid']`
- 每次修改自动保存
- 支持删除和编辑

---

## [2.4.1] - 2026-02-04

### 🐛 重要修复

- ✅ **修复 macOS 打包缺少 fs-extra 依赖的问题**
  - 添加 `asarUnpack` 配置将 fs-extra 从 asar 中解包
  - 优化 `files` 配置确保所有必要文件被正确打包
  - 解决 "Cannot find module 'fs-extra'" 错误

### 📝 打包配置改进

新增配置：
```json
{
  "asar": true,
  "asarUnpack": ["node_modules/fs-extra/**/*"],
  "files": [
    "main.js",
    "renderer.js",
    "ios-processor.js",
    "android-processor.js",
    "!node_modules",
    "node_modules/fs-extra/**/*"
  ]
}
```

### 🔧 重新打包

如果之前下载的版本有问题：
```bash
rm -rf node_modules dist
npm install
npm run build:mac
```

详细说明：[PACKAGE_FIX.md](PACKAGE_FIX.md)
  
- ✅ **新增安装修复文档**
  - **INSTALL_FIX.md** - 详细的问题解决方案
  - 提供从源码运行的替代方案（推荐）
  - 完整的重新打包步骤

### 📝 遇到 "Cannot find module" 错误？

**推荐解决方案：从源码运行** ⭐

```bash
cd prefix-replacer
npm install
npm start
```

详细说明请查看：[INSTALL_FIX.md](INSTALL_FIX.md)

---

- ✅ **修复打包后无法启动的问题** - "Cannot find module 'fs-extra'"
  - 添加 `fs-extra` 到 dependencies
  - 更新 electron-builder 配置
  - 确保所有模块文件被正确打包
  - 添加 asar 解包配置

### 📝 打包配置更新

**package.json 更改：**
```json
{
  "dependencies": {
    "fs-extra": "^11.2.0"
  },
  "build": {
    "files": [
      "main.js",
      "renderer.js", 
      "index.html",
      "styles.css",
      "ios-processor.js",
      "android-processor.js",
      "fix-xcode-project.js",
      "node_modules/**/*"
    ],
    "asar": true,
    "asarUnpack": [
      "node_modules/fs-extra/**/*"
    ]
  }
}
```

### ⚠️ 重新打包说明

如果使用 v2.4.0 遇到 "Cannot find module 'fs-extra'" 错误：

1. 删除 node_modules 和 dist
2. 运行 `npm install`
3. 重新打包 `npm run build:mac` 或 `npm run build:win`

详见：[INSTALL_FIX.md](INSTALL_FIX.md)

---

## [2.4.0] - 2026-02-04

### ✨ iOS 重要新功能

- ✅ **文件和 Xcode Group 前缀修改** ⭐ iOS 专属功能
  - **独立配置** - 文件/Group 前缀可以与类前缀不同
  - **可选功能** - 勾选后才启用，默认不修改文件名
  - **自动重命名** - 批量重命名包含指定前缀的文件
  - **Group 同步** - 自动更新 Xcode 项目中的 Group 名称
  - **引用更新** - 同步更新 .pbxproj 文件中的所有引用
  - **保持完整性** - 确保 Xcode 项目结构完整

### 📝 使用说明

**独立配置文件和 Group 前缀：**

1. **类前缀替换**（必填）
   - 旧前缀：ABC
   - 新前缀：XYZ
   - 作用：修改代码中的类名

2. **文件和 Group 前缀**（可选，独立设置）
   - 勾选"同时修改文件和 Xcode Group 前缀"
   - 旧文件前缀：YND（可以与类前缀不同）
   - 新文件前缀：SSS（可以与类前缀不同）
   - 作用：重命名文件和 Xcode Group

**示例场景：**

**场景 1: 类前缀和文件前缀相同**
```
类前缀：ABC → XYZ
文件前缀：ABC → XYZ
结果：
- ABCViewController.swift → XYZViewController.swift
- class ABCViewController → class XYZViewController
```

**场景 2: 类前缀和文件前缀不同** ⭐
```
类前缀：ABC → XYZ
文件前缀：YND → SSS
结果：
- YNDViewController.swift → SSSViewController.swift（文件名）
- class ABCViewController → class XYZViewController（类名）
```

**场景 3: 只修改类名，不改文件名**
```
类前缀：ABC → XYZ
文件前缀：不勾选
结果：
- ABCViewController.swift（文件名不变）
- class ABCViewController → class XYZViewController（类名改变）
```

### 🎯 实际应用

**文件重命名：**
```
YNDViewController.swift → SSSViewController.swift
YNDModel.swift → SSSModel.swift
YNDNetworkManager.swift → SSSNetworkManager.swift
```

**Group 重命名（在 Xcode 中）：**
```
YNDControllers/ → SSSControllers/
YNDViews/ → SSSViews/
YNDModels/ → SSSModels/
```

**.pbxproj 文件更新：**
```
path = YNDControllers; → path = SSSControllers;
name = YNDViews; → name = SSSViews;
path = YNDViewController.swift; → path = SSSViewController.swift;
```

---

## [2.3.0] - 2026-02-04

### ✨ 重要改进

- ✅ **智能随机代码生成** - 自动跳过不需要的文件 ⭐
  - **跳过接口文件** - Java interface / Kotlin interface / Swift protocol
  - **跳过注释文件** - 整个文件被注释的代码（超过80%注释行）
  - **保持代码清洁** - 只在真实的类中添加随机代码
  
- ✅ **代码模块化** - 更好的代码组织
  - `ios-processor.js` - iOS Swift 处理逻辑
  - `android-processor.js` - Android Kotlin/Java 处理逻辑
  - 更易维护和扩展

### 🐛 修复问题

- ✅ 修复了接口文件被添加随机代码的问题
- ✅ 修复了注释文件被添加随机代码的问题

### 📝 智能过滤规则

**跳过的文件类型：**

1. **Java/Kotlin 接口**
   ```java
   public interface SomeContract {
       // 不会添加随机代码
   }
   ```

2. **Swift 协议**
   ```swift
   protocol SomeDelegate {
       // 不会添加随机代码
   }
   ```

3. **注释文件**
   ```java
   // public class JWebSocketClient extends WebSocketClient {
   //     public void onOpen() {
   //         // 整个文件被注释，不会添加随机代码
   //     }
   // }
   ```

---

## [2.2.0] - 2026-02-04

### ✨ 重要新功能

- ✅ **ProGuard 规则文件支持** - 自动处理 proguard-rules.pro 文件
  - 替换 `-keep class com.yndcyst.shop.**` 中的包名
  - 支持所有 .pro 文件和包含 proguard 的文件
  
- ✅ **随机代码生成功能** ⭐ 防止二进制相同（iOS + Android）
  - **iOS Swift 支持** - 为每个 Swift 文件添加随机方法和变量
  - **Android Kotlin/Java 支持** - 为每个 Kotlin/Java 文件添加随机方法和变量
  - 可配置随机代码前缀（如 `obf`）
  - 可配置每个文件的方法数和变量数
  - 所有随机代码添加在类的尾部
  - 生成的方法和变量名不重复
  - 增加二进制文件差异，提高安全性

### 📝 使用说明

**ProGuard 规则：**
- 自动处理所有 `proguard-rules.pro`、`*.pro` 文件
- 自动替换其中的包名引用

**随机代码生成：**

**iOS：**
1. 勾选"添加随机代码（增加二进制差异）"
2. 设置随机代码前缀（如 `obf`、`sec`、`_`）
3. 设置每个文件添加的方法数（建议 3-5）
4. 设置每个文件添加的变量数（建议 5-10）

生成的 Swift 代码示例：
```swift
class MyViewController: UIViewController {
    // 原有代码...
    
    // Auto-generated obfuscation code
    private var obftempBackup123: Int = 456
    private var obfcacheX789: String = "data"
    
    private func obfQuickProcessData234() -> Int {
        return 567
    }
}
```

**Android：**
1. 勾选"添加随机代码（增加二进制差异）"
2. 设置随机代码前缀（如 `obf`、`sec`、`_`）
3. 设置每个文件添加的方法数（建议 3-5）
4. 设置每个文件添加的变量数（建议 5-10）

生成的 Java/Kotlin 代码示例：
```java
// Java
public class MainActivity extends AppCompatActivity {
    // 原有代码...
    
    // Auto-generated obfuscation code
    private int obftempBackup123 = 456;
    private String obfcacheX789 = "data";

    private int obfQuickProcessData234() {
        return 567;
    }
}
```

```kotlin
// Kotlin
class MainActivity : AppCompatActivity() {
    // 原有代码...
    
    // Auto-generated obfuscation code
    private var obftempBackup123: Int = 456
    private var obfcacheX789: String = "data"
    
    private fun obfQuickProcessData234(): Int {
        return 567
    }
}
```

---

## [2.1.2] - 2026-02-04

### ✨ 完善的代码文件处理

- ✅ **完整的 Java/Kotlin 代码包名替换** - 处理所有代码场景 ⭐ 重要
  - Static Import: `import static com.yndcyst.shop.utils.StringUtils`
  - Extends: `extends com.yndcyst.shop.bean.Goods`
  - Implements: `implements com.yndcyst.shop.Interface`
  - 代码中的完整类名: `com.yndcyst.shop.utils.Utils.method()`
  - 泛型类型: `List<com.yndcyst.shop.bean.Goods.Inner>`
  - 注解: `@com.yndcyst.shop.annotation.Custom`

### 📚 文档更新

- ✅ **ANDROID_CODE_REPLACEMENT.md** - 详细的代码替换说明和示例
  - 包含你提供的所有实际案例
  - 8 种不同的替换场景
  - 完整的对比示例
  - 验证方法

---

## [2.1.0] - 2026-02-03

### ✨ 新功能

- ✅ **Android XML 布局文件完整支持** - 自动处理所有 XML 文件中的包名
  - 自定义 View 标签：`<com.yndcyst.shop.widget.CustomView />`
  - DataBinding 变量类型：`type="com.yndcyst.shop.Handler"`
  - Fragment/Activity 引用：`android:name="com.yndcyst.shop.MainActivity"`
  - Navigation 图中的 Fragment
  - 所有包含类引用的 XML 属性

### 🐛 Bug 修复

- ✅ **修复 XML 闭合标签未被替换的问题** ⭐ 重要修复
  - 之前：只替换开始标签 `<com.yndcyst.shop.xxx>`
  - 现在：同时替换闭合标签 `</com.yndcyst.shop.xxx>`
  - 示例：`</com.yndcyst.shop.viewpage.AnimationNestedScrollView>` 现在会被正确替换
- ✅ **修复 XML 中包名未完全替换的问题** - 改进正则表达式匹配
  - 支持属性值中有空格的情况：`type="  com.yndcyst.shop.xxx"`
  - 支持属性和引号之间有空格：`type = "com.yndcyst.shop.xxx"`
  - 添加通用匹配模式，确保不遗漏任何包名引用
- ✅ 修复了 Android 项目中某些 XML 布局文件未被处理的问题
- ✅ 改进了文件扫描逻辑，Android 平台现在包含 XML 文件统计

### 📚 文档更新

- ✅ **ANDROID_XML_EXAMPLES.md** - Android XML 处理详细示例和说明
- ✅ **MACOS_SECURITY_WARNING.md** - macOS 安全警告完整解决方案
  - 5 种不同的解决方法
  - 详细的步骤说明
  - 常见问题解答
  - 开发者签名指南

### 🧪 开发工具

- ✅ **test-xml-replacement.js** - XML 处理测试脚本
  - 用于验证各种 XML 格式的包名替换
  - 包含多个测试用例

---

## [2.0.0] - 2026-02-03

### ✨ 重大更新 - Android 支持 + 跨平台

- ✅ **新增 Android 平台支持** - 支持 Kotlin 和 Java 项目
- ✅ **Android XML 布局文件支持** - 自动替换 XML 中的包名和自定义 View ⭐ 新增
- ✅ **Windows 支持** - 支持在 Windows 上运行和打包
- ✅ **跨平台打包** - 可在 Mac 上同时打包 macOS 和 Windows 版本
- ✅ **包名替换** - 自动替换 package 声明和 import 语句
- ✅ **目录重组** - 自动重组包目录结构以匹配新包名
- ✅ **配置文件更新** - 自动更新 build.gradle 和 AndroidManifest.xml
- ✅ **可选类前缀** - Android 项目可选择同时修改类前缀
- ✅ **平台选择** - 新增平台选择界面（iOS/Android）

### 🛡️ 安全和文档

- ✅ **macOS 安全警告解决方案** - 详细的安全警告处理指南 ⭐ 新增
- ✅ **完整文档** - 新增多个详细使用和打包指南

### 📦 打包改进

- ✅ **macOS 打包** - 支持 Intel 和 Apple Silicon，生成 .dmg 和 .zip
- ✅ **Windows 打包** - 支持 64-bit 和 32-bit，生成安装程序和便携版
- ✅ **打包脚本** - 新增 `build-dmg.sh`、`build-win.bat`、`build-all.sh`
- ✅ **详细文档** - 新增跨平台打包完整指南

### 📝 改进

- 优化了用户界面，添加平台选择器
- 改进了文件扫描逻辑，支持多种文件类型
- 增强了错误处理和进度显示
- 更新了文档和使用说明

---

## [1.1.0] - 2026-02-03

### ✨ 新功能

- ✅ **自动更新 Xcode 项目文件** - 处理完成后自动更新 `.xcodeproj/project.pbxproj` 中的文件引用
- ✅ **修复脚本** - 添加 `fix-xcode-project.js` 独立脚本，用于修复已处理的项目
- ✅ **详细指南** - 新增 `XCODE_FIX_GUIDE.md`，提供完整的 Xcode 引用修复方案

### 🐛 Bug 修复

- ✅ 修复了 Xcode 中文件显示为红色（找不到）的问题
- ✅ 修复了重命名文件后 Xcode 引用未更新的问题

### 📝 改进

- 改进了文件重命名的跟踪
- 添加了处理进度中的项目文件更新提示

---

## [1.0.0] - 2026-02-03

### ✨ 初始版本

**核心功能：**
- ✅ 批量替换 Swift 文件中的类前缀
- ✅ 自动重命名文件
- ✅ 完整复制项目结构和资源文件
- ✅ 实时进度显示
- ✅ 详细的错误报告

**支持的 Swift 语法：**
- class、struct、enum、protocol
- extension、typealias
- 类型声明、继承、协议遵循
- 初始化、静态成员访问
- 泛型和数组类型

**自动排除：**
- Pods、build、DerivedData
- .git、node_modules
- 隐藏文件和文件夹

### 📝 已知问题

1. ✅ ~~不支持自动更新 Xcode 项目文件~~ （已在 v1.1.0 修复）
2. 不支持处理注释和字符串字面量中的前缀（会被一起替换）
3. 不支持 Objective-C 文件

### 🔮 计划中的功能

- [ ] 添加预览功能
- [ ] 支持 Objective-C 文件
- [ ] 添加配置文件保存常用设置
- [ ] 生成详细日志文件
- [ ] 支持自定义排除规则
- [ ] 添加备份和撤销功能
- [ ] 支持多行注释和字符串的智能识别
- [ ] 批量处理多个项目

---

## 如何参与贡献

如果你想添加新功能或修复 bug：

1. 查看 `DEVELOPER.md` 了解代码结构
2. 创建功能分支进行开发
3. 测试你的更改
4. 提交 Pull Request

## 反馈

如有问题或建议，欢迎提 Issue！
