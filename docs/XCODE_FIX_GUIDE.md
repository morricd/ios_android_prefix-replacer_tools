# Xcode 项目引用修复指南

## 问题说明

当你使用工具替换了 Swift 文件的类前缀后，在 Xcode 中可能会看到：
- ❌ 旧的文件名显示为红色（找不到）
- ❌ 新的文件名没有出现在项目导航器中
- ❌ 虽然物理文件已经改名，但 Xcode 还在引用旧文件

这是因为 Xcode 的项目文件（`.xcodeproj/project.pbxproj`）中保存了文件引用，需要手动或自动更新这些引用。

## 解决方案

### 方案 1：使用自动修复脚本（推荐）⭐

我已经为你准备了一个自动修复脚本：`fix-xcode-project.js`

**使用步骤：**

```bash
cd prefix-replacer

# 运行修复脚本
node fix-xcode-project.js

# 按提示输入：
# 1. 项目路径（可以直接拖拽文件夹到终端）
# 2. 旧前缀（例如：ABC）
# 3. 新前缀（例如：XYZ）
```

**脚本会自动：**
- ✅ 查找 `.xcodeproj` 文件
- ✅ 创建备份
- ✅ 更新所有文件引用
- ✅ 替换项目中的类名引用

**完成后：**
1. 关闭 Xcode（如果已打开）
2. 重新打开项目
3. Clean Build Folder（⌘⇧K）
4. 重新构建（⌘B）

### 方案 2：在 Xcode 中手动修复

如果只有少量文件，可以手动修复：

#### 步骤 1：删除旧的引用

1. 在 Xcode 项目导航器中找到红色的文件（找不到的文件）
2. 选中这些文件
3. 按 `Delete` 键
4. 在弹出的对话框中选择 **"Remove Reference"**（只删除引用，不删除物理文件）

#### 步骤 2：添加新的文件

1. 右键点击项目中的文件夹
2. 选择 **"Add Files to [项目名]..."**
3. 在文件选择器中，找到目标文件夹
4. 选中所有新命名的 `.swift` 文件
5. **重要：** 取消勾选 "Copy items if needed"（因为文件已经在正确位置）
6. 勾选 "Create groups"
7. 选择正确的 Target
8. 点击 "Add"

#### 步骤 3：清理和重建

1. Product → Clean Build Folder（⌘⇧K）
2. Product → Build（⌘B）

### 方案 3：直接编辑 project.pbxproj（高级）

**⚠️ 警告：直接编辑项目文件有风险，请先备份！**

```bash
# 1. 关闭 Xcode

# 2. 备份项目文件
cp YourProject.xcodeproj/project.pbxproj YourProject.xcodeproj/project.pbxproj.backup

# 3. 用文本编辑器打开
open -a "Visual Studio Code" YourProject.xcodeproj/project.pbxproj

# 或者用 sed 批量替换（谨慎使用）
cd YourProject.xcodeproj
sed -i '' 's/ABCViewController/XYZViewController/g' project.pbxproj
sed -i '' 's/ABCUserModel/XYZUserModel/g' project.pbxproj
# ... 为每个类重复此操作

# 4. 重新打开 Xcode
```

## 完整的工作流程（推荐）

### 使用更新后的工具（已包含自动修复）

新版本的工具已经包含了自动更新 Xcode 项目文件的功能。

**操作步骤：**

1. **运行工具**
   ```bash
   npm start
   ```

2. **选择文件夹**
   - 源文件夹：选择你的原始项目
   - 目标文件夹：选择一个新的文件夹

3. **输入前缀**
   - 旧前缀：ABC
   - 新前缀：XYZ

4. **扫描和处理**
   - 点击"扫描文件"
   - 点击"开始替换"
   - 工具会自动更新 Xcode 项目文件

5. **在 Xcode 中验证**
   - 关闭 Xcode
   - 打开目标文件夹中的项目
   - Clean Build Folder（⌘⇧K）
   - Build（⌘B）

## 如果已经替换完但忘记更新项目文件

使用修复脚本：

```bash
node fix-xcode-project.js
```

按提示输入项目路径和前缀即可。

## 常见问题

### Q1: 为什么有些文件还是红色的？

**可能原因：**
- 文件路径在项目文件中仍然是旧的
- 文件没有正确复制到目标位置

**解决方法：**
1. 检查文件是否真的存在于目标文件夹
2. 使用修复脚本重新更新引用
3. 或者手动删除引用后重新添加

### Q2: 编译时提示找不到类

**可能原因：**
- 文件没有添加到正确的 Target
- 某些 import 语句没有更新

**解决方法：**
1. 选中文件，在右侧面板检查 Target Membership
2. 检查 import 语句是否正确
3. Clean Build Folder 后重新构建

### Q3: Storyboard 中的类名没有更新

**解决方法：**
1. 打开 Storyboard
2. 选择相关的 View Controller
3. 在 Identity Inspector 中手动修改 Custom Class
4. 或者用文本编辑器打开 `.storyboard` 文件批量替换

### Q4: 如何恢复到原始状态？

**如果使用了修复脚本：**
脚本会自动创建备份文件，文件名类似：
```
project.pbxproj.backup.1675431234567
```

恢复方法：
```bash
cd YourProject.xcodeproj
cp project.pbxproj.backup.1675431234567 project.pbxproj
```

## 最佳实践

### 1. 使用版本控制

在执行替换前：
```bash
git add .
git commit -m "Before prefix replacement"
```

替换后如果有问题：
```bash
git reset --hard HEAD
```

### 2. 小范围测试

先在一个小项目或分支上测试：
- 创建测试分支
- 只替换几个文件
- 验证 Xcode 中是否正常
- 确认无误后再处理整个项目

### 3. 分步骤执行

1. **第一步：** 只替换文件内容（不重命名文件）
2. **第二步：** 验证编译通过
3. **第三步：** 重命名文件并更新引用
4. **第四步：** 再次验证

## 总结

✅ **最简单的方法：** 使用 `fix-xcode-project.js` 自动修复脚本

✅ **最安全的方法：** 先备份或提交到 Git，再使用工具

✅ **最可靠的方法：** 使用更新后的工具（已包含自动修复功能）

如有问题，随时联系！
