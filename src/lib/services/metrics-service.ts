/**
 * Metrics Collection Service - Phase 3 Session 4
 *
 * Collects and evaluates workflow metrics for alerting
 *
 * @module lib/services/metrics-service
 * @created 2025-10-30
 */

import { db } from '@/lib/db';

export type MetricType =
  | 'execution_time'
  | 'failure_rate'
  | 'queue_size'
  | 'resource_usage'
  | 'custom';

export type ThresholdType = 'above' | 'below' | 'equals';

/**
 * Collect execution time metrics
 */
export async function collectExecutionTimeMetrics(
  timeWindowMinutes: number = 60,
  workflowId?: string
): Promise<{ avgMs: number; p95Ms: number; p99Ms: number }> {
  const startTime = new Date(Date.now() - timeWindowMinutes * 60 * 1000);

  const where: any = {
    created_at: { gte: startTime },
  };
  if (workflowId) where.workflow_id = workflowId;

  const executions = await db.automation_logs.findMany({
    where,
    select: {
      created_at: true,
      updated_at: true,
    },
  });

  if (executions.length === 0) {
    return { avgMs: 0, p95Ms: 0, p99Ms: 0 };
  }

  // Calculate execution times
  const executionTimes = executions
    .map((e) => {
      const start = new Date(e.created_at).getTime();
      const end = e.updated_at ? new Date(e.updated_at).getTime() : start;
      return end - start;
    })
    .sort((a, b) => a - b);

  const sum = executionTimes.reduce((acc, time) => acc + time, 0);
  const avg = sum / executionTimes.length;

  const p95Index = Math.floor(executionTimes.length * 0.95);
  const p99Index = Math.floor(executionTimes.length * 0.99);

  return {
    avgMs: Math.round(avg),
    p95Ms: executionTimes[p95Index] || 0,
    p99Ms: executionTimes[p99Index] || 0,
  };
}

/**
 * Collect failure rate metrics
 */
export async function collectFailureRateMetrics(
  timeWindowMinutes: number = 60,
  workflowId?: string
): Promise<{ failureRate: number; totalExecutions: number; failedExecutions: number }> {
  const startTime = new Date(Date.now() - timeWindowMinutes * 60 * 1000);

  const where: any = {
    created_at: { gte: startTime },
  };
  if (workflowId) where.workflow_id = workflowId;

  const [total, failed] = await Promise.all([
    db.automation_logs.count({ where }),
    db.automation_logs.count({
      where: { ...where, status: 'error' },
    }),
  ]);

  const failureRate = total > 0 ? (failed / total) * 100 : 0;

  return {
    failureRate: Math.round(failureRate * 100) / 100, // Round to 2 decimals
    totalExecutions: total,
    failedExecutions: failed,
  };
}

/**
 * Collect queue size metrics
 */
export async function collectQueueSizeMetrics(): Promise<{
  pending: number;
  running: number;
  total: number;
}> {
  const [pending, running] = await Promise.all([
    db.automation_logs.count({ where: { status: 'pending' } }),
    db.automation_logs.count({ where: { status: 'running' } }),
  ]);

  return {
    pending,
    running,
    total: pending + running,
  };
}

/**
 * Get metric value by metric type
 */
export async function getMetricValue(
  metric: MetricType,
  timeWindowMinutes: number = 60,
  workflowId?: string
): Promise<number> {
  switch (metric) {
    case 'execution_time': {
      const metrics = await collectExecutionTimeMetrics(timeWindowMinutes, workflowId);
      return metrics.avgMs;
    }

    case 'failure_rate': {
      const metrics = await collectFailureRateMetrics(timeWindowMinutes, workflowId);
      return metrics.failureRate;
    }

    case 'queue_size': {
      const metrics = await collectQueueSizeMetrics();
      return metrics.total;
    }

    case 'resource_usage': {
      // TODO: Implement resource usage tracking (memory, CPU)
      // For now, return 0
      return 0;
    }

    case 'custom': {
      // TODO: Implement custom metric support
      return 0;
    }

    default:
      return 0;
  }
}

/**
 * Evaluate if threshold is exceeded
 */
export function evaluateThreshold(
  value: number,
  thresholdType: ThresholdType,
  thresholdValue: number
): boolean {
  switch (thresholdType) {
    case 'above':
      return value > thresholdValue;

    case 'below':
      return value < thresholdValue;

    case 'equals':
      return Math.abs(value - thresholdValue) < 0.01; // Floating point comparison

    default:
      return false;
  }
}

/**
 * Check if alert rule is in cooldown period
 */
export async function isAlertInCooldown(ruleId: string): Promise<boolean> {
  const rule = await db.alert_rules.findUnique({
    where: { id: ruleId },
    select: {
      last_triggered_at: true,
      cooldown_minutes: true,
    },
  });

  if (!rule || !rule.last_triggered_at || !rule.cooldown_minutes) {
    return false;
  }

  const cooldownEndTime = new Date(
    new Date(rule.last_triggered_at).getTime() + rule.cooldown_minutes * 60 * 1000
  );

  return new Date() < cooldownEndTime;
}

/**
 * Collect all metrics for monitoring dashboard
 */
export async function collectAllMetrics(timeWindowMinutes: number = 60) {
  const [executionTime, failureRate, queueSize] = await Promise.all([
    collectExecutionTimeMetrics(timeWindowMinutes),
    collectFailureRateMetrics(timeWindowMinutes),
    collectQueueSizeMetrics(),
  ]);

  return {
    executionTime,
    failureRate,
    queueSize,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Get system health status based on metrics
 */
export async function getSystemHealthStatus(): Promise<{
  status: 'healthy' | 'warning' | 'critical';
  metrics: Awaited<ReturnType<typeof collectAllMetrics>>;
  issues: string[];
}> {
  const metrics = await collectAllMetrics(60);
  const issues: string[] = [];
  let status: 'healthy' | 'warning' | 'critical' = 'healthy';

  // Check failure rate
  if (metrics.failureRate.failureRate > 15) {
    status = 'critical';
    issues.push(`High failure rate: ${metrics.failureRate.failureRate}%`);
  } else if (metrics.failureRate.failureRate > 5) {
    if (status === 'healthy') status = 'warning';
    issues.push(`Elevated failure rate: ${metrics.failureRate.failureRate}%`);
  }

  // Check queue size
  if (metrics.queueSize.total > 1000) {
    status = 'critical';
    issues.push(`Large queue size: ${metrics.queueSize.total} items`);
  } else if (metrics.queueSize.total > 500) {
    if (status === 'healthy') status = 'warning';
    issues.push(`Growing queue size: ${metrics.queueSize.total} items`);
  }

  // Check execution time
  if (metrics.executionTime.avgMs > 60000) {
    if (status === 'healthy') status = 'warning';
    issues.push(`Slow execution time: ${(metrics.executionTime.avgMs / 1000).toFixed(1)}s avg`);
  }

  return {
    status,
    metrics,
    issues,
  };
}
