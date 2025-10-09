/**
 * COMPREHENSIVE TESTING: CRM LEADS MODULE
 *
 * Coverage:
 * - /crm/leads (list page)
 * - /crm/leads/new (create page)
 * - /crm/leads/[id] (detail page)
 * - /crm/leads/[id]/edit (edit page)
 */

import { test, expect } from '@playwright/test';
import { PrismaClient } from '@prisma/client';
import { login } from './helpers/auth-helper';

const prisma = new PrismaClient();

const testLead = {
  companyName: 'Test Lead Company',
  contactName: 'Charlie Brown',
  email: 'charlie@testlead.com',
  phone: '555-7777',
  source: 'Website',
  status: 'new',
};

const updatedLead = {
  contactName: 'David Smith',
  email: 'david@testlead.com',
  status: 'qualified',
};

let createdLeadId: string | null = null;

test.beforeAll(async () => {
  await prisma.leads.deleteMany({
    where: {
      OR: [
        { email: testLead.email },
        { email: updatedLead.email },
      ],
    },
  });
});

test.afterAll(async () => {
  if (createdLeadId) {
    await prisma.leads.delete({ where: { id: createdLeadId } }).catch(() => {});
  }
  await prisma.leads.deleteMany({
    where: {
      OR: [
        { email: testLead.email },
        { email: updatedLead.email },
      ],
    },
  });
  await prisma.$disconnect();
});

test.describe('CRM Leads - List Page', () => {
  test('should load leads list without errors', async ({ page }) => {
    await login(page, 'dev-user@limn.us.com', 'password');
    await page.goto('/crm/leads', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);

    expect(page.url()).toContain('/crm/leads');
  });

  test('should have functional Add button', async ({ page }) => {
    await login(page, 'dev-user@limn.us.com', 'password');
    await page.goto('/crm/leads', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);

    const addButton = page.locator('button:has-text("Add"), button:has-text("New"), a[href*="/new"]').first();
    await expect(addButton).toBeVisible({ timeout: 5000 });
    await addButton.click();
    await page.waitForTimeout(1000);

    const isOnNewPage = page.url().includes('/crm/leads/new');
    const hasDialog = await page.locator('[role="dialog"]').count() > 0;
    expect(isOnNewPage || hasDialog).toBe(true);
  });
});

test.describe('CRM Leads - Create (CRUD: CREATE)', () => {
  test('should create lead and verify in database', async ({ page }) => {
    await login(page, 'dev-user@limn.us.com', 'password');
    await page.goto('/crm/leads/new', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);

    // Fill form
    await page.locator('input[name*="company" i]').first().fill(testLead.companyName);
    await page.locator('input[name*="contact" i], input[name*="name" i]').first().fill(testLead.contactName);
    await page.locator('input[type="email"]').first().fill(testLead.email);

    const phoneInput = page.locator('input[name*="phone" i]').first();
    if (await phoneInput.count() > 0) {
      await phoneInput.fill(testLead.phone);
    }

    const submitButton = page.locator('button[type="submit"]').first();
    await submitButton.click();
    await page.waitForTimeout(2000);

    // Verify in database
    const leadInDb = await prisma.leads.findUnique({
      where: { email: testLead.email },
    });

    expect(leadInDb).not.toBeNull();
    expect(leadInDb?.companyName).toBe(testLead.companyName);
    expect(leadInDb?.email).toBe(testLead.email);

    if (leadInDb) {
      createdLeadId = leadInDb.id;
    }
  });
});

test.describe('CRM Leads - Read (CRUD: READ)', () => {
  test('should display lead detail page', async ({ page }) => {
    if (!createdLeadId) {
      const lead = await prisma.leads.create({
        data: {
          companyName: testLead.companyName,
          contactName: testLead.contactName,
          email: testLead.email,
          phone: testLead.phone,
          source: testLead.source,
          status: testLead.status,
        },
      });
      createdLeadId = lead.id;
    }

    await login(page, 'dev-user@limn.us.com', 'password');
    await page.goto(`/crm/leads/${createdLeadId}`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);

    expect(page.url()).toContain(`/crm/leads/${createdLeadId}`);

    const pageContent = await page.textContent('body');
    expect(pageContent).toContain(testLead.companyName);
    expect(pageContent).toContain(testLead.email);
  });
});

test.describe('CRM Leads - Update (CRUD: UPDATE)', () => {
  test('should update lead and verify in database', async ({ page }) => {
    if (!createdLeadId) test.skip();

    await login(page, 'dev-user@limn.us.com', 'password');
    await page.goto(`/crm/leads/${createdLeadId}/edit`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);

    await page.locator('input[name*="contact" i], input[name*="name" i]').first().fill(updatedLead.contactName);
    await page.locator('input[type="email"]').first().fill(updatedLead.email);

    const submitButton = page.locator('button[type="submit"]').first();
    await submitButton.click();
    await page.waitForTimeout(2000);

    // Verify in database
    const leadInDb = await prisma.leads.findUnique({
      where: { id: createdLeadId },
    });

    expect(leadInDb?.contactName).toBe(updatedLead.contactName);
    expect(leadInDb?.email).toBe(updatedLead.email);
  });
});

test.describe('CRM Leads - Delete (CRUD: DELETE)', () => {
  test('should delete lead and verify removal', async ({ page }) => {
    if (!createdLeadId) test.skip();

    await login(page, 'dev-user@limn.us.com', 'password');
    await page.goto(`/crm/leads/${createdLeadId}`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);

    const deleteButton = page.locator('button:has-text("Delete")').first();
    await deleteButton.click();
    await page.waitForTimeout(1000);

    const confirmButton = page.locator('button:has-text("Delete"), button:has-text("Confirm")').last();
    await confirmButton.click();
    await page.waitForTimeout(2000);

    // Verify removed from database
    const leadInDb = await prisma.leads.findUnique({
      where: { id: createdLeadId },
    });
    expect(leadInDb).toBeNull();

    createdLeadId = null;
  });
});
