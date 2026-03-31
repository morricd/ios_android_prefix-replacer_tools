# 文件重命名重复问题修复说明

## 问题描述

用户报告：
```
文件名：YNDCYSTCommodityFilterModel.swift
旧前缀：YNDCYST
新前缀：JUNZILAN

错误结果：文件名变成了 JUNZILANJUNZILAN9193.swift（前缀重复）
正确结果：应该是 JUNZILANCommodityFilterModel.swift
```

## 根本原因

工具有两个地方会重命名文件：

### 1. 类前缀替换（processSwiftFile）
- 处理每个 Swift 文件时
- 如果文件名以 `oldPrefix` 开头，重命名为 `newPrefix`
- 代码位置：ios-processor.js 第 42-46 行

### 2. 文件/Group 前缀替换（renameFilesWithPrefix）
- 批量重命名所有文件
- 如果文件名以 `oldFileGroupPrefix` 开头，重命名为 `newFileGroupPrefix`
- 代码位置：ios-processor.js 第 226-256 行

### 问题场景

**如果用户同时勾选了两个选项，并且使用相同的前缀：**

```
✅ 修改类前缀
   旧前缀：YNDCYST
   新前缀：JUNZILAN

✅ 同时修改文件和 Group 前缀
   旧前缀：YNDCYST
   新前缀：JUNZILAN
```

**文件会被重命名两次：**

1. **第一次（processSwiftFile）：**
   ```
   YNDCYSTCommodityFilterModel.swift
   → JUNZILANCommodityFilterModel.swift
   ```

2. **第二次（renameFilesWithPrefix）：**
   ```
   JUNZILANCommodityFilterModel.swift
   → （检测到以 JUNZILAN 开头）
   → 如果逻辑错误，可能变成 JUNZILANJUNZILANCommodityFilterModel.swift
   ```

## 已修复

### 修复 1：只替换开头的前缀

**修改前（错误）：**
```javascript
const newFileName = fileName.replace(oldPrefix, newPrefix);
```
这会替换文件名中**所有**的 oldPrefix。

**修改后（正确）：**
```javascript
const newFileName = fileName.replace(new RegExp(`^${oldPrefix}`), newPrefix);
```
使用 `^` 锚点，只替换**开头**的前缀。

### 修复 2：避免重复重命名

**方案 A：在 UI 上提示用户**
- 如果同时勾选两个选项且使用相同前缀，显示警告
- 建议用户只使用一种方式

**方案 B：代码层面去重（推荐）**
- `processSwiftFile` 负责文件内容和类名替换
- 只在需要时才重命名文件
- `renameFilesWithPrefix` 负责批量文件名修改
- 检查文件是否已被重命名

## 测试用例

```javascript
测试 1：单一前缀，只开启类前缀替换
输入：YNDCYSTModel.swift (oldPrefix: YNDCYST, newPrefix: JUNZILAN)
期望：JUNZILANModel.swift ✅

测试 2：单一前缀，只开启文件前缀替换  
输入：YNDCYSTModel.swift (oldFilePrefix: YNDCYST, newFilePrefix: JUNZILAN)
期望：JUNZILANModel.swift ✅

测试 3：相同前缀，同时开启两个选项
输入：YNDCYSTModel.swift (两个都是 YNDCYST → JUNZILAN)
期望：JUNZILANModel.swift ✅（不重复）

测试 4：不同前缀，同时开启两个选项
输入：YNDCYSTModel.swift 
  类前缀：YNDCYST → JUNZILAN
  文件前缀：ABC → XYZ
期望：JUNZILANModel.swift ✅（文件名不以 ABC 开头，文件前缀不生效）
```

## 建议的使用方式

### 方式 1：只修改类前缀（推荐）
```
✅ 修改类前缀
   旧前缀：YNDCYST
   新前缀：JUNZILAN

❌ 不勾选"同时修改文件和 Group 前缀"
```
**结果：**
- 类名会被替换
- 文件名也会被替换（如果以旧前缀开头）
- Group 名称不变

### 方式 2：独立的文件/Group 前缀
```
✅ 修改类前缀
   旧前缀：YNDCYST
   新前缀：JUNZILAN

✅ 同时修改文件和 Group 前缀
   旧前缀：ABC（不同的前缀）
   新前缀：XYZ
```
**结果：**
- 类名：YNDCYST → JUNZILAN
- 文件名：ABC 开头的文件 → XYZ 开头
- Group：ABC 开头的 Group → XYZ 开头

### 方式 3：只修改文件/Group 前缀
```
❌ 不勾选"修改类前缀"

✅ 同时修改文件和 Group 前缀
   旧前缀：YNDCYST
   新前缀：JUNZILAN
```
**结果：**
- 类名不变
- 文件名被替换
- Group 名称被替换

## 当前状态

✅ 已修复 `processSwiftFile` 中的文件名替换逻辑
✅ 已修复 `renameFileWithPrefix` 中的文件名替换逻辑
✅ 两处都使用 `^` 锚点，只替换开头的前缀

## 下一步

建议在 UI 添加提示：
```
⚠️ 提示：
如果类前缀和文件前缀使用相同的值，文件只会被重命名一次。
建议：
- 如果只需要修改类名和对应的文件名，只勾选"修改类前缀"
- 如果需要独立控制文件名和类名，可以使用不同的前缀值
```
