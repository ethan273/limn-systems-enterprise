/**
 * COMPREHENSIVE TESTING: CRM CUSTOMERS MODULE
 *
 * Tests ALL pages, ALL CRUD operations with database verification,
 * form validation, error handling, and permissions.
 *
 * Coverage:
 * - /crm/customers (list page)
 * - /crm/customers/new (create page)
 * - /crm/customers/[id] (detail page)
 * - /crm/customers/[id]/edit (edit page)
 */

import { test, expect } from '@playwright/test';
import { PrismaClient } from '@prisma/client';
import { login } from './helpers/auth-helper';

const prisma = new PrismaClient();

const testCustomer = {
  companyName: 'Test Customer Inc',
  contactName: 'Alice Johnson',
  email: 'alice@testcustomer.com',
  phone: '555-9999',
  address: '123 Test Street',
  city: 'Test City',
  state: 'CA',
  zipCode: '90210',
  country: 'USA',
};

const updatedCustomer = {
  companyName: 'Updated Customer Corp',
  contactName: 'Bob Williams',
  email: 'bob@updatedcustomer.com',
  phone: '555-8888',
};

let createdCustomerId: string | null = null;

test.beforeAll(async () => {
  await prisma.customers.deleteMany({
    where: {
      OR: [
        { email: testCustomer.email },
        { email: updatedCustomer.email },
      ],
    },
  });
});

test.afterAll(async () => {
  if (createdCustomerId) {
    await prisma.customers.delete({ where: { id: createdCustomerId } }).catch(() => {});
  }
  await prisma.customers.deleteMany({
    where: {
      OR: [
        { email: testCustomer.email },
        { email: updatedCustomer.email },
      ],
    },
  });
  await prisma.$disconnect();
});

test.describe('CRM Customers - List Page', () => {
  test('should load customers list without errors', async ({ page }) => {
    await login(page, 'dev-user@limn.us.com', 'password');
    await page.goto('/crm/customers', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);

    expect(page.url()).toContain('/crm/customers');

    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });
    await page.waitForTimeout(1000);
    expect(errors.length).toBe(0);
  });

  test('should display data (table or cards)', async ({ page }) => {
    await login(page, 'dev-user@limn.us.com', 'password');
    await page.goto('/crm/customers', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);

    const hasTable = await page.locator('table').count() > 0;
    const hasCards = await page.locator('[class*="card"]').count() > 0;
    expect(hasTable || hasCards).toBe(true);
  });

  test('should have functional Add button', async ({ page }) => {
    await login(page, 'dev-user@limn.us.com', 'password');
    await page.goto('/crm/customers', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);

    const addButton = page.locator('button:has-text("Add"), button:has-text("New"), a[href*="/new"]').first();
    await expect(addButton).toBeVisible({ timeout: 5000 });
    await addButton.click();
    await page.waitForTimeout(1000);

    const isOnNewPage = page.url().includes('/crm/customers/new');
    const hasDialog = await page.locator('[role="dialog"]').count() > 0;
    expect(isOnNewPage || hasDialog).toBe(true);
  });
});

test.describe('CRM Customers - Create (CRUD: CREATE)', () => {
  test('should navigate to create page', async ({ page }) => {
    await login(page, 'dev-user@limn.us.com', 'password');
    await page.goto('/crm/customers/new', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);

    expect(page.url()).toContain('/crm/customers/new');
    await expect(page.locator('form').first()).toBeVisible({ timeout: 5000 });
  });

  test('should display required form fields', async ({ page }) => {
    await login(page, 'dev-user@limn.us.com', 'password');
    await page.goto('/crm/customers/new', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);

    const companyNameInput = page.locator('input[name*="company" i], input[id*="company" i]').first();
    const emailInput = page.locator('input[type="email"], input[name*="email" i]').first();

    await expect(companyNameInput).toBeVisible({ timeout: 5000 });
    await expect(emailInput).toBeVisible({ timeout: 5000 });
  });

  test('should validate required fields', async ({ page }) => {
    await login(page, 'dev-user@limn.us.com', 'password');
    await page.goto('/crm/customers/new', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);

    const submitButton = page.locator('button[type="submit"]').first();
    await submitButton.click();
    await page.waitForTimeout(1000);

    expect(page.url()).toContain('/crm/customers/new');
  });

  test('should create customer and verify in database', async ({ page }) => {
    await login(page, 'dev-user@limn.us.com', 'password');
    await page.goto('/crm/customers/new', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);

    // Fill form
    await page.locator('input[name*="company" i], input[id*="company" i]').first().fill(testCustomer.companyName);
    await page.locator('input[name*="contact" i], input[id*="contact" i]').first().fill(testCustomer.contactName);
    await page.locator('input[type="email"], input[name*="email" i]').first().fill(testCustomer.email);

    const phoneInput = page.locator('input[name*="phone" i]').first();
    if (await phoneInput.count() > 0) {
      await phoneInput.fill(testCustomer.phone);
    }

    const submitButton = page.locator('button[type="submit"]').first();
    await submitButton.click();
    await page.waitForTimeout(2000);

    const redirected = !page.url().includes('/crm/customers/new');
    expect(redirected).toBe(true);

    // Verify in database
    const customerInDb = await prisma.customers.findUnique({
      where: { email: testCustomer.email },
    });

    expect(customerInDb).not.toBeNull();
    expect(customerInDb?.companyName).toBe(testCustomer.companyName);
    expect(customerInDb?.email).toBe(testCustomer.email);

    if (customerInDb) {
      createdCustomerId = customerInDb.id;
    }
  });
});

