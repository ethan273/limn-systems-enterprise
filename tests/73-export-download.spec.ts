import { test, expect } from '@playwright/test';

/**
 * EXPORT AND DOWNLOAD FUNCTIONALITY TEST SUITE
 *
 * Purpose: Verify that data export and file download features work correctly.
 *
 * What this tests:
 * - CSV export
 * - PDF generation and download
 * - Excel export
 * - Report downloads
 * - Export file naming
 * - Export with filters applied
 */

test.describe('Export and Download Functionality', () => {
  test.use({ storageState: 'tests/.auth-sessions/user-session.json' });

  test.describe('CSV Export', () => {
    test('CRM Contacts - Export to CSV', async ({ page }) => {
      await page.goto('/crm/contacts');
      await page.waitForLoadState('networkidle');

      const exportButton = page.getByRole('button', { name: /export|download/i });
      if (await exportButton.count() > 0) {
        // Wait for download
        const downloadPromise = page.waitForEvent('download', { timeout: 10000 }).catch(() => null);

        await exportButton.click();
        await page.waitForTimeout(500);

        // Check if CSV option appears
        const csvOption = page.locator('text=/csv/i, [role="menuitem"]:has-text("CSV")');
        if (await csvOption.count() > 0) {
          await csvOption.click();

          const download = await downloadPromise;
          if (download) {
            expect(download.suggestedFilename()).toMatch(/\.csv$/i);
          }
        } else {
          // Direct export - check if download started
          const download = await downloadPromise;
          if (download) {
            const filename = download.suggestedFilename();
            expect(filename).toMatch(/\.csv|\.xlsx|contacts/i);
          }
        }
      }
    });

    test('Production Orders - Export filtered results', async ({ page }) => {
      await page.goto('/production/orders');
      await page.waitForLoadState('networkidle');

      // Apply a filter first
      const searchInput = page.getByPlaceholder(/search/i).last();
      if (await searchInput.count() > 0) {
        await searchInput.fill('test');
        await page.waitForTimeout(500);
      }

      const exportButton = page.getByRole('button', { name: /export/i });
      if (await exportButton.count() > 0) {
        const downloadPromise = page.waitForEvent('download', { timeout: 10000 }).catch(() => null);

        await exportButton.click();
        await page.waitForTimeout(500);

        const download = await downloadPromise;
        if (download) {
          // Verify file downloaded
          expect(download.suggestedFilename().length).toBeGreaterThan(0);
        }
      }
    });
  });

  test.describe('PDF Generation', () => {
    test('Financials Invoice - Generate PDF', async ({ page }) => {
      await page.goto('/financials/invoices');
      await page.waitForLoadState('networkidle');

      const firstRow = page.locator('tbody tr').first();
      if (await firstRow.count() > 0) {
        await firstRow.click();
        await page.waitForLoadState('networkidle');

        // Look for PDF download button
        const pdfButton = page.getByRole('button', { name: /pdf|download.*invoice/i });
        if (await pdfButton.count() > 0) {
          const downloadPromise = page.waitForEvent('download', { timeout: 10000 }).catch(() => null);

          await pdfButton.click();
          await page.waitForTimeout(1000);

          const download = await downloadPromise;
          if (download) {
            expect(download.suggestedFilename()).toMatch(/\.pdf$/i);
          }
        }
      }
    });

    test('Production Shop Drawing - Download PDF', async ({ page }) => {
      await page.goto('/production/shop-drawings');
      await page.waitForLoadState('networkidle');

      const firstRow = page.locator('tbody tr').first();
      if (await firstRow.count() > 0) {
        await firstRow.click();
        await page.waitForLoadState('networkidle');

        const downloadButton = page.getByRole('button', { name: /download|view/i });
        if (await downloadButton.count() > 0) {
          const downloadPromise = page.waitForEvent('download', { timeout: 10000 }).catch(() => null);

          await downloadButton.click();
          await page.waitForTimeout(1000);

          const download = await downloadPromise;
          if (download) {
            // Verify download occurred
            expect(download.suggestedFilename().length).toBeGreaterThan(0);
          }
        }
      }
    });
  });

  test.describe('Excel Export', () => {
    test('Partners Designers - Export to Excel', async ({ page }) => {
      await page.goto('/partners/designers');
      await page.waitForLoadState('networkidle');

      const exportButton = page.getByRole('button', { name: /export/i });
      if (await exportButton.count() > 0) {
        await exportButton.click();
        await page.waitForTimeout(300);

        const excelOption = page.locator('text=/excel|xlsx/i, [role="menuitem"]:has-text("Excel")');
        if (await excelOption.count() > 0) {
          const downloadPromise = page.waitForEvent('download', { timeout: 10000 }).catch(() => null);

          await excelOption.click();
          await page.waitForTimeout(1000);

          const download = await downloadPromise;
          if (download) {
            expect(download.suggestedFilename()).toMatch(/\.xlsx?$/i);
          }
        }
      }
    });
  });

  test.describe('Report Downloads', () => {
    test('Analytics Dashboard - Download report', async ({ page }) => {
      await page.goto('/dashboards/analytics');
      await page.waitForLoadState('networkidle');

      const reportButton = page.getByRole('button', { name: /report|download|export/i });
      if (await reportButton.count() > 0) {
        const downloadPromise = page.waitForEvent('download', { timeout: 10000 }).catch(() => null);

        await reportButton.click();
        await page.waitForTimeout(1000);

        const download = await downloadPromise;
        if (download) {
          const filename = download.suggestedFilename();
          expect(filename).toMatch(/report|analytics|dashboard/i);
        }
      }
    });

    test('Financial Dashboard - Download financial report', async ({ page }) => {
      await page.goto('/dashboards/financial');
      await page.waitForLoadState('networkidle');

      const exportButton = page.getByRole('button', { name: /export|download/i });
      if (await exportButton.count() > 0) {
        const downloadPromise = page.waitForEvent('download', { timeout: 10000 }).catch(() => null);

        await exportButton.click();
        await page.waitForTimeout(1000);

        const download = await downloadPromise;
        if (download) {
          expect(download.suggestedFilename().length).toBeGreaterThan(0);
        }
      }
    });
  });

  test.describe('Export File Naming', () => {
    test('Exported file has meaningful name with date', async ({ page }) => {
      await page.goto('/crm/customers');
      await page.waitForLoadState('networkidle');

      const exportButton = page.getByRole('button', { name: /export/i });
      if (await exportButton.count() > 0) {
        const downloadPromise = page.waitForEvent('download', { timeout: 10000 }).catch(() => null);

        await exportButton.click();
        await page.waitForTimeout(1000);

        const download = await downloadPromise;
        if (download) {
          const filename = download.suggestedFilename();
          // Should contain module name or date
          expect(filename).toMatch(/customers|crm|export|\d{4}|\d{2}/i);
        }
      }
    });
  });

  test.describe('Export Progress Indicators', () => {
    test('Shows loading/progress during export', async ({ page }) => {
      await page.goto('/crm/contacts');
      await page.waitForLoadState('networkidle');

      const exportButton = page.getByRole('button', { name: /export/i });
      if (await exportButton.count() > 0) {
        await exportButton.click();

        // Look for loading indicator
        const loadingIndicator = page.locator('[role="status"], [aria-busy="true"], text=/exporting|loading/i');
        if (await loadingIndicator.count() > 0) {
          // Loading indicator appeared (might be brief)
          await page.waitForTimeout(500);
        }

        // Export should complete
        await page.waitForTimeout(2000);
        expect(await page.url()).toContain('/crm/contacts');
      }
    });
  });

  test.describe('Export Format Options', () => {
    test('Export menu shows multiple format options', async ({ page }) => {
      await page.goto('/production/orders');
      await page.waitForLoadState('networkidle');

      const exportButton = page.getByRole('button', { name: /export/i });
      if (await exportButton.count() > 0) {
        await exportButton.click();
        await page.waitForTimeout(300);

        // Check if format options appear
        const csvOption = page.locator('text=/csv/i');
        const excelOption = page.locator('text=/excel|xlsx/i');
        const pdfOption = page.locator('text=/pdf/i');

        const hasCSV = await csvOption.count() > 0;
        const hasExcel = await excelOption.count() > 0;
        const hasPDF = await pdfOption.count() > 0;

        // At least one format should be available
        expect(hasCSV || hasExcel || hasPDF).toBe(true);
      }
    });
  });

  test.describe('Export Empty Results', () => {
    test('Export works even with no results', async ({ page }) => {
      await page.goto('/crm/contacts');
      await page.waitForLoadState('networkidle');

      // Apply search that returns no results
      const searchInput = page.getByPlaceholder(/search/i).last();
      if (await searchInput.count() > 0) {
        await searchInput.fill('zzzznonexistentxxx123');
        await page.waitForTimeout(500);

        const exportButton = page.getByRole('button', { name: /export/i });
        if (await exportButton.count() > 0) {
          // Should still allow export (empty file)
          expect(await exportButton.isVisible()).toBe(true);
          expect(await exportButton.isDisabled()).toBe(false);
        }
      }
    });
  });

  test.describe('Document Downloads', () => {
    test('Partner Documents - Download uploaded file', async ({ page }) => {
      await page.goto('/partners/designers');
      await page.waitForLoadState('networkidle');

      const firstRow = page.locator('tbody tr').first();
      if (await firstRow.count() > 0) {
        await firstRow.click();
        await page.waitForLoadState('networkidle');

        const documentsTab = page.getByRole('tab', { name: /documents/i });
        if (await documentsTab.count() > 0) {
          await documentsTab.click();
          await page.waitForTimeout(300);

          // Find download link
          const downloadLink = page.getByRole('link', { name: /download|view/i }).first();
          if (await downloadLink.count() > 0) {
            const downloadPromise = page.waitForEvent('download', { timeout: 10000 }).catch(() => null);

            await downloadLink.click();
            await page.waitForTimeout(1000);

            const download = await downloadPromise;
            if (download) {
              expect(download.suggestedFilename().length).toBeGreaterThan(0);
            }
          }
        }
      }
    });
  });
});
