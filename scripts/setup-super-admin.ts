/**
 * Set up super admin user
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const email = 'ethan@limn.us.com';

  console.log(`Setting up ${email} as super_admin...`);

  // 1. Find user by email
  const userProfile = await prisma.user_profiles.findFirst({
    where: { email },
  });

  if (!userProfile) {
    console.error(`❌ User not found: ${email}`);
    console.log(`\nPlease log in first to create your account, then run this script again.`);
    return;
  }

  // 2. Update user_type
  const updatedProfile = await prisma.user_profiles.update({
    where: { id: userProfile.id },
    data: { user_type: 'super_admin' },
  });

  console.log(`✅ Updated user_type to super_admin for ${email}`);
  console.log(`   User ID: ${updatedProfile.id}`);

  // 3. Ensure role exists in user_roles table
  const existingRole = await prisma.user_roles.findFirst({
    where: {
      user_id: updatedProfile.id,
      role: 'super_admin',
    },
  });

  if (existingRole) {
    console.log(`✅ super_admin role already exists`);
  } else {
    // Create new role
    await prisma.user_roles.create({
      data: {
        user_id: updatedProfile.id,
        role: 'super_admin',
      },
    });
    console.log(`✅ Created super_admin role in user_roles table`);
  }

  // 4. Verify
  const roles = await prisma.user_roles.findMany({
    where: { user_id: updatedProfile.id },
  });

  console.log(`\n✅ Setup complete!`);
  console.log(`   Email: ${email}`);
  console.log(`   User Type: ${updatedProfile.user_type}`);
  console.log(`   Active Roles: ${roles.map(r => r.role).join(', ')}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
