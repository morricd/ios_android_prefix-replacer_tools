# 全局重构模式 - 正确的类前缀替换方式

## 问题分析

你说得非常对！当前的逐文件替换方式有严重问题：

### 错误的方式（当前实现）

```
处理流程：
1. 处理文件 A.swift
   - 类名 YNDCYSTClassA → JUNZILANClassA ✅
   - 文件名 YNDCYSTClassA.swift → JUNZILANClassA.swift ✅
   
2. 处理文件 B.swift
   - 类名 YNDCYSTClassB → JUNZILANClassB ✅
   - 但是 B 中引用了 YNDCYSTClassA  ❌ 还是旧名
   - 文件名 YNDCYSTClassB.swift → JUNZILANClassB.swift ✅
   
结果：引用错乱！
```

### 正确的方式（Xcode/Android Studio 重命名）

```
处理流程：
1. 扫描整个项目
   - 找到所有类：YNDCYSTClassA, YNDCYSTClassB, ...
   
2. 生成映射表
   YNDCYSTClassA → JUNZILANClassA
   YNDCYSTClassB → JUNZILANClassB
   
3. 全局替换
   - 在所有文件中同时替换
   - 包括代码、注释、字符串、pbxproj
   
4. 重命名文件
   - YNDCYSTClassA.swift → JUNZILANClassA.swift
   - YNDCYSTClassB.swift → JUNZILANClassB.swift
```

## 新的实现

### 文件：ios-processor-refactor.js

#### 核心函数

**1. scanProjectForClasses()**
```javascript
// 扫描项目，收集所有需要替换的类名
const { classNames, files } = await scanProjectForClasses(projectPath, oldPrefix);
// 返回：['YNDCYSTClassA', 'YNDCYSTClassB', ...]
```

**2. global ReplaceClasses()**
```javascript
// 在所有文件中全局替换类名
await globalReplaceClasses(projectPath, classMapping);
// classMapping = {
//   'YNDCYSTClassA': 'JUNZILANClassA',
//   'YNDCYSTClassB': 'JUNZILANClassB'
// }
```

**3. renameFiles()**
```javascript
// 重命名文件
await renameFiles(projectPath, classMapping);
```

### 覆盖的场景

#### 1. 类定义
```swift
// ✅ class YNDCYSTModel → class JUNZILANModel
class YNDCYSTModel { }

// ✅ enum YNDCYSTStyle → enum JUNZILANStyle
enum YNDCYSTDiscountActivityStyle { }

// ✅ protocol YNDCYSTDelegate → protocol JUNZILANDelegate
protocol YNDCYSTGiftsListCollectionTitleViewDelegate: NSObjectProtocol { }

// ✅ struct YNDCYSTData → struct JUNZILANData
struct YNDCYSTUserData { }
```

#### 2. 类型使用
```swift
// ✅ 类型声明
var model: YNDCYSTModel → var model: JUNZILANModel
let data: YNDCYSTModel? → let data: JUNZILANModel?

// ✅ 泛型
var arr: Array<YNDCYSTModel> → var arr: Array<JUNZILANModel>
var dict: [String: YNDCYSTModel] → var dict: [String: JUNZILANModel]

// ✅ 数组
var models: [YNDCYSTModel] → var models: [JUNZILANModel]

// ✅ 类型转换
model as? YNDCYSTModel → model as? JUNZILANModel
if data is YNDCYSTModel → if data is JUNZILANModel

// ✅ 继承和协议
class Child: YNDCYSTParent → class Child: JUNZILANParent
```

#### 3. 实例化
```swift
// ✅ 初始化
let model = YNDCYSTModel() → let model = JUNZILANModel()

// ✅ 类方法
YNDCYSTModel.create() → JUNZILANModel.create()

// ✅ 类型引用
of: YNDCYSTCell.self → of: JUNZILANCell.self
```

#### 4. 字符串中的类名（重要！）
```swift
// ✅ 标识符字符串
private let identifier = "YNDCYSTModel"
→ private let identifier = "JUNZILANModel"

// ✅ Cell 复用标识符
withReuseIdentifier: "YNDCYSTCell"
→ withReuseIdentifier: "JUNZILANCell"
```

