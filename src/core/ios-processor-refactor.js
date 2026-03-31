const fs = require('fs-extra');
const path = require('path');

// ========================================
// 全局重命名策略（类似 Xcode Refactor）
// ========================================

/**
 * 第一步：扫描项目，收集所有需要替换的类名
 */
async function scanProjectForClasses(projectPath, oldPrefix) {
  const classNames = new Set();
  const files = [];
  
  async function scanDirectory(dirPath) {
    const items = await fs.readdir(dirPath, { withFileTypes: true });
    
    for (const item of items) {
      const fullPath = path.join(dirPath, item.name);
      
      if (item.isDirectory()) {
        const skipDirs = ['Pods', 'build', 'DerivedData', '.git', 'node_modules'];
        if (skipDirs.includes(item.name) || item.name.startsWith('.')) {
          continue;
        }
        await scanDirectory(fullPath);
      } else if (item.isFile() && (item.name.endsWith('.swift') || item.name.endsWith('.m') || item.name.endsWith('.h'))) {
        files.push(fullPath);
      }
    }
  }
  
  await scanDirectory(projectPath);
  
  // 扫描所有文件，提取类名
  for (const filePath of files) {
    const content = await fs.readFile(filePath, 'utf8');
    const foundClasses = extractClassNames(content, oldPrefix);
    foundClasses.forEach(cls => classNames.add(cls));
  }
  
  return {
    classNames: Array.from(classNames).sort(),
    files
  };
}

/**
 * 从文件内容中提取所有以指定前缀开头的类名
 */
function extractClassNames(content, prefix) {
  const classNames = new Set();
  
  // Swift/ObjC 类定义模式
  const patterns = [
    // class YNDCYSTClassName
    new RegExp(`\\b(class|struct|enum|protocol|extension)\\s+(${escapeRegExp(prefix)}[A-Z][a-zA-Z0-9_]*)`, 'g'),
    // @interface YNDCYSTClassName
    new RegExp(`@interface\\s+(${escapeRegExp(prefix)}[A-Z][a-zA-Z0-9_]*)`, 'g'),
    // @implementation YNDCYSTClassName
    new RegExp(`@implementation\\s+(${escapeRegExp(prefix)}[A-Z][a-zA-Z0-9_]*)`, 'g'),
  ];
  
  patterns.forEach(pattern => {
    let match;
    while ((match = pattern.exec(content)) !== null) {
      const className = match[2] || match[1];
      if (className && className.startsWith(prefix)) {
        classNames.add(className);
      }
    }
  });
  
  return Array.from(classNames);
}

/**
 * 第二步：在所有文件中全局替换类名
 */
async function globalReplaceClasses(projectPath, classMapping, progressCallback) {
  const files = [];
  let processedFiles = 0;
  
  // 收集所有文件
  async function collectFiles(dirPath) {
    const items = await fs.readdir(dirPath, { withFileTypes: true });
    
    for (const item of items) {
      const fullPath = path.join(dirPath, item.name);
      
      if (item.isDirectory()) {
        const skipDirs = ['Pods', 'build', 'DerivedData', '.git', 'node_modules'];
        if (skipDirs.includes(item.name) || item.name.startsWith('.')) {
          continue;
        }
        await collectFiles(fullPath);
      } else if (item.isFile()) {
        // 处理代码文件
        if (item.name.endsWith('.swift') || item.name.endsWith('.m') || item.name.endsWith('.h')) {
          files.push({ path: fullPath, type: 'code' });
        }
        // 处理 pbxproj 文件
        else if (item.name === 'project.pbxproj') {
          files.push({ path: fullPath, type: 'pbxproj' });
        }
        // 处理 plist 文件
        else if (item.name.endsWith('.plist')) {
          files.push({ path: fullPath, type: 'plist' });
        }
      }
    }
  }
  
  await collectFiles(projectPath);
  
  // 处理每个文件
  for (const file of files) {
    let content = await fs.readFile(file.path, 'utf8');
    let modified = false;
    
    // 对每个类名进行替换
    for (const [oldName, newName] of Object.entries(classMapping)) {
      const beforeReplace = content;
      content = replaceClassInContent(content, oldName, newName, file.type);
      if (content !== beforeReplace) {
        modified = true;
      }
    }
    
    if (modified) {
      await fs.writeFile(file.path, content, 'utf8');
      processedFiles++;
      
      if (progressCallback) {
        progressCallback({
          current: processedFiles,
          total: files.length,
          file: path.basename(file.path)
        });
      }
    }
  }
  
  return processedFiles;
}

/**
 * 在文件内容中替换类名（全面覆盖各种场景）
 */
