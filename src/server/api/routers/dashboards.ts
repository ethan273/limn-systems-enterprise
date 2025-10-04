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

      // Build where clause for date filtering
      const dateWhere = startDate ? { created_at: { gte: startDate } } : {};

      // Fetch data from multiple modules
      const [
        orders,
        allOrders,
        products,
        customers,
        projects,
        tasks,
        orderedItems,
        productionOrders,
        shipments,
      ] = await Promise.all([
        ctx.db.orders.findMany({ where: dateWhere }),
        ctx.db.orders.findMany(),
        ctx.db.products.findMany(),
        ctx.db.customers.findMany({ where: dateWhere }),
        ctx.db.projects.findMany({ where: dateWhere }),
        ctx.db.tasks.findMany({ where: dateWhere }),
        ctx.db.order_items.findMany(),
        ctx.db.production_orders.findMany({ where: dateWhere }),
        ctx.db.shipments.findMany({ where: dateWhere }),
      ]);

      // Calculate revenue metrics
      const totalRevenue = orders.reduce((sum, order) => {
        return sum + (order.total ? Number(order.total) : 0);
      }, 0);

      const previousPeriodStart = startDate ? new Date(startDate.getTime() - (now.getTime() - startDate.getTime())) : null;
      const previousOrders = previousPeriodStart
        ? await ctx.db.orders.findMany({
            where: {
              created_at: {
                gte: previousPeriodStart,
                lt: startDate!,
              },
            },
          })
        : [];

      const previousRevenue = previousOrders.reduce((sum, order) => {
        return sum + (order.total ? Number(order.total) : 0);
      }, 0);

      const revenueGrowth = previousRevenue > 0
        ? ((totalRevenue - previousRevenue) / previousRevenue) * 100
        : totalRevenue > 0 ? 100 : 0;

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

        const monthRevenue = monthOrders.reduce((sum, o) => sum + (o.total ? Number(o.total) : 0), 0);

        return {
          month: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
          revenue: monthRevenue,
          orders: monthOrders.length,
        };
      });

      // Customer growth
      const customerGrowth = previousOrders.length > 0
        ? ((customers.length - previousOrders.length) / previousOrders.length) * 100
        : customers.length > 0 ? 100 : 0;

      // Order status distribution
      const orderStatusCounts = orders.reduce((acc, order) => {
        const status = order.status || 'unknown';
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Product performance (top 10 products by revenue)
      const productRevenue = orderedItems.reduce((acc, item) => {
        const productId = item.product_id;
        const revenue = item.unit_price ? Number(item.unit_price) * (item.quantity || 0) : 0;
        if (!acc[productId]) {
          acc[productId] = { revenue: 0, quantity: 0 };
        }
        acc[productId].revenue += revenue;
        acc[productId].quantity += item.quantity || 0;
        return acc;
      }, {} as Record<string, { revenue: number; quantity: number }>);

      const topProducts = Object.entries(productRevenue)
        .sort(([, a], [, b]) => b.revenue - a.revenue)
        .slice(0, 10)
        .map(([productId, data]) => {
          const product = products.find(p => p.id === productId);
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

    const [recentOrders, previousOrders, customers, products, tasks] = await Promise.all([
      ctx.db.orders.findMany({
        where: { created_at: { gte: thirtyDaysAgo } },
      }),
      ctx.db.orders.findMany({
        where: {
          created_at: {
            gte: sixtyDaysAgo,
            lt: thirtyDaysAgo,
          },
        },
      }),
      ctx.db.customers.findMany(),
      ctx.db.products.findMany(),
      ctx.db.tasks.findMany({
        where: {
          status: { not: 'completed' },
          due_date: { lt: now },
        },
      }),
    ]);

    // Insight 1: Revenue trends
    const recentRevenue = recentOrders.reduce((sum, o) => sum + (o.total ? Number(o.total) : 0), 0);
    const previousRevenue = previousOrders.reduce((sum, o) => sum + (o.total ? Number(o.total) : 0), 0);
    const revenueChange = previousRevenue > 0 ? ((recentRevenue - previousRevenue) / previousRevenue) * 100 : 0;

    if (revenueChange > 10) {
      insights.push({
        type: 'success',
        title: `Revenue up ${revenueChange.toFixed(1)}% this month`,
        description: `Your business generated $${recentRevenue.toLocaleString()} in the last 30 days, up from $${previousRevenue.toLocaleString()} in the previous period.`,
        action: 'View Revenue Report',
        actionLink: '/dashboards/analytics?view=revenue',
        priority: 'low',
      });
    } else if (revenueChange < -10) {
      insights.push({
        type: 'warning',
        title: `Revenue down ${Math.abs(revenueChange).toFixed(1)}% this month`,
        description: `Revenue has decreased from $${previousRevenue.toLocaleString()} to $${recentRevenue.toLocaleString()}. Review sales pipeline and customer engagement.`,
        action: 'Analyze Revenue Decline',
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
    const lowStockProducts = products.filter(p => {
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
});
