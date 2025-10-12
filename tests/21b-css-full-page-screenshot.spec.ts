import { test } from '@playwright/test';
import { login } from './helpers/auth-helper';

/**
 * Full Page Screenshot - Financial Dashboard
 */

test.describe('Full Page Screenshot - Financial Dashboard', () => {
  test('Capture full Financial Dashboard including Top Customers', async ({ page }) => {
  await login(page, 'admin@test.com', 'password');
  await page.goto('/dashboards/financial');
  await page.waitForLoadState('networkidle');

  // Wait a moment for all data to load
  await page.waitForTimeout(2000);

  // Scroll to Top Customers section
  const topCustomersCard = page.locator('text=Top Customers by Revenue');
  if (await topCustomersCard.count() > 0) {
    await topCustomersCard.scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);
  }

  // Take full page screenshot
  await page.screenshot({
    path: 'tests/screenshots/financial-dashboard-full-page.png',
    fullPage: true
  });

  console.log('✅ Full page screenshot saved: tests/screenshots/financial-dashboard-full-page.png');

  // Take screenshot of just the Top Customers section
  const topCustomersSection = page.locator('.customer-list').locator('..');
  if (await topCustomersSection.count() > 0) {
    await topCustomersSection.screenshot({
      path: 'tests/screenshots/top-customers-section-only.png'
    });
    console.log('✅ Top Customers section screenshot saved: tests/screenshots/top-customers-section-only.png');
  }
  });
});
