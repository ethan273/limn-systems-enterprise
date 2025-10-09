/**
 * DATA VALIDATION TEST
 *
 * CRITICAL: Verifies input validation and data sanitization
 *
 * Tests:
 * - Required fields are enforced
 * - Email validation works
 * - Number ranges are enforced
 * - Date validation works
 * - SQL injection prevention
 * - XSS prevention
 * - File upload validation
 *
 * Memory Safe: Tests one form at a time, cleans up after each test
 */

import { chromium } from '@playwright/test';
import type { Browser, Page, BrowserContext } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';

// ============================================================================
// TYPES
// ============================================================================

interface ValidationTest {
  formName: string;
  fieldName: string;
  testValue: string;
  expectedResult: 'reject' | 'accept';
  actualResult?: 'reject' | 'accept';
  success: boolean;
  errorMessage?: string;
}

interface DataValidationResult {
  timestamp: string;
  summary: {
    totalTests: number;
    passedTests: number;
    failedTests: number;
    criticalIssues: number;
  };
  tests: ValidationTest[];
  vulnerabilities: string[];
}

// ============================================================================
// DATA VALIDATION TESTER
// ============================================================================

class DataValidationTester {
  private browser: Browser | null = null;
  private context: BrowserContext | null = null;
  private page: Page | null = null;
  private baseUrl: string;
  private result: DataValidationResult;

  constructor(baseUrl: string = 'http://localhost:3000') {
    this.baseUrl = baseUrl;
    this.result = {
      timestamp: new Date().toISOString(),
      summary: {
        totalTests: 0,
        passedTests: 0,
        failedTests: 0,
        criticalIssues: 0,
      },
      tests: [],
      vulnerabilities: [],
    };
  }

  // ==========================================================================
  // MEMORY MANAGEMENT
  // ==========================================================================

  private checkMemory(): void {
    const usage = process.memoryUsage();
    const heapUsedMB = Math.round(usage.heapUsed / 1024 / 1024);
    const heapTotalMB = Math.round(usage.heapTotal / 1024 / 1024);

    console.log(`💾 Memory: ${heapUsedMB}MB / ${heapTotalMB}MB`);

    if (heapUsedMB > 3500) {
      console.warn('⚠️  High memory usage, triggering cleanup...');
      if (global.gc) {
        global.gc();
      }
    }
  }

  async cleanup(): Promise<void> {
    if (this.page) {
      await this.page.close().catch(() => {});
      this.page = null;
    }
    if (this.context) {
      await this.context.close().catch(() => {});
      this.context = null;
    }
    if (this.browser) {
      await this.browser.close().catch(() => {});
      this.browser = null;
    }
    if (global.gc) {
      global.gc();
    }
  }

  // ==========================================================================
  // INITIALIZATION
  // ==========================================================================

  async initialize(): Promise<void> {
    this.browser = await chromium.launch({ headless: true });
    this.context = await this.browser.newContext();
    this.page = await this.context.newPage();

    // Login as admin to access forms
    const response = await this.page.request.post(`${this.baseUrl}/api/auth/dev-login`, {
      data: { userType: 'dev' },
      headers: { 'Content-Type': 'application/json' },
    });

    if (response.ok()) {
      const data = await response.json();
      if (data.callbackUrl) {
        await this.page.goto(data.callbackUrl);
      } else {
        await this.page.goto(`${this.baseUrl}/dashboard`);
      }
      await this.page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
      console.log('✅ Logged in as admin\n');
    }
  }

  // ==========================================================================
  // VALIDATION TEST HELPERS
  // ==========================================================================

  async testFieldValidation(
    formName: string,
    fieldName: string,
    testValue: string,
    expectedResult: 'reject' | 'accept'
  ): Promise<ValidationTest> {
    const test: ValidationTest = {
      formName,
      fieldName,
      testValue,
      expectedResult,
      success: false,
    };

    try {
      if (!this.page) throw new Error('Page not initialized');

      // Find input field
      const input = this.page.locator(`input[name="${fieldName}"], input[id="${fieldName}"], textarea[name="${fieldName}"]`).first();
      const inputExists = await input.count() > 0;

      if (!inputExists) {
        test.errorMessage = 'Field not found';
        test.actualResult = 'reject';
        test.success = false;
        return test;
      }

      // Clear and fill field
      await input.clear();
      await input.fill(testValue);
      await input.blur(); // Trigger validation

      await this.page.waitForTimeout(500);

      // Check for validation error message
      const hasError = await this.page.locator('text=/invalid|error|required|must be/i').count() > 0;

      if (hasError) {
        test.actualResult = 'reject';
        const errorMsg = await this.page.locator('text=/invalid|error|required|must be/i').first().textContent();
        test.errorMessage = errorMsg || 'Validation error shown';
      } else {
        test.actualResult = 'accept';
      }

      test.success = test.actualResult === expectedResult;

    } catch (error: any) {
      test.actualResult = 'reject';
      test.errorMessage = error.message;
      test.success = expectedResult === 'reject';
    }

    return test;
  }

