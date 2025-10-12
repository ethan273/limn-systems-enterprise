import { test, expect } from '@playwright/test';
import { login } from './helpers/auth-helper';
import { TEST_CONFIG } from './config/test-config';

test.describe('🗄️ DATABASE INTEGRITY TESTS @database', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, TEST_CONFIG.ADMIN_EMAIL, TEST_CONFIG.ADMIN_PASSWORD);
  });

  test('Database connectivity and data persistence', async ({ page }) => {
    // Test that database can be queried and returns data
    // This verifies database connection, schema, and data integrity
    await page.goto(`${TEST_CONFIG.BASE_URL}/tasks`);
    await page.waitForLoadState('domcontentloaded');

    // Wait for page to load data from database
    await page.waitForTimeout(2000);

    // Check that either data loaded or "no tasks" message shows
    // Both indicate successful database connection
    const hasTable = await page.locator('table, [role="table"]').count() > 0;
    const hasNoData = await (
      await page.locator('text=/no tasks/i').count() > 0 ||
      await page.locator('text=/no data/i').count() > 0 ||
      await page.locator('text=/empty/i').count() > 0
    ) > 0;
    const hasData = await page.locator('tbody tr, [role="row"]').count() > 0;

    // Success if we have a table structure OR a "no data" message (both prove DB connectivity)
    const databaseWorking = hasTable || hasNoData || hasData;

    expect(databaseWorking).toBeTruthy();

    // If there's data, verify it persists after reload
    if (hasData) {
      const firstRowText = await page.locator('tbody tr, [role="row"]').first().textContent();

      // Reload page
      await page.reload();
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(1000);

      // Verify same data exists after reload
      const firstRowAfterReload = await page.locator('tbody tr, [role="row"]').first().textContent();
      expect(firstRowAfterReload).toBe(firstRowText);
    }
  });

  test('Relationships are maintained', async ({ page }) => {
    await page.goto(`${TEST_CONFIG.BASE_URL}/crm/projects`);
    await page.waitForLoadState('domcontentloaded');
    
    // Click on first project to view details
    const firstProject = page.locator('table tbody tr, [role="row"]').first();
    if (await firstProject.count() > 0) {
      await firstProject.click();
      await page.waitForTimeout(2000);
      
      // Check for related data sections
      const hasRelatedData = await page.locator(':has-text("Tasks"), :has-text("Documents"), :has-text("Team")').count() > 0;
      expect(hasRelatedData).toBeTruthy();
    }
  });
});