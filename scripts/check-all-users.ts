import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user_profiles.findMany({
    orderBy: { created_at: 'desc' },
  });

  console.log('Total users:', users.length);
  console.log('\nBreakdown by domain:');

  const limnUsers = users.filter(u => u.email?.endsWith('@limn.us.com'));
  const otherUsers = users.filter(u => !u.email || !u.email.endsWith('@limn.us.com'));

  console.log('@limn.us.com users:', limnUsers.length);
  console.log('Other users:', otherUsers.length);

  console.log('\n@limn.us.com users:');
  limnUsers.forEach(u => console.log('  -', u.email));

  console.log('\nOther users:');
  otherUsers.forEach(u => console.log('  -', u.email || '(no email)'));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
