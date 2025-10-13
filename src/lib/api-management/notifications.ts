/**
 * Notification System for API Management
 *
 * Sends alerts for critical events via multiple channels (email, Google Chat, webhooks, in-app)
 */

import { PrismaClient } from '@prisma/client';
import type { HealthCheckResult } from './health-monitor';
import type { EmergencyAccessInfo } from './emergency-access';

const prisma = new PrismaClient();

/**
 * Notification channels
 */
export type NotificationChannel = 'email' | 'google_chat' | 'webhook' | 'in_app';

/**
 * Notification severity
 */
export type NotificationSeverity = 'info' | 'warning' | 'error' | 'critical';

/**
 * Notification event types
 */
export type NotificationEventType =
  | 'health_failure'
  | 'health_recovery'
  | 'rotation_success'
  | 'rotation_failure'
  | 'emergency_access_granted'
  | 'emergency_access_revoked'
  | 'expiration_warning'
  | 'rate_limit_exceeded'
  | 'suspicious_access';

/**
 * Notification parameters
 */
export interface NotificationParams {
  eventType: NotificationEventType;
  severity: NotificationSeverity;
  title: string;
  message: string;
  credentialId?: string;
  credentialName?: string;
  channels?: NotificationChannel[];
  metadata?: Record<string, unknown>;
}

/**
 * Notification configuration
 */
export interface NotificationConfig {
  enabled: boolean;
  channels: {
    email?: {
      enabled: boolean;
      recipients: string[];
    };
    google_chat?: {
      enabled: boolean;
      webhookUrl: string;
    };
    webhook?: {
      enabled: boolean;
      urls: string[];
    };
    in_app?: {
      enabled: boolean;
    };
  };
  severityThreshold?: NotificationSeverity;
  rateLimitPerHour?: number;
}

// In-memory rate limiting for notifications
const notificationRateLimits = new Map<string, number[]>();

/**
 * Check if notification should be rate limited
 */
function isRateLimited(
  key: string,
  limit: number = 10 // Max 10 per hour by default
): boolean {
  const now = Date.now();
  const hour = 60 * 60 * 1000;

  // Get recent notifications for this key
  let recent = notificationRateLimits.get(key) || [];

  // Remove timestamps older than 1 hour
  recent = recent.filter((timestamp) => now - timestamp < hour);

  if (recent.length >= limit) {
    return true; // Rate limited
  }

  // Add current timestamp
  recent.push(now);
  notificationRateLimits.set(key, recent);

  return false;
}

/**
 * Send email notification
 */
async function sendEmailNotification(
  params: NotificationParams,
  recipients: string[]
): Promise<void> {
  try {
    console.log('[Email] Sending notification:', {
      to: recipients,
      subject: params.title,
      event: params.eventType,
      severity: params.severity,
    });

    // Placeholder for actual email sending
    // In production, this would integrate with your email service
    // Example: await emailService.send({...})

    // For now, just log the notification
  } catch (error) {
    console.error('[Email] Failed to send notification:', error);
    throw error;
  }
}

/**
 * Send Google Chat notification
 */
async function sendGoogleChatNotification(
  params: NotificationParams,
  webhookUrl: string
): Promise<void> {
  try {
    // Google Chat card colors based on severity
    const severityEmoji = {
      info: '✅',
      warning: '⚠️',
      error: '❌',
      critical: '🚨',
    }[params.severity];

    // Build widgets array for the card
    const widgets: any[] = [
      {
        textParagraph: {
          text: `<b>${severityEmoji} ${params.title}</b>`,
        },
      },
      {
        textParagraph: {
          text: params.message,
        },
      },
      {
        keyValue: {
          topLabel: 'Event Type',
          content: params.eventType,
        },
      },
      {
        keyValue: {
          topLabel: 'Severity',
          content: params.severity.toUpperCase(),
        },
      },
    ];

    // Add credential info if available
    if (params.credentialName) {
      widgets.push({
        keyValue: {
          topLabel: 'Credential',
          content: params.credentialName,
        },
      });
    }

    const payload = {
      cardsV2: [
        {
          cardId: `api-mgmt-${Date.now()}`,
          card: {
            header: {
              title: 'API Management System',
              subtitle: new Date().toLocaleString(),
            },
            sections: [
              {
                widgets,
              },
            ],
          },
        },
      ],
    };

    console.log('[Google Chat] Sending notification to webhook');

    // Send to Google Chat
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Google Chat API error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    console.log('[Google Chat] Notification sent successfully');
  } catch (error) {
    console.error('[Google Chat] Failed to send notification:', error);
    throw error;
  }
}

/**
 * Send webhook notification
 */
