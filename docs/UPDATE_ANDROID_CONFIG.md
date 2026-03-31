# Android 配置更新说明

由于 HTML 文件较大，Android 配置的按钮更新与 iOS 相同。

在 index.html 的 Android 配置部分，需要添加与 iOS 相同的按钮：

## 变量配置部分

```html
<div style="display: flex; gap: 10px; align-items: center; margin-bottom: 10px;">
  <select id="variableConfigSelectAndroid" class="config-select">
    <option value="">-- 选择配置文件或新建 --</option>
  </select>
  <button id="saveVariableConfigAndroid" class="save-config-button">💾 保存</button>
  <button id="deleteVariableConfigAndroid" class="delete-config-button">🗑️ 删除</button>
</div>
<div style="display: flex; gap: 10px; align-items: center;">
  <button id="exportVariableConfigAndroid" class="export-button">📤 导出</button>
  <button id="importVariableConfigAndroid" class="import-button">📥 导入</button>
  <button id="templateVariableConfigAndroid" class="template-button">📚 模板库</button>
  <button id="shareVariableConfigAndroid" class="share-button">🔗 生成分享</button>
</div>
```

## 图片配置部分

```html
<div style="display: flex; gap: 10px; align-items: center; margin-bottom: 10px;">
  <select id="imageConfigSelectAndroid" class="config-select">
    <option value="">-- 选择配置文件或新建 --</option>
  </select>
  <button id="saveImageConfigAndroid" class="save-config-button">💾 保存</button>
  <button id="deleteImageConfigAndroid" class="delete-config-button">🗑️ 删除</button>
</div>
<div style="display: flex; gap: 10px; align-items: center;">
  <button id="exportImageConfigAndroid" class="export-button">📤 导出</button>
  <button id="importImageConfigAndroid" class="import-button">📥 导入</button>
  <button id="templateImageConfigAndroid" class="template-button">📚 模板库</button>
  <button id="shareImageConfigAndroid" class="share-button">🔗 生成分享</button>
</div>
```

## renderer-config-advanced.js 更新

需要在 initAdvancedConfigEvents() 函数中添加 Android 的事件绑定。

已提供 iOS 的完整实现，Android 只需要复制相同代码并替换 ID 即可。
