import { z } from 'zod';
import { createTRPCRouter, publicProcedure } from '../trpc/init';
import { db } from '@/lib/db';
import { getCachedUserProfile } from '@/lib/cache';

export const usersRouter = createTRPCRouter({
  // Get all users with search and pagination
  getAllUsers: publicProcedure
    .input(z.object({
      limit: z.number().min(1).max(100).default(50),
      offset: z.number().min(0).default(0),
      search: z.string().optional(),
    }))
    .query(async ({ ctx: _ctx, input }) => {
      return await db.findManyUsers({
        limit: input.limit,
        offset: input.offset,
        search: input.search,
      });
    }),

  // Get a single user by ID
  // ✅ CACHED: Uses server-side cache (5-minute TTL)
  getById: publicProcedure
    .input(z.object({
      id: z.string().uuid(),
    }))
    .query(async ({ ctx: _ctx, input }) => {
      // Use cached user profile instead of direct database call
      const user = await getCachedUserProfile(input.id);
      if (!user) {
        throw new Error('User not found');
      }
      return user;
    }),

  // Get users by their IDs (for assigned users lookup)
  getByIds: publicProcedure
    .input(z.object({
      ids: z.array(z.string().uuid()),
    }))
    .query(async ({ ctx: _ctx, input }) => {
      return await db.findUsersByIds(input.ids);
    }),

  // Find user by email (for invitations)
  findByEmail: publicProcedure
    .input(z.object({
      email: z.string().email(),
    }))
    .query(async ({ ctx, input }) => {
      const users = await ctx.db.user_profiles.findMany({
        where: {
          email: {
            equals: input.email,
            mode: 'insensitive', // Case-insensitive search
          },
        },
        take: 1,
      });

      return users;
    }),
});