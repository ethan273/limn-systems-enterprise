# Alert Thresholds System

## Overview

Comprehensive KPI monitoring system that automatically detects threshold breaches and sends notifications across multiple channels.

## Features

✅ **Threshold Monitoring**
- Monitor any numeric KPI (revenue, inventory, quality rate, etc.)
- Multiple condition types (greater than, less than, between, etc.)
- Configurable severity levels (info, warning, critical)
- Cooldown periods to prevent alert fatigue

✅ **Alert Management**
- Real-time alert generation
- Acknowledge and resolve workflows
- Alert history tracking
- Automatic cleanup of resolved alerts

✅ **Notification Channels**
- Email notifications
- SMS alerts
- In-app notifications
- Webhook integrations

✅ **User Interface**
- AlertsPanel component for dashboard integration
- Real-time updates with auto-refresh
- Filter by severity
- Mute/unmute functionality
- Visual severity indicators

## Quick Start

### 1. Register Thresholds

```typescript
import { globalThresholdMonitor, COMMON_THRESHOLDS } from '@/lib/alerts/threshold-monitor';

// Register pre-configured common thresholds
globalThresholdMonitor.registerThresholds(COMMON_THRESHOLDS);

// Or register custom threshold
globalThresholdMonitor.registerThreshold({
  id: 'custom-metric',
  name: 'Custom Metric Alert',
  description: 'Alert when metric exceeds threshold',
  metric: 'my_metric',
  condition: 'greater_than',
  value: 1000,
  severity: 'warning',
  enabled: true,
  notificationChannels: ['email', 'in_app'],
  cooldownMinutes: 60,
});
```

### 2. Check Metrics

```typescript
// Check single metric
const result = globalThresholdMonitor.checkThreshold('revenue-drop', 9500);

if (result.breached && result.alert) {
  console.log('Alert triggered:', result.alert.message);
  // Send notifications via configured channels
}

// Check multiple metrics at once
const metrics = {
  daily_revenue: 9500,
  overdue_invoices_count: 12,
  inventory_level: 45,
};

const results = globalThresholdMonitor.checkMetrics(metrics);
results.forEach((result) => {
  if (result.breached && result.alert) {
    // Handle alert
  }
});
```

### 3. Display Alerts in UI

```tsx
import { AlertsPanel } from '@/components/alerts/AlertsPanel';

function MyDashboard() {
  return (
    <div>
      {/* Show alerts for specific dashboard */}
      <AlertsPanel
        dashboardId="financial"
        showResolved={false}
        maxAlerts={5}
        autoRefresh={true}
        refreshInterval={30000}
        onAlertClick={(alert) => {
          console.log('Alert clicked:', alert);
        }}
      />
    </div>
  );
}
```

## Threshold Configuration

### Condition Types

| Condition | Description | Value Type | Example |
|-----------|-------------|------------|---------|
| `greater_than` | Value > threshold | `number` | `{ condition: 'greater_than', value: 100 }` |
| `less_than` | Value < threshold | `number` | `{ condition: 'less_than', value: 50 }` |
| `equals` | Value == threshold | `number` | `{ condition: 'equals', value: 0 }` |
| `not_equals` | Value != threshold | `number` | `{ condition: 'not_equals', value: 100 }` |
| `between` | min <= Value <= max | `[number, number]` | `{ condition: 'between', value: [50, 100] }` |
| `outside` | Value < min OR Value > max | `[number, number]` | `{ condition: 'outside', value: [50, 100] }` |

### Severity Levels

| Level | Use Case | UI Treatment |
|-------|----------|--------------|
| `info` | Informational, no action needed | Blue badge, info icon |
| `warning` | Requires attention soon | Yellow badge, warning icon |
| `critical` | Immediate action required | Red badge, critical icon, animate |

### Cooldown Periods

Prevent alert fatigue by setting cooldown periods:

```typescript
{
  cooldownMinutes: 60, // Wait 60 minutes before triggering same alert again
}
```

## Pre-configured Common Thresholds

The system includes 7 pre-configured threshold templates:

1. **Revenue Drop Alert** - Daily revenue < $10,000
2. **Overdue Invoices Critical** - Overdue invoices > 10
3. **Low Inventory Alert** - Inventory < 50 units
4. **Production Delay Alert** - On-time rate < 85%
5. **Quality Failure Critical** - Pass rate < 90%
6. **Negative Cash Flow Alert** - Daily cash flow < $0
7. **Customer Churn Rate High** - Monthly churn > 5%

## Alert Lifecycle

```
┌─────────────┐
│  Threshold  │
│  Registered │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   Metric    │◄── Periodic monitoring
│   Checked   │
└──────┬──────┘
       │
       ▼ Breach detected
┌─────────────┐
│   Alert     │
│  Triggered  │
│ (status: active)
└──────┬──────┘
       │
       ▼ User action
┌─────────────┐
│ Acknowledged│
│(status: ack)│
└──────┬──────┘
       │
       ▼ Issue resolved
┌─────────────┐
│  Resolved   │
│(status: res)│
└─────────────┘
```

