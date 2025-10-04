import { test, expect } from '@playwright/test';

/**
 * Visual Regression Tests for Critical Pages
 *
 * These tests capture screenshots of key pages and compare them against
 * baseline images to detect unintended visual changes.
 *
 * Running tests:
 * - npm run test:visual -- to run all visual tests
 * - npm run test:visual:update -- to update baseline screenshots
 */

test.describe('CRM Module - Visual Regression', () => {
  test('Contacts list page - desktop', async ({ page }) => {
    await page.goto('/crm/contacts');
    await page.waitForLoadState('networkidle');

    // Wait for table to load
    await page.waitForSelector('.data-table-container', { timeout: 10000 });

    // Take full page screenshot
    await expect(page).toHaveScreenshot('crm-contacts-desktop.png');
  });

  test('Contact detail page - desktop', async ({ page }) => {
    await page.goto('/crm/contacts');
    await page.waitForLoadState('networkidle');

    // Click first contact
    await page.click('tbody tr:first-child');
    await page.waitForLoadState('networkidle');

    // Wait for detail header to load
    await page.waitForSelector('.detail-header', { timeout: 10000 });

    // Take screenshot
    await expect(page).toHaveScreenshot('crm-contact-detail-desktop.png');
  });

  test('Leads list page - desktop', async ({ page }) => {
    await page.goto('/crm/leads');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('.data-table-container', { timeout: 10000 });
    await expect(page).toHaveScreenshot('crm-leads-desktop.png');
  });

  test('Customers list page - desktop', async ({ page }) => {
    await page.goto('/crm/customers');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('.data-table-container', { timeout: 10000 });
    await expect(page).toHaveScreenshot('crm-customers-desktop.png');
  });
});

test.describe('Products Module - Visual Regression', () => {
  test('Product catalog page - desktop', async ({ page }) => {
    await page.goto('/products/catalog');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('.data-table-container', { timeout: 10000 });
    await expect(page).toHaveScreenshot('products-catalog-desktop.png');
  });

  test('Product detail page - desktop', async ({ page }) => {
    await page.goto('/products/catalog');
    await page.waitForLoadState('networkidle');

    // Click first product
    await page.click('tbody tr:first-child');
    await page.waitForLoadState('networkidle');

    // Wait for tabs to load
    await page.waitForSelector('[role="tablist"]', { timeout: 10000 });

    await expect(page).toHaveScreenshot('products-detail-desktop.png');
  });

  test('Materials page - desktop', async ({ page }) => {
    await page.goto('/products/materials');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('.data-table-container', { timeout: 10000 });
    await expect(page).toHaveScreenshot('products-materials-desktop.png');
  });
});

test.describe('Design Module - Visual Regression', () => {
  test('Design briefs page - desktop', async ({ page }) => {
    await page.goto('/design/briefs');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('.data-table-container', { timeout: 10000 });
    await expect(page).toHaveScreenshot('design-briefs-desktop.png');
  });

  test('Mood boards page - desktop', async ({ page }) => {
    await page.goto('/design/boards');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveScreenshot('design-boards-desktop.png');
  });

  test('Design documents page - desktop', async ({ page }) => {
    await page.goto('/design/documents');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveScreenshot('design-documents-desktop.png');
  });
});

test.describe('Partners Module - Visual Regression', () => {
  test('Designers page - desktop', async ({ page }) => {
    await page.goto('/partners/designers');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('.data-table-container', { timeout: 10000 });
    await expect(page).toHaveScreenshot('partners-designers-desktop.png');
  });

  test('Factories page - desktop', async ({ page }) => {
    await page.goto('/partners/factories');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('.data-table-container', { timeout: 10000 });
    await expect(page).toHaveScreenshot('partners-factories-desktop.png');
  });
});

test.describe('Production Module - Visual Regression', () => {
  test('Production orders page - desktop', async ({ page }) => {
    await page.goto('/production/orders');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('.data-table-container', { timeout: 10000 });
    await expect(page).toHaveScreenshot('production-orders-desktop.png');
  });

  test('Shop drawings page - desktop', async ({ page }) => {
    await page.goto('/production/shop-drawings');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('.data-table-container', { timeout: 10000 });
    await expect(page).toHaveScreenshot('production-shop-drawings-desktop.png');
  });
});

test.describe('Financial Module - Visual Regression', () => {
  test('Invoices page - desktop', async ({ page }) => {
    await page.goto('/financials/invoices');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('.data-table-container', { timeout: 10000 });
    await expect(page).toHaveScreenshot('financials-invoices-desktop.png');
  });

  test('Payments page - desktop', async ({ page }) => {
    await page.goto('/financials/payments');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('.data-table-container', { timeout: 10000 });
    await expect(page).toHaveScreenshot('financials-payments-desktop.png');
  });
});

test.describe('Responsive Design - Visual Regression', () => {
  test.use({ viewport: { width: 768, height: 1024 } });

  test('CRM contacts - tablet', async ({ page }) => {
    await page.goto('/crm/contacts');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('.data-table-container', { timeout: 10000 });
    await expect(page).toHaveScreenshot('crm-contacts-tablet.png');
  });

  test('Product catalog - tablet', async ({ page }) => {
    await page.goto('/products/catalog');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('.data-table-container', { timeout: 10000 });
    await expect(page).toHaveScreenshot('products-catalog-tablet.png');
  });
});

test.describe('Mobile Design - Visual Regression', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test('CRM contacts - mobile', async ({ page }) => {
    await page.goto('/crm/contacts');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveScreenshot('crm-contacts-mobile.png');
  });

  test('Dashboard - mobile', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveScreenshot('dashboard-mobile.png');
  });
});
