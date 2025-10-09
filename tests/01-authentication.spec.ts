import { test, expect } from '@playwright/test';
import { login, logout } from './helpers/auth-helper';
import { TEST_CONFIG } from './config/test-config';
import fs from 'fs';
import path from 'path';

// Create screenshots directory if it doesn't exist
if (!fs.existsSync(TEST_CONFIG.SCREENSHOT_DIR)) {
  fs.mkdirSync(TEST_CONFIG.SCREENSHOT_DIR, { recursive: true });
}

test.describe('🔐 AUTHENTICATION TESTS @auth', () => {
  test('Login page loads correctly', async ({ page }) => {
    await page.goto(`${TEST_CONFIG.BASE_URL}/login`);
    await expect(page).toHaveURL(/.*\/login/);

    // Check for button-based login options (actual button text from login page)
    const employeeButton = page.locator('button:has-text("Employee Login")');
    const partnerButton = page.locator('button:has-text("Partner Login")');
    const clientButton = page.locator('button:has-text("Client Portal")');
    const devButton = page.locator('button:has-text("Development Login")');

    await expect(employeeButton).toBeVisible();
    await expect(partnerButton).toBeVisible();
    await expect(clientButton).toBeVisible();
    await expect(devButton).toBeVisible();

    await page.screenshot({
      path: path.join(TEST_CONFIG.SCREENSHOT_DIR, 'auth-01-login-page.png'),
      fullPage: true
    });
  });

  test('Admin can login successfully', async ({ page }) => {
    await login(page, TEST_CONFIG.ADMIN_EMAIL, TEST_CONFIG.ADMIN_PASSWORD);
    
    const url = page.url();
    expect(url).not.toContain('/login');
    
    await page.screenshot({ 
      path: path.join(TEST_CONFIG.SCREENSHOT_DIR, 'auth-02-logged-in.png'),
      fullPage: true 
    });
  });

  test('Login button navigation works', async ({ page }) => {
    // Test that clicking the Development Login button navigates to /auth/dev
    await page.goto(`${TEST_CONFIG.BASE_URL}/login`);

    // Click the Development Login button
    await page.click('button:has-text("Development Login")');

    // Wait for navigation to complete
    await page.waitForURL('**/auth/dev');

    // Verify we're on the dev auth page
    const url = page.url();
    expect(url).toContain('/auth/dev');

    // Verify the page loaded correctly by checking for heading (avoid strict mode violation)
    await expect(page.locator('h1:has-text("Development Login")')).toBeVisible();
  });

  test('Logout functionality works', async ({ page }) => {
    // Login first
    await login(page, TEST_CONFIG.ADMIN_EMAIL, TEST_CONFIG.ADMIN_PASSWORD);

    // Call logout API
    const response = await page.request.post(`${TEST_CONFIG.BASE_URL}/api/auth/logout`);
    expect(response.status()).toBe(200);

    // Try to access protected route - should redirect to login
    await page.goto(`${TEST_CONFIG.BASE_URL}/dashboard`);
    await page.waitForLoadState('domcontentloaded');
    const url = page.url();
    expect(url).toContain('/login');
  });

  test('Session persistence across page reloads', async ({ page }) => {
    await login(page, TEST_CONFIG.ADMIN_EMAIL, TEST_CONFIG.ADMIN_PASSWORD);
    await page.goto(`${TEST_CONFIG.BASE_URL}/dashboard`);
    await page.waitForLoadState('networkidle'); // Wait for session establishment

    // Wait for auth cookies to propagate
    await page.waitForTimeout(1000);

    // Reload page
    await page.reload();
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1000); // Wait for redirect check

    // Should still be logged in
    const url = page.url();
    expect(url).not.toContain('/login');
  });

  test('Protected routes redirect to login when not authenticated', async ({ page }) => {
    await page.goto(`${TEST_CONFIG.BASE_URL}/dashboard`);
    await expect(page).toHaveURL(/.*\/login/);
  });
});
