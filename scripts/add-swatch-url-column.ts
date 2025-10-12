import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Adding swatch_url column to fabric_colors table...');

    await prisma.$executeRaw`
      ALTER TABLE public.fabric_colors
      ADD COLUMN IF NOT EXISTS swatch_url TEXT;
    `;

    console.log('✅ Successfully added swatch_url column to fabric_colors table');
  } catch (error) {
    console.error('Error adding column:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main();
