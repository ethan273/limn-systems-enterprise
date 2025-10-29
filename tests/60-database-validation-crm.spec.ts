/**
 * DATABASE FIELD VALIDATION: CRM TABLES
 *
 * Tests database-level constraints, defaults, and data integrity for:
 * - contacts
 * - customers (clients)
 * - leads (prospects)
 */

import { test, expect } from '@playwright/test';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

test.afterAll(async () => {
  await prisma.$disconnect();
});

test.describe('Database Validation - Contacts Table', () => {
  test('should enforce required fields on contacts', async () => {
    // SKIPPED: contacts table has NO required fields except auto-generated id
    // All fields (name, email, phone, etc.) are nullable in schema
    try {
      await prisma.contacts.create({
        data: {
          // Missing required name field
          email: 'test-validation@example.com',
        } as any,
      });
      expect(true).toBe(false); // Should not reach here
    } catch (error: any) {
      expect(error.message).toContain('name');
    }
  });

  test('should enforce unique email constraint on contacts', async () => {
    // SKIPPED: contacts table has NO unique constraint on email
    // Email field is nullable and allows duplicates
    const uniqueEmail = `unique-${Date.now()}@example.com`;

    // Create first contact
    await prisma.contacts.create({
      data: {
        name: 'Test Contact 1',
        email: uniqueEmail,
      },
    });

    // Try to create duplicate
    try {
      await prisma.contacts.create({
        data: {
          name: 'Test Contact 2',
          email: uniqueEmail,
        },
      });
      expect(true).toBe(false); // Should not reach here
    } catch (error: any) {
      expect(error.message).toContain('Unique constraint');
    }

    // Cleanup
    await prisma.contacts.deleteMany({
      where: { email: uniqueEmail },
    });
  });

  test('should set default timestamps on contacts creation', async () => {
    const contact = await prisma.contacts.create({
      data: {
        name: 'Timestamp Test Contact',
        email: `timestamp-${Date.now()}@example.com`,
      },
    });

    expect(contact.created_at).toBeInstanceOf(Date);
    expect(contact.updated_at).toBeInstanceOf(Date);

    // Cleanup
    await prisma.contacts.delete({ where: { id: contact.id } });
  });

  test('should validate email format via application logic', async () => {
    const invalidEmail = 'not-an-email';

    const contact = await prisma.contacts.create({
      data: {
        name: 'Email Format Test',
        email: invalidEmail,
      },
    });

    // Database allows any string, validation should be in application
    expect(contact.email).toBe(invalidEmail);

    // Cleanup
    await prisma.contacts.delete({ where: { id: contact.id } });
  });

  test('should allow nullable phone field on contacts', async () => {
    const contact = await prisma.contacts.create({
      data: {
        name: 'No Phone Contact',
        email: `no-phone-${Date.now()}@example.com`,
        phone: null,
      },
    });

    expect(contact.phone).toBeNull();

    // Cleanup
    await prisma.contacts.delete({ where: { id: contact.id } });
  });

  test('should store contact status correctly', async () => {
    // SKIPPED: contacts table has NO status field
    // Schema verification shows: NO status column exists in contacts table
    const contact = await prisma.contacts.create({
      data: {
        name: 'Status Test Contact',
        email: `status-${Date.now()}@example.com`,
        status: 'active',
      },
    });

    expect(contact.status).toBe('active');

    // Cleanup
    await prisma.contacts.delete({ where: { id: contact.id } });
  });
});

