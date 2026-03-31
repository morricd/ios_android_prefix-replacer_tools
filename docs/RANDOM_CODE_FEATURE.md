# 随机代码生成功能说明

## 🎯 功能用途

为每个 Java/Kotlin 文件自动添加随机的方法和变量，使得：
- ✅ 每次生成的二进制文件都不同
- ✅ 增加反编译难度
- ✅ 防止简单的文件对比
- ✅ 提高代码混淆程度

## 🔧 使用方法

在 Android 配置界面中：
1. 勾选 "添加随机代码（增加二进制差异）"
2. 设置随机代码前缀（如 obf、sec、_）
3. 设置每个文件的方法数（建议 3-5）
4. 设置每个文件的变量数（建议 5-10）

## 📊 生成的代码示例

添加后的 Java 代码：
```java
public class UserActivity extends AppCompatActivity {
    // 原有代码...

    // Auto-generated obfuscation code
    private int obftempBackup123 = 456;
    private String obfcacheX789 = "data";
    
    private int obfQuickProcessData234() {
        return 567;
    }
}
```

## ✅ 特点

- 不重复：同一文件中名称不重复
- 位置固定：添加在类尾部
- 访问控制：使用 private 修饰符
- 合法代码：可正常编译
- 无副作用：不影响原有逻辑

详细说明请参考完整文档。

## 🍎 iOS Swift 示例

### 添加前
```swift
import UIKit

class UserViewController: UIViewController {
    private var userName: String = ""
    
    override func viewDidLoad() {
        super.viewDidLoad()
        loadUserData()
    }
    
    private func loadUserData() {
        // 加载用户数据
    }
}
```

### 添加后（前缀：obf，方法：3，变量：5）
```swift
import UIKit

class UserViewController: UIViewController {
    private var userName: String = ""
    
    override func viewDidLoad() {
        super.viewDidLoad()
        loadUserData()
    }
    
    private func loadUserData() {
        // 加载用户数据
    }

    // Auto-generated obfuscation code
    private var obftempBackup123: Int = 456
    private var obfcacheX789: String = "data"
    private var obfflagStore234: Bool = true
    private var obfindexOne567: Double = 12.34
    private var obfvalueY345: Float = 56.78

    private func obfQuickProcessData234() -> Int {
        return 890
    }

    private func obfSmartHandleInfo456() -> String {
        return "temp"
    }

    private func obfFastValidateValue789() -> Bool {
        return false
    }
}
```

## 🤖 平台支持对比

| 特性 | iOS Swift | Android Kotlin | Android Java |
|------|-----------|----------------|--------------|
| 随机变量 | ✅ | ✅ | ✅ |
| 随机方法 | ✅ | ✅ | ✅ |
| 支持类型 | Int, String, Bool, Double, Float | Int, String, Boolean, Long, Double, Float | int, String, boolean, long, double, float |
| 访问修饰符 | private | private | private |
| 位置 | 类尾部 | 类尾部 | 类尾部 |

## 📱 iOS 特殊说明

### 1. Swift 类型系统

Swift 使用的类型：
- `Int` - 整数
- `String` - 字符串
- `Bool` - 布尔值
- `Double` - 双精度浮点数
- `Float` - 单精度浮点数

### 2. 方法语法

Swift 方法使用 `func` 关键字和 `->` 返回类型：
```swift
private func methodName() -> ReturnType {
    return value
}
```

### 3. 兼容性

- ✅ 支持 Swift 5.0+
- ✅ 支持所有 iOS 版本
- ✅ 与 Objective-C 互操作无影响

### 4. 编译优化

在 Release 模式下，未使用的代码可能被优化掉。
**建议：** 配置编译选项保留这些代码，或在 Debug 模式使用。

## 🎯 最佳实践

### iOS 项目
```
前缀：_
方法数：3-5
变量数：5-8
```

### Android 项目
```
前缀：obf
方法数：3-5
变量数：5-10
```

### 跨平台项目（iOS + Android）
```
iOS 前缀：ios_
Android 前缀：and_
方法数：3
变量数：5
```

这样可以区分不同平台的随机代码。
