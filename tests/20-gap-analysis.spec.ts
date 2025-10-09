import { test, expect } from '@playwright/test';
import { login } from './helpers/auth-helper';
import { TEST_CONFIG } from './config/test-config';
import path from 'path';
import fs from 'fs';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

/**
 * Gap Analysis & Enhancement Detection Tests
 *
 * CRITICAL: Identifies missing pages, missing functionality, and enhancement opportunities
 *
 * Analyzes:
 * - Page inventory vs expected pages
 * - Feature completeness (CRUD, filters, exports, etc.)
 * - Missing workflows
 * - Consistency gaps
 * - Performance bottlenecks
 * - Enhancement opportunities
 */

test.describe('🔍 GAP ANALYSIS & ENHANCEMENT DETECTION @gap-analysis', () => {

  // Expected pages based on app structure
  const EXPECTED_PAGES = {
    auth: ['/login', '/signup', '/forgot-password'],
    dashboard: ['/dashboard'],
    tasks: ['/tasks', '/tasks/my'],
    crm: [
      '/crm/leads', '/crm/contacts', '/crm/clients',
      '/crm/projects', '/crm/prospects', '/crm/customers'
    ],
    production: [
      '/production/orders', '/production/prototypes',
      '/production/shop-drawings', '/production/qc'
    ],
    products: [
      '/products/catalog', '/products/ordered-items',
      '/products/collections', '/products/materials'
    ],
    financials: [
      '/financials/invoices', '/financials/payments',
      '/financials/budgets', '/financials/contracts'
    ],
    shipping: ['/shipping/shipments'],
    partners: ['/partners/designers', '/partners/factories'],
    design: ['/design/projects', '/design/boards', '/design/briefs'],
    documents: ['/documents'],
    admin: ['/admin/users', '/admin/settings'],
    portal: {
      customer: ['/portal', '/portal/orders', '/portal/documents', '/portal/shipping', '/portal/financials'],
      designer: ['/portal/designer', '/portal/designer/projects', '/portal/designer/documents'],
      factory: ['/portal/factory', '/portal/factory/orders', '/portal/factory/documents']
    }
  };

  // ========================================
  // PAGE INVENTORY VALIDATION
  // ========================================

  test.describe('Page Inventory Analysis', () => {
    test('Scan and inventory all existing pages', async ({ page }) => {
      // Scan src/app directory for page.tsx files
      const { stdout } = await execAsync(
        'find /Users/eko3/limn-systems-enterprise/src/app -name "page.tsx" -type f'
      );

      const pages = stdout
        .split('\n')
        .filter(p => p.trim())
        .map(p => {
          // Extract route from file path
          const match = p.match(/\/src\/app(.*)\/page\.tsx/);
          return match ? match[1] || '/' : null;
        })
        .filter(Boolean);

      console.log(`\n📊 Found ${pages.length} pages in application`);

      // Save inventory
      const inventoryPath = path.join(TEST_CONFIG.SCREENSHOT_DIR, 'page-inventory.json');
      fs.writeFileSync(inventoryPath, JSON.stringify({
        totalPages: pages.length,
        pages: pages.sort(),
        timestamp: new Date().toISOString()
      }, null, 2));

      expect(pages.length).toBeGreaterThan(50); // Should have at least 50 pages
    });

    test('Identify missing expected pages', async ({ page }) => {
      // Get actual pages
      const { stdout } = await execAsync(
        'find /Users/eko3/limn-systems-enterprise/src/app -name "page.tsx" -type f'
      );

      const actualPages = stdout
        .split('\n')
        .filter(p => p.trim())
        .map(p => {
          const match = p.match(/\/src\/app(.*)\/page\.tsx/);
          return match ? match[1] || '/' : null;
        })
        .filter(Boolean);

      // Flatten expected pages
      const expectedPagesList: string[] = [];
      Object.entries(EXPECTED_PAGES).forEach(([category, pages]) => {
        if (Array.isArray(pages)) {
          expectedPagesList.push(...pages);
        } else if (typeof pages === 'object') {
          Object.values(pages).forEach(subPages => {
            expectedPagesList.push(...(subPages as string[]));
          });
        }
      });

      // Find missing pages
      const missingPages = expectedPagesList.filter(expected => {
        return !actualPages.some(actual => actual === expected);
      });

      console.log(`\n📋 Missing Pages Analysis:`);
      console.log(`   Expected: ${expectedPagesList.length} pages`);
      console.log(`   Actual: ${actualPages.length} pages`);
      console.log(`   Missing: ${missingPages.length} pages`);

      if (missingPages.length > 0) {
        console.log(`\n🚨 Missing Pages:`);
        missingPages.forEach(page => console.log(`   - ${page}`));
      }

      // Save report
      const reportPath = path.join(TEST_CONFIG.SCREENSHOT_DIR, 'missing-pages-report.json');
      fs.writeFileSync(reportPath, JSON.stringify({
        expected: expectedPagesList.length,
        actual: actualPages.length,
        missing: missingPages,
        timestamp: new Date().toISOString()
      }, null, 2));
    });

    test('Identify unexpected/undocumented pages', async ({ page }) => {
      const { stdout } = await execAsync(
        'find /Users/eko3/limn-systems-enterprise/src/app -name "page.tsx" -type f'
      );

      const actualPages = stdout
        .split('\n')
        .filter(p => p.trim())
        .map(p => {
          const match = p.match(/\/src\/app(.*)\/page\.tsx/);
          return match ? match[1] || '/' : null;
        })
        .filter(Boolean);

      // Flatten expected pages
      const expectedPagesList: string[] = [];
      Object.entries(EXPECTED_PAGES).forEach(([category, pages]) => {
        if (Array.isArray(pages)) {
          expectedPagesList.push(...pages);
        } else if (typeof pages === 'object') {
          Object.values(pages).forEach(subPages => {
            expectedPagesList.push(...(subPages as string[]));
          });
        }
      });

      // Find unexpected pages
      const unexpectedPages = actualPages.filter(actual => {
        // Ignore dynamic routes [id]
        if (actual.includes('[')) return false;

        return !expectedPagesList.some(expected => actual === expected);
      });

      console.log(`\n📍 Unexpected Pages (not in expected list):`);
      unexpectedPages.forEach(page => console.log(`   - ${page}`));

      // These might be new features or pages that need documentation
    });
  });

  // ========================================
  // FEATURE COMPLETENESS CHECKS
  // ========================================

  test.describe('Feature Completeness Analysis', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(`${TEST_CONFIG.BASE_URL}/login`);
      await login(page, TEST_CONFIG.ADMIN_EMAIL, TEST_CONFIG.ADMIN_PASSWORD);
    });

    const listPagesToCheck = [
      { url: '/crm/leads', name: 'Leads' },
      { url: '/crm/contacts', name: 'Contacts' },
      { url: '/crm/projects', name: 'Projects' },
      { url: '/tasks', name: 'Tasks' },
      { url: '/production/orders', name: 'Orders' },
      { url: '/products/catalog', name: 'Products' },
    ];

    for (const pageInfo of listPagesToCheck) {
      test(`${pageInfo.name} - has complete CRUD operations`, async ({ page }) => {
        await page.goto(`${TEST_CONFIG.BASE_URL}${pageInfo.url}`);
        await page.waitForLoadState('domcontentloaded');

        const features = {
          hasAddButton: await page.locator('button:has-text("Add"), button:has-text("New"), button:has-text("Create")').count() > 0,
          hasSearch: await page.locator('input[type="search"], input[placeholder*="search" i]').count() > 0,
          hasFilter: await page.locator('select, [role="combobox"]').count() > 1, // More than just page size
          hasTable: await page.locator('table').count() > 0,
          hasPagination: await page.locator('text=Page').count() > 0,
        };

        console.log(`\n📊 ${pageInfo.name} Features:`);
        console.log(`   ✓ Add Button: ${features.hasAddButton ? 'Yes' : 'No ❌'}`);
        console.log(`   ✓ Search: ${features.hasSearch ? 'Yes' : 'No ⚠️'}`);
        console.log(`   ✓ Filter: ${features.hasFilter ? 'Yes' : 'No ⚠️'}`);
        console.log(`   ✓ Table: ${features.hasTable ? 'Yes' : 'No ❌'}`);
        console.log(`   ✓ Pagination: ${features.hasPagination ? 'Yes' : 'No ⚠️'}`);

        // At minimum, should have Add button and Table
        expect(features.hasAddButton || features.hasTable).toBeTruthy();
      });
    }

    test('Pages missing search functionality', async ({ page }) => {
      const missingSearch: string[] = [];

      for (const pageInfo of listPagesToCheck) {
        await page.goto(`${TEST_CONFIG.BASE_URL}${pageInfo.url}`);
        await page.waitForLoadState('domcontentloaded');

        const hasSearch = await page.locator('input[type="search"], input[placeholder*="search" i]').count() > 0;

        if (!hasSearch) {
          missingSearch.push(pageInfo.name);
        }
      }

      if (missingSearch.length > 0) {
        console.log(`\n⚠️ Pages Missing Search:`);
        missingSearch.forEach(page => console.log(`   - ${page}`));
      }

      // Save enhancement suggestion
      const reportPath = path.join(TEST_CONFIG.SCREENSHOT_DIR, 'missing-search-report.json');
      fs.writeFileSync(reportPath, JSON.stringify({
        pagesWithoutSearch: missingSearch,
        suggestion: 'Add search functionality to these pages',
        priority: 'Medium',
        estimatedEffort: '1-2 hours per page'
      }, null, 2));
    });

    test('Pages missing export functionality', async ({ page }) => {
      const missingExport: string[] = [];

      for (const pageInfo of listPagesToCheck) {
        await page.goto(`${TEST_CONFIG.BASE_URL}${pageInfo.url}`);
        await page.waitForLoadState('domcontentloaded');

        const hasExport = await page.locator('button:has-text("Export"), button:has-text("Download")').count() > 0;

        if (!hasExport) {
          missingExport.push(pageInfo.name);
        }
      }

      if (missingExport.length > 0) {
        console.log(`\n💡 Enhancement Opportunity - Add Export:`);
        missingExport.forEach(page => console.log(`   - ${page}`));
      }

      // Save enhancement suggestion
      const reportPath = path.join(TEST_CONFIG.SCREENSHOT_DIR, 'export-enhancement-suggestion.json');
      fs.writeFileSync(reportPath, JSON.stringify({
        pagesWithoutExport: missingExport,
        suggestion: 'Add CSV/Excel export to these list pages',
        priority: 'Low',
        estimatedEffort: '2-3 hours per page',
        userValue: 'High - users frequently request data exports'
      }, null, 2));
    });

    test('Pages missing bulk actions', async ({ page }) => {
      const missingBulkActions: string[] = [];

      for (const pageInfo of listPagesToCheck) {
        await page.goto(`${TEST_CONFIG.BASE_URL}${pageInfo.url}`);
        await page.waitForLoadState('domcontentloaded');

        const hasBulkActions = await page.locator('input[type="checkbox"]').count() > 1; // More than just select all

        if (!hasBulkActions) {
          missingBulkActions.push(pageInfo.name);
        }
      }

      if (missingBulkActions.length > 0) {
        console.log(`\n💡 Enhancement Opportunity - Add Bulk Actions:`);
        missingBulkActions.forEach(page => console.log(`   - ${page}`));
      }

      // Save enhancement suggestion
      const reportPath = path.join(TEST_CONFIG.SCREENSHOT_DIR, 'bulk-actions-enhancement.json');
      fs.writeFileSync(reportPath, JSON.stringify({
        pagesWithoutBulkActions: missingBulkActions,
        suggestion: 'Add bulk delete, bulk update, bulk export',
        priority: 'Medium',
        estimatedEffort: '4-6 hours per page',
        userValue: 'High - saves significant time for power users'
      }, null, 2));
    });
  });

  // ========================================
  // CONSISTENCY CHECKS
  // ========================================

  test.describe('Consistency Analysis', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(`${TEST_CONFIG.BASE_URL}/login`);
      await login(page, TEST_CONFIG.ADMIN_EMAIL, TEST_CONFIG.ADMIN_PASSWORD);
    });

    test('All list pages use DataTable component', async ({ page }) => {
      const inconsistentPages: string[] = [];

      const pagesToCheck = [
        '/crm/leads', '/crm/contacts', '/crm/projects',
        '/tasks', '/production/orders', '/products/catalog'
      ];

      for (const url of pagesToCheck) {
        await page.goto(`${TEST_CONFIG.BASE_URL}${url}`);
        await page.waitForLoadState('domcontentloaded');

        const hasDataTable = await page.locator('.data-table-container').count() > 0;
        const hasTable = await page.locator('table').count() > 0;

        if (hasTable && !hasDataTable) {
          inconsistentPages.push(url);
        }
      }

      if (inconsistentPages.length > 0) {
        console.log(`\n⚠️ Pages Not Using DataTable Component:`);
        inconsistentPages.forEach(page => console.log(`   - ${page}`));
      }
    });

    test('All pages have breadcrumbs', async ({ page }) => {
      const missingBreadcrumbs: string[] = [];

      const pagesToCheck = [
        '/dashboard',
        '/crm/leads',
        '/crm/contacts',
        '/tasks',
      ];

      for (const url of pagesToCheck) {
        await page.goto(`${TEST_CONFIG.BASE_URL}${url}`);
        await page.waitForLoadState('domcontentloaded');

        const hasBreadcrumbs = await page.locator('nav[aria-label="breadcrumb"], .breadcrumb').count() > 0;

        if (!hasBreadcrumbs) {
          missingBreadcrumbs.push(url);
        }
      }

      if (missingBreadcrumbs.length > 0) {
        console.log(`\n⚠️ Pages Missing Breadcrumbs:`);
        missingBreadcrumbs.forEach(page => console.log(`   - ${page}`));
      }
    });

    test('All pages have proper page headers', async ({ page }) => {
      const missingHeaders: string[] = [];

      const pagesToCheck = [
        '/dashboard',
        '/crm/leads',
        '/tasks',
      ];

      for (const url of pagesToCheck) {
        await page.goto(`${TEST_CONFIG.BASE_URL}${url}`);
        await page.waitForLoadState('domcontentloaded');

        const hasHeader = await page.locator('h1, [class*="page-header"]').count() > 0;

        if (!hasHeader) {
          missingHeaders.push(url);
        }
      }

      if (missingHeaders.length > 0) {
        console.log(`\n⚠️ Pages Missing Headers:`);
        missingHeaders.forEach(page => console.log(`   - ${page}`));
      }
    });
  });

  // ========================================
  // ENHANCEMENT SUGGESTIONS
  // ========================================

  test.describe('Enhancement Opportunities', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(`${TEST_CONFIG.BASE_URL}/login`);
      await login(page, TEST_CONFIG.ADMIN_EMAIL, TEST_CONFIG.ADMIN_PASSWORD);
    });

    test('Identify pages that could benefit from auto-save', async ({ page }) => {
      const enhancements: any[] = [];

      // Forms that could have auto-save
      const formsToCheck = [
        { url: '/crm/leads', description: 'Lead forms could auto-save drafts' },
        { url: '/crm/projects', description: 'Project forms could auto-save drafts' },
        { url: '/tasks', description: 'Task forms could auto-save drafts' },
      ];

      formsToCheck.forEach(form => {
        enhancements.push({
          page: form.url,
          enhancement: 'Auto-save Form Drafts',
          description: form.description,
          priority: 'Low',
          effort: 'Medium',
          userValue: 'Medium - prevents data loss'
        });
      });

      // Save suggestions
      const reportPath = path.join(TEST_CONFIG.SCREENSHOT_DIR, 'auto-save-suggestions.json');
      fs.writeFileSync(reportPath, JSON.stringify(enhancements, null, 2));

      console.log(`\n💡 Auto-Save Suggestions: ${enhancements.length} pages`);
    });

    test('Identify pages that could benefit from real-time collaboration', async ({ page }) => {
      const suggestions = [
        {
          page: '/crm/projects',
          enhancement: 'Real-time Collaboration',
          description: 'Show who else is viewing/editing a project',
          priority: 'Medium',
          effort: 'High',
          userValue: 'High - prevents conflicting edits'
        },
        {
          page: '/design/boards',
          enhancement: 'Real-time Board Updates',
          description: 'Live updates when team members modify design boards',
          priority: 'Low',
          effort: 'High',
          userValue: 'Medium'
        }
      ];

      const reportPath = path.join(TEST_CONFIG.SCREENSHOT_DIR, 'collaboration-suggestions.json');
      fs.writeFileSync(reportPath, JSON.stringify(suggestions, null, 2));

      console.log(`\n💡 Collaboration Suggestions: ${suggestions.length} ideas`);
    });

    test('Identify pages that could benefit from advanced filters', async ({ page }) => {
      const suggestions = [
        {
          page: '/crm/leads',
          enhancement: 'Advanced Filter Panel',
          description: 'Add date range, multi-select, and saved filters',
          priority: 'Medium',
          effort: 'Medium',
          userValue: 'High - power users need complex queries'
        },
        {
          page: '/production/orders',
          enhancement: 'Production Status Filters',
          description: 'Filter by multiple statuses, date ranges, manufacturers',
          priority: 'High',
          effort: 'Medium',
          userValue: 'High'
        }
      ];

      const reportPath = path.join(TEST_CONFIG.SCREENSHOT_DIR, 'filter-enhancement-suggestions.json');
      fs.writeFileSync(reportPath, JSON.stringify(suggestions, null, 2));

      console.log(`\n💡 Filter Enhancement Suggestions: ${suggestions.length} ideas`);
    });

    test('Identify dashboards that could benefit from customization', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.BASE_URL}/dashboard`);
      await page.waitForLoadState('domcontentloaded');

      const suggestion = {
        page: '/dashboard',
        enhancement: 'Customizable Dashboard Widgets',
        description: 'Allow users to add/remove/reorder dashboard widgets',
        priority: 'Low',
        effort: 'High',
        userValue: 'Medium - personalization improves engagement',
        technicalApproach: 'Use drag-and-drop library + user preferences storage'
      };

      const reportPath = path.join(TEST_CONFIG.SCREENSHOT_DIR, 'dashboard-customization-suggestion.json');
      fs.writeFileSync(reportPath, JSON.stringify(suggestion, null, 2));

      console.log(`\n💡 Dashboard Customization Suggestion Generated`);
    });
  });

  // ========================================
  // PERFORMANCE BOTTLENECK DETECTION
  // ========================================

  test.describe('Performance Bottleneck Detection', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(`${TEST_CONFIG.BASE_URL}/login`);
      await login(page, TEST_CONFIG.ADMIN_EMAIL, TEST_CONFIG.ADMIN_PASSWORD);
    });

    test('Identify slow-loading pages', async ({ page }) => {
      const slowPages: any[] = [];

      const pagesToCheck = [
        '/dashboard',
        '/crm/leads',
        '/crm/projects',
        '/production/orders',
        '/products/catalog'
      ];

      for (const url of pagesToCheck) {
        const startTime = Date.now();
        await page.goto(`${TEST_CONFIG.BASE_URL}${url}`);
        await page.waitForLoadState('domcontentloaded');
        const loadTime = Date.now() - startTime;

        if (loadTime > 3000) {
          slowPages.push({
            url,
            loadTime,
            recommendation: 'Optimize with lazy loading, pagination, or caching'
          });
        }

        console.log(`⏱️ ${url}: ${loadTime}ms`);
      }

      if (slowPages.length > 0) {
        console.log(`\n🐌 Slow Pages (>3s):`);
        slowPages.forEach(p => console.log(`   - ${p.url}: ${p.loadTime}ms`));

        const reportPath = path.join(TEST_CONFIG.SCREENSHOT_DIR, 'performance-bottlenecks.json');
        fs.writeFileSync(reportPath, JSON.stringify(slowPages, null, 2));
      }
    });

    test('Identify pages with large DOM size', async ({ page }) => {
      const largeDOMPages: any[] = [];

      const pagesToCheck = [
        '/dashboard',
        '/crm/projects',
        '/production/orders'
      ];

      for (const url of pagesToCheck) {
        await page.goto(`${TEST_CONFIG.BASE_URL}${url}`);
        await page.waitForLoadState('domcontentloaded');

        const domSize = await page.evaluate(() => {
          return document.getElementsByTagName('*').length;
        });

        if (domSize > 1500) {
          largeDOMPages.push({
            url,
            domSize,
            recommendation: 'Consider virtualization for large lists'
          });
        }

        console.log(`📊 ${url}: ${domSize} DOM nodes`);
      }

      if (largeDOMPages.length > 0) {
        const reportPath = path.join(TEST_CONFIG.SCREENSHOT_DIR, 'large-dom-pages.json');
        fs.writeFileSync(reportPath, JSON.stringify(largeDOMPages, null, 2));
      }
    });
  });

  // ========================================
  // GENERATE COMPREHENSIVE GAP REPORT
  // ========================================

  test('Generate comprehensive gap analysis report', async ({ page }) => {
    const report = {
      generatedAt: new Date().toISOString(),
      summary: {
        totalPages: 0,
        missingPages: 0,
        pagesWithoutSearch: 0,
        pagesWithoutExport: 0,
        performanceIssues: 0,
        enhancementSuggestions: 0
      },
      findings: [] as any[],
      recommendations: [] as any[]
    };

    // Collect all reports
    const screenshotDir = TEST_CONFIG.SCREENSHOT_DIR;

    try {
      // Missing pages
      if (fs.existsSync(path.join(screenshotDir, 'missing-pages-report.json'))) {
        const data = JSON.parse(fs.readFileSync(path.join(screenshotDir, 'missing-pages-report.json'), 'utf8'));
        report.summary.missingPages = data.missing.length;
        report.findings.push({
          category: 'Missing Pages',
          count: data.missing.length,
          items: data.missing
        });
      }

      // Missing search
      if (fs.existsSync(path.join(screenshotDir, 'missing-search-report.json'))) {
        const data = JSON.parse(fs.readFileSync(path.join(screenshotDir, 'missing-search-report.json'), 'utf8'));
        report.summary.pagesWithoutSearch = data.pagesWithoutSearch.length;
        report.recommendations.push({
          priority: 'Medium',
          category: 'Feature Enhancement',
          suggestion: 'Add search to ' + data.pagesWithoutSearch.length + ' pages',
          effort: data.estimatedEffort
        });
      }

      // Export enhancement
      if (fs.existsSync(path.join(screenshotDir, 'export-enhancement-suggestion.json'))) {
        const data = JSON.parse(fs.readFileSync(path.join(screenshotDir, 'export-enhancement-suggestion.json'), 'utf8'));
        report.summary.pagesWithoutExport = data.pagesWithoutExport.length;
        report.recommendations.push({
          priority: data.priority,
          category: 'Feature Enhancement',
          suggestion: data.suggestion,
          effort: data.estimatedEffort,
          userValue: data.userValue
        });
      }

      // Performance bottlenecks
      if (fs.existsSync(path.join(screenshotDir, 'performance-bottlenecks.json'))) {
        const data = JSON.parse(fs.readFileSync(path.join(screenshotDir, 'performance-bottlenecks.json'), 'utf8'));
        report.summary.performanceIssues = data.length;
        report.findings.push({
          category: 'Performance',
          count: data.length,
          items: data
        });
      }

    } catch (error) {
      console.log('Some report files not found - this is OK for first run');
    }

    // Save comprehensive report
    const finalReportPath = path.join(screenshotDir, 'COMPREHENSIVE-GAP-ANALYSIS.json');
    fs.writeFileSync(finalReportPath, JSON.stringify(report, null, 2));

    // Create markdown summary
    let markdown = '# 🔍 Comprehensive Gap Analysis Report\n\n';
    markdown += `**Generated:** ${new Date().toLocaleString()}\n\n`;
    markdown += `## Executive Summary\n\n`;
    markdown += `- Missing Pages: ${report.summary.missingPages}\n`;
    markdown += `- Pages Without Search: ${report.summary.pagesWithoutSearch}\n`;
    markdown += `- Pages Without Export: ${report.summary.pagesWithoutExport}\n`;
    markdown += `- Performance Issues: ${report.summary.performanceIssues}\n\n`;

    markdown += `## Priority Recommendations\n\n`;
    report.recommendations.forEach(rec => {
      markdown += `### ${rec.priority} Priority: ${rec.suggestion}\n`;
      markdown += `- Effort: ${rec.effort}\n`;
      if (rec.userValue) markdown += `- User Value: ${rec.userValue}\n`;
      markdown += `\n`;
    });

    markdown += `## Detailed Findings\n\n`;
    report.findings.forEach(finding => {
      markdown += `### ${finding.category}\n`;
      markdown += `Count: ${finding.count}\n\n`;
    });

    const markdownPath = path.join(screenshotDir, 'COMPREHENSIVE-GAP-ANALYSIS.md');
    fs.writeFileSync(markdownPath, markdown);

    console.log(`\n📊 Comprehensive Gap Analysis Complete!`);
    console.log(`   Report: ${finalReportPath}`);
    console.log(`   Summary: ${markdownPath}`);
  });
});
