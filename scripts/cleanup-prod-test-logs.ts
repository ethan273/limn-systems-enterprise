/**
 * Clean up test automation logs from PRODUCTION admin_audit_log
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const args = process.argv.slice(2);
  const force = args.includes('--force');

  console.log('═══════════════════════════════════════════════');
  console.log('  PRODUCTION: Test Automation Log Cleanup');
  console.log('═══════════════════════════════════════════════\n');

  // Get test logs
  const testLogs = await prisma.admin_audit_log.findMany({
    where: {
      OR: [
        { user_email: { contains: 'admin-' } },
        { user_id: { contains: 'test-admin-' } },
      ],
    },
    orderBy: { created_at: 'desc' },
  });

  console.log(`Found ${testLogs.length} test automation logs\n`);

  if (testLogs.length === 0) {
    console.log('✅ No test logs to clean up');
    await prisma.$disconnect();
    return;
  }

  console.log('Sample test logs to delete:');
  testLogs.slice(0, 10).forEach(log => {
    console.log(`  - ${log.created_at.toISOString().split('T')[0]} ${log.action} by ${log.user_email}`);
  });

  if (!force) {
    console.log(`\n⚠️  Run with --force to delete ${testLogs.length} test logs`);
    await prisma.$disconnect();
    return;
  }

  console.log('\n🗑️  Deleting test logs...');

  await prisma.admin_audit_log.deleteMany({
    where: {
      OR: [
        { user_email: { contains: 'admin-' } },
        { user_id: { contains: 'test-admin-' } },
      ],
    },
  });

  console.log(`✅ Deleted ${testLogs.length} test logs`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
