import { z } from 'zod';
import { createTRPCRouter, publicProcedure } from '../trpc/init';
import { db } from '@/lib/db';

export const usersRouter = createTRPCRouter({
  // Get all users with search and pagination
  getAllUsers: publicProcedure
    .input(z.object({
      limit: z.number().min(1).max(100).default(50),
      offset: z.number().min(0).default(0),
      search: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      return await db.findManyUsers({
        limit: input.limit,
        offset: input.offset,
        search: input.search,
      });
    }),

  // Get a single user by ID
  getById: publicProcedure
    .input(z.object({
      id: z.string().uuid(),
    }))
    .query(async ({ ctx, input }) => {
      const user = await db.findUser(input.id);
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
    .query(async ({ ctx, input }) => {
      return await db.findUsersByIds(input.ids);
    }),
});