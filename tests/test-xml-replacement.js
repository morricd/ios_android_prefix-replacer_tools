#!/usr/bin/env node

/**
 * Android XML 包名替换测试脚本
 * 用于测试各种 XML 格式的包名替换
 */

const testCases = [
  {
    name: '测试 1: DataBinding variable type',
    input: `<variable
        name="data"
        type="com.yndcyst.shop.feature.gift.GiftGroupItem" />`,
    expected: `<variable
        name="data"
        type="com.sss.shop.feature.gift.GiftGroupItem" />`
  },
  {
    name: '测试 2: 紧凑格式的 type',
    input: `<variable name="handler" type="com.yndcyst.shop.Handler" />`,
    expected: `<variable name="handler" type="com.sss.shop.Handler" />`
  },
  {
    name: '测试 3: 自定义 View 开始标签',
    input: `<com.yndcyst.shop.widget.CustomView
    android:layout_width="match_parent"
    android:layout_height="wrap_content" />`,
    expected: `<com.sss.shop.widget.CustomView
    android:layout_width="match_parent"
    android:layout_height="wrap_content" />`
  },
  {
    name: '测试 4: Fragment name',
    input: `<fragment
    android:id="@+id/fragment"
    android:name="com.yndcyst.shop.ui.HomeFragment" />`,
    expected: `<fragment
    android:id="@+id/fragment"
    android:name="com.sss.shop.ui.HomeFragment" />`
  },
  {
    name: '测试 5: AndroidManifest package',
    input: `<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="com.yndcyst.shop">`,
    expected: `<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="com.sss.shop">`
  },
  {
    name: '测试 6: 自定义 View 闭合标签 ⭐',
    input: `</com.yndcyst.shop.viewpage.AnimationNestedScrollView>`,
    expected: `</com.sss.shop.viewpage.AnimationNestedScrollView>`
  },
  {
    name: '测试 7: 完整的自定义 View（开始和闭合）⭐',
    input: `<com.yndcyst.shop.widget.CustomView>
    <TextView />
</com.yndcyst.shop.widget.CustomView>`,
    expected: `<com.sss.shop.widget.CustomView>
    <TextView />
</com.sss.shop.widget.CustomView>`
  },
  {
    name: '测试 8: 嵌套的自定义 View ⭐',
    input: `<com.yndcyst.shop.view.Container>
    <com.yndcyst.shop.widget.Inner />
</com.yndcyst.shop.view.Container>`,
    expected: `<com.sss.shop.view.Container>
    <com.sss.shop.widget.Inner />
</com.sss.shop.view.Container>`
  }
];

function testReplacement(input, oldPackage, newPackage) {
  const escapedOldPackage = oldPackage.replace(/\./g, '\\.');
  
  let result = input;
  
  // 1. 自定义 View 开始标签
  const customViewOpenPattern = new RegExp(`<${escapedOldPackage}`, 'g');
  result = result.replace(customViewOpenPattern, `<${newPackage}`);
  
  // 2. 自定义 View 闭合标签 ⭐
  const customViewClosePattern = new RegExp(`</${escapedOldPackage}`, 'g');
  result = result.replace(customViewClosePattern, `</${newPackage}`);
  
  // 3. type 属性
  const typePattern = new RegExp(`type=\\s*"\\s*${escapedOldPackage}`, 'g');
  result = result.replace(typePattern, `type="${newPackage}`);
  
  // 4. class 属性
  const classPattern = new RegExp(`class=\\s*"\\s*${escapedOldPackage}`, 'g');
  result = result.replace(classPattern, `class="${newPackage}`);
  
  // 5. android:name 属性
  const namePattern = new RegExp(`android:name=\\s*"\\s*${escapedOldPackage}`, 'g');
  result = result.replace(namePattern, `android:name="${newPackage}`);
  
  // 6. package 属性
  const packagePattern = new RegExp(`package=\\s*"\\s*${escapedOldPackage}\\s*"`, 'g');
  result = result.replace(packagePattern, `package="${newPackage}"`);
  
  // 7. 通用模式
  const genericPattern = new RegExp(`=\\s*"\\s*${escapedOldPackage}\\.`, 'g');
  result = result.replace(genericPattern, `="${newPackage}.`);
  
  return result;
}

console.log('='.repeat(70));
console.log('Android XML 包名替换测试');
console.log('='.repeat(70));
console.log('');

const oldPackage = 'com.yndcyst.shop';
const newPackage = 'com.sss.shop';

let passedTests = 0;
let failedTests = 0;

testCases.forEach((testCase, index) => {
  console.log(`测试 ${index + 1}: ${testCase.name}`);
  console.log('-'.repeat(70));
  
  const result = testReplacement(testCase.input, oldPackage, newPackage);
  const passed = result === testCase.expected;
  
  console.log('输入:');
  console.log(testCase.input);
  console.log('');
  console.log('预期输出:');
  console.log(testCase.expected);
  console.log('');
  console.log('实际输出:');
  console.log(result);
  console.log('');
  
  if (passed) {
    console.log('✅ 通过');
    passedTests++;
  } else {
    console.log('❌ 失败');
    failedTests++;
  }
  
  console.log('='.repeat(70));
  console.log('');
});

console.log('测试结果汇总:');
console.log(`通过: ${passedTests}/${testCases.length}`);
console.log(`失败: ${failedTests}/${testCases.length}`);
console.log('');

if (failedTests === 0) {
  console.log('🎉 所有测试通过！');
  process.exit(0);
} else {
  console.log('⚠️  有测试失败，请检查代码');
  process.exit(1);
}
