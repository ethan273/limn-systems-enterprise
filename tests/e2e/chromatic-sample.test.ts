import { test, expect, takeSnapshot } from '@chromatic-com/playwright';

/**
 * Chromatic Visual Regression Test Sample
 * Demonstrates proper Chromatic integration with Playwright
 */

test.describe('Chromatic Visual Regression Tests', () => {
  test('Homepage - Visual Snapshot', async ({ page }, testInfo) => {
    // Navigate to homepage
    await page.goto('/');

    // Wait for page to fully load
    await page.waitForLoadState('networkidle');

    // Take Chromatic snapshot
    await takeSnapshot(page, 'Homepage - Full Page', testInfo);
  });

  test('Login Page - Visual Snapshot', async ({ page }, testInfo) => {
    // Navigate to login
    await page.goto('/login');

    // Wait for page to fully load
    await page.waitForLoadState('networkidle');

    // Take Chromatic snapshot
    await takeSnapshot(page, 'Login Page - Full View', testInfo);
  });

  test('Portal Login - Visual Snapshot', async ({ page }, testInfo) => {
    // Navigate to portal login
    await page.goto('/portal/login');

    // Wait for page to fully load
    await page.waitForLoadState('networkidle');

    // Take Chromatic snapshot
    await takeSnapshot(page, 'Portal Login - Full View', testInfo);
  });
});
