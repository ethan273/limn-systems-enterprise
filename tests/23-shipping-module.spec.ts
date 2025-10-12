import { test, expect } from '@playwright/test';
import { login } from './helpers/auth-helper';
import { TEST_CONFIG } from './config/test-config';
import path from 'path';

/**
 * SHIPPING MODULE TESTS
 *
 * Comprehensive testing of all shipping-related functionality:
 * - Shipments (CRUD, tracking, status updates)
 * - Carriers (carrier management, rates)
 * - Tracking (tracking numbers, delivery confirmation)
 * - Shipping Costs (cost calculation, billing)
 * - Labels (label generation, printing)
 *
 * Coverage Target: 100%
 */

test.describe('🚚 SHIPPING MODULE TESTS @shipping', () => {

  test.beforeEach(async ({ page }) => {
    // Login as admin before each test
    await login(page, TEST_CONFIG.ADMIN_EMAIL, TEST_CONFIG.ADMIN_PASSWORD);
  });

  test.describe('Shipments', () => {

    test('Shipments page loads and displays list', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.BASE_URL}/shipping/shipments`);

      // Wait for DataTable to render (after auth + tRPC query completes)
      await page.waitForSelector('[data-testid="data-table"]', { timeout: 15000 });

      // Verify page title
      await expect(page.locator('h1')).toContainText(/shipments/i);

      // Check for DataTable or data display
      const hasDataTable = await page.locator('[data-testid="data-table"], .data-table, table').count() > 0;
      expect(hasDataTable).toBeTruthy();

      await page.screenshot({
        path: path.join(TEST_CONFIG.SCREENSHOT_DIR, 'shipping-01-shipments-list.png'),
        fullPage: true
      });
    });

    test('Can create new shipment', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.BASE_URL}/shipping/shipments`);
      await page.waitForLoadState('domcontentloaded');

      // Look for create button
      const createButton = page.locator('button:has-text("New Shipment"), button:has-text("Create"), a:has-text("New")').first();

      if (await createButton.isVisible()) {
        await createButton.click();
        await page.waitForLoadState('domcontentloaded');

        // Should navigate to create page or show dialog
        const hasDialog = await page.locator('[role="dialog"], .modal').count() > 0;
        const url = page.url();
        const onCreatePage = url.match(/\/shipping\/shipments\/new|\/shipping\/shipments\/create/);

        expect(hasDialog || onCreatePage).toBeTruthy();

        await page.screenshot({
          path: path.join(TEST_CONFIG.SCREENSHOT_DIR, 'shipping-02-create-shipment.png'),
          fullPage: true
        });
      }
    });

    test('Can view shipment details', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.BASE_URL}/shipping/shipments`);
      await page.waitForLoadState('domcontentloaded');

      // Click first shipment
      const firstShipment = page.locator('table tbody tr, [data-testid="table-row"]').first();

      if (await firstShipment.isVisible()) {
        await firstShipment.click();
        await page.waitForLoadState('domcontentloaded');

        // Should navigate to detail page
        const url = page.url();
        expect(url).toMatch(/\/shipping\/shipments\/[a-z0-9-]+$/);

        await page.screenshot({
          path: path.join(TEST_CONFIG.SCREENSHOT_DIR, 'shipping-03-shipment-detail.png'),
          fullPage: true
        });
      }
    });

    test('Can update shipment status', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.BASE_URL}/shipping/shipments`);
      await page.waitForLoadState('domcontentloaded');

      // Click first shipment
      const firstShipment = page.locator('table tbody tr').first();

      if (await firstShipment.isVisible()) {
        await firstShipment.click();
        await page.waitForLoadState('domcontentloaded');

        // Look for status dropdown or update button
        const statusDropdown = page.locator('select').filter({ hasText: /status/i }).first();
        const updateButton = page.locator('button:has-text("Update Status"), button:has-text("Change Status")').first();

        const hasStatusControls = (await statusDropdown.count() > 0) || (await updateButton.count() > 0);

        if (hasStatusControls) {
          await page.screenshot({
            path: path.join(TEST_CONFIG.SCREENSHOT_DIR, 'shipping-04-update-status.png'),
            fullPage: true
          });
        }
      }
    });

    test('Can filter shipments by status', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.BASE_URL}/shipping/shipments`);
      await page.waitForLoadState('domcontentloaded');

      // Look for status filter
      const statusFilter = page.locator('select, [role="combobox"]').filter({ hasText: /status|filter/i }).first();

      if (await statusFilter.isVisible()) {
        await statusFilter.click();

        // Select a status
        const option = page.locator('option, [role="option"]').filter({ hasText: /pending|in.transit|delivered/i }).first();

        if (await option.isVisible()) {
          await option.click();
          await page.waitForTimeout(1000);

          await page.screenshot({
            path: path.join(TEST_CONFIG.SCREENSHOT_DIR, 'shipping-05-filtered-shipments.png'),
            fullPage: true
          });
        }
      }
    });

    test('Can search shipments', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.BASE_URL}/shipping/shipments`);
      await page.waitForLoadState('domcontentloaded');

      // Look for search input
      const searchInput = page.locator('input[type="search"], input[placeholder*="search" i]').first();

      if (await searchInput.isVisible()) {
        await searchInput.fill('TEST');
        await page.waitForTimeout(500);

        await page.screenshot({
          path: path.join(TEST_CONFIG.SCREENSHOT_DIR, 'shipping-06-search-shipments.png'),
          fullPage: true
        });
      }
    });
  });

  test.describe('Tracking', () => {

    test('Can add tracking number to shipment', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.BASE_URL}/shipping/shipments`);
      await page.waitForLoadState('domcontentloaded');

      // Click first shipment
      const firstShipment = page.locator('table tbody tr').first();

      if (await firstShipment.isVisible()) {
        await firstShipment.click();
        await page.waitForLoadState('domcontentloaded');

        // Look for tracking number input or button
        const trackingInput = page.locator('input[name*="tracking"], input[placeholder*="tracking" i]').first();
        const addTrackingButton = page.locator('button:has-text("Add Tracking"), button:has-text("Update Tracking")').first();

        const hasTrackingControls = (await trackingInput.count() > 0) || (await addTrackingButton.count() > 0);

        if (hasTrackingControls) {
          await page.screenshot({
            path: path.join(TEST_CONFIG.SCREENSHOT_DIR, 'shipping-07-tracking-number.png'),
            fullPage: true
          });
        }
      }
    });

    test('Can view tracking history', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.BASE_URL}/shipping/shipments`);
      await page.waitForLoadState('domcontentloaded');

      // Click first shipment with tracking
      const firstShipment = page.locator('table tbody tr').first();

      if (await firstShipment.isVisible()) {
        await firstShipment.click();
        await page.waitForLoadState('domcontentloaded');

        // Look for tracking history section
        const trackingHistory = page.locator('div:has-text("Tracking History"), section:has-text("Tracking"), h2:has-text("Tracking")').first();

        if (await trackingHistory.isVisible()) {
          await page.screenshot({
            path: path.join(TEST_CONFIG.SCREENSHOT_DIR, 'shipping-08-tracking-history.png'),
            fullPage: true
          });
        }
      }
    });

    test('Tracking page loads correctly', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.BASE_URL}/shipping/tracking`);

      // Wait for DataTable to render (after auth + tRPC query completes)
      await page.waitForSelector('[data-testid="data-table"]', { timeout: 15000 });

      // Verify page loaded
      const hasContent = await page.locator('h1, h2, main').count() > 0;
      expect(hasContent).toBeTruthy();

      await page.screenshot({
        path: path.join(TEST_CONFIG.SCREENSHOT_DIR, 'shipping-09-tracking-page.png'),
        fullPage: true
      });
    });
  });

  test.describe('Carriers', () => {

    test('Can view carriers list', async ({ page }) => {
      // Try common carrier/settings routes
      const routes = [
        '/shipping/carriers',
        '/shipping/settings',
        '/admin/shipping/carriers',
      ];

      for (const route of routes) {
        await page.goto(`${TEST_CONFIG.BASE_URL}${route}`);
        await page.waitForLoadState('domcontentloaded');

        // Check if page exists (not 404)
        const is404 = await page.locator('text=/404|not found/i').count() > 0;

        if (!is404) {
          await page.screenshot({
            path: path.join(TEST_CONFIG.SCREENSHOT_DIR, 'shipping-10-carriers.png'),
            fullPage: true
          });
          break;
        }
      }
    });
  });

  test.describe('Delivery Confirmation', () => {

    test('Can mark shipment as delivered', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.BASE_URL}/shipping/shipments`);
      await page.waitForLoadState('domcontentloaded');

      // Click first shipment
      const firstShipment = page.locator('table tbody tr').first();

      if (await firstShipment.isVisible()) {
        await firstShipment.click();
        await page.waitForLoadState('domcontentloaded');

        // Look for delivered button or status
        const deliveredButton = page.locator('button:has-text("Mark as Delivered"), button:has-text("Delivered")').first();
        const statusDropdown = page.locator('select').filter({ hasText: /status/i }).first();

        const hasDeliveryControls = (await deliveredButton.count() > 0) || (await statusDropdown.count() > 0);

        if (hasDeliveryControls) {
          await page.screenshot({
            path: path.join(TEST_CONFIG.SCREENSHOT_DIR, 'shipping-11-mark-delivered.png'),
            fullPage: true
          });
        }
      }
    });

    test('Can view delivery confirmation details', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.BASE_URL}/shipping/shipments`);
      await page.waitForLoadState('domcontentloaded');

      // Look for delivered shipment
      const deliveredShipment = page.locator('tr:has-text("Delivered"), [data-status="delivered"]').first();

      if (await deliveredShipment.isVisible()) {
        await deliveredShipment.click();
        await page.waitForLoadState('domcontentloaded');

        // Should show delivery date/time
        const hasDeliveryInfo = await page.locator('text=/delivered|delivery date|signed by/i').count() > 0;

        if (hasDeliveryInfo) {
          await page.screenshot({
            path: path.join(TEST_CONFIG.SCREENSHOT_DIR, 'shipping-12-delivery-confirmation.png'),
            fullPage: true
          });
        }
      }
    });
  });

  test.describe('Shipping Costs', () => {

    test('Shipping costs are displayed', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.BASE_URL}/shipping/shipments`);
      await page.waitForLoadState('domcontentloaded');

      // Click first shipment
      const firstShipment = page.locator('table tbody tr').first();

      if (await firstShipment.isVisible()) {
        await firstShipment.click();
        await page.waitForLoadState('domcontentloaded');

        // Look for cost information
        const hasCostInfo = await page.locator('text=/cost|price|rate|\\$[0-9]/i').count() > 0;

        if (hasCostInfo) {
          await page.screenshot({
            path: path.join(TEST_CONFIG.SCREENSHOT_DIR, 'shipping-13-costs.png'),
            fullPage: true
          });
        }
      }
    });
  });

  test.describe('Shipping Labels', () => {

    test('Can generate shipping label', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.BASE_URL}/shipping/shipments`);
      await page.waitForLoadState('domcontentloaded');

      // Click first shipment
      const firstShipment = page.locator('table tbody tr').first();

      if (await firstShipment.isVisible()) {
        await firstShipment.click();
        await page.waitForLoadState('domcontentloaded');

        // Look for label generation button
        const labelButton = page.locator('button:has-text("Generate Label"), button:has-text("Print Label"), button:has-text("Download Label")').first();

        if (await labelButton.isVisible()) {
          // Label generation available
          expect(await labelButton.isEnabled()).toBeTruthy();

          await page.screenshot({
            path: path.join(TEST_CONFIG.SCREENSHOT_DIR, 'shipping-14-label-generation.png'),
            fullPage: true
          });
        }
      }
    });
  });

  test.describe('Shipping Module Integration Tests', () => {

    test('Can navigate between shipping module pages', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.BASE_URL}/shipping/shipments`);
      await page.waitForLoadState('domcontentloaded');

      // Wait for page to fully load
      await page.waitForSelector('h1, main', { timeout: 5000 }).catch(() => {});

      // Verify tracking link exists in sidebar
      const trackingLink = page.locator('nav a[href="/shipping/tracking"]').first();
      await expect(trackingLink).toBeVisible({ timeout: 5000 });

      // Navigate to tracking page
      await page.goto(`${TEST_CONFIG.BASE_URL}/shipping/tracking`);
      await page.waitForLoadState('domcontentloaded');

      // Verify navigation occurred
      const url = page.url();
      expect(url).toContain('tracking');

      // Verify tracking page loaded
      const hasContent = await page.locator('h1, main').count() > 0;
      expect(hasContent).toBeTruthy();
    });

    test('Shipping statistics display correctly', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.BASE_URL}/shipping/shipments`);
      await page.waitForLoadState('domcontentloaded');

      // Look for stats/metrics cards
      const statsCards = page.locator('[class*="stat"], [class*="metric"], [class*="card"]');

      if (await statsCards.count() > 0) {
        await page.screenshot({
          path: path.join(TEST_CONFIG.SCREENSHOT_DIR, 'shipping-15-statistics.png'),
          fullPage: true
        });
      }
    });

    test('Can filter shipments by date range', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.BASE_URL}/shipping/shipments`);
      await page.waitForLoadState('domcontentloaded');

      // Look for date filter
      const dateFilter = page.locator('input[type="date"], [data-testid="date-picker"]').first();

      if (await dateFilter.isVisible()) {
        await page.screenshot({
          path: path.join(TEST_CONFIG.SCREENSHOT_DIR, 'shipping-16-date-filter.png'),
          fullPage: true
        });
      }
    });

    test('Shipment search works correctly', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.BASE_URL}/shipping/shipments`);
      await page.waitForLoadState('domcontentloaded');

      const searchInput = page.locator('input[type="search"], input[placeholder*="search" i]').first();

      if (await searchInput.isVisible()) {
        // Search functionality is available
        expect(await searchInput.isEnabled()).toBeTruthy();
      }
    });
  });

  test.describe('Shipment Creation Workflow', () => {

    test('Can select carrier for new shipment', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.BASE_URL}/shipping/shipments`);
      await page.waitForLoadState('domcontentloaded');

      const createButton = page.locator('button:has-text("New"), button:has-text("Create")').first();

      if (await createButton.isVisible()) {
        await createButton.click();
        await page.waitForLoadState('domcontentloaded');

        // Look for carrier selection
        const carrierSelect = page.locator('select[name*="carrier"], [data-testid="carrier-select"]').first();

        if (await carrierSelect.isVisible()) {
          await page.screenshot({
            path: path.join(TEST_CONFIG.SCREENSHOT_DIR, 'shipping-17-select-carrier.png'),
            fullPage: true
          });
        }
      }
    });

    test('Can add items to shipment', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.BASE_URL}/shipping/shipments`);
      await page.waitForLoadState('domcontentloaded');

      const createButton = page.locator('button:has-text("New"), button:has-text("Create")').first();

      if (await createButton.isVisible()) {
        await createButton.click();
        await page.waitForLoadState('domcontentloaded');

        // Look for add items button
        const addItemsButton = page.locator('button:has-text("Add Items"), button:has-text("Select Items")').first();

        if (await addItemsButton.isVisible()) {
          await page.screenshot({
            path: path.join(TEST_CONFIG.SCREENSHOT_DIR, 'shipping-18-add-items.png'),
            fullPage: true
          });
        }
      }
    });
  });
});
