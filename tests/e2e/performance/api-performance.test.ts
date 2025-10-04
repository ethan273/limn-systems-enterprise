import { test, expect } from '@playwright/test';

/**
 * API Performance Tests
 *
 * Tests API response times and performance benchmarks for all 31 tRPC routers
 *
 * Performance Targets:
 * - List endpoints: < 2000ms
 * - Single record endpoints: < 1000ms
 * - Complex queries: < 3000ms
 */

test.describe('API Performance Tests - CRM Module', () => {
  test('Clients API - Should respond within 2 seconds', async ({ request }) => {
    const startTime = Date.now();
    const response = await request.get('/api/trpc/clients.list');
    const endTime = Date.now();
    const responseTime = endTime - startTime;

    console.log(`Clients API response time: ${responseTime}ms`);
    expect(responseTime).toBeLessThan(2000);
  });

  test('Contacts API - Should respond within 2 seconds', async ({ request }) => {
    const startTime = Date.now();
    const response = await request.get('/api/trpc/contacts.list');
    const endTime = Date.now();
    const responseTime = endTime - startTime;

    console.log(`Contacts API response time: ${responseTime}ms`);
    expect(responseTime).toBeLessThan(2000);
  });

  test('Leads API - Should respond within 2 seconds', async ({ request }) => {
    const startTime = Date.now();
    const response = await request.get('/api/trpc/leads.list');
    const endTime = Date.now();
    const responseTime = endTime - startTime;

    console.log(`Leads API response time: ${responseTime}ms`);
    expect(responseTime).toBeLessThan(2000);
  });
});

test.describe('API Performance Tests - Orders & Financial', () => {
  test('Orders API - Should respond within 2 seconds', async ({ request }) => {
    const startTime = Date.now();
    const response = await request.get('/api/trpc/orders.list');
    const endTime = Date.now();
    const responseTime = endTime - startTime;

    console.log(`Orders API response time: ${responseTime}ms`);
    expect(responseTime).toBeLessThan(2000);
  });

  test('Invoices API - Should respond within 2 seconds', async ({ request }) => {
    const startTime = Date.now();
    const response = await request.get('/api/trpc/invoices.list');
    const endTime = Date.now();
    const responseTime = endTime - startTime;

    console.log(`Invoices API response time: ${responseTime}ms`);
    expect(responseTime).toBeLessThan(2000);
  });

  test('Payments API - Should respond within 2 seconds', async ({ request }) => {
    const startTime = Date.now();
    const response = await request.get('/api/trpc/payments.list');
    const endTime = Date.now();
    const responseTime = endTime - startTime;

    console.log(`Payments API response time: ${responseTime}ms`);
    expect(responseTime).toBeLessThan(2000);
  });

  test('Quotes API - Should respond within 2 seconds', async ({ request }) => {
    const startTime = Date.now();
    const response = await request.get('/api/trpc/quotes.list');
    const endTime = Date.now();
    const responseTime = endTime - startTime;

    console.log(`Quotes API response time: ${responseTime}ms`);
    expect(responseTime).toBeLessThan(2000);
  });
});

test.describe('API Performance Tests - Production Module', () => {
  test('Production Orders API - Should respond within 2 seconds', async ({ request }) => {
    const startTime = Date.now();
    const response = await request.get('/api/trpc/productionOrders.list');
    const endTime = Date.now();
    const responseTime = endTime - startTime;

    console.log(`Production Orders API response time: ${responseTime}ms`);
    expect(responseTime).toBeLessThan(2000);
  });

  test('Ordered Items API - Should respond within 2 seconds', async ({ request }) => {
    const startTime = Date.now();
    const response = await request.get('/api/trpc/orderedItems.list');
    const endTime = Date.now();
    const responseTime = endTime - startTime;

    console.log(`Ordered Items API response time: ${responseTime}ms`);
    expect(responseTime).toBeLessThan(2000);
  });

  test('Quality Inspections API - Should respond within 2 seconds', async ({ request }) => {
    const startTime = Date.now();
    const response = await request.get('/api/trpc/qualityInspections.list');
    const endTime = Date.now();
    const responseTime = endTime - startTime;

    console.log(`Quality Inspections API response time: ${responseTime}ms`);
    expect(responseTime).toBeLessThan(2000);
  });

  test('Shipments API - Should respond within 2 seconds', async ({ request }) => {
    const startTime = Date.now();
    const response = await request.get('/api/trpc/shipments.list');
    const endTime = Date.now();
    const responseTime = endTime - startTime;

    console.log(`Shipments API response time: ${responseTime}ms`);
    expect(responseTime).toBeLessThan(2000);
  });
});

