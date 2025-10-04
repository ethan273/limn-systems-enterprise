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
});
