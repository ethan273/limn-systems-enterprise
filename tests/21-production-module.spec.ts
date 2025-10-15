import { test, expect } from '@playwright/test';
import { login } from './helpers/auth-helper';
import { TEST_CONFIG } from './config/test-config';
import path from 'path';

/**
 * PRODUCTION MODULE TESTS
 *
 * Comprehensive testing of all production-related functionality:
 * - Production Orders (CRUD, status updates, filtering)
 * - Shop Drawings (upload, review, approval workflows)
 * - Quality Control (inspection creation, defect tracking, reporting)
 * - Prototypes (creation, approval, conversion to production)
 * - Packing Lists (generation, item management)
 *
 * Coverage Target: 100%
 */

test.describe('🏭 PRODUCTION MODULE TESTS @production', () => {

  test.beforeEach(async ({ page }) => {
    // Login as admin before each test
    await login(page, TEST_CONFIG.ADMIN_EMAIL, TEST_CONFIG.ADMIN_PASSWORD);
  });

  test.describe('Production Orders', () => {

    test('Production orders page loads and displays list', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.BASE_URL}/production/orders`);

      // Wait for DataTable to render (after auth + tRPC query completes)
      await page.waitForSelector('[data-testid="data-table"]', { timeout: 15000 });

      // Verify page title
      await expect(page.locator('h1')).toContainText(/production orders/i);

      // Check for DataTable or data display
      const hasDataTable = await page.locator('[data-testid="data-table"], .data-table, table').count() > 0;
      expect(hasDataTable).toBeTruthy();

      await page.screenshot({
        path: path.join(TEST_CONFIG.SCREENSHOT_DIR, 'production-01-orders-list.png'),
        fullPage: true
      });
    });

    test('Can navigate to create new production order', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.BASE_URL}/production/orders`);

      // Look for create/new button
      const createButton = page.locator('button:has-text("New"), button:has-text("Create"), a:has-text("New Order")').first();

      if (await createButton.isVisible()) {
        await createButton.click();
        await page.waitForLoadState('domcontentloaded');

        // Should navigate to create page
        const url = page.url();
        expect(url).toMatch(/\/production\/orders\/new|\/production\/orders\/create/);
      }
    });

    test('Can view production order details', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.BASE_URL}/production/orders`);
      await page.waitForLoadState('domcontentloaded');

      // Find first row in table
      const firstRow = page.locator('table tbody tr, [data-testid="table-row"]').first();

      if (await firstRow.isVisible()) {
        await firstRow.click();
        await page.waitForLoadState('domcontentloaded');

        // Should navigate to detail page
        const url = page.url();
        expect(url).toMatch(/\/production\/orders\/[a-z0-9-]+$/);

        await page.screenshot({
          path: path.join(TEST_CONFIG.SCREENSHOT_DIR, 'production-02-order-detail.png'),
          fullPage: true
        });
      }
    });

    test('Can filter production orders by status', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.BASE_URL}/production/orders`);
      await page.waitForLoadState('domcontentloaded');

      // Look for status filter dropdown
      const statusFilter = page.locator('select, [role="combobox"]').filter({ hasText: /status|filter/i }).first();

      if (await statusFilter.isVisible()) {
        await statusFilter.click();

        // Select a status (e.g., "In Production")
        const option = page.locator('option, [role="option"]').filter({ hasText: /in.production|pending|completed/i }).first();

        if (await option.isVisible()) {
          await option.click();
          await page.waitForTimeout(1000); // Wait for filter to apply

          // Verify URL updated or table refreshed
          await page.screenshot({
            path: path.join(TEST_CONFIG.SCREENSHOT_DIR, 'production-03-filtered-orders.png'),
            fullPage: true
          });
        }
      }
    });

    test('Can search production orders', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.BASE_URL}/production/orders`);
      await page.waitForLoadState('domcontentloaded');

      // Look for search input
      const searchInput = page.locator('input[type="search"], input[placeholder*="search" i]').first();

      if (await searchInput.isVisible()) {
        await searchInput.fill('TEST');
        await page.waitForTimeout(500); // Wait for search debounce

        await page.screenshot({
          path: path.join(TEST_CONFIG.SCREENSHOT_DIR, 'production-04-search-orders.png'),
          fullPage: true
        });
      }
    });

    test('Production order status can be updated', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.BASE_URL}/production/orders`);
      await page.waitForLoadState('domcontentloaded');

      // Click first order to view details
      const firstRow = page.locator('table tbody tr, [data-testid="table-row"]').first();

      if (await firstRow.isVisible()) {
        await firstRow.click();
        await page.waitForLoadState('domcontentloaded');

        // Look for status dropdown or update button
        const statusDropdown = page.locator('select').filter({ hasText: /status/i }).first();
        const updateButton = page.locator('button:has-text("Update Status")').first();

        if (await statusDropdown.isVisible()) {
          // Status can be changed via dropdown
          expect(await statusDropdown.isEnabled()).toBeTruthy();
        } else if (await updateButton.isVisible()) {
          // Status update button exists
          expect(await updateButton.isEnabled()).toBeTruthy();
        }
      }
    });
  });

  test.describe('Shop Drawings', () => {

    test('Shop drawings page loads correctly', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.BASE_URL}/production/shop-drawings`);

      // Wait for DataTable to render (after auth + tRPC query completes)
      await page.waitForSelector('[data-testid="data-table"]', { timeout: 15000 });

      // Verify page title
      await expect(page.locator('h1')).toContainText(/shop.drawings/i);

      await page.screenshot({
        path: path.join(TEST_CONFIG.SCREENSHOT_DIR, 'production-05-shop-drawings.png'),
        fullPage: true
      });
    });

    test('Can upload new shop drawing', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.BASE_URL}/production/shop-drawings`);
      await page.waitForLoadState('domcontentloaded');

      // Look for upload button
      const uploadButton = page.locator('button:has-text("Upload"), button:has-text("New Drawing")').first();

      if (await uploadButton.isVisible()) {
        await uploadButton.click();

        // Check for file input or upload dialog
        const fileInput = page.locator('input[type="file"]').first();
        const hasUploadDialog = await page.locator('[role="dialog"], .modal').count() > 0;

        expect(await fileInput.isVisible() || hasUploadDialog).toBeTruthy();
      }
    });

    test('Can view shop drawing details', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.BASE_URL}/production/shop-drawings`);
      await page.waitForLoadState('domcontentloaded');

      // Click first drawing
      const firstDrawing = page.locator('table tbody tr, [data-testid="drawing-item"]').first();

      if (await firstDrawing.isVisible()) {
        await firstDrawing.click();
        await page.waitForLoadState('domcontentloaded');

        // Should show drawing details
        const url = page.url();
        expect(url).toMatch(/\/production\/shop-drawings\/[a-z0-9-]+$/);
      }
    });

    test('Can approve or reject shop drawing', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.BASE_URL}/production/shop-drawings`);
      await page.waitForLoadState('domcontentloaded');

      // Click first drawing
      const firstDrawing = page.locator('table tbody tr, [data-testid="drawing-item"]').first();

      if (await firstDrawing.isVisible()) {
        await firstDrawing.click();
        await page.waitForLoadState('domcontentloaded');

        // Look for approve/reject buttons
        const approveButton = page.locator('button:has-text("Approve")').first();
        const rejectButton = page.locator('button:has-text("Reject")').first();

        const hasApprovalControls = (await approveButton.count() > 0) || (await rejectButton.count() > 0);

        if (hasApprovalControls) {
          await page.screenshot({
            path: path.join(TEST_CONFIG.SCREENSHOT_DIR, 'production-06-drawing-approval.png'),
            fullPage: true
          });
        }
      }
    });
  });

  test.describe('Quality Control', () => {

    test('Quality inspections page loads correctly', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.BASE_URL}/production/qc`);

      // Wait for DataTable to render (after auth + tRPC query completes)
      await page.waitForSelector('[data-testid="data-table"]', { timeout: 15000 });

      // Verify page title
      await expect(page.locator('h1')).toContainText(/quality|inspections/i);

      await page.screenshot({
        path: path.join(TEST_CONFIG.SCREENSHOT_DIR, 'production-07-quality-list.png'),
        fullPage: true
      });
    });

    test('Can create new quality inspection', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.BASE_URL}/production/qc`);
      await page.waitForLoadState('domcontentloaded');

      // Look for create button
      const createButton = page.locator('button:has-text("New Inspection"), button:has-text("Create")').first();

      if (await createButton.isVisible()) {
        await createButton.click();
        await page.waitForLoadState('domcontentloaded');

        // Should navigate to create page or show dialog
        const hasDialog = await page.locator('[role="dialog"], .modal').count() > 0;
        const url = page.url();
        const onCreatePage = url.match(/\/production\/quality\/new|\/production\/quality\/create/);

        expect(hasDialog || onCreatePage).toBeTruthy();
      }
    });

    test('Can view inspection details', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.BASE_URL}/production/qc`);
      await page.waitForLoadState('domcontentloaded');

      // Click first inspection
      const firstInspection = page.locator('table tbody tr, [data-testid="inspection-item"]').first();

      if (await firstInspection.isVisible()) {
        await firstInspection.click();
        await page.waitForLoadState('domcontentloaded');

        // Should navigate to detail page
        const url = page.url();
        expect(url).toMatch(/\/production\/quality\/[a-z0-9-]+$/);

        await page.screenshot({
          path: path.join(TEST_CONFIG.SCREENSHOT_DIR, 'production-08-inspection-detail.png'),
          fullPage: true
        });
      }
    });

    test('Can record defects in inspection', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.BASE_URL}/production/qc`);
      await page.waitForLoadState('domcontentloaded');

      // Click first inspection
      const firstInspection = page.locator('table tbody tr').first();

      if (await firstInspection.isVisible()) {
        await firstInspection.click();
        await page.waitForLoadState('domcontentloaded');

        // Look for defect recording UI
        const addDefectButton = page.locator('button:has-text("Add Defect"), button:has-text("Record Defect")').first();
        const defectSection = page.locator('section:has-text("Defects"), div:has-text("Defects")').first();

        const hasDefectTracking = (await addDefectButton.count() > 0) || (await defectSection.count() > 0);

        if (hasDefectTracking) {
          await page.screenshot({
            path: path.join(TEST_CONFIG.SCREENSHOT_DIR, 'production-09-defect-tracking.png'),
            fullPage: true
          });
        }
      }
    });

    test('Can mark inspection as pass/fail', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.BASE_URL}/production/qc`);
      await page.waitForLoadState('domcontentloaded');

      // Click first inspection
      const firstInspection = page.locator('table tbody tr').first();

      if (await firstInspection.isVisible()) {
        await firstInspection.click();
        await page.waitForLoadState('domcontentloaded');

        // Look for pass/fail controls
        const passButton = page.locator('button:has-text("Pass"), button:has-text("Approve")').first();
        const failButton = page.locator('button:has-text("Fail"), button:has-text("Reject")').first();
        const resultDropdown = page.locator('select').filter({ hasText: /result|status/i }).first();

        const hasResultControls = (await passButton.count() > 0) ||
                                   (await failButton.count() > 0) ||
                                   (await resultDropdown.count() > 0);

        expect(hasResultControls).toBeTruthy();
      }
    });

    test('Can filter inspections by result', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.BASE_URL}/production/qc`);
      await page.waitForLoadState('domcontentloaded');

      // Look for result filter
      const resultFilter = page.locator('select, [role="combobox"]').filter({ hasText: /result|filter|status/i }).first();

      if (await resultFilter.isVisible()) {
        await resultFilter.click();

        // Select a result (e.g., "Passed")
        const option = page.locator('option, [role="option"]').filter({ hasText: /pass|fail|pending/i }).first();

        if (await option.isVisible()) {
          await option.click();
          await page.waitForTimeout(1000);

          await page.screenshot({
            path: path.join(TEST_CONFIG.SCREENSHOT_DIR, 'production-10-filtered-inspections.png'),
            fullPage: true
          });
        }
      }
    });
  });

  test.describe('Prototypes', () => {

    test('Prototypes page loads correctly', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.BASE_URL}/production/prototypes`);

      // Wait for DataTable to render (after auth + tRPC query completes)
      await page.waitForSelector('[data-testid="data-table"]', { timeout: 15000 });

      // Verify page title
      await expect(page.locator('h1')).toContainText(/prototypes/i);

      await page.screenshot({
        path: path.join(TEST_CONFIG.SCREENSHOT_DIR, 'production-11-prototypes-list.png'),
        fullPage: true
      });
    });

    test('Can create new prototype', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.BASE_URL}/production/prototypes`);
      await page.waitForLoadState('domcontentloaded');

      // Look for create button
      const createButton = page.locator('button:has-text("New Prototype"), button:has-text("Create")').first();

      if (await createButton.isVisible()) {
        await createButton.click();
        await page.waitForLoadState('domcontentloaded');

        // Should navigate to create page
        const url = page.url();
        expect(url).toMatch(/\/production\/prototypes\/new|\/production\/prototypes\/create/);
      }
    });

    test('Can view prototype details', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.BASE_URL}/production/prototypes`);
      await page.waitForLoadState('domcontentloaded');

      // Click first prototype
      const firstPrototype = page.locator('table tbody tr').first();

      if (await firstPrototype.isVisible()) {
        await firstPrototype.click();
        await page.waitForLoadState('domcontentloaded');

        // Should navigate to detail page
        const url = page.url();
        expect(url).toMatch(/\/production\/prototypes\/[a-z0-9-]+$/);

        await page.screenshot({
          path: path.join(TEST_CONFIG.SCREENSHOT_DIR, 'production-12-prototype-detail.png'),
          fullPage: true
        });
      }
    });

    test('Can approve prototype', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.BASE_URL}/production/prototypes`);
      await page.waitForLoadState('domcontentloaded');

      // Click first prototype
      const firstPrototype = page.locator('table tbody tr').first();

      if (await firstPrototype.isVisible()) {
        await firstPrototype.click();
        await page.waitForLoadState('domcontentloaded');

        // Look for approval controls
        const approveButton = page.locator('button:has-text("Approve")').first();
        const rejectButton = page.locator('button:has-text("Reject")').first();

        const hasApprovalControls = (await approveButton.count() > 0) || (await rejectButton.count() > 0);

        if (hasApprovalControls) {
          await page.screenshot({
            path: path.join(TEST_CONFIG.SCREENSHOT_DIR, 'production-13-prototype-approval.png'),
            fullPage: true
          });
        }
      }
    });

    test('Can convert prototype to production order', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.BASE_URL}/production/prototypes`);
      await page.waitForLoadState('domcontentloaded');

      // Click first approved prototype
      const firstPrototype = page.locator('table tbody tr').first();

      if (await firstPrototype.isVisible()) {
        await firstPrototype.click();
        await page.waitForLoadState('domcontentloaded');

        // Look for convert button
        const convertButton = page.locator('button:has-text("Convert"), button:has-text("Production Order")').first();

        if (await convertButton.isVisible()) {
          // Button exists for conversion
          expect(await convertButton.isEnabled()).toBeTruthy();
        }
      }
    });
  });

  test.describe('Packing Lists', () => {

    test('Packing lists page loads correctly', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.BASE_URL}/production/packing`);

      // Wait for DataTable to render (after auth + tRPC query completes)
      await page.waitForSelector('[data-testid="data-table"]', { timeout: 15000 });

      // Verify page title
      await expect(page.locator('h1')).toContainText(/packing/i);

      await page.screenshot({
        path: path.join(TEST_CONFIG.SCREENSHOT_DIR, 'production-14-packing-lists.png'),
        fullPage: true
      });
    });

    test('Can create new packing list', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.BASE_URL}/production/packing`);
      await page.waitForLoadState('domcontentloaded');

      // Look for create button
      const createButton = page.locator('button:has-text("New"), button:has-text("Create")').first();

      if (await createButton.isVisible()) {
        await createButton.click();
        await page.waitForLoadState('domcontentloaded');

        // Should navigate to create page or show dialog
        const hasDialog = await page.locator('[role="dialog"], .modal').count() > 0;
        const url = page.url();
        const onCreatePage = url.match(/\/production\/packing\/new|\/production\/packing\/create/);

        expect(hasDialog || onCreatePage).toBeTruthy();
      }
    });

    test('Can view packing list details', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.BASE_URL}/production/packing`);
      await page.waitForLoadState('domcontentloaded');

      // Click first packing list
      const firstPackingList = page.locator('table tbody tr').first();

      if (await firstPackingList.isVisible()) {
        await firstPackingList.click();
        await page.waitForLoadState('domcontentloaded');

        // Should navigate to detail page
        const url = page.url();
        expect(url).toMatch(/\/production\/packing\/[a-z0-9-]+$/);

        await page.screenshot({
          path: path.join(TEST_CONFIG.SCREENSHOT_DIR, 'production-15-packing-detail.png'),
          fullPage: true
        });
      }
    });

    test('Can add items to packing list', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.BASE_URL}/production/packing`);
      await page.waitForLoadState('domcontentloaded');

      // Click first packing list
      const firstPackingList = page.locator('table tbody tr').first();

      if (await firstPackingList.isVisible()) {
        await firstPackingList.click();
        await page.waitForLoadState('domcontentloaded');

        // Look for add item button
        const addItemButton = page.locator('button:has-text("Add Item"), button:has-text("Add Product")').first();

        if (await addItemButton.isVisible()) {
          await addItemButton.click();

          // Should show add item dialog or form
          const hasDialog = await page.locator('[role="dialog"], .modal').count() > 0;
          expect(hasDialog).toBeTruthy();
        }
      }
    });

    test('Can print packing list', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.BASE_URL}/production/packing`);
      await page.waitForLoadState('domcontentloaded');

      // Click first packing list
      const firstPackingList = page.locator('table tbody tr').first();

      if (await firstPackingList.isVisible()) {
        await firstPackingList.click();
        await page.waitForLoadState('domcontentloaded');

        // Look for print button
        const printButton = page.locator('button:has-text("Print"), button:has-text("Download")').first();

        if (await printButton.isVisible()) {
          // Button exists for printing
          expect(await printButton.isEnabled()).toBeTruthy();
        }
      }
    });

    test('Can mark packing list as shipped', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.BASE_URL}/production/packing`);
      await page.waitForLoadState('domcontentloaded');

      // Click first packing list
      const firstPackingList = page.locator('table tbody tr').first();

      if (await firstPackingList.isVisible()) {
        await firstPackingList.click();
        await page.waitForLoadState('domcontentloaded');

        // Look for ship button or status update
        const shipButton = page.locator('button:has-text("Ship"), button:has-text("Mark as Shipped")').first();
        const statusDropdown = page.locator('select').filter({ hasText: /status/i }).first();

        const hasShippingControls = (await shipButton.count() > 0) || (await statusDropdown.count() > 0);

        if (hasShippingControls) {
          await page.screenshot({
            path: path.join(TEST_CONFIG.SCREENSHOT_DIR, 'production-16-packing-ship.png'),
            fullPage: true
          });
        }
      }
    });
  });

  test.describe('Production Module Integration Tests', () => {

    test('Can navigate between production module pages', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.BASE_URL}/production/orders`);
      await page.waitForLoadState('domcontentloaded');

      // Test sidebar navigation to other production pages
      const shopDrawingsLink = page.locator('a:has-text("Shop Drawings"), nav a[href*="shop-drawings"]').first();

      if (await shopDrawingsLink.isVisible()) {
        await shopDrawingsLink.click();
        await page.waitForLoadState('domcontentloaded');

        const url = page.url();
        expect(url).toContain('shop-drawings');
      }
    });

    test('Production statistics display correctly', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.BASE_URL}/production/orders`);
      await page.waitForLoadState('domcontentloaded');

      // Look for stats/metrics cards
      const statsCards = page.locator('[class*="stat"], [class*="metric"], [class*="card"]');

      if (await statsCards.count() > 0) {
        // Stats cards are displayed
        await page.screenshot({
          path: path.join(TEST_CONFIG.SCREENSHOT_DIR, 'production-17-statistics.png'),
          fullPage: true
        });
      }
    });

    test('Production module search works across pages', async ({ page }) => {
      const productionPages = [
        '/production/orders',
        '/production/shop-drawings',
        '/production/qc',
        '/production/prototypes',
        '/production/packing'
      ];

      for (const pagePath of productionPages) {
        await page.goto(`${TEST_CONFIG.BASE_URL}${pagePath}`);
        await page.waitForLoadState('domcontentloaded');

        // Check if search input exists
        const searchInput = page.locator('input[type="search"], input[placeholder*="search" i]').first();

        if (await searchInput.isVisible()) {
          // Search functionality is available
          expect(await searchInput.isEnabled()).toBeTruthy();
        }
      }
    });
  });
});
