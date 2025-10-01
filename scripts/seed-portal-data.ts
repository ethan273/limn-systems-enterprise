/**
 * Seed Script: Portal Test Data
 * Creates test customer with portal access for Phase 3 development
 *
 * Usage: npx tsx scripts/seed-portal-data.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding portal test data...\n');

  // Create test customer
  console.log('1️⃣ Creating test customer...');
  const testCustomer = await prisma.customers.upsert({
    where: { email: 'customer@test.com' },
    update: {},
    create: {
      name: 'Test Customer',
      email: 'customer@test.com',
      phone: '+1-555-0123',
      company: 'Test Company Inc.',
      type: 'business',
      status: 'active',
      portal_access: true,
      portal_access_granted_at: new Date(),
      city: 'New York',
      state: 'NY',
      zip: '10001',
      country: 'USA',
    },
  });
  console.log(`   ✅ Customer created: ${testCustomer.id}`);

  // Create test user for the customer
  console.log('\n2️⃣ Creating test user...');
  const testUserId = '00000000-0000-0000-0000-000000000001'; // Fixed UUID for testing

  // Check if user exists
  let testUser = await prisma.users.findUnique({
    where: { id: testUserId },
  });

  if (!testUser) {
    testUser = await prisma.users.create({
      data: {
        id: testUserId,
        email: 'customer@test.com',
        raw_user_meta_data: {
          name: 'Test Customer',
          company: 'Test Company Inc.',
        },
        created_at: new Date(),
        updated_at: new Date(),
      },
    });
    console.log(`   ✅ User created: ${testUser.id}`);
  } else {
    console.log(`   ✅ User already exists: ${testUser.id}`);
  }

  // Create portal access
  console.log('\n3️⃣ Creating portal access...');
  const portalAccess = await prisma.customer_portal_access.upsert({
    where: {
      customer_id_user_id: {
        customer_id: testCustomer.id,
        user_id: testUser.id,
      },
    },
    update: {
      is_active: true,
    },
    create: {
      customer_id: testCustomer.id,
      user_id: testUser.id,
      portal_role: 'admin',
      is_active: true,
      login_count: 0,
      invited_at: new Date(),
      accepted_at: new Date(),
    },
  });
  console.log(`   ✅ Portal access created: ${portalAccess.id}`);

  // Create portal settings
  console.log('\n4️⃣ Creating portal settings...');
  const portalSettings = await prisma.portal_settings.upsert({
    where: { customer_id: testCustomer.id },
    update: {},
    create: {
      customer_id: testCustomer.id,
      show_production_tracking: true,
      show_financial_details: true,
      show_shipping_info: true,
      allow_document_upload: false,
      allow_design_approval: false,
      notification_preferences: {
        sms: false,
        email: true,
        in_app: true,
      },
    },
  });
  console.log(`   ✅ Portal settings created: ${portalSettings.id}`);

  // Create sample notifications
  console.log('\n5️⃣ Creating sample notifications...');
  const notifications = await Promise.all([
    prisma.customer_notifications.create({
      data: {
        user_id: testUser.id,
        customer_id: testCustomer.id,
        type: 'order_update',
        title: 'Order in Production',
        message: 'Your order PO-2024-001 has started production and is currently in the assembly stage.',
        link: '/portal/orders/1',
        related_entity_type: 'production_order',
        read: false,
        created_at: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      },
    }),
    prisma.customer_notifications.create({
      data: {
        user_id: testUser.id,
        customer_id: testCustomer.id,
        type: 'payment_received',
        title: 'Payment Received',
        message: 'We have received your deposit payment of $5,000.00 for order PO-2024-001. Production will begin shortly.',
        link: '/portal/financials',
        related_entity_type: 'invoice',
        read: true,
        read_at: new Date(Date.now() - 24 * 60 * 60 * 1000), // Read 1 day ago
        created_at: new Date(Date.now() - 25 * 60 * 60 * 1000), // Created 25 hours ago
      },
    }),
    prisma.customer_notifications.create({
      data: {
        user_id: testUser.id,
        customer_id: testCustomer.id,
        type: 'shipment_update',
        title: 'Shipment En Route',
        message: 'Your order PO-2024-001 has been shipped via FedEx (Tracking: 123456789). Estimated delivery: 3 business days.',
        link: '/portal/shipping',
        related_entity_type: 'shipment',
        read: false,
        created_at: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
      },
    }),
    prisma.customer_notifications.create({
      data: {
        user_id: testUser.id,
        customer_id: testCustomer.id,
        type: 'document_uploaded',
        title: 'New Document Available',
        message: 'Shop drawings for your custom chair have been uploaded and are ready for review.',
        link: '/portal/documents',
        related_entity_type: 'document',
        read: false,
        created_at: new Date(Date.now() - 60 * 60 * 1000), // 1 hour ago
      },
    }),
  ]);
  console.log(`   ✅ ${notifications.length} notifications created`);

  // Create sample shipping addresses
  console.log('\n6️⃣ Creating sample shipping addresses...');
  const addresses = await Promise.all([
    prisma.customer_shipping_addresses.create({
      data: {
        customer_id: testCustomer.id,
        label: 'Office',
        recipient_name: 'Test Customer',
        address_line1: '123 Business Ave',
        address_line2: 'Suite 500',
        city: 'New York',
        state: 'NY',
        postal_code: '10001',
        country: 'USA',
        phone: '+1-555-0123',
        is_default: true,
        active: true,
      },
    }),
    prisma.customer_shipping_addresses.create({
      data: {
        customer_id: testCustomer.id,
        label: 'Warehouse',
        recipient_name: 'Receiving Department',
        address_line1: '456 Industrial Blvd',
        city: 'Newark',
        state: 'NJ',
        postal_code: '07102',
        country: 'USA',
        phone: '+1-555-0124',
        is_default: false,
        active: true,
      },
    }),
    prisma.customer_shipping_addresses.create({
      data: {
        customer_id: testCustomer.id,
        label: 'Home',
        recipient_name: 'Test Customer',
        address_line1: '789 Residential St',
        city: 'Brooklyn',
        state: 'NY',
        postal_code: '11201',
        country: 'USA',
        phone: '+1-555-0125',
        is_default: false,
        active: true,
      },
    }),
  ]);
  console.log(`   ✅ ${addresses.length} shipping addresses created`);

  console.log('\n✨ Portal test data seeded successfully!\n');
  console.log('📝 Test Credentials:');
  console.log('   Email: customer@test.com');
  console.log('   Portal URL: http://localhost:3000/portal\n');
  console.log('🔑 Test Customer ID:', testCustomer.id);
  console.log('🔑 Test User ID:', testUser.id);
}

main()
  .catch((e) => {
    console.error('❌ Error seeding portal data:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
