/**
 * Comprehensive Console Error Auditing Script
 *
 * Systematically visits every page in the application and captures:
 * - JavaScript errors
 * - Console warnings
 * - Network failures
 * - React errors
 * - tRPC errors
 *
 * Generates a comprehensive report grouped by error type for holistic fixes.
 */

import { chromium } from '@playwright/test';
import type { Browser, Page } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';

// Base URL
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

// All routes in the application (organized by module)
const ROUTES = {
  auth: [
    '/login',
    '/auth/dev',
    '/auth/employee',
    '/auth/customer',
    '/auth/contractor',
  ],
  dashboard: [
    '/dashboard',
    '/offline',
  ],
  crm: [
    '/crm/contacts',
    '/crm/customers',
    '/crm/leads',
    '/crm/projects',
    '/crm/prospects',
  ],
  production: [
    '/production/orders',
    '/production/qc',
  ],
  products: [
    '/products/catalog',
    '/products/concepts',
    '/products/prototypes',
  ],
  design: [
    '/design/briefs',
    '/design/projects',
    '/design/moodboards',
  ],
  shipping: [
    '/shipping/shipments',
  ],
  financials: [
    '/financials/invoices',
    '/financials/payments',
  ],
  documents: [
    '/documents',
  ],
  tasks: [
    '/tasks',
    '/tasks/kanban',
  ],
  admin: [
    '/admin/users',
    '/admin/roles',
    '/admin/analytics',
  ],
  settings: [
    '/settings',
  ],
  portals: [
    '/portal/login',
    '/portal/customer',
    '/portal/designer',
    '/portal/factory',
  ],
};

// Error tracking structures
interface ConsoleMessage {
  type: 'error' | 'warning' | 'log';
  text: string;
  location?: string;
  timestamp: number;
}

interface NetworkError {
  url: string;
  status: number;
  statusText: string;
  method: string;
}

interface PageAudit {
  route: string;
  module: string;
  visited: boolean;
  timestamp: string;
  consoleErrors: ConsoleMessage[];
  consoleWarnings: ConsoleMessage[];
  networkErrors: NetworkError[];
  loadTime: number;
}

interface ErrorPattern {
  pattern: string;
  count: number;
  affectedPages: string[];
  severity: 'critical' | 'high' | 'medium' | 'low';
  category: 'tRPC' | 'React' | 'Network' | 'Database' | 'Auth' | 'Other';
}

// Main audit class
class ConsoleErrorAuditor {
  private browser: Browser | null = null;
  private page: Page | null = null;
  private audits: PageAudit[] = [];
  private errorPatterns: Map<string, ErrorPattern> = new Map();

  async initialize() {
    console.log('🚀 Initializing browser...');
    this.browser = await chromium.launch({ headless: true });
    const context = await this.browser.newContext();
    this.page = await context.newPage();

    // Setup console message listener
    this.page.on('console', (msg) => {
      const type = msg.type();
      if (type === 'error' || type === 'warning') {
        // Store for current page audit
        const currentAudit = this.audits[this.audits.length - 1];
        if (currentAudit) {
          const message: ConsoleMessage = {
            type: type as 'error' | 'warning',
            text: msg.text(),
            location: msg.location()?.url,
            timestamp: Date.now(),
          };

          if (type === 'error') {
            currentAudit.consoleErrors.push(message);
          } else {
            currentAudit.consoleWarnings.push(message);
          }
        }
      }
    });

    // Setup network error listener
    this.page.on('response', async (response) => {
      if (response.status() >= 400) {
        const currentAudit = this.audits[this.audits.length - 1];
        if (currentAudit) {
          currentAudit.networkErrors.push({
            url: response.url(),
            status: response.status(),
            statusText: response.statusText(),
            method: response.request().method(),
          });
        }
      }
    });
  }

