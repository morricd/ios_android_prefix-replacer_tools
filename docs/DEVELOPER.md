# Swift 类前缀替换工具 - 开发者文档

## 📁 项目结构

```
prefix-replacer/
├── main.js              # 主进程 - 处理文件系统操作和 IPC 通信
├── renderer.js          # 渲染进程 - UI 逻辑和用户交互
├── index.html           # 应用界面 HTML
├── styles.css           # 样式文件
├── package.json         # npm 配置和依赖
├── README.md            # 用户使用文档
├── install.sh           # 安装脚本
├── start.sh             # 启动脚本
└── DEVELOPER.md         # 本文档
```

## 🔧 核心功能模块

### 1. main.js - 主进程

**主要功能：**
- 创建应用窗口
- 处理文件夹选择对话框
- 文件扫描和遍历
- Swift 文件内容替换
- 文件复制和重命名

**关键函数：**

```javascript
// 递归获取所有文件
async function getAllFiles(dirPath, arrayOfFiles = [])

// 处理 Swift 文件的核心函数
async function processSwiftFile(sourcePath, targetPath, oldPrefix, newPrefix)
```

**IPC 通信接口：**
- `select-source-folder` - 选择源文件夹
- `select-target-folder` - 选择目标文件夹
- `scan-files` - 扫描文件
- `process-files` - 执行替换

### 2. renderer.js - 渲染进程

**主要功能：**
- 用户界面交互
- 显示扫描结果
- 显示处理进度
- 错误处理和提示

**主要事件监听器：**
- 文件夹选择按钮
- 扫描按钮
- 处理按钮
- 进度更新

### 3. 正则表达式替换规则

在 `main.js` 的 `processSwiftFile` 函数中定义了多个正则表达式：

```javascript
const patterns = [
  // class OldPrefixClassName
  new RegExp(`\\b(class\\s+)(${oldPrefix})([A-Z][a-zA-Z0-9_]*)\\b`, 'g'),
  
  // struct OldPrefixStructName
  new RegExp(`\\b(struct\\s+)(${oldPrefix})([A-Z][a-zA-Z0-9_]*)\\b`, 'g'),
  
  // ... 更多模式
];
```

## 🛠️ 常见修改需求

### 1. 添加新的文件类型支持

**场景：** 需要处理 Objective-C 文件 (.h, .m)

**修改位置：** `main.js` 中的 `process-files` handler

```javascript
// 在 process-files handler 中修改
if (filePath.endsWith('.swift') || filePath.endsWith('.h') || filePath.endsWith('.m')) {
  // 处理文件
  await processSwiftFile(filePath, targetFilePath, oldPrefix, newPrefix);
  results.processed++;
}
```

**添加新的处理函数：**

```javascript
// 在 main.js 中添加
async function processObjCFile(sourcePath, targetPath, oldPrefix, newPrefix) {
  let content = await fs.readFile(sourcePath, 'utf8');
  
  // Objective-C 特定的替换规则
  const patterns = [
    // @interface OldPrefixClass
    new RegExp(`(@interface\\s+)(${oldPrefix})([A-Z][a-zA-Z0-9_]*)\\b`, 'g'),
    // @implementation OldPrefixClass
    new RegExp(`(@implementation\\s+)(${oldPrefix})([A-Z][a-zA-Z0-9_]*)\\b`, 'g'),
    // @protocol OldPrefixProtocol
    new RegExp(`(@protocol\\s+)(${oldPrefix})([A-Z][a-zA-Z0-9_]*)\\b`, 'g'),
    // ... 更多规则
  ];
  
  patterns.forEach(pattern => {
    content = content.replace(pattern, (match, prefix, oldPref, className) => {
      return prefix + newPrefix + className;
    });
  });
  
  // 处理文件名
  const fileName = path.basename(targetPath);
  let newTargetPath = targetPath;
  if (fileName.startsWith(oldPrefix)) {
    const newFileName = fileName.replace(oldPrefix, newPrefix);
    newTargetPath = path.join(path.dirname(targetPath), newFileName);
  }
  
  await fs.writeFile(newTargetPath, content, 'utf8');
}
```

