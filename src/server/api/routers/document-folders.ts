import { z } from 'zod';
import { createTRPCRouter, protectedProcedure, publicProcedure } from '../trpc/init';
import { TRPCError } from '@trpc/server';

/**
 * Document Folders Router
 *
 * Manages document_folders table using ctx.db pattern.
 * Covers hierarchical folder structure, Google Drive integration, and folder organization.
 */

export const documentFoldersRouter = createTRPCRouter({
  /**
   * Get folder by ID
   */
  getById: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const folder = await ctx.db.document_folders.findUnique({
        where: { id: input.id },
        select: {
          id: true,
          folder_name: true,
          parent_folder_id: true,
          google_drive_folder_id: true,
          customer_id: true,
          order_id: true,
          project_type: true,
          full_path: true,
          created_at: true,
          updated_at: true,
          customers: {
            select: {
              id: true,
              name: true,
            },
          },
          orders: {
            select: {
              id: true,
              order_number: true,
            },
          },
        },
      });

      if (!folder) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Folder not found',
        });
      }

      return folder;
    }),

  /**
   * Get all folders (paginated)
   */
  getAll: publicProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(50),
        cursor: z.string().uuid().optional(),
        customer_id: z.string().uuid().optional(),
        order_id: z.string().uuid().optional(),
        project_type: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { limit, cursor, customer_id, order_id, project_type } = input;

      const where: any = {};

      if (customer_id) {
        where.customer_id = customer_id;
      }

      if (order_id) {
        where.order_id = order_id;
      }

      if (project_type) {
        where.project_type = project_type;
      }

      const folders = await ctx.db.document_folders.findMany({
        where,
        take: limit + 1,
        cursor: cursor ? { id: cursor } : undefined,
        orderBy: { created_at: 'desc' },
        select: {
          id: true,
          folder_name: true,
          parent_folder_id: true,
          customer_id: true,
          order_id: true,
          project_type: true,
          full_path: true,
          created_at: true,
        },
      });

      let nextCursor: string | undefined;
      if (folders.length > limit) {
        const nextItem = folders.pop();
        nextCursor = nextItem?.id;
      }

      return {
        folders,
        nextCursor,
      };
    }),

  /**
   * Get root folders (no parent)
   */
  getRoots: publicProcedure.query(async ({ ctx }) => {
    const folders = await ctx.db.document_folders.findMany({
      where: {
        parent_folder_id: null,
      },
      orderBy: { folder_name: 'asc' },
      select: {
        id: true,
        folder_name: true,
        customer_id: true,
        order_id: true,
        project_type: true,
        created_at: true,
      },
    });

    return folders;
  }),

  /**
   * Get subfolders of a folder
   */
  getSubfolders: protectedProcedure
    .input(z.object({ parent_id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const folders = await ctx.db.document_folders.findMany({
        where: {
          parent_folder_id: input.parent_id,
        },
        orderBy: { folder_name: 'asc' },
        select: {
          id: true,
          folder_name: true,
          google_drive_folder_id: true,
          project_type: true,
          full_path: true,
          created_at: true,
        },
      });

      return folders;
    }),

  /**
   * Get folder tree (recursive)
   */
  getTree: protectedProcedure
    .input(z.object({ parent_id: z.string().uuid().optional() }))
    .query(async ({ ctx, input }) => {
      const where: any = {
        parent_folder_id: input.parent_id || null,
      };

      const folders = await ctx.db.document_folders.findMany({
        where,
        orderBy: { folder_name: 'asc' },
        select: {
          id: true,
          folder_name: true,
          parent_folder_id: true,
          google_drive_folder_id: true,
          project_type: true,
          full_path: true,
          other_document_folders: {
            orderBy: { folder_name: 'asc' },
            select: {
              id: true,
              folder_name: true,
              project_type: true,
            },
          },
        },
      });

      return folders;
    }),

  /**
   * Get folders by customer
   */
  getByCustomer: protectedProcedure
    .input(z.object({ customer_id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const folders = await ctx.db.document_folders.findMany({
        where: {
          customer_id: input.customer_id,
        },
        orderBy: { folder_name: 'asc' },
        select: {
          id: true,
          folder_name: true,
          parent_folder_id: true,
          order_id: true,
          project_type: true,
          full_path: true,
          created_at: true,
        },
      });

      return folders;
    }),

  /**
   * Get folders by order
   */
  getByOrder: protectedProcedure
    .input(z.object({ order_id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const folders = await ctx.db.document_folders.findMany({
        where: {
          order_id: input.order_id,
        },
        orderBy: { folder_name: 'asc' },
        select: {
          id: true,
          folder_name: true,
          parent_folder_id: true,
          project_type: true,
          full_path: true,
          created_at: true,
        },
      });

      return folders;
    }),

  /**
   * Get folders by project type
   */
  getByProjectType: protectedProcedure
    .input(z.object({ project_type: z.string() }))
    .query(async ({ ctx, input }) => {
      const folders = await ctx.db.document_folders.findMany({
        where: {
          project_type: input.project_type,
        },
        orderBy: { folder_name: 'asc' },
        select: {
          id: true,
          folder_name: true,
          customer_id: true,
          order_id: true,
          full_path: true,
          created_at: true,
        },
      });

      return folders;
    }),

  /**
   * Search folders by name
   */
  search: protectedProcedure
    .input(z.object({ query: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      const folders = await ctx.db.document_folders.findMany({
        where: {
          folder_name: {
            contains: input.query,
            mode: 'insensitive',
          },
        },
        orderBy: { folder_name: 'asc' },
        take: 50,
        select: {
          id: true,
          folder_name: true,
          parent_folder_id: true,
          customer_id: true,
          order_id: true,
          project_type: true,
          full_path: true,
        },
      });

      return folders;
    }),

  /**
   * Create folder
   */
  create: protectedProcedure
    .input(
      z.object({
        folder_name: z.string().min(1).max(255),
        parent_folder_id: z.string().uuid().optional(),
        google_drive_folder_id: z.string().optional(),
        customer_id: z.string().uuid().optional(),
        order_id: z.string().uuid().optional(),
        project_type: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Check for duplicate folder name under same parent
      const existing = await ctx.db.document_folders.findFirst({
        where: {
          folder_name: input.folder_name,
          parent_folder_id: input.parent_folder_id || null,
          customer_id: input.customer_id || null,
          order_id: input.order_id || null,
        },
      });

      if (existing) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'Folder with this name already exists in this location',
        });
      }

      // Verify parent folder exists if provided
      if (input.parent_folder_id) {
        const parentFolder = await ctx.db.document_folders.findUnique({
          where: { id: input.parent_folder_id },
          select: { id: true, full_path: true },
        });

        if (!parentFolder) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Parent folder not found',
          });
        }
      }

      // Calculate full path
      let fullPath = input.folder_name;
      if (input.parent_folder_id) {
        const parent = await ctx.db.document_folders.findUnique({
          where: { id: input.parent_folder_id },
          select: { full_path: true },
        });
        if (parent?.full_path) {
          fullPath = `${parent.full_path}/${input.folder_name}`;
        }
      }

      const newFolder = await ctx.db.document_folders.create({
        data: {
          folder_name: input.folder_name,
          parent_folder_id: input.parent_folder_id,
          google_drive_folder_id: input.google_drive_folder_id,
          customer_id: input.customer_id,
          order_id: input.order_id,
          project_type: input.project_type,
          full_path: fullPath,
        },
        select: {
          id: true,
          folder_name: true,
          parent_folder_id: true,
          full_path: true,
          created_at: true,
        },
      });

      return newFolder;
    }),

  /**
   * Update folder
   */
  update: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        folder_name: z.string().min(1).max(255).optional(),
        google_drive_folder_id: z.string().optional(),
        project_type: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id: _id, ...updateData } = input;

      // If renaming, recalculate full_path
      let newFullPath: string | undefined;
      if (input.folder_name) {
        const folder = await ctx.db.document_folders.findUnique({
          where: { id: input.id },
          select: { parent_folder_id: true },
        });

        if (folder?.parent_folder_id) {
          const parent = await ctx.db.document_folders.findUnique({
            where: { id: folder.parent_folder_id },
            select: { full_path: true },
          });
          newFullPath = `${parent?.full_path}/${input.folder_name}`;
        } else {
          newFullPath = input.folder_name;
        }
      }

      const updatedFolder = await ctx.db.document_folders.update({
        where: { id: input.id },
        data: {
          ...updateData,
          ...(newFullPath && { full_path: newFullPath }),
          updated_at: new Date(),
        },
        select: {
          id: true,
          folder_name: true,
          full_path: true,
          updated_at: true,
        },
      });

      return updatedFolder;
    }),

  /**
   * Move folder to different parent
   */
  move: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        new_parent_id: z.string().uuid().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const folder = await ctx.db.document_folders.findUnique({
        where: { id: input.id },
        select: { id: true, folder_name: true },
      });

      if (!folder) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Folder not found',
        });
      }

      // Verify new parent exists if provided
      if (input.new_parent_id) {
        const newParent = await ctx.db.document_folders.findUnique({
          where: { id: input.new_parent_id },
          select: { id: true },
        });

        if (!newParent) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'New parent folder not found',
          });
        }

        // Prevent moving folder into itself or its descendants
        if (input.new_parent_id === input.id) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Cannot move folder into itself',
          });
        }
      }

      // Calculate new full path
      let newFullPath = folder.folder_name;
      if (input.new_parent_id) {
        const newParent = await ctx.db.document_folders.findUnique({
          where: { id: input.new_parent_id },
          select: { full_path: true },
        });
        if (newParent?.full_path) {
          newFullPath = `${newParent.full_path}/${folder.folder_name}`;
        }
      }

      const movedFolder = await ctx.db.document_folders.update({
        where: { id: input.id },
        data: {
          parent_folder_id: input.new_parent_id,
          full_path: newFullPath,
          updated_at: new Date(),
        },
        select: {
          id: true,
          folder_name: true,
          parent_folder_id: true,
          full_path: true,
          updated_at: true,
        },
      });

      return movedFolder;
    }),

  /**
   * Delete folder
   */
  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      // Check if folder has subfolders
      const subfolders = await ctx.db.document_folders.count({
        where: {
          parent_folder_id: input.id,
        },
      });

      if (subfolders > 0) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'Cannot delete folder with subfolders',
        });
      }

      await ctx.db.document_folders.delete({
        where: { id: input.id },
      });

      return { success: true };
    }),

  /**
   * Get statistics
   */
  getStats: protectedProcedure.query(async ({ ctx }) => {
    const [total, roots, byProjectType, byCustomer] = await Promise.all([
      ctx.db.document_folders.count(),
      ctx.db.document_folders.count({ where: { parent_folder_id: null } }),
      ctx.db.document_folders.groupBy({
        by: ['project_type'],
        _count: true,
        where: {
          project_type: { not: null },
        },
      }),
      ctx.db.document_folders.groupBy({
        by: ['customer_id'],
        _count: true,
        where: {
          customer_id: { not: null },
        },
        orderBy: {
          _count: {
            customer_id: 'desc',
          },
        },
        take: 10,
      }),
    ]);

    return {
      total,
      rootFolders: roots,
      nestedFolders: total - roots,
      byProjectType: byProjectType.map(p => ({
        project_type: p.project_type,
        count: p._count,
      })),
      topCustomers: byCustomer.map(c => ({
        customer_id: c.customer_id,
        folder_count: c._count,
      })),
    };
  }),
});