## API Reference

### ThresholdMonitor Class

#### Methods

- `registerThreshold(config: ThresholdConfig): void`
- `registerThresholds(configs: ThresholdConfig[]): void`
- `removeThreshold(id: string): void`
- `getThresholds(): ThresholdConfig[]`
- `getThreshold(id: string): ThresholdConfig | undefined`
- `checkThreshold(thresholdId: string, currentValue: number): MonitoringResult`
- `checkMetrics(metrics: Record<string, number>): MonitoringResult[]`
- `acknowledgeAlert(alertId: string, userId: string): boolean`
- `resolveAlert(alertId: string): boolean`
- `getActiveAlerts(filter?: { severity?: AlertSeverity; dashboardId?: string }): Alert[]`
- `getAllAlerts(): Alert[]`
- `clearResolvedAlerts(): number`

### AlertsPanel Component Props

```typescript
interface AlertsPanelProps {
  dashboardId?: string;        // Filter alerts by dashboard
  showResolved?: boolean;      // Show resolved alerts (default: false)
  maxAlerts?: number;          // Max alerts to display (default: 10)
  autoRefresh?: boolean;       // Auto-refresh alerts (default: true)
  refreshInterval?: number;    // Refresh interval in ms (default: 30000)
  onAlertClick?: (alert: Alert) => void; // Click handler
}
```

## Integration Examples

### Financial Dashboard

```typescript
// Register financial thresholds
globalThresholdMonitor.registerThreshold({
  id: 'ar-aging-critical',
  name: 'AR Aging Critical',
  description: 'Alert when AR over 90 days exceeds $50,000',
  metric: 'ar_over_90_days',
  condition: 'greater_than',
  value: 50000,
  severity: 'critical',
  enabled: true,
  dashboardId: 'financial',
  notificationChannels: ['email', 'sms', 'in_app'],
  cooldownMinutes: 120,
});

// In dashboard component
<AlertsPanel dashboardId="financial" maxAlerts={5} />
```

### Production Dashboard

```typescript
// Register production thresholds
globalThresholdMonitor.registerThresholds([
  {
    id: 'production-capacity-low',
    name: 'Production Capacity Low',
    description: 'Alert when capacity utilization drops below 60%',
    metric: 'capacity_utilization',
    condition: 'less_than',
    value: 60,
    severity: 'warning',
    enabled: true,
    dashboardId: 'production',
    notificationChannels: ['email', 'in_app'],
    cooldownMinutes: 180,
  },
  {
    id: 'production-defect-rate',
    name: 'High Defect Rate',
    description: 'Alert when defect rate exceeds 3%',
    metric: 'defect_rate',
    condition: 'greater_than',
    value: 3,
    severity: 'critical',
    enabled: true,
    dashboardId: 'production',
    notificationChannels: ['email', 'sms', 'in_app'],
    cooldownMinutes: 60,
  },
]);
```

### Scheduled Monitoring

```typescript
// Run monitoring every 5 minutes
setInterval(() => {
  // Fetch current metrics from database
  const metrics = {
    daily_revenue: await getDailyRevenue(),
    overdue_invoices_count: await getOverdueInvoicesCount(),
    inventory_level: await getInventoryLevel(),
    production_on_time_rate: await getProductionOnTimeRate(),
    quality_pass_rate: await getQualityPassRate(),
  };

  // Check all metrics
  const results = globalThresholdMonitor.checkMetrics(metrics);

  // Send notifications for breached thresholds
  results.forEach((result) => {
    if (result.breached && result.alert) {
      sendNotifications(result.alert);
    }
  });
}, 300000); // 5 minutes
```

## Best Practices

1. **Set Appropriate Thresholds**
   - Use historical data to determine realistic thresholds
   - Review and adjust thresholds quarterly
   - Consider seasonal variations

2. **Use Cooldown Periods**
   - Prevent alert fatigue with appropriate cooldowns
   - Critical alerts: 30-60 minutes
   - Warning alerts: 60-180 minutes
   - Info alerts: 360+ minutes

3. **Choose Right Severity**
   - Critical: Requires immediate action
   - Warning: Attention needed within hours
   - Info: Informational, no urgency

4. **Monitor Alert Effectiveness**
   - Track acknowledgment and resolution times
   - Identify frequently triggered alerts
   - Adjust thresholds based on team response

5. **Notification Channel Strategy**
   - Critical: Email + SMS + In-app
   - Warning: Email + In-app
   - Info: In-app only

## Future Enhancements

Planned features:
- [ ] Trend-based alerts (detect negative trends)
- [ ] Machine learning threshold optimization
- [ ] Alert escalation (auto-escalate if not acknowledged)
- [ ] Custom notification templates
- [ ] Alert scheduling (business hours only)
- [ ] Dashboard-specific alert configurations
- [ ] Alert analytics and reporting
- [ ] Integration with Slack, MS Teams
- [ ] Mobile push notifications
- [ ] Alert grouping and deduplication
