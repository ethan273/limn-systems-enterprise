/**
 * Real-Time Events tRPC Router - Phase 2D (Enhanced)
 * Event publishing and retrieval using real_time_events table
 */
import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '../trpc/init';
import { TRPCError } from '@trpc/server';

export const realtimeEventsRouter = createTRPCRouter({
  /**
   * Publish real-time event
   */
  publishEvent: protectedProcedure
    .input(z.object({
      eventType: z.enum(['message', 'notification', 'status_change', 'workflow_update']),
      eventName: z.string().optional(),
      entityType: z.string(),
      entityId: z.string().uuid(),
      data: z.record(z.any()),
      metadata: z.record(z.any()).optional(),
      recipients: z.array(z.string().uuid()).optional(),
      priority: z.enum(['low', 'normal', 'high', 'urgent']).default('normal'),
      expiresInMinutes: z.number().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user?.id;
      if (!userId) {
        throw new TRPCError({ code: 'UNAUTHORIZED', message: 'User not authenticated' });
      }

      const expiresAt = input.expiresInMinutes
        ? new Date(Date.now() + input.expiresInMinutes * 60 * 1000)
        : null;

      const event = await ctx.db.real_time_events.create({
        data: {
          event_type: input.eventType,
          event_name: input.eventName || undefined,
          entity_type: input.entityType,
          entity_id: input.entityId,
          event_data: input.data as any,
          metadata: (input.metadata as any) || {},
          recipient_user_ids: input.recipients || [],
          priority: input.priority,
          status: 'pending',
          expires_at: expiresAt,
          triggered_by: userId,
        },
      });

      // TODO: Publish to WebSocket/SSE channels

      return {
        success: true,
        eventId: event.id,
        status: event.status,
      };
    }),

  /**
   * Get recent events
   */
  getRecentEvents: protectedProcedure
    .input(z.object({
      limit: z.number().default(50),
      entityType: z.string().optional(),
      eventType: z.enum(['message', 'notification', 'status_change', 'workflow_update']).optional(),
      status: z.enum(['pending', 'delivered', 'expired']).optional(),
    }))
    .query(async ({ ctx, input }) => {
      const where: any = {};
      if (input.entityType) where.entity_type = input.entityType;
      if (input.eventType) where.event_type = input.eventType;
      if (input.status) where.status = input.status;

      const events = await ctx.db.real_time_events.findMany({
        where,
        take: input.limit,
        orderBy: { created_at: 'desc' },
      });

      return { events, total: events.length };
    }),

  /**
   * Get events for user
   */
  getMyEvents: protectedProcedure
    .input(z.object({
      limit: z.number().default(50),
      undeliveredOnly: z.boolean().default(false),
    }))
    .query(async ({ ctx, input }) => {
      const userId = ctx.user?.id;
      if (!userId) {
        throw new TRPCError({ code: 'UNAUTHORIZED', message: 'User not authenticated' });
      }

      // Find events where user is a recipient and hasn't been delivered yet
      const events = await ctx.db.real_time_events.findMany({
        where: {
          recipient_user_ids: { has: userId },
          ...(input.undeliveredOnly && {
            status: 'pending',
          }),
        },
        take: input.limit,
        orderBy: { created_at: 'desc' },
      });

      return { events, total: events.length };
    }),

  /**
   * Mark event as delivered to user
   */
  markDelivered: protectedProcedure
    .input(z.object({
      eventId: z.string().uuid(),
    }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user?.id;
      if (!userId) {
        throw new TRPCError({ code: 'UNAUTHORIZED', message: 'User not authenticated' });
      }

      const event = await ctx.db.real_time_events.findUnique({
        where: { id: input.eventId },
      });

      if (!event) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Event not found' });
      }

      // Add user to delivered_to array if not already there
      const deliveredTo = event.delivered_to || [];
      if (!deliveredTo.includes(userId)) {
        deliveredTo.push(userId);
      }

      // Check if all recipients have received the event
      const allRecipients = event.recipient_user_ids || [];
      const allDelivered = allRecipients.every(recipientId =>
        deliveredTo.includes(recipientId)
      );

      await ctx.db.real_time_events.update({
        where: { id: input.eventId },
        data: {
          delivered_to: deliveredTo,
          status: allDelivered ? 'delivered' : 'pending',
          delivered_at: allDelivered ? new Date() : undefined,
        },
      });

      return { success: true };
    }),

  /**
   * Get event by ID
   */
  getById: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const event = await ctx.db.real_time_events.findUnique({
        where: { id: input.id },
      });

      if (!event) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Event not found' });
      }

      return event;
    }),

  /**
   * Get events by entity
   */
  getByEntity: protectedProcedure
    .input(z.object({
      entityType: z.string(),
      entityId: z.string().uuid(),
      limit: z.number().default(50),
    }))
    .query(async ({ ctx, input }) => {
      const events = await ctx.db.real_time_events.findMany({
        where: {
          entity_type: input.entityType,
          entity_id: input.entityId,
        },
        take: input.limit,
        orderBy: { created_at: 'desc' },
      });

      return { events, total: events.length };
    }),

  /**
   * Cleanup expired events (manual trigger for testing)
   */
  cleanupExpired: protectedProcedure
    .mutation(async ({ ctx }) => {
      const userId = ctx.user?.id;
      if (!userId) {
        throw new TRPCError({ code: 'UNAUTHORIZED', message: 'User not authenticated' });
      }

      // Delete expired events
      const result = await ctx.db.real_time_events.deleteMany({
        where: {
          OR: [
            { status: 'expired' },
            {
              expires_at: {
                lt: new Date(),
              },
            },
            {
              status: 'delivered',
              delivered_at: {
                lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
              },
            },
          ],
        },
      });

      return { success: true, deletedCount: result.count };
    }),
});
