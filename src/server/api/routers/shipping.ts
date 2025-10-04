import { z } from 'zod';
import { createTRPCRouter, protectedProcedure, publicProcedure } from '../trpc/init';
import { sekoClient } from '@/lib/seko/client';
import type { Address, Package } from '@/lib/seko/client';
import { TRPCError } from '@trpc/server';

// ============================================================================
// SCHEMAS
// ============================================================================

const addressSchema = z.object({
  name: z.string().min(1),
  company: z.string().optional(),
  address_line1: z.string().min(1),
  address_line2: z.string().optional(),
  city: z.string().min(1),
  state: z.string().min(1),
  postal_code: z.string().min(1),
  country: z.string().min(1),
  phone: z.string().optional(),
  email: z.string().email().optional(),
});

const packageSchema = z.object({
  length: z.number().positive(),
  width: z.number().positive(),
  height: z.number().positive(),
  weight: z.number().positive(),
  quantity: z.number().int().positive().optional(),
});

const quoteRequestSchema = z.object({
  production_order_id: z.string().uuid(),
  origin: addressSchema,
  destination: addressSchema,
  packages: z.array(packageSchema).min(1),
  ship_date: z.date().optional(),
});

const createShipmentSchema = z.object({
  production_order_id: z.string().uuid(),
  origin: addressSchema,
  destination: addressSchema,
  packages: z.array(packageSchema).min(1),
  carrier: z.string().min(1),
  service_level: z.string().min(1),
  carrier_account_id: z.string().optional(),
  ship_date: z.date().optional(),
  reference_number: z.string().optional(),
  special_instructions: z.string().optional(),
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Generate shipment number in format SHIP-YYYY-XXXX
 */
function generateShipmentNumber(): string {
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `SHIP-${year}-${random}`;
}

// ============================================================================
// ROUTER
// ============================================================================

export const shippingRouter = createTRPCRouter({

  // Get shipping quotes from SEKO
  getQuotes: protectedProcedure
    .input(quoteRequestSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        // Call SEKO API to get quotes
        const quotes = await sekoClient.getQuotes({
          origin: input.origin as Address,
          destination: input.destination as Address,
          packages: input.packages as Package[],
          ship_date: input.ship_date,
        });

        // Store quote request in database for reference
        await ctx.db.shipping_quotes.create({
          data: {
            production_order_id: input.production_order_id,
            origin_address: input.origin,
            destination_address: input.destination,
            packages: input.packages,
            quotes: quotes,
            requested_at: new Date(),
            requested_by: ctx.session?.user?.id,
          },
        });

        return {
          quotes,
          request_id: input.production_order_id,
        };
      } catch (error) {
        console.error('Error fetching shipping quotes:', error);
        throw new Error('Failed to fetch shipping quotes from SEKO');
      }
    }),

  // Compare carriers for a production order
  compareCarriers: protectedProcedure
    .input(z.object({
      production_order_id: z.string().uuid(),
    }))
    .query(async ({ ctx, input }) => {
      // Get the most recent quote request for this production order
      const quoteRequest = await ctx.db.shipping_quotes.findFirst({
        where: {
          production_order_id: input.production_order_id,
        },
        orderBy: {
          requested_at: 'desc',
        },
      });

      if (!quoteRequest) {
        return {
          quotes: [],
          message: 'No quotes found for this production order',
        };
      }

      // Return quotes sorted by price
      const quotes = (quoteRequest.quotes as any[]) || [];
      const sortedQuotes = quotes.sort((a, b) => a.total_charge - b.total_charge);

      return {
        quotes: sortedQuotes,
        origin: quoteRequest.origin_address,
        destination: quoteRequest.destination_address,
        packages: quoteRequest.packages,
      };
    }),

  // Create shipment with selected carrier
  createShipment: protectedProcedure
    .input(createShipmentSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        // Generate shipment number
        const shipment_number = generateShipmentNumber();

        // Call SEKO API to create shipment
        const sekoShipment = await sekoClient.createShipment({
          order_id: input.production_order_id,
          origin: input.origin as Address,
          destination: input.destination as Address,
          packages: input.packages as Package[],
          carrier: input.carrier,
          service_level: input.service_level,
          carrier_account_id: input.carrier_account_id,
          ship_date: input.ship_date,
          reference_number: input.reference_number || shipment_number,
          special_instructions: input.special_instructions,
        });

        // Get production order details
        const productionOrder = await ctx.db.production_orders.findUnique({
          where: { id: input.production_order_id },
        });

        if (!productionOrder) {
          throw new Error('Production order not found');
        }

        // Create shipment record in database
        const shipment = await ctx.db.shipments.create({
          data: {
            shipment_number,
            seko_shipment_id: sekoShipment.shipment_id,
            tracking_number: sekoShipment.tracking_number,
            carrier: sekoShipment.carrier,
            service_level: sekoShipment.service_level,
            origin_address: input.origin,
            destination_address: input.destination,
            packages: input.packages,
            status: 'pending',
            label_url: sekoShipment.label_url,
            shipping_cost: sekoShipment.total_charge,
            estimated_delivery: sekoShipment.estimated_delivery,
            special_instructions: input.special_instructions,
            created_by: ctx.session?.user?.id,
            project_id: productionOrder.project_id,
          },
        });

        // Link ordered items to this shipment
        const orderedItems = await ctx.db.ordered_items_production.findMany({
          where: {
            production_order_id: input.production_order_id,
            qc_status: 'passed',
          },
        });

        // Update ordered items with shipment_id
        await Promise.all(
          orderedItems.map((item) =>
            ctx.db.ordered_items_production.update({
              where: { id: item.id },
              data: { shipment_id: shipment.id },
            })
          )
        );

        // Update production order status to shipped
        await ctx.db.production_orders.update({
          where: { id: input.production_order_id },
          data: { status: 'shipped' },
        });

        return {
          shipment,
          seko_shipment: sekoShipment,
          items_count: orderedItems.length,
        };
      } catch (error) {
        console.error('Error creating shipment:', error);
        throw new Error('Failed to create shipment');
      }
    }),

  // Track shipment by tracking number
  trackShipment: protectedProcedure
    .input(z.object({
      tracking_number: z.string().min(1),
    }))
    .query(async ({ ctx, input }) => {
      try {
        // Call SEKO API to get tracking info
        const tracking = await sekoClient.trackShipment(input.tracking_number);

        // Update shipment status in database
        const shipment = await ctx.db.shipments.findFirst({
          where: { tracking_number: input.tracking_number },
        });

        if (shipment) {
          await ctx.db.shipments.update({
            where: { id: shipment.id },
            data: {
              status: tracking.status,
              actual_delivery: tracking.actual_delivery,
              tracking_events: tracking.events,
            },
          });
        }

        return tracking;
      } catch (error) {
        console.error('Error tracking shipment:', error);
        throw new Error('Failed to track shipment');
      }
    }),

  // Get all shipments for a production order
  getShipmentsByOrder: protectedProcedure
    .input(z.object({
      production_order_id: z.string().uuid(),
    }))
    .query(async ({ ctx, input }) => {
      // Get ordered items with their shipments
      const orderedItems = await ctx.db.ordered_items_production.findMany({
        where: {
          production_order_id: input.production_order_id,
        },
        include: {
          shipments: true,
        },
      });

      // Extract unique shipments
      const shipmentsMap = new Map();
      orderedItems.forEach((item) => {
        if (item.shipments) {
          shipmentsMap.set(item.shipments.id, item.shipments);
        }
      });

      return Array.from(shipmentsMap.values());
    }),

  // Get shipping label URL
  getLabel: protectedProcedure
    .input(z.object({
      shipment_id: z.string().uuid(),
      format: z.enum(['PDF', 'ZPL']).default('PDF'),
    }))
    .query(async ({ ctx, input }) => {
      const shipment = await ctx.db.shipments.findUnique({
        where: { id: input.shipment_id },
      });

      if (!shipment) {
        throw new Error('Shipment not found');
      }

      if (!shipment.seko_shipment_id) {
        throw new Error('No SEKO shipment ID found');
      }

      try {
        // Get label from SEKO API
        const labelUrl = await sekoClient.getLabel(shipment.seko_shipment_id, input.format);

        // Update shipment with label URL if changed
        if (labelUrl !== shipment.label_url) {
          await ctx.db.shipments.update({
            where: { id: input.shipment_id },
            data: { label_url: labelUrl },
          });
        }

        return { label_url: labelUrl };
      } catch (error) {
        console.error('Error fetching label:', error);
        throw new Error('Failed to fetch shipping label');
      }
    }),

  // Get all shipments with filtering
  getAllShipments: protectedProcedure
    .input(z.object({
      status: z.string().optional(),
      carrier: z.string().optional(),
      project_id: z.string().uuid().optional(),
      limit: z.number().min(1).max(100).default(50),
      offset: z.number().min(0).default(0),
    }))
    .query(async ({ ctx, input }) => {
      const shipments = await ctx.db.shipments.findMany({
        where: {
          ...(input.status && { status: input.status }),
          ...(input.carrier && { carrier: input.carrier }),
          ...(input.project_id && { project_id: input.project_id }),
        },
        include: {
          projects: {
            select: {
              id: true,
              name: true,
            },
          },
          users: {
            select: {
              id: true,
              first_name: true,
              last_name: true,
            },
          },
        },
        limit: input.limit,
        offset: input.offset,
        orderBy: { created_at: 'desc' },
      });

      const total = await ctx.db.shipments.count({
        where: {
          ...(input.status && { status: input.status }),
          ...(input.carrier && { carrier: input.carrier }),
          ...(input.project_id && { project_id: input.project_id }),
        },
      });

      return {
        items: shipments,
        total,
        hasMore: total > input.offset + input.limit,
      };
    }),

  /**
   * Get single shipment by ID with full details
   * Used by shipment detail page
   */
  getShipmentById: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const shipment = await ctx.db.shipments.findUnique({
        where: { id: input.id },
        include: {
          projects: {
            select: {
              id: true,
              name: true,
              project_number: true,
            },
          },
          users: {
            select: {
              id: true,
              first_name: true,
              last_name: true,
              email: true,
            },
          },
          ordered_items_production: {
            include: {
              catalog_items: {
                select: {
                  id: true,
                  name: true,
                  sku: true,
                },
              },
              production_orders: {
                select: {
                  id: true,
                  production_order_number: true,
                },
              },
            },
          },
        },
      });

      if (!shipment) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Shipment not found',
        });
      }

      return shipment;
    }),

  /**
   * Update shipment status
   * Used by shipment detail page status dropdown
   */
  updateShipmentStatus: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        status: z.enum([
          'pending',
          'preparing',
          'ready',
          'shipped',
          'in_transit',
          'delivered',
          'delayed',
          'cancelled',
        ]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const updatedShipment = await ctx.db.shipments.update({
        where: { id: input.id },
        data: { status: input.status },
      });

      return {
        success: true,
        shipment: updatedShipment,
        message: `Shipment status updated to ${input.status}`,
      };
    }),

  /**
   * Get tracking info by tracking number (PUBLIC - no auth required)
   * Used by customer-facing tracking page
   */
  getTrackingInfo: publicProcedure
    .input(z.object({ trackingNumber: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      const shipment = await ctx.db.shipments.findFirst({
        where: { tracking_number: input.trackingNumber },
      });

      if (!shipment) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Tracking number not found',
        });
      }

      // Fetch latest tracking from SEKO API
      try {
        const sekoTracking = await sekoClient.trackShipment(input.trackingNumber);

        // Update database with latest tracking info
        await ctx.db.shipments.update({
          where: { id: shipment.id },
          data: {
            status: sekoTracking.status,
            actual_delivery: sekoTracking.actual_delivery,
            tracking_events: sekoTracking.events,
          },
        });

        return {
          ...shipment,
          status: sekoTracking.status,
          actual_delivery: sekoTracking.actual_delivery,
          tracking_events: sekoTracking.events,
        };
      } catch (error) {
        // If SEKO API fails, return cached data from database
        console.warn('Failed to fetch live tracking from SEKO, returning cached data:', error);
        return shipment;
      }
    }),
});
