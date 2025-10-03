/**
 * Authentication Helper Utilities
 *
 * Login helpers for different user types
 * Created: October 3, 2025
 */

import { Page } from '@playwright/test';

/**
 * Logs in as an employee user
 */
export async function loginAsEmployee(page: Page): Promise<void> {
  await page.goto('/auth/employee');

  // Wait for login form
  await page.waitForSelector('input[name="email"]', { timeout: 10000 });

  // Fill login form (using test credentials)
  await page.fill('input[name="email"]', 'test@limn.us.com');
  await page.fill('input[name="password"]', 'TestPassword123!');

  // Submit form
  await page.click('button[type="submit"]');

  // Wait for successful login (redirect to dashboard)
  await page.waitForURL('**/dashboard', { timeout: 15000 });
}

/**
 * Logs in as a contractor user
 */
export async function loginAsContractor(page: Page): Promise<void> {
  await page.goto('/auth/contractor');

  await page.waitForSelector('input[name="email"]', { timeout: 10000 });

  await page.fill('input[name="email"]', 'contractor@example.com');
  await page.fill('input[name="password"]', 'TestPassword123!');

  await page.click('button[type="submit"]');

  await page.waitForURL('**/dashboard', { timeout: 15000 });
}

/**
 * Logs in as a customer user
 */
export async function loginAsCustomer(page: Page): Promise<void> {
  await page.goto('/auth/customer');

  await page.waitForSelector('input[name="email"]', { timeout: 10000 });

  await page.fill('input[name="email"]', 'customer@example.com');
  await page.fill('input[name="password"]', 'TestPassword123!');

  await page.click('button[type="submit"]');

  await page.waitForURL('**/portal', { timeout: 15000 });
}

/**
 * Logs in to designer portal
 */
export async function loginAsDesigner(page: Page): Promise<void> {
  await page.goto('/portal/login?type=designer');

  await page.waitForSelector('input[name="email"]', { timeout: 10000 });

  await page.fill('input[name="email"]', 'designer@example.com');
  await page.fill('input[name="password"]', 'TestPassword123!');

  await page.click('button[type="submit"]');

  await page.waitForURL('**/portal/designer', { timeout: 15000 });
}

/**
 * Logs in to factory portal
 */
export async function loginAsFactory(page: Page): Promise<void> {
  await page.goto('/portal/login?type=factory');

  await page.waitForSelector('input[name="email"]', { timeout: 10000 });

  await page.fill('input[name="email"]', 'factory@example.com');
  await page.fill('input[name="password"]', 'TestPassword123!');

  await page.click('button[type="submit"]');

  await page.waitForURL('**/portal/factory', { timeout: 15000 });
}

/**
 * Checks if user is currently logged in
 */
export async function isLoggedIn(page: Page): Promise<boolean> {
  try {
    // Check for common authenticated elements
    await page.waitForSelector('[data-testid="user-menu"]', { timeout: 2000 });
    return true;
  } catch {
    return false;
  }
}

/**
 * Logs out the current user
 */
export async function logout(page: Page): Promise<void> {
  try {
    await page.click('[data-testid="user-menu"]');
    await page.click('text=Logout');
    await page.waitForURL('**/login', { timeout: 5000 });
  } catch (error) {
    console.log('Logout failed or user not logged in');
  }
}
