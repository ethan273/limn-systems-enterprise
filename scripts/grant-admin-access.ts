import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function grantAdminAccess() {
  const userId = 'd12589a7-402b-446b-8853-32418b08f2fd';

  // Check current user
  const currentUser = await prisma.user_profiles.findUnique({
    where: { id: userId },
    select: {
      id: true,
      full_name: true,
      email: true,
      user_type: true
    }
  });

  console.log('Current User Profile:');
  console.log(JSON.stringify(currentUser, null, 2));

  // Update user_type to super_admin
  const updated = await prisma.user_profiles.update({
    where: { id: userId },
    data: { user_type: 'super_admin' },
    select: {
      id: true,
      full_name: true,
      email: true,
      user_type: true
    }
  });

  console.log('\n✅ User updated to super_admin:');
  console.log(JSON.stringify(updated, null, 2));

  await prisma.$disconnect();
}

grantAdminAccess().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});
