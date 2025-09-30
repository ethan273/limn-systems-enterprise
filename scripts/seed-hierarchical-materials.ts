/**
 * Seed Script: Hierarchical Materials System Test Data
 *
 * This script generates comprehensive test data for the hierarchical materials system:
 * - Furniture Collections (UKIAH, RAGUSA, ST HELENA, INYO)
 * - Material Categories (Fabric, Wood, Metal, Stone, Weave, Carving)
 * - Hierarchical Materials with parent-child relationships
 * - Material-Collection assignments with inheritance
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting hierarchical materials seed...\n');

  // Step 1: Get existing furniture collections
  console.log('📦 Step 1: Fetching furniture collections...');
  const furnitureCollections = await prisma.furniture_collections.findMany({
    where: { name: { in: ['UKIAH', 'RAGUSA', 'ST HELENA', 'INYO'] } },
    select: { id: true, name: true, prefix: true },
  });

  if (furnitureCollections.length === 0) {
    throw new Error('No furniture collections found. Please create UKIAH, RAGUSA, ST HELENA, and INYO collections first.');
  }

  console.log(`   ✓ Found ${furnitureCollections.length} furniture collections`);
  furnitureCollections.forEach(fc => console.log(`     - ${fc.name} (${fc.prefix})`));

  // Step 2: Get material categories
  console.log('\n📋 Step 2: Fetching material categories...');
  const fabricCategory = await prisma.material_categories.findFirst({ where: { name: 'Fabric' } });
  const woodCategory = await prisma.material_categories.findFirst({ where: { name: 'Wood' } });
  const metalCategory = await prisma.material_categories.findFirst({ where: { name: 'Metal' } });
  const stoneCategory = await prisma.material_categories.findFirst({ where: { name: 'Stone' } });
  const weavingCategory = await prisma.material_categories.findFirst({ where: { name: 'Weave' } });
  const carvingCategory = await prisma.material_categories.findFirst({ where: { name: 'Carving' } });

  if (!fabricCategory || !woodCategory || !metalCategory || !stoneCategory || !weavingCategory || !carvingCategory) {
    throw new Error('Missing material categories. Please ensure all 6 categories exist.');
  }

  console.log('   ✓ Found all 6 material categories');

  // Step 3: Create Fabric Materials (Hierarchical: Brand → Collection → Color)
  console.log('\n🧵 Step 3: Creating Fabric materials (3-level hierarchy)...');

  // Sunbrella brand - Available in UKIAH and RAGUSA only
  const ukiahId = furnitureCollections.find(fc => fc.name === 'UKIAH')?.id;
  const ragusaId = furnitureCollections.find(fc => fc.name === 'RAGUSA')?.id;
  const stHelenaId = furnitureCollections.find(fc => fc.name === 'ST HELENA')?.id;
  const inyoId = furnitureCollections.find(fc => fc.name === 'INYO')?.id;

  const sunbrellaBrand = await prisma.materials.create({
    data: {
      name: 'Sunbrella',
      code: 'FAB-SUNB-001',
      type: 'brand',
      category_id: fabricCategory.id,
      hierarchy_level: 1,
      hierarchy_path: 'Sunbrella',
      cost_per_unit: 45.00,
      unit_of_measure: 'yard',
      active: true,
      material_furniture_collections: {
        create: [
          { furniture_collection_id: ukiahId! },
          { furniture_collection_id: ragusaId! },
        ],
      },
    },
  });
  console.log(`   ✓ Created brand: Sunbrella (available in UKIAH, RAGUSA)`);

  // Sunbrella Fusion Collection (child of Sunbrella)
  const fusionCollection = await prisma.materials.create({
    data: {
      name: 'Fusion',
      type: 'collection',
      category_id: fabricCategory.id,
      parent_material_id: sunbrellaBrand.id,
      hierarchy_level: 2,
      hierarchy_path: 'Sunbrella/Fusion',
      cost_per_unit: 48.00,
      unit_of_measure: 'yard',
      active: true,
      material_furniture_collections: {
        create: [
          { furniture_collection_id: ukiahId! },
          { furniture_collection_id: ragusaId! },
        ],
      },
    },
  });
  console.log(`   ✓ Created collection: Fusion (child of Sunbrella)`);

  // Fusion colors (children of Fusion)
  const fusionColors = [
    { name: 'Navy Blue', cost: 50.00 },
    { name: 'Charcoal Gray', cost: 50.00 },
    { name: 'Forest Green', cost: 52.00 },
  ];

  for (const color of fusionColors) {
    await prisma.materials.create({
      data: {
        name: color.name,
        type: 'color',
        category_id: fabricCategory.id,
        parent_material_id: fusionCollection.id,
        hierarchy_level: 3,
        hierarchy_path: `Sunbrella/Fusion/${color.name}`,
        cost_per_unit: color.cost,
        unit_of_measure: 'yard',
        active: true,
        material_furniture_collections: {
          create: [
            { furniture_collection_id: ukiahId! },
          ],
        },
      },
    });
    console.log(`     - Color: ${color.name}`);
  }

  // Sunbrella Heritage Collection (child of Sunbrella)
  const heritageCollection = await prisma.materials.create({
    data: {
      name: 'Heritage',
      type: 'collection',
      category_id: fabricCategory.id,
      parent_material_id: sunbrellaBrand.id,
      hierarchy_level: 2,
      hierarchy_path: 'Sunbrella/Heritage',
      cost_per_unit: 55.00,
      unit_of_measure: 'yard',
      active: true,
      material_furniture_collections: {
        create: [
          { furniture_collection_id: ragusaId! },
        ],
      },
    },
  });
  console.log(`   ✓ Created collection: Heritage (child of Sunbrella, RAGUSA only)`);

  const heritageColors = [
    { name: 'Brick Red', cost: 57.00 },
    { name: 'Antique Beige', cost: 57.00 },
  ];

  for (const color of heritageColors) {
    await prisma.materials.create({
      data: {
        name: color.name,
        type: 'color',
        category_id: fabricCategory.id,
        parent_material_id: heritageCollection.id,
        hierarchy_level: 3,
        hierarchy_path: `Sunbrella/Heritage/${color.name}`,
        cost_per_unit: color.cost,
        unit_of_measure: 'yard',
        active: true,
        material_furniture_collections: {
          create: [
            { furniture_collection_id: ragusaId! },
          ],
        },
      },
    });
    console.log(`     - Color: ${color.name}`);
  }

  // Maharam brand - Available in ALL collections (no assignments = universal)
  const maharamBrand = await prisma.materials.create({
    data: {
      name: 'Maharam',
      type: 'brand',
      category_id: fabricCategory.id,
      hierarchy_level: 1,
      hierarchy_path: 'Maharam',
      cost_per_unit: 85.00,
      unit_of_measure: 'yard',
      active: true,
      // No material_collections = available in ALL
    },
  });
  console.log(`   ✓ Created brand: Maharam (available in ALL collections)`);

  const maharamCollection = await prisma.materials.create({
    data: {
      name: 'Kvadrat Divina',
      type: 'collection',
      category_id: fabricCategory.id,
      parent_material_id: maharamBrand.id,
      hierarchy_level: 2,
      hierarchy_path: 'Maharam/Kvadrat Divina',
      cost_per_unit: 90.00,
      unit_of_measure: 'yard',
      active: true,
    },
  });
  console.log(`   ✓ Created collection: Kvadrat Divina (child of Maharam)`);

  const maharamColors = [
    { name: 'Deep Purple', cost: 95.00 },
    { name: 'Ocean Blue', cost: 95.00 },
    { name: 'Sunset Orange', cost: 98.00 },
  ];

  for (const color of maharamColors) {
    await prisma.materials.create({
      data: {
        name: color.name,
        type: 'color',
        category_id: fabricCategory.id,
        parent_material_id: maharamCollection.id,
        hierarchy_level: 3,
        hierarchy_path: `Maharam/Kvadrat Divina/${color.name}`,
        cost_per_unit: color.cost,
        unit_of_measure: 'yard',
        active: true,
      },
    });
    console.log(`     - Color: ${color.name}`);
  }

  // Step 4: Create Wood Materials (Hierarchical: Type → Finish)
  console.log('\n🪵 Step 4: Creating Wood materials (2-level hierarchy)...');

  const oakType = await prisma.materials.create({
    data: {
      name: 'White Oak',
      type: 'type',
      category_id: woodCategory.id,
      hierarchy_level: 1,
      hierarchy_path: 'White Oak',
      cost_per_unit: 125.00,
      unit_of_measure: 'board foot',
      active: true,
      material_furniture_collections: {
        create: [
          { furniture_collection_id: ukiahId! },
          { furniture_collection_id: stHelenaId! },
        ],
      },
    },
  });
  console.log(`   ✓ Created type: White Oak (available in UKIAH, ST HELENA)`);

  const oakFinishes = [
    { name: 'Natural', cost: 130.00 },
    { name: 'Dark Walnut Stain', cost: 140.00 },
    { name: 'Ebony Stain', cost: 145.00 },
  ];

  for (const finish of oakFinishes) {
    await prisma.materials.create({
      data: {
        name: finish.name,
        type: 'finish',
        category_id: woodCategory.id,
        parent_material_id: oakType.id,
        hierarchy_level: 2,
        hierarchy_path: `White Oak/${finish.name}`,
        cost_per_unit: finish.cost,
        unit_of_measure: 'board foot',
        active: true,
        material_furniture_collections: {
          create: [
            { furniture_collection_id: ukiahId! },
            { furniture_collection_id: stHelenaId! },
          ],
        },
      },
    });
    console.log(`     - Finish: ${finish.name}`);
  }

  const walnutType = await prisma.materials.create({
    data: {
      name: 'American Walnut',
      type: 'type',
      category_id: woodCategory.id,
      hierarchy_level: 1,
      hierarchy_path: 'American Walnut',
      cost_per_unit: 175.00,
      unit_of_measure: 'board foot',
      active: true,
      // Available in ALL collections
    },
  });
  console.log(`   ✓ Created type: American Walnut (available in ALL collections)`);

  const walnutFinishes = [
    { name: 'Natural', cost: 180.00 },
    { name: 'Honey Tone', cost: 185.00 },
  ];

  for (const finish of walnutFinishes) {
    await prisma.materials.create({
      data: {
        name: finish.name,
        type: 'finish',
        category_id: woodCategory.id,
        parent_material_id: walnutType.id,
        hierarchy_level: 2,
        hierarchy_path: `American Walnut/${finish.name}`,
        cost_per_unit: finish.cost,
        unit_of_measure: 'board foot',
        active: true,
      },
    });
    console.log(`     - Finish: ${finish.name}`);
  }

  // Step 5: Create Metal Materials (Hierarchical: Type → Finish → Color)
  console.log('\n⚙️ Step 5: Creating Metal materials (3-level hierarchy)...');

  const steelType = await prisma.materials.create({
    data: {
      name: 'Stainless Steel',
      type: 'type',
      category_id: metalCategory.id,
      hierarchy_level: 1,
      hierarchy_path: 'Stainless Steel',
      cost_per_unit: 65.00,
      unit_of_measure: 'pound',
      active: true,
      material_furniture_collections: {
        create: [
          { furniture_collection_id: inyoId! },
        ],
      },
    },
  });
  console.log(`   ✓ Created type: Stainless Steel (available in INYO)`);

  const brushedFinish = await prisma.materials.create({
    data: {
      name: 'Brushed',
      type: 'finish',
      category_id: metalCategory.id,
      parent_material_id: steelType.id,
      hierarchy_level: 2,
      hierarchy_path: 'Stainless Steel/Brushed',
      cost_per_unit: 70.00,
      unit_of_measure: 'pound',
      active: true,
      material_furniture_collections: {
        create: [
          { furniture_collection_id: inyoId! },
        ],
      },
    },
  });
  console.log(`   ✓ Created finish: Brushed (child of Stainless Steel)`);

  const brushedColors = [
    { name: 'Satin Nickel', cost: 75.00 },
    { name: 'Antique Bronze', cost: 78.00 },
  ];

  for (const color of brushedColors) {
    await prisma.materials.create({
      data: {
        name: color.name,
        type: 'color',
        category_id: metalCategory.id,
        parent_material_id: brushedFinish.id,
        hierarchy_level: 3,
        hierarchy_path: `Stainless Steel/Brushed/${color.name}`,
        cost_per_unit: color.cost,
        unit_of_measure: 'pound',
        active: true,
        material_furniture_collections: {
          create: [
            { furniture_collection_id: inyoId! },
          ],
        },
      },
    });
    console.log(`     - Color: ${color.name}`);
  }

  // Step 6: Create Stone Materials (Hierarchical: Type → Finish)
  console.log('\n🪨 Step 6: Creating Stone materials (2-level hierarchy)...');

  const marbleType = await prisma.materials.create({
    data: {
      name: 'Carrara Marble',
      type: 'type',
      category_id: stoneCategory.id,
      hierarchy_level: 1,
      hierarchy_path: 'Carrara Marble',
      cost_per_unit: 250.00,
      unit_of_measure: 'square foot',
      active: true,
      material_furniture_collections: {
        create: [
          { furniture_collection_id: ragusaId! },
          { furniture_collection_id: stHelenaId! },
        ],
      },
    },
  });
  console.log(`   ✓ Created type: Carrara Marble (available in RAGUSA, ST HELENA)`);

  const marbleFinishes = [
    { name: 'Polished', cost: 275.00 },
    { name: 'Honed', cost: 265.00 },
  ];

  for (const finish of marbleFinishes) {
    await prisma.materials.create({
      data: {
        name: finish.name,
        type: 'finish',
        category_id: stoneCategory.id,
        parent_material_id: marbleType.id,
        hierarchy_level: 2,
        hierarchy_path: `Carrara Marble/${finish.name}`,
        cost_per_unit: finish.cost,
        unit_of_measure: 'square foot',
        active: true,
        material_furniture_collections: {
          create: [
            { furniture_collection_id: ragusaId! },
            { furniture_collection_id: stHelenaId! },
          ],
        },
      },
    });
    console.log(`     - Finish: ${finish.name}`);
  }

  // Step 7: Create Weave Materials (Independent levels)
  console.log('\n🧺 Step 7: Creating Weave materials (3 independent levels)...');

  const weavingMaterials = [
    { name: 'Natural Rattan', type: 'material', cost: 35.00 },
    { name: 'Synthetic Resin', type: 'material', cost: 28.00 },
  ];

  for (const material of weavingMaterials) {
    await prisma.materials.create({
      data: {
        name: material.name,
        type: material.type,
        category_id: weavingCategory.id,
        hierarchy_level: 1,
        hierarchy_path: material.name,
        cost_per_unit: material.cost,
        unit_of_measure: 'pound',
        active: true,
      },
    });
    console.log(`   ✓ Created material: ${material.name}`);
  }

  const weavingPatterns = [
    { name: 'Basket Weave', cost: 40.00 },
    { name: 'Herringbone', cost: 42.00 },
  ];

  for (const pattern of weavingPatterns) {
    await prisma.materials.create({
      data: {
        name: pattern.name,
        type: 'pattern',
        category_id: weavingCategory.id,
        hierarchy_level: 2,
        hierarchy_path: pattern.name,
        cost_per_unit: pattern.cost,
        unit_of_measure: 'pound',
        active: true,
      },
    });
    console.log(`   ✓ Created pattern: ${pattern.name}`);
  }

  const weavingColors = [
    { name: 'Natural Tan', cost: 0 },
    { name: 'Espresso Brown', cost: 5.00 },
  ];

  for (const color of weavingColors) {
    await prisma.materials.create({
      data: {
        name: color.name,
        type: 'color',
        category_id: weavingCategory.id,
        hierarchy_level: 3,
        hierarchy_path: color.name,
        cost_per_unit: color.cost,
        unit_of_measure: 'pound',
        active: true,
      },
    });
    console.log(`   ✓ Created color: ${color.name}`);
  }

  // Step 8: Create Carving Materials (Independent levels)
  console.log('\n🗿 Step 8: Creating Carving materials (2 independent levels)...');

  const carvingStyles = [
    { name: 'Traditional', cost: 150.00 },
    { name: 'Contemporary', cost: 175.00 },
  ];

  for (const style of carvingStyles) {
    await prisma.materials.create({
      data: {
        name: style.name,
        type: 'style',
        category_id: carvingCategory.id,
        hierarchy_level: 1,
        hierarchy_path: style.name,
        cost_per_unit: style.cost,
        unit_of_measure: 'piece',
        active: true,
      },
    });
    console.log(`   ✓ Created style: ${style.name}`);
  }

  const carvingPatterns = [
    { name: 'Floral', cost: 200.00 },
    { name: 'Geometric', cost: 180.00 },
  ];

  for (const pattern of carvingPatterns) {
    await prisma.materials.create({
      data: {
        name: pattern.name,
        type: 'pattern',
        category_id: carvingCategory.id,
        hierarchy_level: 2,
        hierarchy_path: pattern.name,
        cost_per_unit: pattern.cost,
        unit_of_measure: 'piece',
        active: true,
      },
    });
    console.log(`   ✓ Created pattern: ${pattern.name}`);
  }

  // Summary
  console.log('\n✅ Seed completed successfully!\n');

  const totalMaterials = await prisma.materials.count();
  console.log('📊 Summary:');
  console.log(`   Total materials created: ${totalMaterials}`);
  console.log(`   - Fabrics: 2 brands, 3 collections, 8 colors`);
  console.log(`   - Woods: 2 types, 5 finishes`);
  console.log(`   - Metals: 1 type, 1 finish, 2 colors`);
  console.log(`   - Stones: 1 type, 2 finishes`);
  console.log(`   - Weave: 2 materials, 2 patterns, 2 colors (independent)`);
  console.log(`   - Carving: 2 styles, 2 patterns (independent)`);
  console.log('\n   Collection assignments:');
  console.log(`   - Sunbrella: UKIAH, RAGUSA`);
  console.log(`   - Maharam: ALL (no assignments)`);
  console.log(`   - White Oak: UKIAH, ST HELENA`);
  console.log(`   - American Walnut: ALL (no assignments)`);
  console.log(`   - Stainless Steel: INYO`);
  console.log(`   - Carrara Marble: RAGUSA, ST HELENA`);
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });