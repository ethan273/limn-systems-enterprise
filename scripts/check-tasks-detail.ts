import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function check() {
  const result = await prisma.$queryRaw`
    SELECT column_name, data_type, is_nullable, column_default
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'task_templates'
    ORDER BY ordinal_position;
  ` as any[];
  
  console.log('ALL TASK_TEMPLATES FIELDS:');
  result.forEach(r => {
    const req = r.is_nullable === 'NO' ? 'REQUIRED' : 'optional';
    const def = r.column_default ? ' [default: ' + r.column_default + ']' : '';
    console.log('  - ' + r.column_name + ' (' + r.data_type + ') ' + req + def);
  });
  
  await prisma.$disconnect();
}

check();
