import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkDuplicates() {
  console.log('✓ Checking for duplicate emails in contacts...');
  const contactDupes = await prisma.$queryRaw<{email: string, count: bigint}[]>`
    SELECT email, COUNT(*) as count 
    FROM contacts 
    WHERE email IS NOT NULL 
    GROUP BY email 
    HAVING COUNT(*) > 1
  `;
  console.log(`  Found ${contactDupes.length} duplicate emails in contacts`);

  console.log('\n✓ Checking for duplicate emails in clients...');
  const clientDupes = await prisma.$queryRaw<{email: string, count: bigint}[]>`
    SELECT email, COUNT(*) as count 
    FROM clients 
    WHERE email IS NOT NULL 
    GROUP BY email 
    HAVING COUNT(*) > 1
  `;
  console.log(`  Found ${clientDupes.length} duplicate emails in clients`);

  console.log('\n✓ Checking for duplicate names in task_templates...');
  const taskTemplateDupes = await prisma.$queryRaw<{name: string, count: bigint}[]>`
    SELECT name, COUNT(*) as count 
    FROM task_templates 
    GROUP BY name 
    HAVING COUNT(*) > 1
  `;
  console.log(`  Found ${taskTemplateDupes.length} duplicate names in task_templates`);

  console.log('\n✓ Checking for duplicate partner_codes in partners...');
  const partnerDupes = await prisma.$queryRaw<{partner_code: string, count: bigint}[]>`
    SELECT partner_code, COUNT(*) as count 
    FROM partners 
    WHERE partner_code IS NOT NULL 
    GROUP BY partner_code 
    HAVING COUNT(*) > 1
  `;
  console.log(`  Found ${partnerDupes.length} duplicate partner_codes in partners`);

  await prisma.$disconnect();
  
  const totalDupes = contactDupes.length + clientDupes.length + taskTemplateDupes.length + partnerDupes.length;
  if (totalDupes === 0) {
    console.log('\n✅ NO DUPLICATES FOUND - Safe to add unique constraints!');
  } else {
    console.log(`\n⚠️  FOUND ${totalDupes} DUPLICATE ISSUES - Need to resolve before adding unique constraints`);
  }
}

checkDuplicates().catch(console.error);