### 2. 添加排除特定文件/文件夹的功能

**修改位置：** `main.js` 的 `getAllFiles` 函数

```javascript
async function getAllFiles(dirPath, arrayOfFiles = [], excludePatterns = []) {
  const files = await fs.readdir(dirPath);
  
  for (const file of files) {
    const filePath = path.join(dirPath, file);
    
    // 检查是否应该排除
    const shouldExclude = excludePatterns.some(pattern => {
      if (typeof pattern === 'string') {
        return file === pattern;
      } else if (pattern instanceof RegExp) {
        return pattern.test(file);
      }
      return false;
    });
    
    if (shouldExclude) continue;
    
    // ... 原有逻辑
  }
  
  return arrayOfFiles;
}
```

**在界面添加排除配置：**

在 `index.html` 中添加：
```html
<div class="input-group">
  <label for="excludePatterns">排除文件/文件夹 (用逗号分隔):</label>
  <input type="text" id="excludePatterns" placeholder="例如: Tests,Demo,*.txt">
</div>
```

### 3. 添加预览功能

**场景：** 在执行替换前预览将要修改的内容

**修改位置：** 添加新的 IPC handler 到 `main.js`

```javascript
// 在 main.js 中添加
ipcMain.handle('preview-changes', async (event, options) => {
  const { sourcePath, oldPrefix, newPrefix } = options;
  
  const previews = [];
  const allFiles = await getAllFiles(sourcePath);
  const swiftFiles = allFiles.filter(f => f.endsWith('.swift'));
  
  // 只预览前 5 个文件
  for (const filePath of swiftFiles.slice(0, 5)) {
    const content = await fs.readFile(filePath, 'utf8');
    const relativePath = path.relative(sourcePath, filePath);
    
    // 查找所有匹配的行
    const lines = content.split('\n');
    const matches = [];
    
    lines.forEach((line, index) => {
      if (line.includes(oldPrefix)) {
        const newLine = line.replace(
          new RegExp(`\\b${oldPrefix}([A-Z][a-zA-Z0-9_]*)\\b`, 'g'),
          `${newPrefix}$1`
        );
        
        if (line !== newLine) {
          matches.push({
            lineNumber: index + 1,
            oldLine: line.trim(),
            newLine: newLine.trim()
          });
        }
      }
    });
    
    if (matches.length > 0) {
      previews.push({
        file: relativePath,
        changes: matches
      });
    }
  }
  
  return { success: true, previews };
});
```

**在 renderer.js 中添加预览按钮事件：**

```javascript
previewBtn.addEventListener('click', async () => {
  const oldPrefix = oldPrefixInput.value.trim();
  const newPrefix = newPrefixInput.value.trim();
  
  const result = await ipcRenderer.invoke('preview-changes', {
    sourcePath,
    oldPrefix,
    newPrefix
  });
  
  if (result.success) {
    displayPreview(result.previews);
  }
});

function displayPreview(previews) {
  let html = '<div class="preview-results"><h3>预览前 5 个文件的修改</h3>';
  
  previews.forEach(preview => {
    html += `<div class="preview-file">
      <h4>${preview.file}</h4>
      <div class="changes">`;
    
    preview.changes.forEach(change => {
      html += `
        <div class="change-item">
          <div class="line-number">行 ${change.lineNumber}</div>
          <div class="old-line">- ${change.oldLine}</div>
          <div class="new-line">+ ${change.newLine}</div>
        </div>
      `;
    });
    
    html += '</div></div>';
  });
  
  html += '</div>';
  resultsDiv.innerHTML = html;
}
```

### 4. 添加日志输出功能

**场景：** 生成详细的操作日志文件

**修改位置：** `main.js` 的 `process-files` handler

