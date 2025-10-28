/**
 * Fix admin_security_events table constraint
 *
 * Problem: The admin_security_events table has a CHECK constraint that only allows
 * 6 specific event_type values: login, logout, password_reset, mfa_enabled,
 * suspicious_activity, permission_change
 *
 * But the RBAC system needs to log many more event types like:
 * - login_success (used by session tracking)
 * - session_expired
 * - unauthorized_access_attempt
 * - And many more RBAC-related events
 *
 * Solution: Drop the restrictive CHECK constraint to allow any event_type value.
 * This gives us flexibility while still maintaining type safety in the application code.
 *
 * Run with: npx tsx scripts/fix-admin-security-events-constraint.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔧 Fixing admin_security_events table constraint...\n');

  try {
    // Check if constraint exists
    console.log('1. Checking for existing constraint...');
    const constraints = await prisma.$queryRaw<Array<{ constraint_name: string }>>`
      SELECT constraint_name
      FROM information_schema.table_constraints
      WHERE table_schema = 'public'
        AND table_name = 'admin_security_events'
        AND constraint_type = 'CHECK'
        AND constraint_name = 'admin_security_events_event_type_check';
    `;

    if (constraints.length === 0) {
      console.log('   ✅ Constraint does not exist (already fixed or never created)\n');
    } else {
      console.log('   ⚠️  Found constraint: admin_security_events_event_type_check\n');

      // Drop the constraint
      console.log('2. Dropping restrictive event_type constraint...');
      await prisma.$executeRaw`
        ALTER TABLE public.admin_security_events
        DROP CONSTRAINT IF EXISTS admin_security_events_event_type_check;
      `;
      console.log('   ✅ Constraint dropped\n');
    }

    // Verify the constraint is gone
    console.log('3. Verifying constraint removal...');
    const remainingConstraints = await prisma.$queryRaw<Array<{ constraint_name: string; constraint_type: string }>>`
      SELECT constraint_name, constraint_type
      FROM information_schema.table_constraints
      WHERE table_schema = 'public'
        AND table_name = 'admin_security_events'
      ORDER BY constraint_name;
    `;

    console.log('   Current constraints on admin_security_events:');
    if (remainingConstraints.length === 0) {
      console.log('      (no constraints)');
    } else {
      remainingConstraints.forEach(c => {
        console.log(`      - ${c.constraint_name} (${c.constraint_type})`);
      });
    }

    console.log('\n✅ admin_security_events table constraint fixed!');
    console.log('\n📝 IMPORTANT: You must run this script on BOTH dev and prod databases:');
    console.log('   1. Dev database (current DATABASE_URL in .env)');
    console.log('   2. Prod database (switch DATABASE_URL to production)\n');

    console.log('Next steps:');
    console.log('   1. Run this script on production database');
    console.log('   2. Update session-service.ts to use correct event types');
    console.log('   3. Re-enable security event logging\n');

  } catch (error) {
    console.error('❌ Error fixing constraint:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
