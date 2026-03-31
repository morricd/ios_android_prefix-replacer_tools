const assert = require('assert');
const fs = require('fs-extra');
const os = require('os');
const path = require('path');
const { processAndroidFile } = require('../src/core/android-processor');

async function run() {
  const oldPackage = 'com.yndcyst.shop';
  const newPackage = 'com.sss.shop';
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'android-boundary-'));

  const sourceFile = path.join(tempDir, 'Source.java');
  const targetFile = path.join(tempDir, 'Target.java');

  const sourceContent = `
package com.yndcyst.shopping.feature;

import com.yndcyst.shop.feature.MainActivity;
import com.yndcyst.shopping.feature.OtherActivity;

public class Target {
    private String exact = "com.yndcyst.shop.feature.MainActivity";
    private String longer = "com.yndcyst.shopping.feature.OtherActivity";
}
`;

  await fs.writeFile(sourceFile, sourceContent, 'utf8');
  await processAndroidFile(sourceFile, targetFile, oldPackage, newPackage, null, null);

  const output = await fs.readFile(targetFile, 'utf8');

  assert.ok(
    output.includes('import com.sss.shop.feature.MainActivity;'),
    'should replace exact old package import'
  );
  assert.ok(
    output.includes('import com.yndcyst.shopping.feature.OtherActivity;'),
    'should not replace longer package with shared prefix'
  );
  assert.ok(
    output.includes('"com.sss.shop.feature.MainActivity"'),
    'should replace exact package in full class name'
  );
  assert.ok(
    output.includes('"com.yndcyst.shopping.feature.OtherActivity"'),
    'should not replace longer package in string'
  );
  assert.ok(
    output.includes('package com.yndcyst.shopping.feature;'),
    'should not replace non-exact package declaration'
  );

  await fs.remove(tempDir);
  console.log('Android package boundary regression tests passed.');
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
