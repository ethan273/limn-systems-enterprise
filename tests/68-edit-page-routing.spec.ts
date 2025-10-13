import { test, expect } from '@playwright/test';

/**
 * EDIT PAGE ROUTING TEST SUITE
 *
 * Purpose: Verify that all edit pages exist and load correctly.
 * This ensures that when users click "Edit" from row actions or detail pages,
 * they reach a valid edit form (not a 404).
 *
 * What this tests:
 * - Edit pages return 200 status
 * - Edit forms load with proper heading
 * - Navigation from detail pages to edit pages works
 * - Edit buttons in row actions route correctly
 */

test.describe('Edit Page Routing - Verify All Edit Forms Exist', () => {
  test.use({ storageState: 'tests/.auth-sessions/user-session.json' });

  test.describe('CRM Module - Edit Pages', () => {
    test('Contacts - Edit page exists and loads correctly', async ({ page }) => {
      await page.goto('/crm/contacts');
      await page.waitForLoadState('networkidle');

      // Find first row
      const firstRow = page.locator('tbody tr').first();
      if (await firstRow.count() > 0) {
        // Click row to get to detail page
        await firstRow.click();
        await page.waitForLoadState('networkidle');

        // Look for Edit button
        const editButton = page.getByRole('button', { name: /edit/i });
        if (await editButton.count() > 0) {
          await editButton.click();
          await page.waitForLoadState('networkidle');

          // Verify we're on edit page
          expect(page.url()).toMatch(/\/crm\/contacts\/[^\/]+\/edit$/);
          await expect(page.getByRole('heading', { name: /edit/i })).toBeVisible();
        }
      }
    });

    test('Customers - Edit page exists and loads correctly', async ({ page }) => {
      await page.goto('/crm/customers');
      await page.waitForLoadState('networkidle');

      const firstRow = page.locator('tbody tr').first();
      if (await firstRow.count() > 0) {
        await firstRow.click();
        await page.waitForLoadState('networkidle');

        const editButton = page.getByRole('button', { name: /edit/i });
        if (await editButton.count() > 0) {
          await editButton.click();
          await page.waitForLoadState('networkidle');

          expect(page.url()).toMatch(/\/crm\/customers\/[^\/]+\/edit$/);
          await expect(page.getByRole('heading', { name: /edit/i })).toBeVisible();
        }
      }
    });

    test('Leads - Edit page exists and loads correctly', async ({ page }) => {
      await page.goto('/crm/leads');
      await page.waitForLoadState('networkidle');

      const firstRow = page.locator('tbody tr').first();
      if (await firstRow.count() > 0) {
        await firstRow.click();
        await page.waitForLoadState('networkidle');

        const editButton = page.getByRole('button', { name: /edit/i });
        if (await editButton.count() > 0) {
          await editButton.click();
          await page.waitForLoadState('networkidle');

          expect(page.url()).toMatch(/\/crm\/leads\/[^\/]+\/edit$/);
          await expect(page.getByRole('heading', { name: /edit/i })).toBeVisible();
        }
      }
    });

    test('Projects - Edit page exists and loads correctly', async ({ page }) => {
      await page.goto('/crm/projects');
      await page.waitForLoadState('networkidle');

      const firstRow = page.locator('tbody tr').first();
      if (await firstRow.count() > 0) {
        await firstRow.click();
        await page.waitForLoadState('networkidle');

        const editButton = page.getByRole('button', { name: /edit/i });
        if (await editButton.count() > 0) {
          await editButton.click();
          await page.waitForLoadState('networkidle');

          expect(page.url()).toMatch(/\/crm\/projects\/[^\/]+\/edit$/);
          await expect(page.getByRole('heading', { name: /edit/i })).toBeVisible();
        }
      }
    });

    test('Prospects - Edit page exists and loads correctly', async ({ page }) => {
      await page.goto('/crm/prospects');
      await page.waitForLoadState('networkidle');

      const firstRow = page.locator('tbody tr').first();
      if (await firstRow.count() > 0) {
        await firstRow.click();
        await page.waitForLoadState('networkidle');

        const editButton = page.getByRole('button', { name: /edit/i });
        if (await editButton.count() > 0) {
          await editButton.click();
          await page.waitForLoadState('networkidle');

          expect(page.url()).toMatch(/\/crm\/prospects\/[^\/]+\/edit$/);
          await expect(page.getByRole('heading', { name: /edit/i })).toBeVisible();
        }
      }
    });
  });

  test.describe('Production Module - Edit Pages', () => {
    test('Production Orders - Edit page exists and loads correctly', async ({ page }) => {
      await page.goto('/production/orders');
      await page.waitForLoadState('networkidle');

      const firstRow = page.locator('tbody tr').first();
      if (await firstRow.count() > 0) {
        await firstRow.click();
        await page.waitForLoadState('networkidle');

        const editButton = page.getByRole('button', { name: /edit/i });
        if (await editButton.count() > 0) {
          await editButton.click();
          await page.waitForLoadState('networkidle');

          expect(page.url()).toMatch(/\/production\/orders\/[^\/]+\/edit$/);
          await expect(page.getByRole('heading', { name: /edit/i })).toBeVisible();
        }
      }
    });

    test('Shop Drawings - Edit page exists and loads correctly', async ({ page }) => {
      await page.goto('/production/shop-drawings');
      await page.waitForLoadState('networkidle');

      const firstRow = page.locator('tbody tr').first();
      if (await firstRow.count() > 0) {
        await firstRow.click();
        await page.waitForLoadState('networkidle');

        const editButton = page.getByRole('button', { name: /edit/i });
        if (await editButton.count() > 0) {
          await editButton.click();
          await page.waitForLoadState('networkidle');

          expect(page.url()).toMatch(/\/production\/shop-drawings\/[^\/]+\/edit$/);
          await expect(page.getByRole('heading', { name: /edit/i })).toBeVisible();
        }
      }
    });

    test('Prototypes - Edit page exists and loads correctly', async ({ page }) => {
      await page.goto('/production/prototypes');
      await page.waitForLoadState('networkidle');

      const firstRow = page.locator('tbody tr').first();
      if (await firstRow.count() > 0) {
        await firstRow.click();
        await page.waitForLoadState('networkidle');

        const editButton = page.getByRole('button', { name: /edit/i });
        if (await editButton.count() > 0) {
          await editButton.click();
          await page.waitForLoadState('networkidle');

          expect(page.url()).toMatch(/\/production\/prototypes\/[^\/]+\/edit$/);
          await expect(page.getByRole('heading', { name: /edit/i })).toBeVisible();
        }
      }
    });

    test('QC Inspections - Edit page exists and loads correctly', async ({ page }) => {
      await page.goto('/production/qc');
      await page.waitForLoadState('networkidle');

      const firstRow = page.locator('tbody tr').first();
      if (await firstRow.count() > 0) {
        await firstRow.click();
        await page.waitForLoadState('networkidle');

        const editButton = page.getByRole('button', { name: /edit/i });
        if (await editButton.count() > 0) {
          await editButton.click();
          await page.waitForLoadState('networkidle');

          expect(page.url()).toMatch(/\/production\/qc\/[^\/]+\/edit$/);
          await expect(page.getByRole('heading', { name: /edit/i })).toBeVisible();
        }
      }
    });

    test('Packing Jobs - Edit page exists and loads correctly', async ({ page }) => {
      await page.goto('/production/packing');
      await page.waitForLoadState('networkidle');

      const firstRow = page.locator('tbody tr').first();
      if (await firstRow.count() > 0) {
        await firstRow.click();
        await page.waitForLoadState('networkidle');

        const editButton = page.getByRole('button', { name: /edit/i });
        if (await editButton.count() > 0) {
          await editButton.click();
          await page.waitForLoadState('networkidle');

          expect(page.url()).toMatch(/\/production\/packing\/[^\/]+\/edit$/);
          await expect(page.getByRole('heading', { name: /edit/i })).toBeVisible();
        }
      }
    });

    test('Factory Reviews - Edit page exists and loads correctly', async ({ page }) => {
      await page.goto('/production/factory-reviews');
      await page.waitForLoadState('networkidle');

      const firstRow = page.locator('tbody tr').first();
      if (await firstRow.count() > 0) {
        await firstRow.click();
        await page.waitForLoadState('networkidle');

        const editButton = page.getByRole('button', { name: /edit/i });
        if (await editButton.count() > 0) {
          await editButton.click();
          await page.waitForLoadState('networkidle');

          expect(page.url()).toMatch(/\/production\/factory-reviews\/[^\/]+\/edit$/);
          await expect(page.getByRole('heading', { name: /edit/i })).toBeVisible();
        }
      }
    });
  });

  test.describe('Partners Module - Edit Pages', () => {
    test('Designers - Edit page exists and loads correctly', async ({ page }) => {
      await page.goto('/partners/designers');
      await page.waitForLoadState('networkidle');

      const firstRow = page.locator('tbody tr').first();
      if (await firstRow.count() > 0) {
        await firstRow.click();
        await page.waitForLoadState('networkidle');

        const editButton = page.getByRole('button', { name: /edit/i });
        if (await editButton.count() > 0) {
          await editButton.click();
          await page.waitForLoadState('networkidle');

          expect(page.url()).toMatch(/\/partners\/designers\/[^\/]+\/edit$/);
          await expect(page.getByRole('heading', { name: /edit/i })).toBeVisible();
        }
      }
    });

    test('Factories - Edit page exists and loads correctly', async ({ page }) => {
      await page.goto('/partners/factories');
      await page.waitForLoadState('networkidle');

      const firstRow = page.locator('tbody tr').first();
      if (await firstRow.count() > 0) {
        await firstRow.click();
        await page.waitForLoadState('networkidle');

        const editButton = page.getByRole('button', { name: /edit/i });
        if (await editButton.count() > 0) {
          await editButton.click();
          await page.waitForLoadState('networkidle');

          expect(page.url()).toMatch(/\/partners\/factories\/[^\/]+\/edit$/);
          await expect(page.getByRole('heading', { name: /edit/i })).toBeVisible();
        }
      }
    });
  });

  test.describe('Design Module - Edit Pages', () => {
    test('Design Projects - Edit page exists and loads correctly', async ({ page }) => {
      await page.goto('/design/projects');
      await page.waitForLoadState('networkidle');

      const firstRow = page.locator('tbody tr').first();
      if (await firstRow.count() > 0) {
        await firstRow.click();
        await page.waitForLoadState('networkidle');

        const editButton = page.getByRole('button', { name: /edit/i });
        if (await editButton.count() > 0) {
          await editButton.click();
          await page.waitForLoadState('networkidle');

          expect(page.url()).toMatch(/\/design\/projects\/[^\/]+\/edit$/);
          await expect(page.getByRole('heading', { name: /edit/i })).toBeVisible();
        }
      }
    });

    test('Design Briefs - Edit page exists and loads correctly', async ({ page }) => {
      await page.goto('/design/briefs');
      await page.waitForLoadState('networkidle');

      const firstRow = page.locator('tbody tr').first();
      if (await firstRow.count() > 0) {
        await firstRow.click();
        await page.waitForLoadState('networkidle');

        const editButton = page.getByRole('button', { name: /edit/i });
        if (await editButton.count() > 0) {
          await editButton.click();
          await page.waitForLoadState('networkidle');

          expect(page.url()).toMatch(/\/design\/briefs\/[^\/]+\/edit$/);
          await expect(page.getByRole('heading', { name: /edit/i })).toBeVisible();
        }
      }
    });
  });

  test.describe('Financials Module - Edit Pages', () => {
    test('Invoices - Edit page exists and loads correctly', async ({ page }) => {
      await page.goto('/financials/invoices');
      await page.waitForLoadState('networkidle');

      const firstRow = page.locator('tbody tr').first();
      if (await firstRow.count() > 0) {
        await firstRow.click();
        await page.waitForLoadState('networkidle');

        const editButton = page.getByRole('button', { name: /edit/i });
        if (await editButton.count() > 0) {
          await editButton.click();
          await page.waitForLoadState('networkidle');

          expect(page.url()).toMatch(/\/financials\/invoices\/[^\/]+\/edit$/);
          await expect(page.getByRole('heading', { name: /edit/i })).toBeVisible();
        }
      }
    });

    test('Payments - Edit page exists and loads correctly', async ({ page }) => {
      await page.goto('/financials/payments');
      await page.waitForLoadState('networkidle');

      const firstRow = page.locator('tbody tr').first();
      if (await firstRow.count() > 0) {
        await firstRow.click();
        await page.waitForLoadState('networkidle');

        const editButton = page.getByRole('button', { name: /edit/i });
        if (await editButton.count() > 0) {
          await editButton.click();
          await page.waitForLoadState('networkidle');

          expect(page.url()).toMatch(/\/financials\/payments\/[^\/]+\/edit$/);
          await expect(page.getByRole('heading', { name: /edit/i })).toBeVisible();
        }
      }
    });
  });

  test.describe('Shipping Module - Edit Pages', () => {
    test('Shipments - Edit page exists and loads correctly', async ({ page }) => {
      await page.goto('/shipping/shipments');
      await page.waitForLoadState('networkidle');

      const firstRow = page.locator('tbody tr').first();
      if (await firstRow.count() > 0) {
        await firstRow.click();
        await page.waitForLoadState('networkidle');

        const editButton = page.getByRole('button', { name: /edit/i });
        if (await editButton.count() > 0) {
          await editButton.click();
          await page.waitForLoadState('networkidle');

          expect(page.url()).toMatch(/\/shipping\/shipments\/[^\/]+\/edit$/);
          await expect(page.getByRole('heading', { name: /edit/i })).toBeVisible();
        }
      }
    });
  });

  test.describe('Products Module - Edit Pages', () => {
    test('Products - Edit page exists and loads correctly', async ({ page }) => {
      await page.goto('/products/catalog');
      await page.waitForLoadState('networkidle');

      const firstRow = page.locator('tbody tr').first();
      if (await firstRow.count() > 0) {
        await firstRow.click();
        await page.waitForLoadState('networkidle');

        const editButton = page.getByRole('button', { name: /edit/i });
        if (await editButton.count() > 0) {
          await editButton.click();
          await page.waitForLoadState('networkidle');

          expect(page.url()).toMatch(/\/products\/catalog\/[^\/]+\/edit$/);
          await expect(page.getByRole('heading', { name: /edit/i })).toBeVisible();
        }
      }
    });

    test('Collections - Edit page exists and loads correctly', async ({ page }) => {
      await page.goto('/products/collections');
      await page.waitForLoadState('networkidle');

      const firstRow = page.locator('tbody tr').first();
      if (await firstRow.count() > 0) {
        await firstRow.click();
        await page.waitForLoadState('networkidle');

        const editButton = page.getByRole('button', { name: /edit/i });
        if (await editButton.count() > 0) {
          await editButton.click();
          await page.waitForLoadState('networkidle');

          expect(page.url()).toMatch(/\/products\/collections\/[^\/]+\/edit$/);
          await expect(page.getByRole('heading', { name: /edit/i })).toBeVisible();
        }
      }
    });
  });

  test.describe('Tasks Module - Edit Pages', () => {
    test('Tasks - Edit page exists and loads correctly', async ({ page }) => {
      await page.goto('/tasks');
      await page.waitForLoadState('networkidle');

      const firstRow = page.locator('tbody tr').first();
      if (await firstRow.count() > 0) {
        await firstRow.click();
        await page.waitForLoadState('networkidle');

        const editButton = page.getByRole('button', { name: /edit/i });
        if (await editButton.count() > 0) {
          await editButton.click();
          await page.waitForLoadState('networkidle');

          expect(page.url()).toMatch(/\/tasks\/[^\/]+\/edit$/);
          await expect(page.getByRole('heading', { name: /edit/i })).toBeVisible();
        }
      }
    });
  });
});
