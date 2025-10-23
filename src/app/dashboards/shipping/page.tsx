'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DateRangeSelector } from '@/components/DateRangeSelector';
import { DashboardStatCard } from '@/components/dashboard/DashboardStatCard';
import {
  Truck,
  Package,
  CheckCircle,
  Clock,
  AlertTriangle,
  TrendingUp,
  MapPin,
  Lightbulb,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';
import { ExportPDFButton } from '@/components/ExportPDFButton';
import {
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

// Dynamic route configuration
export const dynamic = 'force-dynamic';

const INSIGHT_ICONS = {
  success: CheckCircle,
  warning: AlertTriangle,
  error: AlertTriangle,
  info: Lightbulb,
};

const INSIGHT_CLASSES = {
  success: 'insight-success',
  warning: 'insight-warning',
  error: 'insight-error',
  info: 'insight-info',
};

const CHART_COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', 'hsl(var(--muted))'];

export default function ShippingDashboardPage() {
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d');

  const { data: shipping, isLoading, error } = api.dashboards.getShipping.useQuery(
    { dateRange },
    { refetchInterval: 60000 } // Auto-refresh every 60 seconds
  );

  // Get tRPC utils for cache invalidation
  const utils = api.useUtils();

  const { data: insights } = api.dashboards.getShippingInsights.useQuery();

  if (isLoading) {
    return (
      <div className="dashboard-page">
        <div className="dashboard-loading">
          <div className="loading-spinner"></div>
          <p>Loading shipping dashboard...</p>
        </div>
      </div>
    );
  }

  if (error || !shipping) {
    return (
      <div className="dashboard-page">
        <div className="dashboard-error">
          <AlertTriangle className="error-icon" />
          <h2>Failed to load shipping data</h2>
          <p>{error?.message || 'Unable to retrieve shipping dashboard data. Please try again.'}</p>
          <Button
            variant="outline"
            onClick={() => utils.dashboards.getShipping.invalidate()}
            className="mt-4"
          >
            <RefreshCw className="icon-sm mr-2" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  const { summary, topCarriers, shippingTrend, statusDistribution, topZones } = shipping;

  return (
    <div className="dashboard-page">
      <div id="dashboard-export-container">
      {/* Header */}
      <div className="dashboard-header">
        <div>
          <h1 className="page-title">Shipping & Logistics Dashboard</h1>
          <p className="page-subtitle">Shipment tracking, delivery performance, and logistics metrics</p>
        </div>
        <div className="dashboard-actions">
          <DateRangeSelector
            value={dateRange}
            onChange={(value: any) => setDateRange(value)}
          />
          <Button
            variant="outline"
            size="icon"
            onClick={() => utils.dashboards.getShipping.invalidate()}
            title="Refresh data"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
          <ExportPDFButton dashboardName="Shipping Dashboard" dateRange={dateRange} />
          <Button variant="outline" asChild>
            <Link href="/shipping/shipments">
              <Truck className="icon-sm" />
              View Shipments
            </Link>
          </Button>
        </div>
      </div>

      {/* Shipment Summary Metrics */}
      <div className="dashboard-section">
        <h2 className="section-title">Shipment Overview</h2>
        <div className="dashboard-grid">
          <DashboardStatCard
            title="Total Shipments"
            value={summary.totalShipments}
            description={`${summary.newShipments} new this period`}
            icon={Package}
            iconColor="primary"
          />

          <DashboardStatCard
            title="In Transit"
            value={summary.inTransitShipments}
            description="Active shipments"
            icon={Truck}
            iconColor="info"
          />

          <DashboardStatCard
            title="Delivered"
            value={summary.deliveredShipments}
            description="Successfully delivered"
            icon={CheckCircle}
            iconColor="success"
          />

          <DashboardStatCard
            title="Pending"
            value={summary.pendingShipments}
            description="Awaiting pickup"
            icon={Clock}
            iconColor="warning"
          />
        </div>
      </div>

      {/* Delivery Performance Metrics */}
      <div className="dashboard-section">
        <h2 className="section-title">Delivery Performance</h2>
        <div className="dashboard-grid">
          <DashboardStatCard
            title="On-Time Rate"
            value={`${summary.onTimeRate.toFixed(1)}%`}
            description="Delivery performance"
            icon={TrendingUp}
            iconColor="success"
          />

          <DashboardStatCard
            title="Late Deliveries"
            value={summary.lateDeliveries}
            description="Past expected date"
            icon={AlertTriangle}
            iconColor="warning"
          />

          <DashboardStatCard
            title="Avg Delivery Time"
            value={`${summary.avgDeliveryTime.toFixed(1)} days`}
            description="From ship to delivery"
            icon={Clock}
            iconColor="info"
          />
        </div>
      </div>

      {/* Shipping Trend Chart */}
      <div className="dashboard-section">
        <Card>
          <CardHeader>
            <CardTitle>Shipping Activity Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={shippingTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="date"
                  stroke="hsl(var(--muted-foreground))"
                  tick={{ fontSize: 12 }}
                />
                <YAxis
                  stroke="hsl(var(--muted-foreground))"
                  tick={{ fontSize: 12 }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                />
                <Legend />
                <Line type="monotone" dataKey="shipped" stroke="hsl(var(--primary))" strokeWidth={2} name="Shipped" />
                <Line type="monotone" dataKey="delivered" stroke="hsl(var(--secondary))" strokeWidth={2} name="Delivered" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Status Distribution and Carrier Performance */}
      <div className="dashboard-section">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Status Distribution Pie Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Shipment Status Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={statusDistribution}
                    dataKey="count"
                    nameKey="status"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={(entry) => `${entry.status}: ${entry.count}`}
                  >
                    {statusDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Top Delivery Zones Bar Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Top Delivery Zones</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={topZones}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis
                    dataKey="zone"
                    stroke="hsl(var(--muted-foreground))"
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis
                    stroke="hsl(var(--muted-foreground))"
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Carrier Performance Table */}
      <div className="dashboard-section">
        <Card>
          <CardHeader>
            <CardTitle>Top Carrier Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="w-full">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Carrier</th>
                    <th>Total Shipments</th>
                    <th>On-Time Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {topCarriers.map((carrier, index) => (
                    <tr key={index}>
                      <td>{carrier.name}</td>
                      <td>{carrier.totalShipments}</td>
                      <td>
                        <span className={carrier.onTimeRate >= 90 ? 'metric-change-positive' : carrier.onTimeRate >= 70 ? 'text-muted-foreground' : 'metric-change-negative'}>
                          {carrier.onTimeRate.toFixed(1)}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Shipping Insights */}
      {insights && insights.length > 0 && (
        <div className="dashboard-section">
          <h2 className="section-title">Shipping Insights & Recommendations</h2>
          <div className="insights-grid">
            {insights.map((insight, index) => {
              const Icon = INSIGHT_ICONS[insight.type];
              const insightClass = INSIGHT_CLASSES[insight.type];
              return (
                <Card key={index} className={insightClass}>
                  <CardHeader>
                    <div className="insight-header">
                      <CardTitle className="insight-title">{insight.title}</CardTitle>
                      <Icon className="insight-icon" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="insight-description">{insight.description}</p>
                    <Button variant="ghost" size="sm" className="insight-action" asChild>
                      <Link href={insight.actionLink}>
                        {insight.action}
                        <ArrowRight className="icon-xs" />
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="dashboard-section">
        <h2 className="section-title">Quick Actions</h2>
        <div className="quick-actions-grid">
          <Button variant="outline" asChild>
            <Link href="/shipping/shipments">
              <Truck className="icon-sm" />
              View All Shipments
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/shipping/shipments?status=in_transit">
              <Package className="icon-sm" />
              Track In-Transit
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/shipping/shipments?status=pending">
              <Clock className="icon-sm" />
              View Pending
            </Link>
          </Button>
          {/* TODO: Create /shipping/carriers page */}
          <Button variant="outline" asChild>
            <Link href="/shipping/shipments">
              <MapPin className="icon-sm" />
              View All Shipments
            </Link>
          </Button>
        </div>
      </div>
      </div>
    </div>
  );
}
