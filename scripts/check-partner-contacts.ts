import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function check() {
  const result = await prisma.$queryRaw`
    SELECT column_name, is_nullable
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'partner_contacts'
    ORDER BY ordinal_position;
  ` as any[];
  
  console.log('REQUIRED FIELDS (is_nullable = NO):');
  result.filter(r => r.is_nullable === 'NO').forEach(r => console.log(`  - ${r.column_name}`));
  
  console.log('\nOPTIONAL FIELDS (is_nullable = YES):');
  result.filter(r => r.is_nullable === 'YES').forEach(r => console.log(`  - ${r.column_name}`));
  
  await prisma.$disconnect();
}

check();
