const { ipcRenderer } = require('electron');

let sourcePath = '';
let targetPath = '';
let scanResults = null;
let currentPlatform = 'ios';

// DOM 元素
const sourcePathInput = document.getElementById('sourcePath');
const targetPathInput = document.getElementById('targetPath');
const selectSourceBtn = document.getElementById('selectSource');
const selectTargetBtn = document.getElementById('selectTarget');

// iOS 配置
const iosConfig = document.getElementById('iosConfig');
const oldPrefixInput = document.getElementById('oldPrefix');
const newPrefixInput = document.getElementById('newPrefix');
const copyPodsIOSCheckbox = document.getElementById('copyPodsIOS');

// Android 配置
const androidConfig = document.getElementById('androidConfig');
const oldPackageInput = document.getElementById('oldPackage');
const newPackageInput = document.getElementById('newPackage');
const hasAndroidPrefixCheckbox = document.getElementById('hasAndroidPrefix');
const androidPrefixInputs = document.getElementById('androidPrefixInputs');
const oldAndroidPrefixInput = document.getElementById('oldAndroidPrefix');
const newAndroidPrefixInput = document.getElementById('newAndroidPrefix');

// 平台选择
const platformRadios = document.querySelectorAll('input[name="platform"]');

const scanBtn = document.getElementById('scanBtn');
const processBtn = document.getElementById('processBtn');
const resultsDiv = document.getElementById('results');
const progressDiv = document.getElementById('progress');
const progressBar = document.getElementById('progressBar');
const progressText = document.getElementById('progressText');
const currentFileDiv = document.getElementById('currentFile');

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
    updateButtonStates();
  });
});

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
  filesGroupsInputs.style.display = e.target.checked ? 'flex' : 'none';
  updateButtonStates();
});

copyPodsIOSCheckbox.addEventListener('change', () => {
  scanResults = null;
  resultsDiv.innerHTML = '<div class="placeholder"><p>👆 Pods 选项已变更，请重新扫描</p></div>';
  updateButtonStates();
});

// 选择源文件夹
selectSourceBtn.addEventListener('click', async () => {
  const path = await ipcRenderer.invoke('select-source-folder');
  if (path) {
    sourcePath = path;
    sourcePathInput.value = path;
    updateButtonStates();
  }
});

// 选择目标文件夹
selectTargetBtn.addEventListener('click', async () => {
  const path = await ipcRenderer.invoke('select-target-folder');
  if (path) {
    targetPath = path;
    targetPathInput.value = path;
    updateButtonStates();
  }
});

// 扫描文件
scanBtn.addEventListener('click', async () => {
  if (!sourcePath) {
    showError('请先选择源文件夹');
    return;
  }
  
  scanBtn.disabled = true;
  scanBtn.textContent = '扫描中...';
  resultsDiv.innerHTML = '<div class="info">正在扫描文件...</div>';
  
  const result = await ipcRenderer.invoke('scan-files', sourcePath, currentPlatform, {
    includePods: currentPlatform === 'ios' ? copyPodsIOSCheckbox.checked : false
  });
  
  if (result.success) {
    scanResults = result;
    displayScanResults(result);
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
    platform: currentPlatform
  };
  
  // 根据平台获取配置
  if (currentPlatform === 'ios') {
    const oldPrefix = oldPrefixInput.value.trim();
    const newPrefix = newPrefixInput.value.trim();
    
    if (!oldPrefix || !newPrefix) {
      showError('请输入旧前缀和新前缀');
      return;
    }
    
    options.oldPrefix = oldPrefix;
    options.newPrefix = newPrefix;
    options.includePods = copyPodsIOSCheckbox.checked;
    
    // 是否重命名文件和 Group（可选）
    const renameFilesAndGroups = document.getElementById('renameFilesAndGroups');
    if (renameFilesAndGroups.checked) {
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
    if (addRandomCodeIOSCheckbox.checked) {
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
    
    if (!oldPackage || !newPackage) {
      showError('请输入旧包名和新包名');
      return;
    }
    
    options.oldPackage = oldPackage;
    options.newPackage = newPackage;
    
    // 如果勾选了类前缀
    if (hasAndroidPrefixCheckbox.checked) {
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
    if (addRandomCodeCheckbox.checked) {
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
  }
  
  if (!sourcePath || !targetPath) {
    showError('请选择源文件夹和目标文件夹');
    return;
  }
  
  if (sourcePath === targetPath) {
    showError('源文件夹和目标文件夹不能相同');
    return;
  }
  
  // 确认信息
  let confirmMsg = `确定要执行替换吗？\n\n源文件夹: ${sourcePath}\n目标文件夹: ${targetPath}\n\n`;
  if (currentPlatform === 'ios') {
    confirmMsg += `平台: iOS\n旧前缀: ${options.oldPrefix}\n新前缀: ${options.newPrefix}`;
    if (options.includePods) {
      confirmMsg += '\n复制 Pods: 是';
    }
  } else {
    confirmMsg += `平台: Android\n旧包名: ${options.oldPackage}\n新包名: ${options.newPackage}`;
    if (options.hasPrefix) {
      confirmMsg += `\n旧前缀: ${options.oldPrefix}\n新前缀: ${options.newPrefix}`;
    }
  }
  
  const confirmed = confirm(confirmMsg);
  
  if (!confirmed) {
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
  const fileTypeLabel = currentPlatform === 'ios' ? 'Swift' : 'Kotlin/Java/XML';
  const fileExt = currentPlatform === 'ios' ? '.swift' : '.kt/.java/.xml';
  
  const html = `
    <div class="scan-results">
      <h3>📊 扫描结果</h3>
      <div class="stats">
        <div class="stat-item">
          <span class="stat-label">总文件数:</span>
          <span class="stat-value">${result.total}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">${fileTypeLabel} 文件:</span>
          <span class="stat-value swift">${result.codeFiles.length}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">其他文件:</span>
          <span class="stat-value">${result.otherFiles.length}</span>
        </div>
      </div>
      
      <div class="file-preview">
        <h4>${fileTypeLabel} 文件预览 (前 10 个):</h4>
        <ul class="file-list">
          ${result.codeFiles.slice(0, 10).map(f => `<li>📄 ${f}</li>`).join('')}
          ${result.codeFiles.length > 10 ? `<li class="more">... 还有 ${result.codeFiles.length - 10} 个文件</li>` : ''}
        </ul>
      </div>
    </div>
  `;
  
  resultsDiv.innerHTML = html;
}

// 显示处理结果
function displayProcessResults(results) {
  const hasErrors = results.errors.length > 0;
  const fileTypeLabel = currentPlatform === 'ios' ? 'Swift' : 'Kotlin/Java';
  
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
        ${results.movedDirs ? `
        <div class="stat-item">
          <span class="stat-label">重组的目录:</span>
          <span class="stat-value">${results.movedDirs}</span>
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
        <p>✨ 所有文件已成功处理并保存到目标文件夹</p>
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
  const canScan = sourcePath !== '';
  const canProcess = sourcePath !== '' && targetPath !== '' && scanResults !== null;
  
  scanBtn.disabled = !canScan;
  processBtn.disabled = !canProcess;
}

// 输入框变化时更新按钮状态
oldPrefixInput.addEventListener('input', updateButtonStates);
newPrefixInput.addEventListener('input', updateButtonStates);
oldPackageInput.addEventListener('input', updateButtonStates);
newPackageInput.addEventListener('input', updateButtonStates);
oldAndroidPrefixInput.addEventListener('input', updateButtonStates);
newAndroidPrefixInput.addEventListener('input', updateButtonStates);

// 初始化
updateButtonStates();
