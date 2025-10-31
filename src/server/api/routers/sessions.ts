import { log } from '@/lib/logger';
/**
 * Session Management tRPC Router (RBAC Phase 2.2)
 *
 * Provides session management endpoints for:
 * - Viewing active sessions
 * - Terminating individual sessions
 * - Terminating all other sessions (keep current)
 *
 * Security: All procedures require authentication
 */

import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '../trpc/init';
import { TRPCError } from '@trpc/server';
import {
  getUserActiveSessions,
  terminateSession,
  type ActiveSession,
} from '@/lib/services/session-service';

export const sessionsRouter = createTRPCRouter({
  /**
   * Get all active sessions for the current user
   * Returns session metadata including IP, location, device info, last activity
   */
  getActiveSessions: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.session?.user?.id) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'User ID not found in session',
      });
    }

    try {
      const sessions = await getUserActiveSessions(ctx.session.user.id);

      // Transform sessions to include display-friendly data
      const transformedSessions = sessions.map((session: ActiveSession) => ({
        id: session.id,
        sessionId: session.session_id,
        ipAddress: session.ip_address,
        userAgent: session.user_agent,
        geoLocation: session.geo_location,
        isSuspicious: session.is_suspicious,
        loginAt: session.login_at,
        lastActivityAt: session.last_activity_at,
        // Derived fields for UI (these would need to be extracted from session_metadata in DB)
        deviceType: 'Unknown',
        browser: 'Unknown',
        os: 'Unknown',
        isCurrent: false, // Will be set by client based on session comparison
      }));

      return {
        success: true,
        sessions: transformedSessions,
        totalCount: transformedSessions.length,
      };
    } catch (error) {
      log.error('[Sessions] Error fetching active sessions:', { error });
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch active sessions',
      });
    }
  }),

  /**
   * Terminate a specific session by session_tracking ID
   * Can terminate own session or other sessions
   */
  terminateSession: protectedProcedure
    .input(
      z.object({
        sessionTrackingId: z.string().uuid(),
        reason: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.session?.user?.id) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'User ID not found in session',
        });
      }

      try {
        // Verify session belongs to current user
        const sessionToTerminate = await ctx.db.session_tracking.findUnique({
          where: { id: input.sessionTrackingId },
          select: { user_id: true, session_id: true },
        });

        if (!sessionToTerminate) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Session not found',
          });
        }

        if (sessionToTerminate.user_id !== ctx.session.user.id) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'You can only terminate your own sessions',
          });
        }

        // Terminate the session
        await terminateSession(
          sessionToTerminate.session_id,
          input.reason || 'User requested termination'
        );

        log.info(
          `[Sessions] User ${ctx.session.user.id} terminated session ${input.sessionTrackingId}`
        );

        return {
          success: true,
          message: 'Session terminated successfully',
        };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }

        log.error('[Sessions] Error terminating session:', { error });
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to terminate session',
        });
      }
    }),

  /**
   * Terminate all other sessions (keep current session active)
   * Useful for "Sign out all other devices" feature
   */
  terminateAllOtherSessions: protectedProcedure
    .input(
      z.object({
        currentSessionId: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.session?.user?.id) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'User ID not found in session',
        });
      }

      try {
        // Get all active sessions for user
        const activeSessions = await getUserActiveSessions(ctx.session.user.id);

        // Filter out current session (if provided)
        const sessionsToTerminate = activeSessions.filter(
          (session) => session.session_id !== input.currentSessionId
        );

        // Terminate all other sessions
        let terminatedCount = 0;
        const errors: string[] = [];

        for (const session of sessionsToTerminate) {
          try {
            await terminateSession(
              session.session_id,
              'User requested termination of all other sessions'
            );
            terminatedCount++;
          } catch (error) {
            log.error(
              `[Sessions] Failed to terminate session ${session.id}:`,
              error
            );
            errors.push(session.id);
          }
        }

        log.info(
          `[Sessions] User ${ctx.session.user.id} terminated ${terminatedCount}/${sessionsToTerminate.length} other sessions`
        );

        return {
          success: true,
          terminatedCount,
          totalSessions: sessionsToTerminate.length,
          failedSessions: errors,
          message: `${terminatedCount} session(s) terminated successfully`,
        };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }

        log.error('[Sessions] Error terminating all other sessions:', { error });
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to terminate sessions',
        });
      }
    }),

  /**
   * Get session security statistics
   * Shows IP changes, geo anomalies, suspicious activity count
   */
  getSecurityStats: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.session?.user?.id) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'User ID not found in session',
      });
    }

    try {
      // Get all sessions (active and terminated) for stats
      const allSessions = await ctx.db.session_tracking.findMany({
        where: { user_id: ctx.session.user.id },
        select: {
          id: true,
          is_suspicious: true,
          logout_at: true,
          created_at: true,
          ip_address: true,
          geo_location: true,
        },
        orderBy: { created_at: 'desc' },
        take: 100, // Last 100 sessions
      });

      const totalSessions = allSessions.length;
      const activeSessions = allSessions.filter((s) => !s.logout_at).length;
      const suspiciousSessions = allSessions.filter((s) => s.is_suspicious).length;

      // Count unique IPs
      const uniqueIPs = new Set(allSessions.map((s) => s.ip_address)).size;

      // Count unique locations
      const uniqueLocations = new Set(
        allSessions
          .filter((s) => s.geo_location)
          .map((s) => {
            const loc = s.geo_location as any;
            return loc?.city || 'unknown';
          })
      ).size;

      return {
        success: true,
        stats: {
          totalSessions,
          activeSessions,
          suspiciousSessions,
          uniqueIPs,
          uniqueLocations,
          suspiciousActivityRate:
            totalSessions > 0
              ? Math.round((suspiciousSessions / totalSessions) * 100)
              : 0,
        },
      };
    } catch (error) {
      log.error('[Sessions] Error fetching security stats:', { error });
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch security statistics',
      });
    }
  }),
});
