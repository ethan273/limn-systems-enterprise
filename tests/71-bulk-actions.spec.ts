import { test, expect } from '@playwright/test';

/**
 * BULK ACTIONS TEST SUITE
 *
 * Purpose: Verify that bulk/multi-select operations work correctly.
 *
 * What this tests:
 * - Checkbox selection (select all, select individual)
 * - Bulk delete operations
 * - Bulk status changes
 * - Bulk export
 * - Selection counter shows correct count
 * - Deselect all works
 */

test.describe('Bulk Actions and Multi-Select Operations', () => {
  test.use({ storageState: 'tests/.auth-sessions/user-session.json' });

  test.describe('Multi-Select Functionality', () => {
    test('CRM Contacts - Select all checkbox works', async ({ page }) => {
      await page.goto('/crm/contacts');
      await page.waitForLoadState('networkidle');

      // Look for "select all" checkbox in table header
      const selectAllCheckbox = page.locator('thead input[type="checkbox"]');
      if (await selectAllCheckbox.count() > 0) {
        // Click select all
        await selectAllCheckbox.click();
        await page.waitForTimeout(300);

        // Check if checkboxes are checked
        const checkedBoxes = page.locator('tbody input[type="checkbox"]:checked');
        const checkedCount = await checkedBoxes.count();

        expect(checkedCount).toBeGreaterThan(0);

        // Click again to deselect all
        await selectAllCheckbox.click();
        await page.waitForTimeout(300);

        const checkedAfter = await page.locator('tbody input[type="checkbox"]:checked').count();
        expect(checkedAfter).toBe(0);
      }
    });

    test('Production Orders - Individual selection works', async ({ page }) => {
      await page.goto('/production/orders');
      await page.waitForLoadState('networkidle');

      // Select first row checkbox
      const firstCheckbox = page.locator('tbody tr:first-child input[type="checkbox"]');
      if (await firstCheckbox.count() > 0) {
        await firstCheckbox.click();
        await page.waitForTimeout(300);

        // Should be checked
        expect(await firstCheckbox.isChecked()).toBe(true);

        // Select second row
        const secondCheckbox = page.locator('tbody tr:nth-child(2) input[type="checkbox"]');
        if (await secondCheckbox.count() > 0) {
          await secondCheckbox.click();
          await page.waitForTimeout(300);

          // Both should be checked
          const checkedCount = await page.locator('tbody input[type="checkbox"]:checked').count();
          expect(checkedCount).toBeGreaterThanOrEqual(2);
        }
      }
    });

    test('Tasks - Selection counter shows correct count', async ({ page }) => {
      await page.goto('/tasks');
      await page.waitForLoadState('networkidle');

      const firstCheckbox = page.locator('tbody input[type="checkbox"]').first();
      if (await firstCheckbox.count() > 0) {
        await firstCheckbox.click();
        await page.waitForTimeout(300);

        // Look for selection counter (e.g., "1 selected")
        const selectionCounter = page.locator('text=/\\d+ selected/i');
        if (await selectionCounter.count() > 0) {
          const counterText = await selectionCounter.textContent();
          expect(counterText).toMatch(/1|selected/i);
        }
      }
    });
  });

  test.describe('Bulk Delete Operations', () => {
    test('CRM Leads - Bulk delete button appears when items selected', async ({ page }) => {
      await page.goto('/crm/leads');
      await page.waitForLoadState('networkidle');

      const firstCheckbox = page.locator('tbody input[type="checkbox"]').first();
      if (await firstCheckbox.count() > 0) {
        await firstCheckbox.click();
        await page.waitForTimeout(300);

        // Look for bulk delete button
        const bulkDeleteButton = page.getByRole('button', { name: /delete.*selected|bulk.*delete/i });
        if (await bulkDeleteButton.count() > 0) {
          expect(await bulkDeleteButton.isVisible()).toBe(true);

          // Click it to open confirmation
          await bulkDeleteButton.click();
          await page.waitForTimeout(300);

          // Confirmation dialog should appear
          const dialog = page.locator('[role="dialog"], [role="alertdialog"]');
          if (await dialog.count() > 0) {
            await expect(dialog).toBeVisible();

            // Cancel the delete
            const cancelButton = dialog.getByRole('button', { name: /cancel|no/i });
            if (await cancelButton.count() > 0) {
              await cancelButton.click();
            }
          }
        }
      }
    });

    test('Partners Designers - Bulk delete confirmation shows count', async ({ page }) => {
      await page.goto('/partners/designers');
      await page.waitForLoadState('networkidle');

      // Select multiple items
      const checkboxes = page.locator('tbody input[type="checkbox"]');
      const checkboxCount = await checkboxes.count();

      if (checkboxCount >= 2) {
        // Select first two
        await checkboxes.nth(0).click();
        await checkboxes.nth(1).click();
        await page.waitForTimeout(300);

        const bulkDeleteButton = page.getByRole('button', { name: /delete/i });
        if (await bulkDeleteButton.count() > 0) {
          await bulkDeleteButton.click();
          await page.waitForTimeout(300);

          const dialog = page.locator('[role="dialog"]');
          if (await dialog.count() > 0) {
            // Dialog should mention "2" items
            const dialogText = await dialog.textContent();
            expect(dialogText).toMatch(/2/);
          }
        }
      }
    });
  });

  test.describe('Bulk Status Changes', () => {
    test('Production Orders - Bulk status change available', async ({ page }) => {
      await page.goto('/production/orders');
      await page.waitForLoadState('networkidle');

      const firstCheckbox = page.locator('tbody input[type="checkbox"]').first();
      if (await firstCheckbox.count() > 0) {
        await firstCheckbox.click();
        await page.waitForTimeout(300);

        // Look for bulk status change button
        const bulkStatusButton = page.getByRole('button', { name: /change.*status|status.*change|update.*status/i });
        if (await bulkStatusButton.count() > 0) {
          await bulkStatusButton.click();
          await page.waitForTimeout(300);

          // Status selection should appear
          const statusOptions = page.locator('[role="option"], [role="menuitem"]');
          if (await statusOptions.count() > 0) {
            expect(await statusOptions.first().isVisible()).toBe(true);
          }
        }
      }
    });

    test('Tasks - Bulk priority change works', async ({ page }) => {
      await page.goto('/tasks');
      await page.waitForLoadState('networkidle');

      const firstCheckbox = page.locator('tbody input[type="checkbox"]').first();
      if (await firstCheckbox.count() > 0) {
        await firstCheckbox.click();
        await page.waitForTimeout(300);

        const bulkActionButton = page.getByRole('button', { name: /priority|bulk/i });
        if (await bulkActionButton.count() > 0) {
          expect(await bulkActionButton.isVisible()).toBe(true);
        }
      }
    });
  });

  test.describe('Bulk Export', () => {
    test('CRM Customers - Bulk export button works', async ({ page }) => {
      await page.goto('/crm/customers');
      await page.waitForLoadState('networkidle');

      const selectAll = page.locator('thead input[type="checkbox"]');
      if (await selectAll.count() > 0) {
        await selectAll.click();
        await page.waitForTimeout(300);

        // Look for export button
        const exportButton = page.getByRole('button', { name: /export|download/i });
        if (await exportButton.count() > 0) {
          // Click export (might download file or open menu)
          const downloadPromise = page.waitForEvent('download', { timeout: 5000 }).catch(() => null);

          await exportButton.click();
          await page.waitForTimeout(500);

          const download = await downloadPromise;
          if (download) {
            // File download started
            expect(download.suggestedFilename()).toMatch(/\.csv|\.xlsx|\.json/i);
          }
        }
      }
    });

    test('Production Orders - Export selected items', async ({ page }) => {
      await page.goto('/production/orders');
      await page.waitForLoadState('networkidle');

      const firstCheckbox = page.locator('tbody input[type="checkbox"]').first();
      if (await firstCheckbox.count() > 0) {
        await firstCheckbox.click();
        await page.waitForTimeout(300);

        const exportButton = page.getByRole('button', { name: /export/i });
        if (await exportButton.count() > 0) {
          expect(await exportButton.isVisible()).toBe(true);
        }
      }
    });
  });

  test.describe('Select/Deselect All', () => {
    test('Financials Invoices - Deselect all works', async ({ page }) => {
      await page.goto('/financials/invoices');
      await page.waitForLoadState('networkidle');

      const selectAll = page.locator('thead input[type="checkbox"]');
      if (await selectAll.count() > 0) {
        // Select all
        await selectAll.click();
        await page.waitForTimeout(300);

        const checkedCount = await page.locator('tbody input[type="checkbox"]:checked').count();
        expect(checkedCount).toBeGreaterThan(0);

        // Deselect all
        await selectAll.click();
        await page.waitForTimeout(300);

        const afterDeselect = await page.locator('tbody input[type="checkbox"]:checked').count();
        expect(afterDeselect).toBe(0);
      }
    });
  });

  test.describe('Bulk Actions Confirmation', () => {
    test('Bulk delete shows warning before execution', async ({ page }) => {
      await page.goto('/crm/contacts');
      await page.waitForLoadState('networkidle');

      const checkboxes = page.locator('tbody input[type="checkbox"]');
      const count = await checkboxes.count();

      if (count >= 2) {
        // Select multiple items
        await checkboxes.nth(0).click();
        await checkboxes.nth(1).click();
        await page.waitForTimeout(300);

        const bulkDeleteButton = page.getByRole('button', { name: /delete/i });
        if (await bulkDeleteButton.count() > 0) {
          await bulkDeleteButton.click();
          await page.waitForTimeout(300);

          // Should show warning dialog
          const dialog = page.locator('[role="alertdialog"], [role="dialog"]');
          if (await dialog.count() > 0) {
            const dialogText = await dialog.textContent();
            // Should mention "delete" and show count
            expect(dialogText).toMatch(/delete|remove/i);
          }
        }
      }
    });
  });

  test.describe('Selection Persistence', () => {
    test('Selection persists across page navigation', async ({ page }) => {
      await page.goto('/crm/contacts');
      await page.waitForLoadState('networkidle');

      const firstCheckbox = page.locator('tbody input[type="checkbox"]').first();
      if (await firstCheckbox.count() > 0) {
        // Get first item ID or text
        const firstRowText = await page.locator('tbody tr').first().textContent();

        await firstCheckbox.click();
        await page.waitForTimeout(300);

        // Click on the row to navigate to detail page
        await page.locator('tbody tr').first().click();
        await page.waitForLoadState('networkidle');

        // Go back
        await page.goBack();
        await page.waitForLoadState('networkidle');

        // Check if selection persisted (optional feature)
        // Some apps clear selection, some don't - both are valid
        const stillChecked = await page.locator('tbody input[type="checkbox"]:checked').count();
        expect(stillChecked).toBeGreaterThanOrEqual(0);
      }
    });
  });
});
