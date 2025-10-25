import { test, expect } from '@playwright/test';
import { login } from './helpers/auth-helper';
import { TEST_CONFIG } from './config/test-config';
import path from 'path';

/**
 * COMPREHENSIVE AUTHENTICATION & SECURITY TESTS
 *
 * Purpose: Test ALL authentication flows across the ENTIRE application
 *
 * This test suite was created after discovering the `.single()` bug in middleware
 * that affected ALL route protection across the entire app, not just portals.
 *
 * Coverage:
 * 1. Unauthenticated access (all major route categories)
 * 2. Authenticated access (various user types)
 * 3. Admin access control
 * 4. Portal access control (all 4 portal types)
 * 5. Session persistence
 * 6. Cross-portal isolation
 * 7. Edge cases (expired sessions, wrong portal types, etc.)
 *
 * Test Users Available:
 * - admin@test.com (admin access)
 * - dev-user@limn.us.com (employee, no admin)
 * - customer-user@limn.us.com (customer portal)
 * - designer-user@limn.us.com (designer portal)
 * - factory-user@limn.us.com (factory portal)
 * - test_customer@limnsystems.com (customer portal)
 * - test_designer@limnsystems.com (designer portal)
 * - test_factory@limnsystems.com (factory portal)
 * - test_qc@limnsystems.com (qc portal)
 */

