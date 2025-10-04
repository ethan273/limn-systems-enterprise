/**
 * Phase 2: Reference Data Seeding
 *
 * Seeds:
 * - 8 Furniture Collections (with prefixes for SKU generation)
 * - 6 Material Categories (Fabric, Wood, Metal, Stone, Weaving, Carving)
 * - 20 Partners (Manufacturers, Suppliers, Designers)
 */

import { PrismaClient } from '@prisma/client';
import { faker } from '@faker-js/faker';

/**
 * Seed reference data (collections, material categories, partners)
 */
export async function seedReference(prisma: PrismaClient) {
  console.log('  → Creating furniture collections...');

  // Define collections with prefixes for SKU generation
  const collectionsData = [
    {
      name: 'UKIAH',
      prefix: 'UK',
      description: 'Modern coastal collection inspired by Northern California',
      designer: 'Sarah Mitchell',
      is_active: true,
      display_order: 1,
      variation_types: ['Standard', 'Deep', 'Wide', 'Short'],
    },
    {
      name: 'RAGUSA',
      prefix: 'RG',
      description: 'Italian-inspired contemporary collection',
      designer: 'Marco Rossi',
      is_active: true,
      display_order: 2,
      variation_types: ['Standard', 'Tall', 'Low'],
    },
    {
      name: 'ST HELENA',
      prefix: 'SH',
      description: 'Wine country elegance with rustic charm',
      designer: 'Emma Thompson',
      is_active: true,
      display_order: 3,
      variation_types: ['Standard', 'Extended', 'Compact'],
    },
    {
      name: 'INYO',
      prefix: 'IN',
      description: 'Desert-inspired minimalist collection',
      designer: 'David Chen',
      is_active: true,
      display_order: 4,
      variation_types: ['Standard', 'Wide', 'Narrow'],
    },
    {
      name: 'PACIFICA',
      prefix: 'PC',
      description: 'Ocean-inspired contemporary designs',
      designer: 'Lisa Rodriguez',
      is_active: true,
      display_order: 5,
      variation_types: ['Standard', 'Deep', 'Shallow'],
    },
    {
      name: 'SIERRA',
      prefix: 'SR',
      description: 'Mountain lodge aesthetic with modern touches',
      designer: 'Michael Brown',
      is_active: true,
      display_order: 6,
      variation_types: ['Standard', 'Oversized', 'Compact'],
    },
    {
      name: 'MARIN',
      prefix: 'MR',
      description: 'Bay Area sophistication meets comfort',
      designer: 'Amanda Lee',
      is_active: true,
      display_order: 7,
      variation_types: ['Standard', 'Wide', 'Slim'],
    },
    {
      name: 'TAHOE',
      prefix: 'TH',
      description: 'Alpine luxury with contemporary flair',
      designer: 'Robert Garcia',
      is_active: true,
      display_order: 8,
      variation_types: ['Standard', 'Deep', 'Low'],
    },
  ];

  for (const collectionData of collectionsData) {
    // Check if collection already exists by name
    const existing = await prisma.collections.findFirst({
      where: { name: collectionData.name },
    });

    if (!existing) {
      await prisma.collections.create({ data: collectionData });
    }
  }

  console.log(`  ✅ Created ${collectionsData.length} furniture collections`);

  // Seed material categories
  console.log('  → Creating material categories...');

  const materialCategoriesData = [
    { name: 'Fabric', icon: '🧵', sort_order: 1, active: true },
    { name: 'Wood', icon: '🪵', sort_order: 2, active: true },
    { name: 'Metal', icon: '🔩', sort_order: 3, active: true },
    { name: 'Stone', icon: '🪨', sort_order: 4, active: true },
    { name: 'Weaving', icon: '🧶', sort_order: 5, active: true },
    { name: 'Carving', icon: '🗿', sort_order: 6, active: true },
  ];

  for (const category of materialCategoriesData) {
    await prisma.material_categories.upsert({
      where: { name: category.name },
      update: {},
      create: category,
    });
  }

  console.log(`  ✅ Created ${materialCategoriesData.length} material categories`);

  // Seed partners
  console.log('  → Creating partners (manufacturers, suppliers, designers)...');

  const partnerTypes = ['manufacturer', 'supplier', 'designer'];
  const partnerSpecializations = [
    'Upholstery',
    'Wood Furniture',
    'Metal Fabrication',
    'Stone Work',
    'Custom Design',
    'Fabric Sourcing',
  ];

  const partnerCapabilities = [
    'Custom Manufacturing',
    'Bulk Production',
    'Prototyping',
    'Assembly',
    'Finishing',
    'Quality Control',
  ];

  const partnerCertifications = [
    'ISO 9001',
    'FSC Certified',
    'OSHA Compliant',
    'LEED Certified',
    'Green Guard Certified',
  ];

  const partnersData = [];

  for (let i = 0; i < 20; i++) {
    const type = faker.helpers.arrayElement(partnerTypes);

    partnersData.push({
      type,
      company_name: faker.company.name(),
      business_name: faker.company.name() + ' Inc.',
      registration_number: faker.string.alphanumeric(10).toUpperCase(),
      primary_contact: faker.person.fullName(),
      primary_email: faker.internet.email().toLowerCase(),
      primary_phone: faker.phone.number(),
      website: faker.internet.url(),
      address_line1: faker.location.streetAddress(),
      address_line2: faker.datatype.boolean() ? faker.location.secondaryAddress() : null,
      city: faker.location.city(),
      state: faker.location.state({ abbreviated: true }),
      postal_code: faker.location.zipCode(),
      country: 'USA',
      specializations: faker.helpers.arrayElements(partnerSpecializations, { min: 1, max: 3 }),
      capabilities: faker.helpers.arrayElements(partnerCapabilities, { min: 2, max: 4 }),
      certifications: faker.helpers.arrayElements(partnerCertifications, { min: 1, max: 3 }),
      languages: ['English', ...faker.helpers.arrayElements(['Spanish', 'Chinese', 'French'], { min: 0, max: 2 })],
      production_capacity: type === 'manufacturer' ? faker.number.int({ min: 100, max: 10000 }) : null,
      lead_time_days: type === 'manufacturer' ? faker.number.int({ min: 7, max: 90 }) : null,
      minimum_order: type === 'manufacturer' ? faker.number.int({ min: 10, max: 100 }) : null,
      payment_terms: faker.helpers.arrayElement(['Net 30', 'Net 60', 'Net 90', '50% upfront, 50% on delivery']),
      currency: 'USD',
      status: faker.helpers.arrayElement(['active', 'active', 'active', 'inactive']), // 75% active
      quality_rating: faker.number.float({ min: 3.5, max: 5.0, fractionDigits: 2 }),
      on_time_delivery_rate: faker.number.float({ min: 85.0, max: 100.0, fractionDigits: 2 }),
      defect_rate: faker.number.float({ min: 0.0, max: 5.0, fractionDigits: 2 }),
      portal_enabled: faker.datatype.boolean(),
    });
  }

  for (const partner of partnersData) {
    await prisma.partners.create({
      data: partner,
    });
  }

  console.log(`  ✅ Created ${partnersData.length} partners`);
}
