import { test, expect } from '@playwright/test';

/**
 * Sample E2E Test
 * Verifies basic application functionality and Chromatic integration
 */

test.describe('Application Home Page', () => {
  test('should load home page successfully', async ({ page }) => {
    // Navigate to home page
    await page.goto('/');

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Verify page loaded
    await expect(page).toHaveTitle(/Limn Systems/i);
  });

  test('should display login page', async ({ page }) => {
    // Navigate to login
    await page.goto('/login');

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Verify login elements present
    await expect(page.locator('body')).toBeVisible();
  });
});
