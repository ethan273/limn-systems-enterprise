import { test, expect, takeSnapshot } from '@chromatic-com/playwright';

/**
 * Portal Pages E2E Tests
 *
 * Phase 3: Page Testing - Portal Module
 *
 * Tests portal pages (16 total):
 * - Customer portal
 * - Designer portal
 * - Factory portal
 * - Portal documents, orders, etc.
 */

test.describe('Portal Pages Tests', () => {
  test('Portal Home - Should load', async ({ page }, testInfo) => {
    // Increase timeout for portal pages (may redirect to login)
    test.setTimeout(60000);

    await page.goto('/portal', { waitUntil: 'domcontentloaded', timeout: 30000 });

    // Handle potential redirect to login
    const currentUrl = page.url();
    const isOnPortal = currentUrl.includes('/portal');
    expect(isOnPortal).toBe(true);

    await takeSnapshot(page, 'Portal - Home', testInfo);
  });

  test('Portal Login - Should load', async ({ page }, testInfo) => {
    await page.goto('/portal/login');
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveURL('/portal/login');
    await takeSnapshot(page, 'Portal - Login Page', testInfo);
  });

  test('Portal Orders - Should load', async ({ page }, testInfo) => {
    await page.goto('/portal/orders');
    await page.waitForLoadState('networkidle');

    const currentUrl = page.url();
    expect(currentUrl.includes('/portal')).toBe(true);
    await takeSnapshot(page, 'Portal - Orders', testInfo);
  });

  test('Portal Documents - Should load', async ({ page }, testInfo) => {
    await page.goto('/portal/documents');
    await page.waitForLoadState('networkidle');

    const currentUrl = page.url();
    expect(currentUrl.includes('/portal')).toBe(true);
    await takeSnapshot(page, 'Portal - Documents', testInfo);
  });

  test('Portal Financials - Should load', async ({ page }, testInfo) => {
    await page.goto('/portal/financials');
    await page.waitForLoadState('networkidle');

    const currentUrl = page.url();
    expect(currentUrl.includes('/portal')).toBe(true);
    await takeSnapshot(page, 'Portal - Financials', testInfo);
  });

  test('Portal Shipping - Should load', async ({ page }, testInfo) => {
    await page.goto('/portal/shipping');
    await page.waitForLoadState('networkidle');

    const currentUrl = page.url();
    expect(currentUrl.includes('/portal')).toBe(true);
    await takeSnapshot(page, 'Portal - Shipping', testInfo);
  });

  test('Designer Portal - Should load', async ({ page }, testInfo) => {
    await page.goto('/portal/designer');
    await page.waitForLoadState('networkidle');

    const currentUrl = page.url();
    expect(currentUrl.includes('/portal')).toBe(true);
    await takeSnapshot(page, 'Portal - Designer Home', testInfo);
  });

  test('Factory Portal - Should load', async ({ page }, testInfo) => {
    await page.goto('/portal/factory');
    await page.waitForLoadState('networkidle');

    const currentUrl = page.url();
    expect(currentUrl.includes('/portal')).toBe(true);
    await takeSnapshot(page, 'Portal - Factory Home', testInfo);
  });
});
