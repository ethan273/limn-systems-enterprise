/**
 * Migrate user_type to user_roles
 *
 * Converts all existing user_type values to appropriate role assignments
 * in the user_roles table for proper RBAC implementation.
 *
 * USAGE:
 *   npx tsx scripts/migrate-user-type-to-roles.ts
 *
 * OPTIONS:
 *   --dry-run    Show what would be migrated without making changes
 *   --force      Skip confirmation prompt
 */

import { PrismaClient } from '@prisma/client';
import { SYSTEM_ROLES } from '@/lib/services/rbac-service';
import type { SystemRole, UserType } from '@/lib/services/rbac-service';

const prisma = new PrismaClient();

// Map user_type to appropriate roles
const USER_TYPE_TO_ROLES: Record<UserType, SystemRole[]> = {
  super_admin: [SYSTEM_ROLES.SUPER_ADMIN],
  employee: [SYSTEM_ROLES.USER],
  customer: [SYSTEM_ROLES.VIEWER],
  contractor: [SYSTEM_ROLES.USER],
  designer: [SYSTEM_ROLES.DESIGNER],
  manufacturer: [SYSTEM_ROLES.USER],
  factory: [SYSTEM_ROLES.USER],
  finance: [SYSTEM_ROLES.ANALYST],
  qc_tester: [SYSTEM_ROLES.USER],
};

interface MigrationPlan {
  userId: string;
  email: string;
  currentUserType: string;
  rolesToAssign: SystemRole[];
  existingRoles: string[];
  action: 'create' | 'skip' | 'update';
}

async function analyzeMigration(dryRun: boolean = false): Promise<MigrationPlan[]> {
  console.log('🔍 Analyzing users for migration...\n');

  // Get all users with their user_type and existing roles
  const users = await prisma.user_profiles.findMany({
    select: {
      id: true,
      email: true,
      user_type: true,
    },
  });

  const plans: MigrationPlan[] = [];

  for (const user of users) {
    if (!user.user_type) {
      console.log(`⚠️  User ${user.email} has no user_type - skipping`);
      continue;
    }

    // Get existing roles
    const existingRoles = await prisma.user_roles.findMany({
      where: { user_id: user.id },
      select: { role: true },
    });

    const existingRoleNames = existingRoles.map(r => r.role);

    // Determine roles to assign based on user_type
    const rolesToAssign = USER_TYPE_TO_ROLES[user.user_type as UserType] || [SYSTEM_ROLES.USER];

    // Determine action
    let action: 'create' | 'skip' | 'update' = 'create';

    if (existingRoleNames.length > 0) {
      // Check if proposed roles are already assigned
      const allAssigned = rolesToAssign.every(role => existingRoleNames.includes(role));
      if (allAssigned) {
        action = 'skip';
      } else {
        action = 'update';
      }
    }

    plans.push({
      userId: user.id,
      email: user.email || 'no-email',
      currentUserType: user.user_type,
      rolesToAssign,
      existingRoles: existingRoleNames,
      action,
    });
  }

  return plans;
}

