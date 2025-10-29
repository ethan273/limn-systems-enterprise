import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '../trpc/init';
import { TRPCError } from '@trpc/server';

/**
 * Permission Usage Log Router
 *
 * Manages permission_usage_log table using ctx.db pattern.
 * Covers permission audit trail and access analytics.
 */

const resultEnum = z.enum(['granted', 'denied']);

export const permissionUsageLogRouter = createTRPCRouter({
  /**
   * Get log entry by ID
   */
  getById: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const entry = await ctx.db.permission_usage_log.findUnique({
        where: { id: input.id },
        select: {
          id: true,
          user_id: true,
          permission_id: true,
          resource_type: true,
          resource_id: true,
          action: true,
          result: true,
          denial_reason: true,
          ip_address: true,
          user_agent: true,
          session_id: true,
          timestamp: true,
          metadata: true,
          permission_definitions: {
            select: {
              permission_key: true,
              permission_name: true,
            },
          },
          users: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      if (!entry) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Permission usage log entry not found',
        });
      }

      return entry;
    }),

  /**
   * Get all log entries (paginated)
   */
  getAll: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(50),
        cursor: z.string().uuid().optional(),
        user_id: z.string().uuid().optional(),
        permission_id: z.string().uuid().optional(),
        result: resultEnum.optional(),
        start_date: z.date().optional(),
        end_date: z.date().optional(),
        resource_type: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { limit, cursor, user_id, permission_id, result, start_date, end_date, resource_type } = input;

      const where: any = {};

      if (user_id) {
        where.user_id = user_id;
      }

      if (permission_id) {
        where.permission_id = permission_id;
      }

      if (result) {
        where.result = result;
      }

      if (resource_type) {
        where.resource_type = resource_type;
      }

      if (start_date || end_date) {
        where.timestamp = {};
        if (start_date) {
          where.timestamp.gte = start_date;
        }
        if (end_date) {
          where.timestamp.lte = end_date;
        }
      }

      const entries = await ctx.db.permission_usage_log.findMany({
        where,
        take: limit + 1,
        cursor: cursor ? { id: cursor } : undefined,
        orderBy: { timestamp: 'desc' },
        select: {
          id: true,
          user_id: true,
          permission_id: true,
          resource_type: true,
          resource_id: true,
          action: true,
          result: true,
          denial_reason: true,
          ip_address: true,
          timestamp: true,
          permission_definitions: {
            select: {
              permission_key: true,
              permission_name: true,
            },
          },
          users: {
            select: {
              name: true,
            },
          },
        },
      });

      let nextCursor: string | undefined;
      if (entries.length > limit) {
        const nextItem = entries.pop();
        nextCursor = nextItem?.id;
      }

      return {
        entries,
        nextCursor,
      };
    }),

  /**
   * Get logs for user
   */
  getByUser: protectedProcedure
    .input(
      z.object({
        user_id: z.string().uuid(),
        limit: z.number().min(1).max(100).default(50),
        result: resultEnum.optional(),
        start_date: z.date().optional(),
        end_date: z.date().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const where: any = {
        user_id: input.user_id,
      };

      if (input.result) {
        where.result = input.result;
      }

      if (input.start_date || input.end_date) {
        where.timestamp = {};
        if (input.start_date) {
          where.timestamp.gte = input.start_date;
        }
        if (input.end_date) {
          where.timestamp.lte = input.end_date;
        }
      }

      const entries = await ctx.db.permission_usage_log.findMany({
        where,
        take: input.limit,
        orderBy: { timestamp: 'desc' },
        select: {
          id: true,
          permission_id: true,
          resource_type: true,
          action: true,
          result: true,
          denial_reason: true,
          timestamp: true,
          permission_definitions: {
            select: {
              permission_key: true,
              permission_name: true,
            },
          },
        },
      });

      return entries;
    }),

  /**
   * Get my usage logs
   */
  getMy: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(50),
        result: resultEnum.optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const entries = await ctx.db.permission_usage_log.findMany({
        where: {
          user_id: ctx.user!.id,
          ...(input.result && { result: input.result }),
        },
        take: input.limit,
        orderBy: { timestamp: 'desc' },
        select: {
          id: true,
          permission_id: true,
          resource_type: true,
          resource_id: true,
          action: true,
          result: true,
          denial_reason: true,
          timestamp: true,
          permission_definitions: {
            select: {
              permission_key: true,
              permission_name: true,
            },
          },
        },
      });

      return entries;
    }),

  /**
   * Get logs for permission
   */
  getByPermission: protectedProcedure
    .input(
      z.object({
        permission_id: z.string().uuid(),
        limit: z.number().min(1).max(100).default(50),
        result: resultEnum.optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const entries = await ctx.db.permission_usage_log.findMany({
        where: {
          permission_id: input.permission_id,
          ...(input.result && { result: input.result }),
        },
        take: input.limit,
        orderBy: { timestamp: 'desc' },
        select: {
          id: true,
          user_id: true,
          resource_type: true,
          action: true,
          result: true,
          denial_reason: true,
          timestamp: true,
          users: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      });

      return entries;
    }),

  /**
   * Get denied access attempts
   */
  getDenied: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(50),
        user_id: z.string().uuid().optional(),
        start_date: z.date().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const where: any = {
        result: 'denied',
      };

      if (input.user_id) {
        where.user_id = input.user_id;
      }

      if (input.start_date) {
        where.timestamp = {
          gte: input.start_date,
        };
      }

      const entries = await ctx.db.permission_usage_log.findMany({
        where,
        take: input.limit,
        orderBy: { timestamp: 'desc' },
        select: {
          id: true,
          user_id: true,
          permission_id: true,
          resource_type: true,
          action: true,
          denial_reason: true,
          timestamp: true,
          ip_address: true,
          users: {
            select: {
              name: true,
              email: true,
            },
          },
          permission_definitions: {
            select: {
              permission_key: true,
              permission_name: true,
            },
          },
        },
      });

      return entries;
    }),

  /**
   * Create log entry
   */
  create: protectedProcedure
    .input(
      z.object({
        user_id: z.string().uuid(),
        permission_id: z.string().uuid(),
        resource_type: z.string().optional(),
        resource_id: z.string().optional(),
        action: z.string().optional(),
        result: resultEnum,
        denial_reason: z.string().optional(),
        ip_address: z.string().optional(),
        user_agent: z.string().optional(),
        session_id: z.string().uuid().optional(),
        metadata: z.record(z.any()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const newEntry = await ctx.db.permission_usage_log.create({
        data: input,
        select: {
          id: true,
          user_id: true,
          permission_id: true,
          result: true,
          timestamp: true,
        },
      });

      return newEntry;
    }),

  /**
   * Get usage statistics
   */
  getStats: protectedProcedure
    .input(
      z.object({
        start_date: z.date().optional(),
        end_date: z.date().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const where: any = {};

      if (input.start_date || input.end_date) {
        where.timestamp = {};
        if (input.start_date) {
          where.timestamp.gte = input.start_date;
        }
        if (input.end_date) {
          where.timestamp.lte = input.end_date;
        }
      }

      const [total, granted, denied, byPermission] = await Promise.all([
        ctx.db.permission_usage_log.count({ where }),
        ctx.db.permission_usage_log.count({ where: { ...where, result: 'granted' } }),
        ctx.db.permission_usage_log.count({ where: { ...where, result: 'denied' } }),
        ctx.db.permission_usage_log.groupBy({
          by: ['permission_id'],
          where,
          _count: true,
          orderBy: {
            _count: {
              permission_id: 'desc',
            },
          },
          take: 10,
        }),
      ]);

      const grantRate = total > 0 ? Math.round((granted / total) * 1000) / 10 : 0;

      return {
        total,
        granted,
        denied,
        grantRate,
        topPermissions: byPermission.map(p => ({
          permission_id: p.permission_id,
          usage_count: p._count,
        })),
      };
    }),
});
