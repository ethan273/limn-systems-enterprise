'use client';

import { useState } from 'react';
import { api } from '@/utils/api';
import {
  LineChart,
  Line,
  BarChart,
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
} from 'recharts';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

/**
 * Revenue Analytics Dashboard
 *
 * Comprehensive revenue analytics with:
 * - Revenue overview (total, outstanding, average)
 * - Revenue trends over time
 * - Top customers by revenue
 * - Invoice status breakdown
 * - Export functionality
 */

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

export default function RevenueAnalyticsPage() {
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().setMonth(new Date().getMonth() - 6)).toISOString(),
    endDate: new Date().toISOString(),
  });
  const [groupBy, setGroupBy] = useState<'day' | 'week' | 'month'>('month');

  // Fetch analytics data
  const { data: overview, isLoading: overviewLoading } = api.analytics.getRevenueOverview.useQuery(dateRange);
  const { data: trends, isLoading: trendsLoading } = api.analytics.getRevenueTrends.useQuery({
    ...dateRange,
    groupBy,
  });
  const { data: topCustomers, isLoading: customersLoading } = api.analytics.getRevenueByCustomer.useQuery({
    ...dateRange,
    limit: 10,
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

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
    // Get current data to export (use trends data which has the chart data)
    const exportData = trends || [];

    if (exportData.length === 0) {
      alert('No data available to export');
      return;
    }

    if (format === 'csv') {
      exportToCSV(exportData);
    } else if (format === 'excel') {
      // Excel export would use a library like xlsx
      alert('Excel export requires xlsx library - falling back to CSV');
      exportToCSV(exportData);
    } else if (format === 'pdf') {
      alert('PDF export would use jsPDF - falling back to CSV');
      exportToCSV(exportData);
    }
  };

  const exportToCSV = (data: any[]) => {
    // Create CSV headers
    const headers = ['Period', 'Revenue', 'Orders', 'Average Order Value'];

    // Create CSV rows
    const rows = data.map((item: any) => [
      item.period || item.date || item.month || 'N/A',
      item.revenue?.toFixed(2) || '0.00',
      item.orders || item.orderCount || '0',
      item.averageOrderValue?.toFixed(2) || '0.00',
    ]);

    // Combine headers and rows
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(',')),
    ].join('\n');

    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', `revenue-export-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="analytics-page">
      <div className="page-header">
        <h1>Revenue Analytics</h1>
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
            <div className="kpi-label">Total Revenue</div>
            <div className="kpi-value">{formatCurrency(overview.totalRevenue)}</div>
            <div className="kpi-meta">{overview.invoiceCount} invoices</div>
          </div>

          <div className="kpi-card">
            <div className="kpi-label">Amount Paid</div>
            <div className="kpi-value green">{formatCurrency(overview.paidAmount)}</div>
            <div className="kpi-meta">
              {overview.invoiceCount > 0
                ? Math.round((overview.paidAmount / overview.totalRevenue) * 100)
                : 0}
              % of total
            </div>
          </div>

          <div className="kpi-card">
            <div className="kpi-label">Outstanding</div>
            <div className="kpi-value orange">{formatCurrency(overview.outstandingAmount)}</div>
            <div className="kpi-meta">{overview.outstandingCount} unpaid invoices</div>
          </div>

          <div className="kpi-card">
            <div className="kpi-label">Average Invoice</div>
            <div className="kpi-value">{formatCurrency(overview.averageInvoiceValue)}</div>
            <div className="kpi-meta">Per invoice</div>
          </div>
        </div>
      ) : null}

      {/* Revenue Trends Chart */}
      <div className="chart-container">
        <h2>Revenue Trends</h2>
        {trendsLoading ? (
          <div className="loading-state">Loading trends...</div>
        ) : trends && trends.length > 0 ? (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={trends}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="period" tickFormatter={formatDate} />
              <YAxis tickFormatter={(value) => formatCurrency(value)} />
              <Tooltip
                formatter={(value: number) => formatCurrency(value)}
                labelFormatter={formatDate}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="revenue"
                stroke="#3B82F6"
                strokeWidth={2}
                name="Revenue"
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="empty-state">No data available for selected date range</div>
        )}
      </div>

      {/* Invoice Count Trends */}
      <div className="chart-container">
        <h2>Invoice Volume</h2>
        {trendsLoading ? (
          <div className="loading-state">Loading...</div>
        ) : trends && trends.length > 0 ? (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={trends}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="period" tickFormatter={formatDate} />
              <YAxis />
              <Tooltip labelFormatter={formatDate} />
              <Legend />
              <Bar dataKey="invoiceCount" fill="#10B981" name="Invoices Created" />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="empty-state">No data available</div>
        )}
      </div>

      {/* Top Customers */}
      <div className="chart-container">
        <h2>Top Customers by Revenue</h2>
        {customersLoading ? (
          <div className="loading-state">Loading customers...</div>
        ) : topCustomers && topCustomers.length > 0 ? (
          <div className="customers-grid">
            <div className="customers-chart">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={topCustomers}
                    dataKey="revenue"
                    nameKey="customerName"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label={(entry) => `${entry.customerName}: ${formatCurrency(entry.revenue)}`}
                  >
                    {topCustomers.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="customers-table">
              <table>
                <thead>
                  <tr>
                    <th>Customer</th>
                    <th>Revenue</th>
                    <th>Invoices</th>
                  </tr>
                </thead>
                <tbody>
                  {topCustomers.map((customer, index) => (
                    <tr key={customer.customerId}>
                      <td>
                        <span className="customer-rank" style={{ backgroundColor: COLORS[index % COLORS.length] }}>
                          {index + 1}
                        </span>
                        {customer.customerName}
                      </td>
                      <td className="amount">{formatCurrency(customer.revenue)}</td>
                      <td>{customer.invoiceCount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="empty-state">No customer data available</div>
        )}
      </div>
    </div>
  );
}
