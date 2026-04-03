#!/usr/bin/env node
const fs = require('fs-extra');
const path = require('path');
const iosProcessor = require('../core/ios-processor');
const androidProcessor = require('../core/android-processor');
const imageReplacer = require('../core/image-replacer');

function parseArgs(argv) {
  const args = {};
  for (let i = 2; i < argv.length; i++) {
    const token = argv[i];
    if (!token.startsWith('--')) continue;
    const key = token.slice(2);
    const next = argv[i + 1];
    if (!next || next.startsWith('--')) {
      args[key] = true;
      continue;
    }
    args[key] = next;
    i++;
  }
  return args;
}

function parseCsv(value) {
  if (!value) return [];
  return String(value).split(',').map((s) => s.trim()).filter(Boolean);
}

function isIgnored(name, ignored) {
  return ignored.includes(name);
}

async function getAllFiles(dirPath, options = {}, out = []) {
  const { includePods = false, ignoreDirNames = [] } = options;
  const entries = await fs.readdir(dirPath, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.name.startsWith('.') || entry.name === 'build' || entry.name === 'DerivedData' || entry.name === 'node_modules') {
      continue;
    }
    if (entry.name === 'Pods' && !includePods) {
      continue;
    }
    if (isIgnored(entry.name, ignoreDirNames)) {
      continue;
    }
    if (entry.isDirectory()) {
      await getAllFiles(fullPath, options, out);
    } else {
      out.push(fullPath);
    }
  }
  return out;
}

async function stripCommentsInFile(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (!['.swift', '.h', '.m', '.mm', '.kt', '.java'].includes(ext)) return;
  const content = await fs.readFile(filePath, 'utf8');
  const updated = content
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|[^:])\/\/.*$/gm, '$1');
  if (updated !== content) {
    await fs.writeFile(filePath, updated, 'utf8');
  }
}

