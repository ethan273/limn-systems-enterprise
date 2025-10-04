/**
 * Phase 4: Products Module Seeding (CRITICAL - FULL SKUs REQUIRED)
 *
 * Seeds:
 * - 100 Materials (hierarchical with categories)
 * - 60 Catalog Items with FULL BASE SKUs
 * - 30 Concepts with concept numbers
 * - 20 Prototypes with prototype numbers
 *
 * CRITICAL REQUIREMENT: All items MUST have COMPLETE BASE SKUs
 * Format: {COLLECTION_PREFIX}-{NAME_ABBR}-{VARIATION}-{SEQ}
 * Examples: UK-SOFA-DEEP-001, RAG-DINI-002, STH-COFF-TABLE-003
 *
 * Total: ~210 product records with complete information
 */

import { PrismaClient } from '@prisma/client';
import { faker } from '@faker-js/faker';
import { generateBaseSku } from '../../../src/lib/utils/base-sku-generator';

const FURNITURE_TYPES = [
  'Sofa',
  'Chair',
  'Dining Table',
  'Coffee Table',
  'Side Table',
  'Console Table',
  'Bench',
  'Ottoman',
  'Loveseat',
  'Sectional',
  'Bar Stool',
  'Counter Stool',
  'Lounge Chair',
  'Armchair',
  'Credenza',
  'Cabinet',
  'Bookshelf',
  'Bed Frame',
  'Nightstand',
  'Dresser',
];

const VARIATION_TYPES = ['Standard', 'Deep', 'Wide', 'Short', 'Tall', 'Low', 'Extended', 'Compact', 'Narrow', 'Oversized', 'Slim', 'Shallow'];

const ITEM_CATEGORIES = ['Seating', 'Tables', 'Storage', 'Bedroom', 'Outdoor', 'Accessories'];

const ITEM_STATUSES = ['Concept', 'Prototype', 'Production Ready', 'Discontinued'];

/**
 * Seed products module data with FULL SKUs
 */