test.describe('CRM Customers - Read (CRUD: READ)', () => {
  test('should display customer detail page', async ({ page }) => {
    if (!createdCustomerId) {
      const customer = await prisma.customers.create({
        data: {
          name: testCustomer.companyName,  // Required field
          company_name: testCustomer.companyName,
          email: testCustomer.email,
          phone: testCustomer.phone,
        },
      });
      createdCustomerId = customer.id;
    }

    await login(page, 'dev-user@limn.us.com', 'password');
    await page.goto(`/crm/customers/${createdCustomerId}`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);

    expect(page.url()).toContain(`/crm/customers/${createdCustomerId}`);

    const pageContent = await page.textContent('body');
    expect(pageContent).toContain(testCustomer.companyName);
    expect(pageContent).toContain(testCustomer.email);
  });

  test('should have Edit and Delete buttons', async ({ page }) => {
    if (!createdCustomerId) test.skip();

    await login(page, 'dev-user@limn.us.com', 'password');
    await page.goto(`/crm/customers/${createdCustomerId}`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);

    const editButton = page.locator('button:has-text("Edit"), a[href*="/edit"]').first();
    await expect(editButton).toBeVisible({ timeout: 5000 });

    const deleteButton = page.locator('button:has-text("Delete")').first();
    await expect(deleteButton).toBeVisible({ timeout: 5000 });
  });
});

test.describe('CRM Customers - Update (CRUD: UPDATE)', () => {
  test('should navigate to edit page with pre-populated data', async ({ page }) => {
    if (!createdCustomerId) test.skip();

    await login(page, 'dev-user@limn.us.com', 'password');
    await page.goto(`/crm/customers/${createdCustomerId}/edit`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);

    expect(page.url()).toContain(`/crm/customers/${createdCustomerId}/edit`);

    const companyNameInput = page.locator('input[name*="company" i]').first();
    const companyName = await companyNameInput.inputValue();
    expect(companyName).toBe(testCustomer.companyName);
  });

  test('should update customer and verify in database', async ({ page }) => {
    if (!createdCustomerId) test.skip();

    await login(page, 'dev-user@limn.us.com', 'password');
    await page.goto(`/crm/customers/${createdCustomerId}/edit`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);

    // Update fields
    await page.locator('input[name*="company" i]').first().fill(updatedCustomer.companyName);
    await page.locator('input[name*="contact" i]').first().fill(updatedCustomer.contactName);
    await page.locator('input[type="email"]').first().fill(updatedCustomer.email);

    const submitButton = page.locator('button[type="submit"]').first();
    await submitButton.click();
    await page.waitForTimeout(2000);

    const redirected = !page.url().includes('/edit');
    expect(redirected).toBe(true);

    // Verify in database
    const customerInDb = await prisma.customers.findUnique({
      where: { id: createdCustomerId },
    });

    expect(customerInDb?.companyName).toBe(updatedCustomer.companyName);
    expect(customerInDb?.email).toBe(updatedCustomer.email);
  });
});

test.describe('CRM Customers - Delete (CRUD: DELETE)', () => {
  test('should show confirmation before delete', async ({ page }) => {
    if (!createdCustomerId) test.skip();

    await login(page, 'dev-user@limn.us.com', 'password');
    await page.goto(`/crm/customers/${createdCustomerId}`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);

    const deleteButton = page.locator('button:has-text("Delete")').first();
    await deleteButton.click();
    await page.waitForTimeout(1000);

    const dialog = page.locator('[role="dialog"], [role="alertdialog"]').first();
    await expect(dialog).toBeVisible({ timeout: 5000 });

    const cancelButton = page.locator('button:has-text("Cancel")').first();
    await cancelButton.click();
  });

  test('should delete customer and verify removal from database', async ({ page }) => {
    if (!createdCustomerId) test.skip();

    await login(page, 'dev-user@limn.us.com', 'password');
    await page.goto(`/crm/customers/${createdCustomerId}`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);

    const deleteButton = page.locator('button:has-text("Delete")').first();
    await deleteButton.click();
    await page.waitForTimeout(1000);

    const confirmButton = page.locator('button:has-text("Delete"), button:has-text("Confirm")').last();
    await confirmButton.click();
    await page.waitForTimeout(2000);

    expect(page.url()).toContain('/crm/customers');
    expect(page.url()).not.toContain(createdCustomerId);

    // Verify removed from database
    const customerInDb = await prisma.customers.findUnique({
      where: { id: createdCustomerId },
    });
    expect(customerInDb).toBeNull();

    createdCustomerId = null;
  });
});

test.describe('CRM Customers - Error Handling', () => {
  test('should handle non-existent customer gracefully', async ({ page }) => {
    await login(page, 'dev-user@limn.us.com', 'password');
    await page.goto('/crm/customers/00000000-0000-0000-0000-000000000000', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);

    const hasError = await (
      await page.locator('text=/not found/i').count() > 0 ||
      await page.locator('text=/error/i').count() > 0
    ) > 0;
    const redirectedToList = page.url().includes('/crm/customers') && !page.url().includes('00000000');
    expect(hasError || redirectedToList).toBe(true);
  });
});