  async loginAsAdmin() {
    console.log('🔐 Logging in as admin via UI flow...');

    // Go to login page
    await this.page!.goto(`${BASE_URL}/login`);
    await this.page!.waitForLoadState('domcontentloaded');

    // Click "Development Login" button
    try {
      await this.page!.click('button:has-text("Development Login")', { timeout: 5000 });
    } catch (e) {
      console.log('⚠️  Could not find Development Login button, trying direct dev auth...');
      await this.page!.goto(`${BASE_URL}/auth/dev`);
    }

    await this.page!.waitForLoadState('domcontentloaded');
    await this.page!.waitForTimeout(1000);

    // Look for any "Dev" or "Login" button on auth/dev page
    const devButtons = await this.page!.locator('button').all();
    if (devButtons.length > 0) {
      await devButtons[0].click(); // Click first button (usually "Login as Dev User")
      await this.page!.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
      await this.page!.waitForTimeout(3000);
    }

    // Verify we're logged in
    const url = this.page!.url();
    if (url.includes('/login') || url.includes('/auth')) {
      console.log('⚠️  Could not login automatically. Please login manually in the browser.');
      console.log('   The audit will wait 30 seconds for manual login...');
      await this.page!.waitForTimeout(30000);
    }

    console.log('✅ Logged in successfully');
  }

  async auditRoute(route: string, module: string): Promise<PageAudit> {
    const startTime = Date.now();

    const audit: PageAudit = {
      route,
      module,
      visited: false,
      timestamp: new Date().toISOString(),
      consoleErrors: [],
      consoleWarnings: [],
      networkErrors: [],
      loadTime: 0,
    };

    this.audits.push(audit);

    try {
      console.log(`📄 Auditing: ${route}`);

      // Navigate to page
      await this.page!.goto(`${BASE_URL}${route}`, {
        waitUntil: 'networkidle',
        timeout: 30000,
      });

      // Wait for page to be interactive
      await this.page!.waitForLoadState('domcontentloaded');

      // Give React time to render and tRPC queries to complete
      await this.page!.waitForTimeout(3000);

      audit.visited = true;
      audit.loadTime = Date.now() - startTime;

      console.log(`  ✅ Visited (${audit.loadTime}ms)`);
      console.log(`  📊 Errors: ${audit.consoleErrors.length}, Warnings: ${audit.consoleWarnings.length}, Network: ${audit.networkErrors.length}`);

    } catch (error) {
      console.log(`  ❌ Failed to visit: ${error}`);
      audit.visited = false;
    }

    return audit;
  }

  async auditAllRoutes() {
    console.log('\n🔍 Starting comprehensive audit...\n');

    for (const [module, routes] of Object.entries(ROUTES)) {
      console.log(`\n📦 Module: ${module.toUpperCase()}`);

      for (const route of routes) {
        await this.auditRoute(route, module);
      }
    }

    console.log('\n✅ Audit complete!\n');
  }

  analyzeErrorPatterns() {
    console.log('🔬 Analyzing error patterns...\n');

    for (const audit of this.audits) {
      // Analyze console errors
      for (const error of audit.consoleErrors) {
        this.categorizeError(error.text, audit.route);
      }

      // Analyze network errors
      for (const netError of audit.networkErrors) {
        const errorText = `HTTP ${netError.status}: ${netError.method} ${netError.url}`;
        this.categorizeError(errorText, audit.route);
      }
    }
  }

