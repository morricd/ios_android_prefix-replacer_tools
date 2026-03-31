const fs = require('fs-extra');
const path = require('path');
const { app } = require('electron');

// 配置文件存储目录
const CONFIG_DIR = path.join(app.getPath('userData'), 'configs');

// 确保配置目录存在
async function ensureConfigDir() {
  await fs.ensureDir(CONFIG_DIR);
}

// 保存配置文件
async function saveConfig(platform, configName, data) {
  await ensureConfigDir();
  
  const fileName = `${platform}_${configName}_${Date.now()}.json`;
  const filePath = path.join(CONFIG_DIR, fileName);
  
  const config = {
    platform,
    name: configName,
    createdAt: new Date().toISOString(),
    data
  };
  
  await fs.writeFile(filePath, JSON.stringify(config, null, 2), 'utf8');
  
  return {
    fileName,
    filePath,
    config
  };
}

// 获取所有配置文件
async function listConfigs(platform) {
  await ensureConfigDir();
  
  const files = await fs.readdir(CONFIG_DIR);
  const configs = [];
  
  for (const file of files) {
    if (file.startsWith(`${platform}_`) && file.endsWith('.json')) {
      try {
        const filePath = path.join(CONFIG_DIR, file);
        const content = await fs.readFile(filePath, 'utf8');
        const config = JSON.parse(content);
        
        configs.push({
          fileName: file,
          filePath,
          ...config
        });
      } catch (error) {
        console.error(`读取配置文件失败: ${file}`, error);
      }
    }
  }
  
  // 按创建时间倒序排序
  configs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  
  return configs;
}

// 加载配置文件
async function loadConfig(filePath) {
  try {
    const content = await fs.readFile(filePath, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    console.error('加载配置文件失败:', error);
    return null;
  }
}

// 删除配置文件
async function deleteConfig(filePath) {
  try {
    await fs.remove(filePath);
    return true;
  } catch (error) {
    console.error('删除配置文件失败:', error);
    return false;
  }
}

// 导出配置到指定位置
async function exportConfig(filePath, targetPath) {
  try {
    await fs.copy(filePath, targetPath);
    return true;
  } catch (error) {
    console.error('导出配置文件失败:', error);
    return false;
  }
}

// 导入配置文件
async function importConfig(sourcePath, platform) {
  try {
    const content = await fs.readFile(sourcePath, 'utf8');
    const config = JSON.parse(content);
    
    // 验证配置格式
    if (!config.platform || !config.name || !config.data) {
      throw new Error('配置文件格式不正确');
    }
    
    // 保存到配置目录
    const fileName = `${platform}_${config.name}_${Date.now()}.json`;
    const filePath = path.join(CONFIG_DIR, fileName);
    
    await fs.writeFile(filePath, JSON.stringify(config, null, 2), 'utf8');
    
    return {
      fileName,
      filePath,
      config
    };
  } catch (error) {
    console.error('导入配置文件失败:', error);
    return null;
  }
}

module.exports = {
  saveConfig,
  listConfigs,
  loadConfig,
  deleteConfig,
  exportConfig,
  importConfig,
  CONFIG_DIR
};
