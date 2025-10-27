/**
 * Comprehensive Legacy Code Audit Script
 *
 * Searches for:
 * 1. Duplicate/competing systems (like the user_type vs user_roles issue)
 * 2. Orphaned database tables (tables that exist but aren't used in code)
 * 3. Deprecated patterns and TODO/FIXME comments
 * 4. Inconsistent authentication/authorization patterns
 * 5. Multiple database access patterns
 * 6. Unused imports and dead code indicators
 *
 * Created: October 26, 2025
 * Purpose: Prevent repeat of RBAC dual-system oversight
 */

import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

interface AuditIssue {
  category: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  title: string;
  description: string;
  location?: string;
  recommendation: string;
}

const issues: AuditIssue[] = [];

function addIssue(issue: AuditIssue) {
  issues.push(issue);
  const emoji = issue.severity === 'CRITICAL' ? '🔴' : issue.severity === 'HIGH' ? '🟠' : issue.severity === 'MEDIUM' ? '🟡' : '⚪';
  console.log(`${emoji} [${issue.severity}] ${issue.title}`);
  if (issue.location) {
    console.log(`   Location: ${issue.location}`);
  }
  console.log(`   ${issue.description}`);
  console.log(`   → ${issue.recommendation}\n`);
}

// ========================================
// 1. Check for Orphaned Database Tables
// ========================================

async function checkOrphanedTables() {
  console.log('\n📊 AUDIT 1: Checking for Orphaned Database Tables\n');
  console.log('─'.repeat(80));

  try {
    // Get all tables from database
    const tables = await prisma.$queryRaw<Array<{ tablename: string }>>`
      SELECT tablename
      FROM pg_tables
      WHERE schemaname = 'public'
      ORDER BY tablename;
    `;

    console.log(`Found ${tables.length} tables in database`);

    // Check each table for usage in code
    for (const { tablename } of tables) {
      // Skip system tables
      if (tablename.startsWith('_prisma') || tablename === 'spatial_ref_sys') {
        continue;
      }

      try {
        // Search for table usage in TypeScript files
        const searchResult = execSync(
          `grep -r "\\b${tablename}\\b" src --include="*.ts" --include="*.tsx" | wc -l`,
          { encoding: 'utf-8' }
        ).trim();

        const usageCount = parseInt(searchResult);

        if (usageCount === 0) {
          addIssue({
            category: 'Orphaned Tables',
            severity: 'HIGH',
            title: `Orphaned Table: ${tablename}`,
            description: `Table exists in database but is not referenced anywhere in the codebase`,
            location: `Database table: ${tablename}`,
            recommendation: `Investigate if this table is needed. If not, consider dropping it. If yes, implement the feature or document why it's unused.`
          });
        } else if (usageCount < 3) {
          addIssue({
            category: 'Orphaned Tables',
            severity: 'MEDIUM',
            title: `Rarely Used Table: ${tablename}`,
            description: `Table is only referenced ${usageCount} time(s) in the codebase`,
            location: `Database table: ${tablename}`,
            recommendation: `Verify this table is intentionally used. May be incomplete feature or leftover from refactoring.`
          });
        }
      } catch (error) {
        // grep returns non-zero if no matches, which is fine
      }
    }
  } catch (error) {
    console.error('Error checking orphaned tables:', error);
  }
}

// ========================================
// 2. Check for Duplicate Systems
// ========================================

