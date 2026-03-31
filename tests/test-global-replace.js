// 测试全局替换逻辑

const testContent = `
//
//  YNDCYSTDiscountActivityStyle.swift
//  KangYuanLong
//
//  Created by Macbook on 2021/6/2.
//

import Foundation

/// 用户视图样式
enum YNDCYSTDiscountActivityStyle {
    case none
    case \`default\`
    case discountActivity
    case priceRang
}

protocol YNDCYSTGiftsListCollectionTitleViewDelegate: NSObjectProtocol {
    /// 返回反馈类型
    func showMoreGoods(_ model: YNDCYSTGiftsListModel?)
}

/// 购物车分类筛选
class YNDCYSTShopCartFilterModel: Convertible, ListDiffable {
    
    private let identifier: String = "YNDCYSTShopCartFilterModel"
    var text: String = ""
    var value: String = ""
    var is_selected: Bool = false
    
    required init() { }
    
    func diffIdentifier() -> NSObjectProtocol {
        return self.identifier as NSString
    }
    
    func isEqual(toDiffableObject object: ListDiffable?) -> Bool {
        guard let object = object as? YNDCYSTShopCartFilterModel else {
            return false
        }
        return self.identifier == object.identifier
    }
}

/// 购物车商品总结数据
class YNDCYSTShopCartSummaryModel: Convertible, ListDiffable {
    
    private let identifier: String = "YNDCYSTShopCartSummaryModel"
    var min_amount: CGFloat = 0.0
    
    /// 内部类示例
    class YNDCYSTInnerModel {
        var data: String = ""
    }
}

// 使用示例
func test() {
    let model = YNDCYSTShopCartFilterModel()
    let summary: YNDCYSTShopCartSummaryModel? = nil
    
    guard let cell = self.collectionContext?.dequeueReusableCell(
        of: YNDCYSTCheckShopCartOrderSummarySectionCollectionViewCell.self,
        withReuseIdentifier: "YNDCYSTCheckShopCartOrderSummarySectionCollectionViewCell",
        for: self,
        at: index
    ) as? YNDCYSTCheckShopCartOrderSummarySectionCollectionViewCell else {
        return UICollectionViewCell()
    }
    
    if model is YNDCYSTShopCartFilterModel {
        print("It's a filter model")
    }
    
    let arr: [YNDCYSTShopCartFilterModel] = []
    let dict: [String: YNDCYSTShopCartSummaryModel] = [:]
}
`;

// 模拟替换函数
function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function replaceClassInContent(content, oldClassName, newClassName) {
  const escaped = escapeRegExp(oldClassName);
  
  // 1. 类定义
  content = content.replace(
    new RegExp(`\\b(class|struct|enum|protocol|extension)\\s+${escaped}\\b`, 'g'),
    (match, keyword) => `${keyword} ${newClassName}`
  );
  
  // 2. 类型使用
  content = content.replace(new RegExp(`:\\s*${escaped}\\b`, 'g'), `: ${newClassName}`);
  content = content.replace(new RegExp(`<${escaped}>`, 'g'), `<${newClassName}>`);
  content = content.replace(new RegExp(`\\[${escaped}\\]`, 'g'), `[${newClassName}]`);
  content = content.replace(new RegExp(`as\\??\\s*${escaped}\\b`, 'g'), (match) => match.replace(escaped, newClassName));
  content = content.replace(new RegExp(`is\\s+${escaped}\\b`, 'g'), `is ${newClassName}`);
  content = content.replace(new RegExp(`\\b${escaped}\\.`, 'g'), `${newClassName}.`);
  
  // 3. 字符串中的类名
  content = content.replace(new RegExp(`"${escaped}"`, 'g'), `"${newClassName}"`);
  
  // 4. 注释
  content = content.replace(
    new RegExp(`(///)\\s*(.*)\\b${escaped}\\b`, 'g'),
    (match, comment, text) => `${comment} ${text.replace(escaped, newClassName)}`
  );
  
  // 5. 文件头注释
  content = content.replace(
    new RegExp(`^//\\s*${escaped}\\.swift`, 'm'),
    `//  ${newClassName}.swift`
  );
  
  return content;
}

// 测试
console.log('=== 测试全局替换 ===\n');
console.log('原始内容（部分）:');
console.log(testContent.substring(0, 500) + '...\n');

// 需要替换的类
const classes = [
  'YNDCYSTDiscountActivityStyle',
  'YNDCYSTGiftsListCollectionTitleViewDelegate',
  'YNDCYSTGiftsListModel',
  'YNDCYSTShopCartFilterModel',
  'YNDCYSTShopCartSummaryModel',
  'YNDCYSTInnerModel',
  'YNDCYSTCheckShopCartOrderSummarySectionCollectionViewCell'
];

let result = testContent;
classes.forEach(oldClass => {
  const newClass = oldClass.replace('YNDCYST', 'JUNZILAN');
  console.log(`替换: ${oldClass} → ${newClass}`);
  result = replaceClassInContent(result, oldClass, newClass);
});

console.log('\n=== 替换后的内容（部分）===\n');
console.log(result.substring(0, 800));

console.log('\n=== 检查关键位置 ===\n');

// 检查文件头
const fileHeader = result.match(/\/\/.*?\.swift/);
console.log('文件头:', fileHeader ? fileHeader[0] : '未找到');

// 检查枚举定义
const enumDef = result.match(/enum\s+\w+/);
console.log('枚举定义:', enumDef ? enumDef[0] : '未找到');

// 检查 protocol
const protocolDef = result.match(/protocol\s+\w+/);
console.log('协议定义:', protocolDef ? protocolDef[0] : '未找到');

// 检查字符串中的类名
const stringClass = result.match(/"[A-Z][a-zA-Z]+Model"/);
console.log('字符串类名:', stringClass ? stringClass[0] : '未找到');

// 检查类型声明
const typeDecl = result.match(/let model = \w+\(\)/);
console.log('类型声明:', typeDecl ? typeDecl[0] : '未找到');

console.log('\n=== 测试完成 ===');
