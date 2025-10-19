'use client';

import { useState } from 'react';
import { api } from '@/utils/api';
import {
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  ComposedChart,
} from 'recharts';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { PageHeader, EmptyState } from '@/components/common';

/**
 * Production Analytics Dashboard
 *
 * Comprehensive production analytics with:
 * - Production overview (total orders, status breakdown)
 * - Throughput trends (orders created vs completed)
 * - Efficiency metrics (on-time delivery, delays)
 * - Average production time
 * - Export functionality
 */

const STATUS_COLORS: Record<string, string> = {
  pending: '#F59E0B',
  in_progress: '#3B82F6',
  quality_check: '#8B5CF6',
  completed: '#10B981',
  cancelled: '#EF4444',
};

export default function ProductionAnalyticsPage() {
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().setMonth(new Date().getMonth() - 6)).toISOString(),
    endDate: new Date().toISOString(),
  });
  const [groupBy, setGroupBy] = useState<'day' | 'week' | 'month'>('month');

  // Fetch analytics data
  const { data: overview, isLoading: overviewLoading, error: overviewError } = api.analytics.getProductionOverview.useQuery(dateRange);
  const { data: throughput, isLoading: throughputLoading, error: throughputError } = api.analytics.getProductionThroughput.useQuery({
    ...dateRange,
    groupBy,
  });
  const { data: efficiency, isLoading: efficiencyLoading, error: efficiencyError } = api.analytics.getProductionEfficiency.useQuery(dateRange);

  const utils = api.useUtils();

  // Handle query errors
  const error = overviewError || throughputError || efficiencyError;
  if (error) {
    return (
      <div className="analytics-page">
        <div className="page-container">
          <PageHeader
            title="Production Analytics"
            subtitle="Comprehensive production analytics with trends and efficiency metrics"
          />
          <EmptyState
            icon={AlertTriangle}
            title="Failed to load production analytics"
            description={error.message || "An unexpected error occurred. Please try again."}
            action={{
              label: 'Try Again',
              onClick: () => {
                utils.analytics.getProductionOverview.invalidate();
                utils.analytics.getProductionThroughput.invalidate();
                utils.analytics.getProductionEfficiency.invalidate();
              },
              icon: RefreshCw,
            }}
          />
        </div>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      year: 'numeric',
    });
  };

  const handleDateRangeChange = (range: 'month' | 'quarter' | 'year' | 'ytd' | 'all') => {
    const now = new Date();
    let startDate: Date;

    switch (range) {
      case 'month':
        startDate = new Date(now.setMonth(now.getMonth() - 1));
        break;
      case 'quarter':
        startDate = new Date(now.setMonth(now.getMonth() - 3));
        break;
      case 'year':
        startDate = new Date(now.setFullYear(now.getFullYear() - 1));
        break;
      case 'ytd':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      case 'all':
        startDate = new Date(2020, 0, 1);
        break;
    }

    setDateRange({
      startDate: startDate.toISOString(),
      endDate: new Date().toISOString(),
    });
  };

  const handleExport = (format: 'csv' | 'excel' | 'pdf') => {
    alert(`Export to ${format.toUpperCase()} - To be implemented`);
  };

  // Prepare status breakdown for pie chart
  const statusData = overview?.statusBreakdown.map((s: { status: string; count: number }) => ({
    name: s.status.replace(/_/g, ' ').toUpperCase(),
    value: s.count,
    fill: STATUS_COLORS[s.status] || '#64748B',
  })) || [];

  return (
    <div className="analytics-page">
      <div className="page-header">
        <h1>Production Analytics</h1>
        <div className="page-actions">
          <button className="btn btn-secondary" onClick={() => handleExport('csv')}>
            Export CSV
          </button>
          <button className="btn btn-secondary" onClick={() => handleExport('excel')}>
            Export Excel
          </button>
          <button className="btn btn-secondary" onClick={() => handleExport('pdf')}>
            Export PDF
          </button>
        </div>
      </div>

      {/* Date Range Selector */}
      <div className="filter-bar">
        <div className="filter-group">
          <label>Date Range:</label>
          <div className="btn-group">
            <button className="btn btn-sm" onClick={() => handleDateRangeChange('month')}>
              Last Month
            </button>
            <button className="btn btn-sm" onClick={() => handleDateRangeChange('quarter')}>
              Last Quarter
            </button>
            <button className="btn btn-sm" onClick={() => handleDateRangeChange('year')}>
              Last Year
            </button>
            <button className="btn btn-sm" onClick={() => handleDateRangeChange('ytd')}>
              Year to Date
            </button>
            <button className="btn btn-sm" onClick={() => handleDateRangeChange('all')}>
              All Time
            </button>
          </div>
        </div>

        <div className="filter-group">
          <label>Group By:</label>
          <Select value={groupBy} onValueChange={(value) => setGroupBy(value as 'day' | 'week' | 'month')}>
            <SelectTrigger className="w-[150px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="day">Day</SelectItem>
              <SelectItem value="week">Week</SelectItem>
              <SelectItem value="month">Month</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* KPI Cards */}
      {overviewLoading ? (
        <div className="loading-state">Loading overview...</div>
      ) : overview ? (
        <div className="kpi-grid">
          <div className="kpi-card">
            <div className="kpi-label">Total Orders</div>
            <div className="kpi-value">{overview.totalOrders}</div>
            <div className="kpi-meta">All production orders</div>
          </div>

          <div className="kpi-card">
            <div className="kpi-label">Completed</div>
            <div className="kpi-value green">{overview.completedCount}</div>
            <div className="kpi-meta">
              {overview.totalOrders > 0
                ? Math.round((overview.completedCount / overview.totalOrders) * 100)
                : 0}
              % completion rate
            </div>
          </div>

          <div className="kpi-card">
            <div className="kpi-label">Avg Production Time</div>
            <div className="kpi-value">{overview.averageProductionDays}</div>
            <div className="kpi-meta">Days per order</div>
          </div>

          {efficiency && (
            <div className="kpi-card">
              <div className="kpi-label">On-Time Delivery</div>
              <div className={`kpi-value ${efficiency.onTimeRate >= 90 ? 'green' : efficiency.onTimeRate >= 75 ? 'orange' : 'red'}`}>
                {efficiency.onTimeRate}%
              </div>
              <div className="kpi-meta">
                {efficiency.onTime} of {efficiency.totalOrders} on time
              </div>
            </div>
          )}
        </div>
      ) : null}

      {/* Order Status Breakdown */}
      {!overviewLoading && statusData.length > 0 && (
        <div className="chart-container">
          <h2>Order Status Distribution</h2>
          <ResponsiveContainer width="100%" height={400}>
            <PieChart>
              <Pie
                data={statusData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={120}
                label={(entry: { name: string; value: number }) => `${entry.name}: ${entry.value}`}
              >
                {statusData.map((entry: { fill: string }, index: number) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Production Throughput */}
      <div className="chart-container">
        <h2>Production Throughput</h2>
        {throughputLoading ? (
          <div className="loading-state">Loading throughput...</div>
        ) : throughput && throughput.length > 0 ? (
          <ResponsiveContainer width="100%" height={400}>
            <ComposedChart data={throughput}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="period" tickFormatter={formatDate} />
              <YAxis />
              <Tooltip labelFormatter={formatDate} />
              <Legend />
              <Bar dataKey="ordersCreated" fill="#3B82F6" name="Orders Created" />
              <Bar dataKey="ordersCompleted" fill="#10B981" name="Orders Completed" />
              <Line
                type="monotone"
                dataKey="ordersCompleted"
                stroke="#059669"
                strokeWidth={2}
                name="Completion Trend"
              />
            </ComposedChart>
          </ResponsiveContainer>
        ) : (
          <div className="empty-state">No data available for selected date range</div>
        )}
      </div>

      {/* Efficiency Metrics */}
      {!efficiencyLoading && efficiency && (
        <div className="chart-container">
          <h2>Delivery Performance</h2>
          <div className="efficiency-grid">
            <div className="efficiency-card">
              <div className="efficiency-icon green">✓</div>
              <div className="efficiency-label">On-Time Deliveries</div>
              <div className="efficiency-value">{efficiency.onTime}</div>
              <div className="efficiency-percentage green">{efficiency.onTimeRate}%</div>
            </div>

            <div className="efficiency-card">
              <div className="efficiency-icon red">✗</div>
              <div className="efficiency-label">Delayed Deliveries</div>
              <div className="efficiency-value">{efficiency.delayed}</div>
              <div className="efficiency-percentage red">
                {efficiency.totalOrders > 0
                  ? Math.round((efficiency.delayed / efficiency.totalOrders) * 100)
                  : 0}
                %
              </div>
            </div>

            <div className="efficiency-card">
              <div className="efficiency-icon orange">⏱</div>
              <div className="efficiency-label">Average Delay</div>
              <div className="efficiency-value">{efficiency.avgDelayDays}</div>
              <div className="efficiency-percentage">days</div>
            </div>

            <div className="efficiency-card">
              <div className="efficiency-icon blue">📦</div>
              <div className="efficiency-label">Total Measured</div>
              <div className="efficiency-value">{efficiency.totalOrders}</div>
              <div className="efficiency-percentage">orders</div>
            </div>
          </div>
        </div>
      )}

      {/* Production Insights */}
      <div className="insights-container">
        <h2>Key Insights</h2>
        <div className="insights-grid">
          {overview && overview.averageProductionDays > 0 && (
            <div className="insight-card">
              <div className="insight-icon">📊</div>
              <div className="insight-content">
                <h3>Production Cycle</h3>
                <p>
                  Average production time is <strong>{overview.averageProductionDays} days</strong>.
                  {overview.averageProductionDays > 14 && ' Consider optimizing processes to reduce lead time.'}
                  {overview.averageProductionDays <= 7 && ' Excellent turnaround time!'}
                </p>
              </div>
            </div>
          )}

          {efficiency && efficiency.onTimeRate < 85 && (
            <div className="insight-card warning">
              <div className="insight-icon">⚠️</div>
              <div className="insight-content">
                <h3>Delivery Improvement Needed</h3>
                <p>
                  On-time delivery rate is <strong>{efficiency.onTimeRate}%</strong>.
                  Target is 90% or higher. Review bottlenecks in production workflow.
                </p>
              </div>
            </div>
          )}

          {efficiency && efficiency.onTimeRate >= 90 && (
            <div className="insight-card success">
              <div className="insight-icon">🎯</div>
              <div className="insight-content">
                <h3>Excellent Performance</h3>
                <p>
                  On-time delivery rate of <strong>{efficiency.onTimeRate}%</strong> exceeds target.
                  Keep up the great work!
                </p>
              </div>
            </div>
          )}

          {throughput && throughput.length > 0 && (
            <div className="insight-card">
              <div className="insight-icon">📈</div>
              <div className="insight-content">
                <h3>Production Trends</h3>
                <p>
                  Tracking {throughput.length} {groupBy === 'month' ? 'months' : groupBy === 'week' ? 'weeks' : 'days'} of
                  production data. Use filters to analyze specific periods.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
