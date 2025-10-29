import { z} from 'zod';
import { createTRPCRouter, protectedProcedure } from '../trpc/init';
import { TRPCError } from '@trpc/server';

/**
 * Task Entity Links Router
 *
 * Manages task_entity_links table using ctx.db pattern.
 * Covers polymorphic task-to-entity relationships.
 */

const linkTypeEnum = z.enum(['related', 'blocks', 'blocked_by', 'duplicates', 'parent', 'child']);

export const taskEntityLinksRouter = createTRPCRouter({
  /**
   * Get link by ID
   */
  getById: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const link = await ctx.db.task_entity_links.findUnique({
        where: { id: input.id },
        select: {
          id: true,
          task_id: true,
          entity_type: true,
          entity_id: true,
          entity_name: true,
          link_type: true,
          created_by: true,
          created_at: true,
          updated_at: true,
          tasks: {
            select: {
              id: true,
              title: true,
              status: true,
            },
          },
        },
      });

      if (!link) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Task entity link not found',
        });
      }

      return link;
    }),

  /**
   * Get links for task
   */
  getByTask: protectedProcedure
    .input(
      z.object({
        task_id: z.string().uuid(),
        entity_type: z.string().optional(),
        link_type: linkTypeEnum.optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const links = await ctx.db.task_entity_links.findMany({
        where: {
          task_id: input.task_id,
          ...(input.entity_type && { entity_type: input.entity_type }),
          ...(input.link_type && { link_type: input.link_type }),
        },
        orderBy: { created_at: 'desc' },
        select: {
          id: true,
          entity_type: true,
          entity_id: true,
          entity_name: true,
          link_type: true,
          created_at: true,
        },
      });

      return links;
    }),

  /**
   * Get tasks linked to entity
   */
  getByEntity: protectedProcedure
    .input(
      z.object({
        entity_type: z.string(),
        entity_id: z.string().uuid(),
        link_type: linkTypeEnum.optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const links = await ctx.db.task_entity_links.findMany({
        where: {
          entity_type: input.entity_type,
          entity_id: input.entity_id,
          ...(input.link_type && { link_type: input.link_type }),
        },
        orderBy: { created_at: 'desc' },
        select: {
          id: true,
          task_id: true,
          link_type: true,
          created_at: true,
          tasks: {
            select: {
              id: true,
              title: true,
              status: true,
              due_date: true,
            },
          },
        },
      });

      return links;
    }),

  /**
   * Create task entity link
   */
  create: protectedProcedure
    .input(
      z.object({
        task_id: z.string().uuid(),
        entity_type: z.string(),
        entity_id: z.string().uuid(),
        entity_name: z.string().optional(),
        link_type: linkTypeEnum.default('related'),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Check for duplicate
      const existing = await ctx.db.task_entity_links.findFirst({
        where: {
          task_id: input.task_id,
          entity_type: input.entity_type,
          entity_id: input.entity_id,
        },
      });

      if (existing) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'Link already exists between task and entity',
        });
      }

      // Verify task exists
      const task = await ctx.db.tasks.findUnique({
        where: { id: input.task_id },
        select: { id: true },
      });

      if (!task) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Task not found',
        });
      }

      const newLink = await ctx.db.task_entity_links.create({
        data: {
          task_id: input.task_id,
          entity_type: input.entity_type,
          entity_id: input.entity_id,
          entity_name: input.entity_name,
          link_type: input.link_type,
          created_by: ctx.user!.id,
        },
        select: {
          id: true,
          task_id: true,
          entity_type: true,
          entity_id: true,
          link_type: true,
          created_at: true,
        },
      });

      return newLink;
    }),

  /**
   * Create bulk links
   */
  createBulk: protectedProcedure
    .input(
      z.object({
        task_id: z.string().uuid(),
        links: z.array(
          z.object({
            entity_type: z.string(),
            entity_id: z.string().uuid(),
            entity_name: z.string().optional(),
            link_type: linkTypeEnum.default('related'),
          })
        ),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Verify task exists
      const task = await ctx.db.tasks.findUnique({
        where: { id: input.task_id },
        select: { id: true },
      });

      if (!task) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Task not found',
        });
      }

      // Get existing links to avoid duplicates
      const existingLinks = await ctx.db.task_entity_links.findMany({
        where: {
          task_id: input.task_id,
        },
        select: {
          entity_type: true,
          entity_id: true,
        },
      });

      const existingSet = new Set(
        existingLinks.map(l => `${l.entity_type}:${l.entity_id}`)
      );

      const newLinks = input.links.filter(
        link => !existingSet.has(`${link.entity_type}:${link.entity_id}`)
      );

      if (newLinks.length === 0) {
        return {
          created: 0,
          skipped: input.links.length,
          message: 'All links already exist',
        };
      }

      const createData = newLinks.map(link => ({
        task_id: input.task_id,
        entity_type: link.entity_type,
        entity_id: link.entity_id,
        entity_name: link.entity_name,
        link_type: link.link_type,
        created_by: ctx.user!.id,
      }));

      await ctx.db.task_entity_links.createMany({
        data: createData,
      });

      return {
        created: newLinks.length,
        skipped: input.links.length - newLinks.length,
        message: `Created ${newLinks.length} links`,
      };
    }),

  /**
   * Update link type
   */
  updateLinkType: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        link_type: linkTypeEnum,
      })
    )
    .mutation(async ({ ctx, input }) => {
      const updatedLink = await ctx.db.task_entity_links.update({
        where: { id: input.id },
        data: {
          link_type: input.link_type,
          updated_at: new Date(),
        },
        select: {
          id: true,
          link_type: true,
          updated_at: true,
        },
      });

      return updatedLink;
    }),

  /**
   * Delete link
   */
  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.task_entity_links.delete({
        where: { id: input.id },
      });

      return { success: true };
    }),

  /**
   * Delete all links for entity
   */
  deleteByEntity: protectedProcedure
    .input(
      z.object({
        entity_type: z.string(),
        entity_id: z.string().uuid(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const result = await ctx.db.task_entity_links.deleteMany({
        where: {
          entity_type: input.entity_type,
          entity_id: input.entity_id,
        },
      });

      return {
        deleted: result.count,
        message: `Deleted ${result.count} links`,
      };
    }),

  /**
   * Get statistics
   */
  getStats: protectedProcedure.query(async ({ ctx }) => {
    const [total, byEntityType, byLinkType] = await Promise.all([
      ctx.db.task_entity_links.count(),
      ctx.db.task_entity_links.groupBy({
        by: ['entity_type'],
        _count: true,
      }),
      ctx.db.task_entity_links.groupBy({
        by: ['link_type'],
        _count: true,
      }),
    ]);

    return {
      total,
      byEntityType: byEntityType.map(e => ({
        entity_type: e.entity_type,
        count: e._count,
      })),
      byLinkType: byLinkType.map(l => ({
        link_type: l.link_type,
        count: l._count,
      })),
    };
  }),
});
