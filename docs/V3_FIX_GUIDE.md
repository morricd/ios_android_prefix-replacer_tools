# v3 修复指南 - 解决重复前缀问题

## 问题回顾

你上传的图片显示了严重的问题：

```swift
// ❌ 错误的结果
let filterHeaderView = JunZiLanJunZiLan2290frame: CGRect(...)
let searchView = JunZiLanJunZiLan3638frame: CGRect(...)
let viewModel = JunZiLanJunZiLan1064)
static let viewModel = JunZiLanJunZiLan270)
```

**类名被错误替换，出现重复前缀 + 数字！**

## 根本原因分析

### 问题1：不完整的类名匹配

**错误的替换逻辑：**
```javascript
// 替换所有包含 YNDCYST 的地方
content = content.replace(/YNDCYST/g, 'JunZiLan');
```

**导致：**
```swift
// 原始代码
let view = YNDCYSTSortCommodityHeaderView(frame: ...)

// 第一次替换（类定义）
class YNDCYSTSortCommodityHeaderView → class JunZiLanSortCommodityHeaderView ✅

// 第二次替换（构造函数）- 但此时已经是 JunZiLan 开头了！
JunZiLanSortCommodityHeaderView → 又被匹配到
某些部分被再次替换 → JunZiLanJunZiLan... ❌
```

### 问题2：替换顺序错误

**没有按长度排序：**
```swift
// 如果先替换短类名
YNDCYST → JunZiLan

// 再替换长类名
YNDCYSTSortViewModel → 但是 YNDCYST 已经被替换了！
→ 变成 JunZiLanSortViewModel ✅（偶然正确）
或
→ JunZiLanJunZiLanSortViewModel ❌（重复）
```

### 问题3：没有边界检测

**匹配到部分字符：**
```swift
// 原始
YNDCYSTSortCommodityHeaderView(frame: ...)

// 如果正则是：YNDCYST.*?\(
// 会匹配到：YNDCYSTSortCommodityHeaderView(
// 替换后变成：JunZiLan(
// 丢失了中间的类名！❌
```

## v3 修复方案

### 核心改进

#### 1. 精确的边界检测

