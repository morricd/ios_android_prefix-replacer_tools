const fs = require('fs-extra');
const path = require('path');

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function extractPrefixedIdentifiers(content, oldPrefix) {
  const identifiers = new Set();
  const pattern = new RegExp(`\\b${escapeRegExp(oldPrefix)}[A-Z][a-zA-Z0-9_]*\\b`, 'g');
  let match;

  while ((match = pattern.exec(content)) !== null) {
    identifiers.add(match[0]);
  }

  return Array.from(identifiers).sort((a, b) => b.length - a.length);
}

function normalizeDuplicatePrefixes(content, prefix) {
  const escapedPrefix = escapeRegExp(prefix);
  const duplicatePattern = new RegExp(`\\b(?:${escapedPrefix}){2,}([A-Z][a-zA-Z0-9_]*)\\b`, 'g');
  return content.replace(duplicatePattern, `${prefix}$1`);
}

function replacePrefixedIdentifiers(content, oldPrefix, newPrefix) {
  let modified = content;
  const identifiers = extractPrefixedIdentifiers(content, oldPrefix);

  identifiers.forEach((oldName) => {
    const newName = newPrefix + oldName.slice(oldPrefix.length);
    modified = modified.replace(new RegExp(`\\b${escapeRegExp(oldName)}\\b`, 'g'), newName);
  });

  modified = normalizeDuplicatePrefixes(modified, newPrefix);

  return modified;
}

function validateReplacement(content, oldPrefix, newPrefix, filePath) {
  const remainingPattern = new RegExp(`\\b${escapeRegExp(oldPrefix)}[A-Z][a-zA-Z0-9_]*\\b`, 'g');
  const duplicatePattern = new RegExp(`\\b(?:${escapeRegExp(newPrefix)}){2,}[A-Z][a-zA-Z0-9_]*\\b`, 'g');

  const remaining = content.match(remainingPattern);
  if (remaining && remaining.length > 0) {
    console.warn(
      `⚠️  ${path.basename(filePath)} 仍存在旧前缀标识符: ${remaining.slice(0, 5).join(', ')}`
    );
  }

  const duplicates = content.match(duplicatePattern);
  if (duplicates && duplicates.length > 0) {
    console.warn(
      `⚠️  ${path.basename(filePath)} 检测到重复新前缀: ${duplicates.slice(0, 5).join(', ')}`
    );
  }
}

// 处理 iOS Swift 文件
async function processSwiftFile(sourcePath, targetPath, oldPrefix, newPrefix) {
  let content = await fs.readFile(sourcePath, 'utf8');
  content = replacePrefixedIdentifiers(content, oldPrefix, newPrefix);
  
  // 修改文件名 - 只替换开头的前缀，避免重复替换
  const fileName = path.basename(targetPath);
  let newTargetPath = targetPath;
  
  // 只有当文件名以旧前缀开头，且不以新前缀开头时，才进行替换
  // 这样可以避免重复替换（如果文件已经被 renameFilesWithPrefix 重命名过）
  if (fileName.startsWith(oldPrefix) && !fileName.startsWith(newPrefix)) {
    // 使用正则表达式的 ^ 锚点，只替换文件名开头的前缀
    const newFileName = fileName.replace(new RegExp(`^${escapeRegExp(oldPrefix)}`), newPrefix);
    newTargetPath = path.join(path.dirname(targetPath), newFileName);
  }
  
  await fs.writeFile(newTargetPath, content, 'utf8');
  validateReplacement(content, oldPrefix, newPrefix, newTargetPath);
  
  return newTargetPath;
}

// 检查是否应该添加随机代码
function shouldAddRandomCode(content) {
  // 检查是否是 protocol（接口）
  if (/^\s*protocol\s+\w+/m.test(content)) {
    return false;
  }
  
  // 检查是否整个文件都被注释
  const lines = content.split('\n');
  let codeLineCount = 0;
  let commentLineCount = 0;
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed === '' || trimmed.startsWith('import ')) {
      continue;
    }
    if (trimmed.startsWith('//')) {
      commentLineCount++;
    } else {
      codeLineCount++;
    }
  }
  
  // 如果注释行数超过80%，认为是注释文件
  if (commentLineCount > codeLineCount * 4) {
    return false;
  }
  
  return true;
}

// 为 Swift 文件添加随机代码
async function addRandomCodeToSwiftFile(filePath, prefix, methodCount, varCount) {
  let content = await fs.readFile(filePath, 'utf8');
  
  // 检查是否应该添加随机代码
  if (!shouldAddRandomCode(content)) {
    console.log(`跳过（接口或注释文件）: ${path.basename(filePath)}`);
    return;
  }
  
  const existingNames = new Set();
  
  // 找到最后一个 }
  const lastBraceIndex = content.lastIndexOf('}');
  if (lastBraceIndex === -1) {
    return;
  }
  
  let randomCode = '\n\n    // Auto-generated obfuscation code\n';
  
  // 生成随机变量
  for (let i = 0; i < varCount; i++) {
    const varName = generateRandomVariableName(prefix, existingNames);
    const varType = getRandomTypeSwift();
    const defaultValue = getRandomDefaultValueSwift(varType);
    
    randomCode += `    private var ${varName}: ${varType} = ${defaultValue}\n`;
  }
  
  randomCode += '\n';
  
  // 生成随机方法
  for (let i = 0; i < methodCount; i++) {
    const methodName = generateRandomMethodName(prefix, existingNames);
    const returnType = getRandomTypeSwift();
    const defaultReturn = getRandomDefaultValueSwift(returnType);
    
    randomCode += `    private func ${methodName}() -> ${returnType} {\n`;
    randomCode += `        return ${defaultReturn}\n`;
    randomCode += `    }\n\n`;
  }
  
  const newContent = content.slice(0, lastBraceIndex) + randomCode + content.slice(lastBraceIndex);
  await fs.writeFile(filePath, newContent, 'utf8');
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
  
  const uuid = Math.random().toString(36).substring(2, 10);
  const methodName = `${prefix}Method${uuid}`;
  existingNames.add(methodName);
  return methodName;
}

