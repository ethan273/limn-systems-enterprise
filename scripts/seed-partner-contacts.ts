/**
 * Seed Partner Contacts/Employees
 * Adds realistic employee contact data for Partners (Factories and Sourcing)
 */

import { PrismaClient } from '@prisma/client';
import { faker } from '@faker-js/faker';

const prisma = new PrismaClient();

// Common roles for partner contacts
const FACTORY_ROLES = [
  'Production Manager',
  'Quality Control Manager',
  'Operations Director',
  'Plant Manager',
  'QC Inspector',
  'Production Supervisor',
  'Logistics Coordinator',
  'Technical Specialist',
  'Account Manager',
  'Sales Representative',
];

const SOURCING_ROLES = [
  'Sourcing Manager',
  'Supply Chain Coordinator',
  'Procurement Specialist',
  'Account Executive',
  'Materials Buyer',
  'Logistics Manager',
  'Quality Assurance',
  'Sales Manager',
  'Customer Service Rep',
  'Warehouse Manager',
];

const CONTACT_METHODS = ['Email', 'Phone', 'Mobile', 'WhatsApp', 'WeChat'];

const TIMEZONES = [
  'America/Los_Angeles',
  'America/New_York',
  'America/Chicago',
  'America/Mexico_City',
  'Europe/Rome',
  'Europe/Istanbul',
  'Asia/Shanghai',
  'Asia/Ho_Chi_Minh',
  'Asia/Kolkata',
];

