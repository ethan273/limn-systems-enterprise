import { test, expect } from '@playwright/test';
import { login } from './helpers/auth-helper';
import { portalLogin } from './helpers/portal-auth-helper';
import { TEST_CONFIG } from './config/test-config';
import path from 'path';
import fs from 'fs';

/**
 * Responsive Design & Horizontal Scroll Detection Tests
 *
 * CRITICAL: Identifies horizontal scrolling issues on mobile
 * Captures screenshots showing UX problems with tables
 *
 * Tests all portal pages and main app pages for:
 * - Horizontal overflow detection
 * - Table responsiveness
 * - Mobile column visibility
 * - Touch-friendly layouts
 * - Viewport-specific issues
 */

test.describe('📐 RESPONSIVE DESIGN & HORIZONTAL SCROLL TESTS @responsive @mobile', () => {

  // Helper function to detect horizontal scroll
  async function detectHorizontalScroll(page: any) {
    return await page.evaluate(() => {
      const body = document.body;
      const html = document.documentElement;

      const scrollWidth = Math.max(
        body.scrollWidth,
        body.offsetWidth,
        html.clientWidth,
        html.scrollWidth,
        html.offsetWidth
      );

      const clientWidth = html.clientWidth;

      return {
        hasScroll: scrollWidth > clientWidth,
        scrollWidth,
        clientWidth,
        overflow: scrollWidth - clientWidth
      };
    });
  }

  // Helper to screenshot with scroll indicator
  async function screenshotWithScrollInfo(page: any, filename: string, scrollInfo: any) {
    await page.screenshot({
      path: path.join(TEST_CONFIG.SCREENSHOT_DIR, filename),
      fullPage: true
    });

    // Create a report file with scroll info
    const reportPath = path.join(TEST_CONFIG.SCREENSHOT_DIR, filename.replace('.png', '-scroll-info.json'));
    fs.writeFileSync(reportPath, JSON.stringify(scrollInfo, null, 2));
  }

  // ========================================
  // CUSTOMER PORTAL HORIZONTAL SCROLL CHECK
  // ========================================

  test.describe('Customer Portal - Horizontal Scroll Detection', () => {
    test.beforeEach(async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE
      await portalLogin(page, TEST_CONFIG.USER_EMAIL, TEST_CONFIG.USER_PASSWORD, 'customer');
    });

    test('Customer portal dashboard - no horizontal scroll', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.BASE_URL}/portal`);
      await page.waitForLoadState('domcontentloaded');

      const scrollInfo = await detectHorizontalScroll(page);

      await screenshotWithScrollInfo(page, 'responsive-customer-portal-dashboard.png', scrollInfo);

      // Dashboard should NOT have horizontal scroll
      if (scrollInfo.hasScroll) {
        console.warn(`⚠️ Horizontal scroll detected: ${scrollInfo.overflow}px overflow`);
      }

      expect(scrollInfo.overflow).toBeLessThan(5); // Allow 5px tolerance
    });

    test('Customer portal orders table - HORIZONTAL SCROLL EXPECTED', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.BASE_URL}/portal/orders`);
      await page.waitForLoadState('networkidle'); // Changed from domcontentloaded
      await page.waitForTimeout(3000); // Increased wait for rendering

      // Wait for table to fully render
      await page.waitForSelector('table', { timeout: 5000 }).catch(() => {});

      const scrollInfo = await detectHorizontalScroll(page);

      await screenshotWithScrollInfo(page, 'responsive-customer-portal-orders-TABLE.png', scrollInfo);

      // Table SHOULD have horizontal scroll (this is intentional for many columns)
      // But it should be contained in a scroll wrapper
      const hasScrollWrapper = await page.locator('[class*="overflow-x"]').count() > 0;

      // Either no overflow, or overflow is contained in wrapper
      if (scrollInfo.hasScroll && !hasScrollWrapper) {
        console.error(`❌ Table overflows without scroll wrapper! ${scrollInfo.overflow}px`);
        expect(hasScrollWrapper).toBeTruthy();
      }
    });

    test('Customer portal documents - no horizontal scroll', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.BASE_URL}/portal/documents`);
      await page.waitForLoadState('domcontentloaded');

      const scrollInfo = await detectHorizontalScroll(page);

      await screenshotWithScrollInfo(page, 'responsive-customer-portal-documents.png', scrollInfo);

      expect(scrollInfo.overflow).toBeLessThan(5);
    });

    test('Customer portal shipping - no horizontal scroll', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.BASE_URL}/portal/shipping`);
      await page.waitForLoadState('domcontentloaded');

      const scrollInfo = await detectHorizontalScroll(page);

      await screenshotWithScrollInfo(page, 'responsive-customer-portal-shipping.png', scrollInfo);

      expect(scrollInfo.overflow).toBeLessThan(5);
    });

    test('Customer portal financials - no horizontal scroll', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.BASE_URL}/portal/financials`);
      await page.waitForLoadState('networkidle'); // Changed from domcontentloaded
      await page.waitForTimeout(3000); // Increased wait for rendering

      // Wait for table to fully render
      await page.waitForSelector('table', { timeout: 5000 }).catch(() => {});

      const scrollInfo = await detectHorizontalScroll(page);

      await screenshotWithScrollInfo(page, 'responsive-customer-portal-financials.png', scrollInfo);

      expect(scrollInfo.overflow).toBeLessThan(5);
    });
  });

  // ========================================
  // MAIN APP LIST PAGES - HORIZONTAL SCROLL CHECK
  // ========================================

  test.describe('Main App List Pages - Horizontal Scroll Detection', () => {
    test.beforeEach(async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto(`${TEST_CONFIG.BASE_URL}/login`);
      await login(page, TEST_CONFIG.ADMIN_EMAIL, TEST_CONFIG.ADMIN_PASSWORD);
    });

    const pagesToTest = [
      { name: 'Tasks', url: '/tasks' },
      { name: 'CRM Leads', url: '/crm/leads' },
      { name: 'CRM Contacts', url: '/crm/contacts' },
      { name: 'CRM Clients', url: '/crm/clients' },
      { name: 'CRM Projects', url: '/crm/projects' },
      { name: 'Production Orders', url: '/production/orders' },
      { name: 'Products Catalog', url: '/products/catalog' },
      { name: 'Partners Designers', url: '/partners/designers' },
      { name: 'Partners Factories', url: '/partners/factories' },
    ];

    for (const pageInfo of pagesToTest) {
      test(`${pageInfo.name} - table scroll detection`, async ({ page }) => {
        await page.goto(`${TEST_CONFIG.BASE_URL}${pageInfo.url}`);
        await page.waitForLoadState('domcontentloaded');

        const scrollInfo = await detectHorizontalScroll(page);

        const filename = `responsive-${pageInfo.name.toLowerCase().replace(/ /g, '-')}.png`;
        await screenshotWithScrollInfo(page, filename, scrollInfo);

        // Check for table with scroll wrapper
        const hasTable = await page.locator('table').count() > 0;
        const hasScrollWrapper = await page.locator('[class*="overflow-x"]').count() > 0;

        if (hasTable && scrollInfo.hasScroll) {
          console.log(`📊 ${pageInfo.name}: Table has ${scrollInfo.overflow}px overflow`);

          // Table pages should have scroll wrapper
          if (!hasScrollWrapper) {
            console.error(`❌ ${pageInfo.name}: Table overflows without wrapper!`);
          }

          expect(hasScrollWrapper).toBeTruthy();
        }
      });
    }
  });

  // ========================================
  // DESIGNER PORTAL - HORIZONTAL SCROLL CHECK
  // ========================================

  test.describe('Designer Portal - Horizontal Scroll Detection', () => {
    test('Designer portal dashboard - no horizontal scroll', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto(`${TEST_CONFIG.BASE_URL}/portal/designer`);
      await page.waitForLoadState('domcontentloaded');

      const scrollInfo = await detectHorizontalScroll(page);

      await screenshotWithScrollInfo(page, 'responsive-designer-portal-dashboard.png', scrollInfo);

      expect(scrollInfo.overflow).toBeLessThan(5);
    });

    test('Designer portal projects - table scroll check', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto(`${TEST_CONFIG.BASE_URL}/portal/designer/projects`);
      await page.waitForLoadState('domcontentloaded');

      const scrollInfo = await detectHorizontalScroll(page);

      await screenshotWithScrollInfo(page, 'responsive-designer-portal-projects.png', scrollInfo);

      const hasScrollWrapper = await page.locator('[class*="overflow-x"]').count() > 0;

      if (scrollInfo.hasScroll && !hasScrollWrapper) {
        console.error(`❌ Designer projects: Table overflows without wrapper!`);
      }
    });
  });

  // ========================================
  // FACTORY PORTAL - HORIZONTAL SCROLL CHECK
  // ========================================

  test.describe('Factory Portal - Horizontal Scroll Detection', () => {
    test('Factory portal dashboard - no horizontal scroll', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto(`${TEST_CONFIG.BASE_URL}/portal/factory`);
      await page.waitForLoadState('domcontentloaded');

      const scrollInfo = await detectHorizontalScroll(page);

      await screenshotWithScrollInfo(page, 'responsive-factory-portal-dashboard.png', scrollInfo);

      expect(scrollInfo.overflow).toBeLessThan(5);
    });

    test('Factory portal orders - table scroll check', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto(`${TEST_CONFIG.BASE_URL}/portal/factory/orders`);
      await page.waitForLoadState('domcontentloaded');

      const scrollInfo = await detectHorizontalScroll(page);

      await screenshotWithScrollInfo(page, 'responsive-factory-portal-orders.png', scrollInfo);

      const hasScrollWrapper = await page.locator('[class*="overflow-x"]').count() > 0;

      if (scrollInfo.hasScroll && !hasScrollWrapper) {
        console.error(`❌ Factory orders: Table overflows without wrapper!`);
      }
    });
  });

  // ========================================
  // TABLET VIEWPORT TESTS
  // ========================================

  test.describe('Tablet Viewport Tests', () => {
    test.beforeEach(async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 }); // iPad
      await page.goto(`${TEST_CONFIG.BASE_URL}/login`);
      await login(page, TEST_CONFIG.ADMIN_EMAIL, TEST_CONFIG.ADMIN_PASSWORD);
    });

    test('Dashboard on tablet - no horizontal scroll', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.BASE_URL}/dashboard`);
      await page.waitForLoadState('domcontentloaded');

      const scrollInfo = await detectHorizontalScroll(page);

      await screenshotWithScrollInfo(page, 'responsive-tablet-dashboard.png', scrollInfo);

      expect(scrollInfo.overflow).toBeLessThan(5);
    });

    test('Tables on tablet - check column visibility', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.BASE_URL}/crm/leads`);
      await page.waitForLoadState('domcontentloaded');

      const scrollInfo = await detectHorizontalScroll(page);

      await screenshotWithScrollInfo(page, 'responsive-tablet-crm-leads.png', scrollInfo);

      // On tablet, more columns should be visible
      const hasTable = await page.locator('table').count() > 0;

      if (hasTable) {
        const visibleColumns = await page.locator('thead th:visible').count();
        console.log(`📊 Tablet view: ${visibleColumns} columns visible`);

        // Should show more columns than mobile
        expect(visibleColumns).toBeGreaterThan(3);
      }
    });
  });

  // ========================================
  // RESPONSIVE BREAKPOINT TESTS
  // ========================================

  test.describe('Responsive Breakpoints', () => {
    const breakpoints = [
      { name: 'Mobile Small', width: 320 },
      { name: 'Mobile Medium', width: 375 },
      { name: 'Mobile Large', width: 428 },
      { name: 'Tablet Small', width: 640 },
      { name: 'Tablet Medium', width: 768 },
      { name: 'Tablet Large', width: 1024 },
      { name: 'Desktop Small', width: 1280 },
      { name: 'Desktop Medium', width: 1440 },
      { name: 'Desktop Large', width: 1920 },
    ];

    for (const breakpoint of breakpoints) {
      test(`Dashboard at ${breakpoint.name} (${breakpoint.width}px)`, async ({ page }) => {
        await page.setViewportSize({ width: breakpoint.width, height: 800 });
        await page.goto(`${TEST_CONFIG.BASE_URL}/login`);
        await login(page, TEST_CONFIG.ADMIN_EMAIL, TEST_CONFIG.ADMIN_PASSWORD);

        await page.goto(`${TEST_CONFIG.BASE_URL}/dashboard`);
        await page.waitForLoadState('domcontentloaded');

        const scrollInfo = await detectHorizontalScroll(page);

        const filename = `responsive-breakpoint-${breakpoint.width}px.png`;
        await screenshotWithScrollInfo(page, filename, scrollInfo);

        // No horizontal scroll at any breakpoint
        if (scrollInfo.hasScroll) {
          console.warn(`⚠️ ${breakpoint.name}: ${scrollInfo.overflow}px overflow`);
        }

        expect(scrollInfo.overflow).toBeLessThan(5);
      });
    }
  });

  // ========================================
  // TABLE COLUMN HIDING ON MOBILE
  // ========================================

  test.describe('Table Column Visibility on Mobile', () => {
    test.beforeEach(async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto(`${TEST_CONFIG.BASE_URL}/login`);
      await login(page, TEST_CONFIG.ADMIN_EMAIL, TEST_CONFIG.ADMIN_PASSWORD);
    });

    test('Tables hide less important columns on mobile', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.BASE_URL}/crm/leads`);
      await page.waitForLoadState('domcontentloaded');

      const hasTable = await page.locator('table').count() > 0;

      if (hasTable) {
        // Count visible columns on mobile
        const mobileVisibleColumns = await page.locator('thead th:visible').count();

        // Now check desktop
        await page.setViewportSize({ width: 1920, height: 1080 });
        await page.reload();
        await page.waitForLoadState('domcontentloaded');

        const desktopVisibleColumns = await page.locator('thead th:visible').count();

        console.log(`Mobile columns: ${mobileVisibleColumns}, Desktop columns: ${desktopVisibleColumns}`);

        // Desktop should show more or equal columns
        expect(desktopVisibleColumns).toBeGreaterThanOrEqual(mobileVisibleColumns);

        // Mobile should show at least 2 columns
        expect(mobileVisibleColumns).toBeGreaterThanOrEqual(2);
      }
    });
  });

  // ========================================
  // COMPREHENSIVE HORIZONTAL SCROLL REPORT
  // ========================================

  test('Generate comprehensive horizontal scroll report', async ({ page }) => {
    const report: any[] = [];

    const pagesToCheck = [
      { category: 'Customer Portal', url: '/portal', name: 'Dashboard' },
      { category: 'Customer Portal', url: '/portal/orders', name: 'Orders' },
      { category: 'Customer Portal', url: '/portal/documents', name: 'Documents' },
      { category: 'Main App', url: '/dashboard', name: 'Dashboard', requiresAuth: true },
      { category: 'Main App', url: '/crm/leads', name: 'Leads', requiresAuth: true },
      { category: 'Main App', url: '/crm/contacts', name: 'Contacts', requiresAuth: true },
      { category: 'Main App', url: '/crm/projects', name: 'Projects', requiresAuth: true },
      { category: 'Main App', url: '/tasks', name: 'Tasks', requiresAuth: true },
      { category: 'Main App', url: '/production/orders', name: 'Production Orders', requiresAuth: true },
    ];

    await page.setViewportSize({ width: 375, height: 667 });

    for (const pageInfo of pagesToCheck) {
      try {
        if (pageInfo.requiresAuth) {
          await page.goto(`${TEST_CONFIG.BASE_URL}/login`);
          await login(page, TEST_CONFIG.ADMIN_EMAIL, TEST_CONFIG.ADMIN_PASSWORD);
        }

        await page.goto(`${TEST_CONFIG.BASE_URL}${pageInfo.url}`);
        await page.waitForLoadState('domcontentloaded', { timeout: 10000 });

        const scrollInfo = await detectHorizontalScroll(page);
        const hasScrollWrapper = await page.locator('[class*="overflow-x"]').count() > 0;
        const hasTable = await page.locator('table').count() > 0;

        report.push({
          category: pageInfo.category,
          page: pageInfo.name,
          url: pageInfo.url,
          hasHorizontalScroll: scrollInfo.hasScroll,
          overflowAmount: scrollInfo.overflow,
          hasScrollWrapper,
          hasTable,
          status: scrollInfo.hasScroll && !hasScrollWrapper ? '❌ ISSUE' : '✅ OK'
        });

      } catch (error) {
        report.push({
          category: pageInfo.category,
          page: pageInfo.name,
          url: pageInfo.url,
          error: 'Failed to load'
        });
      }
    }

    // Save report
    const reportPath = path.join(TEST_CONFIG.SCREENSHOT_DIR, 'horizontal-scroll-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

    // Create markdown report
    let markdown = '# Horizontal Scroll Analysis Report\n\n';
    markdown += `**Date:** ${new Date().toLocaleString()}\n`;
    markdown += `**Viewport:** 375x667 (iPhone SE)\n\n`;

    const issues = report.filter(r => r.status === '❌ ISSUE');
    const ok = report.filter(r => r.status === '✅ OK');

    markdown += `## Summary\n\n`;
    markdown += `- ✅ Pages OK: ${ok.length}\n`;
    markdown += `- ❌ Pages with Issues: ${issues.length}\n\n`;

    if (issues.length > 0) {
      markdown += `## 🚨 Pages with Horizontal Scroll Issues\n\n`;
      issues.forEach(issue => {
        markdown += `### ${issue.category} - ${issue.page}\n`;
        markdown += `- URL: ${issue.url}\n`;
        markdown += `- Overflow: ${issue.overflowAmount}px\n`;
        markdown += `- Has Table: ${issue.hasTable ? 'Yes' : 'No'}\n`;
        markdown += `- Has Scroll Wrapper: ${issue.hasScrollWrapper ? 'Yes' : 'No'}\n\n`;
      });
    }

    markdown += `## All Pages\n\n`;
    report.forEach(item => {
      markdown += `${item.status} **${item.category} - ${item.page}** (${item.overflowAmount || 0}px overflow)\n`;
    });

    const markdownPath = path.join(TEST_CONFIG.SCREENSHOT_DIR, 'horizontal-scroll-report.md');
    fs.writeFileSync(markdownPath, markdown);

    console.log(`\n📊 Horizontal Scroll Report Generated:`);
    console.log(`   - ${ok.length} pages OK`);
    console.log(`   - ${issues.length} pages with issues`);
    console.log(`   - Report: ${markdownPath}`);

    // Test should pass if no major issues
    expect(issues.length).toBeLessThan(5);
  });
});
