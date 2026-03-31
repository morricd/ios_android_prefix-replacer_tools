# 调试指南

## 如果按钮没有反应

### 步骤 1: 打开开发者工具

**macOS:**
```
按 Cmd + Option + I
或者菜单: View → Developer → Developer Tools
```

**Windows:**
```
按 F12
或者菜单: View → Developer → Developer Tools
```

### 步骤 2: 查看 Console 标签

正常情况下应该看到以下日志：

```
[Config Manager] Script loaded
[Advanced Config] Script loaded
[Config] Loading all configs...
[Config] iOS variable configs: 0
[Config] Updated select variableConfigSelectIOS with 0 configs
[Config] Android variable configs: 0
[Config] Updated select variableConfigSelectAndroid with 0 configs
[Config] iOS image configs: 0
[Config] Updated select imageConfigSelectIOS with 0 configs
[Config] Android image configs: 0
[Config] Updated select imageConfigSelectAndroid with 0 configs
[Config] All configs loaded
[Config] Attaching events...
[Config] Bound change to variableConfigSelectIOS: Load iOS variable config
[Config] Bound click to saveVariableConfigIOS: Save iOS variable config
[Config] Bound click to deleteVariableConfigIOS: Delete iOS variable config
...
[Config] Events attached
[Config] Initialized
[Advanced Config] Initializing...
[Bind] Success: exportVariableConfigIOS
[Bind] Success: importVariableConfigIOS
...
[Advanced Config] Initialized
```

### 步骤 3: 检查元素是否存在

在 Console 中执行以下命令：

```javascript
// 检查下拉框
document.getElementById('variableConfigSelectIOS')

// 检查保存按钮
document.getElementById('saveVariableConfigIOS')

// 检查导出按钮
document.getElementById('exportVariableConfigIOS')
```

**如果返回 `null`:**
- 元素不存在
- 可能是 ID 写错了
- 或者元素在隐藏区域还未加载

**如果返回 `<select id="...">` 或 `<button id="...">`:**
- 元素存在
- 继续下一步

### 步骤 4: 手动测试事件

在 Console 中执行：

```javascript
// 测试下拉框 change 事件
const select = document.getElementById('variableConfigSelectIOS');
select.addEventListener('change', () => {
  console.log('下拉框变化！选中值:', select.value);
  alert('下拉框 change 事件触发成功！');
});

// 然后手动改变下拉框选项，应该看到日志和弹窗
```

```javascript
// 测试保存按钮
const saveBtn = document.getElementById('saveVariableConfigIOS');
saveBtn.addEventListener('click', () => {
  console.log('保存按钮被点击！');
  alert('保存按钮点击成功！');
});

// 然后点击保存按钮，应该看到弹窗
```

### 步骤 5: 检查是否勾选了选项

**重要：** 下拉框和按钮在隐藏区域中，必须先勾选才能看到！

1. 勾选"修改类变量值（可选）" ✅
2. 然后才能看到配置文件下拉框和按钮
3. 勾选"替换图片资源（可选）" ✅
4. 然后才能看到图片配置

### 步骤 6: 查看错误信息

如果 Console 中有红色的错误信息，请记录下来：

```
Uncaught TypeError: ...
Uncaught ReferenceError: ...
```

## 常见问题

### Q1: 下拉框是空的

**原因：** 还没有保存过配置

**解决：**
1. 先配置一些变量规则
2. 点击"💾 保存"
3. 输入配置名称
4. 保存成功后下拉框会出现配置

### Q2: 点击保存没反应

**检查：**
```javascript
// 在 Console 执行
document.getElementById('saveVariableConfigIOS')
```

如果返回 `null`，说明按钮不存在。

**解决：**
1. 确保已勾选"修改类变量值"
2. 等待 1 秒让脚本加载
3. 查看 Console 是否有 `[Config] Bound click to saveVariableConfigIOS` 日志

### Q3: 点击导出/导入/模板库/分享没反应

**检查 Console 日志：**

应该看到：
```
[Bind] Success: exportVariableConfigIOS
[Bind] Success: importVariableConfigIOS
[Bind] Success: templateVariableConfigIOS
[Bind] Success: shareVariableConfigIOS
```

**如果看到：**
```
[Bind] Failed after 10 attempts: exportVariableConfigIOS
```

说明按钮不存在或 ID 错误。

### Q4: 选择配置后没有加载

**检查：**
1. 下拉框是否真的选中了配置（不是"-- 选择配置文件或新建 --"）
2. Console 是否有 `[Config] Loading config: ...` 日志
3. 是否有错误信息

**手动测试：**
```javascript
// 在 Console 执行
const select = document.getElementById('variableConfigSelectIOS');
console.log('当前选中值:', select.value);

// 如果 value 是空字符串，说明没有选中配置
```

## 获取帮助

如果按照以上步骤仍然无法解决，请提供：

1. Console 中的所有日志（复制粘贴）
2. 点击按钮时的错误信息（如果有）
3. 执行测试命令的结果

这样可以更准确地诊断问题。

## 快速测试脚本

复制以下代码到 Console 中执行，自动测试所有功能：

```javascript
(function() {
  const results = [];
  
  function test(id, description) {
    const element = document.getElementById(id);
    const exists = element !== null;
    results.push(`${exists ? '✅' : '❌'} ${description}: ${id}`);
    return element;
  }
  
  console.log('开始测试...\n');
  
  // 测试 iOS 变量配置
  test('variableConfigSelectIOS', 'iOS 变量配置下拉框');
  test('saveVariableConfigIOS', 'iOS 保存变量配置按钮');
  test('deleteVariableConfigIOS', 'iOS 删除变量配置按钮');
  test('exportVariableConfigIOS', 'iOS 导出变量配置按钮');
  test('importVariableConfigIOS', 'iOS 导入变量配置按钮');
  test('templateVariableConfigIOS', 'iOS 变量模板库按钮');
  test('shareVariableConfigIOS', 'iOS 分享变量配置按钮');
  
  // 测试 iOS 图片配置
  test('imageConfigSelectIOS', 'iOS 图片配置下拉框');
  test('saveImageConfigIOS', 'iOS 保存图片配置按钮');
  test('deleteImageConfigIOS', 'iOS 删除图片配置按钮');
  test('exportImageConfigIOS', 'iOS 导出图片配置按钮');
  test('importImageConfigIOS', 'iOS 导入图片配置按钮');
  test('templateImageConfigIOS', 'iOS 图片模板库按钮');
  test('shareImageConfigIOS', 'iOS 分享图片配置按钮');
  
  // 输出结果
  console.log('\n测试结果:\n');
  results.forEach(r => console.log(r));
  
  const passed = results.filter(r => r.startsWith('✅')).length;
  const failed = results.filter(r => r.startsWith('❌')).length;
  
  console.log(`\n总计: ${passed} 通过, ${failed} 失败`);
  
  if (failed > 0) {
    console.log('\n请确保已勾选"修改类变量值"和"替换图片资源"选项！');
  }
})();
```
