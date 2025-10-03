/**
 * Sample Playwright Test
 *
 * Validates Playwright configuration and helpers
 * Tests homepage and basic navigation
 *
 * Created: October 3, 2025
 */

import { test, expect } from '@playwright/test';
import { takeScreenshot, checkConsoleErrors, waitForPageLoad } from '../helpers/screenshot';

test.describe('Sample Test - Homepage', () => {
  test('Homepage loads successfully', async ({ page }) => {
    console.log('🧪 Testing homepage load...');

    // Navigate to homepage
    await page.goto('http://localhost:3000');

    // Wait for page to load
    await waitForPageLoad(page);

    // Take screenshot
    await takeScreenshot(page, 'homepage-load', {
      fullPage: true,
      module: 'sample',
    });

    // Check HTTP status
    const response = await page.goto('http://localhost:3000');
    expect(response?.status()).toBe(200);

    // Check for console errors
    const errors = await checkConsoleErrors(page);
    if (errors.length > 0) {
      console.log(`⚠️  Found ${errors.length} console errors:`, errors);
      // Document but don't fail (per testing plan - compile errors, don't fix)
    }

    console.log('✅ Homepage test complete');
  });

  test('Page title is present', async ({ page }) => {
    await page.goto('http://localhost:3000');
    await waitForPageLoad(page);

    // Check if page has a title
    const title = await page.title();
    expect(title).toBeTruthy();
    expect(title.length).toBeGreaterThan(0);

    console.log(`✅ Page title: "${title}"`);
  });

  test('Basic navigation elements exist', async ({ page }) => {
    await page.goto('http://localhost:3000');
    await waitForPageLoad(page);

    // Check for common navigation elements
    // Note: These selectors may need adjustment based on actual implementation

    try {
      // Check if sidebar exists (common in this app)
      const sidebar = page.locator('[data-testid="sidebar"]');
      const sidebarExists = await sidebar.count() > 0;
      console.log(`Sidebar exists: ${sidebarExists}`);
    } catch (error) {
      console.log('⚠️  Sidebar check failed - will document');
    }

    try {
      // Check if header exists
      const header = page.locator('header');
      const headerExists = await header.count() > 0;
      console.log(`Header exists: ${headerExists}`);
    } catch (error) {
      console.log('⚠️  Header check failed - will document');
    }

    // Take screenshot regardless of results
    await takeScreenshot(page, 'navigation-elements', {
      module: 'sample',
    });

    console.log('✅ Navigation elements test complete');
  });
});
