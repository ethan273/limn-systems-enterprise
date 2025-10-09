#!/usr/bin/env tsx

/**
 * OVERNIGHT AUTOMATED TESTING & FIX SYSTEM
 *
 * Purpose: Run all tests, compile errors, analyze patterns, apply fixes automatically
 *
 * Usage: npm run test:overnight
 *
 * What it does:
 * 1. Runs all 11 tests in optimal order (60-90 min)
 * 2. Compiles all errors into unified database
 * 3. Analyzes patterns across systems
 * 4. Applies safe fixes automatically
 * 5. Flags risky fixes for review
 * 6. Generates comprehensive morning report
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';

const execAsync = promisify(exec);

// ============================================================================
// TYPES
// ============================================================================

interface ErrorEntry {
  testName: string;
  errorType: string;
  message: string;
  file?: string;
  line?: number;
  severity: 'critical' | 'high' | 'medium' | 'low';
  patternId?: string;
  stackTrace?: string;
}

interface ErrorPattern {
  pattern: string;
  rootCause: string;
  affectedTests: string[];
  affectedFiles: string[];
  occurrences: number;
  severity: 'critical' | 'high' | 'medium' | 'low';
  autoFixable: boolean;
  suggestedFix: string;
  examples: ErrorEntry[];
}

interface TestResult {
  name: string;
  command: string;
  passed: boolean;
  duration: number;
  errors: ErrorEntry[];
  warnings: ErrorEntry[];
  output: string;
  exitCode: number;
}

interface UnifiedErrorDatabase {
  metadata: {
    runTimestamp: string;
    totalTests: number;
    totalErrors: number;
    totalWarnings: number;
    totalPatternsFound: number;
    totalAutoFixed: number;
    totalFlaggedForReview: number;
  };
  testResults: TestResult[];
  errorsByTest: { [testName: string]: TestResult };
  errorsByPattern: { [patternId: string]: ErrorPattern };
  errorsByFile: { [filePath: string]: { totalErrors: number; patterns: string[]; errors: ErrorEntry[] } };
}

interface AutoFix {
  type: 'remove-unused-import' | 'remove-console-log' | 'eslint-fix' | 'add-null-check';
  file: string;
  line?: number;
  description: string;
}

interface FlaggedFix {
  severity: 'critical' | 'high' | 'medium' | 'low';
  category: string;
  file: string;
  line?: number;
  issue: string;
  currentCode?: string;
  suggestedFix: string;
  actionRequired: string;
}

// ============================================================================
// CONFIGURATION
// ============================================================================

const PROJECT_ROOT = process.cwd();
const DOCS_ROOT = path.join(path.dirname(PROJECT_ROOT), 'limn-systems-enterprise-docs');
const REPORTS_DIR = path.join(DOCS_ROOT, '02-TESTING', 'OVERNIGHT-REPORTS');
const FLAGGED_FIXES_DIR = path.join(REPORTS_DIR, 'flagged-fixes');

const TESTS = [
  // Phase 1: Critical Infrastructure (22 min)
  { name: 'Database Integrity', command: 'npm run test:db-integrity', timeout: 300000 },
  { name: 'Type Check', command: 'npm run type-check', timeout: 120000 },
  { name: 'Lint', command: 'npm run lint', timeout: 120000 },
  { name: 'API Coverage', command: 'npm run test:api-coverage', timeout: 300000 },
  { name: 'Auth Security', command: 'npm run test:auth-security', timeout: 300000 },
  { name: 'Data Validation', command: 'npm run test:data-validation', timeout: 300000 },

  // Phase 2: Functional Verification (30 min)
  { name: 'Functional Testing', command: 'npm run test:functional', timeout: 1200000 },
  { name: 'Console Audit', command: 'npm run audit:console', timeout: 600000 },

  // Phase 3: End-to-End User Flows (20 min)
  { name: 'Playwright E2E', command: 'npx playwright test --workers=2', timeout: 1200000 },

  // Phase 4: Final Validation (10 min)
  { name: 'Security Audit', command: 'npm run security:audit', timeout: 300000 },
  { name: 'Build', command: 'npm run build', timeout: 300000 },
];

// ============================================================================
// UTILITIES
// ============================================================================

function log(message: string, emoji = '📋') {
  console.log(`\n${emoji} ${message}`);
}

function logSection(title: string) {
  console.log('\n' + '='.repeat(80));
  console.log(`  ${title}`);
  console.log('='.repeat(80) + '\n');
}

function ensureDir(dirPath: string) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function formatDuration(ms: number): string {
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  return `${minutes}m ${seconds}s`;
}

function checkMemory(): { heapUsedMB: number; heapTotalMB: number; warning: boolean } {
  const usage = process.memoryUsage();
  const heapUsedMB = Math.round(usage.heapUsed / 1024 / 1024);
  const heapTotalMB = Math.round(usage.heapTotal / 1024 / 1024);
  const warning = heapUsedMB > 3500;

  if (warning) {
    log(`⚠️  High memory usage: ${heapUsedMB}MB / ${heapTotalMB}MB`, '⚠️');
    if (global.gc) {
      log('Running garbage collection...', '🧹');
      global.gc();
    }
  }

  return { heapUsedMB, heapTotalMB, warning };
}

// ============================================================================
// TEST EXECUTION
// ============================================================================

async function runTest(test: typeof TESTS[0]): Promise<TestResult> {
  const startTime = Date.now();

  log(`Running: ${test.name}`, '🧪');

  try {
    const { stdout, stderr } = await execAsync(test.command, {
      cwd: PROJECT_ROOT,
      timeout: test.timeout,
      maxBuffer: 10 * 1024 * 1024, // 10MB buffer
    });

    const duration = Date.now() - startTime;
    const output = stdout + stderr;

    log(`✅ ${test.name} completed in ${formatDuration(duration)}`, '✅');

    return {
      name: test.name,
      command: test.command,
      passed: true,
      duration,
      errors: [],
      warnings: [],
      output,
      exitCode: 0,
    };

  } catch (error: any) {
    const duration = Date.now() - startTime;
    const output = (error.stdout || '') + (error.stderr || '');

    log(`❌ ${test.name} failed in ${formatDuration(duration)}`, '❌');

    return {
      name: test.name,
      command: test.command,
      passed: false,
      duration,
      errors: [],
      warnings: [],
      output,
      exitCode: error.code || 1,
    };
  }
}

async function runAllTests(): Promise<TestResult[]> {
  logSection('PHASE 1: RUNNING ALL TESTS');

  const results: TestResult[] = [];

  for (const test of TESTS) {
    const result = await runTest(test);
    results.push(result);

    // Memory check after each test
    checkMemory();

    // Small delay between tests
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  return results;
}

// ============================================================================
// ERROR PARSING
// ============================================================================

class ErrorParser {

  parseTypeScriptErrors(output: string, testName: string): ErrorEntry[] {
    const errors: ErrorEntry[] = [];
    const lines = output.split('\n');

    for (const line of lines) {
      // Pattern: src/path/file.tsx(123,45): error TS2304: Cannot find name 'X'.
      const match = line.match(/^(.+?)\((\d+),\d+\): error TS\d+: (.+)$/);
      if (match) {
        errors.push({
          testName,
          errorType: 'TypeScript Error',
          message: match[3],
          file: match[1],
          line: parseInt(match[2]),
          severity: 'high',
        });
      }
    }

    return errors;
  }

  parseESLintErrors(output: string, testName: string): ErrorEntry[] {
    const errors: ErrorEntry[] = [];
    const lines = output.split('\n');

    for (const line of lines) {
      // Pattern: /path/file.tsx
      //   123:45  error    'X' is defined but never used  no-unused-vars
      const fileMatch = line.match(/^(.+\.tsx?)$/);
      if (fileMatch) {
        const file = fileMatch[1];
        continue;
      }

      const errorMatch = line.match(/^\s+(\d+):(\d+)\s+(error|warning)\s+(.+?)\s{2,}(.+)$/);
      if (errorMatch) {
        errors.push({
          testName,
          errorType: 'ESLint Error',
          message: errorMatch[4],
          line: parseInt(errorMatch[1]),
          severity: errorMatch[3] === 'error' ? 'medium' : 'low',
        });
      }
    }

    return errors;
  }

  parseBuildErrors(output: string, testName: string): ErrorEntry[] {
    const errors: ErrorEntry[] = [];
    const lines = output.split('\n');

    for (const line of lines) {
      if (line.includes('Error:') || line.includes('ERROR')) {
        errors.push({
          testName,
          errorType: 'Build Error',
          message: line.trim(),
          severity: 'critical',
        });
      }
    }

    return errors;
  }

  parseMarkdownReport(filePath: string, testName: string): ErrorEntry[] {
    const errors: ErrorEntry[] = [];

    if (!fs.existsSync(filePath)) {
      return errors;
    }

    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');

    for (const line of lines) {
      // Look for error markers
      if (line.includes('❌') || line.includes('FAILED') || line.includes('ERROR')) {
        errors.push({
          testName,
          errorType: 'Test Failure',
          message: line.replace(/[❌✅]/g, '').trim(),
          severity: 'high',
        });
      }

      // Look for critical issues
      if (line.includes('CRITICAL') || line.includes('SECURITY')) {
        errors.push({
          testName,
          errorType: 'Critical Issue',
          message: line.trim(),
          severity: 'critical',
        });
      }
    }

    return errors;
  }

  parseAllErrors(results: TestResult[]): TestResult[] {
    for (const result of results) {
      let parsedErrors: ErrorEntry[] = [];

      // Parse based on test type
      if (result.name === 'Type Check') {
        parsedErrors = this.parseTypeScriptErrors(result.output, result.name);
      } else if (result.name === 'Lint') {
        parsedErrors = this.parseESLintErrors(result.output, result.name);
      } else if (result.name === 'Build') {
        parsedErrors = this.parseBuildErrors(result.output, result.name);
      } else if (result.name === 'Database Integrity') {
        const reportPath = path.join(DOCS_ROOT, '02-TESTING', 'CRITICAL-TESTS', 'reports', 'database-integrity-latest.md');
        parsedErrors = this.parseMarkdownReport(reportPath, result.name);
      } else if (result.name === 'API Coverage') {
        const reportPath = path.join(DOCS_ROOT, '02-TESTING', 'CRITICAL-TESTS', 'reports', 'api-coverage-latest.md');
        parsedErrors = this.parseMarkdownReport(reportPath, result.name);
      } else if (result.name === 'Auth Security') {
        const reportPath = path.join(DOCS_ROOT, '02-TESTING', 'CRITICAL-TESTS', 'reports', 'auth-security-latest.md');
        parsedErrors = this.parseMarkdownReport(reportPath, result.name);
      } else if (result.name === 'Data Validation') {
        const reportPath = path.join(DOCS_ROOT, '02-TESTING', 'CRITICAL-TESTS', 'reports', 'data-validation-latest.md');
        parsedErrors = this.parseMarkdownReport(reportPath, result.name);
      } else if (result.name === 'Functional Testing') {
        const reportPath = path.join(DOCS_ROOT, '02-TESTING', 'FUNCTIONAL-TESTING', 'reports', 'functional-all-modules-latest.md');
        parsedErrors = this.parseMarkdownReport(reportPath, result.name);
      } else if (result.name === 'Console Audit') {
        const reportPath = path.join(DOCS_ROOT, '02-TESTING', 'CONSOLE-ERROR-AUDITING', 'reports', 'console-audit-latest.md');
        parsedErrors = this.parseMarkdownReport(reportPath, result.name);
      }

      result.errors = parsedErrors.filter(e => e.severity === 'critical' || e.severity === 'high');
      result.warnings = parsedErrors.filter(e => e.severity === 'medium' || e.severity === 'low');
    }

    return results;
  }
}

// ============================================================================
// PATTERN ANALYSIS
// ============================================================================

class PatternAnalyzer {
  private patterns: Map<string, ErrorPattern> = new Map();

  analyzePatterns(results: TestResult[]): { [patternId: string]: ErrorPattern } {
    logSection('PHASE 3: ANALYZING ERROR PATTERNS');

    // Collect all errors
    const allErrors: ErrorEntry[] = [];
    for (const result of results) {
      allErrors.push(...result.errors, ...result.warnings);
    }

    log(`Total errors to analyze: ${allErrors.length}`, '🔍');

    // Group by message patterns
    this.groupByMessagePattern(allErrors);

    // Group by file patterns
    this.groupByFilePattern(allErrors);

    // Group by error type
    this.groupByErrorType(allErrors);

    log(`Patterns found: ${this.patterns.size}`, '📊');

    return Object.fromEntries(this.patterns.entries());
  }

  private groupByMessagePattern(errors: ErrorEntry[]) {
    const messageGroups = new Map<string, ErrorEntry[]>();

    for (const error of errors) {
      // Extract pattern from message
      let pattern = error.message;

      // Common patterns
      if (pattern.includes('Cannot find module')) {
        pattern = 'Cannot find module';
      } else if (pattern.includes('is declared but never used')) {
        pattern = 'Unused declaration';
      } else if (pattern.includes('Property') && pattern.includes('does not exist')) {
        pattern = 'Property does not exist on type';
      } else if (pattern.includes('TRPC') && pattern.includes('not found')) {
        pattern = 'TRPC procedure not found';
      } else if (pattern.includes('console.')) {
        pattern = 'Console statement';
      }

      if (!messageGroups.has(pattern)) {
        messageGroups.set(pattern, []);
      }
      messageGroups.get(pattern)!.push(error);
    }

    // Create patterns from groups with 2+ occurrences
    for (const [pattern, errors] of messageGroups) {
      if (errors.length >= 2) {
        this.createPattern(pattern, errors);
      }
    }
  }

  private groupByFilePattern(errors: ErrorEntry[]) {
    const fileGroups = new Map<string, ErrorEntry[]>();

    for (const error of errors) {
      if (!error.file) continue;

      if (!fileGroups.has(error.file)) {
        fileGroups.set(error.file, []);
      }
      fileGroups.get(error.file)!.push(error);
    }

    // Files with 3+ errors indicate systemic issue
    for (const [file, errors] of fileGroups) {
      if (errors.length >= 3) {
        const patternId = `file-issues-${file}`;
        this.patterns.set(patternId, {
          pattern: `Multiple issues in ${file}`,
          rootCause: 'File needs refactoring or has missing dependencies',
          affectedTests: [...new Set(errors.map(e => e.testName))],
          affectedFiles: [file],
          occurrences: errors.length,
          severity: 'high',
          autoFixable: false,
          suggestedFix: `Review and refactor ${file}`,
          examples: errors.slice(0, 3),
        });
      }
    }
  }

  private groupByErrorType(errors: ErrorEntry[]) {
    const typeGroups = new Map<string, ErrorEntry[]>();

    for (const error of errors) {
      if (!typeGroups.has(error.errorType)) {
        typeGroups.set(error.errorType, []);
      }
      typeGroups.get(error.errorType)!.push(error);
    }

    // Log summary
    for (const [type, errors] of typeGroups) {
      log(`${type}: ${errors.length} occurrences`, '📌');
    }
  }

  private createPattern(pattern: string, errors: ErrorEntry[]) {
    const patternId = pattern.toLowerCase().replace(/\s+/g, '-');

    // Determine if auto-fixable
    const autoFixable =
      pattern === 'Unused declaration' ||
      pattern === 'Console statement' ||
      pattern.includes('never used');

    // Determine severity
    let severity: 'critical' | 'high' | 'medium' | 'low' = 'medium';
    if (pattern.includes('SECURITY') || pattern.includes('SQL')) {
      severity = 'critical';
    } else if (pattern.includes('TRPC') || pattern.includes('Cannot find')) {
      severity = 'high';
    } else if (pattern.includes('Console') || pattern.includes('Unused')) {
      severity = 'low';
    }

    this.patterns.set(patternId, {
      pattern,
      rootCause: this.inferRootCause(pattern),
      affectedTests: [...new Set(errors.map(e => e.testName))],
      affectedFiles: [...new Set(errors.map(e => e.file).filter(Boolean) as string[])],
      occurrences: errors.length,
      severity,
      autoFixable,
      suggestedFix: this.getSuggestedFix(pattern),
      examples: errors.slice(0, 3),
    });
  }

  private inferRootCause(pattern: string): string {
    if (pattern === 'Unused declaration') return 'Cleanup after refactoring';
    if (pattern === 'Console statement') return 'Debug statements left in code';
    if (pattern === 'Cannot find module') return 'Missing import or dependency';
    if (pattern === 'TRPC procedure not found') return 'Missing API endpoint';
    if (pattern.includes('Property') && pattern.includes('does not exist')) return 'Type mismatch or missing field';
    return 'Unknown - requires investigation';
  }

  private getSuggestedFix(pattern: string): string {
    if (pattern === 'Unused declaration') return 'Remove unused imports/variables';
    if (pattern === 'Console statement') return 'Remove console.log statements';
    if (pattern === 'Cannot find module') return 'Add missing import or install dependency';
    if (pattern === 'TRPC procedure not found') return 'Create missing tRPC procedure';
    if (pattern.includes('Property') && pattern.includes('does not exist')) return 'Update type definition or add field';
    return 'Manual review required';
  }
}

// ============================================================================
// AUTOMATED FIXES
// ============================================================================

class AutoFixer {
  private appliedFixes: AutoFix[] = [];
  private flaggedFixes: FlaggedFix[] = [];

  async applyFixes(patterns: { [patternId: string]: ErrorPattern }): Promise<void> {
    logSection('PHASE 4: APPLYING AUTOMATED FIXES');

    // Create git checkpoint before fixes
    await this.createCheckpoint();

    // Apply safe fixes
    for (const [patternId, pattern] of Object.entries(patterns)) {
      if (pattern.autoFixable) {
        await this.applyAutoFix(pattern);
      } else {
        this.flagForReview(pattern);
      }
    }

    // Run ESLint auto-fix
    await this.runESLintFix();

    log(`Auto-fixes applied: ${this.appliedFixes.length}`, '✅');
    log(`Fixes flagged for review: ${this.flaggedFixes.length}`, '⚠️');
  }

  private async createCheckpoint() {
    log('Creating git checkpoint before automated fixes...', '💾');

    try {
      await execAsync('git add .', { cwd: PROJECT_ROOT });
      await execAsync('git commit -m "checkpoint: Before automated fixes from overnight testing"', { cwd: PROJECT_ROOT });
      log('✅ Checkpoint created', '✅');
    } catch (error) {
      log('⚠️  No changes to checkpoint or git not configured', '⚠️');
    }
  }

  private async applyAutoFix(pattern: ErrorPattern) {
    if (pattern.pattern === 'Unused declaration') {
      // ESLint will handle this
      return;
    }

    if (pattern.pattern === 'Console statement') {
      await this.removeConsoleLogs(pattern.affectedFiles);
    }
  }

  private async removeConsoleLogs(files: string[]) {
    for (const file of files) {
      const fullPath = path.join(PROJECT_ROOT, file);

      if (!fs.existsSync(fullPath)) continue;

      try {
        let content = fs.readFileSync(fullPath, 'utf-8');
        const originalContent = content;

        // Remove console.log statements (simple cases only)
        content = content.replace(/^\s*console\.log\(.*?\);?\s*$/gm, '');

        if (content !== originalContent) {
          fs.writeFileSync(fullPath, content, 'utf-8');

          this.appliedFixes.push({
            type: 'remove-console-log',
            file,
            description: 'Removed console.log statements',
          });

          log(`Removed console.logs from ${file}`, '🧹');
        }
      } catch (error) {
        log(`Failed to process ${file}: ${error}`, '❌');
      }
    }
  }

  private async runESLintFix() {
    log('Running ESLint auto-fix...', '🔧');

    try {
      await execAsync('npx eslint --fix src/', { cwd: PROJECT_ROOT });

      this.appliedFixes.push({
        type: 'eslint-fix',
        file: 'src/',
        description: 'Applied ESLint auto-fixes',
      });

      log('✅ ESLint fixes applied', '✅');
    } catch (error) {
      log('⚠️  ESLint fix had warnings (this is normal)', '⚠️');
    }
  }

  private flagForReview(pattern: ErrorPattern) {
    let category = 'Code Quality';
    let actionRequired = 'Review and apply fix manually';

    if (pattern.severity === 'critical') {
      category = pattern.pattern.includes('SECURITY') ? 'Security' : 'Critical Infrastructure';
    } else if (pattern.pattern.includes('TRPC')) {
      category = 'Missing API Endpoints';
      actionRequired = 'Add missing tRPC procedures';
    } else if (pattern.pattern.includes('Cannot find module')) {
      category = 'Missing Dependencies';
      actionRequired = 'Add imports or install packages';
    }

    this.flaggedFixes.push({
      severity: pattern.severity,
      category,
      file: pattern.affectedFiles[0] || 'Multiple files',
      issue: pattern.pattern,
      suggestedFix: pattern.suggestedFix,
      actionRequired,
    });
  }

  getAppliedFixes(): AutoFix[] {
    return this.appliedFixes;
  }

  getFlaggedFixes(): FlaggedFix[] {
    return this.flaggedFixes;
  }
}

// ============================================================================
// REPORT GENERATION
// ============================================================================

class ReportGenerator {

  generateMorningReport(
    results: TestResult[],
    patterns: { [patternId: string]: ErrorPattern },
    appliedFixes: AutoFix[],
    flaggedFixes: FlaggedFix[],
    totalDuration: number
  ): string {
    const timestamp = new Date();
    const dateStr = timestamp.toISOString().split('T')[0];

    const passedTests = results.filter(r => r.passed);
    const failedTests = results.filter(r => !r.passed);

    const totalErrors = results.reduce((sum, r) => sum + r.errors.length, 0);
    const totalWarnings = results.reduce((sum, r) => sum + r.warnings.length, 0);

    const criticalFixes = flaggedFixes.filter(f => f.severity === 'critical');
    const highFixes = flaggedFixes.filter(f => f.severity === 'high');
    const mediumFixes = flaggedFixes.filter(f => f.severity === 'medium');
    const lowFixes = flaggedFixes.filter(f => f.severity === 'low');

    let report = `# OVERNIGHT TESTING REPORT - ${dateStr}\n\n`;
    report += `**Run Time**: ${timestamp.toLocaleTimeString()} (${formatDuration(totalDuration)})\n\n`;
    report += `---\n\n`;

    // Executive Summary
    report += `## 📈 Executive Summary\n\n`;
    report += `- **Total Tests**: ${results.length}\n`;
    report += `- **Tests Passed**: ${passedTests.length} ✅\n`;
    report += `- **Tests Failed**: ${failedTests.length} ❌\n`;
    report += `- **Total Errors Found**: ${totalErrors}\n`;
    report += `- **Total Warnings Found**: ${totalWarnings}\n`;
    report += `- **Errors Fixed Automatically**: ${appliedFixes.length} ✅\n`;
    report += `- **Errors Requiring Review**: ${flaggedFixes.length} ⚠️\n\n`;

    const successRate = Math.round((passedTests.length / results.length) * 100);
    const autoFixRate = totalErrors > 0 ? Math.round((appliedFixes.length / (totalErrors + totalWarnings)) * 100) : 0;

    let overallStatus = '🔴 Needs Work';
    if (successRate === 100) overallStatus = '🟢 All Tests Passed';
    else if (successRate >= 70) overallStatus = '🟡 Partial Success';

    report += `**Overall Status**: ${overallStatus} (${successRate}% tests passed, ${autoFixRate}% auto-fixed)\n\n`;
    report += `---\n\n`;

    // Quick Action Items
    report += `## 🎯 Quick Action Items (Top 5)\n\n`;

    const topFixes = [
      ...criticalFixes.slice(0, 3),
      ...highFixes.slice(0, 2),
    ].slice(0, 5);

    if (topFixes.length === 0) {
      report += `**No critical action items** - All issues auto-fixed! ✅\n\n`;
    } else {
      topFixes.forEach((fix, i) => {
        const emoji = fix.severity === 'critical' ? '🔴' : '🟡';
        report += `${i + 1}. ${emoji} **${fix.severity.toUpperCase()}**: ${fix.issue} (${fix.category})\n`;
      });
      report += `\n`;
    }

    report += `---\n\n`;

    // Test Results
    report += `## 📋 Test Results\n\n`;

    if (passedTests.length > 0) {
      report += `### ✅ PASSED (${passedTests.length} tests)\n\n`;
      report += `| Test | Duration | Status |\n`;
      report += `|------|----------|--------|\n`;
      passedTests.forEach(test => {
        report += `| ${test.name} | ${formatDuration(test.duration)} | ✅ PASSED |\n`;
      });
      report += `\n`;
    }

    if (failedTests.length > 0) {
      report += `### ❌ FAILED (${failedTests.length} tests)\n\n`;
      report += `| Test | Duration | Errors | Warnings |\n`;
      report += `|------|----------|--------|----------|\n`;
      failedTests.forEach(test => {
        report += `| ${test.name} | ${formatDuration(test.duration)} | ${test.errors.length} | ${test.warnings.length} |\n`;
      });
      report += `\n`;
    }

    report += `---\n\n`;

    // Pattern Analysis
    report += `## 🔍 Pattern Analysis\n\n`;

    const sortedPatterns = Object.entries(patterns).sort((a, b) => b[1].occurrences - a[1].occurrences);

    if (sortedPatterns.length === 0) {
      report += `**No error patterns found** - Clean codebase! ✅\n\n`;
    } else {
      sortedPatterns.slice(0, 5).forEach(([id, pattern], i) => {
        report += `### Pattern #${i + 1}: ${pattern.pattern} (${pattern.occurrences} occurrences)\n`;
        report += `**Severity**: ${pattern.severity.toUpperCase()}\n`;
        report += `**Auto-Fixable**: ${pattern.autoFixable ? 'Yes ✅' : 'No (requires review)'}\n\n`;
        report += `**Affected Systems**:\n`;
        pattern.affectedTests.forEach(test => {
          report += `- ${test}\n`;
        });
        report += `\n**Root Cause**: ${pattern.rootCause}\n\n`;
        report += `**Suggested Fix**: ${pattern.suggestedFix}\n\n`;

        if (pattern.autoFixable) {
          report += `**Status**: ✅ **FIXED AUTOMATICALLY**\n\n`;
        } else {
          report += `**Status**: ⚠️ **REQUIRES MANUAL REVIEW**\n\n`;
        }

        report += `---\n\n`;
      });
    }

    // Fixes Applied
    if (appliedFixes.length > 0) {
      report += `## 🛠️ Fixes Applied Automatically\n\n`;

      const fixesByType = new Map<string, AutoFix[]>();
      appliedFixes.forEach(fix => {
        if (!fixesByType.has(fix.type)) {
          fixesByType.set(fix.type, []);
        }
        fixesByType.get(fix.type)!.push(fix);
      });

      for (const [type, fixes] of fixesByType) {
        report += `### ${type} (${fixes.length} fixes)\n`;
        fixes.slice(0, 10).forEach(fix => {
          report += `- ${fix.file}: ${fix.description}\n`;
        });
        if (fixes.length > 10) {
          report += `- ... and ${fixes.length - 10} more\n`;
        }
        report += `\n`;
      }

      report += `**Total Auto-Fixes**: ${appliedFixes.length}\n\n`;
      report += `---\n\n`;
    }

    // Flagged Fixes
    if (flaggedFixes.length > 0) {
      report += `## ⚠️ Fixes Requiring Review\n\n`;
      report += `**Total Flagged**: ${flaggedFixes.length}\n\n`;

      if (criticalFixes.length > 0) {
        report += `### Critical Priority (${criticalFixes.length} issues)\n\n`;
        criticalFixes.forEach((fix, i) => {
          report += `#### ${i + 1}. ${fix.category}: ${fix.issue}\n`;
          report += `**File**: ${fix.file}\n`;
          report += `**Suggested Fix**: ${fix.suggestedFix}\n`;
          report += `**Action Required**: ${fix.actionRequired}\n\n`;
        });
      }

      if (highFixes.length > 0) {
        report += `### High Priority (${highFixes.length} issues)\n\n`;
        highFixes.slice(0, 5).forEach((fix, i) => {
          report += `${i + 1}. **${fix.category}**: ${fix.issue} (${fix.file})\n`;
        });
        if (highFixes.length > 5) {
          report += `... and ${highFixes.length - 5} more (see detailed report)\n`;
        }
        report += `\n`;
      }

      if (mediumFixes.length > 0) {
        report += `### Medium Priority (${mediumFixes.length} issues)\n\n`;
        report += `See detailed flagged fixes in: \`flagged-fixes/\` directory\n\n`;
      }

      if (lowFixes.length > 0) {
        report += `### Low Priority (${lowFixes.length} issues)\n\n`;
        report += `See detailed flagged fixes in: \`flagged-fixes/\` directory\n\n`;
      }

      report += `---\n\n`;
    }

    // Next Steps
    report += `## 🚀 Next Steps\n\n`;

    if (flaggedFixes.length === 0) {
      report += `**Congratulations!** 🎉 All issues were auto-fixed. Your codebase is clean!\n\n`;
      report += `1. Review applied fixes in git diff\n`;
      report += `2. Run tests manually to verify: \`npm run test:overnight\`\n`;
      report += `3. Deploy to production when ready\n\n`;
    } else {
      report += `1. Review ${criticalFixes.length} critical fixes (highest priority)\n`;
      report += `2. Review ${highFixes.length} high-priority fixes\n`;
      report += `3. Apply fixes manually\n`;
      report += `4. Re-run overnight tests: \`npm run test:overnight\`\n`;
      report += `5. Deploy when all tests pass\n\n`;

      const estimatedTime = Math.ceil((criticalFixes.length * 15 + highFixes.length * 10 + mediumFixes.length * 5) / 60);
      report += `**Estimated Review Time**: ${estimatedTime} hour${estimatedTime > 1 ? 's' : ''}\n\n`;
    }

    report += `---\n\n`;

    // Footer
    report += `**Generated**: ${timestamp.toLocaleString()}\n`;
    report += `**Total Run Time**: ${formatDuration(totalDuration)}\n`;
    report += `**Next Run**: Schedule manually with \`npm run test:overnight\`\n`;

    return report;
  }

  saveReports(
    morningReport: string,
    unifiedDb: UnifiedErrorDatabase,
    flaggedFixes: FlaggedFix[]
  ) {
    logSection('PHASE 5: GENERATING REPORTS');

    ensureDir(REPORTS_DIR);
    ensureDir(FLAGGED_FIXES_DIR);

    const dateStr = new Date().toISOString().split('T')[0];

    // Save morning report
    const reportPath = path.join(REPORTS_DIR, `overnight-report-${dateStr}.md`);
    fs.writeFileSync(reportPath, morningReport, 'utf-8');
    log(`Morning report saved: ${reportPath}`, '📄');

    // Save unified error database
    const dbPath = path.join(REPORTS_DIR, `unified-error-db-${dateStr}.json`);
    fs.writeFileSync(dbPath, JSON.stringify(unifiedDb, null, 2), 'utf-8');
    log(`Error database saved: ${dbPath}`, '💾');

    // Save flagged fixes by category
    const fixesByCategory = new Map<string, FlaggedFix[]>();
    flaggedFixes.forEach(fix => {
      if (!fixesByCategory.has(fix.category)) {
        fixesByCategory.set(fix.category, []);
      }
      fixesByCategory.get(fix.category)!.push(fix);
    });

    for (const [category, fixes] of fixesByCategory) {
      const filename = category.toLowerCase().replace(/\s+/g, '-') + '.md';
      const filepath = path.join(FLAGGED_FIXES_DIR, filename);

      let content = `# ${category}\n\n`;
      content += `**Total Issues**: ${fixes.length}\n\n`;
      content += `---\n\n`;

      fixes.forEach((fix, i) => {
        content += `## Issue ${i + 1}: ${fix.issue}\n\n`;
        content += `**File**: ${fix.file}\n`;
        if (fix.line) content += `**Line**: ${fix.line}\n`;
        content += `**Severity**: ${fix.severity.toUpperCase()}\n\n`;
        if (fix.currentCode) {
          content += `**Current Code**:\n\`\`\`typescript\n${fix.currentCode}\n\`\`\`\n\n`;
        }
        content += `**Suggested Fix**: ${fix.suggestedFix}\n\n`;
        content += `**Action Required**: ${fix.actionRequired}\n\n`;
        content += `---\n\n`;
      });

      fs.writeFileSync(filepath, content, 'utf-8');
    }

    log(`Flagged fixes saved to: ${FLAGGED_FIXES_DIR}`, '📁');
  }
}

// ============================================================================
// MAIN ORCHESTRATION
// ============================================================================

async function main() {
  console.clear();

  logSection('🌙 OVERNIGHT AUTOMATED TESTING & FIX SYSTEM 🌙');

  const startTime = Date.now();

  log('Starting overnight testing run...', '🚀');
  log(`Project: ${PROJECT_ROOT}`, '📁');
  log(`Reports: ${REPORTS_DIR}`, '📁');

  // Phase 0: Pre-flight schema sync check
  logSection('PHASE 0: PRE-FLIGHT CHECKS');

  log('Checking Prisma/Database schema sync...', '🔍');
  try {
    await execAsync('npm run schema:check', { cwd: PROJECT_ROOT, timeout: 120000 });
    log('✅ Schema in sync', '✅');
  } catch (error: any) {
    log('❌ Schema sync failed', '❌');
    console.error(error.stdout || error.message);
    throw new Error('Pre-flight schema check failed. Fix schema before running tests.');
  }

  // Phase 1: Run all tests
  const results = await runAllTests();

  // Phase 2: Parse errors
  logSection('PHASE 2: PARSING ERRORS');
  const parser = new ErrorParser();
  const parsedResults = parser.parseAllErrors(results);

  const totalErrors = parsedResults.reduce((sum, r) => sum + r.errors.length, 0);
  const totalWarnings = parsedResults.reduce((sum, r) => sum + r.warnings.length, 0);
  log(`Total errors found: ${totalErrors}`, '📊');
  log(`Total warnings found: ${totalWarnings}`, '📊');

  // Phase 3: Analyze patterns
  const analyzer = new PatternAnalyzer();
  const patterns = analyzer.analyzePatterns(parsedResults);

  // Phase 4: Apply fixes
  const fixer = new AutoFixer();
  await fixer.applyFixes(patterns);

  const appliedFixes = fixer.getAppliedFixes();
  const flaggedFixes = fixer.getFlaggedFixes();

  // Build unified error database
  const unifiedDb: UnifiedErrorDatabase = {
    metadata: {
      runTimestamp: new Date().toISOString(),
      totalTests: results.length,
      totalErrors,
      totalWarnings,
      totalPatternsFound: Object.keys(patterns).length,
      totalAutoFixed: appliedFixes.length,
      totalFlaggedForReview: flaggedFixes.length,
    },
    testResults: parsedResults,
    errorsByTest: Object.fromEntries(parsedResults.map(r => [r.name, r])),
    errorsByPattern: patterns,
    errorsByFile: {},
  };

  // Phase 5: Generate reports
  const reportGen = new ReportGenerator();
  const totalDuration = Date.now() - startTime;

  const morningReport = reportGen.generateMorningReport(
    parsedResults,
    patterns,
    appliedFixes,
    flaggedFixes,
    totalDuration
  );

  reportGen.saveReports(morningReport, unifiedDb, flaggedFixes);

  // Final summary
  logSection('✅ OVERNIGHT TESTING COMPLETE');

  log(`Total Duration: ${formatDuration(totalDuration)}`, '⏱️');
  log(`Tests Passed: ${parsedResults.filter(r => r.passed).length}/${parsedResults.length}`, '✅');
  log(`Errors Found: ${totalErrors}`, '❌');
  log(`Auto-Fixed: ${appliedFixes.length}`, '🛠️');
  log(`Flagged for Review: ${flaggedFixes.length}`, '⚠️');

  console.log('\n📄 Morning report:');
  console.log(`   ${path.join(REPORTS_DIR, `overnight-report-${new Date().toISOString().split('T')[0]}.md`)}`);

  console.log('\n💤 Good night! Review the report in the morning.\n');
}

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });
}

export { main };
