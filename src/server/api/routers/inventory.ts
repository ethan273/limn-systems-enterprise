import { z } from 'zod';
import { createTRPCRouter, protectedProcedure, publicProcedure } from '../trpc/init';
import { TRPCError } from '@trpc/server';

/**
 * Inventory Router
 *
 * Manages inventory table using ctx.db pattern.
 * Covers inventory tracking, stock levels, and reorder management.
 */

export const inventoryRouter = createTRPCRouter({
  /**
   * Get inventory record by ID
   */
  getById: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const inventory = await ctx.db.inventory.findUnique({
        where: { id: input.id },
        select: {
          id: true,
          item_id: true,
          location: true,
          quantity: true,
          reserved_quantity: true,
          reorder_point: true,
          reorder_quantity: true,
          last_counted: true,
          created_at: true,
          updated_at: true,
        },
      });

      if (!inventory) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Inventory record not found',
        });
      }

      return inventory;
    }),

  /**
   * Get all inventory records (paginated)
   */
  getAll: publicProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(50),
        cursor: z.string().uuid().optional(),
        location: z.string().optional(),
        low_stock: z.boolean().optional(), // Filter for items below reorder point
      })
    )
    .query(async ({ ctx, input }) => {
      const { limit, cursor, location, low_stock } = input;

      const where: any = {};

      if (location) {
        where.location = location;
      }

      // Low stock filter: quantity <= reorder_point
      if (low_stock) {
        where.AND = [
          { quantity: { not: null } },
          { reorder_point: { not: null } },
        ];
        // SQL-level comparison will be done using raw query if needed
      }

      const inventory = await ctx.db.inventory.findMany({
        where,
        take: limit + 1,
        cursor: cursor ? { id: cursor } : undefined,
        orderBy: { updated_at: 'desc' },
        select: {
          id: true,
          item_id: true,
          location: true,
          quantity: true,
          reserved_quantity: true,
          reorder_point: true,
          reorder_quantity: true,
          updated_at: true,
        },
      });

      // Filter low stock in-memory if needed
      let filteredInventory = low_stock
        ? inventory.filter(inv =>
            inv.quantity !== null &&
            inv.reorder_point !== null &&
            inv.quantity <= inv.reorder_point
          )
        : inventory;

      let nextCursor: string | undefined;
      if (filteredInventory.length > limit) {
        const nextItem = filteredInventory.pop();
        nextCursor = nextItem?.id;
      }

      return {
        inventory: filteredInventory,
        nextCursor,
      };
    }),

  /**
   * Get inventory for item
   */
  getByItem: publicProcedure
    .input(z.object({ item_id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const inventory = await ctx.db.inventory.findMany({
        where: {
          item_id: input.item_id,
        },
        orderBy: { location: 'asc' },
        select: {
          id: true,
          location: true,
          quantity: true,
          reserved_quantity: true,
          reorder_point: true,
          reorder_quantity: true,
          last_counted: true,
          updated_at: true,
        },
      });

      return inventory;
    }),

  /**
   * Get inventory for location
   */
  getByLocation: publicProcedure
    .input(
      z.object({
        location: z.string(),
        limit: z.number().min(1).max(100).default(50),
      })
    )
    .query(async ({ ctx, input }) => {
      const inventory = await ctx.db.inventory.findMany({
        where: {
          location: input.location,
        },
        take: input.limit,
        orderBy: { updated_at: 'desc' },
        select: {
          id: true,
          item_id: true,
          quantity: true,
          reserved_quantity: true,
          reorder_point: true,
          updated_at: true,
        },
      });

      return inventory;
    }),

  /**
   * Create inventory record
   */
  create: protectedProcedure
    .input(
      z.object({
        item_id: z.string().uuid(),
        location: z.string(),
        quantity: z.number().int().default(0),
        reserved_quantity: z.number().int().default(0),
        reorder_point: z.number().int().optional(),
        reorder_quantity: z.number().int().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Check for duplicate
      const existing = await ctx.db.inventory.findFirst({
        where: {
          item_id: input.item_id,
          location: input.location,
        },
      });

      if (existing) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'Inventory record already exists for this item and location',
        });
      }

      const newInventory = await ctx.db.inventory.create({
        data: {
          item_id: input.item_id,
          location: input.location,
          quantity: input.quantity,
          reserved_quantity: input.reserved_quantity,
          reorder_point: input.reorder_point,
          reorder_quantity: input.reorder_quantity,
          last_counted: new Date().toISOString(),
        },
        select: {
          id: true,
          item_id: true,
          location: true,
          quantity: true,
          created_at: true,
        },
      });

      return newInventory;
    }),

  /**
   * Update inventory quantity
   */
  updateQuantity: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        quantity: z.number().int(),
        reserved_quantity: z.number().int().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const updatedInventory = await ctx.db.inventory.update({
        where: { id: input.id },
        data: {
          quantity: input.quantity,
          ...(input.reserved_quantity !== undefined && {
            reserved_quantity: input.reserved_quantity,
          }),
          last_counted: new Date().toISOString(),
          updated_at: new Date(),
        },
        select: {
          id: true,
          quantity: true,
          reserved_quantity: true,
          updated_at: true,
        },
      });

      return updatedInventory;
    }),

  /**
   * Adjust quantity (increment/decrement)
   */
  adjustQuantity: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        adjustment: z.number().int(), // Can be positive or negative
        adjust_reserved: z.boolean().default(false),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const inventory = await ctx.db.inventory.findUnique({
        where: { id: input.id },
        select: { quantity: true, reserved_quantity: true },
      });

      if (!inventory) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Inventory record not found',
        });
      }

      const newQuantity = (inventory.quantity || 0) + input.adjustment;
      const newReserved = input.adjust_reserved
        ? (inventory.reserved_quantity || 0) + input.adjustment
        : inventory.reserved_quantity;

      if (newQuantity < 0) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Adjustment would result in negative quantity',
        });
      }

      const updatedInventory = await ctx.db.inventory.update({
        where: { id: input.id },
        data: {
          quantity: newQuantity,
          ...(input.adjust_reserved && { reserved_quantity: newReserved }),
          last_counted: new Date().toISOString(),
          updated_at: new Date(),
        },
        select: {
          id: true,
          quantity: true,
          reserved_quantity: true,
          updated_at: true,
        },
      });

      return updatedInventory;
    }),

  /**
   * Update reorder settings
   */
  updateReorderSettings: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        reorder_point: z.number().int(),
        reorder_quantity: z.number().int(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const updatedInventory = await ctx.db.inventory.update({
        where: { id: input.id },
        data: {
          reorder_point: input.reorder_point,
          reorder_quantity: input.reorder_quantity,
          updated_at: new Date(),
        },
        select: {
          id: true,
          reorder_point: true,
          reorder_quantity: true,
          updated_at: true,
        },
      });

      return updatedInventory;
    }),

  /**
   * Delete inventory record
   */
  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.inventory.delete({
        where: { id: input.id },
      });

      return { success: true };
    }),

  /**
   * Get inventory statistics
   */
  getStats: protectedProcedure.query(async ({ ctx }) => {
    const [total, totalLocations] = await Promise.all([
      ctx.db.inventory.count(),
      ctx.db.inventory.groupBy({
        by: ['location'],
        _count: true,
      }),
    ]);

    // Get low stock items
    const allInventory = await ctx.db.inventory.findMany({
      select: {
        quantity: true,
        reorder_point: true,
      },
    });

    const lowStockCount = allInventory.filter(
      inv =>
        inv.quantity !== null &&
        inv.reorder_point !== null &&
        inv.quantity <= inv.reorder_point
    ).length;

    return {
      totalRecords: total,
      totalLocations: totalLocations.length,
      lowStockItems: lowStockCount,
      byLocation: totalLocations.map(loc => ({
        location: loc.location,
        count: loc._count,
      })),
    };
  }),
});
