import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Get logs from Oct 26, 2025
  const logs = await prisma.admin_audit_log.findMany({
    where: {
      created_at: {
        gte: new Date('2025-10-26T00:00:00Z'),
        lte: new Date('2025-10-27T00:00:00Z'),
      },
    },
    orderBy: { created_at: 'desc' },
  });

  console.log(`Found ${logs.length} logs from Oct 26, 2025\n`);

  logs.forEach(log => {
    console.log('═══════════════════════════════════════════════');
    console.log('Created:', log.created_at.toISOString());
    console.log('Action:', log.action);
    console.log('User:', log.user_email || '—');
    console.log('Resource Type:', log.resource_type || '—');
    console.log('Metadata:', JSON.stringify(log.metadata, null, 2));
    console.log('');
  });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
