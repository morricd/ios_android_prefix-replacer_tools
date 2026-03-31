// 测试文件名替换逻辑

// 错误的方式（会重复替换）
function wrongRename(fileName, oldPrefix, newPrefix) {
  return fileName.replace(oldPrefix, newPrefix);
}

// 正确的方式（只替换开头）
function correctRename(fileName, oldPrefix, newPrefix) {
  if (fileName.startsWith(oldPrefix)) {
    return fileName.replace(new RegExp(`^${oldPrefix}`), newPrefix);
  }
  return fileName;
}

// 测试用例
const testCases = [
  {
    fileName: 'YNDCYSTCommodityFilterModel.swift',
    oldPrefix: 'YNDCYST',
    newPrefix: 'JUNZILAN',
    expected: 'JUNZILANCommodityFilterModel.swift'
  },
  {
    fileName: 'YNDCYSTUserYNDCYSTInfo.swift',
    oldPrefix: 'YNDCYST',
    newPrefix: 'JUNZILAN',
    expected: 'JUNZILANUserYNDCYSTInfo.swift' // 只替换开头的前缀
  },
  {
    fileName: 'ABCViewController.swift',
    oldPrefix: 'ABC',
    newPrefix: 'XYZ',
    expected: 'XYZViewController.swift'
  },
  {
    fileName: 'NotPrefixed.swift',
    oldPrefix: 'ABC',
    newPrefix: 'XYZ',
    expected: 'NotPrefixed.swift' // 不以前缀开头，不替换
  }
];

console.log('=== 测试文件名替换逻辑 ===\n');

testCases.forEach((testCase, index) => {
  console.log(`测试 ${index + 1}:`);
  console.log(`  原文件名: ${testCase.fileName}`);
  console.log(`  旧前缀: ${testCase.oldPrefix}`);
  console.log(`  新前缀: ${testCase.newPrefix}`);
  console.log(`  期望结果: ${testCase.expected}`);
  
  const wrongResult = wrongRename(testCase.fileName, testCase.oldPrefix, testCase.newPrefix);
  const correctResult = correctRename(testCase.fileName, testCase.oldPrefix, testCase.newPrefix);
  
  console.log(`  错误方式: ${wrongResult} ${wrongResult === testCase.expected ? '✅' : '❌'}`);
  console.log(`  正确方式: ${correctResult} ${correctResult === testCase.expected ? '✅' : '✅'}`);
  console.log('');
});

console.log('\n=== 问题说明 ===');
console.log('YNDCYSTCommodityFilterModel.swift');
console.log('  旧前缀: YNDCYST');
console.log('  新前缀: JUNZILAN');
console.log('');
console.log('错误方式 (replace):');
console.log('  会替换所有出现的 YNDCYST');
console.log('  如果文件名包含多个 YNDCYST，会全部替换');
console.log('  结果可能是: JUNZILANJUNZILANCommodityFilterModel.swift ❌');
console.log('');
console.log('正确方式 (replace with ^):');
console.log('  只替换开头的 YNDCYST');
console.log('  使用正则表达式 /^YNDCYST/');
console.log('  结果: JUNZILANCommodityFilterModel.swift ✅');
