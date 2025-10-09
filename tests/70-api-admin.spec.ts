/**
 * API TESTING: ADMIN ROUTER
 *
 * Tests tRPC procedures for authorization, validation, and database integrity:
 * - admin.users.* procedures (list, get, update)
 * - admin.permissions.* procedures (getUserPermissions, updateUserPermission, bulkUpdatePermissions, resetToDefaults)
 * - admin.settings.* procedures (getAll, getByCategory, update, delete)
 * - admin.roles.* procedures (getUserRoles, assignRole, removeRole, getUsersByRole, getRoleStats)
 * - admin.portalModules.* procedures (getSettings, updateSettings, getAvailableModules)
 */

import { test, expect } from '@playwright/test';
import { appRouter } from '@/server/api/root';
import { createContext } from '@/server/api/trpc/context';
import { PrismaClient } from '@prisma/client';
import type { Session, User } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Create tRPC context with specific user
 */
async function createTestContext(userType: 'admin' | 'employee' | 'customer' = 'admin'): Promise<any> {
  // Create mock user based on type
  const mockUser: User = {
    id: `test-${userType}-${Date.now()}`,
    email: userType === 'admin' ? `admin-${Date.now()}@limn.us.com` : `${userType}@test.com`,
    app_metadata: {
      role: userType === 'admin' ? 'admin' : userType,
    },
    user_metadata: {},
    aud: 'authenticated',
    created_at: new Date().toISOString(),
  } as any;

  // Create mock session
  const mockSession: Session = {
    user: mockUser,
    access_token: 'mock-token',
    refresh_token: 'mock-refresh',
    expires_at: Date.now() + 3600000,
    expires_in: 3600,
    token_type: 'bearer',
  };

  return await createContext({ session: mockSession });
}

/**
 * Create tRPC caller with specific user type
 */
async function createCaller(userType: 'admin' | 'employee' | 'customer' = 'admin') {
  const ctx = await createTestContext(userType);
  return appRouter.createCaller(ctx);
}

test.afterAll(async () => {
  await prisma.$disconnect();
});

// ============================================
// ADMIN.USERS.* TESTS
// ============================================

test.describe('API - Admin Router - Users', () => {
  test('should list users successfully', async () => {
    const caller = await createCaller('admin');

    const result = await caller.admin.users.list({
      limit: 10,
      offset: 0,
    });

    expect(result).toBeDefined();
    expect(Array.isArray(result.users)).toBe(true);
    expect(typeof result.total).toBe('number');
    expect(typeof result.hasMore).toBe('boolean');
  });

  test('should list users with search filter', async () => {
    const caller = await createCaller('admin');

    const result = await caller.admin.users.list({
      search: 'test',
      limit: 10,
      offset: 0,
    });

    expect(result).toBeDefined();
    expect(Array.isArray(result.users)).toBe(true);
  });

  test('should get single user by ID', async () => {
    const caller = await createCaller('admin');

    // First, get a user from the list
    const list = await caller.admin.users.list({ limit: 1, offset: 0 });
    if (list.users.length === 0) {
      test.skip();
      return;
    }

    const userId = list.users[0].id;
    const user = await caller.admin.users.get({ userId });

    expect(user).toBeDefined();
    expect(user.id).toBe(userId);
    expect(user.email).toBeDefined();
  });

  test('should validate input schema - reject invalid UUID', async () => {
    const caller = await createCaller('admin');

    try {
      await caller.admin.users.get({ userId: 'invalid-uuid' });
      expect(true).toBe(false); // Should not reach here
    } catch (error: any) {
      expect(error.message).toContain('Invalid uuid');
    }
  });

  test('should return error for non-existent user', async () => {
    const caller = await createCaller('admin');

    try {
      await caller.admin.users.get({
        userId: '00000000-0000-0000-0000-000000000000',
      });
      expect(true).toBe(false);
    } catch (error: any) {
      expect(error.message).toContain('User not found');
    }
  });

  test('should update user profile', async () => {
    const caller = await createCaller('admin');

    // Create a test user profile
    const testUser = await prisma.users.create({
      data: {
        id: uuidv4(),
        email: `test-update-${Date.now()}@example.com`,
      },
    });

    await prisma.user_profiles.create({
      data: {
        id: testUser.id,
        user_type: 'employee',
        name: 'Original Name',
      },
    });

    // Update via API
    const result = await caller.admin.users.update({
      userId: testUser.id,
      data: {
        title: 'Senior Engineer',
        department: 'Engineering',
      },
    });

    expect(result.success).toBe(true);

    // Verify in database
    const updated = await prisma.user_profiles.findUnique({
      where: { id: testUser.id },
    });

    expect(updated?.title).toBe('Senior Engineer');
    expect(updated?.department).toBe('Engineering');

    // Cleanup
    await prisma.user_profiles.delete({ where: { id: testUser.id } });
    await prisma.users.delete({ where: { id: testUser.id } });
  });

  test('should create user with placeholder error', async () => {
    const caller = await createCaller('admin');

    try {
      await caller.admin.users.create({
        email: 'newuser@test.com',
        userType: 'employee',
      });
      expect(true).toBe(false);
    } catch (error: any) {
      expect(error.message).toContain('Supabase Admin API integration');
    }
  });
});

