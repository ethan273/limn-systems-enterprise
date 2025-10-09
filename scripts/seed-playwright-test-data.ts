#!/usr/bin/env ts-node

/**
 * Playwright Test Data Seeding Script
 *
 * Creates test-specific data with 'test_' prefix for Playwright tests
 * All data is idempotent and safe to run multiple times
 *
 * Run: npx ts-node scripts/seed-playwright-test-data.ts
 */

import { PrismaClient } from '@prisma/client';
import { getSupabaseAdmin } from '../src/lib/supabase';

const prisma = new PrismaClient();
const supabase = getSupabaseAdmin();

// Test user configurations
const TEST_USERS = {
  designer: {
    id: '550e8400-e29b-41d4-a716-446655440001',
    email: 'test_designer@limnsystems.com',
    profile: {
      name: 'Test Designer',
      first_name: 'Test',
      last_name: 'Designer',
      user_type: 'employee',
      department: 'design',
      job_title: 'Senior Designer'
    }
  },
  factory: {
    id: '550e8400-e29b-41d4-a716-446655440002',
    email: 'test_factory@limnsystems.com',
    profile: {
      name: 'Test Factory',
      first_name: 'Test',
      last_name: 'Factory',
      user_type: 'employee',
      department: 'production',
      job_title: 'Factory Manager'
    }
  },
  customer: {
    id: '550e8400-e29b-41d4-a716-446655440003',
    email: 'test_customer@example.com',
    profile: {
      name: 'Test Customer',
      first_name: 'Test',
      last_name: 'Customer',
      user_type: 'customer',
      department: null,
      job_title: 'Buyer'
    }
  }
};

async function createTestUser(userType: keyof typeof TEST_USERS) {
  const userData = TEST_USERS[userType];

  console.log(`  Creating ${userType} user: ${userData.email}`);

  // Check if user exists in Supabase Auth
  const { data: existingUsers } = await supabase.auth.admin.listUsers();
  const existingUser = existingUsers?.users?.find(u => u.email === userData.email);

  let userId = userData.id;

  if (!existingUser) {
    // Create user in Supabase Auth
    const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
      id: userData.id,
      email: userData.email,
      email_confirm: true,
      user_metadata: {
        full_name: userData.profile.name,
        name: userData.profile.name
      }
    });

    if (createError) {
      console.error(`    ❌ Error creating ${userType} user in Auth:`, createError.message);
      return null;
    }

    console.log(`    ✅ Created ${userType} user in Auth`);
  } else {
    userId = existingUser.id;
    console.log(`    ℹ️  ${userType} user already exists in Auth`);
  }

  // Create or update user profile
  const { error: profileError } = await prisma.user_profiles.upsert({
    where: { id: userId },
    update: {
      ...userData.profile,
      updated_at: new Date()
    },
    create: {
      id: userId,
      email: userData.email,
      ...userData.profile,
      is_active: true,
      created_at: new Date(),
      updated_at: new Date()
    }
  });

  if (profileError) {
    console.error(`    ❌ Error creating ${userType} profile:`, profileError);
    return null;
  }

  console.log(`    ✅ Created ${userType} user profile`);
  return userId;
}

async function seedTestCustomers() {
  console.log('\n📋 Creating test customers...');

  const testCustomers = [];
  for (let i = 1; i <= 10; i++) {
    const customer = await prisma.customers.upsert({
      where: { email: `test_customer_${i}@example.com` },
      update: {},
      create: {
        email: `test_customer_${i}@example.com`,
        name: `Test Customer ${i}`,
        company: `Test Company ${i}`,
        status: i % 3 === 0 ? 'inactive' : 'active',
        phone: `555-010${i}`,
        address: `${i}00 Test St, Test City, TC ${10000 + i}`,
      }
    });
    testCustomers.push(customer);
  }

  console.log(`✅ Created ${testCustomers.length} test customers`);
  return testCustomers;
}

