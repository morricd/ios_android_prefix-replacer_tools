const { ipcRenderer } = require('electron');
const nodePath = require('path');

let sourcePath = '';
let targetPath = '';
let scanResults = null;
let currentPlatform = 'ios';

// DOM 元素
const sourcePathInput = document.getElementById('sourcePath');
const targetPathInput = document.getElementById('targetPath');
const selectSourceBtn = document.getElementById('selectSource');
const selectTargetBtn = document.getElementById('selectTarget');
const sourcePathGroup = document.getElementById('sourcePathGroup');
const onlyReplaceProjectImagesCheckbox = document.getElementById('onlyReplaceProjectImages');
const ignoreDirNamesInput = document.getElementById('ignoreDirNames');

// iOS 配置
const iosConfig = document.getElementById('iosConfig');
const oldPrefixInput = document.getElementById('oldPrefix');
const newPrefixInput = document.getElementById('newPrefix');
const copyPodsIOSCheckbox = document.getElementById('copyPodsIOS');
const renameProjectNameIOSCheckbox = document.getElementById('renameProjectNameIOS');
const projectNameInputsIOS = document.getElementById('projectNameInputsIOS');
const oldProjectNameIOSInput = document.getElementById('oldProjectNameIOS');
const newProjectNameIOSInput = document.getElementById('newProjectNameIOS');
const deleteCommentsIOSCheckbox = document.getElementById('deleteCommentsIOS');
const handleXcassetsIOSCheckbox = document.getElementById('handleXcassetsIOS');
const xcassetsInputsIOS = document.getElementById('xcassetsInputsIOS');
const oldAssetPrefixIOSInput = document.getElementById('oldAssetPrefixIOS');
const newAssetPrefixIOSInput = document.getElementById('newAssetPrefixIOS');
const spamCodeOutIOSCheckbox = document.getElementById('spamCodeOutIOS');
const spamCodeInputsIOS = document.getElementById('spamCodeInputsIOS');
const spamCodePrefixIOSInput = document.getElementById('spamCodePrefixIOS');
const spamMethodCountIOSInput = document.getElementById('spamMethodCountIOS');

// Android 配置
const androidConfig = document.getElementById('androidConfig');
const oldPackageInput = document.getElementById('oldPackage');
const newPackageInput = document.getElementById('newPackage');
const hasAndroidPrefixCheckbox = document.getElementById('hasAndroidPrefix');
const androidPrefixInputs = document.getElementById('androidPrefixInputs');
const oldAndroidPrefixInput = document.getElementById('oldAndroidPrefix');
const newAndroidPrefixInput = document.getElementById('newAndroidPrefix');
const deleteCommentsAndroidCheckbox = document.getElementById('deleteCommentsAndroid');
const spamCodeOutAndroidCheckbox = document.getElementById('spamCodeOutAndroid');
const spamCodeInputsAndroid = document.getElementById('spamCodeInputsAndroid');
const spamCodePrefixAndroidInput = document.getElementById('spamCodePrefixAndroid');
const spamMethodCountAndroidInput = document.getElementById('spamMethodCountAndroid');

// 平台选择
const platformRadios = document.querySelectorAll('input[name="platform"]');

const scanBtn = document.getElementById('scanBtn');
const processBtn = document.getElementById('processBtn');
const resultsDiv = document.getElementById('results');
const progressDiv = document.getElementById('progress');
const progressBar = document.getElementById('progressBar');
const progressText = document.getElementById('progressText');
const currentFileDiv = document.getElementById('currentFile');
const replaceImagesIOSCheckbox = document.getElementById('replaceImagesIOS');
const replaceImagesAndroidCheckbox = document.getElementById('replaceImagesAndroid');
const imageFolderPathIOSInput = document.getElementById('imageFolderPathIOS');
const imageFolderPathAndroidInput = document.getElementById('imageFolderPathAndroid');
const renameImageWithNewNameIOSCheckbox = document.getElementById('renameImageWithNewNameIOS');
const renameImageWithNewNameAndroidCheckbox = document.getElementById('renameImageWithNewNameAndroid');
const normalizeUnreplacedImagesIOSCheckbox = document.getElementById('normalizeUnreplacedImagesIOS');
const normalizeUnreplacedImagesAndroidCheckbox = document.getElementById('normalizeUnreplacedImagesAndroid');
const imageReplaceOptionsIOS = document.getElementById('imageReplaceOptionsIOS');
const imageReplaceOptionsAndroid = document.getElementById('imageReplaceOptionsAndroid');
const codeOnlyOptionElements = Array.from(document.querySelectorAll('.code-only-option'));

// 平台切换
platformRadios.forEach(radio => {
  radio.addEventListener('change', (e) => {
    currentPlatform = e.target.value;
    
    if (currentPlatform === 'ios') {
      iosConfig.style.display = 'block';
      androidConfig.style.display = 'none';
    } else {
      iosConfig.style.display = 'none';
      androidConfig.style.display = 'block';
    }
    
    // 清空结果
    scanResults = null;
    resultsDiv.innerHTML = '<div class="placeholder"><p>👆 请配置参数后开始操作</p></div>';
    applyImageOnlyModeUI();
    updateButtonStates();
  });
});

