/**
 * Alert Threshold Monitoring System
 *
 * Monitors KPIs against configured thresholds and triggers alerts when breached.
 */

export type ThresholdCondition = 'greater_than' | 'less_than' | 'equals' | 'not_equals' | 'between' | 'outside';
export type AlertSeverity = 'info' | 'warning' | 'critical';
export type AlertStatus = 'active' | 'acknowledged' | 'resolved';

export interface ThresholdConfig {
  id: string;
  name: string;
  description: string;
  metric: string;
  condition: ThresholdCondition;
  value: number | number[];
  severity: AlertSeverity;
  enabled: boolean;
  dashboardId?: string;
  notificationChannels: ('email' | 'sms' | 'in_app' | 'webhook')[];
  cooldownMinutes?: number;
  metadata?: Record<string, any>;
}

export interface Alert {
  id: string;
  thresholdId: string;
  triggeredAt: Date;
  status: AlertStatus;
  severity: AlertSeverity;
  message: string;
  currentValue: number;
  thresholdValue: number | number[];
  metric: string;
  dashboardId?: string;
  acknowledgedAt?: Date;
  acknowledgedBy?: string;
  resolvedAt?: Date;
  metadata?: Record<string, any>;
}

export interface MonitoringResult {
  breached: boolean;
  alert?: Alert;
  reason?: string;
}

/**
 * Threshold Monitor Class
 */
export class ThresholdMonitor {
  private thresholds: Map<string, ThresholdConfig> = new Map();
  private activeAlerts: Map<string, Alert> = new Map();
  private lastAlertTime: Map<string, Date> = new Map();

  /**
   * Register a threshold configuration
   */
  registerThreshold(config: ThresholdConfig): void {
    this.thresholds.set(config.id, config);
  }

  /**
   * Register multiple thresholds
   */
  registerThresholds(configs: ThresholdConfig[]): void {
    configs.forEach((config) => this.registerThreshold(config));
  }

  /**
   * Remove a threshold
   */
  removeThreshold(id: string): void {
    this.thresholds.delete(id);
  }

  /**
   * Get all registered thresholds
   */
  getThresholds(): ThresholdConfig[] {
    return Array.from(this.thresholds.values());
  }

  /**
   * Get threshold by ID
   */
  getThreshold(id: string): ThresholdConfig | undefined {
    return this.thresholds.get(id);
  }

  /**
   * Check a metric value against its threshold
   */
  checkThreshold(thresholdId: string, currentValue: number): MonitoringResult {
    const threshold = this.thresholds.get(thresholdId);

    if (!threshold) {
      return { breached: false, reason: 'Threshold not found' };
    }

    if (!threshold.enabled) {
      return { breached: false, reason: 'Threshold disabled' };
    }

    // Check cooldown period
    if (this.isInCooldown(thresholdId)) {
      return { breached: false, reason: 'In cooldown period' };
    }

    // Evaluate condition
    const isBreached = this.evaluateCondition(
      currentValue,
      threshold.condition,
      threshold.value
    );

    if (!isBreached) {
      return { breached: false };
    }

    // Create alert
    const alert: Alert = {
      id: `alert-${thresholdId}-${Date.now()}`,
      thresholdId,
      triggeredAt: new Date(),
      status: 'active',
      severity: threshold.severity,
      message: this.generateAlertMessage(threshold, currentValue),
      currentValue,
      thresholdValue: threshold.value,
      metric: threshold.metric,
      dashboardId: threshold.dashboardId,
      metadata: threshold.metadata,
    };

    // Store alert
    this.activeAlerts.set(alert.id, alert);
    this.lastAlertTime.set(thresholdId, new Date());

    return { breached: true, alert };
  }

  /**
   * Check multiple metrics at once
   */
  checkMetrics(metrics: Record<string, number>): MonitoringResult[] {
    const results: MonitoringResult[] = [];

    this.thresholds.forEach((threshold) => {
      if (threshold.metric in metrics) {
        const result = this.checkThreshold(threshold.id, metrics[threshold.metric]);
        if (result.breached) {
          results.push(result);
        }
      }
    });

    return results;
  }

  /**
   * Acknowledge an alert
   */
  acknowledgeAlert(alertId: string, userId: string): boolean {
    const alert = this.activeAlerts.get(alertId);
    if (!alert || alert.status !== 'active') {
      return false;
    }

    alert.status = 'acknowledged';
    alert.acknowledgedAt = new Date();
    alert.acknowledgedBy = userId;
    this.activeAlerts.set(alertId, alert);

    return true;
  }

  /**
   * Resolve an alert
   */
  resolveAlert(alertId: string): boolean {
    const alert = this.activeAlerts.get(alertId);
    if (!alert) {
      return false;
    }

    alert.status = 'resolved';
    alert.resolvedAt = new Date();
    this.activeAlerts.set(alertId, alert);

    return true;
  }

  /**
   * Get active alerts
   */
  getActiveAlerts(filter?: { severity?: AlertSeverity; dashboardId?: string }): Alert[] {
    let alerts = Array.from(this.activeAlerts.values()).filter(
      (alert) => alert.status === 'active'
    );

    if (filter?.severity) {
      alerts = alerts.filter((alert) => alert.severity === filter.severity);
    }

    if (filter?.dashboardId) {
      alerts = alerts.filter((alert) => alert.dashboardId === filter.dashboardId);
    }

    return alerts.sort((a, b) => b.triggeredAt.getTime() - a.triggeredAt.getTime());
  }