function replaceClassInContent(content, oldClassName, newClassName, fileType) {
  const escaped = escapeRegExp(oldClassName);
  
  // 1. 类定义和声明
  const definitionPatterns = [
    // class OldClass, struct OldClass, enum OldClass, protocol OldClass
    new RegExp(`\\b(class|struct|enum|protocol|extension)\\s+${escaped}\\b`, 'g'),
    // @interface OldClass, @implementation OldClass
    new RegExp(`@(interface|implementation)\\s+${escaped}\\b`, 'g'),
  ];
  
  definitionPatterns.forEach(pattern => {
    content = content.replace(pattern, (match, keyword) => {
      return `${keyword} ${newClassName}`;
    });
  });
  
  // 2. 类型声明和使用
  const usagePatterns = [
    // : OldClass (继承、协议)
    new RegExp(`:\\s*${escaped}\\b`, 'g'),
    // <OldClass> (泛型)
    new RegExp(`<${escaped}>`, 'g'),
    // [OldClass] (数组)
    new RegExp(`\\[${escaped}\\]`, 'g'),
    // var x: OldClass
    new RegExp(`:\\s*${escaped}\\?`, 'g'),
    new RegExp(`:\\s*${escaped}!`, 'g'),
    // let x = OldClass()
    new RegExp(`=\\s*${escaped}\\s*\\(`, 'g'),
    // OldClass.method()
    new RegExp(`\\b${escaped}\\.`, 'g'),
    // as OldClass, as? OldClass, as! OldClass
    new RegExp(`\\bas\\s*\\??\\s*!?\\s*${escaped}\\b`, 'g'),
    // is OldClass
    new RegExp(`\\bis\\s+${escaped}\\b`, 'g'),
    // guard let x = y as? OldClass
    new RegExp(`\\b(guard|if|let|var)\\s+.*?\\s+as\\??\\s+${escaped}\\b`, 'g'),
  ];
  
  usagePatterns.forEach(pattern => {
    content = content.replace(pattern, (match) => {
      return match.replace(new RegExp(`\\b${escaped}\\b`, 'g'), newClassName);
    });
  });
  
  // 3. 字符串中的类名（关键场景）
  const stringPatterns = [
    // "OldClass" 或 'OldClass'
    new RegExp(`(["'])${escaped}\\1`, 'g'),
    // identifier = "OldClass"
    new RegExp(`(identifier.*?=.*?["'])${escaped}(["'])`, 'g'),
    // withReuseIdentifier: "OldClass"
    new RegExp(`(withReuseIdentifier.*?["'])${escaped}(["'])`, 'g'),
    // cellIdentifier = "OldClass"
    new RegExp(`(cellIdentifier.*?["'])${escaped}(["'])`, 'g'),
  ];
  
  stringPatterns.forEach(pattern => {
    content = content.replace(pattern, (match) => {
      return match.replace(new RegExp(escaped, 'g'), newClassName);
    });
  });
  
  // 4. 注释中的类名
  const commentPatterns = [
    // /// OldClass 或 // OldClass
    new RegExp(`(/\\*\\*?|///|//)\\s*.*?\\b${escaped}\\b`, 'g'),
  ];
  
  commentPatterns.forEach(pattern => {
    content = content.replace(pattern, (match) => {
      return match.replace(new RegExp(`\\b${escaped}\\b`, 'g'), newClassName);
    });
  });
  
  // 5. Protocol 类型引用
  // func xxx(_ model: OldProtocol?)
  content = content.replace(
    new RegExp(`\\b${escaped}\\?\\)`, 'g'),
    `${newClassName}?)`
  );
  
  // 6. 嵌套类/内部类
  // class OuterClass {
  //     class InnerOldClass { }
  // }
  content = content.replace(
    new RegExp(`\\b(class|struct|enum)\\s+${escaped}\\s*{`, 'g'),
    (match, keyword) => `${keyword} ${newClassName} {`
  );
  
  // 7. 类型别名
  // typealias MyType = OldClass
  content = content.replace(
    new RegExp(`\\btypealias\\s+\\w+\\s*=\\s*${escaped}\\b`, 'g'),
    (match) => match.replace(new RegExp(`\\b${escaped}\\b`), newClassName)
  );
  
  // 8. ObjC 文件特殊处理
  if (fileType === 'code') {
    // #import "OldClass.h"
    content = content.replace(
      new RegExp(`#import\\s+"${escaped}\\.h"`, 'g'),
      `#import "${newClassName}.h"`
    );
    
    // @class OldClass;
    content = content.replace(
      new RegExp(`@class\\s+${escaped}\\b`, 'g'),
      `@class ${newClassName}`
    );
  }
  
  // 9. pbxproj 文件特殊处理
  if (fileType === 'pbxproj') {
    // path = OldClass.swift;
    content = content.replace(
      new RegExp(`(path|name)\\s*=\\s*${escaped}\\.swift;`, 'g'),
      (match, attr) => `${attr} = ${newClassName}.swift;`
    );
    
    content = content.replace(
      new RegExp(`(path|name)\\s*=\\s*${escaped}\\.m;`, 'g'),
      (match, attr) => `${attr} = ${newClassName}.m;`
    );
    
    content = content.replace(
      new RegExp(`(path|name)\\s*=\\s*${escaped}\\.h;`, 'g'),
      (match, attr) => `${attr} = ${newClassName}.h;`
    );
  }
  
  return content;
}

