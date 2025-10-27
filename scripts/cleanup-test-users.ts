/**
 * Clean up test users from production database
 *
 * KEEPS: Users with @limn.us.com email addresses
 * DELETES: All other users
 *
 * USAGE:
 *   npx tsx scripts/cleanup-test-users.ts --dry-run    # Preview what will be deleted
 *   npx tsx scripts/cleanup-test-users.ts --force      # Actually delete (requires confirmation)
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const force = args.includes('--force');

  console.log('═══════════════════════════════════════════════');
  console.log('  Production Database Cleanup');
  console.log('═══════════════════════════════════════════════\n');

  if (dryRun) {
    console.log('🔍 DRY RUN MODE - No changes will be made\n');
  }

  // Get all users
  const allUsers = await prisma.user_profiles.findMany({
    select: {
      id: true,
      email: true,
      user_type: true,
      created_at: true,
    },
  });

  console.log(`Total users in database: ${allUsers.length}\n`);

  // Separate into keep and delete
  const usersToKeep = allUsers.filter(u => u.email && u.email.endsWith('@limn.us.com'));
  const usersToDelete = allUsers.filter(u => !u.email || !u.email.endsWith('@limn.us.com'));

  // Display users to KEEP
  console.log(`✅ USERS TO KEEP (${usersToKeep.length}):`);
  console.log('─'.repeat(80));
  if (usersToKeep.length > 0) {
    usersToKeep.forEach(u => {
      console.log(`  ${u.email?.padEnd(40)} ${u.user_type || 'no type'}`);
    });
  } else {
    console.log('  (none)');
  }
  console.log('');

  // Display users to DELETE
  console.log(`❌ USERS TO DELETE (${usersToDelete.length}):`);
  console.log('─'.repeat(80));
  if (usersToDelete.length > 0) {
    usersToDelete.slice(0, 20).forEach(u => {
      console.log(`  ${(u.email || 'no email').padEnd(40)} ${u.user_type || 'no type'}`);
    });
    if (usersToDelete.length > 20) {
      console.log(`  ... and ${usersToDelete.length - 20} more`);
    }
  } else {
    console.log('  (none)');
  }
  console.log('─'.repeat(80));

  // Stop here if dry run
  if (dryRun) {
    console.log('\n✅ Dry run complete - use without --dry-run to execute deletion');
    await prisma.$disconnect();
    process.exit(0);
  }

  // Stop here if no users to delete
  if (usersToDelete.length === 0) {
    console.log('\n✅ No users to delete');
    await prisma.$disconnect();
    process.exit(0);
  }

  // Confirm before deleting
  if (!force) {
    console.log('\n⚠️  WARNING: This will PERMANENTLY DELETE the users listed above!');
    console.log('   This action CANNOT be undone!');
    console.log(`   ${usersToDelete.length} users will be deleted`);
    console.log(`   ${usersToKeep.length} users will be kept\n`);
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
  console.log('\n🗑️  Deleting users...\n');

  let deleted = 0;
  let errors = 0;

  for (const user of usersToDelete) {
    try {
      await prisma.user_profiles.delete({
        where: { id: user.id },
      });
      console.log(`  ✅ Deleted: ${user.email || 'no email'}`);
      deleted++;
    } catch (error) {
      console.error(`  ❌ Error deleting ${user.email || 'no email'}:`, error);
      errors++;
    }
  }

  console.log('\n📊 Cleanup Summary:');
  console.log(`   Kept: ${usersToKeep.length} @limn.us.com users`);
  console.log(`   Deleted: ${deleted} test users`);
  console.log(`   Errors: ${errors}`);
  console.log(`   Total remaining: ${usersToKeep.length}`);

  console.log('\n✅ Cleanup complete!');
  console.log('\nNext steps:');
  console.log('1. Verify remaining users in Admin → Users panel');
  console.log('2. Check that your account (ethan@limn.us.com) still works');
  console.log('3. Test login with your employee accounts');
}

main()
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