async function seedTestProjects(customers: any[]) {
  console.log('\n📋 Creating test projects...');

  const statuses = ['pending', 'active', 'in_progress', 'completed', 'cancelled'];
  const testProjects = [];

  for (let i = 1; i <= 20; i++) {
    const customer = customers[i % customers.length];
    const status = statuses[i % statuses.length];

    const project = await prisma.projects.upsert({
      where: { project_number: `TEST-PROJ-${String(i).padStart(4, '0')}` },
      update: {},
      create: {
        project_number: `TEST-PROJ-${String(i).padStart(4, '0')}`,
        name: `Test Project ${i}`,
        description: `Test project description ${i}`,
        status: status,
        customer_id: customer.id,
        start_date: new Date(),
        estimated_completion: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      }
    });
    testProjects.push(project);
  }

  console.log(`✅ Created ${testProjects.length} test projects`);
  return testProjects;
}

async function seedTestOrders(projects: any[], customers: any[]) {
  console.log('\n📋 Creating test orders...');

  const statuses = ['pending', 'confirmed', 'in_production', 'completed', 'cancelled'];
  const testOrders = [];

  for (let i = 1; i <= 30; i++) {
    const project = projects[i % projects.length];
    const customer = customers[i % customers.length];
    const status = statuses[i % statuses.length];

    const order = await prisma.orders.upsert({
      where: { order_number: `TEST-ORD-${String(i).padStart(4, '0')}` },
      update: {},
      create: {
        order_number: `TEST-ORD-${String(i).padStart(4, '0')}`,
        status: status,
        customer_id: customer.id,
        project_id: project.id,
        order_date: new Date(),
        total_amount: 1000 + (i * 100),
        notes: `Test order ${i}`
      }
    });
    testOrders.push(order);
  }

  console.log(`✅ Created ${testOrders.length} test orders`);
  return testOrders;
}

async function seedTestMaterials() {
  console.log('\n📋 Creating test materials...');

  const categories = ['wood', 'metal', 'fabric', 'hardware', 'finish'];
  const testMaterials = [];

  for (let i = 1; i <= 15; i++) {
    const category = categories[i % categories.length];

    const material = await prisma.materials.upsert({
      where: { sku: `TEST-MAT-${String(i).padStart(4, '0')}` },
      update: {},
      create: {
        sku: `TEST-MAT-${String(i).padStart(4, '0')}`,
        name: `Test Material ${i}`,
        description: `Test material description ${i}`,
        category: category,
        unit_cost: 10 + (i * 5),
        stock_quantity: 100 + (i * 10),
        reorder_point: 20,
        supplier: `Test Supplier ${i % 3 + 1}`
      }
    });
    testMaterials.push(material);
  }

  console.log(`✅ Created ${testMaterials.length} test materials`);
  return testMaterials;
}

async function seedTestContacts(customers: any[]) {
  console.log('\n📋 Creating test contacts...');

  const testContacts = [];

  for (let i = 1; i <= 15; i++) {
    const customer = customers[i % customers.length];

    const contact = await prisma.contacts.upsert({
      where: { email: `test_contact_${i}@example.com` },
      update: {},
      create: {
        email: `test_contact_${i}@example.com`,
        name: `Test Contact ${i}`,
        phone: `555-020${i}`,
        company: customer.company,
        title: i % 2 === 0 ? 'Manager' : 'Director',
      }
    });
    testContacts.push(contact);
  }

  console.log(`✅ Created ${testContacts.length} test contacts`);
  return testContacts;
}

