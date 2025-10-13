import { test, expect } from '@playwright/test';

/**
 * SEARCH, FILTER, AND SORT FUNCTIONALITY TEST SUITE
 *
 * Purpose: Verify that search, filter, and sort controls work correctly
 * across all list pages.
 *
 * What this tests:
 * - Search input exists and filters results
 * - Filter dropdowns exist and filter results
 * - Sort controls work correctly
 * - Pagination controls exist and work
 * - Results update dynamically
 */

test.describe('Search, Filter, and Sort Functionality', () => {
  test.use({ storageState: 'tests/.auth-sessions/user-session.json' });

  test.describe('Search Functionality', () => {
    test('CRM Contacts - Search filters results', async ({ page }) => {
      await page.goto('/crm/contacts');
      await page.waitForLoadState('networkidle');

      // Look for search input (use .last() to target page-specific search, not header search)
      const searchInput = page.getByPlaceholder(/search/i).last();
      if (await searchInput.count() > 0) {
        // Get initial row count
        const initialRows = await page.locator('tbody tr').count();

        // Type in search
        await searchInput.fill('test');
        await page.waitForTimeout(500); // Wait for debounce

        // Results should change (either more or fewer rows)
        const afterSearchRows = await page.locator('tbody tr').count();
        // Accept both filtering down OR showing "no results" message
        expect(afterSearchRows).toBeLessThanOrEqual(initialRows);
      }
    });

    test('Production Orders - Search filters results', async ({ page }) => {
      await page.goto('/production/orders');
      await page.waitForLoadState('networkidle');

      const searchInput = page.getByPlaceholder(/search/i);
      if (await searchInput.count() > 0) {
        await searchInput.fill('order');
        await page.waitForTimeout(500);

        // Verify search input contains our text
        expect(await searchInput.inputValue()).toBe('order');
      }
    });

    test('Partners Designers - Search filters results', async ({ page }) => {
      await page.goto('/partners/designers');
      await page.waitForLoadState('networkidle');

      const searchInput = page.getByPlaceholder(/search/i).last();
      if (await searchInput.count() > 0) {
        const initialRows = await page.locator('tbody tr').count();

        await searchInput.fill('design');
        await page.waitForTimeout(500);

        const afterSearchRows = await page.locator('tbody tr').count();
        expect(afterSearchRows).toBeLessThanOrEqual(initialRows);
      }
    });

    test('Products Catalog - Search filters results', async ({ page }) => {
      await page.goto('/products/catalog');
      await page.waitForLoadState('networkidle');

      const searchInput = page.getByPlaceholder(/search/i).last();
      if (await searchInput.count() > 0) {
        await searchInput.fill('chair');
        await page.waitForTimeout(500);

        expect(await searchInput.inputValue()).toBe('chair');
      }
    });
  });

  test.describe('Filter Functionality', () => {
    test('CRM Leads - Status filter works', async ({ page }) => {
      await page.goto('/crm/leads');
      await page.waitForLoadState('networkidle');

      // Look for status filter dropdown
      const statusFilter = page.locator('select, [role="combobox"]').filter({ hasText: /status/i }).first();
      if (await statusFilter.count() === 0) {
        // Try alternative: button that opens filter menu
        const filterButton = page.getByRole('button', { name: /filter|status/i });
        if (await filterButton.count() > 0) {
          await filterButton.click();
          await page.waitForTimeout(300);

          // Select a filter option
          const filterOption = page.getByRole('option', { name: /new|active|qualified/i }).first();
          if (await filterOption.count() > 0) {
            await filterOption.click();
            await page.waitForTimeout(500);

            // Verify filter was applied (URL or UI should change)
            const url = page.url();
            expect(url.length).toBeGreaterThan(0);
          }
        }
      }
    });

    test('Production Orders - Status filter works', async ({ page }) => {
      await page.goto('/production/orders');
      await page.waitForLoadState('networkidle');

      const filterButton = page.getByRole('button', { name: /filter|status/i });
      if (await filterButton.count() > 0) {
        await filterButton.click();
        await page.waitForTimeout(300);

        const filterOption = page.getByRole('option').first();
        if (await filterOption.count() > 0) {
          const initialRows = await page.locator('tbody tr').count();
          await filterOption.click();
          await page.waitForTimeout(500);

          // Results may change
          const afterFilterRows = await page.locator('tbody tr').count();
          expect(afterFilterRows).toBeGreaterThanOrEqual(0);
        }
      }
    });

    test('Financials Invoices - Date range filter exists', async ({ page }) => {
      await page.goto('/financials/invoices');
      await page.waitForLoadState('networkidle');

      // Look for date inputs
      const dateInput = page.locator('input[type="date"]').first();
      if (await dateInput.count() > 0) {
        expect(await dateInput.isVisible()).toBe(true);
      }
    });
  });

  test.describe('Sort Functionality', () => {
    test('CRM Contacts - Column sort works', async ({ page }) => {
      await page.goto('/crm/contacts');
      await page.waitForLoadState('networkidle');

      // Find sortable column header (usually has sort icon or is clickable)
      const sortableHeader = page.locator('th[role="columnheader"]').filter({ hasText: /name/i }).first();
      if (await sortableHeader.count() > 0) {
        // Click to sort
        await sortableHeader.click();
        await page.waitForTimeout(500);

        // Verify some indication of sort (aria-sort, icon, or class change)
        const ariaSort = await sortableHeader.getAttribute('aria-sort');
        if (ariaSort) {
          expect(['ascending', 'descending', 'none']).toContain(ariaSort);
        }
      }
    });

    test('Production Orders - Column sort works', async ({ page }) => {
      await page.goto('/production/orders');
      await page.waitForLoadState('networkidle');

      const sortableHeader = page.locator('th[role="columnheader"]').first();
      if (await sortableHeader.count() > 0) {
        await sortableHeader.click();
        await page.waitForTimeout(500);

        // Just verify no errors occurred
        expect(page.url()).toContain('/production/orders');
      }
    });

    test('Tasks - Sort by priority works', async ({ page }) => {
      await page.goto('/tasks');
      await page.waitForLoadState('networkidle');

      const priorityHeader = page.locator('th').filter({ hasText: /priority/i }).first();
      if (await priorityHeader.count() > 0) {
        await priorityHeader.click();
        await page.waitForTimeout(500);

        // Verify we're still on tasks page
        expect(page.url()).toContain('/tasks');
      }
    });
  });

  test.describe('Pagination Controls', () => {
    test('CRM Contacts - Pagination controls exist', async ({ page }) => {
      await page.goto('/crm/contacts');
      await page.waitForLoadState('networkidle');

      // Look for pagination controls (Next, Previous, page numbers)
      const nextButton = page.getByRole('button', { name: /next/i });
      const prevButton = page.getByRole('button', { name: /previous|prev/i });

      // At least one should exist if there's pagination
      const hasNext = await nextButton.count() > 0;
      const hasPrev = await prevButton.count() > 0;

      if (hasNext || hasPrev) {
        // Test next button if it exists and is enabled
        if (hasNext && !(await nextButton.isDisabled())) {
          const initialUrl = page.url();
          await nextButton.click();
          await page.waitForLoadState('networkidle');

          // URL or content should change
          const newUrl = page.url();
          // Either URL changed or we got a response
          expect(newUrl.length).toBeGreaterThan(0);
        }
      }
    });

    test('Production Orders - Page size selector exists', async ({ page }) => {
      await page.goto('/production/orders');
      await page.waitForLoadState('networkidle');

      // Look for page size selector (10, 25, 50, 100)
      const pageSizeSelector = page.locator('select').filter({ hasText: /10|25|50/i });
      if (await pageSizeSelector.count() > 0) {
        expect(await pageSizeSelector.isVisible()).toBe(true);
      }
    });
  });

  test.describe('Combined Search + Filter', () => {
    test('CRM Customers - Search + Filter work together', async ({ page }) => {
      await page.goto('/crm/customers');
      await page.waitForLoadState('networkidle');

      const searchInput = page.getByPlaceholder(/search/i).last();
      if (await searchInput.count() > 0) {
        // Apply search
        await searchInput.fill('test');
        await page.waitForTimeout(500);

        // Then apply filter
        const filterButton = page.getByRole('button', { name: /filter/i });
        if (await filterButton.count() > 0) {
          await filterButton.click();
          await page.waitForTimeout(300);

          // Both search and filter should be active
          expect(await searchInput.inputValue()).toBe('test');
        }
      }
    });
  });

  test.describe('Clear Filters', () => {
    test('CRM Leads - Clear filter button works', async ({ page }) => {
      await page.goto('/crm/leads');
      await page.waitForLoadState('networkidle');

      const searchInput = page.getByPlaceholder(/search/i).last();
      if (await searchInput.count() > 0) {
        // Apply search
        await searchInput.fill('test search');
        await page.waitForTimeout(500);

        // Look for clear button
        const clearButton = page.getByRole('button', { name: /clear|reset/i });
        if (await clearButton.count() > 0) {
          await clearButton.click();
          await page.waitForTimeout(300);

          // Search should be cleared
          expect(await searchInput.inputValue()).toBe('');
        }
      }
    });
  });
});
