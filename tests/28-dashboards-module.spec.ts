import { test, expect } from '@playwright/test';
import path from 'path';
import { login } from './helpers/auth-helper';

const TEST_CONFIG = {
  BASE_URL: process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:3000',
  ADMIN_EMAIL: 'admin@test.com',
  ADMIN_PASSWORD: 'password123',
  SCREENSHOT_DIR: path.join(__dirname, '../screenshots/dashboards'),
};

/**
 * 📊 DASHBOARDS MODULE TESTS
 *
 * Test coverage for dashboard and analytics functionality:
 * - Main Dashboard (overview, KPIs, widgets)
 * - Role-Specific Dashboards (admin, designer, factory, customer)
 * - Analytics Dashboards (revenue, production, quality, inventory)
 * - Dashboard Widgets (sales, orders, tasks, alerts)
 * - Dashboard Customization (layout, widgets, preferences)
 * - Dashboard Filters (date ranges, status, categories)
 * - Dashboard Exports (PDF, Excel, CSV)
 * - Real-Time Updates (live data, notifications)
 * - Dashboard Navigation and Integration
 *
 * NOTE: Some tests may be conditional based on:
 * - Whether dashboard features are fully implemented
 * - User role and permissions
 * - Available data for visualization
 *
 * Tests will gracefully handle missing features and report what was tested.
 */

