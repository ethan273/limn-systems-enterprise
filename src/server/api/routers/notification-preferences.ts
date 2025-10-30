import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '../trpc/init';

// Validation schemas
const channelsSchema = z.object({
  in_app: z.boolean().default(true),
  email: z.boolean().default(true),
  google_chat: z.boolean().default(false),
});

const categoryChannelsSchema = z.object({
  in_app: z.boolean().optional(),
  email: z.boolean().optional(),
  google_chat: z.boolean().optional(),
});

const categoryPreferencesSchema = z.record(
  z.enum(['system', 'order', 'production', 'shipping', 'payment', 'task', 'message', 'alert']),
  categoryChannelsSchema
);

const quietHoursSchema = z.object({
  enabled: z.boolean(),
  start: z.string().regex(/^\d{2}:\d{2}$/), // HH:MM format
  end: z.string().regex(/^\d{2}:\d{2}$/),
  timezone: z.string(),
}).nullable();

/**
 * Notification Preferences Router
 *
 * Manages user-specific notification preferences including:
 * - Channel preferences (in_app, email, google_chat)
 * - Category-specific preferences
 * - Quiet hours configuration
 *
 * All procedures are protected and operate on the current user's preferences.
 */
export const notificationPreferencesRouter = createTRPCRouter({
  /**
   * Get current user's notification preferences
   * Returns default preferences if none exist in database
   */
  getMyPreferences: protectedProcedure
    .query(async ({ ctx }) => {
      if (!ctx.user) throw new Error('User not authenticated');

      const prefs = await ctx.db.user_notification_preferences.findUnique({
        where: { user_id: ctx.user.id },
      });

      // Return defaults if not found
      if (!prefs) {
        return {
          channels: { in_app: true, email: true, google_chat: false },
          categories: {
            system: { in_app: true, email: true },
            order: { in_app: true, email: true },
            production: { in_app: true, email: false },
            shipping: { in_app: true, email: true },
            payment: { in_app: true, email: true },
            task: { in_app: true, email: true },
            message: { in_app: true, email: false },
            alert: { in_app: true, email: true, google_chat: true },
          },
          quiet_hours: null,
        };
      }

      return {
        channels: prefs.channels,
        categories: prefs.categories,
        quiet_hours: prefs.quiet_hours,
      };
    }),

  /**
   * Update notification preferences
   * Uses upsert to create or update preferences
   */
  updateMyPreferences: protectedProcedure
    .input(z.object({
      channels: channelsSchema.optional(),
      categories: categoryPreferencesSchema.optional(),
      quiet_hours: quietHoursSchema.optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) throw new Error('User not authenticated');

      const defaultChannels = { in_app: true, email: true, google_chat: false };
      const defaultCategories = {
        system: { in_app: true, email: true },
        order: { in_app: true, email: true },
        production: { in_app: true, email: false },
        shipping: { in_app: true, email: true },
        payment: { in_app: true, email: true },
        task: { in_app: true, email: true },
        message: { in_app: true, email: false },
        alert: { in_app: true, email: true, google_chat: true },
      };

      const updated = await ctx.db.user_notification_preferences.upsert({
        where: { user_id: ctx.user.id },
        create: {
          user_id: ctx.user.id,
          channels: input.channels || defaultChannels,
          categories: input.categories || defaultCategories,
          quiet_hours: input.quiet_hours,
        },
        update: {
          ...(input.channels && { channels: input.channels }),
          ...(input.categories && { categories: input.categories }),
          ...(input.quiet_hours !== undefined && { quiet_hours: input.quiet_hours }),
          updated_at: new Date(),
        },
      });

      return {
        success: true,
        preferences: {
          channels: updated.channels,
          categories: updated.categories,
          quiet_hours: updated.quiet_hours,
        },
      };
    }),

  /**
   * Update specific channel preferences
   * Convenience method for updating just channels
   */
  updateChannels: protectedProcedure
    .input(channelsSchema)
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) throw new Error('User not authenticated');

      const updated = await ctx.db.user_notification_preferences.upsert({
        where: { user_id: ctx.user.id },
        create: {
          user_id: ctx.user.id,
          channels: input,
          categories: {}, // Will use defaults from database
          quiet_hours: null,
        },
        update: {
          channels: input,
          updated_at: new Date(),
        },
      });

      return {
        success: true,
        channels: updated.channels,
      };
    }),

  /**
   * Update category-specific preferences
   * Convenience method for updating just categories
   */
  updateCategories: protectedProcedure
    .input(categoryPreferencesSchema)
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) throw new Error('User not authenticated');

      const updated = await ctx.db.user_notification_preferences.upsert({
        where: { user_id: ctx.user.id },
        create: {
          user_id: ctx.user.id,
          channels: { in_app: true, email: true, google_chat: false },
          categories: input,
          quiet_hours: null,
        },
        update: {
          categories: input,
          updated_at: new Date(),
        },
      });

      return {
        success: true,
        categories: updated.categories,
      };
    }),

  /**
   * Update quiet hours configuration
   * Convenience method for updating just quiet hours
   */
  updateQuietHours: protectedProcedure
    .input(quietHoursSchema)
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) throw new Error('User not authenticated');

      const updated = await ctx.db.user_notification_preferences.upsert({
        where: { user_id: ctx.user.id },
        create: {
          user_id: ctx.user.id,
          channels: { in_app: true, email: true, google_chat: false },
          categories: {}, // Will use defaults
          quiet_hours: input,
        },
        update: {
          quiet_hours: input,
          updated_at: new Date(),
        },
      });

      return {
        success: true,
        quiet_hours: updated.quiet_hours,
      };
    }),

  /**
   * Reset preferences to system defaults
   * Deletes user's custom preferences, reverting to defaults
   */
  resetToDefaults: protectedProcedure
    .mutation(async ({ ctx }) => {
      if (!ctx.user) throw new Error('User not authenticated');

      await ctx.db.user_notification_preferences.delete({
        where: { user_id: ctx.user.id },
      }).catch(() => {
        // Ignore error if preferences don't exist
      });

      return {
        success: true,
        message: 'Preferences reset to defaults',
      };
    }),

  /**
   * Test notification delivery with current preferences
   * Sends a test notification to verify settings
   */
  sendTestNotification: protectedProcedure
    .mutation(async ({ ctx }) => {
      if (!ctx.user) throw new Error('User not authenticated');

      const { sendNotificationToUser } = await import('@/lib/notifications/unified-service');

      await sendNotificationToUser(ctx.user.id, {
        title: 'Test Notification',
        message: 'This is a test notification to verify your notification preferences are working correctly.',
        category: 'system',
        priority: 'normal',
        channels: ['in_app', 'email'], // Test both channels
      });

      return {
        success: true,
        message: 'Test notification sent',
      };
    }),
});