async function run() {
  const args = parseArgs(process.argv);
  if (args.help || !args.platform || !args.target) {
    console.log(`Usage:
  node src/cli/index.js --platform ios|android --source <src> --target <dst> [options]

Common:
  --ignore-dirs "Pods,build,.git"
  --delete-comments
  --replace-images <folder>
  --image-auto-match
  --image-mappings "old.png:new.png,icon.png:new_icon.png"

iOS:
  --old-prefix ABC --new-prefix XYZ
  --rename-project-name OldApp:NewApp
  --handle-xcassets OLD:NEW
  --spam-code-out Spam:3

Android:
  --old-package com.old.app --new-package com.new.app
  --old-prefix ABC --new-prefix XYZ
  --spam-code-out Spam:3
`);
    process.exit(0);
  }

  const platform = args.platform;
  const sourcePath = args.source;
  const targetPath = args.target;
  const ignoreDirNames = parseCsv(args['ignore-dirs']);
  const includePods = !!args['include-pods'];
  const deleteComments = !!args['delete-comments'];

  if (sourcePath) {
    await fs.ensureDir(targetPath);
    const files = await getAllFiles(sourcePath, { includePods, ignoreDirNames });
    for (const filePath of files) {
      const relativePath = path.relative(sourcePath, filePath);
      const targetFilePath = path.join(targetPath, relativePath);
      await fs.ensureDir(path.dirname(targetFilePath));
      if (platform === 'ios' && filePath.endsWith('.swift')) {
        if (args['old-prefix'] && args['new-prefix']) {
          await iosProcessor.processSwiftFile(filePath, targetFilePath, args['old-prefix'], args['new-prefix']);
        } else {
          await fs.copy(filePath, targetFilePath);
        }
      } else if (platform === 'ios' && (filePath.endsWith('.h') || filePath.endsWith('.m') || filePath.endsWith('.mm'))) {
        if (args['old-prefix'] && args['new-prefix']) {
          await iosProcessor.processObjcFile(filePath, targetFilePath, args['old-prefix'], args['new-prefix']);
        } else {
          await fs.copy(filePath, targetFilePath);
        }
      } else if (platform === 'android' && (filePath.endsWith('.kt') || filePath.endsWith('.java'))) {
        if (args['old-package'] && args['new-package']) {
          await androidProcessor.processAndroidFile(
            filePath,
            targetFilePath,
            args['old-package'],
            args['new-package'],
            args['old-prefix'] || null,
            args['new-prefix'] || null
          );
        } else {
          await fs.copy(filePath, targetFilePath);
        }
      } else {
        await fs.copy(filePath, targetFilePath);
      }
      if (deleteComments && (filePath.endsWith('.swift') || filePath.endsWith('.h') || filePath.endsWith('.m') || filePath.endsWith('.mm') || filePath.endsWith('.kt') || filePath.endsWith('.java'))) {
        await stripCommentsInFile(targetFilePath);
      }
    }
  }

  if (platform === 'ios' && args['rename-project-name']) {
    const [oldName, newName] = String(args['rename-project-name']).split(':');
    if (oldName && newName && oldName !== newName) {
      const xcodeprojOld = path.join(targetPath, `${oldName}.xcodeproj`);
      const xcodeprojNew = path.join(targetPath, `${newName}.xcodeproj`);
      if (await fs.pathExists(xcodeprojOld) && !(await fs.pathExists(xcodeprojNew))) {
        await fs.rename(xcodeprojOld, xcodeprojNew);
      }
      const xcworkspaceOld = path.join(targetPath, `${oldName}.xcworkspace`);
      const xcworkspaceNew = path.join(targetPath, `${newName}.xcworkspace`);
      if (await fs.pathExists(xcworkspaceOld) && !(await fs.pathExists(xcworkspaceNew))) {
        await fs.rename(xcworkspaceOld, xcworkspaceNew);
      }
    }
  }

  if (platform === 'ios' && args['handle-xcassets']) {
    const [oldPrefix, newPrefix] = String(args['handle-xcassets']).split(':');
    if (oldPrefix && newPrefix) {
      const entries = await fs.readdir(targetPath, { withFileTypes: true });
      for (const entry of entries) {
        if (!entry.isDirectory() || !entry.name.endsWith('.xcassets')) continue;
        const assetsDir = path.join(targetPath, entry.name);
        const items = await fs.readdir(assetsDir, { withFileTypes: true });
        for (const item of items) {
          if (!item.isDirectory()) continue;
          if (!item.name.startsWith(oldPrefix)) continue;
          if (!(item.name.endsWith('.imageset') || item.name.endsWith('.appiconset'))) continue;
          const oldPath = path.join(assetsDir, item.name);
          const newPath = path.join(assetsDir, item.name.replace(new RegExp(`^${oldPrefix}`), newPrefix));
          if (!(await fs.pathExists(newPath))) {
            await fs.rename(oldPath, newPath);
          }
        }
      }
    }
  }

  if (args['replace-images']) {
    const mappings = [];
    const mappingTokens = parseCsv(args['image-mappings']);
    mappingTokens.forEach((token) => {
      const [oldName, newName] = token.split(':');
      if (oldName && newName) mappings.push({ oldName, newName });
    });
    const imageResults = await imageReplacer.replaceImages(
      targetPath,
      args['replace-images'],
      mappings,
      platform,
      {
        autoMatchByFileName: !!args['image-auto-match'] || mappings.length === 0,
        ignoreDirNames
      }
    );
    console.log(`Image replace: ${imageResults.success}/${imageResults.total}`);
  }

  if (args['spam-code-out']) {
    const [prefixRaw, countRaw] = String(args['spam-code-out']).split(':');
    const prefix = prefixRaw || 'Spam';
    const count = parseInt(countRaw || '3', 10) || 3;
    const outDir = path.join(targetPath, '__SpamCode');
    await fs.ensureDir(outDir);
    const files = await getAllFiles(targetPath, { includePods: false, ignoreDirNames: ['__SpamCode'] });
    const codeFiles = platform === 'ios'
      ? files.filter((f) => f.endsWith('.swift'))
      : files.filter((f) => f.endsWith('.kt') || f.endsWith('.java'));
    for (const codeFile of codeFiles) {
      const className = path.basename(codeFile, path.extname(codeFile));
      const outFile = platform === 'ios'
        ? path.join(outDir, `${className}+${prefix}Ext.swift`)
        : path.join(outDir, `${className}${prefix}Helper.java`);
      const lines = [];
      for (let i = 0; i < count; i++) {
        lines.push(platform === 'ios'
          ? `    func ${prefix}Method${i}() -> Int { return ${i} }`
          : `    public static int ${prefix}Method${i}() { return ${i}; }`);
      }
      const content = platform === 'ios'
        ? `import Foundation\n\nextension ${className} {\n${lines.join('\n')}\n}\n`
        : `public class ${className}${prefix}Helper {\n${lines.join('\n')}\n}\n`;
      await fs.writeFile(outFile, content, 'utf8');
    }
  }

  console.log('Done.');
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
