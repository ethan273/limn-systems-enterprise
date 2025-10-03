#!/usr/bin/env tsx
/**
 * Comprehensive Dashboard Color Fix Script
 * Replaces ALL hardcoded colors with CSS variables
 */

import * as fs from 'fs';
import * as path from 'path';

const PROJECT_ROOT = '/Users/eko3/limn-systems-enterprise';

// Color mapping: hardcoded → CSS variable
const colorReplacements: Record<string, string> = {
  // Text colors
  'text-white': 'text-foreground',
  'text-gray-50': 'text-foreground',
  'text-gray-100': 'text-foreground',
  'text-gray-200': 'text-muted-foreground',
  'text-gray-300': 'text-muted-foreground',
  'text-gray-400': 'text-muted-foreground',
  'text-gray-500': 'text-muted-foreground',
  'text-gray-600': 'text-foreground',
  'text-gray-700': 'text-foreground',
  'text-gray-800': 'text-foreground',
  'text-gray-900': 'text-foreground',
  'text-slate-400': 'text-muted-foreground',
  'text-slate-500': 'text-muted-foreground',
  'text-slate-600': 'text-foreground',

  // Background colors
  'bg-white': 'bg-card',
  'bg-gray-50': 'bg-background',
  'bg-gray-100': 'bg-secondary',
  'bg-gray-200': 'bg-secondary',
  'bg-gray-700': 'bg-muted',
  'bg-gray-800': 'bg-card',
  'bg-gray-900': 'bg-background',
  'bg-slate-50': 'bg-background',
  'bg-slate-100': 'bg-secondary',

  // Border colors
  'border-gray-200': 'border-border',
  'border-gray-300': 'border-border',
  'border-gray-700': 'border-border',
  'border-gray-800': 'border-border',
  'border-slate-200': 'border-border',
};

function replaceColorsInFile(filePath: string): number {
  let content = fs.readFileSync(filePath, 'utf8');
  let replacements = 0;

  // Replace each hardcoded color with CSS variable
  for (const [hardcoded, variable] of Object.entries(colorReplacements)) {
    const regex = new RegExp(`\\b${hardcoded}\\b`, 'g');
    const matches = content.match(regex);
    if (matches) {
      replacements += matches.length;
      content = content.replace(regex, variable);
    }
  }

  if (replacements > 0) {
    // Create backup
    const backupContent = fs.readFileSync(filePath, 'utf8');
    fs.writeFileSync(`${filePath}.color-backup`, backupContent, 'utf8');

    // Write updated content
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✓ Fixed ${replacements} colors in: ${path.relative(PROJECT_ROOT, filePath)}`);
  }

  return replacements;
}

function findAndFixFiles(dir: string, pattern: RegExp): number {
  let totalReplacements = 0;
  const files = fs.readdirSync(dir);

  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
      totalReplacements += findAndFixFiles(fullPath, pattern);
    } else if (stat.isFile() && pattern.test(file)) {
      totalReplacements += replaceColorsInFile(fullPath);
    }
  }

  return totalReplacements;
}

// Main execution
console.log('🔧 Starting comprehensive color fix...\n');

const srcDir = path.join(PROJECT_ROOT, 'src');
const totalReplacements = findAndFixFiles(srcDir, /\.(tsx|ts|jsx|js)$/);

console.log(`\n✅ Complete! Fixed ${totalReplacements} hardcoded colors across all files.`);
console.log('\n📋 Next steps:');
console.log('  1. npm run lint');
console.log('  2. npm run type-check');
console.log('  3. npm run build');
console.log('  4. Test dark mode in browser');
