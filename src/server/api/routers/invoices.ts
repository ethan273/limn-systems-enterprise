/**
 * General Invoices tRPC Router
 *
 * Handles general accounting invoices (separate from production_invoices).
 * Invoices include line items, payment allocations, and QuickBooks integration.
 */

import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '../trpc/init';
import { TRPCError } from '@trpc/server';

export const invoicesRouter = createTRPCRouter({
  // ============================================================================
  // QUERIES
  // ============================================================================

  /**
   * Get all invoices with filters and pagination
   */
  getAll: protectedProcedure
    .input(
      z.object({
        search: z.string().optional(),
        customerId: z.string().uuid().optional(),
        orderId: z.string().uuid().optional(),
        status: z.string().optional(), // pending, paid, overdue, cancelled
        dateFrom: z.string().optional(),
        dateTo: z.string().optional(),
        limit: z.number().default(50),
        offset: z.number().default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      const where: any = {};

      // Search in invoice items descriptions
      if (input.search) {
        where.invoice_items = {
          some: {
            OR: [
              { description: { contains: input.search, mode: 'insensitive' } },
              { quickbooks_item_id: { contains: input.search, mode: 'insensitive' } },
            ],
          },
        };
      }

      // Filter by date range
      if (input.dateFrom) {
        where.created_at = {
          ...where.created_at,
          gte: new Date(input.dateFrom),
        };
      }
      if (input.dateTo) {
        where.created_at = {
          ...where.created_at,
          lte: new Date(input.dateTo),
        };
      }

      const [items, total] = await Promise.all([
        ctx.db.invoices.findMany({
          where,
          include: {
            invoice_items: {
              include: {
                items: true,
                order_items: {
                  include: {
                    orders: {
                      include: {
                        customers: {
                          select: {
                            name: true,
                            company_name: true,
                            email: true,
                          },
                        },
                        projects: {
                          select: {
                            project_name: true,
                          },
                        },
                      },
                    },
                  },
                },
              },
              orderBy: {
                sort_order: 'asc',
              },
            },
            payment_allocations: {
              include: {
                payments: {
                  select: {
                    payment_number: true,
                    payment_date: true,
                    amount: true,
                    payment_method: true,
                    status: true,
                  },
                },
              },
            },
          },
          orderBy: {
            created_at: 'desc',
          },
          take: input.limit,
          skip: input.offset,
        }),
        ctx.db.invoices.count({ where }),
      ]);

      // Calculate totals and payment status for each invoice
      const invoicesWithTotals = items.map((invoice) => {
        const subtotal = invoice.invoice_items.reduce(
          (sum: number, item: any) => sum + Number(item.line_total || 0),
          0
        );
        const totalTax = invoice.invoice_items.reduce(
          (sum: number, item: any) => sum + Number(item.tax_amount || 0),
          0
        );
        const total = subtotal + totalTax;

        const totalPaid = invoice.payment_allocations.reduce(
          (sum: number, allocation: any) => sum + Number(allocation.allocated_amount),
          0
        );

        const balance = total - totalPaid;
        const status =
          balance <= 0 ? 'paid' : totalPaid > 0 ? 'partial' : 'pending';

        // Get customer info from first invoice item
        const firstOrderItem = invoice.invoice_items[0]?.order_items;
        const customer = firstOrderItem?.orders?.customers;
        const project = firstOrderItem?.orders?.projects;

        return {
          ...invoice,
          subtotal,
          totalTax,
          total,
          totalPaid,
          balance,
          status,
          customer,
          project,
        };
      });

      return {
        items: invoicesWithTotals,
        total,
        hasMore: input.offset + input.limit < total,
        nextOffset: input.offset + input.limit < total ? input.offset + input.limit : null,
      };
    }),

  /**
   * Get single invoice by ID with full details
   */
  getById: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const invoice = await ctx.db.invoices.findUnique({
        where: { id: input.id },
        include: {
          invoice_items: {
            include: {
              items: true,
              order_items: {
                include: {
                  orders: {
                    include: {
                      customers: true,
                      projects: true,
                    },
                  },
                },
              },
            },
            orderBy: {
              sort_order: 'asc',
            },
          },
          payment_allocations: {
            include: {
              payments: true,
            },
            orderBy: {
              created_at: 'desc',
            },
          },
          quickbooks_payment_queue: true,
        },
      });

      if (!invoice) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Invoice not found',
        });
      }

      // Calculate totals
      const subtotal = invoice.invoice_items.reduce(
        (sum: number, item: any) => sum + Number(item.line_total || 0),
        0
      );
      const totalTax = invoice.invoice_items.reduce(
        (sum: number, item: any) => sum + Number(item.tax_amount || 0),
        0
      );
      const total = subtotal + totalTax;

      const totalPaid = invoice.payment_allocations.reduce(
        (sum: number, allocation: any) => sum + Number(allocation.allocated_amount),
        0
      );

      const balance = total - totalPaid;
      const status = balance <= 0 ? 'paid' : totalPaid > 0 ? 'partial' : 'pending';

      return {
        ...invoice,
        subtotal,
        totalTax,
        total,
        totalPaid,
        balance,
        status,
      };
    }),

  /**
   * Get invoices by customer
   */
  getByCustomer: protectedProcedure
    .input(z.object({ customerId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const invoices = await ctx.db.invoices.findMany({
        where: {
          invoice_items: {
            some: {
              order_items: {
                orders: {
                  customer_id: input.customerId,
                },
              },
            },
          },
        },
        include: {
          invoice_items: {
            include: {
              order_items: {
                include: {
                  orders: {
                    include: {
                      projects: true,
                    },
                  },
                },
              },
            },
          },
          payment_allocations: {
            include: {
              payments: true,
            },
          },
        },
        orderBy: {
          created_at: 'desc',
        },
      });

      // Calculate totals for each invoice
      return invoices.map((invoice) => {
        const subtotal = invoice.invoice_items.reduce(
          (sum: number, item: any) => sum + Number(item.line_total || 0),
          0
        );
        const totalTax = invoice.invoice_items.reduce(
          (sum: number, item: any) => sum + Number(item.tax_amount || 0),
          0
        );
        const total = subtotal + totalTax;

        const totalPaid = invoice.payment_allocations.reduce(
          (sum: number, allocation: any) => sum + Number(allocation.allocated_amount),
          0
        );

        const balance = total - totalPaid;
        const status = balance <= 0 ? 'paid' : totalPaid > 0 ? 'partial' : 'pending';

        return {
          ...invoice,
          subtotal,
          totalTax,
          total,
          totalPaid,
          balance,
          status,
        };
      });
    }),

  // ============================================================================
  // MUTATIONS
  // ============================================================================

  /**
   * Create new invoice with line items
   */
  create: protectedProcedure
    .input(
      z.object({
        lineItems: z.array(
          z.object({
            orderItemId: z.string().uuid().optional(),
            itemId: z.string().uuid().optional(),
            description: z.string(),
            quantity: z.number(),
            unitPrice: z.number(),
            discountPercent: z.number().default(0),
            discountAmount: z.number().default(0),
            taxRate: z.number().default(0),
            itemType: z.string().optional(),
            sortOrder: z.number().optional(),
          })
        ),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Create invoice with line items in a transaction
      const invoice = await ctx.db.invoices.create({
        data: {
          invoice_items: {
            create: input.lineItems.map((item, index) => ({
              order_item_id: item.orderItemId,
              item_id: item.itemId,
              description: item.description,
              quantity: item.quantity,
              unit_price: item.unitPrice,
              discount_percent: item.discountPercent,
              discount_amount: item.discountAmount,
              tax_rate: item.taxRate,
              tax_amount: (item.quantity * item.unitPrice - item.discountAmount) * (item.taxRate / 100),
              item_type: item.itemType,
              sort_order: item.sortOrder ?? index,
            })),
          },
        },
        include: {
          invoice_items: true,
        },
      });

      return {
        success: true,
        invoice,
        message: 'Invoice created successfully',
      };
    }),

  /**
   * Add line item to existing invoice
   */
  addLineItem: protectedProcedure
    .input(
      z.object({
        invoiceId: z.string().uuid(),
        orderItemId: z.string().uuid().optional(),
        itemId: z.string().uuid().optional(),
        description: z.string(),
        quantity: z.number(),
        unitPrice: z.number(),
        discountPercent: z.number().default(0),
        discountAmount: z.number().default(0),
        taxRate: z.number().default(0),
        itemType: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Get current max sort_order
      const maxSortOrder = await ctx.db.invoice_items.findFirst({
        where: { invoice_id: input.invoiceId },
        orderBy: { sort_order: 'desc' },
        select: { sort_order: true },
      });

      const lineItem = await ctx.db.invoice_items.create({
        data: {
          invoice_id: input.invoiceId,
          order_item_id: input.orderItemId,
          item_id: input.itemId,
          description: input.description,
          quantity: input.quantity,
          unit_price: input.unitPrice,
          discount_percent: input.discountPercent,
          discount_amount: input.discountAmount,
          tax_rate: input.taxRate,
          tax_amount: (input.quantity * input.unitPrice - input.discountAmount) * (input.taxRate / 100),
          item_type: input.itemType,
          sort_order: (maxSortOrder?.sort_order ?? 0) + 1,
        },
      });

      return {
        success: true,
        lineItem,
        message: 'Line item added successfully',
      };
    }),

  /**
   * Update line item
   */
  updateLineItem: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        description: z.string().optional(),
        quantity: z.number().optional(),
        unitPrice: z.number().optional(),
        discountPercent: z.number().optional(),
        discountAmount: z.number().optional(),
        taxRate: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...updates } = input;

      // Get current line item for calculations
      const currentItem = await ctx.db.invoice_items.findUnique({
        where: { id },
      });

      if (!currentItem) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Line item not found',
        });
      }

      const quantity = updates.quantity ?? Number(currentItem.quantity);
      const unitPrice = updates.unitPrice ?? Number(currentItem.unit_price);
      const discountAmount = updates.discountAmount ?? Number(currentItem.discount_amount);
      const taxRate = updates.taxRate ?? Number(currentItem.tax_rate);

      const updateData: any = {};
      if (updates.description !== undefined) updateData.description = updates.description;
      if (updates.quantity !== undefined) updateData.quantity = updates.quantity;
      if (updates.unitPrice !== undefined) updateData.unit_price = updates.unitPrice;
      if (updates.discountPercent !== undefined) updateData.discount_percent = updates.discountPercent;
      if (updates.discountAmount !== undefined) updateData.discount_amount = updates.discountAmount;
      if (updates.taxRate !== undefined) updateData.tax_rate = updates.taxRate;

      // Recalculate tax amount
      updateData.tax_amount = (quantity * unitPrice - discountAmount) * (taxRate / 100);

      const lineItem = await ctx.db.invoice_items.update({
        where: { id },
        data: updateData,
      });

      return {
        success: true,
        lineItem,
        message: 'Line item updated successfully',
      };
    }),

  /**
   * Delete line item
   */
  deleteLineItem: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.invoice_items.delete({
        where: { id: input.id },
      });

      return {
        success: true,
        message: 'Line item deleted successfully',
      };
    }),

  /**
   * Delete invoice (cascades to line items)
   */
  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      // Check if invoice has payments
      const invoice = await ctx.db.invoices.findUnique({
        where: { id: input.id },
        include: {
          payment_allocations: true,
        },
      });

      if (!invoice) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Invoice not found',
        });
      }

      if (invoice.payment_allocations.length > 0) {
        throw new TRPCError({
          code: 'PRECONDITION_FAILED',
          message: 'Cannot delete invoice with payments. Remove payments first.',
        });
      }

      await ctx.db.invoices.delete({
        where: { id: input.id },
      });

      return {
        success: true,
        message: 'Invoice deleted successfully',
      };
    }),

  /**
   * Get invoice statistics
   */
  getStats: protectedProcedure
    .input(
      z.object({
        customerId: z.string().uuid().optional(),
        dateFrom: z.string().optional(),
        dateTo: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const where: any = {};

      if (input.customerId) {
        where.invoice_items = {
          some: {
            order_items: {
              orders: {
                customer_id: input.customerId,
              },
            },
          },
        };
      }

      if (input.dateFrom) {
        where.created_at = {
          ...where.created_at,
          gte: new Date(input.dateFrom),
        };
      }
      if (input.dateTo) {
        where.created_at = {
          ...where.created_at,
          lte: new Date(input.dateTo),
        };
      }

      const invoices = await ctx.db.invoices.findMany({
        where,
        include: {
          invoice_items: true,
          payment_allocations: true,
        },
      });

      let totalInvoiced = 0;
      let totalPaid = 0;
      let totalOutstanding = 0;
      let countPaid = 0;
      let countPartial = 0;
      let countPending = 0;

      invoices.forEach((invoice) => {
        const total = invoice.invoice_items.reduce(
          (sum: number, item: any) => sum + Number(item.line_total || 0) + Number(item.tax_amount || 0),
          0
        );
        const paid = invoice.payment_allocations.reduce(
          (sum: number, allocation: any) => sum + Number(allocation.allocated_amount),
          0
        );
        const balance = total - paid;

        totalInvoiced += total;
        totalPaid += paid;
        totalOutstanding += balance;

        if (balance <= 0) countPaid++;
        else if (paid > 0) countPartial++;
        else countPending++;
      });

      return {
        totalInvoices: invoices.length,
        totalInvoiced: Math.round(totalInvoiced * 100) / 100,
        totalPaid: Math.round(totalPaid * 100) / 100,
        totalOutstanding: Math.round(totalOutstanding * 100) / 100,
        countPaid,
        countPartial,
        countPending,
      };
    }),
});
