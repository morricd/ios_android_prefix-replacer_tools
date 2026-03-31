const fs = require('fs-extra');
const path = require('path');

/**
 * iOS 全局重构 v3 - 精确替换，防止重复
 * 
 * 核心原则：
 * 1. 先识别完整类名（边界检测）
 * 2. 按类名长度排序（长的先替换）
 * 3. 替换后标记，防止重复替换
 * 4. 每个文件处理完立即验证
 */

// 转义正则表达式特殊字符
function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * 步骤1：扫描项目，收集所有类名
 */
async function scanProjectForClasses(projectPath, oldPrefix) {
  const classNames = new Set();
  const files = [];
  
  async function scanDirectory(dirPath) {
    const items = await fs.readdir(dirPath, { withFileTypes: true });
    
    for (const item of items) {
      const fullPath = path.join(dirPath, item.name);
      
      if (item.isDirectory()) {
        const skipDirs = ['Pods', 'build', 'DerivedData', '.git', 'node_modules', 'Carthage'];
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
  
  console.log(`扫描文件数: ${files.length}`);
  
  // 扫描所有文件，提取类名
  for (const filePath of files) {
    try {
      const content = await fs.readFile(filePath, 'utf8');
      const foundClasses = extractClassNames(content, oldPrefix);
      foundClasses.forEach(cls => classNames.add(cls));
    } catch (error) {
      console.error(`读取文件失败: ${filePath}`, error.message);
    }
  }
  
  return {
    classNames: Array.from(classNames),
    files
  };
}

/**
 * 从内容中提取类名（精确匹配）
 */
function extractClassNames(content, prefix) {
  const classNames = new Set();
  const escapedPrefix = escapeRegExp(prefix);
  
  // 匹配类定义：class/struct/enum/protocol/extension 后面的类名
  const definitionPatterns = [
    // Swift: class YNDCYSTClassName
    new RegExp(`\\b(?:class|struct|enum|protocol|extension)\\s+(${escapedPrefix}[A-Z][a-zA-Z0-9_]*)`, 'g'),
    // ObjC: @interface YNDCYSTClassName
    new RegExp(`@(?:interface|implementation|protocol)\\s+(${escapedPrefix}[A-Z][a-zA-Z0-9_]*)`, 'g'),
  ];
  
  definitionPatterns.forEach(pattern => {
    let match;
    while ((match = pattern.exec(content)) !== null) {
      const className = match[1];
      if (className && className.startsWith(prefix)) {
        classNames.add(className);
      }
    }
  });
  
  return Array.from(classNames);
}

/**
 * 步骤2：生成类名映射并排序
 */
function generateClassMapping(classNames, oldPrefix, newPrefix) {
  const mapping = {};
  
  classNames.forEach(oldName => {
    if (oldName.startsWith(oldPrefix)) {
      const suffix = oldName.substring(oldPrefix.length);
      const newName = newPrefix + suffix;
      mapping[oldName] = newName;
    }
  });
  
  // 按类名长度降序排序（长的先替换，防止短类名被误替换）
  const sortedMapping = {};
  Object.keys(mapping)
    .sort((a, b) => b.length - a.length)
    .forEach(key => {
      sortedMapping[key] = mapping[key];
    });
  
  return sortedMapping;
}

/**
 * 步骤3：在单个文件中替换所有类名
 */
function replaceClassesInFile(content, classMapping, filePath) {
  let modified = content;
  let replacedCount = 0;
  
  // 按类名长度排序（长的先替换）
  const sortedClasses = Object.keys(classMapping).sort((a, b) => b.length - a.length);
  
  for (const oldClassName of sortedClasses) {
    const newClassName = classMapping[oldClassName];
    const beforeLength = modified.length;
    
    modified = replaceClassInContent(modified, oldClassName, newClassName);
    
    if (modified.length !== beforeLength) {
      replacedCount++;
    }
  }
  
  // 验证：检查是否有重复的前缀
  const newPrefix = classMapping[Object.keys(classMapping)[0]].match(/^[A-Z]+/)[0];
  const duplicatePattern = new RegExp(`\\b(${newPrefix}){2,}`, 'g');
  const duplicates = modified.match(duplicatePattern);
  
  if (duplicates && duplicates.length > 0) {
    console.warn(`⚠️  警告: ${path.basename(filePath)} 检测到重复前缀: ${duplicates.slice(0, 3).join(', ')}`);
  }
  
  return modified;
}

/**
 * 精确替换单个类名
 */
function replaceClassInContent(content, oldClassName, newClassName) {
  const escaped = escapeRegExp(oldClassName);
  
  // 1. 类定义（最高优先级，最精确）
  content = content.replace(
    new RegExp(`\\b(class|struct|enum|protocol|extension)\\s+${escaped}\\b`, 'g'),
    `$1 ${newClassName}`
  );
  
  content = content.replace(
    new RegExp(`@(interface|implementation|protocol)\\s+${escaped}\\b`, 'g'),
    `@$1 ${newClassName}`
  );
  
  // 2. 类型声明和使用（带边界检测）
  // : YNDCYSTClassName
  content = content.replace(
    new RegExp(`:\\s*${escaped}\\b`, 'g'),
    `: ${newClassName}`
  );
  
  // <YNDCYSTClassName>
  content = content.replace(
    new RegExp(`<\\s*${escaped}\\s*>`, 'g'),
    `<${newClassName}>`
  );
  
  // [YNDCYSTClassName]
  content = content.replace(
    new RegExp(`\\[\\s*${escaped}\\s*\\]`, 'g'),
    `[${newClassName}]`
  );
  
  // : YNDCYSTClassName? 或 : YNDCYSTClassName!
  content = content.replace(
    new RegExp(`:\\s*${escaped}([?!])`, 'g'),
    `: ${newClassName}$1`
  );
  
  // 3. 实例化（关键：构造函数调用）
  // YNDCYSTClassName( 而不是 YNDCYSTClassName123(
  content = content.replace(
    new RegExp(`\\b${escaped}\\s*\\(`, 'g'),
    `${newClassName}(`
  );
  
  // 4. 类方法和属性访问
  // YNDCYSTClassName.something
  content = content.replace(
    new RegExp(`\\b${escaped}\\.`, 'g'),
    `${newClassName}.`
  );
  
  // 5. 类型转换
  // as YNDCYSTClassName, as? YNDCYSTClassName, as! YNDCYSTClassName
  content = content.replace(
    new RegExp(`\\bas([?!]?)\\s+${escaped}\\b`, 'g'),
    `as$1 ${newClassName}`
  );
  
  // is YNDCYSTClassName
  content = content.replace(
    new RegExp(`\\bis\\s+${escaped}\\b`, 'g'),
    `is ${newClassName}`
  );
  
  // 6. 字符串中的类名（精确匹配完整字符串）
  // "YNDCYSTClassName"
  content = content.replace(
    new RegExp(`"${escaped}"`, 'g'),
    `"${newClassName}"`
  );
  
  content = content.replace(
    new RegExp(`'${escaped}'`, 'g'),
    `'${newClassName}'`
  );
  
  // 7. 类型别名
  // typealias Something = YNDCYSTClassName
  content = content.replace(
    new RegExp(`=\\s*${escaped}\\b`, 'g'),
    `= ${newClassName}`
  );
  
  // 8. 泛型约束
  // where T: YNDCYSTClassName
  content = content.replace(
    new RegExp(`where\\s+\\w+\\s*:\\s*${escaped}\\b`, 'g'),
    (match) => match.replace(new RegExp(`\\b${escaped}\\b`), newClassName)
  );
  
  // 9. 集合类型
  // [String: YNDCYSTClassName]
  content = content.replace(
    new RegExp(`\\[([^\\]]+):\\s*${escaped}\\s*\\]`, 'g'),
    `[$1: ${newClassName}]`
  );
  
  // 10. 文件头注释
  // //  YNDCYSTClassName.swift
  content = content.replace(
    new RegExp(`^//\\s+${escaped}\\.(swift|h|m)`, 'gm'),
    `//  ${newClassName}.$1`
  );
  
  // 11. 注释中的类名
  content = content.replace(
    new RegExp(`^(\\s*///)\\s+.*?\\b${escaped}\\b`, 'gm'),
    (match) => match.replace(new RegExp(`\\b${escaped}\\b`, 'g'), newClassName)
  );
  
  // 12. Import 语句
  // #import "YNDCYSTClassName.h"
  content = content.replace(
    new RegExp(`#import\\s+"${escaped}\\.h"`, 'g'),
    `#import "${newClassName}.h"`
  );
  
  // @class YNDCYSTClassName;
  content = content.replace(
    new RegExp(`@class\\s+${escaped}\\b`, 'g'),
    `@class ${newClassName}`
  );
  
  return content;
}

/**
 * 步骤4：全局替换
 */
async function globalReplaceClasses(projectPath, classMapping, progressCallback) {
  const files = [];
  let processedFiles = 0;
  let modifiedFiles = 0;
  
  // 收集所有文件
  async function collectFiles(dirPath) {
    const items = await fs.readdir(dirPath, { withFileTypes: true });
    
    for (const item of items) {
      const fullPath = path.join(dirPath, item.name);
      
      if (item.isDirectory()) {
        const skipDirs = ['Pods', 'build', 'DerivedData', '.git', 'node_modules', 'Carthage'];
        if (skipDirs.includes(item.name) || item.name.startsWith('.')) {
          continue;
        }
        await collectFiles(fullPath);
      } else if (item.isFile()) {
        if (item.name.endsWith('.swift') || item.name.endsWith('.m') || item.name.endsWith('.h')) {
          files.push({ path: fullPath, type: 'code' });
        } else if (item.name === 'project.pbxproj') {
          files.push({ path: fullPath, type: 'pbxproj' });
        }
      }
    }
  }
  
  await collectFiles(projectPath);
  console.log(`需要处理的文件数: ${files.length}`);
  
  // 处理每个文件
  for (const file of files) {
    try {
      let content = await fs.readFile(file.path, 'utf8');
      const originalContent = content;
      
      if (file.type === 'code') {
        content = replaceClassesInFile(content, classMapping, file.path);
      } else if (file.type === 'pbxproj') {
        content = replacePbxproj(content, classMapping);
      }
      
      if (content !== originalContent) {
        await fs.writeFile(file.path, content, 'utf8');
        modifiedFiles++;
      }
      
      processedFiles++;
      
      if (progressCallback && processedFiles % 10 === 0) {
        progressCallback({
          current: processedFiles,
          total: files.length,
          file: path.basename(file.path),
          modified: modifiedFiles
        });
      }
    } catch (error) {
      console.error(`处理文件失败: ${file.path}`, error.message);
    }
  }
  
  return { processedFiles, modifiedFiles };
}

/**
 * 替换 pbxproj 文件
 */
function replacePbxproj(content, classMapping) {
  let modified = content;
  
  for (const [oldName, newName] of Object.entries(classMapping)) {
    const escaped = escapeRegExp(oldName);
    
    // path = YNDCYSTClassName.swift;
    ['swift', 'm', 'h'].forEach(ext => {
      modified = modified.replace(
        new RegExp(`(path|name)\\s*=\\s*${escaped}\\.${ext};`, 'g'),
        `$1 = ${newName}.${ext};`
      );
    });
  }
  
  return modified;
}

/**
 * 步骤5：重命名文件
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
        const fileName = item.name;
        const nameWithoutExt = path.parse(fileName).name;
        
        if (classMapping[nameWithoutExt]) {
          const ext = path.extname(fileName);
          const newFileName = classMapping[nameWithoutExt] + ext;
          const newPath = path.join(dirPath, newFileName);
          
          try {
            await fs.rename(fullPath, newPath);
            renamedFiles.push({
              oldPath: fullPath,
              newPath: newPath,
              oldName: fileName,
              newName: newFileName
            });
          } catch (error) {
            console.error(`重命名文件失败: ${fileName}`, error.message);
          }
        }
      }
    }
  }
  
  await processDirectory(projectPath);
  return renamedFiles;
}

/**
 * 主函数：iOS 项目重构
 */
async function refactorIOSProject(projectPath, oldPrefix, newPrefix, progressCallback) {
  console.log('\n========================================');
  console.log('iOS 项目重构 v3 - 精确替换');
  console.log('========================================\n');
  
  // 步骤1：扫描项目
  console.log('步骤 1/4: 扫描项目，收集类名...');
  const { classNames } = await scanProjectForClasses(projectPath, oldPrefix);
  console.log(`✅ 找到 ${classNames.length} 个类`);
  if (classNames.length > 0) {
    console.log('前5个类:', classNames.slice(0, 5));
  }
  
  // 步骤2：生成映射
  console.log('\n步骤 2/4: 生成类名映射...');
  const classMapping = generateClassMapping(classNames, oldPrefix, newPrefix);
  console.log(`✅ 生成 ${Object.keys(classMapping).length} 个映射`);
  const samples = Object.entries(classMapping).slice(0, 3);
  samples.forEach(([old, newVal]) => {
    console.log(`  ${old} → ${newVal}`);
  });
  
  // 步骤3：全局替换
  console.log('\n步骤 3/4: 全局替换类名...');
  const { processedFiles, modifiedFiles } = await globalReplaceClasses(projectPath, classMapping, progressCallback);
  console.log(`✅ 处理 ${processedFiles} 个文件，修改 ${modifiedFiles} 个文件`);
  
  // 步骤4：重命名文件
  console.log('\n步骤 4/4: 重命名文件...');
  const renamedFiles = await renameFiles(projectPath, classMapping);
  console.log(`✅ 重命名 ${renamedFiles.length} 个文件`);
  
  console.log('\n========================================');
  console.log('✅ 重构完成！');
  console.log('========================================\n');
  
  return {
    classCount: classNames.length,
    filesProcessed: processedFiles,
    filesModified: modifiedFiles,
    filesRenamed: renamedFiles.length,
    classMapping,
    renamedFiles
  };
}

module.exports = {
  refactorIOSProject,
  scanProjectForClasses,
  generateClassMapping,
  globalReplaceClasses,
  renameFiles
};
