#!/usr/bin/env tsx
/**
 * Verify Material Collection Associations
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔍 Verifying Material Collection Associations\n');

  // Get counts
  const totalAssociations = await prisma.material_collections.count();
  const materialsWithAssociations = await prisma.materials.count({
    where: {
      active: true,
      material_collections: { some: {} },
    },
  });
  const materialsWithoutAssociations = await prisma.materials.count({
    where: {
      active: true,
      material_collections: { none: {} },
    },
  });
  const totalMaterials = await prisma.materials.count({
    where: { active: true },
  });
  const activeCollections = await prisma.collections.count({
    where: { is_active: true },
  });

  console.log('📊 Summary:');
  console.log(`   Total Associations: ${totalAssociations}`);
  console.log(`   Materials WITH associations: ${materialsWithAssociations}/${totalMaterials}`);
  console.log(`   Materials WITHOUT associations: ${materialsWithoutAssociations}/${totalMaterials}`);
  console.log(`   Active Collections: ${activeCollections}\n`);

  // Sample materials with their collections
  const sampleMaterials = await prisma.materials.findMany({
    where: { active: true },
    take: 5,
    include: {
      material_collections: {
        include: {
          collections: { select: { name: true, prefix: true } },
        },
      },
      material_categories: { select: { name: true } },
    },
    orderBy: { name: 'asc' },
  });

  console.log('📦 Sample Materials:');
  sampleMaterials.forEach(m => {
    const collections = m.material_collections.map(mc =>
      `${mc.collections.name} (${mc.collections.prefix})`
    ).join(', ');
    console.log(`   ${m.name} (${m.material_categories?.name || 'Unknown'})`);
    console.log(`      Collections: ${collections || 'NONE - Will show in ALL'}`);
  });

  // Test getMaterialsByCollection query
  if (activeCollections > 0) {
    const firstCollection = await prisma.collections.findFirst({
      where: { is_active: true },
    });

    if (firstCollection) {
      console.log(`\n🔍 Testing getMaterialsByCollection for "${firstCollection.name}":`);

      const filteredMaterials = await prisma.materials.findMany({
        where: {
          active: true,
          OR: [
            {
              material_collections: {
                some: { collection_id: firstCollection.id },
              },
            },
            {
              material_collections: { none: {} },
            },
          ],
        },
        include: {
          material_categories: true,
          material_collections: {
            include: {
              collections: { select: { name: true } },
            },
          },
        },
      });

      console.log(`   Found ${filteredMaterials.length} materials available for this collection`);
      console.log(`   Breakdown:`);
      const withAssoc = filteredMaterials.filter(m => m.material_collections.length > 0);
      const withoutAssoc = filteredMaterials.filter(m => m.material_collections.length === 0);
      console.log(`      ${withAssoc.length} have collection associations`);
      console.log(`      ${withoutAssoc.length} have NO associations (available everywhere)`);
    }
  }

  console.log('\n✅ Verification complete!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
