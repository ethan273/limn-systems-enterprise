# Dashboard Comparison View

## Overview

A powerful side-by-side dashboard comparison system that enables users to compare metrics from different dashboards with synchronized date ranges, visual diff indicators, and export capabilities.

## Features

✅ **Side-by-Side Comparison** - Compare any two dashboards simultaneously
✅ **Dashboard Categories** - Organized dropdown selection by category
✅ **Synchronized Date Ranges** - Consistent time period comparison
✅ **Visual Diff Indicators** - Color-coded arrows and percentage changes
✅ **Significant Change Highlighting** - Automatic detection of changes >10%
✅ **Comparison Summary** - Quick stats overview (total metrics, significant changes, increases/decreases)
✅ **Categorized Results** - Metrics grouped by category for clarity
✅ **Export Functionality** - Export comparison data for reporting
✅ **Responsive Design** - Mobile-friendly layout
✅ **Real-time Calculations** - Automatic percentage change and trend detection

## Quick Start

### Basic Usage

```tsx
import { DashboardComparisonView } from '@/components/dashboards/DashboardComparisonView';

const availableDashboards = [
  { id: 'financial', name: 'Financial Dashboard', category: 'Finance' },
  { id: 'production', name: 'Production Dashboard', category: 'Operations' },
  { id: 'sales', name: 'Sales Dashboard', category: 'Sales' },
];

async function handleCompare(leftId: string, rightId: string, dateRange: DateRange) {
  // Fetch data from both dashboards
  const leftData = await fetchDashboardData(leftId, dateRange);
  const rightData = await fetchDashboardData(rightId, dateRange);

  // Return comparison metrics
  return [
    {
      name: 'Total Revenue',
      leftValue: leftData.revenue,
      rightValue: rightData.revenue,
      format: 'currency',
      category: 'Financial Metrics',
    },
    // ... more metrics
  ];
}

function MyComparisonPage() {
  return (
    <DashboardComparisonView
      availableDashboards={availableDashboards}
      onCompare={handleCompare}
      defaultLeftDashboard="financial"
      defaultRightDashboard="production"
    />
  );
}
```

## Component Props

### Required Props

| Prop | Type | Description |
|------|------|-------------|
| `availableDashboards` | `DashboardOption[]` | List of dashboards available for comparison |
| `onCompare` | `(leftId: string, rightId: string, dateRange: DateRange) => Promise<MetricComparison[]>` | Comparison callback function |

### Optional Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `defaultLeftDashboard` | `string` | `''` | Default left dashboard ID |
| `defaultRightDashboard` | `string` | `''` | Default right dashboard ID |
| `onExportComparison` | `(comparison: ComparisonResult[]) => void` | - | Export handler function |

## Data Types

### DashboardOption

```typescript
interface DashboardOption {
  id: string;           // Unique dashboard identifier
  name: string;         // Display name for dashboard
  category: string;     // Category grouping (Finance, Operations, Sales, etc.)
}
```

### MetricComparison

```typescript
interface MetricComparison {
  name: string;                // Metric display name
  leftValue: number | string;  // Left dashboard value
  rightValue: number | string; // Right dashboard value
  unit?: string;              // Optional unit label (e.g., "units", "days")
  format?: 'number' | 'currency' | 'percentage' | 'text'; // Value format type
  category?: string;          // Metric category for grouping
}
```

### DateRange

```typescript
interface DateRange {
  start: Date;  // Start date for data range
  end: Date;    // End date for data range
}
```

## Metric Formatting

The component automatically formats values based on the `format` property:

### Currency Format

```typescript
{
  name: 'Total Revenue',
  leftValue: 125000,
  rightValue: 150000,
  format: 'currency', // Displays as: $125,000.00 vs $150,000.00
  category: 'Financial',
}
```

### Percentage Format

```typescript
{
  name: 'Growth Rate',
  leftValue: 15.5,
  rightValue: 18.2,
  format: 'percentage', // Displays as: 15.50% vs 18.20%
  category: 'Performance',
}
```

### Number Format

