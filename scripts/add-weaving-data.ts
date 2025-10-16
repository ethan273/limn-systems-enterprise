import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Get Weaving category
  const weavingCategory = await prisma.material_categories.findFirst({
    where: { name: { contains: 'Weaving', mode: 'insensitive' } }
  });

  if (!weavingCategory) {
    console.log('❌ Weaving category not found');
    return;
  }

  console.log(`✅ Found Weaving category: ${weavingCategory.id}`);

  // Add weaving styles
  const weavingStyles = [
    { name: 'Plain Weave', code: 'WV-PLAIN-001', type: 'style' },
    { name: 'Twill Weave', code: 'WV-TWILL-001', type: 'style' },
    { name: 'Satin Weave', code: 'WV-SATIN-001', type: 'style' },
    { name: 'Basket Weave', code: 'WV-BASKET-001', type: 'style' },
    { name: 'Herringbone', code: 'WV-HERRING-001', type: 'style' },
  ];

  for (const style of weavingStyles) {
    const created = await prisma.materials.create({
      data: {
        name: style.name,
        code: style.code,
        type: style.type,
        category_id: weavingCategory.id,
        active: true,
        hierarchy_level: 1,
        hierarchy_path: style.name,
      },
    });
    console.log(`✅ Created: ${created.name}`);
  }

  console.log('\n✅ Weaving data added successfully');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
