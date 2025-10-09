import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function check() {
  const tables = ['contacts', 'clients', 'leads'];
  
  for (const table of tables) {
    console.log('\n========== ' + table.toUpperCase() + ' ==========');
    const result = await prisma.$queryRaw`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = ${table}
      ORDER BY ordinal_position;
    ` as any[];
    
    console.log('\nREQUIRED FIELDS:');
    result.filter(r => r.is_nullable === 'NO').forEach(r => {
      console.log('  - ' + r.column_name + ' (' + r.data_type + ')');
    });
    
    console.log('\nOPTIONAL FIELDS:');
    result.filter(r => r.is_nullable === 'YES').forEach(r => {
      console.log('  - ' + r.column_name + ' (' + r.data_type + ')');
    });
  }
  
  await prisma.$disconnect();
}

check();
