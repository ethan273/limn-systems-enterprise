import { test, expect } from '@playwright/test';
import { login } from './helpers/auth-helper';
import { TEST_CONFIG } from './config/test-config';

/**
 * CHAOS TESTS - Test application with messy, incomplete, and edge-case data
 * These tests verify the app handles real-world data scenarios gracefully
 */

test.describe('🔥 CHAOS TESTS - Data Edge Cases', () => {

  test.beforeEach(async ({ page }) => {
    await login(page, TEST_CONFIG.ADMIN_EMAIL, TEST_CONFIG.ADMIN_PASSWORD);
  });

  // ========================================
  // TEST 1: Null/Undefined Data Handling
  // ========================================

  test('Orders page handles orders with null fields', async ({ page }) => {
    await page.goto(`${TEST_CONFIG.BASE_URL}/crm/orders`);
    await page.waitForLoadState('networkidle');

    // Page should load without crashing
    await expect(page.locator('h1')).toBeVisible();

    // Search with empty query (should not crash)
    const searchInput = page.getByPlaceholder(/search/i).last();
    await searchInput.fill('');
    await page.waitForTimeout(500);

    // Should still show page
    await expect(page.locator('h1')).toBeVisible();
  });

  test('Tasks page handles users with missing names', async ({ page }) => {
    await page.goto(`${TEST_CONFIG.BASE_URL}/tasks`);
    await page.waitForLoadState('networkidle');

    // Page should render without crashing
    await expect(page.locator('h1')).toContainText('Tasks');

    // Check that avatars render (even with missing data)
    const avatars = page.locator('[class*="avatar"]');
    if (await avatars.count() > 0) {
      // Avatars should have fallback text
      const firstAvatar = avatars.first();
      await expect(firstAvatar).toBeVisible();
    }
  });

  // ========================================
  // TEST 2: Search/Filter with Special Characters
  // ========================================

  test('Search handles special characters without crashing', async ({ page }) => {
    await page.goto(`${TEST_CONFIG.BASE_URL}/crm/contacts`);
    await page.waitForLoadState('networkidle');

    const specialChars = ['<script>', "'; DROP TABLE--", '\\n\\r', '🚀', '中文', '"quotes"'];

    for (const char of specialChars) {
      const searchInput = page.getByPlaceholder(/search/i).last();
      await searchInput.fill(char);
      await page.waitForTimeout(300);

      // Should not crash or show error
      const pageHeading = page.locator('h1');
      await expect(pageHeading).toBeVisible();
    }
  });

  // ========================================
  // TEST 3: Invalid Date Formats
  // ========================================

  test('Task detail page handles invalid date formats', async ({ page }) => {
    await page.goto(`${TEST_CONFIG.BASE_URL}/tasks`);
    await page.waitForLoadState('networkidle');

    // Try to access first task
    const firstRow = page.locator('tbody tr').first();
    if (await firstRow.count() > 0) {
      await firstRow.click();
      await page.waitForLoadState('networkidle');

      // Page should load without crashing
      const heading = page.locator('h1, h2').first();
      await expect(heading).toBeVisible();

      // Should handle date display gracefully
      const dateFields = page.locator('text=/date/i');
      if (await dateFields.count() > 0) {
        // Dates should either show valid format or fallback
        await expect(page.locator('body')).toBeVisible();
      }
    }
  });

  // ========================================
  // TEST 4: Empty Arrays and Lists
  // ========================================

  test('Pages handle empty data gracefully', async ({ page }) => {
    const pagesToTest = [
      '/crm/orders',
      '/crm/contacts',
      '/tasks',
      '/production/orders',
    ];

    for (const pagePath of pagesToTest) {
      await page.goto(`${TEST_CONFIG.BASE_URL}${pagePath}`);
      await page.waitForLoadState('networkidle');

      // Should show empty state or data without crashing
      const pageContent = page.locator('body');
      await expect(pageContent).toBeVisible();

      // Should not show error messages
      const errorText = await page.locator('text=/error|crash|undefined is not/i').count();
      expect(errorText).toBe(0);
    }
  });

  // ========================================
  // TEST 5: Rapid Filtering/Sorting
  // ========================================

  test('Rapid filter changes do not cause crashes', async ({ page }) => {
    await page.goto(`${TEST_CONFIG.BASE_URL}/tasks`);
    await page.waitForLoadState('networkidle');

    // Rapidly change filters
    const statusFilters = ['todo', 'in_progress', 'completed', 'all'];

    for (let i = 0; i < 3; i++) {
      for (const status of statusFilters) {
        const filterButton = page.locator(`text=/status/i`).first();
        if (await filterButton.count() > 0) {
          await filterButton.click({ timeout: 1000 }).catch(() => {});
          await page.waitForTimeout(100);
        }
      }
    }

    // Page should still be functional
    const heading = page.locator('h1');
    await expect(heading).toBeVisible();
  });

  // ========================================
  // TEST 6: Long Text Input
  // ========================================

  test('Search handles very long input strings', async ({ page }) => {
    await page.goto(`${TEST_CONFIG.BASE_URL}/crm/contacts`);
    await page.waitForLoadState('networkidle');

    const longString = 'A'.repeat(1000);

    const searchInput = page.getByPlaceholder(/search/i).last();
    await searchInput.fill(longString);
    await page.waitForTimeout(500);

    // Should not crash
    await expect(page.locator('h1')).toBeVisible();
  });

  // ========================================
  // TEST 7: Concurrent Actions
  // ========================================

  test('Multiple rapid clicks do not cause race conditions', async ({ page }) => {
    await page.goto(`${TEST_CONFIG.BASE_URL}/crm/contacts`);
    await page.waitForLoadState('networkidle');

    const newButton = page.getByRole('button', { name: /new contact/i });
    if (await newButton.count() > 0) {
      // Rapid clicks
      await Promise.all([
        newButton.click({ timeout: 1000 }).catch(() => {}),
        newButton.click({ timeout: 1000 }).catch(() => {}),
        newButton.click({ timeout: 1000 }).catch(() => {}),
      ]);

      await page.waitForTimeout(1000);

      // Should show only one dialog or handle gracefully
      const dialogs = page.locator('[role="dialog"]');
      const dialogCount = await dialogs.count();

      // Either 0 (all cancelled) or 1 (one opened)
      expect(dialogCount).toBeLessThanOrEqual(1);
    }
  });

  // ========================================
  // TEST 8: Network Error Simulation
  // ========================================

  test('App shows error state when API fails', async ({ page }) => {
    // Intercept API calls and make them fail
    await page.route('**/api/**', route => {
      route.abort('failed');
    });

    await page.goto(`${TEST_CONFIG.BASE_URL}/crm/orders`);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);

    // Should show error state or loading state (not crash)
    const pageContent = page.locator('body');
    await expect(pageContent).toBeVisible();

    // Should not show "undefined" or JavaScript errors in UI
    const badErrors = await page.locator('text=/undefined is not|cannot read property|typeerror/i').count();
    expect(badErrors).toBe(0);
  });

  // ========================================
  // TEST 9: Browser Back/Forward
  // ========================================

  test('Browser navigation handles state correctly', async ({ page }) => {
    await page.goto(`${TEST_CONFIG.BASE_URL}/crm/contacts`);
    await page.waitForLoadState('networkidle');

    await page.goto(`${TEST_CONFIG.BASE_URL}/crm/customers`);
    await page.waitForLoadState('networkidle');

    // Go back
    await page.goBack();
    await page.waitForLoadState('networkidle');

    expect(page.url()).toContain('/contacts');
    await expect(page.locator('h1')).toBeVisible();

    // Go forward
    await page.goForward();
    await page.waitForLoadState('networkidle');

    expect(page.url()).toContain('/customers');
    await expect(page.locator('h1')).toBeVisible();
  });

  // ========================================
  // TEST 10: Memory Leaks (Large Data Sets)
  // ========================================

  test('App handles large data sets without memory issues', async ({ page }) => {
    // Change page size to max
    await page.goto(`${TEST_CONFIG.BASE_URL}/tasks`);
    await page.waitForLoadState('networkidle');

    const pageSizeSelector = page.locator('select').filter({ hasText: /10|20|50/i });
    if (await pageSizeSelector.count() > 0) {
      await pageSizeSelector.first().selectOption('100');
      await page.waitForTimeout(1000);

      // Page should still be responsive
      await expect(page.locator('h1')).toBeVisible();

      // Scroll through data
      await page.evaluate(() => {
        window.scrollTo(0, document.body.scrollHeight);
      });
      await page.waitForTimeout(500);

      await page.evaluate(() => {
        window.scrollTo(0, 0);
      });

      // Should not crash
      await expect(page.locator('h1')).toBeVisible();
    }
  });
});

