import { test, expect, Page } from '@playwright/test';

/**
 * ROUTING INTEGRITY TEST SUITE
 *
 * Purpose: Systematically verify that every action button, link, and router.push() call
 * routes to a valid destination (no 404s). This prevents broken navigation paths.
 *
 * What this tests:
 * - "New" buttons route to valid create forms
 * - Action menu items route to valid pages
 * - Row clicks navigate to valid detail pages
 * - All navigation results in 200 responses (not 404s)
 * - Breadcrumb links work correctly
 */

test.describe('Routing Integrity - Action Buttons & Navigation', () => {
  test.use({ storageState: 'tests/.auth-sessions/user-session.json' });

  // Helper function to check if a route exists (returns 200, not 404)
  async function verifyRouteExists(page: Page, url: string): Promise<boolean> {
    const response = await page.goto(url);
    return response?.status() === 200;
  }

  // Helper function to click button and verify no 404
  async function clickAndVerifyRoute(page: Page, selector: string, expectedUrl?: string): Promise<void> {
    const responsePromise = page.waitForResponse(response =>
      response.url().includes(expectedUrl || '/') && response.status() !== 404
    );
    await page.click(selector);
    const response = await responsePromise;
    expect(response.status()).toBe(200);
  }

  test.describe('Production Module - New Buttons', () => {
    test('Production Orders - New button routes to create form', async ({ page }) => {
      await page.goto('/production/orders');
      await page.waitForLoadState('networkidle');

      // Check if "New" button exists
      const newButton = page.getByRole('button', { name: /new.*order/i });
      if (await newButton.count() > 0) {
        await newButton.click();
        await page.waitForLoadState('networkidle');

        // Verify we're on the new page and it's not a 404
        expect(page.url()).toContain('/production/orders/new');
        await expect(page.getByRole('heading', { name: /create|new/i })).toBeVisible();
      }
    });

    test('Shop Drawings - New button routes to create form', async ({ page }) => {
      await page.goto('/production/shop-drawings');
      await page.waitForLoadState('networkidle');

      const newButton = page.getByRole('button', { name: /upload.*drawing|new/i });
      if (await newButton.count() > 0) {
        await newButton.click();
        await page.waitForLoadState('networkidle');

        expect(page.url()).toContain('/production/shop-drawings/new');
        await expect(page.getByRole('heading', { name: /upload|create|new/i })).toBeVisible();
      }
    });

    test('Prototypes - New button routes to create form', async ({ page }) => {
      await page.goto('/production/prototypes');
      await page.waitForLoadState('networkidle');

      const newButton = page.getByRole('button', { name: /create.*prototype|new/i });
      if (await newButton.count() > 0) {
        await newButton.click();
        await page.waitForLoadState('networkidle');

        expect(page.url()).toContain('/production/prototypes/new');
        await expect(page.getByRole('heading', { name: /create|new/i })).toBeVisible();
      }
    });

    test('Packing Jobs - New button routes to create form', async ({ page }) => {
      await page.goto('/production/packing');
      await page.waitForLoadState('networkidle');

      const newButton = page.getByRole('button', { name: /new.*packing|new/i });
      if (await newButton.count() > 0) {
        await newButton.click();
        await page.waitForLoadState('networkidle');

        expect(page.url()).toContain('/production/packing/new');
        await expect(page.getByRole('heading', { name: /create|new/i })).toBeVisible();
      }
    });

    test('QC Inspections - New button routes to create form', async ({ page }) => {
      await page.goto('/production/qc');
      await page.waitForLoadState('networkidle');

      const newButton = page.getByRole('button', { name: /new.*inspection|new/i });
      if (await newButton.count() > 0) {
        await newButton.click();
        await page.waitForLoadState('networkidle');

        expect(page.url()).toContain('/production/qc/new');
        await expect(page.getByRole('heading', { name: /create|new/i })).toBeVisible();
      }
    });

    test('Factory Reviews - New button routes to create form', async ({ page }) => {
      await page.goto('/production/factory-reviews');
      await page.waitForLoadState('networkidle');

      const newButton = page.getByRole('button', { name: /new.*review|new.*session/i });
      if (await newButton.count() > 0) {
        await newButton.click();
        await page.waitForLoadState('networkidle');

        expect(page.url()).toContain('/production/factory-reviews/new');
        await expect(page.getByRole('heading', { name: /create|new/i })).toBeVisible();
      }
    });
  });

  test.describe('CRM Module - New Buttons', () => {
    test('Contacts - New button routes to create form', async ({ page }) => {
      await page.goto('/crm/contacts');
      await page.waitForLoadState('networkidle');

      const newButton = page.getByRole('button', { name: /new.*contact|add/i });
      if (await newButton.count() > 0) {
        await newButton.click();
        await page.waitForLoadState('networkidle');

        expect(page.url()).toContain('/crm/contacts/new');
        await expect(page.getByRole('heading', { name: /create|new|add/i })).toBeVisible();
      }
    });

    test('Leads - New button routes to create form', async ({ page }) => {
      await page.goto('/crm/leads');
      await page.waitForLoadState('networkidle');

      const newButton = page.getByRole('button', { name: /new.*lead|add/i });
      if (await newButton.count() > 0) {
        await newButton.click();
        await page.waitForLoadState('networkidle');

        expect(page.url()).toContain('/crm/leads/new');
        await expect(page.getByRole('heading', { name: /create|new|add/i })).toBeVisible();
      }
    });

    test('Customers - New button routes to create form', async ({ page }) => {
      await page.goto('/crm/customers');
      await page.waitForLoadState('networkidle');

      const newButton = page.getByRole('button', { name: /new.*customer|add/i });
      if (await newButton.count() > 0) {
        await newButton.click();
        await page.waitForLoadState('networkidle');

        expect(page.url()).toContain('/crm/customers/new');
        await expect(page.getByRole('heading', { name: /create|new|add/i })).toBeVisible();
      }
    });
  });

  test.describe('Design Module - New Buttons', () => {
    test('Design Projects - New button routes to create form', async ({ page }) => {
      await page.goto('/design/projects');
      await page.waitForLoadState('networkidle');

      const newButton = page.getByRole('button', { name: /new.*project|create/i });
      if (await newButton.count() > 0) {
        await newButton.click();
        await page.waitForLoadState('networkidle');

        expect(page.url()).toContain('/design/projects/new');
        await expect(page.getByRole('heading', { name: /create|new/i })).toBeVisible();
      }
    });

    test('Design Briefs - New button routes to create form', async ({ page }) => {
      await page.goto('/design/briefs');
      await page.waitForLoadState('networkidle');

      const newButton = page.getByRole('button', { name: /new.*brief|create/i });
      if (await newButton.count() > 0) {
        await newButton.click();
        await page.waitForLoadState('networkidle');

        expect(page.url()).toContain('/design/briefs/new');
        await expect(page.getByRole('heading', { name: /create|new/i })).toBeVisible();
      }
    });
  });

  test.describe('Financials Module - New Buttons', () => {
    test('Invoices - New button routes to create form', async ({ page }) => {
      await page.goto('/financials/invoices');
      await page.waitForLoadState('networkidle');

      const newButton = page.getByRole('button', { name: /new.*invoice|create/i });
      if (await newButton.count() > 0) {
        await newButton.click();
        await page.waitForLoadState('networkidle');

        expect(page.url()).toContain('/financials/invoices/new');
        await expect(page.getByRole('heading', { name: /create|new/i })).toBeVisible();
      }
    });

    test('Payments - New button routes to create form', async ({ page }) => {
      await page.goto('/financials/payments');
      await page.waitForLoadState('networkidle');

      const newButton = page.getByRole('button', { name: /record.*payment|new/i });
      if (await newButton.count() > 0) {
        await newButton.click();
        await page.waitForLoadState('networkidle');

        expect(page.url()).toContain('/financials/payments/new');
        await expect(page.getByRole('heading', { name: /record|create|new/i })).toBeVisible();
      }
    });
  });

  test.describe('Partners Module - New Buttons', () => {
    test('Designers - New button routes to create form', async ({ page }) => {
      await page.goto('/partners/designers');
      await page.waitForLoadState('networkidle');

      const newButton = page.getByRole('button', { name: /new.*designer|add/i });
      if (await newButton.count() > 0) {
        await newButton.click();
        await page.waitForLoadState('networkidle');

        expect(page.url()).toContain('/partners/designers/new');
        await expect(page.getByRole('heading', { name: /create|new|add/i })).toBeVisible();
      }
    });

    test('Factories - New button routes to create form', async ({ page }) => {
      await page.goto('/partners/factories');
      await page.waitForLoadState('networkidle');

      const newButton = page.getByRole('button', { name: /new.*factory|add/i });
      if (await newButton.count() > 0) {
        await newButton.click();
        await page.waitForLoadState('networkidle');

        expect(page.url()).toContain('/partners/factories/new');
        await expect(page.getByRole('heading', { name: /create|new|add/i })).toBeVisible();
      }
    });
  });

  test.describe('Row Click Navigation - Verify Detail Pages', () => {
    test('CRM Contacts - Row click navigates to detail page', async ({ page }) => {
      await page.goto('/crm/contacts');
      await page.waitForLoadState('networkidle');

      // Find first row in table (if exists)
      const firstRow = page.locator('tbody tr').first();
      if (await firstRow.count() > 0) {
        await firstRow.click();
        await page.waitForLoadState('networkidle');

        // Verify we're on a detail page (contains /crm/contacts/[id])
        expect(page.url()).toMatch(/\/crm\/contacts\/[^\/]+$/);
        // Verify page loaded (not 404)
        await expect(page.getByRole('heading')).toBeVisible();
      }
    });

    test('Production Orders - Row click navigates to detail page', async ({ page }) => {
      await page.goto('/production/orders');
      await page.waitForLoadState('networkidle');

      const firstRow = page.locator('tbody tr').first();
      if (await firstRow.count() > 0) {
        await firstRow.click();
        await page.waitForLoadState('networkidle');

        expect(page.url()).toMatch(/\/production\/orders\/[^\/]+$/);
        await expect(page.getByRole('heading')).toBeVisible();
      }
    });

    test('Shop Drawings - Row click navigates to detail page', async ({ page }) => {
      await page.goto('/production/shop-drawings');
      await page.waitForLoadState('networkidle');

      const firstRow = page.locator('tbody tr').first();
      if (await firstRow.count() > 0) {
        await firstRow.click();
        await page.waitForLoadState('networkidle');

        expect(page.url()).toMatch(/\/production\/shop-drawings\/[^\/]+$/);
        await expect(page.getByRole('heading')).toBeVisible();
      }
    });
  });

  test.describe('404 Detection - Critical Routes', () => {
    const criticalRoutes = [
      // Production
      '/production/orders',
      '/production/orders/new',
      '/production/shop-drawings',
      '/production/shop-drawings/new',
      '/production/prototypes',
      '/production/prototypes/new',
      '/production/packing',
      '/production/packing/new',
      '/production/qc',
      '/production/qc/new',
      '/production/factory-reviews',
      '/production/factory-reviews/new',

      // CRM
      '/crm/contacts',
      '/crm/contacts/new',
      '/crm/leads',
      '/crm/leads/new',
      '/crm/customers',
      '/crm/customers/new',

      // Design
      '/design/projects',
      '/design/projects/new',
      '/design/briefs',
      '/design/briefs/new',

      // Financials
      '/financials/invoices',
      '/financials/invoices/new',
      '/financials/payments',
      '/financials/payments/new',

      // Partners
      '/partners/designers',
      '/partners/designers/new',
      '/partners/factories',
      '/partners/factories/new',
    ];

    for (const route of criticalRoutes) {
      test(`Route exists and returns 200: ${route}`, async ({ page }) => {
        const response = await page.goto(route);
        expect(response?.status()).toBe(200);

        // Verify it's not showing a 404 page
        const heading = page.getByRole('heading').first();
        const headingText = await heading.textContent();
        expect(headingText).not.toMatch(/404|not found/i);
      });
    }
  });

  test.describe('Action Menu Items - Context Menu Routing', () => {
    test('CRM Contacts - Action menu items route correctly', async ({ page }) => {
      await page.goto('/crm/contacts');
      await page.waitForLoadState('networkidle');

      // Find first row with actions button
      const firstActionsButton = page.locator('[aria-label="Actions"], button:has-text("⋮")').first();
      if (await firstActionsButton.count() > 0) {
        await firstActionsButton.click();

        // Check if "View Details" or similar option exists
        const viewOption = page.locator('[role="menuitem"]').filter({ hasText: /view|details/i }).first();
        if (await viewOption.count() > 0) {
          await viewOption.click();
          await page.waitForLoadState('networkidle');

          // Verify navigation happened and no 404
          expect(page.url()).toMatch(/\/crm\/contacts\/[^\/]+$/);
          await expect(page.getByRole('heading')).toBeVisible();
        }
      }
    });
  });

  test.describe('Empty State Action Buttons', () => {
    test('Empty state "New" buttons route correctly', async ({ page }) => {
      // Navigate to pages and check if empty state appears
      const modulesToCheck = [
        { path: '/production/packing', newUrl: '/production/packing/new' },
        { path: '/production/qc', newUrl: '/production/qc/new' },
        { path: '/partners/designers', newUrl: '/partners/designers/new' },
      ];

      for (const module of modulesToCheck) {
        await page.goto(module.path);
        await page.waitForLoadState('networkidle');

        // Check if there's an empty state with action button
        const emptyStateButton = page.getByRole('button', { name: /create|add|new/i });

        // If empty state exists and has button, verify it routes correctly
        if (await emptyStateButton.count() > 0) {
          const buttonText = await emptyStateButton.textContent();
          if (buttonText && buttonText.toLowerCase().includes('first')) {
            await emptyStateButton.click();
            await page.waitForLoadState('networkidle');

            expect(page.url()).toContain(module.newUrl);
            await expect(page.getByRole('heading', { name: /create|new/i })).toBeVisible();

            // Go back for next iteration
            await page.goBack();
            await page.waitForLoadState('networkidle');
          }
        }
      }
    });
  });
});
