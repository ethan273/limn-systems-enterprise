import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import path from 'path';

// Load test environment
dotenv.config({ path: path.resolve(process.cwd(), '.env.test') });

const prisma = new PrismaClient();

async function checkTestUsers() {
  console.log('\n🔍 Checking test user roles in database...\n');

  const testUsers = [
    { email: process.env.ADMIN_EMAIL || 'admin@test.com', expectedRole: 'super_admin' },
    { email: process.env.USER_EMAIL || 'user@test.com', expectedRole: 'employee' }
  ];

  for (const testUser of testUsers) {
    console.log(`📧 Checking: ${testUser.email}`);
    console.log(`   Expected role: ${testUser.expectedRole}`);

    // First check if user exists in auth
    const authUser = await prisma.users.findUnique({
      where: { email: testUser.email }
    });

    if (!authUser) {
      console.log(`   ❌ User not found in users table`);
      continue;
    }

    console.log(`   ✅ Found in users table (id: ${authUser.id})`);

    // Check user_profiles for user_type
    const userProfile = await prisma.user_profiles.findUnique({
      where: { id: authUser.id },
      select: { user_type: true }
    });

    if (!userProfile) {
      console.log(`   ❌ No profile found in user_profiles table`);
      console.log(`   ⚠️  SECURITY ISSUE: User can authenticate but has no profile/role`);
    } else {
      console.log(`   Current role: ${userProfile.user_type}`);

      if (userProfile.user_type === testUser.expectedRole) {
        console.log(`   ✅ Role matches expected`);
      } else {
        console.log(`   ⚠️  MISMATCH: Expected ${testUser.expectedRole}, got ${userProfile.user_type}`);
        if (testUser.email === process.env.USER_EMAIL && userProfile.user_type === 'super_admin') {
          console.log(`   🚨 SECURITY HOLE: Regular test user has super_admin privileges!`);
        }
      }
    }
    console.log('');
  }

  await prisma.$disconnect();
}

checkTestUsers().catch(console.error);
