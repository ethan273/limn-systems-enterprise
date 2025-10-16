import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Add swatch_url column using raw SQL
  await prisma.$executeRawUnsafe(`
    ALTER TABLE "public"."materials" 
    ADD COLUMN IF NOT EXISTS "swatch_url" TEXT;
  `);
  
  console.log('✅ Added swatch_url column to materials table');
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