async function sendWebhookNotification(
  params: NotificationParams,
  urls: string[]
): Promise<void> {
  try {
    const payload = {
      eventType: params.eventType,
      severity: params.severity,
      title: params.title,
      message: params.message,
      credentialId: params.credentialId,
      credentialName: params.credentialName,
      timestamp: new Date().toISOString(),
      metadata: params.metadata,
    };

    console.log('[Webhook] Sending notification to', urls.length, 'endpoints');

    const results = await Promise.allSettled(
      urls.map(async (url) => {
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          throw new Error(`Webhook error: ${response.status} ${response.statusText}`);
        }

        return response;
      })
    );

    const failures = results.filter((r) => r.status === 'rejected');
    if (failures.length > 0) {
      console.error(`[Webhook] ${failures.length}/${urls.length} webhooks failed`);
    } else {
      console.log('[Webhook] All notifications sent successfully');
    }
  } catch (error) {
    console.error('[Webhook] Failed to send notification:', error);
    throw error;
  }
}

/**
 * Store in-app notification
 */
async function storeInAppNotification(params: NotificationParams): Promise<void> {
  try {
    // This would store in a notifications table for display in the UI
    console.log('[In-App] Storing notification:', {
      event: params.eventType,
      severity: params.severity,
    });

    // Placeholder for database insertion
    // await prisma.notifications.create({ data: { ... } })
  } catch (error) {
    console.error('[In-App] Failed to store notification:', error);
    throw error;
  }
}

/**
 * Send notification via configured channels
 *
 * @param params - Notification parameters
 */
export async function sendNotification(params: NotificationParams): Promise<void> {
  try {
    // Get notification config from environment or database
    // For now, use default config
    const config: NotificationConfig = {
      enabled: true,
      channels: {
        email: {
          enabled: false,
          recipients: [],
        },
        google_chat: {
          enabled: !!process.env.GOOGLE_CHAT_WEBHOOK_URL,
          webhookUrl: process.env.GOOGLE_CHAT_WEBHOOK_URL || '',
        },
        webhook: {
          enabled: false,
          urls: [],
        },
        in_app: {
          enabled: true,
        },
      },
      severityThreshold: 'warning',
      rateLimitPerHour: 20,
    };

    if (!config.enabled) {
      console.log('[Notifications] System disabled, skipping notification');
      return;
    }

    // Check severity threshold
    const severityOrder: Record<NotificationSeverity, number> = {
      info: 0,
      warning: 1,
      error: 2,
      critical: 3,
    };

    if (
      severityOrder[params.severity] <
      severityOrder[config.severityThreshold || 'warning']
    ) {
      console.log('[Notifications] Below severity threshold, skipping');
      return;
    }

    // Check rate limiting
    const rateLimitKey = `${params.eventType}:${params.credentialId || 'global'}`;
    if (isRateLimited(rateLimitKey, config.rateLimitPerHour)) {
      console.log('[Notifications] Rate limited, skipping');
      return;
    }

    // Send to configured channels
    const promises: Promise<void>[] = [];

    if (config.channels.email?.enabled && config.channels.email.recipients.length > 0) {
      promises.push(sendEmailNotification(params, config.channels.email.recipients));
    }

    if (config.channels.google_chat?.enabled && config.channels.google_chat.webhookUrl) {
      promises.push(sendGoogleChatNotification(params, config.channels.google_chat.webhookUrl));
    }

    if (config.channels.webhook?.enabled && config.channels.webhook.urls.length > 0) {
      promises.push(sendWebhookNotification(params, config.channels.webhook.urls));
    }

    if (config.channels.in_app?.enabled) {
      promises.push(storeInAppNotification(params));
    }

    // Send all notifications in parallel
    const results = await Promise.allSettled(promises);

    const failures = results.filter((r) => r.status === 'rejected');
    if (failures.length > 0) {
      console.error(
        `[Notifications] ${failures.length}/${promises.length} channels failed`
      );
    } else {
      console.log('[Notifications] Sent successfully to all channels');
    }
  } catch (error) {
    console.error('[Notifications] Failed to send notification:', error);
  }
}

/**
 * Notify about health check failure
 */
export async function notifyHealthFailure(
  credentialId: string,
  result: HealthCheckResult
): Promise<void> {
  const credential = await prisma.api_credentials.findUnique({
    where: { id: credentialId },
  });

  if (!credential) {
    return;
  }

  await sendNotification({
    eventType: 'health_failure',
    severity: 'error',
    title: `Health Check Failed: ${credential.display_name}`,
    message: `Health check failed for credential "${credential.display_name}". Error: ${result.error_message || 'Unknown error'}`,
    credentialId: credential.id,
    credentialName: credential.display_name,
    metadata: {
      response_time_ms: result.response_time_ms,
      error: result.error_message,
    },
  });
}

/**
 * Notify about health check recovery
 */
export async function notifyHealthRecovery(
  credentialId: string,
  consecutiveFailures: number
): Promise<void> {
  const credential = await prisma.api_credentials.findUnique({
    where: { id: credentialId },
  });

  if (!credential) {
    return;
  }

  await sendNotification({
    eventType: 'health_recovery',
    severity: 'info',
    title: `Health Check Recovered: ${credential.display_name}`,
    message: `Credential "${credential.display_name}" has recovered after ${consecutiveFailures} consecutive failures.`,
    credentialId: credential.id,
    credentialName: credential.display_name,
    metadata: {
      consecutive_failures: consecutiveFailures,
    },
  });
}

