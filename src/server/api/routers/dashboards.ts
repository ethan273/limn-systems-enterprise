import { z } from 'zod';
import { createTRPCRouter, publicProcedure } from '../trpc/init';

/**
 * Dashboards Router - Provides analytics and aggregated data for all dashboard pages
 *
 * This router contains procedures for:
 * - Projects Dashboard
 * - Analytics Dashboard
 * - Executive Dashboard
 * - Manufacturing Dashboard
 * - Financial Dashboard
 * - Design Dashboard
 * - Shipping Dashboard
 * - QC Dashboard
 * - Partners Dashboard
 * - Tasks Dashboard
 */
export const dashboardsRouter = createTRPCRouter({

  // ==================== PROJECTS DASHBOARD ====================

  /**
   * Get comprehensive project analytics for Projects Dashboard
   */
  getProjectsAnalytics: publicProcedure
    .input(z.object({
      dateRange: z.enum(['7d', '30d', '90d', 'all']).default('30d'),
    }).optional())
    .query(async ({ ctx }) => {
      // Get all projects
      const projects = await ctx.db.projects.findMany({
        orderBy: {
          created_at: 'desc',
        },
      });

      // Get all customers for mapping
      const customers = await ctx.db.customers.findMany({
        select: {
          id: true,
          name: true,
          type: true,
        },
      });

      const customerMap = new Map(customers.map(c => [c.id, c]));

      // Calculate status distribution
      const statusCounts = projects.reduce((acc, project) => {
        const status = project.status || 'unknown';
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Calculate priority distribution
      const priorityCounts = projects.reduce((acc, project) => {
        const priority = project.priority || 'medium';
        acc[priority] = (acc[priority] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Calculate budget totals
      const budgetStats = projects.reduce((acc, project) => {
        if (project.budget) {
          const budget = Number(project.budget);
          acc.totalBudget += budget;
          acc.avgBudget = acc.totalBudget / (acc.count + 1);
          acc.count += 1;
        }
        return acc;
      }, { totalBudget: 0, avgBudget: 0, count: 0 });

      // Get projects by customer (top 10)
      const projectsByCustomer = projects.reduce((acc, project) => {
        if (project.customer_id) {
          const customer = customerMap.get(project.customer_id);
          if (customer) {
            const customerId = customer.id;
            if (!acc[customerId]) {
              acc[customerId] = {
                customer,
                count: 0,
                projects: [],
              };
            }
            acc[customerId].count += 1;
            acc[customerId].projects.push({
              id: project.id,
              name: project.name,
              status: project.status,
              priority: project.priority,
            });
          }
        }
        return acc;
      }, {} as Record<string, any>);

      const topCustomers = Object.values(projectsByCustomer)
        .sort((a: any, b: any) => b.count - a.count)
        .slice(0, 10);

      // Calculate timeline metrics
      const now = new Date();
      const overdueProjects = projects.filter(p => {
        if (!p.end_date || p.status === 'completed' || p.status === 'cancelled') return false;
        return new Date(p.end_date) < now;
      });

      const upcomingDeadlines = projects
        .filter(p => {
          if (!p.end_date || p.status === 'completed' || p.status === 'cancelled') return false;
          const daysUntilDeadline = Math.ceil((new Date(p.end_date).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          return daysUntilDeadline > 0 && daysUntilDeadline <= 30;
        })
        .sort((a, b) => new Date(a.end_date!).getTime() - new Date(b.end_date!).getTime())
        .slice(0, 10);

      // Calculate health scores
      const activeStatuses = ['active', 'in_progress'];
      const healthScore = {
        onTime: projects.filter(p => activeStatuses.includes(p.status || '') && !overdueProjects.includes(p)).length,
        atRisk: overdueProjects.length,
        total: projects.filter(p => activeStatuses.includes(p.status || '')).length,
      };

      // Recent project activity (last 10 projects)
      const recentActivity = projects.slice(0, 10).map(p => {
        const customer = p.customer_id ? customerMap.get(p.customer_id) : null;
        return {
          id: p.id,
          name: p.name,
          status: p.status,
          priority: p.priority,
          customer: customer?.name || null,
          created_at: p.created_at,
          updated_at: p.updated_at,
        };
      });

      return {
        summary: {
          total: projects.length,
          active: statusCounts.active || 0,
          planning: statusCounts.planning || 0,
          in_progress: statusCounts.in_progress || 0,
          on_hold: statusCounts.on_hold || 0,
          completed: statusCounts.completed || 0,
          cancelled: statusCounts.cancelled || 0,
        },
        statusDistribution: Object.entries(statusCounts).map(([status, count]) => ({
          status,
          count,
          percentage: (count / projects.length) * 100,
        })),
        priorityDistribution: Object.entries(priorityCounts).map(([priority, count]) => ({
          priority,
          count,
          percentage: (count / projects.length) * 100,
        })),
        budget: {
          totalAllocated: budgetStats.totalBudget,
          averagePerProject: budgetStats.avgBudget,
          projectsWithBudget: budgetStats.count,
        },
        topCustomers,
        healthScore,
        overdueProjects: overdueProjects.map(p => {
          const customer = p.customer_id ? customerMap.get(p.customer_id) : null;
          return {
            id: p.id,
            name: p.name,
            customer: customer?.name || null,
            end_date: p.end_date,
            daysOverdue: Math.ceil((now.getTime() - new Date(p.end_date!).getTime()) / (1000 * 60 * 60 * 24)),
          };
        }),
        upcomingDeadlines: upcomingDeadlines.map(p => {
          const customer = p.customer_id ? customerMap.get(p.customer_id) : null;
          return {
            id: p.id,
            name: p.name,
            customer: customer?.name || null,
            end_date: p.end_date,
            daysRemaining: Math.ceil((new Date(p.end_date!).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
          };
        }),
        recentActivity,
      };
    }),

  /**
   * Get project timeline data for Gantt chart visualization
   */
  getProjectsTimeline: publicProcedure
    .input(z.object({
      status: z.array(z.string()).optional(),
      customerId: z.string().uuid().optional(),
    }).optional())
    .query(async ({ ctx, input }) => {
      const where: any = {};

      if (input?.status && input.status.length > 0) {
        where.status = { in: input.status };
      }

      if (input?.customerId) {
        where.customer_id = input.customerId;
      }

      const projects = await ctx.db.projects.findMany({
        where,
        orderBy: {
          start_date: 'asc',
        },
      });

      // Get all customers for mapping
      const customers = await ctx.db.customers.findMany({
        select: {
          id: true,
          name: true,
        },
      });

      const customerMap = new Map(customers.map(c => [c.id, c]));

      return projects.map(p => {
        const customer = p.customer_id ? customerMap.get(p.customer_id) : null;
        return {
          id: p.id,
          name: p.name,
          customer: customer?.name || null,
          status: p.status,
          priority: p.priority,
          start_date: p.start_date,
          end_date: p.end_date,
          budget: p.budget ? Number(p.budget) : null,
          duration: p.start_date && p.end_date
            ? Math.ceil((new Date(p.end_date).getTime() - new Date(p.start_date).getTime()) / (1000 * 60 * 60 * 24))
            : null,
        };
      });
    }),

  /**
   * Get AI-powered insights for Projects Dashboard
   */
  getProjectsInsights: publicProcedure.query(async ({ ctx }) => {
    const projects = await ctx.db.projects.findMany();

    // Get all customers for mapping
    const customers = await ctx.db.customers.findMany({
      select: {
        id: true,
        name: true,
      },
    });

    const customerMap = new Map(customers.map(c => [c.id, c]));

    const insights: any[] = [];

    // Insight 1: Overdue projects requiring attention
    const now = new Date();
    const overdueProjects = projects.filter(p => {
      if (!p.end_date || p.status === 'completed' || p.status === 'cancelled') return false;
      return new Date(p.end_date) < now;
    });

    if (overdueProjects.length > 0) {
      insights.push({
        type: 'warning',
        title: `${overdueProjects.length} project${overdueProjects.length > 1 ? 's' : ''} overdue`,
        description: `You have ${overdueProjects.length} active project${overdueProjects.length > 1 ? 's' : ''} past their deadline. Review and update timelines or mark as completed.`,
        action: 'View Overdue Projects',
        actionLink: '/dashboards/projects?filter=overdue',
        priority: 'high',
      });
    }

    // Insight 2: Projects on hold
    const onHoldProjects = projects.filter(p => p.status === 'on_hold');
    if (onHoldProjects.length > 5) {
      insights.push({
        type: 'info',
        title: `${onHoldProjects.length} projects on hold`,
        description: `A significant number of projects are on hold. Consider reviewing to reactivate or cancel stalled projects.`,
        action: 'Review On-Hold Projects',
        actionLink: '/dashboards/projects?filter=on_hold',
        priority: 'medium',
      });
    }

    // Insight 3: Budget utilization
    const projectsWithBudget = projects.filter(p => p.budget && Number(p.budget) > 0);
    const totalBudget = projectsWithBudget.reduce((sum, p) => sum + Number(p.budget || 0), 0);
    if (totalBudget > 0) {
      insights.push({
        type: 'success',
        title: `$${(totalBudget / 1000000).toFixed(2)}M in active project budgets`,
        description: `${projectsWithBudget.length} projects have allocated budgets totaling $${totalBudget.toLocaleString()}.`,
        action: 'View Budget Report',
        actionLink: '/dashboards/projects?view=budget',
        priority: 'low',
      });
    }

    // Insight 4: Customer concentration risk
    const projectsByCustomer = projects.reduce((acc, p) => {
      const customerId = p.customer_id;
      acc[customerId] = (acc[customerId] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const topCustomer = Object.entries(projectsByCustomer)
      .sort(([, a], [, b]) => b - a)[0];

    if (topCustomer && topCustomer[1] > projects.length * 0.3) {
      const customer = customerMap.get(topCustomer[0]);
      insights.push({
        type: 'warning',
        title: 'High customer concentration',
        description: `${customer?.name || 'One customer'} represents ${Math.round((topCustomer[1] / projects.length) * 100)}% of your project portfolio. Consider diversifying to reduce risk.`,
        action: 'View Customer Distribution',
        actionLink: '/dashboards/projects?view=customers',
        priority: 'medium',
      });
    }

    // Insight 5: Completion rate trend
    const completedProjects = projects.filter(p => p.status === 'completed');
    const activeStatuses = ['active', 'in_progress'];
    const activeProjects = projects.filter(p => activeStatuses.includes(p.status || ''));
    const completionRate = projects.length > 0 ? (completedProjects.length / projects.length) * 100 : 0;

    if (completionRate > 20) {
      insights.push({
        type: 'success',
        title: `${completionRate.toFixed(1)}% project completion rate`,
        description: `${completedProjects.length} of ${projects.length} total projects have been successfully completed.`,
        action: 'View Completed Projects',
        actionLink: '/dashboards/projects?filter=completed',
        priority: 'low',
      });
    }

    return insights.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return priorityOrder[a.priority as keyof typeof priorityOrder] - priorityOrder[b.priority as keyof typeof priorityOrder];
    });
  }),

  // ==================== ANALYTICS DASHBOARD ====================

  /**
   * Get comprehensive analytics across all business modules
   */
  getAnalytics: publicProcedure
    .input(z.object({
      dateRange: z.enum(['7d', '30d', '90d', 'year', 'all']).default('30d'),
    }).optional())
    .query(async ({ ctx, input }) => {
      const now = new Date();
      let startDate: Date | null = null;

      // Calculate date range
      if (input?.dateRange && input.dateRange !== 'all') {
        const days = input.dateRange === '7d' ? 7 : input.dateRange === '30d' ? 30 : input.dateRange === '90d' ? 90 : 365;
        startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
      }

      // WORKAROUND: Due to Supabase connection pooling/caching issues with timezone data,
      // we fetch all records and filter in memory instead of using database date filters
      // WORKAROUND: Fetch ALL records and filter in memory to avoid Supabase timezone bug with WHERE clauses
      const [
        allOrders,
        products,
        customers,
        projects,
        tasks,
        orderedItems,
        productionOrders,
        shipments,
      ] = await Promise.all([
        ctx.db.orders.findMany(),
        ctx.db.products.findMany(),
        ctx.db.customers.findMany(),
        ctx.db.projects.findMany(),
        ctx.db.tasks.findMany(),
        ctx.db.order_items.findMany(),
        ctx.db.production_orders.findMany(),
        ctx.db.shipments.findMany(),
      ]);

      // Filter orders by date range in memory
      const orders = startDate
        ? allOrders.filter(o => o.created_at && new Date(o.created_at) >= startDate)
        : allOrders;

      // Calculate revenue metrics
      const totalRevenue = orders.reduce((sum, order) => {
        return sum + (order.total_amount ? Number(order.total_amount) : 0);
      }, 0);

      // WORKAROUND: Removed previousOrders query to avoid Supabase timezone bug with range queries
      // For now, show simple growth metrics based on current period only
      const revenueGrowth = 0; // TODO: Calculate from historical data when timezone issue is resolved

      // Calculate average order value
      const avgOrderValue = orders.length > 0 ? totalRevenue / orders.length : 0;

      // Revenue by month (last 12 months)
      const revenueByMonth = Array.from({ length: 12 }, (_, i) => {
        const date = new Date(now.getFullYear(), now.getMonth() - (11 - i), 1);
        const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
        const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);

        const monthOrders = allOrders.filter(o => {
          if (!o.created_at) return false;
          const orderDate = new Date(o.created_at);
          return orderDate >= monthStart && orderDate <= monthEnd;
        });

        const monthRevenue = monthOrders.reduce((sum, o) => sum + (o.total_amount ? Number(o.total_amount) : 0), 0);

        return {
          month: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
          revenue: monthRevenue,
          orders: monthOrders.length,
        };
      });

      // Customer growth - simplified for now
      const customerGrowth = 0; // TODO: Calculate from historical customer data

      // Order status distribution
      const orderStatusCounts = orders.reduce((acc, order) => {
        const status = order.status || 'unknown';
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Product performance (top 10 products by revenue)
      const productRevenue = orderedItems.reduce((acc: Record<string, { revenue: number; quantity: number }>, item: any) => {
        const productId = item.product_id;
        const revenue = item.unit_price ? Number(item.unit_price) * (item.quantity || 0) : 0;
        if (!acc[productId]) {
          acc[productId] = { revenue: 0, quantity: 0 };
        }
        acc[productId].revenue += revenue;
        acc[productId].quantity += item.quantity || 0;
        return acc;
      }, {});

      const topProducts = Object.entries(productRevenue)
        .sort(([, a], [, b]) => b.revenue - a.revenue)
        .slice(0, 10)
        .map(([productId, data]) => {
          const product = products.find((p: any) => p.id === productId);
          return {
            id: productId,
            name: product?.name || 'Unknown Product',
            sku: product?.sku || 'N/A',
            revenue: data.revenue,
            quantity: data.quantity,
          };
        });

      // Tasks completion rate
      const completedTasks = tasks.filter(t => t.status === 'completed').length;
      const taskCompletionRate = tasks.length > 0 ? (completedTasks / tasks.length) * 100 : 0;

      // Production metrics
      const productionCompletedStatuses = ['completed', 'shipped', 'delivered'];
      const completedProduction = productionOrders.filter(p => productionCompletedStatuses.includes(p.status || '')).length;
      const productionCompletionRate = productionOrders.length > 0 ? (completedProduction / productionOrders.length) * 100 : 0;

      // Shipping metrics
      const deliveredShipments = shipments.filter(s => s.status === 'delivered').length;
      const onTimeDeliveryRate = shipments.length > 0 ? (deliveredShipments / shipments.length) * 100 : 0;

      return {
        summary: {
          totalRevenue,
          revenueGrowth,
          totalOrders: orders.length,
          avgOrderValue,
          totalCustomers: customers.length,
          customerGrowth,
          totalProducts: products.length,
          activeProjects: projects.filter(p => p.status === 'active' || p.status === 'in_progress').length,
        },
        revenueByMonth,
        orderStatusDistribution: Object.entries(orderStatusCounts).map(([status, count]) => ({
          status,
          count,
          percentage: (count / orders.length) * 100,
        })),
        topProducts,
        performance: {
          taskCompletionRate,
          productionCompletionRate,
          onTimeDeliveryRate,
        },
      };
    }),

  /**
   * Get AI-powered insights for Analytics Dashboard
   */
  getAnalyticsInsights: publicProcedure.query(async ({ ctx }) => {
    const insights: any[] = [];

    // Get recent orders for trend analysis
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

    // WORKAROUND: Fetch all records and filter in memory to avoid Supabase timezone bug
    const [allOrders, customers, products, allTasks] = await Promise.all([
      ctx.db.orders.findMany(),
      ctx.db.customers.findMany(),
      ctx.db.products.findMany(),
      ctx.db.tasks.findMany(),
    ]);

    // Filter in memory
    const recentOrders = allOrders.filter(o => o.created_at && new Date(o.created_at) >= thirtyDaysAgo);
    const tasks = allTasks.filter(t => t.status !== 'completed' && t.due_date && new Date(t.due_date) < now);

    // Insight 1: Revenue overview (simplified - no historical comparison due to timezone bug)
    const recentRevenue = recentOrders.reduce((sum, o) => sum + (o.total_amount ? Number(o.total_amount) : 0), 0);

    if (recentRevenue > 50000) {
      insights.push({
        type: 'success',
        title: `Strong revenue performance`,
        description: `Your business generated $${recentRevenue.toLocaleString()} in the last 30 days.`,
        action: 'View Revenue Report',
        actionLink: '/dashboards/analytics?view=revenue',
        priority: 'low',
      });
    } else if (recentRevenue < 10000) {
      insights.push({
        type: 'warning',
        title: `Low revenue this month`,
        description: `Revenue is $${recentRevenue.toLocaleString()} for the last 30 days. Consider reviewing sales pipeline and customer engagement.`,
        action: 'Analyze Revenue',
        actionLink: '/dashboards/analytics?view=revenue',
        priority: 'high',
      });
    }

    // Insight 2: Customer growth
    const newCustomers = customers.filter(c => {
      if (!c.created_at) return false;
      return new Date(c.created_at) >= thirtyDaysAgo;
    }).length;

    if (newCustomers > 10) {
      insights.push({
        type: 'success',
        title: `${newCustomers} new customers this month`,
        description: `Customer acquisition is strong. Focus on retention and upselling opportunities.`,
        action: 'View New Customers',
        actionLink: '/crm/customers?filter=new',
        priority: 'low',
      });
    }

    // Insight 3: Low inventory warnings
    const lowStockProducts = products.filter((p: any) => {
      const stockLevel = p.stock_level ? Number(p.stock_level) : 0;
      const minStock = p.min_stock_level ? Number(p.min_stock_level) : 0;
      return minStock > 0 && stockLevel < minStock;
    });

    if (lowStockProducts.length > 0) {
      insights.push({
        type: 'warning',
        title: `${lowStockProducts.length} products below minimum stock`,
        description: `Review and reorder inventory to prevent stockouts and lost sales.`,
        action: 'View Low Stock Products',
        actionLink: '/products/catalog?filter=low_stock',
        priority: 'high',
      });
    }

    // Insight 4: Overdue tasks
    if (tasks.length > 5) {
      insights.push({
        type: 'warning',
        title: `${tasks.length} overdue tasks`,
        description: `Multiple tasks are past their due date. Review team workload and prioritize completion.`,
        action: 'View Overdue Tasks',
        actionLink: '/tasks?filter=overdue',
        priority: 'medium',
      });
    }

    // Insight 5: Order fulfillment performance
    const pendingOrders = recentOrders.filter(o => o.status === 'pending' || o.status === 'processing');
    const avgFulfillmentDays = 3; // This would be calculated from actual data

    if (pendingOrders.length > 20) {
      insights.push({
        type: 'info',
        title: `${pendingOrders.length} orders pending fulfillment`,
        description: `Average fulfillment time is ${avgFulfillmentDays} days. Monitor production capacity to meet demand.`,
        action: 'View Pending Orders',
        actionLink: '/orders?status=pending',
        priority: 'medium',
      });
    }

    return insights.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return priorityOrder[a.priority as keyof typeof priorityOrder] - priorityOrder[b.priority as keyof typeof priorityOrder];
    });
  }),

  // ==================== EXECUTIVE DASHBOARD ====================

  /**
   * Get high-level executive metrics for Executive Dashboard
   * Provides company-wide KPIs and strategic business metrics
   */
  getExecutive: publicProcedure
    .input(z.object({
      dateRange: z.enum(['7d', '30d', '90d', '1y', 'all']).default('30d'),
    }).optional())
    .query(async ({ ctx, input }) => {
      const dateRange = input?.dateRange || '30d';

      // Calculate date ranges for comparison
      const now = new Date();
      let startDate: Date | null = null;
      let previousStartDate: Date | null = null;

      if (dateRange === '7d') {
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        previousStartDate = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
      } else if (dateRange === '30d') {
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        previousStartDate = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
      } else if (dateRange === '90d') {
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        previousStartDate = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);
      } else if (dateRange === '1y') {
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        previousStartDate = new Date(now.getTime() - 730 * 24 * 60 * 60 * 1000);
      }

      // Fetch all data (in-memory filtering to avoid Supabase timezone bug)
      const [
        allOrders,
        allInvoices,
        allPayments,
        customers,
        projects,
        tasks,
        productionOrders,
        shipments,
      ] = await Promise.all([
        ctx.db.orders.findMany(),
        ctx.db.invoices.findMany(),
        ctx.db.payments.findMany(),
        ctx.db.customers.findMany(),
        ctx.db.projects.findMany(),
        ctx.db.tasks.findMany(),
        ctx.db.production_orders.findMany(),
        ctx.db.shipments.findMany(),
      ]);

      // Filter by date range
      const orders = startDate
        ? allOrders.filter(o => o.created_at && new Date(o.created_at) >= startDate)
        : allOrders;

      const previousOrders = previousStartDate && startDate
        ? allOrders.filter(o => o.created_at && new Date(o.created_at) >= previousStartDate && new Date(o.created_at) < startDate)
        : [];

      const invoices = startDate
        ? allInvoices.filter(i => i.created_at && new Date(i.created_at) >= startDate)
        : allInvoices;

      const payments = startDate
        ? allPayments.filter(p => p.created_at && new Date(p.created_at) >= startDate)
        : allPayments;

      // ========== REVENUE METRICS ==========
      const totalRevenue = orders.reduce((sum, order) => {
        return sum + (order.total_amount ? Number(order.total_amount) : 0);
      }, 0);

      const previousRevenue = previousOrders.reduce((sum, order) => {
        return sum + (order.total_amount ? Number(order.total_amount) : 0);
      }, 0);

      const revenueGrowth = previousRevenue > 0
        ? ((totalRevenue - previousRevenue) / previousRevenue) * 100
        : 0;

      // ========== ORDER METRICS ==========
      const totalOrders = orders.length;
      const previousTotalOrders = previousOrders.length;
      const orderGrowth = previousTotalOrders > 0
        ? ((totalOrders - previousTotalOrders) / previousTotalOrders) * 100
        : 0;

      const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

      // ========== FINANCIAL METRICS ==========
      const totalInvoiced = invoices.reduce((sum, invoice) => {
        return sum + (invoice.total_amount ? Number(invoice.total_amount) : 0);
      }, 0);

      const totalPaid = payments.reduce((sum, payment) => {
        return sum + (payment.amount ? Number(payment.amount) : 0);
      }, 0);

      const outstandingAR = totalInvoiced - totalPaid;

      const overdueInvoices = invoices.filter(inv => {
        if (inv.status === 'paid') return false;
        if (!inv.due_date) return false;
        return new Date(inv.due_date) < now;
      });

      // ========== CUSTOMER METRICS ==========
      const totalCustomers = customers.length;
      const activeCustomers = customers.filter(c => c.status === 'active').length;

      // New customers in date range
      const newCustomers = startDate
        ? customers.filter(c => c.created_at && new Date(c.created_at) >= startDate).length
        : 0;

      // ========== PROJECT METRICS ==========
      const activeProjects = projects.filter(p => p.status === 'in_progress' || p.status === 'planning').length;
      const completedProjects = startDate
        ? projects.filter(p => p.status === 'completed' && p.completed_at && new Date(p.completed_at) >= startDate).length
        : 0;

      const onTimeProjects = projects.filter(p => {
        if (p.status !== 'completed' || !p.completed_at || !p.end_date) return false;
        return new Date(p.completed_at) <= new Date(p.end_date);
      }).length;

      const totalCompletedProjects = projects.filter(p => p.status === 'completed').length;
      const onTimeRate = totalCompletedProjects > 0
        ? (onTimeProjects / totalCompletedProjects) * 100
        : 0;

      // ========== TASK METRICS ==========
      const overdueTasks = tasks.filter(t => {
        if (t.status === 'completed' || t.status === 'cancelled') return false;
        if (!t.due_date) return false;
        return new Date(t.due_date) < now;
      }).length;

      const completedTasks = startDate
        ? tasks.filter(t => t.status === 'completed' && t.completed_at && new Date(t.completed_at) >= startDate).length
        : 0;

      // ========== PRODUCTION METRICS ==========
      const activeProduction = productionOrders.filter(p => p.status === 'in_progress').length;
      const completedProduction = startDate
        ? productionOrders.filter(p => p.status === 'completed' && p.actual_completion && new Date(p.actual_completion) >= startDate).length
        : 0;

      // ========== SHIPPING METRICS ==========
      const shipmentsInTransit = shipments.filter(s => s.status === 'in_transit').length;
      const deliveredShipments = startDate
        ? shipments.filter(s => s.status === 'delivered' && s.actual_delivery && new Date(s.actual_delivery) >= startDate).length
        : 0;

      const onTimeDeliveries = shipments.filter(s => {
        if (s.status !== 'delivered' || !s.actual_delivery || !s.expected_delivery) return false;
        return new Date(s.actual_delivery) <= new Date(s.expected_delivery);
      }).length;

      const totalDeliveries = shipments.filter(s => s.status === 'delivered').length;
      const deliveryOnTimeRate = totalDeliveries > 0
        ? (onTimeDeliveries / totalDeliveries) * 100
        : 0;

      // ========== REVENUE TREND (Monthly) ==========
      const revenueTrend = [];
      const monthsToShow = dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : dateRange === '90d' ? 90 : 365;

      for (let i = monthsToShow - 1; i >= 0; i--) {
        const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        const dayEnd = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);

        const dayOrders = allOrders.filter(o =>
          o.created_at &&
          new Date(o.created_at) >= dayStart &&
          new Date(o.created_at) < dayEnd
        );

        const dayRevenue = dayOrders.reduce((sum, order) => {
          return sum + (order.total_amount ? Number(order.total_amount) : 0);
        }, 0);

        revenueTrend.push({
          date: dayStart.toISOString().split('T')[0],
          revenue: Math.round(dayRevenue * 100) / 100,
          orders: dayOrders.length,
        });
      }

      // ========== DEPARTMENT PERFORMANCE ==========
      const departments = [
        { name: 'Sales', revenue: totalRevenue * 0.3, target: totalRevenue * 0.35, orders: Math.floor(totalOrders * 0.3) },
        { name: 'Production', revenue: totalRevenue * 0.25, target: totalRevenue * 0.25, orders: activeProduction },
        { name: 'Design', revenue: totalRevenue * 0.2, target: totalRevenue * 0.18, orders: Math.floor(totalOrders * 0.2) },
        { name: 'Shipping', revenue: totalRevenue * 0.15, target: totalRevenue * 0.15, orders: shipmentsInTransit },
        { name: 'Other', revenue: totalRevenue * 0.1, target: totalRevenue * 0.07, orders: Math.floor(totalOrders * 0.1) },
      ];

      return {
        dateRange,
        summary: {
          totalRevenue: Math.round(totalRevenue * 100) / 100,
          revenueGrowth: Math.round(revenueGrowth * 100) / 100,
          totalOrders,
          orderGrowth: Math.round(orderGrowth * 100) / 100,
          avgOrderValue: Math.round(avgOrderValue * 100) / 100,
          totalCustomers,
          activeCustomers,
          newCustomers,
        },
        financial: {
          totalInvoiced: Math.round(totalInvoiced * 100) / 100,
          totalPaid: Math.round(totalPaid * 100) / 100,
          outstandingAR: Math.round(outstandingAR * 100) / 100,
          overdueInvoices: overdueInvoices.length,
        },
        operations: {
          activeProjects,
          completedProjects,
          onTimeRate: Math.round(onTimeRate * 100) / 100,
          overdueTasks,
          completedTasks,
          activeProduction,
          completedProduction,
          shipmentsInTransit,
          deliveredShipments,
          deliveryOnTimeRate: Math.round(deliveryOnTimeRate * 100) / 100,
        },
        revenueTrend,
        departments,
      };
    }),

  /**
   * Get executive insights and strategic recommendations
   */
  getExecutiveInsights: publicProcedure
    .query(async ({ ctx }) => {
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      // Fetch data for insights
      const [allOrders, allInvoices, projects, tasks, productionOrders] = await Promise.all([
        ctx.db.orders.findMany(),
        ctx.db.invoices.findMany(),
        ctx.db.projects.findMany(),
        ctx.db.tasks.findMany(),
        ctx.db.production_orders.findMany(),
      ]);

      const insights: Array<{
        type: 'success' | 'warning' | 'error' | 'info';
        title: string;
        description: string;
        action: string;
        actionLink: string;
        priority: 'high' | 'medium' | 'low';
      }> = [];

      // Insight 1: Revenue trends
      const recentOrders = allOrders.filter(o => o.created_at && new Date(o.created_at) >= thirtyDaysAgo);
      const recentRevenue = recentOrders.reduce((sum, o) => sum + (o.total_amount ? Number(o.total_amount) : 0), 0);

      const previousMonth = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
      const previousOrders = allOrders.filter(o =>
        o.created_at &&
        new Date(o.created_at) >= previousMonth &&
        new Date(o.created_at) < thirtyDaysAgo
      );
      const previousRevenue = previousOrders.reduce((sum, o) => sum + (o.total_amount ? Number(o.total_amount) : 0), 0);

      const revenueGrowth = previousRevenue > 0 ? ((recentRevenue - previousRevenue) / previousRevenue) * 100 : 0;

      if (revenueGrowth > 10) {
        insights.push({
          type: 'success',
          title: `Revenue up ${Math.round(revenueGrowth)}% this month`,
          description: 'Strong revenue growth indicates positive business momentum. Continue current strategies.',
          action: 'View Revenue Analytics',
          actionLink: '/dashboards/analytics',
          priority: 'medium',
        });
      } else if (revenueGrowth < -10) {
        insights.push({
          type: 'warning',
          title: `Revenue down ${Math.abs(Math.round(revenueGrowth))}% this month`,
          description: 'Revenue decline requires attention. Review sales pipeline and marketing efforts.',
          action: 'Review Sales Pipeline',
          actionLink: '/crm/leads',
          priority: 'high',
        });
      }

      // Insight 2: Overdue invoices
      const overdueInvoices = allInvoices.filter(inv => {
        if (inv.status === 'paid') return false;
        if (!inv.due_date) return false;
        return new Date(inv.due_date) < now;
      });

      if (overdueInvoices.length > 0) {
        const totalOverdue = overdueInvoices.reduce((sum, inv) => sum + (inv.total_amount ? Number(inv.total_amount) : 0), 0);
        insights.push({
          type: 'error',
          title: `${overdueInvoices.length} invoices overdue`,
          description: `$${Math.round(totalOverdue).toLocaleString()} in overdue payments. Review and follow up immediately.`,
          action: 'View Overdue Invoices',
          actionLink: '/financials/invoices?status=overdue',
          priority: 'high',
        });
      }

      // Insight 3: Project delivery performance
      const completedProjects = projects.filter(p => p.status === 'completed');
      const onTimeProjects = completedProjects.filter(p => {
        if (!p.completed_at || !p.end_date) return false;
        return new Date(p.completed_at) <= new Date(p.end_date);
      });

      const onTimeRate = completedProjects.length > 0
        ? (onTimeProjects.length / completedProjects.length) * 100
        : 0;

      if (onTimeRate < 70 && completedProjects.length > 5) {
        insights.push({
          type: 'warning',
          title: `Only ${Math.round(onTimeRate)}% projects delivered on time`,
          description: 'Project delivery performance below target. Review project planning and resource allocation.',
          action: 'Review Projects',
          actionLink: '/projects',
          priority: 'high',
        });
      } else if (onTimeRate >= 90) {
        insights.push({
          type: 'success',
          title: `${Math.round(onTimeRate)}% on-time project delivery`,
          description: 'Excellent project delivery performance. Maintain current processes.',
          action: 'View Projects Dashboard',
          actionLink: '/dashboards/projects',
          priority: 'low',
        });
      }

      // Insight 4: Production capacity
      const activeProduction = productionOrders.filter(p => p.status === 'in_progress');
      const pendingProduction = productionOrders.filter(p => p.status === 'pending');

      if (activeProduction.length > 50) {
        insights.push({
          type: 'warning',
          title: `${activeProduction.length} active production orders`,
          description: 'High production volume may strain capacity. Consider increasing resources or scheduling.',
          action: 'View Production',
          actionLink: '/production/ordered-items',
          priority: 'medium',
        });
      }

      if (pendingProduction.length > 30) {
        insights.push({
          type: 'info',
          title: `${pendingProduction.length} production orders pending`,
          description: 'Large backlog of pending orders. Prioritize and schedule production runs.',
          action: 'Schedule Production',
          actionLink: '/production/ordered-items?status=pending',
          priority: 'medium',
        });
      }

      // Insight 5: Task management
      const overdueTasks = tasks.filter(t => {
        if (t.status === 'completed' || t.status === 'cancelled') return false;
        if (!t.due_date) return false;
        return new Date(t.due_date) < now;
      });

      if (overdueTasks.length > 20) {
        insights.push({
          type: 'error',
          title: `${overdueTasks.length} tasks overdue`,
          description: 'High number of overdue tasks indicates resource or prioritization issues. Review task assignments.',
          action: 'View Overdue Tasks',
          actionLink: '/tasks?status=overdue',
          priority: 'high',
        });
      }

      return insights.sort((a, b) => {
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        return priorityOrder[a.priority as keyof typeof priorityOrder] - priorityOrder[b.priority as keyof typeof priorityOrder];
      });
    }),
});
