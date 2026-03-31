const fs = require('fs-extra');
const path = require('path');

// 修改类变量值
async function modifyClassVariables(projectPath, classRules, platform) {
  const results = {
    total: classRules.length,
    success: 0,
    failed: 0,
    errors: []
  };
  
  for (const rule of classRules) {
    if (!rule.className || rule.variables.length === 0) {
      continue; // 跳过空规则
    }
    
    try {
      if (platform === 'ios') {
        await modifySwiftClassVariables(projectPath, rule);
      } else {
        await modifyAndroidClassVariables(projectPath, rule);
      }
      results.success++;
    } catch (error) {
      results.failed++;
      results.errors.push({
        className: rule.className,
        error: error.message
      });
      console.error(`修改类 ${rule.className} 失败:`, error);
    }
  }
  
  return results;
}

// 修改 Swift 类的变量
async function modifySwiftClassVariables(projectPath, rule) {
  const { className, variables } = rule;
  
  // 查找包含该类的 Swift 文件
  const classFile = await findSwiftClassFile(projectPath, className);
  if (!classFile) {
    throw new Error(`未找到类文件: ${className}`);
  }
  
  let content = await fs.readFile(classFile, 'utf8');
  let modified = false;
  
  // 修改每个变量
  for (const variable of variables) {
    if (!variable.name || !variable.value) {
      continue;
    }
    
    // Swift 变量声明模式
    // let API_URL = "old_value"
    // var API_URL = "old_value"
    // static let API_URL = "old_value"
    // static var API_URL = "old_value"
    
    const patterns = [
      // let/var variableName = value
      new RegExp(`(\\b(?:let|var)\\s+${variable.name}\\s*=\\s*)([^\\n;]+)`, 'g'),
      // static let/var variableName = value
      new RegExp(`(\\bstatic\\s+(?:let|var)\\s+${variable.name}\\s*=\\s*)([^\\n;]+)`, 'g'),
      // class var variableName: Type = value
      new RegExp(`(\\bclass\\s+var\\s+${variable.name}\\s*:[^=]+=\\s*)([^\\n;]+)`, 'g'),
    ];
    
    for (const pattern of patterns) {
      const newContent = content.replace(pattern, (match, prefix, oldValue) => {
        modified = true;
        return prefix + variable.value;
      });
      
      if (newContent !== content) {
        content = newContent;
        console.log(`修改 Swift 变量: ${className}.${variable.name} = ${variable.value}`);
        break;
      }
    }
  }
  
  if (modified) {
    await fs.writeFile(classFile, content, 'utf8');
    console.log(`成功修改类: ${className}`);
  } else {
    console.warn(`未找到要修改的变量在类 ${className} 中`);
  }
}

// 修改 Android 类的变量
async function modifyAndroidClassVariables(projectPath, rule) {
  const { className, variables } = rule;
  
  // 查找包含该类的 Java/Kotlin 文件
  const classFile = await findAndroidClassFile(projectPath, className);
  if (!classFile) {
    throw new Error(`未找到类文件: ${className}`);
  }
  
  const isKotlin = classFile.endsWith('.kt');
  let content = await fs.readFile(classFile, 'utf8');
  let modified = false;
  
  // 修改每个变量
  for (const variable of variables) {
    if (!variable.name || !variable.value) {
      continue;
    }
    
    if (isKotlin) {
      // Kotlin 变量声明模式
      // val API_URL = "old_value"
      // var API_URL = "old_value"
      // const val API_URL = "old_value"
      
      const patterns = [
        new RegExp(`(\\b(?:val|var)\\s+${variable.name}\\s*=\\s*)([^\\n;]+)`, 'g'),
        new RegExp(`(\\bconst\\s+val\\s+${variable.name}\\s*=\\s*)([^\\n;]+)`, 'g'),
        new RegExp(`(\\b(?:val|var)\\s+${variable.name}\\s*:[^=]+=\\s*)([^\\n;]+)`, 'g'),
      ];
      
      for (const pattern of patterns) {
        const newContent = content.replace(pattern, (match, prefix, oldValue) => {
          modified = true;
          return prefix + variable.value;
        });
        
        if (newContent !== content) {
          content = newContent;
          console.log(`修改 Kotlin 变量: ${className}.${variable.name} = ${variable.value}`);
          break;
        }
      }
    } else {
      // Java 变量声明模式
      // public static final String API_URL = "old_value";
      // private static String API_URL = "old_value";
      // String API_URL = "old_value";
      
      const patterns = [
        new RegExp(`(\\b(?:public|private|protected)?\\s*(?:static)?\\s*(?:final)?\\s*\\w+\\s+${variable.name}\\s*=\\s*)([^;]+);`, 'g'),
      ];
      
      for (const pattern of patterns) {
        const newContent = content.replace(pattern, (match, prefix, oldValue) => {
          modified = true;
          return prefix + variable.value + ';';
        });
        
        if (newContent !== content) {
          content = newContent;
          console.log(`修改 Java 变量: ${className}.${variable.name} = ${variable.value}`);
          break;
        }
      }
    }
  }
  
  if (modified) {
    await fs.writeFile(classFile, content, 'utf8');
    console.log(`成功修改类: ${className}`);
  } else {
    console.warn(`未找到要修改的变量在类 ${className} 中`);
  }
}

// 查找 Swift 类文件
async function findSwiftClassFile(projectPath, className) {
  let foundFile = null;
  
  async function search(dir, depth = 0) {
    if (depth > 10 || foundFile) return;
    
    try {
      const items = await fs.readdir(dir, { withFileTypes: true });
      
      for (const item of items) {
        if (foundFile) break;
        
        const fullPath = path.join(dir, item.name);
        
        if (item.isDirectory()) {
          const skipDirs = ['Pods', 'build', 'DerivedData', '.git', 'node_modules'];
          if (skipDirs.includes(item.name) || item.name.startsWith('.')) {
            continue;
          }
          await search(fullPath, depth + 1);
        } else if (item.isFile() && item.name.endsWith('.swift')) {
          // 读取文件检查是否包含该类
          const content = await fs.readFile(fullPath, 'utf8');
          const classPattern = new RegExp(`\\b(?:class|struct|enum)\\s+${className}\\b`);
          
          if (classPattern.test(content)) {
            foundFile = fullPath;
          }
        }
      }
    } catch (error) {
      // 忽略访问错误
    }
  }
  
  await search(projectPath);
  return foundFile;
}

// 查找 Android 类文件
async function findAndroidClassFile(projectPath, className) {
  let foundFile = null;
  
  async function search(dir, depth = 0) {
    if (depth > 10 || foundFile) return;
    
    try {
      const items = await fs.readdir(dir, { withFileTypes: true });
      
      for (const item of items) {
        if (foundFile) break;
        
        const fullPath = path.join(dir, item.name);
        
        if (item.isDirectory()) {
          const skipDirs = ['build', '.gradle', '.git', 'node_modules'];
          if (skipDirs.includes(item.name) || item.name.startsWith('.')) {
            continue;
          }
          await search(fullPath, depth + 1);
        } else if (item.isFile() && (item.name.endsWith('.kt') || item.name.endsWith('.java'))) {
          // 读取文件检查是否包含该类
          const content = await fs.readFile(fullPath, 'utf8');
          const classPattern = new RegExp(`\\b(?:class|interface|object)\\s+${className}\\b`);
          
          if (classPattern.test(content)) {
            foundFile = fullPath;
          }
        }
      }
    } catch (error) {
      // 忽略访问错误
    }
  }
  
  await search(projectPath);
  return foundFile;
}

module.exports = {
  modifyClassVariables
};
