/**
 * Email Analytics tRPC Router
 *
 * API endpoints for email campaign analytics and tracking
 *
 * @module emailAnalytics
 * @created 2025-10-26
 * @phase Grand Plan Phase 5
 */

import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '../trpc/init';
import type {
  EmailEventType,
  TimelineEvent,
  LinkClick,
} from '@/lib/services/email-types';

// =====================================================
// VALIDATION SCHEMAS
// =====================================================

const dateRangeSchema = z.object({
  from: z.date(),
  to: z.date(),
});

const trackEventSchema = z.object({
  campaign_id: z.string().uuid().optional(),
  recipient_email: z.string().email().optional(),
  event_type: z.enum(['sent', 'delivered', 'opened', 'clicked', 'bounced', 'unsubscribed', 'complained']),
  event_data: z.record(z.any()).optional(),
  ip_address: z.string().optional(),
  user_agent: z.string().optional(),
});

// =====================================================
// ROUTER
// =====================================================

export const emailAnalyticsRouter = createTRPCRouter({
  /**
   * Track an email event (for webhooks)
   */
  trackEvent: protectedProcedure
    .input(trackEventSchema)
    .mutation(async ({ input, ctx }) => {
      const event = await ctx.db.email_tracking.create({
        data: {
          campaign_id: input.campaign_id ?? null,
          recipient_email: input.recipient_email ?? null,
          event_type: input.event_type,
          event_data: input.event_data ?? null,
          ip_address: input.ip_address ?? null,
          user_agent: input.user_agent ?? null,
        },
      });

      // Update campaign metrics if campaign_id provided
      if (input.campaign_id) {
        const fieldMap: Record<EmailEventType, string> = {
          sent: 'sent_count',
          delivered: 'sent_count', // Delivered is tracked separately
          opened: 'open_count',
          clicked: 'click_count',
          bounced: 'bounce_count',
          unsubscribed: 'unsubscribe_count',
          complained: 'bounce_count', // Count complaints as bounces
        };

        const field = fieldMap[input.event_type];
        if (field && field !== 'sent_count') {
          // Don't double-increment sent_count
          await ctx.db.email_campaigns.update({
            where: { id: input.campaign_id },
            data: {
              [field]: { increment: 1 },
              updated_at: new Date(),
            },
          });
        }
      }

      return { success: true, event_id: event.id };
    }),

  /**
   * Get campaign timeline
   */
  getCampaignTimeline: protectedProcedure
    .input(
      z.object({
        campaign_id: z.string().uuid(),
        interval: z.enum(['hour', 'day', 'week']).default('day'),
      })
    )
    .query(async ({ input, ctx }) => {
      // Get all events for the campaign
      const events = await ctx.db.email_tracking.findMany({
        where: { campaign_id: input.campaign_id },
        orderBy: { created_at: 'asc' },
      });

      // Group by event type and time interval
      const timeline: Record<string, Record<EmailEventType, number>> = {};

      events.forEach((event: any) => {
        const date = new Date(event.created_at);
        let key: string;

        if (input.interval === 'hour') {
          key = date.toISOString().slice(0, 13); // YYYY-MM-DDTHH
        } else if (input.interval === 'day') {
          key = date.toISOString().slice(0, 10); // YYYY-MM-DD
        } else {
          // week
          const weekStart = new Date(date);
          weekStart.setDate(date.getDate() - date.getDay());
          key = weekStart.toISOString().slice(0, 10);
        }

        if (!timeline[key]) {
          timeline[key] = {
            sent: 0,
            delivered: 0,
            opened: 0,
            clicked: 0,
            bounced: 0,
            unsubscribed: 0,
            complained: 0,
          };
        }

        timeline[key][event.event_type as EmailEventType]++;
      });

      // Convert to array
      const result: TimelineEvent[] = Object.entries(timeline).map(([timestamp, counts]) => ({
        timestamp: new Date(timestamp),
        event_type: 'sent' as EmailEventType, // Not used in this format
        count: Object.values(counts).reduce((a, b) => a + b, 0),
        ...counts, // Include individual counts
      }));

      return result.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    }),

  /**
   * Get top clicked links for a campaign
   */
  getTopLinks: protectedProcedure
    .input(
      z.object({
        campaign_id: z.string().uuid(),
        limit: z.number().int().min(1).max(100).default(10),
      })
    )
    .query(async ({ input, ctx }) => {
      const clicks = await ctx.db.email_tracking.findMany({
        where: {
          campaign_id: input.campaign_id,
          event_type: 'clicked',
        },
        select: {
          event_data: true,
          recipient_email: true,
        },
      });

      // Group by URL
      const urlCounts: Record<string, { total: number; unique: Set<string> }> = {};

      clicks.forEach((click: any) => {
        const url = click.event_data?.link_url;
        if (!url) return;

        if (!urlCounts[url]) {
          urlCounts[url] = { total: 0, unique: new Set() };
        }

        urlCounts[url].total++;
        if (click.recipient_email) {
          urlCounts[url].unique.add(click.recipient_email);
        }
      });

      // Convert to array and sort
      const result: LinkClick[] = Object.entries(urlCounts)
        .map(([url, data]) => ({
          url,
          click_count: data.total,
          unique_clicks: data.unique.size,
        }))
        .sort((a, b) => b.click_count - a.click_count)
        .slice(0, input.limit);

      return result;
    }),

  /**
   * Get event breakdown by type
   */
  getEventBreakdown: protectedProcedure
    .input(
      z.object({
        campaign_id: z.string().uuid().optional(),
        date_range: dateRangeSchema.optional(),
      })
    )
    .query(async ({ input, ctx }) => {
      const where: any = {};

      if (input.campaign_id) {
        where.campaign_id = input.campaign_id;
      }

      if (input.date_range) {
        where.created_at = {
          gte: input.date_range.from,
          lte: input.date_range.to,
        };
      }

      const breakdown = await ctx.db.email_tracking.groupBy({
        by: ['event_type'],
        where,
        _count: { id: true },
      });

      return breakdown.map((item: any) => ({
        event_type: item.event_type,
        count: item._count.id,
      }));
    }),

  /**
   * Get recipient activity
   */
  getRecipientActivity: protectedProcedure
    .input(
      z.object({
        campaign_id: z.string().uuid(),
        recipient_email: z.string().email(),
      })
    )
    .query(async ({ input, ctx }) => {
      const events = await ctx.db.email_tracking.findMany({
        where: {
          campaign_id: input.campaign_id,
          recipient_email: input.recipient_email,
        },
        orderBy: { created_at: 'asc' },
      });

      return events;
    }),

  /**
   * Get engagement over time (all campaigns)
   */
  getEngagementOverTime: protectedProcedure
    .input(
      z.object({
        date_range: dateRangeSchema,
        interval: z.enum(['day', 'week', 'month']).default('day'),
      })
    )
    .query(async ({ input, ctx }) => {
      const events = await ctx.db.email_tracking.findMany({
        where: {
          created_at: {
            gte: input.date_range.from,
            lte: input.date_range.to,
          },
        },
        select: {
          created_at: true,
          event_type: true,
        },
        orderBy: { created_at: 'asc' },
      });

      // Group by interval
      const grouped: Record<string, Record<string, number>> = {};

      events.forEach((event: any) => {
        const date = new Date(event.created_at);
        let key: string;

        if (input.interval === 'day') {
          key = date.toISOString().slice(0, 10);
        } else if (input.interval === 'week') {
          const weekStart = new Date(date);
          weekStart.setDate(date.getDate() - date.getDay());
          key = weekStart.toISOString().slice(0, 10);
        } else {
          // month
          key = date.toISOString().slice(0, 7); // YYYY-MM
        }

        if (!grouped[key]) {
          grouped[key] = {
            sent: 0,
            delivered: 0,
            opened: 0,
            clicked: 0,
            bounced: 0,
            unsubscribed: 0,
            complained: 0,
          };
        }

        grouped[key][event.event_type]++;
      });

      return Object.entries(grouped)
        .map(([date, counts]) => ({
          date,
          ...counts,
        }))
        .sort((a, b) => a.date.localeCompare(b.date));
    }),

  /**
   * Get overall email statistics
   */
  getOverallStats: protectedProcedure
    .input(dateRangeSchema.optional())
    .query(async ({ input, ctx }) => {
      const where: any = {};

      if (input) {
        where.created_at = {
          gte: input.from,
          lte: input.to,
        };
      }

      const [eventCounts, campaignCounts, queueStats] = await Promise.all([
        // Event counts
        ctx.db.email_tracking.groupBy({
          by: ['event_type'],
          where,
          _count: { id: true },
        }),

        // Campaign counts
        ctx.db.email_campaigns.groupBy({
          by: ['status'],
          _count: { id: true },
          _sum: {
            total_recipients: true,
            sent_count: true,
            open_count: true,
            click_count: true,
          },
        }),

        // Queue stats
        ctx.db.email_queue.groupBy({
          by: ['status'],
          _count: { id: true },
        }),
      ]);

      return {
        events: eventCounts.map((item: any) => ({
          event_type: item.event_type,
          count: item._count.id,
        })),
        campaigns: campaignCounts.map((item: any) => ({
          status: item.status,
          count: item._count.id,
          total_recipients: item._sum.total_recipients ?? 0,
          sent_count: item._sum.sent_count ?? 0,
          open_count: item._sum.open_count ?? 0,
          click_count: item._sum.click_count ?? 0,
        })),
        queue: queueStats.map((item: any) => ({
          status: item.status,
          count: item._count.id,
        })),
      };
    }),
});
