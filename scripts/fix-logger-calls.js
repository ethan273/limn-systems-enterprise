#!/usr/bin/env node
/**
 * Fix Pino logger call signatures to match proper format:
 * log.level(message: string, meta?: Record<string, any>)
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
console.log('🔧 Fixing logger signatures...\n');

let fixedCount = 0;

files.forEach((file, index) => {
  const filePath = path.join(process.cwd(), file);

  if (!fs.existsSync(filePath)) {
    return;
  }

  console.log(`[${index + 1}/${files.length}] Processing: ${file}`);

  let content = fs.readFileSync(filePath, 'utf-8');
  const original = content;

  // Fix Pattern 1: log.level('message', simpleVariable)
  // Where simpleVariable is a simple identifier (not already an object)
  content = content.replace(
    /log\.(error|warn|info|debug)\(([^,]+),\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\)/g,
    (match, level, message, variable) => {
      // Skip if variable name suggests it's already metadata
      if (variable === 'metadata' || variable === 'meta' || variable === 'data') {
        return match;
      }
      return `log.${level}(${message}, { ${variable} })`;
    }
  );

  // Fix Pattern 2: log.level('message', 'string literal')
  // Combine the message and literal
  content = content.replace(
    /log\.(error|warn|info|debug)\((['"`])([^'"`]+)\2,\s*(['"`])([^'"`]+)\4\s*\)/g,
    (match, level, quote1, msg, quote2, literal) => {
      return `log.${level}(${quote1}${msg} ${literal}${quote1})`;
    }
  );

  // Fix Pattern 3: log.level('message', variable1, variable2, ...)
  // Multiple arguments that need to be wrapped
  content = content.replace(
    /log\.(error|warn|info|debug)\(([^,]+),\s+([^)]+)\)/g,
    (match, level, message, restArgs) => {
      // Check if restArgs already looks like an object literal
      const trimmedRest = restArgs.trim();

      // If it's already an object literal, skip
      if (trimmedRest.startsWith('{') && trimmedRest.endsWith('}')) {
        return match;
      }

      // If it contains only one simple variable and we already processed it, skip
      if (/^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(trimmedRest)) {
        // Already handled by Pattern 1
        return match;
      }

      // Split by commas (simple split - won't handle nested calls perfectly but good enough)
      const args = restArgs.split(',').map((a) => a.trim());

      // If only one arg and it's a string literal, skip (Pattern 2 handles it)
      if (args.length === 1 && /^['"`]/.test(args[0])) {
        return match;
      }

      // Build metadata object
      const metadataEntries = args.map((arg) => {
        // If it's a simple variable, use shorthand
        if (/^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(arg)) {
          return arg;
        }
        // For complex expressions, we'll need a key
        // Try to extract a meaningful name
        const varMatch = arg.match(/([a-zA-Z_$][a-zA-Z0-9_$]*)/);
        if (varMatch) {
          return `${varMatch[1]}: ${arg}`;
        }
        return `value: ${arg}`;
      });

      return `log.${level}(${message}, { ${metadataEntries.join(', ')} })`;
    }
  );

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log('  ✅ Fixed\n');
    fixedCount++;
  } else {
    console.log('  ⏭️  No changes\n');
  }
});

console.log(`✅ Processing complete! Fixed ${fixedCount} files\n`);

// Re-run TypeScript check
console.log('⚠️  Running TypeScript check to verify fixes...\n');

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
  const remainingErrors = output.split('\n').filter((line) => line.startsWith('src/')).length;

  console.log(`\n📊 Remaining TypeScript errors: ${remainingErrors}`);

  if (remainingErrors > 0) {
    console.log('⚠️  Some errors remain - saving to /tmp/remaining-logger-errors.log');
    fs.writeFileSync('/tmp/remaining-logger-errors.log', output, 'utf-8');
    process.exit(1);
  }

  process.exit(0);
}