async function checkDuplicateSystems() {
  console.log('\n🔄 AUDIT 2: Checking for Duplicate/Competing Systems\n');
  console.log('─'.repeat(80));

  // Check for multiple authentication patterns
  try {
    const authPatterns = [
      { pattern: 'useAuthContext', file: 'src/lib/auth/AuthProvider' },
      { pattern: 'getUser\\(\\)', file: 'src/lib/auth/server' },
      { pattern: 'getServerSession', file: 'various' },
      { pattern: 'useSession', file: 'next-auth' },
    ];

    for (const { pattern, file } of authPatterns) {
      const count = execSync(
        `grep -r "${pattern}" src --include="*.ts" --include="*.tsx" | wc -l`,
        { encoding: 'utf-8' }
      ).trim();

      console.log(`Auth pattern "${pattern}" used ${count} times (from ${file})`);
    }

    // If multiple patterns have significant usage, flag it
    const authContextCount = parseInt(execSync(
      `grep -r "useAuthContext" src --include="*.ts" --include="*.tsx" | wc -l`,
      { encoding: 'utf-8' }
    ).trim());

    const getUserCount = parseInt(execSync(
      `grep -r "getUser\\(\\)" src --include="*.ts" --include="*.tsx" | wc -l`,
      { encoding: 'utf-8' }
    ).trim());

    if (authContextCount > 10 && getUserCount > 10) {
      addIssue({
        category: 'Duplicate Systems',
        severity: 'HIGH',
        title: 'Multiple Authentication Patterns',
        description: `Found ${authContextCount} uses of useAuthContext and ${getUserCount} uses of getUser() - inconsistent authentication pattern`,
        recommendation: 'Standardize on single authentication pattern. Based on CLAUDE.md, should use api.userProfile.getCurrentUser.useQuery() for client and getUser() for server.'
      });
    }
  } catch (error) {
    console.error('Error checking duplicate systems:', error);
  }

  // Check for multiple database access patterns
  try {
    const dbPatterns = [
      'ctx.db.',
      'prisma.',
      'getSupabaseClient',
      'supabase.from',
    ];

    console.log('\nDatabase access patterns:');
    for (const pattern of dbPatterns) {
      const count = execSync(
        `grep -r "${pattern}" src --include="*.ts" --include="*.tsx" | wc -l`,
        { encoding: 'utf-8' }
      ).trim();

      console.log(`Pattern "${pattern}" used ${count} times`);
    }

    const prismaCount = parseInt(execSync(
      `grep -r "prisma\\." src/server --include="*.ts" | wc -l`,
      { encoding: 'utf-8' }
    ).trim());

    if (prismaCount > 5) {
      addIssue({
        category: 'Duplicate Systems',
        severity: 'MEDIUM',
        title: 'Direct Prisma Usage in Routers',
        description: `Found ${prismaCount} direct prisma calls in src/server - should use ctx.db instead`,
        location: 'src/server directory',
        recommendation: 'Replace direct prisma calls with ctx.db for consistency. See Database Access Pattern Standard in CLAUDE.md.'
      });
    }
  } catch (error) {
    console.error('Error checking database patterns:', error);
  }
}

// ========================================
// 3. Check for Deprecated Code
// ========================================

function checkDeprecatedCode() {
  console.log('\n⚠️  AUDIT 3: Checking for Deprecated Code\n');
  console.log('─'.repeat(80));

  const deprecatedPatterns = [
    { pattern: '@deprecated', description: 'Code marked as deprecated' },
    { pattern: 'TODO:', description: 'Unfinished work' },
    { pattern: 'FIXME:', description: 'Known issues to fix' },
    { pattern: 'HACK:', description: 'Temporary workarounds' },
    { pattern: 'XXX:', description: 'Problematic code' },
    { pattern: 'BUG:', description: 'Known bugs' },
  ];

  for (const { pattern, description } of deprecatedPatterns) {
    try {
      const result = execSync(
        `grep -rn "${pattern}" src --include="*.ts" --include="*.tsx" || true`,
        { encoding: 'utf-8' }
      );

      if (result.trim()) {
        const lines = result.trim().split('\n');
        const count = lines.length;

        if (count > 0) {
          addIssue({
            category: 'Deprecated Code',
            severity: pattern === '@deprecated' ? 'HIGH' : pattern.includes('BUG') ? 'CRITICAL' : 'MEDIUM',
            title: `${description}: ${count} instances`,
            description: `Found ${count} "${pattern}" markers in codebase`,
            recommendation: `Review and resolve these markers. First 3:\n${lines.slice(0, 3).join('\n')}`
          });
        }
      }
    } catch (error) {
      // grep returns non-zero if no matches
    }
  }
}

// ========================================
// 4. Check for Inconsistent Patterns
// ========================================

