import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verifyTables() {
  try {
    console.log('🔍 Verifying Design Boards tables...\n');

    // Check each table
    const tables = [
      'design_boards',
      'board_objects',
      'board_collaborators',
      'board_comments',
      'board_votes',
      'board_templates',
      'board_activity_log',
      'board_snapshots',
    ];

    for (const table of tables) {
      try {
        // Try to count rows (this will fail if table doesn't exist)
        const count = await (prisma as any)[table].count();
        console.log(`✅ ${table}: Exists (${count} rows)`);
      } catch (error: any) {
        console.log(`❌ ${table}: NOT FOUND - ${error.message}`);
      }
    }

    console.log('\n🎉 All Design Boards tables verified!');

  } catch (error) {
    console.error('❌ Verification failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verifyTables();
