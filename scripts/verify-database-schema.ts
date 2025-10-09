import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verifySchema() {
  console.log('🔍 Verifying actual Supabase database schema...\n');

  // Test 1: Check contacts table structure
  console.log('1. Checking contacts table:');
  try {
    const result = await prisma.$queryRaw`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_schema = 'public'
      AND table_name = 'contacts'
      ORDER BY ordinal_position;
    `;
    console.log('   ✅ Contacts columns:', result);
  } catch (e: any) {
    console.log('   ❌ Error:', e.message);
  }

  // Test 2: Check if leads table exists
  console.log('\n2. Checking leads table:');
  try {
    const result = await prisma.$queryRaw`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_schema = 'public'
      AND table_name = 'leads'
      ORDER BY ordinal_position
      LIMIT 5;
    `;
    console.log('   ✅ Leads table exists with columns:', result);
  } catch (e: any) {
    console.log('   ❌ Error:', e.message);
  }

  // Test 3: Check partners table structure
  console.log('\n3. Checking partners table:');
  try {
    const result = await prisma.$queryRaw`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_schema = 'public'
      AND table_name = 'partners'
      ORDER BY ordinal_position;
    `;
    console.log('   ✅ Partners columns:', result);
  } catch (e: any) {
    console.log('   ❌ Error:', e.message);
  }

  // Test 4: Check invoice_items table
  console.log('\n4. Checking invoice_items table:');
  try {
    const result = await prisma.$queryRaw`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_schema = 'public'
      AND table_name = 'invoice_items'
      ORDER BY ordinal_position;
    `;
    console.log('   ✅ Invoice items columns:', result);
  } catch (e: any) {
    console.log('   ❌ Error:', e.message);
  }

  // Test 5: List all public schema tables
  console.log('\n5. All tables in public schema:');
  try {
    const result = await prisma.$queryRaw`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name;
    ` as any[];
    console.log(`   ✅ Total tables: ${result.length}`);
    console.log(`   First 20 tables: ${result.slice(0, 20).map((r: any) => r.table_name).join(', ')}`);
  } catch (e: any) {
    console.log('   ❌ Error:', e.message);
  }

  await prisma.$disconnect();
}

verifySchema().catch(console.error);