if (onlyReplaceProjectImagesCheckbox) {
  onlyReplaceProjectImagesCheckbox.addEventListener('change', () => {
    scanResults = null;
    resultsDiv.innerHTML = '<div class="placeholder"><p>👆 模式已切换，请先扫描</p></div>';
    applyImageOnlyModeUI();
    updateButtonStates();
  });
}

function setElementVisible(element, visible) {
  if (!element) return;
  if (visible) {
    if (element.dataset.originalDisplay !== undefined) {
      element.style.display = element.dataset.originalDisplay;
      delete element.dataset.originalDisplay;
    }
  } else {
    if (element.dataset.originalDisplay === undefined) {
      element.dataset.originalDisplay = element.style.display || '';
    }
    element.style.display = 'none';
  }
}

function syncOptionalSection(checkbox, section, expandedDisplay = 'flex') {
  if (!checkbox || !section) return;
  section.style.display = checkbox.checked ? expandedDisplay : 'none';
}

function syncOptionalSections() {
  syncOptionalSection(renameProjectNameIOSCheckbox, projectNameInputsIOS);
  syncOptionalSection(handleXcassetsIOSCheckbox, xcassetsInputsIOS);
  syncOptionalSection(spamCodeOutIOSCheckbox, spamCodeInputsIOS);
  syncOptionalSection(renameFilesAndGroupsCheckbox, filesGroupsInputs);
}

function applyImageOnlyModeUI() {
  const imageOnlyMode = !!(onlyReplaceProjectImagesCheckbox && onlyReplaceProjectImagesCheckbox.checked);
  
  setElementVisible(sourcePathGroup, !imageOnlyMode);
  codeOnlyOptionElements.forEach((element) => setElementVisible(element, !imageOnlyMode));
  if (!imageOnlyMode) {
    syncOptionalSections();
  }
  
  if (imageOnlyMode) {
    if (replaceImagesIOSCheckbox) {
      replaceImagesIOSCheckbox.checked = true;
      replaceImagesIOSCheckbox.disabled = true;
    }
    if (replaceImagesAndroidCheckbox) {
      replaceImagesAndroidCheckbox.checked = true;
      replaceImagesAndroidCheckbox.disabled = true;
    }
    if (imageReplaceOptionsIOS) imageReplaceOptionsIOS.style.display = 'block';
    if (imageReplaceOptionsAndroid) imageReplaceOptionsAndroid.style.display = 'block';
  } else {
    if (replaceImagesIOSCheckbox) replaceImagesIOSCheckbox.disabled = false;
    if (replaceImagesAndroidCheckbox) replaceImagesAndroidCheckbox.disabled = false;
    
    if (imageReplaceOptionsIOS && replaceImagesIOSCheckbox) {
      imageReplaceOptionsIOS.style.display = replaceImagesIOSCheckbox.checked ? 'block' : 'none';
    }
    if (imageReplaceOptionsAndroid && replaceImagesAndroidCheckbox) {
      imageReplaceOptionsAndroid.style.display = replaceImagesAndroidCheckbox.checked ? 'block' : 'none';
    }
  }
}

