/**
 * CRM Module Test Data Seeding Script
 *
 * This script seeds realistic test data for the CRM module:
 * - 20 Contacts
 * - 20 Leads (10 regular leads, 10 prospects with hot/warm/cold status)
 * - 15 Customers (converted from leads)
 * - 10 Projects (associated with customers)
 * - 15 Orders (associated with customers and projects)
 *
 * Run with: npx tsx prisma/seed-crm.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Realistic test data arrays
const firstNames = ['John', 'Jane', 'Michael', 'Sarah', 'David', 'Emily', 'Robert', 'Lisa', 'James', 'Jennifer',
  'William', 'Patricia', 'Richard', 'Linda', 'Thomas', 'Barbara', 'Christopher', 'Susan', 'Daniel', 'Jessica'];
const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez',
  'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin'];
const companies = ['Acme Corp', 'TechStart Inc', 'Global Solutions', 'Innovate LLC', 'Future Systems',
  'Premier Design', 'Elite Hospitality', 'Modern Living', 'Luxury Hotels', 'Urban Spaces',
  'Coastal Resorts', 'Metro Properties', 'Summit Ventures', 'Horizon Group', 'Apex Enterprises',
  'Pioneer Solutions', 'Vision Interiors', 'Prestige Projects', 'Sterling Developments', 'Prime Realty'];
const positions = ['CEO', 'CTO', 'VP of Operations', 'Director of Design', 'Project Manager',
  'Procurement Manager', 'Interior Designer', 'Facilities Manager', 'Operations Director', 'Purchasing Agent'];
const cities = ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Philadelphia', 'San Antonio',
  'San Diego', 'Dallas', 'San Jose', 'Austin', 'Jacksonville', 'Fort Worth', 'Columbus', 'San Francisco'];
const states = ['NY', 'CA', 'IL', 'TX', 'AZ', 'PA', 'FL', 'OH'];
const sources = ['website', 'referral', 'trade_show', 'cold_call', 'linkedin', 'email_campaign', 'partner'];
const interestLevels = ['low', 'medium', 'high'];
const leadStatuses = ['new', 'contacted', 'qualified', 'proposal', 'negotiation', 'won', 'lost'];
const prospectStatuses = ['hot', 'warm', 'cold'];
const projectStatuses = ['planning', 'in_progress', 'on_hold', 'completed'];
const orderStatuses = ['pending', 'confirmed', 'in_production', 'shipped', 'delivered'];
const priorities = ['low', 'medium', 'high'];
const customerTypes = ['individual', 'business', 'designer', 'architect'];

function randomItem<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function randomDate(start: Date, end: Date): Date {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function randomFutureDate(daysAhead: number): Date {
  const date = new Date();
  date.setDate(date.getDate() + Math.floor(Math.random() * daysAhead));
  return date;
}

function randomPastDate(daysAgo: number): Date {
  const date = new Date();
  date.setDate(date.getDate() - Math.floor(Math.random() * daysAgo));
  return date;
}

async function main() {
  console.log('🌱 Starting CRM test data seeding...\n');

  // ====================================================================
  // 1. SEED CONTACTS (20 records)
  // ====================================================================
  console.log('📇 Seeding Contacts...');
  const contacts = [];
  for (let i = 0; i < 20; i++) {
    const firstName = randomItem(firstNames);
    const lastName = randomItem(lastNames);
    const company = randomItem(companies);
    const contact = await prisma.contacts.create({
      data: {
        name: `${firstName} ${lastName}`,
        email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${company.toLowerCase().replace(/\s+/g, '')}.com`,
        phone: `+1 (${Math.floor(Math.random() * 900) + 100}) ${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 9000) + 1000}`,
        company: company,
        position: randomItem(positions),
        notes: `Met at ${randomItem(['trade show', 'conference', 'networking event', 'referral meeting'])}. Interested in ${randomItem(['furniture', 'lighting', 'custom design', 'bulk orders'])}.`,
        tags: [randomItem(['vip', 'warm', 'qualified', 'follow-up', 'high-value'])],
        source: randomItem(sources),
        score: Math.floor(Math.random() * 100),
        last_contacted: randomPastDate(30),
        last_activity_date: randomPastDate(15),
        created_at: randomPastDate(90),
      },
    });
    contacts.push(contact);
  }
  console.log(`   ✅ Created ${contacts.length} contacts\n`);

  // ====================================================================
  // 2. SEED LEADS (20 records: 10 regular leads, 10 prospects)
  // ====================================================================
  console.log('🎯 Seeding Leads...');
  const leads = [];

  // Create 10 regular leads
  for (let i = 0; i < 10; i++) {
    const firstName = randomItem(firstNames);
    const lastName = randomItem(lastNames);
    const company = randomItem(companies);
    const status = randomItem(leadStatuses);
    const lead = await prisma.leads.create({
      data: {
        name: `${firstName} ${lastName}`,
        email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${company.toLowerCase().replace(/\s+/g, '')}.com`,
        phone: `+1 (${Math.floor(Math.random() * 900) + 100}) ${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 9000) + 1000}`,
        company: company,
        status: status,
        prospect_status: null, // Regular lead, not a prospect
        lead_source: randomItem(sources),
        interest_level: randomItem(interestLevels),
        lead_value: Math.floor(Math.random() * 50000) + 5000,
        notes: `${randomItem(['Initial', 'Follow-up', 'Qualified'])} lead from ${randomItem(sources)}. Discussing ${randomItem(['hotel project', 'restaurant furniture', 'residential design', 'office space'])}.`,
        tags: [randomItem(['new-business', 'hospitality', 'residential', 'commercial', 'high-priority'])],
        follow_up_date: status === 'won' ? null : randomFutureDate(30),
        last_contacted: randomPastDate(20),
        contact_method: randomItem(['email', 'phone', 'meeting', 'video_call']),
        website: `https://www.${company.toLowerCase().replace(/\s+/g, '')}.com`,
        pipeline_stage: randomItem(['initial', 'discovery', 'proposal', 'negotiation', 'closing']),
        last_activity_date: randomPastDate(10),
        created_at: randomPastDate(60),
      },
    });
    leads.push(lead);
  }
  console.log(`   ✅ Created ${10} regular leads`);

  // Create 10 prospects (hot/warm/cold)
  for (let i = 0; i < 10; i++) {
    const firstName = randomItem(firstNames);
    const lastName = randomItem(lastNames);
    const company = randomItem(companies);
    const prospectStatus = randomItem(prospectStatuses);
    const prospect = await prisma.leads.create({
      data: {
        name: `${firstName} ${lastName}`,
        email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${company.toLowerCase().replace(/\s+/g, '')}.com`,
        phone: `+1 (${Math.floor(Math.random() * 900) + 100}) ${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 9000) + 1000}`,
        company: company,
        status: randomItem(['contacted', 'qualified', 'proposal', 'negotiation']),
        prospect_status: prospectStatus, // Hot, Warm, or Cold prospect
        lead_source: randomItem(sources),
        interest_level: prospectStatus === 'hot' ? 'high' : prospectStatus === 'warm' ? 'medium' : 'low',
        lead_value: prospectStatus === 'hot' ? Math.floor(Math.random() * 100000) + 50000 :
                    prospectStatus === 'warm' ? Math.floor(Math.random() * 50000) + 20000 :
                    Math.floor(Math.random() * 20000) + 5000,
        notes: `${prospectStatus.charAt(0).toUpperCase() + prospectStatus.slice(1)} prospect. ${randomItem(['Ready to buy', 'Needs nurturing', 'Long-term opportunity', 'Budget approved'])}. Interested in ${randomItem(['custom furniture', 'lighting solutions', 'full interior package', 'prototype development'])}.`,
        tags: [randomItem(['high-value', 'qualified', 'decision-maker', 'budget-approved', 'urgent'])],
        follow_up_date: randomFutureDate(prospectStatus === 'hot' ? 7 : prospectStatus === 'warm' ? 14 : 30),
        last_contacted: randomPastDate(prospectStatus === 'hot' ? 3 : prospectStatus === 'warm' ? 7 : 14),
        contact_method: randomItem(['meeting', 'video_call', 'phone', 'email']),
        website: `https://www.${company.toLowerCase().replace(/\s+/g, '')}.com`,
        pipeline_stage: prospectStatus === 'hot' ? 'closing' : prospectStatus === 'warm' ? 'negotiation' : 'discovery',
        last_activity_date: randomPastDate(5),
        created_at: randomPastDate(45),
      },
    });
    leads.push(prospect);
  }
  console.log(`   ✅ Created ${10} prospects (hot/warm/cold)`);
  console.log(`   ✅ Total leads: ${leads.length}\n`);

  // ====================================================================
  // 3. SEED CUSTOMERS (15 records - converted from leads)
  // ====================================================================
  console.log('👥 Seeding Customers...');
  const customers = [];
  for (let i = 0; i < 15; i++) {
    const firstName = randomItem(firstNames);
    const lastName = randomItem(lastNames);
    const company = randomItem(companies);
    const city = randomItem(cities);
    const state = randomItem(states);
    const customer = await prisma.customers.create({
      data: {
        name: `${firstName} ${lastName}`,
        email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${company.toLowerCase().replace(/\s+/g, '')}.com`,
        phone: `+1 (${Math.floor(Math.random() * 900) + 100}) ${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 9000) + 1000}`,
        company: company,
        company_name: company,
        type: randomItem(customerTypes),
        status: randomItem(['active', 'inactive']),
        city: city,
        state: state,
        zip: `${Math.floor(Math.random() * 90000) + 10000}`,
        country: 'USA',
        billing_address_line1: `${Math.floor(Math.random() * 9000) + 1000} ${randomItem(['Main', 'Oak', 'Maple', 'Park', 'Washington'])} Street`,
        billing_city: city,
        billing_state: state,
        billing_zip: `${Math.floor(Math.random() * 90000) + 10000}`,
        billing_country: 'USA',
        shipping_same_as_billing: Math.random() > 0.3,
        credit_limit: Math.floor(Math.random() * 100000) + 10000,
        notes: `Converted from lead. ${randomItem(['Excellent payment history', 'Regular customer', 'High volume orders', 'Premium client'])}. ${randomItem(['Large', 'Medium', 'Small'])} ${randomItem(['hospitality', 'residential', 'commercial', 'retail'])} account.`,
        tags: [randomItem(['premium', 'volume-buyer', 'repeat-customer', 'net-30', 'vip'])],
        portal_access: Math.random() > 0.5,
        last_activity_date: randomPastDate(30),
        created_at: randomPastDate(180),
      },
    });
    customers.push(customer);
  }
  console.log(`   ✅ Created ${customers.length} customers\n`);

  // ====================================================================
  // 4. SEED PROJECTS (10 records - associated with customers)
  // ====================================================================
  console.log('📁 Seeding Projects...');
  const projects = [];
  for (let i = 0; i < 10; i++) {
    const customer = randomItem(customers);
    const status = randomItem(projectStatuses);
    const startDate = randomPastDate(90);
    const endDate = status === 'completed' ? randomPastDate(30) : randomFutureDate(90);
    const budget = Math.floor(Math.random() * 200000) + 50000;

    const project = await prisma.projects.create({
      data: {
        name: `${randomItem(['Luxury', 'Modern', 'Classic', 'Contemporary', 'Boutique'])} ${randomItem(['Hotel', 'Restaurant', 'Office', 'Residence', 'Retail Space'])} - ${randomItem(cities)}`,
        customer_id: customer.id,
        status: status,
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        budget: budget,
        budget_estimate: `$${budget.toLocaleString()}`,
        actual_cost: status === 'completed' ? `$${Math.floor(budget * (0.85 + Math.random() * 0.2)).toLocaleString()}` : undefined,
        description: `Full ${randomItem(['interior design', 'furniture procurement', 'custom manufacturing', 'turnkey solution'])} project for ${customer.company}. Includes ${randomItem(['50+ pieces', '100+ items', 'custom designs', 'prototype development'])}.`,
        priority: randomItem(priorities),
        estimated_completion_date: endDate.toISOString(),
        actual_completion_date: status === 'completed' ? randomPastDate(30).toISOString() : undefined,
        project_manager: `${randomItem(firstNames)} ${randomItem(lastNames)}`,
        created_at: randomPastDate(120),
      },
    });
    projects.push(project);
  }
  console.log(`   ✅ Created ${projects.length} projects\n`);

  // ====================================================================
  // 5. SEED ORDERS (15 records - associated with customers and projects)
  // ====================================================================
  console.log('🛒 Seeding Orders...');
  const orders = [];
  for (let i = 0; i < 15; i++) {
    const customer = randomItem(customers);
    const project = Math.random() > 0.3 ? randomItem(projects.filter(p => p.customer_id === customer.id)) : undefined;
    const status = randomItem(orderStatuses);
    const totalAmount = Math.floor(Math.random() * 100000) + 10000;

    const order = await prisma.orders.create({
      data: {
        order_number: `ORD-${new Date().getFullYear()}-${String(1000 + i).padStart(4, '0')}`,
        customer_id: customer.id,
        status: status,
        total_amount: totalAmount,
        priority: randomItem(priorities),
        due_date: randomFutureDate(60),
        estimated_completion: randomFutureDate(90),
        actual_completion: status === 'delivered' ? randomPastDate(10) : undefined,
        department: randomItem(['sales', 'production', 'design']),
        rush_order: Math.random() > 0.7,
        shipping_method: randomItem(['freight', 'white_glove', 'standard', 'express']),
        tracking_number: status === 'shipped' || status === 'delivered' ? `TRK${Math.floor(Math.random() * 1000000000)}` : undefined,
        invoice_sent: Math.random() > 0.3,
        payment_received: status === 'delivered' || Math.random() > 0.5,
        notes: `${randomItem(['Standard', 'Rush', 'Custom', 'Repeat'])} order for ${customer.company}. ${randomItem(['Net 30 terms', 'Prepaid', '50% deposit', 'COD'])}.`,
        tags: [randomItem(['wholesale', 'retail', 'custom', 'rush', 'international'])],
        created_at: randomPastDate(60),
      },
    });
    orders.push(order);
  }
  console.log(`   ✅ Created ${orders.length} orders\n`);

  // ====================================================================
  // SUMMARY
  // ====================================================================
  console.log('═══════════════════════════════════════════════════════════');
  console.log('✅ CRM Test Data Seeding Complete!\n');
  console.log('📊 Summary:');
  console.log(`   • Contacts:   ${contacts.length} records`);
  console.log(`   • Leads:      ${leads.length} records (10 regular + 10 prospects)`);
  console.log(`   • Customers:  ${customers.length} records`);
  console.log(`   • Projects:   ${projects.length} records`);
  console.log(`   • Orders:     ${orders.length} records`);
  console.log(`   • TOTAL:      ${contacts.length + leads.length + customers.length + projects.length + orders.length} records\n`);
  console.log('🎯 Ready for comprehensive CRM functional testing!');
  console.log('═══════════════════════════════════════════════════════════\n');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding CRM data:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