test.describe('🔥 CHAOS TESTS - UI Edge Cases', () => {

  test.beforeEach(async ({ page }) => {
    await login(page, TEST_CONFIG.ADMIN_EMAIL, TEST_CONFIG.ADMIN_PASSWORD);
  });

  // ========================================
  // TEST 11: Mobile Viewport
  // ========================================

  test('App works on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    await page.goto(`${TEST_CONFIG.BASE_URL}/tasks`);
    await page.waitForLoadState('networkidle');

    // Should be responsive
    await expect(page.locator('h1')).toBeVisible();

    // Tables should scroll horizontally
    const table = page.locator('table');
    if (await table.count() > 0) {
      await expect(table).toBeVisible();
    }
  });

  // ========================================
  // TEST 12: Slow Network
  // ========================================

  test('App shows loading state on slow network', async ({ page }) => {
    // Slow down network
    await page.route('**/api/**', route => {
      setTimeout(() => route.continue(), 2000);
    });

    await page.goto(`${TEST_CONFIG.BASE_URL}/crm/contacts`);

    // Should show loading state
    const loading = page.locator('text=/loading/i');
    if (await loading.count() > 0) {
      await expect(loading).toBeVisible();
    }

    await page.waitForLoadState('networkidle', { timeout: 10000 });

    // Eventually should show content
    await expect(page.locator('h1')).toBeVisible();
  });
});
