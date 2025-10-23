/**
 * Audit Router - Activity & Security Logging
 *
 * Provides endpoints for:
 * - Admin activity logs
 * - Security audit logs
 * - SSO login audit logs
 * - System-wide activity tracking
 */

import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '../trpc/init';


// ============================================
// INPUT SCHEMAS
// ============================================

// Log type schema for future use
// const logTypeSchema = z.enum(['admin', 'security', 'login', 'all']);

const actionFilterSchema = z.string().optional();

const dateRangeSchema = z.object({
  from: z.date().optional(),
  to: z.date().optional(),
});

// ============================================
// AUDIT ROUTER
// ============================================

export const auditRouter = createTRPCRouter({
  // ==================
  // ACTIVITY LOGS
  // ==================

  /**
   * Get admin activity logs with filtering and pagination
   */
  getAdminLogs: protectedProcedure
    .input(
      z.object({
        search: z.string().optional(),
        action: actionFilterSchema,
        userId: z.string().uuid().optional(),
        resourceType: z.string().optional(),
        dateRange: dateRangeSchema.optional(),
        limit: z.number().min(1).max(100).default(50),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ input, ctx }) => {
      const { search, action, userId, resourceType, dateRange, limit, offset } = input;

      // Build where clause
      const where: any = {};

      // Note: Using toLowerCase to avoid Prisma/PostgreSQL compatibility issues with mode: 'insensitive'
      if (search) {
        const searchLower = search.toLowerCase();
        where.OR = [
          { action: { contains: searchLower } },
          { user_email: { contains: searchLower } },
          { resource_type: { contains: searchLower } },
        ];
      }

      if (action) {
        where.action = { contains: action, mode: 'insensitive' };
      }

      if (userId) {
        where.user_id = userId;
      }

      if (resourceType) {
        where.resource_type = resourceType;
      }

      if (dateRange) {
        where.created_at = {};
        if (dateRange.from) {
          where.created_at.gte = dateRange.from;
        }
        if (dateRange.to) {
          where.created_at.lte = dateRange.to;
        }
      }

      const [logs, total] = await Promise.all([
        ctx.db.admin_audit_log.findMany({
          where,
          take: limit,
          skip: offset,
          orderBy: { created_at: 'desc' },
        }),
        ctx.db.admin_audit_log.count({ where }),
      ]);

      return {
        logs: logs.map((log) => ({
          id: log.id,
          action: log.action,
          userId: log.user_id,
          userEmail: log.user_email,
          resourceType: log.resource_type,
          resourceId: log.resource_id,
          metadata: log.metadata,
          ipAddress: log.ip_address,
          createdAt: log.created_at,
        })),
        total,
        hasMore: offset + limit < total,
      };
    }),

  /**
   * Get security audit logs
   */
  getSecurityLogs: protectedProcedure
    .input(
      z.object({
        search: z.string().optional(),
        action: actionFilterSchema,
        userId: z.string().uuid().optional(),
        tableName: z.string().optional(),
        dateRange: dateRangeSchema.optional(),
        limit: z.number().min(1).max(100).default(50),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ input, ctx }) => {
      const { search, action, userId, tableName, dateRange, limit, offset } = input;

      const where: any = {};

      // Note: Using toLowerCase to avoid Prisma/PostgreSQL compatibility issues with mode: 'insensitive'
      if (search) {
        const searchLower = search.toLowerCase();
        where.OR = [
          { action: { contains: searchLower } },
          { user_email: { contains: searchLower } },
          { table_name: { contains: searchLower } },
        ];
      }

      if (action) {
        where.action = { contains: action, mode: 'insensitive' };
      }

      if (userId) {
        where.user_id = userId;
      }

      if (tableName) {
        where.table_name = tableName;
      }

      if (dateRange) {
        where.event_time = {};
        if (dateRange.from) {
          where.event_time.gte = dateRange.from;
        }
        if (dateRange.to) {
          where.event_time.lte = dateRange.to;
        }
      }

      const [logs, total] = await Promise.all([
        ctx.db.security_audit_log.findMany({
          where,
          take: limit,
          skip: offset,
          orderBy: { event_time: 'desc' },
        }),
        ctx.db.security_audit_log.count({ where }),
      ]);

      return {
        logs: logs.map((log) => ({
          id: log.id,
          eventTime: log.event_time,
          userId: log.user_id,
          userEmail: log.user_email,
          action: log.action,
          tableName: log.table_name,
          recordId: log.record_id,
          oldData: log.old_data,
          newData: log.new_data,
          ipAddress: log.ip_address,
          userAgent: log.user_agent,
        })),
        total,
        hasMore: offset + limit < total,
      };
    }),

  /**
   * Get SSO login audit logs
   */
  getLoginLogs: protectedProcedure
    .input(
      z.object({
        search: z.string().optional(),
        userId: z.string().uuid().optional(),
        success: z.boolean().optional(),
        loginType: z.string().optional(),
        dateRange: dateRangeSchema.optional(),
        limit: z.number().min(1).max(100).default(50),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ input, ctx }) => {
      const { search, userId, success, loginType, dateRange, limit, offset } = input;

      const where: any = {};

      // Note: Using toLowerCase to avoid Prisma/PostgreSQL compatibility issues with mode: 'insensitive'
      if (search) {
        const searchLower = search.toLowerCase();
        where.OR = [
          { google_email: { contains: searchLower } },
          { ip_address: { contains: searchLower } },
        ];
      }

      if (userId) {
        where.user_id = userId;
      }

      if (success !== undefined) {
        where.success = success;
      }

      if (loginType) {
        where.login_type = loginType;
      }

      if (dateRange) {
        where.login_time = {};
        if (dateRange.from) {
          where.login_time.gte = dateRange.from;
        }
        if (dateRange.to) {
          where.login_time.lte = dateRange.to;
        }
      }

      const [logs, total] = await Promise.all([
        ctx.db.sso_login_audit.findMany({
          where,
          take: limit,
          skip: offset,
          orderBy: { login_time: 'desc' },
        }),
        ctx.db.sso_login_audit.count({ where }),
      ]);

      // Get user profiles for the logs
      const userIds = logs.map((log) => log.user_id).filter((id): id is string => id !== null);
      // Note: select not supported by wrapper, fetching full records
      const profiles = await ctx.db.user_profiles.findMany({
        where: { id: { in: userIds } },
      });
      const profileMap = new Map(profiles.map((p) => [p.id, p.name]));

      return {
        logs: logs.map((log) => ({
          id: log.id,
          userId: log.user_id,
          userName: log.user_id ? profileMap.get(log.user_id) || undefined : undefined,
          googleEmail: log.google_email,
          loginTime: log.login_time,
          loginType: log.login_type,
          ipAddress: log.ip_address,
          userAgent: log.user_agent,
          success: log.success,
          errorMessage: log.error_message,
          sessionId: log.session_id,
        })),
        total,
        hasMore: offset + limit < total,
      };
    }),

  // ==================
  // ANALYTICS & STATS
  // ==================

  /**
   * Get activity statistics for dashboard
   */
  getActivityStats: protectedProcedure
    .input(
      z.object({
        days: z.number().min(1).max(90).default(30),
      })
    )
    .query(async ({ input, ctx }) => {
      const { days } = input;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      // Convert to ISO string to avoid timezone format issues with PostgreSQL
      const startDateISO = startDate.toISOString();

      // Get counts for different log types with error handling for RLS/missing tables
      const [adminLogsCount, securityLogsCount, loginLogsCount, failedLoginsCount] = await Promise.allSettled([
        ctx.db.admin_audit_log.count({
          where: {
            created_at: { gte: startDateISO },
          },
        }),
        ctx.db.security_audit_log.count({
          where: {
            event_time: { gte: startDateISO },
          },
        }),
        ctx.db.sso_login_audit.count({
          where: {
            login_time: { gte: startDateISO },
          },
        }),
        ctx.db.sso_login_audit.count({
          where: {
            login_time: { gte: startDateISO },
            success: false,
          },
        }),
      ]).then(results => results.map(r => r.status === 'fulfilled' ? r.value : 0));

      // Get recent actions breakdown
      // Note: groupBy not supported by wrapper, using findMany + manual grouping
      let allActions: Array<Record<string, any>> = [];
      try {
        allActions = await ctx.db.admin_audit_log.findMany({
          where: {
            created_at: { gte: startDateISO },
          },
          select: {
            action: true,
          },
        });
      } catch (error) {
        console.error('Error fetching admin actions:', error);
      }

      // Group by action manually
      const actionGroups = allActions.reduce((acc: Record<string, number>, log) => {
        const action = log.action || 'unknown';
        // eslint-disable-next-line security/detect-object-injection
        acc[action] = (acc[action] || 0) + 1;
        return acc;
      }, {});

      // Convert to array and sort by count
      const recentActions = Object.entries(actionGroups)
        .map(([action, count]) => ({
          action,
          _count: count,
        }))
        .sort((a, b) => b._count - a._count)
        .slice(0, 10);

      // Get top users by activity
      // Note: groupBy not supported by wrapper, using findMany + manual grouping
      let allUserActions: Array<Record<string, any>> = [];
      try {
        allUserActions = await ctx.db.admin_audit_log.findMany({
          where: {
            created_at: { gte: startDateISO },
            user_email: { not: null },
          },
          select: {
            user_email: true,
          },
        });
      } catch (error) {
        console.error('Error fetching user actions:', error);
      }

      // Group by user_email manually
      const userGroups = allUserActions.reduce((acc: Record<string, number>, log) => {
        const email = log.user_email!;
        // eslint-disable-next-line security/detect-object-injection
        acc[email] = (acc[email] || 0) + 1;
        return acc;
      }, {});

      // Convert to array and sort by count
      const topUsers = Object.entries(userGroups)
        .map(([user_email, count]) => ({
          user_email,
          _count: count,
        }))
        .sort((a, b) => b._count - a._count)
        .slice(0, 10);

      return {
        adminLogsCount,
        securityLogsCount,
        loginLogsCount,
        failedLoginsCount,
        recentActions: recentActions.map((item) => ({
          action: item.action,
          count: item._count,
        })),
        topUsers: topUsers.map((item) => ({
          email: item.user_email,
          count: item._count,
        })),
      };
    }),

  /**
   * Get user activity summary
   */
  getUserActivitySummary: protectedProcedure
    .input(
      z.object({
        userId: z.string().uuid(),
        days: z.number().min(1).max(90).default(30),
      })
    )
    .query(async ({ input, ctx }) => {
      const { userId, days } = input;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      // Note: findFirst not supported by wrapper, using findMany
      const [adminActions, securityEvents, loginAttempts, lastLoginArray] = await Promise.all([
        ctx.db.admin_audit_log.count({
          where: {
            user_id: userId,
            created_at: { gte: startDate },
          },
        }),
        ctx.db.security_audit_log.count({
          where: {
            user_id: userId,
            event_time: { gte: startDate },
          },
        }),
        ctx.db.sso_login_audit.count({
          where: {
            user_id: userId,
            login_time: { gte: startDate },
          },
        }),
        ctx.db.sso_login_audit.findMany({
          where: {
            user_id: userId,
            success: true,
          },
          orderBy: { login_time: 'desc' },
          take: 1,
        }),
      ]);

      const lastLogin = lastLoginArray.length > 0 ? { login_time: lastLoginArray[0]?.login_time } : null;

      return {
        adminActions,
        securityEvents,
        loginAttempts,
        lastLoginAt: lastLogin?.login_time,
      };
    }),
});
