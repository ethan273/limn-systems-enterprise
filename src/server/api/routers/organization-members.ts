import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '../trpc/init';
import { TRPCError } from '@trpc/server';

/**
 * Organization Members Router
 *
 * Manages organization_members table using ctx.db pattern.
 * Covers multi-organization membership management.
 */

const memberStatusEnum = z.enum(['active', 'inactive', 'pending', 'suspended']);

export const organizationMembersRouter = createTRPCRouter({
  /**
   * Get member by ID
   */
  getById: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const member = await ctx.db.organization_members.findUnique({
        where: { id: input.id },
        select: {
          id: true,
          organization_id: true,
          user_id: true,
          organization_roles: true,
          status: true,
          is_primary_org: true,
          joined_at: true,
          invited_by: true,
          invitation_accepted_at: true,
          created_at: true,
          updated_at: true,
          users_organization_members_user_idTousers: {
            select: { id: true, name: true, email: true },
          },
          users_organization_members_invited_byTousers: {
            select: { id: true, name: true },
          },
        },
      });

      if (!member) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Organization member not found',
        });
      }

      return member;
    }),

  /**
   * Get all members for organization
   */
  getByOrganization: protectedProcedure
    .input(
      z.object({
        organization_id: z.string().uuid(),
        limit: z.number().min(1).max(100).default(50),
        cursor: z.string().uuid().optional(),
        status: memberStatusEnum.optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { organization_id, limit, cursor, status } = input;

      const where: any = { organization_id };

      if (status) {
        where.status = status;
      }

      const members = await ctx.db.organization_members.findMany({
        where,
        take: limit + 1,
        cursor: cursor ? { id: cursor } : undefined,
        orderBy: { joined_at: 'desc' },
        select: {
          id: true,
          user_id: true,
          organization_roles: true,
          status: true,
          is_primary_org: true,
          joined_at: true,
          users_organization_members_user_idTousers: {
            select: { name: true, email: true },
          },
        },
      });

      let nextCursor: string | undefined;
      if (members.length > limit) {
        const nextItem = members.pop();
        nextCursor = nextItem?.id;
      }

      return {
        members,
        nextCursor,
      };
    }),

  /**
   * Get organizations for user
   */
  getByUser: protectedProcedure
    .input(
      z.object({
        user_id: z.string().uuid(),
        status: memberStatusEnum.optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const members = await ctx.db.organization_members.findMany({
        where: {
          user_id: input.user_id,
          ...(input.status && { status: input.status }),
        },
        orderBy: { joined_at: 'desc' },
        select: {
          id: true,
          organization_id: true,
          organization_roles: true,
          status: true,
          is_primary_org: true,
          joined_at: true,
        },
      });

      return members;
    }),

  /**
   * Get my organizations
   */
  getMy: protectedProcedure
    .input(
      z.object({
        status: memberStatusEnum.optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const members = await ctx.db.organization_members.findMany({
        where: {
          user_id: ctx.user!.id,
          ...(input.status && { status: input.status }),
        },
        orderBy: [
          { is_primary_org: 'desc' },
          { joined_at: 'desc' },
        ],
        select: {
          id: true,
          organization_id: true,
          organization_roles: true,
          status: true,
          is_primary_org: true,
          joined_at: true,
        },
      });

      return members;
    }),

  /**
   * Add member to organization
   */
  create: protectedProcedure
    .input(
      z.object({
        organization_id: z.string().uuid(),
        user_id: z.string().uuid(),
        organization_roles: z.array(z.string()).default([]),
        is_primary_org: z.boolean().default(false),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Check if already exists
      const existing = await ctx.db.organization_members.findFirst({
        where: {
          organization_id: input.organization_id,
          user_id: input.user_id,
        },
      });

      if (existing) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'User is already a member of this organization',
        });
      }

      const newMember = await ctx.db.organization_members.create({
        data: {
          organization_id: input.organization_id,
          user_id: input.user_id,
          organization_roles: input.organization_roles,
          is_primary_org: input.is_primary_org,
          invited_by: ctx.user!.id,
          status: 'active',
          joined_at: new Date(),
          invitation_accepted_at: new Date(),
        },
        select: {
          id: true,
          organization_id: true,
          user_id: true,
          organization_roles: true,
          status: true,
          joined_at: true,
        },
      });

      return newMember;
    }),

  /**
   * Update member roles
   */
  updateRoles: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        organization_roles: z.array(z.string()),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const updatedMember = await ctx.db.organization_members.update({
        where: { id: input.id },
        data: {
          organization_roles: input.organization_roles,
          updated_at: new Date(),
        },
        select: {
          id: true,
          user_id: true,
          organization_roles: true,
          updated_at: true,
        },
      });

      return updatedMember;
    }),

  /**
   * Update member status
   */
  updateStatus: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        status: memberStatusEnum,
      })
    )
    .mutation(async ({ ctx, input }) => {
      const updatedMember = await ctx.db.organization_members.update({
        where: { id: input.id },
        data: {
          status: input.status,
          updated_at: new Date(),
        },
        select: {
          id: true,
          user_id: true,
          status: true,
          updated_at: true,
        },
      });

      return updatedMember;
    }),

  /**
   * Set primary organization
   */
  setPrimary: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const member = await ctx.db.organization_members.findUnique({
        where: { id: input.id },
        select: { user_id: true },
      });

      if (!member) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Member not found',
        });
      }

      // Unset all other primary orgs for this user
      await ctx.db.organization_members.updateMany({
        where: {
          user_id: member.user_id,
          is_primary_org: true,
        },
        data: {
          is_primary_org: false,
          updated_at: new Date(),
        },
      });

      // Set this one as primary
      const updatedMember = await ctx.db.organization_members.update({
        where: { id: input.id },
        data: {
          is_primary_org: true,
          updated_at: new Date(),
        },
        select: {
          id: true,
          organization_id: true,
          is_primary_org: true,
        },
      });

      return updatedMember;
    }),

  /**
   * Remove member
   */
  remove: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.organization_members.delete({
        where: { id: input.id },
      });

      return { success: true };
    }),

  /**
   * Get organization statistics
   */
  getStats: protectedProcedure
    .input(z.object({ organization_id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const [total, byStatus] = await Promise.all([
        ctx.db.organization_members.count({
          where: { organization_id: input.organization_id },
        }),
        ctx.db.organization_members.groupBy({
          by: ['status'],
          where: { organization_id: input.organization_id },
          _count: true,
        }),
      ]);

      return {
        total,
        byStatus: byStatus.map(s => ({
          status: s.status,
          count: s._count,
        })),
      };
    }),
});
