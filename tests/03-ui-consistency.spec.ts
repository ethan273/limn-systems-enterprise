import { test, expect } from '@playwright/test';
import { login } from './helpers/auth-helper';
import { TEST_CONFIG } from './config/test-config';
import path from 'path';

test.describe('🎨 UI CONSISTENCY TESTS @ui', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, TEST_CONFIG.ADMIN_EMAIL, TEST_CONFIG.ADMIN_PASSWORD);
  });

  const pages = [
    { name: 'dashboard', path: '/dashboard' },
    { name: 'projects', path: '/crm/projects' },
    { name: 'contacts', path: '/crm/contacts' },
    { name: 'tasks', path: '/tasks' },
    { name: 'documents', path: '/documents' },
    { name: 'production-orders', path: '/production/orders' },
    { name: 'products-catalog', path: '/products/catalog' },
    { name: 'financials', path: '/financials/invoices' },
    { name: 'settings', path: '/settings' }
  ];

  for (const pageInfo of pages) {
    test(`Screenshot and validate ${pageInfo.name}`, async ({ page }) => {
      await page.goto(`${TEST_CONFIG.BASE_URL}${pageInfo.path}`);
      // Use domcontentloaded instead of networkidle to avoid hanging on polling/websockets
      await page.waitForLoadState('domcontentloaded');
      // Wait for the page to be interactive
      await page.waitForTimeout(1000);

      // Check for consistent header
      const header = await page.locator('header, [role="banner"], .navbar').first();      await expect(header).toBeVisible();

      // Check for consistent navigation
      const nav = await page.locator('nav, [role="navigation"], .sidebar').first();
      await expect(nav).toBeVisible();

      // Take screenshot
      await page.screenshot({
        path: path.join(TEST_CONFIG.SCREENSHOT_DIR, `ui-${pageInfo.name}.png`),
        fullPage: true
      });

      // Check for loading states are hidden
      const loaders = await page.locator('.loader, .loading, .spinner').count();
      expect(loaders).toBe(0);
    });
  }

  test('Responsive design - Mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(`${TEST_CONFIG.BASE_URL}/dashboard`);
    await page.waitForLoadState('domcontentloaded');
    
    // Check for mobile menu
    const mobileMenu = await page.locator('[aria-label*="menu" i], .hamburger, .menu-toggle').count();
    expect(mobileMenu).toBeGreaterThan(0);
  });
});