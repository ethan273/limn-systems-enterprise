/**
 * Phase 4: Update Customer → Client UI Terminology
 *
 * This script safely updates UI-visible "Customer" text to "Client" while preserving:
 * - Variable names (customer_id, customerId, customerData)
 * - Type names (Customer, CustomerInput)
 * - Function names (getCustomer, createCustomer)
 * - Comments and code logic
 *
 * Only changes user-facing text in JSX/TSX files.
 */

import fs from 'fs';
import path from 'path';
import { glob } from 'glob';

interface ReplaceRule {
  pattern: RegExp;
  replacement: string;
  description: string;
}

// Define safe replacement rules for UI text only
const REPLACEMENT_RULES: ReplaceRule[] = [
  // JSX text nodes
  { pattern: />Customers</g, replacement: '>Clients<', description: 'JSX text nodes' },
  { pattern: />Customer</g, replacement: '>Client<', description: 'JSX text nodes' },

  // String literals in JSX attributes (title, placeholder, etc.)
  { pattern: /"Customers"/g, replacement: '"Clients"', description: 'String literals' },
  { pattern: /"Customer "/g, replacement: '"Client "', description: 'String literals with space' },
  { pattern: /"Customer"/g, replacement: '"Client"', description: 'String literals' },
  { pattern: /'Customers'/g, replacement: "'Clients'", description: 'Single quote literals' },
  { pattern: /'Customer '/g, replacement: "'Client '", description: 'Single quote literals with space' },
  { pattern: /'Customer'/g, replacement: "'Client'", description: 'Single quote literals' },

  // Template literals
  { pattern: /`Customers`/g, replacement: '`Clients`', description: 'Template literals' },
  { pattern: /`Customer `/g, replacement: '`Client `', description: 'Template literals with space' },
  { pattern: /`Customer`/g, replacement: '`Client`', description: 'Template literals' },

  // Common UI patterns
  { pattern: /placeholder="Search customers/g, replacement: 'placeholder="Search clients', description: 'Search placeholders' },
  { pattern: /placeholder='Search customers/g, replacement: "placeholder='Search clients", description: 'Search placeholders' },
  { pattern: /title="Customer /g, replacement: 'title="Client ', description: 'Title attributes' },
  { pattern: /title='Customer /g, replacement: "title='Client ", description: 'Title attributes' },
  { pattern: /aria-label="Customer /g, replacement: 'aria-label="Client ', description: 'ARIA labels' },
  { pattern: /aria-label='Customer /g, replacement: "aria-label='Client ", description: 'ARIA labels' },
];

// Files/patterns to exclude
const EXCLUDE_PATTERNS = [
  '**/node_modules/**',
  '**/.next/**',
  '**/dist/**',
  '**/build/**',
];

async function findFiles(baseDir: string): Promise<string[]> {
  const patterns = [
    `${baseDir}/**/*.tsx`,
    `${baseDir}/**/*.ts`,
  ];

  const allFiles: string[] = [];

  for (const pattern of patterns) {
    const files = await glob(pattern, {
      ignore: EXCLUDE_PATTERNS,
      absolute: true,
    });
    allFiles.push(...files);
  }

  // Deduplicate
  return [...new Set(allFiles)];
}

function applyReplacements(content: string): { modified: string; changeCount: number } {
  let modified = content;
  let changeCount = 0;

  for (const rule of REPLACEMENT_RULES) {
    const matches = modified.match(rule.pattern);
    if (matches) {
      changeCount += matches.length;
      modified = modified.replace(rule.pattern, rule.replacement);
    }
  }

  return { modified, changeCount };
}

async function processFile(filePath: string): Promise<{ changed: boolean; changeCount: number }> {
  const content = fs.readFileSync(filePath, 'utf-8');
  const { modified, changeCount } = applyReplacements(content);

  if (content !== modified) {
    fs.writeFileSync(filePath, modified, 'utf-8');
    return { changed: true, changeCount };
  }

  return { changed: false, changeCount: 0 };
}

async function main() {
  console.log('🔄 Phase 4: Updating Customer → Client UI Terminology\n');

  // Process src/app directory
  console.log('📂 Finding files in src/app...');
  const appFiles = await findFiles('src/app');
  console.log(`   Found ${appFiles.length} files\n`);

  // Process src/components directory
  console.log('📂 Finding files in src/components...');
  const componentFiles = await findFiles('src/components');
  console.log(`   Found ${componentFiles.length} files\n`);

  const allFiles = [...appFiles, ...componentFiles];

  console.log(`📝 Processing ${allFiles.length} total files...\n`);

  let filesChanged = 0;
  let totalChanges = 0;
  const changedFiles: Array<{ path: string; changes: number }> = [];

  for (const file of allFiles) {
    const result = await processFile(file);

    if (result.changed) {
      filesChanged++;
      totalChanges += result.changeCount;
      const relativePath = path.relative(process.cwd(), file);
      changedFiles.push({ path: relativePath, changes: result.changeCount });
      console.log(`   ✅ ${relativePath} (${result.changeCount} changes)`);
    }
  }

  console.log(`\n✨ Complete!`);
  console.log(`   Files changed: ${filesChanged}/${allFiles.length}`);
  console.log(`   Total replacements: ${totalChanges}`);

  if (changedFiles.length > 0) {
    console.log('\n📋 Changed files:');
    for (const { path: filePath, changes } of changedFiles) {
      console.log(`   - ${filePath} (${changes})`);
    }
  }

  console.log('\n⚠️  Next steps:');
  console.log('   1. Review changes with: git diff');
  console.log('   2. Test UI manually');
  console.log('   3. Run: npm run build');
  console.log('   4. Run: npm run type-check');
}

main().catch((error) => {
  console.error('❌ Error:', error);
  process.exit(1);
});
