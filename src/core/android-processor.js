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

// 处理 Android Kotlin/Java 文件
async function processAndroidFile(sourcePath, targetPath, oldPackage, newPackage, oldPrefix, newPrefix) {
  let content = await fs.readFile(sourcePath, 'utf8');
  
  // 1. 替换 package 声明
  const packagePattern = new RegExp(`package\\s+${oldPackage.replace(/\./g, '\\.')}`, 'g');
  content = content.replace(packagePattern, `package ${newPackage}`);
  
  // 2. 替换普通 import 语句
  const importPattern = new RegExp(`import\\s+${oldPackage.replace(/\./g, '\\.')}`, 'g');
  content = content.replace(importPattern, `import ${newPackage}`);
  
  // 3. 替换 static import
  const staticImportPattern = new RegExp(`import\\s+static\\s+${oldPackage.replace(/\./g, '\\.')}`, 'g');
  content = content.replace(staticImportPattern, `import static ${newPackage}`);
  
  // 4. 替换 extends
  const extendsPattern = new RegExp(`extends\\s+${oldPackage.replace(/\./g, '\\.')}`, 'g');
  content = content.replace(extendsPattern, `extends ${newPackage}`);
  
  // 5. 替换 implements
  const implementsPattern = new RegExp(`implements\\s+${oldPackage.replace(/\./g, '\\.')}`, 'g');
  content = content.replace(implementsPattern, `implements ${newPackage}`);
  
  // 6. 替换注解
  const annotationPattern = new RegExp(`@${oldPackage.replace(/\./g, '\\.')}`, 'g');
  content = content.replace(annotationPattern, `@${newPackage}`);
  
  // 7. 替换泛型
  const genericPattern = new RegExp(`<${oldPackage.replace(/\./g, '\\.')}`, 'g');
  content = content.replace(genericPattern, `<${newPackage}`);
  
  // 8. 替换完整类名
  const fullyQualifiedPattern = new RegExp(`\\b${oldPackage.replace(/\./g, '\\.')}\\.(\\w+)`, 'g');
  content = content.replace(fullyQualifiedPattern, `${newPackage}.$1`);
  
  // 9. 如果有类前缀，替换类名
  if (oldPrefix && newPrefix) {
    content = replacePrefixedIdentifiers(content, oldPrefix, newPrefix);
  }
  
  // 修改文件名
  const fileName = path.basename(targetPath);
  let newTargetPath = targetPath;
  
  if (oldPrefix && newPrefix && fileName.startsWith(oldPrefix)) {
    const newFileName = fileName.replace(new RegExp(`^${escapeRegExp(oldPrefix)}`), newPrefix);
    newTargetPath = path.join(path.dirname(targetPath), newFileName);
  }
  
  await fs.writeFile(newTargetPath, content, 'utf8');
  if (oldPrefix && newPrefix) {
    validateReplacement(content, oldPrefix, newPrefix, newTargetPath);
  }
  
  return newTargetPath;
}

// 检查是否应该添加随机代码
function shouldAddRandomCode(content, isKotlin) {
  // 检查是否是 interface
  if (/^\s*public\s+interface\s+\w+/m.test(content) || 
      /^\s*interface\s+\w+/m.test(content)) {
    return false;
  }
  
  // 检查是否整个文件都被注释
  const lines = content.split('\n');
  let codeLineCount = 0;
  let commentLineCount = 0;
  let inBlockComment = false;
  
  for (const line of lines) {
    const trimmed = line.trim();
    
    // 跳过空行和 import
    if (trimmed === '' || trimmed.startsWith('package ') || trimmed.startsWith('import ')) {
      continue;
    }
    
    // 检查块注释
    if (trimmed.startsWith('/*')) {
      inBlockComment = true;
    }
    if (trimmed.includes('*/')) {
      inBlockComment = false;
      commentLineCount++;
      continue;
    }
    
    if (inBlockComment) {
      commentLineCount++;
    } else if (trimmed.startsWith('//')) {
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

// 为 Android 文件添加随机代码
async function addRandomCodeToAndroidFile(filePath, prefix, methodCount, varCount) {
  let content = await fs.readFile(filePath, 'utf8');
  const isKotlin = filePath.endsWith('.kt');
  
  // 检查是否应该添加随机代码
  if (!shouldAddRandomCode(content, isKotlin)) {
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
    const varType = getRandomType(isKotlin);
    const defaultValue = getRandomDefaultValue(varType, isKotlin);
    
    if (isKotlin) {
      randomCode += `    private var ${varName}: ${varType} = ${defaultValue}\n`;
    } else {
      randomCode += `    private ${varType} ${varName} = ${defaultValue};\n`;
    }
  }
  
  randomCode += '\n';
  
  // 生成随机方法
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

// 获取随机类型
function getRandomType(isKotlin) {
  const types = isKotlin 
    ? ['Int', 'String', 'Boolean', 'Long', 'Double', 'Float']
    : ['int', 'String', 'boolean', 'long', 'double', 'float'];
  return types[Math.floor(Math.random() * types.length)];
}

// 获取随机默认值
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

module.exports = {
  processAndroidFile,
  addRandomCodeToAndroidFile,
  extractPrefixedIdentifiers,
  normalizeDuplicatePrefixes,
  replacePrefixedIdentifiers
};