// ============================================
// ADMIN.PERMISSIONS.* TESTS
// ============================================

test.describe('API - Admin Router - Permissions', () => {
  test('should get user permissions with defaults', async () => {
    const caller = await createCaller('admin');

    // Create test user
    const testUser = await prisma.users.create({
      data: {
        id: uuidv4(),
        email: `test-perms-${Date.now()}@example.com`,
      },
    });

    await prisma.user_profiles.create({
      data: {
        id: testUser.id,
        user_type: 'employee',
      },
    });

    const permissions = await caller.admin.permissions.getUserPermissions({
      userId: testUser.id,
    });

    expect(Array.isArray(permissions)).toBe(true);
    // Should have default permissions for employee user type
    expect(permissions.length).toBeGreaterThan(0);

    // Cleanup
    await prisma.user_profiles.delete({ where: { id: testUser.id } });
    await prisma.users.delete({ where: { id: testUser.id } });
  });

  test('should update single permission', async () => {
    const caller = await createCaller('admin');

    // Create test user
    const testUser = await prisma.users.create({
      data: {
        id: uuidv4(),
        email: `test-perm-update-${Date.now()}@example.com`,
      },
    });

    await prisma.user_profiles.create({
      data: {
        id: testUser.id,
        user_type: 'employee',
      },
    });

    // Update permission
    const result = await caller.admin.permissions.updateUserPermission({
      userId: testUser.id,
      module: 'crm',
      permission: 'can_edit',
      value: true,
    });

    expect(result.success).toBe(true);

    // Verify in database
    const perm = await prisma.user_permissions.findUnique({
      where: {
        user_id_module: {
          user_id: testUser.id,
          module: 'crm',
        },
      },
    });

    expect(perm?.can_edit).toBe(true);

    // Cleanup
    await prisma.user_permissions.deleteMany({ where: { user_id: testUser.id } });
    await prisma.user_profiles.delete({ where: { id: testUser.id } });
    await prisma.users.delete({ where: { id: testUser.id } });
  });

  test('should bulk update permissions', async () => {
    const caller = await createCaller('admin');

    // Create test user
    const testUser = await prisma.users.create({
      data: {
        id: uuidv4(),
        email: `test-bulk-${Date.now()}@example.com`,
      },
    });

    await prisma.user_profiles.create({
      data: {
        id: testUser.id,
        user_type: 'employee',
      },
    });

    // Bulk update
    const result = await caller.admin.permissions.bulkUpdatePermissions({
      userId: testUser.id,
      module: 'products',
      permissions: {
        canView: true,
        canCreate: true,
        canEdit: false,
        canDelete: false,
      },
    });

    expect(result.success).toBe(true);

    // Verify
    const perm = await prisma.user_permissions.findUnique({
      where: {
        user_id_module: {
          user_id: testUser.id,
          module: 'products',
        },
      },
    });

    expect(perm?.can_view).toBe(true);
    expect(perm?.can_create).toBe(true);
    expect(perm?.can_edit).toBe(false);

    // Cleanup
    await prisma.user_permissions.deleteMany({ where: { user_id: testUser.id } });
    await prisma.user_profiles.delete({ where: { id: testUser.id } });
    await prisma.users.delete({ where: { id: testUser.id } });
  });

  test('should get default permissions for user type', async () => {
    const caller = await createCaller('admin');

    const permissions = await caller.admin.permissions.getDefaultPermissions({
      userType: 'employee',
    });

    expect(Array.isArray(permissions)).toBe(true);
    expect(permissions.length).toBeGreaterThan(0);

    // Verify structure
    if (permissions.length > 0) {
      expect(permissions[0]).toHaveProperty('module');
      expect(permissions[0]).toHaveProperty('canView');
      expect(permissions[0]).toHaveProperty('canCreate');
    }
  });

  test('should reset permissions to defaults', async () => {
    const caller = await createCaller('admin');

    // Create test user with custom permissions
    const testUser = await prisma.users.create({
      data: {
        id: uuidv4(),
        email: `test-reset-${Date.now()}@example.com`,
      },
    });

    await prisma.user_profiles.create({
      data: {
        id: testUser.id,
        user_type: 'employee',
      },
    });

    await prisma.user_permissions.create({
      data: {
        user_id: testUser.id,
        module: 'crm',
        can_view: true,
        can_create: true,
      },
    });

    // Reset to defaults
    const result = await caller.admin.permissions.resetToDefaults({
      userId: testUser.id,
    });

    expect(result.success).toBe(true);

    // Verify all custom permissions deleted
    const remaining = await prisma.user_permissions.findMany({
      where: { user_id: testUser.id },
    });

    expect(remaining.length).toBe(0);

    // Cleanup
    await prisma.user_profiles.delete({ where: { id: testUser.id } });
    await prisma.users.delete({ where: { id: testUser.id } });
  });
});

