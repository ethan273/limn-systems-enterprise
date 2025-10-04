import { test, expect, takeSnapshot } from '@chromatic-com/playwright';

/**
 * Financial Module Pages E2E Tests
 *
 * Phase 3: Page Testing - Financial Module
 *
 * Tests financial module pages:
 * - Invoices
 * - Payments
 * - Financial overview
 */

test.describe('Financial Module Pages', () => {
  test('Invoices List - Should load', async ({ page }, testInfo) => {
    await page.goto('/financials/invoices');
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveURL('/financials/invoices');
    await takeSnapshot(page, 'Financial - Invoices List', testInfo);
  });

  test('Payments List - Should load', async ({ page }, testInfo) => {
    await page.goto('/financials/payments');
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveURL('/financials/payments');
    await takeSnapshot(page, 'Financial - Payments List', testInfo);
  });
});
