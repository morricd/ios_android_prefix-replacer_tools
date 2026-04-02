const fs = require('fs-extra');
const path = require('path');

// 图片替换处理
async function replaceImages(projectPath, imageFolderPath, imageMappings, platform, options = {}) {
  const { renameToNewName = false, autoMatchByFileName = false } = options;
  let mappingsToRun = Array.isArray(imageMappings) ? [...imageMappings] : [];
  const sourceIndex = await buildImageSourceIndex(imageFolderPath);
  
  if (mappingsToRun.length === 0 && autoMatchByFileName) {
    mappingsToRun = Array.from(sourceIndex.names).map((fileName) => ({
      oldName: fileName,
      newName: fileName
    }));
  }
  
  const results = {
    total: mappingsToRun.length,
    success: 0,
    failed: 0,
    errors: [],
    replacedFiles: []
  };
  
  for (const mapping of mappingsToRun) {
    if (!mapping.oldName || !mapping.newName) {
      continue; // 跳过空映射
    }
    
    try {
      if (platform === 'ios') {
        const replacedPaths = await replaceIOSImage(projectPath, imageFolderPath, mapping, { renameToNewName, sourceIndex });
        results.replacedFiles.push(...replacedPaths);
      } else {
        const replacedPaths = await replaceAndroidImage(projectPath, imageFolderPath, mapping, { renameToNewName, sourceIndex });
        results.replacedFiles.push(...replacedPaths);
      }
      results.success++;
    } catch (error) {
      results.failed++;
      results.errors.push({
        mapping,
        error: error.message
      });
      console.error(`替换图片失败: ${mapping.oldName} → ${mapping.newName}`, error);
    }
  }
  
  return results;
}

async function previewImageReplacements(projectPath, imageFolderPath, imageMappings, platform, options = {}) {
  const { autoMatchByFileName = false } = options;
  let mappingsToRun = Array.isArray(imageMappings) ? [...imageMappings] : [];
  const sourceIndex = await buildImageSourceIndex(imageFolderPath);
  
  if (mappingsToRun.length === 0 && autoMatchByFileName) {
    mappingsToRun = Array.from(sourceIndex.names).map((fileName) => ({
      oldName: fileName,
      newName: fileName
    }));
  }
  
  const matches = [];
  const missing = [];
  
  for (const mapping of mappingsToRun) {
    if (!mapping.oldName || !mapping.newName) {
      continue;
    }
    
    const newImagePath = await resolveNewImagePath(imageFolderPath, mapping.newName, sourceIndex);
    const newImageExists = await fs.pathExists(newImagePath);
    
    if (!newImageExists) {
      missing.push({
        oldName: mapping.oldName,
        newName: mapping.newName,
        reason: `新图片不存在: ${mapping.newName}`
      });
      continue;
    }
    
    const targets = platform === 'ios'
      ? await findIOSReplacementTargets(projectPath, mapping.oldName)
      : await findAndroidReplacementTargets(projectPath, mapping.oldName);
    
    if (targets.length === 0) {
      missing.push({
        oldName: mapping.oldName,
        newName: mapping.newName,
        reason: `项目中未找到旧图片: ${mapping.oldName}`
      });
      continue;
    }
    
    matches.push({
      oldName: mapping.oldName,
      newName: mapping.newName,
      count: targets.length,
      targets
    });
  }
  
  return {
    totalMappings: mappingsToRun.length,
    replaceableCount: matches.length,
    targetFileCount: matches.reduce((sum, item) => sum + item.count, 0),
    missingCount: missing.length,
    matches,
    missing
  };
}

async function buildImageSourceIndex(imageFolderPath) {
  const imageFiles = await listImageFiles(imageFolderPath);
  const byName = new Map();
  
  for (const filePath of imageFiles) {
    const name = path.basename(filePath);
    if (!byName.has(name)) {
      byName.set(name, filePath);
    }
  }
  
  return {
    byName,
    names: new Set(byName.keys())
  };
}

async function resolveNewImagePath(imageFolderPath, fileName, sourceIndex) {
  const directPath = path.join(imageFolderPath, fileName);
  if (await fs.pathExists(directPath)) {
    return directPath;
  }
  
  if (sourceIndex && sourceIndex.byName && sourceIndex.byName.has(fileName)) {
    return sourceIndex.byName.get(fileName);
  }
  
  return directPath;
}

async function listImageFiles(rootDir) {
  const imagePaths = [];
  const imageExtPattern = /\.(png|jpg|jpeg|webp|gif|bmp|svg|pdf)$/i;
  
  async function walk(currentDir) {
    let items = [];
    try {
      items = await fs.readdir(currentDir, { withFileTypes: true });
    } catch (error) {
      return;
    }
    
    for (const item of items) {
      const fullPath = path.join(currentDir, item.name);
      if (item.isDirectory()) {
        await walk(fullPath);
      } else if (imageExtPattern.test(item.name)) {
        imagePaths.push(fullPath);
      }
    }
  }
  
  await walk(rootDir);
  return imagePaths;
}

