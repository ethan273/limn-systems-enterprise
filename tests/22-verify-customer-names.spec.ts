import { test, expect } from '@playwright/test';
import { login } from './helpers/auth-helper';

/**
 * Verify customer names display correctly on Financial Dashboard
 * After fixing company_name fallback in API
 */

test.describe('Financial Dashboard - Customer Names', () => {
  test('Should display company names instead of Customer ID', async ({ page }) => {
    await login(page, 'admin@test.com', 'password');
    await page.goto('/dashboards/financial');
    await page.waitForLoadState('networkidle');

    // Wait for Top Customers section to load
    await page.waitForTimeout(2000);

    // Check that customer names are NOT showing as "Customer ID: ..."
    const customerIdPattern = /Customer ID: [a-f0-9]{8}/;
    const customerListItems = page.locator('.customer-list-item');

    const count = await customerListItems.count();
    console.log(`Found ${count} customer list items`);

    for (let i = 0; i < count; i++) {
      const item = customerListItems.nth(i);
      const text = await item.textContent();
      console.log(`Customer ${i + 1}: ${text}`);

      // Should NOT contain "Customer ID: " pattern
      expect(text).not.toMatch(customerIdPattern);
    }

    // Take screenshot for verification
    await page.screenshot({
      path: 'tests/screenshots/financial-dashboard-customer-names-fixed.png',
      fullPage: true
    });

    console.log('✅ Screenshot saved: tests/screenshots/financial-dashboard-customer-names-fixed.png');
  });
});
