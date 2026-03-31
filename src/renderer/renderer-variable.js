// 变量修改功能脚本
// 支持修改指定类的变量值，带记忆功能

(function() {
  // 变量修改规则存储
  let classRulesIOS = [];
  let classRulesAndroid = [];
  const STORAGE_KEY_IOS = 'classRulesIOS';
  const STORAGE_KEY_ANDROID = 'classRulesAndroid';
  
  // 从 localStorage 加载类规则
  function loadClassRules() {
    try {
      const savedIOS = localStorage.getItem(STORAGE_KEY_IOS);
      if (savedIOS) {
        classRulesIOS = JSON.parse(savedIOS);
        renderClassRules('ios', classRulesIOS);
      }
      
      const savedAndroid = localStorage.getItem(STORAGE_KEY_ANDROID);
      if (savedAndroid) {
        classRulesAndroid = JSON.parse(savedAndroid);
        renderClassRules('android', classRulesAndroid);
      }
    } catch (error) {
      console.error('加载类规则失败:', error);
    }
  }
  
  // 保存类规则到 localStorage
  function saveClassRules(platform) {
    try {
      if (platform === 'ios') {
        localStorage.setItem(STORAGE_KEY_IOS, JSON.stringify(classRulesIOS));
      } else {
        localStorage.setItem(STORAGE_KEY_ANDROID, JSON.stringify(classRulesAndroid));
      }
    } catch (error) {
      console.error('保存类规则失败:', error);
    }
  }
  
  // 渲染类规则列表
  function renderClassRules(platform, rules) {
    const listId = platform === 'ios' ? 'classRuleListIOS' : 'classRuleListAndroid';
    const list = document.getElementById(listId);
    
    if (!list) return;
    
    list.innerHTML = '';
    
    rules.forEach((rule, classIndex) => {
      const item = document.createElement('div');
      item.className = 'class-rule-item';
      item.dataset.platform = platform;
      item.dataset.classIndex = classIndex;
      
      // 类头部
      const header = document.createElement('div');
      header.className = 'class-rule-header';
      header.innerHTML = `
        <input type="text" 
               value="${rule.className}" 
               placeholder="类名（如 AppConfig、Constants）"
               data-platform="${platform}"
               data-class-index="${classIndex}"
               data-field="className">
        <button class="expand-button ${rule.expanded ? 'expanded' : 'collapsed'}"
                data-platform="${platform}"
                data-class-index="${classIndex}">
          ${rule.expanded ? '收起' : '展开'}
        </button>
        <button class="remove-class-button"
                data-platform="${platform}"
                data-class-index="${classIndex}">
          删除类
        </button>
      `;
      item.appendChild(header);
      
      // 变量列表容器
      const variableContainer = document.createElement('div');
      variableContainer.style.display = rule.expanded ? 'block' : 'none';
      variableContainer.dataset.platform = platform;
      variableContainer.dataset.classIndex = classIndex;
      
      // 变量列表
      const variableList = document.createElement('div');
      variableList.className = 'variable-list';
      
      rule.variables.forEach((variable, varIndex) => {
        const varItem = document.createElement('div');
        varItem.className = 'variable-item';
        varItem.innerHTML = `
          <input type="text" 
                 value="${variable.name}" 
                 placeholder="变量名（如 API_URL）"
                 data-platform="${platform}"
                 data-class-index="${classIndex}"
                 data-var-index="${varIndex}"
                 data-field="name">
          <span class="variable-arrow">=</span>
          <input type="text" 
                 value="${variable.value}" 
                 placeholder="新值（如 &quot;https://api.new.com&quot;）"
                 data-platform="${platform}"
                 data-class-index="${classIndex}"
                 data-var-index="${varIndex}"
                 data-field="value">
          <button class="remove-button"
                  data-platform="${platform}"
                  data-class-index="${classIndex}"
                  data-var-index="${varIndex}">
            删除
          </button>
        `;
        variableList.appendChild(varItem);
      });
      
      variableContainer.appendChild(variableList);
      
      // 添加变量按钮
      const addVarBtn = document.createElement('button');
      addVarBtn.className = 'add-variable-button';
      addVarBtn.textContent = '+ 添加变量';
      addVarBtn.dataset.platform = platform;
      addVarBtn.dataset.classIndex = classIndex;
      variableContainer.appendChild(addVarBtn);
      
      item.appendChild(variableContainer);
      list.appendChild(item);
    });
    
    // 添加事件监听
    attachEventListeners(list, platform);
  }
  
  // 附加事件监听
  function attachEventListeners(list, platform) {
    // 类名输入
    list.querySelectorAll('input[data-field="className"]').forEach(input => {
      input.addEventListener('input', handleClassNameInput);
    });
    
    // 变量输入
    list.querySelectorAll('.variable-item input').forEach(input => {
      input.addEventListener('input', handleVariableInput);
    });
    
    // 展开/收起按钮
    list.querySelectorAll('.expand-button').forEach(btn => {
      btn.addEventListener('click', handleToggleExpand);
    });
    
    // 删除类按钮
    list.querySelectorAll('.remove-class-button').forEach(btn => {
      btn.addEventListener('click', handleRemoveClass);
    });
    
    // 删除变量按钮
    list.querySelectorAll('.variable-item .remove-button').forEach(btn => {
      btn.addEventListener('click', handleRemoveVariable);
    });
    
    // 添加变量按钮
    list.querySelectorAll('.add-variable-button').forEach(btn => {
      btn.addEventListener('click', handleAddVariable);
    });
  }
  
  // 处理类名输入
  function handleClassNameInput(e) {
    const platform = e.target.dataset.platform;
    const classIndex = parseInt(e.target.dataset.classIndex);
    const value = e.target.value;
    
    if (platform === 'ios') {
      classRulesIOS[classIndex].className = value;
      saveClassRules('ios');
    } else {
      classRulesAndroid[classIndex].className = value;
      saveClassRules('android');
    }
  }
  
  // 处理变量输入
  function handleVariableInput(e) {
    const platform = e.target.dataset.platform;
    const classIndex = parseInt(e.target.dataset.classIndex);
    const varIndex = parseInt(e.target.dataset.varIndex);
    const field = e.target.dataset.field;
    const value = e.target.value;
    
    if (platform === 'ios') {
      classRulesIOS[classIndex].variables[varIndex][field] = value;
      saveClassRules('ios');
    } else {
      classRulesAndroid[classIndex].variables[varIndex][field] = value;
      saveClassRules('android');
    }
  }
  
  // 处理展开/收起
  function handleToggleExpand(e) {
    const platform = e.target.dataset.platform;
    const classIndex = parseInt(e.target.dataset.classIndex);
    
    if (platform === 'ios') {
      classRulesIOS[classIndex].expanded = !classRulesIOS[classIndex].expanded;
      saveClassRules('ios');
      renderClassRules('ios', classRulesIOS);
    } else {
      classRulesAndroid[classIndex].expanded = !classRulesAndroid[classIndex].expanded;
      saveClassRules('android');
      renderClassRules('android', classRulesAndroid);
    }
  }
  
  // 处理删除类
  function handleRemoveClass(e) {
    const platform = e.target.dataset.platform;
    const classIndex = parseInt(e.target.dataset.classIndex);
    
    if (platform === 'ios') {
      classRulesIOS.splice(classIndex, 1);
      saveClassRules('ios');
      renderClassRules('ios', classRulesIOS);
    } else {
      classRulesAndroid.splice(classIndex, 1);
      saveClassRules('android');
      renderClassRules('android', classRulesAndroid);
    }
  }
  
  // 处理删除变量
  function handleRemoveVariable(e) {
    const platform = e.target.dataset.platform;
    const classIndex = parseInt(e.target.dataset.classIndex);
    const varIndex = parseInt(e.target.dataset.varIndex);
    
    if (platform === 'ios') {
      classRulesIOS[classIndex].variables.splice(varIndex, 1);
      saveClassRules('ios');
      renderClassRules('ios', classRulesIOS);
    } else {
      classRulesAndroid[classIndex].variables.splice(varIndex, 1);
      saveClassRules('android');
      renderClassRules('android', classRulesAndroid);
    }
  }
  
  // 处理添加变量
  function handleAddVariable(e) {
    const platform = e.target.dataset.platform;
    const classIndex = parseInt(e.target.dataset.classIndex);
    
    const newVariable = { name: '', value: '' };
    
    if (platform === 'ios') {
      classRulesIOS[classIndex].variables.push(newVariable);
      saveClassRules('ios');
      renderClassRules('ios', classRulesIOS);
    } else {
      classRulesAndroid[classIndex].variables.push(newVariable);
      saveClassRules('android');
      renderClassRules('android', classRulesAndroid);
    }
  }
  
  // 添加新类规则
  function addClassRule(platform) {
    const newRule = {
      className: '',
      variables: [],
      expanded: true
    };
    
    if (platform === 'ios') {
      classRulesIOS.push(newRule);
      saveClassRules('ios');
      renderClassRules('ios', classRulesIOS);
    } else {
      classRulesAndroid.push(newRule);
      saveClassRules('android');
      renderClassRules('android', classRulesAndroid);
    }
  }
  
  // 获取类规则
  window.getClassRules = function(platform) {
    return platform === 'ios' ? classRulesIOS : classRulesAndroid;
  };
  
  // 初始化事件监听
  function initVariableModifyEvents() {
    // iOS 变量修改复选框
    const modifyVariablesIOS = document.getElementById('modifyVariablesIOS');
    const variableModifyOptionsIOS = document.getElementById('variableModifyOptionsIOS');
    
    if (modifyVariablesIOS) {
      modifyVariablesIOS.addEventListener('change', (e) => {
        variableModifyOptionsIOS.style.display = e.target.checked ? 'block' : 'none';
      });
    }
    
    // Android 变量修改复选框
    const modifyVariablesAndroid = document.getElementById('modifyVariablesAndroid');
    const variableModifyOptionsAndroid = document.getElementById('variableModifyOptionsAndroid');
    
    if (modifyVariablesAndroid) {
      modifyVariablesAndroid.addEventListener('change', (e) => {
        variableModifyOptionsAndroid.style.display = e.target.checked ? 'block' : 'none';
      });
    }
    
    // iOS 添加类按钮
    const addClassRuleIOS = document.getElementById('addClassRuleIOS');
    if (addClassRuleIOS) {
      addClassRuleIOS.addEventListener('click', () => addClassRule('ios'));
    }
    
    // Android 添加类按钮
    const addClassRuleAndroid = document.getElementById('addClassRuleAndroid');
    if (addClassRuleAndroid) {
      addClassRuleAndroid.addEventListener('click', () => addClassRule('android'));
    }
  }
  
  // DOM 加载完成后初始化
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      loadClassRules();
      initVariableModifyEvents();
    });
  } else {
    loadClassRules();
    initVariableModifyEvents();
  }
})();

  // 从配置数据加载类规则（供配置管理器调用）
  window.loadClassRulesFromData = function(platform, data) {
    if (platform === 'ios') {
      classRulesIOS = data || [];
      renderClassRules('ios', classRulesIOS);
    } else {
      classRulesAndroid = data || [];
      renderClassRules('android', classRulesAndroid);
    }
  };
