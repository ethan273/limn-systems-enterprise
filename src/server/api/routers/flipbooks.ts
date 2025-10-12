/**
 * Flipbooks tRPC Router
 *
 * Provides type-safe API endpoints for flipbook operations.
 * All endpoints are only available when the flipbooks feature flag is enabled.
 *
 * FEATURE FLAG: Protected by features.flipbooks check
 * SCHEMA: Uses flipbook.* tables (isolated from public schema)
 */

import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc/init";
import { TRPCError } from "@trpc/server";
import { features } from "@/lib/features";
import { PrismaClient } from "@prisma/client";

// Prisma client for flipbooks (separate from hybrid db client)
const prisma = new PrismaClient();

/**
 * Input validation schemas
 */
const createFlipbookInput = z.object({
  title: z.string().min(1).max(255),
  description: z.string().optional(),
  pdf_source_url: z.string().url().optional(),
});

const updateFlipbookInput = z.object({
  id: z.string().uuid(),
  title: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).optional(),
});

const getFlipbookInput = z.object({
  id: z.string().uuid(),
});

const listFlipbooksInput = z.object({
  limit: z.number().min(1).max(100).default(20),
  cursor: z.string().uuid().optional(),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).optional(),
});

/**
 * Flipbooks Router
 */
export const flipbooksRouter = createTRPCRouter({
  /**
   * Get all flipbooks for current user
   */
  list: protectedProcedure
    .input(listFlipbooksInput)
    .query(async ({ ctx, input }) => {
      // Feature flag check
      if (!features.flipbooks) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Flipbooks feature is not enabled",
        });
      }

      const { limit, cursor, status } = input;

      // Build where clause
      const where: any = {
        created_by_id: ctx.session.user.id,
      };

      if (status) {
        where.status = status;
      }

      if (cursor) {
        where.id = { lt: cursor };
      }

      // Query flipbooks
      const flipbooks = await prisma.flipbooks.findMany({
        where,
        take: limit,
        orderBy: { created_at: "desc" },
        include: {
          created_by: {
            select: {
              id: true,
              full_name: true,
              email: true,
            },
          },
          pages: {
            select: {
              id: true,
              page_number: true,
            },
            orderBy: { page_number: "asc" },
          },
        },
      });

      return {
        flipbooks,
        nextCursor: flipbooks.length === limit ? flipbooks[flipbooks.length - 1]?.id : undefined,
      };
    }),

  /**
   * Get single flipbook by ID
   */
  get: protectedProcedure
    .input(getFlipbookInput)
    .query(async ({ ctx, input }) => {
      // Feature flag check
      if (!features.flipbooks) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Flipbooks feature is not enabled",
        });
      }

      const flipbook = await prisma.flipbooks.findUnique({
        where: { id: input.id },
        include: {
          created_by: {
            select: {
              id: true,
              full_name: true,
              email: true,
              avatar_url: true,
            },
          },
          pages: {
            orderBy: { page_number: "asc" },
            include: {
              hotspots: {
                include: {
                  target_product: {
                    select: {
                      id: true,
                      name: true,
                      sku: true,
                    },
                  },
                },
              },
            },
          },
          versions: {
            orderBy: { version_number: "desc" },
            take: 5,
          },
        },
      });

      if (!flipbook) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Flipbook not found",
        });
      }

      // Check permissions - only creator can view
      if (flipbook.created_by_id !== ctx.session.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have permission to view this flipbook",
        });
      }

      // Increment view count
      await prisma.flipbooks.update({
        where: { id: input.id },
        data: { view_count: { increment: 1 } },
      });

      return flipbook;
    }),

  /**
   * Create new flipbook
   */
  create: protectedProcedure
    .input(createFlipbookInput)
    .mutation(async ({ ctx, input }) => {
      // Feature flag check
      if (!features.flipbooks) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Flipbooks feature is not enabled",
        });
      }

      const flipbook = await prisma.flipbooks.create({
        data: {
          title: input.title,
          description: input.description,
          created_by_id: ctx.session.user.id,
          pdf_source_url: input.pdf_source_url,
          status: "DRAFT",
        },
        include: {
          created_by: {
            select: {
              id: true,
              full_name: true,
              email: true,
            },
          },
        },
      });

      return flipbook;
    }),

  /**
   * Update existing flipbook
   */
  update: protectedProcedure
    .input(updateFlipbookInput)
    .mutation(async ({ ctx, input }) => {
      // Feature flag check
      if (!features.flipbooks) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Flipbooks feature is not enabled",
        });
      }

      const { id, ...data } = input;

      // Check if flipbook exists and user has permission
      const existing = await prisma.flipbooks.findUnique({
        where: { id },
        select: { created_by_id: true },
      });

      if (!existing) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Flipbook not found",
        });
      }

      if (existing.created_by_id !== ctx.session.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have permission to update this flipbook",
        });
      }

      // Update published_at if status changes to PUBLISHED
      const updateData: any = { ...data };
      if (data.status === "PUBLISHED" && existing.status !== "PUBLISHED") {
        updateData.published_at = new Date();
      }

      const flipbook = await prisma.flipbooks.update({
        where: { id },
        data: updateData,
        include: {
          created_by: {
            select: {
              id: true,
              full_name: true,
              email: true,
            },
          },
        },
      });

      return flipbook;
    }),

  /**
   * Delete flipbook
   */
  delete: protectedProcedure
    .input(getFlipbookInput)
    .mutation(async ({ ctx, input }) => {
      // Feature flag check
      if (!features.flipbooks) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Flipbooks feature is not enabled",
        });
      }

      // Check if flipbook exists and user has permission
      const existing = await prisma.flipbooks.findUnique({
        where: { id: input.id },
        select: { created_by_id: true },
      });

      if (!existing) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Flipbook not found",
        });
      }

      if (existing.created_by_id !== ctx.session.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have permission to delete this flipbook",
        });
      }

      // Delete flipbook (cascade will delete related pages, hotspots, versions, analytics)
      await prisma.flipbooks.delete({
        where: { id: input.id },
      });

      return { success: true };
    }),

  /**
   * Get analytics for flipbook
   */
  getAnalytics: protectedProcedure
    .input(getFlipbookInput)
    .query(async ({ ctx, input }) => {
      // Feature flag check
      if (!features.flipbooks) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Flipbooks feature is not enabled",
        });
      }

      // Check if flipbook exists and user has permission
      const flipbook = await prisma.flipbooks.findUnique({
        where: { id: input.id },
        select: {
          created_by_id: true,
          view_count: true,
        },
      });

      if (!flipbook) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Flipbook not found",
        });
      }

      if (flipbook.created_by_id !== ctx.session.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have permission to view analytics for this flipbook",
        });
      }

      // Aggregate analytics events
      const events = await prisma.analytics_events.findMany({
        where: { flipbook_id: input.id },
      });

      const views = events.filter(e => e.event_type === "VIEW").length;
      const pageTurns = events.filter(e => e.event_type === "PAGE_TURN").length;
      const hotspotClicks = events.filter(e => e.event_type === "HOTSPOT_CLICK").length;

      // Calculate average time spent
      const sessions = events.filter(e => e.event_type === "VIEW" && e.session_duration);
      const totalTime = sessions.reduce((sum, e) => sum + (e.session_duration || 0), 0);
      const avgTimeSpent = sessions.length > 0 ? totalTime / sessions.length : 0;

      return {
        views,
        pageTurns,
        hotspotClicks,
        avgTimeSpent: Math.round(avgTimeSpent),
        totalViews: flipbook.view_count || 0,
      };
    }),

  // ========================================
  // PAGE MANAGEMENT ENDPOINTS
  // ========================================

  /**
   * Delete a page from flipbook
   */
  deletePage: protectedProcedure
    .input(z.object({ pageId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      if (!features.flipbooks) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Flipbooks feature is not enabled",
        });
      }

      // Get page with flipbook info for permission check
      const page = await prisma.flipbook_pages.findUnique({
        where: { id: input.pageId },
        include: { flipbook: { select: { created_by_id: true } } },
      });

      if (!page) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Page not found",
        });
      }

      if (page.flipbook.created_by_id !== ctx.session.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have permission to delete this page",
        });
      }

      await prisma.flipbook_pages.delete({
        where: { id: input.pageId },
      });

      return { success: true };
    }),

  /**
   * Reorder pages
   */
  reorderPages: protectedProcedure
    .input(z.object({
      flipbookId: z.string().uuid(),
      pageIds: z.array(z.string().uuid()),
    }))
    .mutation(async ({ ctx, input }) => {
      if (!features.flipbooks) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Flipbooks feature is not enabled",
        });
      }

      // Check permissions
      const flipbook = await prisma.flipbooks.findUnique({
        where: { id: input.flipbookId },
        select: { created_by_id: true },
      });

      if (!flipbook || flipbook.created_by_id !== ctx.session.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have permission to reorder pages",
        });
      }

      // Update page numbers based on new order
      for (let i = 0; i < input.pageIds.length; i++) {
        await prisma.flipbook_pages.update({
          where: { id: input.pageIds[i] },
          data: { page_number: i + 1 },
        });
      }

      return { success: true };
    }),

  // ========================================
  // HOTSPOT MANAGEMENT ENDPOINTS
  // ========================================

  /**
   * Create a hotspot on a page
   */
  createHotspot: protectedProcedure
    .input(z.object({
      pageId: z.string().uuid(),
      productId: z.string().uuid(),
      xPercent: z.number().min(0).max(100),
      yPercent: z.number().min(0).max(100),
      width: z.number().min(1).max(100).default(10),
      height: z.number().min(1).max(100).default(10),
      label: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (!features.flipbooks) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Flipbooks feature is not enabled",
        });
      }

      // Check permissions via page
      const page = await prisma.flipbook_pages.findUnique({
        where: { id: input.pageId },
        include: { flipbook: { select: { created_by_id: true } } },
      });

      if (!page || page.flipbook.created_by_id !== ctx.session.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have permission to add hotspots",
        });
      }

      const hotspot = await prisma.hotspots.create({
        data: {
          page_id: input.pageId,
          hotspot_type: "PRODUCT_LINK",
          x_position: input.xPercent,
          y_position: input.yPercent,
          width: input.width,
          height: input.height,
          target_product_id: input.productId,
        },
        include: {
          target_product: {
            select: {
              id: true,
              name: true,
              sku: true,
              category: true,
              base_price: true,
            },
          },
        },
      });

      return hotspot;
    }),

  /**
   * Update hotspot
   */
  updateHotspot: protectedProcedure
    .input(z.object({
      hotspotId: z.string().uuid(),
      xPercent: z.number().min(0).max(100).optional(),
      yPercent: z.number().min(0).max(100).optional(),
      width: z.number().min(1).max(100).optional(),
      height: z.number().min(1).max(100).optional(),
      label: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (!features.flipbooks) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Flipbooks feature is not enabled",
        });
      }

      const { hotspotId, ...updateData } = input;

      // Check permissions
      const hotspot = await prisma.hotspots.findUnique({
        where: { id: hotspotId },
        include: {
          page: {
            include: {
              flipbook: { select: { created_by_id: true } },
            },
          },
        },
      });

      if (!hotspot || hotspot.page.flipbook.created_by_id !== ctx.session.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have permission to update this hotspot",
        });
      }

      const updated = await prisma.hotspots.update({
        where: { id: hotspotId },
        data: updateData,
        include: {
          target_product: {
            select: {
              id: true,
              name: true,
              sku: true,
              category: true,
              base_price: true,
            },
          },
        },
      });

      return updated;
    }),

  /**
   * Delete hotspot
   */
  deleteHotspot: protectedProcedure
    .input(z.object({ hotspotId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      if (!features.flipbooks) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Flipbooks feature is not enabled",
        });
      }

      // Check permissions
      const hotspot = await prisma.hotspots.findUnique({
        where: { id: input.hotspotId },
        include: {
          page: {
            include: {
              flipbook: { select: { created_by_id: true } },
            },
          },
        },
      });

      if (!hotspot || hotspot.page.flipbook.created_by_id !== ctx.session.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have permission to delete this hotspot",
        });
      }

      await prisma.hotspots.delete({
        where: { id: input.hotspotId },
      });

      return { success: true };
    }),
});
