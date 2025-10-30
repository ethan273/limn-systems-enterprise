import { log } from '@/lib/logger';
import { z } from 'zod';
import { createTRPCRouter, publicProcedure } from '../trpc/init';
import { Prisma, PrismaClient } from '@prisma/client';
import { quickbooksClient } from '@/lib/quickbooks/client';

// Direct Prisma instance for raw SQL (advisory locks)
// @allow-direct-prisma - Required for PostgreSQL advisory locks in payment number generation
const prisma = new PrismaClient();

// ============================================================================
// HELPER FUNCTIONS - Shipping
// ============================================================================

/**
 * Calculate shipping cost based on order total and production order details
 * This is a basic implementation that can be enhanced with:
 * - Actual shipping carrier rates
 * - Weight/dimensions from production order
 * - Destination address from customer
 * - Shipping method selection
 */
function calculateShippingCost(orderTotal: number, _productionOrderId: string): number {
  // Basic tier-based shipping calculation
  // TODO: Replace with actual shipping carrier API integration

  if (orderTotal >= 10000) {
    // Free shipping for orders over $10,000
    return 0;
  } else if (orderTotal >= 5000) {
    // Flat rate for medium orders
    return 250;
  } else if (orderTotal >= 1000) {
    // Percentage-based for smaller orders
    return orderTotal * 0.05; // 5% of order total
  } else {
    // Minimum shipping fee
    return 100;
  }
}

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
 * Generates a unique payment number with PostgreSQL advisory lock
 * Format: PAY-YYYY-XXXX
 *
 * Uses PostgreSQL advisory lock to prevent race conditions.
 * The lock ensures only one transaction can generate a number at a time.
 */
async function generatePaymentNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `PAY-${year}-`;

  // Use advisory lock to make this operation atomic
  // Lock ID: 2147483645 - year (unique for payments by year)
  const lockId = 2147483645 - year;

  try {
    // Acquire advisory lock (blocks until available)
    await prisma.$executeRaw`SELECT pg_advisory_lock(${lockId})`;

    // Find the highest existing number for this year
    const existingPayments = await prisma.production_payments.findMany({
      where: {
        payment_number: {
          startsWith: prefix,
        },
      },
      select: {
        payment_number: true,
      },
      orderBy: {
        payment_number: 'desc',
      },
      take: 1,
    });

    let nextNumber = 1;
    if (existingPayments.length > 0) {
      const lastPaymentNumber = existingPayments[0].payment_number;
      // Extract the numeric part (e.g., "PAY-2025-0004" -> "0004" -> 4)
      const lastNumber = parseInt(lastPaymentNumber.slice(prefix.length), 10);
      nextNumber = lastNumber + 1;
    }

    return `${prefix}${String(nextNumber).padStart(4, '0')}`;
  } finally {
    // Always release the lock, even if an error occurred
    await prisma.$executeRaw`SELECT pg_advisory_unlock(${lockId})`;
  }
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
  const items: any[] = [];

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

/**
 * Attempt to sync invoice and payment to QuickBooks (non-blocking)
 * If QuickBooks is not connected or sync fails, we log it but don't throw an error
 */
async function attemptQuickBooksSync(
  db: any,
  sessionUserId: string | undefined,
  invoiceId: string,
  paymentId?: string
) {
  try {
    // Check if QuickBooks is connected
    // Note: findFirst not supported by wrapper, using findMany
    const auth = (await db.quickbooks_auth.findMany({
      where: { is_active: true },
      orderBy: { created_at: 'desc' },
      take: 1,
    }))[0];

    if (!auth) {
      log.info('QuickBooks not connected - skipping sync');
      return;
    }

    // Set tokens
    quickbooksClient.setTokens({
      access_token: auth.access_token,
      refresh_token: auth.refresh_token,
      token_expiry: new Date(auth.token_expiry),
      refresh_token_expiry: new Date(auth.refresh_token_expiry),
      realm_id: auth.company_id,
    });

    // Sync invoice first (if not already synced)
    // Note: findFirst not supported by wrapper, using findMany
    const invoiceMapping = (await db.quickbooks_entity_mapping.findMany({
      where: {
        entity_type: 'invoice',
        limn_id: invoiceId,
      },
      take: 1,
    }))[0];

    if (!invoiceMapping) {
      log.info(`Attempting to sync invoice ${invoiceId} to QuickBooks...`);
      // Note: We would need to implement the full sync logic here
      // For now, we just log that it should be synced
      log.info('Invoice sync should be triggered via QuickBooks sync button in UI');
    }

    // Sync payment (if provided and not already synced)
    if (paymentId) {
      // Note: findFirst not supported by wrapper, using findMany
      const paymentMapping = (await db.quickbooks_entity_mapping.findMany({
        where: {
          entity_type: 'payment',
          limn_id: paymentId,
        },
        take: 1,
      }))[0];

      if (!paymentMapping) {
        log.info(`Attempting to sync payment ${paymentId} to QuickBooks...`);
        // Note: We would need to implement the full sync logic here
        // For now, we just log that it should be synced
        log.info('Payment sync should be triggered via QuickBooks sync button in UI');
      }
    }

  } catch (error) {
    log.error('QuickBooks sync attempt failed (non-blocking):', { error });
    // Don't throw - this is non-blocking
  }
}

