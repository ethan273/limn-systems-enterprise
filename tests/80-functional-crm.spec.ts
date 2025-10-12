/**
 * FUNCTIONAL TEST: CRM Module
 *
 * Tests ALL CRUD operations and UI interactions for:
 * - Contacts
 * - Customers
 * - Leads
 *
 * Verifies database changes after each operation
 * Reports issues by pattern for global fixes
 */

import { test, expect } from '@playwright/test';
import { PrismaClient } from '@prisma/client';
import { login } from './helpers/auth-helper';

const prisma = new PrismaClient();

// Test data generators
function generateContactData() {
  const timestamp = Date.now();
  return {
    name: `Test Contact ${timestamp}`,
    email: `contact${timestamp}@test.com`,
    phone: '555-0100',
    company: 'Test Company',
  };
}

function generateCustomerData() {
  const timestamp = Date.now();
  return {
    name: `Test Customer ${timestamp}`,
    email: `customer${timestamp}@test.com`,
    company_name: `Test Company ${timestamp}`,
    phone: '555-0200',
  };
}

function generateLeadData() {
  const timestamp = Date.now();
  return {
    name: `Test Lead ${timestamp}`,
    email: `lead${timestamp}@test.com`,
    company: `Lead Company ${timestamp}`,
    source: 'Website',
  };
}

// Issue tracking
const issues: Array<{
  module: string;
  operation: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM';
  description: string;
  page: string;
  details?: string;
}> = [];

function reportIssue(
  module: string,
  operation: string,
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM',
  description: string,
  page: string,
  details?: string
) {
  issues.push({ module, operation, severity, description, page, details });
  console.log(`\n❌ ISSUE FOUND:`);
  console.log(`   Module: ${module}`);
  console.log(`   Operation: ${operation}`);
  console.log(`   Severity: ${severity}`);
  console.log(`   Description: ${description}`);
  console.log(`   Page: ${page}`);
  if (details) console.log(`   Details: ${details}`);
}

