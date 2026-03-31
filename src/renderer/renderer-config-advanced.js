// 配置文件高级功能：导入/导出、分享、模板库
// 扩展 renderer-config.js

(function() {
  const { ipcRenderer } = require('electron');
  
  console.log('[Advanced Config] Script loaded');
  
  // 内置模板库
  const TEMPLATES = {
    ios_variable: [
      {
        name: '生产环境配置模板',
        description: 'API URL、调试模式等生产环境配置',
        data: [
          {
            className: 'AppConfig',
            expanded: true,
            variables: [
              { name: 'API_URL', value: '"https://api.production.com"' },
              { name: 'API_TIMEOUT', value: '30' },
              { name: 'DEBUG_MODE', value: 'false' },
              { name: 'LOG_LEVEL', value: '"ERROR"' }
            ]
          }
        ]
      },
      {
        name: '测试环境配置模板',
        description: '适用于测试环境的配置',
        data: [
          {
            className: 'AppConfig',
            expanded: true,
            variables: [
              { name: 'API_URL', value: '"https://api.test.com"' },
              { name: 'DEBUG_MODE', value: 'true' },
              { name: 'LOG_LEVEL', value: '"DEBUG"' }
            ]
          }
        ]
      }
    ],
    android_variable: [
      {
        name: '生产环境配置模板',
        description: 'Android 生产环境配置',
        data: [
          {
            className: 'Constants',
            expanded: true,
            variables: [
              { name: 'BASE_URL', value: '"https://api.production.com"' },
              { name: 'DEBUG', value: 'false' },
              { name: 'VERSION_NAME', value: '"1.0.0"' }
            ]
          }
        ]
      }
    ],
    ios_image: [
      {
        name: 'App 图标替换模板',
        description: '替换应用图标和启动图',
        data: {
          imageFolderPath: '',
          mappings: [
            { oldName: 'AppIcon.png', newName: 'new_app_icon.png' },
            { oldName: 'LaunchImage.png', newName: 'new_launch_image.png' }
          ]
        }
      }
    ],
    android_image: [
      {
        name: 'App 图标替换模板',
        description: '替换 Android 应用图标',
        data: {
          imageFolderPath: '',
          mappings: [
            { oldName: 'ic_launcher.png', newName: 'new_launcher.png' }
          ]
        }
      }
    ]
  };
  
  // 导出配置
  async function exportConfig(type, platform) {
    console.log(`[Export] type=${type}, platform=${platform}`);
    
    const selectId = type === 'variable'
      ? `variableConfigSelect${platform === 'ios' ? 'IOS' : 'Android'}`
      : `imageConfigSelect${platform === 'ios' ? 'IOS' : 'Android'}`;
    
    const select = document.getElementById(selectId);
    if (!select) {
      console.error('[Export] Select not found:', selectId);
      alert('找不到配置选择框');
      return;
    }
    
    const filePath = select.value;
    if (!filePath) {
      alert('请先选择要导出的配置文件');
      return;
    }
    
    try {
      console.log('[Export] Loading config from:', filePath);
      const config = await ipcRenderer.invoke('load-config', filePath);
      if (!config) {
        alert('加载配置失败');
        return;
      }
      
      console.log('[Export] Config loaded:', config.name);
      const savePath = await ipcRenderer.invoke('save-file-dialog', {
        defaultPath: `${config.name}.json`,
        filters: [{ name: 'JSON 配置文件', extensions: ['json'] }]
      });
      
      if (savePath) {
        console.log('[Export] Saving to:', savePath);
        await ipcRenderer.invoke('export-config', filePath, savePath);
        alert(`配置已导出到:\n${savePath}`);
      }
    } catch (error) {
      console.error('[Export] Error:', error);
      alert(`导出失败: ${error.message}`);
    }
  }
  
  // 导入配置
  async function importConfig(type, platform) {
    console.log(`[Import] type=${type}, platform=${platform}`);
    
    try {
      const filePaths = await ipcRenderer.invoke('open-file-dialog', {
        filters: [
          { name: 'JSON 配置文件', extensions: ['json'] },
          { name: '所有文件', extensions: ['*'] }
        ],
        properties: ['openFile']
      });
      
      if (!filePaths || filePaths.length === 0) {
        console.log('[Import] No file selected');
        return;
      }
      
      console.log('[Import] Selected file:', filePaths[0]);
      const configType = `${platform}_${type}`;
      const result = await ipcRenderer.invoke('import-config', filePaths[0], configType);
      
      if (result) {
        alert(`配置"${result.config.name}"导入成功！`);
        
        if (window.reloadConfigs) {
          await window.reloadConfigs();
        }
        
        const selectId = type === 'variable'
          ? `variableConfigSelect${platform === 'ios' ? 'IOS' : 'Android'}`
          : `imageConfigSelect${platform === 'ios' ? 'IOS' : 'Android'}`;
        
        const select = document.getElementById(selectId);
        if (select) {
          select.value = result.filePath;
          select.dispatchEvent(new Event('change'));
        }
      }
    } catch (error) {
      console.error('[Import] Error:', error);
      alert(`导入失败: ${error.message}`);
    }
  }
  
  // 模板库
  function openTemplateLibrary(type, platform) {
    console.log(`[Template] type=${type}, platform=${platform}`);
    
    const configType = `${platform}_${type}`;
    const templates = TEMPLATES[configType] || [];
    
    if (templates.length === 0) {
      alert('该类型暂无可用模板');
      return;
    }
    
    showTemplateDialog(templates, type, platform);
  }
  
  // 显示模板对话框
  function showTemplateDialog(templates, type, platform) {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
      <div class="modal-dialog">
        <div class="modal-header">
          <h3>📚 配置模板库</h3>
          <button class="modal-close">✕</button>
        </div>
        <div class="modal-body">
          ${templates.map((template, index) => `
            <div class="template-item">
              <div class="template-header">
                <h4>${template.name}</h4>
              </div>
              <p class="template-description">${template.description}</p>
              <button class="use-template-button" data-index="${index}">
                ✅ 使用此模板
              </button>
            </div>
          `).join('')}
        </div>
      </div>
    `;
    
    document.body.appendChild(overlay);
    
    overlay.querySelector('.modal-close').addEventListener('click', () => overlay.remove());
    
    overlay.querySelectorAll('.use-template-button').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const index = parseInt(e.target.dataset.index);
        const template = templates[index];
        applyTemplate(template, type, platform);
        overlay.remove();
      });
    });
    
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) overlay.remove();
    });
  }
  
  // 应用模板
  function applyTemplate(template, type, platform) {
    if (type === 'variable') {
      if (window.loadClassRulesFromData) {
        window.loadClassRulesFromData(platform, template.data);
      }
    } else {
      if (template.data.imageFolderPath) {
        const inputId = `imageFolderPath${platform === 'ios' ? 'IOS' : 'Android'}`;
        const input = document.getElementById(inputId);
        if (input) input.value = template.data.imageFolderPath;
      }
      if (template.data.mappings && window.loadImageMappingsFromData) {
        window.loadImageMappingsFromData(platform, template.data.mappings);
      }
    }
    alert(`已应用模板: ${template.name}`);
  }
  
  // 生成分享
  async function generateShareLink(type, platform) {
    console.log(`[Share] type=${type}, platform=${platform}`);
    
    try {
      let data = null;
      
      if (type === 'variable') {
        data = window.getClassRules ? window.getClassRules(platform) : [];
      } else {
        const mappings = window.getImageMappings ? window.getImageMappings(platform) : [];
        const folderInput = document.getElementById(`imageFolderPath${platform === 'ios' ? 'IOS' : 'Android'}`);
        const folderPath = folderInput ? folderInput.value : '';
        data = { imageFolderPath: folderPath, mappings };
      }
      
      const configJson = JSON.stringify({
        platform: `${platform}_${type}`,
        name: '分享的配置',
        createdAt: new Date().toISOString(),
        data
      }, null, 2);
      
      showShareDialog(configJson, platform, type);
    } catch (error) {
      console.error('[Share] Error:', error);
      alert(`生成分享失败: ${error.message}`);
    }
  }
  
  // 显示分享对话框
  function showShareDialog(configJson) {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
      <div class="modal-dialog" style="max-width: 700px;">
        <div class="modal-header">
          <h3>🔗 分享配置</h3>
          <button class="modal-close">✕</button>
        </div>
        <div class="modal-body">
          <p style="margin-bottom: 10px;">
            复制下面的配置内容，发送给团队成员。<br>
            团队成员可以通过"📥 导入"功能导入此配置。
          </p>
          <textarea id="shareConfigText" readonly style="
            width: 100%;
            height: 300px;
            font-family: monospace;
            font-size: 12px;
            padding: 10px;
            border: 1px solid #cbd5e0;
            border-radius: 4px;
            resize: vertical;
          ">${configJson}</textarea>
          <div style="display: flex; gap: 10px; margin-top: 10px;">
            <button id="copyShareConfig" style="
              flex: 1;
              padding: 10px;
              background: #48bb78;
              color: white;
              border: none;
              border-radius: 6px;
              cursor: pointer;
            ">📋 复制到剪贴板</button>
            <button id="saveShareConfig" style="
              flex: 1;
              padding: 10px;
              background: #667eea;
              color: white;
              border: none;
              border-radius: 6px;
              cursor: pointer;
            ">💾 保存为文件</button>
          </div>
        </div>
      </div>
    `;
    
    document.body.appendChild(overlay);
    
    overlay.querySelector('.modal-close').addEventListener('click', () => overlay.remove());
    
    document.getElementById('copyShareConfig').addEventListener('click', () => {
      const textarea = document.getElementById('shareConfigText');
      textarea.select();
      document.execCommand('copy');
      alert('配置已复制到剪贴板！');
    });
    
    document.getElementById('saveShareConfig').addEventListener('click', async () => {
      try {
        const savePath = await ipcRenderer.invoke('save-file-dialog', {
          defaultPath: 'config.json',
          filters: [{ name: 'JSON 配置文件', extensions: ['json'] }]
        });
        
        if (savePath) {
          const fs = require('fs');
          fs.writeFileSync(savePath, configJson, 'utf8');
          alert(`配置已保存到:\n${savePath}`);
        }
      } catch (error) {
        alert(`保存失败: ${error.message}`);
      }
    });
    
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) overlay.remove();
    });
  }
  
  // 绑定按钮事件 - 使用事件委托
  function bindButton(id, handler) {
    // 尝试多次，因为按钮可能在隐藏区域中延迟加载
    let attempts = 0;
    const maxAttempts = 10;
    
    const tryBind = () => {
      const btn = document.getElementById(id);
      if (btn) {
        console.log(`[Bind] Success: ${id}`);
        btn.addEventListener('click', handler);
        return true;
      }
      
      attempts++;
      if (attempts < maxAttempts) {
        setTimeout(tryBind, 100);
      } else {
        console.warn(`[Bind] Failed after ${maxAttempts} attempts: ${id}`);
      }
      return false;
    };
    
    tryBind();
  }
  
  // 初始化
  function init() {
    console.log('[Advanced Config] Initializing...');
    
    // 绑定所有按钮
    const buttons = [
      // iOS 变量
      { id: 'exportVariableConfigIOS', handler: () => exportConfig('variable', 'ios') },
      { id: 'importVariableConfigIOS', handler: () => importConfig('variable', 'ios') },
      { id: 'templateVariableConfigIOS', handler: () => openTemplateLibrary('variable', 'ios') },
      { id: 'shareVariableConfigIOS', handler: () => generateShareLink('variable', 'ios') },
      
      // iOS 图片
      { id: 'exportImageConfigIOS', handler: () => exportConfig('image', 'ios') },
      { id: 'importImageConfigIOS', handler: () => importConfig('image', 'ios') },
      { id: 'templateImageConfigIOS', handler: () => openTemplateLibrary('image', 'ios') },
      { id: 'shareImageConfigIOS', handler: () => generateShareLink('image', 'ios') },
      
      // Android 变量
      { id: 'exportVariableConfigAndroid', handler: () => exportConfig('variable', 'android') },
      { id: 'importVariableConfigAndroid', handler: () => importConfig('variable', 'android') },
      { id: 'templateVariableConfigAndroid', handler: () => openTemplateLibrary('variable', 'android') },
      { id: 'shareVariableConfigAndroid', handler: () => generateShareLink('variable', 'android') },
      
      // Android 图片
      { id: 'exportImageConfigAndroid', handler: () => exportConfig('image', 'android') },
      { id: 'importImageConfigAndroid', handler: () => importConfig('image', 'android') },
      { id: 'templateImageConfigAndroid', handler: () => openTemplateLibrary('image', 'android') },
      { id: 'shareImageConfigAndroid', handler: () => generateShareLink('image', 'android') }
    ];
    
    buttons.forEach(({ id, handler }) => {
      bindButton(id, handler);
    });
    
    console.log('[Advanced Config] Initialized');
  }
  
  // DOM 加载完成后初始化，延迟确保所有元素都已加载
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      setTimeout(init, 500); // 延迟500ms确保所有脚本都已加载
    });
  } else {
    setTimeout(init, 500);
  }
})();
