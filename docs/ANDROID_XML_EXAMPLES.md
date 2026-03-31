# Android XML 布局文件处理示例

## 📱 支持的 XML 文件类型

工具会自动处理以下 XML 文件中的包名和类名：

- ✅ 布局文件 (layout/*.xml)
- ✅ DataBinding 布局文件
- ✅ AndroidManifest.xml
- ✅ Navigation 图 (navigation/*.xml)
- ✅ 其他包含自定义 View 的 XML 文件

## 🔧 处理的内容

### 1. 自定义 View 标签

**替换前：**
```xml
<com.yndcyst.shop.widget.CustomImageView
    android:layout_width="match_parent"
    android:layout_height="wrap_content" />
```

**替换后（包名：com.yndcyst.shop → com.sss.shop）：**
```xml
<com.sss.shop.widget.CustomImageView
    android:layout_width="match_parent"
    android:layout_height="wrap_content" />
```

### 2. DataBinding 变量类型

**替换前：**
```xml
<data>
    <variable
        name="handler"
        type="com.yndcyst.shop.feature.main.home.HomeZhongYaoFragment.Handler" />
    
    <variable
        name="data0"
        type="com.yndcyst.shop.data.entity.AdEntity" />
</data>
```

**替换后：**
```xml
<data>
    <variable
        name="handler"
        type="com.sss.shop.feature.main.home.HomeZhongYaoFragment.Handler" />
    
    <variable
        name="data0"
        type="com.sss.shop.data.entity.AdEntity" />
</data>
```

### 3. Fragment 标签

**替换前：**
```xml
<fragment
    android:id="@+id/nav_host_fragment"
    android:name="com.yndcyst.shop.ui.HomeFragment"
    android:layout_width="match_parent"
    android:layout_height="match_parent" />
```

**替换后：**
```xml
<fragment
    android:id="@+id/nav_host_fragment"
    android:name="com.sss.shop.ui.HomeFragment"
    android:layout_width="match_parent"
    android:layout_height="match_parent" />
```

### 4. 自定义适配器

**替换前：**
```xml
<androidx.recyclerview.widget.RecyclerView
    android:id="@+id/recyclerView"
    android:layout_width="match_parent"
    android:layout_height="match_parent"
    app:layoutManager="com.yndcyst.shop.widget.CustomLayoutManager" />
```

**替换后：**
```xml
<androidx.recyclerview.widget.RecyclerView
    android:id="@+id/recyclerView"
    android:layout_width="match_parent"
    android:layout_height="match_parent"
    app:layoutManager="com.sss.shop.widget.CustomLayoutManager" />
```

### 5. 带类前缀的情况

**如果同时修改类前缀（YND → SSS）：**

**替换前：**
```xml
<data>
    <variable
        name="handler"
        type="com.yndcyst.shop.feature.main.YNDHomeFragment.Handler" />
</data>

<com.yndcyst.shop.widget.YNDCustomView
    android:layout_width="match_parent"
    android:layout_height="wrap_content" />
```

**替换后：**
```xml
<data>
    <variable
        name="handler"
        type="com.sss.shop.feature.main.SSSHomeFragment.Handler" />
</data>

<com.sss.shop.widget.SSSCustomView
    android:layout_width="match_parent"
    android:layout_height="wrap_content" />
```

## 📄 完整示例

### 示例 1：DataBinding 布局文件

**原文件 (fragment_home.xml)：**
```xml
<?xml version="1.0" encoding="utf-8"?>
<layout xmlns:android="http://schemas.android.com/apk/res/android"
    xmlns:app="http://schemas.android.com/apk/res-auto"
    xmlns:tools="http://schemas.android.com/tools">

    <data>
        <variable
            name="handler"
            type="com.yndcyst.shop.feature.main.home.HomeZhongYaoFragment.Handler" />

        <variable
            name="data0"
            type="com.yndcyst.shop.data.entity.AdEntity" />

        <variable
            name="data1"
            type="com.yndcyst.shop.data.entity.AdEntity" />

        <variable
            name="data2"
            type="com.yndcyst.shop.data.entity.AdEntity" />
    </data>

    <LinearLayout
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:orientation="vertical">

        <com.yndcyst.shop.widget.BannerView
            android:id="@+id/banner"
            android:layout_width="match_parent"
            android:layout_height="@dimen/dp_200" />

        <com.yndcyst.shop.widget.CustomRecyclerView
            android:id="@+id/recyclerView"
            android:layout_width="match_parent"
            android:layout_height="wrap_content" />

    </LinearLayout>
</layout>
```

**替换后 (包名：com.yndcyst.shop → com.sss.shop)：**
```xml
<?xml version="1.0" encoding="utf-8"?>
<layout xmlns:android="http://schemas.android.com/apk/res/android"
    xmlns:app="http://schemas.android.com/apk/res-auto"
    xmlns:tools="http://schemas.android.com/tools">

    <data>
        <variable
            name="handler"
            type="com.sss.shop.feature.main.home.HomeZhongYaoFragment.Handler" />

        <variable
            name="data0"
            type="com.sss.shop.data.entity.AdEntity" />

        <variable
            name="data1"
            type="com.sss.shop.data.entity.AdEntity" />

        <variable
            name="data2"
            type="com.sss.shop.data.entity.AdEntity" />
    </data>

    <LinearLayout
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:orientation="vertical">

        <com.sss.shop.widget.BannerView
            android:id="@+id/banner"
            android:layout_width="match_parent"
            android:layout_height="@dimen/dp_200" />

        <com.sss.shop.widget.CustomRecyclerView
            android:id="@+id/recyclerView"
            android:layout_width="match_parent"
            android:layout_height="wrap_content" />

    </LinearLayout>
</layout>
```

### 示例 2：AndroidManifest.xml

**原文件：**
```xml
<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="com.yndcyst.shop">

    <application
        android:name="com.yndcyst.shop.MyApplication"
        android:icon="@mipmap/ic_launcher"
        android:label="@string/app_name">
        
        <activity
            android:name="com.yndcyst.shop.ui.MainActivity"
            android:exported="true">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>

        <service
            android:name="com.yndcyst.shop.service.MyService"
            android:enabled="true" />

        <receiver
            android:name="com.yndcyst.shop.receiver.MyReceiver"
            android:enabled="true" />

    </application>

</manifest>
```

**替换后：**
```xml
<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="com.sss.shop">

    <application
        android:name="com.sss.shop.MyApplication"
        android:icon="@mipmap/ic_launcher"
        android:label="@string/app_name">
        
        <activity
            android:name="com.sss.shop.ui.MainActivity"
            android:exported="true">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>

        <service
            android:name="com.sss.shop.service.MyService"
            android:enabled="true" />

        <receiver
            android:name="com.sss.shop.receiver.MyReceiver"
            android:enabled="true" />

    </application>

</manifest>
```

### 示例 3：Navigation 图

**原文件 (nav_graph.xml)：**
```xml
<?xml version="1.0" encoding="utf-8"?>
<navigation xmlns:android="http://schemas.android.com/apk/res/android"
    xmlns:app="http://schemas.android.com/apk/res-auto"
    android:id="@+id/nav_graph"
    app:startDestination="@id/homeFragment">

    <fragment
        android:id="@+id/homeFragment"
        android:name="com.yndcyst.shop.ui.HomeFragment"
        android:label="首页">
        <action
            android:id="@+id/action_home_to_detail"
            app:destination="@id/detailFragment" />
    </fragment>

    <fragment
        android:id="@+id/detailFragment"
        android:name="com.yndcyst.shop.ui.DetailFragment"
        android:label="详情" />

</navigation>
```

**替换后：**
```xml
<?xml version="1.0" encoding="utf-8"?>
<navigation xmlns:android="http://schemas.android.com/apk/res/android"
    xmlns:app="http://schemas.android.com/apk/res-auto"
    android:id="@+id/nav_graph"
    app:startDestination="@id/homeFragment">

    <fragment
        android:id="@+id/homeFragment"
        android:name="com.sss.shop.ui.HomeFragment"
        android:label="首页">
        <action
            android:id="@+id/action_home_to_detail"
            app:destination="@id/detailFragment" />
    </fragment>

    <fragment
        android:id="@+id/detailFragment"
        android:name="com.sss.shop.ui.DetailFragment"
        android:label="详情" />

</navigation>
```

## 🎯 处理规则

### 自动处理的属性

工具会自动识别并替换以下属性中的包名：

1. **自定义 View 标签** - `<com.yndcyst.shop.xxx`
2. **type 属性** - `type="com.yndcyst.shop.xxx"`
3. **class 属性** - `class="com.yndcyst.shop.xxx"`
4. **android:name 属性** - `android:name="com.yndcyst.shop.xxx"`
5. **package 属性** - `package="com.yndcyst.shop"`

### 类前缀替换（可选）

如果勾选了"同时修改类前缀"，还会替换：

- 包名后的类名前缀
- 例如：`com.sss.shop.YNDHomeFragment` → `com.sss.shop.SSSHomeFragment`

## ✅ 验证方法

处理完成后，建议检查：

1. **Android Studio 中打开项目**
   ```bash
   # 在 Android Studio 中打开目标文件夹
   ```

2. **全局搜索旧包名**
   ```
   Ctrl+Shift+F (Windows/Linux)
   Cmd+Shift+F (Mac)
   
   搜索：com.yndcyst.shop
   确认没有残留
   ```

3. **重新构建项目**
   ```
   Build → Clean Project
   Build → Rebuild Project
   ```

4. **检查 DataBinding 生成**
   ```bash
   # 如果使用 DataBinding，确保重新生成
   ./gradlew clean build
   ```

## 🐛 常见问题

### Q1: XML 中某些引用没有被替换？

**可能原因：**
- 使用了特殊的命名空间
- 包名格式不标准

**解决方法：**
手动检查并替换，或联系开发者报告问题

### Q2: DataBinding 报错找不到类？

**原因：** DataBinding 需要重新生成

**解决方法：**
```bash
./gradlew clean
./gradlew build
```

### Q3: 自定义 View 显示错误？

**原因：** XML 中的类名被替换，但对应的 Kotlin/Java 文件可能有问题

**解决方法：**
1. 检查 Kotlin/Java 文件是否正确替换
2. 确保文件已移动到新的包目录
3. 清理并重建项目

## 📝 注意事项

1. **备份项目** - 处理前务必备份或提交到 Git
2. **检查结果** - 处理后仔细检查生成的文件
3. **重新构建** - 完成后在 Android Studio 中重新构建
4. **测试运行** - 确保应用可以正常运行

## 🎉 总结

工具会自动处理 Android 项目中的所有 XML 文件，包括：

- ✅ 布局文件中的自定义 View
- ✅ DataBinding 变量类型
- ✅ Fragment 和 Activity 引用
- ✅ AndroidManifest.xml 配置
- ✅ Navigation 图
- ✅ 可选的类前缀替换

这样可以确保整个 Android 项目的包名和类名完整一致地更新！
