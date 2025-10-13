/**
 * Payments tRPC Router
 *
 * Handles all payments including payment allocations to invoices.
 * Integrates with QuickBooks and payment processors.
 */

import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '../trpc/init';
import { TRPCError } from '@trpc/server';

export const paymentsRouter = createTRPCRouter({
  // ============================================================================
  // QUERIES
  // ============================================================================

  /**
   * Get all payments with filters and pagination
   */
  getAll: protectedProcedure
    .input(
      z.object({
        customerId: z.string().uuid().optional(),
        invoiceId: z.string().uuid().optional(),
        status: z.string().optional(), // pending, completed, failed, refunded
        paymentMethod: z.string().optional(),
        search: z.string().optional(), // Search by payment_number, reference_number, processor_transaction_id
        dateFrom: z.string().optional(),
        dateTo: z.string().optional(),
        limit: z.number().default(50),
        offset: z.number().default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      const where: any = {};

      if (input.customerId) {
        where.customer_id = input.customerId;
      }

      if (input.invoiceId) {
        where.invoice_id = input.invoiceId;
      }

      if (input.status) {
        where.status = input.status;
      }

      if (input.paymentMethod) {
        where.payment_method = input.paymentMethod;
      }

      if (input.search) {
        where.OR = [
          { payment_number: { contains: input.search, mode: 'insensitive' } },
          { reference_number: { contains: input.search, mode: 'insensitive' } },
          { processor_transaction_id: { contains: input.search, mode: 'insensitive' } },
        ];
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

      const [items, total] = await Promise.all([
        ctx.db.payments.findMany({
          where,
          include: {
            customers: {
              select: {
                name: true,
                company_name: true,
                email: true,
              },
            },
            payment_allocations: {
              include: {
                invoices: {
                  include: {
                    invoice_items: {
                      select: {
                        description: true,
                        line_total: true,
                      },
                    },
                  },
                },
              },
            },
            quickbooks_payment_reconciliation: {
              select: {
                reconciliation_status: true,
                reconciliation_date: true,
              },
            },
          },
          orderBy: {
            created_at: 'desc',
          },
          take: input.limit,
          skip: input.offset,
        }),
        ctx.db.payments.count({ where }),
      ]);

      // Defensive check: ensure items is an array
      if (!items || !Array.isArray(items)) {
        return {
          items: [],
          total: 0,
          hasMore: false,
          nextOffset: null,
        };
      }

      // Calculate allocated vs unallocated amounts
      const paymentsWithAllocations = items.map((payment) => {
        // Defensive check: ensure payment object exists
        if (!payment) {
          return {
            totalAllocated: 0,
            unallocated: 0,
          };
        }

        const totalAllocated = (payment.payment_allocations || []).reduce(
          (sum: number, allocation: any) => sum + Number(allocation?.allocated_amount || 0),
          0
        );
        const paymentAmount = Number(payment.amount || 0);
        const unallocated = paymentAmount - totalAllocated;

        return {
          ...payment,
          totalAllocated,
          unallocated,
        };
      });

      return {
        items: paymentsWithAllocations,
        total,
        hasMore: input.offset + input.limit < total,
        nextOffset: input.offset + input.limit < total ? input.offset + input.limit : null,
      };
    }),

  /**
   * Get single payment by ID with full details
   */
  getById: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const payment = await ctx.db.payments.findUnique({
        where: { id: input.id },
        include: {
          customers: true,
          payment_allocations: {
            include: {
              invoices: {
                include: {
                  invoice_items: true,
                },
              },
            },
          },
          quickbooks_payment_reconciliation: true,
          quickbooks_recurring_payments: true,
        },
      });

      if (!payment) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Payment not found',
        });
      }

      const totalAllocated = (payment.payment_allocations || []).reduce(
        (sum: number, allocation: any) => sum + Number(allocation.allocated_amount),
        0
      );
      const paymentAmount = Number(payment.amount || 0);
      const unallocated = paymentAmount - totalAllocated;

      return {
        ...payment,
        totalAllocated,
        unallocated,
      };
    }),

  /**
   * Get payments by customer
   */
  getByCustomer: protectedProcedure
    .input(z.object({ customerId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const payments = await ctx.db.payments.findMany({
        where: {
          customer_id: input.customerId,
        },
        include: {
          payment_allocations: {
            include: {
              invoices: {
                include: {
                  invoice_items: {
                    select: {
                      description: true,
                      line_total: true,
                    },
                  },
                },
              },
            },
          },
        },
        orderBy: {
          created_at: 'desc',
        },
      });

      // Defensive check: ensure payments is an array
      if (!payments || !Array.isArray(payments)) {
        return [];
      }

      return payments.map((payment) => {
        // Defensive check: ensure payment object exists
        if (!payment) {
          return {
            totalAllocated: 0,
            unallocated: 0,
          };
        }

        const totalAllocated = (payment.payment_allocations || []).reduce(
          (sum: number, allocation: any) => sum + Number(allocation?.allocated_amount || 0),
          0
        );
        const paymentAmount = Number(payment.amount || 0);
        const unallocated = paymentAmount - totalAllocated;

        return {
          ...payment,
          totalAllocated,
          unallocated,
        };
      });
    }),

  /**
   * Get unallocated payments (payments with remaining balance)
   */
  getUnallocated: protectedProcedure
    .input(
      z.object({
        customerId: z.string().uuid().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const where: any = {
        status: 'completed', // Only completed payments can be allocated
      };

      if (input.customerId) {
        where.customer_id = input.customerId;
      }

      const payments = await ctx.db.payments.findMany({
        where,
        include: {
          customers: {
            select: {
              name: true,
              company_name: true,
            },
          },
          payment_allocations: true,
        },
        orderBy: {
          created_at: 'desc',
        },
      });

      // Defensive check: ensure payments is an array
      if (!payments || !Array.isArray(payments)) {
        return [];
      }

      // Filter to only payments with unallocated amounts
      const unallocatedPayments = payments
        .map((payment) => {
          // Defensive check: ensure payment object exists
          if (!payment) {
            return {
              totalAllocated: 0,
              unallocated: 0,
            };
          }

          const totalAllocated = (payment.payment_allocations || []).reduce(
            (sum: number, allocation: any) => sum + Number(allocation?.allocated_amount || 0),
            0
          );
          const paymentAmount = Number(payment.amount || 0);
          const unallocated = paymentAmount - totalAllocated;

          return {
            ...payment,
            totalAllocated,
            unallocated,
          };
        })
        .filter((payment) => payment && payment.unallocated > 0);

      return unallocatedPayments;
    }),

  // ============================================================================
  // MUTATIONS
  // ============================================================================

  /**
   * Create new payment
   */
  create: protectedProcedure
    .input(
      z.object({
        customerId: z.string().uuid(),
        amount: z.number(),
        paymentMethod: z.string(),
        paymentType: z.string().optional(),
        paymentDate: z.string().optional(),
        referenceNumber: z.string().optional(),
        processorTransactionId: z.string().optional(),
        processingFee: z.string().optional(),
        currency: z.string().default('USD'),
        notes: z.string().optional(),
        status: z.string().default('completed'),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Generate payment number
      const lastPayment = await ctx.db.payments.findFirst({
        orderBy: {
          created_at: 'desc',
        },
        select: {
          payment_number: true,
        },
      });

      let paymentNumber = 'PAY-00001';
      if (lastPayment?.payment_number) {
        const lastNumber = parseInt(lastPayment.payment_number.split('-')[1] || '0');
        paymentNumber = `PAY-${String(lastNumber + 1).padStart(5, '0')}`;
      }

      const netAmount = input.processingFee
        ? input.amount - parseFloat(input.processingFee)
        : input.amount;

      const payment = await ctx.db.payments.create({
        data: {
          payment_number: paymentNumber,
          customer_id: input.customerId,
          amount: input.amount,
          net_amount: netAmount,
          payment_method: input.paymentMethod,
          payment_type: input.paymentType,
          payment_date: input.paymentDate,
          reference_number: input.referenceNumber,
          processor_transaction_id: input.processorTransactionId,
          processing_fee: input.processingFee,
          currency: input.currency,
          notes: input.notes,
          status: input.status,
          created_by: ctx.user?.id,
        },
        include: {
          customers: true,
        },
      });

      return {
        success: true,
        payment,
        message: `Payment ${paymentNumber} created successfully`,
      };
    }),

  /**
   * Record payment (alias for create with auto-allocation)
   */
  recordPayment: protectedProcedure
    .input(
      z.object({
        invoiceId: z.string().uuid(),
        paymentAmount: z.number(),
        paymentMethod: z.string().optional().default('cash'),
        paymentDate: z.string().optional(),
        referenceNumber: z.string().optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Get invoice to find customer
      const invoice = await ctx.db.invoices.findUnique({
        where: { id: input.invoiceId },
        include: {
          invoice_items: true,
        },
      });

      if (!invoice) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Invoice not found',
        });
      }

      // Generate payment number
      const lastPayment = await ctx.db.payments.findFirst({
        orderBy: {
          created_at: 'desc',
        },
        select: {
          payment_number: true,
        },
      });

      let paymentNumber = 'PAY-00001';
      if (lastPayment?.payment_number) {
        const lastNumber = parseInt(lastPayment.payment_number.split('-')[1] || '0');
        paymentNumber = `PAY-${String(lastNumber + 1).padStart(5, '0')}`;
      }

      // Create payment and allocation in transaction
      const result = await ctx.db.$transaction(async (tx) => {
        const payment = await tx.payments.create({
          data: {
            payment_number: paymentNumber,
            customer_id: invoice.customer_id,
            amount: input.paymentAmount,
            net_amount: input.paymentAmount,
            payment_method: input.paymentMethod,
            payment_date: input.paymentDate,
            reference_number: input.referenceNumber,
            currency: 'USD',
            notes: input.notes,
            status: 'completed',
            created_by: ctx.user?.id,
          },
        });

        // Auto-allocate to invoice
        const allocation = await tx.payment_allocations.create({
          data: {
            payment_id: payment.id,
            invoice_id: input.invoiceId,
            allocated_amount: input.paymentAmount,
          },
        });

        return { payment, allocation };
      });

      return {
        success: true,
        payment: result.payment,
        allocation: result.allocation,
        message: `Payment ${paymentNumber} recorded and allocated successfully`,
      };
    }),

  /**
   * Allocate payment to invoice
   */
  allocateToInvoice: protectedProcedure
    .input(
      z.object({
        paymentId: z.string().uuid(),
        invoiceId: z.string().uuid(),
        amount: z.number(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Verify payment exists and has enough unallocated funds
      const payment = await ctx.db.payments.findUnique({
        where: { id: input.paymentId },
        include: {
          payment_allocations: true,
        },
      });

      if (!payment) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Payment not found',
        });
      }

      const totalAllocated = (payment.payment_allocations || []).reduce(
        (sum: number, allocation: any) => sum + Number(allocation.allocated_amount),
        0
      );
      const unallocated = Number(payment.amount || 0) - totalAllocated;

      if (input.amount > unallocated) {
        throw new TRPCError({
          code: 'PRECONDITION_FAILED',
          message: `Cannot allocate $${input.amount}. Only $${unallocated} available.`,
        });
      }

      // Verify invoice exists
      const invoice = await ctx.db.invoices.findUnique({
        where: { id: input.invoiceId },
        include: {
          invoice_items: true,
          payment_allocations: true,
        },
      });

      if (!invoice) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Invoice not found',
        });
      }

      // Calculate invoice balance
      const invoiceTotal = (invoice.invoice_items || []).reduce(
        (sum: number, item: any) => sum + Number(item.line_total || 0) + Number(item.tax_amount || 0),
        0
      );
      const invoicePaid = (invoice.payment_allocations || []).reduce(
        (sum: number, allocation: any) => sum + Number(allocation.allocated_amount),
        0
      );
      const invoiceBalance = invoiceTotal - invoicePaid;

      if (input.amount > invoiceBalance) {
        throw new TRPCError({
          code: 'PRECONDITION_FAILED',
          message: `Cannot allocate $${input.amount}. Invoice balance is only $${invoiceBalance}.`,
        });
      }

      // Create allocation
      const allocation = await ctx.db.payment_allocations.create({
        data: {
          payment_id: input.paymentId,
          invoice_id: input.invoiceId,
          allocated_amount: input.amount,
        },
        include: {
          payments: true,
          invoices: true,
        },
      });

      return {
        success: true,
        allocation,
        message: `Allocated $${input.amount} to invoice`,
      };
    }),

  /**
   * Remove allocation
   */
  removeAllocation: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.payment_allocations.delete({
        where: { id: input.id },
      });

      return {
        success: true,
        message: 'Allocation removed successfully',
      };
    }),

  /**
   * Update payment
   */
  update: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        amount: z.number().optional(),
        paymentMethod: z.string().optional(),
        paymentType: z.string().optional(),
        paymentDate: z.string().optional(),
        referenceNumber: z.string().optional(),
        processorTransactionId: z.string().optional(),
        processingFee: z.string().optional(),
        status: z.string().optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...updates } = input;

      // If amount is being updated, check that it doesn't go below allocated amount
      if (updates.amount !== undefined) {
        const payment = await ctx.db.payments.findUnique({
          where: { id },
          include: {
            payment_allocations: true,
          },
        });

        if (!payment) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Payment not found',
          });
        }

        const totalAllocated = (payment.payment_allocations || []).reduce(
          (sum: number, allocation: any) => sum + Number(allocation.allocated_amount),
          0
        );

        if (updates.amount < totalAllocated) {
          throw new TRPCError({
            code: 'PRECONDITION_FAILED',
            message: `Cannot reduce payment amount below $${totalAllocated} (allocated amount)`,
          });
        }
      }

      const updateData: any = {};
      if (updates.amount !== undefined) updateData.amount = updates.amount;
      if (updates.paymentMethod !== undefined) updateData.payment_method = updates.paymentMethod;
      if (updates.paymentType !== undefined) updateData.payment_type = updates.paymentType;
      if (updates.paymentDate !== undefined) updateData.payment_date = updates.paymentDate;
      if (updates.referenceNumber !== undefined) updateData.reference_number = updates.referenceNumber;
      if (updates.processorTransactionId !== undefined)
        updateData.processor_transaction_id = updates.processorTransactionId;
      if (updates.processingFee !== undefined) updateData.processing_fee = updates.processingFee;
      if (updates.status !== undefined) updateData.status = updates.status;
      if (updates.notes !== undefined) updateData.notes = updates.notes;

      // Recalculate net_amount if amount or processing_fee changed
      if (updates.amount !== undefined || updates.processingFee !== undefined) {
        const currentPayment = await ctx.db.payments.findUnique({
          where: { id },
        });
        const amount = updates.amount ?? Number(currentPayment?.amount || 0);
        const fee = updates.processingFee ?? currentPayment?.processing_fee;
        updateData.net_amount = fee ? amount - parseFloat(fee) : amount;
      }

      const payment = await ctx.db.payments.update({
        where: { id },
        data: updateData,
        include: {
          customers: true,
          payment_allocations: true,
        },
      });

      return {
        success: true,
        payment,
        message: 'Payment updated successfully',
      };
    }),

  /**
   * Delete payment (only if no allocations)
   */
  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const payment = await ctx.db.payments.findUnique({
        where: { id: input.id },
        include: {
          payment_allocations: true,
        },
      });

      if (!payment) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Payment not found',
        });
      }

      if (payment.payment_allocations.length > 0) {
        throw new TRPCError({
          code: 'PRECONDITION_FAILED',
          message: 'Cannot delete payment with allocations. Remove allocations first.',
        });
      }

      await ctx.db.payments.delete({
        where: { id: input.id },
      });

      return {
        success: true,
        message: 'Payment deleted successfully',
      };
    }),

  /**
   * Get payment statistics
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
        where.customer_id = input.customerId;
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

      const payments = await ctx.db.payments.findMany({
        where,
        include: {
          payment_allocations: true,
        },
      });

      // Defensive check: ensure payments is an array
      if (!payments || !Array.isArray(payments)) {
        return {
          totalPayments: 0,
          totalReceived: 0,
          totalAllocated: 0,
          totalUnallocated: 0,
          countCompleted: 0,
          countPending: 0,
          countFailed: 0,
          byMethod: {},
        };
      }

      let totalReceived = 0;
      let totalAllocated = 0;
      let totalUnallocated = 0;
      let countCompleted = 0;
      let countPending = 0;
      let countFailed = 0;

      // Use Map to avoid object injection security warning
      const methodTotalsMap = new Map<string, number>();

      payments.forEach((payment) => {
        // Defensive check: ensure payment object exists
        if (!payment) return;

        const amount = Number(payment.amount || 0);
        const allocated = (payment.payment_allocations || []).reduce(
          (sum: number, allocation: any) => sum + Number(allocation?.allocated_amount || 0),
          0
        );

        totalReceived += amount;
        totalAllocated += allocated;
        totalUnallocated += amount - allocated;

        if (payment.status === 'completed') countCompleted++;
        else if (payment.status === 'pending') countPending++;
        else if (payment.status === 'failed') countFailed++;

        const method = payment.payment_method || 'Unknown';
        const currentTotal = methodTotalsMap.get(method) || 0;
        methodTotalsMap.set(method, currentTotal + amount);
      });

      // Convert Map to Record for response
      const methodTotals: Record<string, number> = {};
      methodTotalsMap.forEach((value, key) => {
        // eslint-disable-next-line security/detect-object-injection
        methodTotals[key] = value;
      });

      return {
        totalPayments: payments.length,
        totalReceived: Math.round(totalReceived * 100) / 100,
        totalAllocated: Math.round(totalAllocated * 100) / 100,
        totalUnallocated: Math.round(totalUnallocated * 100) / 100,
        countCompleted,
        countPending,
        countFailed,
        byMethod: methodTotals,
      };
    }),

  // ============================================================================
  // MUTATIONS
  // ============================================================================

  /**
   * Update payment status
   */
  updateStatus: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        status: z.enum(['pending', 'processed', 'failed', 'refunded']),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const updatedPayment = await ctx.db.payments.update({
        where: { id: input.id },
        data: { status: input.status },
      });

      return {
        success: true,
        payment: updatedPayment,
        message: `Payment status updated to ${input.status}`,
      };
    }),
});
