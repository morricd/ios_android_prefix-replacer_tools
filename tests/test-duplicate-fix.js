// 测试修复重复前缀问题

const testCases = [
  {
    name: '构造函数调用',
    input: 'let filterHeaderView = YNDCYSTSortCommodityHeaderView(frame: CGRect(...))',
    oldClass: 'YNDCYSTSortCommodityHeaderView',
    newClass: 'JunZiLanSortCommodityHeaderView',
    expected: 'let filterHeaderView = JunZiLanSortCommodityHeaderView(frame: CGRect(...))'
  },
  {
    name: '多个构造函数',
    input: `let searchView = YNDCYSTSearchView(frame: CGRect(...))
let headerView = YNDCYSTHeaderView(frame: .zero)`,
    oldClass: 'YNDCYSTSearchView',
    newClass: 'JunZiLanSearchView',
    expected: `let searchView = JunZiLanSearchView(frame: CGRect(...))
let headerView = YNDCYSTHeaderView(frame: .zero)`
  },
  {
    name: '类型声明',
    input: 'var viewModels = [YNDCYSTSortViewModel]()',
    oldClass: 'YNDCYSTSortViewModel',
    newClass: 'JunZiLanSortViewModel',
    expected: 'var viewModels = [JunZiLanSortViewModel]()'
  },
  {
    name: '字符串中的类名',
    input: 'private let identifier = "YNDCYSTShopCartFilterModel"',
    oldClass: 'YNDCYSTShopCartFilterModel',
    newClass: 'JunZiLanShopCartFilterModel',
    expected: 'private let identifier = "JunZiLanShopCartFilterModel"'
  },
  {
    name: 'Cell 复用标识符',
    input: 'withReuseIdentifier: "YNDCYSTCheckShopCartCell"',
    oldClass: 'YNDCYSTCheckShopCartCell',
    newClass: 'JunZiLanCheckShopCartCell',
    expected: 'withReuseIdentifier: "JunZiLanCheckShopCartCell"'
  }
];

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function replaceClassInContent(content, oldClassName, newClassName) {
  const escaped = escapeRegExp(oldClassName);
  
  // 实例化（精确匹配）
  content = content.replace(
    new RegExp(`\\b${escaped}\\s*\\(`, 'g'),
    `${newClassName}(`
  );
  
  // 数组类型
  content = content.replace(
    new RegExp(`\\[\\s*${escaped}\\s*\\]`, 'g'),
    `[${newClassName}]`
  );
  
  // 字符串
  content = content.replace(
    new RegExp(`"${escaped}"`, 'g'),
    `"${newClassName}"`
  );
  
  return content;
}

console.log('=== 测试重复前缀修复 ===\n');

let passedCount = 0;
let failedCount = 0;

testCases.forEach((testCase, index) => {
  console.log(`测试 ${index + 1}: ${testCase.name}`);
  console.log(`输入: ${testCase.input.substring(0, 80)}${testCase.input.length > 80 ? '...' : ''}`);
  
  const result = replaceClassInContent(testCase.input, testCase.oldClass, testCase.newClass);
  const passed = result === testCase.expected;
  
  if (passed) {
    console.log(`✅ 通过`);
    console.log(`输出: ${result.substring(0, 80)}${result.length > 80 ? '...' : ''}`);
    passedCount++;
  } else {
    console.log(`❌ 失败`);
    console.log(`期望: ${testCase.expected.substring(0, 80)}`);
    console.log(`实际: ${result.substring(0, 80)}`);
    failedCount++;
  }
  console.log('');
});

console.log('=== 测试结果 ===');
console.log(`通过: ${passedCount}/${testCases.length}`);
console.log(`失败: ${failedCount}/${testCases.length}`);

// 测试图片中的具体案例
console.log('\n=== 测试图片中的问题案例 ===\n');

const problemCases = [
  {
    input: 'let filterHeaderView = YNDCYSTSortCommodityHeaderView(frame: CGRect(origin: .zero, size: CGSize(width: self.view.width, height: 120.0.Scale)))',
    old: 'YNDCYSTSortCommodityHeaderView',
    new: 'JunZiLanSortCommodityHeaderView'
  },
  {
    input: 'let searchView = YNDCYSTSearchView(frame: CGRect(x: 0.0, y: 0.0, width: self.view.width, height: 44.0))',
    old: 'YNDCYSTSearchView',
    new: 'JunZiLanSearchView'
  },
  {
    input: 'let viewModel = YNDCYSTSortViewModel()',
    old: 'YNDCYSTSortViewModel',
    new: 'JunZiLanSortViewModel'
  }
];

problemCases.forEach((testCase, index) => {
  console.log(`案例 ${index + 1}:`);
  console.log(`输入: ${testCase.input}`);
  
  const result = replaceClassInContent(testCase.input, testCase.old, testCase.new);
  
  // 检查是否有重复前缀
  const hasDuplicate = /JunZiLanJunZiLan/.test(result);
  
  if (hasDuplicate) {
    console.log(`❌ 检测到重复前缀！`);
    console.log(`输出: ${result}`);
  } else {
    console.log(`✅ 正确替换`);
    console.log(`输出: ${result}`);
  }
  console.log('');
});