// ============================================
// ADMIN.SETTINGS.* TESTS
// ============================================

test.describe('API - Admin Router - Settings', () => {
  test('should get all settings grouped by category', async () => {
    const caller = await createCaller('admin');

    const settings = await caller.admin.settings.getAll();

    expect(settings).toBeDefined();
    expect(typeof settings).toBe('object');
  });

  test('should get settings by category', async () => {
    const caller = await createCaller('admin');

    // Create test setting
    await prisma.admin_settings.create({
      data: {
        category: `test-category-${Date.now()}`,
        key: 'test-key',
        value: { test: true },
      },
    });

    const settings = await caller.admin.settings.getByCategory({
      category: `test-category-${Date.now()}`,
    });

    expect(Array.isArray(settings)).toBe(true);

    // Cleanup
    await prisma.admin_settings.deleteMany({
      where: { category: { startsWith: 'test-category-' } },
    });
  });

  test('should create/update setting', async () => {
    const caller = await createCaller('admin');

    const testKey = `test-setting-${Date.now()}`;

    const result = await caller.admin.settings.update({
      category: 'test',
      key: testKey,
      value: { enabled: true },
    });

    expect(result.success).toBe(true);

    // Verify in database
    const setting = await prisma.admin_settings.findUnique({
      where: {
        category_key: {
          category: 'test',
          key: testKey,
        },
      },
    });

    expect(setting).toBeDefined();
    expect(setting?.value).toEqual({ enabled: true });

    // Cleanup
    await prisma.admin_settings.delete({
      where: {
        category_key: {
          category: 'test',
          key: testKey,
        },
      },
    });
  });

  test('should delete setting', async () => {
    const caller = await createCaller('admin');

    const testKey = `test-delete-${Date.now()}`;

    // Create setting
    await prisma.admin_settings.create({
      data: {
        category: 'test',
        key: testKey,
        value: {},
      },
    });

    // Delete via API
    const result = await caller.admin.settings.delete({
      category: 'test',
      key: testKey,
    });

    expect(result.success).toBe(true);

    // Verify deleted
    const setting = await prisma.admin_settings.findUnique({
      where: {
        category_key: {
          category: 'test',
          key: testKey,
        },
      },
    });

    expect(setting).toBeNull();
  });
});

// ============================================
// ADMIN.ROLES.* TESTS
// ============================================

