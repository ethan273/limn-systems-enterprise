import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '../trpc/init';
import { Prisma } from '@prisma/client';

// ============================================================================
// SCHEMAS
// ============================================================================

const recordPaymentSchema = z.object({
  production_invoice_id: z.string().uuid(),
  amount: z.number().min(0.01),
  payment_method: z.enum(['credit_card', 'wire_transfer', 'check', 'ach']),
  transaction_id: z.string().optional(),
  notes: z.string().optional(),
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Generates a unique payment number
 * Format: PAY-YYYY-XXXX
 */
async function generatePaymentNumber(db: any): Promise<string> {
  const year = new Date().getFullYear();
  const count = await db.production_payments.count({
    where: {
      payment_number: {
        startsWith: `PAY-${year}-`,
      },
    },
  });

  return `PAY-${year}-${String(count + 1).padStart(4, '0')}`;
}

/**
 * Creates ordered items when deposit is paid
 */
async function createOrderedItems(
  db: any,
  order: {
    id: string;
    order_number: string;
    quantity: number;
  }
) {
  const items = [];

  for (let i = 1; i <= order.quantity; i++) {
    const sku = `${order.order_number}-${String(i).padStart(3, '0')}`;

    items.push({
      sku,
      production_order_id: order.id,
      item_number: i,
      status: 'pending',
      qc_status: 'pending',
    });
  }

  await db.ordered_items_production.createMany({
    data: items,
  });

  return items.length;
}

// ============================================================================
// ROUTER
// ============================================================================

export const productionInvoicesRouter = createTRPCRouter({

  // Get all invoices with filters
  getAll: protectedProcedure
    .input(
      z.object({
        status: z.string().optional(),
        invoice_type: z.string().optional(),
        production_order_id: z.string().uuid().optional(),
        project_id: z.string().uuid().optional(),
        limit: z.number().min(1).max(100).default(50),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      const items = await ctx.db.production_invoices.findMany({
        where: {
          ...(input.status && { status: input.status }),
          ...(input.invoice_type && { invoice_type: input.invoice_type }),
          ...(input.production_order_id && { production_order_id: input.production_order_id }),
          ...(input.project_id && { project_id: input.project_id }),
        },
        limit: input.limit,
        offset: input.offset,
        orderBy: { invoice_date: 'desc' },
      });

      return {
        items,
        total: items.length,
        hasMore: items.length === input.limit,
      };
    }),

  // Get single invoice by ID
  getById: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.production_invoices.findUnique({
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
          projects: true,
          customers: true,
          production_invoice_line_items: true,
          production_payments: {
            orderBy: { payment_date: 'desc' },
          },
        },
      });
    }),

  // Get invoices by production order
  getByProductionOrder: protectedProcedure
    .input(z.object({ production_order_id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.production_invoices.findMany({
        where: {
          production_order_id: input.production_order_id,
        },
        include: {
          production_invoice_line_items: true,
          production_payments: {
            orderBy: { payment_date: 'desc' },
          },
        },
        orderBy: { invoice_date: 'asc' },
      });
    }),

  // Record payment - TRIGGERS STATUS UPDATES & ORDERED ITEMS CREATION
  recordPayment: protectedProcedure
    .input(recordPaymentSchema)
    .mutation(async ({ ctx, input }) => {
      const invoice = await ctx.db.production_invoices.findUnique({
        where: { id: input.production_invoice_id },
        include: {
          production_orders: true,
        },
      });

      if (!invoice) {
        throw new Error('Invoice not found');
      }

      // Generate payment number
      const paymentNumber = await generatePaymentNumber(ctx.db);

      // Create payment record
      const payment = await ctx.db.production_payments.create({
        data: {
          payment_number: paymentNumber,
          production_invoice_id: input.production_invoice_id,
          production_order_id: invoice.production_order_id ?? undefined,
          amount: new Prisma.Decimal(input.amount),
          payment_method: input.payment_method,
          transaction_id: input.transaction_id,
          notes: input.notes,
          status: 'completed',
          created_by: ctx.session?.user?.id,
        },
      });

      // Update invoice amounts
      const newAmountPaid = Number(invoice.amount_paid) + input.amount;
      const newAmountDue = Number(invoice.total) - newAmountPaid;

      // Determine new status
      let newStatus = invoice.status;
      if (newAmountDue <= 0) {
        newStatus = 'paid';
      } else if (newAmountPaid > 0) {
        newStatus = 'partial_payment';
      }

      const updatedInvoice = await ctx.db.production_invoices.update({
        where: { id: input.production_invoice_id },
        data: {
          amount_paid: new Prisma.Decimal(newAmountPaid),
          amount_due: new Prisma.Decimal(Math.max(0, newAmountDue)),
          status: newStatus,
          ...(newStatus === 'paid' && { paid_date: new Date() }),
        },
      });

      let message = `Payment ${paymentNumber} of $${input.amount.toFixed(2)} recorded successfully.`;
      let orderedItemsCreated = 0;

      // TRIGGER: Deposit Invoice Paid → Create Ordered Items & Start Production
      if (invoice.invoice_type === 'deposit' && newStatus === 'paid' && invoice.production_orders) {
        const order = invoice.production_orders;

        // Update PO status
        await ctx.db.production_orders.update({
          where: { id: order.id },
          data: {
            deposit_paid: true,
            status: 'in_progress',
          },
        });

        // AUTO-CREATE ORDERED ITEMS (one for each unit in the order)
        orderedItemsCreated = await createOrderedItems(ctx.db, {
          id: order.id,
          order_number: order.order_number,
          quantity: order.quantity,
        });

        message += ` Deposit paid in full. Production order ${order.order_number} status updated to "in_progress". ${orderedItemsCreated} ordered items created for tracking.`;
      }

      // TRIGGER: Final Invoice Paid → Unlock Shipping
      if (invoice.invoice_type === 'final' && newStatus === 'paid' && invoice.production_orders) {
        await ctx.db.production_orders.update({
          where: { id: invoice.production_order_id! },
          data: {
            final_payment_paid: true,
            status: 'final_paid', // Ready for shipping
          },
        });

        message += ` Final payment received. Production order ${invoice.production_orders.order_number} is now ready for shipping.`;
      }

      return {
        payment,
        invoice: updatedInvoice,
        orderedItemsCreated,
        message,
      };
    }),

  // Update invoice
  update: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        data: z.object({
          status: z.string().optional(),
          due_date: z.date().optional(),
          payment_terms: z.string().optional(),
          notes: z.string().optional(),
        }),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.production_invoices.update({
        where: { id: input.id },
        data: input.data,
      });
    }),

  // Cancel invoice
  cancel: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const invoice = await ctx.db.production_invoices.findUnique({
        where: { id: input.id },
      });

      if (!invoice) {
        throw new Error('Invoice not found');
      }

      if (Number(invoice.amount_paid) > 0) {
        throw new Error('Cannot cancel invoice with payments received. Please process a refund instead.');
      }

      return ctx.db.production_invoices.update({
        where: { id: input.id },
        data: {
          status: 'cancelled',
        },
      });
    }),

  // Get payment history for an invoice
  getPaymentHistory: protectedProcedure
    .input(z.object({ invoice_id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.production_payments.findMany({
        where: {
          production_invoice_id: input.invoice_id,
        },
        orderBy: {
          payment_date: 'desc',
        },
      });
    }),

  // Get outstanding invoices (pending or partial payment)
  getOutstanding: protectedProcedure
    .input(
      z.object({
        project_id: z.string().uuid().optional(),
        customer_id: z.string().uuid().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      return ctx.db.production_invoices.findMany({
        where: {
          status: {
            in: ['pending_payment', 'partial_payment', 'overdue'],
          },
          ...(input.project_id && { project_id: input.project_id }),
          ...(input.customer_id && { customer_id: input.customer_id }),
        },
        include: {
          production_orders: {
            select: {
              id: true,
              order_number: true,
              item_name: true,
            },
          },
          projects: {
            select: {
              id: true,
              name: true,
            },
          },
          customers: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: {
          due_date: 'asc',
        },
      });
    }),
});
