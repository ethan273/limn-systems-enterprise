/**
 * Workflow Monitoring & Alerting tRPC Router - Phase 3D
 * System monitoring, performance tracking, and alerting for workflows
 */
import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '../trpc/init';
import { TRPCError } from '@trpc/server';

const AlertRuleSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  metric: z.enum([
    'execution_time',
    'failure_rate',
    'queue_size',
    'resource_usage',
    'custom'
  ]),
  threshold_type: z.enum(['above', 'below', 'equals']),
  threshold_value: z.number(),
  alert_channels: z.array(z.enum(['email', 'in_app', 'google_chat'])),
  recipient_user_ids: z.array(z.string().uuid()).optional(),
  is_active: z.boolean().default(true),
});

export const workflowMonitoringRouter = createTRPCRouter({
  /**
   * Get workflow execution metrics
   */
  getExecutionMetrics: protectedProcedure
    .input(z.object({
      workflowId: z.string().uuid().optional(),
      timeRange: z.enum(['1h', '24h', '7d', '30d']).default('24h'),
    }))
    .query(async ({ ctx, input }) => {
      const userId = ctx.user?.id;
      if (!userId) {
        throw new TRPCError({ code: 'UNAUTHORIZED', message: 'User not authenticated' });
      }

      // Calculate time range
      const now = new Date();
      const rangeMap = {
        '1h': 60 * 60 * 1000,
        '24h': 24 * 60 * 60 * 1000,
        '7d': 7 * 24 * 60 * 60 * 1000,
        '30d': 30 * 24 * 60 * 60 * 1000,
      };
      const startTime = new Date(now.getTime() - rangeMap[input.timeRange]);

      const where: any = {
        created_at: { gte: startTime },
      };
      if (input.workflowId) where.workflow_id = input.workflowId;

      const executions = await ctx.db.automation_logs.findMany({
        where,
        orderBy: { created_at: 'desc' },
      });

      const totalExecutions = executions.length;
      const successfulExecutions = executions.filter(e => e.status === 'success').length;
      const failedExecutions = executions.filter(e => e.status === 'error').length;
      const avgExecutionTime = executions.length > 0
        ? executions.reduce((acc, e) => {
            const start = new Date(e.created_at).getTime();
            const end = e.updated_at ? new Date(e.updated_at).getTime() : start;
            return acc + (end - start);
          }, 0) / executions.length
        : 0;

      return {
        totalExecutions,
        successfulExecutions,
        failedExecutions,
        successRate: totalExecutions > 0
          ? Math.round((successfulExecutions / totalExecutions) * 100)
          : 0,
        avgExecutionTimeMs: Math.round(avgExecutionTime),
      };
    }),

  /**
   * Get failed workflows
   */
  getFailedWorkflows: protectedProcedure
    .input(z.object({
      limit: z.number().default(20),
      workflowId: z.string().uuid().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const where: any = { status: 'error' };
      if (input.workflowId) where.workflow_id = input.workflowId;

      const failures = await ctx.db.automation_logs.findMany({
        where,
        take: input.limit,
        orderBy: { created_at: 'desc' },
      });

      return { failures, total: failures.length };
    }),

  /**
   * Get workflow performance trends
   */
  getPerformanceTrends: protectedProcedure
    .input(z.object({
      workflowId: z.string().uuid().optional(),
      days: z.number().default(7),
    }))
    .query(async ({ ctx, input }) => {
      const startDate = new Date(Date.now() - input.days * 24 * 60 * 60 * 1000);

      const where: any = {
        created_at: { gte: startDate },
      };
      if (input.workflowId) where.workflow_id = input.workflowId;

      const executions = await ctx.db.automation_logs.findMany({
        where,
        orderBy: { created_at: 'asc' },
      });

      // Group by day
      const trendsByDay = executions.reduce((acc: any, exec) => {
        const day = new Date(exec.created_at).toISOString().split('T')[0];
        if (!acc[day]) {
          acc[day] = { date: day, total: 0, success: 0, failed: 0 };
        }
        acc[day].total++;
        if (exec.status === 'success') acc[day].success++;
        if (exec.status === 'error') acc[day].failed++;
        return acc;
      }, {});

      return { trends: Object.values(trendsByDay) };
    }),

  /**
   * Get all alert rules
   */
  getAlertRules: protectedProcedure
    .input(z.object({
      isActive: z.boolean().optional(),
      limit: z.number().default(50),
    }))
    .query(async ({ ctx: _ctx, input: _input }) => {
      // For MVP, return empty array (alert_rules table to be created)
      // In production, query ctx.db.alert_rules
      return { rules: [], total: 0 };
    }),

  /**
   * Create alert rule
   */
  createAlertRule: protectedProcedure
    .input(AlertRuleSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user?.id;
      if (!userId) {
        throw new TRPCError({ code: 'UNAUTHORIZED', message: 'User not authenticated' });
      }

      // For MVP, log to automation_logs
      await ctx.db.automation_logs.create({
        data: {
          status: 'success',
          triggered_by: userId,
          execution_context: {
            type: 'alert_rule_created',
            rule: input,
          } as any,
          result: { message: 'Alert rule created (MVP)' } as any,
        },
      });

      return {
        success: true,
        message: 'Alert rule created (MVP - using automation_logs)',
      };
    }),

  /**
   * Update alert rule
   */
  updateAlertRule: protectedProcedure
    .input(z.object({
      id: z.string().uuid(),
      data: AlertRuleSchema.partial(),
    }))
    .mutation(async ({ ctx: _ctx, input: _input }) => {
      // MVP placeholder
      return { success: true, message: 'Alert rule updated (MVP)' };
    }),

  /**
   * Delete alert rule
   */
  deleteAlertRule: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx: _ctx, input: _input }) => {
      // MVP placeholder
      return { success: true, message: 'Alert rule deleted (MVP)' };
    }),

  /**
   * Get triggered alerts
   */
  getTriggeredAlerts: protectedProcedure
    .input(z.object({
      status: z.enum(['active', 'acknowledged', 'resolved']).optional(),
      limit: z.number().default(50),
    }))
    .query(async ({ ctx, input }) => {
      // For MVP, return recent error logs as alerts
      const alerts = await ctx.db.automation_logs.findMany({
        where: { status: 'error' },
        take: input.limit,
        orderBy: { created_at: 'desc' },
      });

      return { alerts: alerts.map(log => ({
        id: log.id,
        message: `Workflow execution failed`,
        status: 'active',
        createdAt: log.created_at,
        details: log.result,
      })) };
    }),

  /**
   * Acknowledge alert
   */
  acknowledgeAlert: protectedProcedure
    .input(z.object({
      alertId: z.string().uuid(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user?.id;
      if (!userId) {
        throw new TRPCError({ code: 'UNAUTHORIZED', message: 'User not authenticated' });
      }

      // MVP: Log acknowledgment
      await ctx.db.automation_logs.create({
        data: {
          status: 'success',
          triggered_by: userId,
          execution_context: {
            type: 'alert_acknowledged',
            alertId: input.alertId,
            notes: input.notes,
          } as any,
          result: { message: 'Alert acknowledged' } as any,
        },
      });

      return { success: true };
    }),

  /**
   * Get system health status
   */
  getSystemHealth: protectedProcedure
    .query(async ({ ctx }) => {
      const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);

      const totalWorkflows = await ctx.db.automation_rules.count({
        where: { is_active: true },
      });

      const recentExecutions = await ctx.db.automation_logs.count({
        where: { created_at: { gte: last24Hours } },
      });

      const recentFailures = await ctx.db.automation_logs.count({
        where: {
          created_at: { gte: last24Hours },
          status: 'error',
        },
      });

      const failureRate = recentExecutions > 0
        ? Math.round((recentFailures / recentExecutions) * 100)
        : 0;

      const healthStatus = failureRate < 5 ? 'healthy' : failureRate < 15 ? 'warning' : 'critical';

      return {
        status: healthStatus,
        activeWorkflows: totalWorkflows,
        executionsLast24h: recentExecutions,
        failuresLast24h: recentFailures,
        failureRate,
      };
    }),

  /**
   * Get workflow execution queue status
   */
  getQueueStatus: protectedProcedure
    .query(async ({ ctx }) => {
      const pendingExecutions = await ctx.db.automation_logs.count({
        where: { status: 'pending' },
      });

      const runningExecutions = await ctx.db.automation_logs.count({
        where: { status: 'running' },
      });

      return {
        pending: pendingExecutions,
        running: runningExecutions,
        total: pendingExecutions + runningExecutions,
      };
    }),
});