// Swift 类型
function getRandomTypeSwift() {
  const types = ['Int', 'String', 'Bool', 'Double', 'Float'];
  return types[Math.floor(Math.random() * types.length)];
}

// Swift 默认值
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

// 重命名包含前缀的文件
function renameFileWithPrefix(filePath, oldPrefix, newPrefix) {
  const fileName = path.basename(filePath);
  const dirName = path.dirname(filePath);
  
  // 只有当文件名以旧前缀开头，且不以新前缀开头时，才进行替换
  // 避免重复替换已经处理过的文件
  if (fileName.startsWith(oldPrefix) && !fileName.startsWith(newPrefix)) {
    const newFileName = fileName.replace(new RegExp(`^${escapeRegExp(oldPrefix)}`), newPrefix);
    const newFilePath = path.join(dirName, newFileName);
    return { renamed: true, oldPath: filePath, newPath: newFilePath, oldName: fileName, newName: newFileName };
  }
  
  return { renamed: false, oldPath: filePath, newPath: filePath };
}

// 批量重命名文件
async function renameFilesWithPrefix(projectPath, oldPrefix, newPrefix) {
  const renamedFiles = [];
  
  // 递归查找所有文件
  async function processDirectory(dirPath) {
    const items = await fs.readdir(dirPath, { withFileTypes: true });
    
    for (const item of items) {
      const fullPath = path.join(dirPath, item.name);
      
      // 跳过一些目录
      if (item.isDirectory()) {
        const skipDirs = ['Pods', 'build', 'DerivedData', '.git', 'node_modules'];
        if (skipDirs.includes(item.name) || item.name.startsWith('.')) {
          continue;
        }
        await processDirectory(fullPath);
      } else if (item.isFile()) {
        // 检查并重命名文件
        const result = renameFileWithPrefix(fullPath, oldPrefix, newPrefix);
        if (result.renamed) {
          await fs.rename(result.oldPath, result.newPath);
          renamedFiles.push(result);
        }
      }
    }
  }
  
  await processDirectory(projectPath);
  return renamedFiles;
}

// 重命名 Xcode Group
async function renameXcodeGroups(projectPath, oldPrefix, newPrefix, renamedFiles) {
  const pbxprojFiles = [];
  
  // 查找所有 .pbxproj 文件
  async function findPbxproj(dirPath) {
    const items = await fs.readdir(dirPath, { withFileTypes: true });
    
    for (const item of items) {
      const fullPath = path.join(dirPath, item.name);
      
      if (item.isDirectory()) {
        if (item.name.endsWith('.xcodeproj')) {
          const pbxprojPath = path.join(fullPath, 'project.pbxproj');
          if (await fs.pathExists(pbxprojPath)) {
            pbxprojFiles.push(pbxprojPath);
          }
        } else if (!item.name.startsWith('.') && item.name !== 'Pods') {
          await findPbxproj(fullPath);
        }
      }
    }
  }
  
  await findPbxproj(projectPath);
  
  // 处理每个 .pbxproj 文件
  for (const pbxprojPath of pbxprojFiles) {
    let content = await fs.readFile(pbxprojPath, 'utf8');
    let modified = false;
    
    // 1. 替换 Group 名称（path 属性）
    // 例如: path = ABCViews; → path = XYZViews;
    const groupPathPattern = new RegExp(`path = ${escapeRegExp(oldPrefix)}([A-Za-z0-9_]+);`, 'g');
    const newContent1 = content.replace(groupPathPattern, (match, rest) => {
      modified = true;
      return `path = ${newPrefix}${rest};`;
    });
    content = newContent1;
    
    // 2. 替换 Group 名称（name 属性）
    // 例如: name = ABCControllers; → name = XYZControllers;
    const groupNamePattern = new RegExp(`name = ${escapeRegExp(oldPrefix)}([A-Za-z0-9_]+);`, 'g');
    const newContent2 = content.replace(groupNamePattern, (match, rest) => {
      modified = true;
      return `name = ${newPrefix}${rest};`;
    });
    content = newContent2;
    
    // 3. 更新文件引用（如果文件被重命名）
    for (const file of renamedFiles) {
      const oldName = file.oldName;
      const newName = file.newName;
      
      // 替换文件引用
      const fileRefPattern = new RegExp(`(path|name) = ${oldName.replace(/\./g, '\\.')};`, 'g');
      const newContent3 = content.replace(fileRefPattern, (match, type) => {
        modified = true;
        return `${type} = ${newName};`;
      });
      content = newContent3;
    }
    
    // 如果有修改，写回文件
    if (modified) {
      await fs.writeFile(pbxprojPath, content, 'utf8');
      console.log(`已更新 Xcode 项目文件: ${pbxprojPath}`);
    }
  }
}

module.exports = {
  processSwiftFile,
  addRandomCodeToSwiftFile,
  renameFilesWithPrefix,
  renameXcodeGroups,
  extractPrefixedIdentifiers,
  normalizeDuplicatePrefixes,
  replacePrefixedIdentifiers
};
