import { test, expect, takeSnapshot } from '@chromatic-com/playwright';

/**
 * Products Module Pages E2E Tests
 *
 * Phase 3: Page Testing - Products Module
 */

test.describe('Products Module Pages', () => {
  test('Products Catalog - Should load', async ({ page }, testInfo) => {
    await page.goto('/products/catalog');
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveURL('/products/catalog');
    await takeSnapshot(page, 'Products - Catalog', testInfo);
  });

  test('Products Collections - Should load', async ({ page }, testInfo) => {
    await page.goto('/products/collections');
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveURL('/products/collections');
    await takeSnapshot(page, 'Products - Collections', testInfo);
  });

  test('Products Concepts - Should load', async ({ page }, testInfo) => {
    await page.goto('/products/concepts');
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveURL('/products/concepts');
    await takeSnapshot(page, 'Products - Concepts', testInfo);
  });

  test('Products Prototypes - Should load', async ({ page }, testInfo) => {
    await page.goto('/products/prototypes');
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveURL('/products/prototypes');
    await takeSnapshot(page, 'Products - Prototypes', testInfo);
  });
});
