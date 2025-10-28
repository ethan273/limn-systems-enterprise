/**
 * Enterprise RBAC tRPC Router
 *
 * API endpoints for Phase 3 enterprise features:
 * - Multi-tenancy (organization-scoped permissions)
 * - Permission templates (pre-defined permission sets)
 */

import { z } from 'zod';
import { createTRPCRouter, protectedProcedure, adminProcedure } from '../trpc/init';
import * as multiTenancy from '@/lib/services/multi-tenancy-service';
import * as permissionTemplates from '@/lib/services/permission-templates-service';
import { SYSTEM_ROLES, PERMISSIONS } from '@/lib/services/rbac-service';

// ============================================
// Input Validation Schemas
// ============================================

const organizationMemberSchema = z.object({
  organizationId: z.string().uuid(),
  userId: z.string().uuid(),
  roles: z.array(z.enum(Object.values(SYSTEM_ROLES) as [string, ...string[]])).optional(),
  isPrimary: z.boolean().optional(),
});

const organizationPermissionSchema = z.object({
  organizationId: z.string().uuid(),
  userId: z.string().uuid(),
  permissionId: z.string().uuid(),
  resourceType: z.string().optional(),
  resourceId: z.string().uuid().optional(),
  scopeMetadata: z.record(z.any()).optional(),
  expiresAt: z.date().optional(),
  reason: z.string().optional(),
});

const permissionTemplateSchema = z.object({
  templateName: z.string().min(3).max(100),
  templateDescription: z.string().optional(),
  category: z.string().optional(),
  isGlobal: z.boolean().optional(),
  organizationId: z.string().uuid().optional(),
  permissions: z.array(z.object({
    permissionId: z.string().uuid(),
    resourceType: z.string().optional(),
    scopeMetadata: z.record(z.any()).optional(),
  })),
});

// ============================================
// Enterprise RBAC Router
// ============================================

