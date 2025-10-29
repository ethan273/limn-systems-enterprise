import { z } from 'zod';
import { createTRPCRouter, protectedProcedure, publicProcedure } from '../trpc/init';
import { TRPCError } from '@trpc/server';

/**
 * Templates Router
 *
 * Manages templates table using ctx.db pattern.
 * Covers flipbook templates, product catalog templates, lookbooks, brochures, etc.
 */

const templateCategoryEnum = z.enum([
  'PRODUCT_CATALOG',
  'LOOKBOOK',
  'BROCHURE',
  'MENU',
  'PORTFOLIO',
]);

export const templatesRouter = createTRPCRouter({
  /**
   * Get template by ID
   */
  getById: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const template = await ctx.db.templates.findUnique({
        where: { id: input.id },
        select: {
          id: true,
          name: true,
          description: true,
          category: true,
          thumbnail_url: true,
          template_config: true,
          page_layouts: true,
          brand_config: true,
          is_public: true,
          created_by_id: true,
          use_count: true,
          tags: true,
          created_at: true,
          updated_at: true,
          user_profiles: {
            select: {
              id: true,
              name: true,
              full_name: true,
              email: true,
            },
          },
        },
      });

      if (!template) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Template not found',
        });
      }

      return template;
    }),

  /**
   * Get all templates (with pagination and filtering)
   */
  getAll: publicProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(50),
        cursor: z.string().uuid().optional(),
        search: z.string().optional(),
        category: templateCategoryEnum.optional(),
        is_public: z.boolean().optional(),
        created_by_id: z.string().uuid().optional(),
        tags: z.array(z.string()).optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { limit, cursor, search, category, is_public, created_by_id, tags } = input;

      const where: any = {};

      if (is_public !== undefined) {
        where.is_public = is_public;
      }

      if (category) {
        where.category = category;
      }

      if (created_by_id) {
        where.created_by_id = created_by_id;
      }

      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ];
      }

      if (tags && tags.length > 0) {
        where.tags = {
          hasSome: tags,
        };
      }

      const templates = await ctx.db.templates.findMany({
        where,
        take: limit + 1,
        cursor: cursor ? { id: cursor } : undefined,
        orderBy: { created_at: 'desc' },
        select: {
          id: true,
          name: true,
          description: true,
          category: true,
          thumbnail_url: true,
          is_public: true,
          use_count: true,
          tags: true,
          created_at: true,
          user_profiles: {
            select: {
              id: true,
              name: true,
              full_name: true,
            },
          },
        },
      });

      let nextCursor: string | undefined;
      if (templates.length > limit) {
        const nextItem = templates.pop();
        nextCursor = nextItem?.id;
      }

      return {
        templates,
        nextCursor,
      };
    }),

  /**
   * Get popular templates
   */
  getPopular: publicProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(50).default(10),
        category: templateCategoryEnum.optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const where: any = { is_public: true };

      if (input.category) {
        where.category = input.category;
      }

      const templates = await ctx.db.templates.findMany({
        where,
        take: input.limit,
        orderBy: { use_count: 'desc' },
        select: {
          id: true,
          name: true,
          description: true,
          category: true,
          thumbnail_url: true,
          use_count: true,
          tags: true,
          created_at: true,
        },
      });

      return templates;
    }),

  /**
   * Create template
   */
  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(255),
        description: z.string().optional(),
        category: templateCategoryEnum,
        thumbnail_url: z.string().url().optional(),
        template_config: z.record(z.any()),
        page_layouts: z.record(z.any()),
        brand_config: z.record(z.any()).optional(),
        is_public: z.boolean().default(true),
        tags: z.array(z.string()).default([]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const newTemplate = await ctx.db.templates.create({
        data: {
          ...input,
          created_by_id: ctx.user!.id,
        },
        select: {
          id: true,
          name: true,
          description: true,
          category: true,
          thumbnail_url: true,
          is_public: true,
          tags: true,
          created_at: true,
        },
      });

      return newTemplate;
    }),

  /**
   * Update template
   */
  update: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        name: z.string().min(1).max(255).optional(),
        description: z.string().optional(),
        category: templateCategoryEnum.optional(),
        thumbnail_url: z.string().url().optional(),
        template_config: z.record(z.any()).optional(),
        page_layouts: z.record(z.any()).optional(),
        brand_config: z.record(z.any()).optional(),
        is_public: z.boolean().optional(),
        tags: z.array(z.string()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;

      // Verify template exists and user has permission to update
      const existingTemplate = await ctx.db.templates.findUnique({
        where: { id },
        select: { id: true, created_by_id: true },
      });

      if (!existingTemplate) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Template not found',
        });
      }

      // Only creator can update (or admin - would need to check user type)
      if (existingTemplate.created_by_id !== ctx.user!.id) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have permission to update this template',
        });
      }

      const updatedTemplate = await ctx.db.templates.update({
        where: { id },
        data: {
          ...data,
          updated_at: new Date(),
        },
        select: {
          id: true,
          name: true,
          description: true,
          category: true,
          thumbnail_url: true,
          is_public: true,
          tags: true,
          updated_at: true,
        },
      });

      return updatedTemplate;
    }),

  /**
   * Delete template
   */
  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      // Verify template exists and user has permission to delete
      const existingTemplate = await ctx.db.templates.findUnique({
        where: { id: input.id },
        select: { id: true, created_by_id: true },
      });

      if (!existingTemplate) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Template not found',
        });
      }

      // Only creator can delete (or admin - would need to check user type)
      if (existingTemplate.created_by_id !== ctx.user!.id) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have permission to delete this template',
        });
      }

      await ctx.db.templates.delete({
        where: { id: input.id },
      });

      return { success: true };
    }),

  /**
   * Increment template use count
   */
  incrementUseCount: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const updatedTemplate = await ctx.db.templates.update({
        where: { id: input.id },
        data: {
          use_count: {
            increment: 1,
          },
        },
        select: {
          id: true,
          use_count: true,
        },
      });

      return updatedTemplate;
    }),

  /**
   * Get templates by category
   */
  getByCategory: publicProcedure
    .input(
      z.object({
        category: templateCategoryEnum,
        limit: z.number().min(1).max(100).default(50),
        is_public: z.boolean().default(true),
      })
    )
    .query(async ({ ctx, input }) => {
      const templates = await ctx.db.templates.findMany({
        where: {
          category: input.category,
          is_public: input.is_public,
        },
        take: input.limit,
        orderBy: { created_at: 'desc' },
        select: {
          id: true,
          name: true,
          description: true,
          category: true,
          thumbnail_url: true,
          use_count: true,
          tags: true,
          created_at: true,
        },
      });

      return templates;
    }),

  /**
   * Search templates by tags
   */
  searchByTags: publicProcedure
    .input(
      z.object({
        tags: z.array(z.string()).min(1),
        limit: z.number().min(1).max(100).default(20),
      })
    )
    .query(async ({ ctx, input }) => {
      const templates = await ctx.db.templates.findMany({
        where: {
          tags: {
            hasSome: input.tags,
          },
          is_public: true,
        },
        take: input.limit,
        orderBy: { use_count: 'desc' },
        select: {
          id: true,
          name: true,
          description: true,
          category: true,
          thumbnail_url: true,
          use_count: true,
          tags: true,
          created_at: true,
        },
      });

      return templates;
    }),

  /**
   * Get template statistics
   */
  getStats: protectedProcedure.query(async ({ ctx }) => {
    const [total, byCategory, totalUses, publicTemplates] = await Promise.all([
      ctx.db.templates.count(),
      ctx.db.templates.groupBy({
        by: ['category'],
        _count: true,
      }),
      ctx.db.templates.aggregate({
        _sum: {
          use_count: true,
        },
      }),
      ctx.db.templates.count({
        where: { is_public: true },
      }),
    ]);

    return {
      total,
      publicTemplates,
      privateTemplates: total - publicTemplates,
      totalUses: totalUses._sum.use_count || 0,
      byCategory: byCategory.map(c => ({
        category: c.category,
        count: c._count,
      })),
    };
  }),

  /**
   * Get my templates (created by current user)
   */
  getMy: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(50),
        cursor: z.string().uuid().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { limit, cursor } = input;

      const templates = await ctx.db.templates.findMany({
        where: {
          created_by_id: ctx.user!.id,
        },
        take: limit + 1,
        cursor: cursor ? { id: cursor } : undefined,
        orderBy: { created_at: 'desc' },
        select: {
          id: true,
          name: true,
          description: true,
          category: true,
          thumbnail_url: true,
          is_public: true,
          use_count: true,
          tags: true,
          created_at: true,
          updated_at: true,
        },
      });

      let nextCursor: string | undefined;
      if (templates.length > limit) {
        const nextItem = templates.pop();
        nextCursor = nextItem?.id;
      }

      return {
        templates,
        nextCursor,
      };
    }),
});
