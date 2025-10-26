/**
 * Show Role Management Status
 *
 * Shows current state of users and roles for troubleshooting
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function showRoleStatus() {
  console.log('📊 Role Management Status\n');

  // Count users by type
  const usersByType = await prisma.user_profiles.groupBy({
    by: ['user_type'],
    _count: true,
  });

  console.log('Users by Type:');
  usersByType.forEach((group) => {
    console.log(`  ${group.user_type}: ${group._count}`);
  });
  console.log('');

  // Count users with roles assigned
  const usersWithRoles = await prisma.user_roles.findMany({
    include: {
      users: {
        select: {
          email: true,
        },
      },
    },
  });

  console.log(`Users with Roles Assigned: ${usersWithRoles.length}`);
  usersWithRoles.forEach((ur) => {
    console.log(`  ${ur.users?.email} → ${ur.role}`);
  });
  console.log('');

  // Count users without roles
  const allUsersCount = await prisma.user_profiles.count();
  const usersWithoutRoles = allUsersCount - usersWithRoles.length;

  console.log(`Users WITHOUT Roles: ${usersWithoutRoles}`);
  console.log('');

  // List employees without roles
  const employees = await prisma.user_profiles.findMany({
    where: {
      OR: [
        { user_type: 'employee' },
        { user_type: 'super_admin' },
        { email: { contains: '@limn' } },
      ],
    },
    select: {
      id: true,
      email: true,
      name: true,
      user_type: true,
    },
  });

  const employeeIds = employees.map((e) => e.id);
  const rolesForEmployees = await prisma.user_roles.findMany({
    where: {
      user_id: { in: employeeIds },
    },
  });

  const employeeIdsWithRoles = new Set(rolesForEmployees.map((r) => r.user_id));
  const employeesWithoutRoles = employees.filter((e) => !employeeIdsWithRoles.has(e.id));

  console.log(`Employees/Admins WITHOUT Roles: ${employeesWithoutRoles.length}`);
  employeesWithoutRoles.forEach((emp) => {
    console.log(`  ${emp.email} (${emp.name || 'No name'}) - ${emp.user_type}`);
  });
  console.log('');

  console.log('💡 To Fix:');
  console.log('1. Go to https://limn-systems-enterprise.vercel.app/admin/roles');
  console.log('2. Click "Assign Role" button');
  console.log('3. Select a user from the dropdown');
  console.log('4. Choose a role (admin, manager, developer, etc.)');
  console.log('5. Click "Assign Role" to save');
  console.log('');
  console.log('OR use SQL to bulk assign roles:');
  console.log('');
  employeesWithoutRoles.slice(0, 5).forEach((emp) => {
    console.log(
      `INSERT INTO user_roles (user_id, role, created_at, updated_at) VALUES ('${emp.id}', 'admin', NOW(), NOW());`
    );
  });
}

showRoleStatus()
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
