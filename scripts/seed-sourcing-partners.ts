/**
 * Seed Sourcing Partners
 * Creates realistic test data for Partners > Sourcing module
 */

import { PrismaClient } from '@prisma/client';
import { faker } from '@faker-js/faker';

const prisma = new PrismaClient();

// Sourcing-specific specializations
const SOURCING_SPECIALIZATIONS = [
  'Raw Materials',
  'Textiles & Fabrics',
  'Leather',
  'Wood & Lumber',
  'Metal Components',
  'Hardware & Fasteners',
  'Foam & Cushioning',
  'Springs & Suspension',
  'Packaging Materials',
  'Finishing Materials',
  'Adhesives & Chemicals',
  'Upholstery Supplies',
];

// Countries where sourcing partners typically operate
const SOURCING_COUNTRIES = [
  { country: 'USA', cities: ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix'] },
  { country: 'China', cities: ['Shanghai', 'Guangzhou', 'Shenzhen', 'Beijing', 'Ningbo'] },
  { country: 'Vietnam', cities: ['Ho Chi Minh City', 'Hanoi', 'Da Nang', 'Haiphong', 'Bien Hoa'] },
  { country: 'India', cities: ['Mumbai', 'Bangalore', 'Chennai', 'Jodhpur', 'Surat'] },
  { country: 'Mexico', cities: ['Monterrey', 'Guadalajara', 'Tijuana', 'Mexicali', 'Leon'] },
  { country: 'Italy', cities: ['Milan', 'Florence', 'Como', 'Brescia', 'Treviso'] },
  { country: 'Turkey', cities: ['Istanbul', 'Bursa', 'Izmir', 'Denizli', 'Kahramanmaras'] },
];

async function seedSourcingPartners() {
  console.log('🌱 Seeding sourcing partners...\n');

  const sourcingPartnersData = [];

  // Create 15 sourcing partners with realistic data
  for (let i = 0; i < 15; i++) {
    const location = faker.helpers.arrayElement(SOURCING_COUNTRIES);
    const city = faker.helpers.arrayElement(location.cities);
    const specializations = faker.helpers.arrayElements(SOURCING_SPECIALIZATIONS, { min: 2, max: 4 });

    // Quality rating weighted toward good partners
    const qualityRating = faker.number.float({ min: 3.2, max: 5.0, fractionDigits: 1 });

    // Status: 80% active, 15% pending_approval, 5% inactive
    const statusRand = Math.random();
    let status = 'active';
    if (statusRand < 0.05) status = 'inactive';
    else if (statusRand < 0.20) status = 'pending_approval';

    sourcingPartnersData.push({
      type: 'sourcing',
      company_name: faker.company.name() + ' ' + faker.helpers.arrayElement(['Materials', 'Suppliers', 'Trading', 'Resources', 'Sourcing']),
      business_name: faker.company.name() + ' ' + faker.helpers.arrayElement(['Ltd', 'Inc', 'Co', 'Corp']),
      registration_number: faker.string.alphanumeric(12).toUpperCase(),
      primary_contact: faker.person.fullName(),
      primary_email: faker.internet.email().toLowerCase(),
      primary_phone: faker.phone.number(),
      website: faker.internet.url(),
      address_line1: faker.location.streetAddress(),
      address_line2: faker.datatype.boolean() ? faker.location.secondaryAddress() : null,
      city,
      state: location.country === 'USA' ? faker.location.state({ abbreviated: true }) : null,
      postal_code: faker.location.zipCode(),
      country: location.country,
      specializations,
      capabilities: faker.helpers.arrayElements([
        'Bulk Supply',
        'Custom Procurement',
        'Sample Provision',
        'Quality Inspection',
        'Logistics Support',
        'Material Testing',
        'Inventory Management',
        'Rush Orders',
      ], { min: 3, max: 6 }),
      certifications: faker.helpers.arrayElements([
        'ISO 9001',
        'ISO 14001',
        'OEKO-TEX',
        'FSC Certified',
        'GRS Certified',
        'REACH Compliant',
        'RoHS Compliant',
      ], { min: 1, max: 4 }),
      languages: location.country === 'USA' ? ['English'] :
                 location.country === 'China' ? ['Chinese', 'English'] :
                 location.country === 'Vietnam' ? ['Vietnamese', 'English'] :
                 location.country === 'India' ? ['Hindi', 'English'] :
                 location.country === 'Mexico' ? ['Spanish', 'English'] :
                 location.country === 'Italy' ? ['Italian', 'English'] :
                 location.country === 'Turkey' ? ['Turkish', 'English'] :
                 ['English'],
      production_capacity: null, // Not applicable for sourcing
      lead_time_days: faker.number.int({ min: 7, max: 60 }),
      minimum_order: faker.number.int({ min: 100, max: 5000 }),
      payment_terms: faker.helpers.arrayElement([
        'Net 30',
        'Net 45',
        'Net 60',
        '50% deposit, 50% before shipment',
        '30% deposit, 70% before shipment',
        'Letter of Credit',
        'T/T Payment',
      ]),
      currency: faker.helpers.arrayElement(['USD', 'EUR', 'CNY', 'USD']), // USD weighted
      status,
      quality_rating: qualityRating,
      on_time_delivery_rate: faker.number.float({ min: 85.0, max: 99.5, fractionDigits: 1 }),
      defect_rate: faker.number.float({ min: 0.1, max: 3.5, fractionDigits: 2 }),
      portal_enabled: faker.datatype.boolean(),
      notes: faker.datatype.boolean() ? faker.lorem.paragraph() : null,
      tags: faker.helpers.arrayElements([
        'Preferred Supplier',
        'Competitive Pricing',
        'Fast Turnaround',
        'High Volume',
        'Eco-Friendly',
        'Custom Materials',
      ], { min: 0, max: 3 }),
    });
  }

  console.log(`  → Creating ${sourcingPartnersData.length} sourcing partners...`);

  let created = 0;
  for (const partner of sourcingPartnersData) {
    try {
      await prisma.partners.create({ data: partner });
      created++;
    } catch (error) {
      console.error(`  ❌ Failed to create partner: ${partner.company_name}`, error);
    }
  }

  console.log(`  ✅ Created ${created} sourcing partners\n`);

  // Summary stats
  const sourcingCount = await prisma.partners.count({ where: { type: 'sourcing' } });
  const activeCount = await prisma.partners.count({ where: { type: 'sourcing', status: 'active' } });
  const pendingCount = await prisma.partners.count({ where: { type: 'sourcing', status: 'pending_approval' } });

  console.log('📊 Summary:');
  console.log(`  Total sourcing partners: ${sourcingCount}`);
  console.log(`  Active: ${activeCount}`);
  console.log(`  Pending approval: ${pendingCount}`);
  console.log(`  Inactive: ${sourcingCount - activeCount - pendingCount}\n`);
}

async function main() {
  try {
    await seedSourcingPartners();
    console.log('✨ Sourcing partners seeding completed successfully!\n');
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
