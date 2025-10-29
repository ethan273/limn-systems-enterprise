#!/usr/bin/env tsx
import { PrismaClient } from '@prisma/client';

async function listConstraints() {
  const prisma = new PrismaClient();

  const constraints = await prisma.$queryRawUnsafe<any[]>(`
    SELECT
      tc.constraint_name,
      tc.table_name,
      cc.check_clause
    FROM information_schema.table_constraints tc
    LEFT JOIN information_schema.check_constraints cc
      ON tc.constraint_name = cc.constraint_name
    WHERE tc.table_name IN ('orders', 'production_orders')
      AND tc.constraint_type = 'CHECK'
    ORDER BY tc.table_name, tc.constraint_name;
  `);

  console.log('\nAll CHECK constraints:');
  console.log('======================\n');
  constraints.forEach(c => {
    console.log(`${c.table_name}.${c.constraint_name}`);
    console.log(`  ${c.check_clause}\n`);
  });

  await prisma.$disconnect();
}

listConstraints();
