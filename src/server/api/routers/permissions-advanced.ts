/**
 * Advanced Permissions tRPC Router
 *
 * API endpoints for Phase 2.3 advanced permission features:
 * - Conditional permissions
 * - Permission delegation
 * - Approval workflows
 * - Permission analytics
 */

import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '../trpc/init';
import * as conditionalPermissions from '@/lib/services/conditional-permissions';
import * as permissionDelegation from '@/lib/services/permission-delegation';
import * as permissionApproval from '@/lib/services/permission-approval';
import * as permissionAnalytics from '@/lib/services/permission-analytics';

// ============================================
// Input Validation Schemas
// ============================================

const timeConditionSchema = z.object({
  timeStart: z.string().optional(),
  timeEnd: z.string().optional(),
  daysOfWeek: z.array(z.number().min(1).max(7)).optional(),
  timezone: z.string().default('UTC'),
});

const locationConditionSchema = z.object({
  allowedCountries: z.array(z.string()).optional(),
  allowedRegions: z.array(z.string()).optional(),
  allowedCities: z.array(z.string()).optional(),
  geoFence: z.object({
    coordinates: z.array(z.object({
      lat: z.number(),
      lon: z.number(),
    })),
  }).optional(),
});

const deviceConditionSchema = z.object({
  allowedDeviceTypes: z.array(z.string()).optional(),
  requiredOS: z.array(z.string()).optional(),
  corporateDeviceOnly: z.boolean(),
});

const ipConditionSchema = z.object({
  allowedIPRanges: z.array(z.string()).optional(),
});

// ============================================
// Conditional Permissions Endpoints
// ============================================