test.describe('API Performance Tests - Products Module', () => {
  test('Products API - Should respond within 2 seconds', async ({ request }) => {
    const startTime = Date.now();
    const response = await request.get('/api/trpc/products.list');
    const endTime = Date.now();
    const responseTime = endTime - startTime;

    console.log(`Products API response time: ${responseTime}ms`);
    expect(responseTime).toBeLessThan(2000);
  });

  test('Collections API - Should respond within 2 seconds', async ({ request }) => {
    const startTime = Date.now();
    const response = await request.get('/api/trpc/collections.list');
    const endTime = Date.now();
    const responseTime = endTime - startTime;

    console.log(`Collections API response time: ${responseTime}ms`);
    expect(responseTime).toBeLessThan(2000);
  });

  test('Concepts API - Should respond within 2 seconds', async ({ request }) => {
    const startTime = Date.now();
    const response = await request.get('/api/trpc/concepts.list');
    const endTime = Date.now();
    const responseTime = endTime - startTime;

    console.log(`Concepts API response time: ${responseTime}ms`);
    expect(responseTime).toBeLessThan(2000);
  });

  test('Prototypes API - Should respond within 2 seconds', async ({ request }) => {
    const startTime = Date.now();
    const response = await request.get('/api/trpc/prototypes.list');
    const endTime = Date.now();
    const responseTime = endTime - startTime;

    console.log(`Prototypes API response time: ${responseTime}ms`);
    expect(responseTime).toBeLessThan(2000);
  });
});

test.describe('API Performance Tests - Projects & Tasks', () => {
  test('Projects API - Should respond within 2 seconds', async ({ request }) => {
    const startTime = Date.now();
    const response = await request.get('/api/trpc/projects.list');
    const endTime = Date.now();
    const responseTime = endTime - startTime;

    console.log(`Projects API response time: ${responseTime}ms`);
    expect(responseTime).toBeLessThan(2000);
  });

  test('Tasks API - Should respond within 2 seconds', async ({ request }) => {
    const startTime = Date.now();
    const response = await request.get('/api/trpc/tasks.list');
    const endTime = Date.now();
    const responseTime = endTime - startTime;

    console.log(`Tasks API response time: ${responseTime}ms`);
    expect(responseTime).toBeLessThan(2000);
  });
});

test.describe('API Performance Tests - Design Module', () => {
  test('Design Projects API - Should respond within 2 seconds', async ({ request }) => {
    const startTime = Date.now();
    const response = await request.get('/api/trpc/designProjects.list');
    const endTime = Date.now();
    const responseTime = endTime - startTime;

    console.log(`Design Projects API response time: ${responseTime}ms`);
    expect(responseTime).toBeLessThan(2000);
  });

  test('Shop Drawings API - Should respond within 2 seconds', async ({ request }) => {
    const startTime = Date.now();
    const response = await request.get('/api/trpc/shopDrawings.list');
    const endTime = Date.now();
    const responseTime = endTime - startTime;

    console.log(`Shop Drawings API response time: ${responseTime}ms`);
    expect(responseTime).toBeLessThan(2000);
  });

  test('Design Reviews API - Should respond within 2 seconds', async ({ request }) => {
    const startTime = Date.now();
    const response = await request.get('/api/trpc/designReviews.list');
    const endTime = Date.now();
    const responseTime = endTime - startTime;

    console.log(`Design Reviews API response time: ${responseTime}ms`);
    expect(responseTime).toBeLessThan(2000);
  });
});

