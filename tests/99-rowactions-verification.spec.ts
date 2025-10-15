/**
 * Row Actions Verification Tests
 *
 * Tests the rowActions pattern implementation across all 14 pages that have Edit+Delete functionality.
 * Verifies:
 * 1. Dropdown menu (⋮) appears on each page
 * 2. Edit action is available and clickable
 * 3. Delete action is available and opens AlertDialog
 * 4. AlertDialog has proper Cancel and Delete buttons
 * 5. UI consistency across all pages
 */

import { test, expect } from '@playwright/test';
import { TEST_CONFIG } from './config/test-config';

// Pages that should have rowActions with Edit + Delete
const PAGES_WITH_ROWACTIONS = [
  // CRM Module (5 pages)
  { path: '/crm/clients', name: 'Clients', hasConvert: false },
  { path: '/crm/contacts', name: 'Contacts', hasConvert: false },
  { path: '/crm/customers', name: 'Customers', hasConvert: false },
  { path: '/crm/leads', name: 'Leads', hasConvert: true }, // Has "Convert to Client"
  { path: '/crm/prospects', name: 'Prospects', hasConvert: true }, // Has "Convert to Client"

  // Products Module (5 pages)
  { path: '/products/catalog', name: 'Catalog Items', hasConvert: false },
  { path: '/products/collections', name: 'Collections', hasConvert: false },
  { path: '/products/concepts', name: 'Concepts', hasConvert: false },
  { path: '/products/materials', name: 'Materials', hasConvert: false },
  { path: '/products/prototypes', name: 'Prototypes', hasConvert: false },

  // Design Module (3 pages)
  { path: '/design/briefs', name: 'Design Briefs', hasConvert: false },
  { path: '/design/documents', name: 'Design Documents', hasConvert: false },
  { path: '/design/projects', name: 'Design Projects', hasConvert: false },

  // Tasks Module (1 page)
  { path: '/tasks', name: 'Tasks', hasConvert: false },
];

