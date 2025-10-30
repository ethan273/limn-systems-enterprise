#!/usr/bin/env node

/**
 * Fix remaining TypeScript logger errors
 * Handles complex patterns that regex couldn't catch
 */

const fs = require('fs');
const path = require('path');

// Read the error log
const errorLogPath = '/tmp/typescript-check-final.log';
const errorLog = fs.readFileSync(errorLogPath, 'utf8');

// Extract unique file paths with errors
const fileErrors = new Map();
const errorLines = errorLog.split('\n').filter(line => line.includes('error TS'));

errorLines.forEach(line => {
  const match = line.match(/^(.+?)\((\d+),/);
  if (match) {
    const [, filePath, lineNum] = match;
    if (!fileErrors.has(filePath)) {
      fileErrors.set(filePath, []);
    }
    fileErrors.set(filePath, [...fileErrors.get(filePath), parseInt(lineNum)]);
  }
});

console.log(`🔧 Fixing ${fileErrors.size} files with remaining logger errors...`);

let fixedCount = 0;

fileErrors.forEach((errorLineNumbers, filePath) => {
  const fullPath = path.resolve(process.cwd(), filePath);

  if (!fs.existsSync(fullPath)) {
    console.log(`  ⚠️  File not found: ${filePath}`);
    return;
  }

  let content = fs.readFileSync(fullPath, 'utf8');
  let modified = false;

  // Pattern 1: log.X('message', stringVariable) where stringVariable is a string
  // Need context-aware replacement
  const stringVarPattern = /log\.(error|warn|info|debug|http)\(([^,)]+),\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*\)/g;
  const newContent1 = content.replace(stringVarPattern, (match, level, msg, varName) => {
    // Skip if varName looks like it's already an object (contains 'error', 'err', 'e')
    if (/^(error|err|e)$/i.test(varName)) {
      return match;
    }
    modified = true;
    return `log.${level}(${msg}, { details: ${varName} })`;
  });

  if (newContent1 !== content) {
    content = newContent1;
    modified = true;
  }

  // Pattern 2: log.X('message', auditError) -> log.X('message', { error: auditError })
  content = content.replace(/log\.(error|warn|info|debug)\(([^,]+),\s*auditError\s*\)/g, (match, level, msg) => {
    modified = true;
    return `log.${level}(${msg}, { error: auditError })`;
  });

  // Pattern 3: log.X('msg', 'string', 'string2', ...) -> combine into single message
  const multiArgPattern = /log\.(error|warn|info|debug|http)\(([^,)]+)(?:,\s*([^,)]+))+\)/g;
  content = content.replace(multiArgPattern, (match, level, ...args) => {
    // Filter out undefined args
    const realArgs = args.filter(arg => arg && arg.trim());

    if (realArgs.length === 1) {
      // Single arg after message - wrap in { details }
      const arg = realArgs[0].trim();
      modified = true;
      return `log.${level}(${args[0]}, { details: ${arg} })`;
    } else if (realArgs.length > 1) {
      // Multiple args - combine into single message
      modified = true;
      const combinedMsg = realArgs.join(' + " " + ');
      return `log.${level}(${combinedMsg})`;
    }
    return match;
  });

  // Pattern 4: log.X('message', number) -> log.X('message', { value: number })
  content = content.replace(/log\.(error|warn|info|debug)\(([^,]+),\s*(\d+)\s*\)/g, (match, level, msg, num) => {
    modified = true;
    return `log.${level}(${msg}, { value: ${num} })`;
  });

  // Pattern 5: log.X('message', undefined | string) -> log.X('message', { details: value })
  content = content.replace(/log\.(error|warn|info|debug)\(([^,]+),\s*([a-zA-Z_][a-zA-Z0-9_?.]*)\s*\)/g, (match, level, msg, varName) => {
    // Skip if already wrapped or looks like error variable
    if (/^(error|err|e|\{)/.test(varName)) {
      return match;
    }
    modified = true;
    return `log.${level}(${msg}, { details: ${varName} })`;
  });

  if (modified) {
    fs.writeFileSync(fullPath, content, 'utf8');
    console.log(`  ✅ Fixed: ${filePath}`);
    fixedCount++;
  }
});

console.log(`\n✅ Fixed ${fixedCount} files`);
console.log(`⚠️  Run TypeScript check again to verify all errors are resolved`);
