import { test, expect, takeSnapshot } from '@chromatic-com/playwright';

/**
 * Production Module Pages E2E Tests
 *
 * Phase 3: Page Testing - Production Module
 *
 * Tests production module pages:
 * - Production orders
 * - Ordered items
 * - Shipments
 * - Tracking pages
 */

test.describe('Production Module Pages', () => {
  test('Production Orders List - Should load', async ({ page }, testInfo) => {
    // Increase timeout for production pages (may have auth or slow loading)
    test.setTimeout(60000);

    await page.goto('/production/orders', { waitUntil: 'domcontentloaded', timeout: 30000 });

    // Verify we're on production page (may redirect to login if not authenticated)
    const currentUrl = page.url();
    const isOnProductionPage = currentUrl.includes('/production');
    expect(isOnProductionPage).toBe(true);

    await takeSnapshot(page, 'Production - Orders List', testInfo);
  });

  test('Ordered Items List - Should load', async ({ page }, testInfo) => {
    await page.goto('/production/ordered-items');
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveURL('/production/ordered-items');
    await takeSnapshot(page, 'Production - Ordered Items', testInfo);
  });

  test('Shipments List - Should load', async ({ page }, testInfo) => {
    await page.goto('/production/shipments');
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveURL('/production/shipments');
    await takeSnapshot(page, 'Production - Shipments', testInfo);
  });
});
