/**
 * Email Campaigns tRPC Router
 *
 * API endpoints for email campaign management
 *
 * @module emailCampaigns
 * @created 2025-10-26
 * @phase Grand Plan Phase 5
 */

import { z } from 'zod';
import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
  emailRateLimitedProcedure,
  campaignRateLimitedProcedure,
} from '../trpc/init';
import {
  EmailCampaignService,
  EmailSendingService,
} from '@/lib/services/email-service';

// =====================================================
// VALIDATION SCHEMAS
// =====================================================

const recipientSchema = z.object({
  email: z.string().email(),
  name: z.string().optional(),
}).passthrough(); // Allow additional merge variables

const createCampaignSchema = z.object({
  campaign_name: z.string().min(1).max(255),
  subject_line: z.string().min(1),
  email_template: z.string().min(1),
  from_name: z.string().max(100).optional(),
  from_email: z.string().email().optional(),
  reply_to: z.string().email().optional(),
  recipient_list: z.array(recipientSchema).default([]),
  segment_criteria: z.record(z.any()).optional(),
  scheduled_for: z.date().optional(),
  status: z.enum(['draft', 'scheduled', 'sending', 'sent', 'cancelled']).default('draft'),
});

const updateCampaignSchema = z.object({
  campaign_name: z.string().min(1).max(255).optional(),
  subject_line: z.string().min(1).optional(),
  email_template: z.string().min(1).optional(),
  from_name: z.string().max(100).optional(),
  from_email: z.string().email().optional(),
  reply_to: z.string().email().optional(),
  recipient_list: z.array(recipientSchema).optional(),
  segment_criteria: z.record(z.any()).optional(),
  scheduled_for: z.date().optional(),
  status: z.enum(['draft', 'scheduled', 'sending', 'sent', 'cancelled']).optional(),
});

const listCampaignsSchema = z.object({
  status: z.string().optional(),
  created_by: z.string().uuid().optional(),
  limit: z.number().int().min(1).max(100).default(50),
  offset: z.number().int().min(0).default(0),
});

// =====================================================
// ROUTER
// =====================================================

