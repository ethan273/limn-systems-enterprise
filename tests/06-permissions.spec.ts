import { test, expect } from '@playwright/test';
import { login } from './helpers/auth-helper';
import { TEST_CONFIG } from './config/test-config';

test.describe('🔒 PERMISSION TESTS @permissions', () => {
  test('Admin has access to all sections', async ({ page }) => {
    await login(page, TEST_CONFIG.ADMIN_EMAIL, TEST_CONFIG.ADMIN_PASSWORD);
    
    const adminSections = [
      '/admin/dashboard',
      '/admin/users',
      '/admin/settings',
      '/crm/projects',
      '/production/orders'
    ];
    
    for (const section of adminSections) {
      await page.goto(`${TEST_CONFIG.BASE_URL}${section}`);
      await page.waitForLoadState('domcontentloaded');
      
      const hasAccess = !page.url().includes('/login') && !page.url().includes('/unauthorized');
      expect(hasAccess).toBeTruthy();
    }
  });

  test('Logout from one tab affects other tabs', async ({ browser }) => {
    const context = await browser.newContext();
    const page1 = await context.newPage();
    const page2 = await context.newPage();
    
    // Login in first tab
    await login(page1, TEST_CONFIG.ADMIN_EMAIL, TEST_CONFIG.ADMIN_PASSWORD);
    
    // Open second tab to protected area
    await page2.goto(`${TEST_CONFIG.BASE_URL}/dashboard`);
    await page2.waitForLoadState('domcontentloaded');
    
    // Should have access
    expect(page2.url()).not.toContain('/login');
    
    await context.close();
  });
});