import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkTestUser() {
  console.log('Checking test user permissions...\n');

  // Check regular-user@limn.us.com (the actual test user based on session files)
  const regularUser = await prisma.user_profiles.findFirst({
    where: { email: 'regular-user@limn.us.com' },
    select: { id: true, email: true, user_type: true, full_name: true }
  });
  console.log('Test User (regular-user@limn.us.com):', regularUser);

  // Check user@test.com (alternate possibility)
  const userAlt = await prisma.user_profiles.findFirst({
    where: { email: 'user@test.com' },
    select: { id: true, email: true, user_type: true, full_name: true }
  });
  console.log('Test User (user@test.com):', userAlt);

  // Check dev-user@limn.us.com (admin user)
  const devUser = await prisma.user_profiles.findFirst({
    where: { email: 'dev-user@limn.us.com' },
    select: { id: true, email: true, user_type: true, full_name: true }
  });
  console.log('Dev User (dev-user@limn.us.com):', devUser);

  await prisma.$disconnect();
}

checkTestUser().catch(console.error);
