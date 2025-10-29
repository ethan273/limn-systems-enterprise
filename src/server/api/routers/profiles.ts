import { z } from 'zod';
import { createTRPCRouter, protectedProcedure, publicProcedure } from '../trpc/init';
import { TRPCError } from '@trpc/server';

/**
 * Profiles Router
 *
 * Manages user_profiles table using ctx.db pattern (replacing anti-pattern Supabase router).
 * Covers user profile management, preferences, and metadata.
 */
export const profilesRouter = createTRPCRouter({
  /**
   * Get current user profile
   */
  getCurrentUser: protectedProcedure.query(async ({ ctx }) => {
    const profile = await ctx.db.user_profiles.findUnique({
      where: { id: ctx.user!.id },
      select: {
        id: true,
        email: true,
        name: true,
        first_name: true,
        last_name: true,
        full_name: true,
        avatar_url: true,
        user_type: true,
        department: true,
        title: true,
        job_title: true,
        is_active: true,
        permissions: true,
        created_at: true,
        updated_at: true,
      },
    });

    if (!profile) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'User profile not found',
      });
    }

    return profile;
  }),

  /**
   * Get profile by ID (admin only)
   */
  getById: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const profile = await ctx.db.user_profiles.findUnique({
        where: { id: input.id },
        select: {
          id: true,
          email: true,
          name: true,
          first_name: true,
          last_name: true,
          full_name: true,
          avatar_url: true,
          user_type: true,
          department: true,
          title: true,
          job_title: true,
          is_active: true,
          permissions: true,
          is_sso_user: true,
          sso_provider: true,
          hire_date: true,
          created_at: true,
          updated_at: true,
        },
      });

      if (!profile) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Profile not found',
        });
      }

      return profile;
    }),

  /**
   * Get all profiles (admin only, with pagination)
   */
  getAll: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(50),
        cursor: z.string().uuid().optional(),
        search: z.string().optional(),
        is_active: z.boolean().optional(),
        department: z.string().optional(),
        user_type: z.enum(['employee', 'admin', 'contractor', 'customer']).optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { limit, cursor, search, is_active, department, user_type } = input;

      const where: any = {};

      if (is_active !== undefined) {
        where.is_active = is_active;
      }

      if (department) {
        where.department = department;
      }

      if (user_type) {
        where.user_type = user_type;
      }

      if (search) {
        where.OR = [
          { email: { contains: search, mode: 'insensitive' } },
          { name: { contains: search, mode: 'insensitive' } },
          { full_name: { contains: search, mode: 'insensitive' } },
          { first_name: { contains: search, mode: 'insensitive' } },
          { last_name: { contains: search, mode: 'insensitive' } },
        ];
      }

      const profiles = await ctx.db.user_profiles.findMany({
        where,
        take: limit + 1,
        cursor: cursor ? { id: cursor } : undefined,
        orderBy: { created_at: 'desc' },
        select: {
          id: true,
          email: true,
          name: true,
          first_name: true,
          last_name: true,
          full_name: true,
          avatar_url: true,
          user_type: true,
          department: true,
          title: true,
          is_active: true,
          created_at: true,
        },
      });

      let nextCursor: string | undefined;
      if (profiles.length > limit) {
        const nextItem = profiles.pop();
        nextCursor = nextItem?.id;
      }

      return {
        profiles,
        nextCursor,
      };
    }),

  /**
   * Update current user profile
   */
  updateProfile: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).optional(),
        first_name: z.string().optional(),
        last_name: z.string().optional(),
        email: z.string().email().optional(),
        avatar_url: z.string().url().optional(),
        title: z.string().optional(),
        job_title: z.string().optional(),
        department: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // If email is being changed, verify it's not already taken
      if (input.email) {
        const existingProfile = await ctx.db.user_profiles.findFirst({
          where: {
            email: input.email,
            id: { not: ctx.user!.id },
          },
        });

        if (existingProfile) {
          throw new TRPCError({
            code: 'CONFLICT',
            message: 'Email already in use',
          });
        }
      }

      const updatedProfile = await ctx.db.user_profiles.update({
        where: { id: ctx.user!.id },
        data: {
          ...input,
          updated_at: new Date(),
        },
        select: {
          id: true,
          email: true,
          name: true,
          first_name: true,
          last_name: true,
          full_name: true,
          avatar_url: true,
          title: true,
          job_title: true,
          department: true,
          updated_at: true,
        },
      });

      return updatedProfile;
    }),

  /**
   * Update profile by ID (admin only)
   */
  updateById: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        name: z.string().min(1).optional(),
        first_name: z.string().optional(),
        last_name: z.string().optional(),
        email: z.string().email().optional(),
        avatar_url: z.string().url().optional(),
        title: z.string().optional(),
        job_title: z.string().optional(),
        department: z.string().optional(),
        user_type: z.enum(['employee', 'admin', 'contractor', 'customer']).optional(),
        is_active: z.boolean().optional(),
        permissions: z.record(z.any()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;

      // If email is being changed, verify it's not already taken
      if (data.email) {
        const existingProfile = await ctx.db.user_profiles.findFirst({
          where: {
            email: data.email,
            id: { not: id },
          },
        });

        if (existingProfile) {
          throw new TRPCError({
            code: 'CONFLICT',
            message: 'Email already in use',
          });
        }
      }

      const updatedProfile = await ctx.db.user_profiles.update({
        where: { id },
        data: {
          ...data,
          updated_at: new Date(),
        },
        select: {
          id: true,
          email: true,
          name: true,
          first_name: true,
          last_name: true,
          full_name: true,
          avatar_url: true,
          title: true,
          job_title: true,
          department: true,
          user_type: true,
          is_active: true,
          permissions: true,
          updated_at: true,
        },
      });

      return updatedProfile;
    }),

  /**
   * Deactivate profile (soft delete)
   */
  deactivate: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const deactivatedProfile = await ctx.db.user_profiles.update({
        where: { id: input.id },
        data: {
          is_active: false,
          updated_at: new Date(),
        },
        select: {
          id: true,
          is_active: true,
          updated_at: true,
        },
      });

      return deactivatedProfile;
    }),

  /**
   * Reactivate profile
   */
  reactivate: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const reactivatedProfile = await ctx.db.user_profiles.update({
        where: { id: input.id },
        data: {
          is_active: true,
          updated_at: new Date(),
        },
        select: {
          id: true,
          is_active: true,
          updated_at: true,
        },
      });

      return reactivatedProfile;
    }),

  /**
   * Get profile statistics (admin only)
   */
  getStats: protectedProcedure.query(async ({ ctx }) => {
    const [total, active, byDepartment, byUserType] = await Promise.all([
      ctx.db.user_profiles.count(),
      ctx.db.user_profiles.count({ where: { is_active: true } }),
      ctx.db.user_profiles.groupBy({
        by: ['department'],
        _count: true,
        where: { department: { not: null } },
      }),
      ctx.db.user_profiles.groupBy({
        by: ['user_type'],
        _count: true,
      }),
    ]);

    return {
      total,
      active,
      inactive: total - active,
      byDepartment: byDepartment.map(d => ({
        department: d.department,
        count: d._count,
      })),
      byUserType: byUserType.map(t => ({
        user_type: t.user_type,
        count: t._count,
      })),
    };
  }),

  /**
   * Search profiles
   */
  search: publicProcedure
    .input(
      z.object({
        query: z.string().min(1),
        limit: z.number().min(1).max(50).default(10),
      })
    )
    .query(async ({ ctx, input }) => {
      const profiles = await ctx.db.user_profiles.findMany({
        where: {
          OR: [
            { email: { contains: input.query, mode: 'insensitive' } },
            { name: { contains: input.query, mode: 'insensitive' } },
            { full_name: { contains: input.query, mode: 'insensitive' } },
            { first_name: { contains: input.query, mode: 'insensitive' } },
            { last_name: { contains: input.query, mode: 'insensitive' } },
          ],
          is_active: true,
        },
        take: input.limit,
        select: {
          id: true,
          email: true,
          name: true,
          full_name: true,
          avatar_url: true,
          department: true,
          title: true,
        },
      });

      return profiles;
    }),
});
