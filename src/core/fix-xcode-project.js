#!/usr/bin/env node

/**
 * 修复 Xcode 项目文件引用
 * 用于已经替换完成但 Xcode 引用未更新的项目
 */

const fs = require('fs-extra');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function findXcodeProject(projectPath) {
  const files = await fs.readdir(projectPath);
  const xcodeProj = files.find(f => f.endsWith('.xcodeproj'));
  
  if (!xcodeProj) {
    return null;
  }
  
  return path.join(projectPath, xcodeProj, 'project.pbxproj');
}

async function scanSwiftFiles(projectPath) {
  const swiftFiles = [];
  
  async function scan(dir) {
    const files = await fs.readdir(dir);
    
    for (const file of files) {
      // 跳过特定目录
      if (file.startsWith('.') || file === 'Pods' || file === 'build' || file === 'DerivedData') {
        continue;
      }
      
      const filePath = path.join(dir, file);
      const stat = await fs.stat(filePath);
      
      if (stat.isDirectory()) {
        await scan(filePath);
      } else if (file.endsWith('.swift')) {
        swiftFiles.push({
          name: file,
          relativePath: path.relative(projectPath, filePath)
        });
      }
    }
  }
  
  await scan(projectPath);
  return swiftFiles;
}

async function fixXcodeProject() {
  console.log('='.repeat(60));
  console.log('Xcode 项目引用修复工具');
  console.log('='.repeat(60));
  console.log('');
  
  // 1. 获取项目路径
  const projectPath = await question('请输入项目路径（拖拽文件夹到此处）: ');
  const cleanPath = projectPath.trim().replace(/^['"]|['"]$/g, '');
  
  if (!(await fs.pathExists(cleanPath))) {
    console.error('❌ 路径不存在:', cleanPath);
    rl.close();
    return;
  }
  
  // 2. 查找 .pbxproj 文件
  console.log('\n🔍 正在查找 Xcode 项目文件...');
  const pbxprojPath = await findXcodeProject(cleanPath);
  
  if (!pbxprojPath) {
    console.error('❌ 未找到 .xcodeproj 文件');
    rl.close();
    return;
  }
  
  console.log('✅ 找到项目文件:', pbxprojPath);
  
  // 3. 备份原文件
  const backupPath = pbxprojPath + '.backup.' + Date.now();
  await fs.copy(pbxprojPath, backupPath);
  console.log('✅ 已创建备份:', backupPath);
  
  // 4. 获取前缀
  console.log('');
  const oldPrefix = await question('请输入旧前缀（例如 ABC）: ');
  const newPrefix = await question('请输入新前缀（例如 XYZ）: ');
  
  if (!oldPrefix.trim() || !newPrefix.trim()) {
    console.error('❌ 前缀不能为空');
    rl.close();
    return;
  }
  
  // 5. 扫描当前的 Swift 文件
  console.log('\n🔍 正在扫描项目中的 Swift 文件...');
  const swiftFiles = await scanSwiftFiles(cleanPath);
  console.log(`✅ 找到 ${swiftFiles.length} 个 Swift 文件`);
  
  // 6. 读取并更新 pbxproj 文件
  console.log('\n⚙️  正在更新项目文件...');
  let content = await fs.readFile(pbxprojPath, 'utf8');
  
  // 记录更改
  let changeCount = 0;
  
  // 替换所有以旧前缀开头的引用
  const oldPrefixPattern = new RegExp(`\\b${oldPrefix}([A-Z][a-zA-Z0-9_]*)`, 'g');
  content = content.replace(oldPrefixPattern, (match) => {
    changeCount++;
    return match.replace(oldPrefix, newPrefix);
  });
  
  // 保存更新后的文件
  await fs.writeFile(pbxprojPath, content, 'utf8');
  
  console.log(`✅ 完成！共替换 ${changeCount} 处引用`);
  console.log('');
  console.log('='.repeat(60));
  console.log('📋 后续步骤：');
  console.log('='.repeat(60));
  console.log('1. 在 Xcode 中关闭项目（如果已打开）');
  console.log('2. 重新打开项目');
  console.log('3. Clean Build Folder (⌘⇧K)');
  console.log('4. 重新构建项目 (⌘B)');
  console.log('');
  console.log('💡 如果还有问题，可以恢复备份文件：');
  console.log(`   ${backupPath}`);
  console.log('');
  
  rl.close();
}

// 运行
fixXcodeProject().catch(error => {
  console.error('❌ 错误:', error.message);
  rl.close();
  process.exit(1);
});
