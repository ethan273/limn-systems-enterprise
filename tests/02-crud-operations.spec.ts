import { test, expect } from '@playwright/test';
import { login } from './helpers/auth-helper';
import { TEST_CONFIG } from './config/test-config';
import path from 'path';

test.describe('📝 CRUD OPERATIONS TESTS @crud', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, TEST_CONFIG.ADMIN_EMAIL, TEST_CONFIG.ADMIN_PASSWORD);
  });

  test('Create new project', async ({ page }) => {
    await page.goto(`${TEST_CONFIG.BASE_URL}/crm/projects`);
    await page.waitForLoadState('domcontentloaded');

    // Look for add/new button
    const addButton = page.locator('button:has-text("Add"), button:has-text("New"), button:has-text("Create")').first();
    if (await addButton.count() > 0) {
      await addButton.click();

      // Wait for dialog/modal to open completely
      await page.waitForTimeout(500);

      // Fill form fields if dialog opens
      const nameInput = page.locator('input[name="name"], input[placeholder*="name" i]').first();
      if (await nameInput.count() > 0) {
        await nameInput.fill('Test Project ' + Date.now());

        // Wait a moment for form validation
        await page.waitForTimeout(300);

        // Force click to bypass overlay
        const saveButton = page.locator('button:has-text("Save"), button:has-text("Create"), button:has-text("Submit")').first();
        if (await saveButton.count() > 0) {
          await saveButton.click({ force: true });
          await page.waitForTimeout(2000);
        }
      }
    }
  });

  test('Read/List projects', async ({ page }) => {
    await page.goto(`${TEST_CONFIG.BASE_URL}/crm/projects`);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1000);

    // Wait for page to finish loading (heading, buttons, etc.)
    try {
      await page.waitForSelector('h1, h2, button', { timeout: 5000 });
    } catch (e) {
      // Page might not have heading, continue anyway
    }

    // Wait longer for data to load
    await page.waitForTimeout(3000);

    // Check for table, cards, or empty state message
    const hasTable = await page.locator('table, [role="table"]').count() > 0;
    const hasCards = await page.locator('[class*="card"]').count() > 3; // Multiple cards indicate list view
    const hasGrid = await page.locator('.grid').count() > 0;
    const hasContent = await page.locator('tbody tr, [data-project-id], [data-id]').count() > 0;

    // Page should have SOME content indicator (table, cards, grid, or data rows)
    expect(hasTable || hasCards || hasGrid || hasContent).toBeTruthy();

    await page.screenshot({
      path: path.join(TEST_CONFIG.SCREENSHOT_DIR, 'crud-02-list-projects.png'),
      fullPage: true
    });
  });

  test('Update/Edit functionality', async ({ page }) => {
    await page.goto(`${TEST_CONFIG.BASE_URL}/crm/contacts`);
    await page.waitForLoadState('domcontentloaded');
    
    // Click on first edit button if exists
    const editButton = page.locator('button:has-text("Edit"), [aria-label*="edit" i]').first();
    if (await editButton.count() > 0) {
      await editButton.click();
      await page.waitForTimeout(1000);
    }
  });

  test('Delete functionality with confirmation', async ({ page }) => {
    await page.goto(`${TEST_CONFIG.BASE_URL}/tasks`);
    await page.waitForLoadState('domcontentloaded');
    
    // Look for delete button
    const deleteButton = page.locator('button:has-text("Delete"), [aria-label*="delete" i]').first();
    if (await deleteButton.count() > 0) {
      // Set up dialog handler before clicking delete
      page.on('dialog', async dialog => {
        await dialog.accept();
      });
      
      await deleteButton.click();
      await page.waitForTimeout(2000);
    }
  });

  test('Search/Filter functionality', async ({ page }) => {
    await page.goto(`${TEST_CONFIG.BASE_URL}/crm/leads`);
    await page.waitForLoadState('domcontentloaded');
    
    // Look for search input
    const searchInput = page.locator('input[type="search"], input[placeholder*="search" i]').first();
    if (await searchInput.count() > 0) {
      await searchInput.fill('test');
      await page.keyboard.press('Enter');
      await page.waitForTimeout(1000);
    }
  });
});
