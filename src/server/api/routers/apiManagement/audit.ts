/**
 * Audit tRPC Router
 *
 * Provides API endpoints for audit logging and compliance reporting
 */

import { z } from 'zod';
import { createTRPCRouter, superAdminProcedure } from '../../trpc/init';
import {
  getAuditLogs,
  getAuditStatistics,
  generateComplianceReport,
  exportAuditLogsToCSV,
} from '@/lib/api-management/audit-logger';

export const auditRouter = createTRPCRouter({
  /**
   * Get audit logs with filters and pagination
   */
  getAuditLogs: superAdminProcedure
    .input(
      z.object({
        credentialId: z.string().optional(),
        userId: z.string().optional(),
        action: z.string().optional(),
        success: z.boolean().optional(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
        limit: z.number().min(1).max(100).default(50),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ input }) => {
      const { startDate, endDate, ...rest } = input;

      return await getAuditLogs({
        ...rest,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
      });
    }),

  /**
   * Get audit statistics for a date range
   */
  getAuditStatistics: superAdminProcedure
    .input(
      z.object({
        startDate: z.string(),
        endDate: z.string(),
      })
    )
    .query(async ({ input }) => {
      return await getAuditStatistics(
        new Date(input.startDate),
        new Date(input.endDate)
      );
    }),

  /**
   * Generate compliance report (SOC2 or PCI DSS)
   */
  generateComplianceReport: superAdminProcedure
    .input(
      z.object({
        startDate: z.string(),
        endDate: z.string(),
        type: z.enum(['soc2', 'pci_dss', 'all']),
      })
    )
    .query(async ({ input }) => {
      return await generateComplianceReport({
        startDate: new Date(input.startDate),
        endDate: new Date(input.endDate),
        type: input.type,
      });
    }),

  /**
   * Export audit logs to CSV
   */
  exportAuditLogs: superAdminProcedure
    .input(
      z.object({
        credentialId: z.string().optional(),
        userId: z.string().optional(),
        action: z.string().optional(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { startDate, endDate, ...rest } = input;

      const csv = await exportAuditLogsToCSV({
        ...rest,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
      });

      return {
        csv,
        filename: `audit-logs-${new Date().toISOString().split('T')[0]}.csv`,
      };
    }),
});
