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

      // Split search query into words for multi-word client-side filtering
      const searchWords = searchLower.split(/\s+/).filter(w => w.length > 0);
      const isMultiWord = searchWords.length > 1;

      // For multi-word searches, use first word for DB query, then filter client-side
      const dbSearchTerm = isMultiWord ? searchWords[0] : searchLower;

      // Helper function to check if all search words match any of the provided fields
      const matchesAllWords = (record: any, fields: string[]): boolean => {
        if (!isMultiWord) return true; // Single word already matched by DB query

        return searchWords.every(word =>
          fields.some(field => {
            const value = record[field];
            return value && String(value).toLowerCase().includes(word);
          })
        );
      };

      // Fetch more results than needed for multi-word queries (we'll filter client-side)
      const fetchLimit = isMultiWord ? limit * 5 : limit;

      // Search in parallel across all entities
      const [customersRaw, ordersRaw, productsRaw, contactsRaw, leadsRaw] = await Promise.all([
        // Search customers
        ctx.db.customers.findMany({
          where: {
            OR: [
              { name: { contains: dbSearchTerm } },
              { email: { contains: dbSearchTerm } },
              { company_name: { contains: dbSearchTerm } },
            ],
          },
          take: fetchLimit,
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
              { order_number: { contains: dbSearchTerm } },
              { notes: { contains: dbSearchTerm } },
            ],
          },
          take: fetchLimit,
        }),

        // Search products/items
        ctx.db.items.findMany({
          where: {
            OR: [
              { name: { contains: dbSearchTerm } },
              { sku_full: { contains: dbSearchTerm } },
              { description: { contains: dbSearchTerm } },
            ],
          },
          take: fetchLimit,
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
              { first_name: { contains: dbSearchTerm } },
              { last_name: { contains: dbSearchTerm } },
              { name: { contains: dbSearchTerm } },
              { email: { contains: dbSearchTerm } },
              { company: { contains: dbSearchTerm } },
            ],
          },
          take: fetchLimit,
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
              { first_name: { contains: dbSearchTerm } },
              { last_name: { contains: dbSearchTerm } },
              { company: { contains: dbSearchTerm } },
              { email: { contains: dbSearchTerm } },
            ],
          },
          take: fetchLimit,
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

      // Apply client-side multi-word filtering
      const customers = isMultiWord
        ? customersRaw.filter(c => matchesAllWords(c, ['name', 'email', 'company_name'])).slice(0, limit)
        : customersRaw;

      const orders = isMultiWord
        ? ordersRaw.filter(o => matchesAllWords(o, ['order_number', 'notes'])).slice(0, limit)
        : ordersRaw;

      const products = isMultiWord
        ? productsRaw.filter(p => matchesAllWords(p, ['name', 'sku_full', 'description'])).slice(0, limit)
        : productsRaw;

      const contacts = isMultiWord
        ? contactsRaw.filter(c => matchesAllWords(c, ['first_name', 'last_name', 'name', 'email', 'company'])).slice(0, limit)
        : contactsRaw;

      const leads = isMultiWord
        ? leadsRaw.filter(l => matchesAllWords(l, ['first_name', 'last_name', 'company', 'email'])).slice(0, limit)
        : leadsRaw;

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