```javascript
ipcMain.handle('process-files', async (event, options) => {
  const { sourcePath, targetPath, oldPrefix, newPrefix } = options;
  
  const logFile = path.join(targetPath, 'replacement-log.txt');
  const log = [];
  
  log.push('='.repeat(60));
  log.push('Swift 类前缀替换日志');
  log.push('='.repeat(60));
  log.push(`时间: ${new Date().toLocaleString()}`);
  log.push(`源文件夹: ${sourcePath}`);
  log.push(`目标文件夹: ${targetPath}`);
  log.push(`旧前缀: ${oldPrefix}`);
  log.push(`新前缀: ${newPrefix}`);
  log.push('='.repeat(60));
  log.push('');
  
  try {
    const results = {
      processed: 0,
      copied: 0,
      errors: [],
      files: []
    };
    
    const allFiles = await getAllFiles(sourcePath);
    
    for (const filePath of allFiles) {
      const relativePath = path.relative(sourcePath, filePath);
      const targetFilePath = path.join(targetPath, relativePath);
      
      await fs.ensureDir(path.dirname(targetFilePath));
      
      try {
        if (filePath.endsWith('.swift')) {
          await processSwiftFile(filePath, targetFilePath, oldPrefix, newPrefix);
          results.processed++;
          log.push(`[处理] ${relativePath}`);
        } else {
          await fs.copy(filePath, targetFilePath);
          results.copied++;
          log.push(`[复制] ${relativePath}`);
        }
      } catch (error) {
        results.errors.push({ file: relativePath, error: error.message });
        log.push(`[错误] ${relativePath}: ${error.message}`);
      }
    }
    
    log.push('');
    log.push('='.repeat(60));
    log.push('处理完成');
    log.push(`处理的 Swift 文件: ${results.processed}`);
    log.push(`复制的其他文件: ${results.copied}`);
    log.push(`错误数量: ${results.errors.length}`);
    log.push('='.repeat(60));
    
    // 写入日志文件
    await fs.writeFile(logFile, log.join('\n'), 'utf8');
    
    return { success: true, results, logFile };
    
  } catch (error) {
    log.push('');
    log.push(`[致命错误] ${error.message}`);
    await fs.writeFile(logFile, log.join('\n'), 'utf8');
    return { success: false, error: error.message };
  }
});
```

### 5. 添加配置文件支持

**场景：** 保存常用的配置

**创建配置文件：** 在项目根目录创建 `config.json`

```json
{
  "recentProjects": [],
  "excludePatterns": ["Pods", "build", ".git"],
  "replacementPairs": [
    { "old": "ABC", "new": "XYZ" },
    { "old": "MY", "new": "APP" }
  ]
}
```

**在 main.js 中添加配置加载：**

```javascript
const configPath = path.join(app.getPath('userData'), 'config.json');

async function loadConfig() {
  try {
    const data = await fs.readFile(configPath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return {
      recentProjects: [],
      excludePatterns: ['Pods', 'build', '.git'],
      replacementPairs: []
    };
  }
}

async function saveConfig(config) {
  await fs.writeFile(configPath, JSON.stringify(config, null, 2), 'utf8');
}

ipcMain.handle('load-config', async () => {
  return await loadConfig();
});

ipcMain.handle('save-config', async (event, config) => {
  await saveConfig(config);
  return { success: true };
});
```

### 6. 改进替换算法

**场景：** 更精确的替换，避免误替换

**当前问题：**
- 可能会替换注释中的内容
- 可能会替换字符串字面量中的内容

**改进方案：**

