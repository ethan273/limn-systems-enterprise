import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createUserProfile() {
  const userId = '1032430e-54f1-4f86-98cd-fe3ab6a4781c';

  console.log('Creating user_profiles record for:', userId);

  try {
    // Check if user profile already exists
    const existing = await prisma.user_profiles.findUnique({
      where: { id: userId }
    });

    if (existing) {
      console.log('User profile already exists:', existing);

      // Update to super_admin if not already
      if (existing.user_type !== 'super_admin') {
        const updated = await prisma.user_profiles.update({
          where: { id: userId },
          data: { user_type: 'super_admin' }
        });
        console.log('\n✅ Updated user_type to super_admin:', updated);
      }

      await prisma.$disconnect();
      return;
    }

    // Create user_profiles record
    const userProfile = await prisma.user_profiles.create({
      data: {
        id: userId,
        email: 'dev-admin@limn.us.com',
        name: 'Development Admin User',
        user_type: 'super_admin', // Grant super_admin access
        department: 'Administration',
        avatar_url: null,
        created_at: new Date(),
      }
    });

    console.log('\n✅ User profile created successfully:');
    console.log(JSON.stringify(userProfile, null, 2));
  } catch (error) {
    console.error('Error creating user profile:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

createUserProfile().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
