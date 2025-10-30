import { log } from '@/lib/logger';
/**
 * Alert Evaluation Cron Job - Phase 3 Session 4
 *
 * Periodically evaluates alert rules and triggers notifications
 *
 * @module api/cron/evaluate-alerts
 * @created 2025-10-30
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getMetricValue, evaluateThreshold, isAlertInCooldown } from '@/lib/services/metrics-service';
import { sendAlertNotification } from '@/lib/services/alert-notification-service';

/**
 * Cron job to evaluate alert rules
 *
 * Configured in vercel.json to run every 5 minutes
 */
export async function POST(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    log.error('[Cron] Unauthorized alert evaluation attempt');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  log.info('[Cron] Starting alert evaluation...');

  try {
    // Fetch all active alert rules
    const rules = await db.alert_rules.findMany({
      where: { is_active: true },
      select: {
        id: true,
        name: true,
        description: true,
        metric: true,
        metric_source: true,
        entity_id: true,
        threshold_type: true,
        threshold_value: true,
        threshold_unit: true,
        evaluation_window_minutes: true,
        alert_channels: true,
        recipient_user_ids: true,
        recipient_emails: true,
        recipient_roles: true,
        alert_title_template: true,
        alert_message_template: true,
        severity: true,
        cooldown_minutes: true,
        last_triggered_at: true,
        trigger_count: true,
      },
    });

    log.info(`[Cron] Evaluating ${rules.length} alert rules...`);

    let triggeredCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    for (const rule of rules) {
      try {
        // Check if rule is in cooldown period
        const inCooldown = await isAlertInCooldown(rule.id);
        if (inCooldown) {
          log.info(`[Cron] Rule ${rule.name} (${rule.id}) is in cooldown, skipping`);
          skippedCount++;
          continue;
        }

        // Get current metric value
        const metricValue = await getMetricValue(
          rule.metric as any,
          rule.evaluation_window_minutes || 5,
          rule.entity_id || undefined
        );

        // Evaluate threshold
        const thresholdExceeded = evaluateThreshold(
          metricValue,
          rule.threshold_type as any,
          Number(rule.threshold_value)
        );

        log.info(
          `[Cron] Rule ${rule.name}: metric=${metricValue}, threshold=${rule.threshold_value}, exceeded=${thresholdExceeded}`
        );

        if (thresholdExceeded) {
          // Trigger alert
          log.info(`[Cron] Triggering alert for rule: ${rule.name}`);

          // Create alert trigger record
          const _alertTrigger = await db.alert_triggers.create({
            data: {
              alert_rule_id: rule.id,
              metric_value: metricValue,
              threshold_value: Number(rule.threshold_value),
              threshold_exceeded: true,
              status: 'active',
              severity: rule.severity || 'warning',
              alert_title: rule.alert_title_template || `Alert: ${rule.name}`,
              alert_message: rule.alert_message_template ||
                `Alert rule "${rule.name}" triggered. ${rule.metric} is ${metricValue} (threshold: ${rule.threshold_value})`,
              channels_notified: rule.alert_channels || [],
              notified_user_ids: rule.recipient_user_ids || [],
              notified_emails: rule.recipient_emails || [],
              expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
            },
          });

          // Send notifications
          const notification = {
            ruleId: rule.id,
            ruleName: rule.name,
            metric: rule.metric,
            currentValue: metricValue,
            thresholdValue: Number(rule.threshold_value),
            severity: (rule.severity || 'warning') as any,
            message: rule.alert_message_template ||
              `Alert rule "${rule.name}" triggered. ${rule.metric} is ${metricValue} (threshold: ${rule.threshold_value})`,
            timestamp: new Date(),
          };

          const result = await sendAlertNotification(
            notification,
            (rule.alert_channels || []) as any[],
            {
              userIds: rule.recipient_user_ids || undefined,
              emails: rule.recipient_emails || undefined,
              roles: rule.recipient_roles || undefined,
            }
          );

          log.info(`[Cron] Notification result for ${rule.name}:`, result);

          // Update alert rule
          await db.alert_rules.update({
            where: { id: rule.id },
            data: {
              last_triggered_at: new Date(),
              trigger_count: (rule.trigger_count || 0) + 1,
            },
          });

          triggeredCount++;
        }
      } catch (error) {
        log.error(`[Cron] Error evaluating rule ${rule.name}:`, { error });
        errorCount++;
      }
    }

    const summary = {
      success: true,
      timestamp: new Date().toISOString(),
      rulesEvaluated: rules.length,
      alertsTriggered: triggeredCount,
      rulesSkipped: skippedCount,
      errors: errorCount,
    };

    log.info('[Cron] Alert evaluation complete:', summary);

    return NextResponse.json(summary);
  } catch (error) {
    log.error('[Cron] Alert evaluation failed:', { error });
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

/**
 * Health check endpoint
 */
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    endpoint: 'evaluate-alerts',
    timestamp: new Date().toISOString(),
  });
}
