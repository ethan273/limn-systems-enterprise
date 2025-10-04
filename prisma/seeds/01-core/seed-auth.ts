/**
 * Phase 1: Core Authentication & Authorization Seeding
 *
 * Seeds:
 * - 15 Users (various roles and departments)
 * - User Roles (Admin, Manager, Designer, Sales, Production, Finance)
 *
 * Note: Users table is in auth.users schema (managed by Supabase Auth)
 * User roles are in public.user_roles schema
 */

import { PrismaClient } from '@prisma/client';
import { faker } from '@faker-js/faker';

const ROLES = ['admin', 'manager', 'designer', 'sales', 'production', 'finance', 'customer'];

/**
 * Seed core authentication and authorization data
 */
export async function seedCore(prisma: PrismaClient) {
  console.log('  → Creating users...');

  // Get existing users from Supabase Auth (auth.users)
  const existingUsers = await prisma.users.findMany({
    select: { id: true, email: true },
  });

  console.log(`  → Found ${existingUsers.length} existing users in auth.users`);

  // If no users exist, we can't seed without Supabase Auth API
  if (existingUsers.length === 0) {
    console.log('  ⚠️  No users found in auth.users schema');
    console.log('  ⚠️  Users must be created via Supabase Auth API, not direct DB insert');
    console.log('  ℹ️  Skipping user creation, only seeding roles for existing users');
    return;
  }

  // Seed user_roles for existing users
  console.log('  → Assigning roles to existing users...');

  const userRolesData = [];

  // Assign roles to existing users (first user gets admin, others get various roles)
  for (let i = 0; i < existingUsers.length; i++) {
    const user = existingUsers[i];
    if (!user) continue;

    // First user gets admin role
    if (i === 0) {
      userRolesData.push({
        user_id: user.id,
        role: 'admin',
      });
    } else {
      // Assign other roles in rotation
      const roleIndex = (i - 1) % (ROLES.length - 1); // Exclude 'admin'
      const role = ROLES[roleIndex + 1]; // Skip first role (admin)
      if (role) {
        userRolesData.push({
          user_id: user.id,
          role,
        });
      }
    }
  }

  // Upsert user_roles (handles duplicates via unique constraint)
  for (const roleData of userRolesData) {
    try {
      await prisma.user_roles.upsert({
        where: {
          user_id_role: {
            user_id: roleData.user_id,
            role: roleData.role,
          },
        },
        update: {},
        create: roleData,
      });
    } catch (error) {
      // Skip if role already exists
      console.log(`  ℹ️  Role '${roleData.role}' already exists for user ${roleData.user_id}`);
    }
  }

  console.log(`  ✅ Assigned ${userRolesData.length} roles to existing users`);

  // Display role distribution
  const roleCounts = await prisma.user_roles.groupBy({
    by: ['role'],
    _count: true,
  });

  console.log('  📊 Role Distribution:');
  for (const roleCount of roleCounts) {
    console.log(`     - ${roleCount.role}: ${roleCount._count} users`);
  }
}
