/**
 * Flipbook Analytics tRPC Router
 *
 * Provides type-safe API endpoints for flipbook analytics tracking and reporting.
 * Implements:
 * - Event tracking (views, page turns, hotspot clicks, session duration)
 * - Conversion tracking (linking flipbook sessions to orders)
 * - Analytics aggregation (hotspot analytics, session stats, conversion metrics)
 */

import { z } from "zod";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "@/server/api/trpc/init";
import { TRPCError } from "@trpc/server";
import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";

/**
 * Input validation schemas
 */

// Event tracking inputs
const trackViewInput = z.object({
  flipbookId: z.string().uuid(),
  sessionId: z.string().uuid(),
  userId: z.string().uuid().optional(),
  userAgent: z.string().optional(),
  ipAddress: z.string().optional(),
  referrer: z.string().optional(),
  deviceType: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
});

const trackPageTurnInput = z.object({
  flipbookId: z.string().uuid(),
  sessionId: z.string().uuid(),
  pageNumber: z.number().int().min(1),
  userId: z.string().uuid().optional(),
});

const trackHotspotClickInput = z.object({
  flipbookId: z.string().uuid(),
  sessionId: z.string().uuid(),
  hotspotId: z.string().uuid(),
  pageNumber: z.number().int().min(1),
  userId: z.string().uuid().optional(),
});

const trackSessionEndInput = z.object({
  flipbookId: z.string().uuid(),
  sessionId: z.string().uuid(),
  durationSeconds: z.number().int().min(0),
});

const recordConversionInput = z.object({
  flipbookId: z.string().uuid(),
  sessionId: z.string().uuid(),
  orderId: z.string().uuid(),
  userId: z.string().uuid().optional(),
  revenueAmount: z.number().optional(),
  metadata: z.record(z.unknown()).optional(),
});

// Analytics query inputs
const getHotspotAnalyticsInput = z.object({
  flipbookId: z.string().uuid(),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
});

const getSessionDurationStatsInput = z.object({
  flipbookId: z.string().uuid(),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
});

const getConversionMetricsInput = z.object({
  flipbookId: z.string().uuid(),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
});

/**
 * Flipbook Analytics Router
 */
