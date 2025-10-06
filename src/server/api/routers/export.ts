/**
 * Export Router - Data Export Functionality
 *
 * Provides endpoints for:
 * - User data export (CSV/JSON)
 * - Activity log export
 * - Settings export
 * - Bulk data export
 */

import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '../trpc/init';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ============================================
// INPUT SCHEMAS
// ============================================

const exportFormatSchema = z.enum(['csv', 'json']);

const dateRangeSchema = z.object({
  from: z.date().optional(),
  to: z.date().optional(),
});

// ============================================
// EXPORT ROUTER
// ============================================

export const exportRouter = createTRPCRouter({
  // ==================
  // USER EXPORTS
  // ==================

  /**
   * Export all users to CSV/JSON
   */
  exportUsers: protectedProcedure
    .input(
      z.object({
        format: exportFormatSchema,
        filters: z
          .object({
            userType: z.string().optional(),
            isActive: z.boolean().optional(),
          })
          .optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { format, filters } = input;

      // Build where clause
      const where: any = {};
      if (filters?.isActive !== undefined) {
        where.is_active = filters.isActive;
      }
      if (filters?.userType) {
        where.user_type = filters.userType;
      }

      // Get users
      const users = await prisma.users.findMany({
        select: {
          id: true,
          email: true,
          created_at: true,
          last_sign_in_at: true,
        },
        orderBy: { created_at: 'desc' },
      });

      // Get profiles
      const userIds = users.map((u) => u.id);
      const profiles = await prisma.user_profiles.findMany({
        where: {
          id: { in: userIds },
          ...where,
        },
        select: {
          id: true,
          name: true,
          user_type: true,
          title: true,
          department: true,
          is_active: true,
        },
      });

      const profileMap = new Map(profiles.map((p) => [p.id, p]));

      const exportData = users
        .filter((user) => profileMap.has(user.id))
        .map((user) => {
          const profile = profileMap.get(user.id)!;
          return {
            id: user.id,
            email: user.email,
            name: profile.name || '',
            userType: profile.user_type || 'employee',
            title: profile.title || '',
            department: profile.department || '',
            isActive: profile.is_active ?? true,
            createdAt: user.created_at?.toISOString() || '',
            lastSignInAt: user.last_sign_in_at?.toISOString() || '',
          };
        });

      if (format === 'csv') {
        // Convert to CSV
        const headers = ['ID', 'Email', 'Name', 'User Type', 'Title', 'Department', 'Active', 'Created At', 'Last Sign In'];
        const rows = exportData.map((user) => [
          user.id,
          user.email,
          user.name,
          user.userType,
          user.title,
          user.department,
          user.isActive ? 'Yes' : 'No',
          user.createdAt,
          user.lastSignInAt,
        ]);

        const csv = [headers, ...rows].map((row) => row.join(',')).join('\n');
        return { format: 'csv', data: csv, filename: `users_export_${new Date().toISOString().split('T')[0]}.csv` };
      } else {
        // Return JSON
        return {
          format: 'json',
          data: JSON.stringify(exportData, null, 2),
          filename: `users_export_${new Date().toISOString().split('T')[0]}.json`,
        };
      }
    }),

  /**
   * Export activity logs
   */
  exportActivityLogs: protectedProcedure
    .input(
      z.object({
        format: exportFormatSchema,
        logType: z.enum(['admin', 'security', 'login']),
        dateRange: dateRangeSchema.optional(),
        limit: z.number().min(1).max(10000).default(1000),
      })
    )
    .mutation(async ({ input }) => {
      const { format, logType, dateRange, limit } = input;

      let logs: any[] = [];

      if (logType === 'admin') {
        const where: any = {};
        if (dateRange) {
          where.created_at = {};
          if (dateRange.from) where.created_at.gte = dateRange.from;
          if (dateRange.to) where.created_at.lte = dateRange.to;
        }

        const adminLogs = await prisma.admin_audit_log.findMany({
          where,
          take: limit,
          orderBy: { created_at: 'desc' },
        });

        logs = adminLogs.map((log) => ({
          id: log.id,
          action: log.action || '',
          userEmail: log.user_email || '',
          resourceType: log.resource_type || '',
          resourceId: log.resource_id || '',
          ipAddress: log.ip_address || '',
          createdAt: log.created_at?.toISOString() || '',
        }));
      } else if (logType === 'security') {
        const where: any = {};
        if (dateRange) {
          where.event_time = {};
          if (dateRange.from) where.event_time.gte = dateRange.from;
          if (dateRange.to) where.event_time.lte = dateRange.to;
        }

        const securityLogs = await prisma.security_audit_log.findMany({
          where,
          take: limit,
          orderBy: { event_time: 'desc' },
        });

        logs = securityLogs.map((log) => ({
          id: log.id,
          action: log.action,
          userEmail: log.user_email || '',
          tableName: log.table_name || '',
          recordId: log.record_id || '',
          ipAddress: log.ip_address?.toString() || '',
          eventTime: log.event_time?.toISOString() || '',
        }));
      } else {
        const where: any = {};
        if (dateRange) {
          where.login_time = {};
          if (dateRange.from) where.login_time.gte = dateRange.from;
          if (dateRange.to) where.login_time.lte = dateRange.to;
        }

        const loginLogs = await prisma.sso_login_audit.findMany({
          where,
          take: limit,
          orderBy: { login_time: 'desc' },
        });

        logs = loginLogs.map((log) => ({
          id: log.id,
          googleEmail: log.google_email || '',
          loginType: log.login_type || '',
          success: log.success ? 'Yes' : 'No',
          ipAddress: log.ip_address?.toString() || '',
          loginTime: log.login_time?.toISOString() || '',
        }));
      }

      if (format === 'csv') {
        const headers = Object.keys(logs[0] || {});
        const rows = logs.map((log) => Object.values(log));
        const csv = [headers, ...rows].map((row) => row.join(',')).join('\n');
        return {
          format: 'csv',
          data: csv,
          filename: `${logType}_logs_export_${new Date().toISOString().split('T')[0]}.csv`,
        };
      } else {
        return {
          format: 'json',
          data: JSON.stringify(logs, null, 2),
          filename: `${logType}_logs_export_${new Date().toISOString().split('T')[0]}.json`,
        };
      }
    }),

  /**
   * Export system settings
   */
  exportSettings: protectedProcedure
    .input(
      z.object({
        format: exportFormatSchema,
        category: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { format, category } = input;

      const where = category ? { category } : {};
      const settings = await prisma.admin_settings.findMany({
        where,
        orderBy: [{ category: 'asc' }, { key: 'asc' }],
      });

      const exportData = settings.map((setting) => ({
        category: setting.category,
        key: setting.key,
        value: typeof setting.value === 'object' ? JSON.stringify(setting.value) : String(setting.value || ''),
        updatedAt: setting.updated_at?.toISOString() || '',
      }));

      if (format === 'csv') {
        const headers = ['Category', 'Key', 'Value', 'Updated At'];
        const rows = exportData.map((s) => [s.category, s.key, s.value, s.updatedAt]);
        const csv = [headers, ...rows].map((row) => row.join(',')).join('\n');
        return {
          format: 'csv',
          data: csv,
          filename: `settings_export_${new Date().toISOString().split('T')[0]}.csv`,
        };
      } else {
        return {
          format: 'json',
          data: JSON.stringify(exportData, null, 2),
          filename: `settings_export_${new Date().toISOString().split('T')[0]}.json`,
        };
      }
    }),

  /**
   * Get export statistics
   */
  getExportStats: protectedProcedure.query(async () => {
    const [usersCount, adminLogsCount, securityLogsCount, loginLogsCount, settingsCount] = await Promise.all([
      prisma.users.count(),
      prisma.admin_audit_log.count(),
      prisma.security_audit_log.count(),
      prisma.sso_login_audit.count(),
      prisma.admin_settings.count(),
    ]);

    return {
      users: usersCount,
      adminLogs: adminLogsCount,
      securityLogs: securityLogsCount,
      loginLogs: loginLogsCount,
      settings: settingsCount,
    };
  }),
});
