import { test, expect } from '@playwright/test';
import { login } from './helpers/auth-helper';
import { TEST_CONFIG } from './config/test-config';

test.describe('❌ ERROR HANDLING TESTS @errors', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, TEST_CONFIG.ADMIN_EMAIL, TEST_CONFIG.ADMIN_PASSWORD);
  });

  test('404 page handles non-existent routes', async ({ page }) => {
    await page.goto(`${TEST_CONFIG.BASE_URL}/non-existent-page`);
    await page.waitForLoadState('domcontentloaded');
    
    const has404 = await page.locator(':has-text("404"), :has-text("Not Found")').count() > 0;
    expect(has404).toBeTruthy();
    
    // Check for home link
    const homeLink = await page.locator('a:has-text("Home"), a:has-text("Dashboard")').count() > 0;
    expect(homeLink).toBeTruthy();
  });

  test('Form submission error recovery', async ({ page }) => {
    await page.goto(`${TEST_CONFIG.BASE_URL}/crm/contacts`);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1000);

    const addButton = page.locator('button:has-text("Add"), button:has-text("New"), button:has-text("Create")').first();
    if (await addButton.count() > 0) {
      await addButton.click();
      await page.waitForTimeout(1500);

      // Fill form with duplicate data (might trigger error)
      const emailInput = page.locator('input[type="email"]').first();
      if (await emailInput.count() > 0) {
        await emailInput.fill('admin@test.com'); // Existing email
        await page.waitForTimeout(500);

        const saveButton = page.locator('[role="dialog"] button:has-text("Save"), [role="dialog"] button:has-text("Submit"), [role="dialog"] button:has-text("Create")').first();
        if (await saveButton.count() > 0) {
          // Force click to bypass overlay issues
          await saveButton.click({ force: true });
          await page.waitForTimeout(3000);

          // Check if dialog is still open (which indicates form wasn't submitted due to validation/error)
          const dialogStillOpen = await page.locator('[role="dialog"]').count() > 0;
          expect(dialogStillOpen).toBeTruthy();
        }
      }
    }
  });

  test('Console errors check', async ({ page }) => {
    const consoleErrors = [];
    
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    
    await page.goto(`${TEST_CONFIG.BASE_URL}/dashboard`);
    await page.waitForLoadState('domcontentloaded');
    
    // Log any console errors found
    if (consoleErrors.length > 0) {
      console.log('Console errors found:', consoleErrors);
    }
    
    // There should be no critical console errors
    const criticalErrors = consoleErrors.filter(err => 
      err.includes('TypeError') || 
      err.includes('ReferenceError') ||
      err.includes('Failed to fetch')
    );
    
    expect(criticalErrors.length).toBe(0);
  });
});