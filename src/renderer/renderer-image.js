// 图片替换功能初始化脚本
// 在 renderer.js 加载后执行

(function() {
  // 图片映射存储
  let imageMappingsIOS = [];
  let imageMappingsAndroid = [];
  const STORAGE_KEY_IOS = 'imageMappingsIOS';
  const STORAGE_KEY_ANDROID = 'imageMappingsAndroid';
  
  // 从 localStorage 加载图片映射
  function loadImageMappings() {
    try {
      const savedIOS = localStorage.getItem(STORAGE_KEY_IOS);
      if (savedIOS) {
        imageMappingsIOS = JSON.parse(savedIOS);
        renderImageMappings('ios', imageMappingsIOS);
      }
      
      const savedAndroid = localStorage.getItem(STORAGE_KEY_ANDROID);
      if (savedAndroid) {
        imageMappingsAndroid = JSON.parse(savedAndroid);
        renderImageMappings('android', imageMappingsAndroid);
      }
    } catch (error) {
      console.error('加载图片映射失败:', error);
    }
  }
  
  // 保存图片映射到 localStorage
  function saveImageMappings(platform) {
    try {
      if (platform === 'ios') {
        localStorage.setItem(STORAGE_KEY_IOS, JSON.stringify(imageMappingsIOS));
      } else {
        localStorage.setItem(STORAGE_KEY_ANDROID, JSON.stringify(imageMappingsAndroid));
      }
    } catch (error) {
      console.error('保存图片映射失败:', error);
    }
  }
  
  // 渲染图片映射列表
  function renderImageMappings(platform, mappings) {
    const listId = platform === 'ios' ? 'imageMappingListIOS' : 'imageMappingListAndroid';
    const list = document.getElementById(listId);
    
    if (!list) return;
    
    list.innerHTML = '';
    
    mappings.forEach((mapping, index) => {
      const item = document.createElement('div');
      item.className = 'mapping-item';
      item.innerHTML = `
        <input type="text" 
               value="${mapping.oldName}" 
               placeholder="原图片名（如 logo.png）"
               data-platform="${platform}"
               data-index="${index}"
               data-field="oldName">
        <span class="mapping-arrow">→</span>
        <input type="text" 
               value="${mapping.newName}" 
               placeholder="新图片名（如 new_logo.png）"
               data-platform="${platform}"
               data-index="${index}"
               data-field="newName">
        <button class="remove-button" 
                data-platform="${platform}"
                data-index="${index}">删除</button>
      `;
      list.appendChild(item);
    });
    
    // 添加输入事件监听
    list.querySelectorAll('input').forEach(input => {
      input.addEventListener('input', handleMappingInput);
    });
    
    // 添加删除按钮事件监听
    list.querySelectorAll('.remove-button').forEach(btn => {
      btn.addEventListener('click', handleRemoveMapping);
    });
  }
  
  // 处理映射输入
  function handleMappingInput(e) {
    const platform = e.target.dataset.platform;
    const index = parseInt(e.target.dataset.index);
    const field = e.target.dataset.field;
    const value = e.target.value;
    
    if (platform === 'ios') {
      imageMappingsIOS[index][field] = value;
      saveImageMappings('ios');
    } else {
      imageMappingsAndroid[index][field] = value;
      saveImageMappings('android');
    }
    if (window.updateButtonStates) {
      window.updateButtonStates();
    }
  }
  
  // 处理删除映射
  function handleRemoveMapping(e) {
    const platform = e.target.dataset.platform;
    const index = parseInt(e.target.dataset.index);
    
    if (platform === 'ios') {
      imageMappingsIOS.splice(index, 1);
      saveImageMappings('ios');
      renderImageMappings('ios', imageMappingsIOS);
    } else {
      imageMappingsAndroid.splice(index, 1);
      saveImageMappings('android');
      renderImageMappings('android', imageMappingsAndroid);
    }
    if (window.updateButtonStates) {
      window.updateButtonStates();
    }
  }
  
  // 添加新映射
  function addImageMapping(platform) {
    const newMapping = { oldName: '', newName: '' };
    
    if (platform === 'ios') {
      imageMappingsIOS.push(newMapping);
      saveImageMappings('ios');
      renderImageMappings('ios', imageMappingsIOS);
    } else {
      imageMappingsAndroid.push(newMapping);
      saveImageMappings('android');
      renderImageMappings('android', imageMappingsAndroid);
    }
    if (window.updateButtonStates) {
      window.updateButtonStates();
    }
  }
  
  // 获取图片映射
  window.getImageMappings = function(platform) {
    return platform === 'ios' ? imageMappingsIOS : imageMappingsAndroid;
  };
  
  // 初始化事件监听
  function initImageReplaceEvents() {
    // iOS 图片替换复选框
    const replaceImagesIOS = document.getElementById('replaceImagesIOS');
    const imageReplaceOptionsIOS = document.getElementById('imageReplaceOptionsIOS');
    
    if (replaceImagesIOS) {
      replaceImagesIOS.addEventListener('change', (e) => {
        imageReplaceOptionsIOS.style.display = e.target.checked ? 'block' : 'none';
      });
    }
    
    // Android 图片替换复选框
    const replaceImagesAndroid = document.getElementById('replaceImagesAndroid');
    const imageReplaceOptionsAndroid = document.getElementById('imageReplaceOptionsAndroid');
    
    if (replaceImagesAndroid) {
      replaceImagesAndroid.addEventListener('change', (e) => {
        imageReplaceOptionsAndroid.style.display = e.target.checked ? 'block' : 'none';
      });
    }
    
    // iOS 选择图片文件夹
    const selectImageFolderIOS = document.getElementById('selectImageFolderIOS');
    const imageFolderPathIOS = document.getElementById('imageFolderPathIOS');
    
    if (selectImageFolderIOS) {
      selectImageFolderIOS.addEventListener('click', async () => {
        const folderPath = await ipcRenderer.invoke('select-image-folder');
        if (folderPath) {
          imageFolderPathIOS.value = folderPath;
          if (window.updateButtonStates) {
            window.updateButtonStates();
          }
        }
      });
    }
    
    // Android 选择图片文件夹
    const selectImageFolderAndroid = document.getElementById('selectImageFolderAndroid');
    const imageFolderPathAndroid = document.getElementById('imageFolderPathAndroid');
    
    if (selectImageFolderAndroid) {
      selectImageFolderAndroid.addEventListener('click', async () => {
        const folderPath = await ipcRenderer.invoke('select-image-folder');
        if (folderPath) {
          imageFolderPathAndroid.value = folderPath;
          if (window.updateButtonStates) {
            window.updateButtonStates();
          }
        }
      });
    }

    const renameImageWithNewNameIOS = document.getElementById('renameImageWithNewNameIOS');
    if (renameImageWithNewNameIOS) {
      renameImageWithNewNameIOS.addEventListener('change', () => {
        if (window.updateButtonStates) {
          window.updateButtonStates();
        }
      });
    }
    
    const renameImageWithNewNameAndroid = document.getElementById('renameImageWithNewNameAndroid');
    if (renameImageWithNewNameAndroid) {
      renameImageWithNewNameAndroid.addEventListener('change', () => {
        if (window.updateButtonStates) {
          window.updateButtonStates();
        }
      });
    }

    const normalizeUnreplacedImagesIOS = document.getElementById('normalizeUnreplacedImagesIOS');
    if (normalizeUnreplacedImagesIOS) {
      normalizeUnreplacedImagesIOS.addEventListener('change', () => {
        if (window.updateButtonStates) {
          window.updateButtonStates();
        }
      });
    }
    
    const normalizeUnreplacedImagesAndroid = document.getElementById('normalizeUnreplacedImagesAndroid');
    if (normalizeUnreplacedImagesAndroid) {
      normalizeUnreplacedImagesAndroid.addEventListener('change', () => {
        if (window.updateButtonStates) {
          window.updateButtonStates();
        }
      });
    }
    
    // iOS 添加映射按钮
    const addImageMappingIOS = document.getElementById('addImageMappingIOS');
    if (addImageMappingIOS) {
      addImageMappingIOS.addEventListener('click', () => addImageMapping('ios'));
    }
    
    // Android 添加映射按钮
    const addImageMappingAndroid = document.getElementById('addImageMappingAndroid');
    if (addImageMappingAndroid) {
      addImageMappingAndroid.addEventListener('click', () => addImageMapping('android'));
    }
  }

  // 从配置数据加载图片映射（供配置管理器调用）
  window.loadImageMappingsFromData = function(platform, data) {
    if (platform === 'ios') {
      imageMappingsIOS = data || [];
      renderImageMappings('ios', imageMappingsIOS);
    } else {
      imageMappingsAndroid = data || [];
      renderImageMappings('android', imageMappingsAndroid);
    }
    if (window.updateButtonStates) {
      window.updateButtonStates();
    }
  };
  
  // DOM 加载完成后初始化
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      loadImageMappings();
      initImageReplaceEvents();
    });
  } else {
    loadImageMappings();
    initImageReplaceEvents();
  }
})();
