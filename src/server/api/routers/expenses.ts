/**
 * Expenses tRPC Router
 *
 * Handles company expense tracking with approval workflow
 */

import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '../trpc/init';
import { TRPCError } from '@trpc/server';

export const expensesRouter = createTRPCRouter({
  // ============================================================================
  // QUERIES
  // ============================================================================

  /**
   * Get all expenses with filters and pagination
   */
  getAll: protectedProcedure
    .input(
      z.object({
        search: z.string().optional(),
        category: z.string().optional(),
        subcategory: z.string().optional(),
        approval_status: z.string().optional(), // pending, approved, rejected
        dateFrom: z.string().optional(),
        dateTo: z.string().optional(),
        limit: z.number().default(50),
        offset: z.number().default(0),
        orderBy: z.object({
          expense_date: z.enum(['asc', 'desc']).optional(),
          amount: z.enum(['asc', 'desc']).optional(),
          category: z.enum(['asc', 'desc']).optional(),
        }).optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const where: any = {};

      // Search in description, vendor, reference number
      if (input.search) {
        where.OR = [
          { description: { contains: input.search, mode: 'insensitive' } },
          { vendor: { contains: input.search, mode: 'insensitive' } },
          { reference_number: { contains: input.search, mode: 'insensitive' } },
        ];
      }

      // Filter by category
      if (input.category) {
        where.category = input.category;
      }

      // Filter by subcategory
      if (input.subcategory) {
        where.subcategory = input.subcategory;
      }

      // Filter by approval status
      if (input.approval_status) {
        where.approval_status = input.approval_status;
      }

      // Filter by date range
      if (input.dateFrom) {
        where.expense_date = {
          ...where.expense_date,
          gte: new Date(input.dateFrom),
        };
      }
      if (input.dateTo) {
        where.expense_date = {
          ...where.expense_date,
          lte: new Date(input.dateTo),
        };
      }

      const [items, total] = await Promise.all([
        ctx.db.expenses.findMany({
          where,
          orderBy: input.orderBy || { expense_date: 'desc' },
          take: input.limit,
          skip: input.offset,
        }),
        ctx.db.expenses.count({ where }),
      ]);

      return {
        items,
        total,
        hasMore: input.offset + input.limit < total,
        nextOffset: input.offset + input.limit < total ? input.offset + input.limit : null,
      };
    }),

  /**
   * Get single expense by ID
   */
  getById: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const expense = await ctx.db.expenses.findUnique({
        where: { id: input.id },
      });

      if (!expense) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Expense not found',
        });
      }

      return expense;
    }),

  /**
   * Get expense categories (distinct values)
   */
  getCategories: protectedProcedure.query(async ({ ctx }) => {
    const expenses = await ctx.db.expenses.findMany({
      select: { category: true },
      orderBy: { category: 'asc' },
    });

    // Get unique categories
    const uniqueCategories = [...new Set(expenses.map(e => e.category).filter(Boolean))];
    return uniqueCategories;
  }),

  /**
   * Get expense subcategories for a category
   */
  getSubcategories: protectedProcedure
    .input(z.object({ category: z.string() }))
    .query(async ({ ctx, input }) => {
      const expenses = await ctx.db.expenses.findMany({
        where: { category: input.category },
        select: { subcategory: true },
        orderBy: { subcategory: 'asc' },
      });

      // Get unique subcategories
      const uniqueSubcategories = [...new Set(expenses.map(e => e.subcategory).filter(Boolean))];
      return uniqueSubcategories;
    }),

  /**
   * Get expense statistics
   */
  getStats: protectedProcedure
    .input(
      z.object({
        category: z.string().optional(),
        dateFrom: z.string().optional(),
        dateTo: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const where: any = {};

      if (input.category) {
        where.category = input.category;
      }

      if (input.dateFrom) {
        where.expense_date = {
          ...where.expense_date,
          gte: new Date(input.dateFrom),
        };
      }
      if (input.dateTo) {
        where.expense_date = {
          ...where.expense_date,
          lte: new Date(input.dateTo),
        };
      }

      const expenses = await ctx.db.expenses.findMany({ where });

      const totalExpenses = expenses.length;
      const totalAmount = expenses.reduce((sum, exp) => sum + Number(exp.amount), 0);
      const avgExpense = totalExpenses > 0 ? totalAmount / totalExpenses : 0;

      const byStatus = expenses.reduce((acc: Record<string, { count: number; total: number }>, exp) => {
        const status = exp.approval_status || 'pending';
        // eslint-disable-next-line security/detect-object-injection
        if (!acc[status]) {
          // eslint-disable-next-line security/detect-object-injection
          acc[status] = { count: 0, total: 0 };
        }
        // eslint-disable-next-line security/detect-object-injection
        acc[status]!.count++;
        // eslint-disable-next-line security/detect-object-injection
        acc[status]!.total += Number(exp.amount);
        return acc;
      }, {} as Record<string, { count: number; total: number }>);

      const byCategory = expenses.reduce((acc: Record<string, { count: number; total: number }>, exp) => {
        const cat = exp.category || 'uncategorized';
        // eslint-disable-next-line security/detect-object-injection
        if (!acc[cat]) {
          // eslint-disable-next-line security/detect-object-injection
          acc[cat] = { count: 0, total: 0 };
        }
        // eslint-disable-next-line security/detect-object-injection
        acc[cat]!.count++;
        // eslint-disable-next-line security/detect-object-injection
        acc[cat]!.total += Number(exp.amount);
        return acc;
      }, {} as Record<string, { count: number; total: number }>);

      return {
        totalExpenses,
        totalAmount: Math.round(totalAmount * 100) / 100,
        avgExpense: Math.round(avgExpense * 100) / 100,
        byStatus,
        byCategory,
      };
    }),

  // ============================================================================
  // MUTATIONS
  // ============================================================================

  /**
   * Create new expense
   */
  create: protectedProcedure
    .input(
      z.object({
        category: z.string(),
        subcategory: z.string().optional(),
        amount: z.number().positive(),
        description: z.string().optional(),
        vendor: z.string().optional(),
        payment_method: z.string().optional(),
        reference_number: z.string().optional(),
        expense_date: z.string(), // ISO date string
      })
    )
    .mutation(async ({ ctx, input }) => {
      const expense = await ctx.db.expenses.create({
        data: {
          category: input.category,
          subcategory: input.subcategory,
          amount: input.amount,
          description: input.description,
          vendor: input.vendor,
          payment_method: input.payment_method,
          reference_number: input.reference_number,
          expense_date: new Date(input.expense_date),
          created_by: ctx.user?.id,
          approval_status: 'pending',
        },
      });

      return {
        success: true,
        expense,
        message: 'Expense created successfully',
      };
    }),

  /**
   * Update expense
   */
  update: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        category: z.string().optional(),
        subcategory: z.string().optional(),
        amount: z.number().positive().optional(),
        description: z.string().optional(),
        vendor: z.string().optional(),
        payment_method: z.string().optional(),
        reference_number: z.string().optional(),
        expense_date: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...updates } = input;

      const updateData: any = { ...updates };
      if (updates.expense_date) {
        updateData.expense_date = new Date(updates.expense_date);
      }
      updateData.updated_at = new Date();

      const expense = await ctx.db.expenses.update({
        where: { id },
        data: updateData,
      });

      return {
        success: true,
        expense,
        message: 'Expense updated successfully',
      };
    }),

  /**
   * Delete expense
   */
  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.expenses.delete({
        where: { id: input.id },
      });

      return {
        success: true,
        message: 'Expense deleted successfully',
      };
    }),

  /**
   * Update approval status
   */
  updateApprovalStatus: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        approval_status: z.enum(['pending', 'approved', 'rejected']),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const expense = await ctx.db.expenses.update({
        where: { id: input.id },
        data: {
          approval_status: input.approval_status,
          approved_by: input.approval_status === 'approved' ? ctx.user?.id : null,
          updated_at: new Date(),
        },
      });

      return {
        success: true,
        expense,
        message: `Expense ${input.approval_status}`,
      };
    }),
});
