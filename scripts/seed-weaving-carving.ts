/**
 * Seed Script: Add Weaving and Carving Materials
 *
 * This script adds weaving and carving materials which don't use parent-child relationships.
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding Weaving and Carving materials...\n');

  // Get material categories
  const weavingCategory = await prisma.material_categories.findFirst({ where: { name: 'Weave' } });
  const carvingCategory = await prisma.material_categories.findFirst({ where: { name: 'Carving' } });

  if (!weavingCategory || !carvingCategory) {
    throw new Error('Missing Weave or Carving categories');
  }

  // Create Weave Materials (Independent levels - no parent-child relationships)
  console.log('🧺 Creating Weave materials (3 independent levels)...');

  const weavingMaterials = [
    { name: 'Natural Rattan', type: 'material', cost: 35.00, level: 1 },
    { name: 'Synthetic Resin', type: 'material', cost: 28.00, level: 1 },
  ];

  for (const material of weavingMaterials) {
    const existing = await prisma.materials.findFirst({
      where: { name: material.name, category_id: weavingCategory.id },
    });

    if (!existing) {
      await prisma.materials.create({
        data: {
          name: material.name,
          type: material.type,
          category_id: weavingCategory.id,
          hierarchy_level: material.level,
          hierarchy_path: material.name,
          cost_per_unit: material.cost,
          unit_of_measure: 'pound',
          active: true,
        },
      });
      console.log(`   ✓ Created material: ${material.name}`);
    } else {
      console.log(`   - Skipped (exists): ${material.name}`);
    }
  }

  const weavingPatterns = [
    { name: 'Basket Weave', cost: 40.00, level: 2 },
    { name: 'Herringbone', cost: 42.00, level: 2 },
  ];

  for (const pattern of weavingPatterns) {
    const existing = await prisma.materials.findFirst({
      where: { name: pattern.name, category_id: weavingCategory.id },
    });

    if (!existing) {
      await prisma.materials.create({
        data: {
          name: pattern.name,
          type: 'pattern',
          category_id: weavingCategory.id,
          hierarchy_level: pattern.level,
          hierarchy_path: pattern.name,
          cost_per_unit: pattern.cost,
          unit_of_measure: 'pound',
          active: true,
        },
      });
      console.log(`   ✓ Created pattern: ${pattern.name}`);
    } else {
      console.log(`   - Skipped (exists): ${pattern.name}`);
    }
  }

  const weavingColors = [
    { name: 'Natural Tan', cost: 0, level: 3 },
    { name: 'Espresso Brown', cost: 5.00, level: 3 },
  ];

  for (const color of weavingColors) {
    const existing = await prisma.materials.findFirst({
      where: { name: color.name, category_id: weavingCategory.id },
    });

    if (!existing) {
      await prisma.materials.create({
        data: {
          name: color.name,
          type: 'color',
          category_id: weavingCategory.id,
          hierarchy_level: color.level,
          hierarchy_path: color.name,
          cost_per_unit: color.cost,
          unit_of_measure: 'pound',
          active: true,
        },
      });
      console.log(`   ✓ Created color: ${color.name}`);
    } else {
      console.log(`   - Skipped (exists): ${color.name}`);
    }
  }

  // Create Carving Materials (Independent levels - no parent-child relationships)
  console.log('\n🗿 Creating Carving materials (2 independent levels)...');

  const carvingStyles = [
    { name: 'Traditional', cost: 150.00, level: 1 },
    { name: 'Contemporary', cost: 175.00, level: 1 },
  ];

  for (const style of carvingStyles) {
    const existing = await prisma.materials.findFirst({
      where: { name: style.name, category_id: carvingCategory.id },
    });

    if (!existing) {
      await prisma.materials.create({
        data: {
          name: style.name,
          type: 'style',
          category_id: carvingCategory.id,
          hierarchy_level: style.level,
          hierarchy_path: style.name,
          cost_per_unit: style.cost,
          unit_of_measure: 'piece',
          active: true,
        },
      });
      console.log(`   ✓ Created style: ${style.name}`);
    } else {
      console.log(`   - Skipped (exists): ${style.name}`);
    }
  }

  const carvingPatterns = [
    { name: 'Floral', cost: 200.00, level: 2 },
    { name: 'Geometric', cost: 180.00, level: 2 },
  ];

  for (const pattern of carvingPatterns) {
    const existing = await prisma.materials.findFirst({
      where: { name: pattern.name, category_id: carvingCategory.id },
    });

    if (!existing) {
      await prisma.materials.create({
        data: {
          name: pattern.name,
          type: 'pattern',
          category_id: carvingCategory.id,
          hierarchy_level: pattern.level,
          hierarchy_path: pattern.name,
          cost_per_unit: pattern.cost,
          unit_of_measure: 'piece',
          active: true,
        },
      });
      console.log(`   ✓ Created pattern: ${pattern.name}`);
    } else {
      console.log(`   - Skipped (exists): ${pattern.name}`);
    }
  }

  const totalMaterials = await prisma.materials.count();
  console.log(`\n✅ Seed completed! Total materials: ${totalMaterials}`);
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
