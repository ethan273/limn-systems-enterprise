/**
 * Fix Admin User Type in Production
 * Updates the main development user to have super_admin access
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixAdminUserType() {
  console.log('🔍 Checking user types in production database...\n');

  try {
    // Get all user profiles to find development/admin users
    const users = await prisma.user_profiles.findMany({
      select: {
        id: true,
        email: true,
        full_name: true,
        user_type: true,
      },
      orderBy: {
        created_at: 'asc',
      },
    });

    console.log(`Found ${users.length} users:\n`);
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.full_name || 'No Name'} (${user.email})`);
      console.log(`   ID: ${user.id}`);
      console.log(`   User Type: ${user.user_type || 'NOT SET'}\n`);
    });

    // Find users that should be super_admin
    const devUsers = users.filter(u =>
      u.email?.includes('dev-user') ||
      u.email?.includes('@limn.') ||
      u.full_name?.toLowerCase().includes('development') ||
      u.full_name?.toLowerCase().includes('admin')
    );

    if (devUsers.length === 0) {
      console.log('⚠️  No development/admin users found. Please manually update user_type to super_admin.\n');
      return;
    }

    console.log(`\n📋 Found ${devUsers.length} potential admin user(s):\n`);
    devUsers.forEach(user => {
      console.log(`- ${user.full_name} (${user.email}) - Current type: ${user.user_type || 'NOT SET'}`);
    });

    // Update all dev users to super_admin
    console.log('\n🔧 Updating user types to super_admin...\n');

    for (const devUser of devUsers) {
      if (devUser.user_type === 'super_admin') {
        console.log(`✅ ${devUser.email} already has super_admin access - skipping`);
        continue;
      }

      const updated = await prisma.user_profiles.update({
        where: { id: devUser.id },
        data: { user_type: 'super_admin' },
      });

      console.log(`✅ Updated ${devUser.email}: ${devUser.user_type || 'NOT SET'} → super_admin`);
    }

    console.log('\n✨ Admin user type fix complete!\n');
    console.log('📝 Note: Admin navigation links should now work in production.\n');
    console.log('🔄 If running in development, restart the dev server for changes to take effect.\n');

  } catch (error) {
    console.error('❌ Failed to fix admin user type:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

fixAdminUserType();
