import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixDuplicates() {
  console.log('🔧 Fixing duplicate emails in contacts...');
  
  // Get all duplicate emails
  const contactDupes = await prisma.$queryRaw<{email: string}[]>`
    SELECT email 
    FROM contacts 
    WHERE email IS NOT NULL 
    GROUP BY email 
    HAVING COUNT(*) > 1
  `;
  
  for (const { email } of contactDupes) {
    // Keep only the oldest record, delete the rest
    const records = await prisma.contacts.findMany({
      where: { email },
      orderBy: { created_at: 'asc' },
    });
    
    if (records.length > 1) {
      const toDelete = records.slice(1);  // Delete all except first
      for (const record of toDelete) {
        await prisma.contacts.delete({ where: { id: record.id } });
        console.log(`  Deleted duplicate contact: ${email} (id: ${record.id})`);
      }
    }
  }
  
  console.log(`✅ Fixed ${contactDupes.length} duplicate emails in contacts\n`);

  console.log('🔧 Fixing duplicate emails in clients...');
  
  const clientDupes = await prisma.$queryRaw<{email: string}[]>`
    SELECT email 
    FROM clients 
    WHERE email IS NOT NULL 
    GROUP BY email 
    HAVING COUNT(*) > 1
  `;
  
  for (const { email } of clientDupes) {
    const records = await prisma.clients.findMany({
      where: { email },
      orderBy: { created_at: 'asc' },
    });
    
    if (records.length > 1) {
      const toDelete = records.slice(1);
      for (const record of toDelete) {
        await prisma.clients.delete({ where: { id: record.id } });
        console.log(`  Deleted duplicate client: ${email} (id: ${record.id})`);
      }
    }
  }
  
  console.log(`✅ Fixed ${clientDupes.length} duplicate emails in clients\n`);
  console.log('🎉 All duplicates resolved!');
  
  await prisma.$disconnect();
}

fixDuplicates().catch(console.error);
