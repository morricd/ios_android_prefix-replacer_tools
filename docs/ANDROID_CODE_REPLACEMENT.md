# Android 代码文件包名替换详细说明

## 🎯 处理的所有代码场景

### 1. Package 声明
```java
package com.yndcyst.shop;
→
package com.sss.shop;
```

### 2. Import 语句

**普通 import:**
```java
import com.yndcyst.shop.utils.Utils;
→
import com.sss.shop.utils.Utils;
```

**Static import:**
```java
import static com.yndcyst.shop.utils.StringUtils.isNotEmpty;
import static com.yndcyst.shop.activity.group_commodity.GroupAdapter.COMBINATION;
→
import static com.sss.shop.utils.StringUtils.isNotEmpty;
import static com.sss.shop.activity.group_commodity.GroupAdapter.COMBINATION;
```

### 3. 类继承 (extends)

**你的示例:**
```java
public static class Goods extends com.yndcyst.shop.bean.Goods implements Serializable {
→
public static class Goods extends com.sss.shop.bean.Goods implements Serializable {
```

**其他示例:**
```java
public class CategoriesFilterLineView extends com.yndcyst.shop.widget.BaseBindingViewGroup<ViewCategoriesFilterLineBinding> {
→
public class CategoriesFilterLineView extends com.sss.shop.widget.BaseBindingViewGroup<ViewCategoriesFilterLineBinding> {
```

### 4. 接口实现 (implements)

```java
public static class Goods extends SomeClass implements com.yndcyst.shop.interfaces.MyInterface {
→
public static class Goods extends SomeClass implements com.sss.shop.interfaces.MyInterface {
```

### 5. 代码中的完整类名引用

**你的示例:**
```java
com.yndcyst.shop.utils.Utils.autoShouldExpand(getBinding().yjhDetailsActivityTab);
→
com.sss.shop.utils.Utils.autoShouldExpand(getBinding().yjhDetailsActivityTab);
```

**其他场景:**
```java
// 静态方法调用
com.yndcyst.shop.Helper.doSomething();

// 获取类
Class<?> clazz = com.yndcyst.shop.MyClass.class;

// 类型转换
(com.yndcyst.shop.CustomType) object;
```

### 6. 泛型中的包名

**你的 Kotlin 示例:**
```kotlin
var goodsImage: List<com.yndcyst.shop.bean.Goods.GoodsImages?>? = null
→
var goodsImage: List<com.sss.shop.bean.Goods.GoodsImages?>? = null
```

**Java 示例:**
```java
List<com.yndcyst.shop.model.User> users;
Map<String, com.yndcyst.shop.bean.Data> dataMap;
→
List<com.sss.shop.model.User> users;
Map<String, com.sss.shop.bean.Data> dataMap;
```

### 7. 注解中的包名

```java
@com.yndcyst.shop.annotation.CustomAnnotation
public class MyClass {
}
→
@com.sss.shop.annotation.CustomAnnotation
public class MyClass {
}
```

**注意:** `@SerializedName` 等第三方库的注解不会被替换（因为包名不同）

## 📊 完整示例对比

### 示例 1: 你的 Java 类

**替换前:**
```java
public static class Goods extends com.yndcyst.shop.bean.Goods implements Serializable {
    private int activity_type;
    private int is_finished;
    
    public int getActivity_type() {
        return activity_type;
    }
}
```

**替换后 (com.yndcyst.shop → com.sss.shop):**
```java
public static class Goods extends com.sss.shop.bean.Goods implements Serializable {
    private int activity_type;
    private int is_finished;
    
    public int getActivity_type() {
        return activity_type;
    }
}
```

### 示例 2: 带 Static Import

**替换前:**
```java
import static com.yndcyst.shop.utils.StringUtils.isNotEmpty;
import static com.yndcyst.shop.activity.group_commodity.GroupAdapter.COMBINATION;
import static com.yndcyst.shop.dialog.CommonData.TITLETAG;

public class MyClass {
    public void method() {
        if (isNotEmpty(text)) {
            // ...
        }
    }
}
```

**替换后:**
```java
import static com.sss.shop.utils.StringUtils.isNotEmpty;
import static com.sss.shop.activity.group_commodity.GroupAdapter.COMBINATION;
import static com.sss.shop.dialog.CommonData.TITLETAG;

public class MyClass {
    public void method() {
        if (isNotEmpty(text)) {
            // ...
        }
    }
}
```

### 示例 3: 代码中的完整类名

**替换前:**
```java
public class CategoriesFilterLineView extends com.yndcyst.shop.widget.BaseBindingViewGroup<ViewCategoriesFilterLineBinding> {
    @Override
    protected void onCreateView(Context context) {
        com.yndcyst.shop.utils.Utils.autoShouldExpand(getBinding().yjhDetailsActivityTab);
        Utils.onClickView(v -> {
            // ...
        }, binding.tvAll, binding.llSale);
    }
}
```

**替换后:**
```java
public class CategoriesFilterLineView extends com.sss.shop.widget.BaseBindingViewGroup<ViewCategoriesFilterLineBinding> {
    @Override
    protected void onCreateView(Context context) {
        com.sss.shop.utils.Utils.autoShouldExpand(getBinding().yjhDetailsActivityTab);
        Utils.onClickView(v -> {
            // ...
        }, binding.tvAll, binding.llSale);
    }
}
```

