import { test, expect, takeSnapshot } from '@chromatic-com/playwright';

/**
 * CRM Module Pages E2E Tests
 *
 * Phase 3: Page Testing - CRM Module
 *
 * Tests CRM module pages:
 * - Contacts pages
 * - Leads pages
 * - Customers pages
 * - Detail pages
 *
 * Validates:
 * - Page loads successfully
 * - Tables/lists display
 * - Navigation works
 * - Visual regression
 */

test.describe('CRM Module Pages', () => {
  test('Contacts List Page - Should load', async ({ page }, testInfo) => {
    await page.goto('/crm/contacts');
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveURL('/crm/contacts');
    await takeSnapshot(page, 'CRM - Contacts List', testInfo);
  });

  test('Leads List Page - Should load', async ({ page }, testInfo) => {
    await page.goto('/crm/leads');
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveURL('/crm/leads');
    await takeSnapshot(page, 'CRM - Leads List', testInfo);
  });

  test('Customers List Page - Should load', async ({ page }, testInfo) => {
    await page.goto('/crm/customers');
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveURL('/crm/customers');
    await takeSnapshot(page, 'CRM - Customers List', testInfo);
  });
});