  private categorizeError(errorText: string, route: string) {
    // Extract pattern from error
    let pattern = errorText;
    let category: ErrorPattern['category'] = 'Other';
    let severity: ErrorPattern['severity'] = 'medium';

    // Detect tRPC errors
    if (errorText.includes('tRPC failed') || errorText.includes('No procedure found')) {
      category = 'tRPC';
      severity = 'high';
      // Extract procedure name
      const match = errorText.match(/(?:tRPC failed on|No procedure found on path "?)([\w.]+)/);
      if (match) {
        pattern = `Missing tRPC procedure: ${match[1]}`;
      }
    }
    // Detect database errors
    else if (errorText.includes('fetch failed') || errorText.includes('DB ERROR')) {
      category = 'Database';
      severity = 'critical';
      pattern = 'Database connection failure';
    }
    // Detect auth errors
    else if (errorText.includes('UNAUTHORIZED') || errorText.includes('rate limit')) {
      category = 'Auth';
      severity = 'high';
      if (errorText.includes('rate limit')) {
        pattern = 'Supabase rate limit exceeded';
      }
    }
    // Detect React errors
    else if (errorText.includes('React') || errorText.includes('Hydration')) {
      category = 'React';
      severity = 'medium';
    }
    // Detect network errors
    else if (errorText.includes('HTTP')) {
      category = 'Network';
      const match = errorText.match(/HTTP (\d+)/);
      if (match) {
        const status = parseInt(match[1]);
        severity = status >= 500 ? 'critical' : status >= 400 ? 'high' : 'medium';
      }
    }

    // Update or create pattern
    const existing = this.errorPatterns.get(pattern);
    if (existing) {
      existing.count++;
      if (!existing.affectedPages.includes(route)) {
        existing.affectedPages.push(route);
      }
    } else {
      this.errorPatterns.set(pattern, {
        pattern,
        count: 1,
        affectedPages: [route],
        severity,
        category,
      });
    }
  }

  generateReport(): string {
    const timestamp = new Date().toISOString();
    let report = `# CONSOLE ERROR AUDIT REPORT\n\n`;
    report += `**Generated**: ${timestamp}\n`;
    report += `**Pages Audited**: ${this.audits.length}\n`;
    report += `**Successfully Visited**: ${this.audits.filter(a => a.visited).length}\n\n`;

    // Summary statistics
    const totalErrors = this.audits.reduce((sum, a) => sum + a.consoleErrors.length, 0);
    const totalWarnings = this.audits.reduce((sum, a) => sum + a.consoleWarnings.length, 0);
    const totalNetworkErrors = this.audits.reduce((sum, a) => sum + a.networkErrors.length, 0);

    report += `## 📊 SUMMARY\n\n`;
    report += `- **Total Console Errors**: ${totalErrors}\n`;
    report += `- **Total Warnings**: ${totalWarnings}\n`;
    report += `- **Total Network Errors**: ${totalNetworkErrors}\n`;
    report += `- **Unique Error Patterns**: ${this.errorPatterns.size}\n\n`;

    // Error patterns by severity
    const patterns = Array.from(this.errorPatterns.values()).sort((a, b) => {
      const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      return severityOrder[a.severity] - severityOrder[b.severity] || b.count - a.count;
    });

    report += `---\n\n## 🔥 ERROR PATTERNS (By Severity)\n\n`;

    const bySeverity = {
      critical: patterns.filter(p => p.severity === 'critical'),
      high: patterns.filter(p => p.severity === 'high'),
      medium: patterns.filter(p => p.severity === 'medium'),
      low: patterns.filter(p => p.severity === 'low'),
    };

    for (const [severity, items] of Object.entries(bySeverity)) {
      if (items.length === 0) continue;

      const icon = severity === 'critical' ? '🚨' : severity === 'high' ? '⚠️' : severity === 'medium' ? '⚡' : '💡';
      report += `### ${icon} ${severity.toUpperCase()} (${items.length} patterns)\n\n`;

      for (const pattern of items) {
        report += `#### \`${pattern.category}\` - ${pattern.pattern}\n`;
        report += `- **Occurrences**: ${pattern.count}\n`;
        report += `- **Affected Pages**: ${pattern.affectedPages.length}\n`;
        report += `  - ${pattern.affectedPages.slice(0, 5).join(', ')}${pattern.affectedPages.length > 5 ? ` (+${pattern.affectedPages.length - 5} more)` : ''}\n\n`;
      }
    }

    // Pages with most errors
    report += `---\n\n## 📄 PAGES WITH MOST ERRORS\n\n`;
    const pagesByErrors = [...this.audits]
      .filter(a => a.visited)
      .sort((a, b) => {
        const aTotal = a.consoleErrors.length + a.networkErrors.length;
        const bTotal = b.consoleErrors.length + b.networkErrors.length;
        return bTotal - aTotal;
      })
      .slice(0, 10);

    for (const audit of pagesByErrors) {
      const total = audit.consoleErrors.length + audit.networkErrors.length;
      if (total === 0) continue;

      report += `### ${audit.route} (${audit.module})\n`;
      report += `- **Console Errors**: ${audit.consoleErrors.length}\n`;
      report += `- **Network Errors**: ${audit.networkErrors.length}\n`;
      report += `- **Warnings**: ${audit.consoleWarnings.length}\n`;
      report += `- **Load Time**: ${audit.loadTime}ms\n\n`;
    }

    // Detailed error breakdown by category
    report += `---\n\n## 🏷️ ERRORS BY CATEGORY\n\n`;
    const byCategory = new Map<string, ErrorPattern[]>();
    for (const pattern of patterns) {
      const existing = byCategory.get(pattern.category) || [];
      existing.push(pattern);
      byCategory.set(pattern.category, existing);
    }

    for (const [category, items] of byCategory.entries()) {
      report += `### ${category} (${items.length} patterns, ${items.reduce((sum, p) => sum + p.count, 0)} total errors)\n\n`;

      for (const pattern of items) {
        report += `- **${pattern.pattern}** - ${pattern.count} occurrences across ${pattern.affectedPages.length} pages\n`;
      }
      report += `\n`;
    }

    // Recommendations
    report += `---\n\n## 💡 RECOMMENDED FIXES\n\n`;

    if (bySeverity.critical.length > 0) {
      report += `### 1. CRITICAL ISSUES (Fix Immediately)\n\n`;
      for (const pattern of bySeverity.critical) {
        report += `- **${pattern.pattern}**\n`;
        if (pattern.category === 'Database') {
          report += `  - Check database connection configuration\n`;
          report += `  - Verify Supabase service is running\n`;
          report += `  - Check for network connectivity issues\n`;
        }
        report += `\n`;
      }
    }

    if (bySeverity.high.length > 0) {
      report += `### 2. HIGH PRIORITY ISSUES\n\n`;

      const trpcErrors = bySeverity.high.filter(p => p.category === 'tRPC');
      if (trpcErrors.length > 0) {
        report += `#### Missing tRPC Procedures (${trpcErrors.length} procedures)\n\n`;
        report += `These procedures are being called but don't exist in the API router:\n\n`;
        report += `\`\`\`typescript\n`;
        report += `// Add these procedures to src/server/api/routers/*.ts:\n\n`;
        for (const pattern of trpcErrors.slice(0, 10)) {
          const procedureName = pattern.pattern.replace('Missing tRPC procedure: ', '');
          report += `${procedureName}: publicProcedure\n`;
          report += `  .input(z.object({ /* your schema */ }))\n`;
          report += `  .query(async ({ input }) => {\n`;
          report += `    // Implementation\n`;
          report += `  }),\n\n`;
        }
        report += `\`\`\`\n\n`;
      }

      const authErrors = bySeverity.high.filter(p => p.category === 'Auth');
      if (authErrors.length > 0) {
        report += `#### Authentication Issues\n\n`;
        for (const pattern of authErrors) {
          report += `- **${pattern.pattern}**: ${pattern.count} occurrences\n`;
          if (pattern.pattern.includes('rate limit')) {
            report += `  - Implement session caching (similar to test warmup pattern)\n`;
            report += `  - Use file-based session storage for development\n`;
          }
          report += `\n`;
        }
      }
    }

    report += `---\n\n## 📋 NEXT STEPS\n\n`;
    report += `1. **Review Critical Issues** - Address database/connection failures immediately\n`;
    report += `2. **Implement Missing Procedures** - Add ${bySeverity.high.filter(p => p.category === 'tRPC').length} missing tRPC procedures\n`;
    report += `3. **Fix Auth Rate Limiting** - Implement session caching if applicable\n`;
    report += `4. **Review Medium Priority** - Address remaining issues systematically\n`;
    report += `5. **Re-run Audit** - Verify fixes resolved issues\n\n`;

    report += `---\n\n## 🔄 RE-RUN THIS AUDIT\n\n`;
    report += `\`\`\`bash\n`;
    report += `npx ts-node scripts/audit-console-errors.ts\n`;
    report += `\`\`\`\n\n`;

    report += `**Audit completed**: ${timestamp}\n`;

    return report;
  }

  async saveReport() {
    const report = this.generateReport();
    // Go up one level from project root to find docs folder
    const projectRoot = process.cwd();
    const parentDir = path.dirname(projectRoot);
    const outputDir = path.join(parentDir, 'limn-systems-enterprise-docs', '02-TESTING', 'console-errors');
    const outputPath = path.join(outputDir, `console-error-audit-${Date.now()}.md`);

    // Create directory if it doesn't exist
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    fs.writeFileSync(outputPath, report, 'utf-8');
    console.log(`\n📝 Report saved to: ${outputPath}`);

    // Also save latest
    const latestPath = path.join(outputDir, 'latest-audit.md');
    fs.writeFileSync(latestPath, report, 'utf-8');
    console.log(`📝 Latest report: ${latestPath}\n`);

    return outputPath;
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close();
    }
  }
}

// Main execution
async function main() {
  const auditor = new ConsoleErrorAuditor();

  try {
    await auditor.initialize();
    await auditor.loginAsAdmin();
    await auditor.auditAllRoutes();
    auditor.analyzeErrorPatterns();
    await auditor.saveReport();
  } catch (error) {
    console.error('❌ Audit failed:', error);
    process.exit(1);
  } finally {
    await auditor.cleanup();
  }

  console.log('✅ Audit complete!');
  process.exit(0);
}

main();
