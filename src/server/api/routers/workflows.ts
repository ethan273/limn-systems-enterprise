/**
 * Workflows tRPC Router - Phase 2C (Enhanced)
 * Workflow visualization and management using automation_workflows table
 */
import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '../trpc/init';
import { TRPCError } from '@trpc/server';

export const workflowsRouter = createTRPCRouter({
  /**
   * Get workflow by entity
   */
  getByEntity: protectedProcedure
    .input(z.object({
      entityType: z.enum(['shop_drawing', 'production_order', 'project', 'task']),
      entityId: z.string().uuid(),
    }))
    .query(async ({ ctx, input }) => {
      const workflow = await ctx.db.automation_workflows.findFirst({
        where: {
          entity_type: input.entityType,
          entity_id: input.entityId,
          status: 'active',
        },
        orderBy: { created_at: 'desc' },
      });

      if (!workflow) {
        return { hasWorkflow: false, workflow: null };
      }

      return {
        hasWorkflow: true,
        workflow: {
          id: workflow.id,
          name: workflow.name,
          description: workflow.description || undefined,
          status: workflow.status,
          nodes: workflow.nodes,
          edges: workflow.edges,
          config: workflow.config,
        },
      };
    }),

  /**
   * Get approval status for shop drawing
   */
  getApprovalStatus: protectedProcedure
    .input(z.object({ shopDrawingId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const workflow = await ctx.db.automation_workflows.findFirst({
        where: {
          entity_type: 'shop_drawing',
          entity_id: input.shopDrawingId,
          workflow_type: 'approval',
        },
        orderBy: { created_at: 'desc' },
      });

      if (!workflow) {
        return { hasWorkflow: false, status: 'pending' as const };
      }

      return {
        hasWorkflow: true,
        status: workflow.status as 'draft' | 'active' | 'paused' | 'archived',
        workflow: {
          id: workflow.id,
          name: workflow.name,
          nodes: workflow.nodes,
          edges: workflow.edges,
        },
      };
    }),

  /**
   * Create new workflow
   */
  create: protectedProcedure
    .input(z.object({
      name: z.string().min(1),
      description: z.string().optional(),
      workflowType: z.enum(['approval', 'notification', 'task_creation', 'custom']),
      entityType: z.enum(['shop_drawing', 'production_order', 'project', 'task']).optional(),
      entityId: z.string().uuid().optional(),
      nodes: z.array(z.any()).default([]),
      edges: z.array(z.any()).default([]),
      config: z.record(z.any()).default({}),
    }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user?.id;
      if (!userId) {
        throw new TRPCError({ code: 'UNAUTHORIZED', message: 'User not authenticated' });
      }

      const workflow = await ctx.db.automation_workflows.create({
        data: {
          name: input.name,
          description: input.description || undefined,
          workflow_type: input.workflowType,
          entity_type: input.entityType || undefined,
          entity_id: input.entityId || undefined,
          nodes: input.nodes as any,
          edges: input.edges as any,
          config: input.config as any,
          status: 'draft',
          created_by: userId,
        },
      });

      return { success: true, workflow };
    }),

  /**
   * Update workflow
   */
  update: protectedProcedure
    .input(z.object({
      id: z.string().uuid(),
      name: z.string().min(1).optional(),
      description: z.string().optional(),
      nodes: z.array(z.any()).optional(),
      edges: z.array(z.any()).optional(),
      config: z.record(z.any()).optional(),
      status: z.enum(['draft', 'active', 'paused', 'archived']).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user?.id;
      if (!userId) {
        throw new TRPCError({ code: 'UNAUTHORIZED', message: 'User not authenticated' });
      }

      const workflow = await ctx.db.automation_workflows.update({
        where: { id: input.id },
        data: {
          ...(input.name && { name: input.name }),
          ...(input.description !== undefined && { description: input.description }),
          ...(input.nodes && { nodes: input.nodes as any }),
          ...(input.edges && { edges: input.edges as any }),
          ...(input.config && { config: input.config as any }),
          ...(input.status && { status: input.status }),
          updated_by: userId,
        },
      });

      return { success: true, workflow };
    }),

  /**
   * Delete workflow
   */
  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.automation_workflows.delete({
        where: { id: input.id },
      });

      return { success: true };
    }),

  /**
   * Get all workflows with filters
   */
  getAll: protectedProcedure
    .input(z.object({
      workflowType: z.enum(['approval', 'notification', 'task_creation', 'custom']).optional(),
      status: z.enum(['draft', 'active', 'paused', 'archived']).optional(),
      limit: z.number().default(50),
    }))
    .query(async ({ ctx, input }) => {
      const where: any = {};
      if (input.workflowType) where.workflow_type = input.workflowType;
      if (input.status) where.status = input.status;

      const workflows = await ctx.db.automation_workflows.findMany({
        where,
        take: input.limit,
        orderBy: { created_at: 'desc' },
      });

      return { workflows, total: workflows.length };
    }),
});
