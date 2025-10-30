/**
 * Workflow Templates tRPC Router - Phase 3B
 * Reusable workflow templates for common automation patterns
 */
import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '../trpc/init';
import { TRPCError } from '@trpc/server';

const WorkflowTemplateSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  category: z.enum(['approval', 'notification', 'task_creation', 'status_update', 'custom']),
  trigger_type: z.enum(['manual', 'scheduled', 'event']),
  config: z.record(z.any()),
  is_active: z.boolean().default(true),
});

export const workflowTemplatesRouter = createTRPCRouter({
  /**
   * Get all workflow templates
   */
  getAll: protectedProcedure
    .input(z.object({
      category: z.enum(['approval', 'notification', 'task_creation', 'status_update', 'custom']).optional(),
      isActive: z.boolean().optional(),
      limit: z.number().default(50),
    }))
    .query(async ({ ctx, input }) => {
      const userId = ctx.user?.id;
      if (!userId) {
        throw new TRPCError({ code: 'UNAUTHORIZED', message: 'User not authenticated' });
      }

      // Build where clause
      const where: any = {};
      if (input.category) where.category = input.category;
      if (input.isActive !== undefined) where.is_active = input.isActive;

      const templates = await ctx.db.workflow_templates.findMany({
        where,
        take: input.limit,
        orderBy: { created_at: 'desc' },
      });

      return { templates, total: templates.length };
    }),

  /**
   * Get template by ID
   */
  getById: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const template = await ctx.db.workflow_templates.findUnique({
        where: { id: input.id },
      });

      if (!template) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Template not found' });
      }

      return template;
    }),

  /**
   * Create new workflow template
   */
  create: protectedProcedure
    .input(WorkflowTemplateSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user?.id;
      if (!userId) {
        throw new TRPCError({ code: 'UNAUTHORIZED', message: 'User not authenticated' });
      }

      const template = await ctx.db.workflow_templates.create({
        data: {
          name: input.name,
          description: input.description || undefined,
          category: input.category,
          trigger_type: input.trigger_type,
          config: input.config as any,
          is_active: input.is_active,
          created_by: userId,
        },
      });

      return { success: true, template };
    }),

  /**
   * Update workflow template
   */
  update: protectedProcedure
    .input(z.object({
      id: z.string().uuid(),
      data: WorkflowTemplateSchema.partial(),
    }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user?.id;
      if (!userId) {
        throw new TRPCError({ code: 'UNAUTHORIZED', message: 'User not authenticated' });
      }

      // Check if template exists
      const existing = await ctx.db.workflow_templates.findUnique({
        where: { id: input.id },
      });

      if (!existing) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Template not found' });
      }

      const template = await ctx.db.workflow_templates.update({
        where: { id: input.id },
        data: {
          ...input.data,
          config: input.data.config as any,
          updated_at: new Date(),
        },
      });

      return { success: true, template };
    }),

  /**
   * Delete workflow template
   */
  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user?.id;
      if (!userId) {
        throw new TRPCError({ code: 'UNAUTHORIZED', message: 'User not authenticated' });
      }

      await ctx.db.workflow_templates.delete({
        where: { id: input.id },
      });

      return { success: true };
    }),

  /**
   * Activate/deactivate template
   */
  toggleActive: protectedProcedure
    .input(z.object({
      id: z.string().uuid(),
      isActive: z.boolean(),
    }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.workflow_templates.update({
        where: { id: input.id },
        data: { is_active: input.isActive, updated_at: new Date() },
      });

      return { success: true };
    }),

  /**
   * Clone template (create copy)
   */
  clone: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user?.id;
      if (!userId) {
        throw new TRPCError({ code: 'UNAUTHORIZED', message: 'User not authenticated' });
      }

      const original = await ctx.db.workflow_templates.findUnique({
        where: { id: input.id },
      });

      if (!original) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Template not found' });
      }

      const clone = await ctx.db.workflow_templates.create({
        data: {
          name: `${original.name} (Copy)`,
          description: original.description || undefined,
          category: original.category,
          trigger_type: original.trigger_type,
          config: original.config as any,
          is_active: false, // Start inactive
          created_by: userId,
        },
      });

      return { success: true, template: clone };
    }),

  /**
   * Get popular templates (most used)
   */
  getPopular: protectedProcedure
    .input(z.object({ limit: z.number().default(10) }))
    .query(async ({ ctx, input }) => {
      // For MVP, return templates ordered by creation date
      // In production, this would use usage analytics
      const templates = await ctx.db.workflow_templates.findMany({
        where: { is_active: true },
        take: input.limit,
        orderBy: { created_at: 'desc' },
      });

      return { templates };
    }),

  /**
   * Get templates by category
   */
  getByCategory: protectedProcedure
    .input(z.object({
      category: z.enum(['approval', 'notification', 'task_creation', 'status_update', 'custom']),
    }))
    .query(async ({ ctx, input }) => {
      const templates = await ctx.db.workflow_templates.findMany({
        where: {
          category: input.category,
          is_active: true,
        },
        orderBy: { name: 'asc' },
      });

      return { templates };
    }),

  /**
   * Get template statistics
   */
  getStats: protectedProcedure.query(async ({ ctx }) => {
    const total = await ctx.db.workflow_templates.count();
    const active = await ctx.db.workflow_templates.count({ where: { is_active: true } });

    return { total, active, inactive: total - active };
  }),
});