// 替换 iOS 图片
async function replaceIOSImage(projectPath, imageFolderPath, mapping, options = {}) {
  const { renameToNewName = false, sourceIndex = null } = options;
  const { oldName, newName } = mapping;
  
  // 查找 Assets.xcassets 目录
  const assetsDir = await findAssetsDirectory(projectPath);
  if (!assetsDir) {
    throw new Error('未找到 Assets.xcassets 目录');
  }
  
  // 查找旧图片的 imageset
  const oldImageset = await findImageset(assetsDir, oldName);
  if (!oldImageset) {
    throw new Error(`未找到图片: ${oldName}`);
  }
  
  // 从源文件夹找新图片
  const newImagePath = await resolveNewImagePath(imageFolderPath, newName, sourceIndex);
  if (!await fs.pathExists(newImagePath)) {
    throw new Error(`新图片不存在: ${newName}`);
  }
  
  // 读取 Contents.json
  const contentsPath = path.join(oldImageset, 'Contents.json');
  const contents = JSON.parse(await fs.readFile(contentsPath, 'utf8'));
  
  if (renameToNewName) {
    const oldFiles = new Set();
    for (const image of contents.images) {
      if (image.filename) {
        oldFiles.add(image.filename);
        image.filename = newName;
      }
    }
    
    await fs.writeFile(contentsPath, JSON.stringify(contents, null, 2), 'utf8');
    await fs.copy(newImagePath, path.join(oldImageset, newName));
    
    for (const oldFile of oldFiles) {
      if (oldFile === newName) {
        continue;
      }
      const oldPath = path.join(oldImageset, oldFile);
      if (await fs.pathExists(oldPath)) {
        await fs.remove(oldPath);
      }
    }
  } else {
    // 替换图片文件
    for (const image of contents.images) {
      if (image.filename) {
        const targetPath = path.join(oldImageset, image.filename);
        
        // 根据 scale 复制对应的图片
        // 如果只有一张图，复制到所有尺寸
        await fs.copy(newImagePath, targetPath);
      }
    }
  }
  
  console.log(`成功替换 iOS 图片: ${oldName} → ${newName}`);
  const targets = await findIOSReplacementTargets(projectPath, renameToNewName ? newName : oldName);
  return targets;
}

async function findIOSReplacementTargets(projectPath, oldName) {
  const assetsDir = await findAssetsDirectory(projectPath);
  if (!assetsDir) {
    return [];
  }
  
  const oldImageset = await findImageset(assetsDir, oldName);
  if (!oldImageset) {
    return [];
  }
  
  const contentsPath = path.join(oldImageset, 'Contents.json');
  if (!await fs.pathExists(contentsPath)) {
    return [oldImageset];
  }
  
  try {
    const contents = JSON.parse(await fs.readFile(contentsPath, 'utf8'));
    const imageFiles = (contents.images || [])
      .filter((image) => !!image.filename)
      .map((image) => path.join(oldImageset, image.filename));
    return imageFiles.length > 0 ? imageFiles : [oldImageset];
  } catch (error) {
    return [oldImageset];
  }
}

// 替换 Android 图片
async function replaceAndroidImage(projectPath, imageFolderPath, mapping, options = {}) {
  const { renameToNewName = false, sourceIndex = null } = options;
  const { oldName, newName } = mapping;
  
  // 查找所有 res 目录
  const resDirectories = await findAndroidResDirectories(projectPath);
  if (resDirectories.length === 0) {
    throw new Error('未找到 res 目录');
  }
  
  let replaced = false;
  const replacedPaths = [];
  
  // 遍历所有 drawable 和 mipmap 目录
  for (const resDir of resDirectories) {
    const drawableDirs = await findDrawableDirectories(resDir);
    
    for (const drawableDir of drawableDirs) {
      const oldImagePath = path.join(drawableDir, oldName);
      
      if (await fs.pathExists(oldImagePath)) {
        // 从源文件夹找新图片
        const newImagePath = await resolveNewImagePath(imageFolderPath, newName, sourceIndex);
        
        if (!await fs.pathExists(newImagePath)) {
          console.warn(`新图片不存在: ${newName}，跳过 ${drawableDir}`);
          continue;
        }
        
        if (renameToNewName) {
          // 复制为新文件名，并移除旧文件名
          const newTargetPath = path.join(drawableDir, newName);
          await fs.copy(newImagePath, newTargetPath);
          if (newTargetPath !== oldImagePath && await fs.pathExists(oldImagePath)) {
            await fs.remove(oldImagePath);
          }
          replacedPaths.push(newTargetPath);
        } else {
          // 复制新图片并覆盖旧图片（保持旧文件名）
          await fs.copy(newImagePath, oldImagePath);
          replacedPaths.push(oldImagePath);
        }
        replaced = true;
        
        console.log(`替换图片: ${drawableDir}/${oldName}`);
      }
    }
  }
  
  if (!replaced) {
    throw new Error(`未找到要替换的图片: ${oldName}`);
  }
  
  console.log(`成功替换 Android 图片: ${oldName} → ${newName}`);
  return replacedPaths;
}

