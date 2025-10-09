import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function check() {
  const result = await prisma.$queryRaw`
    SELECT column_name, data_type, is_nullable
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'partner_performance'
    ORDER BY ordinal_position;
  ` as any[];

  console.log('ALL FIELDS:');
  result.forEach(r => console.log(`  - ${r.column_name} (${r.data_type}) ${r.is_nullable === 'NO' ? 'REQUIRED' : 'optional'}`));

  await prisma.$disconnect();
}

check();