### 示例 4: 你的 Kotlin Data Class

**替换前:**
```kotlin
data class ErpOrderRefund(
    @SerializedName("id")
    var id: Int = 0,
    @SerializedName("goods")
    var goods: List<Goods?>? = null
) {
    data class Goods(
        @SerializedName("goods_image")
        var goodsImage: List<com.yndcyst.shop.bean.Goods.GoodsImages?>? = null,
        @SerializedName("name")
        var name: String? = null
    ) {
        fun imageLabel(): String =
            if (goodsImage.isNullOrEmpty()) "" else goodsImage!![0]?.imageUrl ?: ""
    }
}
```

**替换后:**
```kotlin
data class ErpOrderRefund(
    @SerializedName("id")
    var id: Int = 0,
    @SerializedName("goods")
    var goods: List<Goods?>? = null
) {
    data class Goods(
        @SerializedName("goods_image")
        var goodsImage: List<com.sss.shop.bean.Goods.GoodsImages?>? = null,
        @SerializedName("name")
        var name: String? = null
    ) {
        fun imageLabel(): String =
            if (goodsImage.isNullOrEmpty()) "" else goodsImage!![0]?.imageUrl ?: ""
    }
}
```

## 🔍 正则表达式规则

### 规则 1: Package 声明
```regex
package\s+com\.yndcyst\.shop
```

### 规则 2: Import 语句
```regex
import\s+com\.yndcyst\.shop
```

### 规则 3: Static Import
```regex
import\s+static\s+com\.yndcyst\.shop
```

### 规则 4: Extends
```regex
extends\s+com\.yndcyst\.shop
```

### 规则 5: Implements
```regex
implements\s+com\.yndcyst\.shop
```

### 规则 6: 泛型
```regex
<com\.yndcyst\.shop
```

### 规则 7: 注解
```regex
@com\.yndcyst\.shop
```

### 规则 8: 完整类名引用（最重要）
```regex
\bcom\.yndcyst\.shop\.(\w+)
```
**匹配:**
- `com.yndcyst.shop.utils.Utils`
- `com.yndcyst.shop.bean.Goods`
- `com.yndcyst.shop.widget.BaseBindingViewGroup`

## ✅ 验证方法

### 1. 全局搜索旧包名

处理完成后：
```bash
cd output-project

# 搜索所有包含旧包名的位置
grep -r "com.yndcyst.shop" . --include="*.java" --include="*.kt"

# 如果没有输出，说明替换成功
```

### 2. 重新编译

```bash
./gradlew clean
./gradlew build
```

如果编译成功，说明所有引用都正确替换了。

### 3. 检查特定文件

```bash
# 检查 import 语句
grep "^import" YourFile.java

# 检查 extends/implements
grep -E "extends|implements" YourFile.java

# 检查完整类名
grep "com\\..*\\." YourFile.java
```

## 🐛 已修复的问题

### 问题 1: Static Import 未被替换
**之前:** `import static com.yndcyst.shop.utils.StringUtils`  保持不变
**现在:** ✅ 正确替换

### 问题 2: Extends 中的包名未被替换
**之前:** `extends com.yndcyst.shop.bean.Goods` 保持不变
**现在:** ✅ 正确替换

### 问题 3: 代码中的完整类名未被替换
**之前:** `com.yndcyst.shop.utils.Utils.autoShouldExpand()` 保持不变
**现在:** ✅ 正确替换

### 问题 4: 泛型中的包名未被替换
**之前:** `List<com.yndcyst.shop.bean.Goods>` 保持不变
**现在:** ✅ 正确替换

## 📝 注意事项

### 1. 不会被替换的内容

**字符串字面量:**
```java
String packageName = "com.yndcyst.shop"; // 不会被替换
```

**注释:**
```java
// com.yndcyst.shop 的工具类 // 不会被替换
```

**ProGuard 规则:**
```
-keep class com.yndcyst.shop.** { *; } // 需要手动处理
```

这些内容通常也不需要替换。

### 2. 第三方库的包名

```java
import com.google.gson.Gson;  // 不会被替换（正确）
import androidx.appcompat.app.AppCompatActivity;  // 不会被替换（正确）
```

工具只会替换你指定的旧包名，不会影响第三方库。

### 3. 内部类引用

```java
com.yndcyst.shop.bean.Goods.GoodsImages
→
com.sss.shop.bean.Goods.GoodsImages
```

包括内部类的完整路径都会被正确处理。

## 🎯 总结

现在工具会完整处理所有代码中的包名引用：

✅ **Package 声明** - `package com.yndcyst.shop`
✅ **Import 语句** - 包括 static import
✅ **Extends** - `extends com.yndcyst.shop.xxx`
✅ **Implements** - `implements com.yndcyst.shop.xxx`
✅ **代码中的完整类名** - `com.yndcyst.shop.utils.Utils.xxx()`
✅ **泛型** - `List<com.yndcyst.shop.bean.Goods>`
✅ **注解** - `@com.yndcyst.shop.annotation.xxx`

所有你提到的示例都会被正确处理！