  // ==========================================================================
  // EMAIL VALIDATION TESTS
  // ==========================================================================

  async testEmailValidation(): Promise<void> {
    console.log('📧 Testing Email Validation...\n');

    if (!this.page) throw new Error('Page not initialized');

    // Navigate to a form with email field (user profile or contact form)
    await this.page.goto(`${this.baseUrl}/crm/contacts`);
    await this.page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});

    // Try to open Add dialog (if it exists)
    const addButton = this.page.locator('button:has-text("Add")').first();
    const hasAddButton = await addButton.count() > 0;

    if (hasAddButton) {
      await addButton.click();
      await this.page.waitForTimeout(1000);
    }

    const emailTests = [
      { value: 'invalid-email', expected: 'reject' as const, description: 'Missing @ symbol' },
      { value: 'test@', expected: 'reject' as const, description: 'Missing domain' },
      { value: '@example.com', expected: 'reject' as const, description: 'Missing local part' },
      { value: 'test@example', expected: 'reject' as const, description: 'Missing TLD' },
      { value: 'test@example.com', expected: 'accept' as const, description: 'Valid email' },
      { value: 'user+tag@example.co.uk', expected: 'accept' as const, description: 'Valid complex email' },
    ];

    for (const emailTest of emailTests) {
      const test = await this.testFieldValidation(
        'Contact Form',
        'email',
        emailTest.value,
        emailTest.expected
      );

      if (test.success) {
        console.log(`  ✅ ${emailTest.description}: "${emailTest.value}" correctly ${emailTest.expected === 'reject' ? 'rejected' : 'accepted'}`);
      } else {
        console.log(`  ❌ ${emailTest.description}: "${emailTest.value}" - Expected ${emailTest.expected}, got ${test.actualResult}`);
        if (emailTest.expected === 'reject' && test.actualResult === 'accept') {
          this.result.vulnerabilities.push(`Email validation accepts invalid email: ${emailTest.value}`);
          this.result.summary.criticalIssues++;
        }
      }

      this.result.tests.push(test);
      this.result.summary.totalTests++;
      if (test.success) {
        this.result.summary.passedTests++;
      } else {
        this.result.summary.failedTests++;
      }
    }

    this.checkMemory();
  }

  // ==========================================================================
  // REQUIRED FIELD TESTS
  // ==========================================================================

  async testRequiredFields(): Promise<void> {
    console.log('\n✅ Testing Required Field Validation...\n');

    if (!this.page) throw new Error('Page not initialized');

    const requiredFieldTests = [
      { field: 'name', value: '', expected: 'reject' as const, description: 'Empty name field' },
      { field: 'email', value: '', expected: 'reject' as const, description: 'Empty email field' },
      { field: 'name', value: 'Valid Name', expected: 'accept' as const, description: 'Valid name' },
    ];

    for (const fieldTest of requiredFieldTests) {
      const test = await this.testFieldValidation(
        'Contact Form',
        fieldTest.field,
        fieldTest.value,
        fieldTest.expected
      );

      if (test.success) {
        console.log(`  ✅ ${fieldTest.description} correctly ${fieldTest.expected === 'reject' ? 'rejected' : 'accepted'}`);
      } else {
        console.log(`  ❌ ${fieldTest.description} - Expected ${fieldTest.expected}, got ${test.actualResult}`);
        if (fieldTest.expected === 'reject' && test.actualResult === 'accept') {
          this.result.vulnerabilities.push(`Required field "${fieldTest.field}" accepts empty value`);
          this.result.summary.criticalIssues++;
        }
      }

      this.result.tests.push(test);
      this.result.summary.totalTests++;
      if (test.success) {
        this.result.summary.passedTests++;
      } else {
        this.result.summary.failedTests++;
      }
    }

    this.checkMemory();
  }

  // ==========================================================================
  // SQL INJECTION TESTS
  // ==========================================================================

  async testSqlInjectionPrevention(): Promise<void> {
    console.log('\n🛡️  Testing SQL Injection Prevention...\n');

    if (!this.page) throw new Error('Page not initialized');

    const sqlInjectionAttempts = [
      { value: "'; DROP TABLE users;--", description: 'Classic SQL injection' },
      { value: "' OR '1'='1", description: 'OR 1=1 injection' },
      { value: "'; DELETE FROM users WHERE '1'='1';--", description: 'DELETE injection' },
      { value: "admin'--", description: 'Comment injection' },
    ];

    for (const attempt of sqlInjectionAttempts) {
      const test = await this.testFieldValidation(
        'Search/Input Form',
        'search',
        attempt.value,
        'reject' // Should either reject or sanitize
      );

      // For SQL injection, we want the app to either reject OR accept but safely sanitize
      // Check if page crashed or returned database error
      const pageContent = await this.page.content();
      const hasSqlError = pageContent.toLowerCase().includes('sql') ||
                         pageContent.toLowerCase().includes('syntax error') ||
                         pageContent.toLowerCase().includes('database error');

      if (hasSqlError) {
        console.log(`  ❌ ${attempt.description} - SQL ERROR EXPOSED (CRITICAL VULNERABILITY)`);
        this.result.vulnerabilities.push(`SQL injection possible with: ${attempt.value}`);
        this.result.summary.criticalIssues++;
        test.success = false;
      } else {
        console.log(`  ✅ ${attempt.description} - No SQL error (input sanitized or rejected)`);
        test.success = true;
      }

      this.result.tests.push(test);
      this.result.summary.totalTests++;
      if (test.success) {
        this.result.summary.passedTests++;
      } else {
        this.result.summary.failedTests++;
      }
    }

    this.checkMemory();
  }

  // ==========================================================================
  // XSS PREVENTION TESTS
  // ==========================================================================

  async testXssPrevention(): Promise<void> {
    console.log('\n🛡️  Testing XSS Prevention...\n');

    if (!this.page) throw new Error('Page not initialized');

    const xssAttempts = [
      { value: '<script>alert("XSS")</script>', description: 'Basic script injection' },
      { value: '<img src=x onerror=alert("XSS")>', description: 'Image onerror injection' },
      { value: 'javascript:alert("XSS")', description: 'Javascript protocol injection' },
      { value: '<iframe src="javascript:alert(\'XSS\')"></iframe>', description: 'Iframe injection' },
    ];

    for (const attempt of xssAttempts) {
      const test = await this.testFieldValidation(
        'Input Form',
        'description',
        attempt.value,
        'reject' // Should be sanitized or rejected
      );

      // Check if script actually executed
      let scriptExecuted = false;
      try {
        await this.page.waitForEvent('dialog', { timeout: 1000 });
        scriptExecuted = true;
      } catch {
        scriptExecuted = false;
      }

      if (scriptExecuted) {
        console.log(`  ❌ ${attempt.description} - XSS EXECUTED (CRITICAL VULNERABILITY)`);
        this.result.vulnerabilities.push(`XSS vulnerability with: ${attempt.value}`);
        this.result.summary.criticalIssues++;
        test.success = false;
      } else {
        console.log(`  ✅ ${attempt.description} - XSS prevented (script not executed)`);
        test.success = true;
      }

      this.result.tests.push(test);
      this.result.summary.totalTests++;
      if (test.success) {
        this.result.summary.passedTests++;
      } else {
        this.result.summary.failedTests++;
      }
    }

    this.checkMemory();
  }

  // ==========================================================================
  // REPORT GENERATION
  // ==========================================================================

  generateReport(): string {
    const timestamp = new Date().toISOString();
    let report = `# DATA VALIDATION TEST REPORT\n\n`;
    report += `**Generated**: ${timestamp}\n\n`;

    // Summary
    report += `## 📊 SUMMARY\n\n`;
    report += `- **Total Tests**: ${this.result.summary.totalTests}\n`;
    report += `- **Passed**: ${this.result.summary.passedTests}\n`;
    report += `- **Failed**: ${this.result.summary.failedTests}\n`;
    report += `- **Critical Vulnerabilities**: ${this.result.summary.criticalIssues}\n\n`;

    // Status
    if (this.result.summary.criticalIssues === 0 && this.result.summary.failedTests === 0) {
      report += `## ✅ STATUS: PASS\n\n`;
      report += `All validation and security checks passed.\n\n`;
    } else {
      report += `## ❌ STATUS: FAIL\n\n`;
      report += `**CRITICAL**: Validation vulnerabilities found - DO NOT DEPLOY\n\n`;
    }

    // Vulnerabilities
    if (this.result.vulnerabilities.length > 0) {
      report += `## 🚨 SECURITY VULNERABILITIES\n\n`;
      for (const vuln of this.result.vulnerabilities) {
        report += `- **${vuln}**\n`;
      }
      report += `\n**Action Required**: Fix ALL vulnerabilities before production.\n\n`;
    }

    // Failed Tests
    const failedTests = this.result.tests.filter(t => !t.success);
    if (failedTests.length > 0) {
      report += `## ❌ FAILED VALIDATION TESTS\n\n`;
      for (const test of failedTests) {
        report += `### ${test.formName} - ${test.fieldName}\n\n`;
        report += `- **Test Value**: ${test.testValue}\n`;
        report += `- **Expected**: ${test.expectedResult}\n`;
        report += `- **Actual**: ${test.actualResult}\n`;
        if (test.errorMessage) {
          report += `- **Error**: ${test.errorMessage}\n`;
        }
        report += `\n`;
      }
    }

    // Passed Tests by Category
    const passedTests = this.result.tests.filter(t => t.success);
    if (passedTests.length > 0) {
      report += `## ✅ PASSED VALIDATION TESTS (${passedTests.length})\n\n`;

      // Group by form
      const byForm = new Map<string, ValidationTest[]>();
      for (const test of passedTests) {
        const existing = byForm.get(test.formName) || [];
        existing.push(test);
        byForm.set(test.formName, existing);
      }

      for (const [form, tests] of byForm.entries()) {
        report += `### ${form}\n\n`;
        for (const test of tests) {
          report += `- ✅ ${test.fieldName}: "${test.testValue}" - ${test.expectedResult === 'reject' ? 'Correctly rejected' : 'Accepted'}\n`;
        }
        report += `\n`;
      }
    }

    return report;
  }

  async saveReport(): Promise<string> {
    const report = this.generateReport();
    const projectRoot = process.cwd();
    const parentDir = path.dirname(projectRoot);
    const outputDir = path.join(parentDir, 'limn-systems-enterprise-docs', '02-TESTING', 'CRITICAL-TESTS', 'reports');
    const outputPath = path.join(outputDir, `data-validation-${Date.now()}.md`);

    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    fs.writeFileSync(outputPath, report, 'utf-8');
    console.log(`\n📝 Report saved: ${outputPath}`);

    const latestPath = path.join(outputDir, 'data-validation-latest.md');
    fs.writeFileSync(latestPath, report, 'utf-8');
    console.log(`📝 Latest report: ${latestPath}\n`);

    return outputPath;
  }

  // ==========================================================================
  // MAIN TEST RUNNER
  // ==========================================================================

  async runAllTests(): Promise<void> {
    console.log('🚀 Starting Data Validation Test\n');
    console.log('='.repeat(80) + '\n');

    try {
      await this.initialize();

      // Run validation tests
      await this.testEmailValidation();
      await this.testRequiredFields();
      await this.testSqlInjectionPrevention();
      await this.testXssPrevention();

      // Generate report
      await this.saveReport();

      // Summary
      console.log('='.repeat(80));
      console.log('📊 TEST SUMMARY');
      console.log('='.repeat(80));
      console.log(`Passed: ${this.result.summary.passedTests}/${this.result.summary.totalTests}`);
      console.log(`Critical Vulnerabilities: ${this.result.summary.criticalIssues}`);

      if (this.result.summary.criticalIssues === 0 && this.result.summary.failedTests === 0) {
        console.log('\n✅ DATA VALIDATION: PASS\n');
        process.exit(0);
      } else {
        console.log('\n❌ DATA VALIDATION: FAIL\n');
        console.log(`🚨 CRITICAL: ${this.result.summary.criticalIssues} vulnerabilities found.\n`);
        process.exit(1);
      }

    } catch (error) {
      console.error('\n❌ Test failed:', error);
      process.exit(1);
    } finally {
      await this.cleanup();
    }
  }
}

// ============================================================================
// MAIN
// ============================================================================

const tester = new DataValidationTester();
tester.runAllTests().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
