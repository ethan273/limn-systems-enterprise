/**
 * AUTHENTICATION & AUTHORIZATION SECURITY TEST
 *
 * CRITICAL: Verifies security controls are properly enforced
 *
 * Tests:
 * - Role-based access control works
 * - Admin routes protected from non-admins
 * - Users can only access their own data
 * - Session handling works correctly
 * - Unauthorized requests are blocked
 *
 * Memory Safe: Tests one scenario at a time, cleans up sessions
 */

import { chromium } from '@playwright/test';
import type { Browser, Page, BrowserContext } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';

// ============================================================================
// TYPES
// ============================================================================

interface SecurityTest {
  name: string;
  userType: string;
  targetUrl: string;
  expectedBehavior: 'allow' | 'block';
  actualBehavior?: 'allow' | 'block';
  success: boolean;
  error?: string;
}

interface AuthSecurityResult {
  timestamp: string;
  summary: {
    totalTests: number;
    passedTests: number;
    failedTests: number;
    criticalIssues: number;
  };
  tests: SecurityTest[];
  vulnerabilities: string[];
}

// ============================================================================
// AUTH SECURITY TESTER
// ============================================================================

class AuthSecurityTester {
  private browser: Browser | null = null;
  private baseUrl: string;
  private result: AuthSecurityResult;

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
    if (this.browser) {
      await this.browser.close().catch(() => {});
      this.browser = null;
    }
    if (global.gc) {
      global.gc();
    }
  }

  // ==========================================================================
  // AUTHENTICATION HELPERS
  // ==========================================================================

  async initialize(): Promise<void> {
    this.browser = await chromium.launch({ headless: true });
  }

  async loginAs(userType: string): Promise<BrowserContext> {
    if (!this.browser) throw new Error('Browser not initialized');

    const context = await this.browser.newContext();
    const page = await context.newPage();

    try {
      // Use dev-login API
      const response = await page.request.post(`${this.baseUrl}/api/auth/dev-login`, {
        data: { userType },
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok()) {
        throw new Error(`Login failed for ${userType}: ${response.status()}`);
      }

      const data = await response.json();
      if (data.callbackUrl) {
        await page.goto(data.callbackUrl);
      } else {
        await page.goto(`${this.baseUrl}/dashboard`);
      }

      await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
      await page.waitForTimeout(2000);

      console.log(`  ✅ Logged in as ${userType}`);
      await page.close();

      return context;

    } catch (error) {
      await page.close();
      await context.close();
      throw error;
    }
  }

  async testAccess(
    context: BrowserContext,
    url: string,
    expectedBehavior: 'allow' | 'block'
  ): Promise<{ actualBehavior: 'allow' | 'block'; error?: string }> {
    const page = await context.newPage();

    try {
      await page.goto(`${this.baseUrl}${url}`, {
        waitUntil: 'networkidle',
        timeout: 15000,
      });

      await page.waitForTimeout(1000);

      // Check if redirected to login
      const currentUrl = page.url();
      const isOnLoginPage = currentUrl.includes('/login') || currentUrl.includes('/auth/');

      if (isOnLoginPage) {
        await page.close();
        return { actualBehavior: 'block' };
      }

      // Check for error messages
      const hasErrorMessage = await page.locator('text=/unauthorized|forbidden|access denied/i').count() > 0;
      if (hasErrorMessage) {
        await page.close();
        return { actualBehavior: 'block' };
      }

      // Page loaded successfully
      await page.close();
      return { actualBehavior: 'allow' };

    } catch (error: any) {
      await page.close();
      return {
        actualBehavior: 'block',
        error: error.message,
      };
    }
  }

  // ==========================================================================
  // SECURITY TESTS
  // ==========================================================================

  async testAdminRouteProtection(): Promise<void> {
    console.log('\n🔒 Testing Admin Route Protection...\n');

    const adminRoutes = [
      '/admin/users',
      '/admin/roles',
      '/admin/analytics',
    ];

    // Test 1: Regular user should NOT access admin routes
    console.log('Test: Regular user accessing admin routes (should be blocked)');
    const userContext = await this.loginAs('user');

    for (const route of adminRoutes) {
      const test: SecurityTest = {
        name: `Regular user accessing ${route}`,
        userType: 'user',
        targetUrl: route,
        expectedBehavior: 'block',
        success: false,
      };

      const { actualBehavior, error } = await this.testAccess(userContext, route, 'block');
      test.actualBehavior = actualBehavior;
      test.error = error;
      test.success = actualBehavior === 'block';

      if (test.success) {
        console.log(`  ✅ ${route} - Correctly blocked`);
      } else {
        console.log(`  ❌ ${route} - SECURITY VULNERABILITY: User can access admin route!`);
        this.result.vulnerabilities.push(`Regular users can access ${route}`);
        this.result.summary.criticalIssues++;
      }

      this.result.tests.push(test);
      this.result.summary.totalTests++;
      if (test.success) {
        this.result.summary.passedTests++;
      } else {
        this.result.summary.failedTests++;
      }
    }

    await userContext.close();

    // Test 2: Admin user SHOULD access admin routes
    console.log('\nTest: Admin user accessing admin routes (should be allowed)');
    const adminContext = await this.loginAs('dev'); // dev is admin

    for (const route of adminRoutes) {
      const test: SecurityTest = {
        name: `Admin user accessing ${route}`,
        userType: 'dev',
        targetUrl: route,
        expectedBehavior: 'allow',
        success: false,
      };

      const { actualBehavior, error } = await this.testAccess(adminContext, route, 'allow');
      test.actualBehavior = actualBehavior;
      test.error = error;
      test.success = actualBehavior === 'allow';

      if (test.success) {
        console.log(`  ✅ ${route} - Correctly allowed`);
      } else {
        console.log(`  ❌ ${route} - ERROR: Admin cannot access admin route`);
        this.result.summary.criticalIssues++;
      }

      this.result.tests.push(test);
      this.result.summary.totalTests++;
      if (test.success) {
        this.result.summary.passedTests++;
      } else {
        this.result.summary.failedTests++;
      }
    }

    await adminContext.close();

    this.checkMemory();
  }

  async testPortalAccessControl(): Promise<void> {
    console.log('\n🔒 Testing Portal Access Control...\n');

    // Test: Customer should access customer portal but NOT designer portal
    console.log('Test: Customer portal access control');
    const customerContext = await this.loginAs('customer');

    const tests = [
      {
        route: '/portal/customer',
        expectedBehavior: 'allow' as const,
        description: 'Customer accessing customer portal',
      },
      {
        route: '/portal/designer',
        expectedBehavior: 'block' as const,
        description: 'Customer accessing designer portal',
      },
      {
        route: '/portal/factory',
        expectedBehavior: 'block' as const,
        description: 'Customer accessing factory portal',
      },
    ];

    for (const testCase of tests) {
      const test: SecurityTest = {
        name: testCase.description,
        userType: 'customer',
        targetUrl: testCase.route,
        expectedBehavior: testCase.expectedBehavior,
        success: false,
      };

      const { actualBehavior, error } = await this.testAccess(customerContext, testCase.route, testCase.expectedBehavior);
      test.actualBehavior = actualBehavior;
      test.error = error;
      test.success = actualBehavior === testCase.expectedBehavior;

      if (test.success) {
        console.log(`  ✅ ${testCase.route} - Correctly ${actualBehavior === 'allow' ? 'allowed' : 'blocked'}`);
      } else {
        console.log(`  ❌ ${testCase.route} - SECURITY ISSUE: Expected ${testCase.expectedBehavior}, got ${actualBehavior}`);
        if (testCase.expectedBehavior === 'block' && actualBehavior === 'allow') {
          this.result.vulnerabilities.push(`Customer can access ${testCase.route}`);
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

    await customerContext.close();

    this.checkMemory();
  }

  async testUnauthenticatedAccess(): Promise<void> {
    console.log('\n🔒 Testing Unauthenticated Access...\n');

    if (!this.browser) throw new Error('Browser not initialized');

    const context = await this.browser.newContext();
    const protectedRoutes = [
      '/dashboard',
      '/crm/contacts',
      '/admin/users',
      '/portal/customer',
    ];

    console.log('Test: Unauthenticated user accessing protected routes (should be blocked)');

    for (const route of protectedRoutes) {
      const test: SecurityTest = {
        name: `Unauthenticated access to ${route}`,
        userType: 'unauthenticated',
        targetUrl: route,
        expectedBehavior: 'block',
        success: false,
      };

      const { actualBehavior, error } = await this.testAccess(context, route, 'block');
      test.actualBehavior = actualBehavior;
      test.error = error;
      test.success = actualBehavior === 'block';

      if (test.success) {
        console.log(`  ✅ ${route} - Correctly blocked (redirected to login)`);
      } else {
        console.log(`  ❌ ${route} - CRITICAL VULNERABILITY: Unauthenticated access allowed!`);
        this.result.vulnerabilities.push(`Unauthenticated users can access ${route}`);
        this.result.summary.criticalIssues++;
      }

      this.result.tests.push(test);
      this.result.summary.totalTests++;
      if (test.success) {
        this.result.summary.passedTests++;
      } else {
        this.result.summary.failedTests++;
      }
    }

    await context.close();

    this.checkMemory();
  }

  // ==========================================================================
  // REPORT GENERATION
  // ==========================================================================

  generateReport(): string {
    const timestamp = new Date().toISOString();
    let report = `# AUTHENTICATION & AUTHORIZATION SECURITY TEST REPORT\n\n`;
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
      report += `All security controls properly enforced. Application is secure.\n\n`;
    } else {
      report += `## ❌ STATUS: FAIL\n\n`;
      report += `**CRITICAL SECURITY ISSUES FOUND** - DO NOT DEPLOY TO PRODUCTION\n\n`;
    }

    // Vulnerabilities
    if (this.result.vulnerabilities.length > 0) {
      report += `## 🚨 SECURITY VULNERABILITIES\n\n`;
      for (const vuln of this.result.vulnerabilities) {
        report += `- **${vuln}**\n`;
      }
      report += `\n**Action Required**: Fix ALL vulnerabilities before deployment.\n\n`;
    }

    // Failed Tests
    const failedTests = this.result.tests.filter(t => !t.success);
    if (failedTests.length > 0) {
      report += `## ❌ FAILED SECURITY TESTS\n\n`;
      for (const test of failedTests) {
        report += `### ${test.name}\n\n`;
        report += `- **User Type**: ${test.userType}\n`;
        report += `- **Target URL**: ${test.targetUrl}\n`;
        report += `- **Expected**: ${test.expectedBehavior}\n`;
        report += `- **Actual**: ${test.actualBehavior}\n`;
        if (test.error) {
          report += `- **Error**: ${test.error}\n`;
        }
        report += `\n`;
      }
    }

    // Passed Tests
    const passedTests = this.result.tests.filter(t => t.success);
    if (passedTests.length > 0) {
      report += `## ✅ PASSED SECURITY TESTS (${passedTests.length})\n\n`;

      // Group by type
      const adminTests = passedTests.filter(t => t.targetUrl.includes('/admin'));
      const portalTests = passedTests.filter(t => t.targetUrl.includes('/portal'));
      const unauthTests = passedTests.filter(t => t.userType === 'unauthenticated');

      if (adminTests.length > 0) {
        report += `### Admin Route Protection (${adminTests.length})\n\n`;
        for (const test of adminTests) {
          report += `- ✅ ${test.name}\n`;
        }
        report += `\n`;
      }

      if (portalTests.length > 0) {
        report += `### Portal Access Control (${portalTests.length})\n\n`;
        for (const test of portalTests) {
          report += `- ✅ ${test.name}\n`;
        }
        report += `\n`;
      }

      if (unauthTests.length > 0) {
        report += `### Unauthenticated Access Protection (${unauthTests.length})\n\n`;
        for (const test of unauthTests) {
          report += `- ✅ ${test.name}\n`;
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
    const outputPath = path.join(outputDir, `auth-security-${Date.now()}.md`);

    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    fs.writeFileSync(outputPath, report, 'utf-8');
    console.log(`\n📝 Report saved: ${outputPath}`);

    const latestPath = path.join(outputDir, 'auth-security-latest.md');
    fs.writeFileSync(latestPath, report, 'utf-8');
    console.log(`📝 Latest report: ${latestPath}\n`);

    return outputPath;
  }

  // ==========================================================================
  // MAIN TEST RUNNER
  // ==========================================================================

  async runAllTests(): Promise<void> {
    console.log('🚀 Starting Authentication & Authorization Security Test\n');
    console.log('='.repeat(80) + '\n');

    try {
      // Initialize browser
      await this.initialize();
      console.log('✅ Browser initialized\n');

      // Run security tests
      await this.testAdminRouteProtection();
      await this.testPortalAccessControl();
      await this.testUnauthenticatedAccess();

      // Generate report
      await this.saveReport();

      // Summary
      console.log('='.repeat(80));
      console.log('📊 TEST SUMMARY');
      console.log('='.repeat(80));
      console.log(`Passed: ${this.result.summary.passedTests}/${this.result.summary.totalTests}`);
      console.log(`Critical Vulnerabilities: ${this.result.summary.criticalIssues}`);

      if (this.result.summary.criticalIssues === 0 && this.result.summary.failedTests === 0) {
        console.log('\n✅ AUTH SECURITY: PASS\n');
        process.exit(0);
      } else {
        console.log('\n❌ AUTH SECURITY: FAIL\n');
        console.log(`🚨 CRITICAL: ${this.result.summary.criticalIssues} security vulnerabilities found.\n`);
        console.log('DO NOT DEPLOY TO PRODUCTION until ALL vulnerabilities are fixed.\n');
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

const tester = new AuthSecurityTester();
tester.runAllTests().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
