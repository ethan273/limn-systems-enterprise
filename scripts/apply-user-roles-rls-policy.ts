/**
 * Apply RLS policy to user_roles table
 *
 * This script enables RLS on user_roles and creates a policy allowing users
 * to read their own roles. This is required for the middleware to properly
 * check admin access when using the anon key.
 *
 * Run with: npx tsx scripts/apply-user-roles-rls-policy.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔧 Applying RLS policy to user_roles table...\n');

  try {
    // Enable RLS on user_roles table
    console.log('1. Enabling Row Level Security on user_roles...');
    await prisma.$executeRaw`ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;`;
    console.log('   ✅ RLS enabled\n');

    // Drop existing policy if it exists (for idempotency)
    console.log('2. Dropping existing policy (if any)...');
    await prisma.$executeRaw`DROP POLICY IF EXISTS "Users can read their own roles" ON public.user_roles;`;
    console.log('   ✅ Old policy dropped\n');

    // Create policy: Users can read their own roles
    console.log('3. Creating new RLS policy...');
    await prisma.$executeRaw`
      CREATE POLICY "Users can read their own roles"
        ON public.user_roles
        FOR SELECT
        USING (auth.uid() = user_id);
    `;
    console.log('   ✅ Policy created\n');

    // Verify the policy was created
    console.log('4. Verifying policy...');
    const policies = await prisma.$queryRaw<Array<{ policyname: string; cmd: string }>>`
      SELECT policyname, cmd
      FROM pg_policies
      WHERE schemaname = 'public'
        AND tablename = 'user_roles'
      ORDER BY policyname;
    `;

    if (policies.length === 0) {
      console.log('   ⚠️  Warning: No policies found (this may be normal if RLS is not enforced)');
    } else {
      console.log('   ✅ Found policies:');
      policies.forEach(p => {
        console.log(`      - ${p.policyname} (${p.cmd})`);
      });
    }

    console.log('\n✅ RLS policy applied successfully!');
    console.log('\nNOTE: You must apply this to BOTH dev and prod databases.');
    console.log('      Run this script with DATABASE_URL pointing to each database.\n');

  } catch (error) {
    console.error('❌ Error applying RLS policy:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
