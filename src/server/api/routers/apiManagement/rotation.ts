/**
 * Credential Rotation tRPC Router
 *
 * API endpoints for zero-downtime credential rotation
 */

import { z } from 'zod';
import { createTRPCRouter, superAdminProcedure } from '../../trpc/init';
import {
  initiateRotation,
  completeRotation,
  rollbackRotation,
  getRotationStatus,
  getRotationHistory,
  cancelRotation,
  supportsRotation,
} from '@/lib/api-management/credential-rotation';

export const rotationRouter = createTRPCRouter({
  /**
   * Check if a credential supports automatic rotation
   */
  supportsRotation: superAdminProcedure
    .input(
      z.object({
        credentialId: z.string(),
      })
    )
    .query(async ({ input }) => {
      return supportsRotation(input.credentialId);
    }),

  /**
   * Get rotation status for a credential
   */
  getRotationStatus: superAdminProcedure
    .input(
      z.object({
        credentialId: z.string(),
      })
    )
    .query(async ({ input }) => {
      return getRotationStatus(input.credentialId);
    }),

  /**
   * Get rotation history for a credential
   */
  getRotationHistory: superAdminProcedure
    .input(
      z.object({
        credentialId: z.string(),
        limit: z.number().int().min(1).max(100).default(50),
      })
    )
    .query(async ({ input }) => {
      return getRotationHistory(input.credentialId, input.limit);
    }),

  /**
   * Initiate credential rotation
   */
  initiateRotation: superAdminProcedure
    .input(
      z.object({
        credentialId: z.string(),
        config: z
          .object({
            gracePeriodMinutes: z.number().int().min(1).max(60).optional(),
            healthCheckCount: z.number().int().min(1).max(10).optional(),
            healthCheckIntervalMs: z.number().int().min(1000).max(300000).optional(),
            autoRollbackOnFailure: z.boolean().optional(),
          })
          .optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      return initiateRotation(
        input.credentialId,
        ctx.session.user.id,
        input.config
      );
    }),

  /**
   * Complete a rotation in grace period
   */
  completeRotation: superAdminProcedure
    .input(
      z.object({
        sessionId: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      await completeRotation(input.sessionId);
      return { success: true };
    }),

  /**
   * Rollback a failed rotation
   */
  rollbackRotation: superAdminProcedure
    .input(
      z.object({
        sessionId: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      await rollbackRotation(input.sessionId);
      return { success: true };
    }),

  /**
   * Cancel an ongoing rotation (only in grace period)
   */
  cancelRotation: superAdminProcedure
    .input(
      z.object({
        sessionId: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      await cancelRotation(input.sessionId);
      return { success: true };
    }),
});
