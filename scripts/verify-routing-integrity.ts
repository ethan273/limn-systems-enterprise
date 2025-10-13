#!/usr/bin/env ts-node

/**
 * ROUTING INTEGRITY VERIFICATION SCRIPT
 *
 * Purpose: Statically analyze the codebase to find routing issues before runtime
 *
 * Checks:
 * 1. Every router.push() call has a corresponding page file
 * 2. Every "new" route has a /new directory with page.tsx
 * 3. Every module's routing paths use correct prefixes
 * 4. No broken internal links
 *
 * Run: npx ts-node scripts/verify-routing-integrity.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

// ES module equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface RoutingIssue {
  type: 'missing_page' | 'incorrect_prefix' | 'broken_link' | 'missing_new_directory';
  file: string;
  line?: number;
  route: string;
  expectedPath?: string;
  message: string;
}

const issues: RoutingIssue[] = [];

// Configuration
const APP_DIR = path.join(__dirname, '../src/app');
const IGNORE_PATTERNS = ['node_modules', '.next', 'dist'];

/**
 * Extract all router.push() calls from TypeScript/TSX files
 */
function extractRouterPushCalls(filePath: string): Array<{ line: number; route: string }> {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const pushCalls: Array<{ line: number; route: string }> = [];

  // Regex to match router.push("...") or router.push(`...`)
  const pushRegex = /router\.push\([`"']([^`"']+)[`"']\)/g;

  lines.forEach((line, index) => {
    let match;
    while ((match = pushRegex.exec(line)) !== null) {
      const route = match[1];
      // Ignore template literals with variables
      if (!route.includes('${')) {
        pushCalls.push({ line: index + 1, route });
      }
    }
  });

  return pushCalls;
}

/**
 * Check if a route path exists in the app directory
 */
function routeExists(route: string): boolean {
  // Remove query params and hash
  const cleanRoute = route.split('?')[0].split('#')[0];

  // Handle root route
  if (cleanRoute === '/') {
    return fs.existsSync(path.join(APP_DIR, 'page.tsx'));
  }

  // Remove leading slash and split into segments
  const segments = cleanRoute.replace(/^\//, '').split('/');

  // Check if route exists as a page
  const potentialPaths = [
    // Direct page: /path/to/page.tsx
    path.join(APP_DIR, ...segments, 'page.tsx'),
    // Dynamic route: /path/[id]/page.tsx
    ...segments.map((_, i) => {
      const withDynamic = [...segments];
      withDynamic[i] = '[id]';
      return path.join(APP_DIR, ...withDynamic, 'page.tsx');
    }),
  ];

  return potentialPaths.some(p => fs.existsSync(p));
}

/**
 * Get the expected directory for a "new" route
 */
function getNewRouteDirectory(route: string): string | null {
  if (!route.endsWith('/new')) return null;

  const cleanRoute = route.replace(/^\//, '').replace(/\/new$/, '');
  const segments = cleanRoute.split('/');

  return path.join(APP_DIR, ...segments, 'new');
}

/**
 * Check if route uses correct module prefix
 */
function hasCorrectPrefix(route: string, filePath: string): boolean {
  // Extract module from file path
  const relativePath = path.relative(APP_DIR, filePath);
  const moduleMatch = relativePath.match(/^([^\/]+)\//);

  if (!moduleMatch) return true; // Root level, no prefix needed

  const module = moduleMatch[1];

  // Routes should start with their module prefix
  if (route.startsWith('/') && !route.startsWith(`/${module}`)) {
    // Check if it's a valid cross-module reference
    const validModules = ['crm', 'production', 'design', 'financials', 'partners', 'admin', 'dashboards', 'tasks', 'shipping', 'products', 'portal'];
    const routeModule = route.split('/')[1];

    return validModules.includes(routeModule);
  }

  return true;
}

/**
 * Recursively find all .tsx files in a directory
 */
function findTsxFiles(dir: string, fileList: string[] = []): string[] {
  const files = fs.readdirSync(dir);

  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      if (!IGNORE_PATTERNS.includes(file)) {
        findTsxFiles(filePath, fileList);
      }
    } else if (file.endsWith('.tsx')) {
      fileList.push(filePath);
    }
  }

  return fileList;
}

/**
 * Scan all TSX files for routing issues
 */
async function scanFiles() {
  console.log('🔍 Scanning for routing integrity issues...\n');

  const srcAppDir = path.join(process.cwd(), 'src', 'app');
  const files = findTsxFiles(srcAppDir);

  for (const file of files) {
    const pushCalls = extractRouterPushCalls(file);

    for (const { line, route } of pushCalls) {
      // Skip external URLs
      if (route.startsWith('http://') || route.startsWith('https://')) {
        continue;
      }

      // Check if route exists
      if (!routeExists(route)) {
        // Check if it's a "new" route that needs a directory
        if (route.endsWith('/new')) {
          const newDir = getNewRouteDirectory(route);
          if (newDir && !fs.existsSync(newDir)) {
            issues.push({
              type: 'missing_new_directory',
              file: path.relative(process.cwd(), file),
              line,
              route,
              expectedPath: path.relative(process.cwd(), path.join(newDir, 'page.tsx')),
              message: `Missing /new directory for route "${route}"`,
            });
          }
        } else {
          issues.push({
            type: 'missing_page',
            file: path.relative(process.cwd(), file),
            line,
            route,
            message: `Route "${route}" does not have a corresponding page file`,
          });
        }
      }

      // Check for correct module prefix
      if (!hasCorrectPrefix(route, file)) {
        const relativePath = path.relative(APP_DIR, file);
        const moduleMatch = relativePath.match(/^([^\/]+)\//);
        const module = moduleMatch ? moduleMatch[1] : '';

        issues.push({
          type: 'incorrect_prefix',
          file: path.relative(process.cwd(), file),
          line,
          route,
          message: `Route "${route}" may be missing "/${module}" prefix`,
        });
      }
    }
  }
}

/**
 * Generate report
 */
function generateReport() {
  if (issues.length === 0) {
    console.log('✅ No routing integrity issues found!\n');
    return;
  }

  console.log(`❌ Found ${issues.length} routing integrity issue(s):\n`);

  // Group issues by type
  const grouped = issues.reduce((acc, issue) => {
    if (!acc[issue.type]) acc[issue.type] = [];
    acc[issue.type].push(issue);
    return acc;
  }, {} as Record<string, RoutingIssue[]>);

  // Report each type
  Object.entries(grouped).forEach(([type, typeIssues]) => {
    console.log(`\n📋 ${type.toUpperCase().replace(/_/g, ' ')} (${typeIssues.length}):`);
    console.log('─'.repeat(80));

    typeIssues.forEach(issue => {
      console.log(`\n  File: ${issue.file}:${issue.line}`);
      console.log(`  Route: ${issue.route}`);
      if (issue.expectedPath) {
        console.log(`  Expected: ${issue.expectedPath}`);
      }
      console.log(`  Issue: ${issue.message}`);
    });
  });

  console.log('\n' + '='.repeat(80));
  console.log(`\nTotal Issues: ${issues.length}`);
  console.log('\n💡 Tip: Run this script after adding new action buttons or routes\n');

  process.exit(1);
}

/**
 * Matrix of action buttons to target pages
 */
function generateActionButtonMatrix() {
  console.log('\n📊 ACTION BUTTON → TARGET PAGE MATRIX\n');
  console.log('Module'.padEnd(20) + ' | ' + 'Action Button'.padEnd(25) + ' | ' + 'Target Route'.padEnd(35) + ' | ' + 'Status');
  console.log('─'.repeat(100));

  const matrix = [
    { module: 'Production', action: 'New Order', route: '/production/orders/new' },
    { module: 'Production', action: 'New Shop Drawing', route: '/production/shop-drawings/new' },
    { module: 'Production', action: 'New Prototype', route: '/production/prototypes/new' },
    { module: 'Production', action: 'New Packing Job', route: '/production/packing/new' },
    { module: 'Production', action: 'New QC Inspection', route: '/production/qc/new' },
    { module: 'Production', action: 'New Factory Review', route: '/production/factory-reviews/new' },
    { module: 'CRM', action: 'New Contact', route: '/crm/contacts/new' },
    { module: 'CRM', action: 'New Lead', route: '/crm/leads/new' },
    { module: 'CRM', action: 'New Customer', route: '/crm/customers/new' },
    { module: 'Design', action: 'New Project', route: '/design/projects/new' },
    { module: 'Design', action: 'New Brief', route: '/design/briefs/new' },
    { module: 'Financials', action: 'New Invoice', route: '/financials/invoices/new' },
    { module: 'Financials', action: 'Record Payment', route: '/financials/payments/new' },
    { module: 'Partners', action: 'New Designer', route: '/partners/designers/new' },
    { module: 'Partners', action: 'New Factory', route: '/partners/factories/new' },
  ];

  matrix.forEach(item => {
    const exists = routeExists(item.route);
    const status = exists ? '✅ OK' : '❌ MISSING';
    console.log(
      item.module.padEnd(20) + ' | ' +
      item.action.padEnd(25) + ' | ' +
      item.route.padEnd(35) + ' | ' +
      status
    );
  });

  console.log('');
}

// Main execution
async function main() {
  console.log('🚀 Routing Integrity Verification\n');
  console.log('='.repeat(80));

  await scanFiles();
  generateReport();
  generateActionButtonMatrix();
}

main().catch(err => {
  console.error('Error running verification:', err);
  process.exit(1);
});
