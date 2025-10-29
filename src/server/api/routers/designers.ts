import { z } from 'zod';
import { createTRPCRouter, protectedProcedure, publicProcedure } from '../trpc/init';
import { TRPCError } from '@trpc/server';

/**
 * Designers Router
 *
 * Manages designers table using ctx.db pattern.
 * Covers designer profiles, contracts, performance tracking, and project assignments.
 */

const designerStatusEnum = z.enum([
  'prospect',
  'active',
  'inactive',
  'on_hold',
  'archived',
]);

export const designersRouter = createTRPCRouter({
  /**
   * Get designer by ID
   */
  getById: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const designer = await ctx.db.designers.findUnique({
        where: { id: input.id },
        select: {
          id: true,
          name: true,
          company_name: true,
          contact_email: true,
          phone: true,
          website: true,
          portfolio_url: true,
          specialties: true,
          design_style: true,
          hourly_rate: true,
          currency: true,
          status: true,
          rating: true,
          years_experience: true,
          certifications: true,
          notes: true,
          created_at: true,
          updated_at: true,
          collections: {
            select: {
              id: true,
              name: true,
              created_at: true,
            },
            orderBy: { created_at: 'desc' },
            take: 10,
          },
          concepts: {
            select: {
              id: true,
              name: true,
              created_at: true,
            },
            orderBy: { created_at: 'desc' },
            take: 10,
          },
          design_projects: {
            select: {
              id: true,
              name: true,
              status: true,
              created_at: true,
            },
            orderBy: { created_at: 'desc' },
            take: 10,
          },
          mood_boards: {
            select: {
              id: true,
              name: true,
              created_at: true,
            },
            orderBy: { created_at: 'desc' },
            take: 10,
          },
        },
      });

      if (!designer) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Designer not found',
        });
      }

      return designer;
    }),

  /**
   * Get all designers (with pagination and filtering)
   */
  getAll: publicProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(50),
        cursor: z.string().uuid().optional(),
        search: z.string().optional(),
        status: designerStatusEnum.optional(),
        min_rating: z.number().min(0).max(5).optional(),
        specialties: z.array(z.string()).optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { limit, cursor, search, status, min_rating, specialties } = input;

      const where: any = {};

      if (status) {
        where.status = status;
      }

      if (min_rating !== undefined) {
        where.rating = {
          gte: min_rating,
        };
      }

      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { company_name: { contains: search, mode: 'insensitive' } },
          { contact_email: { contains: search, mode: 'insensitive' } },
        ];
      }

      // Note: JSON array filtering for specialties would require raw SQL in production
      // This is a simplified version
      if (specialties && specialties.length > 0) {
        // PostgreSQL JSON operators can be used with Prisma raw queries
        // For now, we'll fetch and filter in memory (not ideal for large datasets)
      }

      const designers = await ctx.db.designers.findMany({
        where,
        take: limit + 1,
        cursor: cursor ? { id: cursor } : undefined,
        orderBy: { created_at: 'desc' },
        select: {
          id: true,
          name: true,
          company_name: true,
          contact_email: true,
          phone: true,
          website: true,
          portfolio_url: true,
          specialties: true,
          design_style: true,
          hourly_rate: true,
          currency: true,
          status: true,
          rating: true,
          years_experience: true,
          created_at: true,
          updated_at: true,
        },
      });

      let nextCursor: string | undefined;
      if (designers.length > limit) {
        const nextItem = designers.pop();
        nextCursor = nextItem?.id;
      }

      return {
        designers,
        nextCursor,
      };
    }),

  /**
   * Get designers by status
   */
  getByStatus: publicProcedure
    .input(
      z.object({
        status: designerStatusEnum,
        limit: z.number().min(1).max(100).default(50),
      })
    )
    .query(async ({ ctx, input }) => {
      const designers = await ctx.db.designers.findMany({
        where: {
          status: input.status,
        },
        take: input.limit,
        orderBy: [{ rating: 'desc' }, { created_at: 'desc' }],
        select: {
          id: true,
          name: true,
          company_name: true,
          contact_email: true,
          phone: true,
          portfolio_url: true,
          specialties: true,
          hourly_rate: true,
          currency: true,
          status: true,
          rating: true,
          years_experience: true,
          created_at: true,
        },
      });

      return designers;
    }),

  /**
   * Get top-rated designers
   */
  getTopRated: publicProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(50).default(10),
        status: designerStatusEnum.optional().default('active'),
      })
    )
    .query(async ({ ctx, input }) => {
      const designers = await ctx.db.designers.findMany({
        where: {
          status: input.status,
          rating: {
            not: null,
          },
        },
        take: input.limit,
        orderBy: { rating: 'desc' },
        select: {
          id: true,
          name: true,
          company_name: true,
          portfolio_url: true,
          specialties: true,
          hourly_rate: true,
          currency: true,
          rating: true,
          years_experience: true,
          _count: {
            select: {
              design_projects: true,
              concepts: true,
              collections: true,
            },
          },
        },
      });

      return designers;
    }),

  /**
   * Create designer
   */
  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(255),
        company_name: z.string().optional(),
        contact_email: z.string().email(),
        phone: z.string().optional(),
        website: z.string().url().optional(),
        portfolio_url: z.string().url().optional(),
        specialties: z.array(z.string()).default([]),
        design_style: z.array(z.string()).default([]),
        hourly_rate: z.number().optional(),
        currency: z.string().default('USD'),
        status: designerStatusEnum.default('prospect'),
        rating: z.number().min(0).max(5).optional(),
        years_experience: z.number().min(0).optional(),
        certifications: z.array(z.string()).default([]),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Check if email already exists
      const existingDesigner = await ctx.db.designers.findFirst({
        where: {
          contact_email: input.contact_email,
        },
      });

      if (existingDesigner) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'Designer with this email already exists',
        });
      }

      const newDesigner = await ctx.db.designers.create({
        data: input,
        select: {
          id: true,
          name: true,
          company_name: true,
          contact_email: true,
          phone: true,
          status: true,
          created_at: true,
        },
      });

      return newDesigner;
    }),

  /**
   * Update designer
   */
  update: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        name: z.string().min(1).max(255).optional(),
        company_name: z.string().optional(),
        contact_email: z.string().email().optional(),
        phone: z.string().optional(),
        website: z.string().url().optional(),
        portfolio_url: z.string().url().optional(),
        specialties: z.array(z.string()).optional(),
        design_style: z.array(z.string()).optional(),
        hourly_rate: z.number().optional(),
        currency: z.string().optional(),
        status: designerStatusEnum.optional(),
        rating: z.number().min(0).max(5).optional(),
        years_experience: z.number().min(0).optional(),
        certifications: z.array(z.string()).optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;

      // Verify designer exists
      const existingDesigner = await ctx.db.designers.findUnique({
        where: { id },
        select: { id: true, contact_email: true },
      });

      if (!existingDesigner) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Designer not found',
        });
      }

      // If email is being changed, verify it's not already taken
      if (data.contact_email && data.contact_email !== existingDesigner.contact_email) {
        const emailTaken = await ctx.db.designers.findFirst({
          where: {
            contact_email: data.contact_email,
            id: { not: id },
          },
        });

        if (emailTaken) {
          throw new TRPCError({
            code: 'CONFLICT',
            message: 'Email already in use by another designer',
          });
        }
      }

      const updatedDesigner = await ctx.db.designers.update({
        where: { id },
        data: {
          ...data,
          updated_at: new Date(),
        },
        select: {
          id: true,
          name: true,
          company_name: true,
          contact_email: true,
          phone: true,
          status: true,
          rating: true,
          updated_at: true,
        },
      });

      return updatedDesigner;
    }),

  /**
   * Delete designer
   */
  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      // Verify designer exists
      const existingDesigner = await ctx.db.designers.findUnique({
        where: { id: input.id },
        select: {
          id: true,
          _count: {
            select: {
              design_projects: true,
              concepts: true,
              collections: true,
            },
          },
        },
      });

      if (!existingDesigner) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Designer not found',
        });
      }

      // Check if designer has active projects
      const hasActiveProjects = existingDesigner._count.design_projects > 0 ||
                                existingDesigner._count.concepts > 0 ||
                                existingDesigner._count.collections > 0;

      if (hasActiveProjects) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'Cannot delete designer with active projects. Archive instead.',
        });
      }

      await ctx.db.designers.delete({
        where: { id: input.id },
      });

      return { success: true };
    }),

  /**
   * Archive designer (soft delete)
   */
  archive: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const archivedDesigner = await ctx.db.designers.update({
        where: { id: input.id },
        data: {
          status: 'archived',
          updated_at: new Date(),
        },
        select: {
          id: true,
          name: true,
          status: true,
          updated_at: true,
        },
      });

      return archivedDesigner;
    }),

  /**
   * Reactivate designer
   */
  reactivate: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const reactivatedDesigner = await ctx.db.designers.update({
        where: { id: input.id },
        data: {
          status: 'active',
          updated_at: new Date(),
        },
        select: {
          id: true,
          name: true,
          status: true,
          updated_at: true,
        },
      });

      return reactivatedDesigner;
    }),

  /**
   * Get designer statistics
   */
  getStats: protectedProcedure.query(async ({ ctx }) => {
    const [total, byStatus, avgRating, totalProjects] = await Promise.all([
      ctx.db.designers.count(),
      ctx.db.designers.groupBy({
        by: ['status'],
        _count: true,
      }),
      ctx.db.designers.aggregate({
        _avg: {
          rating: true,
          hourly_rate: true,
          years_experience: true,
        },
      }),
      ctx.db.design_projects.count(),
    ]);

    return {
      total,
      byStatus: byStatus.map(s => ({
        status: s.status,
        count: s._count,
      })),
      avgRating: avgRating._avg.rating || 0,
      avgHourlyRate: avgRating._avg.hourly_rate || 0,
      avgYearsExperience: avgRating._avg.years_experience || 0,
      totalProjects,
    };
  }),

  /**
   * Search designers
   */
  search: publicProcedure
    .input(
      z.object({
        query: z.string().min(1),
        limit: z.number().min(1).max(50).default(10),
        status: designerStatusEnum.optional().default('active'),
      })
    )
    .query(async ({ ctx, input }) => {
      const designers = await ctx.db.designers.findMany({
        where: {
          OR: [
            { name: { contains: input.query, mode: 'insensitive' } },
            { company_name: { contains: input.query, mode: 'insensitive' } },
            { contact_email: { contains: input.query, mode: 'insensitive' } },
          ],
          status: input.status,
        },
        take: input.limit,
        select: {
          id: true,
          name: true,
          company_name: true,
          contact_email: true,
          portfolio_url: true,
          specialties: true,
          rating: true,
          status: true,
        },
      });

      return designers;
    }),
});