// ============================================================================
// ROUTER
// ============================================================================

export const productionInvoicesRouter = createTRPCRouter({

  // Get all invoices with filters
  getAll: publicProcedure
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
        take: input.limit,
        skip: input.offset,
        orderBy: { invoice_date: 'desc' },
      });

      return {
        items,
        total: items.length,
        hasMore: items.length === input.limit,
      };
    }),

  // Get single invoice by ID
  getById: publicProcedure
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
  getByProductionOrder: publicProcedure
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
  recordPayment: publicProcedure
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
      const paymentNumber = await generatePaymentNumber();

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

      // Attempt to sync to QuickBooks (non-blocking)
      void attemptQuickBooksSync(
        ctx.db,
        ctx.session?.user?.id,
        input.production_invoice_id,
        payment.id
      );

      return {
        payment,
        invoice: updatedInvoice,
        orderedItemsCreated,
        message,
      };
    }),

  // Update invoice
  update: publicProcedure
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
  cancel: publicProcedure
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
  getPaymentHistory: publicProcedure
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
  getOutstanding: publicProcedure
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

  // Create invoice for CRM order (covers all production orders in that order)
  createForOrder: publicProcedure
    .input(z.object({
      order_id: z.string().uuid(),
      invoice_type: z.enum(['deposit', 'final']).default('deposit'),
    }))
    .mutation(async ({ ctx, input }) => {
      // Find all production orders for this CRM order
      const productionOrders = await ctx.db.production_orders.findMany({
        where: { order_id: input.order_id },
        include: {
          projects: {
            include: {
              customers: true,
            },
          },
        },
      });

      if (productionOrders.length === 0) {
        throw new Error('No production orders found for this order');
      }

      // Calculate total cost from all production orders
      const totalCost = productionOrders.reduce((sum: number, po) => sum + Number(po.total_cost), 0);

      // Get project and customer info from first production order
      const firstPO = productionOrders[0];
      const project = firstPO?.projects;
      const customer = project?.customers;

      // Calculate amounts based on invoice type
      const subtotal = input.invoice_type === 'deposit' ? totalCost * 0.5 : totalCost * 0.5;

      // Calculate shipping for final invoice
      // Deposit invoices don't include shipping (paid on final)
      const shipping = input.invoice_type === 'final' ? calculateShippingCost(totalCost, input.order_id) : 0;

      const total = subtotal + shipping;

      // Generate invoice number
      const year = new Date().getFullYear();
      const count = await ctx.db.production_invoices.count({
        where: {
          invoice_number: {
            startsWith: `INV-${year}-`,
          },
        },
      });
      const invoiceNumber = `INV-${year}-${String(count + 1).padStart(4, '0')}`;

      // Create invoice
      const invoice = await ctx.db.production_invoices.create({
        data: {
          invoice_number: invoiceNumber,
          invoice_type: input.invoice_type,
          order_id: input.order_id,
          project_id: firstPO?.project_id,
          customer_id: customer?.id,
          subtotal: new Prisma.Decimal(subtotal),
          tax: new Prisma.Decimal(0),
          shipping: new Prisma.Decimal(shipping),
          total: new Prisma.Decimal(total),
          amount_paid: new Prisma.Decimal(0),
          amount_due: new Prisma.Decimal(total),
          payment_terms: input.invoice_type === 'deposit'
            ? '50% deposit due on PO creation'
            : '50% balance + shipping due at FOB',
          status: 'pending_payment',
        },
      });

      // Create line items for each production order
      const lineItems = await Promise.all(
        productionOrders.map((po, index) => {
          const itemAmount = input.invoice_type === 'deposit'
            ? Number(po.total_cost) * 0.5
            : Number(po.total_cost) * 0.5;

          return ctx.db.production_invoice_line_items.create({
            data: {
              production_invoice_id: invoice.id,
              line_number: index + 1,
              description: `${po.item_name} (${po.product_type})`,
              quantity: po.quantity,
              unit_price: new Prisma.Decimal(po.unit_price),
              subtotal: new Prisma.Decimal(itemAmount),
              tax: new Prisma.Decimal(0),
              total: new Prisma.Decimal(itemAmount),
              metadata: {
                production_order_id: po.id,
                production_order_number: po.order_number,
              },
            },
          });
        })
      );

      return {
        invoice,
        lineItems,
        message: `Invoice ${invoiceNumber} created for order with ${productionOrders.length} items. Total: $${total.toFixed(2)}`,
      };
    }),
});
