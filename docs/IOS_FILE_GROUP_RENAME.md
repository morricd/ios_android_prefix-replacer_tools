# iOS 文件和 Xcode Group 重命名功能

## 🎯 功能说明

为 iOS 项目提供文件名和 Xcode Group 名称的批量重命名功能，确保项目结构的完整性。

## 🔧 使用方法

### 1. 启用功能

在 iOS 配置界面中：
1. 输入旧前缀和新前缀（必填）
2. 勾选 **"同时重命名文件和 Xcode Group（可选）"**
3. 选择源文件夹和目标文件夹
4. 点击"开始执行替换"

### 2. 处理内容

**文件重命名：**
- 重命名所有以旧前缀开头的文件
- 包括：.swift, .h, .m, .xib, .storyboard 等所有文件

**Group 重命名：**
- 更新 Xcode 项目中的 Group 名称
- 修改 .pbxproj 文件中的引用
- 保持项目结构完整

## 📊 示例

### 文件重命名

**重命名前：**
```
MyProject/
├── ABCViewController.swift
├── ABCModel.swift
├── ABCNetworkManager.swift
├── ABCConstants.swift
├── UserViewController.swift  # 不以 ABC 开头，不会重命名
└── ABCViews/
    ├── ABCCustomView.swift
    └── ABCTableViewCell.swift
```

**重命名后（ABC → XYZ）：**
```
MyProject/
├── XYZViewController.swift      ✅ 已重命名
├── XYZModel.swift              ✅ 已重命名
├── XYZNetworkManager.swift     ✅ 已重命名
├── XYZConstants.swift          ✅ 已重命名
├── UserViewController.swift    ⏭️ 未改变
└── XYZViews/                   ✅ Group 已重命名
    ├── XYZCustomView.swift     ✅ 已重命名
    └── XYZTableViewCell.swift  ✅ 已重命名
```

### Xcode Group 重命名

**project.pbxproj 修改：**

**修改前：**
```
/* ABCControllers */
{
    isa = PBXGroup;
    children = (
        "ABCViewController.swift",
        "ABCDetailViewController.swift",
    );
    path = ABCControllers;
    sourceTree = "<group>";
};

/* ABCModels */
{
    isa = PBXGroup;
    children = (
        "ABCUser.swift",
        "ABCProduct.swift",
    );
    name = ABCModels;
    sourceTree = "<group>";
};
```

**修改后：**
```
/* XYZControllers */
{
    isa = PBXGroup;
    children = (
        "XYZViewController.swift",       ✅ 文件引用已更新
        "XYZDetailViewController.swift", ✅ 文件引用已更新
    );
    path = XYZControllers;              ✅ Group path 已更新
    sourceTree = "<group>";
};

/* XYZModels */
{
    isa = PBXGroup;
    children = (
        "XYZUser.swift",                 ✅ 文件引用已更新
        "XYZProduct.swift",              ✅ 文件引用已更新
    );
    name = XYZModels;                   ✅ Group name 已更新
    sourceTree = "<group>";
};
```

## 🎯 处理规则

### 文件重命名规则

只重命名**以旧前缀开头**的文件：

```
ABC + ViewController.swift → XYZ + ViewController.swift  ✅
ABC + Model.swift → XYZ + Model.swift                    ✅
UserViewController.swift → UserViewController.swift      ⏭️ 不变
Helper.swift → Helper.swift                              ⏭️ 不变
```

### Group 重命名规则

**1. 替换 Group 的 path 属性：**
```
path = ABCViews; → path = XYZViews;
path = ABCControllers; → path = XYZControllers;
```

**2. 替换 Group 的 name 属性：**
```
name = ABCModels; → name = XYZModels;
name = ABCServices; → name = XYZServices;
```

**3. 更新文件引用：**
```
path = ABCViewController.swift; → path = XYZViewController.swift;
path = ABCModel.swift; → path = XYZModel.swift;
```

## ✅ 完整处理流程

### 1. 扫描和重命名文件

```
正在扫描项目...
找到 15 个以 ABC 开头的文件

重命名文件：
✅ ABCViewController.swift → XYZViewController.swift
✅ ABCModel.swift → XYZModel.swift
✅ ABCNetworkManager.swift → XYZNetworkManager.swift
...

完成：重命名了 15 个文件
```

