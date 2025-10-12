import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkUser() {
  const userId = '1032430e-54f1-4f86-98cd-fe3ab6a4781c';

  const user = await prisma.user_profiles.findUnique({
    where: { id: userId }
  });

  console.log('User found:', JSON.stringify(user, null, 2));

  // Also check if this user exists in Supabase auth
  console.log('\nUser ID being checked:', userId);

  await prisma.$disconnect();
}

checkUser().catch(console.error);
