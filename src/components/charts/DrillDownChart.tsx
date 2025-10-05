'use client';

import React, { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Filter } from 'lucide-react';

export interface DrillDownConfig {
  enabled: boolean;
  filterField: string;
  navigationPath?: string;
  onDrillDown?: (dataPoint: any) => void;
  customFilterTransform?: (value: any) => string;
}

export interface ChartDataPoint {
  [key: string]: any;
}

interface DrillDownChartProps {
  type: 'bar' | 'line' | 'pie' | 'area';
  data: ChartDataPoint[];
  dataKey: string | string[];
  xAxisKey?: string;
  title: string;
  description?: string;
  drillDownConfig?: DrillDownConfig;
  colors?: string[];
  height?: number;
  showLegend?: boolean;
}

export function DrillDownChart({
  type,
  data,
  dataKey,
  xAxisKey = 'name',
  title,
  description,
  drillDownConfig,
  colors = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))'],
  height = 300,
  showLegend = true,
}: DrillDownChartProps) {
  const router = useRouter();
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [filteredData, setFilteredData] = useState<ChartDataPoint[]>(data);

  const handleChartClick = useCallback(
    (dataPoint: any) => {
      if (!drillDownConfig?.enabled) return;

      const value = dataPoint[drillDownConfig.filterField];
      if (!value) return;

      // Apply custom transform if provided
      const filterValue = drillDownConfig.customFilterTransform
        ? drillDownConfig.customFilterTransform(value)
        : value;

      // Option 1: Navigation to filtered page
      if (drillDownConfig.navigationPath) {
        const encodedFilter = encodeURIComponent(filterValue);
        router.push(`${drillDownConfig.navigationPath}?filter=${encodedFilter}`);
      }

      // Option 2: Custom drill-down handler
      if (drillDownConfig.onDrillDown) {
        drillDownConfig.onDrillDown(dataPoint);
      }

      // Local filtering
      setActiveFilter(filterValue);
      const filtered = data.filter((item) => item[drillDownConfig.filterField] === value);
      setFilteredData(filtered);
    },
    [drillDownConfig, data, router]
  );

  const handleClearFilter = useCallback(() => {
    setActiveFilter(null);
    setFilteredData(data);
  }, [data]);

  const chartData = activeFilter ? filteredData : data;

  const renderChart = () => {
    const commonProps = {
      data: chartData,
      height,
      onClick: drillDownConfig?.enabled ? handleChartClick : undefined,
      style: drillDownConfig?.enabled ? { cursor: 'pointer' } : undefined,
    };

    switch (type) {
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={height}>
            <BarChart {...commonProps}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              {xAxisKey && (
                <XAxis dataKey={xAxisKey} stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 12 }} />
              )}
              <YAxis stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 12 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
              />
              {showLegend && <Legend />}
              {Array.isArray(dataKey) ? (
                dataKey.map((key, index) => (
                  <Bar
                    key={key}
                    dataKey={key}
                    fill={colors[index % colors.length]}
                    radius={[4, 4, 0, 0]}
                    onClick={handleChartClick}
                  />
                ))
              ) : (
                <Bar dataKey={dataKey} fill={colors[0]} radius={[4, 4, 0, 0]} onClick={handleChartClick} />
              )}
            </BarChart>
          </ResponsiveContainer>
        );

      case 'line':
        return (
          <ResponsiveContainer width="100%" height={height}>
            <LineChart {...commonProps}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              {xAxisKey && (
                <XAxis dataKey={xAxisKey} stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 12 }} />
              )}
              <YAxis stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 12 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
              />
              {showLegend && <Legend />}
              {Array.isArray(dataKey) ? (
                dataKey.map((key, index) => (
                  <Line
                    key={key}
                    type="monotone"
                    dataKey={key}
                    stroke={colors[index % colors.length]}
                    strokeWidth={2}
                    onClick={handleChartClick}
                  />
                ))
              ) : (
                <Line
                  type="monotone"
                  dataKey={dataKey}
                  stroke={colors[0]}
                  strokeWidth={2}
                  onClick={handleChartClick}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        );

      case 'area':
        return (
          <ResponsiveContainer width="100%" height={height}>
            <AreaChart {...commonProps}>
              <defs>
                {Array.isArray(dataKey) ? (
                  dataKey.map((key, index) => (
                    <linearGradient key={`gradient-${key}`} id={`gradient-${key}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={colors[index % colors.length]} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={colors[index % colors.length]} stopOpacity={0} />
                    </linearGradient>
                  ))
                ) : (
                  <linearGradient id="gradient-area" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={colors[0]} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={colors[0]} stopOpacity={0} />
                  </linearGradient>
                )}
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              {xAxisKey && (
                <XAxis dataKey={xAxisKey} stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 12 }} />
              )}
              <YAxis stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 12 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
              />
              {showLegend && <Legend />}
              {Array.isArray(dataKey) ? (
                dataKey.map((key, index) => (
                  <Area
                    key={key}
                    type="monotone"
                    dataKey={key}
                    stroke={colors[index % colors.length]}
                    strokeWidth={2}
                    fill={`url(#gradient-${key})`}
                    onClick={handleChartClick}
                  />
                ))
              ) : (
                <Area
                  type="monotone"
                  dataKey={dataKey}
                  stroke={colors[0]}
                  strokeWidth={2}
                  fill="url(#gradient-area)"
                  onClick={handleChartClick}
                />
              )}
            </AreaChart>
          </ResponsiveContainer>
        );

      case 'pie':
        return (
          <ResponsiveContainer width="100%" height={height}>
            <PieChart>
              <Pie
                data={chartData}
                dataKey={Array.isArray(dataKey) ? dataKey[0] : dataKey}
                nameKey={xAxisKey}
                cx="50%"
                cy="50%"
                outerRadius={80}
                label={(entry) => `${entry[xAxisKey]}: ${entry[Array.isArray(dataKey) ? dataKey[0] : dataKey]}`}
                onClick={handleChartClick}
                style={drillDownConfig?.enabled ? { cursor: 'pointer' } : undefined}
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
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
        );

      default:
        return null;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{title}</CardTitle>
            {description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
          </div>
          {activeFilter && (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Filter className="h-4 w-4" />
                <span>Filtered: {activeFilter}</span>
              </div>
              <Button variant="outline" size="sm" onClick={handleClearFilter}>
                <ArrowLeft className="h-4 w-4 mr-1" />
                Clear Filter
              </Button>
            </div>
          )}
        </div>
        {drillDownConfig?.enabled && !activeFilter && (
          <p className="text-xs text-muted-foreground mt-2">
            💡 Click on chart elements to drill down and filter data
          </p>
        )}
      </CardHeader>
      <CardContent>{renderChart()}</CardContent>
    </Card>
  );
}