### 2. 更新 Xcode 项目

```
正在更新 Xcode 项目文件...
找到 1 个 .pbxproj 文件

更新 Group：
✅ ABCControllers → XYZControllers
✅ ABCViews → XYZViews
✅ ABCModels → XYZModels

更新文件引用：
✅ 更新了 15 个文件引用

完成：已更新 MyProject.xcodeproj/project.pbxproj
```

### 3. 完成

```
✅ 处理完成！

统计：
- 处理文件：45 个
- 重命名文件：15 个
- 更新 Group：3 个
- 更新引用：15 个
```

## 📝 使用场景

### 场景 1: 重命名整个项目前缀

**原因：** 项目从 ABC 公司转到 XYZ 公司

**操作：**
1. 旧前缀：ABC
2. 新前缀：XYZ
3. ✅ 勾选"重命名文件和 Group"

**结果：**
- 所有 ABC*.swift 文件重命名为 XYZ*.swift
- Xcode 中的 ABCControllers 等 Group 重命名
- 项目可以正常打开和编译

### 场景 2: 只修改代码，不改文件名

**原因：** 只想改代码中的类名，保持文件名不变

**操作：**
1. 旧前缀：ABC
2. 新前缀：XYZ
3. ❌ 不勾选"重命名文件和 Group"

**结果：**
- Swift 代码中的类名改为 XYZ
- 文件名保持为 ABC*.swift
- Xcode Group 名称不变

## ⚠️ 重要注意事项

### 1. 备份项目

**强烈建议：**
```bash
# 方法 1: 使用 Git
git add .
git commit -m "备份：重命名前的状态"

# 方法 2: 复制整个项目
cp -r MyProject MyProject.backup
```

### 2. 关闭 Xcode

处理前必须关闭 Xcode：
```
1. 保存所有更改
2. 完全退出 Xcode
3. 运行重命名工具
4. 完成后重新打开项目
```

### 3. 处理后步骤

```bash
# 1. 重新打开项目
open MyProject.xcodeproj

# 2. 清理构建
Product → Clean Build Folder (⌘⇧K)

# 3. 重新编译
Product → Build (⌘B)
```

### 4. 可能的问题

**问题 1: Xcode 中文件显示红色**

**原因：** 文件被重命名，但 Xcode 缓存未更新

**解决：**
```
1. 完全退出 Xcode
2. 删除 DerivedData
   rm -rf ~/Library/Developer/Xcode/DerivedData
3. 重新打开项目
```

**问题 2: 某些 Group 未重命名**

**原因：** Group 名称不是以旧前缀开头

**解决：** 手动在 Xcode 中重命名这些 Group

**问题 3: 编译错误**

**原因：** 某些硬编码的文件名引用

**解决：** 
```
1. 检查 Info.plist
2. 检查 Build Settings 中的自定义路径
3. 检查资源文件引用
```

## 🔍 验证方法

### 1. 检查文件系统

```bash
# 查看重命名的文件
find . -name "XYZ*.swift"

# 确认旧文件不存在
find . -name "ABC*.swift"
```

### 2. 检查 Xcode 项目

```bash
# 查看 .pbxproj 文件
cat MyProject.xcodeproj/project.pbxproj | grep "ABC"
# 应该没有输出（除了注释）

cat MyProject.xcodeproj/project.pbxproj | grep "XYZ"
# 应该看到新的引用
```

### 3. 在 Xcode 中验证

1. 打开项目
2. 检查 Project Navigator
3. 确认 Group 名称已更新
4. 确认文件可以正常打开
5. 尝试编译项目

## 🎉 总结

文件和 Group 重命名功能：

- ✅ **自动化** - 批量重命名，节省时间
- ✅ **完整性** - 同步更新文件和 Xcode 引用
- ✅ **安全性** - 只重命名以指定前缀开头的文件
- ✅ **可选性** - 可以选择是否启用
- ✅ **智能化** - 自动更新 .pbxproj 文件

适合项目重命名、品牌更换等场景！
