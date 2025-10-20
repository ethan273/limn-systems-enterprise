import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc/init";
import { TRPCError } from "@trpc/server";
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Partners Module tRPC Router
 * Handles factories and designers
 *
 * Features:
 * - CRUD operations for partners
 * - Contact management
 * - Document management
 * - Performance tracking
 * - Portal access management
 */

// Zod Schemas for validation
const createPartnerSchema = z.object({
  type: z.enum(["factory", "designer", "sourcing"]),

  // Company Information
  company_name: z.string().min(1, "Company name is required"),
  business_name: z.string().optional(),
  registration_number: z.string().optional(),

  // Contact Information
  primary_contact: z.string().min(1, "Primary contact is required"),
  primary_email: z.string().email("Invalid email address"),
  primary_phone: z.string().optional(),
  website: z.string().url().optional().or(z.literal("")),

  // Address
  address_line1: z.string().optional(),
  address_line2: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  postal_code: z.string().optional(),
  country: z.string().optional(),

  // Business Details
  specializations: z.array(z.string()).default([]),
  capabilities: z.array(z.string()).default([]),
  certifications: z.array(z.string()).default([]),
  languages: z.array(z.string()).default([]),

  // Capacity & Metrics
  production_capacity: z.number().int().positive().optional(),
  lead_time_days: z.number().int().positive().optional(),
  minimum_order: z.number().int().positive().optional(),

  // Financial
  payment_terms: z.string().optional(),
  currency: z.string().default("USD"),

  // Status
  status: z.enum(["active", "inactive", "pending_approval", "suspended"]).default("active"),

  // Quality Metrics
  quality_rating: z.number().min(0).max(5).optional(),
  on_time_delivery_rate: z.number().min(0).max(100).optional(),
  defect_rate: z.number().min(0).max(100).optional(),

  // Portal Access
  portal_enabled: z.boolean().default(false),
  portal_user_id: z.string().uuid().optional(),

  // Metadata
  notes: z.string().optional(),
  internal_rating: z.string().optional(),
  tags: z.array(z.string()).default([]),
});

const updatePartnerSchema = createPartnerSchema.partial().extend({
  id: z.string().uuid(),
});

