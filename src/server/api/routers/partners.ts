import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc/init";
import { TRPCError } from "@trpc/server";

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
  type: z.enum(["factory", "designer"]),

  // Company Information
  company_name: z.string().min(1, "Company name is required"),
  business_name: z.string().optional(),
  registration_number: z.string().optional(),

  // Contact Information
  primary_contact: z.string().min(1, "Primary contact is required"),
  primary_email: z.string().email("Invalid email address"),
  primary_phone: z.string().min(1, "Phone number is required"),
  website: z.string().url().optional().or(z.literal("")),

  // Address
  address_line1: z.string().min(1, "Address is required"),
  address_line2: z.string().optional(),
  city: z.string().min(1, "City is required"),
  state: z.string().optional(),
  postal_code: z.string().min(1, "Postal code is required"),
  country: z.string().min(1, "Country is required"),

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
        type: z.enum(["factory", "designer", "all"]).optional().default("all"),
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
    // Add contact to partner
    create: protectedProcedure
      .input(partnerContactSchema)
      .mutation(async ({ ctx, input }) => {
        const contact = await ctx.db.partner_contacts.create({
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
        const contact = await ctx.db.partner_contacts.update({
          where: { id },
          data,
        });
        return contact;
      }),

    // Delete contact
    delete: protectedProcedure
      .input(z.object({ id: z.string().uuid() }))
      .mutation(async ({ ctx, input }) => {
        await ctx.db.partner_contacts.delete({
          where: { id: input.id },
        });
        return { success: true };
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
        type: z.enum(["factory", "designer", "all"]).optional().default("all"),
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
});
