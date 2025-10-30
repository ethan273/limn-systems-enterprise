/**
 * Workflows tRPC Router - Phase 2C
 * Note: Simplified for MVP - automation_workflows table to be created
 */
import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '../trpc/init';

export const workflowsRouter = createTRPCRouter({
  getByEntity: protectedProcedure
    .input(z.object({
      entityType: z.enum(['shop_drawing', 'production_order', 'project', 'task']),
      entityId: z.string().uuid(),
    }))
    .query(async () => {
      // MVP: Return structure for workflow (table to be created)
      return { id: 'placeholder', status: 'active', nodes: [], edges: [] };
    }),

  getApprovalStatus: protectedProcedure
    .input(z.object({ shopDrawingId: z.string().uuid() }))
    .query(async () => {
      // MVP: Return placeholder status
      return { hasWorkflow: false, status: 'pending' as const };
    }),
});