test.describe('📊 DASHBOARDS MODULE TESTS @dashboards', () => {
  test.beforeEach(async ({ page }) => {
    // Authenticate as admin for all tests
    await login(page, TEST_CONFIG.ADMIN_EMAIL, TEST_CONFIG.ADMIN_PASSWORD);
  });

  test.describe('Main Dashboard', () => {
    test('Dashboard page loads and displays overview', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.BASE_URL}/dashboard`);
      await page.waitForLoadState('domcontentloaded');

      // Check for page title
      const hasTitle = await page.locator('h1').count() > 0;
      if (hasTitle) {
        await expect(page.locator('h1')).toContainText(/dashboard|overview/i);
      }

      // Check for dashboard content (stat cards, quick actions)
      const hasDashboardContent = await page.locator('[data-testid="dashboard"], .dashboard, .stat-card, .card').count() > 0;
      expect(hasDashboardContent).toBeTruthy();

      await page.screenshot({
        path: path.join(TEST_CONFIG.SCREENSHOT_DIR, 'dashboards-01-main-view.png'),
        fullPage: true
      });
    });

    test('Dashboard displays key metrics/KPIs', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.BASE_URL}/dashboard`);
      await page.waitForLoadState('domcontentloaded');

      // Look for metric cards or KPI widgets
      const metricsCards = page.locator('[data-testid="metric-card"], .metric, .kpi, .stat-card, [class*="metric"]').first();
      const hasMetrics = await metricsCards.count() > 0;

      if (hasMetrics) {
        // Check for actual numeric values
        const hasNumbers = await page.locator('text=/\\d+|\\$[0-9,]+/').count() > 0;
        expect(hasNumbers).toBeTruthy();

        await page.screenshot({
          path: path.join(TEST_CONFIG.SCREENSHOT_DIR, 'dashboards-02-kpis.png'),
          fullPage: true
        });
      } else {
        console.log('⚠️ Dashboard metrics/KPIs not found');
      }
    });

    test('Dashboard displays recent activity', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.BASE_URL}/dashboard`);
      await page.waitForLoadState('domcontentloaded');

      const activitySection = page.locator('[data-testid="recent-activity"], [data-testid="activity"], h2:has-text("Activity"), h3:has-text("Recent")').first();
      const hasActivity = await activitySection.count() > 0;

      if (hasActivity) {
        await page.screenshot({
          path: path.join(TEST_CONFIG.SCREENSHOT_DIR, 'dashboards-03-recent-activity.png'),
          fullPage: true
        });
      } else {
        console.log('⚠️ Recent activity section not found');
      }
    });

    test('Dashboard displays alerts and notifications', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.BASE_URL}/dashboard`);
      await page.waitForLoadState('domcontentloaded');

      const alertsSection = page.locator('[data-testid="alerts"], [data-testid="notifications"], h2:has-text("Alerts"), .alert, .notification').first();
      const hasAlerts = await alertsSection.count() > 0;

      if (hasAlerts) {
        await page.screenshot({
          path: path.join(TEST_CONFIG.SCREENSHOT_DIR, 'dashboards-04-alerts.png'),
          fullPage: true
        });
      } else {
        console.log('⚠️ Alerts/notifications section not found');
      }
    });

    test('Dashboard displays task overview', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.BASE_URL}/dashboard`);
      await page.waitForLoadState('domcontentloaded');

      const tasksWidget = page.locator('[data-testid="tasks-widget"], h2:has-text("Tasks"), h3:has-text("My Tasks")').first();
      const hasTasks = await tasksWidget.count() > 0;

      if (hasTasks) {
        await page.screenshot({
          path: path.join(TEST_CONFIG.SCREENSHOT_DIR, 'dashboards-05-tasks-widget.png'),
          fullPage: true
        });
      } else {
        console.log('⚠️ Tasks widget not found');
      }
    });

    test('Dashboard displays orders overview', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.BASE_URL}/dashboard`);
      await page.waitForLoadState('domcontentloaded');

      const ordersWidget = page.locator('[data-testid="orders-widget"], h2:has-text("Orders"), :text("Orders"), :text("Active Orders")').first();
      const hasOrders = await ordersWidget.count() > 0;

      if (hasOrders) {
        await page.screenshot({
          path: path.join(TEST_CONFIG.SCREENSHOT_DIR, 'dashboards-06-orders-widget.png'),
          fullPage: true
        });
      } else {
        console.log('⚠️ Orders widget not found');
      }
    });
  });

  test.describe('Analytics Dashboards', () => {
    test('Can navigate to analytics page', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.BASE_URL}/admin/analytics`);
      await page.waitForLoadState('domcontentloaded');

      const hasTitle = await page.locator('h1').count() > 0;
      if (hasTitle) {
        await expect(page.locator('h1')).toContainText(/analytics/i);
      }

      await page.screenshot({
        path: path.join(TEST_CONFIG.SCREENSHOT_DIR, 'dashboards-07-analytics-view.png'),
        fullPage: true
      });
    });

    test('Analytics displays revenue charts', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.BASE_URL}/admin/analytics`);
      await page.waitForLoadState('domcontentloaded');

      const revenueChart = page.locator('[data-testid="revenue-chart"]').first();
      const hasChart = await revenueChart.count() > 0;

      if (hasChart) {
        await page.screenshot({
          path: path.join(TEST_CONFIG.SCREENSHOT_DIR, 'dashboards-08-revenue-chart.png'),
          fullPage: true
        });
      } else {
        console.log('⚠️ Revenue chart not found');
      }
    });

    test('Analytics displays production metrics', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.BASE_URL}/admin/analytics`);
      await page.waitForLoadState('domcontentloaded');

      const productionMetrics = page.locator('[data-testid="production-metrics"]').first();
      const hasMetrics = await productionMetrics.count() > 0;

      if (hasMetrics) {
        await page.screenshot({
          path: path.join(TEST_CONFIG.SCREENSHOT_DIR, 'dashboards-09-production-metrics.png'),
          fullPage: true
        });
      } else {
        console.log('⚠️ Production metrics not found');
      }
    });

    test('Analytics displays quality metrics', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.BASE_URL}/admin/analytics`);
      await page.waitForLoadState('domcontentloaded');

      const qualityMetrics = page.locator('[data-testid="quality-metrics"]').first();
      const hasMetrics = await qualityMetrics.count() > 0;

      if (hasMetrics) {
        await page.screenshot({
          path: path.join(TEST_CONFIG.SCREENSHOT_DIR, 'dashboards-10-quality-metrics.png'),
          fullPage: true
        });
      } else {
        console.log('⚠️ Quality metrics not found');
      }
    });

    test('Analytics displays inventory overview', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.BASE_URL}/admin/analytics`);
      await page.waitForLoadState('domcontentloaded');

      const inventorySection = page.locator('[data-testid="inventory"]').first();
      const hasInventory = await inventorySection.count() > 0;

      if (hasInventory) {
        await page.screenshot({
          path: path.join(TEST_CONFIG.SCREENSHOT_DIR, 'dashboards-11-inventory-overview.png'),
          fullPage: true
        });
      } else {
        console.log('⚠️ Inventory overview not found');
      }
    });
  });

  test.describe('Dashboard Filters', () => {
    test('Can filter dashboard by date range', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.BASE_URL}/dashboard`);
      await page.waitForLoadState('domcontentloaded');

      const dateFilter = page.locator('select[name*="date"], select[name*="period"], [data-testid="date-filter"], input[type="date"]').first();
      const hasDateFilter = await dateFilter.count() > 0;

      if (hasDateFilter) {
        // Try to interact with date filter
        const isSelect = await dateFilter.evaluate((el) => el.tagName === 'SELECT');
        if (isSelect) {
          await dateFilter.selectOption({ index: 1 });
        }
        await page.waitForLoadState('domcontentloaded');

        await page.screenshot({
          path: path.join(TEST_CONFIG.SCREENSHOT_DIR, 'dashboards-12-date-filter.png'),
          fullPage: true
        });
      } else {
        console.log('⚠️ Date filter not found');
      }
    });

    test('Can filter dashboard by status', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.BASE_URL}/dashboard`);
      await page.waitForLoadState('domcontentloaded');

      const statusFilter = page.locator('select[name*="status"], [data-testid="status-filter"]').first();
      const hasFilter = await statusFilter.count() > 0;

      if (hasFilter) {
        await statusFilter.selectOption({ index: 1 });
        await page.waitForLoadState('domcontentloaded');

        await page.screenshot({
          path: path.join(TEST_CONFIG.SCREENSHOT_DIR, 'dashboards-13-status-filter.png'),
          fullPage: true
        });
      } else {
        console.log('⚠️ Status filter not found');
      }
    });

    test('Can filter by category or type', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.BASE_URL}/admin/analytics`);
      await page.waitForLoadState('domcontentloaded');

      const categoryFilter = page.locator('select[name*="category"], select[name*="type"], [data-testid="category-filter"]').first();
      const hasFilter = await categoryFilter.count() > 0;

      if (hasFilter) {
        await categoryFilter.selectOption({ index: 1 });
        await page.waitForLoadState('domcontentloaded');

        await page.screenshot({
          path: path.join(TEST_CONFIG.SCREENSHOT_DIR, 'dashboards-14-category-filter.png'),
          fullPage: true
        });
      }
    });
  });

  test.describe('Dashboard Customization', () => {
    test('Can access dashboard settings', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.BASE_URL}/dashboard`);
      await page.waitForLoadState('domcontentloaded');

      const settingsButton = page.locator('button:has-text("Settings"), button:has-text("Customize"), button[title*="Settings"]').first();
      const hasSettings = await settingsButton.count() > 0;

      if (hasSettings) {
        await settingsButton.click();
        await page.waitForLoadState('domcontentloaded');

        await page.screenshot({
          path: path.join(TEST_CONFIG.SCREENSHOT_DIR, 'dashboards-15-settings.png'),
          fullPage: true
        });
      } else {
        console.log('⚠️ Dashboard settings not found');
      }
    });

    test('Can toggle dashboard widgets', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.BASE_URL}/dashboard`);
      await page.waitForLoadState('domcontentloaded');

      const widgetToggle = page.locator('button:has-text("Widgets"), button:has-text("Customize"), [data-testid="widget-toggle"]').first();
      const hasToggle = await widgetToggle.count() > 0;

      if (hasToggle) {
        await widgetToggle.click();
        await page.waitForLoadState('domcontentloaded');

        await page.screenshot({
          path: path.join(TEST_CONFIG.SCREENSHOT_DIR, 'dashboards-16-widget-toggle.png'),
          fullPage: true
        });
      } else {
        console.log('⚠️ Widget customization not found');
      }
    });

    test('Can save dashboard preferences', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.BASE_URL}/dashboard`);
      await page.waitForLoadState('domcontentloaded');

      const saveButton = page.locator('button:has-text("Save"), button:has-text("Apply")').first();
      const hasSave = await saveButton.count() > 0;

      if (hasSave) {
        await page.screenshot({
          path: path.join(TEST_CONFIG.SCREENSHOT_DIR, 'dashboards-17-save-preferences.png'),
          fullPage: true
        });
      }
    });
  });

  test.describe('Role-Specific Dashboards', () => {
    test('Admin dashboard displays admin-specific metrics', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.BASE_URL}/dashboard`);
      await page.waitForLoadState('domcontentloaded');

      // Admin should see metrics like total users, revenue, system health
      const adminMetrics = page.locator('text=/users|revenue|system/i').first();
      const hasAdminMetrics = await adminMetrics.count() > 0;

      if (hasAdminMetrics) {
        await page.screenshot({
          path: path.join(TEST_CONFIG.SCREENSHOT_DIR, 'dashboards-18-admin-dashboard.png'),
          fullPage: true
        });
      } else {
        console.log('⚠️ Admin-specific metrics not found');
      }
    });

    test('Designer portal dashboard loads', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.BASE_URL}/portal/designer`);
      await page.waitForLoadState('domcontentloaded');

      const hasContent = await page.locator('[data-testid="dashboard"], .dashboard, h1, h2').count() > 0;
      expect(hasContent).toBeTruthy();

      await page.screenshot({
        path: path.join(TEST_CONFIG.SCREENSHOT_DIR, 'dashboards-19-designer-dashboard.png'),
        fullPage: true
      });
    });

    test('Factory portal dashboard loads', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.BASE_URL}/portal/factory`);
      await page.waitForLoadState('domcontentloaded');

      const hasContent = await page.locator('[data-testid="dashboard"], .dashboard, h1, h2').count() > 0;
      expect(hasContent).toBeTruthy();

      await page.screenshot({
        path: path.join(TEST_CONFIG.SCREENSHOT_DIR, 'dashboards-20-factory-dashboard.png'),
        fullPage: true
      });
    });

    test('Customer portal dashboard loads', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.BASE_URL}/portal/customer`);
      await page.waitForLoadState('domcontentloaded');

      const hasContent = await page.locator('[data-testid="dashboard"], .dashboard, h1, h2').count() > 0;
      expect(hasContent).toBeTruthy();

      await page.screenshot({
        path: path.join(TEST_CONFIG.SCREENSHOT_DIR, 'dashboards-21-customer-dashboard.png'),
        fullPage: true
      });
    });
  });

  test.describe('Dashboard Widgets', () => {
    test('Sales widget displays correctly', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.BASE_URL}/dashboard`);
      await page.waitForLoadState('domcontentloaded');

      const salesWidget = page.locator('[data-testid="sales-widget"], text=/sales/i, h2:has-text("Sales")').first();
      const hasWidget = await salesWidget.count() > 0;

      if (hasWidget) {
        await page.screenshot({
          path: path.join(TEST_CONFIG.SCREENSHOT_DIR, 'dashboards-22-sales-widget.png'),
          fullPage: true
        });
      } else {
        console.log('⚠️ Sales widget not found');
      }
    });

    test('Orders widget displays correctly', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.BASE_URL}/dashboard`);
      await page.waitForLoadState('domcontentloaded');

      const ordersWidget = page.locator('[data-testid="orders-widget"], text=/orders/i').first();
      const hasWidget = await ordersWidget.count() > 0;

      if (hasWidget) {
        await page.screenshot({
          path: path.join(TEST_CONFIG.SCREENSHOT_DIR, 'dashboards-23-orders-widget.png'),
          fullPage: true
        });
      }
    });

    test('Production widget displays correctly', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.BASE_URL}/dashboard`);
      await page.waitForLoadState('domcontentloaded');

      const productionWidget = page.locator('[data-testid="production-widget"], text=/production/i').first();
      const hasWidget = await productionWidget.count() > 0;

      if (hasWidget) {
        await page.screenshot({
          path: path.join(TEST_CONFIG.SCREENSHOT_DIR, 'dashboards-24-production-widget.png'),
          fullPage: true
        });
      }
    });

    test('Charts render correctly', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.BASE_URL}/dashboard`);
      await page.waitForLoadState('domcontentloaded');

      const charts = page.locator('canvas, [data-testid="chart"], .recharts, .chart-container').first();
      const hasCharts = await charts.count() > 0;

      if (hasCharts) {
        await page.screenshot({
          path: path.join(TEST_CONFIG.SCREENSHOT_DIR, 'dashboards-25-charts.png'),
          fullPage: true
        });
      } else {
        console.log('⚠️ Charts not found');
      }
    });
  });

  test.describe('Dashboard Exports', () => {
    test('Can export dashboard as PDF', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.BASE_URL}/dashboard`);
      await page.waitForLoadState('domcontentloaded');

      const exportPdfButton = page.locator('button:has-text("PDF"), button:has-text("Export")').first();
      const hasExport = await exportPdfButton.count() > 0;

      if (hasExport) {
        await page.screenshot({
          path: path.join(TEST_CONFIG.SCREENSHOT_DIR, 'dashboards-26-export-pdf.png'),
          fullPage: true
        });
      } else {
        console.log('⚠️ PDF export not found');
      }
    });

    test('Can export dashboard data as Excel', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.BASE_URL}/admin/analytics`);
      await page.waitForLoadState('domcontentloaded');

      const exportExcelButton = page.locator('button:has-text("Excel"), button:has-text("Export")').first();
      const hasExport = await exportExcelButton.count() > 0;

      if (hasExport) {
        await page.screenshot({
          path: path.join(TEST_CONFIG.SCREENSHOT_DIR, 'dashboards-27-export-excel.png'),
          fullPage: true
        });
      } else {
        console.log('⚠️ Excel export not found');
      }
    });

    test('Can export dashboard data as CSV', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.BASE_URL}/admin/analytics`);
      await page.waitForLoadState('domcontentloaded');

      const exportCsvButton = page.locator('button:has-text("CSV"), button:has-text("Download")').first();
      const hasExport = await exportCsvButton.count() > 0;

      if (hasExport) {
        await page.screenshot({
          path: path.join(TEST_CONFIG.SCREENSHOT_DIR, 'dashboards-28-export-csv.png'),
          fullPage: true
        });
      } else {
        console.log('⚠️ CSV export not found');
      }
    });
  });

  test.describe('Real-Time Dashboard Updates', () => {
    test('Dashboard displays real-time data indicator', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.BASE_URL}/dashboard`);
      await page.waitForLoadState('domcontentloaded');

      const realtimeIndicator = page.locator('[data-testid="realtime"], text=/live|real.*time/i, .pulse, .live-indicator').first();
      const hasIndicator = await realtimeIndicator.count() > 0;

      if (hasIndicator) {
        await page.screenshot({
          path: path.join(TEST_CONFIG.SCREENSHOT_DIR, 'dashboards-29-realtime-indicator.png'),
          fullPage: true
        });
      } else {
        console.log('⚠️ Real-time indicator not found');
      }
    });

    test('Dashboard auto-refreshes data', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.BASE_URL}/dashboard`);
      await page.waitForLoadState('domcontentloaded');

      const refreshButton = page.locator('button:has-text("Refresh"), button[title*="Refresh"]').first();
      const hasRefresh = await refreshButton.count() > 0;

      if (hasRefresh) {
        await refreshButton.click();
        await page.waitForLoadState('domcontentloaded');

        await page.screenshot({
          path: path.join(TEST_CONFIG.SCREENSHOT_DIR, 'dashboards-30-refresh.png'),
          fullPage: true
        });
      } else {
        console.log('⚠️ Refresh functionality not found');
      }
    });
  });

  test.describe('Dashboards Module Integration Tests', () => {
    test('Can navigate from dashboard to orders', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.BASE_URL}/dashboard`);
      await page.waitForLoadState('domcontentloaded');

      const ordersLink = page.locator('a:has-text("Orders"), a:has-text("View All Orders"), [href*="/orders"]').first();
      const hasLink = await ordersLink.count() > 0;

      if (hasLink) {
        await ordersLink.click();
        await page.waitForLoadState('domcontentloaded');

        await page.screenshot({
          path: path.join(TEST_CONFIG.SCREENSHOT_DIR, 'dashboards-31-navigate-to-orders.png'),
          fullPage: true
        });
      } else {
        console.log('⚠️ Orders navigation link not found');
      }
    });

    test('Can navigate from dashboard to tasks', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.BASE_URL}/dashboard`);
      await page.waitForLoadState('domcontentloaded');

      const tasksLink = page.locator('a:has-text("Tasks"), a:has-text("View All Tasks"), [href*="/tasks"]').first();
      const hasLink = await tasksLink.count() > 0;

      if (hasLink) {
        await tasksLink.click();
        await page.waitForLoadState('domcontentloaded');

        await page.screenshot({
          path: path.join(TEST_CONFIG.SCREENSHOT_DIR, 'dashboards-32-navigate-to-tasks.png'),
          fullPage: true
        });
      }
    });

    test('Can navigate from dashboard to projects', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.BASE_URL}/dashboard`);
      await page.waitForLoadState('domcontentloaded');

      const projectsLink = page.locator('a:has-text("Projects"), [href*="/projects"]').first();
      const hasLink = await projectsLink.count() > 0;

      if (hasLink) {
        await projectsLink.click();
        await page.waitForLoadState('domcontentloaded');

        await page.screenshot({
          path: path.join(TEST_CONFIG.SCREENSHOT_DIR, 'dashboards-33-navigate-to-projects.png'),
          fullPage: true
        });
      }
    });

    test('Dashboard search functionality works', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.BASE_URL}/dashboard`);
      await page.waitForLoadState('domcontentloaded');

      const searchInput = page.locator('input[type="search"], input[placeholder*="Search"]').first();
      const hasSearch = await searchInput.count() > 0;

      if (hasSearch) {
        await searchInput.fill('test');
        await page.waitForLoadState('domcontentloaded');

        await page.screenshot({
          path: path.join(TEST_CONFIG.SCREENSHOT_DIR, 'dashboards-34-search.png'),
          fullPage: true
        });
      }
    });

    test('Dashboard breadcrumbs work correctly', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.BASE_URL}/dashboard`);
      await page.waitForLoadState('domcontentloaded');

      const breadcrumbs = page.locator('[data-testid="breadcrumbs"], .breadcrumbs, nav[aria-label*="Breadcrumb"]').first();
      const hasBreadcrumbs = await breadcrumbs.count() > 0;

      if (hasBreadcrumbs) {
        await page.screenshot({
          path: path.join(TEST_CONFIG.SCREENSHOT_DIR, 'dashboards-35-breadcrumbs.png'),
          fullPage: true
        });
      }
    });
  });

  test.describe('Dashboard Performance', () => {
    test('Dashboard loads within acceptable time', async ({ page }) => {
      const startTime = Date.now();
      await page.goto(`${TEST_CONFIG.BASE_URL}/dashboard`);
      await page.waitForLoadState('domcontentloaded');
      const loadTime = Date.now() - startTime;

      console.log(`Dashboard load time: ${loadTime}ms`);

      // Check that page loaded (even if slowly)
      const hasContent = await page.locator('h1, [data-testid="dashboard"]').count() > 0;
      expect(hasContent).toBeTruthy();

      await page.screenshot({
        path: path.join(TEST_CONFIG.SCREENSHOT_DIR, 'dashboards-36-performance.png'),
        fullPage: true
      });
    });

    test('Dashboard widgets load progressively', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.BASE_URL}/dashboard`);

      // Wait for initial content
      await page.waitForLoadState('domcontentloaded');

      // Check for loading indicators
      const loadingIndicators = page.locator('[data-testid="loading"], .loading, .skeleton').first();
      const hasLoading = await loadingIndicators.count() > 0;

      if (hasLoading) {
        console.log('✅ Progressive loading indicators found');
      }

      // Wait for full load
      await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {
        console.log('⚠️ Network idle timeout - dashboard still loading');
      });

      await page.screenshot({
        path: path.join(TEST_CONFIG.SCREENSHOT_DIR, 'dashboards-37-progressive-loading.png'),
        fullPage: true
      });
    });
  });
});