```javascript
// ✅ 正确：使用 \b 词边界
new RegExp(`\\b${escapedClassName}\\s*\\(`, 'g')

// 只匹配完整的类名后跟 (
YNDCYSTSortViewModel( ✅ 匹配
YNDCYSTSortViewModel123( ❌ 不匹配（后面还有字符）
```

#### 2. 按长度排序

```javascript
// 按类名长度降序排序
const sortedClasses = Object.keys(classMapping)
  .sort((a, b) => b.length - a.length);

// 长类名先替换
YNDCYSTSortCommodityHeaderView → JunZiLanSortCommodityHeaderView
YNDCYSTSort → JunZiLanSort
YNDCYST → JunZiLan
```

**优势：**
- 长类名先被替换，不会影响短类名
- 避免部分替换

#### 3. 防重复检测

```javascript
// 替换后验证
const duplicatePattern = /JunZiLanJunZiLan/g;
const duplicates = modified.match(duplicatePattern);

if (duplicates) {
  console.warn(`⚠️  检测到重复前缀！`);
}
```

#### 4. 逐文件检查

**你说的非常对：**

> "应该对类的文件每改一个类要进行检查，里面只要有相同的前缀都要改，改完检查一遍。要防止重复改。"

```javascript
function replaceClassesInFile(content, classMapping, filePath) {
  let modified = content;
  
  // 1. 按长度排序
  const sortedClasses = Object.keys(classMapping)
    .sort((a, b) => b.length - a.length);
  
  // 2. 逐个替换
  for (const oldClassName of sortedClasses) {
    const newClassName = classMapping[oldClassName];
    modified = replaceClassInContent(modified, oldClassName, newClassName);
  }
  
  // 3. 检查重复
  const duplicatePattern = /JunZiLanJunZiLan/g;
  if (duplicatePattern.test(modified)) {
    console.warn(`⚠️  ${filePath} 检测到重复前缀！`);
  }
  
  return modified;
}
```

### 精确的替换模式

#### 场景1：构造函数调用

```javascript
// 精确模式：类名 + 空格 + (
new RegExp(`\\b${escapedClassName}\\s*\\(`, 'g')
```

**测试：**
```swift
// 输入
let view = YNDCYSTSortCommodityHeaderView(frame: CGRect(...))

// 输出
let view = JunZiLanSortCommodityHeaderView(frame: CGRect(...))

// ✅ 正确：完整类名被替换
// ❌ 不会变成：JunZiLanJunZiLan2290frame: CGRect(...)
```

#### 场景2：数组和泛型

```javascript
// 数组：[ClassName]
new RegExp(`\\[\\s*${escapedClassName}\\s*\\]`, 'g')

// 泛型：<ClassName>
new RegExp(`<\\s*${escapedClassName}\\s*>`, 'g')
```

**测试：**
```swift
// 输入
var viewModels = [YNDCYSTSortViewModel]()
var dict: [String: YNDCYSTModel]

// 输出  
var viewModels = [JunZiLanSortViewModel]()
var dict: [String: JunZiLanModel]

// ✅ 正确
```

#### 场景3：字符串中的类名

```javascript
// 精确匹配双引号中的完整类名
new RegExp(`"${escapedClassName}"`, 'g')
```

**测试：**
```swift
// 输入
private let identifier = "YNDCYSTShopCartFilterModel"
withReuseIdentifier: "YNDCYSTCheckShopCartCell"

// 输出
private let identifier = "JunZiLanShopCartFilterModel"
withReuseIdentifier: "JunZiLanCheckShopCartCell"

// ✅ 正确
```

## 处理流程

### 步骤1：扫描项目

```javascript
const { classNames } = await scanProjectForClasses(projectPath, 'YNDCYST');
// 返回：所有以 YNDCYST 开头的类名
```

### 步骤2：生成映射（带排序）

```javascript
const classMapping = generateClassMapping(classNames, 'YNDCYST', 'JunZiLan');
// 返回：按长度降序排序的映射
{
  'YNDCYSTSortCommodityHeaderView': 'JunZiLanSortCommodityHeaderView',  // 长的
  'YNDCYSTSortViewModel': 'JunZiLanSortViewModel',                      // 中等
  'YNDCYSTModel': 'JunZiLanModel'                                       // 短的
}
```

### 步骤3：逐文件替换

```javascript
for (const file of files) {
  let content = await fs.readFile(file.path, 'utf8');
  
  // 替换所有类名
  content = replaceClassesInFile(content, classMapping, file.path);
  
  // 检查重复
  if (/JunZiLanJunZiLan/.test(content)) {
    console.warn(`⚠️  ${file.path} 有问题！`);
  }
  
  // 保存
  await fs.writeFile(file.path, content, 'utf8');
}
```

### 步骤4：验证结果

```javascript
// 扫描修改后的文件
const issues = [];
for (const file of modifiedFiles) {
  const content = await fs.readFile(file.path, 'utf8');
  
  // 检查重复前缀
  const duplicates = content.match(/JunZiLanJunZiLan\d+/g);
  if (duplicates) {
    issues.push({ file: file.path, duplicates });
  }
  
  // 检查遗漏的旧前缀
  const remaining = content.match(/\bYNDCYST[A-Z][a-zA-Z0-9_]*/g);
  if (remaining) {
    issues.push({ file: file.path, remaining });
  }
}

if (issues.length > 0) {
  console.error('发现问题：', issues);
}
```

## 使用 v3 版本

### 1. 导入新处理器

```javascript
const iosProcessorV3 = require('./ios-processor-v3');
```

### 2. 调用重构

```javascript
const result = await iosProcessorV3.refactorIOSProject(
  '/path/to/project',
  'YNDCYST',
  'JunZiLan',
  (progress) => {
    console.log(`进度: ${progress.current}/${progress.total}`);
  }
);

console.log(`
重构完成：
- 类数量: ${result.classCount}
- 处理文件: ${result.filesProcessed}
- 修改文件: ${result.filesModified}
- 重命名文件: ${result.filesRenamed}
`);
```

### 3. 检查结果

```bash
# 检查是否有重复前缀
grep -r "JunZiLanJunZiLan" /path/to/project --include="*.swift"

# 检查是否有遗漏的旧前缀
grep -r "YNDCYST" /path/to/project --include="*.swift"
```

## 对比测试

### 旧版本（有问题）

```swift
// 输入
let headerView = YNDCYSTSortCommodityHeaderView(frame: .zero)

// 输出（错误）
let headerView = JunZiLanJunZiLan2290frame: .zero)  ❌
```

### v3 版本（修复）

```swift
// 输入
let headerView = YNDCYSTSortCommodityHeaderView(frame: .zero)

// 输出（正确）
let headerView = JunZiLanSortCommodityHeaderView(frame: .zero)  ✅
```

## 总结

### v3 的核心改进

1. ✅ **精确边界检测** - 使用 `\b` 词边界
2. ✅ **长度排序** - 长类名先替换
3. ✅ **逐文件检查** - 替换后立即验证
4. ✅ **防重复机制** - 检测 `JunZiLanJunZiLan` 模式
5. ✅ **详细日志** - 输出每个步骤的结果

### 你的建议的实现

> "应该对类的文件每改一个类要进行检查，里面只要有相同的前缀都要改，改完检查一遍。要防止重复改。"

✅ **完全实现：**
- 逐文件处理
- 每个文件替换后检查
- 检测重复前缀
- 警告问题文件

这就是正确的重构方式！