test.describe('API Performance Tests - Partners Module', () => {
  test('Factories API - Should respond within 2 seconds', async ({ request }) => {
    const startTime = Date.now();
    const response = await request.get('/api/trpc/factories.list');
    const endTime = Date.now();
    const responseTime = endTime - startTime;

    console.log(`Factories API response time: ${responseTime}ms`);
    expect(responseTime).toBeLessThan(2000);
  });

  test('Factory Review Sessions API - Should respond within 2 seconds', async ({ request }) => {
    const startTime = Date.now();
    const response = await request.get('/api/trpc/factoryReviewSessions.list');
    const endTime = Date.now();
    const responseTime = endTime - startTime;

    console.log(`Factory Review Sessions API response time: ${responseTime}ms`);
    expect(responseTime).toBeLessThan(2000);
  });

  test('Designers API - Should respond within 2 seconds', async ({ request }) => {
    const startTime = Date.now();
    const response = await request.get('/api/trpc/designers.list');
    const endTime = Date.now();
    const responseTime = endTime - startTime;

    console.log(`Designers API response time: ${responseTime}ms`);
    expect(responseTime).toBeLessThan(2000);
  });
});

test.describe('API Performance Tests - Documents & Communication', () => {
  test('Documents API - Should respond within 2 seconds', async ({ request }) => {
    const startTime = Date.now();
    const response = await request.get('/api/trpc/documents.list');
    const endTime = Date.now();
    const responseTime = endTime - startTime;

    console.log(`Documents API response time: ${responseTime}ms`);
    expect(responseTime).toBeLessThan(2000);
  });

  test('Communications API - Should respond within 2 seconds', async ({ request }) => {
    const startTime = Date.now();
    const response = await request.get('/api/trpc/communications.list');
    const endTime = Date.now();
    const responseTime = endTime - startTime;

    console.log(`Communications API response time: ${responseTime}ms`);
    expect(responseTime).toBeLessThan(2000);
  });
});

test.describe('API Performance Tests - Portal', () => {
  test('Portal Users API - Should respond within 2 seconds', async ({ request }) => {
    const startTime = Date.now();
    const response = await request.get('/api/trpc/portalUsers.list');
    const endTime = Date.now();
    const responseTime = endTime - startTime;

    console.log(`Portal Users API response time: ${responseTime}ms`);
    expect(responseTime).toBeLessThan(2000);
  });

  test('Portal Documents API - Should respond within 2 seconds', async ({ request }) => {
    const startTime = Date.now();
    const response = await request.get('/api/trpc/portalDocuments.list');
    const endTime = Date.now();
    const responseTime = endTime - startTime;

    console.log(`Portal Documents API response time: ${responseTime}ms`);
    expect(responseTime).toBeLessThan(2000);
  });

  test('Portal Orders API - Should respond within 2 seconds', async ({ request }) => {
    const startTime = Date.now();
    const response = await request.get('/api/trpc/portalOrders.list');
    const endTime = Date.now();
    const responseTime = endTime - startTime;

    console.log(`Portal Orders API response time: ${responseTime}ms`);
    expect(responseTime).toBeLessThan(2000);
  });
});

test.describe('API Performance Tests - Authentication & Admin', () => {
  test('Users API - Should respond within 2 seconds', async ({ request }) => {
    const startTime = Date.now();
    const response = await request.get('/api/trpc/users.list');
    const endTime = Date.now();
    const responseTime = endTime - startTime;

    console.log(`Users API response time: ${responseTime}ms`);
    expect(responseTime).toBeLessThan(2000);
  });

  test('Settings API - Should respond within 1 second', async ({ request }) => {
    const startTime = Date.now();
    const response = await request.get('/api/trpc/settings.get');
    const endTime = Date.now();
    const responseTime = endTime - startTime;

    console.log(`Settings API response time: ${responseTime}ms`);
    expect(responseTime).toBeLessThan(1000);
  });
});
