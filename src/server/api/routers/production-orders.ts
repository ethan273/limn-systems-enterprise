import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '../trpc/init';
import { Prisma } from '@prisma/client';

// ============================================================================
// SCHEMAS
// ============================================================================

const createProductionOrderSchema = z.object({
  // Links
  order_id: z.string().uuid().optional(), // Links to CRM orders table for grouping/shipping
  project_id: z.string().uuid().optional(),

  // Product Type (90% catalog, 10% custom)
  product_type: z.enum(['catalog', 'prototype', 'concept']),
  catalog_item_id: z.string().uuid().optional(),
  prototype_id: z.string().uuid().optional(),
  concept_id: z.string().uuid().optional(),

  // Order Details
  item_name: z.string().min(1),
  item_description: z.string().optional(),
  quantity: z.number().int().min(1),
  unit_price: z.number().min(0),

  // Dates
  estimated_ship_date: z.date().optional(),

  // Factory Assignment
  factory_id: z.string().uuid().optional(),
  factory_notes: z.string().optional(),
});

const updateProductionOrderSchema = createProductionOrderSchema.partial();

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Generates a unique production order number
 * Format: PO-YYYY-XXXX
 */
async function generateOrderNumber(db: any): Promise<string> {
  const year = new Date().getFullYear();
  const count = await db.production_orders.count({
    where: {
      order_number: {
        startsWith: `PO-${year}-`,
      },
    },
  });

  return `PO-${year}-${String(count + 1).padStart(4, '0')}`;
}

/**
 * Generates a unique invoice number
 * Format: INV-YYYY-XXXX
 */
async function generateInvoiceNumber(db: any): Promise<string> {
  const year = new Date().getFullYear();
  const count = await db.production_invoices.count({
    where: {
      invoice_number: {
        startsWith: `INV-${year}-`,
      },
    },
  });

  return `INV-${year}-${String(count + 1).padStart(4, '0')}`;
}

/**
 * Creates a deposit invoice (50%) when production order is created
 * NOTE: Currently unused - invoice generation moved to per-CRM-order level
 * Kept for backward compatibility and potential future use
 */
async function _createDepositInvoice(
  db: any,
  orderId: string,
  orderData: {
    project_id?: string;
    total_cost: number;
    item_name: string;
    quantity: number;
    unit_price: number;
  }
) {
  const depositAmount = orderData.total_cost * 0.5;
  const invoiceNumber = await generateInvoiceNumber(db);

  // Get customer from project if available
  let customer_id: string | undefined;
  if (orderData.project_id) {
    const project = await db.projects.findUnique({
      where: { id: orderData.project_id },
      select: { customer_id: true },
    });
    customer_id = project?.customer_id ?? undefined;
  }

  const invoice = await db.production_invoices.create({
    data: {
      invoice_number: invoiceNumber,
      invoice_type: 'deposit',
      production_order_id: orderId,
      project_id: orderData.project_id,
      customer_id,
      subtotal: new Prisma.Decimal(depositAmount),
      tax: new Prisma.Decimal(0),
      shipping: new Prisma.Decimal(0),
      total: new Prisma.Decimal(depositAmount),
      amount_paid: new Prisma.Decimal(0),
      amount_due: new Prisma.Decimal(depositAmount),
      payment_terms: '50% deposit due upon Production Order creation',
      status: 'pending_payment',
    },
  });

  // Create line item
  await db.production_invoice_line_items.create({
    data: {
      production_invoice_id: invoice.id,
      description: `${orderData.item_name} - Deposit (50%)`,
      quantity: orderData.quantity,
      unit_price: new Prisma.Decimal(orderData.unit_price * 0.5),
      total: new Prisma.Decimal(depositAmount),
    },
  });

  return invoice;
}

/**
 * Creates final invoice (50% + shipping) when production is completed
 */
async function createFinalInvoice(
  db: any,
  order: {
    id: string;
    project_id?: string;
    total_cost: number;
    item_name: string;
    quantity: number;
    unit_price: number;
  },
  estimatedShipping: number = 500
) {
  const balanceAmount = order.total_cost * 0.5;
  const invoiceNumber = await generateInvoiceNumber(db);

  // Get customer from project if available
  let customer_id: string | undefined;
  if (order.project_id) {
    const project = await db.projects.findUnique({
      where: { id: order.project_id },
      select: { customer_id: true },
    });
    customer_id = project?.customer_id ?? undefined;
  }

  const invoice = await db.production_invoices.create({
    data: {
      invoice_number: invoiceNumber,
      invoice_type: 'final',
      production_order_id: order.id,
      project_id: order.project_id,
      customer_id,
      subtotal: new Prisma.Decimal(balanceAmount),
      tax: new Prisma.Decimal(0),
      shipping: new Prisma.Decimal(estimatedShipping),
      total: new Prisma.Decimal(balanceAmount + estimatedShipping),
      amount_paid: new Prisma.Decimal(0),
      amount_due: new Prisma.Decimal(balanceAmount + estimatedShipping),
      payment_terms: '50% balance + shipping due at FOB (Free on Board)',
      status: 'pending_payment',
    },
  });

  // Create line items
  await db.production_invoice_line_items.createMany({
    data: [
      {
        production_invoice_id: invoice.id,
        description: `${order.item_name} - Balance (50%)`,
        quantity: order.quantity,
        unit_price: new Prisma.Decimal(order.unit_price * 0.5),
        total: new Prisma.Decimal(balanceAmount),
      },
      {
        production_invoice_id: invoice.id,
        description: 'Estimated Shipping Cost',
        quantity: 1,
        unit_price: new Prisma.Decimal(estimatedShipping),
        total: new Prisma.Decimal(estimatedShipping),
      },
    ],
  });

  return invoice;
}

