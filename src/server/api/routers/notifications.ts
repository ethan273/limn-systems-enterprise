import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '../trpc/init';
import { getSupabaseAdmin } from '@/lib/supabase';
import { TRPCError } from '@trpc/server';

const supabase = getSupabaseAdmin();

export const notificationsRouter = createTRPCRouter({
  /**
   * Get unread notification count
   * Used for badge display in header
   */
  getUnreadCount: protectedProcedure
    .query(async ({ ctx }) => {
      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', ctx.user!.id)
        .is('read_at', null);

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch notification count',
        });
      }

      return { count: count || 0 };
    }),

  /**
   * Get paginated notifications
   * Used for dropdown panel and full notifications page
   */
  getNotifications: protectedProcedure
    .input(z.object({
      limit: z.number().min(1).max(100).default(20),
      cursor: z.string().uuid().optional(),
      unreadOnly: z.boolean().default(false),
    }))
    .query(async ({ ctx, input }) => {
      let query = supabase
        .from('notifications')
        .select('*')
        .eq('user_id', ctx.user!.id)
        .order('created_at', { ascending: false })
        .limit(input.limit + 1); // Fetch one extra to check if there are more

      if (input.unreadOnly) {
        query = query.is('read_at', null);
      }

      if (input.cursor) {
        // Get the created_at timestamp of the cursor notification
        const { data: cursorNotification } = await supabase
          .from('notifications')
          .select('created_at')
          .eq('id', input.cursor)
          .single();

        if (cursorNotification) {
          // @ts-ignore - Supabase types not available
          query = query.lt('created_at', cursorNotification.created_at);
        }
      }

      const { data, error } = await query;

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch notifications',
        });
      }

      const notifications = (data || []) as any[];
      let nextCursor: string | undefined = undefined;
      if (notifications.length > input.limit) {
        const nextItem = notifications.pop();
        nextCursor = nextItem?.id;
      }

      return {
        notifications,
        nextCursor,
      };
    }),

  /**
   * Mark notification as read
   */
  markAsRead: protectedProcedure
    .input(z.object({
      notificationId: z.string().uuid(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Verify notification belongs to user
      const { data: notification, error: fetchError } = await supabase
        .from('notifications')
        .select('user_id')
        .eq('id', input.notificationId)
        .single();

      if (fetchError || !notification) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Notification not found',
        });
      }

      const notif = notification as any;
      if (notif.user_id !== ctx.user!.id) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Cannot mark another user\'s notification',
        });
      }

      // Mark as read
      const { error: updateError } = await supabase
        .from('notifications')
        // @ts-expect-error - Supabase types not available for update
        .update({ read_at: new Date().toISOString() })
        .eq('id', input.notificationId);

      if (updateError) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to mark notification as read',
        });
      }

      return { success: true };
    }),

  /**
   * Mark all notifications as read
   */
  markAllAsRead: protectedProcedure
    .mutation(async ({ ctx }) => {
      const { data, error } = await supabase
        .from('notifications')
        // @ts-expect-error - Supabase types not available for update
        .update({ read_at: new Date().toISOString() })
        .eq('user_id', ctx.user!.id)
        .is('read_at', null)
        .select();

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to mark all notifications as read',
        });
      }

      return { count: data?.length || 0 };
    }),

  /**
   * Delete notification
   */
  deleteNotification: protectedProcedure
    .input(z.object({
      notificationId: z.string().uuid(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Verify notification belongs to user
      const { data: notification, error: fetchError } = await supabase
        .from('notifications')
        .select('user_id')
        .eq('id', input.notificationId)
        .single();

      if (fetchError || !notification) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Notification not found',
        });
      }

      const notif = notification as any;
      if (notif.user_id !== ctx.user!.id) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Cannot delete another user\'s notification',
        });
      }

      const { error: deleteError } = await supabase
        .from('notifications')
        .delete()
        .eq('id', input.notificationId);

      if (deleteError) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to delete notification',
        });
      }

      return { success: true };
    }),

  /**
   * Create notification (internal use by other routers)
   */
  createNotification: protectedProcedure
    .input(z.object({
      user_id: z.string().uuid(),
      type: z.string(),
      title: z.string(),
      message: z.string(),
      link: z.string().optional(),
      entity_type: z.string().optional(),
      entity_id: z.string().uuid().optional(),
      data: z.any().optional(),
    }))
    .mutation(async ({ input }) => {
      const { data: notification, error } = await supabase
        .from('notifications')
        .insert({
          user_id: input.user_id,
          type: input.type,
          title: input.title,
          message: input.message,
          link: input.link,
          entity_type: input.entity_type,
          entity_id: input.entity_id,
          data: input.data,
          read_at: null,
        } as any)
        .select()
        .single();

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to create notification',
        });
      }

      return notification;
    }),
});