function checkInconsistentPatterns() {
  console.log('\n🔀 AUDIT 4: Checking for Inconsistent Patterns\n');
  console.log('─'.repeat(80));

  // Check for both .env and .env.local usage
  const envFiles = ['.env', '.env.local', '.env.development', '.env.production'];
  const existingEnvFiles = envFiles.filter(file => fs.existsSync(file));

  if (existingEnvFiles.length > 2) {
    addIssue({
      category: 'Inconsistent Patterns',
      severity: 'MEDIUM',
      title: 'Multiple Environment Files',
      description: `Found ${existingEnvFiles.length} environment files: ${existingEnvFiles.join(', ')}`,
      recommendation: 'Consolidate environment configuration. Document which file is authoritative.'
    });
  }

  // Check for inconsistent import patterns
  try {
    const relativeImports = parseInt(execSync(
      `grep -r "from '\\.\\./" src --include="*.ts" --include="*.tsx" | wc -l`,
      { encoding: 'utf-8' }
    ).trim());

    const absoluteImports = parseInt(execSync(
      `grep -r "from '@/" src --include="*.ts" --include="*.tsx" | wc -l`,
      { encoding: 'utf-8' }
    ).trim());

    console.log(`Relative imports (../ ): ${relativeImports}`);
    console.log(`Absolute imports (@/): ${absoluteImports}`);

    if (relativeImports > absoluteImports * 0.3) {
      addIssue({
        category: 'Inconsistent Patterns',
        severity: 'LOW',
        title: 'Mixed Import Styles',
        description: `Found significant usage of both relative (${relativeImports}) and absolute (${absoluteImports}) imports`,
        recommendation: 'Prefer absolute imports (@/) for consistency.'
      });
    }
  } catch (error) {
    console.error('Error checking import patterns:', error);
  }
}

// ========================================
// 5. Check for Unused Dependencies
// ========================================

function checkUnusedDependencies() {
  console.log('\n📦 AUDIT 5: Checking for Unused Dependencies\n');
  console.log('─'.repeat(80));

  try {
    console.log('Running depcheck (this may take a minute)...\n');

    const result = execSync('npx depcheck --json', { encoding: 'utf-8' });
    const depcheck = JSON.parse(result);

    if (depcheck.dependencies && depcheck.dependencies.length > 0) {
      addIssue({
        category: 'Unused Dependencies',
        severity: 'LOW',
        title: `${depcheck.dependencies.length} Unused Dependencies`,
        description: `The following dependencies are installed but not used: ${depcheck.dependencies.slice(0, 5).join(', ')}${depcheck.dependencies.length > 5 ? '...' : ''}`,
        recommendation: 'Review and remove unused dependencies to reduce bundle size.'
      });
    }

    if (depcheck.devDependencies && depcheck.devDependencies.length > 0) {
      console.log(`Found ${depcheck.devDependencies.length} unused dev dependencies`);
    }
  } catch (error) {
    console.log('Note: depcheck not available or failed. Skipping dependency check.');
  }
}

// ========================================
// 6. Check for Security Issues
// ========================================

function checkSecurityIssues() {
  console.log('\n🔒 AUDIT 6: Checking for Security Issues\n');
  console.log('─'.repeat(80));

  // Check for hardcoded credentials patterns
  const dangerousPatterns = [
    { pattern: 'password.*=.*["\'][^"\']+["\']', description: 'Hardcoded password' },
    { pattern: 'api[_-]?key.*=.*["\'][^"\']+["\']', description: 'Hardcoded API key' },
    { pattern: 'secret.*=.*["\'][^"\']+["\']', description: 'Hardcoded secret' },
    { pattern: 'token.*=.*["\'][^"\']{20,}["\']', description: 'Hardcoded token' },
  ];

  for (const { pattern, description } of dangerousPatterns) {
    try {
      const result = execSync(
        `grep -rn -E "${pattern}" src --include="*.ts" --include="*.tsx" || true`,
        { encoding: 'utf-8' }
      );

      if (result.trim()) {
        const lines = result.trim().split('\n').filter(line =>
          !line.includes('process.env') &&
          !line.includes('// ') &&
          !line.includes('placeholder') &&
          !line.includes('example')
        );

        if (lines.length > 0) {
          addIssue({
            category: 'Security',
            severity: 'CRITICAL',
            title: `Potential ${description}`,
            description: `Found ${lines.length} potential hardcoded credentials`,
            recommendation: `Review these immediately:\n${lines.slice(0, 3).join('\n')}`
          });
        }
      }
    } catch (error) {
      // grep returns non-zero if no matches
    }
  }

  // Check for eval usage
  try {
    const evalUsage = execSync(
      `grep -rn "eval(" src --include="*.ts" --include="*.tsx" || true`,
      { encoding: 'utf-8' }
    ).trim();

    if (evalUsage) {
      addIssue({
        category: 'Security',
        severity: 'CRITICAL',
        title: 'Dangerous eval() Usage',
        description: 'Found eval() calls which are a security risk',
        location: evalUsage.split('\n')[0],
        recommendation: 'Remove eval() usage immediately. Find alternative approach.'
      });
    }
  } catch (error) {
    // grep returns non-zero if no matches
  }
}