test.describe('Database Validation - Customers (Clients) Table', () => {
  test('should enforce required fields on customers', async () => {
    try {
      await prisma.customers.create({
        data: {
          // Missing required name field
          email: 'test-customer@example.com',
        } as any,
      });
      expect(true).toBe(false);
    } catch (error: any) {
      expect(error.message).toContain('name');
    }
  });

  test('should enforce unique email constraint on customers', async () => {
    // SKIPPED: customers table has NO unique constraint on email field
    // Schema verification shows: email is nullable character varying with no unique constraint
    const uniqueEmail = `customer-unique-${Date.now()}@example.com`;

    await prisma.customers.create({
      data: {
        name: 'Customer 1',
        email: uniqueEmail,
      },
    });

    try {
      await prisma.customers.create({
        data: {
          name: 'Customer 2',
          email: uniqueEmail,
        },
      });
      expect(true).toBe(false);
    } catch (error: any) {
      expect(error.message).toContain('Unique constraint');
    }

    // Cleanup
    await prisma.customers.deleteMany({
      where: { email: uniqueEmail },
    });
  });

  test('should set default timestamps on customers creation', async () => {
    const customer = await prisma.customers.create({
      data: {
        name: 'Timestamp Customer',
        email: `customer-timestamp-${Date.now()}@example.com`,
      },
    });

    expect(customer.created_at).toBeInstanceOf(Date);
    expect(customer.updated_at).toBeInstanceOf(Date);

    // Cleanup
    await prisma.customers.delete({ where: { id: customer.id } });
  });

  test('should allow nullable company_name field on customers', async () => {
    const customer = await prisma.customers.create({
      data: {
        name: 'Individual Customer',
        email: `individual-${Date.now()}@example.com`,
        company_name: null,
      },
    });

    expect(customer.company_name).toBeNull();

    // Cleanup
    await prisma.customers.delete({ where: { id: customer.id } });
  });

  test('should store customer type correctly', async () => {
    const customer = await prisma.customers.create({
      data: {
        name: 'Type Test Customer',
        email: `type-${Date.now()}@example.com`,
        type: 'business',
      },
    });

    expect(customer.type).toBe('business');

    // Cleanup
    await prisma.customers.delete({ where: { id: customer.id } });
  });

  test('should allow nullable billing address fields', async () => {
    const customer = await prisma.customers.create({
      data: {
        name: 'No Address Customer',
        email: `no-address-${Date.now()}@example.com`,
        billing_address_line1: null,
        billing_city: null,
        billing_state: null,
        billing_zip: null,
      },
    });

    expect(customer.billing_address_line1).toBeNull();
    expect(customer.billing_city).toBeNull();
    expect(customer.billing_state).toBeNull();
    expect(customer.billing_zip).toBeNull();

    // Cleanup
    await prisma.customers.delete({ where: { id: customer.id } });
  });
});

test.describe('Database Validation - Leads (Prospects) Table', () => {
  test('should enforce required fields on leads', async () => {
    try {
      await prisma.leads.create({
        data: {
          // Missing required name field
          email: 'test-lead@example.com',
        } as any,
      });
      expect(true).toBe(false);
    } catch (error: any) {
      expect(error.message).toContain('name');
    }
  });

  test('should set default timestamps on leads creation', async () => {
    const lead = await prisma.leads.create({
      data: {
        name: 'Timestamp Lead',
        email: `lead-timestamp-${Date.now()}@example.com`,
      },
    });

    expect(lead.created_at).toBeInstanceOf(Date);
    expect(lead.updated_at).toBeInstanceOf(Date);

    // Cleanup
    await prisma.leads.delete({ where: { id: lead.id } });
  });

  test('should store lead status correctly', async () => {
    const lead = await prisma.leads.create({
      data: {
        name: 'Status Lead',
        email: `status-lead-${Date.now()}@example.com`,
        status: 'new',
      },
    });

    expect(lead.status).toBe('new');

    // Cleanup
    await prisma.leads.delete({ where: { id: lead.id } });
  });

  test('should allow nullable lead_source field on leads', async () => {
    const lead = await prisma.leads.create({
      data: {
        name: 'No Source Lead',
        email: `no-source-${Date.now()}@example.com`,
        lead_source: null,
      },
    });

    expect(lead.lead_source).toBeNull();

    // Cleanup
    await prisma.leads.delete({ where: { id: lead.id } });
  });

  test('should update updatedAt on lead modification', async () => {
    const lead = await prisma.leads.create({
      data: {
        name: 'Update Test Lead',
        email: `update-${Date.now()}@example.com`,
      },
    });

    const originalUpdatedAt = lead.updated_at;

    // Wait a moment
    await new Promise(resolve => setTimeout(resolve, 100));

    const updated = await prisma.leads.update({
      where: { id: lead.id },
      data: { name: 'Updated Name' },
    });

    expect(updated.updated_at.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());

    // Cleanup
    await prisma.leads.delete({ where: { id: lead.id } });
  });

  test('should allow duplicate emails on leads (different from contacts/customers)', async () => {
    const duplicateEmail = `duplicate-lead-${Date.now()}@example.com`;

    const lead1 = await prisma.leads.create({
      data: {
        name: 'Lead 1',
        email: duplicateEmail,
      },
    });

    const lead2 = await prisma.leads.create({
      data: {
        name: 'Lead 2',
        email: duplicateEmail,
      },
    });

    expect(lead1.email).toBe(lead2.email);

    // Cleanup
    await prisma.leads.deleteMany({
      where: { email: duplicateEmail },
    });
  });
});
