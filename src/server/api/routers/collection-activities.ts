import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '../trpc/init';
import { TRPCError } from '@trpc/server';

/**
 * Collection Activities Router
 *
 * Manages collection_activities table using ctx.db pattern.
 * Tracks activity and changes on material collections.
 */

export const collectionActivitiesRouter = createTRPCRouter({
  /**
   * Get activity by ID
   */
  getById: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const activity = await ctx.db.collection_activities.findUnique({
        where: { id: input.id },
        select: {
          id: true,
          collection_id: true,
          user_id: true,
          activity_type: true,
          description: true,
          metadata: true,
          created_at: true,
          collections: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
          user_profiles: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      if (!activity) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Activity not found',
        });
      }

      return activity;
    }),

  /**
   * Get all activities (paginated)
   */
  getAll: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(50),
        cursor: z.string().uuid().optional(),
        collection_id: z.string().uuid().optional(),
        user_id: z.string().uuid().optional(),
        activity_type: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { limit, cursor, collection_id, user_id, activity_type } = input;

      const where: any = {};

      if (collection_id) {
        where.collection_id = collection_id;
      }

      if (user_id) {
        where.user_id = user_id;
      }

      if (activity_type) {
        where.activity_type = activity_type;
      }

      const activities = await ctx.db.collection_activities.findMany({
        where,
        take: limit + 1,
        cursor: cursor ? { id: cursor } : undefined,
        orderBy: { created_at: 'desc' },
        select: {
          id: true,
          collection_id: true,
          user_id: true,
          activity_type: true,
          description: true,
          metadata: true,
          created_at: true,
          user_profiles: {
            select: {
              name: true,
            },
          },
          collections: {
            select: {
              name: true,
            },
          },
        },
      });

      let nextCursor: string | undefined;
      if (activities.length > limit) {
        const nextItem = activities.pop();
        nextCursor = nextItem?.id;
      }

      return {
        activities,
        nextCursor,
      };
    }),

  /**
   * Get activities for collection
   */
  getByCollection: protectedProcedure
    .input(
      z.object({
        collection_id: z.string().uuid(),
        limit: z.number().min(1).max(100).default(50),
      })
    )
    .query(async ({ ctx, input }) => {
      const activities = await ctx.db.collection_activities.findMany({
        where: {
          collection_id: input.collection_id,
        },
        take: input.limit,
        orderBy: { created_at: 'desc' },
        select: {
          id: true,
          user_id: true,
          activity_type: true,
          description: true,
          metadata: true,
          created_at: true,
          user_profiles: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      });

      return activities;
    }),

  /**
   * Get activities by user
   */
  getByUser: protectedProcedure
    .input(
      z.object({
        user_id: z.string().uuid().optional(),
        limit: z.number().min(1).max(100).default(50),
      })
    )
    .query(async ({ ctx, input }) => {
      const userId = input.user_id || ctx.user!.id;

      const activities = await ctx.db.collection_activities.findMany({
        where: {
          user_id: userId,
        },
        take: input.limit,
        orderBy: { created_at: 'desc' },
        select: {
          id: true,
          collection_id: true,
          activity_type: true,
          description: true,
          created_at: true,
          collections: {
            select: {
              name: true,
            },
          },
        },
      });

      return activities;
    }),

  /**
   * Create activity log entry
   */
  create: protectedProcedure
    .input(
      z.object({
        collection_id: z.string().uuid(),
        activity_type: z.string(),
        description: z.string().optional(),
        metadata: z.any().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const newActivity = await ctx.db.collection_activities.create({
        data: {
          collection_id: input.collection_id,
          user_id: ctx.user!.id,
          activity_type: input.activity_type,
          description: input.description,
          metadata: input.metadata,
        },
        select: {
          id: true,
          collection_id: true,
          activity_type: true,
          description: true,
          created_at: true,
        },
      });

      return newActivity;
    }),

  /**
   * Delete activity
   */
  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const activity = await ctx.db.collection_activities.findUnique({
        where: { id: input.id },
        select: { id: true },
      });

      if (!activity) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Activity not found',
        });
      }

      await ctx.db.collection_activities.delete({
        where: { id: input.id },
      });

      return { success: true };
    }),

  /**
   * Get recent activities across all collections
   */
  getRecent: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(20),
      })
    )
    .query(async ({ ctx, input }) => {
      const activities = await ctx.db.collection_activities.findMany({
        take: input.limit,
        orderBy: { created_at: 'desc' },
        select: {
          id: true,
          collection_id: true,
          user_id: true,
          activity_type: true,
          description: true,
          created_at: true,
          user_profiles: {
            select: {
              name: true,
            },
          },
          collections: {
            select: {
              name: true,
            },
          },
        },
      });

      return activities;
    }),

  /**
   * Get statistics
   */
  getStats: protectedProcedure.query(async ({ ctx }) => {
    const [total, byType, byCollection] = await Promise.all([
      ctx.db.collection_activities.count(),
      ctx.db.collection_activities.groupBy({
        by: ['activity_type'],
        _count: true,
        orderBy: {
          _count: {
            activity_type: 'desc',
          },
        },
      }),
      ctx.db.collection_activities.groupBy({
        by: ['collection_id'],
        _count: true,
        orderBy: {
          _count: {
            collection_id: 'desc',
          },
        },
        take: 10,
      }),
    ]);

    return {
      total,
      byType: byType.map(a => ({
        activity_type: a.activity_type,
        count: a._count,
      })),
      topCollections: byCollection.map(c => ({
        collection_id: c.collection_id,
        activity_count: c._count,
      })),
    };
  }),
});
