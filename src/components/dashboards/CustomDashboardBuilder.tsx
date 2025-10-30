'use client';
import { log } from '@/lib/logger';

import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Trash2,
  GripVertical,
  Save,
  Eye,
  Download,
  Upload,
  Layout,
  BarChart3,
  PieChart,
  LineChart,
  TrendingUp,
  Package,
} from 'lucide-react';

// Widget type definitions
export type WidgetType = 'metric' | 'chart' | 'table' | 'stat' | 'list' | 'calendar';
export type ChartType = 'bar' | 'line' | 'pie' | 'area';
export type WidgetSize = 'small' | 'medium' | 'large' | 'full';

export interface Widget {
  id: string;
  type: WidgetType;
  title: string;
  dataSource: string;
  size: WidgetSize;
  position: number;
  config: WidgetConfig;
}

export interface WidgetConfig {
  chartType?: ChartType;
  metric?: string;
  format?: 'currency' | 'percentage' | 'number' | 'text';
  color?: string;
  refreshInterval?: number;
  showTrend?: boolean;
  limit?: number;
}

export interface Dashboard {
  id: string;
  name: string;
  description: string;
  widgets: Widget[];
  layout: 'grid' | 'masonry';
  createdAt: Date;
  updatedAt: Date;
}

interface CustomDashboardBuilderProps {
  initialDashboard?: Dashboard;
  availableDataSources: DataSource[];
  onSave: (_dashboard: Dashboard) => Promise<void>;
  onPreview?: (_dashboard: Dashboard) => void;
}

interface DataSource {
  id: string;
  name: string;
  description: string;
  category: string;
  availableMetrics: string[];
}

// Widget template catalog
const WIDGET_TEMPLATES = [
  {
    id: 'metric-card',
    type: 'metric' as WidgetType,
    name: 'Metric Card',
    description: 'Single KPI value with trend',
    icon: TrendingUp,
    defaultSize: 'small' as WidgetSize,
  },
  {
    id: 'bar-chart',
    type: 'chart' as WidgetType,
    name: 'Bar Chart',
    description: 'Vertical bar chart',
    icon: BarChart3,
    defaultSize: 'medium' as WidgetSize,
  },
  {
    id: 'line-chart',
    type: 'chart' as WidgetType,
    name: 'Line Chart',
    description: 'Time series line chart',
    icon: LineChart,
    defaultSize: 'medium' as WidgetSize,
  },
  {
    id: 'pie-chart',
    type: 'chart' as WidgetType,
    name: 'Pie Chart',
    description: 'Circular distribution chart',
    icon: PieChart,
    defaultSize: 'small' as WidgetSize,
  },
  {
    id: 'data-table',
    type: 'table' as WidgetType,
    name: 'Data Table',
    description: 'Tabular data display',
    icon: Layout,
    defaultSize: 'large' as WidgetSize,
  },
  {
    id: 'stat-grid',
    type: 'stat' as WidgetType,
    name: 'Stat Grid',
    description: 'Multiple statistics in grid',
    icon: Package,
    defaultSize: 'medium' as WidgetSize,
  },
];

const SIZE_CONFIGS = {
  small: { label: 'Small', cols: 1, rows: 1 },
  medium: { label: 'Medium', cols: 2, rows: 1 },
  large: { label: 'Large', cols: 2, rows: 2 },
  full: { label: 'Full Width', cols: 4, rows: 1 },
};

