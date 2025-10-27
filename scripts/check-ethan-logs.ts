import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Get ethan@limn.us.com logs
  const logs = await prisma.admin_audit_log.findMany({
    where: {
      user_email: 'ethan@limn.us.com',
    },
    orderBy: { created_at: 'desc' },
    take: 10,
  });

  console.log('Ethan\'s logs:');
  console.log(JSON.stringify(logs, null, 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
