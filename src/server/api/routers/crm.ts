import { z } from 'zod';
import { createCrudRouter } from '../utils/crud-generator';
import { createTRPCRouter, publicProcedure } from '../trpc/init';

// Contacts Schema (updated to match database schema)
const createContactSchema = z.object({
  name: z.string().min(1),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  company: z.string().optional(),
  position: z.string().optional(),
  notes: z.string().optional(),
  tags: z.array(z.string()).default([]),
  created_by: z.string().uuid().optional(),
  // Enhanced CRM fields
  last_contacted: z.date().optional(),
  source: z.string().optional(),
  score: z.number().min(0).max(100).optional(),
  assigned_to: z.string().uuid().optional(),
  last_activity_date: z.date().optional(),
});

// Generate CRUD for contacts
export const contactsRouter = createCrudRouter({
  name: 'Contact',
  model: 'contacts' as any,
  createSchema: createContactSchema,
  updateSchema: createContactSchema.partial(),
  searchFields: ['name', 'email', 'company'],
  defaultOrderBy: { name: 'asc' },
});

// Leads Schema (updated to match database schema)
const createLeadSchema = z.object({
  name: z.string().min(1),
  company: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  status: z.string().default('new'),
  lead_source: z.string().optional(),
  interest_level: z.string().optional(),
  lead_value: z.number().optional(),
  assigned_to: z.string().uuid().optional(),
  last_contacted: z.date().optional(),
  follow_up_date: z.date().optional(),
  notes: z.string().optional(),
  tags: z.array(z.string()).default([]),
  created_by: z.string().uuid().optional(),
  prospect_status: z.string().optional(),
  contact_method: z.string().optional(),
  website: z.string().optional(),
  // Enhanced CRM fields
  pipeline_stage: z.string().default('initial'),
  last_activity_date: z.date().optional(),
});

// Customers Schema (for client conversion)
const createCustomerSchema = z.object({
  name: z.string().min(1),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  company: z.string().optional(),
  company_name: z.string().optional(),
  address: z.record(z.any()).optional(),
  billing_address: z.record(z.any()).optional(),
  shipping_address: z.record(z.any()).optional(),
  type: z.string().optional(),
  status: z.string().default('active'),
  notes: z.string().optional(),
  tags: z.array(z.string()).default([]),
  created_by: z.string().uuid().optional(),
  portal_access: z.boolean().default(false),
  credit_limit: z.number().optional(),
  payment_terms: z.string().optional(),
  tax_id: z.string().optional(),
  sales_rep_id: z.string().uuid().optional(),
  metadata: z.record(z.any()).default({}),
  // Enhanced CRM fields
  last_activity_date: z.date().optional(),
});

// Generate CRUD for customers/clients
export const customersRouter = createCrudRouter({
  name: 'Customer',
  model: 'customers' as any,
  createSchema: createCustomerSchema,
  updateSchema: createCustomerSchema.partial(),
  searchFields: ['name', 'email', 'company', 'company_name'],
  defaultOrderBy: { name: 'asc' },
});

// Extend leads router with conversion logic
const baseLeadsRouter = createCrudRouter({
  name: 'Lead',
  model: 'leads' as any,
  createSchema: createLeadSchema,
  updateSchema: createLeadSchema.partial(),
  searchFields: ['name', 'company', 'email'],
  defaultOrderBy: { created_at: 'desc' },
});

export const leadsRouter = createTRPCRouter({
  ...baseLeadsRouter._def.procedures,

  // Get prospects (filtered leads)
  getProspects: publicProcedure
    .input(z.object({
      limit: z.number().min(1).max(100).default(20),
      offset: z.number().min(0).default(0),
      prospect_status: z.enum(['cold', 'warm', 'hot']).optional(),
      status: z.string().optional(),
    }))
    .query(async ({ ctx: _ctx, input }) => {
      const { limit, offset, prospect_status, status } = input;

      const whereClause: any = {
        prospect_status: { not: null },
      };

      if (prospect_status) {
        whereClause.prospect_status = prospect_status;
      }

      if (status) {
        whereClause.status = status;
      }

      // Simplified implementation for now
      const items = {
        items: [],
        total: 0,
        hasMore: false,
      };
      const total = items.total || 0;

      return {
        items: items.items || [],
        total,
        hasMore: offset + limit < total,
        nextOffset: offset + limit < total ? offset + limit : null,
      };
    }),

  // Update prospect status
  updateProspectStatus: publicProcedure
    .input(z.object({
      id: z.string().uuid(),
      prospect_status: z.enum(['cold', 'warm', 'hot']).nullable(),
    }))
    .mutation(async ({ ctx, input }) => {
      const lead = await ctx.db.leads.update({
        where: { id: input.id },
        data: {
          prospect_status: input.prospect_status,
          updated_at: new Date(),
        },
      });

      return lead;
    }),

  // Get pipeline stats
  getPipelineStats: publicProcedure
    .query(async ({ ctx }) => {
      const [_statusStats, _prospectStats, _totalValue] = await Promise.all([
        Promise.resolve({}), // Simplified for now
        Promise.resolve({}), // Simplified for now
        ctx.db.leads.aggregate({
          _sum: { value: true },
          _count: true,
        }),
      ]);

      return {
        statusStats: [],
        prospectStats: [],
        totalValue: 0,
        totalLeads: 0,
      };
    }),

  // Convert lead to client
  convertToClient: publicProcedure
    .input(z.object({
      leadId: z.string().uuid(),
      clientData: createCustomerSchema.partial().extend({
        name: z.string().min(1),
      }),
    }))
    .mutation(async ({ ctx, input }) => {
      // Use transaction to ensure data consistency
      const result = await ctx.db.$transaction(async (tx) => {
        // Get the lead first
        const lead = await tx.leads.findUnique({
          where: { id: input.leadId },
        });

        if (!lead) {
          throw new Error('Lead not found');
        }

        // Create client (using customers table directly)
        const client = await tx.customers.create({
          data: {
            ...input.clientData,
            type: 'business',
            status: 'active',
            created_at: new Date(),
          },
        });

        // Update lead status and link to customer
        const updatedLead = await tx.leads.update({
          where: { id: input.leadId },
          data: {
            status: 'won',
            converted_to_customer_id: client.id,
            converted_at: new Date(),
            updated_at: new Date(),
          },
        });

        return { client, lead: updatedLead };
      });

      return result;
    }),
});

// Main CRM router
export const crmRouter = createTRPCRouter({
  contacts: contactsRouter,
  leads: leadsRouter,
  customers: customersRouter,
});