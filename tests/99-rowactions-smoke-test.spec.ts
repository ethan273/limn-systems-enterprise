/**
 * Row Actions Smoke Test
 * Quick verification that rowActions work on key pages
 */

import { test, expect } from '@playwright/test';

test.describe('Row Actions Smoke Test', () => {
  test.use({ storageState: 'tests/.auth-sessions/user-session.json' });

  const testPages = [
    { path: '/crm/contacts', name: 'Contacts' },
    { path: '/crm/leads', name: 'Leads' },
    { path: '/products/collections', name: 'Collections' },
  ];

  for (const pageInfo of testPages) {
    test(`${pageInfo.name}: rowActions dropdown works correctly`, async ({ page }) => {
      await page.goto(`http://localhost:3001${pageInfo.path}`);
      await page.waitForLoadState('networkidle', { timeout: 10000 });

      // Check if there's data
      const tableRows = page.locator('table tbody tr');
      const rowCount = await tableRows.count();

      if (rowCount > 0) {
        // Click row actions button
        const rowActionsButton = page.locator('[data-testid="row-actions-button"]').first();
        await expect(rowActionsButton).toBeVisible({ timeout: 5000 });
        await rowActionsButton.click();

        // Verify dropdown menu appears
        const dropdownMenu = page.locator('[data-testid="row-actions-menu"]');
        await expect(dropdownMenu).toBeVisible({ timeout: 3000 });

        // Verify Edit action exists
        const editAction = dropdownMenu.getByText('Edit');
        await expect(editAction).toBeVisible();

        // Verify Delete action exists
        const deleteAction = dropdownMenu.getByText('Delete');
        await expect(deleteAction).toBeVisible();

        // Click Delete to open AlertDialog
        await deleteAction.click();

        // Verify AlertDialog appears
        const alertDialog = page.getByRole('alertdialog');
        await expect(alertDialog).toBeVisible({ timeout: 3000 });

        // Verify Cancel button exists
        const cancelButton = alertDialog.getByRole('button', { name: /Cancel/i });
        await expect(cancelButton).toBeVisible();

        // Close dialog
        await cancelButton.click();
        await expect(alertDialog).not.toBeVisible({ timeout: 3000 });

        console.log(`✅ ${pageInfo.name} page: rowActions working correctly`);
      } else {
        console.log(`ℹ️ ${pageInfo.name} page: No data rows - test skipped`);
      }
    });
  }
});
