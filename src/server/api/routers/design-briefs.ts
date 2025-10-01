import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '../trpc/init';

/**
 * Design Briefs Router
 * Handles CRUD operations for design briefs
 */
export const designBriefsRouter = createTRPCRouter({
  /**
   * Get all design briefs with optional filtering
   */
  getAll: protectedProcedure
    .input(
      z.object({
        status: z.string().optional(),
        clientId: z.string().optional(),
        designerId: z.string().optional(),
        search: z.string().optional(),
        limit: z.number().min(1).max(100).default(50),
      })
    )
    .query(async ({ ctx, input }) => {
      const { status, clientId: _clientId, designerId, search, limit } = input;

      const briefs = await ctx.db.design_briefs.findMany({
        where: {
          ...(status && {
            design_projects: {
              current_stage: status
            }
          }),
          ...(designerId && {
            design_project_id: {
              in: await ctx.db.design_projects
                .findMany({
                  where: { designer_id: designerId },
                  select: { id: true },
                })
                .then(projects => projects.map(p => p.id))
            }
          }),
          ...(search && {
            OR: [
              { title: { contains: search, mode: 'insensitive' } },
              { description: { contains: search, mode: 'insensitive' } },
            ],
          }),
        },
        include: {
          design_projects: {
            include: {
              designers: true,
            },
          },
          users_design_briefs_created_byTousers: {
            select: {
              id: true,
              email: true,
            },
          },
          users_design_briefs_approved_byTousers: {
            select: {
              id: true,
              email: true,
            },
          },
        },
        orderBy: {
          created_at: 'desc',
        },
        take: limit,
      });

      return {
        briefs,
        total: briefs.length,
      };
    }),

  /**
   * Get a single design brief by ID
   */
  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const brief = await ctx.db.design_briefs.findUnique({
        where: { id: input.id },
        include: {
          design_projects: {
            include: {
              designers: true,
              design_deliverables: true,
              documents: {
                where: { status: 'active' },
                orderBy: { created_at: 'desc' },
                take: 10,
              },
            },
          },
          users_design_briefs_created_byTousers: {
            select: {
              id: true,
              email: true,
            },
          },
          users_design_briefs_approved_byTousers: {
            select: {
              id: true,
              email: true,
            },
          },
        },
      });

      return brief;
    }),

  /**
   * Create a new design brief
   */
  create: protectedProcedure
    .input(
      z.object({
        title: z.string().min(1).max(255),
        description: z.string().optional(),
        design_project_id: z.string().optional(),
        target_market: z.string().optional(),
        price_point_min: z.number().optional(),
        price_point_max: z.number().optional(),
        materials_preference: z.array(z.string()).optional(),
        style_references: z.array(z.string()).optional(),
        functional_requirements: z.string().optional(),
        dimensional_constraints: z.any().optional(),
        sustainability_requirements: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { materials_preference, style_references, ...rest } = input;

      const brief = await ctx.db.design_briefs.create({
        data: {
          ...rest,
          materials_preference: materials_preference || [],
          style_references: style_references || [],
          created_by: ctx.session.user.id,
        },
        include: {
          design_projects: true,
        },
      });

      return brief;
    }),

  /**
   * Update an existing design brief
   */
  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        title: z.string().min(1).max(255).optional(),
        description: z.string().optional(),
        design_project_id: z.string().optional(),
        target_market: z.string().optional(),
        price_point_min: z.number().optional(),
        price_point_max: z.number().optional(),
        materials_preference: z.array(z.string()).optional(),
        style_references: z.array(z.string()).optional(),
        functional_requirements: z.string().optional(),
        dimensional_constraints: z.any().optional(),
        sustainability_requirements: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;

      const brief = await ctx.db.design_briefs.update({
        where: { id },
        data,
      });

      return brief;
    }),

  /**
   * Approve a design brief
   */
  approve: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const brief = await ctx.db.design_briefs.update({
        where: { id: input.id },
        data: {
          approved_by: ctx.session.user.id,
          approved_date: new Date(),
        },
      });

      return brief;
    }),

  /**
   * Delete a design brief
   */
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.design_briefs.delete({
        where: { id: input.id },
      });

      return { success: true };
    }),
});