/**
 * Notify about successful credential rotation
 */
export async function notifyRotationComplete(credentialId: string): Promise<void> {
  const credential = await prisma.api_credentials.findUnique({
    where: { id: credentialId },
  });

  if (!credential) {
    return;
  }

  await sendNotification({
    eventType: 'rotation_success',
    severity: 'info',
    title: `Credential Rotated: ${credential.display_name}`,
    message: `Credential "${credential.display_name}" has been successfully rotated with zero downtime.`,
    credentialId: credential.id,
    credentialName: credential.display_name,
  });
}

/**
 * Notify about failed credential rotation
 */
export async function notifyRotationFailure(
  credentialId: string,
  error: string
): Promise<void> {
  const credential = await prisma.api_credentials.findUnique({
    where: { id: credentialId },
  });

  if (!credential) {
    return;
  }

  await sendNotification({
    eventType: 'rotation_failure',
    severity: 'critical',
    title: `Rotation Failed: ${credential.display_name}`,
    message: `Failed to rotate credential "${credential.display_name}". Error: ${error}`,
    credentialId: credential.id,
    credentialName: credential.display_name,
    metadata: {
      error,
    },
  });
}

/**
 * Notify about emergency access granted
 */
export async function notifyEmergencyAccess(
  credentialId: string,
  accessInfo: EmergencyAccessInfo
): Promise<void> {
  const credential = await prisma.api_credentials.findUnique({
    where: { id: credentialId },
  });

  if (!credential) {
    return;
  }

  await sendNotification({
    eventType: 'emergency_access_granted',
    severity: 'warning',
    title: `Emergency Access Granted: ${credential.display_name}`,
    message: `Emergency access granted for credential "${credential.display_name}". Reason: ${accessInfo.reason}. Expires: ${accessInfo.expiresAt.toISOString()}`,
    credentialId: credential.id,
    credentialName: credential.display_name,
    metadata: {
      granted_by: accessInfo.grantedBy,
      expires_at: accessInfo.expiresAt,
      reason: accessInfo.reason,
    },
  });
}

/**
 * Notify about emergency access revoked
 */
export async function notifyEmergencyAccessRevoked(
  credentialId: string
): Promise<void> {
  const credential = await prisma.api_credentials.findUnique({
    where: { id: credentialId },
  });

  if (!credential) {
    return;
  }

  await sendNotification({
    eventType: 'emergency_access_revoked',
    severity: 'info',
    title: `Emergency Access Revoked: ${credential.display_name}`,
    message: `Emergency access for credential "${credential.display_name}" has been revoked.`,
    credentialId: credential.id,
    credentialName: credential.display_name,
  });
}

/**
 * Notify about credential expiration warning
 */
export async function notifyExpirationWarning(
  credentialId: string,
  daysUntilExpiry: number
): Promise<void> {
  const credential = await prisma.api_credentials.findUnique({
    where: { id: credentialId },
  });

  if (!credential || !credential.expires_at) {
    return;
  }

  const severity: NotificationSeverity =
    daysUntilExpiry <= 7 ? 'warning' : 'info';

  await sendNotification({
    eventType: 'expiration_warning',
    severity,
    title: `Credential Expiring Soon: ${credential.display_name}`,
    message: `Credential "${credential.display_name}" will expire in ${daysUntilExpiry} days (${credential.expires_at.toISOString()})`,
    credentialId: credential.id,
    credentialName: credential.display_name,
    metadata: {
      days_until_expiry: daysUntilExpiry,
      expires_at: credential.expires_at,
    },
  });
}

/**
 * Notify about rate limit exceeded
 */
export async function notifyRateLimitExceeded(
  credentialId: string,
  currentRate: number,
  limit: number
): Promise<void> {
  const credential = await prisma.api_credentials.findUnique({
    where: { id: credentialId },
  });

  if (!credential) {
    return;
  }

  await sendNotification({
    eventType: 'rate_limit_exceeded',
    severity: 'warning',
    title: `Rate Limit Exceeded: ${credential.display_name}`,
    message: `Credential "${credential.display_name}" has exceeded its rate limit (${currentRate}/${limit} requests).`,
    credentialId: credential.id,
    credentialName: credential.display_name,
    metadata: {
      current_rate: currentRate,
      limit,
    },
  });
}

/**
 * Notify about suspicious access pattern
 */
export async function notifySuspiciousAccess(
  credentialId: string,
  details: string
): Promise<void> {
  const credential = await prisma.api_credentials.findUnique({
    where: { id: credentialId },
  });

  if (!credential) {
    return;
  }

  await sendNotification({
    eventType: 'suspicious_access',
    severity: 'critical',
    title: `Suspicious Access Detected: ${credential.display_name}`,
    message: `Suspicious access pattern detected for credential "${credential.display_name}". Details: ${details}`,
    credentialId: credential.id,
    credentialName: credential.display_name,
    metadata: {
      details,
    },
  });
}