async function seedPartnerContacts() {
  console.log('🌱 Seeding partner contacts/employees...\n');

  // Get all factory and sourcing partners
  const factories = await prisma.partners.findMany({
    where: { type: 'factory' },
    select: { id: true, company_name: true, country: true },
  });

  const sourcingPartners = await prisma.partners.findMany({
    where: { type: 'sourcing' },
    select: { id: true, company_name: true, country: true },
  });

  console.log(`  → Found ${factories.length} factories and ${sourcingPartners.length} sourcing partners\n`);

  let totalCreated = 0;

  // Seed contacts for factories
  console.log('  → Creating contacts for factories...');
  for (const factory of factories) {
    // Each factory gets 2-5 contacts
    const contactCount = faker.number.int({ min: 2, max: 5 });

    for (let i = 0; i < contactCount; i++) {
      const isPrimary = i === 0; // First contact is primary
      const isQC = i === 1 || Math.random() < 0.3; // Second contact or 30% chance for QC
      const isProduction = i === 0 || Math.random() < 0.4; // First contact or 40% chance for production
      const isFinance = i === contactCount - 1 || Math.random() < 0.2; // Last contact or 20% chance for finance

      // Determine timezone based on country
      let timezone = 'America/Los_Angeles';
      if (factory.country === 'China') timezone = 'Asia/Shanghai';
      else if (factory.country === 'Vietnam') timezone = 'Asia/Ho_Chi_Minh';
      else if (factory.country === 'India') timezone = 'Asia/Kolkata';
      else if (factory.country === 'Mexico') timezone = 'America/Mexico_City';
      else if (factory.country === 'Italy') timezone = 'Europe/Rome';
      else if (factory.country === 'Turkey') timezone = 'Europe/Istanbul';

      // Determine languages based on country
      let languages: string[] = ['English'];
      if (factory.country === 'China') languages = ['Chinese', 'English'];
      else if (factory.country === 'Vietnam') languages = ['Vietnamese', 'English'];
      else if (factory.country === 'India') languages = ['Hindi', 'English'];
      else if (factory.country === 'Mexico') languages = ['Spanish', 'English'];
      else if (factory.country === 'Italy') languages = ['Italian', 'English'];
      else if (factory.country === 'Turkey') languages = ['Turkish', 'English'];

      try {
        await prisma.partner_contacts.create({
          data: {
            partner_id: factory.id,
            name: faker.person.fullName(),
            role: faker.helpers.arrayElement(FACTORY_ROLES),
            email: faker.internet.email().toLowerCase(),
            phone: faker.phone.number(),
            mobile: Math.random() < 0.7 ? faker.phone.number() : null,
            is_primary: isPrimary,
            is_qc: isQC,
            is_production: isProduction,
            is_finance: isFinance,
            preferred_contact_method: faker.helpers.arrayElement(CONTACT_METHODS),
            timezone,
            languages,
            active: Math.random() < 0.95, // 95% active
            notes: Math.random() < 0.3 ? faker.lorem.sentence() : null,
          },
        });
        totalCreated++;
      } catch (error) {
        console.error(`  ❌ Failed to create contact for factory ${factory.company_name}:`, error);
      }
    }
  }
  console.log(`  ✅ Created contacts for ${factories.length} factories\n`);

  // Seed contacts for sourcing partners
  console.log('  → Creating contacts for sourcing partners...');
  for (const sourcing of sourcingPartners) {
    // Each sourcing partner gets 2-4 contacts
    const contactCount = faker.number.int({ min: 2, max: 4 });

    for (let i = 0; i < contactCount; i++) {
      const isPrimary = i === 0; // First contact is primary
      const isQC = Math.random() < 0.2; // 20% chance for QC
      const isProduction = Math.random() < 0.3; // 30% chance for production
      const isFinance = i === contactCount - 1 || Math.random() < 0.3; // Last contact or 30% chance for finance

      // Determine timezone based on country
      let timezone = 'America/Los_Angeles';
      if (sourcing.country === 'China') timezone = 'Asia/Shanghai';
      else if (sourcing.country === 'Vietnam') timezone = 'Asia/Ho_Chi_Minh';
      else if (sourcing.country === 'India') timezone = 'Asia/Kolkata';
      else if (sourcing.country === 'Mexico') timezone = 'America/Mexico_City';
      else if (sourcing.country === 'Italy') timezone = 'Europe/Rome';
      else if (sourcing.country === 'Turkey') timezone = 'Europe/Istanbul';

      // Determine languages based on country
      let languages: string[] = ['English'];
      if (sourcing.country === 'China') languages = ['Chinese', 'English'];
      else if (sourcing.country === 'Vietnam') languages = ['Vietnamese', 'English'];
      else if (sourcing.country === 'India') languages = ['Hindi', 'English'];
      else if (sourcing.country === 'Mexico') languages = ['Spanish', 'English'];
      else if (sourcing.country === 'Italy') languages = ['Italian', 'English'];
      else if (sourcing.country === 'Turkey') languages = ['Turkish', 'English'];

      try {
        await prisma.partner_contacts.create({
          data: {
            partner_id: sourcing.id,
            name: faker.person.fullName(),
            role: faker.helpers.arrayElement(SOURCING_ROLES),
            email: faker.internet.email().toLowerCase(),
            phone: faker.phone.number(),
            mobile: Math.random() < 0.7 ? faker.phone.number() : null,
            is_primary: isPrimary,
            is_qc: isQC,
            is_production: isProduction,
            is_finance: isFinance,
            preferred_contact_method: faker.helpers.arrayElement(CONTACT_METHODS),
            timezone,
            languages,
            active: Math.random() < 0.95, // 95% active
            notes: Math.random() < 0.3 ? faker.lorem.sentence() : null,
          },
        });
        totalCreated++;
      } catch (error) {
        console.error(`  ❌ Failed to create contact for sourcing ${sourcing.company_name}:`, error);
      }
    }
  }
  console.log(`  ✅ Created contacts for ${sourcingPartners.length} sourcing partners\n`);

  // Summary stats
  const totalContacts = await prisma.partner_contacts.count();
  const activeContacts = await prisma.partner_contacts.count({ where: { active: true } });
  const primaryContacts = await prisma.partner_contacts.count({ where: { is_primary: true } });
  const qcContacts = await prisma.partner_contacts.count({ where: { is_qc: true } });

  console.log('📊 Summary:');
  console.log(`  Total contacts created this run: ${totalCreated}`);
  console.log(`  Total contacts in database: ${totalContacts}`);
  console.log(`  Active contacts: ${activeContacts}`);
  console.log(`  Primary contacts: ${primaryContacts}`);
  console.log(`  QC contacts: ${qcContacts}\n`);
}

async function main() {
  try {
    await seedPartnerContacts();
    console.log('✨ Partner contacts seeding completed successfully!\n');
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
