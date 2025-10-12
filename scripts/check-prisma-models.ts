import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Get all model names from Prisma Client
const models = Object.keys(prisma).filter(k => !k.startsWith('_') && !k.startsWith('$'));

console.log('\n=== Available Prisma Models ===');
console.log(`Total: ${models.length}`);
console.log(models.sort().join(', '));

// Check specifically for design_boards
const hasDesignBoards = models.includes('design_boards');
console.log(`\n✓ Has design_boards model: ${hasDesignBoards ? 'YES' : 'NO'}`);

if (!hasDesignBoards) {
  console.log('\n⚠️  WARNING: design_boards model not found in Prisma Client!');
  console.log('   This means Prisma Client was not regenerated after adding the model to schema.prisma');
  console.log('   Run: npx prisma generate');
}

process.exit(0);
