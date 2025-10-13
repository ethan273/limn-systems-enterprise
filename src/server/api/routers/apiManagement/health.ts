/**
 * Health Monitoring tRPC Router
 *
 * API endpoints for credential health monitoring
 */

import { z } from 'zod';
import { createTRPCRouter, superAdminProcedure } from '../../trpc/init';
import {
  performHealthCheck,
  getHealthStatus,
  getHealthHistory,
  calculateUptime,
  getHealthDashboard,
  performAllHealthChecks,
} from '@/lib/api-management/health-monitor';

export const healthRouter = createTRPCRouter({
  /**
   * Get current health status for a credential
   */
  getHealthStatus: superAdminProcedure
    .input(
      z.object({
        credentialId: z.string(),
      })
    )
    .query(async ({ input }) => {
      return getHealthStatus(input.credentialId);
    }),

  /**
   * Get health check history for a credential
   */
  getHealthHistory: superAdminProcedure
    .input(
      z.object({
        credentialId: z.string(),
        days: z.number().int().min(1).max(365).default(30),
      })
    )
    .query(async ({ input }) => {
      return getHealthHistory(input.credentialId, input.days);
    }),

  /**
   * Calculate uptime metrics for a credential
   */
  getUptimeMetrics: superAdminProcedure
    .input(
      z.object({
        credentialId: z.string(),
        days: z.number().int().min(1).max(365).default(30),
      })
    )
    .query(async ({ input }) => {
      return calculateUptime(input.credentialId, input.days);
    }),

  /**
   * Get health dashboard with all credentials
   */
  getHealthDashboard: superAdminProcedure.query(async () => {
    return getHealthDashboard();
  }),

  /**
   * Manually trigger health check for a credential
   */
  performHealthCheck: superAdminProcedure
    .input(
      z.object({
        credentialId: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      return performHealthCheck(input.credentialId);
    }),

  /**
   * Trigger health checks for all credentials
   */
  performAllHealthChecks: superAdminProcedure.mutation(async () => {
    return performAllHealthChecks();
  }),
});