export function CustomDashboardBuilder({
  initialDashboard,
  availableDataSources,
  onSave,
  onPreview,
}: CustomDashboardBuilderProps) {
  const [dashboard, setDashboard] = useState<Dashboard>(
    initialDashboard || {
      id: '',
      name: '',
      description: '',
      widgets: [],
      layout: 'grid',
      createdAt: new Date(),
      updatedAt: new Date(),
    }
  );

  const [selectedWidget, setSelectedWidget] = useState<Widget | null>(null);
  const [saving, setSaving] = useState(false);

  // Add widget to dashboard
  const handleAddWidget = useCallback(
    (templateId: string) => {
      const template = WIDGET_TEMPLATES.find((t) => t.id === templateId);
      if (!template) return;

      const newWidget: Widget = {
        id: `widget-${Date.now()}`,
        type: template.type,
        title: template.name,
        dataSource: '',
        size: template.defaultSize,
        position: dashboard.widgets.length,
        config: {
          chartType: template.type === 'chart' ? 'bar' : undefined,
          format: 'number',
          refreshInterval: 30000,
          showTrend: true,
          limit: 10,
        },
      };

      setDashboard((prev) => ({
        ...prev,
        widgets: [...prev.widgets, newWidget],
        updatedAt: new Date(),
      }));
    },
    [dashboard.widgets.length]
  );

  // Remove widget
  const handleRemoveWidget = useCallback((widgetId: string) => {
    setDashboard((prev) => ({
      ...prev,
      widgets: prev.widgets.filter((w) => w.id !== widgetId),
      updatedAt: new Date(),
    }));
    setSelectedWidget(null);
  }, []);

  // Update widget
  const handleUpdateWidget = useCallback((widgetId: string, updates: Partial<Widget>) => {
    setDashboard((prev) => ({
      ...prev,
      widgets: prev.widgets.map((w) => (w.id === widgetId ? { ...w, ...updates } : w)),
      updatedAt: new Date(),
    }));
  }, []);

  // Move widget up/down
  const handleMoveWidget = useCallback((widgetId: string, direction: 'up' | 'down') => {
    setDashboard((prev) => {
      const widgets = [...prev.widgets];
      const index = widgets.findIndex((w) => w.id === widgetId);
      if (index === -1) return prev;

      const newIndex = direction === 'up' ? index - 1 : index + 1;
      if (newIndex < 0 || newIndex >= widgets.length) return prev;

      // eslint-disable-next-line security/detect-object-injection
      [widgets[index], widgets[newIndex]] = [widgets[newIndex], widgets[index]];
      // eslint-disable-next-line security/detect-object-injection
      widgets[index].position = index;
      // eslint-disable-next-line security/detect-object-injection
      widgets[newIndex].position = newIndex;

      return {
        ...prev,
        widgets,
        updatedAt: new Date(),
      };
    });
  }, []);

  // Save dashboard
  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(dashboard);
    } finally {
      setSaving(false);
    }
  };

  // Export dashboard configuration
  const handleExport = () => {
    const json = JSON.stringify(dashboard, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dashboard-${dashboard.name || 'config'}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Import dashboard configuration
  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const imported = JSON.parse(e.target?.result as string) as Dashboard;
        setDashboard({
          ...imported,
          id: '', // New ID will be assigned on save
          updatedAt: new Date(),
        });
      } catch (error) {
        log.error('Failed to import dashboard:', { error });
        alert('Invalid dashboard configuration file');
      }
    };
    reader.readAsText(file);
  };

  // Group data sources by category
  const dataSourcesByCategory = availableDataSources.reduce((acc, ds) => {
    if (!acc[ds.category]) acc[ds.category] = [];
    acc[ds.category].push(ds);
    return acc;
  }, {} as Record<string, DataSource[]>);

  return (
    <div className="custom-dashboard-builder">
      {/* Header */}
      <Card className="builder-header">
        <CardHeader>
          <div className="builder-header-content">
            <div className="builder-title-section">
              <CardTitle>Dashboard Builder</CardTitle>
              <CardDescription>Create and customize your own dashboard</CardDescription>
            </div>
            <div className="builder-actions">
              {onPreview && (
                <Button variant="outline" onClick={() => onPreview(dashboard)} className="btn-preview">
                  <Eye className="h-4 w-4 mr-2" />
                  Preview
                </Button>
              )}
              <Button variant="outline" onClick={handleExport} className="btn-export">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <label className="btn-import-label">
                <Button variant="outline" className="btn-import">
                  <Upload className="h-4 w-4 mr-2" />
                  Import
                </Button>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImport}
                  className="import-file-input"
                />
              </label>
              <Button onClick={handleSave} disabled={saving || !dashboard.name} className="btn-save">
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Saving...' : 'Save Dashboard'}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Dashboard Info */}
          <div className="dashboard-info-grid">
            <div className="dashboard-info-field">
              <Label htmlFor="dashboard-name">Dashboard Name *</Label>
              <Input
                id="dashboard-name"
                value={dashboard.name}
                onChange={(e) => setDashboard((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="My Custom Dashboard"
                required
              />
            </div>
            <div className="dashboard-info-field">
              <Label htmlFor="dashboard-description">Description</Label>
              <Input
                id="dashboard-description"
                value={dashboard.description}
                onChange={(e) => setDashboard((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="Dashboard description..."
              />
            </div>
            <div className="dashboard-info-field">
              <Label htmlFor="dashboard-layout">Layout</Label>
              <Select
                value={dashboard.layout}
                onValueChange={(value: 'grid' | 'masonry') =>
                  setDashboard((prev) => ({ ...prev, layout: value }))
                }
              >
                <SelectTrigger id="dashboard-layout">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="grid">Grid Layout</SelectItem>
                  <SelectItem value="masonry">Masonry Layout</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="builder-workspace">
        {/* Widget Catalog */}
        <Card className="widget-catalog">
          <CardHeader>
            <CardTitle>Widget Catalog</CardTitle>
            <CardDescription>Drag or click to add widgets</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="widget-templates">
              {WIDGET_TEMPLATES.map((template) => {
                const Icon = template.icon;
                return (
                  <button
                    key={template.id}
                    className="widget-template-card"
                    onClick={() => handleAddWidget(template.id)}
                    title={template.description}
                  >
                    <Icon className="template-icon" />
                    <span className="template-name">{template.name}</span>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Dashboard Canvas */}
        <Card className="dashboard-canvas">
          <CardHeader>
            <div className="canvas-header">
              <div>
                <CardTitle>{dashboard.name || 'Untitled Dashboard'}</CardTitle>
                <CardDescription>{dashboard.widgets.length} widgets</CardDescription>
              </div>
              {dashboard.widgets.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setDashboard((prev) => ({ ...prev, widgets: [] }))}
                  className="btn-clear-all"
                >
                  Clear All
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {dashboard.widgets.length === 0 ? (
              <div className="canvas-empty-state">
                <Layout className="empty-icon" />
                <p className="empty-title">No widgets yet</p>
                <p className="empty-description">
                  Click on widgets from the catalog to add them to your dashboard
                </p>
              </div>
            ) : (
              <div className="widgets-list">
                {dashboard.widgets.map((widget, index) => (
                  <div
                    key={widget.id}
                    className={`widget-item ${selectedWidget?.id === widget.id ? 'widget-item-selected' : ''}`}
                    onClick={() => setSelectedWidget(widget)}
                  >
                    <div className="widget-item-header">
                      <div className="widget-item-drag">
                        <GripVertical className="drag-icon" />
                      </div>
                      <div className="widget-item-info">
                        <h4 className="widget-item-title">{widget.title}</h4>
                        <p className="widget-item-meta">
                          {widget.type} • {SIZE_CONFIGS[widget.size].label}
                        </p>
                      </div>
                      <div className="widget-item-actions">
                        {index > 0 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMoveWidget(widget.id, 'up');
                            }}
                            title="Move up"
                            className="btn-move"
                          >
                            ↑
                          </Button>
                        )}
                        {index < dashboard.widgets.length - 1 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMoveWidget(widget.id, 'down');
                            }}
                            title="Move down"
                            className="btn-move"
                          >
                            ↓
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveWidget(widget.id);
                          }}
                          title="Remove widget"
                          className="btn-remove"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Widget Configuration */}
        {selectedWidget && (
          <Card className="widget-config">
            <CardHeader>
              <div className="config-header">
                <CardTitle>Widget Settings</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedWidget(null)}
                  className="btn-close-config"
                >
                  ×
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="config-form">
                {/* Widget Title */}
                <div className="config-field">
                  <Label htmlFor="widget-title">Title</Label>
                  <Input
                    id="widget-title"
                    value={selectedWidget.title}
                    onChange={(e) =>
                      handleUpdateWidget(selectedWidget.id, { title: e.target.value })
                    }
                    placeholder="Widget title"
                  />
                </div>

                {/* Data Source */}
                <div className="config-field">
                  <Label htmlFor="widget-datasource">Data Source</Label>
                  <Select
                    value={selectedWidget.dataSource}
                    onValueChange={(value) =>
                      handleUpdateWidget(selectedWidget.id, { dataSource: value })
                    }
                  >
                    <SelectTrigger id="widget-datasource">
                      <SelectValue placeholder="Select data source..." />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(dataSourcesByCategory).map(([category, sources]) => (
                        <div key={category}>
                          <div className="select-category-label">{category}</div>
                          {sources.map((source) => (
                            <SelectItem key={source.id} value={source.id}>
                              {source.name}
                            </SelectItem>
                          ))}
                        </div>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Size */}
                <div className="config-field">
                  <Label htmlFor="widget-size">Size</Label>
                  <Select
                    value={selectedWidget.size}
                    onValueChange={(value: WidgetSize) =>
                      handleUpdateWidget(selectedWidget.id, { size: value })
                    }
                  >
                    <SelectTrigger id="widget-size">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(SIZE_CONFIGS).map(([key, config]) => (
                        <SelectItem key={key} value={key}>
                          {config.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Chart Type (if chart widget) */}
                {selectedWidget.type === 'chart' && (
                  <div className="config-field">
                    <Label htmlFor="widget-chart-type">Chart Type</Label>
                    <Select
                      value={selectedWidget.config.chartType}
                      onValueChange={(value: ChartType) =>
                        handleUpdateWidget(selectedWidget.id, {
                          config: { ...selectedWidget.config, chartType: value },
                        })
                      }
                    >
                      <SelectTrigger id="widget-chart-type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="bar">Bar Chart</SelectItem>
                        <SelectItem value="line">Line Chart</SelectItem>
                        <SelectItem value="pie">Pie Chart</SelectItem>
                        <SelectItem value="area">Area Chart</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Refresh Interval */}
                <div className="config-field">
                  <Label htmlFor="widget-refresh">Refresh Interval (seconds)</Label>
                  <Input
                    id="widget-refresh"
                    type="number"
                    value={(selectedWidget.config.refreshInterval || 30000) / 1000}
                    onChange={(e) =>
                      handleUpdateWidget(selectedWidget.id, {
                        config: {
                          ...selectedWidget.config,
                          refreshInterval: parseInt(e.target.value) * 1000,
                        },
                      })
                    }
                    min={5}
                    max={300}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

export default CustomDashboardBuilder;
