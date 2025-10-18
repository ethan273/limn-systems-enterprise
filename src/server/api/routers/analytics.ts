import { z } from 'zod';
import { createTRPCRouter, publicProcedure } from '../trpc/init';
import { Prisma } from '@prisma/client';

/**
 * Analytics Router
 *
 * Provides comprehensive analytics and reporting capabilities:
 * - Revenue analytics (sales, invoices, payments)
 * - Production analytics (orders, throughput, efficiency)
 * - Quality analytics (defects, pass rates, rejections)
 * - Custom reports with flexible filtering
 */

// ============================================================================
// INPUT SCHEMAS
// ============================================================================

const dateRangeSchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  period: z.enum(['day', 'week', 'month', 'quarter', 'year']).optional(),
});

const filterSchema = z.object({
  customerId: z.string().uuid().optional(),
  productId: z.string().uuid().optional(),
  status: z.string().optional(),
  category: z.string().optional(),
});

// ============================================================================
// ANALYTICS ROUTER
// ============================================================================

export const analyticsRouter = createTRPCRouter({

  // ==========================================================================
  // REVENUE ANALYTICS
  // ==========================================================================

  /**
   * Get revenue overview with key metrics
   */
  getRevenueOverview: publicProcedure
    .input(dateRangeSchema)
    .query(async ({ ctx, input }) => {
      const { startDate, endDate } = input;

      const dateFilter = {
        ...(startDate && { gte: new Date(startDate) }),
        ...(endDate && { lte: new Date(endDate) }),
      };

      // Total revenue from paid invoices
      // Note: aggregate not supported by wrapper, using findMany + manual aggregation
      // Note: select not supported by wrapper, fetching full records
      const paidInvoices = await (ctx.db as any).production_invoices.findMany({
        where: {
          status: 'paid',
          ...(Object.keys(dateFilter).length > 0 && { payment_date: dateFilter }),
        },
      });
      const revenueData = {
        _sum: {
          total_amount: paidInvoices.reduce((sum: number, inv: any) => sum + (Number(inv.total_amount) || 0), 0),
          amount_paid: paidInvoices.reduce((sum: number, inv: any) => sum + (Number(inv.amount_paid) || 0), 0),
        },
        _count: {
          id: paidInvoices.length,
        },
      };

      // Outstanding invoices
      // Note: aggregate not supported by wrapper, using findMany + manual aggregation
      // Note: select not supported by wrapper, fetching full records
      const outstandingInvoices = await (ctx.db as any).production_invoices.findMany({
        where: {
          status: { in: ['sent', 'pending'] },
          ...(Object.keys(dateFilter).length > 0 && { invoice_date: dateFilter }),
        },
      });
      const outstandingData = {
        _sum: {
          total_amount: outstandingInvoices.reduce((sum: number, inv: any) => sum + (Number(inv.total_amount) || 0), 0),
        },
        _count: {
          id: outstandingInvoices.length,
        },
      };

      // Average invoice value
      const avgInvoiceValue = revenueData._count.id > 0
        ? (Number(revenueData._sum.total_amount) || 0) / revenueData._count.id
        : 0;

      return {
        totalRevenue: Number(revenueData._sum.total_amount) || 0,
        paidAmount: Number(revenueData._sum.amount_paid) || 0,
        outstandingAmount: Number(outstandingData._sum.total_amount) || 0,
        invoiceCount: revenueData._count.id,
        outstandingCount: outstandingData._count.id,
        averageInvoiceValue: avgInvoiceValue,
      };
    }),

  /**
   * Get revenue trends over time
   */
  getRevenueTrends: publicProcedure
    .input(dateRangeSchema.extend({
      groupBy: z.enum(['day', 'week', 'month']).default('month'),
    }))
    .query(async ({ ctx, input }) => {
      const { startDate, endDate, groupBy } = input;

      // Build raw SQL for date grouping
      let dateGroupSql: string;
      switch (groupBy) {
        case 'day':
          dateGroupSql = `DATE_TRUNC('day', invoice_date)`;
          break;
        case 'week':
          dateGroupSql = `DATE_TRUNC('week', invoice_date)`;
          break;
        case 'month':
        default:
          dateGroupSql = `DATE_TRUNC('month', invoice_date)`;
          break;
      }

      const whereClause: string[] = [];
      if (startDate) whereClause.push(`invoice_date >= '${startDate}'`);
      if (endDate) whereClause.push(`invoice_date <= '${endDate}'`);
      const whereSql = whereClause.length > 0 ? `WHERE ${whereClause.join(' AND ')}` : '';

      const trends = await (ctx.db as any).$queryRaw<Array<{
        period: Date;
        revenue: number;
        invoice_count: bigint;
      }>>`
        SELECT
          ${Prisma.raw(dateGroupSql)} as period,
          COALESCE(SUM(total_amount), 0)::numeric as revenue,
          COUNT(*)::bigint as invoice_count
        FROM production_invoices
        ${Prisma.raw(whereSql)}
        GROUP BY period
        ORDER BY period ASC
      `;

      return trends.map(t => ({
        period: t.period.toISOString(),
        revenue: Number(t.revenue),
        invoiceCount: Number(t.invoice_count),
      }));
    }),

  /**
   * Get revenue by customer (top customers)
   */
  getRevenueByCustomer: publicProcedure
    .input(dateRangeSchema.extend({
      limit: z.number().min(1).max(100).default(10),
    }))
    .query(async ({ ctx, input }) => {
      const { startDate, endDate, limit } = input;

      const whereClause: string[] = [];
      if (startDate) whereClause.push(`pi.invoice_date >= '${startDate}'`);
      if (endDate) whereClause.push(`pi.invoice_date <= '${endDate}'`);
      const whereSql = whereClause.length > 0 ? `WHERE ${whereClause.join(' AND ')}` : '';

      const customerRevenue = await (ctx.db as any).$queryRaw<Array<{
        customer_id: string;
        customer_name: string;
        revenue: number;
        invoice_count: bigint;
      }>>`
        SELECT
          c.id as customer_id,
          c.name as customer_name,
          COALESCE(SUM(pi.total_amount), 0)::numeric as revenue,
          COUNT(pi.id)::bigint as invoice_count
        FROM customers c
        JOIN projects p ON p.customer_id = c.id
        JOIN production_orders po ON po.project_id = p.id
        JOIN production_invoices pi ON pi.order_id = po.id
        ${Prisma.raw(whereSql)}
        GROUP BY c.id, c.name
        ORDER BY revenue DESC
        LIMIT ${limit}
      `;

      return customerRevenue.map(cr => ({
        customerId: cr.customer_id,
        customerName: cr.customer_name,
        revenue: Number(cr.revenue),
        invoiceCount: Number(cr.invoice_count),
      }));
    }),

  // ==========================================================================
  // PRODUCTION ANALYTICS
  // ==========================================================================

  /**
   * Get production overview metrics
   */
  getProductionOverview: publicProcedure
    .input(dateRangeSchema)
    .query(async ({ ctx, input }) => {
      const { startDate, endDate } = input;

      const dateFilter = {
        ...(startDate && { gte: new Date(startDate) }),
        ...(endDate && { lte: new Date(endDate) }),
      };

      // Total orders
      // Note: aggregate not supported by wrapper, using count() for simple counts
      const ordersCount = await (ctx.db as any).production_orders.count({
        where: {
          ...(Object.keys(dateFilter).length > 0 && { created_at: dateFilter }),
        },
      });
      const ordersData = {
        _count: {
          id: ordersCount,
        },
      };

      // Orders by status
      // Note: groupBy not supported by wrapper, using findMany + manual grouping
      // Note: select not supported by wrapper, fetching full records
      const allOrders = await (ctx.db as any).production_orders.findMany({
        where: {
          ...(Object.keys(dateFilter).length > 0 && { created_at: dateFilter }),
        },
      });
      const statusGroups = allOrders.reduce((acc: Record<string, number>, order: any) => {
        const status = order.status;
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      }, {});
      const statusCounts = Object.entries(statusGroups).map(([status, count]) => ({
        status,
        _count: { id: count },
      }));

      // Average production time (completed orders only)
      // Note: select not supported by wrapper, fetching full records
      const completedOrders = await ctx.db.production_orders.findMany({
        where: {
          status: 'completed',
          completed_at: { not: null },
          ...(Object.keys(dateFilter).length > 0 && { created_at: dateFilter }),
        },
      });

      let avgProductionDays = 0;
      if (completedOrders.length > 0) {
        const totalDays = completedOrders.reduce((sum, order) => {
          const start = new Date(order.created_at).getTime();
          const end = new Date(order.completed_at!).getTime();
          const days = (end - start) / (1000 * 60 * 60 * 24);
          return sum + days;
        }, 0);
        avgProductionDays = totalDays / completedOrders.length;
      }

      return {
        totalOrders: ordersData._count.id,
        statusBreakdown: statusCounts.map(s => ({
          status: s.status,
          count: Number(s._count.id),
        })),
        averageProductionDays: Math.round(avgProductionDays * 10) / 10,
        completedCount: completedOrders.length,
      };
    }),

  /**
   * Get production throughput trends
   */
  getProductionThroughput: publicProcedure
    .input(dateRangeSchema.extend({
      groupBy: z.enum(['day', 'week', 'month']).default('month'),
    }))
    .query(async ({ ctx, input }) => {
      const { startDate, endDate, groupBy } = input;

      let dateGroupSql: string;
      switch (groupBy) {
        case 'day':
          dateGroupSql = `DATE_TRUNC('day', created_at)`;
          break;
        case 'week':
          dateGroupSql = `DATE_TRUNC('week', created_at)`;
          break;
        case 'month':
        default:
          dateGroupSql = `DATE_TRUNC('month', created_at)`;
          break;
      }

      const whereClause: string[] = [];
      if (startDate) whereClause.push(`created_at >= '${startDate}'`);
      if (endDate) whereClause.push(`created_at <= '${endDate}'`);
      const whereSql = whereClause.length > 0 ? `WHERE ${whereClause.join(' AND ')}` : '';

      const throughput = await (ctx.db as any).$queryRaw<Array<{
        period: Date;
        orders_created: bigint;
        orders_completed: bigint;
      }>>`
        SELECT
          ${Prisma.raw(dateGroupSql)} as period,
          COUNT(*)::bigint as orders_created,
          COUNT(CASE WHEN status = 'completed' THEN 1 END)::bigint as orders_completed
        FROM production_orders
        ${Prisma.raw(whereSql)}
        GROUP BY period
        ORDER BY period ASC
      `;

      return throughput.map(t => ({
        period: t.period.toISOString(),
        ordersCreated: Number(t.orders_created),
        ordersCompleted: Number(t.orders_completed),
      }));
    }),

  /**
   * Get production efficiency metrics
   */
  getProductionEfficiency: publicProcedure
    .input(dateRangeSchema)
    .query(async ({ ctx, input }) => {
      const { startDate, endDate } = input;

      const whereClause: string[] = [];
      if (startDate) whereClause.push(`created_at >= '${startDate}'`);
      if (endDate) whereClause.push(`created_at <= '${endDate}'`);
      const whereSql = whereClause.length > 0 ? `WHERE ${whereClause.join(' AND ')}` : '';

      const efficiency = await (ctx.db as any).$queryRaw<Array<{
        total_orders: bigint;
        on_time: bigint;
        delayed: bigint;
        avg_delay_days: number;
      }>>`
        SELECT
          COUNT(*)::bigint as total_orders,
          COUNT(CASE WHEN completed_at <= estimated_ship_date THEN 1 END)::bigint as on_time,
          COUNT(CASE WHEN completed_at > estimated_ship_date THEN 1 END)::bigint as delayed,
          COALESCE(
            AVG(
              CASE
                WHEN completed_at > estimated_ship_date
                THEN EXTRACT(EPOCH FROM (completed_at - estimated_ship_date)) / 86400
              END
            ),
            0
          )::numeric as avg_delay_days
        FROM production_orders
        ${Prisma.raw(whereSql)}
        AND status = 'completed'
        AND estimated_ship_date IS NOT NULL
        AND completed_at IS NOT NULL
      `;

      const result = efficiency[0] || {
        total_orders: BigInt(0),
        on_time: BigInt(0),
        delayed: BigInt(0),
        avg_delay_days: 0,
      };

      const totalOrders = Number(result.total_orders);
      const onTimeRate = totalOrders > 0
        ? (Number(result.on_time) / totalOrders) * 100
        : 0;

      return {
        totalOrders,
        onTime: Number(result.on_time),
        delayed: Number(result.delayed),
        onTimeRate: Math.round(onTimeRate * 10) / 10,
        avgDelayDays: Math.round(Number(result.avg_delay_days) * 10) / 10,
      };
    }),

  // ==========================================================================
  // QUALITY ANALYTICS
  // ==========================================================================

  /**
   * Get quality overview metrics
   */
  getQualityOverview: publicProcedure
    .input(dateRangeSchema)
    .query(async ({ ctx, input }) => {
      const { startDate, endDate } = input;

      const dateFilter = {
        ...(startDate && { gte: new Date(startDate) }),
        ...(endDate && { lte: new Date(endDate) }),
      };

      // Total inspections
      // Note: aggregate not supported by wrapper, using count() for simple counts
      const inspectionsCount = await (ctx.db as any).qc_inspections.count({
        where: {
          ...(Object.keys(dateFilter).length > 0 && { inspection_date: dateFilter }),
        },
      });
      const inspectionsData = {
        _count: {
          id: inspectionsCount,
        },
      };

      // Inspections by result
      // Note: groupBy not supported by wrapper, using findMany + manual grouping
      // Note: select not supported by wrapper, fetching full records
      const allInspections = await (ctx.db as any).qc_inspections.findMany({
        where: {
          ...(Object.keys(dateFilter).length > 0 && { inspection_date: dateFilter }),
        },
      });
      const resultGroups = allInspections.reduce((acc: Record<string, number>, inspection: any) => {
        const result = inspection.result;
        acc[result] = (acc[result] || 0) + 1;
        return acc;
      }, {});
      const resultCounts = Object.entries(resultGroups).map(([result, count]) => ({
        result,
        _count: { id: count },
      }));

      // Defect analysis
      // Note: aggregate not supported by wrapper, using count() for simple counts
      const defectCount = await (ctx.db as any).qc_defects.count({
        where: {
          qc_inspections: {
            ...(Object.keys(dateFilter).length > 0 && { inspection_date: dateFilter }),
          },
        },
      });
      const defectData = {
        _count: {
          id: defectCount,
        },
      };

      const totalInspections = inspectionsData._count.id;
      const passedCount = Number(resultCounts.find(r => r.result === 'passed')?._count.id || 0);
      const passRate = totalInspections > 0 ? (passedCount / totalInspections) * 100 : 0;

      return {
        totalInspections,
        resultBreakdown: resultCounts.map(r => ({
          result: r.result,
          count: r._count.id,
        })),
        passRate: Math.round(passRate * 10) / 10,
        totalDefects: defectData._count.id,
      };
    }),

  /**
   * Get defect trends over time
   */
  getDefectTrends: publicProcedure
    .input(dateRangeSchema.extend({
      groupBy: z.enum(['day', 'week', 'month']).default('month'),
    }))
    .query(async ({ ctx, input }) => {
      const { startDate, endDate, groupBy } = input;

      let dateGroupSql: string;
      switch (groupBy) {
        case 'day':
          dateGroupSql = `DATE_TRUNC('day', qi.inspection_date)`;
          break;
        case 'week':
          dateGroupSql = `DATE_TRUNC('week', qi.inspection_date)`;
          break;
        case 'month':
        default:
          dateGroupSql = `DATE_TRUNC('month', qi.inspection_date)`;
          break;
      }

      const whereClause: string[] = [];
      if (startDate) whereClause.push(`qi.inspection_date >= '${startDate}'`);
      if (endDate) whereClause.push(`qi.inspection_date <= '${endDate}'`);
      const whereSql = whereClause.length > 0 ? `WHERE ${whereClause.join(' AND ')}` : '';

      const trends = await (ctx.db as any).$queryRaw<Array<{
        period: Date;
        defect_count: bigint;
        inspection_count: bigint;
      }>>`
        SELECT
          ${Prisma.raw(dateGroupSql)} as period,
          COUNT(qd.id)::bigint as defect_count,
          COUNT(DISTINCT qi.id)::bigint as inspection_count
        FROM qc_inspections qi
        LEFT JOIN qc_defects qd ON qd.inspection_id = qi.id
        ${Prisma.raw(whereSql)}
        GROUP BY period
        ORDER BY period ASC
      `;

      return trends.map(t => ({
        period: t.period.toISOString(),
        defectCount: Number(t.defect_count),
        inspectionCount: Number(t.inspection_count),
        defectRate: Number(t.inspection_count) > 0
          ? (Number(t.defect_count) / Number(t.inspection_count)) * 100
          : 0,
      }));
    }),

  /**
   * Get defects by category
   */
  getDefectsByCategory: publicProcedure
    .input(dateRangeSchema.extend({
      limit: z.number().min(1).max(50).default(10),
    }))
    .query(async ({ ctx, input }) => {
      const { startDate, endDate, limit } = input;

      const whereClause: string[] = [];
      if (startDate) whereClause.push(`qi.inspection_date >= '${startDate}'`);
      if (endDate) whereClause.push(`qi.inspection_date <= '${endDate}'`);
      const whereSql = whereClause.length > 0 ? `WHERE ${whereClause.join(' AND ')}` : '';

      const categories = await (ctx.db as any).$queryRaw<Array<{
        category: string;
        defect_count: bigint;
      }>>`
        SELECT
          qd.category,
          COUNT(*)::bigint as defect_count
        FROM qc_defects qd
        JOIN qc_inspections qi ON qi.id = qd.inspection_id
        ${Prisma.raw(whereSql)}
        GROUP BY qd.category
        ORDER BY defect_count DESC
        LIMIT ${limit}
      `;

      return categories.map(c => ({
        category: c.category || 'Uncategorized',
        defectCount: Number(c.defect_count),
      }));
    }),

  // ==========================================================================
  // CUSTOM REPORTS
  // ==========================================================================

  /**
   * Generate custom report with flexible filtering
   */
  generateCustomReport: publicProcedure
    .input(z.object({
      reportType: z.enum(['revenue', 'production', 'quality', 'inventory']),
      dateRange: dateRangeSchema,
      filters: filterSchema.optional(),
      groupBy: z.string().optional(),
      metrics: z.array(z.string()).optional(),
    }))
    .query(async ({ ctx: _ctx, input }) => {
      // This is a flexible endpoint that can be expanded based on requirements
      // For now, redirect to specific analytics based on reportType

      const { reportType, dateRange: _dateRange } = input;

      switch (reportType) {
        case 'revenue':
          throw new Error('Custom revenue reports not yet implemented - use getRevenueOverview instead');
        case 'production':
          throw new Error('Custom production reports not yet implemented - use getProductionOverview instead');
        case 'quality':
          throw new Error('Custom quality reports not yet implemented - use getQualityOverview instead');
        default:
          throw new Error(`Report type ${reportType} not implemented`);
      }
    }),
});
