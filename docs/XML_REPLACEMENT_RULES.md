# Android XML 包名替换详细规则

## 🎯 处理的所有情况

### 1. DataBinding Variable Type

**支持的格式：**

✅ **标准格式**
```xml
<variable
    name="data"
    type="com.yndcyst.shop.feature.gift.GiftGroupItem" />
```

✅ **紧凑格式**
```xml
<variable name="handler" type="com.yndcyst.shop.Handler" />
```

✅ **带空格的格式**
```xml
<variable
    name="data"
    type  =  "  com.yndcyst.shop.Model"  />
```

✅ **换行格式**
```xml
<variable
    name="data"
    type=
        "com.yndcyst.shop.Model" />
```

**替换后：**
- `com.yndcyst.shop` → `com.sss.shop`
- 保持原有格式和缩进

### 2. 自定义 View 标签

**支持的格式：**

✅ **自闭合标签**
```xml
<com.yndcyst.shop.widget.CustomImageView
    android:layout_width="match_parent"
    android:layout_height="wrap_content" />
```

✅ **开始和闭合标签** ⭐ 重要
```xml
<com.yndcyst.shop.viewpage.AnimationNestedScrollView
    android:layout_width="match_parent"
    android:layout_height="wrap_content">
    
    <!-- 内容 -->
    
</com.yndcyst.shop.viewpage.AnimationNestedScrollView>
```

✅ **单行格式**
```xml
<com.yndcyst.shop.widget.BannerView android:id="@+id/banner" />
```

✅ **嵌套的自定义 View**
```xml
<com.yndcyst.shop.view.Container>
    <com.yndcyst.shop.widget.CustomView1 />
    <com.yndcyst.shop.widget.CustomView2 />
</com.yndcyst.shop.view.Container>
```

**替换后：** 所有 `<com.yndcyst.shop` 和 `</com.yndcyst.shop` 都会被替换为 `<com.sss.shop` 和 `</com.sss.shop`

### 3. Fragment 引用

**支持的格式：**

✅ **android:name 属性**
```xml
<fragment
    android:id="@+id/nav_host"
    android:name="com.yndcyst.shop.ui.HomeFragment" />
```

✅ **带空格**
```xml
<fragment
    android:name = " com.yndcyst.shop.ui.DetailFragment " />
```

### 4. AndroidManifest.xml

**支持的格式：**

✅ **package 属性**
```xml
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="com.yndcyst.shop">
```

✅ **Application 类**
```xml
<application
    android:name="com.yndcyst.shop.MyApplication">
```

✅ **Activity、Service、Receiver**
```xml
<activity android:name="com.yndcyst.shop.MainActivity" />
<service android:name="com.yndcyst.shop.MyService" />
<receiver android:name="com.yndcyst.shop.MyReceiver" />
```

### 5. Navigation 图

**支持的格式：**

✅ **Fragment 定义**
```xml
<fragment
    android:id="@+id/homeFragment"
    android:name="com.yndcyst.shop.ui.HomeFragment" />
```

✅ **Activity 定义**
```xml
<activity
    android:id="@+id/mainActivity"
    android:name="com.yndcyst.shop.MainActivity" />
```

### 6. RecyclerView Adapter

**支持的格式：**

✅ **layoutManager 属性**
```xml
<androidx.recyclerview.widget.RecyclerView
    app:layoutManager="com.yndcyst.shop.widget.CustomLayoutManager" />
```

### 7. 任意自定义属性

**通用匹配：**

工具会匹配任何形如 `属性="包名.类名"` 的模式：

✅ **示例 1**
```xml
<View app:customAttr="com.yndcyst.shop.CustomClass" />
```

✅ **示例 2**
```xml
<TextView tools:targetApi="com.yndcyst.shop.ApiLevel" />
```

## 🔍 正则表达式规则

### 规则 1: 自定义 View 开始标签
```regex
<com\.yndcyst\.shop
```
匹配：`<com.yndcyst.shop.widget.CustomView`

### 规则 2: 自定义 View 闭合标签 ⭐ 新增
```regex
</com\.yndcyst\.shop
```
匹配：`</com.yndcyst.shop.viewpage.AnimationNestedScrollView>`

### 规则 3: type 属性（宽松匹配）
```regex
type\s*=\s*"\s*com\.yndcyst\.shop
```
匹配：
- `type="com.yndcyst.shop`
- `type = "com.yndcyst.shop`
- `type="  com.yndcyst.shop`

### 规则 4: class 属性
```regex
class\s*=\s*"\s*com\.yndcyst\.shop
```

### 规则 5: android:name 属性
```regex
android:name\s*=\s*"\s*com\.yndcyst\.shop
```

### 规则 6: package 属性
```regex
package\s*=\s*"\s*com\.yndcyst\.shop\s*"
```

### 规则 7: 通用匹配（兜底）
```regex
=\s*"\s*com\.yndcyst\.shop\.
```
匹配任何 `属性="包名.xxx"` 的格式

## ✅ 测试验证

### 测试用例 1: 你的 DataBinding 示例