```typescript
{
  name: 'Total Orders',
  leftValue: 1234,
  rightValue: 1567,
  format: 'number', // Displays as: 1,234 vs 1,567
  category: 'Operations',
}
```

### Custom Units

```typescript
{
  name: 'Lead Time',
  leftValue: 5,
  rightValue: 3,
  unit: 'days', // Displays as: 5 days vs 3 days
  category: 'Logistics',
}
```

## Trend Detection

The component automatically calculates and displays:

### Percentage Change

Shows the percentage difference between left and right values:
- Green (positive) for increases
- Red (negative) for decreases
- Gray (neutral) for no change or non-numeric values

### Significant Changes

Highlights rows where the percentage change exceeds 10%:
- Background tint applied to table row
- "Significant" badge displayed
- Counted in summary statistics

### Visual Indicators

- **Arrow Up (↑)** - Right value is higher (positive change)
- **Arrow Down (↓)** - Right value is lower (negative change)
- **Minus (-)** - No change or non-comparable values

## Implementation Examples

### Financial Dashboards Comparison

```typescript
const metrics: MetricComparison[] = [
  {
    name: 'Total Revenue',
    leftValue: 1250000,
    rightValue: 1450000,
    format: 'currency',
    category: 'Revenue Metrics',
  },
  {
    name: 'Operating Expenses',
    leftValue: 850000,
    rightValue: 920000,
    format: 'currency',
    category: 'Expense Metrics',
  },
  {
    name: 'Net Profit Margin',
    leftValue: 32.5,
    rightValue: 36.8,
    format: 'percentage',
    category: 'Profitability',
  },
  {
    name: 'AR Turnover Rate',
    leftValue: 8.2,
    rightValue: 9.5,
    format: 'number',
    unit: 'times/year',
    category: 'Efficiency Metrics',
  },
];
```

### Production Dashboards Comparison

```typescript
const metrics: MetricComparison[] = [
  {
    name: 'Units Produced',
    leftValue: 15234,
    rightValue: 16789,
    format: 'number',
    unit: 'units',
    category: 'Output Metrics',
  },
  {
    name: 'Defect Rate',
    leftValue: 2.3,
    rightValue: 1.8,
    format: 'percentage',
    category: 'Quality Metrics',
  },
  {
    name: 'Average Cycle Time',
    leftValue: 45,
    rightValue: 38,
    unit: 'minutes',
    category: 'Efficiency',
  },
  {
    name: 'Equipment Utilization',
    leftValue: 87.5,
    rightValue: 91.2,
    format: 'percentage',
    category: 'Capacity Metrics',
  },
];
```

### Sales Dashboards Comparison

```typescript
const metrics: MetricComparison[] = [
  {
    name: 'Total Orders',
    leftValue: 1234,
    rightValue: 1567,
    format: 'number',
    category: 'Volume Metrics',
  },
  {
    name: 'Average Order Value',
    leftValue: 485.50,
    rightValue: 512.25,
    format: 'currency',
    category: 'Revenue Metrics',
  },
  {
    name: 'Conversion Rate',
    leftValue: 3.2,
    rightValue: 3.8,
    format: 'percentage',
    category: 'Performance',
  },
  {
    name: 'Customer Acquisition Cost',
    leftValue: 125,
    rightValue: 108,
    format: 'currency',
    category: 'Marketing Efficiency',
  },
];
```

## Export Functionality

Implement custom export logic via the `onExportComparison` callback:

### CSV Export Example

```typescript
function handleExport(comparison: ComparisonResult[]) {
  const headers = ['Metric', 'Left Value', 'Right Value', 'Difference', 'Change %', 'Trend'];
  const rows = comparison.map((result) => [
    result.name,
    formatValue(result.leftValue, result.format, result.unit),
    formatValue(result.rightValue, result.format, result.unit),
    result.difference !== null ? result.difference.toFixed(2) : 'N/A',
    result.percentageChange !== null ? `${result.percentageChange.toFixed(2)}%` : 'N/A',
    result.trend,
  ]);

  const csv = [headers, ...rows].map((row) => row.join(',')).join('\n');
  downloadCSV(csv, 'dashboard-comparison.csv');
}

<DashboardComparisonView
  availableDashboards={dashboards}
  onCompare={handleCompare}
  onExportComparison={handleExport}
/>
```

