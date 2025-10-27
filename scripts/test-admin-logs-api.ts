/**
 * Test what the admin logs API returns
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Testing admin logs API query...\n');

  // Simulate what api.audit.getAdminLogs does
  const where: any = {};
  const limit = 50;
  const offset = 0;

  const [logs, total] = await Promise.all([
    prisma.admin_audit_log.findMany({
      where,
      take: limit,
      skip: offset,
      orderBy: { created_at: 'desc' },
    }),
    prisma.admin_audit_log.count({ where }),
  ]);

  console.log('Admin Logs Query Result:');
  console.log('Total:', total);
  console.log('Returned:', logs.length);

  if (logs.length > 0) {
    console.log('\nLogs:');
    logs.forEach(log => {
      console.log(`  - ${log.created_at.toISOString()} ${log.action} by ${log.user_email || '—'}`);
    });
  } else {
    console.log('\n✅ No logs found (correct!)');
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
