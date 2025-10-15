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
 * Quality Analytics Dashboard
 *
 * Comprehensive quality analytics with:
 * - Quality overview (inspections, pass rate, defects)
 * - Defect trends over time
 * - Defects by category
 * - Pass/fail breakdown
 * - Export functionality
 */

const RESULT_COLORS: Record<string, string> = {
  passed: '#10B981',
  failed: '#EF4444',
  pending: '#F59E0B',
  conditional: '#3B82F6',
};

const CATEGORY_COLORS = ['#EF4444', '#F59E0B', '#3B82F6', '#8B5CF6', '#EC4899', '#10B981'];

export default function QualityAnalyticsPage() {
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().setMonth(new Date().getMonth() - 6)).toISOString(),
    endDate: new Date().toISOString(),
  });
  const [groupBy, setGroupBy] = useState<'day' | 'week' | 'month'>('month');

  // Fetch analytics data
  const { data: overview, isLoading: overviewLoading} = api.analytics.getQualityOverview.useQuery(dateRange);
  const { data: defectTrends, isLoading: trendsLoading } = api.analytics.getDefectTrends.useQuery({
    ...dateRange,
    groupBy,
  });
  const { data: defectCategories, isLoading: categoriesLoading } = api.analytics.getDefectsByCategory.useQuery({
    ...dateRange,
    limit: 10,
  });

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

  // Prepare result breakdown for pie chart
  const resultData = overview?.resultBreakdown.map(r => ({
    name: r.result.toUpperCase(),
    value: r.count,
    fill: RESULT_COLORS[r.result] || '#64748B',
  })) || [];

  return (
    <div className="analytics-page">
      <div className="page-header">
        <h1>Quality Analytics</h1>
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
            <div className="kpi-label">Total Inspections</div>
            <div className="kpi-value">{overview.totalInspections}</div>
            <div className="kpi-meta">Quality checks performed</div>
          </div>

          <div className="kpi-card">
            <div className="kpi-label">Pass Rate</div>
            <div className={`kpi-value ${overview.passRate >= 95 ? 'green' : overview.passRate >= 90 ? 'orange' : 'red'}`}>
              {overview.passRate}%
            </div>
            <div className="kpi-meta">Target: 95% or higher</div>
          </div>

          <div className="kpi-card">
            <div className="kpi-label">Total Defects</div>
            <div className="kpi-value red">{overview.totalDefects}</div>
            <div className="kpi-meta">Across all inspections</div>
          </div>

          <div className="kpi-card">
            <div className="kpi-label">Defects per Inspection</div>
            <div className="kpi-value">
              {overview.totalInspections > 0
                ? (overview.totalDefects / overview.totalInspections).toFixed(2)
                : '0.00'}
            </div>
            <div className="kpi-meta">Average defect rate</div>
          </div>
        </div>
      ) : null}

      {/* Inspection Results Breakdown */}
      {!overviewLoading && resultData.length > 0 && (
        <div className="chart-container">
          <h2>Inspection Results Distribution</h2>
          <ResponsiveContainer width="100%" height={400}>
            <PieChart>
              <Pie
                data={resultData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={120}
                label={(entry) => `${entry.name}: ${entry.value}`}
              >
                {resultData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Defect Trends */}
      <div className="chart-container">
        <h2>Defect Trends Over Time</h2>
        {trendsLoading ? (
          <div className="loading-state">Loading trends...</div>
        ) : defectTrends && defectTrends.length > 0 ? (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={defectTrends}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="period" tickFormatter={formatDate} />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip labelFormatter={formatDate} />
              <Legend />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="defectCount"
                stroke="#EF4444"
                strokeWidth={2}
                name="Defects"
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="defectRate"
                stroke="#F59E0B"
                strokeWidth={2}
                name="Defect Rate (%)"
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="empty-state">No defect data available for selected date range</div>
        )}
      </div>

      {/* Defects by Category */}
      <div className="chart-container">
        <h2>Top Defect Categories</h2>
        {categoriesLoading ? (
          <div className="loading-state">Loading categories...</div>
        ) : defectCategories && defectCategories.length > 0 ? (
          <div className="categories-grid">
            <div className="categories-chart">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={defectCategories} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="category" type="category" width={150} />
                  <Tooltip />
                  <Bar dataKey="defectCount" name="Defects">
                    {defectCategories.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="categories-table">
              <table>
                <thead>
                  <tr>
                    <th>Rank</th>
                    <th>Category</th>
                    <th>Defects</th>
                    <th>Percentage</th>
                  </tr>
                </thead>
                <tbody>
                  {defectCategories.map((cat, index) => {
                    const total = defectCategories.reduce((sum, c) => sum + c.defectCount, 0);
                    const percentage = total > 0 ? ((cat.defectCount / total) * 100).toFixed(1) : '0.0';
                    return (
                      <tr key={index}>
                        <td>
                          <span className="rank-badge" style={{ backgroundColor: CATEGORY_COLORS[index % CATEGORY_COLORS.length] }}>
                            {index + 1}
                          </span>
                        </td>
                        <td>{cat.category}</td>
                        <td className="amount">{cat.defectCount}</td>
                        <td>{percentage}%</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="empty-state">No defect category data available</div>
        )}
      </div>

      {/* Quality Insights */}
      <div className="insights-container">
        <h2>Quality Insights</h2>
        <div className="insights-grid">
          {overview && overview.passRate >= 95 && (
            <div className="insight-card success">
              <div className="insight-icon">✅</div>
              <div className="insight-content">
                <h3>Excellent Quality</h3>
                <p>
                  Pass rate of <strong>{overview.passRate}%</strong> meets or exceeds the 95% target.
                  Quality control processes are working effectively.
                </p>
              </div>
            </div>
          )}

          {overview && overview.passRate < 95 && overview.passRate >= 90 && (
            <div className="insight-card warning">
              <div className="insight-icon">⚠️</div>
              <div className="insight-content">
                <h3>Approaching Target</h3>
                <p>
                  Pass rate is <strong>{overview.passRate}%</strong>, slightly below the 95% target.
                  Review recent failures to identify improvement opportunities.
                </p>
              </div>
            </div>
          )}

          {overview && overview.passRate < 90 && (
            <div className="insight-card error">
              <div className="insight-icon">❌</div>
              <div className="insight-content">
                <h3>Quality Improvement Required</h3>
                <p>
                  Pass rate of <strong>{overview.passRate}%</strong> is significantly below target.
                  Immediate action required to improve quality control processes.
                </p>
              </div>
            </div>
          )}

          {defectCategories && defectCategories.length > 0 && (
            <div className="insight-card">
              <div className="insight-icon">🎯</div>
              <div className="insight-content">
                <h3>Top Defect Category</h3>
                <p>
                  <strong>{defectCategories[0].category}</strong> is the most common defect type
                  with {defectCategories[0].defectCount} occurrences.
                  Focus improvement efforts on this category.
                </p>
              </div>
            </div>
          )}

          {defectTrends && defectTrends.length >= 2 && (
            <div className="insight-card">
              <div className="insight-icon">📊</div>
              <div className="insight-content">
                <h3>Trend Analysis</h3>
                <p>
                  {defectTrends[defectTrends.length - 1].defectCount < defectTrends[defectTrends.length - 2].defectCount ? (
                    <>Defects are <strong>decreasing</strong> - quality improvement trend detected!</>
                  ) : defectTrends[defectTrends.length - 1].defectCount > defectTrends[defectTrends.length - 2].defectCount ? (
                    <>Defects are <strong>increasing</strong> - review recent process changes.</>
                  ) : (
                    <>Defect levels are <strong>stable</strong> - maintain current quality practices.</>
                  )}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
