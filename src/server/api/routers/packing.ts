/**
 * Packing tRPC Router
 *
 * API for packing jobs, boxes, and packing list auto-generation
 * from production orders for shipment preparation.
 */

import { z } from 'zod';
import { createTRPCRouter, publicProcedure } from '../trpc/init';
import { TRPCError } from '@trpc/server';

export const packingRouter = createTRPCRouter({
  // ============================================================================
  // PACKING JOBS
  // ============================================================================

  /**
   * Get all packing jobs with filters
   */
  getAllJobs: publicProcedure
    .input(
      z.object({
        orderId: z.string().uuid().optional(),
        status: z.enum(['pending', 'in_progress', 'packed', 'shipped']).optional(),
        limit: z.number().default(20),
        offset: z.number().default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      const where: any = {};

      if (input.orderId) {
        where.order_id = input.orderId;
      }

      if (input.status) {
        where.packing_status = input.status;
      }

      const [jobs, total] = await Promise.all([
        ctx.db.packing_jobs.findMany({
          where,
          include: {
            order_items: {
              select: {
                id: true,
                description: true,
                quantity: true,
              },
            },
            qc_inspections: {
              select: {
                status: true,
              },
            },
            _count: {
              select: {
                packing_boxes: true,
                shipments: true,
              },
            },
          },
          orderBy: {
            created_at: 'desc',
          },
          take: input.limit,
          skip: input.offset,
        }),
        ctx.db.packing_jobs.count({ where }),
      ]);

      return {
        jobs,
        total,
        hasMore: input.offset + input.limit < total,
        nextOffset: input.offset + input.limit < total ? input.offset + input.limit : null,
      };
    }),

  /**
   * Get single packing job by ID
   */
  getJobById: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const job = await ctx.db.packing_jobs.findUnique({
        where: { id: input.id },
        include: {
          order_items: {
            select: {
              id: true,
              description: true,
              quantity: true,
              project_sku: true,
            },
          },
          qc_inspections: {
            select: {
              id: true,
              status: true,
              qc_stage: true,
            },
          },
          packing_boxes: {
            orderBy: {
              box_number: 'asc',
            },
          },
          shipments: {
            select: {
              id: true,
              tracking_number: true,
              status: true,
            },
          },
        },
      });

      if (!job) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Packing job not found',
        });
      }

      return job;
    }),

  /**
   * Create packing job
   */
  createJob: publicProcedure
    .input(
      z.object({
        orderId: z.string().uuid(),
        orderItemId: z.string().uuid().optional(),
        qcInspectionId: z.string().uuid().optional(),
        quantity: z.number().int().positive(),
        priority: z.enum(['low', 'normal', 'high']).default('normal'),
        specialInstructions: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const job = await ctx.db.packing_jobs.create({
        data: {
          order_id: input.orderId,
          order_item_id: input.orderItemId,
          qc_inspection_id: input.qcInspectionId,
          quantity: input.quantity,
          priority: input.priority,
          special_instructions: input.specialInstructions,
          packing_status: 'pending',
        },
        include: {
          order_items: true,
        },
      });

      return {
        success: true,
        message: 'Packing job created successfully',
        job,
      };
    }),

  /**
   * Update packing job status
   */
  updateJobStatus: publicProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        status: z.enum(['pending', 'in_progress', 'packed', 'shipped']),
        packedQuantity: z.number().int().optional(),
        packedDate: z.date().optional(),
        trackingNumber: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const updateData: any = {
        packing_status: input.status,
      };

      if (input.packedQuantity !== undefined) {
        updateData.packed_quantity = input.packedQuantity;
      }

      if (input.packedDate) {
        updateData.packed_date = input.packedDate;
      }

      if (input.trackingNumber) {
        updateData.tracking_number = input.trackingNumber;
      }

      const job = await ctx.db.packing_jobs.update({
        where: { id: input.id },
        data: updateData,
      });

      return {
        success: true,
        message: 'Packing job status updated',
        job,
      };
    }),

  /**
   * Auto-generate packing job from production order
   */
  autoGenerateFromOrder: publicProcedure
    .input(
      z.object({
        productionOrderId: z.string().uuid(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Get production order with ordered items
      const productionOrder = await ctx.db.production_orders.findUnique({
        where: { id: input.productionOrderId },
        include: {
          ordered_items: {
            include: {
              catalog_items: {
                include: {
                  furniture_dimensions: true,
                },
              },
            },
          },
          qc_inspections: {
            where: {
              status: 'passed',
            },
            orderBy: {
              completed_at: 'desc',
            },
            take: 1,
          },
        },
      });

      if (!productionOrder) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Production order not found',
        });
      }

      if (productionOrder.ordered_items.length === 0) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Production order has no items to pack',
        });
      }

      // Create packing jobs for each ordered item
      const jobs: any[] = [];
      let totalWeight = 0;
      let boxCount = 0;

      for (const item of productionOrder.ordered_items) {
        const dimensions = item.catalog_items?.furniture_dimensions;
        const itemWeight = dimensions?.weight_lbs_new || 0;

        const job = await ctx.db.packing_jobs.create({
          data: {
            order_id: productionOrder.order_id,
            order_item_id: item.id,
            qc_inspection_id: productionOrder.qc_inspections[0]?.id,
            quantity: item.quantity,
            packed_quantity: 0,
            box_count: 1, // Default to 1 box per item
            total_weight: itemWeight * item.quantity,
            dimensions: dimensions
              ? `${dimensions.width_inches_new || 0}x${dimensions.depth_inches_new || 0}x${dimensions.height_inches_new || 0}`
              : undefined,
            packing_status: 'pending',
            priority: productionOrder.priority || 'normal',
          },
        });

        totalWeight += itemWeight * item.quantity;
        boxCount += 1;
        jobs.push(job);
      }

      return {
        success: true,
        message: `Generated ${jobs.length} packing job(s) from production order`,
        jobs,
        summary: {
          totalJobs: jobs.length,
          totalBoxes: boxCount,
          totalWeight,
        },
      };
    }),

  // ============================================================================
  // PACKING BOXES
  // ============================================================================

  /**
   * Get boxes for packing job
   */
  getBoxes: publicProcedure
    .input(z.object({ packingJobId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const boxes = await ctx.db.packing_boxes.findMany({
        where: {
          packing_job_id: input.packingJobId,
        },
        orderBy: {
          box_number: 'asc',
        },
      });

      return boxes;
    }),

  /**
   * Add box to packing job
   */
  addBox: publicProcedure
    .input(
      z.object({
        packingJobId: z.string().uuid(),
        boxNumber: z.number().int().positive(),
        boxType: z.string().optional(),
        dimensions: z.string().optional(),
        weight: z.number().optional(),
        contentsDescription: z.string().optional(),
        barcode: z.string().optional(),
        trackingNumber: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const box = await ctx.db.packing_boxes.create({
        data: {
          packing_job_id: input.packingJobId,
          box_number: input.boxNumber,
          box_type: input.boxType,
          dimensions: input.dimensions,
          weight: input.weight,
          contents_description: input.contentsDescription,
          barcode: input.barcode,
          tracking_number: input.trackingNumber,
        },
      });

      // Update packing job box count
      await ctx.db.packing_jobs.update({
        where: { id: input.packingJobId },
        data: {
          box_count: {
            increment: 1,
          },
        },
      });

      return {
        success: true,
        message: 'Box added successfully',
        box,
      };
    }),

  /**
   * Update box
   */
  updateBox: publicProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        boxType: z.string().optional(),
        dimensions: z.string().optional(),
        weight: z.number().optional(),
        contentsDescription: z.string().optional(),
        barcode: z.string().optional(),
        trackingNumber: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;

      const updateData: any = {};
      if (data.boxType !== undefined) updateData.box_type = data.boxType;
      if (data.dimensions !== undefined) updateData.dimensions = data.dimensions;
      if (data.weight !== undefined) updateData.weight = data.weight;
      if (data.contentsDescription !== undefined) updateData.contents_description = data.contentsDescription;
      if (data.barcode !== undefined) updateData.barcode = data.barcode;
      if (data.trackingNumber !== undefined) updateData.tracking_number = data.trackingNumber;

      const box = await ctx.db.packing_boxes.update({
        where: { id },
        data: updateData,
      });

      return {
        success: true,
        message: 'Box updated successfully',
        box,
      };
    }),

  /**
   * Delete box
   */
  deleteBox: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const box = await ctx.db.packing_boxes.findUnique({
        where: { id: input.id },
        select: { packing_job_id: true },
      });

      if (!box) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Box not found',
        });
      }

      await ctx.db.packing_boxes.delete({
        where: { id: input.id },
      });

      // Update packing job box count
      await ctx.db.packing_jobs.update({
        where: { id: box.packing_job_id },
        data: {
          box_count: {
            decrement: 1,
          },
        },
      });

      return {
        success: true,
        message: 'Box deleted successfully',
      };
    }),

  // ============================================================================
  // STATISTICS & REPORTING
  // ============================================================================

  /**
   * Get packing statistics
   */
  getPackingStats: publicProcedure
    .input(
      z.object({
        orderId: z.string().uuid().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const where: any = {};

      if (input.orderId) {
        where.order_id = input.orderId;
      }

      const [
        totalJobs,
        pendingJobs,
        inProgressJobs,
        packedJobs,
        shippedJobs,
        totalBoxes,
        totalWeight,
      ] = await Promise.all([
        ctx.db.packing_jobs.count({ where }),
        ctx.db.packing_jobs.count({ where: { ...where, packing_status: 'pending' } }),
        ctx.db.packing_jobs.count({ where: { ...where, packing_status: 'in_progress' } }),
        ctx.db.packing_jobs.count({ where: { ...where, packing_status: 'packed' } }),
        ctx.db.packing_jobs.count({ where: { ...where, packing_status: 'shipped' } }),
        ctx.db.packing_jobs.aggregate({
          where,
          _sum: {
            box_count: true,
          },
        }),
        ctx.db.packing_jobs.aggregate({
          where,
          _sum: {
            total_weight: true,
          },
        }),
      ]);

      return {
        jobs: {
          total: totalJobs,
          pending: pendingJobs,
          inProgress: inProgressJobs,
          packed: packedJobs,
          shipped: shippedJobs,
        },
        boxes: {
          total: totalBoxes._sum.box_count || 0,
        },
        weight: {
          total: Number(totalWeight._sum.total_weight || 0),
        },
      };
    }),
});