  /**
   * Get all alerts
   */
  getAllAlerts(): Alert[] {
    return Array.from(this.activeAlerts.values());
  }

  /**
   * Clear resolved alerts
   */
  clearResolvedAlerts(): number {
    const resolvedAlerts = Array.from(this.activeAlerts.values()).filter(
      (alert) => alert.status === 'resolved'
    );

    resolvedAlerts.forEach((alert) => {
      this.activeAlerts.delete(alert.id);
    });

    return resolvedAlerts.length;
  }

  /**
   * Private: Evaluate threshold condition
   */
  private evaluateCondition(
    value: number,
    condition: ThresholdCondition,
    threshold: number | number[]
  ): boolean {
    switch (condition) {
      case 'greater_than':
        return typeof threshold === 'number' && value > threshold;

      case 'less_than':
        return typeof threshold === 'number' && value < threshold;

      case 'equals':
        return typeof threshold === 'number' && value === threshold;

      case 'not_equals':
        return typeof threshold === 'number' && value !== threshold;

      case 'between':
        return (
          Array.isArray(threshold) &&
          threshold.length === 2 &&
          value >= threshold[0] &&
          value <= threshold[1]
        );

      case 'outside':
        return (
          Array.isArray(threshold) &&
          threshold.length === 2 &&
          (value < threshold[0] || value > threshold[1])
        );

      default:
        return false;
    }
  }

  /**
   * Private: Check if threshold is in cooldown period
   */
  private isInCooldown(thresholdId: string): boolean {
    const threshold = this.thresholds.get(thresholdId);
    if (!threshold?.cooldownMinutes) {
      return false;
    }

    const lastAlert = this.lastAlertTime.get(thresholdId);
    if (!lastAlert) {
      return false;
    }

    const cooldownMs = threshold.cooldownMinutes * 60 * 1000;
    const timeSinceLastAlert = Date.now() - lastAlert.getTime();

    return timeSinceLastAlert < cooldownMs;
  }

  /**
   * Private: Generate alert message
   */
  private generateAlertMessage(threshold: ThresholdConfig, currentValue: number): string {
    const { name, metric, condition, value } = threshold;

    let conditionText = '';
    if (Array.isArray(value)) {
      conditionText = `between ${value[0]} and ${value[1]}`;
    } else {
      conditionText = `${condition.replace('_', ' ')} ${value}`;
    }

    return `${name}: ${metric} is ${currentValue} (threshold: ${conditionText})`;
  }
}

/**
 * Global threshold monitor instance
 */
export const globalThresholdMonitor = new ThresholdMonitor();

/**
 * Pre-configured common thresholds
 */
export const COMMON_THRESHOLDS: ThresholdConfig[] = [
  {
    id: 'revenue-drop',
    name: 'Revenue Drop Alert',
    description: 'Alert when daily revenue drops below $10,000',
    metric: 'daily_revenue',
    condition: 'less_than',
    value: 10000,
    severity: 'warning',
    enabled: true,
    notificationChannels: ['email', 'in_app'],
    cooldownMinutes: 60,
  },
  {
    id: 'overdue-invoices',
    name: 'Overdue Invoices Critical',
    description: 'Alert when overdue invoices exceed 10',
    metric: 'overdue_invoices_count',
    condition: 'greater_than',
    value: 10,
    severity: 'critical',
    enabled: true,
    notificationChannels: ['email', 'sms', 'in_app'],
    cooldownMinutes: 120,
  },
  {
    id: 'inventory-low',
    name: 'Low Inventory Alert',
    description: 'Alert when inventory drops below reorder point',
    metric: 'inventory_level',
    condition: 'less_than',
    value: 50,
    severity: 'warning',
    enabled: true,
    notificationChannels: ['email', 'in_app'],
    cooldownMinutes: 360,
  },
  {
    id: 'production-delay',
    name: 'Production Delay Alert',
    description: 'Alert when on-time rate drops below 85%',
    metric: 'production_on_time_rate',
    condition: 'less_than',
    value: 85,
    severity: 'warning',
    enabled: true,
    notificationChannels: ['email', 'in_app'],
    cooldownMinutes: 60,
  },
  {
    id: 'quality-failure',
    name: 'Quality Failure Critical',
    description: 'Alert when quality pass rate drops below 90%',
    metric: 'quality_pass_rate',
    condition: 'less_than',
    value: 90,
    severity: 'critical',
    enabled: true,
    notificationChannels: ['email', 'sms', 'in_app'],
    cooldownMinutes: 30,
  },
  {
    id: 'cash-flow-negative',
    name: 'Negative Cash Flow Alert',
    description: 'Alert when daily cash flow is negative',
    metric: 'daily_cash_flow',
    condition: 'less_than',
    value: 0,
    severity: 'critical',
    enabled: true,
    notificationChannels: ['email', 'sms', 'in_app'],
    cooldownMinutes: 60,
  },
  {
    id: 'customer-churn',
    name: 'Customer Churn Rate High',
    description: 'Alert when monthly churn rate exceeds 5%',
    metric: 'monthly_churn_rate',
    condition: 'greater_than',
    value: 5,
    severity: 'warning',
    enabled: true,
    notificationChannels: ['email', 'in_app'],
    cooldownMinutes: 1440, // 24 hours
  },
];