test.describe('API - Admin Router - Roles', () => {
  test('should get user roles', async () => {
    const caller = await createCaller('admin');

    // Create test user
    const testUser = await prisma.users.create({
      data: {
        id: uuidv4(),
        email: `test-roles-${Date.now()}@example.com`,
      },
    });

    const roles = await caller.admin.roles.getUserRoles({
      userId: testUser.id,
    });

    expect(Array.isArray(roles)).toBe(true);

    // Cleanup
    await prisma.users.delete({ where: { id: testUser.id } });
  });

  test('should assign role to user', async () => {
    const caller = await createCaller('admin');

    // Create test user
    const testUser = await prisma.users.create({
      data: {
        id: uuidv4(),
        email: `test-assign-role-${Date.now()}@example.com`,
      },
    });

    const result = await caller.admin.roles.assignRole({
      userId: testUser.id,
      role: 'admin',
    });

    expect(result.success).toBe(true);

    // Verify in database
    const role = await prisma.user_roles.findFirst({
      where: {
        user_id: testUser.id,
        role: 'admin',
      },
    });

    expect(role).toBeDefined();

    // Cleanup
    await prisma.user_roles.deleteMany({ where: { user_id: testUser.id } });
    await prisma.users.delete({ where: { id: testUser.id } });
  });

  test('should remove role from user', async () => {
    const caller = await createCaller('admin');

    // Create test user with role
    const testUser = await prisma.users.create({
      data: {
        id: uuidv4(),
        email: `test-remove-role-${Date.now()}@example.com`,
      },
    });

    await prisma.user_roles.create({
      data: {
        user_id: testUser.id,
        role: 'admin',
      },
    });

    // Remove via API
    const result = await caller.admin.roles.removeRole({
      userId: testUser.id,
      role: 'admin',
    });

    expect(result.success).toBe(true);

    // Verify removed
    const role = await prisma.user_roles.findFirst({
      where: {
        user_id: testUser.id,
        role: 'admin',
      },
    });

    expect(role).toBeNull();

    // Cleanup
    await prisma.users.delete({ where: { id: testUser.id } });
  });

  test('should get users by role', async () => {
    const caller = await createCaller('admin');

    const users = await caller.admin.roles.getUsersByRole({
      role: 'admin',
    });

    expect(Array.isArray(users)).toBe(true);
  });

  test('should get role statistics', async () => {
    const caller = await createCaller('admin');

    const stats = await caller.admin.roles.getRoleStats();

    expect(Array.isArray(stats)).toBe(true);
  });

  test('should get all portal users', async () => {
    const caller = await createCaller('admin');

    const portalUsers = await caller.admin.roles.getAllPortalUsers();

    expect(Array.isArray(portalUsers)).toBe(true);
  });
});

// ============================================
// ADMIN.PORTAL_MODULES.* TESTS
// ============================================

test.describe('API - Admin Router - Portal Modules', () => {
  test('should get portal module settings', async () => {
    const caller = await createCaller('admin');

    const settings = await caller.admin.portalModules.getSettings({
      portalType: 'customer',
    });

    expect(Array.isArray(settings)).toBe(true);
  });

  test('should update portal module settings', async () => {
    const caller = await createCaller('admin');

    const result = await caller.admin.portalModules.updateSettings({
      portalType: 'customer',
      modules: [
        {
          moduleKey: 'orders',
          isEnabled: true,
          permissions: { canView: true },
        },
      ],
    });

    expect(result.success).toBe(true);
  });

  test('should get available modules for portal type', async () => {
    const caller = await createCaller('admin');

    const modules = await caller.admin.portalModules.getAvailableModules({
      portalType: 'customer',
    });

    expect(Array.isArray(modules)).toBe(true);
    expect(modules.length).toBeGreaterThan(0);

    // Verify structure
    if (modules.length > 0) {
      expect(modules[0]).toHaveProperty('key');
      expect(modules[0]).toHaveProperty('label');
      expect(modules[0]).toHaveProperty('alwaysVisible');
    }
  });

  test('should get customers for portal configuration', async () => {
    const caller = await createCaller('admin');

    const customers = await caller.admin.portalModules.getCustomers();

    expect(Array.isArray(customers)).toBe(true);
  });

  test('should get partners for portal configuration', async () => {
    const caller = await createCaller('admin');

    const partners = await caller.admin.portalModules.getPartners();

    expect(Array.isArray(partners)).toBe(true);
  });
});

// ============================================
// AUTHORIZATION TESTS
// ============================================

test.describe('API - Admin Router - Authorization', () => {
  test('should allow admin access to admin endpoints', async () => {
    const caller = await createCaller('admin');

    // Should not throw error
    const result = await caller.admin.users.list({ limit: 10, offset: 0 });
    expect(result).toBeDefined();
  });

  test('should deny non-admin access to admin endpoints', async () => {
    const caller = await createCaller('employee'); // Non-admin user

    try {
      await caller.admin.users.list({ limit: 10, offset: 0 });
      expect(true).toBe(false); // Should not reach here
    } catch (error: any) {
      expect(error.code).toBe('FORBIDDEN');
    }
  });

  test('should deny customer access to admin endpoints', async () => {
    const caller = await createCaller('customer');

    try {
      await caller.admin.users.list({ limit: 10, offset: 0 });
      expect(true).toBe(false);
    } catch (error: any) {
      expect(error.code).toBe('FORBIDDEN');
    }
  });
});
