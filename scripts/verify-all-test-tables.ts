import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function verifyAllTables() {
  const tables = [
    'contacts', 'clients', 'leads',
    'partners', 'partner_contacts', 'partner_performance',
    'production_orders', 'qc_inspections',
    'design_projects', 'design_briefs', 'mood_boards',
    'tasks', 'task_templates',
    'invoices', 'invoice_items',
    'shipments', 'tracking_updates'
  ];

  for (const table of tables) {
    console.log('\\n========== ' + table.toUpperCase() + ' ==========');

    const result = await prisma.\$queryRaw\`
      SELECT column_name, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = \${table}
      ORDER BY ordinal_position;
    \` as any[];

    console.log('\\nREQUIRED FIELDS:');
    const required = result.filter(r => r.is_nullable === 'NO' && !r.column_default?.includes('gen_random_uuid') && !r.column_default?.includes('now()'));
    required.forEach(r => console.log(\`  - \${r.column_name}\`));

    console.log('\\nOPTIONAL FIELDS:');
    const optional = result.filter(r => r.is_nullable === 'YES');
    optional.forEach(r => console.log(\`  - \${r.column_name}\`));

    console.log('\\nAUTO-GENERATED:');
    const autoGen = result.filter(r => r.column_default?.includes('gen_random_uuid') || r.column_default?.includes('now()'));
    autoGen.forEach(r => console.log(\`  - \${r.column_name} (\${r.column_default})\`));
  }

  await prisma.\$disconnect();
}

verifyAllTables();
