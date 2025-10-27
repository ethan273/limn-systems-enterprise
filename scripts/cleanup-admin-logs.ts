/**
 * Clean up seed/test data from admin_audit_log table
 *
 * USAGE:
 *   npx tsx scripts/cleanup-admin-logs.ts --dry-run    # Preview what will be deleted
 *   npx tsx scripts/cleanup-admin-logs.ts --force      # Actually delete
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const force = args.includes('--force');

  console.log('═══════════════════════════════════════════════');
  console.log('  Admin Audit Log Cleanup');
  console.log('═══════════════════════════════════════════════\n');

  if (dryRun) {
    console.log('🔍 DRY RUN MODE - No changes will be made\n');
  }

  // Get all admin audit logs
  const allLogs = await prisma.admin_audit_log.findMany({
    orderBy: { created_at: 'desc' },
  });

  console.log(`Total audit logs: ${allLogs.length}\n`);

  // Identify seed data (logs with john.doe@acmecorp.com or jane.smith@techstartup.io)
  const seedEmails = ['john.doe@acmecorp.com', 'jane.smith@techstartup.io'];

  const seedLogs = allLogs.filter(log =>
    seedEmails.includes(log.user_email || '') ||
    (log.metadata && JSON.stringify(log.metadata).includes('john.doe@acmecorp.com')) ||
    (log.metadata && JSON.stringify(log.metadata).includes('jane.smith@techstartup.io'))
  );

  const realLogs = allLogs.filter(log =>
    !seedEmails.includes(log.user_email || '') &&
    (!log.metadata || (!JSON.stringify(log.metadata).includes('john.doe@acmecorp.com') && !JSON.stringify(log.metadata).includes('jane.smith@techstartup.io')))
  );

  console.log(`✅ REAL LOGS TO KEEP (${realLogs.length}):`);
  console.log('─'.repeat(80));
  if (realLogs.length > 0) {
    realLogs.slice(0, 10).forEach(log => {
      console.log(`  ${log.created_at.toISOString().split('T')[0]} ${log.action.padEnd(20)} ${log.user_email || '—'}`);
    });
    if (realLogs.length > 10) {
      console.log(`  ... and ${realLogs.length - 10} more`);
    }
  } else {
    console.log('  (none)');
  }
  console.log('');

  console.log(`❌ SEED DATA TO DELETE (${seedLogs.length}):`);
  console.log('─'.repeat(80));
  if (seedLogs.length > 0) {
    seedLogs.slice(0, 10).forEach(log => {
      console.log(`  ${log.created_at.toISOString().split('T')[0]} ${log.action.padEnd(20)} ${log.user_email || '—'}`);
    });
    if (seedLogs.length > 10) {
      console.log(`  ... and ${seedLogs.length - 10} more`);
    }
  } else {
    console.log('  (none)');
  }
  console.log('─'.repeat(80));

  // Stop here if dry run
  if (dryRun) {
    console.log('\n✅ Dry run complete - use --force to execute deletion');
    await prisma.$disconnect();
    process.exit(0);
  }

  // Stop here if no logs to delete
  if (seedLogs.length === 0) {
    console.log('\n✅ No seed data to delete');
    await prisma.$disconnect();
    process.exit(0);
  }

  // Confirm before deleting
  if (!force) {
    console.log('\n⚠️  WARNING: This will PERMANENTLY DELETE the seed data listed above!');
    console.log('   This action CANNOT be undone!');
    console.log(`   ${seedLogs.length} logs will be deleted`);
    console.log(`   ${realLogs.length} logs will be kept\n`);
    console.log('   Run with --dry-run to preview changes');
    console.log('   Run with --force to skip this confirmation\n');

    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    const answer = await new Promise<string>((resolve) => {
      rl.question('Type "DELETE" (all caps) to confirm deletion: ', resolve);
    });

    rl.close();

    if (answer !== 'DELETE') {
      console.log('\n❌ Deletion cancelled');
      await prisma.$disconnect();
      process.exit(0);
    }
  }

  // Execute deletion
  console.log('\n🗑️  Deleting seed data...\n');

  let deleted = 0;
  let errors = 0;

  for (const log of seedLogs) {
    try {
      await prisma.admin_audit_log.delete({
        where: { id: log.id },
      });
      console.log(`  ✅ Deleted: ${log.action} by ${log.user_email || '—'}`);
      deleted++;
    } catch (error) {
      console.error(`  ❌ Error deleting ${log.id}:`, error);
      errors++;
    }
  }

  console.log('\n📊 Cleanup Summary:');
  console.log(`   Kept: ${realLogs.length} real logs`);
  console.log(`   Deleted: ${deleted} seed data logs`);
  console.log(`   Errors: ${errors}`);
  console.log(`   Total remaining: ${realLogs.length}`);

  console.log('\n✅ Cleanup complete!');
}

main()
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
