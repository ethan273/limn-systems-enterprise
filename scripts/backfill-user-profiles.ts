/**
 * Backfill User Profiles
 *
 * Creates user_profiles records for users who authenticated but don't have profiles
 * This fixes the issue where auth callback provisioning is failing silently
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function backfillUserProfiles() {
  console.log('🔄 Starting user profile backfill...\n');

  try {
    // Get all auth.users who don't have user_profiles
    const result = await prisma.$queryRaw<Array<{
      id: string;
      email: string;
      created_at: Date;
      raw_user_meta_data: any;
    }>>`
      SELECT au.id, au.email, au.created_at, au.raw_user_meta_data
      FROM auth.users au
      LEFT JOIN user_profiles up ON au.id = up.id
      WHERE up.id IS NULL
        AND au.email IS NOT NULL
        AND au.created_at > '2025-10-01'
      ORDER BY au.created_at ASC
    `;

    console.log(`Found ${result.length} users without profiles\n`);

    if (result.length === 0) {
      console.log('✅ All users have profiles - no backfill needed');
      return;
    }

    let created = 0;
    let skipped = 0;

    for (const user of result) {
      const email = user.email;

      // Skip test accounts from automated tests
      if (email.includes('test-') && email.includes('@test.com')) {
        console.log(`⏭️  Skipping test account: ${email}`);
        skipped++;
        continue;
      }

      // Determine user_type based on email domain
      let userType: 'super_admin' | 'employee' | 'customer' | 'contractor' | 'designer' | 'manufacturer' | 'finance' = 'customer';

      if (email.endsWith('@limn.us.com') || email.endsWith('@limnsystems.com')) {
        userType = 'employee';
      }

      // Get name from metadata or derive from email
      const metadata = user.raw_user_meta_data;
      const userName = metadata?.full_name
        || metadata?.name
        || email.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase());

      const avatarUrl = metadata?.avatar_url || null;

      try {
        // Create user profile
        await prisma.user_profiles.create({
          data: {
            id: user.id,
            email,
            first_name: userName.split(' ')[0],
            last_name: userName.split(' ').length > 1 ? userName.split(' ').slice(1).join(' ') : undefined,
            name: userName,
            user_type: userType,
            department: 'General',
            avatar_url: avatarUrl,
            created_at: new Date(),
          },
        });

        console.log(`✅ Created profile: ${email} (${userType})`);
        created++;
      } catch (error) {
        console.error(`❌ Failed to create profile for ${email}:`, error);
      }
    }

    console.log(`\n📊 Backfill Summary:`);
    console.log(`   Created: ${created}`);
    console.log(`   Skipped: ${skipped}`);
    console.log(`   Total processed: ${result.length}`);
    console.log(`\n✅ Backfill complete!`);

  } catch (error) {
    console.error('❌ Backfill failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

backfillUserProfiles()
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