export async function seedProducts(prisma: PrismaClient) {
  console.log('  → Fetching existing collections for SKU generation...');

  // Get all collections with their prefixes
  const collections = await prisma.collections.findMany({
    select: { id: true, name: true, prefix: true, variation_types: true },
  });

  if (collections.length === 0) {
    console.log('  ⚠️  No collections found. Please run Phase 2 (Reference Data) first.');
    return;
  }

  console.log(`  ✅ Found ${collections.length} collections for SKU generation`);

  // Clean existing product data to prevent duplicate SKU errors
  console.log('  → Cleaning existing product data...');
  await prisma.prototypes.deleteMany({});
  await prisma.concepts.deleteMany({});
  await prisma.items.deleteMany({ where: { type: 'Production Ready' } });
  await prisma.materials.deleteMany({});
  console.log('  ✅ Cleaned existing products, concepts, prototypes, and materials');

  // Seed materials first (for product_materials relationships)
  console.log('  → Creating materials hierarchy...');

  const materialCategories = await prisma.material_categories.findMany();

  if (materialCategories.length === 0) {
    console.log('  ⚠️  No material categories found. Skipping materials seeding.');
  } else {
    const materialsData = [];

    for (const category of materialCategories) {
      // Create 15-20 materials per category
      const materialCount = faker.number.int({ min: 15, max: 20 });

      for (let i = 0; i < materialCount; i++) {
        materialsData.push({
          name: `${faker.commerce.productAdjective()} ${category.name} ${faker.commerce.productMaterial()}`,
          description: faker.commerce.productDescription(),
          material_categories: {
            connect: { id: category.id },
          },
          code: faker.string.alphanumeric(10).toUpperCase(),
          cost_per_unit: faker.number.float({ min: 10, max: 500, fractionDigits: 2 }),
          unit_of_measure: faker.helpers.arrayElement(['yard', 'sqft', 'piece', 'board foot']),
        });
      }
    }

    for (const material of materialsData) {
      await prisma.materials.create({ data: material });
    }

    console.log(`  ✅ Created ${materialsData.length} materials across ${materialCategories.length} categories`);
  }

  // Seed catalog items with FULL BASE SKUs
  console.log('  → Creating catalog items with COMPLETE BASE SKUs...');

  const catalogItemsData = [];

  // Create 60 catalog items (Production Ready) with FULL SKUs
  // Generate and create items one at a time to avoid duplicate SKU issues
  for (let i = 0; i < 60; i++) {
    const collection = faker.helpers.arrayElement(collections);
    if (!collection || !collection.prefix) continue;

    const furnitureType = faker.helpers.arrayElement(FURNITURE_TYPES);
    const variationType = faker.datatype.boolean()
      ? faker.helpers.arrayElement(collection.variation_types || VARIATION_TYPES)
      : null;

    // Generate FULL BASE SKU using the actual SKU generator
    const baseSku = await generateBaseSku(
      collection.prefix,
      furnitureType,
      variationType
    );

    const itemData = {
      name: `${collection.name} ${furnitureType}${variationType ? ` ${variationType}` : ''}`,
      base_sku: baseSku, // CRITICAL: FULL BASE SKU
      sku: baseSku, // Also set sku field for backwards compatibility
      type: 'Production Ready',
      furniture_type: furnitureType,
      variation_type: variationType,
      collections: {
        connect: { id: collection.id },
      },
      category: faker.helpers.arrayElement(ITEM_CATEGORIES),
      description: faker.commerce.productDescription(),
      list_price: faker.number.float({ min: 500, max: 15000, fractionDigits: 2 }),
      cost: faker.number.float({ min: 200, max: 8000, fractionDigits: 2 }),
      price: faker.number.float({ min: 500, max: 15000, fractionDigits: 2 }),
      lead_time_days: faker.number.int({ min: 30, max: 120 }),
      labor_hours: faker.number.float({ min: 5, max: 80, fractionDigits: 1 }),
      weight: faker.number.float({ min: 10, max: 200, fractionDigits: 1 }),
      dimensions: `${faker.number.int({ min: 20, max: 100 })}W x ${faker.number.int({ min: 20, max: 100 })}D x ${faker.number.int({ min: 20, max: 100 })}H`,
      minimum_quantity: faker.number.int({ min: 1, max: 10 }),
      active: true,
      stock_quantity: faker.number.int({ min: 0, max: 50 }),
      reorder_point: faker.number.int({ min: 5, max: 15 }),
      reorder_quantity: faker.number.int({ min: 10, max: 30 }),
      tags: faker.helpers.arrayElements(['Modern', 'Classic', 'Luxury', 'Bestseller', 'New'], { min: 1, max: 3 }),
      notes: `Production-ready catalog item with base SKU: ${baseSku}`,
    };

    // Create item immediately so SKU generator can see it for next iteration
    const createdItem = await prisma.items.create({ data: itemData });
    catalogItemsData.push(createdItem);
  }

  console.log(`  ✅ Created ${catalogItemsData.length} catalog items with FULL BASE SKUs`);
  console.log(`  📊 Sample SKUs generated:`);
  catalogItemsData.slice(0, 5).forEach(item => {
    console.log(`     - ${item.name}: ${item.base_sku}`);
  });

  // Seed concepts (with concept numbers)
  console.log('  → Creating concepts...');

  // Get a user for created_by relation
  const designerUser = await prisma.users.findFirst({
    where: { id: 'fc7356e6-98d5-4ad3-93ba-61bb23fd3f6e' }, // Designer user from Phase 1
  });

  if (!designerUser) {
    console.log('  ⚠️  No designer user found. Skipping concepts seeding.');
  } else {
    const conceptsData = [];

    for (let i = 0; i < 30; i++) {
      const collection = faker.helpers.arrayElement(collections);
      if (!collection) continue;

      const furnitureType = faker.helpers.arrayElement(FURNITURE_TYPES);
      const conceptNumber = `CON-${String(i + 1).padStart(4, '0')}`;

      conceptsData.push({
        name: `${collection.name} ${furnitureType} Concept`,
        concept_number: conceptNumber,
        description: faker.lorem.paragraph(),
        collections: {
          connect: { id: collection.id },
        },
        users: {
          connect: { id: designerUser.id },
        },
        status: faker.helpers.arrayElement(['draft', 'review', 'approved', 'rejected']),
        target_price: faker.number.float({ min: 500, max: 12000, fractionDigits: 2 }),
        estimated_cost: faker.number.float({ min: 200, max: 6000, fractionDigits: 2 }),
        created_at: faker.date.recent({ days: 180 }),
        internal_notes: `Concept design for ${furnitureType}`,
      });
    }

    for (const concept of conceptsData) {
      await prisma.concepts.create({ data: concept });
    }

    console.log(`  ✅ Created ${conceptsData.length} concepts with concept numbers`);
  }

  // Seed prototypes (with prototype numbers)
  console.log('  → Creating prototypes...');

  // Use same designer user for prototypes
  if (!designerUser) {
    console.log('  ⚠️  No designer user found. Skipping prototypes seeding.');
  } else {
    const prototypesData = [];

    for (let i = 0; i < 20; i++) {
      const collection = faker.helpers.arrayElement(collections);
      if (!collection) continue;

      const furnitureType = faker.helpers.arrayElement(FURNITURE_TYPES);
      const prototypeNumber = `PROTO-${String(i + 1).padStart(4, '0')}`;

      prototypesData.push({
        name: `${collection.name} ${furnitureType} Prototype`,
        prototype_number: prototypeNumber,
        description: faker.lorem.paragraph(),
        collections: {
          connect: { id: collection.id },
        },
        users: {
          connect: { id: designerUser.id },
        },
        status: faker.helpers.arrayElement(['in_development', 'testing', 'approved', 'production']),
        target_price_usd: faker.number.float({ min: 500, max: 12000, fractionDigits: 2 }),
        target_cost_usd: faker.number.float({ min: 300, max: 7000, fractionDigits: 2 }),
        notes: faker.lorem.sentences(2),
        created_at: faker.date.recent({ days: 120 }),
      });
    }

    for (const prototype of prototypesData) {
      await prisma.prototypes.create({ data: prototype });
    }

    console.log(`  ✅ Created ${prototypesData.length} prototypes with prototype numbers`);
  }
}
