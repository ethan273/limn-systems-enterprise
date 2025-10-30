'use client';
import { log } from '@/lib/logger';

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ArrowUp,
  ArrowDown,
  Minus,
  Download,
  RefreshCw,
  Calendar,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import { format } from 'date-fns';

// Dashboard type definition
export interface DashboardOption {
  id: string;
  name: string;
  category: string;
}

// Metric comparison data structure
export interface MetricComparison {
  name: string;
  leftValue: number | string;
  rightValue: number | string;
  unit?: string;
  format?: 'number' | 'currency' | 'percentage' | 'text';
  category?: string;
}

// Comparison result with calculated differences
interface ComparisonResult extends MetricComparison {
  difference: number | null;
  percentageChange: number | null;
  trend: 'up' | 'down' | 'neutral';
  isSignificant: boolean; // >10% change
}

interface DashboardComparisonViewProps {
  availableDashboards: DashboardOption[];
  onCompare: (_leftDashboardId: string, _rightDashboardId: string, _dateRange: DateRange) => Promise<MetricComparison[]>;
  defaultLeftDashboard?: string;
  defaultRightDashboard?: string;
  onExportComparison?: (_comparison: ComparisonResult[]) => void;
}

interface DateRange {
  start: Date;
  end: Date;
}

export function DashboardComparisonView({
  availableDashboards,
  onCompare,
  defaultLeftDashboard,
  defaultRightDashboard,
  onExportComparison,
}: DashboardComparisonViewProps) {
  const [leftDashboard, setLeftDashboard] = useState<string>(defaultLeftDashboard || '');
  const [rightDashboard, setRightDashboard] = useState<string>(defaultRightDashboard || '');
  const [dateRange, _setDateRange] = useState<DateRange>({
    start: new Date(new Date().setDate(new Date().getDate() - 30)),
    end: new Date(),
  });
  const [metrics, setMetrics] = useState<MetricComparison[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastCompared, setLastCompared] = useState<Date | null>(null);

  // Group dashboards by category
  const dashboardsByCategory = useMemo(() => {
    const grouped: Record<string, DashboardOption[]> = {};
    availableDashboards.forEach((dashboard) => {
      if (!grouped[dashboard.category]) {
        grouped[dashboard.category] = [];
      }
      grouped[dashboard.category].push(dashboard);
    });
    return grouped;
  }, [availableDashboards]);

  // Calculate comparison results
  const comparisonResults: ComparisonResult[] = useMemo(() => {
    return metrics.map((metric) => {
      const leftNum = typeof metric.leftValue === 'number' ? metric.leftValue : parseFloat(String(metric.leftValue));
      const rightNum = typeof metric.rightValue === 'number' ? metric.rightValue : parseFloat(String(metric.rightValue));

      let difference: number | null = null;
      let percentageChange: number | null = null;
      let trend: 'up' | 'down' | 'neutral' = 'neutral';

      if (!isNaN(leftNum) && !isNaN(rightNum)) {
        difference = rightNum - leftNum;
        if (leftNum !== 0) {
          percentageChange = ((rightNum - leftNum) / leftNum) * 100;
        }

        if (difference > 0) {
          trend = 'up';
        } else if (difference < 0) {
          trend = 'down';
        }
      }

      const isSignificant = percentageChange !== null && Math.abs(percentageChange) > 10;

      return {
        ...metric,
        difference,
        percentageChange,
        trend,
        isSignificant,
      };
    });
  }, [metrics]);

  // Group comparison results by category
  const comparisonsByCategory = useMemo(() => {
    const grouped: Record<string, ComparisonResult[]> = { Uncategorized: [] };
    comparisonResults.forEach((result) => {
      const category = result.category || 'Uncategorized';
      // eslint-disable-next-line security/detect-object-injection
      if (!grouped[category]) {
        // eslint-disable-next-line security/detect-object-injection
        grouped[category] = [];
      }
      // eslint-disable-next-line security/detect-object-injection
      grouped[category].push(result);
    });
    return grouped;
  }, [comparisonResults]);

  // Handle comparison execution
  const handleCompare = async () => {
    if (!leftDashboard || !rightDashboard) return;
    if (leftDashboard === rightDashboard) {
      alert('Please select two different dashboards to compare.');
      return;
    }

    setLoading(true);
    try {
      const results = await onCompare(leftDashboard, rightDashboard, dateRange);
      setMetrics(results);
      setLastCompared(new Date());
    } catch (error) {
      log.error('Comparison failed:', { error });
      alert('Failed to compare dashboards. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle export
  const handleExport = () => {
    if (onExportComparison) {
      onExportComparison(comparisonResults);
    }
  };

  // Format value based on type
  const formatValue = (value: number | string, format?: string, unit?: string): string => {
    if (typeof value === 'string') return value;

    switch (format) {
      case 'currency':
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
        }).format(value);
      case 'percentage':
        return `${value.toFixed(2)}%`;
      case 'number':
        return new Intl.NumberFormat('en-US').format(value);
      default:
        return unit ? `${value} ${unit}` : String(value);
    }
  };

  // Render difference indicator
  const renderDifferenceIndicator = (result: ComparisonResult) => {
    if (result.difference === null || result.percentageChange === null) {
      return (
        <div className="comparison-indicator neutral">
          <Minus className="h-4 w-4" />
          <span>N/A</span>
        </div>
      );
    }

    const Icon = result.trend === 'up' ? ArrowUp : result.trend === 'down' ? ArrowDown : Minus;
    const colorClass =
      result.trend === 'up'
        ? 'comparison-indicator positive'
        : result.trend === 'down'
        ? 'comparison-indicator negative'
        : 'comparison-indicator neutral';

    return (
      <div className={colorClass}>
        <Icon className="h-4 w-4" />
        <span>{result.percentageChange.toFixed(2)}%</span>
        {result.isSignificant && <Badge className="ml-2">Significant</Badge>}
      </div>
    );
  };

  // Get dashboard name by ID
  const getDashboardName = (id: string): string => {
    return availableDashboards.find((d) => d.id === id)?.name || 'Unknown';
  };

  return (
    <div className="dashboard-comparison-view">
      {/* Header Section */}
      <Card className="comparison-header">
        <CardHeader>
          <CardTitle>Dashboard Comparison</CardTitle>
          <CardDescription>
            Compare metrics side-by-side from different dashboards with synchronized date ranges
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Dashboard Selection */}
          <div className="comparison-controls">
            <div className="dashboard-selector">
              <label className="selector-label">Left Dashboard</label>
              <Select value={leftDashboard} onValueChange={setLeftDashboard}>
                <SelectTrigger>
                  <SelectValue placeholder="Select dashboard..." />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(dashboardsByCategory).map(([category, dashboards]) => (
                    <div key={category}>
                      <div className="select-category-label">{category}</div>
                      {dashboards.map((dashboard) => (
                        <SelectItem key={dashboard.id} value={dashboard.id}>
                          {dashboard.name}
                        </SelectItem>
                      ))}
                    </div>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="dashboard-selector">
              <label className="selector-label">Right Dashboard</label>
              <Select value={rightDashboard} onValueChange={setRightDashboard}>
                <SelectTrigger>
                  <SelectValue placeholder="Select dashboard..." />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(dashboardsByCategory).map(([category, dashboards]) => (
                    <div key={category}>
                      <div className="select-category-label">{category}</div>
                      {dashboards.map((dashboard) => (
                        <SelectItem key={dashboard.id} value={dashboard.id}>
                          {dashboard.name}
                        </SelectItem>
                      ))}
                    </div>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="dashboard-selector">
              <label className="selector-label">Date Range</label>
              <div className="date-range-display">
                <Calendar className="h-4 w-4" />
                <span>
                  {format(dateRange.start, 'MMM dd, yyyy')} - {format(dateRange.end, 'MMM dd, yyyy')}
                </span>
              </div>
            </div>

            <div className="comparison-actions">
              <Button
                onClick={handleCompare}
                disabled={!leftDashboard || !rightDashboard || loading}
                className="btn-primary"
              >
                {loading ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                    Comparing...
                  </>
                ) : (
                  <>Compare Dashboards</>
                )}
              </Button>
              {comparisonResults.length > 0 && onExportComparison && (
                <Button onClick={handleExport} variant="outline" className="btn-secondary">
                  <Download className="h-4 w-4 mr-2" />
                  Export Comparison
                </Button>
              )}
            </div>
          </div>

          {lastCompared && (
            <div className="last-compared-info">
              Last compared: {format(lastCompared, 'MMM dd, yyyy HH:mm:ss')}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Comparison Results */}
      {comparisonResults.length > 0 && (
        <div className="comparison-results">
          {/* Summary Stats */}
          <Card className="comparison-summary">
            <CardHeader>
              <CardTitle>Comparison Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="summary-stats">
                <div className="stat-card">
                  <div className="stat-label">Metrics Compared</div>
                  <div className="stat-value">{comparisonResults.length}</div>
                </div>
                <div className="stat-card">
                  <div className="stat-label">Significant Changes</div>
                  <div className="stat-value">
                    {comparisonResults.filter((r) => r.isSignificant).length}
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-label">Increases</div>
                  <div className="stat-value stat-positive">
                    <TrendingUp className="h-4 w-4" />
                    {comparisonResults.filter((r) => r.trend === 'up').length}
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-label">Decreases</div>
                  <div className="stat-value stat-negative">
                    <TrendingDown className="h-4 w-4" />
                    {comparisonResults.filter((r) => r.trend === 'down').length}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Detailed Comparison Table */}
          {Object.entries(comparisonsByCategory).map(([category, results]) => (
            <Card key={category} className="comparison-category">
              <CardHeader>
                <CardTitle>{category}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="comparison-table">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Metric</th>
                        <th>{getDashboardName(leftDashboard)}</th>
                        <th>{getDashboardName(rightDashboard)}</th>
                        <th>Difference</th>
                        <th>Change</th>
                      </tr>
                    </thead>
                    <tbody>
                      {results.map((result, index) => (
                        <tr key={`${category}-${index}`} className={result.isSignificant ? 'row-significant' : ''}>
                          <td className="metric-name">{result.name}</td>
                          <td className="metric-value">
                            {formatValue(result.leftValue, result.format, result.unit)}
                          </td>
                          <td className="metric-value">
                            {formatValue(result.rightValue, result.format, result.unit)}
                          </td>
                          <td className="metric-difference">
                            {result.difference !== null
                              ? formatValue(Math.abs(result.difference), result.format, result.unit)
                              : 'N/A'}
                          </td>
                          <td className="metric-change">{renderDifferenceIndicator(result)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Empty State */}
      {comparisonResults.length === 0 && !loading && (
        <Card className="comparison-empty-state">
          <CardContent>
            <div className="empty-state-content">
              <p className="empty-state-title">No comparison data yet</p>
              <p className="empty-state-description">
                Select two dashboards and click &quot;Compare Dashboards&quot; to see side-by-side metrics comparison
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default DashboardComparisonView;