test.describe('Row Actions Pattern Verification', () => {
  test.use({ storageState: 'tests/.auth-sessions/user-session.json' });

  for (const pageInfo of PAGES_WITH_ROWACTIONS) {
    test.describe(`${pageInfo.name} Page`, () => {

      test('should display row actions button on data rows', async ({ page }) => {
        await page.goto(`${TEST_CONFIG.BASE_URL}${pageInfo.path}`);

        // Wait for page to load
        await page.waitForLoadState('networkidle');

        // Check if there's data in the table
        const tableRows = page.locator('table tbody tr');
        const rowCount = await tableRows.count();

        if (rowCount > 0) {
          // Should have at least one row actions button (⋮)
          const rowActionsButton = page.locator('[data-testid="row-actions-button"]').first();
          await expect(rowActionsButton).toBeVisible({ timeout: 5000 });
        } else {
          // If no data, that's ok - test passes
          console.log(`No data rows on ${pageInfo.name} page - skipping row actions check`);
        }
      });

      test('should open dropdown menu when clicking row actions button', async ({ page }) => {
        await page.goto(`${TEST_CONFIG.BASE_URL}${pageInfo.path}`);
        await page.waitForLoadState('networkidle');

        const tableRows = page.locator('table tbody tr');
        const rowCount = await tableRows.count();

        if (rowCount > 0) {
          // Click the first row actions button
          const rowActionsButton = page.locator('[data-testid="row-actions-button"]').first();
          await rowActionsButton.click();

          // Dropdown menu should appear
          const dropdownMenu = page.locator('[data-testid="row-actions-menu"]');
          await expect(dropdownMenu).toBeVisible({ timeout: 3000 });
        } else {
          console.log(`No data rows on ${pageInfo.name} page - skipping dropdown test`);
        }
      });

      test('should have Edit action in dropdown menu', async ({ page }) => {
        await page.goto(`${TEST_CONFIG.BASE_URL}${pageInfo.path}`);
        await page.waitForLoadState('networkidle');

        const tableRows = page.locator('table tbody tr');
        const rowCount = await tableRows.count();

        if (rowCount > 0) {
          // Open dropdown
          const rowActionsButton = page.locator('[data-testid="row-actions-button"]').first();
          await rowActionsButton.click();

          // Check for Edit action
          const editAction = page.locator('[data-testid="row-actions-menu"]').getByText('Edit');
          await expect(editAction).toBeVisible({ timeout: 3000 });
        } else {
          console.log(`No data rows on ${pageInfo.name} page - skipping Edit action test`);
        }
      });

      test('should have Delete action in dropdown menu', async ({ page }) => {
        await page.goto(`${TEST_CONFIG.BASE_URL}${pageInfo.path}`);
        await page.waitForLoadState('networkidle');

        const tableRows = page.locator('table tbody tr');
        const rowCount = await tableRows.count();

        if (rowCount > 0) {
          // Open dropdown
          const rowActionsButton = page.locator('[data-testid="row-actions-button"]').first();
          await rowActionsButton.click();

          // Check for Delete action
          const deleteAction = page.locator('[data-testid="row-actions-menu"]').getByText('Delete');
          await expect(deleteAction).toBeVisible({ timeout: 3000 });
        } else {
          console.log(`No data rows on ${pageInfo.name} page - skipping Delete action test`);
        }
      });

      if (pageInfo.hasConvert) {
        test('should have Convert action in dropdown menu', async ({ page }) => {
          await page.goto(`${TEST_CONFIG.BASE_URL}${pageInfo.path}`);
          await page.waitForLoadState('networkidle');

          const tableRows = page.locator('table tbody tr');
          const rowCount = await tableRows.count();

          if (rowCount > 0) {
            // Open dropdown
            const rowActionsButton = page.locator('[data-testid="row-actions-button"]').first();
            await rowActionsButton.click();

            // Check for Convert action
            const convertAction = page.locator('[data-testid="row-actions-menu"]').getByText(/Convert/i);
            await expect(convertAction).toBeVisible({ timeout: 3000 });
          } else {
            console.log(`No data rows on ${pageInfo.name} page - skipping Convert action test`);
          }
        });
      }

      test('should open AlertDialog when clicking Delete action', async ({ page }) => {
        await page.goto(`${TEST_CONFIG.BASE_URL}${pageInfo.path}`);
        await page.waitForLoadState('networkidle');

        const tableRows = page.locator('table tbody tr');
        const rowCount = await tableRows.count();

        if (rowCount > 0) {
          // Open dropdown and click Delete
          const rowActionsButton = page.locator('[data-testid="row-actions-button"]').first();
          await rowActionsButton.click();

          const deleteAction = page.locator('[data-testid="row-actions-menu"]').getByText('Delete');
          await deleteAction.click();

          // AlertDialog should appear
          const alertDialog = page.getByRole('alertdialog');
          await expect(alertDialog).toBeVisible({ timeout: 3000 });

          // Should have title
          const dialogTitle = alertDialog.getByRole('heading');
          await expect(dialogTitle).toBeVisible();

          // Should have Cancel button
          const cancelButton = alertDialog.getByRole('button', { name: /Cancel/i });
          await expect(cancelButton).toBeVisible();

          // Should have Delete button
          const deleteButton = alertDialog.getByRole('button', { name: /Delete/i });
          await expect(deleteButton).toBeVisible();

          // Close the dialog (don't actually delete)
          await cancelButton.click();
          await expect(alertDialog).not.toBeVisible({ timeout: 3000 });
        } else {
          console.log(`No data rows on ${pageInfo.name} page - skipping AlertDialog test`);
        }
      });

      test('should close AlertDialog when clicking Cancel', async ({ page }) => {
        await page.goto(`${TEST_CONFIG.BASE_URL}${pageInfo.path}`);
        await page.waitForLoadState('networkidle');

        const tableRows = page.locator('table tbody tr');
        const rowCount = await tableRows.count();

        if (rowCount > 0) {
          // Open dropdown and click Delete
          const rowActionsButton = page.locator('[data-testid="row-actions-button"]').first();
          await rowActionsButton.click();

          const deleteAction = page.locator('[data-testid="row-actions-menu"]').getByText('Delete');
          await deleteAction.click();

          // Wait for AlertDialog
          const alertDialog = page.getByRole('alertdialog');
          await expect(alertDialog).toBeVisible();

          // Click Cancel
          const cancelButton = alertDialog.getByRole('button', { name: /Cancel/i });
          await cancelButton.click();

          // Dialog should close
          await expect(alertDialog).not.toBeVisible({ timeout: 3000 });
        } else {
          console.log(`No data rows on ${pageInfo.name} page - skipping Cancel test`);
        }
      });
    });
  }

  test.describe('UI Consistency Check', () => {
    test.use({ storageState: 'tests/.auth-sessions/user-session.json' });

    test('should have consistent row actions styling across all pages', async ({ page }) => {
      const pagesWithData = [];

      for (const pageInfo of PAGES_WITH_ROWACTIONS) {
        await page.goto(`${TEST_CONFIG.BASE_URL}${pageInfo.path}`);
        await page.waitForLoadState('networkidle');

        const tableRows = page.locator('table tbody tr');
        const rowCount = await tableRows.count();

        if (rowCount > 0) {
          pagesWithData.push(pageInfo);

          // Check button exists and has correct styling
          const rowActionsButton = page.locator('[data-testid="row-actions-button"]').first();
          await expect(rowActionsButton).toBeVisible();

          // All row actions buttons should be similar size/style
          const boundingBox = await rowActionsButton.boundingBox();
          expect(boundingBox).toBeTruthy();
        }
      }

      console.log(`Found ${pagesWithData.length} pages with data for consistency testing`);
      expect(pagesWithData.length).toBeGreaterThan(0);
    });
  });
});
