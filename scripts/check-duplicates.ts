#!/usr/bin/env tsx
/**
 * Check for Duplicate Material Codes
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔍 Checking for duplicate material codes...\n');

  // Find duplicate codes
  const duplicates = await prisma.$queryRaw<{ code: string; count: bigint }[]>`
    SELECT code, COUNT(*) as count
    FROM materials
    WHERE code IS NOT NULL
    GROUP BY code
    HAVING COUNT(*) > 1
    ORDER BY count DESC, code
  `;

  if (duplicates.length === 0) {
    console.log('✅ No duplicate codes found!');
  } else {
    console.log(`⚠️  Found ${duplicates.length} duplicate codes:\n`);
    for (const dup of duplicates) {
      console.log(`   ${dup.code}: ${dup.count} materials`);

      // Show the materials with this code
      const materials = await prisma.materials.findMany({
        where: { code: dup.code },
        select: { id: true, name: true, created_at: true },
        orderBy: { created_at: 'desc' },
      });

      materials.forEach(m => {
        console.log(`      - ${m.name} (${m.id.substring(0, 8)}...) created ${m.created_at?.toISOString()}`);
      });
      console.log('');
    }
  }

  // Get total count
  const total = await prisma.materials.count();
  console.log(`\n📊 Total materials: ${total}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
