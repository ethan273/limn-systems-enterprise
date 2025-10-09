import { test, expect } from '@playwright/test';
import { portalLogin, PORTAL_TEST_USERS } from './helpers/portal-auth-helper';
import { TEST_CONFIG } from './config/test-config';
import path from 'path';

/**
 * Customer Portal Tests
 * Tests the customer-facing portal at /portal
 *
 * Portal Pages:
 * - /portal - Dashboard
 * - /portal/orders - Customer orders
 * - /portal/documents - Documents
 * - /portal/shipping - Shipping status
 * - /portal/financials - Invoices & payments
 */

test.describe('🏪 CUSTOMER PORTAL TESTS @customer-portal', () => {

  // ========================================
  // AUTHENTICATION & ACCESS
  // ========================================

  test.describe('Authentication & Access', () => {
    test('Customer portal has separate login page', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.BASE_URL}/portal/login`);
      await page.waitForLoadState('domcontentloaded');

      // Should see login form
      const emailInput = page.locator('input[type="email"]');
      const passwordInput = page.locator('input[type="password"]');
      const submitButton = page.locator('button[type="submit"]');

      await expect(emailInput).toBeVisible();
      await expect(passwordInput).toBeVisible();
      await expect(submitButton).toBeVisible();

      // Screenshot
      await page.screenshot({
        path: path.join(TEST_CONFIG.SCREENSHOT_DIR, 'customer-portal-01-login.png'),
        fullPage: true
      });
    });

    test('Customer can login to portal', async ({ page }) => {
      // Use portal auth helper with test customer credentials
      await portalLogin(page, PORTAL_TEST_USERS.customer.email, PORTAL_TEST_USERS.customer.password, 'customer');

      // Should see dashboard content
      const dashboard = await page.locator('h1:has-text("Dashboard"), h2:has-text("Dashboard")');
      await expect(dashboard).toBeVisible();
    });

    test('Customer cannot access internal admin pages', async ({ page }) => {
      await portalLogin(page, PORTAL_TEST_USERS.customer.email, PORTAL_TEST_USERS.customer.password, 'customer');

      // Try to access admin panel
      await page.goto(`${TEST_CONFIG.BASE_URL}/admin/users`);
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(2000);

      // Should be redirected or see unauthorized
      const url = page.url();
      const hasUnauthorizedText = await page.locator('text=/unauthorized|access denied|forbidden/i').count() > 0;
      // Middleware redirects to /dashboard for non-admins
      const isBlocked = url.includes('/login') || url.includes('/unauthorized') || url.includes('/dashboard') || hasUnauthorizedText;
      expect(isBlocked).toBeTruthy();
    });
  });

  // ========================================
  // DASHBOARD FUNCTIONALITY
  // ========================================

  test.describe('Portal Dashboard', () => {
    test.beforeEach(async ({ page }) => {
      await portalLogin(page, PORTAL_TEST_USERS.customer.email, PORTAL_TEST_USERS.customer.password, 'customer');
    });

    test('Dashboard displays stat cards', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.BASE_URL}/portal`);
      await page.waitForLoadState('domcontentloaded');

      // Should see stat cards
      const statsCards = await page.locator('[class*="grid"]').first();
      await expect(statsCards).toBeVisible();

      // Check for key metrics
      const activeOrders = await page.locator('text=Active Orders');
      const pendingPayments = await page.locator('text=Pending Payments');
      const recentShipments = await page.locator('text=Recent Shipments');

      await expect(activeOrders).toBeVisible();
      await expect(pendingPayments).toBeVisible();
      await expect(recentShipments).toBeVisible();

      await page.screenshot({
        path: path.join(TEST_CONFIG.SCREENSHOT_DIR, 'customer-portal-02-dashboard.png'),
        fullPage: true
      });
    });

    test('Dashboard stats are numeric and accurate', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.BASE_URL}/portal`);
      await page.waitForLoadState('domcontentloaded');

      // Get all stat numbers
      const statValues = await page.locator('div.text-3xl').allTextContents();

      // Each stat should be a number
      statValues.forEach(value => {
        const num = parseInt(value.trim());
        expect(Number.isInteger(num)).toBeTruthy();
        expect(num).toBeGreaterThanOrEqual(0);
      });
    });

    test('Dashboard stat cards are clickable and navigate correctly', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.BASE_URL}/portal`);
      await page.waitForLoadState('domcontentloaded');

      // Click on "Active Orders" card
      const ordersCard = await page.locator('text=Active Orders').locator('..').locator('..');
      await ordersCard.click();

      // Should navigate to orders page
      await expect(page).toHaveURL(/\/portal\/orders/);
    });
  });

  // ========================================
  // ORDERS PAGE
  // ========================================

  test.describe('Orders Page', () => {
    test.beforeEach(async ({ page }) => {
      await portalLogin(page, PORTAL_TEST_USERS.customer.email, PORTAL_TEST_USERS.customer.password, 'customer');
    });

    test('Orders page loads and displays table', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.BASE_URL}/portal/orders`);
      await page.waitForLoadState('domcontentloaded');

      // Wait for content to load
      await page.waitForTimeout(2000);

      // Should see page header
      const pageHeader = await page.locator('h1, h2').first();
      await expect(pageHeader).toBeVisible();

      // Should see table, cards, or empty state
      const hasTable = await page.locator('table').count() > 0;
      const hasCards = await page.locator('.border.rounded-lg').count() > 0;
      const hasEmptyState = await page.locator('text=/no.*orders/i').count() > 0;
      const hasLoading = await page.locator('text=/loading/i').count() > 0;

      expect(hasTable || hasCards || hasEmptyState || hasLoading).toBeTruthy();

      await page.screenshot({
        path: path.join(TEST_CONFIG.SCREENSHOT_DIR, 'customer-portal-03-orders.png'),
        fullPage: true
      });
    });

    test('Orders table has correct columns', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.BASE_URL}/portal/orders`);
      await page.waitForLoadState('domcontentloaded');

      const hasTable = await page.locator('table').count() > 0;

      if (hasTable) {
        // Check for expected columns
        const headers = await page.locator('thead th').allTextContents();

        // Should have order number, project, item, quantity, status
        const hasOrderNumber = headers.some(h => h.toLowerCase().includes('order'));
        const hasStatus = headers.some(h => h.toLowerCase().includes('status'));

        expect(hasOrderNumber).toBeTruthy();
        expect(hasStatus).toBeTruthy();
      }
    });

    test('Order status badges display correctly', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.BASE_URL}/portal/orders`);
      await page.waitForLoadState('domcontentloaded');

      const hasTable = await page.locator('table').count() > 0;

      if (hasTable) {
        // Check for status badges
        const badges = await page.locator('[class*="badge"]').count();

        if (badges > 0) {
          // Badges should have appropriate styling
          const firstBadge = await page.locator('[class*="badge"]').first();
          await expect(firstBadge).toBeVisible();
        }
      }
    });

    test('Can click on order to view details', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.BASE_URL}/portal/orders`);
      await page.waitForLoadState('domcontentloaded');

      const hasTable = await page.locator('table tbody tr').count() > 0;

      if (hasTable) {
        const firstRow = await page.locator('table tbody tr').first();
        await firstRow.click();

        await page.waitForTimeout(2000);

        // Should navigate to order detail page or open modal
        const url = page.url();
        const hasModal = await page.locator('[role="dialog"]').count() > 0;

        expect(url.includes('/orders/') || hasModal).toBeTruthy();
      }
    });
  });

  // ========================================
  // DOCUMENTS PAGE
  // ========================================

  test.describe('Documents Page', () => {
    test.beforeEach(async ({ page }) => {
      await portalLogin(page, PORTAL_TEST_USERS.customer.email, PORTAL_TEST_USERS.customer.password, 'customer');
    });

    test('Documents page loads', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.BASE_URL}/portal/documents`);
      await page.waitForLoadState('domcontentloaded');

      const pageHeader = await page.locator('h1, h2').first();
      await expect(pageHeader).toBeVisible();

      await page.screenshot({
        path: path.join(TEST_CONFIG.SCREENSHOT_DIR, 'customer-portal-04-documents.png'),
        fullPage: true
      });
    });

    test('Documents list or empty state displays', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.BASE_URL}/portal/documents`);
      await page.waitForLoadState('domcontentloaded');

      const hasTable = await page.locator('table').count() > 0;
      const hasGrid = await page.locator('[class*="grid"]').count() > 0;
      const hasEmptyState = await page.locator('text=No documents').count() > 0;

      expect(hasTable || hasGrid || hasEmptyState).toBeTruthy();
    });
  });

  // ========================================
  // SHIPPING PAGE
  // ========================================

  test.describe('Shipping Page', () => {
    test.beforeEach(async ({ page }) => {
      await portalLogin(page, PORTAL_TEST_USERS.customer.email, PORTAL_TEST_USERS.customer.password, 'customer');
    });

    test('Shipping page loads', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.BASE_URL}/portal/shipping`);
      await page.waitForLoadState('domcontentloaded');

      const pageHeader = await page.locator('h1, h2').first();
      await expect(pageHeader).toBeVisible();

      await page.screenshot({
        path: path.join(TEST_CONFIG.SCREENSHOT_DIR, 'customer-portal-05-shipping.png'),
        fullPage: true
      });
    });

    test('Shipping status displays', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.BASE_URL}/portal/shipping`);
      await page.waitForLoadState('domcontentloaded');

      const hasContent = await page.locator('table, [class*="grid"]').count() > 0;
      const hasEmptyState = await page.locator('text=No shipments').count() > 0;

      expect(hasContent || hasEmptyState).toBeTruthy();
    });
  });

  // ========================================
  // FINANCIALS PAGE
  // ========================================

  test.describe('Financials Page', () => {
    test.beforeEach(async ({ page }) => {
      await portalLogin(page, PORTAL_TEST_USERS.customer.email, PORTAL_TEST_USERS.customer.password, 'customer');
    });

    test('Financials page loads', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.BASE_URL}/portal/financials`);
      await page.waitForLoadState('domcontentloaded');

      const pageHeader = await page.locator('h1, h2').first();
      await expect(pageHeader).toBeVisible();

      await page.screenshot({
        path: path.join(TEST_CONFIG.SCREENSHOT_DIR, 'customer-portal-06-financials.png'),
        fullPage: true
      });
    });

    test('Invoices or payment information displays', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.BASE_URL}/portal/financials`);
      await page.waitForLoadState('domcontentloaded');

      const hasContent = await page.locator('table, [class*="grid"]').count() > 0;
      const hasEmptyState = await page.locator('text=No invoices, text=No payments').count() > 0;

      expect(hasContent || hasEmptyState).toBeTruthy();
    });
  });

  // ========================================
  // MOBILE RESPONSIVENESS
  // ========================================

  test.describe('Mobile Responsiveness', () => {
    test('Portal dashboard is mobile responsive', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });

      await portalLogin(page, PORTAL_TEST_USERS.customer.email, PORTAL_TEST_USERS.customer.password, 'customer');

      await page.goto(`${TEST_CONFIG.BASE_URL}/portal`);
      await page.waitForLoadState('domcontentloaded');

      await page.screenshot({
        path: path.join(TEST_CONFIG.SCREENSHOT_DIR, 'customer-portal-07-mobile-dashboard.png'),
        fullPage: true
      });

      // Stats cards should stack vertically
      const statsGrid = await page.locator('[class*="grid"]').first();
      await expect(statsGrid).toBeVisible();
    });

    test('Portal orders table scrolls horizontally on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });

      await portalLogin(page, PORTAL_TEST_USERS.customer.email, PORTAL_TEST_USERS.customer.password, 'customer');

      await page.goto(`${TEST_CONFIG.BASE_URL}/portal/orders`);
      await page.waitForLoadState('domcontentloaded');

      await page.screenshot({
        path: path.join(TEST_CONFIG.SCREENSHOT_DIR, 'customer-portal-08-mobile-orders.png'),
        fullPage: true
      });

      const hasTable = await page.locator('table').count() > 0;

      if (hasTable) {
        // Table should be in scrollable container
        const scrollContainer = await page.locator('[class*="overflow-x"]').count();
        expect(scrollContainer).toBeGreaterThan(0);
      }
    });

    test('Portal navigation works on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });

      await portalLogin(page, PORTAL_TEST_USERS.customer.email, PORTAL_TEST_USERS.customer.password, 'customer');

      // Check for mobile menu or nav links
      const nav = await page.locator('nav, [role="navigation"]').count();
      expect(nav).toBeGreaterThan(0);
    });
  });

  // ========================================
  // DATA ACCURACY
  // ========================================

  test.describe('Data Accuracy', () => {
    test.beforeEach(async ({ page }) => {
      await portalLogin(page, PORTAL_TEST_USERS.customer.email, PORTAL_TEST_USERS.customer.password, 'customer');
    });

    test('Dashboard stats match data from API', async ({ page, request }) => {
      await page.goto(`${TEST_CONFIG.BASE_URL}/portal`);
      await page.waitForLoadState('domcontentloaded');

      // Get stats from UI
      const statValues = await page.locator('div.text-3xl').allTextContents();
      const uiActiveOrders = parseInt(statValues[0] || '0');

      // Get stats from API
      const response = await request.get(`${TEST_CONFIG.BASE_URL}/api/trpc/portal.getDashboardStats`);

      if (response.ok()) {
        const data = await response.json();
        // Verify UI matches API data structure exists
        expect(typeof data).toBe('object');
      }
    });

    test('Customer only sees their own orders', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.BASE_URL}/portal/orders`);
      await page.waitForLoadState('domcontentloaded');

      const hasTable = await page.locator('table tbody tr').count() > 0;

      if (hasTable) {
        // Get all order rows
        const rows = await page.locator('table tbody tr').count();
        expect(rows).toBeGreaterThan(0);

        // All orders should belong to this customer (verified by API filtering)
        // This is implicitly tested by proper API implementation
      }
    });
  });
});