export const emailCampaignsRouter = createTRPCRouter({
  /**
   * Create a new campaign
   */
  create: campaignRateLimitedProcedure
    .input(createCampaignSchema)
    .mutation(async ({ input, ctx }) => {
      const service = new EmailCampaignService(ctx.db);
      const userId = ctx.session.user.id;

      return await service.create(input, userId);
    }),

  /**
   * Get campaign by ID
   */
  getById: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ input, ctx }) => {
      const service = new EmailCampaignService(ctx.db);
      const campaign = await service.getById(input.id);

      if (!campaign) {
        throw new Error('Campaign not found');
      }

      return campaign;
    }),

  /**
   * List campaigns
   */
  list: protectedProcedure
    .input(listCampaignsSchema.optional())
    .query(async ({ input, ctx }) => {
      const service = new EmailCampaignService(ctx.db);
      return await service.list(input);
    }),

  /**
   * List user's campaigns
   */
  listMyCampaigns: protectedProcedure
    .input(
      z.object({
        status: z.string().optional(),
        limit: z.number().int().min(1).max(100).default(50),
        offset: z.number().int().min(0).default(0),
      }).optional()
    )
    .query(async ({ input, ctx }) => {
      const service = new EmailCampaignService(ctx.db);
      const userId = ctx.session.user.id;

      return await service.list({
        ...input,
        created_by: userId,
      });
    }),

  /**
   * Update a campaign
   */
  update: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        data: updateCampaignSchema,
      })
    )
    .mutation(async ({ input, ctx }) => {
      const service = new EmailCampaignService(ctx.db);
      return await service.update(input.id, input.data);
    }),

  /**
   * Delete a campaign
   */
  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ input, ctx }) => {
      const service = new EmailCampaignService(ctx.db);
      await service.delete(input.id);
      return { success: true };
    }),

  /**
   * Send a campaign immediately
   */
  send: campaignRateLimitedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ input, ctx }) => {
      const service = new EmailCampaignService(ctx.db);
      return await service.send(input.id);
    }),

  /**
   * Schedule a campaign
   */
  schedule: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        scheduled_for: z.date(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const service = new EmailCampaignService(ctx.db);
      return await service.update(input.id, {
        scheduled_for: input.scheduled_for,
        status: 'scheduled',
      });
    }),

  /**
   * Cancel a campaign
   */
  cancel: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ input, ctx }) => {
      const service = new EmailCampaignService(ctx.db);
      return await service.update(input.id, {
        status: 'cancelled',
      });
    }),

  /**
   * Get campaign metrics
   */
  getMetrics: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ input, ctx }) => {
      const service = new EmailCampaignService(ctx.db);
      return await service.getMetrics(input.id);
    }),

  /**
   * Get campaign statistics (all campaigns)
   */
  getStats: protectedProcedure
    .query(async ({ ctx }) => {
      const campaigns = await ctx.db.email_campaigns.groupBy({
        by: ['status'],
        _count: { id: true },
        _sum: {
          total_recipients: true,
          sent_count: true,
          open_count: true,
          click_count: true,
          bounce_count: true,
          unsubscribe_count: true,
        },
      });

      return campaigns.map((item: {
        status: string;
        _count: { id: number };
        _sum: {
          total_recipients: number | null;
          sent_count: number | null;
          open_count: number | null;
          click_count: number | null;
          bounce_count: number | null;
          unsubscribe_count: number | null;
        }
      }) => ({
        status: item.status,
        count: item._count.id,
        total_recipients: item._sum.total_recipients ?? 0,
        sent_count: item._sum.sent_count ?? 0,
        open_count: item._sum.open_count ?? 0,
        click_count: item._sum.click_count ?? 0,
        bounce_count: item._sum.bounce_count ?? 0,
        unsubscribe_count: item._sum.unsubscribe_count ?? 0,
      }));
    }),

  /**
   * Process email queue (admin only)
   */
  processQueue: emailRateLimitedProcedure
    .input(
      z.object({
        limit: z.number().int().min(1).max(1000).default(100),
      }).optional()
    )
    .mutation(async ({ input, ctx }) => {
      const service = new EmailSendingService(ctx.db);
      return await service.processQueue(input?.limit);
    }),

  /**
   * Get queue status
   */
  getQueueStatus: protectedProcedure
    .query(async ({ ctx }) => {
      const stats = await ctx.db.email_queue.groupBy({
        by: ['status'],
        _count: { id: true },
      });

      return stats.map((item: { status: string; _count: { id: number } }) => ({
        status: item.status,
        count: item._count.id,
      }));
    }),

  /**
   * Unsubscribe from emails (public endpoint)
   */
  unsubscribe: publicProcedure
    .input(z.object({ token: z.string() }))
    .mutation(async ({ input, ctx }) => {
      // Find the email queue item by unsubscribe token
      const queueItem = await ctx.db.email_queue.findUnique({
        where: { unsubscribe_token: input.token },
        select: {
          recipient_email: true,
          campaign_id: true,
        },
      });

      if (!queueItem) {
        throw new Error('Invalid unsubscribe token');
      }

      const recipientEmail = queueItem.recipient_email;

      // Check if already unsubscribed
      const existing = await ctx.db.email_unsubscribes.findUnique({
        where: { email: recipientEmail },
      });

      if (existing) {
        return {
          success: true,
          message: 'Email already unsubscribed',
          email: recipientEmail,
        };
      }

      // Track the unsubscribe event
      await ctx.db.email_tracking.create({
        data: {
          campaign_id: queueItem.campaign_id,
          recipient_email: recipientEmail,
          event_type: 'unsubscribed',
          event_data: {
            reason: 'user_request',
            token: input.token,
          },
        },
      });

      // Add to unsubscribe list
      await ctx.db.email_unsubscribes.create({
        data: {
          email: recipientEmail,
          reason: 'user_request',
          campaign_id: queueItem.campaign_id,
          metadata: {
            unsubscribed_via: 'web',
            token: input.token,
          },
        },
      });

      // Update campaign unsubscribe count if campaign exists
      if (queueItem.campaign_id) {
        await ctx.db.email_campaigns.update({
          where: { id: queueItem.campaign_id },
          data: {
            unsubscribe_count: { increment: 1 },
            updated_at: new Date(),
          },
        });
      }

      return {
        success: true,
        message: 'Successfully unsubscribed',
        email: recipientEmail,
      };
    }),
});