async function seedTestLeads() {
  console.log('\n📋 Creating test leads...');

  const statuses = ['new', 'contacted', 'qualified', 'proposal', 'won', 'lost'];
  const testLeads = [];

  for (let i = 1; i <= 10; i++) {
    const status = statuses[i % statuses.length];

    const lead = await prisma.leads.upsert({
      where: { email: `test_lead_${i}@example.com` },
      update: {},
      create: {
        email: `test_lead_${i}@example.com`,
        name: `Test Lead ${i}`,
        company: `Test Lead Company ${i}`,
        phone: `555-030${i}`,
        status: status,
        source: i % 2 === 0 ? 'website' : 'referral',
        notes: `Test lead notes ${i}`
      }
    });
    testLeads.push(lead);
  }

  console.log(`✅ Created ${testLeads.length} test leads`);
  return testLeads;
}

async function seedUserPermissions() {
  console.log('\n📋 Seeding user permissions...');

  const modules = [
    'projects',
    'orders',
    'materials',
    'customers',
    'contacts',
    'leads',
    'tasks',
    'documents',
    'production',
    'invoices',
    'admin'
  ];

  const userTypes = ['admin', 'employee', 'designer', 'factory', 'customer', 'contractor'];

  // Create default permissions for all combinations
  let count = 0;
  for (const userType of userTypes) {
    for (const module of modules) {
      await prisma.default_permissions.upsert({
        where: {
          user_type_module: {
            user_type: userType,
            module: module
          }
        },
        update: {},
        create: {
          user_type: userType,
          module: module,
          can_view: true,
          can_create: userType !== 'customer',
          can_edit: userType !== 'customer',
          can_delete: userType === 'admin',
          can_approve: userType === 'admin' || userType === 'employee'
        }
      });
      count++;
    }
  }

  console.log(`✅ Created ${count} default permission combinations`);
}

async function cleanupTestData() {
  console.log('\n🧹 Cleaning up old test data...');

  try {
    // Delete in reverse order of dependencies
    await prisma.orders.deleteMany({
      where: { order_number: { startsWith: 'TEST-' } }
    });

    await prisma.projects.deleteMany({
      where: { project_number: { startsWith: 'TEST-' } }
    });

    await prisma.customers.deleteMany({
      where: { email: { startsWith: 'test_customer_' } }
    });

    await prisma.contacts.deleteMany({
      where: { email: { startsWith: 'test_contact_' } }
    });

    await prisma.leads.deleteMany({
      where: { email: { startsWith: 'test_lead_' } }
    });

    await prisma.materials.deleteMany({
      where: { sku: { startsWith: 'TEST-' } }
    });

    console.log('✅ Cleaned up old test data');
  } catch (error) {
    console.log('ℹ️  No old test data to clean up');
  }
}

async function main() {
  console.log('🌱 Seeding Playwright Test Data\n');
  console.log('=' .repeat(70));

  try {
    // Step 1: Clean up old test data
    await cleanupTestData();

    // Step 2: Create test users
    console.log('\n👥 Creating test users...');
    await createTestUser('designer');
    await createTestUser('factory');
    await createTestUser('customer');

    // Step 3: Seed default permissions
    await seedUserPermissions();

    // Step 4: Seed test data
    const customers = await seedTestCustomers();
    const projects = await seedTestProjects(customers);
    const orders = await seedTestOrders(projects, customers);
    const materials = await seedTestMaterials();
    const contacts = await seedTestContacts(customers);
    const leads = await seedTestLeads();

    // Summary
    console.log('\n' + '=' .repeat(70));
    console.log('\n✅ Test Data Seeding Complete!\n');
    console.log('Summary:');
    console.log(`  - 3 test users created`);
    console.log(`  - ${customers.length} test customers`);
    console.log(`  - ${projects.length} test projects`);
    console.log(`  - ${orders.length} test orders`);
    console.log(`  - ${materials.length} test materials`);
    console.log(`  - ${contacts.length} test contacts`);
    console.log(`  - ${leads.length} test leads`);
    console.log(`  - 66 default permission combinations`);
    console.log('\nAll test data prefixed with "test_" or "TEST-" for easy identification');
    console.log('\n' + '=' .repeat(70) + '\n');

  } catch (error) {
    console.error('\n❌ Error seeding test data:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
