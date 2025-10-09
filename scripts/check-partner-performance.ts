import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function check() {
  const result = await prisma.$queryRaw`
    SELECT column_name, is_nullable, column_default
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'partner_performance'
    ORDER BY ordinal_position;
  ` as any[];
  console.log('REQUIRED:');
  result.filter(r => r.is_nullable === 'NO' && !r.column_default?.includes('gen_random_uuid') && !r.column_default?.includes('now()')).forEach(r => console.log(\`  - \${r.column_name}\`));
  console.log('\nOPTIONAL:');
  result.filter(r => r.is_nullable === 'YES').forEach(r => console.log(\`  - \${r.column_name}\`));
  await prisma.$disconnect();
}
check();