/**
 * 第三步：重命名文件
 */
async function renameFiles(projectPath, classMapping) {
  const renamedFiles = [];
  
  async function processDirectory(dirPath) {
    const items = await fs.readdir(dirPath, { withFileTypes: true });
    
    for (const item of items) {
      const fullPath = path.join(dirPath, item.name);
      
      if (item.isDirectory()) {
        const skipDirs = ['Pods', 'build', 'DerivedData', '.git', 'node_modules'];
        if (skipDirs.includes(item.name) || item.name.startsWith('.')) {
          continue;
        }
        await processDirectory(fullPath);
      } else if (item.isFile()) {
        // 检查文件名是否需要重命名
        for (const [oldName, newName] of Object.entries(classMapping)) {
          const fileName = item.name;
          const nameWithoutExt = path.parse(fileName).name;
          
          if (nameWithoutExt === oldName) {
            const ext = path.extname(fileName);
            const newFileName = newName + ext;
            const newPath = path.join(dirPath, newFileName);
            
            await fs.rename(fullPath, newPath);
            renamedFiles.push({
              oldPath: fullPath,
              newPath: newPath,
              oldName: fileName,
              newName: newFileName
            });
            
            break;
          }
        }
      }
    }
  }
  
  await processDirectory(projectPath);
  return renamedFiles;
}

/**
 * 主入口：iOS 项目重构
 */
async function refactorIOSProject(projectPath, oldPrefix, newPrefix, progressCallback) {
  console.log('========================================');
  console.log('iOS 项目重构 - 全局替换模式');
  console.log('========================================');
  
  // 步骤1：扫描项目，收集所有类名
  console.log('\n步骤 1: 扫描项目，收集类名...');
  if (progressCallback) {
    progressCallback({ stage: 'scan', message: '正在扫描项目...' });
  }
  
  const { classNames, files } = await scanProjectForClasses(projectPath, oldPrefix);
  console.log(`找到 ${classNames.length} 个需要重命名的类`);
  console.log('类名列表:', classNames.slice(0, 10), classNames.length > 10 ? '...' : '');
  
  // 步骤2：生成类名映射
  console.log('\n步骤 2: 生成类名映射...');
  const classMapping = {};
  classNames.forEach(oldName => {
    // YNDCYSTClassName -> JUNZILANClassName
    const suffix = oldName.substring(oldPrefix.length);
    const newName = newPrefix + suffix;
    classMapping[oldName] = newName;
  });
  
  console.log('类名映射示例:');
  Object.entries(classMapping).slice(0, 5).forEach(([old, newVal]) => {
    console.log(`  ${old} → ${newVal}`);
  });
  
  // 步骤3：全局替换类名
  console.log('\n步骤 3: 全局替换类名...');
  if (progressCallback) {
    progressCallback({ stage: 'replace', message: '正在替换类名...' });
  }
  
  const replacedCount = await globalReplaceClasses(projectPath, classMapping, (progress) => {
    if (progressCallback) {
      progressCallback({
        stage: 'replace',
        current: progress.current,
        total: progress.total,
        file: progress.file
      });
    }
  });
  
  console.log(`已处理 ${replacedCount} 个文件`);
  
  // 步骤4：重命名文件
  console.log('\n步骤 4: 重命名文件...');
  if (progressCallback) {
    progressCallback({ stage: 'rename', message: '正在重命名文件...' });
  }
  
  const renamedFiles = await renameFiles(projectPath, classMapping);
  console.log(`已重命名 ${renamedFiles.length} 个文件`);
  
  console.log('\n========================================');
  console.log('重构完成！');
  console.log('========================================');
  
  return {
    classCount: classNames.length,
    filesProcessed: replacedCount,
    filesRenamed: renamedFiles.length,
    classMapping,
    renamedFiles
  };
}

// 转义正则表达式特殊字符
function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// 导出旧的接口以保持兼容性
async function processSwiftFile(sourcePath, targetPath, oldPrefix, newPrefix) {
  // 这个函数现在只是复制文件，实际替换由 refactorIOSProject 统一处理
  await fs.copy(sourcePath, targetPath);
  return targetPath;
}

module.exports = {
  // 新的全局重构接口
  refactorIOSProject,
  scanProjectForClasses,
  globalReplaceClasses,
  renameFiles,
  
  // 保持旧接口兼容
  processSwiftFile,
};