**输入：**
```xml
<data>
    <variable
        name="data"
        type="com.yndcyst.shop.feature.gift.GiftGroupItem" />
</data>
```

**处理过程：**
1. 匹配 `type="com.yndcyst.shop`
2. 替换为 `type="com.sss.shop`

**输出：**
```xml
<data>
    <variable
        name="data"
        type="com.sss.shop.feature.gift.GiftGroupItem" />
</data>
```

### 测试用例 2: 你的闭合标签示例 ⭐ 新增

**输入：**
```xml
<com.yndcyst.shop.viewpage.AnimationNestedScrollView
    android:layout_width="match_parent"
    android:layout_height="wrap_content">
    
    <LinearLayout>
        <!-- 内容 -->
    </LinearLayout>
    
</com.yndcyst.shop.viewpage.AnimationNestedScrollView>
```

**处理过程：**
1. 匹配 `<com.yndcyst.shop` → 替换开始标签
2. 匹配 `</com.yndcyst.shop` → 替换闭合标签

**输出：**
```xml
<com.sss.shop.viewpage.AnimationNestedScrollView
    android:layout_width="match_parent"
    android:layout_height="wrap_content">
    
    <LinearLayout>
        <!-- 内容 -->
    </LinearLayout>
    
</com.sss.shop.viewpage.AnimationNestedScrollView>
```

### 测试用例 3: 复杂布局

**输入：**
```xml
<layout>
    <data>
        <variable name="handler" type="com.yndcyst.shop.Handler" />
        <variable name="model" type="com.yndcyst.shop.Model" />
    </data>
    
    <LinearLayout>
        <com.yndcyst.shop.widget.CustomView
            android:id="@+id/custom" />
        
        <fragment
            android:name="com.yndcyst.shop.ui.Fragment" />
    </LinearLayout>
</layout>
```

**输出：**
```xml
<layout>
    <data>
        <variable name="handler" type="com.sss.shop.Handler" />
        <variable name="model" type="com.sss.shop.Model" />
    </data>
    
    <LinearLayout>
        <com.sss.shop.widget.CustomView
            android:id="@+id/custom" />
        
        <fragment
            android:name="com.sss.shop.ui.Fragment" />
    </LinearLayout>
</layout>
```

## 🐛 已修复的问题

### 问题 1: 属性值中有空格

**之前：** 无法匹配 `type="  com.yndcyst.shop.xxx"`

**现在：** ✅ 使用 `\s*` 匹配任意空格

### 问题 2: 属性和等号之间有空格

**之前：** 无法匹配 `type = "com.yndcyst.shop.xxx"`

**现在：** ✅ 使用 `\s*=\s*` 匹配

### 问题 3: 遗漏某些自定义属性

**之前：** 只匹配常见属性（type、class、name）

**现在：** ✅ 添加通用模式作为兜底

## 🧪 如何测试

### 运行测试脚本

```bash
cd prefix-replacer
node test-xml-replacement.js
```

### 测试覆盖的场景

- ✅ DataBinding variable type
- ✅ 紧凑格式
- ✅ 带空格格式
- ✅ 自定义 View
- ✅ Fragment name
- ✅ AndroidManifest package

### 手动测试

1. **创建测试 XML 文件**
   ```bash
   mkdir test-project
   cd test-project
   mkdir -p app/src/main/res/layout
   ```

2. **创建包含各种格式的 XML**
   ```bash
   cat > app/src/main/res/layout/test.xml << 'EOF'
   <layout>
       <data>
           <variable name="data" type="com.yndcyst.shop.Model" />
       </data>
       <com.yndcyst.shop.widget.CustomView />
   </layout>
   EOF
   ```

3. **使用工具处理**
   - 在应用中选择 Android 平台
   - 输入旧包名：com.yndcyst.shop
   - 输入新包名：com.sss.shop
   - 处理项目

4. **验证结果**
   ```bash
   cat output-project/app/src/main/res/layout/test.xml
   # 应该看到所有包名都被替换
   ```

## 📝 注意事项

### 1. 备份项目

处理前务必备份：
```bash
cp -r my-android-project my-android-project.backup
```

### 2. 检查结果

处理后全局搜索旧包名：
```bash
cd output-project
grep -r "com.yndcyst.shop" .
```

如果有输出，说明有遗漏，请报告给开发者。

### 3. 重新构建

```bash
./gradlew clean
./gradlew build
```

### 4. 特殊情况

某些特殊格式可能需要手动检查：
- 注释中的包名（不会被替换，这是预期行为）
- 字符串资源中的包名（需要手动处理）
- ProGuard 规则中的包名（需要手动处理）

## 🎯 总结

改进后的 XML 处理功能：

- ✅ **更强大的正则匹配** - 支持各种格式和空格
- ✅ **通用兜底模式** - 确保不遗漏任何引用
- ✅ **完整测试覆盖** - 包含测试脚本和示例
- ✅ **详细文档** - 清晰的规则说明

现在应该能够正确处理所有 XML 文件中的包名引用，包括你提到的 DataBinding variable type！