export const enterpriseRbacRouter = createTRPCRouter({
  // ============================================
  // Multi-Tenancy: Organization Membership
  // ============================================

  addOrganizationMember: adminProcedure
    .input(organizationMemberSchema)
    .mutation(async ({ input, ctx }) => {
      return multiTenancy.addOrganizationMember({
        organizationId: input.organizationId,
        userId: input.userId,
        roles: input.roles as any[],
        invitedBy: ctx.session.user.id,
        isPrimary: input.isPrimary,
      });
    }),

  removeOrganizationMember: adminProcedure
    .input(z.object({
      organizationId: z.string().uuid(),
      userId: z.string().uuid(),
    }))
    .mutation(async ({ input, ctx }) => {
      await multiTenancy.removeOrganizationMember(
        input.organizationId,
        input.userId,
        ctx.session.user.id
      );
      return { success: true };
    }),

  updateOrganizationMemberRoles: adminProcedure
    .input(z.object({
      organizationId: z.string().uuid(),
      userId: z.string().uuid(),
      roles: z.array(z.enum(Object.values(SYSTEM_ROLES) as [string, ...string[]])),
    }))
    .mutation(async ({ input, ctx }) => {
      await multiTenancy.updateOrganizationMemberRoles(
        input.organizationId,
        input.userId,
        input.roles as any[],
        ctx.session.user.id
      );
      return { success: true };
    }),

  getOrganizationMembers: protectedProcedure
    .input(z.object({
      organizationId: z.string().uuid(),
    }))
    .query(async ({ input }) => {
      return multiTenancy.getOrganizationMembers(input.organizationId);
    }),

  getUserOrganizations: protectedProcedure
    .input(z.object({
      userId: z.string().uuid().optional(),
    }))
    .query(async ({ input, ctx }) => {
      const userId = input.userId || ctx.session.user.id;
      return multiTenancy.getUserOrganizations(userId);
    }),

  setPrimaryOrganization: protectedProcedure
    .input(z.object({
      organizationId: z.string().uuid(),
    }))
    .mutation(async ({ input, ctx }) => {
      await multiTenancy.setPrimaryOrganization(
        ctx.session.user.id,
        input.organizationId
      );
      return { success: true };
    }),

  suspendOrganizationMember: adminProcedure
    .input(z.object({
      organizationId: z.string().uuid(),
      userId: z.string().uuid(),
      reason: z.string().min(10),
    }))
    .mutation(async ({ input, ctx }) => {
      await multiTenancy.suspendOrganizationMember(
        input.organizationId,
        input.userId,
        ctx.session.user.id,
        input.reason
      );
      return { success: true };
    }),

  reactivateOrganizationMember: adminProcedure
    .input(z.object({
      organizationId: z.string().uuid(),
      userId: z.string().uuid(),
    }))
    .mutation(async ({ input, ctx }) => {
      await multiTenancy.reactivateOrganizationMember(
        input.organizationId,
        input.userId,
        ctx.session.user.id
      );
      return { success: true };
    }),

  // ============================================
  // Multi-Tenancy: Organization Permissions
  // ============================================

  grantOrganizationPermission: adminProcedure
    .input(organizationPermissionSchema)
    .mutation(async ({ input, ctx }) => {
      await multiTenancy.grantOrganizationPermission({
        organizationId: input.organizationId,
        userId: input.userId,
        permissionId: input.permissionId,
        resourceType: input.resourceType,
        resourceId: input.resourceId,
        scopeMetadata: input.scopeMetadata,
        grantedBy: ctx.session.user.id,
        expiresAt: input.expiresAt,
        reason: input.reason,
      });
      return { success: true };
    }),

  revokeOrganizationPermission: adminProcedure
    .input(z.object({
      organizationId: z.string().uuid(),
      userId: z.string().uuid(),
      permissionId: z.string().uuid(),
    }))
    .mutation(async ({ input, ctx }) => {
      await multiTenancy.revokeOrganizationPermission(
        input.organizationId,
        input.userId,
        input.permissionId,
        ctx.session.user.id
      );
      return { success: true };
    }),

  getUserOrganizationPermissions: protectedProcedure
    .input(z.object({
      userId: z.string().uuid().optional(),
      organizationId: z.string().uuid(),
    }))
    .query(async ({ input, ctx }) => {
      const userId = input.userId || ctx.session.user.id;
      return multiTenancy.getUserOrganizationPermissions(userId, input.organizationId);
    }),

  getUserOrganizationRoles: protectedProcedure
    .input(z.object({
      userId: z.string().uuid().optional(),
      organizationId: z.string().uuid(),
    }))
    .query(async ({ input, ctx }) => {
      const userId = input.userId || ctx.session.user.id;
      return multiTenancy.getUserOrganizationRoles(userId, input.organizationId);
    }),

  hasOrganizationPermission: protectedProcedure
    .input(z.object({
      organizationId: z.string().uuid(),
      permission: z.string(),
      resource: z.object({
        type: z.string(),
        id: z.string().optional(),
        metadata: z.record(z.any()).optional(),
      }).optional(),
    }))
    .query(async ({ input, ctx }) => {
      return multiTenancy.hasOrganizationPermission(
        ctx.session.user.id,
        input.organizationId,
        input.permission as any,
        { resource: input.resource }
      );
    }),

  cleanupExpiredOrganizationPermissions: adminProcedure
    .mutation(async () => {
      const count = await multiTenancy.cleanupExpiredOrganizationPermissions();
      return { expiredCount: count };
    }),

  // ============================================
  // Permission Templates: Management
  // ============================================

  createPermissionTemplate: adminProcedure
    .input(permissionTemplateSchema)
    .mutation(async ({ input, ctx }) => {
      return permissionTemplates.createPermissionTemplate({
        templateName: input.templateName,
        templateDescription: input.templateDescription,
        category: input.category,
        isGlobal: input.isGlobal,
        organizationId: input.organizationId,
        createdBy: ctx.session.user.id,
        permissions: input.permissions,
      });
    }),

  getPermissionTemplates: protectedProcedure
    .input(z.object({
      category: z.string().optional(),
      organizationId: z.string().uuid().optional(),
      isActive: z.boolean().optional(),
      includeSystemTemplates: z.boolean().optional(),
    }))
    .query(async ({ input }) => {
      return permissionTemplates.getPermissionTemplates(input);
    }),

  getTemplateWithPermissions: protectedProcedure
    .input(z.object({
      templateId: z.string().uuid(),
    }))
    .query(async ({ input }) => {
      return permissionTemplates.getTemplateWithPermissions(input.templateId);
    }),

  updateTemplatePermissions: adminProcedure
    .input(z.object({
      templateId: z.string().uuid(),
      permissions: z.array(z.object({
        permissionId: z.string().uuid(),
        resourceType: z.string().optional(),
        scopeMetadata: z.record(z.any()).optional(),
      })),
    }))
    .mutation(async ({ input, ctx }) => {
      await permissionTemplates.updateTemplatePermissions(
        input.templateId,
        input.permissions,
        ctx.session.user.id
      );
      return { success: true };
    }),

  deleteTemplate: adminProcedure
    .input(z.object({
      templateId: z.string().uuid(),
    }))
    .mutation(async ({ input, ctx }) => {
      await permissionTemplates.deleteTemplate(input.templateId, ctx.session.user.id);
      return { success: true };
    }),

  cloneTemplate: adminProcedure
    .input(z.object({
      templateId: z.string().uuid(),
      newName: z.string().min(3).max(100),
      organizationId: z.string().uuid().optional(),
      description: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      return permissionTemplates.cloneTemplate(
        input.templateId,
        input.newName,
        ctx.session.user.id,
        {
          organizationId: input.organizationId,
          description: input.description,
        }
      );
    }),

  // ============================================
  // Permission Templates: Application
  // ============================================

  applyTemplateToUser: adminProcedure
    .input(z.object({
      templateId: z.string().uuid(),
      userId: z.string().uuid(),
      organizationId: z.string().uuid().optional(),
      expiresAt: z.date().optional(),
      reason: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      await permissionTemplates.applyTemplateToUser(
        input.templateId,
        input.userId,
        ctx.session.user.id,
        {
          organizationId: input.organizationId,
          expiresAt: input.expiresAt,
          reason: input.reason,
        }
      );
      return { success: true };
    }),

  batchApplyTemplateToUsers: adminProcedure
    .input(z.object({
      templateId: z.string().uuid(),
      userIds: z.array(z.string().uuid()),
      organizationId: z.string().uuid().optional(),
      expiresAt: z.date().optional(),
      reason: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      return permissionTemplates.batchApplyTemplateToUsers(
        input.templateId,
        input.userIds,
        ctx.session.user.id,
        {
          organizationId: input.organizationId,
          expiresAt: input.expiresAt,
          reason: input.reason,
        }
      );
    }),

  getUsersWithTemplate: adminProcedure
    .input(z.object({
      templateId: z.string().uuid(),
      organizationId: z.string().uuid().optional(),
    }))
    .query(async ({ input }) => {
      return permissionTemplates.getUsersWithTemplate(
        input.templateId,
        input.organizationId
      );
    }),

  getTemplateUsageStats: protectedProcedure
    .input(z.object({
      templateId: z.string().uuid(),
      organizationId: z.string().uuid().optional(),
    }))
    .query(async ({ input }) => {
      return permissionTemplates.getTemplateUsageStats(
        input.templateId,
        input.organizationId
      );
    }),
});
