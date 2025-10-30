/**
 * Task Automation tRPC Router - Phase 3C
 * Automated task creation and management based on business rules
 */
import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '../trpc/init';
import { TRPCError } from '@trpc/server';

const AutomationRuleSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  trigger_event: z.enum([
    'order_created',
    'order_status_changed',
    'project_started',
    'production_milestone',
    'qc_failed',
    'payment_received',
    'custom'
  ]),
  conditions: z.record(z.any()).optional(),
  task_template: z.object({
    title: z.string(),
    description: z.string().optional(),
    priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
    due_date_offset_days: z.number().optional(),
    assign_to_role: z.string().optional(),
    assign_to_user_id: z.string().uuid().optional(),
  }),
  is_active: z.boolean().default(true),
});

export const taskAutomationRouter = createTRPCRouter({
  /**
   * Get all automation rules
   */
  getAllRules: protectedProcedure
    .input(z.object({
      triggerEvent: z.enum([
        'order_created',
        'order_status_changed',
        'project_started',
        'production_milestone',
        'qc_failed',
        'payment_received',
        'custom'
      ]).optional(),
      isActive: z.boolean().optional(),
      limit: z.number().default(50),
    }))
    .query(async ({ ctx, input }) => {
      const userId = ctx.user?.id;
      if (!userId) {
        throw new TRPCError({ code: 'UNAUTHORIZED', message: 'User not authenticated' });
      }

      const where: any = {};
      if (input.triggerEvent) where.trigger_event = input.triggerEvent;
      if (input.isActive !== undefined) where.is_active = input.isActive;

      const rules = await ctx.db.automation_rules.findMany({
        where,
        take: input.limit,
        orderBy: { created_at: 'desc' },
      });

      return { rules, total: rules.length };
    }),

  /**
   * Get rule by ID
   */
  getRuleById: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const rule = await ctx.db.automation_rules.findUnique({
        where: { id: input.id },
      });

      if (!rule) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Automation rule not found' });
      }

      return rule;
    }),

  /**
   * Create automation rule
   */
  createRule: protectedProcedure
    .input(AutomationRuleSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user?.id;
      if (!userId) {
        throw new TRPCError({ code: 'UNAUTHORIZED', message: 'User not authenticated' });
      }

      const rule = await ctx.db.automation_rules.create({
        data: {
          name: input.name,
          description: input.description || undefined,
          trigger_event: input.trigger_event,
          conditions: (input.conditions as any) || {},
          action_type: 'create_task',
          action_config: input.task_template as any,
          is_active: input.is_active,
          created_by: userId,
        },
      });

      return { success: true, rule };
    }),

  /**
   * Update automation rule
   */
  updateRule: protectedProcedure
    .input(z.object({
      id: z.string().uuid(),
      data: AutomationRuleSchema.partial(),
    }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user?.id;
      if (!userId) {
        throw new TRPCError({ code: 'UNAUTHORIZED', message: 'User not authenticated' });
      }

      const existing = await ctx.db.automation_rules.findUnique({
        where: { id: input.id },
      });

      if (!existing) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Automation rule not found' });
      }

      const updateData: any = {
        updated_at: new Date(),
      };

      if (input.data.name) updateData.name = input.data.name;
      if (input.data.description !== undefined) updateData.description = input.data.description;
      if (input.data.trigger_event) updateData.trigger_event = input.data.trigger_event;
      if (input.data.conditions) updateData.conditions = input.data.conditions;
      if (input.data.task_template) updateData.action_config = input.data.task_template;
      if (input.data.is_active !== undefined) updateData.is_active = input.data.is_active;

      const rule = await ctx.db.automation_rules.update({
        where: { id: input.id },
        data: updateData,
      });

      return { success: true, rule };
    }),

  /**
   * Delete automation rule
   */
  deleteRule: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.automation_rules.delete({
        where: { id: input.id },
      });

      return { success: true };
    }),

  /**
   * Toggle rule active/inactive
   */
  toggleRuleActive: protectedProcedure
    .input(z.object({
      id: z.string().uuid(),
      isActive: z.boolean(),
    }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.automation_rules.update({
        where: { id: input.id },
        data: { is_active: input.isActive, updated_at: new Date() },
      });

      return { success: true };
    }),

  /**
   * Manually trigger rule (test execution)
   */
  triggerRule: protectedProcedure
    .input(z.object({
      ruleId: z.string().uuid(),
      context: z.record(z.any()).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user?.id;
      if (!userId) {
        throw new TRPCError({ code: 'UNAUTHORIZED', message: 'User not authenticated' });
      }

      const rule = await ctx.db.automation_rules.findUnique({
        where: { id: input.ruleId },
      });

      if (!rule) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Automation rule not found' });
      }

      if (!rule.is_active) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Cannot trigger inactive rule' });
      }

      // Log the execution
      await ctx.db.automation_logs.create({
        data: {
          rule_id: rule.id,
          status: 'success',
          triggered_by: userId,
          execution_context: input.context || {},
          result: { message: 'Manual trigger successful' } as any,
        },
      });

      return { success: true, message: 'Rule triggered successfully' };
    }),

  /**
   * Get automation execution history
   */
  getExecutionHistory: protectedProcedure
    .input(z.object({
      ruleId: z.string().uuid().optional(),
      status: z.enum(['success', 'error', 'pending']).optional(),
      limit: z.number().default(50),
    }))
    .query(async ({ ctx, input }) => {
      const where: any = {};
      if (input.ruleId) where.rule_id = input.ruleId;
      if (input.status) where.status = input.status;

      const logs = await ctx.db.automation_logs.findMany({
        where,
        take: input.limit,
        orderBy: { created_at: 'desc' },
      });

      return { logs, total: logs.length };
    }),

  /**
   * Get automation statistics
   */
  getStats: protectedProcedure
    .query(async ({ ctx }) => {
      const totalRules = await ctx.db.automation_rules.count();
      const activeRules = await ctx.db.automation_rules.count({
        where: { is_active: true },
      });

      const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const executionsLast24h = await ctx.db.automation_logs.count({
        where: {
          created_at: { gte: last24Hours },
        },
      });

      const successfulExecutions = await ctx.db.automation_logs.count({
        where: {
          created_at: { gte: last24Hours },
          status: 'success',
        },
      });

      return {
        totalRules,
        activeRules,
        inactiveRules: totalRules - activeRules,
        executionsLast24h,
        successRate: executionsLast24h > 0
          ? Math.round((successfulExecutions / executionsLast24h) * 100)
          : 0,
      };
    }),

  /**
   * Get rules by trigger event
   */
  getRulesByTrigger: protectedProcedure
    .input(z.object({
      triggerEvent: z.enum([
        'order_created',
        'order_status_changed',
        'project_started',
        'production_milestone',
        'qc_failed',
        'payment_received',
        'custom'
      ]),
    }))
    .query(async ({ ctx, input }) => {
      const rules = await ctx.db.automation_rules.findMany({
        where: {
          trigger_event: input.triggerEvent,
          is_active: true,
        },
        orderBy: { name: 'asc' },
      });

      return { rules };
    }),
});
