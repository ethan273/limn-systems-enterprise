import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkMetalData() {
  try {
    console.log('=== Metal Types ===');
    const types = await prisma.metal_types.findMany({
      select: {
        id: true,
        name: true,
        description: true,
        created_at: true,
      },
      take: 10,
    });
    console.log(`Found ${types.length} metal types:`);
    console.log(JSON.stringify(types, null, 2));

    console.log('\n=== Metal Finishes ===');
    const finishes = await prisma.metal_finishes.findMany({
      select: {
        id: true,
        name: true,
        metal_type_id: true,
        created_at: true,
      },
      take: 10,
    });
    console.log(`Found ${finishes.length} metal finishes:`);
    console.log(JSON.stringify(finishes, null, 2));

    console.log('\n=== Metal Colors ===');
    const colors = await prisma.metal_colors.findMany({
      select: {
        id: true,
        name: true,
        metal_finish_id: true,
        hex_code: true,
        created_at: true,
      },
      take: 10,
    });
    console.log(`Found ${colors.length} metal colors:`);
    console.log(JSON.stringify(colors, null, 2));

  } catch (error) {
    console.error('Error checking metal data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkMetalData();
