import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '../trpc/init';
import { TRPCError } from '@trpc/server';

export const invoiceItemsRouter = createTRPCRouter({
  getById: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const item = await ctx.db.invoice_items.findUnique({
        where: { id: input.id },
        include: { invoices: true },
      });
      if (!item) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Invoice item not found' });
      }
      return item;
    }),

  getAll: protectedProcedure
    .input(z.object({
        limit: z.number().min(1).max(100).default(50),
        cursor: z.string().uuid().optional(),
        invoice_id: z.string().uuid().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { limit, cursor, invoice_id } = input;
      const where: any = {};
      if (invoice_id) where.invoice_id = invoice_id;

      const items = await ctx.db.invoice_items.findMany({
        where,
        take: limit + 1,
        cursor: cursor ? { id: cursor } : undefined,
        orderBy: { created_at: 'desc' },
      });

      let nextCursor: string | undefined;
      if (items.length > limit) {
        const nextItem = items.pop();
        nextCursor = nextItem?.id;
      }
      return { items, nextCursor };
    }),

  getByInvoice: protectedProcedure
    .input(z.object({ invoice_id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      return await ctx.db.invoice_items.findMany({
        where: { invoice_id: input.invoice_id },
        orderBy: { line_number: 'asc' },
      });
    }),

  create: protectedProcedure
    .input(z.object({
        invoice_id: z.string().uuid(),
        line_number: z.number().int().positive(),
        description: z.string(),
        quantity: z.number().positive(),
        unit_price: z.number().positive(),
        tax_amount: z.number().optional(),
        discount_amount: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const total_price = input.quantity * input.unit_price - (input.discount_amount || 0) + (input.tax_amount || 0);
      return await ctx.db.invoice_items.create({
        data: { ...input, total_price },
      });
    }),

  update: protectedProcedure
    .input(z.object({
        id: z.string().uuid(),
        description: z.string().optional(),
        quantity: z.number().positive().optional(),
        unit_price: z.number().positive().optional(),
        tax_amount: z.number().optional(),
        discount_amount: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...updateData } = input;
      const current = await ctx.db.invoice_items.findUnique({ where: { id } });
      if (!current) throw new TRPCError({ code: 'NOT_FOUND' });
      
      const quantity = updateData.quantity ?? Number(current.quantity);
      const unit_price = updateData.unit_price ?? Number(current.unit_price);
      const tax_amount = updateData.tax_amount ?? Number(current.tax_amount || 0);
      const discount_amount = updateData.discount_amount ?? Number(current.discount_amount || 0);
      const total_price = quantity * unit_price - discount_amount + tax_amount;

      return await ctx.db.invoice_items.update({
        where: { id },
        data: { ...updateData, total_price },
      });
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.invoice_items.delete({ where: { id: input.id } });
      return { success: true };
    }),

  getStats: protectedProcedure.query(async ({ ctx }) => {
    const total = await ctx.db.invoice_items.count();
    const totalRevenue = await ctx.db.invoice_items.aggregate({
      _sum: { total_price: true },
    });
    return { total, totalRevenue: totalRevenue._sum.total_price || 0 };
  }),
});
