import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '../trpc/init';

/**
 * Global Search Router
 * Searches across multiple entities: customers, orders, products, contacts, leads
 */
export const globalSearchRouter = createTRPCRouter({
  /**
   * Search across all major entities
   */
  search: protectedProcedure
    .input(
      z.object({
        query: z.string().min(1),
        limit: z.number().min(1).max(20).default(10),
      })
    )
    .query(async ({ ctx, input }) => {
      const { query, limit } = input;
      const searchLower = query.toLowerCase();

      // Search in parallel across all entities
      const [customers, orders, products, contacts, leads] = await Promise.all([
        // Search customers
        ctx.db.customers.findMany({
          where: {
            OR: [
              { name: { contains: searchLower } },
              { email: { contains: searchLower } },
              { company_name: { contains: searchLower } },
            ],
          },
          take: limit,
          select: {
            id: true,
            name: true,
            email: true,
            company_name: true,
          },
        }),

        // Search orders
        ctx.db.orders.findMany({
          where: {
            OR: [
              { order_number: { contains: searchLower } },
              { notes: { contains: searchLower } },
            ],
          },
          take: limit,
        }),

        // Search products/items
        ctx.db.items.findMany({
          where: {
            OR: [
              { name: { contains: searchLower } },
              { sku_full: { contains: searchLower } },
              { description: { contains: searchLower } },
            ],
          },
          take: limit,
          select: {
            id: true,
            name: true,
            sku_full: true,
            description: true,
          },
        }),

        // Search contacts
        ctx.db.contacts.findMany({
          where: {
            OR: [
              { first_name: { contains: searchLower } },
              { last_name: { contains: searchLower } },
              { name: { contains: searchLower } },
              { email: { contains: searchLower } },
              { company: { contains: searchLower } },
            ],
          },
          take: limit,
          select: {
            id: true,
            first_name: true,
            last_name: true,
            name: true,
            email: true,
            company: true,
          },
        }),

        // Search leads
        ctx.db.leads.findMany({
          where: {
            OR: [
              { first_name: { contains: searchLower } },
              { last_name: { contains: searchLower } },
              { company: { contains: searchLower } },
              { email: { contains: searchLower } },
            ],
          },
          take: limit,
          select: {
            id: true,
            first_name: true,
            last_name: true,
            company: true,
            email: true,
            status: true,
          },
        }),
      ]);

      return {
        customers: customers.map(c => ({
          ...c,
          type: 'customer' as const,
          title: c.name || c.company_name || c.email,
          subtitle: c.company_name || c.email,
        })),
        orders: orders.map(o => ({
          ...o,
          type: 'order' as const,
          title: o.order_number || 'Unnamed Order',
          subtitle: o.status || '',
        })),
        products: products.map(p => ({
          ...p,
          type: 'product' as const,
          title: p.name,
          subtitle: p.sku_full || p.description || '',
        })),
        contacts: contacts.map(c => ({
          ...c,
          type: 'contact' as const,
          title: c.name || `${c.first_name || ''} ${c.last_name || ''}`.trim(),
          subtitle: c.company || c.email || '',
        })),
        leads: leads.map(l => ({
          ...l,
          type: 'lead' as const,
          title: `${l.first_name || ''} ${l.last_name || ''}`.trim(),
          subtitle: `${l.company || ''} - ${l.status || ''}`,
        })),
        total: customers.length + orders.length + products.length + contacts.length + leads.length,
      };
    }),
});
