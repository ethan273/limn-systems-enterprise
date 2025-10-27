/**
 * Check production admin logs for seed data
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const allLogs = await prisma.admin_audit_log.findMany({
    orderBy: { created_at: 'desc' },
  });

  console.log('Total production logs:', allLogs.length);

  const seedLogs = allLogs.filter(log => {
    const str = JSON.stringify(log);
    return str.includes('john.doe') || str.includes('jane.smith') || str.includes('acmecorp');
  });

  console.log('\nLogs with john.doe/jane.smith/acmecorp:', seedLogs.length);

  seedLogs.forEach(log => {
    console.log('\n═══════════════════════════════════════════════');
    console.log('Date:', log.created_at.toISOString());
    console.log('Action:', log.action);
    console.log('User:', log.user_email || '—');
    console.log('Resource:', log.resource_type || '—');
    console.log('Metadata:', JSON.stringify(log.metadata, null, 2));
  });

  // Count test automation logs
  const testLogs = allLogs.filter(log =>
    log.user_email?.includes('admin-') || log.user_id?.includes('test-admin-')
  );

  console.log('\n\nTest automation logs:', testLogs.length);
  console.log('Real logs:', allLogs.length - testLogs.length - seedLogs.length);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