// ========================================
// 7. Generate Report
// ========================================

function generateReport() {
  console.log('\n' + '═'.repeat(80));
  console.log('📋 AUDIT SUMMARY');
  console.log('═'.repeat(80) + '\n');

  const bySeverity = {
    CRITICAL: issues.filter(i => i.severity === 'CRITICAL'),
    HIGH: issues.filter(i => i.severity === 'HIGH'),
    MEDIUM: issues.filter(i => i.severity === 'MEDIUM'),
    LOW: issues.filter(i => i.severity === 'LOW'),
  };

  console.log(`Total Issues Found: ${issues.length}\n`);
  console.log(`  🔴 CRITICAL: ${bySeverity.CRITICAL.length}`);
  console.log(`  🟠 HIGH:     ${bySeverity.HIGH.length}`);
  console.log(`  🟡 MEDIUM:   ${bySeverity.MEDIUM.length}`);
  console.log(`  ⚪ LOW:      ${bySeverity.LOW.length}\n`);

  const byCategory: Record<string, AuditIssue[]> = {};
  issues.forEach(issue => {
    if (!byCategory[issue.category]) {
      byCategory[issue.category] = [];
    }
    byCategory[issue.category].push(issue);
  });

  console.log('Issues by Category:\n');
  Object.entries(byCategory).forEach(([category, categoryIssues]) => {
    console.log(`  ${category}: ${categoryIssues.length}`);
  });

  // Save detailed report
  const reportPath = '/Users/eko3/limn-systems-enterprise-docs/01-CURRENT/LEGACY-CODE-AUDIT-2025-10-26.md';
  let report = `# Legacy Code Audit Report\n\n`;
  report += `**Date**: October 26, 2025\n`;
  report += `**Purpose**: Comprehensive audit to find legacy/orphaned code after discovering dual permission systems\n\n`;
  report += `## Summary\n\n`;
  report += `- **Total Issues**: ${issues.length}\n`;
  report += `- **Critical**: ${bySeverity.CRITICAL.length}\n`;
  report += `- **High**: ${bySeverity.HIGH.length}\n`;
  report += `- **Medium**: ${bySeverity.MEDIUM.length}\n`;
  report += `- **Low**: ${bySeverity.LOW.length}\n\n`;

  report += `## Issues by Severity\n\n`;

  for (const [severity, severityIssues] of Object.entries(bySeverity)) {
    if (severityIssues.length > 0) {
      report += `### ${severity}\n\n`;
      severityIssues.forEach((issue, i) => {
        report += `#### ${i + 1}. ${issue.title}\n\n`;
        report += `**Category**: ${issue.category}\n\n`;
        report += `**Description**: ${issue.description}\n\n`;
        if (issue.location) {
          report += `**Location**: \`${issue.location}\`\n\n`;
        }
        report += `**Recommendation**: ${issue.recommendation}\n\n`;
        report += `---\n\n`;
      });
    }
  }

  fs.writeFileSync(reportPath, report);
  console.log(`\n✅ Detailed report saved to: ${reportPath}\n`);
}

// ========================================
// Main
// ========================================

async function main() {
  console.log('╔═══════════════════════════════════════════════════════════════════════╗');
  console.log('║           COMPREHENSIVE LEGACY CODE AUDIT                             ║');
  console.log('║           Searching for orphaned and duplicate systems                ║');
  console.log('╚═══════════════════════════════════════════════════════════════════════╝\n');

  await checkOrphanedTables();
  await checkDuplicateSystems();
  checkDeprecatedCode();
  checkInconsistentPatterns();
  checkUnusedDependencies();
  checkSecurityIssues();

  generateReport();

  await prisma.$disconnect();
}

main().catch(error => {
  console.error('Fatal error during audit:', error);
  process.exit(1);
});