// ============================================================================
// ROUTER
// ============================================================================

export const productionOrdersRouter = createTRPCRouter({

  // Get all production orders with filters
  getAll: protectedProcedure
    .input(
      z.object({
        status: z.string().optional(),
        project_id: z.string().uuid().optional(),
        factory_id: z.string().uuid().optional(),
        limit: z.number().min(1).max(100).default(50),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      const items = await ctx.db.production_orders.findMany({
        where: {
          ...(input.status && { status: input.status }),
          ...(input.project_id && { project_id: input.project_id }),
          ...(input.factory_id && { factory_id: input.factory_id }),
        },
        limit: input.limit,
        offset: input.offset,
        orderBy: { created_at: 'desc' },
      });

      return {
        items,
        total: items.length,
        hasMore: items.length === input.limit,
      };
    }),

  // Get single production order by ID
  getById: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.production_orders.findUnique({
        where: { id: input.id },
        include: {
          projects: {
            include: {
              customers: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  phone: true,
                },
              },
            },
          },
          items_catalog: true,
          items_prototype: true,
          items_concept: true,
          manufacturers: true,
          production_invoices: {
            include: {
              production_invoice_line_items: true,
              production_payments: true,
            },
          },
          ordered_items_production: {
            orderBy: { item_number: 'asc' },
          },
          documents: true,
        },
      });
    }),

  // Create production order - AUTO-GENERATES DEPOSIT INVOICE
  create: protectedProcedure
    .input(createProductionOrderSchema)
    .mutation(async ({ ctx, input }) => {
      const totalCost = input.unit_price * input.quantity;
      const orderNumber = await generateOrderNumber(ctx.db);

      // Create Production Order
      const order = await ctx.db.production_orders.create({
        data: {
          order_number: orderNumber,
          order_id: input.order_id, // Links to CRM order for grouping/shipping
          project_id: input.project_id,
          product_type: input.product_type,
          catalog_item_id: input.catalog_item_id,
          prototype_id: input.prototype_id,
          concept_id: input.concept_id,
          item_name: input.item_name,
          item_description: input.item_description,
          quantity: input.quantity,
          unit_price: new Prisma.Decimal(input.unit_price),
          total_cost: new Prisma.Decimal(totalCost),
          estimated_ship_date: input.estimated_ship_date,
          factory_id: input.factory_id,
          factory_notes: input.factory_notes,
          status: 'awaiting_deposit', // CRITICAL: Blocks production until deposit paid
          deposit_paid: false,
          final_payment_paid: false,
          created_by: ctx.session?.user?.id,
        },
      });

      // NOTE: Invoice generation is handled separately per CRM order (not per production order)
      // When order_id is provided, ONE invoice covers all production orders for that CRM order
      // Skipping individual invoice creation to avoid duplicate invoices

      return {
        order,
        message: `Production order ${orderNumber} created and linked to CRM order. Invoice will be generated for the complete order.`,
      };
    }),

  // Update production order status - TRIGGERS ORDERED ITEMS CREATION & FINAL INVOICE
  updateStatus: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        status: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const order = await ctx.db.production_orders.findUnique({
        where: { id: input.id },
      });

      if (!order) {
        throw new Error('Production order not found');
      }

      // Update order status
      const updatedOrder = await ctx.db.production_orders.update({
        where: { id: input.id },
        data: { status: input.status },
      });

      // TRIGGER: Production Completed → Auto-create Final Invoice
      if (input.status === 'completed') {
        const finalInvoice = await createFinalInvoice(ctx.db, {
          id: order.id,
          project_id: order.project_id ?? undefined,
          total_cost: Number(order.total_cost),
          item_name: order.item_name,
          quantity: order.quantity,
          unit_price: Number(order.unit_price),
        });

        // Update order status to awaiting final payment
        await ctx.db.production_orders.update({
          where: { id: input.id },
          data: { status: 'awaiting_final_payment' },
        });

        return {
          order: updatedOrder,
          finalInvoice,
          message: `Production completed. Final invoice ${finalInvoice.invoice_number} generated. Shipping blocked until payment received.`,
        };
      }

      return {
        order: updatedOrder,
        message: `Production order status updated to ${input.status}.`,
      };
    }),

  // Update production order
  update: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        data: updateProductionOrderSchema,
      })
    )
    .mutation(async ({ ctx, input }) => {
      const updateData: any = { ...input.data };

      // Recalculate total cost if quantity or unit price changed
      if (input.data.quantity !== undefined || input.data.unit_price !== undefined) {
        const currentOrder = await ctx.db.production_orders.findUnique({
          where: { id: input.id },
        });

        if (currentOrder) {
          const quantity = input.data.quantity ?? currentOrder.quantity;
          const unitPrice = input.data.unit_price ?? Number(currentOrder.unit_price);
          updateData.total_cost = new Prisma.Decimal(quantity * unitPrice);
        }
      }

      // Convert numeric fields to Prisma.Decimal if present
      if (input.data.unit_price !== undefined) {
        updateData.unit_price = new Prisma.Decimal(input.data.unit_price);
      }

      return ctx.db.production_orders.update({
        where: { id: input.id },
        data: updateData,
      });
    }),

  // Delete production order
  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      // Check if order can be deleted (no payments made)
      const invoicesWithPayments = await ctx.db.production_invoices.findFirst({
        where: {
          production_order_id: input.id,
          amount_paid: {
            gt: 0,
          },
        },
      });

      if (invoicesWithPayments) {
        throw new Error('Cannot delete production order with payments received. Please cancel instead.');
      }

      // Delete will cascade to invoices, line items, and ordered items
      return ctx.db.production_orders.delete({
        where: { id: input.id },
      });
    }),
});