async function normalizeUnreplacedImages(projectPath, platform, replacedFiles = []) {
  const replacedSet = new Set((replacedFiles || []).map((filePath) => path.resolve(filePath)));
  const candidates = platform === 'ios'
    ? await listIOSImageFiles(projectPath)
    : await listAndroidImageFiles(projectPath);
  
  let normalizedCount = 0;
  for (const filePath of candidates) {
    const resolvedPath = path.resolve(filePath);
    if (replacedSet.has(resolvedPath)) {
      continue;
    }
    try {
      const changed = await rewriteImageBinary(filePath);
      if (changed) {
        normalizedCount++;
      }
    } catch (error) {
      console.warn(`重编码失败，已跳过: ${filePath}`, error.message);
    }
  }
  
  return { normalizedCount };
}

async function listIOSImageFiles(projectPath) {
  const assetsDir = await findAssetsDirectory(projectPath);
  if (!assetsDir) {
    return [];
  }
  
  const results = [];
  const supported = /\.(png|jpe?g)$/i;
  
  async function walk(currentDir) {
    const entries = await fs.readdir(currentDir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);
      if (entry.isDirectory()) {
        await walk(fullPath);
      } else if (supported.test(entry.name)) {
        results.push(fullPath);
      }
    }
  }
  
  await walk(assetsDir);
  return results;
}

async function listAndroidImageFiles(projectPath) {
  const resDirs = await findAndroidResDirectories(projectPath);
  const results = [];
  const supported = /\.(png|jpe?g)$/i;
  
  for (const resDir of resDirs) {
    const drawableDirs = await findDrawableDirectories(resDir);
    for (const drawableDir of drawableDirs) {
      const entries = await fs.readdir(drawableDir, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.isFile() && supported.test(entry.name)) {
          results.push(path.join(drawableDir, entry.name));
        }
      }
    }
  }
  
  return results;
}

async function rewriteImageBinary(filePath) {
  const buffer = await fs.readFile(filePath);
  const lower = filePath.toLowerCase();
  
  if (lower.endsWith('.png')) {
    const updated = rewritePngWithTextChunk(buffer, `normalized=${Date.now()}`);
    if (updated) {
      await fs.writeFile(filePath, updated);
      return true;
    }
    return false;
  }
  
  if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) {
    const updated = rewriteJpegWithComment(buffer, `normalized=${Date.now()}`);
    if (updated) {
      await fs.writeFile(filePath, updated);
      return true;
    }
    return false;
  }
  
  return false;
}

function rewritePngWithTextChunk(buffer, text) {
  const signature = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
  if (buffer.length < 8 || !buffer.subarray(0, 8).equals(signature)) {
    return null;
  }
  
  let offset = 8;
  while (offset + 12 <= buffer.length) {
    const length = buffer.readUInt32BE(offset);
    const type = buffer.subarray(offset + 4, offset + 8).toString('ascii');
    const chunkEnd = offset + 12 + length;
    if (chunkEnd > buffer.length) {
      return null;
    }
    
    if (type === 'IEND') {
      const keyword = Buffer.from('Comment', 'latin1');
      const value = Buffer.from(text, 'latin1');
      const data = Buffer.concat([keyword, Buffer.from([0x00]), value]);
      const lenBuf = Buffer.alloc(4);
      lenBuf.writeUInt32BE(data.length, 0);
      const typeBuf = Buffer.from('tEXt', 'ascii');
      const crcBuf = Buffer.alloc(4);
      crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
      const chunk = Buffer.concat([lenBuf, typeBuf, data, crcBuf]);
      return Buffer.concat([buffer.subarray(0, offset), chunk, buffer.subarray(offset)]);
    }
    
    offset = chunkEnd;
  }
  
  return null;
}