async function executeMigration(plans: MigrationPlan[]) {
  console.log('\n🚀 Executing migration...\n');

  let created = 0;
  let updated = 0;
  let skipped = 0;
  let errors = 0;

  for (const plan of plans) {
    try {
      if (plan.action === 'skip') {
        console.log(`⏭️  ${plan.email}: Already has correct roles`);
        skipped++;
        continue;
      }

      if (plan.action === 'create' || plan.action === 'update') {
        // Assign new roles
        for (const role of plan.rolesToAssign) {
          // Check if role already exists
          const existing = await prisma.user_roles.findFirst({
            where: {
              user_id: plan.userId,
              role: role,
            },
          });

          if (!existing) {
            await prisma.user_roles.create({
              data: {
                user_id: plan.userId,
                role: role,
              },
            });
          }
        }

        if (plan.action === 'create') {
          console.log(`✅ ${plan.email}: Created roles ${plan.rolesToAssign.join(', ')}`);
          created++;
        } else {
          console.log(`✅ ${plan.email}: Updated roles (added ${plan.rolesToAssign.join(', ')})`);
          updated++;
        }
      }
    } catch (error) {
      console.error(`❌ ${plan.email}: Error -`, error);
      errors++;
    }
  }

  console.log('\n📊 Migration Summary:');
  console.log(`   Created: ${created}`);
  console.log(`   Updated: ${updated}`);
  console.log(`   Skipped: ${skipped}`);
  console.log(`   Errors: ${errors}`);
  console.log(`   Total: ${plans.length}`);
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const force = args.includes('--force');

  console.log('═══════════════════════════════════════════════');
  console.log('  user_type → user_roles Migration');
  console.log('═══════════════════════════════════════════════\n');

  if (dryRun) {
    console.log('🔍 DRY RUN MODE - No changes will be made\n');
  }

  // Analyze migration
  const plans = await analyzeMigration(dryRun);

  // Show migration plan
  console.log('\n📋 Migration Plan:');
  console.log('─'.repeat(80));
  console.log(`${'Email'.padEnd(35)} ${'User Type'.padEnd(15)} ${'Roles to Assign'.padEnd(20)} ${'Action'.padEnd(10)}`);
  console.log('─'.repeat(80));

  const byAction = {
    create: plans.filter(p => p.action === 'create'),
    update: plans.filter(p => p.action === 'update'),
    skip: plans.filter(p => p.action === 'skip'),
  };

  // Show creates
  if (byAction.create.length > 0) {
    console.log(`\n✨ CREATE (${byAction.create.length}):`);
    byAction.create.slice(0, 10).forEach(plan => {
      console.log(
        `${plan.email.padEnd(35)} ${plan.currentUserType.padEnd(15)} ${plan.rolesToAssign.join(', ').padEnd(20)} ${plan.action.padEnd(10)}`
      );
    });
    if (byAction.create.length > 10) {
      console.log(`   ... and ${byAction.create.length - 10} more`);
    }
  }

  // Show updates
  if (byAction.update.length > 0) {
    console.log(`\n🔄 UPDATE (${byAction.update.length}):`);
    byAction.update.slice(0, 10).forEach(plan => {
      console.log(
        `${plan.email.padEnd(35)} ${plan.currentUserType.padEnd(15)} ${plan.rolesToAssign.join(', ').padEnd(20)} ${plan.action.padEnd(10)}`
      );
    });
    if (byAction.update.length > 10) {
      console.log(`   ... and ${byAction.update.length - 10} more`);
    }
  }

  // Show skips
  if (byAction.skip.length > 0) {
    console.log(`\n⏭️  SKIP (${byAction.skip.length}) - Already migrated`);
  }

  console.log('─'.repeat(80));

  // Dry run stops here
  if (dryRun) {
    console.log('\n✅ Dry run complete - use without --dry-run to execute migration');
    await prisma.$disconnect();
    process.exit(0);
  }

  // Confirm before executing
  if (!force) {
    console.log('\n⚠️  This will modify the database!');
    console.log('   Run with --dry-run to preview changes');
    console.log('   Run with --force to skip this confirmation\n');

    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    const answer = await new Promise<string>((resolve) => {
      rl.question('Continue with migration? (yes/no): ', resolve);
    });

    rl.close();

    if (answer.toLowerCase() !== 'yes') {
      console.log('\n❌ Migration cancelled');
      await prisma.$disconnect();
      process.exit(0);
    }
  }

  // Execute migration
  await executeMigration(plans);

  console.log('\n✅ Migration complete!');
  console.log('\nNext steps:');
  console.log('1. Verify role assignments in Admin → Role Management');
  console.log('2. Test permission checks in your application');
  console.log('3. Update code to use RBAC system (see RBAC-SYSTEM.md)');

  await prisma.$disconnect();
}

main()
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
