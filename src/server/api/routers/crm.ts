import { z } from 'zod';
import { createCrudRouter } from '../utils/crud-generator';
import { createTRPCRouter, publicProcedure } from '../trpc/init';
import type { orders } from '@prisma/client';

// Contacts Schema (updated to match database schema)
const createContactSchema = z.object({
  name: z.string().min(1).optional(), // Keep for backward compatibility
  first_name: z.string().min(1),
  last_name: z.string().optional(),
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

// Address Schema
const createAddressSchema = z.object({
  address_line_1: z.string().min(1),
  address_line_2: z.string().optional(),
  city: z.string().min(1),
  state_province: z.string().optional(),
  postal_code: z.string().optional(),
  country: z.string().default('USA'),
  address_type: z.enum(['Business', 'Residential']).default('Business'),
  is_primary: z.boolean().default(false),
  // Polymorphic relationships - only one should be set
  contact_id: z.string().uuid().optional(),
  lead_id: z.string().uuid().optional(),
  customer_id: z.string().uuid().optional(),
  created_by: z.string().uuid().optional(),
});

// Generate CRUD for addresses
const addressesRouter = createCrudRouter({
  name: 'Address',
  model: 'addresses' as any,
  createSchema: createAddressSchema,
  updateSchema: createAddressSchema.partial(),
  searchFields: ['address_line_1', 'city', 'country'],
  defaultOrderBy: { created_at: 'desc' },
});

// Generate CRUD for contacts
const baseContactsRouter = createCrudRouter({
  name: 'Contact',
  model: 'contacts' as any,
  createSchema: createContactSchema,
  updateSchema: createContactSchema.partial(),
  searchFields: ['name', 'first_name', 'last_name', 'email', 'company'],
  defaultOrderBy: { created_at: 'desc' },
});

// Extend contacts router with detail page data
export const contactsRouter = createTRPCRouter({
  ...baseContactsRouter._def.procedures,

  // Get all contacts with filters and pagination (override base CRUD)
  getAll: publicProcedure
    .input(
      z.object({
        search: z.string().optional(),
        company: z.string().optional(), // 'with_company' | 'no_company' | undefined
        dateFrom: z.string().optional(),
        dateTo: z.string().optional(),
        limit: z.number().default(100),
        offset: z.number().default(0),
        orderBy: z.record(z.enum(['asc', 'desc'])).optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const where: any = {};

      // Search across name fields, email, and company
      // Note: Using startsWith instead of contains + insensitive mode to avoid Prisma/PostgreSQL compatibility issues
      if (input.search && input.search.trim()) {
        const searchLower = input.search.toLowerCase();
        where.OR = [
          { first_name: { contains: searchLower } },
          { last_name: { contains: searchLower } },
          { name: { contains: searchLower } },
          { email: { contains: searchLower } },
          { company: { contains: searchLower } },
        ];
      }

      // Filter by company presence
      if (input.company === 'with_company') {
        where.company = { not: null };
      } else if (input.company === 'no_company') {
        where.company = null;
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
        ctx.db.contacts.findMany({
          where,
          orderBy: input.orderBy || { name: 'asc' },
          take: input.limit,
          skip: input.offset,
        }),
        ctx.db.contacts.count({ where }),
      ]);

      return {
        items,
        total,
        hasMore: input.offset + input.limit < total,
        nextOffset: input.offset + input.limit < total ? input.offset + input.limit : null,
      };
    }),

  // Get contact by ID with all related data for detail page
  getById: publicProcedure
    .input(z.object({
      id: z.string().uuid(),
    }))
    .query(async ({ ctx, input }) => {
      const contact = await ctx.db.contacts.findUnique({
        where: { id: input.id },
        include: {
          addresses: {
            orderBy: { is_primary: 'desc' },
          },
        },
      });

      if (!contact) {
        throw new Error('Contact not found');
      }

      // Get activities for this contact
      const activities = await ctx.db.activities.findMany({
        where: { contact_id: input.id },
        orderBy: { created_at: 'desc' },
        take: 50,
      });

      // Calculate analytics
      const totalActivities = activities.length;
      const completedActivities = activities.filter(a => a.status === 'completed').length;
      const pendingActivities = activities.filter(a => a.status === 'pending').length;

      // Get last contact date from activities
      const lastContactActivity = activities.find(a =>
        a.type === 'email' || a.type === 'call' || a.type === 'meeting'
      );

      return {
        contact,
        activities,
        analytics: {
          totalActivities,
          completedActivities,
          pendingActivities,
          lastContactDate: lastContactActivity?.created_at || contact.last_contacted || null,
          engagementScore: contact.score || 0,
        },
      };
    }),
});

// Leads Schema (updated to match database schema)
const createLeadSchema = z.object({
  name: z.string().min(1), // Still required for database
  first_name: z.string().min(1),
  last_name: z.string().optional(),
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
  name: z.string().min(1), // Still required for database
  first_name: z.string().min(1),
  last_name: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  company: z.string().optional(),
  company_name: z.string().optional(),
  address: z.record(z.any()).optional(), // Legacy field, keep for now
  billing_address: z.record(z.any()).optional(), // Legacy field
  shipping_address: z.record(z.any()).optional(), // Legacy field
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
  // Enhanced CRM fields
  last_activity_date: z.date().optional(),
});

// Generate CRUD for customers/clients
const baseCustomersRouter = createCrudRouter({
  name: 'Customer',
  model: 'customers' as any,
  createSchema: createCustomerSchema,
  updateSchema: createCustomerSchema.partial(),
  searchFields: ['name', 'email', 'company', 'company_name'],
  defaultOrderBy: { name: 'asc' },
});

// Extend customers router with detail page data
export const customersRouter = createTRPCRouter({
  ...baseCustomersRouter._def.procedures,

  // Alias for getAll to match expected API
  list: publicProcedure
    .input(z.object({
      limit: z.number().min(1).max(100).default(20),
      offset: z.number().min(0).default(0),
      orderBy: z.record(z.enum(['asc', 'desc'])).optional(),
      include: z.record(z.boolean()).optional(),
    }).partial().default({ limit: 20, offset: 0 }))
    .query(async ({ ctx, input }) => {
      const { limit = 20, offset = 0, orderBy } = input;

      const [items, total] = await Promise.all([
        ctx.db.customers.findMany({
          take: limit,
          skip: offset,
          orderBy: orderBy || { name: 'asc' },
        }),
        ctx.db.customers.count(),
      ]);

      return {
        items,
        total,
        hasMore: offset + limit < total,
        nextOffset: offset + limit < total ? offset + limit : null,
      };
    }),

  // Get customer by ID with all related data for detail page
  getById: publicProcedure
    .input(z.object({
      id: z.string().uuid(),
    }))
    .query(async ({ ctx, input }) => {
      const customerData = await ctx.db.customers.findUnique({
        where: { id: input.id },
        include: {
          addresses: {
            orderBy: { is_primary: 'desc' },
          },
          orders: {
            orderBy: { created_at: 'desc' },
            take: 10,
          },
        },
      });

      if (!customerData) {
        throw new Error('Customer not found');
      }

      // Cast to any due to db wrapper losing Prisma type information
      const customer: any = customerData;

      // Get projects for this customer
      const projects = await ctx.db.projects.findMany({
        where: { customer_id: input.id },
        orderBy: { created_at: 'desc' },
        take: 10,
      });

      // Get production orders for this customer
      const productionOrders = await ctx.db.production_orders.findMany({
        where: {
          orders: {
            customer_id: input.id,
          },
        },
        include: {
          orders: true,
          projects: true,
        },
        orderBy: { created_at: 'desc' },
        take: 10,
      });

      // Get activities for this customer
      const activities = await ctx.db.activities.findMany({
        where: { customer_id: input.id },
        orderBy: { created_at: 'desc' },
        take: 50,
      });

      // Get payments for this customer
      const payments = await ctx.db.payments.findMany({
        where: { customer_id: input.id },
        orderBy: { created_at: 'desc' },
        take: 10,
      });

      // Calculate financial analytics
      const orders = customer.orders || [];
      const totalOrderValue = orders.reduce((sum: number, order: orders) =>
        sum + (order.total_amount ? Number(order.total_amount) : 0), 0
      );

      const totalPaid = payments.reduce((sum: number, payment) =>
        sum + (payment.amount ? Number(payment.amount) : 0), 0
      );

      const outstandingBalance = totalOrderValue - totalPaid;

      // Calculate activity analytics
      const totalActivities = activities.length;
      const completedActivities = activities.filter(a => a.status === 'completed').length;

      // Calculate customer lifetime
      const createdDate = customer.created_at ? new Date(customer.created_at) : new Date();
      const currentDate = new Date();
      const daysAsCustomer = Math.floor((currentDate.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24));

      return {
        customer,
        projects,
        productionOrders,
        activities,
        payments,
        analytics: {
          totalOrders: orders.length,
          totalProjects: projects.length,
          totalProductionOrders: productionOrders.length,
          totalOrderValue,
          totalPaid,
          outstandingBalance,
          lifetimeValue: totalOrderValue,
          averageOrderValue: orders.length > 0 ? totalOrderValue / orders.length : 0,
          totalActivities,
          completedActivities,
          daysAsCustomer,
          lastActivityDate: customer.last_activity_date || null,
        },
      };
    }),
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

  // Alias for getAll to match expected API
  list: publicProcedure
    .input(z.object({
      limit: z.number().min(1).max(100).default(20),
      offset: z.number().min(0).default(0),
      orderBy: z.record(z.enum(['asc', 'desc'])).optional(),
      include: z.record(z.boolean()).optional(),
    }).partial().default({ limit: 20, offset: 0 }))
    .query(async ({ ctx, input }) => {
      const { limit = 20, offset = 0, orderBy } = input;

      const [items, total] = await Promise.all([
        ctx.db.leads.findMany({
          take: limit,
          skip: offset,
          orderBy: orderBy || { created_at: 'desc' },
        }),
        ctx.db.leads.count(),
      ]);

      return {
        items,
        total,
        hasMore: offset + limit < total,
        nextOffset: offset + limit < total ? offset + limit : null,
      };
    }),

  // Get lead by ID with all related data for detail page
  getById: publicProcedure
    .input(z.object({
      id: z.string().uuid(),
    }))
    .query(async ({ ctx, input }) => {
      const lead = await ctx.db.leads.findUnique({
        where: { id: input.id },
        include: {
          addresses: {
            orderBy: { is_primary: 'desc' },
          },
        },
      });

      if (!lead) {
        throw new Error('Lead not found');
      }

      // Get activities for this lead
      const activities = await ctx.db.activities.findMany({
        where: { lead_id: input.id },
        orderBy: { created_at: 'desc' },
        take: 50,
      });

      // Calculate analytics
      const totalActivities = activities.length;
      const completedActivities = activities.filter(a => a.status === 'completed').length;
      const pendingActivities = activities.filter(a => a.status === 'pending').length;

      // Calculate days in pipeline
      const createdDate = lead.created_at ? new Date(lead.created_at) : new Date();
      const currentDate = new Date();
      const daysInPipeline = Math.floor((currentDate.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24));

      // Get last contact date from activities
      const lastContactActivity = activities.find(a =>
        a.type === 'email' || a.type === 'call' || a.type === 'meeting'
      );

      // Pipeline stages in order
      const pipelineStages = ['initial', 'qualified', 'proposal', 'negotiation', 'won', 'lost'];
      const currentStageIndex = pipelineStages.indexOf(lead.pipeline_stage || 'initial');
      const progress = ((currentStageIndex + 1) / pipelineStages.length) * 100;

      return {
        lead,
        activities,
        analytics: {
          totalActivities,
          completedActivities,
          pendingActivities,
          lastContactDate: lastContactActivity?.created_at || lead.last_contacted || null,
          daysInPipeline,
          leadValue: lead.lead_value ? Number(lead.lead_value) : 0,
          pipelineProgress: Math.round(progress),
          currentStage: lead.pipeline_stage || 'initial',
          interestLevel: lead.interest_level || 'unknown',
        },
      };
    }),

  // Get leads only (no prospect status set - "Not yet")
  getLeadsOnly: publicProcedure
    .input(z.object({
      limit: z.number().min(1).max(100).default(20),
      offset: z.number().min(0).default(0),
      orderBy: z.record(z.enum(['asc', 'desc'])).optional(),
      // Filter parameters
      search: z.string().optional(),
      status: z.string().optional(),
      prospect_status: z.string().optional(),
      source: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const { limit, offset, orderBy, search, status, prospect_status, source } = input;

      const whereClause: any = {
        prospect_status: null,
      };

      // Add search filter for name, company, email
      if (search && search.trim()) {
        whereClause.OR = [
          { name: { contains: search.trim(), mode: 'insensitive' } },
          { first_name: { contains: search.trim(), mode: 'insensitive' } },
          { last_name: { contains: search.trim(), mode: 'insensitive' } },
          { company: { contains: search.trim(), mode: 'insensitive' } },
          { email: { contains: search.trim(), mode: 'insensitive' } },
        ];
      }

      // Apply status filter
      if (status && status !== '' && status !== 'all') {
        whereClause.status = status;
      }

      // Apply prospect_status filter (overrides the null check if specified)
      if (prospect_status && prospect_status !== '' && prospect_status !== 'all') {
        whereClause.prospect_status = prospect_status;
      }

      // Apply source filter
      if (source && source !== '' && source !== 'all') {
        whereClause.lead_source = source;
      }

      // Query leads with NO prospect_status (Not yet)
      const [items, total] = await Promise.all([
        ctx.db.leads.findMany({
          where: whereClause,
          skip: offset,
          take: limit,
          orderBy: orderBy || { created_at: 'desc' },
        }),
        ctx.db.leads.count({
          where: whereClause,
        }),
      ]);

      return {
        items,
        total,
        hasMore: offset + limit < total,
        nextOffset: offset + limit < total ? offset + limit : null,
      };
    }),

  // Get prospects (filtered leads)
  getProspects: publicProcedure
    .input(z.object({
      limit: z.number().min(1).max(100).default(20),
      offset: z.number().min(0).default(0),
      prospect_status: z.enum(['cold', 'warm', 'hot']).optional(),
      status: z.string().optional(),
      search: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const { limit, offset, prospect_status, status, search } = input;

      const whereClause: any = {
        prospect_status: { not: null },
      };

      if (prospect_status) {
        whereClause.prospect_status = prospect_status;
      }

      if (status) {
        whereClause.status = status;
      }

      // Add search filter for name, company, email
      if (search && search.trim()) {
        whereClause.OR = [
          { name: { contains: search.trim(), mode: 'insensitive' } },
          { first_name: { contains: search.trim(), mode: 'insensitive' } },
          { last_name: { contains: search.trim(), mode: 'insensitive' } },
          { company: { contains: search.trim(), mode: 'insensitive' } },
          { email: { contains: search.trim(), mode: 'insensitive' } },
        ];
      }

      // Query prospects (leads with prospect_status set)
      const [items, total] = await Promise.all([
        ctx.db.leads.findMany({
          where: whereClause,
          skip: offset,
          take: limit,
          orderBy: { created_at: 'desc' },
        }),
        ctx.db.leads.count({
          where: whereClause,
        }),
      ]);

      return {
        items,
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
      try {
        // Get all leads
        const allLeads = await ctx.db.leads.findMany();

        // Group by status
        // Note: groupBy not supported by wrapper, using manual grouping
        const statusGroups = allLeads.reduce((acc: Record<string, number>, lead) => {
          const status = lead.status || 'unknown';
          acc[status] = (acc[status] || 0) + 1;
          return acc;
        }, {});
        const statusStats = Object.entries(statusGroups).map(([status, count]) => ({
          status,
          _count: { id: count },
        }));

        // Group by prospect_status (only leads with prospect_status set)
        // Note: groupBy not supported by wrapper, using manual grouping
        const prospectLeads = allLeads.filter(lead => lead.prospect_status !== null);
        const prospectGroups = prospectLeads.reduce((acc: Record<string, number>, lead) => {
          const prospectStatus = lead.prospect_status!;
          acc[prospectStatus] = (acc[prospectStatus] || 0) + 1;
          return acc;
        }, {});
        const prospectStats = Object.entries(prospectGroups).map(([prospect_status, count]) => ({
          prospect_status,
          _count: { id: count },
        }));

        // Calculate total value
        const totalValueSum = allLeads.reduce((sum, lead) => {
          return sum + (lead.lead_value ? Number(lead.lead_value) : 0);
        }, 0);

        return {
          statusStats: statusStats.map(stat => ({
            status: stat.status,
            _count: stat._count?.id || 0,
          })),
          prospectStats: prospectStats.map(stat => ({
            prospect_status: stat.prospect_status,
            _count: stat._count?.id || 0,
          })),
          totalValue: totalValueSum,
          totalLeads: allLeads.length,
        };
      } catch (error) {
        console.error('[getPipelineStats] Error:', error);
        // Return safe defaults
        return {
          statusStats: [],
          prospectStats: [],
          totalValue: 0,
          totalLeads: 0,
        };
      }
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

        // Check if customer already exists with this email
        let client;
        if (input.clientData.email) {
          // Note: findFirst not supported by wrapper, using findMany
          const existingCustomers = await (tx.customers as any).findMany({
            where: { email: input.clientData.email },
            take: 1,
          });
          const existingCustomer = existingCustomers.length > 0 ? existingCustomers[0] : null;

          if (existingCustomer) {
            // Link to existing customer instead of creating new one
            client = existingCustomer;
          }
        }

        // Create new customer only if one doesn't exist
        if (!client) {
          client = await tx.customers.create({
            data: {
              ...input.clientData,
              type: 'business',
              status: 'active',
              created_at: new Date(),
            },
          });
        }

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
  addresses: addressesRouter,

  // Dashboard metrics endpoint
  getDashboardMetrics: publicProcedure
    .query(async ({ ctx }) => {
      try {
        // Get counts
        const [totalContacts, totalLeads, totalCustomers, totalActivities] = await Promise.all([
          ctx.db.contacts.count(),
          ctx.db.leads.count(),
          ctx.db.customers.count(),
          ctx.db.activities.count(),
        ]);

        // Get recent activities (last 10)
        const recentActivities = await ctx.db.activities.findMany({
          orderBy: { created_at: 'desc' },
          take: 10,
          include: {
            contacts: true,
            leads: true,
            customers: true,
          },
        });

        // Get leads by status for pipeline visualization
        const allLeads = await ctx.db.leads.findMany();
        const leadsByStatus = allLeads.reduce((acc: Record<string, number>, lead) => {
          const status = lead.status || 'unknown';
          acc[status] = (acc[status] || 0) + 1;
          return acc;
        }, {});

        // Calculate total pipeline value
        const totalPipelineValue = allLeads.reduce((sum, lead) => {
          return sum + (lead.lead_value ? Number(lead.lead_value) : 0);
        }, 0);

        // Get recent contacts (last 5)
        const recentContacts = await ctx.db.contacts.findMany({
          orderBy: { created_at: 'desc' },
          take: 5,
        });

        // Get won/lost leads for conversion rate
        const wonLeads = allLeads.filter(l => l.status === 'won').length;
        const lostLeads = allLeads.filter(l => l.status === 'lost').length;
        const closedLeads = wonLeads + lostLeads;
        const conversionRate = closedLeads > 0 ? (wonLeads / closedLeads) * 100 : 0;

        // Get activities by type
        const allActivities = await ctx.db.activities.findMany();
        const activitiesByType = allActivities.reduce((acc: Record<string, number>, activity) => {
          const type = activity.type || 'other';
          acc[type] = (acc[type] || 0) + 1;
          return acc;
        }, {});

        return {
          metrics: {
            totalContacts,
            totalLeads,
            totalCustomers,
            totalActivities,
            totalPipelineValue,
            conversionRate: Math.round(conversionRate * 10) / 10, // Round to 1 decimal
          },
          leadsByStatus: Object.entries(leadsByStatus).map(([status, count]) => ({
            status,
            count,
          })),
          activitiesByType: Object.entries(activitiesByType).map(([type, count]) => ({
            type,
            count,
          })),
          recentActivities: recentActivities.map(activity => ({
            id: activity.id,
            type: activity.type,
            description: activity.description,
            status: activity.status,
            created_at: activity.created_at,
            contact: activity.contacts,
            lead: activity.leads,
            customer: activity.customers,
          })),
          recentContacts: recentContacts.map(contact => ({
            id: contact.id,
            name: contact.name,
            first_name: contact.first_name,
            last_name: contact.last_name,
            email: contact.email,
            company: contact.company,
            created_at: contact.created_at,
          })),
        };
      } catch (error) {
        console.error('[getDashboardMetrics] Error:', error);
        // Return safe defaults on error
        return {
          metrics: {
            totalContacts: 0,
            totalLeads: 0,
            totalCustomers: 0,
            totalActivities: 0,
            totalPipelineValue: 0,
            conversionRate: 0,
          },
          leadsByStatus: [],
          activitiesByType: [],
          recentActivities: [],
          recentContacts: [],
        };
      }
    }),
});