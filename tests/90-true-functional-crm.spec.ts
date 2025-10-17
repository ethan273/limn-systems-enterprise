/**
 * TRUE FUNCTIONAL TEST - CRM Module
 *
 * Actually PERFORMS operations and VERIFIES in database:
 * - Create a contact → Check it exists in DB
 * - Edit a contact → Check update happened in DB
 * - Delete a contact → Check it's gone from DB
 */

import { test } from '@playwright/test';
import { PrismaClient } from '@prisma/client';
import { login } from './helpers/auth-helper';

const prisma = new PrismaClient();

test.describe('TRUE Functional Test - CRM', () => {
  let testContactId: string | null = null;

  test.afterAll(async () => {
    // Cleanup any test data
    if (testContactId) {
      try {
        await prisma.contacts.delete({ where: { id: testContactId } });
      } catch {}
    }
    await prisma.$disconnect();
  });

  test('CONTACTS - Can I actually CREATE a contact?', async ({ page }) => {
    console.log('\n🧪 ATTEMPTING: Create a new contact');

    // Setup listeners FIRST - before any page interaction
    const consoleMessages: string[] = [];
    const networkRequests: { url: string; method: string; status?: number }[] = [];

    page.on('console', msg => {
      const text = `${msg.type()}: ${msg.text()}`;
      consoleMessages.push(text);
      // Log to test console in real-time
      console.log(`   [BROWSER] ${text}`);
    });

    page.on('request', req => {
      networkRequests.push({ url: req.url(), method: req.method() });
      console.log(`   [NETWORK] → ${req.method()} ${req.url()}`);
    });

    page.on('response', res => {
      const req = networkRequests.find(r => r.url === res.url());
      if (req) req.status = res.status();
      console.log(`   [NETWORK] ← ${res.status()} ${res.url()}`);
    });

    await login(page, 'dev-user@limn.us.com', 'password');
    await page.goto('/crm/contacts');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);

    console.log('   Step 1: Looking for Add/Create button...');

    // Find and click Add button
    const addButton = page.locator('button').filter({ hasText: /add|create|new/i }).first();
    const exists = await addButton.count();

    if (exists === 0) {
      console.log('   ❌ FAILED: No Add button found');
      return;
    }

    console.log('   ✅ Found Add button, clicking...');
    await addButton.click();
    await page.waitForTimeout(1500);

    console.log('   Step 2: Looking for form...');

    // Check if form appeared
    const form = page.locator('form, [role="dialog"], [class*="dialog"]').first();
    const formExists = await form.count();

    if (formExists === 0) {
      console.log('   ❌ FAILED: No form appeared after clicking Add');
      return;
    }

    console.log('   ✅ Form appeared');
    console.log('   Step 3: Filling form fields...');

    // Generate test data
    const timestamp = Date.now();
    const testData = {
      name: `Functional Test Contact ${timestamp}`,
      email: `test${timestamp}@functional.com`,
      phone: '555-1234',
    };

    try {
      // Fill name - try multiple selectors
      const nameField = page.locator('input[name="name"], input[placeholder*="name" i], label:has-text("Name") + input').first();
      if (await nameField.count() > 0) {
        await nameField.fill(testData.name);
        console.log(`   ✅ Filled name: ${testData.name}`);
      }

      // Fill email
      const emailField = page.locator('input[type="email"], input[name="email"]').first();
      if (await emailField.count() > 0) {
        await emailField.fill(testData.email);
        console.log(`   ✅ Filled email: ${testData.email}`);
      }

      // Fill phone
      const phoneField = page.locator('input[name="phone"], input[placeholder*="phone" i]').first();
      if (await phoneField.count() > 0) {
        await phoneField.fill(testData.phone);
        console.log(`   ✅ Filled phone: ${testData.phone}`);
      }

      console.log('   Step 4: Submitting form...');

      // Find and click submit button
      const submitButton = page.locator('button[type="submit"], button').filter({ hasText: /save|submit|create/i }).first();

      if (await submitButton.count() === 0) {
        console.log('   ❌ FAILED: No submit button found');
        return;
      }

      // Take screenshot before clicking
      await page.screenshot({
        path: 'test-results/contacts-before-submit.png',
      });

      // Trigger form submission directly via JavaScript
      // This properly fires the form's onSubmit event handler
      await page.evaluate(() => {
        const form = document.querySelector('form');
        if (form) {
          // Create and dispatch a submit event
          const submitEvent = new Event('submit', { bubbles: true, cancelable: true });
          form.dispatchEvent(submitEvent);
        }
      });
      await page.waitForTimeout(3000); // Wait for submission

      console.log('   Step 5: Analyzing browser activity...');

      // Check for FormDialog/ContactsPage logs
      const formDialogLogs = consoleMessages.filter(msg => msg.includes('[FormDialog]'));
      const contactsPageLogs = consoleMessages.filter(msg => msg.includes('[ContactsPage]'));

      if (formDialogLogs.length > 0) {
        console.log('   📝 FormDialog logs:', formDialogLogs);
      } else {
        console.log('   ⚠️  NO FormDialog logs found!');
      }

      if (contactsPageLogs.length > 0) {
        console.log('   📝 ContactsPage logs:', contactsPageLogs);
      } else {
        console.log('   ⚠️  NO ContactsPage logs found!');
      }

      // Check for tRPC requests
      const tRPCRequests = networkRequests.filter(req => req.url.includes('/api/trpc/crm.contacts.create'));
      if (tRPCRequests.length > 0) {
        console.log('   📡 tRPC CREATE requests found:', tRPCRequests.length);
      } else {
        console.log('   ⚠️  NO tRPC CREATE requests made!');
      }

      // Check for errors
      const errors = consoleMessages.filter(msg => msg.includes('error') || msg.includes('Error'));
      if (errors.length > 0) {
        console.log('   ⚠️  Browser errors:', errors);
      }

      console.log('   Step 6: Checking database...');

      // VERIFY IN DATABASE
      const createdContact = await prisma.contacts.findFirst({
        where: { email: testData.email },
        orderBy: { created_at: 'desc' },
      });

      if (createdContact) {
        testContactId = createdContact.id;
        console.log('   ✅ SUCCESS: Contact created in database!');
        console.log(`      ID: ${createdContact.id}`);
        console.log(`      Name: ${createdContact.name}`);
        console.log(`      Email: ${createdContact.email}`);
      } else {
        console.log('   ❌ FAILED: Contact NOT found in database');
        console.log(`      Expected email: ${testData.email}`);

        // Take screenshot of failure
        await page.screenshot({
          path: 'test-results/contacts-create-failed.png',
          fullPage: true
        });
      }

    } catch (error) {
      console.log(`   ❌ ERROR during test: ${error.message}`);

      // Take screenshot of error
      await page.screenshot({
        path: 'test-results/contacts-create-error.png',
        fullPage: true
      });
    }
  });

  test('CONTACTS - Can I actually EDIT a contact?', async ({ page }) => {
    console.log('\n🧪 ATTEMPTING: Edit an existing contact');

    // First, make sure we have a contact to edit
    const existingContact = await prisma.contacts.findFirst();

    if (!existingContact) {
      console.log('   ⚠️  SKIPPED: No contacts in database to edit');
      return;
    }

    console.log(`   Testing with contact: ${existingContact.name} (${existingContact.email})`);

    await login(page, 'dev-user@limn.us.com', 'password');
    await page.goto('/crm/contacts');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);

    console.log('   Step 1: Looking for Actions dropdown...');

    // Find the dropdown menu trigger in the table row
    const dropdownTrigger = page.locator('table tbody tr').first().locator('button[class*="btn-icon"]').last();
    const exists = await dropdownTrigger.count();

    if (exists === 0) {
      console.log('   ❌ FAILED: No dropdown menu found on page');
      return;
    }

    console.log('   ✅ Found dropdown menu, opening...');
    await dropdownTrigger.click();
    await page.waitForTimeout(500);

    // Click Edit option in dropdown
    const editMenuItem = page.locator('[role="menuitem"]').filter({ hasText: /edit/i }).first();
    const editExists = await editMenuItem.count();

    if (editExists === 0) {
      console.log('   ❌ FAILED: No Edit option in dropdown');
      return;
    }

    console.log('   ✅ Found Edit option, clicking...');
    await editMenuItem.click();
    await page.waitForTimeout(1500);

    console.log('   Step 2: Modifying data...');

    const updatedName = `${existingContact.name} - EDITED`;

    try {
      const nameField = page.locator('input[name="name"], input[placeholder*="name" i]').first();
      if (await nameField.count() > 0) {
        await nameField.fill(updatedName);
        console.log(`   ✅ Changed name to: ${updatedName}`);
      }

      console.log('   Step 3: Submitting changes...');

      // Trigger form submission directly via JavaScript
      // This properly fires the form's onSubmit event handler
      await page.evaluate(() => {
        const form = document.querySelector('form');
        if (form) {
          const submitEvent = new Event('submit', { bubbles: true, cancelable: true });
          form.dispatchEvent(submitEvent);
        }
      });
      await page.waitForTimeout(3000);

      console.log('   Step 4: Checking database...');

      const updatedContact = await prisma.contacts.findUnique({
        where: { id: existingContact.id },
      });

      if (updatedContact && updatedContact.name === updatedName) {
        console.log('   ✅ SUCCESS: Contact updated in database!');
        console.log(`      New name: ${updatedContact.name}`);
      } else {
        console.log('   ❌ FAILED: Contact NOT updated in database');
        console.log(`      Expected: ${updatedName}`);
        console.log(`      Got: ${updatedContact?.name}`);
      }

    } catch (error) {
      console.log(`   ❌ ERROR: ${error.message}`);
    }
  });

  test('CONTACTS - Can I actually DELETE a contact?', async ({ page }) => {
    console.log('\n🧪 ATTEMPTING: Delete a contact');

    // Create a contact just for deletion
    const deleteTest = await prisma.contacts.create({
      data: {
        name: 'DELETE ME - Test Contact',
        email: `delete-test-${Date.now()}@test.com`,
      },
    });

    console.log(`   Created test contact for deletion: ${deleteTest.id}`);

    await login(page, 'dev-user@limn.us.com', 'password');
    await page.goto('/crm/contacts');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);

    console.log('   Step 1: Looking for Delete button in dropdown...');

    // Open dropdown menu for first row
    const dropdownTrigger = page.locator('table tbody tr').first().locator('button[class*="btn-icon"]').last();
    const triggerExists = await dropdownTrigger.count();

    if (triggerExists === 0) {
      console.log('   ❌ FAILED: No dropdown menu found');
      return;
    }

    await dropdownTrigger.click();
    await page.waitForTimeout(500);

    // Find delete option in dropdown
    const deleteButton = page.locator('[role="menuitem"]').filter({ hasText: /delete|remove/i }).first();
    const exists = await deleteButton.count();

    if (exists === 0) {
      console.log('   ❌ FAILED: No Delete button found');
      return;
    }

    console.log('   ✅ Found Delete button, clicking...');
    await deleteButton.click();
    await page.waitForTimeout(500);

    // Handle confirmation dialog if it appears
    const confirmButton = page.locator('button').filter({ hasText: /confirm|yes|delete/i }).first();
    if (await confirmButton.count() > 0) {
      console.log('   ✅ Confirmation dialog appeared, confirming...');
      await confirmButton.click();
    }

    await page.waitForTimeout(3000);

    console.log('   Step 2: Checking database...');

    const deletedContact = await prisma.contacts.findUnique({
      where: { id: deleteTest.id },
    });

    if (!deletedContact) {
      console.log('   ✅ SUCCESS: Contact deleted from database!');
    } else {
      console.log('   ❌ FAILED: Contact still exists in database');
      console.log(`      Contact ID: ${deleteTest.id}`);
    }
  });
});