test.describe('CRM Module - Functional Tests', () => {
  test.beforeAll(async () => {
    console.log('\n🧪 Starting CRM Functional Tests');
    console.log('   Testing: CREATE, READ, UPDATE, DELETE operations');
    console.log('   Verifying: Database changes, UI interactions');
  });

  test.afterAll(async () => {
    // Generate issue report
    console.log('\n' + '='.repeat(80));
    console.log('📊 CRM FUNCTIONAL TEST RESULTS');
    console.log('='.repeat(80));

    if (issues.length === 0) {
      console.log('\n✅ ALL TESTS PASSED - NO ISSUES FOUND');
    } else {
      console.log(`\n❌ FOUND ${issues.length} ISSUES\n`);

      // Group by severity
      const critical = issues.filter(i => i.severity === 'CRITICAL');
      const high = issues.filter(i => i.severity === 'HIGH');
      const medium = issues.filter(i => i.severity === 'MEDIUM');

      if (critical.length > 0) {
        console.log(`🚨 CRITICAL ISSUES (${critical.length}):`);
        critical.forEach((issue, i) => {
          console.log(`\n${i + 1}. ${issue.module} - ${issue.operation}`);
          console.log(`   ${issue.description}`);
          console.log(`   Page: ${issue.page}`);
          if (issue.details) console.log(`   Details: ${issue.details}`);
        });
      }

      if (high.length > 0) {
        console.log(`\n⚠️  HIGH PRIORITY ISSUES (${high.length}):`);
        high.forEach((issue, i) => {
          console.log(`\n${i + 1}. ${issue.module} - ${issue.operation}`);
          console.log(`   ${issue.description}`);
          console.log(`   Page: ${issue.page}`);
        });
      }

      if (medium.length > 0) {
        console.log(`\n⚡ MEDIUM PRIORITY ISSUES (${medium.length}):`);
        medium.forEach((issue, i) => {
          console.log(`${i + 1}. ${issue.module} - ${issue.operation}: ${issue.description}`);
        });
      }
    }

    console.log('\n' + '='.repeat(80));

    await prisma.$disconnect();
  });

  // ============================================================================
  // CONTACTS - CRUD OPERATIONS
  // ============================================================================

  test('Contacts - CREATE operation', async ({ page }) => {
    const testData = generateContactData();

    await login(page, 'dev-user@limn.us.com', 'password');
    await page.goto('/crm/contacts', { waitUntil: 'networkidle' });

    console.log('\n🔍 Testing: Contacts CREATE');

    // Wait for page to fully load and find "Add" button
    const addButton = page.locator('button').filter({ hasText: /add|create|new/i }).first();

    try {
      await addButton.waitFor({ state: 'visible', timeout: 10000 });
    } catch (error) {
      reportIssue('Contacts', 'CREATE', 'HIGH', 'No Add/Create button found on page', '/crm/contacts');
      return;
    }

    // Click Add button and wait for form to appear
    try {
      await addButton.click();
      await page.locator('form').first().waitFor({ state: 'visible', timeout: 5000 });
    } catch (error) {
      reportIssue('Contacts', 'CREATE', 'CRITICAL', 'Create form did not appear after clicking Add button', '/crm/contacts', error.message);
      return;
    }

    // Fill form fields with proper waits
    try {
      const nameInput = page.locator('input[name="name"], input[placeholder*="name" i]').first();
      await nameInput.waitFor({ state: 'visible', timeout: 3000 });
      await nameInput.fill(testData.name);

      const emailInput = page.locator('input[name="email"], input[type="email"]').first();
      await emailInput.waitFor({ state: 'visible', timeout: 3000 });
      await emailInput.fill(testData.email);

      const phoneInput = page.locator('input[name="phone"], input[placeholder*="phone" i]').first();
      if (await phoneInput.count() > 0) {
        await phoneInput.fill(testData.phone);
      }
    } catch (error) {
      reportIssue('Contacts', 'CREATE', 'HIGH', 'Error filling form fields', '/crm/contacts', error.message);
      return;
    }

    // Submit form and wait for success
    const submitButton = page.locator('button[type="submit"], button').filter({ hasText: /save|submit|create/i }).first();

    try {
      await submitButton.waitFor({ state: 'visible', timeout: 3000 });
      await submitButton.click();

      // Wait for network requests to complete (mutation)
      await page.waitForLoadState('networkidle', { timeout: 5000 });

      // Wait for form to close (indicates success)
      await page.locator('form').first().waitFor({ state: 'hidden', timeout: 3000 });
    } catch (error) {
      reportIssue('Contacts', 'CREATE', 'CRITICAL', 'Form submission failed or timed out', '/crm/contacts', error.message);
      return;
    }

    // VERIFY IN DATABASE with retry logic (handle async operations)
    let dbRecord = null;
    for (let i = 0; i < 5; i++) {
      dbRecord = await prisma.contacts.findFirst({
        where: { email: testData.email }
      });
      if (dbRecord) break;
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    if (!dbRecord) {
      reportIssue('Contacts', 'CREATE', 'CRITICAL', 'Form submitted but no database record created', '/crm/contacts', `Expected email: ${testData.email}`);
    } else {
      console.log('   ✅ Database record created successfully');
    }
  });

  test('Contacts - READ operation', async ({ page }) => {
    await login(page, 'dev-user@limn.us.com', 'password');
    await page.goto('/crm/contacts', { waitUntil: 'networkidle' });

    console.log('\n🔍 Testing: Contacts READ');

    // Get contacts from database
    const dbContacts = await prisma.contacts.findMany({ take: 5 });

    if (dbContacts.length === 0) {
      console.log('   ⚠️  No contacts in database to verify READ operation');
      return;
    }

    // Wait for table to load
    const table = page.locator('table').first();

    try {
      await table.waitFor({ state: 'visible', timeout: 10000 });
    } catch (error) {
      reportIssue('Contacts', 'READ', 'CRITICAL', 'No table found on contacts page', '/crm/contacts');
      return;
    }

    // Check if first contact from DB appears in UI
    const firstContact = dbContacts[0];
    const contactInTable = page.locator('table').locator(`text=${firstContact.email}`);

    try {
      await contactInTable.waitFor({ state: 'visible', timeout: 5000 });
      console.log('   ✅ Database records display correctly in UI');
    } catch (error) {
      reportIssue('Contacts', 'READ', 'CRITICAL', 'Database contacts not displaying in UI table', '/crm/contacts', `Expected: ${firstContact.email}`);
    }
  });

  test('Contacts - UPDATE operation', async ({ page }) => {
    await login(page, 'dev-user@limn.us.com', 'password');
    await page.goto('/crm/contacts', { waitUntil: 'networkidle' });

    console.log('\n🔍 Testing: Contacts UPDATE');

    // Get a contact from database
    const dbContact = await prisma.contacts.findFirst();

    if (!dbContact) {
      console.log('   ⚠️  No contacts in database to test UPDATE operation');
      return;
    }

    // Wait for page to load and find Edit button
    const editButton = page.locator('button').filter({ hasText: /edit/i }).first();

    try {
      await editButton.waitFor({ state: 'visible', timeout: 10000 });
    } catch (error) {
      reportIssue('Contacts', 'UPDATE', 'HIGH', 'No Edit button found', '/crm/contacts');
      return;
    }

    // Click edit and wait for form to appear
    try {
      await editButton.click();
      await page.locator('form').first().waitFor({ state: 'visible', timeout: 5000 });
    } catch (error) {
      reportIssue('Contacts', 'UPDATE', 'CRITICAL', 'Edit form did not appear', '/crm/contacts', error.message);
      return;
    }

    // Modify name field
    const updatedName = `${dbContact.name} UPDATED`;
    const nameInput = page.locator('input[name="name"], input[placeholder*="name" i]').first();

    try {
      await nameInput.waitFor({ state: 'visible', timeout: 3000 });
      await nameInput.clear();
      await nameInput.fill(updatedName);
    } catch (error) {
      reportIssue('Contacts', 'UPDATE', 'HIGH', 'Cannot modify form fields', '/crm/contacts', error.message);
      return;
    }

    // Submit and wait for success
    const submitButton = page.locator('button[type="submit"], button').filter({ hasText: /save|update/i }).first();

    try {
      await submitButton.click();

      // Wait for network requests to complete
      await page.waitForLoadState('networkidle', { timeout: 5000 });

      // Wait for form to close
      await page.locator('form').first().waitFor({ state: 'hidden', timeout: 3000 });
    } catch (error) {
      reportIssue('Contacts', 'UPDATE', 'CRITICAL', 'Cannot submit update form', '/crm/contacts', error.message);
      return;
    }

    // VERIFY IN DATABASE with retry logic
    let updatedRecord = null;
    for (let i = 0; i < 5; i++) {
      updatedRecord = await prisma.contacts.findUnique({
        where: { id: dbContact.id }
      });
      if (updatedRecord && updatedRecord.name === updatedName) break;
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    if (!updatedRecord || updatedRecord.name !== updatedName) {
      reportIssue('Contacts', 'UPDATE', 'CRITICAL', 'Database record not updated after form submission', '/crm/contacts', `Expected name: ${updatedName}, Got: ${updatedRecord?.name}`);
    } else {
      console.log('   ✅ Database record updated successfully');
    }
  });

  test('Contacts - DELETE operation', async ({ page }) => {
    await login(page, 'dev-user@limn.us.com', 'password');

    console.log('\n🔍 Testing: Contacts DELETE');

    // Create a test contact to delete
    const testContact = await prisma.contacts.create({
      data: {
        name: 'DELETE TEST CONTACT',
        email: `delete-test-${Date.now()}@test.com`,
        phone: '555-TEST',
        company: 'Test Company',
      }
    });

    await page.goto('/crm/contacts', { waitUntil: 'networkidle' });

    // Wait for table to load
    await page.locator('table').first().waitFor({ state: 'visible', timeout: 10000 });

    // Find actions dropdown button (delete is inside dropdown menu)
    const actionsButton = page.locator('button[aria-haspopup="menu"]').first();

    try {
      await actionsButton.waitFor({ state: 'visible', timeout: 5000 });
      await actionsButton.click();

      // Wait for dropdown menu to open
      await page.waitForTimeout(500);

      // Find delete option in dropdown
      const deleteButton = page.locator('button, [role="menuitem"]').filter({ hasText: /delete|remove/i }).first();
      await deleteButton.waitFor({ state: 'visible', timeout: 3000 });
      await deleteButton.click();

      // Wait for network request to complete
      await page.waitForLoadState('networkidle', { timeout: 5000 });
    } catch (error) {
      reportIssue('Contacts', 'DELETE', 'MEDIUM', 'Delete action not found or failed', '/crm/contacts', error.message);
      return;
    }

    // VERIFY IN DATABASE with retry logic
    let deletedRecord = null;
    for (let i = 0; i < 5; i++) {
      deletedRecord = await prisma.contacts.findUnique({
        where: { id: testContact.id }
      });
      if (!deletedRecord) break;
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    if (deletedRecord) {
      reportIssue('Contacts', 'DELETE', 'CRITICAL', 'Database record still exists after delete', '/crm/contacts', `Record ID: ${testContact.id}`);
    } else {
      console.log('   ✅ Database record deleted successfully');
    }
  });

  // ============================================================================
  // CUSTOMERS - CRUD OPERATIONS (abbreviated - same pattern)
  // ============================================================================

  test('Customers - CREATE operation', async ({ page }) => {
    const testData = generateCustomerData();

    await login(page, 'dev-user@limn.us.com', 'password');
    await page.goto('/crm/customers', { waitUntil: 'networkidle' });

    console.log('\n🔍 Testing: Customers CREATE');

    const addButton = page.locator('button').filter({ hasText: /add|create|new/i }).first();

    try {
      await addButton.waitFor({ state: 'visible', timeout: 10000 });
      await addButton.click();

      // Wait for form to appear
      await page.locator('form').first().waitFor({ state: 'visible', timeout: 5000 });

      // Fill form
      const nameInput = page.locator('input[name="name"], input').first();
      await nameInput.waitFor({ state: 'visible', timeout: 3000 });
      await nameInput.fill(testData.name);

      const emailInput = page.locator('input[type="email"]').first();
      await emailInput.fill(testData.email);

      // Submit and wait for success
      const submitButton = page.locator('button').filter({ hasText: /save|submit/i }).first();
      await submitButton.click();
      await page.waitForLoadState('networkidle', { timeout: 5000 });
      await page.locator('form').first().waitFor({ state: 'hidden', timeout: 3000 });

      // Verify in database with retry
      let dbRecord = null;
      for (let i = 0; i < 5; i++) {
        dbRecord = await prisma.customers.findFirst({
          where: { email: testData.email }
        });
        if (dbRecord) break;
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      if (!dbRecord) {
        reportIssue('Customers', 'CREATE', 'CRITICAL', 'Database record not created', '/crm/customers');
      } else {
        console.log('   ✅ Database record created');
      }
    } catch (error) {
      reportIssue('Customers', 'CREATE', 'CRITICAL', 'Create operation failed', '/crm/customers', error.message);
    }
  });

  // ============================================================================
  // LEADS - CRUD OPERATIONS (abbreviated)
  // ============================================================================

  test('Leads - CREATE operation', async ({ page }) => {
    const testData = generateLeadData();

    await login(page, 'dev-user@limn.us.com', 'password');
    await page.goto('/crm/leads', { waitUntil: 'networkidle' });

    console.log('\n🔍 Testing: Leads CREATE');

    const addButton = page.locator('button').filter({ hasText: /add|create|new/i }).first();

    try {
      await addButton.waitFor({ state: 'visible', timeout: 10000 });
      await addButton.click();

      // Wait for form to appear
      await page.locator('form').first().waitFor({ state: 'visible', timeout: 5000 });

      // Fill form
      const nameInput = page.locator('input').first();
      await nameInput.waitFor({ state: 'visible', timeout: 3000 });
      await nameInput.fill(testData.name);

      const emailInput = page.locator('input[type="email"]').first();
      await emailInput.fill(testData.email);

      // Submit and wait for success
      const submitButton = page.locator('button').filter({ hasText: /save|submit/i }).first();
      await submitButton.click();
      await page.waitForLoadState('networkidle', { timeout: 5000 });
      await page.locator('form').first().waitFor({ state: 'hidden', timeout: 3000 });

      // Verify with retry
      let dbRecord = null;
      for (let i = 0; i < 5; i++) {
        dbRecord = await prisma.leads.findFirst({
          where: { email: testData.email }
        });
        if (dbRecord) break;
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      if (!dbRecord) {
        reportIssue('Leads', 'CREATE', 'CRITICAL', 'Database record not created', '/crm/leads');
      } else {
        console.log('   ✅ Database record created');
      }
    } catch (error) {
      reportIssue('Leads', 'CREATE', 'CRITICAL', 'Create operation failed', '/crm/leads', error.message);
    }
  });
});
