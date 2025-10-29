import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '../trpc/init';
import { TRPCError } from '@trpc/server';

/**
 * Session Tracking Router
 *
 * Manages session_tracking table using ctx.db pattern.
 * Covers security monitoring, session analytics, and suspicious activity detection.
 */

export const sessionTrackingRouter = createTRPCRouter({
  /**
   * Get session tracking record by ID
   */
  getById: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const tracking = await ctx.db.session_tracking.findUnique({
        where: { id: input.id },
        select: {
          id: true,
          session_id: true,
          user_id: true,
          ip_address: true,
          user_agent: true,
          geo_location: true,
          is_suspicious: true,
          login_at: true,
          last_activity_at: true,
          logout_at: true,
          session_metadata: true,
          created_at: true,
          updated_at: true,
        },
      });

      if (!tracking) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Session tracking record not found',
        });
      }

      return tracking;
    }),

  /**
   * Get session tracking for a specific session
   */
  getBySession: protectedProcedure
    .input(z.object({ session_id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const tracking = await ctx.db.session_tracking.findFirst({
        where: { session_id: input.session_id },
        select: {
          id: true,
          session_id: true,
          user_id: true,
          ip_address: true,
          user_agent: true,
          geo_location: true,
          is_suspicious: true,
          login_at: true,
          last_activity_at: true,
          logout_at: true,
          session_metadata: true,
        },
      });

      return tracking;
    }),

  /**
   * Get all sessions for a user
   */
  getByUser: protectedProcedure
    .input(
      z.object({
        user_id: z.string().uuid(),
        limit: z.number().min(1).max(100).default(50),
        cursor: z.string().uuid().optional(),
        active_only: z.boolean().default(false),
      })
    )
    .query(async ({ ctx, input }) => {
      const { user_id, limit, cursor, active_only } = input;

      const where: any = { user_id };

      if (active_only) {
        where.logout_at = null;
      }

      const sessions = await ctx.db.session_tracking.findMany({
        where,
        take: limit + 1,
        cursor: cursor ? { id: cursor } : undefined,
        orderBy: { login_at: 'desc' },
        select: {
          id: true,
          session_id: true,
          ip_address: true,
          user_agent: true,
          geo_location: true,
          is_suspicious: true,
          login_at: true,
          last_activity_at: true,
          logout_at: true,
        },
      });

      let nextCursor: string | undefined;
      if (sessions.length > limit) {
        const nextItem = sessions.pop();
        nextCursor = nextItem?.id;
      }

      return {
        sessions,
        nextCursor,
      };
    }),

  /**
   * Get current user's sessions
   */
  getMySessions: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(50).default(20),
        active_only: z.boolean().default(false),
      })
    )
    .query(async ({ ctx, input }) => {
      const where: any = { user_id: ctx.user!.id };

      if (input.active_only) {
        where.logout_at = null;
      }

      const sessions = await ctx.db.session_tracking.findMany({
        where,
        take: input.limit,
        orderBy: { login_at: 'desc' },
        select: {
          id: true,
          session_id: true,
          ip_address: true,
          user_agent: true,
          geo_location: true,
          is_suspicious: true,
          login_at: true,
          last_activity_at: true,
          logout_at: true,
        },
      });

      return sessions;
    }),

  /**
   * Get active sessions across all users (admin only)
   */
  getActiveSessions: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(50),
      })
    )
    .query(async ({ ctx, input }) => {
      const sessions = await ctx.db.session_tracking.findMany({
        where: {
          logout_at: null,
        },
        take: input.limit,
        orderBy: { last_activity_at: 'desc' },
        select: {
          id: true,
          session_id: true,
          user_id: true,
          ip_address: true,
          user_agent: true,
          geo_location: true,
          is_suspicious: true,
          login_at: true,
          last_activity_at: true,
        },
      });

      return sessions;
    }),

  /**
   * Get suspicious sessions (admin only)
   */
  getSuspiciousSessions: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(50),
        active_only: z.boolean().default(false),
      })
    )
    .query(async ({ ctx, input }) => {
      const where: any = {
        is_suspicious: true,
      };

      if (input.active_only) {
        where.logout_at = null;
      }

      const sessions = await ctx.db.session_tracking.findMany({
        where,
        take: input.limit,
        orderBy: { last_activity_at: 'desc' },
        select: {
          id: true,
          session_id: true,
          user_id: true,
          ip_address: true,
          user_agent: true,
          geo_location: true,
          login_at: true,
          last_activity_at: true,
          logout_at: true,
          session_metadata: true,
        },
      });

      return sessions;
    }),

  /**
   * Record new login
   */
  recordLogin: protectedProcedure
    .input(
      z.object({
        session_id: z.string().uuid(),
        user_id: z.string().uuid(),
        ip_address: z.string(),
        user_agent: z.string().optional(),
        geo_location: z.record(z.any()).optional(),
        session_metadata: z.record(z.any()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const tracking = await ctx.db.session_tracking.create({
        data: input,
        select: {
          id: true,
          session_id: true,
          user_id: true,
          login_at: true,
        },
      });

      return tracking;
    }),

  /**
   * Record session activity (update last_activity_at)
   */
  recordActivity: protectedProcedure
    .input(
      z.object({
        session_id: z.string().uuid(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const tracking = await ctx.db.session_tracking.findFirst({
        where: {
          session_id: input.session_id,
          logout_at: null,
        },
      });

      if (!tracking) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Active session not found',
        });
      }

      const updated = await ctx.db.session_tracking.update({
        where: { id: tracking.id },
        data: {
          last_activity_at: new Date(),
          updated_at: new Date(),
        },
        select: {
          id: true,
          last_activity_at: true,
        },
      });

      return updated;
    }),

  /**
   * Record logout
   */
  recordLogout: protectedProcedure
    .input(
      z.object({
        session_id: z.string().uuid(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const tracking = await ctx.db.session_tracking.findFirst({
        where: {
          session_id: input.session_id,
        },
      });

      if (!tracking) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Session tracking record not found',
        });
      }

      const updated = await ctx.db.session_tracking.update({
        where: { id: tracking.id },
        data: {
          logout_at: new Date(),
          updated_at: new Date(),
        },
        select: {
          id: true,
          session_id: true,
          logout_at: true,
        },
      });

      return updated;
    }),

  /**
   * Mark session as suspicious
   */
  markSuspicious: protectedProcedure
    .input(
      z.object({
        session_id: z.string().uuid(),
        reason: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const tracking = await ctx.db.session_tracking.findFirst({
        where: { session_id: input.session_id },
      });

      if (!tracking) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Session tracking record not found',
        });
      }

      const metadata = (tracking.session_metadata as any) || {};
      if (input.reason) {
        metadata.suspicious_reason = input.reason;
        metadata.marked_suspicious_at = new Date();
      }

      const updated = await ctx.db.session_tracking.update({
        where: { id: tracking.id },
        data: {
          is_suspicious: true,
          session_metadata: metadata,
          updated_at: new Date(),
        },
        select: {
          id: true,
          session_id: true,
          is_suspicious: true,
          session_metadata: true,
        },
      });

      return updated;
    }),

  /**
   * Get session tracking statistics
   */
  getStats: protectedProcedure.query(async ({ ctx }) => {
    const [
      totalSessions,
      activeSessions,
      suspiciousSessions,
      avgSessionDuration,
    ] = await Promise.all([
      ctx.db.session_tracking.count(),
      ctx.db.session_tracking.count({ where: { logout_at: null } }),
      ctx.db.session_tracking.count({ where: { is_suspicious: true } }),
      // Calculate average session duration for completed sessions
      ctx.db.$queryRaw<Array<{ avg_minutes: number }>>`
        SELECT EXTRACT(EPOCH FROM AVG(logout_at - login_at)) / 60 as avg_minutes
        FROM session_tracking
        WHERE logout_at IS NOT NULL
      `,
    ]);

    // Get sessions by day for last 7 days
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const recentSessions = await ctx.db.session_tracking.count({
      where: {
        login_at: {
          gte: sevenDaysAgo,
        },
      },
    });

    return {
      totalSessions,
      activeSessions,
      suspiciousSessions,
      suspiciousPercentage: totalSessions > 0
        ? Math.round((suspiciousSessions / totalSessions) * 1000) / 10
        : 0,
      avgSessionDurationMinutes: avgSessionDuration[0]?.avg_minutes
        ? Math.round(avgSessionDuration[0].avg_minutes * 10) / 10
        : 0,
      recentSessions7Days: recentSessions,
    };
  }),

  /**
   * Get sessions by IP address (security investigation)
   */
  getByIpAddress: protectedProcedure
    .input(
      z.object({
        ip_address: z.string(),
        limit: z.number().min(1).max(100).default(50),
      })
    )
    .query(async ({ ctx, input }) => {
      const sessions = await ctx.db.session_tracking.findMany({
        where: {
          ip_address: input.ip_address,
        },
        take: input.limit,
        orderBy: { login_at: 'desc' },
        select: {
          id: true,
          session_id: true,
          user_id: true,
          user_agent: true,
          geo_location: true,
          is_suspicious: true,
          login_at: true,
          last_activity_at: true,
          logout_at: true,
        },
      });

      return sessions;
    }),
});
