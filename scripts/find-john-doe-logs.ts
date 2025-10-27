import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const allLogs = await prisma.admin_audit_log.findMany({
    orderBy: { created_at: 'desc' },
  });

  console.log('Searching for john.doe in all logs...\n');

  const matchingLogs = allLogs.filter(log => {
    const metadataStr = JSON.stringify(log.metadata || {});
    return metadataStr.includes('john.doe') ||
           metadataStr.includes('jane.smith') ||
           (log.user_email && (log.user_email.includes('john.doe') || log.user_email.includes('jane.smith')));
  });

  console.log(`Found ${matchingLogs.length} logs with john.doe or jane.smith\n`);

  matchingLogs.forEach(log => {
    console.log('═══════════════════════════════════════════════');
    console.log('ID:', log.id);
    console.log('Created:', log.created_at.toISOString());
    console.log('Action:', log.action);
    console.log('User:', log.user_email || '—');
    console.log('Resource Type:', log.resource_type || '—');
    console.log('Resource ID:', log.resource_id || '—');
    console.log('Metadata:', JSON.stringify(log.metadata, null, 2));
    console.log('');
  });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