test.describe('🔒 COMPREHENSIVE AUTH & SECURITY TESTS', () => {

  // ========================================
  // 1. UNAUTHENTICATED ACCESS TESTS
  // ========================================

  test.describe('Unauthenticated Access Protection', () => {
    test('should redirect unauthenticated users from /dashboard to /login', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.BASE_URL}/dashboard`);
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(1000);

      const url = page.url();
      expect(url).toContain('/login');
    });

    test('should redirect unauthenticated users from /admin routes to /login', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.BASE_URL}/admin/users`);
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(1000);

      const url = page.url();
      expect(url).toContain('/login');
    });

    test('should redirect unauthenticated users from /crm routes to /login', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.BASE_URL}/crm/customers`);
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(1000);

      const url = page.url();
      expect(url).toContain('/login');
    });

    test('should redirect unauthenticated users from /production routes to /login', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.BASE_URL}/production/orders`);
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(1000);

      const url = page.url();
      expect(url).toContain('/login');
    });

    test('should redirect unauthenticated users from /financials routes to /login', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.BASE_URL}/financials/invoices`);
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(1000);

      const url = page.url();
      expect(url).toContain('/login');
    });

    test('should redirect unauthenticated users from /design routes to /login', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.BASE_URL}/design/projects`);
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(1000);

      const url = page.url();
      expect(url).toContain('/login');
    });

    test('should redirect unauthenticated users from /shipping routes to /login', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.BASE_URL}/shipping/shipments`);
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(1000);

      const url = page.url();
      expect(url).toContain('/login');
    });

    test('should redirect unauthenticated users from /tasks routes to /login', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.BASE_URL}/tasks`);
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(1000);

      const url = page.url();
      expect(url).toContain('/login');
    });

    test('should redirect unauthenticated users from /partners routes to /login', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.BASE_URL}/partners/designers`);
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(1000);

      const url = page.url();
      expect(url).toContain('/login');
    });

    test('should redirect unauthenticated users from /products routes to /login', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.BASE_URL}/products/catalog`);
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(1000);

      const url = page.url();
      expect(url).toContain('/login');
    });

    test('should redirect unauthenticated users from /analytics routes to /login', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.BASE_URL}/analytics/production`);
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(1000);

      const url = page.url();
      expect(url).toContain('/login');
    });

    test('should redirect unauthenticated users from /dashboards routes to /login', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.BASE_URL}/dashboards/executive`);
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(1000);

      const url = page.url();
      expect(url).toContain('/login');
    });

    test('should redirect unauthenticated users from portal routes to /portal/login', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.BASE_URL}/portal/customer`);
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(1000);

      const url = page.url();
      expect(url).toContain('/portal/login');
    });
  });

  // ========================================
  // 2. AUTHENTICATED EMPLOYEE ACCESS TESTS
  // ========================================

  test.describe('Authenticated Employee Access', () => {
    test.beforeEach(async ({ page }) => {
      await login(page, 'dev-user@limn.us.com', 'password');
    });

    test('employee can access /dashboard', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.BASE_URL}/dashboard`);
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(1000);

      const url = page.url();
      expect(url).not.toContain('/login');
      expect(url).toContain('/dashboard');
    });

    test('employee can access /crm routes', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.BASE_URL}/crm/customers`);
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(1500);

      const url = page.url();
      expect(url).not.toContain('/login');
      expect(url).toContain('/crm');
    });

    test('employee can access /production routes', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.BASE_URL}/production/orders`);
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(1500);

      const url = page.url();
      expect(url).not.toContain('/login');
      expect(url).toContain('/production');
    });

    test('employee can access /financials routes', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.BASE_URL}/financials/invoices`);
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(1500);

      const url = page.url();
      expect(url).not.toContain('/login');
      expect(url).toContain('/financials');
    });

    test('employee can access /design routes', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.BASE_URL}/design/projects`);
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(1500);

      const url = page.url();
      expect(url).not.toContain('/login');
      expect(url).toContain('/design');
    });

    test('employee can access /shipping routes', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.BASE_URL}/shipping/shipments`);
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(1500);

      const url = page.url();
      expect(url).not.toContain('/login');
      expect(url).toContain('/shipping');
    });

    test('employee can access /tasks routes', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.BASE_URL}/tasks`);
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(1500);

      const url = page.url();
      expect(url).not.toContain('/login');
      expect(url).toContain('/tasks');
    });

    test('employee can access /partners routes', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.BASE_URL}/partners/designers`);
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(1500);

      const url = page.url();
      expect(url).not.toContain('/login');
      expect(url).toContain('/partners');
    });

    test('employee can access /products routes', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.BASE_URL}/products/catalog`);
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(1500);

      const url = page.url();
      expect(url).not.toContain('/login');
      expect(url).toContain('/products');
    });

    test('employee can access /analytics routes', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.BASE_URL}/analytics/production`);
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(1500);

      const url = page.url();
      expect(url).not.toContain('/login');
      expect(url).toContain('/analytics');
    });

    test('employee can access /dashboards routes', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.BASE_URL}/dashboards/executive`);
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(1500);

      const url = page.url();
      expect(url).not.toContain('/login');
      expect(url).toContain('/dashboards');
    });

    test('employee CANNOT access /admin routes (redirected to /dashboard)', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.BASE_URL}/admin/users`);
      await page.waitForLoadState('domcontentloaded');

      // Wait for redirect to complete
      await page.waitForTimeout(2500);

      const url = page.url();
      // Non-admin should be redirected to /dashboard
      expect(url).toContain('/dashboard');
      expect(url).not.toContain('/admin');
    });
  });

  // ========================================
  // 3. ADMIN ACCESS CONTROL TESTS
  // ========================================

  test.describe('Admin Access Control', () => {
    test.beforeEach(async ({ page }) => {
      await login(page, 'admin@test.com', 'password');
    });

    test('admin can access /admin/users', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.BASE_URL}/admin/users`);
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(1500);

      const url = page.url();
      expect(url).not.toContain('/login');
      expect(url).toContain('/admin/users');
    });

    test('admin can access /admin/roles', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.BASE_URL}/admin/roles`);
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(1500);

      const url = page.url();
      expect(url).not.toContain('/login');
      expect(url).toContain('/admin/roles');
    });

    test('admin can access /admin/api-keys', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.BASE_URL}/admin/api-keys`);
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(2000);

      const url = page.url();
      expect(url).not.toContain('/login');
      expect(url).toContain('/admin/api-keys');
    });

    test('admin can access /admin/dashboard', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.BASE_URL}/admin/dashboard`);
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(1500);

      const url = page.url();
      expect(url).not.toContain('/login');
      expect(url).toContain('/admin/dashboard');
    });

    test('admin can access /admin/activity', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.BASE_URL}/admin/activity`);
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(1500);

      const url = page.url();
      expect(url).not.toContain('/login');
      expect(url).toContain('/admin/activity');
    });

    test('admin can access /admin/analytics', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.BASE_URL}/admin/analytics`);
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(1500);

      const url = page.url();
      expect(url).not.toContain('/login');
      expect(url).toContain('/admin/analytics');
    });

    test('admin can access /admin/portals', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.BASE_URL}/admin/portals`);
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(1500);

      const url = page.url();
      expect(url).not.toContain('/login');
      expect(url).toContain('/admin/portals');
    });

    test('admin can also access regular employee routes', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.BASE_URL}/crm/customers`);
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(1500);

      const url = page.url();
      expect(url).not.toContain('/login');
      expect(url).toContain('/crm');
    });
  });

  // ========================================
  // 4. PORTAL ACCESS CONTROL TESTS
  // ========================================

  test.describe('Portal Access Control - Customer Portal', () => {
    test('customer portal login page is accessible', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.BASE_URL}/portal/login`);
      await page.waitForLoadState('domcontentloaded');

      // Should see login form
      const emailInput = page.locator('input[type="email"]');
      await expect(emailInput).toBeVisible();
    });

    test('customer user can login to customer portal', async ({ page }) => {
      // Use login helper (credentials match global-setup.ts)
      await login(page, 'customer-user@limn.us.com', 'password');

      // Should be logged in (not on login page) - login helper navigates to /dashboard
      const url = page.url();
      expect(url).not.toContain('/portal/login');
      expect(url).not.toContain('/login');
    });

    test('customer user can access /portal/customer routes', async ({ page }) => {
      // Use login helper (credentials match global-setup.ts)
      await login(page, 'customer-user@limn.us.com', 'password');

      // Try to access customer portal
      await page.goto(`${TEST_CONFIG.BASE_URL}/portal/customer`);
      await page.waitForLoadState('domcontentloaded');

      const url = page.url();
      expect(url).not.toContain('/portal/login');
      expect(url).toContain('/portal/customer');
    });

    test('customer user CANNOT access designer portal', async ({ page }) => {
      // Login as customer using helper
      await login(page, 'customer-user@limn.us.com', 'password');
      await page.waitForTimeout(1000);

      // Try to access designer portal
      await page.goto(`${TEST_CONFIG.BASE_URL}/portal/designer`);
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(1500);

      const url = page.url();
      // Should be redirected away from designer portal
      expect(url).not.toContain('/portal/designer');
      expect(url).toContain('/portal/login');
    });

    test('customer user CANNOT access factory portal', async ({ page }) => {
      // Login as customer using helper
      await login(page, 'customer-user@limn.us.com', 'password');
      await page.waitForTimeout(1000);

      // Try to access factory portal
      await page.goto(`${TEST_CONFIG.BASE_URL}/portal/factory`);
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(1500);

      const url = page.url();
      // Should be redirected away from factory portal
      expect(url).not.toContain('/portal/factory');
      expect(url).toContain('/portal/login');
    });

    test('customer user CANNOT access qc portal', async ({ page }) => {
      // Login as customer using helper
      await login(page, 'customer-user@limn.us.com', 'password');
      await page.waitForTimeout(1000);

      // Try to access qc portal
      await page.goto(`${TEST_CONFIG.BASE_URL}/portal/qc`);
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(1500);

      const url = page.url();
      // Should be redirected away from qc portal
      expect(url).not.toContain('/portal/qc');
      expect(url).toContain('/portal/login');
    });
  });

  test.describe('Portal Access Control - Designer Portal', () => {
    test('designer user can login to designer portal', async ({ page }) => {
      // Use login helper (credentials match global-setup.ts)
      await login(page, 'designer-user@limn.us.com', 'password');

      // Should be logged in (not on login page) - login helper navigates to /dashboard
      const url = page.url();
      expect(url).not.toContain('/portal/login');
      expect(url).not.toContain('/login');
    });

    test('designer user can access /portal/designer routes', async ({ page }) => {
      // Use login helper
      await login(page, 'designer-user@limn.us.com', 'password');

      await page.goto(`${TEST_CONFIG.BASE_URL}/portal/designer`);
      await page.waitForLoadState('domcontentloaded');

      const url = page.url();
      expect(url).not.toContain('/portal/login');
      expect(url).toContain('/portal/designer');
    });

    test('designer user CANNOT access customer portal', async ({ page }) => {
      // Login as designer using helper
      await login(page, 'designer-user@limn.us.com', 'password');
      await page.waitForTimeout(1000);

      await page.goto(`${TEST_CONFIG.BASE_URL}/portal/customer`);
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(1500);

      const url = page.url();
      expect(url).not.toContain('/portal/customer');
      expect(url).toContain('/portal/login');
    });
  });

  test.describe('Portal Access Control - Factory Portal', () => {
    test('factory user can login to factory portal', async ({ page }) => {
      // Use login helper (credentials match global-setup.ts)
      await login(page, 'factory-user@limn.us.com', 'password');

      // Should be logged in (not on login page) - login helper navigates to /dashboard
      const url = page.url();
      expect(url).not.toContain('/portal/login');
      expect(url).not.toContain('/login');
    });

    test('factory user can access /portal/factory routes', async ({ page }) => {
      // Use login helper
      await login(page, 'factory-user@limn.us.com', 'password');

      await page.goto(`${TEST_CONFIG.BASE_URL}/portal/factory`);
      await page.waitForLoadState('domcontentloaded');

      const url = page.url();
      expect(url).not.toContain('/portal/login');
      expect(url).toContain('/portal/factory');
    });

    test('factory user CANNOT access customer portal', async ({ page }) => {
      // Login as factory using helper
      await login(page, 'factory-user@limn.us.com', 'password');
      await page.waitForTimeout(1000);

      await page.goto(`${TEST_CONFIG.BASE_URL}/portal/customer`);
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(1500);

      const url = page.url();
      expect(url).not.toContain('/portal/customer');
      expect(url).toContain('/portal/login');
    });
  });

  test.describe('Portal Access Control - QC Portal', () => {
    test('qc user can login to qc portal', async ({ page }) => {
      // Use login helper (credentials match global-setup.ts - QC uses dev-user)
      await login(page, 'dev-user@limn.us.com', 'password');

      // Should be logged in (not on login page) - login helper navigates to /dashboard
      const url = page.url();
      expect(url).not.toContain('/portal/login');
      expect(url).not.toContain('/login');
    });

    test('qc user can access /portal/qc routes', async ({ page }) => {
      // Use login helper
      await login(page, 'dev-user@limn.us.com', 'password');

      await page.goto(`${TEST_CONFIG.BASE_URL}/portal/qc`);
      await page.waitForLoadState('domcontentloaded');

      const url = page.url();
      expect(url).not.toContain('/portal/login');
      expect(url).toContain('/portal/qc');
    });

    test('qc user CANNOT access customer portal', async ({ page }) => {
      // Login as QC using helper
      await login(page, 'dev-user@limn.us.com', 'password');
      await page.waitForTimeout(1000);

      await page.goto(`${TEST_CONFIG.BASE_URL}/portal/customer`);
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(1500);

      const url = page.url();
      expect(url).not.toContain('/portal/customer');
      expect(url).toContain('/portal/login');
    });
  });

  // ========================================
  // 5. SESSION PERSISTENCE TESTS
  // ========================================

  test.describe('Session Persistence', () => {
    test('employee session persists across page reloads', async ({ page }) => {
      await login(page, 'dev-user@limn.us.com', 'password');
      await page.goto(`${TEST_CONFIG.BASE_URL}/dashboard`);
      await page.waitForTimeout(1000);

      // Reload page
      await page.reload();
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(1000);

      // Should still be on dashboard, not redirected to login
      const url = page.url();
      expect(url).not.toContain('/login');
      expect(url).toContain('/dashboard');
    });

    test('admin session persists across navigation', async ({ page }) => {
      await login(page, 'admin@test.com', 'password');

      // Navigate to multiple pages
      await page.goto(`${TEST_CONFIG.BASE_URL}/admin/users`);
      await page.waitForTimeout(1000);

      await page.goto(`${TEST_CONFIG.BASE_URL}/crm/customers`);
      await page.waitForTimeout(1000);

      await page.goto(`${TEST_CONFIG.BASE_URL}/production/orders`);
      await page.waitForTimeout(1000);

      // Should still be authenticated (not on login page)
      const url = page.url();
      expect(url).not.toContain('/login');
    });
  });

  // ========================================
  // 6. EDGE CASES & SECURITY TESTS
  // ========================================

  test.describe('Edge Cases & Security', () => {
    test('invalid credentials should show error', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.BASE_URL}/portal/login`);
      await page.fill('input[type="email"]', 'invalid@example.com');
      await page.fill('input[type="password"]', 'wrongpassword');
      await page.click('button[type="submit"]');
      await page.waitForTimeout(2000);

      // Should still be on login page with error
      const url = page.url();
      expect(url).toContain('/portal/login');

      // Check for error message
      const hasAlert = await page.locator('[role="alert"]').count() > 0;
      const hasErrorClass = await page.locator('.error').count() > 0;
      const hasInvalidText = await page.locator('text=/invalid/i').count() > 0;
      const hasIncorrectText = await page.locator('text=/incorrect/i').count() > 0;

      const hasError = hasAlert || hasErrorClass || hasInvalidText || hasIncorrectText;
      expect(hasError).toBeTruthy();
    });

    test('direct access to protected route preserves redirect parameter', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.BASE_URL}/crm/customers`);
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(1000);

      const url = page.url();
      // Should be redirected to login with redirect parameter
      expect(url).toContain('/login');
      expect(url).toContain('redirect');
    });

    test('public paths are accessible without authentication', async ({ page }) => {
      // Test /privacy
      await page.goto(`${TEST_CONFIG.BASE_URL}/privacy`);
      await page.waitForLoadState('domcontentloaded');
      const privacyUrl = page.url();
      expect(privacyUrl).toContain('/privacy');
      expect(privacyUrl).not.toContain('/login');

      // Test /terms
      await page.goto(`${TEST_CONFIG.BASE_URL}/terms`);
      await page.waitForLoadState('domcontentloaded');
      const termsUrl = page.url();
      expect(termsUrl).toContain('/terms');
      expect(termsUrl).not.toContain('/login');
    });
  });
});
