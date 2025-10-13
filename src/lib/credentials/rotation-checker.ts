/**
 * API Credential Rotation Checker
 *
 * Monitors API credentials and sends notifications when:
 * - Credentials are expiring soon (30, 14, 7, 3, 1 days)
 * - Credentials have expired
 * - Credentials are old and should be rotated (90+ days)
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface RotationAlert {
  id: string;
  service_name: string;
  display_name: string;
  alert_type: 'expiring' | 'expired' | 'rotation_due' | 'rotation_overdue';
  days_until_action: number;
  message: string;
  severity: 'info' | 'warning' | 'critical';
}

/**
 * Check all credentials and generate rotation alerts
 */
export async function checkCredentialRotations(): Promise<RotationAlert[]> {
  const alerts: RotationAlert[] = [];
  const now = new Date();

  try {
    // Get all active credentials
    const credentials = await prisma.api_credentials.findMany({
      where: { is_active: true },
    });

    for (const cred of credentials) {
      // Check expiration
      if (cred.expires_at) {
        const expiresAt = new Date(cred.expires_at);
        const daysUntilExpiry = Math.ceil(
          (expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        );

        if (daysUntilExpiry < 0) {
          // Expired
          alerts.push({
            id: cred.id,
            service_name: cred.service_name,
            display_name: cred.display_name,
            alert_type: 'expired',
            days_until_action: daysUntilExpiry,
            message: `${cred.display_name} credentials have EXPIRED. Immediate action required.`,
            severity: 'critical',
          });
        } else if (daysUntilExpiry === 1) {
          alerts.push({
            id: cred.id,
            service_name: cred.service_name,
            display_name: cred.display_name,
            alert_type: 'expiring',
            days_until_action: daysUntilExpiry,
            message: `${cred.display_name} credentials expire TOMORROW!`,
            severity: 'critical',
          });
        } else if (daysUntilExpiry <= 3) {
          alerts.push({
            id: cred.id,
            service_name: cred.service_name,
            display_name: cred.display_name,
            alert_type: 'expiring',
            days_until_action: daysUntilExpiry,
            message: `${cred.display_name} credentials expire in ${daysUntilExpiry} days`,
            severity: 'critical',
          });
        } else if (daysUntilExpiry <= 7) {
          alerts.push({
            id: cred.id,
            service_name: cred.service_name,
            display_name: cred.display_name,
            alert_type: 'expiring',
            days_until_action: daysUntilExpiry,
            message: `${cred.display_name} credentials expire in ${daysUntilExpiry} days`,
            severity: 'warning',
          });
        } else if (daysUntilExpiry <= 14) {
          alerts.push({
            id: cred.id,
            service_name: cred.service_name,
            display_name: cred.display_name,
            alert_type: 'expiring',
            days_until_action: daysUntilExpiry,
            message: `${cred.display_name} credentials expire in ${daysUntilExpiry} days`,
            severity: 'info',
          });
        } else if (daysUntilExpiry <= 30) {
          alerts.push({
            id: cred.id,
            service_name: cred.service_name,
            display_name: cred.display_name,
            alert_type: 'expiring',
            days_until_action: daysUntilExpiry,
            message: `${cred.display_name} credentials expire in ${daysUntilExpiry} days`,
            severity: 'info',
          });
        }
      }

      // Check age-based rotation recommendations
      const createdAt = new Date(cred.created_at);
      const daysOld = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24));

      if (daysOld >= 120) {
        // 4 months - overdue
        alerts.push({
          id: cred.id,
          service_name: cred.service_name,
          display_name: cred.display_name,
          alert_type: 'rotation_overdue',
          days_until_action: -daysOld,
          message: `${cred.display_name} credentials are ${daysOld} days old. Rotation OVERDUE.`,
          severity: 'warning',
        });
      } else if (daysOld >= 90) {
        // 3 months - due
        alerts.push({
          id: cred.id,
          service_name: cred.service_name,
          display_name: cred.display_name,
          alert_type: 'rotation_due',
          days_until_action: -daysOld,
          message: `${cred.display_name} credentials are ${daysOld} days old. Consider rotating.`,
          severity: 'info',
        });
      }
    }

    return alerts;
  } catch (error) {
    console.error('Error checking credential rotations:', error);
    return [];
  }
}

/**
 * Send notifications for credential rotation alerts
 */
export async function sendRotationNotifications(): Promise<void> {
  try {
    const alerts = await checkCredentialRotations();

    if (alerts.length === 0) {
      console.log('[Credential Rotation] No alerts to send');
      return;
    }

    console.log(`[Credential Rotation] Found ${alerts.length} alerts`);

    // Group alerts by severity
    const criticalAlerts = alerts.filter((a) => a.severity === 'critical');
    const warningAlerts = alerts.filter((a) => a.severity === 'warning');
    const infoAlerts = alerts.filter((a) => a.severity === 'info');

    // Get admin users (users who can manage API credentials)
    // You might want to filter this based on roles/permissions
    const adminUsers = await prisma.user_profiles.findMany({
      where: {
        // Add your admin user filter criteria here
        // For now, we'll get all users
      },
      select: {
        id: true,
        users_user_profiles_idTousers: {
          select: {
            email: true,
          },
        },
      },
    });

    // Create notifications for critical alerts
    if (criticalAlerts.length > 0) {
      for (const user of adminUsers) {
        await prisma.notification_queue.create({
          data: {
            user_id: user.id,
            title: `🚨 API Credentials Need Attention`,
            body: `${criticalAlerts.length} API credential(s) require immediate attention:\n\n${criticalAlerts.map((a) => `• ${a.message}`).join('\n')}`,
            priority: 'high',
            status: 'pending',
            scheduled_for: new Date(),
          },
        });
      }
    }

    // Create notifications for warning alerts (less frequent)
    if (warningAlerts.length > 0) {
      for (const user of adminUsers) {
        await prisma.notification_queue.create({
          data: {
            user_id: user.id,
            title: `⚠️ API Credentials Rotation Recommended`,
            body: `${warningAlerts.length} API credential(s) should be rotated:\n\n${warningAlerts.map((a) => `• ${a.message}`).join('\n')}`,
            priority: 'medium',
            status: 'pending',
            scheduled_for: new Date(),
          },
        });
      }
    }

    console.log(
      `[Credential Rotation] Sent notifications: ${criticalAlerts.length} critical, ${warningAlerts.length} warnings, ${infoAlerts.length} info`
    );
  } catch (error) {
    console.error('Error sending rotation notifications:', error);
  }
}

/**
 * Get rotation alerts for display in the UI
 */
export async function getRotationAlertsForUser(): Promise<RotationAlert[]> {
  return checkCredentialRotations();
}
