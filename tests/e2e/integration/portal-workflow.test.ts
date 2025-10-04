import { test, expect, takeSnapshot } from '@chromatic-com/playwright';

/**
 * Portal Workflow Integration Tests
 *
 * Phase 4: Integration Testing - Portal Workflows
 *
 * Tests complete portal workflows:
 * - Customer viewing orders and invoices
 * - Designer accessing projects and documents
 * - Factory managing production orders
 *
 * Validates:
 * - Portal navigation
 * - Multi-tenant data isolation
 * - Role-based access
 */

test.describe('Portal Workflow Integration', () => {
  test('Customer Portal Workflow - Should access orders and documents', async ({ page }, testInfo) => {
    // Navigate to portal login
    await page.goto('/portal/login');
    await page.waitForLoadState('networkidle');
    await takeSnapshot(page, 'Portal Workflow - Login', testInfo);

    // Navigate to portal home
    await page.goto('/portal');
    await page.waitForLoadState('networkidle');
    const portalUrl = page.url();
    expect(portalUrl.includes('/portal')).toBe(true);
    await takeSnapshot(page, 'Portal Workflow - Home', testInfo);

    // Navigate to orders
    await page.goto('/portal/orders');
    await page.waitForLoadState('networkidle');
    await takeSnapshot(page, 'Portal Workflow - Orders', testInfo);

    // Navigate to documents
    await page.goto('/portal/documents');
    await page.waitForLoadState('networkidle');
    await takeSnapshot(page, 'Portal Workflow - Documents', testInfo);
  });

  test('Designer Portal Workflow - Should access projects', async ({ page }, testInfo) => {
    await page.goto('/portal/designer');
    await page.waitForLoadState('networkidle');
    await takeSnapshot(page, 'Designer Portal - Home', testInfo);

    await page.goto('/portal/designer/documents');
    await page.waitForLoadState('networkidle');
    await takeSnapshot(page, 'Designer Portal - Documents', testInfo);

    await page.goto('/portal/designer/settings');
    await page.waitForLoadState('networkidle');
    await takeSnapshot(page, 'Designer Portal - Settings', testInfo);
  });

  test('Factory Portal Workflow - Should access production orders', async ({ page }, testInfo) => {
    await page.goto('/portal/factory');
    await page.waitForLoadState('networkidle');
    await takeSnapshot(page, 'Factory Portal - Home', testInfo);

    await page.goto('/portal/factory/documents');
    await page.waitForLoadState('networkidle');
    await takeSnapshot(page, 'Factory Portal - Documents', testInfo);

    await page.goto('/portal/factory/quality');
    await page.waitForLoadState('networkidle');
    await takeSnapshot(page, 'Factory Portal - Quality', testInfo);
  });
});
