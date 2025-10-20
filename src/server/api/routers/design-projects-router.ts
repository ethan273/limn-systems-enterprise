import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '../trpc/init';

/**
 * Design Projects Router
 * Handles CRUD operations for design projects
 */
export const designProjectsRouter = createTRPCRouter({
  /**
   * Get all design projects with optional filtering
   */
  getAll: protectedProcedure
    .input(
      z.object({
        status: z.string().optional(),
        designStage: z.string().optional(),
        priority: z.string().optional(),
        designerId: z.string().optional(),
        search: z.string().optional(),
        limit: z.number().min(1).max(100).default(50),
      })
    )
    .query(async ({ ctx, input }) => {
      const { designStage, priority, designerId, search, limit } = input;

      const projects = await ctx.db.design_projects.findMany({
        where: {
          ...(designStage && { current_stage: designStage }),
          ...(priority && { priority }),
          ...(designerId && { designer_id: designerId }),
          ...(search && {
            OR: [
              { project_name: { contains: search, mode: 'insensitive' } },
              { project_code: { contains: search, mode: 'insensitive' } },
            ],
          }),
        },
        include: {
          designers: true,
          furniture_collections: true,
          design_briefs: {
            take: 1,
            orderBy: { created_at: 'desc' },
          },
          documents: {
            where: { status: 'active' },
            orderBy: { created_at: 'desc' },
            take: 5,
          },
          mood_boards: {
            where: { status: { not: 'archived' } },
            orderBy: { created_at: 'desc' },
            take: 3,
          },
        },
        orderBy: {
          created_at: 'desc',
        },
        take: limit,
      });

      return {
        projects,
        total: projects.length,
      };
    }),

  /**
   * Get a single design project by ID
   */
  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const project = await ctx.db.design_projects.findUnique({
        where: { id: input.id },
        include: {
          designers: true,
          furniture_collections: true,
          design_briefs: {
            orderBy: { created_at: 'desc' },
          },
          design_deliverables: {
            orderBy: { created_at: 'desc' },
          },
          design_revisions: {
            orderBy: { created_at: 'desc' },
            take: 10,
          },
          documents: {
            where: { status: 'active' },
            orderBy: { created_at: 'desc' },
          },
          mood_boards: {
            where: { status: { not: 'archived' } },
            orderBy: { created_at: 'desc' },
          },
        },
      });

      return project;
    }),

  /**
   * Create a new design project
   */
  create: protectedProcedure
    .input(
      z.object({
        project_name: z.string().min(1).max(255),
        project_code: z.string().optional(),
        designer_id: z.string().optional(),
        collection_id: z.string().optional(),
        project_type: z.string().optional(),
        current_stage: z.string().default('brief_creation'),
        target_launch_date: z.date().optional(),
        budget: z.number().optional(),
        priority: z.string().default('normal'),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const project = await ctx.db.design_projects.create({
        data: input,
        include: {
          designers: true,
          furniture_collections: true,
        },
      });

      return project;
    }),

  /**
   * Update an existing design project
   */
  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        project_name: z.string().min(1).max(255).optional(),
        designer_id: z.string().optional(),
        collection_id: z.string().optional(),
        project_type: z.string().optional(),
        current_stage: z.string().optional(),
        target_launch_date: z.date().optional(),
        budget: z.number().optional(),
        priority: z.string().optional(),
        next_action: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;

      const project = await ctx.db.design_projects.update({
        where: { id },
        data,
      });

      return project;
    }),

  /**
   * Update project progress/completion percentage
   */
  updateProgress: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        current_stage: z.string(),
        next_action: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const project = await ctx.db.design_projects.update({
        where: { id: input.id },
        data: {
          current_stage: input.current_stage,
          next_action: input.next_action,
          days_in_stage: 0, // Reset counter when stage changes
        },
      });

      return project;
    }),

  /**
   * Delete a design project
   */
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.design_projects.delete({
        where: { id: input.id },
      });

      return { success: true };
    }),
});
