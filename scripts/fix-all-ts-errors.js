#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔧 Running comprehensive TypeScript logger fix...\n');

// Run TypeScript check to get all errors
try {
  execSync('NODE_OPTIONS="--max-old-space-size=8192" npx tsc --noEmit > /tmp/ts-errors-comprehensive.log 2>&1');
} catch (e) {
  // Expected to fail if there are errors
}

const errorLog = fs.readFileSync('/tmp/ts-errors-comprehensive.log', 'utf8');
const errorLines = errorLog.split('\n').filter(line => line.includes('error TS'));

// Group errors by file
const fileErrors = {};
errorLines.forEach(line => {
  const match = line.match(/^(.+?)\((\d+),(\d+)\): error (TS\d+): (.+)/);
  if (match) {
    const [, filePath, lineNum, colNum, errorCode, errorMsg] = match;
    if (!fileErrors[filePath]) {
      fileErrors[filePath] = [];
    }
    fileErrors[filePath].push({
      line: parseInt(lineNum),
      col: parseInt(colNum),
      code: errorCode,
      message: errorMsg
    });
  }
});

console.log(`Found errors in ${Object.keys(fileErrors).length} files\n`);

let totalFixed = 0;

// Fix each file
Object.keys(fileErrors).forEach(filePath => {
  const fullPath = path.resolve(process.cwd(), filePath);

  if (!fs.existsSync(fullPath)) {
    console.log(`  ⚠️  File not found: ${filePath}`);
    return;
  }

  let lines = fs.readFileSync(fullPath, 'utf8').split('\n');
  let modified = false;
  const errors = fileErrors[filePath].sort((a, b) => b.line - a.line); // Process from bottom to top

  errors.forEach(({ line, message }) => {
    const lineIndex = line - 1;
    if (lineIndex < 0 || lineIndex >= lines.length) return;

    const originalLine = lines[lineIndex];

    // Pattern 1: Too many arguments (3-4 args) - combine into single message with metadata
    if (message.includes('Expected 1-2 arguments, but got')) {
      const match = originalLine.match(/log\.(error|warn|info|debug|http)\(([^)]+)\)/);
      if (match) {
        const [fullMatch, level, argsStr] = match;
        const args = argsStr.split(',').map(s => s.trim());

        if (args.length > 2) {
          // First arg is message, rest are metadata
          const msg = args[0];
          const metadata = args.slice(1);

          // Try to create meaningful metadata object
          let metaObj = '{';
          metadata.forEach((meta, idx) => {
            if (meta.startsWith("'") || meta.startsWith('"') || meta.startsWith('`')) {
              metaObj += ` detail${idx + 1}: ${meta},`;
            } else {
              metaObj += ` ${meta},`;
            }
          });
          metaObj = metaObj.slice(0, -1) + ' }'; // Remove trailing comma

          const indent = originalLine.match(/^(\s*)/)[1];
          lines[lineIndex] = `${indent}log.${level}(${msg}, ${metaObj});`;
          modified = true;
        }
      }
    }

    // Pattern 2: String/unknown/number types need wrapping
    if (message.includes('is not assignable to parameter of type')) {
      const match = originalLine.match(/log\.(error|warn|info|debug|http)\(([^,)]+),\s*([^)]+)\)/);
      if (match) {
        const [fullMatch, level, msg, arg] = match;
        const trimmedArg = arg.trim();

        // Don't wrap if already an object literal
        if (!trimmedArg.startsWith('{')) {
          let wrappedArg;
          if (trimmedArg.match(/^(error|err|e|.*Error)$/i)) {
            wrappedArg = `{ error: ${trimmedArg} }`;
          } else if (trimmedArg.match(/^\d+$/)) {
            wrappedArg = `{ value: ${trimmedArg} }`;
          } else {
            wrappedArg = `{ details: ${trimmedArg} }`;
          }

          const indent = originalLine.match(/^(\s*)/)[1];
          lines[lineIndex] = `${indent}log.${level}(${msg}, ${wrappedArg});`;
          modified = true;
        }
      }
    }
  });

  if (modified) {
    fs.writeFileSync(fullPath, lines.join('\n'), 'utf8');
    console.log(`  ✅ Fixed: ${filePath}`);
    totalFixed++;
  }
});

console.log(`\n✅ Fixed ${totalFixed} files`);
console.log('⚠️  Re-running TypeScript check to verify...\n');

// Re-run check
try {
  execSync('NODE_OPTIONS="--max-old-space-size=8192" npx tsc --noEmit', { stdio: 'inherit' });
  console.log('\n🎉 All TypeScript errors fixed!');
} catch (e) {
  console.log('\n⚠️  Some errors remain - manual review needed');
  process.exit(1);
}
