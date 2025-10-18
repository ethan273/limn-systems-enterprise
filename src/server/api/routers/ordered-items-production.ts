/**
 * Ordered Items Production tRPC Router
 *
 * Individual unit tracking for QC and production workflow.
 * Each ordered item represents a single physical unit with unique SKU.
 */

import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '../trpc/init';
import { TRPCError } from '@trpc/server';

export const orderedItemsProductionRouter = createTRPCRouter({
  // ============================================================================
  // QUERIES
  // ============================================================================

  /**
   * Get all ordered items production with filters
   */
  getAll: protectedProcedure
    .input(
      z.object({
        productionOrderId: z.string().uuid().optional(),
        status: z.string().optional(),
        qcStatus: z.string().optional(),
        shipmentId: z.string().uuid().optional(),
        search: z.string().optional(),
        limit: z.number().default(50),
        offset: z.number().default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      const where: any = {};

      if (input.productionOrderId) {
        where.production_order_id = input.productionOrderId;
      }

      if (input.status) {
        where.status = input.status;
      }

      if (input.qcStatus) {
        where.qc_status = input.qcStatus;
      }

      if (input.shipmentId) {
        where.shipment_id = input.shipmentId;
      }

      if (input.search) {
        where.OR = [
          { sku: { contains: input.search, mode: 'insensitive' } },
          { serial_number: { contains: input.search, mode: 'insensitive' } },
        ];
      }

      const [items, total] = await Promise.all([
        ctx.db.ordered_items_production.findMany({
          where,
          include: {
            production_orders: {
              select: {
                order_number: true,
                item_name: true,
                status: true,
                projects: {
                  select: {
                    project_name: true,
                    customers: {
                      select: {
                        name: true,
                        company_name: true,
                      },
                    },
                  },
                },
              },
            },
            shipments: {
              select: {
                shipment_number: true,
                carrier: true,
                tracking_number: true,
                status: true,
              },
            },
            users: {
              select: {
                name: true,
                email: true,
              },
            },
          },
          orderBy: {
            created_at: 'desc',
          },
          take: input.limit,
          skip: input.offset,
        }),
        ctx.db.ordered_items_production.count({ where }),
      ]);

      return {
        items,
        total,
        hasMore: input.offset + input.limit < total,
        nextOffset: input.offset + input.limit < total ? input.offset + input.limit : null,
      };
    }),

  /**
   * Get single ordered item by ID
   */
  getById: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const item = await ctx.db.ordered_items_production.findUnique({
        where: { id: input.id },
        include: {
          production_orders: {
            include: {
              projects: {
                include: {
                  customers: true,
                },
              },
            },
          },
          shipments: {
            include: {
              shipping_carriers: true,
            },
          },
          users: true,
        },
      });

      if (!item) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Ordered item not found',
        });
      }

      return item;
    }),

  /**
   * Get items by production order
   */
  getByProductionOrder: protectedProcedure
    .input(z.object({ productionOrderId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const items = await ctx.db.ordered_items_production.findMany({
        where: {
          production_order_id: input.productionOrderId,
        },
        include: {
          shipments: {
            select: {
              shipment_number: true,
              tracking_number: true,
              status: true,
            },
          },
          users: {
            select: {
              name: true,
            },
          },
        },
        orderBy: {
          item_number: 'asc',
        },
      });

      return items;
    }),

  // ============================================================================
  // MUTATIONS
  // ============================================================================

  /**
   * Update QC status and notes
   */
  updateQC: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        qcStatus: z.enum(['pass', 'fail', 'pending', 'repaired']),
        qcNotes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const item = await ctx.db.ordered_items_production.update({
        where: { id: input.id },
        data: {
          qc_status: input.qcStatus,
          qc_notes: input.qcNotes,
          qc_date: new Date(),
          qc_by: ctx.user?.id,
        },
        include: {
          production_orders: {
            select: {
              order_number: true,
              item_name: true,
            },
          },
        },
      });

      return {
        success: true,
        item,
        message: `QC status updated to ${input.qcStatus}`,
      };
    }),

  /**
   * Update production status
   */
  updateStatus: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        status: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const updateData: any = {
        status: input.status,
      };

      // Set timestamps based on status
      if (input.status === 'in_production' && !updateData.production_start_date) {
        updateData.production_start_date = new Date();
      } else if (input.status === 'approved') {
        updateData.production_end_date = new Date();
      } else if (input.status === 'shipped') {
        updateData.shipped_date = new Date();
      } else if (input.status === 'delivered') {
        updateData.delivered_date = new Date();
      }

      const item = await ctx.db.ordered_items_production.update({
        where: { id: input.id },
        data: updateData,
      });

      return {
        success: true,
        item,
        message: `Status updated to ${input.status}`,
      };
    }),

  /**
   * Assign item to shipment
   */
  assignToShipment: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        shipmentId: z.string().uuid(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const item = await ctx.db.ordered_items_production.update({
        where: { id: input.id },
        data: {
          shipment_id: input.shipmentId,
          status: 'packed', // Update status when assigned to shipment
        },
        include: {
          shipments: {
            select: {
              shipment_number: true,
              tracking_number: true,
            },
          },
        },
      });

      return {
        success: true,
        item,
        message: `Item assigned to shipment ${item.shipments?.shipment_number}`,
      };
    }),

  /**
   * Bulk update QC status
   */
  bulkUpdateQC: protectedProcedure
    .input(
      z.object({
        ids: z.array(z.string().uuid()),
        qcStatus: z.enum(['pass', 'fail', 'pending', 'repaired']),
        qcNotes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Note: updateMany not supported by wrapper, using Promise.all with individual updates
      const updatePromises = input.ids.map(id =>
        ctx.db.ordered_items_production.update({
          where: { id },
          data: {
            qc_status: input.qcStatus,
            qc_notes: input.qcNotes,
            qc_date: new Date(),
            qc_by: ctx.user?.id,
          },
        })
      );

      const updatedItems = await Promise.all(updatePromises);

      return {
        success: true,
        count: updatedItems.length,
        message: `Updated ${updatedItems.length} items to ${input.qcStatus}`,
      };
    }),

  /**
   * Get QC statistics
   */
  getQCStats: protectedProcedure
    .input(
      z.object({
        productionOrderId: z.string().uuid().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const where: any = {};

      if (input.productionOrderId) {
        where.production_order_id = input.productionOrderId;
      }

      const [total, pending, passed, failed, repaired] = await Promise.all([
        ctx.db.ordered_items_production.count({ where }),
        ctx.db.ordered_items_production.count({ where: { ...where, qc_status: 'pending' } }),
        ctx.db.ordered_items_production.count({ where: { ...where, qc_status: 'pass' } }),
        ctx.db.ordered_items_production.count({ where: { ...where, qc_status: 'fail' } }),
        ctx.db.ordered_items_production.count({ where: { ...where, qc_status: 'repaired' } }),
      ]);

      return {
        total,
        pending,
        passed,
        failed,
        repaired,
        passRate: total > 0 ? Math.round((passed / total) * 100) : 0,
      };
    }),
});
