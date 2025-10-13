/**
 * Background Jobs tRPC Router
 *
 * API endpoints for background job management
 */

import { z } from 'zod';
import { createTRPCRouter, superAdminProcedure } from '../../trpc/init';
import {
  triggerJob,
  getJobsStatus,
  getJobHistory,
  type JobType,
} from '@/lib/api-management/background-jobs';

export const jobsRouter = createTRPCRouter({
  /**
   * Get status of all background jobs
   */
  getJobsStatus: superAdminProcedure.query(async () => {
    return getJobsStatus();
  }),

  /**
   * Get execution history for a job type
   */
  getJobHistory: superAdminProcedure
    .input(
      z.object({
        jobType: z
          .enum([
            'health_check',
            'emergency_expiration',
            'credential_expiration_warning',
            'audit_log_cleanup',
            'health_history_cleanup',
          ])
          .optional(),
        limit: z.number().int().min(1).max(100).default(50),
      })
    )
    .query(async ({ input }) => {
      return getJobHistory(input.jobType as JobType | undefined, input.limit);
    }),

  /**
   * Manually trigger a background job
   */
  triggerJob: superAdminProcedure
    .input(
      z.object({
        jobType: z.enum([
          'health_check',
          'emergency_expiration',
          'credential_expiration_warning',
          'audit_log_cleanup',
          'health_history_cleanup',
        ]),
      })
    )
    .mutation(async ({ input }) => {
      return triggerJob(input.jobType as JobType);
    }),
});
