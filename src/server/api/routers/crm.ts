import { z } from 'zod';
import { createCrudRouter } from '../utils/crud-generator';
import { createTRPCRouter, publicProcedure } from '../trpc/init';

// Contacts Schema
const createContactSchema = z.object({
  first_name: z.string().min(1),
  last_name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional(),
  company: z.string().optional(),
  position: z.string().optional(),
  source: z.string().optional(),
  notes: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

// Generate CRUD for contacts
export const contactsRouter = createCrudRouter({
  name: 'Contact',
  model: 'contacts' as any,
  createSchema: createContactSchema,
  updateSchema: createContactSchema.partial(),
  searchFields: ['first_name', 'last_name', 'email', 'company'],
});

// Leads Schema
const createLeadSchema = z.object({
  contact_id: z.string().uuid().optional(),
  company_name: z.string().min(1),
  contact_person: z.string(),
  email: z.string().email(),
  phone: z.string().optional(),
  status: z.enum(['new', 'contacted', 'qualified', 'proposal', 'negotiation', 'won', 'lost']).default('new'),
  prospect_status: z.enum(['cold', 'warm', 'hot']).optional(),
  source: z.string().optional(),
  estimated_value: z.number().optional(),
  probability: z.number().min(0).max(100).optional(),
  notes: z.string().optional(),
});

// Extend leads router with conversion logic
const baseLeadsRouter = createCrudRouter({
  name: 'Lead',
  model: 'leads' as any,
  createSchema: createLeadSchema,
  updateSchema: createLeadSchema.partial(),
  searchFields: ['company_name', 'contact_person', 'email'],
  defaultInclude: {
    contacts: true,
  },
});

export const leadsRouter = createTRPCRouter({
  ...baseLeadsRouter._def.procedures,
  
  // Convert lead to client
  convertToClient: publicProcedure
    .input(z.object({
      leadId: z.string().uuid(),
      clientData: z.object({
        name: z.string(),
        email: z.string().email(),
        phone: z.string().optional(),
        company: z.string().optional(),
        address: z.record(z.any()).optional(),
        credit_limit: z.number().optional(),
      }),
    }))
    .mutation(async ({ ctx, input }) => {
      // Use transaction to ensure data consistency
      const result = await ctx.db.$transaction(async (tx) => {
        // Create client (using customers table directly)
        const client = await tx.customers.create({
          data: {
            ...input.clientData,
            type: 'client',
            status: 'active',
            created_at: new Date(),
          },
        });
        
        // Update lead status
        const lead = await tx.leads.update({
          where: { id: input.leadId },
          data: {
            status: 'won',
            updated_at: new Date(),
          },
        });
        
        return { client, lead };
      });
      
      return result;
    }),
});