### PDF Export Example

```typescript
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

function handleExport(comparison: ComparisonResult[]) {
  const doc = new jsPDF();

  doc.setFontSize(18);
  doc.text('Dashboard Comparison Report', 14, 20);

  doc.setFontSize(12);
  doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 30);

  const tableData = comparison.map((result) => [
    result.name,
    formatValue(result.leftValue, result.format, result.unit),
    formatValue(result.rightValue, result.format, result.unit),
    result.percentageChange !== null ? `${result.percentageChange.toFixed(2)}%` : 'N/A',
  ]);

  autoTable(doc, {
    head: [['Metric', 'Left Dashboard', 'Right Dashboard', 'Change']],
    body: tableData,
    startY: 40,
  });

  doc.save('dashboard-comparison.pdf');
}
```

## Summary Statistics

The component automatically calculates and displays:

### Metrics Compared

Total count of all metrics being compared.

### Significant Changes

Count of metrics with >10% change (positive or negative).

### Increases

Count of metrics where right value > left value (positive trend).

### Decreases

Count of metrics where right value < left value (negative trend).

## Styling & Customization

All styling is defined in global CSS (`/src/app/globals.css`) under the "DASHBOARD COMPARISON VIEW" section.

### Key CSS Classes

- `.dashboard-comparison-view` - Main container
- `.comparison-header` - Controls card
- `.comparison-controls` - Dashboard selection grid
- `.comparison-results` - Results container
- `.comparison-summary` - Summary stats card
- `.comparison-table` - Data table
- `.comparison-indicator` - Difference indicator (arrows + percentage)
- `.row-significant` - Significant change row highlight

### Color Customization

Modify these classes for custom colors:

```css
/* Positive changes (green) */
.comparison-indicator.positive {
  background: hsl(142 76% 95%);
  color: hsl(142 76% 36%);
}

/* Negative changes (red) */
.comparison-indicator.negative {
  background: hsl(0 84% 95%);
  color: hsl(0 84% 60%);
}

/* Neutral (no change) */
.comparison-indicator.neutral {
  background: hsl(var(--muted) / 0.5);
  color: hsl(var(--muted-foreground));
}
```

## Best Practices

1. **Group Metrics by Category** - Use meaningful categories for better organization
2. **Use Consistent Formatting** - Apply appropriate format types to all metrics
3. **Provide Context** - Include units and descriptive metric names
4. **Handle Non-Numeric Data** - Component gracefully handles text values
5. **Validate Dashboard Selection** - Prevent comparing a dashboard to itself
6. **Date Range Synchronization** - Ensure both dashboards use the same date range
7. **Loading States** - Show loading indicators during data fetching
8. **Error Handling** - Provide clear error messages for failed comparisons
9. **Mobile Optimization** - Test on various screen sizes
10. **Export Usability** - Make export formats compatible with common tools (Excel, PDF readers)

## Browser Support

- ✅ Chrome/Edge (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Mobile browsers (iOS Safari, Chrome Mobile)

## Performance

- Lightweight: Only calculates differences when data changes
- Optimized: Uses React.useMemo for expensive calculations
- Fast: Client-side comparison for instant results
- Scalable: Handles hundreds of metrics efficiently

## Accessibility

- Keyboard navigable
- Screen reader friendly
- Clear visual feedback
- Semantic HTML structure
- WCAG 2.1 AA compliant color contrasts

## Future Enhancements

Planned features:
- [ ] Compare more than 2 dashboards (3-way, 4-way comparison)
- [ ] Historical comparison (same dashboard, different time periods)
- [ ] Custom date range picker
- [ ] Save comparison configurations
- [ ] Scheduled comparison reports
- [ ] Email/Slack comparison alerts
- [ ] Drill-down from comparison to source dashboard
- [ ] Chart visualizations of comparison data
- [ ] API endpoint for automated comparisons
- [ ] Comparison templates (predefined metric sets)