const partnerContactSchema = z.object({
  partner_id: z.string().uuid(),
  name: z.string().min(1, "Name is required"),
  role: z.string().min(1, "Role is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
  mobile: z.string().optional(),
  is_primary: z.boolean().default(false),
  is_qc: z.boolean().default(false),
  is_production: z.boolean().default(false),
  is_finance: z.boolean().default(false),
  preferred_contact_method: z.string().optional(),
  timezone: z.string().optional(),
  languages: z.array(z.string()).default([]),
  active: z.boolean().default(true),
  notes: z.string().optional(),

  // Employee Management Fields
  user_id: z.string().uuid().optional().nullable(),
  portal_role: z.string().default("viewer"),
  portal_access_enabled: z.boolean().default(false),
  portal_modules_allowed: z.array(z.string()).default([]),
  employee_id: z.string().optional().nullable(),
  department: z.string().optional().nullable(),
  employment_status: z.enum(["active", "inactive", "terminated", "suspended"]).default("active"),
  employment_start_date: z.date().optional().nullable(),
  employment_end_date: z.date().optional().nullable(),
  qc_specializations: z.array(z.string()).default([]),
  certifications: z.array(z.string()).default([]),
});

const partnerDocumentSchema = z.object({
  partner_id: z.string().uuid(),
  document_type: z.string().min(1, "Document type is required"),
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  file_url: z.string().url("Invalid file URL"),
  file_name: z.string().min(1, "File name is required"),
  file_size: z.bigint().positive(),
  mime_type: z.string().min(1, "MIME type is required"),
  status: z.enum(["active", "archived", "expired"]).default("active"),
  issue_date: z.date().optional(),
  expiry_date: z.date().optional(),
});

export const partnersRouter = createTRPCRouter({
  // Get all partners with filtering
  getAll: protectedProcedure
    .input(
      z.object({
        type: z.enum(["factory", "designer", "sourcing", "all"]).optional().default("all"),
        status: z.enum(["active", "inactive", "pending_approval", "suspended", "all"]).optional().default("all"),
        search: z.string().optional(),
        limit: z.number().min(1).max(100).optional().default(50),
        offset: z.number().min(0).optional().default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      const { type, status, search, limit, offset } = input;

      const where: Record<string, unknown> = {};

      // Filter by type
      if (type !== "all") {
        where.type = type;
      }

      // Filter by status
      if (status !== "all") {
        where.status = status;
      }

      // Search filter
      if (search && search.trim() !== "") {
        where.OR = [
          { company_name: { contains: search, mode: "insensitive" } },
          { business_name: { contains: search, mode: "insensitive" } },
          { primary_contact: { contains: search, mode: "insensitive" } },
          { primary_email: { contains: search, mode: "insensitive" } },
          { city: { contains: search, mode: "insensitive" } },
          { country: { contains: search, mode: "insensitive" } },
        ];
      }

      const [partners, total] = await Promise.all([
        ctx.db.partners.findMany({
          where,
          take: limit,
          skip: offset,
          orderBy: { created_at: "desc" },
          include: {
            contacts: {
              where: { active: true },
              orderBy: { is_primary: "desc" },
            },
            _count: {
              select: {
                production_orders: true,
                documents: true,
                contacts: true,
              },
            },
          },
        }),
        ctx.db.partners.count({ where }),
      ]);

      return {
        partners,
        total,
        hasMore: offset + limit < total,
      };
    }),

  // Get single partner by ID
  getById: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const partner = await ctx.db.partners.findUnique({
        where: { id: input.id },
        include: {
          contacts: {
            where: { active: true },
            orderBy: [{ is_primary: "desc" }, { created_at: "asc" }],
          },
          documents: {
            orderBy: { created_at: "desc" },
          },
          production_orders: {
            orderBy: { created_at: "desc" },
            take: 10, // Latest 10 orders
            select: {
              id: true,
              order_number: true,
              item_name: true,
              quantity: true,
              total_cost: true,
              status: true,
              order_date: true,
              estimated_ship_date: true,
            },
          },
          partner_performance: {
            orderBy: { period_start: "desc" },
            take: 12, // Last 12 months
          },
          portal_user: {
            select: {
              id: true,
              email: true,
              last_sign_in_at: true,
            },
          },
          _count: {
            select: {
              production_orders: true,
              documents: true,
              contacts: true,
            },
          },
        },
      });

      if (!partner) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Partner not found",
        });
      }

      return partner;
    }),

  // Create new partner
  create: protectedProcedure
    .input(createPartnerSchema)
    .mutation(async ({ ctx, input }) => {
      const partner = await ctx.db.partners.create({
        data: input,
        include: {
          contacts: true,
        },
      });

      return partner;
    }),

  // Convenience method for creating a designer
  createDesigner: protectedProcedure
    .input(createPartnerSchema.omit({ type: true }))
    .mutation(async ({ ctx, input }) => {
      const partner = await ctx.db.partners.create({
        data: {
          ...input,
          type: 'designer',
        },
        include: {
          contacts: true,
        },
      });

      return partner;
    }),

  // Convenience method for creating a factory
  createFactory: protectedProcedure
    .input(createPartnerSchema.omit({ type: true }))
    .mutation(async ({ ctx, input }) => {
      const partner = await ctx.db.partners.create({
        data: {
          ...input,
          type: 'factory',
        },
        include: {
          contacts: true,
        },
      });

      return {
        message: "Factory partner created successfully",
        factory: partner,
      };
    }),

  // Convenience method for creating a sourcing partner
  createSourcing: protectedProcedure
    .input(createPartnerSchema.omit({ type: true }))
    .mutation(async ({ ctx, input }) => {
      const partner = await ctx.db.partners.create({
        data: {
          ...input,
          type: 'sourcing',
        },
        include: {
          contacts: true,
        },
      });

      return {
        message: "Sourcing partner created successfully",
        sourcing: partner,
      };
    }),

  // Alias methods for getAll filtered by type
  getDesigners: protectedProcedure
    .input(z.object({
      status: z.enum(["active", "inactive", "pending_approval", "suspended", "all"]).optional().default("all"),
      search: z.string().optional(),
      limit: z.number().min(1).max(100).optional().default(50),
      offset: z.number().min(0).optional().default(0),
    }))
    .query(async ({ ctx, input }) => {
      const where: Record<string, unknown> = { type: 'designer' };

      if (input.status !== "all") {
        where.status = input.status;
      }

      if (input.search && input.search.trim() !== "") {
        where.OR = [
          { company_name: { contains: input.search, mode: "insensitive" } },
          { business_name: { contains: input.search, mode: "insensitive" } },
          { primary_contact: { contains: input.search, mode: "insensitive" } },
          { primary_email: { contains: input.search, mode: "insensitive" } },
        ];
      }

      const [partners, total] = await Promise.all([
        prisma.partners.findMany({
          where,
          take: input.limit,
          skip: input.offset,
          orderBy: { created_at: "desc" },
          include: {
            contacts: {
              where: { active: true },
              orderBy: { is_primary: "desc" },
            },
          },
        }),
        prisma.partners.count({ where }),
      ]);

      return {
        partners,
        total,
        hasMore: input.offset + input.limit < total,
      };
    }),

  getFactories: protectedProcedure
    .input(z.object({
      status: z.enum(["active", "inactive", "pending_approval", "suspended", "all"]).optional().default("all"),
      search: z.string().optional(),
      limit: z.number().min(1).max(100).optional().default(50),
      offset: z.number().min(0).optional().default(0),
    }))
    .query(async ({ ctx, input }) => {
      const where: Record<string, unknown> = { type: 'factory' };

      if (input.status !== "all") {
        where.status = input.status;
      }

      if (input.search && input.search.trim() !== "") {
        where.OR = [
          { company_name: { contains: input.search, mode: "insensitive" } },
          { business_name: { contains: input.search, mode: "insensitive" } },
          { primary_contact: { contains: input.search, mode: "insensitive" } },
          { primary_email: { contains: input.search, mode: "insensitive" } },
        ];
      }

      const [partners, total] = await Promise.all([
        prisma.partners.findMany({
          where,
          take: input.limit,
          skip: input.offset,
          orderBy: { created_at: "desc" },
          include: {
            contacts: {
              where: { active: true },
              orderBy: { is_primary: "desc" },
            },
          },
        }),
        prisma.partners.count({ where }),
      ]);

      return {
        partners,
        total,
        hasMore: input.offset + input.limit < total,
      };
    }),

  getSourcing: protectedProcedure
    .input(z.object({
      status: z.enum(["active", "inactive", "pending_approval", "suspended", "all"]).optional().default("all"),
      search: z.string().optional(),
      limit: z.number().min(1).max(100).optional().default(50),
      offset: z.number().min(0).optional().default(0),
    }))
    .query(async ({ ctx, input }) => {
      const where: Record<string, unknown> = { type: 'sourcing' };

      if (input.status !== "all") {
        where.status = input.status;
      }

      if (input.search && input.search.trim() !== "") {
        where.OR = [
          { company_name: { contains: input.search, mode: "insensitive" } },
          { business_name: { contains: input.search, mode: "insensitive" } },
          { primary_contact: { contains: input.search, mode: "insensitive" } },
          { primary_email: { contains: input.search, mode: "insensitive" } },
        ];
      }

      const [partners, total] = await Promise.all([
        prisma.partners.findMany({
          where,
          take: input.limit,
          skip: input.offset,
          orderBy: { created_at: "desc" },
          include: {
            contacts: {
              where: { active: true },
              orderBy: { is_primary: "desc" },
            },
          },
        }),
        prisma.partners.count({ where }),
      ]);

      return {
        partners,
        total,
        hasMore: input.offset + input.limit < total,
      };
    }),

  // Update partner
  update: protectedProcedure
    .input(updatePartnerSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;

      const partner = await ctx.db.partners.update({
        where: { id },
        data,
        include: {
          contacts: {
            where: { active: true },
          },
        },
      });

      return partner;
    }),

  // Delete partner (soft delete by setting status to inactive)
  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      // Check if partner has active production orders
      const activeOrdersCount = await ctx.db.production_orders.count({
        where: {
          factory_id: input.id,
          status: {
            in: ["awaiting_deposit", "deposit_paid", "in_progress", "awaiting_final_payment"],
          },
        },
      });

      if (activeOrdersCount > 0) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: `Cannot delete partner with ${activeOrdersCount} active production orders. Please complete or reassign orders first.`,
        });
      }

      // Soft delete by setting status to inactive
      const partner = await ctx.db.partners.update({
        where: { id: input.id },
        data: { status: "inactive" },
      });

      return partner;
    }),

  // Partner Contacts Management
  contacts: createTRPCRouter({
    // List all contacts for a partner
    list: protectedProcedure
      .input(
        z.object({
          partner_id: z.string().uuid(),
          include_inactive: z.boolean().optional().default(false),
        })
      )
      .query(async ({ ctx, input }) => {
        const where: Record<string, unknown> = {
          partner_id: input.partner_id,
        };

        if (!input.include_inactive) {
          where.active = true;
        }

        const contacts = await prisma.partner_contacts.findMany({
          where,
          orderBy: [
            { is_primary: "desc" },
            { created_at: "asc" },
          ],
        });

        return contacts;
      }),

    // Get single contact by ID
    getById: protectedProcedure
      .input(z.object({ id: z.string().uuid() }))
      .query(async ({ ctx, input }) => {
        const contact = await prisma.partner_contacts.findUnique({
          where: { id: input.id },
          include: {
            partners: {
              select: {
                id: true,
                company_name: true,
                type: true,
              },
            },
          },
        });

        if (!contact) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Contact not found",
          });
        }

        return contact;
      }),

    // Add contact to partner
    create: protectedProcedure
      .input(partnerContactSchema)
      .mutation(async ({ ctx, input }) => {
        const contact = await prisma.partner_contacts.create({
          data: input,
        });
        return contact;
      }),

    // Update contact
    update: protectedProcedure
      .input(
        partnerContactSchema.partial().extend({
          id: z.string().uuid(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const { id, ...data } = input;
        const contact = await prisma.partner_contacts.update({
          where: { id },
          data,
        });
        return contact;
      }),

    // Delete contact (soft delete by setting active to false)
    delete: protectedProcedure
      .input(z.object({ id: z.string().uuid() }))
      .mutation(async ({ ctx, input }) => {
        const contact = await prisma.partner_contacts.update({
          where: { id: input.id },
          data: {
            active: false,
            portal_access_enabled: false,
            employment_status: "terminated",
            employment_end_date: new Date(),
          },
        });
        return contact;
      }),

    // Assign portal access to an employee
    assignPortalAccess: protectedProcedure
      .input(
        z.object({
          contact_id: z.string().uuid(),
          portal_role: z.string(),
          portal_modules: z.array(z.string()),
          send_magic_link: z.boolean().default(false),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const { contact_id, portal_role, portal_modules, send_magic_link } = input;

        // Get the contact to validate it exists and get email
        const contact = await prisma.partner_contacts.findUnique({
          where: { id: contact_id },
          include: {
            partner: {
              select: {
                type: true,
                company_name: true,
              },
            },
          },
        });

        if (!contact) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Contact not found",
          });
        }

        // Check if user already exists with this email
        let userId = contact.user_id;

        if (!userId) {
          // TODO: Create user in Supabase Auth
          // For now, we'll just update the portal settings
          // In a real implementation, you would call Supabase Admin API here
          // to create the user and get their ID
          throw new TRPCError({
            code: "NOT_IMPLEMENTED",
            message: "User creation not yet implemented. Please create user manually first.",
          });
        }

        // Update contact with portal access
        const updatedContact = await prisma.partner_contacts.update({
          where: { id: contact_id },
          data: {
            user_id: userId,
            portal_role,
            portal_access_enabled: true,
            portal_modules_allowed: portal_modules,
            last_login_at: null, // Reset login tracking
          },
        });

        // TODO: Send magic link if requested
        if (send_magic_link) {
          // Implementation would go here
          // This would call Supabase Auth API to send magic link
        }

        return updatedContact;
      }),

    // Revoke portal access
    revokePortalAccess: protectedProcedure
      .input(z.object({ contact_id: z.string().uuid() }))
      .mutation(async ({ ctx, input }) => {
        const contact = await prisma.partner_contacts.update({
          where: { id: input.contact_id },
          data: {
            portal_access_enabled: false,
            portal_modules_allowed: [],
          },
        });
        return contact;
      }),
  }),

  // Partner Documents Management
  documents: createTRPCRouter({
    // Upload document
    create: protectedProcedure
      .input(partnerDocumentSchema)
      .mutation(async ({ ctx, input }) => {
        const document = await ctx.db.partner_documents.create({
          data: {
            ...input,
            uploaded_by: ctx.session.user.id,
          },
        });
        return document;
      }),

    // Update document
    update: protectedProcedure
      .input(
        partnerDocumentSchema.partial().extend({
          id: z.string().uuid(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const { id, ...data } = input;
        const document = await ctx.db.partner_documents.update({
          where: { id },
          data,
        });
        return document;
      }),

    // Delete document
    delete: protectedProcedure
      .input(z.object({ id: z.string().uuid() }))
      .mutation(async ({ ctx, input }) => {
        await ctx.db.partner_documents.delete({
          where: { id: input.id },
        });
        return { success: true };
      }),
  }),

  // Partner Performance Statistics
  getPerformanceStats: protectedProcedure
    .input(
      z.object({
        partnerId: z.string().uuid(),
        months: z.number().min(1).max(24).optional().default(12),
      })
    )
    .query(async ({ ctx, input }) => {
      const { partnerId, months } = input;

      // Get performance records
      const performance = await ctx.db.partner_performance.findMany({
        where: { partner_id: partnerId },
        orderBy: { period_start: "desc" },
        take: months,
      });

      // Calculate overall statistics
      const totalOrders = performance.reduce((sum: number, p) => sum + p.orders_completed, 0);
      const totalOnTime = performance.reduce((sum: number, p) => sum + p.orders_on_time, 0);
      const totalDefects = performance.reduce((sum: number, p) => sum + p.total_defects, 0);
      const totalRevenue = performance.reduce(
        (sum: number, p) => sum + Number(p.total_revenue),
        0
      );

      const avgOnTimeRate =
        performance.length > 0
          ? performance.reduce((sum: number, p) => sum + Number(p.on_time_rate), 0) /
            performance.length
          : 0;

      const avgDefectRate =
        performance.length > 0
          ? performance.reduce((sum: number, p) => sum + Number(p.defect_rate), 0) /
            performance.length
          : 0;

      return {
        performance,
        summary: {
          totalOrders,
          totalOnTime,
          totalDefects,
          totalRevenue,
          avgOnTimeRate: Math.round(avgOnTimeRate * 100) / 100,
          avgDefectRate: Math.round(avgDefectRate * 100) / 100,
          onTimePercentage:
            totalOrders > 0 ? Math.round((totalOnTime / totalOrders) * 100) : 0,
          defectPercentage:
            totalOrders > 0 ? Math.round((totalDefects / totalOrders) * 100) : 0,
        },
      };
    }),

  // Get partners for dropdown selection
  getForSelection: protectedProcedure
    .input(
      z.object({
        type: z.enum(["factory", "designer", "sourcing", "all"]).optional().default("all"),
      })
    )
    .query(async ({ ctx, input }) => {
      const where: Record<string, unknown> = {
        status: "active",
      };

      if (input.type !== "all") {
        where.type = input.type;
      }

      const partners = await ctx.db.partners.findMany({
        where,
        select: {
          id: true,
          company_name: true,
          type: true,
          city: true,
          country: true,
        },
        orderBy: { company_name: "asc" },
      });

      return partners;
    }),

  // Portal Roles Management
  portalRoles: createTRPCRouter({
    // Get roles for a specific partner type
    getByPartnerType: protectedProcedure
      .input(
        z.object({
          partner_type: z.enum(["factory", "designer", "sourcing", "all"]),
        })
      )
      .query(async ({ ctx, input }) => {
        const where: Record<string, unknown> = {};

        if (input.partner_type !== "all") {
          where.OR = [
            { partner_type: input.partner_type },
            { partner_type: "all" }, // Include universal roles
          ];
        }

        const roles = await ctx.db.partner_portal_roles.findMany({
          where,
          orderBy: [
            { is_system_role: "desc" },
            { role_label: "asc" },
          ],
        });

        return roles;
      }),

    // Get available portal modules
    getAvailableModules: protectedProcedure
      .input(
        z.object({
          partner_type: z.enum(["factory", "designer", "sourcing"]),
        })
      )
      .query(async ({ input }) => {
        // Define available modules per partner type
        const modulesByType: Record<string, Array<{ key: string; label: string; description: string }>> = {
          factory: [
            { key: "dashboard", label: "Dashboard", description: "Overview and metrics" },
            { key: "orders", label: "Orders", description: "Production orders management" },
            { key: "production", label: "Production", description: "Production tracking" },
            { key: "qc", label: "Quality Control", description: "QC inspections" },
            { key: "shipping", label: "Shipping", description: "Shipment tracking" },
            { key: "documents", label: "Documents", description: "Documents and files" },
            { key: "settings", label: "Settings", description: "Account settings" },
          ],
          sourcing: [
            { key: "dashboard", label: "Dashboard", description: "Overview and metrics" },
            { key: "qc", label: "Quality Control", description: "QC inspections" },
            { key: "inspections", label: "Inspections", description: "Inspection management" },
            { key: "history", label: "History", description: "Activity history" },
            { key: "documents", label: "Documents", description: "Documents and files" },
            { key: "settings", label: "Settings", description: "Account settings" },
          ],
          designer: [
            { key: "dashboard", label: "Dashboard", description: "Overview and metrics" },
            { key: "projects", label: "Projects", description: "Design projects" },
            { key: "briefs", label: "Briefs", description: "Design briefs" },
            { key: "documents", label: "Documents", description: "Documents and files" },
            { key: "settings", label: "Settings", description: "Account settings" },
          ],
        };

        return modulesByType[input.partner_type] || [];
      }),
  }),

  // Get partner by portal user (for factory portal)
  getByPortalUser: protectedProcedure.query(async ({ ctx }) => {
    // Note: findFirst not supported by wrapper, using findMany
    const partner = (await ctx.db.partners.findMany({
      where: {
        portal_user_id: ctx.session.user.id,
      },
      include: {
        contacts: {
          where: { active: true },
        },
        _count: {
          select: {
            production_orders: true,
            documents: true,
          },
        },
      },
      take: 1,
    }))[0];

    return partner;
  }),
});
