/**
 * Phase 3: CRM Module Seeding
 *
 * Seeds:
 * - 50 Contacts
 * - 40 Leads (various statuses and stages)
 * - 30 Customers (converted from leads + new)
 * - 20 Projects (associated with customers)
 *
 * Total: ~140 CRM records
 */

import { PrismaClient } from '@prisma/client';
import { faker } from '@faker-js/faker';

const LEAD_SOURCES = ['Website', 'Referral', 'Trade Show', 'Cold Call', 'Social Media', 'Email Campaign'];
const LEAD_STATUSES = ['new', 'contacted', 'qualified', 'proposal', 'negotiation', 'converted', 'lost'];
const PIPELINE_STAGES = ['initial', 'discovery', 'proposal', 'negotiation', 'closing'];
const INTEREST_LEVELS = ['low', 'medium', 'high', 'very high'];
const CUSTOMER_TYPES = ['individual', 'business', 'designer', 'architect'];
const CUSTOMER_STATUSES = ['active', 'inactive', 'vip'];
const CONTACT_TAGS = ['VIP', 'Designer', 'Architect', 'Interior Designer', 'Contractor', 'Homeowner'];

/**
 * Seed CRM module data
 */
export async function seedCRM(prisma: PrismaClient) {
  console.log('  → Creating contacts...');

  const contactsData = [];

  for (let i = 0; i < 50; i++) {
    contactsData.push({
      name: faker.person.fullName(),
      email: faker.internet.email().toLowerCase(),
      phone: faker.phone.number(),
      company: faker.company.name(),
      position: faker.person.jobTitle(),
      source: faker.helpers.arrayElement(LEAD_SOURCES),
      score: faker.number.float({ min: 0, max: 100, fractionDigits: 1 }),
      notes: faker.datatype.boolean() ? faker.lorem.paragraph() : null,
      tags: faker.helpers.arrayElements(CONTACT_TAGS, { min: 0, max: 3 }),
      last_contacted: faker.date.recent({ days: 30 }),
      last_activity_date: faker.date.recent({ days: 7 }),
    });
  }

  for (const contact of contactsData) {
    await prisma.contacts.create({ data: contact });
  }

  console.log(`  ✅ Created ${contactsData.length} contacts`);

  // Seed leads
  console.log('  → Creating leads...');

  const leadsData = [];

  for (let i = 0; i < 40; i++) {
    const status = faker.helpers.arrayElement(LEAD_STATUSES);
    const isConverted = status === 'converted';

    leadsData.push({
      name: faker.person.fullName(),
      email: faker.internet.email().toLowerCase(),
      phone: faker.phone.number(),
      company: faker.datatype.boolean() ? faker.company.name() : null,
      website: faker.datatype.boolean() ? faker.internet.url() : null,
      status,
      prospect_status: faker.helpers.arrayElement(['prospect', 'qualified', 'unqualified']),
      lead_source: faker.helpers.arrayElement(LEAD_SOURCES),
      interest_level: faker.helpers.arrayElement(INTEREST_LEVELS),
      pipeline_stage: faker.helpers.arrayElement(PIPELINE_STAGES),
      lead_value: faker.number.float({ min: 5000, max: 500000, fractionDigits: 2 }),
      notes: faker.lorem.paragraph(),
      tags: faker.helpers.arrayElements(['Hot Lead', 'Cold', 'Follow Up', 'Qualified'], { min: 0, max: 2 }),
      contact_method: faker.helpers.arrayElement(['Email', 'Phone', 'In-Person', 'Video Call']),
      follow_up_date: faker.date.soon({ days: 14 }),
      last_contacted: faker.date.recent({ days: 7 }),
      last_activity_date: faker.date.recent({ days: 3 }),
      converted_at: isConverted ? faker.date.recent({ days: 30 }) : null,
      conversion_type: isConverted ? faker.helpers.arrayElement(['customer', 'prospect']) : null,
    });
  }

  const createdLeads = [];
  for (const lead of leadsData) {
    const created = await prisma.leads.create({ data: lead });
    createdLeads.push(created);
  }

  console.log(`  ✅ Created ${leadsData.length} leads`);

  // Seed customers
  console.log('  → Creating customers...');

  const customersData = [];

  // 20 customers converted from leads
  const convertedLeads = createdLeads.filter(l => l.status === 'converted').slice(0, 20);

  for (const lead of convertedLeads) {
    customersData.push({
      name: lead.name,
      email: lead.email,
      phone: lead.phone,
      company: lead.company,
      company_name: lead.company,
      type: faker.helpers.arrayElement(CUSTOMER_TYPES),
      status: 'active',
      city: faker.location.city(),
      state: faker.location.state({ abbreviated: true }),
      zip: faker.location.zipCode(),
      country: 'USA',
      billing_address_line1: faker.location.streetAddress(),
      billing_city: faker.location.city(),
      billing_state: faker.location.state({ abbreviated: true }),
      billing_zip: faker.location.zipCode(),
      billing_country: 'USA',
      shipping_same_as_billing: faker.datatype.boolean(),
      credit_limit: faker.number.float({ min: 10000, max: 500000, fractionDigits: 2 }),
      portal_access: faker.datatype.boolean(),
      portal_created_at: faker.date.recent({ days: 60 }),
      last_activity_date: faker.date.recent({ days: 14 }),
      notes: `Converted from lead: ${lead.id}`,
      tags: faker.helpers.arrayElements(['Premium', 'Wholesale', 'Retail', 'Designer'], { min: 1, max: 2 }),
    });
  }

  // 10 additional new customers (not from leads)
  for (let i = 0; i < 10; i++) {
    customersData.push({
      name: faker.person.fullName(),
      email: faker.internet.email().toLowerCase(),
      phone: faker.phone.number(),
      company: faker.company.name(),
      company_name: faker.company.name(),
      type: faker.helpers.arrayElement(CUSTOMER_TYPES),
      status: faker.helpers.arrayElement(CUSTOMER_STATUSES),
      city: faker.location.city(),
      state: faker.location.state({ abbreviated: true }),
      zip: faker.location.zipCode(),
      country: 'USA',
      billing_address_line1: faker.location.streetAddress(),
      billing_city: faker.location.city(),
      billing_state: faker.location.state({ abbreviated: true }),
      billing_zip: faker.location.zipCode(),
      billing_country: 'USA',
      shipping_same_as_billing: faker.datatype.boolean(),
      credit_limit: faker.number.float({ min: 10000, max: 500000, fractionDigits: 2 }),
      portal_access: faker.datatype.boolean(),
      portal_created_at: faker.date.recent({ days: 60 }),
      last_activity_date: faker.date.recent({ days: 14 }),
      notes: faker.lorem.paragraph(),
      tags: faker.helpers.arrayElements(['Premium', 'Wholesale', 'Retail', 'Designer'], { min: 1, max: 2 }),
    });
  }

  const createdCustomers = [];
  for (const customer of customersData) {
    const created = await prisma.customers.create({ data: customer });
    createdCustomers.push(created);
  }

  console.log(`  ✅ Created ${customersData.length} customers (20 converted from leads, 10 new)`);

  // Update converted leads with customer references
  for (let i = 0; i < convertedLeads.length; i++) {
    const lead = convertedLeads[i];
    const customer = createdCustomers[i];
    if (lead && customer) {
      await prisma.leads.update({
        where: { id: lead.id },
        data: { converted_to_customer_id: customer.id },
      });
    }
  }

  console.log('  ✅ Updated converted leads with customer references');

  // Seed projects (associated with customers)
  console.log('  → Creating projects...');

  const projectsData = [];

  // Create 20 projects for random customers
  for (let i = 0; i < 20; i++) {
    const customer = faker.helpers.arrayElement(createdCustomers);
    if (!customer) continue;

    projectsData.push({
      name: `${faker.commerce.productAdjective()} ${faker.commerce.department()} Project`,
      description: faker.lorem.paragraph(),
      customers: {
        connect: { id: customer.id },
      },
      status: faker.helpers.arrayElement(['planning', 'active', 'on_hold', 'completed', 'cancelled']),
      start_date: faker.date.recent({ days: 90 }).toISOString(),
      end_date: faker.date.soon({ days: 180 }).toISOString(),
      budget: Math.floor(faker.number.float({ min: 50000, max: 1000000, fractionDigits: 2 })),
    });
  }

  for (const project of projectsData) {
    await prisma.projects.create({ data: project });
  }

  console.log(`  ✅ Created ${projectsData.length} projects`);
}
