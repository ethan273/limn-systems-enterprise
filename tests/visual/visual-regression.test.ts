import { test, expect } from '@playwright/test';

/**
 * Visual Regression Tests using Playwright Screenshots
 *
 * These tests capture screenshots of key pages and compare them against baselines.
 * When layouts or styles change, visual diffs will be detected.
 *
 * Usage:
 * - First run: `npx playwright test tests/visual --update-snapshots` to create baselines
 * - Subsequent runs: `npx playwright test tests/visual` to compare against baselines
 * - View diffs: `npx playwright show-report` if tests fail
 */

// Test configuration
const viewports = [
  { name: 'desktop', width: 1920, height: 1080 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'mobile', width: 375, height: 667 },
];

const themes = ['light', 'dark'];

// Key pages to test for visual regressions
const pagesToTest = [
  { name: 'Homepage', url: '/' },
  { name: 'Tasks List', url: '/tasks' },
  { name: 'My Tasks', url: '/tasks/my' },
  { name: 'CRM Contacts', url: '/crm/contacts' },
  { name: 'CRM Leads', url: '/crm/leads' },
  { name: 'CRM Customers', url: '/crm/clients' },
  { name: 'CRM Prospects', url: '/crm/prospects' },
  { name: 'Products Catalog', url: '/products/catalog' },
  { name: 'Products Collections', url: '/products/collections' },
  { name: 'Products Concepts', url: '/products/concepts' },
  { name: 'Products Prototypes', url: '/products/prototypes' },
  { name: 'Production Orders', url: '/production/orders' },
  { name: 'Production Ordered Items', url: '/production/ordered-items' },
  { name: 'Financials Invoices', url: '/financials/invoices' },
  { name: 'Financials Payments', url: '/financials/payments' },
  { name: 'Shipping Shipments', url: '/shipping/shipments' },
  { name: 'Documents', url: '/documents' },
];

// Generate tests for each viewport, theme, and page combination
for (const viewport of viewports) {
  for (const theme of themes) {
    for (const page of pagesToTest) {
      test(`Visual regression - ${page.name} - ${viewport.name} - ${theme} mode`, async ({ page: playwright }) => {
        // Set viewport
        await playwright.setViewportSize({
          width: viewport.width,
          height: viewport.height,
        });

        // Set theme
        await playwright.emulateMedia({ colorScheme: theme as 'light' | 'dark' });

        // Navigate to page
        await playwright.goto(`http://localhost:3000${page.url}`, {
          waitUntil: 'networkidle',
          timeout: 30000,
        });

        // Wait for content to load
        await playwright.waitForTimeout(1000);

        // Take screenshot and compare to baseline
        await expect(playwright).toHaveScreenshot(
          `${page.name.toLowerCase().replace(/\\s+/g, '-')}-${viewport.name}-${theme}.png`,
          {
            fullPage: true,
            animations: 'disabled', // Disable animations for consistent screenshots
            timeout: 10000,
          }
        );
      });
    }
  }
}

/**
 * Component-Specific Visual Tests
 * Test individual UI components in isolation
 */

test.describe('Component Visual Regression', () => {
  test('Header component - light mode', async ({ page }) => {
    await page.goto('http://localhost:3000/tasks', { waitUntil: 'networkidle' });
    await page.emulateMedia({ colorScheme: 'light' });
    await page.waitForTimeout(500);

    const header = page.locator('header.app-header');
    await expect(header).toHaveScreenshot('header-light.png');
  });

  test('Header component - dark mode', async ({ page }) => {
    await page.goto('http://localhost:3000/tasks', { waitUntil: 'networkidle' });
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.waitForTimeout(500);

    const header = page.locator('header.app-header');
    await expect(header).toHaveScreenshot('header-dark.png');
  });

  test('Sidebar navigation - light mode', async ({ page }) => {
    await page.goto('http://localhost:3000/tasks', { waitUntil: 'networkidle' });
    await page.emulateMedia({ colorScheme: 'light' });
    await page.waitForTimeout(500);

    const sidebar = page.locator('.app-sidebar');
    await expect(sidebar).toHaveScreenshot('sidebar-light.png');
  });

  test('Sidebar navigation - dark mode', async ({ page }) => {
    await page.goto('http://localhost:3000/tasks', { waitUntil: 'networkidle' });
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.waitForTimeout(500);

    const sidebar = page.locator('.app-sidebar');
    await expect(sidebar).toHaveScreenshot('sidebar-dark.png');
  });

  test('Status badges - all variants', async ({ page }) => {
    await page.goto('http://localhost:3000/tasks', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    // Find the first table row with badges
    const firstRow = page.locator('table tbody tr').first();
    await expect(firstRow).toHaveScreenshot('status-badges.png');
  });

  test('Action buttons in dropdown menu', async ({ page }) => {
    await page.goto('http://localhost:3000/tasks', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    // Click the first dropdown menu trigger
    const menuTrigger = page.locator('button.btn-icon').first();
    await menuTrigger.click();
    await page.waitForTimeout(500);

    // Screenshot the dropdown menu
    const menu = page.locator('[role="menu"]').first();
    await expect(menu).toHaveScreenshot('action-dropdown-menu.png');
  });
});

/**
 * Layout-Specific Visual Tests
 * Test detail page layouts to catch vertical stacking issues
 */

test.describe('Detail Page Layout Visual Regression', () => {
  test('Task detail page layout', async ({ page }) => {
    await page.goto('http://localhost:3000/tasks', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    // Click first task to go to detail page
    const firstTaskLink = page.locator('table tbody tr a').first();
    if ((await firstTaskLink.count()) > 0) {
      await firstTaskLink.click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);

      // Screenshot the detail list section
      const detailList = page.locator('.detail-list').first();
      await expect(detailList).toHaveScreenshot('task-detail-list.png');
    }
  });

  test('Grid layouts - stat cards', async ({ page }) => {
    await page.goto('http://localhost:3000/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    // Screenshot stat cards grid
    const statCardsGrid = page.locator('.grid').first();
    await expect(statCardsGrid).toHaveScreenshot('stat-cards-grid.png');
  });
});

/**
 * Accessibility Visual Tests
 * Test high contrast colors and focus states
 */

test.describe('Accessibility Visual Regression', () => {
  test('Focus states - buttons', async ({ page }) => {
    await page.goto('http://localhost:3000/tasks', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    // Focus on the Add Task button
    const addButton = page.getByRole('button', { name: /add task/i }).first();
    await addButton.focus();
    await page.waitForTimeout(300);

    await expect(addButton).toHaveScreenshot('button-focus-state.png');
  });

  test('High contrast mode colors', async ({ page }) => {
    await page.goto('http://localhost:3000/tasks', { waitUntil: 'networkidle' });
    await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'reduce' });
    await page.waitForTimeout(1000);

    // Screenshot the full page in high contrast mode
    await expect(page).toHaveScreenshot('high-contrast-mode.png', {
      fullPage: true,
    });
  });
});