function rewriteJpegWithComment(buffer, text) {
  if (buffer.length < 4 || buffer[0] !== 0xFF || buffer[1] !== 0xD8) {
    return null;
  }
  
  const comment = Buffer.from(text, 'utf8');
  const length = comment.length + 2;
  if (length > 0xFFFF) {
    return null;
  }
  
  const marker = Buffer.from([0xFF, 0xFE, (length >> 8) & 0xFF, length & 0xFF]);
  const segment = Buffer.concat([marker, comment]);
  return Buffer.concat([buffer.subarray(0, 2), segment, buffer.subarray(2)]);
}

function crc32(buffer) {
  let crc = 0xFFFFFFFF;
  for (let i = 0; i < buffer.length; i++) {
    crc ^= buffer[i];
    for (let j = 0; j < 8; j++) {
      const mask = -(crc & 1);
      crc = (crc >>> 1) ^ (0xEDB88320 & mask);
    }
  }
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

async function findAndroidReplacementTargets(projectPath, oldName) {
  const targets = [];
  const resDirectories = await findAndroidResDirectories(projectPath);
  
  for (const resDir of resDirectories) {
    const drawableDirs = await findDrawableDirectories(resDir);
    for (const drawableDir of drawableDirs) {
      const oldImagePath = path.join(drawableDir, oldName);
      if (await fs.pathExists(oldImagePath)) {
        targets.push(oldImagePath);
      }
    }
  }
  
  return targets;
}

// 查找 iOS Assets 目录
async function findAssetsDirectory(projectPath) {
  const possiblePaths = [
    'Assets.xcassets',
    '*/Assets.xcassets',
    '*/*/Assets.xcassets'
  ];
  
  for (const pattern of possiblePaths) {
    const fullPath = path.join(projectPath, pattern);
    const matches = await findDirectories(projectPath, pattern);
    if (matches.length > 0) {
      return matches[0];
    }
  }
  
  return null;
}

// 查找 imageset
async function findImageset(assetsDir, imageName) {
  // 移除扩展名
  const nameWithoutExt = imageName.replace(/\.(png|jpg|jpeg|pdf)$/i, '');
  const imagesetName = `${nameWithoutExt}.imageset`;
  
  async function search(dir) {
    const items = await fs.readdir(dir, { withFileTypes: true });
    
    for (const item of items) {
      if (item.isDirectory()) {
        const fullPath = path.join(dir, item.name);
        
        if (item.name === imagesetName) {
          return fullPath;
        }
        
        // 递归查找
        const found = await search(fullPath);
        if (found) return found;
      }
    }
    
    return null;
  }
  
  return await search(assetsDir);
}

// 查找 Android res 目录
async function findAndroidResDirectories(projectPath) {
  const resDirs = [];
  
  async function search(dir, depth = 0) {
    if (depth > 5) return; // 限制搜索深度
    
    try {
      const items = await fs.readdir(dir, { withFileTypes: true });
      
      for (const item of items) {
        if (item.isDirectory()) {
          const fullPath = path.join(dir, item.name);
          
          // 跳过某些目录
          if (item.name === 'build' || item.name === 'node_modules' || item.name.startsWith('.')) {
            continue;
          }
          
          if (item.name === 'res') {
            resDirs.push(fullPath);
          } else {
            await search(fullPath, depth + 1);
          }
        }
      }
    } catch (error) {
      // 忽略访问错误
    }
  }
  
  await search(projectPath);
  return resDirs;
}

// 查找 drawable 目录
async function findDrawableDirectories(resDir) {
  const drawableDirs = [];
  
  try {
    const items = await fs.readdir(resDir, { withFileTypes: true });
    
    for (const item of items) {
      if (item.isDirectory() && (item.name.startsWith('drawable') || item.name.startsWith('mipmap'))) {
        drawableDirs.push(path.join(resDir, item.name));
      }
    }
  } catch (error) {
    console.error('读取 res 目录失败:', error);
  }
  
  return drawableDirs;
}

// 辅助函数：查找匹配的目录
async function findDirectories(basePath, pattern) {
  const results = [];
  const parts = pattern.split('/');
  
  async function search(currentPath, partIndex) {
    if (partIndex >= parts.length) {
      if (await fs.pathExists(currentPath)) {
        results.push(currentPath);
      }
      return;
    }
    
    const part = parts[partIndex];
    
    if (part === '*') {
      // 通配符
      try {
        const items = await fs.readdir(currentPath, { withFileTypes: true });
        for (const item of items) {
          if (item.isDirectory() && !item.name.startsWith('.')) {
            await search(path.join(currentPath, item.name), partIndex + 1);
          }
        }
      } catch (error) {
        // 忽略
      }
    } else {
      // 具体目录名
      await search(path.join(currentPath, part), partIndex + 1);
    }
  }
  
  await search(basePath, 0);
  return results;
}

module.exports = {
  replaceImages,
  previewImageReplacements,
  normalizeUnreplacedImages
};