#### 5. 嵌套类（类中类）
```swift
// ✅ 内部类定义
class YNDCYSTOuter {
    class YNDCYSTInner { }
}
→
class JUNZILANOuter {
    class JUNZILANInner { }
}

// ✅ 内部类使用
let inner = YNDCYSTOuter.YNDCYSTInner()
→ let inner = JUNZILANOuter.JUNZILANInner()
```

#### 6. Protocol 协议
```swift
// ✅ Protocol 定义
protocol YNDCYSTDelegate: NSObjectProtocol {
    func method(_ model: YNDCYSTModel?)
}
→
protocol JUNZILANDelegate: NSObjectProtocol {
    func method(_ model: JUNZILANModel?)
}

// ✅ Protocol 使用
var delegate: YNDCYSTDelegate?
→ var delegate: JUNZILANDelegate?
```

#### 7. 文件头注释
```swift
// ✅ 文件名
//  YNDCYSTModel.swift
→
//  JUNZILANModel.swift
```

#### 8. 代码注释
```swift
// ✅ 单行注释
/// 返回 YNDCYSTModel 对象
→ /// 返回 JUNZILANModel 对象

// ✅ 多行注释
/*
 * YNDCYSTModel 类说明
 */
→
/*
 * JUNZILANModel 类说明
 */
```

#### 9. Xcode Project 文件
```
// ✅ pbxproj 文件
path = YNDCYSTModel.swift;
→ path = JUNZILANModel.swift;

name = YNDCYSTModels;
→ name = JUNZILANModels;
```

## 使用方式

### 在 main.js 中集成

```javascript
const iosProcessor = require('./ios-processor-refactor');

// 使用全局重构
const result = await iosProcessor.refactorIOSProject(
  projectPath,
  'YNDCYST',
  'JUNZILAN',
  (progress) => {
    console.log(`处理进度: ${progress.current}/${progress.total}`);
  }
);

console.log(`
替换完成：
- 类数量: ${result.classCount}
- 处理文件: ${result.filesProcessed}
- 重命名文件: ${result.filesRenamed}
`);
```

### 处理流程

```
步骤 1: 扫描项目
  → 收集所有以 YNDCYST 开头的类名
  → 生成类名列表

步骤 2: 生成映射
  → YNDCYSTClassA → JUNZILANClassA
  → YNDCYSTClassB → JUNZILANClassB
  → ...

步骤 3: 全局替换
  → 遍历所有 .swift, .m, .h 文件
  → 在每个文件中替换所有类名
  → 同时更新 pbxproj 文件

步骤 4: 重命名文件
  → YNDCYSTClassA.swift → JUNZILANClassA.swift
  → YNDCYSTClassB.swift → JUNZILANClassB.swift
```

## 优势

### 1. 完整性
- ✅ 所有引用都会被正确替换
- ✅ 不会遗漏任何文件
- ✅ 包括代码、注释、字符串

### 2. 一致性
- ✅ 所有文件同时更新
- ✅ 不会出现引用错乱
- ✅ 就像 Xcode 的 Refactor

### 3. 安全性
- ✅ 先扫描再替换
- ✅ 可以预览将要替换的类
- ✅ 有进度反馈

## Android 同样适用

Android Studio 的 Refactor → Rename 也是全局替换：

### Android 需要处理

1. **包名替换**（已实现）
2. **类名替换**（需要采用全局模式）
   - Kotlin 类
   - Java 类
   - XML 布局中的引用
   - Manifest 中的引用

### Android 全局替换示例

```kotlin
// 文件 A.kt
class YNDCYSTModelA { }

// 文件 B.kt
class YNDCYSTModelB {
    val modelA: YNDCYSTModelA  // 引用 A
}

// 全局替换后
// 文件 A.kt
class JUNZILANModelA { }

// 文件 B.kt
class JUNZILANModelB {
    val modelA: JUNZILANModelA  // ✅ 同时更新
}
```

## 总结

你说得完全正确！

**问题的本质：**
- 当前是逐文件处理，导致引用不一致
- 应该采用全局扫描 → 全局替换的模式

**解决方案：**
- ✅ 先收集所有类名
- ✅ 生成完整的映射表
- ✅ 在所有文件中同时替换
- ✅ 最后重命名文件

**这才是正确的 Refactor 思维！**

就像在 Xcode 或 Android Studio 中：
1. 右键点击类名
2. Refactor → Rename
3. 输入新名字
4. 所有引用自动更新

我们的工具应该做同样的事情！
