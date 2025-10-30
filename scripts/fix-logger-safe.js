#!/usr/bin/env node
/**
 * Safely fix Pino logger call signatures - CONSERVATIVE approach
 * Only fixes the most common and safe patterns
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔍 Finding files with logger signature errors...\n');

// Get list of files with TypeScript errors
let errorOutput;
try {
  execSync('NODE_OPTIONS="--max-old-space-size=8192" npx tsc --noEmit 2>&1', {
    encoding: 'utf-8',
    env: { ...process.env, NODE_OPTIONS: '--max-old-space-size=8192' },
  });
  console.log('✅ No TypeScript errors found!');
  process.exit(0);
} catch (error) {
  errorOutput = error.stdout || error.stderr || '';
}

// Extract unique file paths
const errorLines = errorOutput.split('\n').filter((line) => line.startsWith('src/'));
const files = [...new Set(errorLines.map((line) => line.split('(')[0]))].filter(Boolean).sort();

if (files.length === 0) {
  console.log('✅ No files with errors found!');
  process.exit(0);
}

console.log(`📊 Found ${files.length} files with errors`);
console.log('🔧 Applying safe fixes...\n');

let fixedCount = 0;

files.forEach((file, index) => {
  const filePath = path.join(process.cwd(), file);

  if (!fs.existsSync(filePath)) {
    return;
  }

  console.log(`[${index + 1}/${files.length}] Processing: ${file}`);

  let content = fs.readFileSync(filePath, 'utf-8');
  const original = content;
  let changes = 0;

  // SAFE Pattern 1: log.level('message', simpleIdentifier)
  // Match: log.error('text', error) or log.info('msg', userId)
  // Only if second arg is a simple identifier (no dots, brackets, etc.)
  const pattern1 = /\blog\.(error|warn|info|debug)\(([^,)]+),\s*([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\)/g;

  content = content.replace(pattern1, (match, level, message, variable) => {
    // Skip if variable name looks like it's already metadata
    if (variable === 'metadata' || variable === 'meta' || variable === 'data' || variable === 'obj') {
      return match;
    }

    // Skip if the message arg contains complex expressions
    if (message.includes('{') || message.includes('[') || message.includes('(')) {
      return match;
    }

    changes++;
    return `log.${level}(${message}, { ${variable} })`;
  });

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log(`  ✅ Applied ${changes} fixes\n`);
    fixedCount++;
  } else {
    console.log('  ⏭️  No safe fixes applicable\n');
  }
});

console.log(`✅ Safe fixes complete! Fixed ${fixedCount} files\n`);

// Re-run TypeScript check
console.log('⚠️  Running TypeScript check to see progress...\n');

try {
  execSync('NODE_OPTIONS="--max-old-space-size=8192" npx tsc --noEmit 2>&1', {
    encoding: 'utf-8',
    stdio: 'inherit',
    env: { ...process.env, NODE_OPTIONS: '--max-old-space-size=8192' },
  });
  console.log('\n✅ All logger signature errors fixed!');
  process.exit(0);
} catch (error) {
  const output = error.stdout || error.stderr || '';
  const remainingLines = output.split('\n').filter((line) => line.startsWith('src/'));
  const remainingErrors = remainingLines.length;

  console.log(`\n📊 Remaining TypeScript errors: ${remainingErrors}`);

  if (remainingErrors > 0) {
    console.log('\n⚠️  Some errors remain - these need manual review');
    console.log('Saving to /tmp/remaining-logger-errors.log\n');

    fs.writeFileSync('/tmp/remaining-logger-errors.log', output, 'utf-8');

    // Show sample of remaining errors
    console.log('Sample of remaining errors:');
    remainingLines.slice(0, 10).forEach(line => {
      console.log('  ', line);
    });

    if (remainingErrors > 10) {
      console.log(`  ... and ${remainingErrors - 10} more`);
    }

    process.exit(1);
  }

  process.exit(0);
}
