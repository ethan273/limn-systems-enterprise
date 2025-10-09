import { test, expect } from '@playwright/test';
import { login } from './helpers/auth-helper';
import { TEST_CONFIG } from './config/test-config';

test.describe('🧭 NAVIGATION TESTS @navigation', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, TEST_CONFIG.ADMIN_EMAIL, TEST_CONFIG.ADMIN_PASSWORD);
  });

  test('Main navigation menu works', async ({ page }) => {
    await page.goto(`${TEST_CONFIG.BASE_URL}/dashboard`);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1000);

    const navLinks = [
      { text: 'Main Dashboard', url: '/dashboard', module: 'Dashboards' },
      { text: 'All Tasks', url: '/tasks', module: 'Tasks' },
      { text: 'Contacts', url: '/crm/contacts', module: 'CRM' }
      // Note: "Projects" is ambiguous (exists in both Dashboards and CRM modules)
      // Test only unambiguous links
    ];

    for (const link of navLinks) {
      // First, ensure the module is expanded
      const moduleButton = page.locator(`nav button:has-text("${link.module}"), aside button:has-text("${link.module}")`).first();

      // Check if the link is already visible
      const navItem = page.locator(`nav a:has-text("${link.text}"), aside a:has-text("${link.text}")`).first();
      const isVisible = await navItem.isVisible().catch(() => false);

      if (!isVisible && await moduleButton.count() > 0) {
        // Module is collapsed, expand it
        await moduleButton.click();
        await page.waitForTimeout(300); // Wait for expand animation
      }

      // Now click the navigation link
      if (await navItem.count() > 0) {
        // Use force click and wait for navigation
        await Promise.all([
          page.waitForURL(`**${link.url}*`, { timeout: 10000 }),
          navItem.click({ force: true })
        ]);
        await page.waitForLoadState('domcontentloaded');
        await page.waitForTimeout(500);

        const currentUrl = page.url();
        expect(currentUrl).toContain(link.url);
      }
    }
  });

  test('Back button functionality', async ({ page }) => {
    await page.goto(`${TEST_CONFIG.BASE_URL}/dashboard`);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(500);
    const initialUrl = page.url();

    // Navigate to a different page
    await page.goto(`${TEST_CONFIG.BASE_URL}/crm/contacts`);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(500);

    // Go back
    await page.goBack();
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(500);

    // Check that we navigated back (URL should have changed from contacts)
    const currentUrl = page.url();
    expect(currentUrl).not.toContain('/crm/contacts');
    // Should be back on the previous page (dashboard or a redirect to it)
    expect(currentUrl === initialUrl || currentUrl.includes('/dashboard')).toBeTruthy();
  });

  test('Deep linking works', async ({ page }) => {
    const deepLink = `${TEST_CONFIG.BASE_URL}/crm/projects`;
    await page.goto(deepLink);
    await page.waitForLoadState('domcontentloaded');
    
    expect(page.url()).toBe(deepLink);
  });
});