function parseIgnoreDirNames(value) {
  if (!value) return [];
  return value
    .split(',')
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function normalizeSelectedPath(value) {
  if (!value) return '';
  return nodePath.resolve(value.trim());
}

function areSameSelectedPath(firstPath, secondPath) {
  const first = normalizeSelectedPath(firstPath);
  const second = normalizeSelectedPath(secondPath);
  if (!first || !second) return false;
  return process.platform === 'win32'
    ? first.toLowerCase() === second.toLowerCase()
    : first === second;
}

function showConfirmDialog({
  title = '确定要执行替换吗？',
  mode,
  source,
  target,
  summaryLines = [],
  selectedOptions = [],
  warnings = [],
  blockMessage = ''
}) {
  return new Promise((resolve) => {
    const confirmCode = String(Math.floor(100000 + Math.random() * 900000));
    const overlay = document.createElement('div');
    overlay.className = 'confirm-modal-overlay';
    overlay.innerHTML = `
      <div class="confirm-modal-dialog">
        <div class="confirm-modal-header">
          <h3>${escapeHtml(title)}</h3>
        </div>
        <div class="confirm-modal-body">
          ${blockMessage ? `<div class="confirm-alert confirm-alert-danger">${escapeHtml(blockMessage)}</div>` : ''}
          ${warnings.map((warning) => `<div class="confirm-alert confirm-alert-warning">${escapeHtml(warning)}</div>`).join('')}
          <div class="confirm-section">
            <div class="confirm-section-title">项目路径：</div>
            <div class="confirm-line"><span>模式:</span><strong>${escapeHtml(mode)}</strong></div>
            ${source ? `<div class="confirm-line confirm-path-line confirm-source-path"><span>源文件夹:</span><strong>${escapeHtml(source)}</strong></div>` : ''}
            <div class="confirm-line confirm-path-line confirm-target-path"><span>目标文件夹:</span><strong>${escapeHtml(target)}</strong></div>
          </div>
          <div class="confirm-section">
            <div class="confirm-section-title">项目生成配置：</div>
            ${summaryLines.map((line) => `<div class="confirm-line">${escapeHtml(line)}</div>`).join('')}
          </div>
          ${selectedOptions.length ? `
          <div class="confirm-section confirm-selected-options">
            <div class="confirm-section-title">已勾选功能</div>
            <ul>
              ${selectedOptions.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}
            </ul>
          </div>
          ` : ''}
          <div class="confirm-section confirm-code-section">
            <div class="confirm-section-title">执行校验</div>
            <div class="confirm-code-row">
              <span class="confirm-code-number">${escapeHtml(confirmCode)}</span>
              <input type="text" id="confirmCodeInput" class="confirm-code-input" placeholder="请输入左侧数字" inputmode="numeric" autocomplete="off">
            </div>
          </div>
        </div>
        <div class="confirm-modal-actions">
          <button type="button" class="btn btn-secondary" id="confirmCancelBtn">取消</button>
          <button type="button" class="btn btn-primary" id="confirmOkBtn" disabled>确定执行</button>
        </div>
      </div>
    `;

    const close = (value) => {
      overlay.remove();
      resolve(value);
    };

    document.body.appendChild(overlay);
    overlay.querySelector('#confirmCancelBtn').addEventListener('click', () => close(false));
    const okButton = overlay.querySelector('#confirmOkBtn');
    const codeInput = overlay.querySelector('#confirmCodeInput');
    const updateConfirmState = () => {
      if (!okButton) return;
      okButton.disabled = !!blockMessage || !codeInput || codeInput.value.trim() !== confirmCode;
    };
    if (codeInput) {
      codeInput.addEventListener('input', updateConfirmState);
      codeInput.focus();
    }
    if (okButton) {
      okButton.addEventListener('click', () => close(true));
    }
    overlay.addEventListener('click', (event) => {
      if (event.target === overlay) close(false);
    });
  });
}

async function inspectTargetFolder(target) {
  if (!target) {
    return { success: true, entryCount: 0, entries: [] };
  }
  const result = await ipcRenderer.invoke('inspect-folder', target);
  return result && result.success ? result : { success: true, entryCount: 0, entries: [] };
}

// Android 前缀复选框
hasAndroidPrefixCheckbox.addEventListener('change', (e) => {
  androidPrefixInputs.style.display = e.target.checked ? 'flex' : 'none';
  updateButtonStates();
});

// 随机代码复选框
const addRandomCodeCheckbox = document.getElementById('addRandomCode');
const randomCodeOptions = document.getElementById('randomCodeOptions');

addRandomCodeCheckbox.addEventListener('change', (e) => {
  randomCodeOptions.style.display = e.target.checked ? 'block' : 'none';
  updateButtonStates();
});

// iOS 随机代码复选框
const addRandomCodeIOSCheckbox = document.getElementById('addRandomCodeIOS');
const randomCodeOptionsIOS = document.getElementById('randomCodeOptionsIOS');

addRandomCodeIOSCheckbox.addEventListener('change', (e) => {
  randomCodeOptionsIOS.style.display = e.target.checked ? 'block' : 'none';
  updateButtonStates();
});

// iOS 文件和 Group 重命名复选框
const renameFilesAndGroupsCheckbox = document.getElementById('renameFilesAndGroups');
const filesGroupsInputs = document.getElementById('filesGroupsInputs');

renameFilesAndGroupsCheckbox.addEventListener('change', (e) => {
  syncOptionalSection(e.target, filesGroupsInputs);
  updateButtonStates();
});

copyPodsIOSCheckbox.addEventListener('change', () => {
  scanResults = null;
  resultsDiv.innerHTML = '<div class="placeholder"><p>👆 Pods 选项已变更，请重新扫描</p></div>';
  updateButtonStates();
});

if (renameProjectNameIOSCheckbox) {
  renameProjectNameIOSCheckbox.addEventListener('change', (e) => {
    syncOptionalSection(e.target, projectNameInputsIOS);
    updateButtonStates();
  });
}

if (handleXcassetsIOSCheckbox) {
  handleXcassetsIOSCheckbox.addEventListener('change', (e) => {
    syncOptionalSection(e.target, xcassetsInputsIOS);
    updateButtonStates();
  });
}

if (spamCodeOutIOSCheckbox) {
  spamCodeOutIOSCheckbox.addEventListener('change', (e) => {
    syncOptionalSection(e.target, spamCodeInputsIOS);
    updateButtonStates();
  });
}

if (spamCodeOutAndroidCheckbox) {
  spamCodeOutAndroidCheckbox.addEventListener('change', (e) => {
    if (spamCodeInputsAndroid) {
      spamCodeInputsAndroid.style.display = e.target.checked ? 'flex' : 'none';
    }
    updateButtonStates();
  });
}

// 选择源文件夹
selectSourceBtn.addEventListener('click', async () => {
  const path = await ipcRenderer.invoke('select-source-folder');
  if (path) {
    sourcePath = path;
    sourcePathInput.value = path;
    scanResults = null;
    updateButtonStates();
  }
});

// 选择目标文件夹
selectTargetBtn.addEventListener('click', async () => {
  const path = await ipcRenderer.invoke('select-target-folder');
  if (path) {
    targetPath = path;
    targetPathInput.value = path;
    scanResults = null;
    updateButtonStates();
  }
});

// 扫描文件
scanBtn.addEventListener('click', async () => {
  const onlyReplaceProjectImages = !!(onlyReplaceProjectImagesCheckbox && onlyReplaceProjectImagesCheckbox.checked);
  const ignoreDirNames = parseIgnoreDirNames(ignoreDirNamesInput ? ignoreDirNamesInput.value : '');
  
  if (onlyReplaceProjectImages) {
    if (!targetPath) {
      showError('请先选择目标文件夹');
      return;
    }
  } else if (!sourcePath) {
    showError('请先选择源文件夹');
    return;
  }
  
  scanBtn.disabled = true;
  scanBtn.textContent = '扫描中...';
  resultsDiv.innerHTML = '<div class="info">正在扫描文件...</div>';
  
  let result;
  if (onlyReplaceProjectImages) {
    const imageFolderPath = currentPlatform === 'ios'
      ? (imageFolderPathIOSInput ? imageFolderPathIOSInput.value.trim() : '')
      : (imageFolderPathAndroidInput ? imageFolderPathAndroidInput.value.trim() : '');
    if (!imageFolderPath) {
      showError('请选择图片资源文件夹');
      scanBtn.disabled = false;
      scanBtn.textContent = '扫描文件';
      updateButtonStates();
      return;
    }
    const imageMappingsRaw = window.getImageMappings ? window.getImageMappings(currentPlatform) : [];
    const imageMappings = (imageMappingsRaw || []).filter(m => m.oldName && m.newName);
    const imageAutoMatch = imageMappings.length === 0;
    
    result = await ipcRenderer.invoke('scan-image-replacements', {
      projectPath: targetPath,
      imageFolderPath,
      platform: currentPlatform,
      imageMappings,
      imageAutoMatch,
      ignoreDirNames
    });
  } else {
    result = await ipcRenderer.invoke('scan-files', sourcePath, currentPlatform, {
      includePods: currentPlatform === 'ios' ? copyPodsIOSCheckbox.checked : false,
      ignoreDirNames
    });
  }
  
  if (result.success) {
    scanResults = {
      mode: onlyReplaceProjectImages ? 'image-only' : 'code',
      data: result
    };
    displayScanResults(scanResults);
  } else {
    showError(`扫描失败: ${result.error}`);
  }
  
  scanBtn.disabled = false;
  scanBtn.textContent = '扫描文件';
  updateButtonStates();
});

// 执行替换
processBtn.addEventListener('click', async () => {
  let options = {
    sourcePath,
    targetPath,
    platform: currentPlatform,
    ignoreDirNames: parseIgnoreDirNames(ignoreDirNamesInput ? ignoreDirNamesInput.value : '')
  };
  
  const replaceImagesEnabled = currentPlatform === 'ios'
    ? !!(replaceImagesIOSCheckbox && replaceImagesIOSCheckbox.checked)
    : !!(replaceImagesAndroidCheckbox && replaceImagesAndroidCheckbox.checked);
  const onlyReplaceProjectImages = !!(onlyReplaceProjectImagesCheckbox && onlyReplaceProjectImagesCheckbox.checked);
  
  if (replaceImagesEnabled) {
    const imageFolderPath = currentPlatform === 'ios'
      ? (imageFolderPathIOSInput ? imageFolderPathIOSInput.value.trim() : '')
      : (imageFolderPathAndroidInput ? imageFolderPathAndroidInput.value.trim() : '');
    const imageMappingsRaw = window.getImageMappings ? window.getImageMappings(currentPlatform) : [];
    const imageMappings = (imageMappingsRaw || []).filter(m => m.oldName && m.newName);
    const imageAutoMatch = imageMappings.length === 0;
    const imageRenameToNewName = currentPlatform === 'ios'
      ? !!(renameImageWithNewNameIOSCheckbox && renameImageWithNewNameIOSCheckbox.checked)
      : !!(renameImageWithNewNameAndroidCheckbox && renameImageWithNewNameAndroidCheckbox.checked);
    const normalizeUnreplacedImages = currentPlatform === 'ios'
      ? !!(normalizeUnreplacedImagesIOSCheckbox && normalizeUnreplacedImagesIOSCheckbox.checked)
      : !!(normalizeUnreplacedImagesAndroidCheckbox && normalizeUnreplacedImagesAndroidCheckbox.checked);
    
    if (!imageFolderPath) {
      showError('请选择图片资源文件夹');
      return;
    }
    
    options.replaceImages = true;
    options.imageFolderPath = imageFolderPath;
    options.imageMappings = imageMappings;
    options.imageAutoMatch = imageAutoMatch;
    options.imageRenameToNewName = imageRenameToNewName;
    options.normalizeUnreplacedImages = normalizeUnreplacedImages;
  } else {
    options.replaceImages = false;
  }
  
  const imageOnlyMode = onlyReplaceProjectImages || (options.replaceImages && !sourcePath);
  options.imageOnly = imageOnlyMode;
  
  // 根据平台获取配置
  if (currentPlatform === 'ios') {
    const oldPrefix = oldPrefixInput.value.trim();
    const newPrefix = newPrefixInput.value.trim();
    
    if (!imageOnlyMode && (!oldPrefix || !newPrefix)) {
      showError('请输入旧前缀和新前缀');
      return;
    }
    
    options.oldPrefix = oldPrefix || '';
    options.newPrefix = newPrefix || '';
    options.includePods = copyPodsIOSCheckbox.checked;
    options.deleteComments = !!(deleteCommentsIOSCheckbox && deleteCommentsIOSCheckbox.checked);
    
    if (!imageOnlyMode && renameProjectNameIOSCheckbox && renameProjectNameIOSCheckbox.checked) {
      const oldProjectName = oldProjectNameIOSInput ? oldProjectNameIOSInput.value.trim() : '';
      const newProjectName = newProjectNameIOSInput ? newProjectNameIOSInput.value.trim() : '';
      if (!oldProjectName || !newProjectName) {
        showError('请输入旧工程名和新工程名，或取消勾选工程名修改');
        return;
      }
      options.renameProjectName = true;
      options.oldProjectName = oldProjectName;
      options.newProjectName = newProjectName;
    } else {
      options.renameProjectName = false;
    }
    
    if (!imageOnlyMode && handleXcassetsIOSCheckbox && handleXcassetsIOSCheckbox.checked) {
      const oldAssetPrefix = oldAssetPrefixIOSInput ? oldAssetPrefixIOSInput.value.trim() : '';
      const newAssetPrefix = newAssetPrefixIOSInput ? newAssetPrefixIOSInput.value.trim() : '';
      if (!oldAssetPrefix || !newAssetPrefix) {
        showError('请输入 xcassets 旧资源前缀和新资源前缀');
        return;
      }
      options.handleXcassets = true;
      options.oldAssetPrefix = oldAssetPrefix;
      options.newAssetPrefix = newAssetPrefix;
    } else {
      options.handleXcassets = false;
    }
    
    if (!imageOnlyMode && spamCodeOutIOSCheckbox && spamCodeOutIOSCheckbox.checked) {
      const spamPrefix = spamCodePrefixIOSInput ? spamCodePrefixIOSInput.value.trim() : 'Spam';
      const spamCount = parseInt(spamMethodCountIOSInput ? spamMethodCountIOSInput.value : '3', 10) || 3;
      options.spamCodeOut = true;
      options.spamCodePrefix = spamPrefix || 'Spam';
      options.spamMethodCount = spamCount;
    } else {
      options.spamCodeOut = false;
    }
    
    // 是否重命名文件和 Group（可选）
    const renameFilesAndGroups = document.getElementById('renameFilesAndGroups');
    if (!imageOnlyMode && renameFilesAndGroups.checked) {
      const oldFileGroupPrefix = document.getElementById('oldFileGroupPrefix').value.trim();
      const newFileGroupPrefix = document.getElementById('newFileGroupPrefix').value.trim();
      
      if (!oldFileGroupPrefix || !newFileGroupPrefix) {
        showError('请输入文件和 Group 的旧前缀和新前缀，或取消勾选');
        return;
      }
      
      options.renameFilesAndGroups = true;
      options.oldFileGroupPrefix = oldFileGroupPrefix;
      options.newFileGroupPrefix = newFileGroupPrefix;
    } else {
      options.renameFilesAndGroups = false;
    }
    
    // 如果勾选了添加随机代码
    if (!imageOnlyMode && addRandomCodeIOSCheckbox.checked) {
      const randomPrefix = document.getElementById('randomPrefixIOS').value.trim();
      const randomMethodCount = parseInt(document.getElementById('randomMethodCountIOS').value) || 3;
      const randomVarCount = parseInt(document.getElementById('randomVarCountIOS').value) || 5;
      
      if (!randomPrefix) {
        showError('请输入随机代码前缀');
        return;
      }
      
      options.addRandomCode = true;
      options.randomPrefix = randomPrefix;
      options.randomMethodCount = randomMethodCount;
      options.randomVarCount = randomVarCount;
    } else {
      options.addRandomCode = false;
    }
    
  } else { // Android
    const oldPackage = oldPackageInput.value.trim();
    const newPackage = newPackageInput.value.trim();
    
    if (!imageOnlyMode && (!oldPackage || !newPackage)) {
      showError('请输入旧包名和新包名');
      return;
    }
    
    options.oldPackage = oldPackage || '';
    options.newPackage = newPackage || '';
    options.deleteComments = !!(deleteCommentsAndroidCheckbox && deleteCommentsAndroidCheckbox.checked);
    options.handleXcassets = false;
    
    // 如果勾选了类前缀
    if (!imageOnlyMode && hasAndroidPrefixCheckbox.checked) {
      const oldAndroidPrefix = oldAndroidPrefixInput.value.trim();
      const newAndroidPrefix = newAndroidPrefixInput.value.trim();
      
      if (!oldAndroidPrefix || !newAndroidPrefix) {
        showError('请输入旧前缀和新前缀，或取消勾选');
        return;
      }
      
      options.hasPrefix = true;
      options.oldPrefix = oldAndroidPrefix;
      options.newPrefix = newAndroidPrefix;
    } else {
      options.hasPrefix = false;
    }
    
    // 如果勾选了添加随机代码
    if (!imageOnlyMode && addRandomCodeCheckbox.checked) {
      const randomPrefix = document.getElementById('randomPrefix').value.trim();
      const randomMethodCount = parseInt(document.getElementById('randomMethodCount').value) || 3;
      const randomVarCount = parseInt(document.getElementById('randomVarCount').value) || 5;
      
      if (!randomPrefix) {
        showError('请输入随机代码前缀');
        return;
      }
      
      options.addRandomCode = true;
      options.randomPrefix = randomPrefix;
      options.randomMethodCount = randomMethodCount;
      options.randomVarCount = randomVarCount;
    } else {
      options.addRandomCode = false;
    }
    
    if (!imageOnlyMode && spamCodeOutAndroidCheckbox && spamCodeOutAndroidCheckbox.checked) {
      const spamPrefix = spamCodePrefixAndroidInput ? spamCodePrefixAndroidInput.value.trim() : 'Spam';
      const spamCount = parseInt(spamMethodCountAndroidInput ? spamMethodCountAndroidInput.value : '3', 10) || 3;
      options.spamCodeOut = true;
      options.spamCodePrefix = spamPrefix || 'Spam';
      options.spamMethodCount = spamCount;
    } else {
      options.spamCodeOut = false;
    }
  }
  
  if (!targetPath || (!sourcePath && !imageOnlyMode)) {
    showError(imageOnlyMode ? '请选择目标文件夹' : '请选择源文件夹和目标文件夹');
    return;
  }
  
  const samePathBlocked = !imageOnlyMode && areSameSelectedPath(sourcePath, targetPath);
  const targetInfo = await inspectTargetFolder(targetPath);
  const warnings = [];
  if (targetInfo.entryCount > 0) {
    const entryPreview = targetInfo.entries && targetInfo.entries.length
      ? `：${targetInfo.entries.join('、')}${targetInfo.entryCount > targetInfo.entries.length ? ' ...' : ''}`
      : '';
    warnings.push(`目标文件夹已有内容（${targetInfo.entryCount} 项）${entryPreview}`);
  }

  const summaryLines = [];
  const selectedOptions = [];
  if (imageOnlyMode) {
    summaryLines.push('模式: 仅替换图片');
  } else {
    summaryLines.push('模式: 代码和资源处理');
  }
  
  if (currentPlatform === 'ios' && !imageOnlyMode) {
    summaryLines.push(`平台: iOS`);
    summaryLines.push(`类前缀: ${options.oldPrefix} -> ${options.newPrefix}`);
    if (options.includePods) {
      selectedOptions.push('复制 Pods 目录');
    }
    if (options.renameProjectName) {
      selectedOptions.push(`一键修改 iOS 工程名: ${options.oldProjectName} -> ${options.newProjectName}`);
    }
    if (options.handleXcassets) {
      selectedOptions.push(`批量重命名 xcassets 资源: ${options.oldAssetPrefix} -> ${options.newAssetPrefix}`);
    }
    if (options.renameFilesAndGroups) {
      selectedOptions.push(`同时修改文件和 Xcode Group 前缀: ${options.oldFileGroupPrefix} -> ${options.newFileGroupPrefix}`);
    }
    if (options.addRandomCode) {
      selectedOptions.push(`添加随机代码: ${options.randomPrefix} (${options.randomMethodCount} methods/file, ${options.randomVarCount} vars/file)`);
    }
  } else if (currentPlatform === 'android' && !imageOnlyMode) {
    summaryLines.push(`平台: Android`);
    summaryLines.push(`包名: ${options.oldPackage} -> ${options.newPackage}`);
    if (options.hasPrefix) {
      selectedOptions.push(`修改 Android 类前缀: ${options.oldPrefix} -> ${options.newPrefix}`);
    }
    if (options.addRandomCode) {
      selectedOptions.push(`添加随机代码: ${options.randomPrefix} (${options.randomMethodCount} methods/file, ${options.randomVarCount} vars/file)`);
    }
  }
  
  if (options.replaceImages) {
    const mappingSummary = options.imageAutoMatch
      ? '自动同名匹配（未配置规则）'
      : `手动规则 ${options.imageMappings.length} 条`;
    selectedOptions.push(`图片替换: ${mappingSummary}`);
    if (options.imageRenameToNewName) {
      selectedOptions.push('替换后使用新图片文件名');
    }
    if (options.normalizeUnreplacedImages) {
      selectedOptions.push('未替换图片重编码');
    }
  }
  if (!imageOnlyMode && options.deleteComments) {
    selectedOptions.push('清理代码注释');
  }
  if (!imageOnlyMode && options.spamCodeOut) {
    selectedOptions.push(`输出独立垃圾代码文件: ${options.spamCodePrefix} (${options.spamMethodCount} methods/file)`);
  }
  
  const confirmed = await showConfirmDialog({
    mode: imageOnlyMode ? '仅替换图片' : '代码和资源处理',
    source: imageOnlyMode ? '' : sourcePath,
    target: targetPath,
    summaryLines,
    selectedOptions,
    warnings,
    blockMessage: samePathBlocked ? '源文件夹和目标文件夹不能相同，请重新选择后再执行。' : ''
  });
  
  if (!confirmed) {
    if (samePathBlocked) {
      showError('源文件夹和目标文件夹不能相同');
    }
    return;
  }
  
  processBtn.disabled = true;
  scanBtn.disabled = true;
  selectSourceBtn.disabled = true;
  selectTargetBtn.disabled = true;
  
  progressDiv.style.display = 'block';
  resultsDiv.innerHTML = '<div class="info">正在处理文件...</div>';
  
  const result = await ipcRenderer.invoke('process-files', options);
  
  if (result.success) {
    displayProcessResults(result.results);
  } else {
    showError(`处理失败: ${result.error}`);
  }
  
  progressDiv.style.display = 'none';
  processBtn.disabled = false;
  scanBtn.disabled = false;
  selectSourceBtn.disabled = false;
  selectTargetBtn.disabled = false;
});

// 监听进度更新
ipcRenderer.on('process-progress', (event, data) => {
  const percent = Math.round((data.current / data.total) * 100);
  progressBar.style.width = percent + '%';
  progressText.textContent = `${percent}% (${data.current}/${data.total})`;
  currentFileDiv.textContent = `当前文件: ${data.file}`;
});

// 显示扫描结果
function displayScanResults(result) {
  if (result.mode === 'image-only') {
    const data = result.data;
    const replacePreview = data.matches.slice(0, 20);
    const missingPreview = data.missing.slice(0, 10);
    
    const html = `
      <div class="scan-results">
        <h3>📊 图片扫描结果</h3>
        <div class="stats">
          <div class="stat-item">
            <span class="stat-label">映射总数:</span>
            <span class="stat-value">${data.totalMappings}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">可替换规则:</span>
            <span class="stat-value swift">${data.replaceableCount}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">将替换文件总数:</span>
            <span class="stat-value">${data.targetFileCount}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">不可替换规则:</span>
            <span class="stat-value">${data.missingCount}</span>
          </div>
        </div>
        
        <div class="file-preview">
          <h4>可替换列表 (前 20 条):</h4>
          <ul class="file-list">
            ${replacePreview.map(item => `<li>🖼️ ${item.oldName} → ${item.newName}（命中 ${item.count} 处）</li>`).join('')}
            ${data.matches.length > 20 ? `<li class="more">... 还有 ${data.matches.length - 20} 条可替换规则</li>` : ''}
          </ul>
        </div>
        
        ${data.missingCount ? `
        <div class="file-preview">
          <h4>未命中/缺失 (前 10 条):</h4>
          <ul class="file-list">
            ${missingPreview.map(item => `<li>⚠️ ${item.oldName} → ${item.newName}（${item.reason}）</li>`).join('')}
            ${data.missing.length > 10 ? `<li class="more">... 还有 ${data.missing.length - 10} 条</li>` : ''}
          </ul>
        </div>
        ` : ''}
      </div>
    `;
    
    resultsDiv.innerHTML = html;
    return;
  }
  
  const fileTypeLabel = currentPlatform === 'ios' ? 'Swift/ObjC' : 'Kotlin/Java/XML';
  const data = result.data;
  
  const html = `
    <div class="scan-results">
      <h3>📊 扫描结果</h3>
      <div class="stats">
        <div class="stat-item">
          <span class="stat-label">总文件数:</span>
          <span class="stat-value">${data.total}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">${fileTypeLabel} 文件:</span>
          <span class="stat-value swift">${data.codeFiles.length}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">其他文件:</span>
          <span class="stat-value">${data.otherFiles.length}</span>
        </div>
      </div>
      
      <div class="file-preview">
        <h4>${fileTypeLabel} 文件预览 (前 10 个):</h4>
        <ul class="file-list">
          ${data.codeFiles.slice(0, 10).map(f => `<li>📄 ${f}</li>`).join('')}
          ${data.codeFiles.length > 10 ? `<li class="more">... 还有 ${data.codeFiles.length - 10} 个文件</li>` : ''}
        </ul>
      </div>
    </div>
  `;
  
  resultsDiv.innerHTML = html;
}

// 显示处理结果
function displayProcessResults(results) {
  const hasErrors = results.errors.length > 0;
  const fileTypeLabel = currentPlatform === 'ios' ? 'Swift/ObjC' : 'Kotlin/Java';
  
  const html = `
    <div class="process-results ${hasErrors ? 'has-errors' : 'success'}">
      <h3>${hasErrors ? '⚠️ 完成（有错误）' : '✅ 处理完成'}</h3>
      
      <div class="stats">
        <div class="stat-item">
          <span class="stat-label">处理的 ${fileTypeLabel} 文件:</span>
          <span class="stat-value swift">${results.processed}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">复制的其他文件:</span>
          <span class="stat-value">${results.copied}</span>
        </div>
        ${results.imageTotal ? `
        <div class="stat-item">
          <span class="stat-label">图片替换成功:</span>
          <span class="stat-value">${results.imageReplaced || 0}/${results.imageTotal}</span>
        </div>
        ` : ''}
        ${results.normalizedImages ? `
        <div class="stat-item">
          <span class="stat-label">未替换重编码:</span>
          <span class="stat-value">${results.normalizedImages}</span>
        </div>
        ` : ''}
        ${results.movedDirs ? `
        <div class="stat-item">
          <span class="stat-label">重组的目录:</span>
          <span class="stat-value">${results.movedDirs}</span>
        </div>
        ` : ''}
        ${results.projectRenamed ? `
        <div class="stat-item">
          <span class="stat-label">工程名更新:</span>
          <span class="stat-value">${results.projectRenamed}</span>
        </div>
        ` : ''}
        ${results.renamedAssets ? `
        <div class="stat-item">
          <span class="stat-label">xcassets 改名:</span>
          <span class="stat-value">${results.renamedAssets}</span>
        </div>
        ` : ''}
        ${results.spamCodeFiles ? `
        <div class="stat-item">
          <span class="stat-label">独立垃圾代码文件:</span>
          <span class="stat-value">${results.spamCodeFiles}</span>
        </div>
        ` : ''}
        ${results.renamedFilesAndGroups ? `
        <div class="stat-item">
          <span class="stat-label">重命名文件和 Group:</span>
          <span class="stat-value">${results.renamedFilesAndGroups} 个</span>
        </div>
        ` : ''}
        ${results.randomCodeAdded ? `
        <div class="stat-item">
          <span class="stat-label">添加随机代码:</span>
          <span class="stat-value">${results.randomCodeAdded} 个文件</span>
        </div>
        ` : ''}
        ${hasErrors ? `
        <div class="stat-item error">
          <span class="stat-label">错误:</span>
          <span class="stat-value">${results.errors.length}</span>
        </div>
        ` : ''}
      </div>
      
      ${hasErrors ? `
      <div class="errors">
        <h4>错误详情:</h4>
        <ul class="error-list">
          ${results.errors.map(e => `<li>❌ ${e.file}: ${e.error}</li>`).join('')}
        </ul>
      </div>
      ` : ''}
      
      <div class="success-message">
        ${results.imageOnly ? '<p>✨ 图片资源替换已完成</p>' : '<p>✨ 所有文件已成功处理并保存到目标文件夹</p>'}
        <p class="path">📁 ${targetPath}</p>
        ${currentPlatform === 'android' && results.packageReorganized ? 
          '<p style="color: #28a745; margin-top: 10px;">📦 Android 包目录结构已重新组织</p>' : ''}
      </div>
    </div>
  `;
  
  resultsDiv.innerHTML = html;
}

// 显示错误
function showError(message) {
  resultsDiv.innerHTML = `<div class="error">❌ ${message}</div>`;
}

// 更新按钮状态
function updateButtonStates() {
  const onlyReplaceProjectImages = !!(onlyReplaceProjectImagesCheckbox && onlyReplaceProjectImagesCheckbox.checked);
  const imageFolderPath = currentPlatform === 'ios'
    ? (imageFolderPathIOSInput ? imageFolderPathIOSInput.value.trim() : '')
    : (imageFolderPathAndroidInput ? imageFolderPathAndroidInput.value.trim() : '');
  const canScan = onlyReplaceProjectImages
    ? (targetPath !== '' && imageFolderPath !== '')
    : (sourcePath !== '');
  const replaceImagesEnabled = currentPlatform === 'ios'
    ? !!(replaceImagesIOSCheckbox && replaceImagesIOSCheckbox.checked)
    : !!(replaceImagesAndroidCheckbox && replaceImagesAndroidCheckbox.checked);
  const imageOnlyProcess = targetPath !== '' && replaceImagesEnabled && (onlyReplaceProjectImages || sourcePath === '');
  const canProcessCode = (
    sourcePath !== '' &&
    targetPath !== '' &&
    scanResults !== null &&
    scanResults.mode === 'code' &&
    !onlyReplaceProjectImages
  );
  const canProcessImageOnly = (
    imageOnlyProcess &&
    scanResults !== null &&
    scanResults.mode === 'image-only'
  );
  const canProcess = canProcessCode || canProcessImageOnly;
  
  scanBtn.disabled = !canScan;
  processBtn.disabled = !canProcess;
}

window.updateButtonStates = updateButtonStates;

// 输入框变化时更新按钮状态
oldPrefixInput.addEventListener('input', updateButtonStates);
newPrefixInput.addEventListener('input', updateButtonStates);
oldPackageInput.addEventListener('input', updateButtonStates);
newPackageInput.addEventListener('input', updateButtonStates);
oldAndroidPrefixInput.addEventListener('input', updateButtonStates);
newAndroidPrefixInput.addEventListener('input', updateButtonStates);
if (replaceImagesIOSCheckbox) replaceImagesIOSCheckbox.addEventListener('change', updateButtonStates);
if (replaceImagesAndroidCheckbox) replaceImagesAndroidCheckbox.addEventListener('change', updateButtonStates);
if (imageFolderPathIOSInput) imageFolderPathIOSInput.addEventListener('input', updateButtonStates);
if (imageFolderPathAndroidInput) imageFolderPathAndroidInput.addEventListener('input', updateButtonStates);
if (normalizeUnreplacedImagesIOSCheckbox) normalizeUnreplacedImagesIOSCheckbox.addEventListener('change', updateButtonStates);
if (normalizeUnreplacedImagesAndroidCheckbox) normalizeUnreplacedImagesAndroidCheckbox.addEventListener('change', updateButtonStates);
if (ignoreDirNamesInput) ignoreDirNamesInput.addEventListener('input', () => {
  scanResults = null;
  updateButtonStates();
});
if (oldProjectNameIOSInput) oldProjectNameIOSInput.addEventListener('input', updateButtonStates);
if (newProjectNameIOSInput) newProjectNameIOSInput.addEventListener('input', updateButtonStates);
if (oldAssetPrefixIOSInput) oldAssetPrefixIOSInput.addEventListener('input', updateButtonStates);
if (newAssetPrefixIOSInput) newAssetPrefixIOSInput.addEventListener('input', updateButtonStates);
if (spamCodePrefixIOSInput) spamCodePrefixIOSInput.addEventListener('input', updateButtonStates);
if (spamMethodCountIOSInput) spamMethodCountIOSInput.addEventListener('input', updateButtonStates);
if (spamCodePrefixAndroidInput) spamCodePrefixAndroidInput.addEventListener('input', updateButtonStates);
if (spamMethodCountAndroidInput) spamMethodCountAndroidInput.addEventListener('input', updateButtonStates);

// 初始化
applyImageOnlyModeUI();
updateButtonStates();