```javascript
async function processSwiftFile(sourcePath, targetPath, oldPrefix, newPrefix) {
  let content = await fs.readFile(sourcePath, 'utf8');
  
  // 方法1: 使用 Swift 语法解析器（需要安装额外依赖）
  // 这里使用简单的状态机来避免替换注释和字符串
  
  const lines = content.split('\n');
  const processedLines = [];
  
  for (let line of lines) {
    // 跳过单行注释
    if (line.trim().startsWith('//')) {
      processedLines.push(line);
      continue;
    }
    
    // 跳过多行注释内的内容（简化处理）
    if (line.includes('/*') || line.includes('*/')) {
      processedLines.push(line);
      continue;
    }
    
    // 处理字符串字面量
    // 分割字符串和代码部分
    const parts = [];
    let inString = false;
    let currentPart = '';
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"' && (i === 0 || line[i-1] !== '\\')) {
        if (inString) {
          currentPart += char;
          parts.push({ type: 'string', value: currentPart });
          currentPart = '';
          inString = false;
        } else {
          if (currentPart) {
            parts.push({ type: 'code', value: currentPart });
          }
          currentPart = char;
          inString = true;
        }
      } else {
        currentPart += char;
      }
    }
    
    if (currentPart) {
      parts.push({ 
        type: inString ? 'string' : 'code', 
        value: currentPart 
      });
    }
    
    // 只替换代码部分
    const processedParts = parts.map(part => {
      if (part.type === 'code') {
        return part.value.replace(
          new RegExp(`\\b${oldPrefix}([A-Z][a-zA-Z0-9_]*)\\b`, 'g'),
          `${newPrefix}$1`
        );
      }
      return part.value;
    });
    
    processedLines.push(processedParts.join(''));
  }
  
  content = processedLines.join('\n');
  
  // 文件重命名逻辑
  const fileName = path.basename(targetPath);
  let newTargetPath = targetPath;
  if (fileName.startsWith(oldPrefix)) {
    const newFileName = fileName.replace(oldPrefix, newPrefix);
    newTargetPath = path.join(path.dirname(targetPath), newFileName);
  }
  
  await fs.writeFile(newTargetPath, content, 'utf8');
}
```

## 🎨 界面修改

### 修改样式

在 `styles.css` 中可以修改：

- **主题颜色：** 搜索 `#667eea` 和 `#764ba2` 替换为你喜欢的颜色
- **字体：** 修改 `font-family` 属性
- **布局：** 调整 `.container`、`.section` 等类的 padding 和 margin

### 添加新的UI组件

在 `index.html` 中添加新元素，然后在 `renderer.js` 中添加对应的事件处理。

## 🐛 调试技巧

### 1. 开启开发者工具

在 `main.js` 中取消注释：

```javascript
mainWindow.webContents.openDevTools();
```

### 2. 添加日志输出

```javascript
console.log('调试信息:', variable);
```

### 3. 使用 VS Code 调试

创建 `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Debug Electron",
      "type": "node",
      "request": "launch",
      "runtimeExecutable": "${workspaceFolder}/node_modules/.bin/electron",
      "windows": {
        "runtimeExecutable": "${workspaceFolder}/node_modules/.bin/electron.cmd"
      },
      "args": ["."],
      "outputCapture": "std"
    }
  ]
}
```

## 📦 打包配置

修改 `package.json` 中的 `build` 配置：

```json
{
  "build": {
    "appId": "com.yourcompany.swiftprefixreplacer",
    "productName": "Swift Prefix Replacer",
    "mac": {
      "category": "public.app-category.developer-tools",
      "icon": "icon.icns",
      "target": ["dmg", "zip"]
    }
  }
}
```

## 🤝 贡献指南

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

## 📞 技术支持

- Electron 文档: https://www.electronjs.org/docs
- Node.js 文档: https://nodejs.org/docs
- fs-extra 文档: https://github.com/jprichardson/node-fs-extra

## 常见问题

**Q: 如何添加更多的替换规则？**
A: 在 `main.js` 的 `processSwiftFile` 函数中的 `patterns` 数组添加新的正则表达式。

**Q: 如何优化大文件的处理速度？**
A: 可以使用流式读写，或者使用 Worker 线程进行并行处理。

**Q: 如何支持撤销操作？**
A: 可以在处理前创建备份，或者集成 Git 来跟踪更改。

祝你开发顺利！🚀
