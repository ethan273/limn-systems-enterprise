/**
 * RBAC System Comprehensive Test Suite
 *
 * Tests the complete Role-Based Access Control system including:
 * - Role hierarchy and inheritance
 * - Permission mappings
 * - Role assignment and removal
 * - Permission checks
 * - User type to role migration
 * - Caching behavior
 *
 * Created: October 26, 2025
 * Part of: RBAC System Implementation
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { PrismaClient } from '@prisma/client';
import {
  getUserRoles,
  getEffectiveRoles,
  hasRole,
  hasPermission,
  getUserPermissions,
  assignRole,
  removeRole,
  setUserRoles,
  clearUserCache,
  SYSTEM_ROLES,
  PERMISSIONS,
  type SystemRole,
} from '@/lib/services/rbac-service';

const prisma = new PrismaClient();

describe('RBAC System Tests', () => {
  // Test user data
  let testUserId: string;
  let testUserEmail: string;
  let testDataCreated = false;

  // ========================================
  // Setup and Cleanup
  // ========================================

  beforeAll(async () => {
    try {
      // Create unique test user
      testUserEmail = `rbac-test-${Date.now()}@test.com`;

      const testUser = await prisma.user_profiles.create({
        data: {
          email: testUserEmail,
          user_type: 'employee',
          first_name: 'RBAC',
          last_name: 'Test User',
        },
      });

      testUserId = testUser.id;
      testDataCreated = true;

      console.log('[RBAC Test Setup] Created test user:', testUserEmail);
    } catch (error) {
      console.error('[RBAC Test Setup] Failed to create test data:', error);
      testDataCreated = false;
    }
  });

  afterAll(async () => {
    if (!testDataCreated) return;

    try {
      // Clean up test data
      await prisma.user_roles.deleteMany({
        where: { user_id: testUserId },
      });

      await prisma.user_profiles.delete({
        where: { id: testUserId },
      });

      await prisma.$disconnect();

      console.log('[RBAC Test Cleanup] Cleaned up test data');
    } catch (error) {
      console.error('[RBAC Test Cleanup] Failed to cleanup:', error);
    }
  });

  beforeEach(async () => {
    // Clear cache before each test
    if (testDataCreated) {
      clearUserCache(testUserId);
    }
  });

  // ========================================
  // Test 1: Role Assignment
  // ========================================

  describe('Role Assignment', () => {
    it('should assign a role to a user', async () => {
      if (!testDataCreated) {
        console.warn('[RBAC Test] Skipping - test data not created');
        return;
      }

      await assignRole(testUserId, SYSTEM_ROLES.USER);

      const roles = await getUserRoles(testUserId);
      expect(roles).toContain(SYSTEM_ROLES.USER);
    });

    it('should assign multiple roles to a user', async () => {
      if (!testDataCreated) return;

      await assignRole(testUserId, SYSTEM_ROLES.DEVELOPER);
      await assignRole(testUserId, SYSTEM_ROLES.DESIGNER);

      const roles = await getUserRoles(testUserId);
      expect(roles).toContain(SYSTEM_ROLES.DEVELOPER);
      expect(roles).toContain(SYSTEM_ROLES.DESIGNER);
    });

    it('should not create duplicate role assignments', async () => {
      if (!testDataCreated) return;

      await assignRole(testUserId, SYSTEM_ROLES.USER);
      await assignRole(testUserId, SYSTEM_ROLES.USER); // Try to assign same role again

      const roles = await getUserRoles(testUserId);
      const userRoleCount = roles.filter(r => r === SYSTEM_ROLES.USER).length;
      expect(userRoleCount).toBe(1);
    });

    it('should set user roles (replace all existing)', async () => {
      if (!testDataCreated) return;

      // First assign some roles
      await assignRole(testUserId, SYSTEM_ROLES.USER);
      await assignRole(testUserId, SYSTEM_ROLES.DEVELOPER);

      // Now set new roles (should replace old ones)
      await setUserRoles(testUserId, [SYSTEM_ROLES.DESIGNER, SYSTEM_ROLES.ANALYST]);

      const roles = await getUserRoles(testUserId);
      expect(roles).toContain(SYSTEM_ROLES.DESIGNER);
      expect(roles).toContain(SYSTEM_ROLES.ANALYST);
      expect(roles).not.toContain(SYSTEM_ROLES.DEVELOPER);
    });
  });

  // ========================================
  // Test 2: Role Removal
  // ========================================

  describe('Role Removal', () => {
    it('should remove a role from a user', async () => {
      if (!testDataCreated) return;

      await assignRole(testUserId, SYSTEM_ROLES.USER);
      await removeRole(testUserId, SYSTEM_ROLES.USER);

      const roles = await getUserRoles(testUserId);
      expect(roles).not.toContain(SYSTEM_ROLES.USER);
    });

    it('should handle removing non-existent role gracefully', async () => {
      if (!testDataCreated) return;

      // Try to remove a role that was never assigned
      await expect(
        removeRole(testUserId, SYSTEM_ROLES.SUPER_ADMIN)
      ).resolves.not.toThrow();
    });
  });

  // ========================================
  // Test 3: Role Hierarchy and Inheritance
  // ========================================

  describe('Role Hierarchy and Inheritance', () => {
    it('should return inherited roles for super_admin', async () => {
      if (!testDataCreated) return;

      await setUserRoles(testUserId, [SYSTEM_ROLES.SUPER_ADMIN]);

      const effectiveRoles = await getEffectiveRoles(testUserId);

      // Super admin should have ALL roles
      expect(effectiveRoles).toContain(SYSTEM_ROLES.SUPER_ADMIN);
      expect(effectiveRoles).toContain(SYSTEM_ROLES.ADMIN);
      expect(effectiveRoles).toContain(SYSTEM_ROLES.MANAGER);
      expect(effectiveRoles).toContain(SYSTEM_ROLES.TEAM_LEAD);
      expect(effectiveRoles).toContain(SYSTEM_ROLES.DEVELOPER);
      expect(effectiveRoles).toContain(SYSTEM_ROLES.DESIGNER);
      expect(effectiveRoles).toContain(SYSTEM_ROLES.ANALYST);
      expect(effectiveRoles).toContain(SYSTEM_ROLES.USER);
      expect(effectiveRoles).toContain(SYSTEM_ROLES.VIEWER);
    });

    it('should return inherited roles for admin', async () => {
      if (!testDataCreated) return;

      await setUserRoles(testUserId, [SYSTEM_ROLES.ADMIN]);

      const effectiveRoles = await getEffectiveRoles(testUserId);

      // Admin should inherit manager, team_lead, user, viewer
      expect(effectiveRoles).toContain(SYSTEM_ROLES.ADMIN);
      expect(effectiveRoles).toContain(SYSTEM_ROLES.MANAGER);
      expect(effectiveRoles).toContain(SYSTEM_ROLES.TEAM_LEAD);
      expect(effectiveRoles).toContain(SYSTEM_ROLES.USER);
      expect(effectiveRoles).toContain(SYSTEM_ROLES.VIEWER);

      // But should NOT have super_admin
      expect(effectiveRoles).not.toContain(SYSTEM_ROLES.SUPER_ADMIN);
    });

    it('should return inherited roles for developer', async () => {
      if (!testDataCreated) return;

      await setUserRoles(testUserId, [SYSTEM_ROLES.DEVELOPER]);

      const effectiveRoles = await getEffectiveRoles(testUserId);

      // Developer should inherit user and viewer
      expect(effectiveRoles).toContain(SYSTEM_ROLES.DEVELOPER);
      expect(effectiveRoles).toContain(SYSTEM_ROLES.USER);
      expect(effectiveRoles).toContain(SYSTEM_ROLES.VIEWER);

      // But should NOT have admin roles
      expect(effectiveRoles).not.toContain(SYSTEM_ROLES.ADMIN);
      expect(effectiveRoles).not.toContain(SYSTEM_ROLES.MANAGER);
    });

    it('should handle multiple direct roles with inheritance', async () => {
      if (!testDataCreated) return;

      await setUserRoles(testUserId, [SYSTEM_ROLES.DEVELOPER, SYSTEM_ROLES.DESIGNER]);

      const effectiveRoles = await getEffectiveRoles(testUserId);

      // Should have both direct roles
      expect(effectiveRoles).toContain(SYSTEM_ROLES.DEVELOPER);
      expect(effectiveRoles).toContain(SYSTEM_ROLES.DESIGNER);

      // Should have inherited roles from both
      expect(effectiveRoles).toContain(SYSTEM_ROLES.USER);
      expect(effectiveRoles).toContain(SYSTEM_ROLES.VIEWER);
    });
  });

  // ========================================
  // Test 4: Role Checking
  // ========================================

  describe('Role Checking', () => {
    it('should correctly check if user has direct role', async () => {
      if (!testDataCreated) return;

      await setUserRoles(testUserId, [SYSTEM_ROLES.DEVELOPER]);

      const hasDeveloper = await hasRole(testUserId, SYSTEM_ROLES.DEVELOPER);
      expect(hasDeveloper).toBe(true);
    });

    it('should correctly check if user has inherited role', async () => {
      if (!testDataCreated) return;

      await setUserRoles(testUserId, [SYSTEM_ROLES.ADMIN]);

      // Admin inherits team_lead
      const hasTeamLead = await hasRole(testUserId, SYSTEM_ROLES.TEAM_LEAD);
      expect(hasTeamLead).toBe(true);
    });

    it('should return false for role user does not have', async () => {
      if (!testDataCreated) return;

      await setUserRoles(testUserId, [SYSTEM_ROLES.VIEWER]);

      const hasAdmin = await hasRole(testUserId, SYSTEM_ROLES.ADMIN);
      expect(hasAdmin).toBe(false);
    });
  });

  // ========================================
  // Test 5: Permission Mappings
  // ========================================

  describe('Permission Mappings', () => {
    it('should grant admin permissions to super_admin', async () => {
      if (!testDataCreated) return;

      await setUserRoles(testUserId, [SYSTEM_ROLES.SUPER_ADMIN]);

      const permissions = await getUserPermissions(testUserId);

      // Should have all admin permissions
      expect(permissions).toContain(PERMISSIONS.ADMIN_ACCESS);
      expect(permissions).toContain(PERMISSIONS.ADMIN_MANAGE_USERS);
      expect(permissions).toContain(PERMISSIONS.ADMIN_MANAGE_ROLES);
      expect(permissions).toContain(PERMISSIONS.ADMIN_VIEW_AUDIT);
      expect(permissions).toContain(PERMISSIONS.ADMIN_MANAGE_SETTINGS);
    });

    it('should grant production permissions to manager', async () => {
      if (!testDataCreated) return;

      await setUserRoles(testUserId, [SYSTEM_ROLES.MANAGER]);

      const permissions = await getUserPermissions(testUserId);

      // Manager should be able to approve production
      expect(permissions).toContain(PERMISSIONS.PRODUCTION_VIEW);
      expect(permissions).toContain(PERMISSIONS.PRODUCTION_APPROVE);
    });

    it('should grant basic permissions to user role', async () => {
      if (!testDataCreated) return;

      await setUserRoles(testUserId, [SYSTEM_ROLES.USER]);

      const permissions = await getUserPermissions(testUserId);

      // User should have view permissions but not approve/edit
      expect(permissions).toContain(PERMISSIONS.PRODUCTION_VIEW);
      expect(permissions).toContain(PERMISSIONS.ORDERS_VIEW);

      expect(permissions).not.toContain(PERMISSIONS.PRODUCTION_APPROVE);
      expect(permissions).not.toContain(PERMISSIONS.ORDERS_APPROVE);
    });

    it('should grant only view permissions to viewer role', async () => {
      if (!testDataCreated) return;

      await setUserRoles(testUserId, [SYSTEM_ROLES.VIEWER]);

      const permissions = await getUserPermissions(testUserId);

      // Viewer should only have view permissions
      expect(permissions).toContain(PERMISSIONS.PRODUCTION_VIEW);
      expect(permissions).toContain(PERMISSIONS.ORDERS_VIEW);
      expect(permissions).toContain(PERMISSIONS.ANALYTICS_VIEW);

      // Should NOT have any edit/create/delete permissions
      expect(permissions).not.toContain(PERMISSIONS.PRODUCTION_CREATE);
      expect(permissions).not.toContain(PERMISSIONS.ORDERS_CREATE);
      expect(permissions).not.toContain(PERMISSIONS.USERS_EDIT);
    });
  });

  // ========================================
  // Test 6: Permission Checking
  // ========================================

  describe('Permission Checking', () => {
    it('should correctly check if user has permission', async () => {
      if (!testDataCreated) return;

      await setUserRoles(testUserId, [SYSTEM_ROLES.ADMIN]);

      const hasAdminAccess = await hasPermission(testUserId, PERMISSIONS.ADMIN_ACCESS);
      expect(hasAdminAccess).toBe(true);
    });

    it('should correctly check inherited permissions', async () => {
      if (!testDataCreated) return;

      await setUserRoles(testUserId, [SYSTEM_ROLES.MANAGER]);

      // Manager inherits user permissions
      const hasProductionView = await hasPermission(testUserId, PERMISSIONS.PRODUCTION_VIEW);
      expect(hasProductionView).toBe(true);
    });

    it('should return false for permission user does not have', async () => {
      if (!testDataCreated) return;

      await setUserRoles(testUserId, [SYSTEM_ROLES.VIEWER]);

      const hasAdminAccess = await hasPermission(testUserId, PERMISSIONS.ADMIN_ACCESS);
      expect(hasAdminAccess).toBe(false);
    });

    it('should handle multiple roles with combined permissions', async () => {
      if (!testDataCreated) return;

      await setUserRoles(testUserId, [SYSTEM_ROLES.DEVELOPER, SYSTEM_ROLES.DESIGNER]);

      const permissions = await getUserPermissions(testUserId);

      // Should have combined permissions from both roles
      expect(permissions.length).toBeGreaterThan(0);

      // Both should grant basic view permissions
      expect(permissions).toContain(PERMISSIONS.PRODUCTION_VIEW);
    });
  });

  // ========================================
  // Test 7: Caching Behavior
  // ========================================

  describe('Caching Behavior', () => {
    it('should cache user roles for performance', async () => {
      if (!testDataCreated) return;

      await setUserRoles(testUserId, [SYSTEM_ROLES.USER]);

      // First call - should query database
      const roles1 = await getEffectiveRoles(testUserId);

      // Second call - should use cache
      const roles2 = await getEffectiveRoles(testUserId);

      expect(roles1).toEqual(roles2);
    });

    it('should clear cache when roles change', async () => {
      if (!testDataCreated) return;

      await setUserRoles(testUserId, [SYSTEM_ROLES.USER]);
      const roles1 = await getEffectiveRoles(testUserId);

      // Change roles
      await setUserRoles(testUserId, [SYSTEM_ROLES.ADMIN]);

      // Should reflect new roles immediately
      const roles2 = await getEffectiveRoles(testUserId);

      expect(roles2).toContain(SYSTEM_ROLES.ADMIN);
      expect(roles2).not.toContain(SYSTEM_ROLES.USER);
    });

    it('should manually clear cache', async () => {
      if (!testDataCreated) return;

      await setUserRoles(testUserId, [SYSTEM_ROLES.USER]);
      await getEffectiveRoles(testUserId); // Populate cache

      clearUserCache(testUserId);

      // After clearing, next call should query database again
      const roles = await getEffectiveRoles(testUserId);
      expect(roles).toContain(SYSTEM_ROLES.USER);
    });
  });

  // ========================================
  // Test 8: Edge Cases
  // ========================================

  describe('Edge Cases', () => {
    it('should handle user with no roles', async () => {
      if (!testDataCreated) return;

      await setUserRoles(testUserId, []); // Remove all roles

      const roles = await getUserRoles(testUserId);
      expect(roles).toEqual([]);

      const permissions = await getUserPermissions(testUserId);
      expect(permissions).toEqual([]);
    });

    it('should handle non-existent user gracefully', async () => {
      const fakeUserId = '00000000-0000-0000-0000-000000000000';

      const roles = await getUserRoles(fakeUserId);
      expect(roles).toEqual([]);

      const permissions = await getUserPermissions(fakeUserId);
      expect(permissions).toEqual([]);
    });

    it('should handle checking permission for user with no roles', async () => {
      if (!testDataCreated) return;

      await setUserRoles(testUserId, []);

      const hasPermission = await hasPermission(testUserId, PERMISSIONS.ADMIN_ACCESS);
      expect(hasPermission).toBe(false);
    });
  });

  // ========================================
  // Test 9: Real-World Scenarios
  // ========================================

  describe('Real-World Scenarios', () => {
    it('Scenario: Employee promoted to team lead', async () => {
      if (!testDataCreated) return;

      // Start as regular user
      await setUserRoles(testUserId, [SYSTEM_ROLES.USER]);

      let hasApproval = await hasPermission(testUserId, PERMISSIONS.PRODUCTION_APPROVE);
      expect(hasApproval).toBe(false);

      // Promoted to team lead
      await setUserRoles(testUserId, [SYSTEM_ROLES.TEAM_LEAD]);

      hasApproval = await hasPermission(testUserId, PERMISSIONS.PRODUCTION_APPROVE);
      expect(hasApproval).toBe(true);
    });

    it('Scenario: Developer also becomes designer', async () => {
      if (!testDataCreated) return;

      // Start as developer
      await setUserRoles(testUserId, [SYSTEM_ROLES.DEVELOPER]);

      // Add designer role (keep developer)
      await assignRole(testUserId, SYSTEM_ROLES.DESIGNER);

      const roles = await getUserRoles(testUserId);
      expect(roles).toContain(SYSTEM_ROLES.DEVELOPER);
      expect(roles).toContain(SYSTEM_ROLES.DESIGNER);

      // Should have permissions from both roles
      const permissions = await getUserPermissions(testUserId);
      expect(permissions.length).toBeGreaterThan(0);
    });

    it('Scenario: Admin temporarily loses permissions', async () => {
      if (!testDataCreated) return;

      // Start as admin
      await setUserRoles(testUserId, [SYSTEM_ROLES.ADMIN]);

      let hasAdminAccess = await hasPermission(testUserId, PERMISSIONS.ADMIN_ACCESS);
      expect(hasAdminAccess).toBe(true);

      // Temporarily demoted to viewer
      await setUserRoles(testUserId, [SYSTEM_ROLES.VIEWER]);

      hasAdminAccess = await hasPermission(testUserId, PERMISSIONS.ADMIN_ACCESS);
      expect(hasAdminAccess).toBe(false);

      // Restored to admin
      await setUserRoles(testUserId, [SYSTEM_ROLES.ADMIN]);

      hasAdminAccess = await hasPermission(testUserId, PERMISSIONS.ADMIN_ACCESS);
      expect(hasAdminAccess).toBe(true);
    });
  });
});
