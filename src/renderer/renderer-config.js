// 配置文件管理脚本
// 替换 localStorage，使用文件系统保存配置

(function() {
  const { ipcRenderer } = require('electron');
  
  console.log('[Config Manager] Script loaded');
  
  // 配置文件列表缓存
  let variableConfigsIOS = [];
  let variableConfigsAndroid = [];
  let imageConfigsIOS = [];
  let imageConfigsAndroid = [];
  
  // 加载所有配置文件
  async function loadAllConfigs() {
    console.log('[Config] Loading all configs...');
    try {
      // 加载 iOS 变量配置
      variableConfigsIOS = await ipcRenderer.invoke('list-configs', 'ios_variable');
      console.log('[Config] iOS variable configs:', variableConfigsIOS.length);
      updateConfigSelect('variableConfigSelectIOS', variableConfigsIOS);
      
      // 加载 Android 变量配置
      variableConfigsAndroid = await ipcRenderer.invoke('list-configs', 'android_variable');
      console.log('[Config] Android variable configs:', variableConfigsAndroid.length);
      updateConfigSelect('variableConfigSelectAndroid', variableConfigsAndroid);
      
      // 加载 iOS 图片配置
      imageConfigsIOS = await ipcRenderer.invoke('list-configs', 'ios_image');
      console.log('[Config] iOS image configs:', imageConfigsIOS.length);
      updateConfigSelect('imageConfigSelectIOS', imageConfigsIOS);
      
      // 加载 Android 图片配置
      imageConfigsAndroid = await ipcRenderer.invoke('list-configs', 'android_image');
      console.log('[Config] Android image configs:', imageConfigsAndroid.length);
      updateConfigSelect('imageConfigSelectAndroid', imageConfigsAndroid);
      
      console.log('[Config] All configs loaded');
    } catch (error) {
      console.error('[Config] Failed to load configs:', error);
    }
  }
  
  // 更新配置选择下拉框
  function updateConfigSelect(selectId, configs) {
    const select = document.getElementById(selectId);
    if (!select) {
      console.warn(`[Config] Select not found: ${selectId}`);
      return;
    }
    
    // 保存当前选中值
    const currentValue = select.value;
    
    // 清空并重建选项
    select.innerHTML = '<option value="">-- 选择配置文件或新建 --</option>';
    
    configs.forEach(config => {
      const option = document.createElement('option');
      option.value = config.filePath;
      
      const date = new Date(config.createdAt);
      const dateStr = date.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
      
      option.textContent = `${config.name} (${dateStr})`;
      select.appendChild(option);
    });
    
    // 恢复选中值
    if (currentValue && Array.from(select.options).some(opt => opt.value === currentValue)) {
      select.value = currentValue;
    }
    
    console.log(`[Config] Updated select ${selectId} with ${configs.length} configs`);
  }
  
  // 保存配置文件
  async function saveConfig(type, platform) {
    console.log(`[Config] Saving config: type=${type}, platform=${platform}`);
    
    const configName = await promptConfigName();
    if (!configName) {
      console.log('[Config] Save cancelled - no name provided');
      return;
    }
    
    let data = null;
    
    if (type === 'variable') {
      // 获取变量配置
      data = window.getClassRules ? window.getClassRules(platform) : [];
      if (!data || data.length === 0) {
        alert('没有配置数据可以保存');
        return;
      }
    } else {
      // 获取图片配置
      const mappings = window.getImageMappings ? window.getImageMappings(platform) : [];
      const folderInput = document.getElementById(`imageFolderPath${platform === 'ios' ? 'IOS' : 'Android'}`);
      const folderPath = folderInput ? folderInput.value : '';
      data = {
        imageFolderPath: folderPath,
        mappings
      };
      
      if (mappings.length === 0) {
        alert('没有图片映射规则可以保存');
        return;
      }
    }
    
    try {
      const configType = `${platform}_${type}`;
      console.log(`[Config] Saving as ${configType}: ${configName}`);
      const result = await ipcRenderer.invoke('save-config', configType, configName, data);
      
      if (result) {
        alert(`配置"${configName}"保存成功！`);
        await loadAllConfigs();
        
        // 自动选中新保存的配置
        const selectId = type === 'variable' 
          ? `variableConfigSelect${platform === 'ios' ? 'IOS' : 'Android'}`
          : `imageConfigSelect${platform === 'ios' ? 'IOS' : 'Android'}`;
        
        const select = document.getElementById(selectId);
        if (select) {
          select.value = result.filePath;
          console.log(`[Config] Auto-selected: ${result.filePath}`);
        }
      }
    } catch (error) {
      console.error('[Config] Save failed:', error);
      alert(`保存配置失败: ${error.message}`);
    }
  }
  
  // 加载配置文件
  async function loadConfigFile(filePath, type, platform) {
    if (!filePath) {
      console.log('[Config] No file path provided for load');
      return;
    }
    
    console.log(`[Config] Loading config: ${filePath}`);
    
    try {
      const config = await ipcRenderer.invoke('load-config', filePath);
      if (!config || !config.data) {
        alert('配置文件格式错误');
        return;
      }
      
      console.log(`[Config] Loaded: ${config.name}`);
      
      if (type === 'variable') {
        // 加载变量配置
        if (window.loadClassRulesFromData) {
          window.loadClassRulesFromData(platform, config.data);
          console.log(`[Config] Applied ${config.data.length} class rules`);
        } else {
          console.warn('[Config] loadClassRulesFromData not available');
        }
      } else {
        // 加载图片配置
        if (config.data.imageFolderPath) {
          const inputId = `imageFolderPath${platform === 'ios' ? 'IOS' : 'Android'}`;
          const input = document.getElementById(inputId);
          if (input) {
            input.value = config.data.imageFolderPath;
          }
        }
        
        if (config.data.mappings && window.loadImageMappingsFromData) {
          window.loadImageMappingsFromData(platform, config.data.mappings);
          console.log(`[Config] Applied ${config.data.mappings.length} image mappings`);
        } else {
          console.warn('[Config] loadImageMappingsFromData not available');
        }
      }
      
      console.log(`[Config] Successfully loaded config: ${config.name}`);
    } catch (error) {
      console.error('[Config] Load failed:', error);
      alert(`加载配置失败: ${error.message}`);
    }
  }
  
  // 删除配置文件
  async function deleteConfig(type, platform) {
    const selectId = type === 'variable'
      ? `variableConfigSelect${platform === 'ios' ? 'IOS' : 'Android'}`
      : `imageConfigSelect${platform === 'ios' ? 'IOS' : 'Android'}`;
    
    const select = document.getElementById(selectId);
    if (!select) {
      console.error(`[Config] Select not found: ${selectId}`);
      return;
    }
    
    const filePath = select.value;
    
    if (!filePath) {
      alert('请先选择要删除的配置文件');
      return;
    }
    
    if (!confirm('确定要删除这个配置文件吗？')) {
      return;
    }
    
    console.log(`[Config] Deleting: ${filePath}`);
    
    try {
      const result = await ipcRenderer.invoke('delete-config', filePath);
      if (result) {
        alert('配置文件已删除');
        select.value = '';
        await loadAllConfigs();
        console.log('[Config] Config deleted successfully');
      }
    } catch (error) {
      console.error('[Config] Delete failed:', error);
      alert(`删除配置失败: ${error.message}`);
    }
  }
  
  // 提示输入配置名称
  function promptConfigName() {
    const name = prompt('请输入配置名称:', `配置_${new Date().toLocaleDateString()}`);
    return name ? name.trim() : null;
  }
  
  // 绑定单个元素事件（带重试机制）
  function bindEvent(elementId, eventType, handler, description) {
    let attempts = 0;
    const maxAttempts = 10;
    
    const tryBind = () => {
      const element = document.getElementById(elementId);
      if (element) {
        element.addEventListener(eventType, handler);
        console.log(`[Config] Bound ${eventType} to ${elementId}: ${description}`);
        return true;
      }
      
      attempts++;
      if (attempts < maxAttempts) {
        setTimeout(tryBind, 100);
      } else {
        console.warn(`[Config] Failed to bind ${elementId} after ${maxAttempts} attempts`);
      }
      return false;
    };
    
    tryBind();
  }
  
  // 附加事件监听
  function attachConfigEvents() {
    console.log('[Config] Attaching events...');
    
    // iOS 变量配置
    bindEvent('variableConfigSelectIOS', 'change', 
      (e) => loadConfigFile(e.target.value, 'variable', 'ios'), 
      'Load iOS variable config');
    
    bindEvent('saveVariableConfigIOS', 'click', 
      () => saveConfig('variable', 'ios'), 
      'Save iOS variable config');
    
    bindEvent('deleteVariableConfigIOS', 'click', 
      () => deleteConfig('variable', 'ios'), 
      'Delete iOS variable config');
    
    // Android 变量配置
    bindEvent('variableConfigSelectAndroid', 'change', 
      (e) => loadConfigFile(e.target.value, 'variable', 'android'), 
      'Load Android variable config');
    
    bindEvent('saveVariableConfigAndroid', 'click', 
      () => saveConfig('variable', 'android'), 
      'Save Android variable config');
    
    bindEvent('deleteVariableConfigAndroid', 'click', 
      () => deleteConfig('variable', 'android'), 
      'Delete Android variable config');
    
    // iOS 图片配置
    bindEvent('imageConfigSelectIOS', 'change', 
      (e) => loadConfigFile(e.target.value, 'image', 'ios'), 
      'Load iOS image config');
    
    bindEvent('saveImageConfigIOS', 'click', 
      () => saveConfig('image', 'ios'), 
      'Save iOS image config');
    
    bindEvent('deleteImageConfigIOS', 'click', 
      () => deleteConfig('image', 'ios'), 
      'Delete iOS image config');
    
    // Android 图片配置
    bindEvent('imageConfigSelectAndroid', 'change', 
      (e) => loadConfigFile(e.target.value, 'image', 'android'), 
      'Load Android image config');
    
    bindEvent('saveImageConfigAndroid', 'click', 
      () => saveConfig('image', 'android'), 
      'Save Android image config');
    
    bindEvent('deleteImageConfigAndroid', 'click', 
      () => deleteConfig('image', 'android'), 
      'Delete Android image config');
    
    console.log('[Config] Events attached');
  }
  
  // 初始化配置文件管理
  async function initConfigManagement() {
    console.log('[Config] Initializing...');
    await loadAllConfigs();
    attachConfigEvents();
    console.log('[Config] Initialized');
  }
  
  // DOM 加载完成后初始化
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      setTimeout(initConfigManagement, 500);
    });
  } else {
    setTimeout(initConfigManagement, 500);
  }
  
  // 暴露函数供其他模块使用
  window.reloadConfigs = loadAllConfigs;
  
  console.log('[Config Manager] Script initialized');
})();
