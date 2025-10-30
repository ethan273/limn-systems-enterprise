'use client';

import { api } from '@/lib/api/client';
import { DashboardStatCard } from '@/components/dashboard/DashboardStatCard';
import { Breadcrumb } from '@/components/common/Breadcrumb';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Users, Building2, TrendingUp, Activity, Mail, Phone, Calendar, FileText } from 'lucide-react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';

const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#6366f1'];

const ACTIVITY_ICONS: Record<string, any> = {
  email: Mail,
  call: Phone,
  meeting: Calendar,
  note: FileText,
  other: Activity,
};

export default function CRMPage() {
  const { data: dashboardData, isLoading, error } = api.crm.getDashboardMetrics.useQuery(
    undefined,
    { refetchInterval: 60000 } // Refresh every minute
  );

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="mb-6">
          <h1 className="page-title">CRM Dashboard</h1>
          <p className="page-subtitle">Customer relationship management overview</p>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="mb-6">
          <h1 className="page-title">CRM Dashboard</h1>
          <p className="page-subtitle">Customer relationship management overview</p>
        </div>
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-6">
          <p className="text-destructive">Error loading dashboard: {error.message}</p>
        </div>
      </div>
    );
  }

  const metrics = dashboardData?.metrics || {
    totalContacts: 0,
    totalLeads: 0,
    totalCustomers: 0,
    totalActivities: 0,
    totalPipelineValue: 0,
    conversionRate: 0,
  };

  const leadsByStatus = dashboardData?.leadsByStatus || [];
  const activitiesByType = dashboardData?.activitiesByType || [];
  const recentActivities = dashboardData?.recentActivities || [];
  const recentContacts = dashboardData?.recentContacts || [];

  return (
    <div className="p-6 space-y-6">
      {/* Breadcrumb Navigation */}
      <Breadcrumb />

      {/* Header */}
      <div>
        <h1 className="page-title">CRM Dashboard</h1>
        <p className="page-subtitle">Customer relationship management overview</p>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <DashboardStatCard
          title="Total Contacts"
          value={metrics.totalContacts.toString()}
          icon={Users}
          iconColor="info"
        />
        <DashboardStatCard
          title="Active Leads"
          value={metrics.totalLeads.toString()}
          icon={TrendingUp}
          iconColor="primary"
        />
        <DashboardStatCard
          title="Clients"
          value={metrics.totalCustomers.toString()}
          icon={Building2}
          iconColor="success"
        />
        <DashboardStatCard
          title="Conversion Rate"
          value={`${metrics.conversionRate}%`}
          icon={Activity}
          iconColor={metrics.conversionRate > 50 ? 'success' : 'warning'}
        />
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Pipeline by Status */}
        <div className="bg-card border rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Pipeline by Status</h3>
          {leadsByStatus.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={leadsByStatus}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="status" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '6px',
                  }}
                />
                <Bar dataKey="count" fill="#3b82f6" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[300px] text-muted-foreground">
              No pipeline data available
            </div>
          )}
        </div>

        {/* Activities by Type */}
        <div className="bg-card border rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Activities by Type</h3>
          {activitiesByType.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={activitiesByType}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ type, percent }) => `${type} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {activitiesByType.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '6px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[300px] text-muted-foreground">
              No activity data available
            </div>
          )}
        </div>
      </div>

      {/* Recent Activity & Contacts */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Recent Activities */}
        <div className="bg-card border rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Recent Activity</h3>
            {/* TODO: Create /crm/activities page */}
          </div>
          <div className="space-y-3">
            {recentActivities.length > 0 ? (
              recentActivities.map((activity) => {
                const Icon = ACTIVITY_ICONS[activity.type || 'other'] || Activity;
                const relatedEntity = activity.contact || activity.lead || activity.customer;
                const entityName = relatedEntity
                  ? (relatedEntity as any).name || (relatedEntity as any).first_name || 'Unknown'
                  : 'Unknown';

                return (
                  <div key={activity.id} className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                    <div className="mt-0.5">
                      <Icon className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {activity.description || `${activity.type} activity`}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {entityName} • {activity.created_at ? formatDistanceToNow(new Date(activity.created_at), { addSuffix: true }) : 'recently'}
                      </p>
                    </div>
                    <span
                      className={`status-badge text-xs px-2 py-1 rounded-full ${
                        activity.status === 'completed'
                          ? 'status-completed'
                          : activity.status === 'pending'
                          ? 'status-pending'
                          : ''
                      }`}
                    >
                      {activity.status}
                    </span>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No recent activities
              </div>
            )}
          </div>
        </div>

        {/* Recent Contacts */}
        <div className="bg-card border rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Recent Contacts</h3>
            <Link
              href="/crm/contacts"
              className="text-sm text-primary hover:underline"
            >
              View all
            </Link>
          </div>
          <div className="space-y-3">
            {recentContacts.length > 0 ? (
              recentContacts.map((contact) => (
                <Link
                  key={contact.id}
                  href={`/crm/contacts/${contact.id}`}
                  className="block p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">
                        {contact.first_name && contact.last_name
                          ? `${contact.first_name} ${contact.last_name}`
                          : contact.name || 'Unnamed Contact'}
                      </p>
                      {contact.company && (
                        <p className="text-xs text-muted-foreground truncate">
                          {contact.company}
                        </p>
                      )}
                      {contact.email && (
                        <p className="text-xs text-muted-foreground truncate">
                          {contact.email}
                        </p>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground ml-2 whitespace-nowrap">
                      {contact.created_at ? formatDistanceToNow(new Date(contact.created_at), { addSuffix: true }) : 'recently'}
                    </span>
                  </div>
                </Link>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No contacts yet
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Pipeline Value Summary */}
      <div className="bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold mb-1">Total Pipeline Value</h3>
            <p className="text-3xl font-bold text-primary">
              ${metrics.totalPipelineValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Total Activities</p>
            <p className="text-2xl font-semibold">{metrics.totalActivities}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
