/**
 * Clean up ALL seed/demo data from production admin_audit_log
 *
 * This removes all logs that are clearly seed data:
 * - Logs from non-existent users (sarah@limn.us.com, mike@limn.us.com)
 * - Database migration logs
 * - Logs from before October 2025 (when real usage started)
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const args = process.argv.slice(2);
  const force = args.includes('--force');

  console.log('═══════════════════════════════════════════════');
  console.log('  PRODUCTION: Seed Data Cleanup');
  console.log('═══════════════════════════════════════════════\n');

  // Get all logs
  const allLogs = await prisma.admin_audit_log.findMany({
    orderBy: { created_at: 'desc' },
  });

  console.log(`Total logs: ${allLogs.length}\n`);

  // Identify seed data:
  // 1. Logs from non-existent users
  const seedEmails = ['sarah@limn.us.com', 'mike@limn.us.com', 'unknown@test.com'];

  // 2. Database migration actions
  const migrationActions = [
    'PHASE_3_FINAL_OPTIMIZATION',
    'FIX_FOREIGN_KEYS_WITH_CLEANUP',
    'DROP_UNUSED_VIEWS',
  ];

  // 3. Logs created before October 1, 2025 (seed data cutoff)
  const seedCutoffDate = new Date('2025-10-01T00:00:00Z');

  const seedLogs = allLogs.filter(log =>
    seedEmails.includes(log.user_email || '') ||
    migrationActions.includes(log.action) ||
    log.created_at < seedCutoffDate
  );

  const realLogs = allLogs.filter(log =>
    !seedEmails.includes(log.user_email || '') &&
    !migrationActions.includes(log.action) &&
    log.created_at >= seedCutoffDate
  );

  console.log(`✅ REAL LOGS TO KEEP (${realLogs.length}):`);
  console.log('─'.repeat(80));
  if (realLogs.length > 0) {
    realLogs.forEach(log => {
      console.log(`  ${log.created_at.toISOString().split('T')[0]} ${log.action.padEnd(25)} ${log.user_email || '—'}`);
    });
  } else {
    console.log('  (none - all logs are seed data)');
  }
  console.log('');

  console.log(`❌ SEED DATA TO DELETE (${seedLogs.length}):`);
  console.log('─'.repeat(80));
  if (seedLogs.length > 0) {
    seedLogs.slice(0, 10).forEach(log => {
      console.log(`  ${log.created_at.toISOString().split('T')[0]} ${log.action.padEnd(25)} ${log.user_email || '—'}`);
    });
    if (seedLogs.length > 10) {
      console.log(`  ... and ${seedLogs.length - 10} more`);
    }
  }
  console.log('─'.repeat(80));

  if (!force) {
    console.log('\n⚠️  Run with --force to delete seed data');
    await prisma.$disconnect();
    return;
  }

  if (seedLogs.length === 0) {
    console.log('\n✅ No seed data to delete');
    await prisma.$disconnect();
    return;
  }

  console.log('\n🗑️  Deleting seed data...');

  let deleted = 0;
  for (const log of seedLogs) {
    await prisma.admin_audit_log.delete({
      where: { id: log.id },
    });
    deleted++;
  }

  console.log(`\n✅ Deleted ${deleted} seed logs`);
  console.log(`✅ Kept ${realLogs.length} real logs`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
