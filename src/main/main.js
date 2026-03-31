const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs-extra');

// 导入平台处理模块
const iosProcessor = require('../core/ios-processor');
const androidProcessor = require('../core/android-processor');
const imageReplacer = require('../core/image-replacer');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 900,
    height: 700,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    },
    titleBarStyle: 'hiddenInset',
    title: 'Swift 类前缀替换工具'
  });

  mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
  
  // 开发时打开开发者工具
  // mainWindow.webContents.openDevTools();
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// 选择源文件夹
ipcMain.handle('select-source-folder', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory'],
    title: '选择源文件夹'
  });
  
  if (!result.canceled && result.filePaths.length > 0) {
    return result.filePaths[0];
  }
  return null;
});

// 选择目标文件夹
ipcMain.handle('select-target-folder', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory', 'createDirectory'],
    title: '选择目标文件夹'
  });
  
  if (!result.canceled && result.filePaths.length > 0) {
    return result.filePaths[0];
  }
  return null;
});

// 扫描文件
ipcMain.handle('scan-files', async (event, sourcePath, platform = 'ios', extraOptions = {}) => {
  try {
    const files = await getAllFiles(sourcePath, {
      includePods: platform === 'ios' ? !!extraOptions.includePods : false
    });
    
    let codeFiles, otherFiles;
    
    if (platform === 'ios') {
      codeFiles = files.filter(f => f.endsWith('.swift'));
      otherFiles = files.filter(f => !f.endsWith('.swift'));
    } else { // Android
      // Android 需要处理 .kt, .java 和 .xml 文件
      codeFiles = files.filter(f => 
        f.endsWith('.kt') || 
        f.endsWith('.java') || 
        f.endsWith('.xml')
      );
      otherFiles = files.filter(f => 
        !f.endsWith('.kt') && 
        !f.endsWith('.java') && 
        !f.endsWith('.xml')
      );
    }
    
    return {
      success: true,
      codeFiles: codeFiles.map(f => path.relative(sourcePath, f)),
      otherFiles: otherFiles.map(f => path.relative(sourcePath, f)),
      total: files.length
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
});

// 执行替换
ipcMain.handle('process-files', async (event, options) => {
  const { sourcePath, targetPath, platform = 'ios' } = options;
  
  try {
    // 确保目标文件夹存在
    await fs.ensureDir(targetPath);
    
    const results = {
      processed: 0,
      copied: 0,
      errors: [],
      files: [],
      renamedFiles: [],
      movedDirs: 0,
      packageReorganized: false
    };
    
    const allFiles = await getAllFiles(sourcePath, {
      includePods: platform === 'ios' ? !!options.includePods : false
    });
    
    for (const filePath of allFiles) {
      const relativePath = path.relative(sourcePath, filePath);
      let targetFilePath = path.join(targetPath, relativePath);
      
      // Android: 如果是代码文件且需要重组包目录
      if (platform === 'android' && (filePath.endsWith('.kt') || filePath.endsWith('.java'))) {
        targetFilePath = reorganizeAndroidPackage(
          filePath, 
          sourcePath, 
          targetPath, 
          options.oldPackage, 
          options.newPackage
        );
        results.packageReorganized = true;
      }
      
      // 确保目标目录存在
      await fs.ensureDir(path.dirname(targetFilePath));
      
      try {
        if (platform === 'ios' && filePath.endsWith('.swift')) {
          // 处理 iOS Swift 文件
          const renamedPath = await iosProcessor.processSwiftFile(
            filePath, 
            targetFilePath, 
            options.oldPrefix, 
            options.newPrefix
          );
          results.processed++;
          results.files.push({ type: 'processed', file: relativePath });
          
          if (renamedPath !== targetFilePath) {
            const oldName = path.basename(targetFilePath);
            const newName = path.basename(renamedPath);
            results.renamedFiles.push({
              oldPath: relativePath,
              newPath: path.relative(targetPath, renamedPath),
              oldName: oldName,
              newName: newName
            });
          }
          
        } else if (platform === 'android' && (filePath.endsWith('.kt') || filePath.endsWith('.java'))) {
          // 处理 Android Kotlin/Java 文件
          const renamedPath = await androidProcessor.processAndroidFile(
            filePath,
            targetFilePath,
            options.oldPackage,
            options.newPackage,
            options.hasPrefix ? options.oldPrefix : null,
            options.hasPrefix ? options.newPrefix : null
          );
          results.processed++;
          results.files.push({ type: 'processed', file: relativePath });
          
          if (renamedPath !== targetFilePath) {
            const oldName = path.basename(targetFilePath);
            const newName = path.basename(renamedPath);
            results.renamedFiles.push({
              oldPath: relativePath,
              newPath: path.relative(targetPath, renamedPath),
              oldName: oldName,
              newName: newName
            });
          }
          
        } else if (platform === 'android' && filePath.endsWith('.xml')) {
          // 处理 Android XML 布局文件
          await processAndroidXmlFile(
            filePath,
            targetFilePath,
            options.oldPackage,
            options.newPackage,
            options.hasPrefix ? options.oldPrefix : null,
            options.hasPrefix ? options.newPrefix : null
          );
          results.processed++;
          results.files.push({ type: 'processed', file: relativePath });
          
        } else if (platform === 'android' && (filePath.endsWith('.pro') || filePath.includes('proguard'))) {
          // 处理 Android ProGuard 规则文件
          await processProGuardFile(
            filePath,
            targetFilePath,
            options.oldPackage,
            options.newPackage
          );
          results.processed++;
          results.files.push({ type: 'processed', file: relativePath });
          
        } else {
          // 复制其他文件
          await fs.copy(filePath, targetFilePath);
          results.copied++;
          results.files.push({ type: 'copied', file: relativePath });
        }
        
        // 发送进度更新
        event.sender.send('process-progress', {
          current: results.processed + results.copied,
          total: allFiles.length,
          file: relativePath
        });
        
      } catch (error) {
        results.errors.push({
          file: relativePath,
          error: error.message
        });
      }
    }
    
    // iOS: 处理完所有文件后，更新 Xcode 项目文件
    if (platform === 'ios') {
      event.sender.send('process-progress', {
        current: allFiles.length,
        total: allFiles.length,
        file: '正在更新 Xcode 项目文件...'
      });
      
      await updateXcodeProject(targetPath, options.oldPrefix, options.newPrefix, results.renamedFiles);
    }
    
    // iOS: 重命名文件和 Group（如果勾选了）
    if (platform === 'ios' && options.renameFilesAndGroups) {
      event.sender.send('process-progress', {
        current: allFiles.length,
        total: allFiles.length,
        file: '正在重命名文件和 Group...'
      });
      
      try {
        // 使用独立的文件和 Group 前缀
        const oldFilePrefix = options.oldFileGroupPrefix;
        const newFilePrefix = options.newFileGroupPrefix;
        
        // 重命名文件
        const renamedFiles = await iosProcessor.renameFilesWithPrefix(
          targetPath,
          oldFilePrefix,
          newFilePrefix
        );
        
        // 更新 Xcode Group
        await iosProcessor.renameXcodeGroups(
          targetPath,
          oldFilePrefix,
          newFilePrefix,
          renamedFiles
        );
        
        results.renamedFilesAndGroups = renamedFiles.length;
        console.log(`重命名了 ${renamedFiles.length} 个文件和对应的 Group`);
      } catch (error) {
        console.error('重命名文件和 Group 失败:', error.message);
      }
    }
    
    // iOS: 添加随机代码（如果勾选了）
    if (platform === 'ios' && options.addRandomCode) {
      event.sender.send('process-progress', {
        current: allFiles.length,
        total: allFiles.length,
        file: '正在添加随机代码...'
      });
      
      const swiftFiles = allFiles.filter(f => f.endsWith('.swift'));
      for (const filePath of swiftFiles) {
        const relativePath = path.relative(sourcePath, filePath);
        const targetFilePath = path.join(targetPath, relativePath);
        
        try {
          await iosProcessor.addRandomCodeToSwiftFile(
            targetFilePath,
            options.randomPrefix,
            options.randomMethodCount,
            options.randomVarCount
          );
        } catch (error) {
          console.error(`添加随机代码失败: ${relativePath}`, error.message);
        }
      }
      
      results.randomCodeAdded = swiftFiles.length;
    }
    
    // Android: 更新 Gradle 配置文件
    if (platform === 'android') {
      event.sender.send('process-progress', {
        current: allFiles.length,
        total: allFiles.length,
        file: '正在更新 Android 配置文件...'
      });
      
      await updateAndroidConfig(targetPath, options.oldPackage, options.newPackage);
    }
    
    // Android: 添加随机代码（如果勾选了）
    if (platform === 'android' && options.addRandomCode) {
      event.sender.send('process-progress', {
        current: allFiles.length,
        total: allFiles.length,
        file: '正在添加随机代码...'
      });
      
      const codeFiles = allFiles.filter(f => f.endsWith('.kt') || f.endsWith('.java'));
      for (const filePath of codeFiles) {
        const relativePath = path.relative(sourcePath, filePath);
        let targetFilePath = path.join(targetPath, relativePath);
        
        // 如果文件被重组，需要找到新路径
        if (filePath.endsWith('.kt') || filePath.endsWith('.java')) {
          targetFilePath = reorganizeAndroidPackage(
            filePath,
            sourcePath,
            targetPath,
            options.oldPackage,
            options.newPackage
          );
        }
        
        try {
          await androidProcessor.addRandomCodeToAndroidFile(
            targetFilePath,
            options.randomPrefix,
            options.randomMethodCount,
            options.randomVarCount
          );
        } catch (error) {
          console.error(`添加随机代码失败: ${relativePath}`, error.message);
        }
      }
      
      results.randomCodeAdded = codeFiles.length;
    }
    
    return {
      success: true,
      results
    };
    
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
});

// 递归获取所有文件
async function getAllFiles(dirPath, options = {}, arrayOfFiles = []) {
  const { includePods = false } = options;
  const files = await fs.readdir(dirPath);
  
  for (const file of files) {
    const filePath = path.join(dirPath, file);
    const stat = await fs.stat(filePath);
    
    // 跳过隐藏文件和常见的需要排除的目录
    if (file.startsWith('.') || 
        file === 'build' || 
        file === 'DerivedData' ||
        file === 'node_modules') {
      continue;
    }

    if (file === 'Pods' && !includePods) {
      continue;
    }
    
    if (stat.isDirectory()) {
      arrayOfFiles = await getAllFiles(filePath, options, arrayOfFiles);
    } else {
      arrayOfFiles.push(filePath);
    }
  }
  
  return arrayOfFiles;
}

// 处理 Swift 文件
async function processSwiftFile(sourcePath, targetPath, oldPrefix, newPrefix) {
  let content = await fs.readFile(sourcePath, 'utf8');
  
  // 替换类名、结构体名、枚举名、协议名等
  // 使用单词边界确保精确匹配
  const patterns = [
    // class OldPrefixClassName
    new RegExp(`\\b(class\\s+)(${oldPrefix})([A-Z][a-zA-Z0-9_]*)\\b`, 'g'),
    // struct OldPrefixStructName
    new RegExp(`\\b(struct\\s+)(${oldPrefix})([A-Z][a-zA-Z0-9_]*)\\b`, 'g'),
    // enum OldPrefixEnumName
    new RegExp(`\\b(enum\\s+)(${oldPrefix})([A-Z][a-zA-Z0-9_]*)\\b`, 'g'),
    // protocol OldPrefixProtocolName
    new RegExp(`\\b(protocol\\s+)(${oldPrefix})([A-Z][a-zA-Z0-9_]*)\\b`, 'g'),
    // extension OldPrefixClassName
    new RegExp(`\\b(extension\\s+)(${oldPrefix})([A-Z][a-zA-Z0-9_]*)\\b`, 'g'),
    // typealias OldPrefixTypeName
    new RegExp(`\\b(typealias\\s+)(${oldPrefix})([A-Z][a-zA-Z0-9_]*)\\b`, 'g'),
    // : OldPrefixProtocol (继承、遵循协议)
    new RegExp(`\\b(:\\s*)(${oldPrefix})([A-Z][a-zA-Z0-9_]*)\\b`, 'g'),
    // , OldPrefixProtocol (多个协议)
    new RegExp(`\\b(,\\s*)(${oldPrefix})([A-Z][a-zA-Z0-9_]*)\\b`, 'g'),
    // let/var variable: OldPrefixType
    new RegExp(`\\b(:\\s*)(${oldPrefix})([A-Z][a-zA-Z0-9_]*)\\b`, 'g'),
    // OldPrefixClassName() (初始化)
    new RegExp(`\\b(${oldPrefix})([A-Z][a-zA-Z0-9_]*)\\s*\\(`, 'g'),
    // OldPrefixClassName.something (静态成员访问)
    new RegExp(`\\b(${oldPrefix})([A-Z][a-zA-Z0-9_]*)\\.`, 'g'),
    // [OldPrefixClassName] (数组类型)
    new RegExp(`\\[(${oldPrefix})([A-Z][a-zA-Z0-9_]*)\\]`, 'g'),
    // <OldPrefixClassName> (泛型)
    new RegExp(`<(${oldPrefix})([A-Z][a-zA-Z0-9_]*)>`, 'g'),
  ];
  
  // 执行所有替换
  patterns.forEach(pattern => {
    content = content.replace(pattern, (match, prefix, oldPref, className) => {
      // 保留前缀部分（如 class、struct 等）和后缀部分
      return prefix + newPrefix + className;
    });
  });
  
  // 特殊处理：直接的类名引用（没有前缀关键字）
  // 这个要小心，避免误替换
  const directPattern = new RegExp(`\\b(${oldPrefix})([A-Z][a-zA-Z0-9_]*)\\b`, 'g');
  content = content.replace(directPattern, `${newPrefix}$2`);
  
  // 修改文件名（如果文件名以旧前缀开头）
  const fileName = path.basename(targetPath);
  let newTargetPath = targetPath;
  
  if (fileName.startsWith(oldPrefix)) {
    const newFileName = fileName.replace(oldPrefix, newPrefix);
    newTargetPath = path.join(path.dirname(targetPath), newFileName);
  }
  
  await fs.writeFile(newTargetPath, content, 'utf8');
  
  // 返回实际写入的文件路径
  return newTargetPath;
}

// 处理 Android Kotlin/Java 文件
async function processAndroidFile(sourcePath, targetPath, oldPackage, newPackage, oldPrefix, newPrefix) {
  let content = await fs.readFile(sourcePath, 'utf8');
  
  // 1. 替换 package 声明
  const packagePattern = new RegExp(`package\\s+${oldPackage.replace(/\./g, '\\.')}`, 'g');
  content = content.replace(packagePattern, `package ${newPackage}`);
  
  // 2. 替换普通 import 语句中的包名
  const importPattern = new RegExp(`import\\s+${oldPackage.replace(/\./g, '\\.')}`, 'g');
  content = content.replace(importPattern, `import ${newPackage}`);
  
  // 3. 替换 static import 语句中的包名 ⭐ 新增
  const staticImportPattern = new RegExp(`import\\s+static\\s+${oldPackage.replace(/\./g, '\\.')}`, 'g');
  content = content.replace(staticImportPattern, `import static ${newPackage}`);
  
  // 4. 替换类继承和实现中的包名 ⭐ 新增
  // 例如: extends com.yndcyst.shop.bean.Goods
  const extendsPattern = new RegExp(`extends\\s+${oldPackage.replace(/\./g, '\\.')}`, 'g');
  content = content.replace(extendsPattern, `extends ${newPackage}`);
  
  // 例如: implements com.yndcyst.shop.Interface
  const implementsPattern = new RegExp(`implements\\s+${oldPackage.replace(/\./g, '\\.')}`, 'g');
  content = content.replace(implementsPattern, `implements ${newPackage}`);
  
  // 5. 替换代码中的完整类名引用 ⭐ 新增
  // 例如: com.yndcyst.shop.utils.Utils.autoShouldExpand()
  // 使用单词边界确保精确匹配
  const fullClassPattern = new RegExp(`\\b${oldPackage.replace(/\./g, '\\.')}\\.(\\w+)`, 'g');
  content = content.replace(fullClassPattern, `${newPackage}.$1`);
  
  // 6. 替换泛型中的完整类名 ⭐ 新增
  // 例如: List<com.yndcyst.shop.bean.Goods>
  const genericPattern = new RegExp(`<${oldPackage.replace(/\./g, '\\.')}`, 'g');
  content = content.replace(genericPattern, `<${newPackage}`);
  
  // 7. 替换注解中的包名 ⭐ 新增
  // 例如: @com.yndcyst.shop.annotation.Custom
  const annotationPattern = new RegExp(`@${oldPackage.replace(/\./g, '\\.')}`, 'g');
  content = content.replace(annotationPattern, `@${newPackage}`);
  
  // 8. 如果有类前缀，替换类名
  if (oldPrefix && newPrefix) {
    // Kotlin/Java 类名模式
    const patterns = [
      // class OldPrefixClassName
      new RegExp(`\\b(class\\s+)(${oldPrefix})([A-Z][a-zA-Z0-9_]*)`, 'g'),
      // interface OldPrefixInterface
      new RegExp(`\\b(interface\\s+)(${oldPrefix})([A-Z][a-zA-Z0-9_]*)`, 'g'),
      // object OldPrefixObject (Kotlin)
      new RegExp(`\\b(object\\s+)(${oldPrefix})([A-Z][a-zA-Z0-9_]*)`, 'g'),
      // enum class OldPrefixEnum (Kotlin)
      new RegExp(`\\b(enum\\s+class\\s+)(${oldPrefix})([A-Z][a-zA-Z0-9_]*)`, 'g'),
      // data class OldPrefixData (Kotlin)
      new RegExp(`\\b(data\\s+class\\s+)(${oldPrefix})([A-Z][a-zA-Z0-9_]*)`, 'g'),
      // sealed class OldPrefixSealed (Kotlin)
      new RegExp(`\\b(sealed\\s+class\\s+)(${oldPrefix})([A-Z][a-zA-Z0-9_]*)`, 'g'),
      // : OldPrefixClass (继承)
      new RegExp(`\\b(:\\s*)(${oldPrefix})([A-Z][a-zA-Z0-9_]*)`, 'g'),
      // <OldPrefixType> (泛型)
      new RegExp(`<(${oldPrefix})([A-Z][a-zA-Z0-9_]*)>`, 'g'),
      // OldPrefixClass() (初始化)
      new RegExp(`\\b(${oldPrefix})([A-Z][a-zA-Z0-9_]*)\\s*\\(`, 'g'),
    ];
    
    patterns.forEach(pattern => {
      content = content.replace(pattern, (match, prefix, oldPref, className) => {
        return prefix + newPrefix + className;
      });
    });
    
    // 直接的类名引用
    const directPattern = new RegExp(`\\b(${oldPrefix})([A-Z][a-zA-Z0-9_]*)\\b`, 'g');
    content = content.replace(directPattern, `${newPrefix}$2`);
  }
  
  // 修改文件名（如果文件名以旧前缀开头）
  const fileName = path.basename(targetPath);
  let newTargetPath = targetPath;
  
  if (oldPrefix && newPrefix && fileName.startsWith(oldPrefix)) {
    const newFileName = fileName.replace(oldPrefix, newPrefix);
    newTargetPath = path.join(path.dirname(targetPath), newFileName);
  }
  
  await fs.writeFile(newTargetPath, content, 'utf8');
  
  return newTargetPath;
}

// 重组 Android 包目录结构
function reorganizeAndroidPackage(filePath, sourcePath, targetPath, oldPackage, newPackage) {
  const relativePath = path.relative(sourcePath, filePath);
  
  // 将包名转换为路径格式
  // 例如: com.yndcyst.shop -> com/yndcyst/shop
  const oldPackagePath = oldPackage.replace(/\./g, path.sep);
  const newPackagePath = newPackage.replace(/\./g, path.sep);
  
  // 如果文件路径包含旧的包路径，替换它
  let newRelativePath = relativePath;
  if (relativePath.includes(oldPackagePath)) {
    newRelativePath = relativePath.replace(oldPackagePath, newPackagePath);
  }
  
  return path.join(targetPath, newRelativePath);
}

// 处理 Android XML 布局文件
async function processAndroidXmlFile(sourcePath, targetPath, oldPackage, newPackage, oldPrefix, newPrefix) {
  let content = await fs.readFile(sourcePath, 'utf8');
  
  // 转义包名中的点号，用于正则表达式
  const escapedOldPackage = oldPackage.replace(/\./g, '\\.');
  const escapedNewPackage = newPackage;
  
  // 1. 替换自定义 View 的开始标签（包含包名）
  // 例如: <com.yndcyst.shop.widget.CustomView ... />
  const customViewOpenPattern = new RegExp(`<${escapedOldPackage}`, 'g');
  content = content.replace(customViewOpenPattern, `<${escapedNewPackage}`);
  
  // 2. 替换自定义 View 的闭合标签 ⭐ 新增
  // 例如: </com.yndcyst.shop.widget.CustomView>
  const customViewClosePattern = new RegExp(`</${escapedOldPackage}`, 'g');
  content = content.replace(customViewClosePattern, `</${escapedNewPackage}`);
  
  // 3. 替换 variable 标签中的 type 属性包名（支持引号内有空格的情况）
  // 例如: type="com.yndcyst.shop.feature.main.home.HomeFragment.Handler"
  // 使用更宽松的匹配：type="任意空格+包名
  const typePattern = new RegExp(`type=\\s*"\\s*${escapedOldPackage}`, 'g');
  content = content.replace(typePattern, `type="${escapedNewPackage}`);
  
  // 4. 替换 class 属性中的包名（支持引号内有空格的情况）
  // 例如: class="com.yndcyst.shop.CustomAdapter"
  const classPattern = new RegExp(`class=\\s*"\\s*${escapedOldPackage}`, 'g');
  content = content.replace(classPattern, `class="${escapedNewPackage}`);
  
  // 5. 替换 name 属性中的包名（用于 fragment、activity 等）
  // 例如: android:name="com.yndcyst.shop.MainActivity"
  const namePattern = new RegExp(`android:name=\\s*"\\s*${escapedOldPackage}`, 'g');
  content = content.replace(namePattern, `android:name="${escapedNewPackage}`);
  
  // 6. 替换 package 属性（AndroidManifest.xml）
  // 例如: package="com.yndcyst.shop"
  const packagePattern = new RegExp(`package=\\s*"\\s*${escapedOldPackage}\\s*"`, 'g');
  content = content.replace(packagePattern, `package="${escapedNewPackage}"`);
  
  // 7. 替换其他可能包含完整类名的地方
  // 使用通用模式：任意属性="包名.xxx"
  const genericPattern = new RegExp(`=\\s*"\\s*${escapedOldPackage}\\.`, 'g');
  content = content.replace(genericPattern, `="${escapedNewPackage}.`);
  
  // 8. 如果有类前缀，替换类名部分
  if (oldPrefix && newPrefix) {
    // 替换包名后面的类名前缀
    // 例如: com.sss.shop.YNDHomeFragment -> com.sss.shop.SSSHomeFragment
    const escapedNewPkg = escapedNewPackage.replace(/\./g, '\\.');
    const classNamePattern = new RegExp(`${escapedNewPkg}\\.(${oldPrefix})([A-Z][a-zA-Z0-9_]*)`, 'g');
    content = content.replace(classNamePattern, `${escapedNewPackage}.${newPrefix}$2`);
    
    // 也替换单独的类名引用（如果有）
    const standaloneClassPattern = new RegExp(`\\b(${oldPrefix})([A-Z][a-zA-Z0-9_]*)\\b`, 'g');
    content = content.replace(standaloneClassPattern, `${newPrefix}$2`);
  }
  
  await fs.writeFile(targetPath, content, 'utf8');
}

// 处理 ProGuard 规则文件
async function processProGuardFile(sourcePath, targetPath, oldPackage, newPackage) {
  let content = await fs.readFile(sourcePath, 'utf8');
  
  // 替换所有包名引用
  // -keep class com.yndcyst.shop.** { *; }
  const escapedOldPackage = oldPackage.replace(/\./g, '\\.');
  const packagePattern = new RegExp(escapedOldPackage, 'g');
  content = content.replace(packagePattern, newPackage);
  
  await fs.writeFile(targetPath, content, 'utf8');
}

// 生成随机方法名
function generateRandomMethodName(prefix, existingNames) {
  const adjectives = ['Quick', 'Fast', 'Smooth', 'Smart', 'Safe', 'Clear', 'Deep', 'Light', 'Dark', 'Pure'];
  const verbs = ['Process', 'Handle', 'Execute', 'Perform', 'Calculate', 'Validate', 'Transform', 'Parse', 'Convert', 'Generate'];
  const nouns = ['Data', 'Info', 'Value', 'Result', 'Content', 'Item', 'Element', 'Object', 'Record', 'Entry'];
  
  let attempts = 0;
  while (attempts < 100) {
    const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
    const verb = verbs[Math.floor(Math.random() * verbs.length)];
    const noun = nouns[Math.floor(Math.random() * nouns.length)];
    const suffix = Math.floor(Math.random() * 999);
    
    const methodName = `${prefix}${adj}${verb}${noun}${suffix}`;
    
    if (!existingNames.has(methodName)) {
      existingNames.add(methodName);
      return methodName;
    }
    attempts++;
  }
  
  // 如果前面的方式失败，使用UUID
  const uuid = Math.random().toString(36).substring(2, 10);
  const methodName = `${prefix}Method${uuid}`;
  existingNames.add(methodName);
  return methodName;
}

// 生成随机变量名
function generateRandomVariableName(prefix, existingNames) {
  const types = ['temp', 'cache', 'buffer', 'state', 'flag', 'index', 'count', 'value', 'data', 'info'];
  const suffixes = ['A', 'B', 'X', 'Y', 'Z', 'One', 'Two', 'Backup', 'Store', 'Holder'];
  
  let attempts = 0;
  while (attempts < 100) {
    const type = types[Math.floor(Math.random() * types.length)];
    const suffix = suffixes[Math.floor(Math.random() * suffixes.length)];
    const num = Math.floor(Math.random() * 999);
    
    const varName = `${prefix}${type}${suffix}${num}`;
    
    if (!existingNames.has(varName)) {
      existingNames.add(varName);
      return varName;
    }
    attempts++;
  }
  
  const uuid = Math.random().toString(36).substring(2, 10);
  const varName = `${prefix}var${uuid}`;
  existingNames.add(varName);
  return varName;
}

// 生成随机类型
function getRandomType(isKotlin) {
  const types = isKotlin 
    ? ['Int', 'String', 'Boolean', 'Long', 'Double', 'Float']
    : ['int', 'String', 'boolean', 'long', 'double', 'float'];
  return types[Math.floor(Math.random() * types.length)];
}

// 生成随机默认值
function getRandomDefaultValue(type, isKotlin) {
  const typeKey = type.toLowerCase().replace('?', '');
  
  const defaults = {
    'int': () => Math.floor(Math.random() * 1000),
    'long': () => Math.floor(Math.random() * 1000) + 'L',
    'float': () => (Math.random() * 100).toFixed(2) + 'f',
    'double': () => (Math.random() * 100).toFixed(2),
    'boolean': () => Math.random() > 0.5 ? 'true' : 'false',
    'string': () => {
      const strings = ['"temp"', '"cache"', '"data"', '""', '"value"'];
      return strings[Math.floor(Math.random() * strings.length)];
    }
  };
  
  if (defaults[typeKey]) {
    return defaults[typeKey]();
  }
  
  return isKotlin ? 'null' : 'null';
}

// 为文件添加随机方法和变量
async function addRandomCodeToFile(filePath, prefix, methodCount, varCount) {
  let content = await fs.readFile(filePath, 'utf8');
  const isKotlin = filePath.endsWith('.kt');
  const isSwift = filePath.endsWith('.swift');
  const existingNames = new Set();
  
  // 找到类定义的结束位置（最后一个 }）
  const lastBraceIndex = content.lastIndexOf('}');
  if (lastBraceIndex === -1) {
    // 如果找不到闭合大括号，说明文件格式有问题，直接返回
    return;
  }
  
  let randomCode = '\n\n    // Auto-generated obfuscation code\n';
  
  if (isSwift) {
    // Swift 随机变量
    for (let i = 0; i < varCount; i++) {
      const varName = generateRandomVariableName(prefix, existingNames);
      const varType = getRandomTypeSwift();
      const defaultValue = getRandomDefaultValueSwift(varType);
      
      randomCode += `    private var ${varName}: ${varType} = ${defaultValue}\n`;
    }
    
    randomCode += '\n';
    
    // Swift 随机方法
    for (let i = 0; i < methodCount; i++) {
      const methodName = generateRandomMethodName(prefix, existingNames);
      const returnType = getRandomTypeSwift();
      const defaultReturn = getRandomDefaultValueSwift(returnType);
      
      randomCode += `    private func ${methodName}() -> ${returnType} {\n`;
      randomCode += `        return ${defaultReturn}\n`;
      randomCode += `    }\n\n`;
    }
  } else {
    // Java/Kotlin 随机变量
    for (let i = 0; i < varCount; i++) {
      const varName = generateRandomVariableName(prefix, existingNames);
      const varType = getRandomType(isKotlin);
      const defaultValue = getRandomDefaultValue(varType, isKotlin);
      
      if (isKotlin) {
        randomCode += `    private var ${varName}: ${varType} = ${defaultValue}\n`;
      } else {
        randomCode += `    private ${varType} ${varName} = ${defaultValue};\n`;
      }
    }
    
    randomCode += '\n';
    
    // Java/Kotlin 随机方法
    for (let i = 0; i < methodCount; i++) {
      const methodName = generateRandomMethodName(prefix, existingNames);
      const returnType = getRandomType(isKotlin);
      const defaultReturn = getRandomDefaultValue(returnType, isKotlin);
      
      if (isKotlin) {
        randomCode += `    private fun ${methodName}(): ${returnType} {\n`;
        randomCode += `        return ${defaultReturn}\n`;
        randomCode += `    }\n\n`;
      } else {
        randomCode += `    private ${returnType} ${methodName}() {\n`;
        randomCode += `        return ${defaultReturn};\n`;
        randomCode += `    }\n\n`;
      }
    }
  }
  
  // 在最后一个 } 之前插入随机代码
  const newContent = content.slice(0, lastBraceIndex) + randomCode + content.slice(lastBraceIndex);
  
  await fs.writeFile(filePath, newContent, 'utf8');
}

// 生成 Swift 随机类型
function getRandomTypeSwift() {
  const types = ['Int', 'String', 'Bool', 'Double', 'Float'];
  return types[Math.floor(Math.random() * types.length)];
}

// 生成 Swift 随机默认值
function getRandomDefaultValueSwift(type) {
  const defaults = {
    'Int': () => Math.floor(Math.random() * 1000),
    'Double': () => (Math.random() * 100).toFixed(2),
    'Float': () => (Math.random() * 100).toFixed(2),
    'Bool': () => Math.random() > 0.5 ? 'true' : 'false',
    'String': () => {
      const strings = ['"temp"', '"cache"', '"data"', '""', '"value"'];
      return strings[Math.floor(Math.random() * strings.length)];
    }
  };
  
  if (defaults[type]) {
    return defaults[type]();
  }
  
  return '""';
}

// 更新 Android 配置文件
async function updateAndroidConfig(projectPath, oldPackage, newPackage) {
  try {
    // 更新 build.gradle 文件
    const gradleFiles = [
      'build.gradle',
      'app/build.gradle',
      'build.gradle.kts',
      'app/build.gradle.kts'
    ];
    
    for (const gradleFile of gradleFiles) {
      const gradlePath = path.join(projectPath, gradleFile);
      
      if (await fs.pathExists(gradlePath)) {
        let content = await fs.readFile(gradlePath, 'utf8');
        
        // 替换 applicationId
        const appIdPattern = new RegExp(`applicationId\\s+["']${oldPackage.replace(/\./g, '\\.')}["']`, 'g');
        content = content.replace(appIdPattern, `applicationId "${newPackage}"`);
        
        // 替换 namespace
        const namespacePattern = new RegExp(`namespace\\s+["']${oldPackage.replace(/\./g, '\\.')}["']`, 'g');
        content = content.replace(namespacePattern, `namespace "${newPackage}"`);
        
        await fs.writeFile(gradlePath, content, 'utf8');
        console.log(`✅ 已更新: ${gradleFile}`);
      }
    }
    
    // 更新 AndroidManifest.xml
    const manifestPaths = [
      'app/src/main/AndroidManifest.xml',
      'src/main/AndroidManifest.xml',
      'AndroidManifest.xml'
    ];
    
    for (const manifestFile of manifestPaths) {
      const manifestPath = path.join(projectPath, manifestFile);
      
      if (await fs.pathExists(manifestPath)) {
        let content = await fs.readFile(manifestPath, 'utf8');
        
        // 替换 package 属性
        const packagePattern = new RegExp(`package\\s*=\\s*["']${oldPackage.replace(/\./g, '\\.')}["']`, 'g');
        content = content.replace(packagePattern, `package="${newPackage}"`);
        
        // 替换组件名称中的包名
        const componentPattern = new RegExp(`android:name\\s*=\\s*["']${oldPackage.replace(/\./g, '\\.')}`, 'g');
        content = content.replace(componentPattern, `android:name="${newPackage}`);
        
        await fs.writeFile(manifestPath, content, 'utf8');
        console.log(`✅ 已更新: ${manifestFile}`);
      }
    }
    
    console.log('✅ Android 配置文件已更新');
    
  } catch (error) {
    console.error('更新 Android 配置文件时出错:', error.message);
  }
}

// 更新 Xcode 项目文件
async function updateXcodeProject(projectPath, oldPrefix, newPrefix, renamedFiles) {
  try {
    // 查找 .xcodeproj 文件
    const files = await fs.readdir(projectPath);
    const xcodeProj = files.find(f => f.endsWith('.xcodeproj'));
    
    if (!xcodeProj) {
      console.log('未找到 .xcodeproj 文件，跳过项目文件更新');
      return;
    }
    
    const pbxprojPath = path.join(projectPath, xcodeProj, 'project.pbxproj');
    
    if (!(await fs.pathExists(pbxprojPath))) {
      console.log('未找到 project.pbxproj 文件');
      return;
    }
    
    let content = await fs.readFile(pbxprojPath, 'utf8');
    
    // 1. 替换文件引用中的类名
    // 替换所有出现的旧前缀文件名
    renamedFiles.forEach(file => {
      // 替换文件名引用
      const oldNamePattern = new RegExp(file.oldName.replace('.', '\\.'), 'g');
      content = content.replace(oldNamePattern, file.newName);
    });
    
    // 2. 替换项目中的类名引用（通用替换）
    // 替换所有以旧前缀开头的类名
    const classNamePattern = new RegExp(`\\b${oldPrefix}([A-Z][a-zA-Z0-9_]*)`, 'g');
    content = content.replace(classNamePattern, `${newPrefix}$1`);
    
    // 3. 保存更新后的文件
    await fs.writeFile(pbxprojPath, content, 'utf8');
    
    console.log('✅ Xcode 项目文件已更新');
    
  } catch (error) {
    console.error('更新 Xcode 项目文件时出错:', error.message);
    // 不抛出错误，因为这不是致命问题
  }
}

// 选择图片文件夹
ipcMain.handle('select-image-folder', async (event) => {
  const result = await dialog.showOpenDialog({
    properties: ['openDirectory'],
    title: '选择图片资源文件夹'
  });
  
  if (!result.canceled && result.filePaths.length > 0) {
    return result.filePaths[0];
  }
  
  return null;
});

// 导入变量修改模块
const variableModifier = require('../core/variable-modifier');

// 导入配置管理模块
const configManager = require('../core/config-manager');

// 保存配置文件
ipcMain.handle('save-config', async (event, platform, name, data) => {
  try {
    const result = await configManager.saveConfig(platform, name, data);
    return result;
  } catch (error) {
    console.error('保存配置失败:', error);
    throw error;
  }
});

// 获取配置文件列表
ipcMain.handle('list-configs', async (event, platform) => {
  try {
    const configs = await configManager.listConfigs(platform);
    return configs;
  } catch (error) {
    console.error('获取配置列表失败:', error);
    return [];
  }
});

// 加载配置文件
ipcMain.handle('load-config', async (event, filePath) => {
  try {
    const config = await configManager.loadConfig(filePath);
    return config;
  } catch (error) {
    console.error('加载配置失败:', error);
    throw error;
  }
});

// 删除配置文件
ipcMain.handle('delete-config', async (event, filePath) => {
  try {
    const result = await configManager.deleteConfig(filePath);
    return result;
  } catch (error) {
    console.error('删除配置失败:', error);
    return false;
  }
});

// 保存文件对话框
ipcMain.handle('save-file-dialog', async (event, options) => {
  const result = await dialog.showSaveDialog(options);
  return result.canceled ? null : result.filePath;
});

// 打开文件对话框
ipcMain.handle('open-file-dialog', async (event, options) => {
  const result = await dialog.showOpenDialog(options);
  return result.canceled ? [] : result.filePaths;
});

// 导出配置文件到指定位置
ipcMain.handle('export-config', async (event, sourcePath, targetPath) => {
  try {
    const result = await configManager.exportConfig(sourcePath, targetPath);
    return result;
  } catch (error) {
    console.error('导出配置失败:', error);
    throw error;
  }
});

// 导入配置文件
ipcMain.handle('import-config', async (event, sourcePath, platform) => {
  try {
    const result = await configManager.importConfig(sourcePath, platform);
    return result;
  } catch (error) {
    console.error('导入配置失败:', error);
    throw error;
  }
});
