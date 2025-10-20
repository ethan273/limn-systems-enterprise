import { z } from 'zod';
import { createTRPCRouter, publicProcedure } from '../trpc/init';

// ============================================================================
// SCHEMAS
// ============================================================================

const createMilestoneSchema = z.object({
  production_order_id: z.string().uuid(),
  milestone_name: z.string().min(1),
  milestone_type: z.enum(['shop_drawings', 'material_sourcing', 'production', 'qc', 'packing', 'shipping']),
  planned_date: z.date().optional(),
  notes: z.string().optional(),
});

const updateMilestoneSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(['pending', 'in_progress', 'completed', 'blocked']).optional(),
  completion_percentage: z.number().min(0).max(100).optional(),
  actual_date: z.date().optional(),
  notes: z.string().optional(),
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Calculate overall production progress for an order
 */
function calculateOrderProgress(milestones: any[]): number {
  if (!milestones || milestones.length === 0) return 0;

  const totalProgress = milestones.reduce((sum: number, m) => sum + (m.completion_percentage || 0), 0);
  return Math.round(totalProgress / milestones.length);
}

/**
 * Determine order timeline status (on_track, at_risk, delayed)
 */
function getTimelineStatus(order: any, milestones: any[]): string {
  if (!order.estimated_ship_date) return 'unknown';

  const now = new Date();
  const shipDate = new Date(order.estimated_ship_date);
  const daysUntilShip = Math.ceil((shipDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  // Check if any milestones are delayed
  const hasDelayedMilestones = milestones.some(m => {
    if (!m.planned_date || !m.actual_date) return false;
    return new Date(m.actual_date) > new Date(m.planned_date);
  });

  if (hasDelayedMilestones || daysUntilShip < 0) return 'delayed';
  if (daysUntilShip < 7) return 'at_risk';
  return 'on_track';
}

// ============================================================================
// ROUTER
// ============================================================================

export const productionTrackingRouter = createTRPCRouter({

  // Get dashboard statistics and KPIs
  getDashboardStats: publicProcedure
    .input(z.object({
      date_range: z.enum(['7d', '30d', '90d', 'all']).default('30d'),
    }))
    .query(async ({ ctx, input }) => {
      // Calculate date filter
      let dateFilter: Date | undefined;
      if (input.date_range !== 'all') {
        const days = parseInt(input.date_range.replace('d', ''));
        const now = new Date();
        now.setDate(now.getDate() - days);
        // Use UTC to avoid timezone format issues with PostgreSQL
        dateFilter = new Date(Date.UTC(
          now.getUTCFullYear(),
          now.getUTCMonth(),
          now.getUTCDate(),
          0, 0, 0, 0
        ));
      }

      // Get all production orders with filters
      const orders = await ctx.db.production_orders.findMany({
        where: {
          ...(dateFilter && {
            order_date: {
              gte: dateFilter,
            },
          }),
        },
        include: {
          production_milestones: true,
          production_invoices: true,
        },
      });

      // Calculate KPIs
      const totalOrders = orders.length;
      const inProgress = orders.filter(o => o.status === 'in_progress').length;
      const completed = orders.filter(o => o.status === 'completed' || o.status === 'final_paid' || o.status === 'shipped' || o.status === 'delivered').length;
      const awaitingDeposit = orders.filter(o => o.status === 'awaiting_deposit').length;
      const awaitingFinalPayment = orders.filter(o => o.status === 'awaiting_final_payment').length;

      // Calculate revenue
      const totalRevenue = orders.reduce((sum: number, o) => sum + Number(o.total_cost), 0);
      const paidRevenue = orders
        .filter(o => o.final_payment_paid)
        .reduce((sum: number, o) => sum + Number(o.total_cost), 0);
      const pendingRevenue = totalRevenue - paidRevenue;

      // Status distribution
      const statusDistribution = orders.reduce((acc, order) => {
        acc[order.status] = (acc[order.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Timeline status distribution
      const timelineDistribution = {
        on_track: 0,
        at_risk: 0,
        delayed: 0,
        unknown: 0,
      };

      orders.forEach(order => {
        const status = getTimelineStatus(order, order.production_milestones || []);
        timelineDistribution[status as keyof typeof timelineDistribution]++;
      });

      // Recent activity (orders created in last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const recentOrders = orders.filter(o => new Date(o.created_at) >= sevenDaysAgo).length;

      return {
        totalOrders,
        inProgress,
        completed,
        awaitingDeposit,
        awaitingFinalPayment,
        totalRevenue,
        paidRevenue,
        pendingRevenue,
        statusDistribution,
        timelineDistribution,
        recentOrders,
        completionRate: totalOrders > 0 ? Math.round((completed / totalOrders) * 100) : 0,
      };
    }),

  // Get production progress for all orders
  getProductionProgress: publicProcedure
    .input(z.object({
      status: z.string().optional(),
      timeline_status: z.enum(['on_track', 'at_risk', 'delayed']).optional(),
      limit: z.number().min(1).max(100).default(50),
      offset: z.number().min(0).default(0),
    }))
    .query(async ({ ctx, input }) => {
      const orders = await ctx.db.production_orders.findMany({
        where: {
          ...(input.status && { status: input.status }),
        },
        include: {
          production_milestones: {
            orderBy: { planned_date: 'asc' },
          },
          projects: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        take: input.limit,
        skip: input.offset,
        orderBy: { order_date: 'desc' },
      });

      // Calculate progress and filter by timeline status if needed
      const ordersWithProgress = orders.map(order => {
        const progress = calculateOrderProgress(order.production_milestones || []);
        const timelineStatus = getTimelineStatus(order, order.production_milestones || []);

        return {
          ...order,
          overall_progress: progress,
          timeline_status: timelineStatus,
          total_milestones: order.production_milestones?.length || 0,
          completed_milestones: order.production_milestones?.filter((m: any) => m.status === 'completed').length || 0,
        };
      }).filter(order => {
        if (!input.timeline_status) return true;
        return order.timeline_status === input.timeline_status;
      });

      return {
        items: ordersWithProgress,
        total: ordersWithProgress.length,
        hasMore: orders.length === input.limit,
      };
    }),

  // Get milestones for a specific production order
  getMilestones: publicProcedure
    .input(z.object({
      production_order_id: z.string().uuid(),
    }))
    .query(async ({ ctx, input }) => {
      return ctx.db.production_milestones.findMany({
        where: {
          production_order_id: input.production_order_id,
        },
        orderBy: { planned_date: 'asc' },
      });
    }),

  // Create a new milestone
  createMilestone: publicProcedure
    .input(createMilestoneSchema)
    .mutation(async ({ ctx, input }) => {
      return ctx.db.production_milestones.create({
        data: {
          production_order_id: input.production_order_id,
          milestone_name: input.milestone_name,
          milestone_type: input.milestone_type,
          planned_date: input.planned_date,
          notes: input.notes,
          status: 'pending',
          completion_percentage: 0,
          created_by: ctx.session?.user?.id,
        },
      });
    }),

  // Update milestone status and progress
  updateMilestone: publicProcedure
    .input(updateMilestoneSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, ...updateData } = input;

      return ctx.db.production_milestones.update({
        where: { id },
        data: updateData,
      });
    }),

  // Delete milestone
  deleteMilestone: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.production_milestones.delete({
        where: { id: input.id },
      });
    }),

  // Auto-create default milestones for a production order
  createDefaultMilestones: publicProcedure
    .input(z.object({
      production_order_id: z.string().uuid(),
    }))
    .mutation(async ({ ctx, input }) => {
      const order = await ctx.db.production_orders.findUnique({
        where: { id: input.production_order_id },
      });

      if (!order) {
        throw new Error('Production order not found');
      }

      // Define default milestone sequence
      const defaultMilestones = [
        { name: 'Shop Drawings', type: 'shop_drawings', days: 7 },
        { name: 'Material Sourcing', type: 'material_sourcing', days: 14 },
        { name: 'Production', type: 'production', days: 30 },
        { name: 'Quality Check', type: 'qc', days: 45 },
        { name: 'Packing', type: 'packing', days: 50 },
        { name: 'Ready for Shipping', type: 'shipping', days: 55 },
      ];

      const baseDate = new Date(order.order_date);
      const milestonesToCreate = defaultMilestones.map((m: any) => {
        const plannedDate = new Date(baseDate);
        plannedDate.setDate(plannedDate.getDate() + m.days);

        return {
          production_order_id: input.production_order_id,
          milestone_name: m.name,
          milestone_type: m.type,
          planned_date: plannedDate,
          status: 'pending',
          completion_percentage: 0,
          created_by: ctx.session?.user?.id,
        };
      });

      await ctx.db.production_milestones.createMany({
        data: milestonesToCreate,
      });

      return {
        created: milestonesToCreate.length,
        message: `Created ${milestonesToCreate.length} default milestones`,
      };
    }),
});
