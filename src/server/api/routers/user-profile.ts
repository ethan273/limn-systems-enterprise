import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '../trpc/init';
import { getSupabaseAdmin } from '@/lib/supabase';
import { TRPCError } from '@trpc/server';

const supabase = getSupabaseAdmin();

export const userProfileRouter = createTRPCRouter({
  /**
   * Get current user profile
   */
  getCurrentUser: protectedProcedure
    .query(async ({ ctx }) => {
      const { data: user, error } = await supabase
        .from('user_profiles')
        .select('id, email, name, first_name, last_name, avatar_url, user_type, department, created_at')
        .eq('id', ctx.user!.id)
        .single();

      if (error || !user) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'User not found',
        });
      }

      return user;
    }),

  /**
   * Update user profile
   */
  updateProfile: protectedProcedure
    .input(z.object({
      name: z.string().min(1).optional(),
      first_name: z.string().optional(),
      last_name: z.string().optional(),
      email: z.string().email().optional(),
      avatar_url: z.string().url().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      // If email is being changed, verify it's not already taken
      if (input.email) {
        const { data: existingUser } = await supabase
          .from('user_profiles')
          .select('id')
          .eq('email', input.email)
          .neq('id', ctx.user!.id)
          .maybeSingle();

        if (existingUser) {
          throw new TRPCError({
            code: 'CONFLICT',
            message: 'Email already in use',
          });
        }
      }

      const { data: updatedUser, error } = await supabase
        .from('user_profiles')
        // @ts-expect-error - Supabase types not available for update
        .update(input)
        .eq('id', ctx.user!.id)
        .select('id, email, name, first_name, last_name, avatar_url')
        .single();

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to update profile',
        });
      }

      return updatedUser;
    }),

  /**
   * Get user preferences
   */
  getPreferences: protectedProcedure
    .query(async ({ ctx }) => {
      const { data: preferences, error } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', ctx.user!.id)
        .maybeSingle();

      // If no preferences exist, return default values (don't create in DB yet)
      if (!preferences && !error) {
        // Return default preferences without creating DB record
        // Record will be created when user updates preferences
        return {
          id: '',
          user_id: ctx.user!.id,
          theme: 'auto',
          language: 'en',
          timezone: 'UTC',
          notification_email: true,
          notification_sms: false,
          notification_in_app: true,
          date_format: 'MM/DD/YYYY',
          time_format: '12h',
          email_digest: 'daily',
          metadata: {},
          created_at: new Date(),
          updated_at: new Date(),
        };
      }

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch preferences',
        });
      }

      return preferences;
    }),

  /**
   * Update user preferences
   */
  updatePreferences: protectedProcedure
    .input(z.object({
      theme: z.enum(['light', 'dark', 'system']).optional(),
      language: z.string().optional(),
      timezone: z.string().optional(),
      notification_email: z.boolean().optional(),
      notification_sms: z.boolean().optional(),
      notification_in_app: z.boolean().optional(),
      email_digest: z.string().optional(),
      date_format: z.string().optional(),
      time_format: z.string().optional(),
      metadata: z.any().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Try to update existing preferences
      const { data: updatedPreferences, error: updateError } = await supabase
        .from('user_preferences')
        // @ts-expect-error - Supabase types not available for update
        .update({
          ...input,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', ctx.user!.id)
        .select()
        .maybeSingle();

      // If no rows were updated, create new preferences
      if (!updatedPreferences) {
        const { data: newPreferences, error: insertError } = await supabase
          .from('user_preferences')
          .insert({
            user_id: ctx.user!.id,
            ...input,
          } as any)
          .select()
          .single();

        if (insertError) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to create preferences',
          });
        }

        return newPreferences;
      }

      if (updateError) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to update preferences',
        });
      }

      return updatedPreferences;
    }),

  /**
   * Get avatar upload URL (for Supabase Storage)
   */
  getAvatarUploadUrl: protectedProcedure
    .query(async ({ ctx }) => {
      const fileName = `${ctx.user!.id}/${Date.now()}.jpg`;
      const { data, error } = await supabase.storage
        .from('avatars')
        .createSignedUploadUrl(fileName);

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to generate upload URL',
        });
      }

      return {
        uploadUrl: data.signedUrl,
        path: data.path,
      };
    }),
});