export const flipbookAnalyticsRouter = createTRPCRouter({

  // ========================================
  // EVENT TRACKING MUTATIONS (PUBLIC)
  // ========================================

  /**
   * Track flipbook view (session start)
   * Creates a VIEW event to mark the beginning of a viewing session
   */
  trackView: publicProcedure
    .input(trackViewInput)
    .mutation(async ({ ctx, input }) => {
      try {
        // Verify flipbook exists
        const flipbook = await ctx.db.flipbooks.findUnique({
          where: { id: input.flipbookId },
          select: { id: true },
        });

        if (!flipbook) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Flipbook not found",
          });
        }

        // Create VIEW event
        const event = await ctx.db.analytics_events.create({
          data: {
            flipbook_id: input.flipbookId,
            event_type: "VIEW",
            session_id: input.sessionId,
            user_id: input.userId || null,
            user_agent: input.userAgent || null,
            ip_address: input.ipAddress || null,
            referrer: input.referrer || null,
            device_type: input.deviceType || null,
            metadata: input.metadata || null,
          },
        });

        // Increment flipbook view count
        await ctx.db.flipbooks.update({
          where: { id: input.flipbookId },
          data: {
            view_count: {
              increment: 1,
            },
          },
        });

        return {
          success: true,
          eventId: event.id,
        };
      } catch (error) {
        console.error('[ANALYTICS] Error tracking view:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error instanceof Error ? error.message : 'Failed to track view',
          cause: error,
        });
      }
    }),

  /**
   * Track page turn event
   * Records when a user navigates to a different page
   */
  trackPageTurn: publicProcedure
    .input(trackPageTurnInput)
    .mutation(async ({ ctx, input }) => {
      try {
        const event = await ctx.db.analytics_events.create({
          data: {
            flipbook_id: input.flipbookId,
            event_type: "PAGE_TURN",
            session_id: input.sessionId,
            page_number: input.pageNumber,
            user_id: input.userId || null,
          },
        });

        return {
          success: true,
          eventId: event.id,
        };
      } catch (error) {
        console.error('[ANALYTICS] Error tracking page turn:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error instanceof Error ? error.message : 'Failed to track page turn',
          cause: error,
        });
      }
    }),

  /**
   * Track hotspot click
   * Records when a user clicks on a hotspot and increments the hotspot's click count
   */
  trackHotspotClick: publicProcedure
    .input(trackHotspotClickInput)
    .mutation(async ({ ctx, input }) => {
      try {
        // Create HOTSPOT_CLICK event
        const event = await ctx.db.analytics_events.create({
          data: {
            flipbook_id: input.flipbookId,
            event_type: "HOTSPOT_CLICK",
            session_id: input.sessionId,
            hotspot_id: input.hotspotId,
            page_number: input.pageNumber,
            user_id: input.userId || null,
          },
        });

        // Increment hotspot click count
        await ctx.db.hotspots.update({
          where: { id: input.hotspotId },
          data: {
            click_count: {
              increment: 1,
            },
          },
        });

        return {
          success: true,
          eventId: event.id,
        };
      } catch (error) {
        console.error('[ANALYTICS] Error tracking hotspot click:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error instanceof Error ? error.message : 'Failed to track hotspot click',
          cause: error,
        });
      }
    }),

  /**
   * Track session end (update VIEW event with duration)
   * Updates the initial VIEW event with the total session duration
   */
  trackSessionEnd: publicProcedure
    .input(trackSessionEndInput)
    .mutation(async ({ ctx, input }) => {
      try {
        // Find the VIEW event for this session
        const viewEvents = await ctx.db.analytics_events.findMany({
          where: {
            flipbook_id: input.flipbookId,
            session_id: input.sessionId,
            event_type: "VIEW",
          },
          orderBy: {
            created_at: 'desc',
          },
          take: 1,
        });

        const viewEvent = viewEvents[0];

        if (!viewEvent) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "View event not found for this session",
          });
        }

        // Update the VIEW event with duration
        await ctx.db.analytics_events.update({
          where: { id: viewEvent.id },
          data: {
            duration_seconds: input.durationSeconds,
          },
        });

        return {
          success: true,
          eventId: viewEvent.id,
        };
      } catch (error) {
        console.error('[ANALYTICS] Error tracking session end:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error instanceof Error ? error.message : 'Failed to track session end',
          cause: error,
        });
      }
    }),

  /**
   * Record conversion (link flipbook session to order)
   * Creates a conversion record when a user places an order after viewing a flipbook
   */
  recordConversion: publicProcedure
    .input(recordConversionInput)
    .mutation(async ({ ctx, input }) => {
      try {
        // Verify flipbook exists
        const flipbook = await ctx.db.flipbooks.findUnique({
          where: { id: input.flipbookId },
          select: { id: true },
        });

        if (!flipbook) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Flipbook not found",
          });
        }

        // Verify order exists
        const order = await ctx.db.orders.findUnique({
          where: { id: input.orderId },
        });

        if (!order) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Order not found",
          });
        }

        // Create conversion record
        const conversion = await prisma.flipbook_conversions.create({
          data: {
            flipbook_id: input.flipbookId,
            session_id: input.sessionId,
            order_id: input.orderId,
            user_id: input.userId || null,
            revenue_amount: input.revenueAmount || null,
            metadata: (input.metadata as Prisma.InputJsonValue) ?? undefined,
          },
        });

        return {
          success: true,
          conversionId: conversion.id,
        };
      } catch (error) {
        console.error('[ANALYTICS] Error recording conversion:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error instanceof Error ? error.message : 'Failed to record conversion',
          cause: error,
        });
      }
    }),

  // ========================================
  // ANALYTICS AGGREGATION QUERIES (PROTECTED)
  // ========================================

  /**
   * Get hotspot analytics
   * Returns click counts and engagement metrics for all hotspots in a flipbook
   */
  getHotspotAnalytics: protectedProcedure
    .input(getHotspotAnalyticsInput)
    .query(async ({ ctx, input }) => {
      try {
        // Permission check
        const flipbook = await ctx.db.flipbooks.findUnique({
          where: { id: input.flipbookId },
          select: { created_by_id: true },
        });

        if (!flipbook) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Flipbook not found",
          });
        }

        if (flipbook.created_by_id !== ctx.session.user.id) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You do not have permission to view analytics for this flipbook",
          });
        }

        // Build date filter
        const dateFilter: any = {};
        if (input.startDate || input.endDate) {
          dateFilter.created_at = {};
          if (input.startDate) {
            dateFilter.created_at.gte = input.startDate;
          }
          if (input.endDate) {
            dateFilter.created_at.lte = input.endDate;
          }
        }

        // Get all hotspots for this flipbook with their pages
        const pages = await ctx.db.flipbook_pages.findMany({
          where: { flipbook_id: input.flipbookId },
          select: { id: true, page_number: true },
        });

        const pageIds = pages.map(p => p.id);

        const hotspots = await ctx.db.hotspots.findMany({
          where: { page_id: { in: pageIds } },
          select: {
            id: true,
            page_id: true,
            x_position: true,
            y_position: true,
            width: true,
            height: true,
            target_product_id: true,
            target_url: true,
            click_count: true,
          },
        });

        // Get click events for these hotspots
        const clickEvents = await ctx.db.analytics_events.findMany({
          where: {
            flipbook_id: input.flipbookId,
            event_type: "HOTSPOT_CLICK",
            hotspot_id: { in: hotspots.map(h => h.id) },
            ...dateFilter,
          },
          select: {
            hotspot_id: true,
            created_at: true,
          },
        });

        // Get product details for hotspots that link to products
        const productIds = [...new Set(hotspots.map(h => h.target_product_id).filter((id): id is string => id !== null))];
        const products = productIds.length > 0
          ? await ctx.db.products.findMany({
              where: { id: { in: productIds } },
            })
          : [];

        // Aggregate click data by hotspot
        const hotspotAnalytics = hotspots.map(hotspot => {
          const page = pages.find(p => p.id === hotspot.page_id);
          const product = hotspot.target_product_id
            ? products.find(p => p.id === hotspot.target_product_id)
            : null;
          const clicks = clickEvents.filter(e => e.hotspot_id === hotspot.id);

          return {
            hotspotId: hotspot.id,
            pageNumber: page?.page_number || 0,
            position: {
              x: Number(hotspot.x_position),
              y: Number(hotspot.y_position),
              width: Number(hotspot.width),
              height: Number(hotspot.height),
            },
            product: product ? {
              id: product.id,
              name: product.name,
            } : null,
            targetUrl: hotspot.target_url,
            totalClicks: hotspot.click_count,
            periodClicks: clicks.length,
            clickTrend: clicks.map(c => ({
              timestamp: c.created_at,
            })),
          };
        });

        // Sort by total clicks descending
        hotspotAnalytics.sort((a, b) => b.totalClicks - a.totalClicks);

        return {
          hotspots: hotspotAnalytics,
          totalHotspots: hotspots.length,
          totalClicks: hotspotAnalytics.reduce((sum, h) => sum + h.totalClicks, 0),
          periodClicks: hotspotAnalytics.reduce((sum, h) => sum + h.periodClicks, 0),
        };
      } catch (error) {
        console.error('[ANALYTICS] Error getting hotspot analytics:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error instanceof Error ? error.message : 'Failed to get hotspot analytics',
          cause: error,
        });
      }
    }),

  /**
   * Get session duration statistics
   * Returns average session duration and engagement metrics
   */
  getSessionDurationStats: protectedProcedure
    .input(getSessionDurationStatsInput)
    .query(async ({ ctx, input }) => {
      try {
        // Permission check
        const flipbook = await ctx.db.flipbooks.findUnique({
          where: { id: input.flipbookId },
          select: { created_by_id: true },
        });

        if (!flipbook) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Flipbook not found",
          });
        }

        if (flipbook.created_by_id !== ctx.session.user.id) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You do not have permission to view analytics for this flipbook",
          });
        }

        // Build date filter
        const dateFilter: any = {};
        if (input.startDate || input.endDate) {
          dateFilter.created_at = {};
          if (input.startDate) {
            dateFilter.created_at.gte = input.startDate;
          }
          if (input.endDate) {
            dateFilter.created_at.lte = input.endDate;
          }
        }

        // Get all VIEW events with duration
        const viewEvents = await ctx.db.analytics_events.findMany({
          where: {
            flipbook_id: input.flipbookId,
            event_type: "VIEW",
            duration_seconds: { not: null },
            ...dateFilter,
          },
          select: {
            duration_seconds: true,
            session_id: true,
            created_at: true,
          },
        });

        if (viewEvents.length === 0) {
          return {
            averageDuration: 0,
            medianDuration: 0,
            totalSessions: 0,
            completedSessions: 0,
            durationDistribution: [],
          };
        }

        // Calculate statistics
        const durations = viewEvents
          .map(e => e.duration_seconds)
          .filter((d): d is number => d !== null)
          .sort((a, b) => a - b);

        const totalDuration = durations.reduce((sum, d) => sum + d, 0);
        const averageDuration = Math.round(totalDuration / durations.length);
        const medianDuration = durations.length > 0
          ? durations[Math.floor(durations.length / 2)]
          : 0;

        // Duration distribution (buckets: 0-30s, 30s-1m, 1-2m, 2-5m, 5-10m, 10m+)
        const distribution = [
          { label: '0-30s', min: 0, max: 30, count: 0 },
          { label: '30s-1m', min: 30, max: 60, count: 0 },
          { label: '1-2m', min: 60, max: 120, count: 0 },
          { label: '2-5m', min: 120, max: 300, count: 0 },
          { label: '5-10m', min: 300, max: 600, count: 0 },
          { label: '10m+', min: 600, max: Infinity, count: 0 },
        ];

        durations.forEach(duration => {
          const bucket = distribution.find(b => duration >= b.min && duration < b.max);
          if (bucket) {
            bucket.count++;
          }
        });

        // Get total sessions (including those without duration)
        const totalSessions = await ctx.db.analytics_events.count({
          where: {
            flipbook_id: input.flipbookId,
            event_type: "VIEW",
            ...dateFilter,
          },
        });

        return {
          averageDuration,
          medianDuration,
          totalSessions,
          completedSessions: viewEvents.length,
          durationDistribution: distribution,
          sessionTrend: viewEvents.map(e => ({
            timestamp: e.created_at,
            duration: e.duration_seconds || 0,
          })),
        };
      } catch (error) {
        console.error('[ANALYTICS] Error getting session duration stats:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error instanceof Error ? error.message : 'Failed to get session duration stats',
          cause: error,
        });
      }
    }),

  /**
   * Get conversion metrics
   * Returns conversion rate, revenue, and conversion funnel data
   */
  getConversionMetrics: protectedProcedure
    .input(getConversionMetricsInput)
    .query(async ({ ctx, input }) => {
      try {
        // Permission check
        const flipbook = await ctx.db.flipbooks.findUnique({
          where: { id: input.flipbookId },
          select: { created_by_id: true },
        });

        if (!flipbook) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Flipbook not found",
          });
        }

        if (flipbook.created_by_id !== ctx.session.user.id) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You do not have permission to view analytics for this flipbook",
          });
        }

        // Build date filter
        const dateFilter: any = {};
        if (input.startDate || input.endDate) {
          if (input.startDate) {
            dateFilter.gte = input.startDate;
          }
          if (input.endDate) {
            dateFilter.lte = input.endDate;
          }
        }

        // Get total views in date range
        const totalViews = await ctx.db.analytics_events.count({
          where: {
            flipbook_id: input.flipbookId,
            event_type: "VIEW",
            ...(Object.keys(dateFilter).length > 0 ? { created_at: dateFilter } : {}),
          },
        });

        // Get conversions
        const conversions = await prisma.flipbook_conversions.findMany({
          where: {
            flipbook_id: input.flipbookId,
            ...(Object.keys(dateFilter).length > 0 ? { converted_at: dateFilter } : {}),
          },
          select: {
            id: true,
            order_id: true,
            revenue_amount: true,
            converted_at: true,
          },
        });

        // Calculate metrics
        const totalConversions = conversions.length;
        const conversionRate = totalViews > 0
          ? (totalConversions / totalViews) * 100
          : 0;

        const totalRevenue = conversions.reduce((sum, c) => {
          return sum + (c.revenue_amount ? Number(c.revenue_amount) : 0);
        }, 0);

        const averageOrderValue = totalConversions > 0
          ? totalRevenue / totalConversions
          : 0;

        // Conversion trend over time
        const conversionTrend = conversions.map(c => ({
          timestamp: c.converted_at,
          revenue: c.revenue_amount ? Number(c.revenue_amount) : 0,
        }));

        return {
          totalViews,
          totalConversions,
          conversionRate: Number(conversionRate.toFixed(2)),
          totalRevenue: Number(totalRevenue.toFixed(2)),
          averageOrderValue: Number(averageOrderValue.toFixed(2)),
          conversionTrend,
        };
      } catch (error) {
        console.error('[ANALYTICS] Error getting conversion metrics:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error instanceof Error ? error.message : 'Failed to get conversion metrics',
          cause: error,
        });
      }
    }),
});