export const permissionsAdvancedRouter = createTRPCRouter({
  // ============================================
  // Conditional Permissions
  // ============================================

  addTimeCondition: protectedProcedure
    .input(z.object({
      permissionId: z.string().uuid(),
      userId: z.string().uuid().optional(),
      roleId: z.string().uuid().optional(),
      config: timeConditionSchema,
    }))
    .mutation(async ({ input, ctx }) => {
      return conditionalPermissions.createPermissionCondition({
        permissionId: input.permissionId,
        userId: input.userId,
        roleId: input.roleId,
        conditionType: 'time',
        config: input.config,
        createdBy: ctx.session.user.id,
      });
    }),

  addLocationCondition: protectedProcedure
    .input(z.object({
      permissionId: z.string().uuid(),
      userId: z.string().uuid().optional(),
      roleId: z.string().uuid().optional(),
      config: locationConditionSchema,
    }))
    .mutation(async ({ input, ctx }) => {
      return conditionalPermissions.createPermissionCondition({
        permissionId: input.permissionId,
        userId: input.userId,
        roleId: input.roleId,
        conditionType: 'location',
        config: input.config,
        createdBy: ctx.session.user.id,
      });
    }),

  addDeviceCondition: protectedProcedure
    .input(z.object({
      permissionId: z.string().uuid(),
      userId: z.string().uuid().optional(),
      roleId: z.string().uuid().optional(),
      config: deviceConditionSchema,
    }))
    .mutation(async ({ input, ctx }) => {
      return conditionalPermissions.createPermissionCondition({
        permissionId: input.permissionId,
        userId: input.userId,
        roleId: input.roleId,
        conditionType: 'device',
        config: input.config,
        createdBy: ctx.session.user.id,
      });
    }),

  addIPCondition: protectedProcedure
    .input(z.object({
      permissionId: z.string().uuid(),
      userId: z.string().uuid().optional(),
      roleId: z.string().uuid().optional(),
      config: ipConditionSchema,
    }))
    .mutation(async ({ input, ctx }) => {
      return conditionalPermissions.createPermissionCondition({
        permissionId: input.permissionId,
        userId: input.userId,
        roleId: input.roleId,
        conditionType: 'ip_range',
        config: input.config,
        createdBy: ctx.session.user.id,
      });
    }),

  getConditions: protectedProcedure
    .input(z.object({
      permissionId: z.string().uuid(),
    }))
    .query(async ({ input }) => {
      return conditionalPermissions.getPermissionConditions(input.permissionId);
    }),

  evaluateConditions: protectedProcedure
    .input(z.object({
      permissionId: z.string().uuid(),
      context: z.object({
        timestamp: z.date().default(() => new Date()),
        ipAddress: z.string().optional(),
        userAgent: z.string().optional(),
        geoLocation: z.object({
          country: z.string().optional(),
          region: z.string().optional(),
          city: z.string().optional(),
          lat: z.number().optional(),
          lon: z.number().optional(),
        }).optional(),
        deviceInfo: z.object({
          type: z.enum(['desktop', 'mobile', 'tablet', 'unknown']),
          os: z.string(),
          browser: z.string(),
          isCorporate: z.boolean().optional(),
        }).optional(),
      }),
    }))
    .query(async ({ input }) => {
      return conditionalPermissions.evaluateAllConditions(
        input.permissionId,
        input.context
      );
    }),

  // ============================================
  // Permission Delegation
  // ============================================

  delegatePermission: protectedProcedure
    .input(z.object({
      delegateeId: z.string().uuid(),
      permissionId: z.string().uuid(),
      validUntil: z.date(),
      validFrom: z.date().optional(),
      resourceType: z.string().optional(),
      resourceId: z.string().optional(),
      reason: z.string().min(10),
    }))
    .mutation(async ({ input, ctx }) => {
      return permissionDelegation.delegatePermission(
        ctx.session.user.id,
        input.delegateeId,
        input.permissionId,
        {
          validFrom: input.validFrom,
          validUntil: input.validUntil,
          resourceType: input.resourceType,
          resourceId: input.resourceId,
          reason: input.reason,
        }
      );
    }),

  revokeDelegation: protectedProcedure
    .input(z.object({
      delegationId: z.string().uuid(),
      reason: z.string().min(5),
    }))
    .mutation(async ({ input, ctx }) => {
      await permissionDelegation.revokeDelegation(
        input.delegationId,
        ctx.session.user.id,
        input.reason
      );

      return { success: true };
    }),

  getMyDelegations: protectedProcedure
    .input(z.object({
      type: z.enum(['given', 'received']),
    }))
    .query(async ({ input, ctx }) => {
      return permissionDelegation.getUserDelegations(
        ctx.session.user.id,
        input.type
      );
    }),

  getDelegatedPermissions: protectedProcedure
    .query(async ({ ctx }) => {
      return permissionDelegation.getUserDelegatedPermissions(ctx.session.user.id);
    }),

  getDelegationStats: protectedProcedure
    .query(async ({ ctx }) => {
      return permissionDelegation.getDelegationStats(ctx.session.user.id);
    }),

  // ============================================
  // Approval Workflows
  // ============================================

  requestPermission: protectedProcedure
    .input(z.object({
      permissionId: z.string().uuid(),
      reason: z.string().min(20),
      durationHours: z.number().positive().optional(),
      resourceType: z.string().optional(),
      resourceId: z.string().optional(),
      metadata: z.record(z.any()).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      return permissionApproval.requestPermission(
        ctx.session.user.id,
        input.permissionId,
        {
          reason: input.reason,
          durationHours: input.durationHours,
          resourceType: input.resourceType,
          resourceId: input.resourceId,
          metadata: input.metadata,
        }
      );
    }),

  approveRequest: protectedProcedure
    .input(z.object({
      requestId: z.string().uuid(),
      reason: z.string().min(10),
    }))
    .mutation(async ({ input, ctx }) => {
      await permissionApproval.approveRequest(
        input.requestId,
        ctx.session.user.id,
        input.reason
      );

      return { success: true };
    }),

  denyRequest: protectedProcedure
    .input(z.object({
      requestId: z.string().uuid(),
      reason: z.string().min(10),
    }))
    .mutation(async ({ input, ctx }) => {
      await permissionApproval.denyRequest(
        input.requestId,
        ctx.session.user.id,
        input.reason
      );

      return { success: true };
    }),

  cancelRequest: protectedProcedure
    .input(z.object({
      requestId: z.string().uuid(),
    }))
    .mutation(async ({ input, ctx }) => {
      await permissionApproval.cancelRequest(
        input.requestId,
        ctx.session.user.id
      );

      return { success: true };
    }),

  getPendingRequests: protectedProcedure
    .query(async ({ ctx }) => {
      return permissionApproval.getPendingRequests(ctx.session.user.id);
    }),

  getMyRequests: protectedProcedure
    .query(async ({ ctx }) => {
      return permissionApproval.getUserRequests(ctx.session.user.id);
    }),

  getApprovalStats: protectedProcedure
    .query(async ({ ctx }) => {
      return permissionApproval.getApprovalStats(ctx.session.user.id);
    }),

  getGlobalApprovalStats: protectedProcedure
    .query(async () => {
      return permissionApproval.getGlobalApprovalStats();
    }),

  // ============================================
  // Permission Analytics
  // ============================================

  logPermissionUsage: protectedProcedure
    .input(z.object({
      permissionId: z.string().uuid(),
      result: z.enum(['granted', 'denied', 'error']),
      resourceType: z.string().optional(),
      resourceId: z.string().optional(),
      action: z.string().optional(),
      denialReason: z.string().optional(),
      metadata: z.record(z.any()).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      await permissionAnalytics.logPermissionUsage(
        ctx.session.user.id,
        input.permissionId,
        input.result,
        {
          resourceType: input.resourceType,
          resourceId: input.resourceId,
          action: input.action,
          denialReason: input.denialReason,
          ipAddress: ctx.req?.headers?.['x-forwarded-for']?.toString() || undefined,
          userAgent: ctx.req?.headers?.['user-agent']?.toString() || undefined,
          metadata: input.metadata,
        }
      );

      return { success: true };
    }),

  getPermissionUsageStats: protectedProcedure
    .input(z.object({
      permissionId: z.string().uuid(),
      startDate: z.date(),
      endDate: z.date(),
    }))
    .query(async ({ input }) => {
      return permissionAnalytics.getPermissionUsageStats(
        input.permissionId,
        { start: input.startDate, end: input.endDate }
      );
    }),

  getUserUsageStats: protectedProcedure
    .input(z.object({
      userId: z.string().uuid().optional(),
      startDate: z.date(),
      endDate: z.date(),
    }))
    .query(async ({ input, ctx }) => {
      const userId = input.userId || ctx.session.user.id;
      return permissionAnalytics.getUserUsageStats(
        userId,
        { start: input.startDate, end: input.endDate }
      );
    }),

  getUnusedPermissions: protectedProcedure
    .input(z.object({
      daysInactive: z.number().positive().default(90),
    }))
    .query(async ({ input }) => {
      return permissionAnalytics.getUnusedPermissions(input.daysInactive);
    }),

  getSecurityAlerts: protectedProcedure
    .input(z.object({
      severity: z.enum(['high', 'medium', 'low']).optional(),
    }))
    .query(async ({ input }) => {
      return permissionAnalytics.getSecurityAlerts(input.severity);
    }),

  getComplianceReport: protectedProcedure
    .input(z.object({
      startDate: z.date(),
      endDate: z.date(),
    }))
    .query(async ({ input }) => {
      return permissionAnalytics.getComplianceReport({
        start: input.startDate,
        end: input.endDate,
      });
    }),

  getRecentActivity: protectedProcedure
    .input(z.object({
      limit: z.number().positive().default(100),
    }))
    .query(async ({ input }) => {
      return permissionAnalytics.getRecentActivity(input.limit);
    }),

  getResourceActivity: protectedProcedure
    .input(z.object({
      resourceType: z.string(),
      resourceId: z.string(),
      limit: z.number().positive().default(50),
    }))
    .query(async ({ input }) => {
      return permissionAnalytics.getResourceActivity(
        input.resourceType,
        input.resourceId,
        input.limit
      );
    }),
});
