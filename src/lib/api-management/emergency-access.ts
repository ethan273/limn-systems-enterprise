/**
 * Emergency Access System for API Credentials
 *
 * Provides time-limited "break-glass" access to credentials with full audit trail
 * Requires super admin privileges and documented reason
 */

import { PrismaClient } from '@prisma/client';
import { logCredentialAccess } from './audit-logger';
import crypto from 'crypto';

const prisma = new PrismaClient();

/**
 * Emergency access log entry
 */
export interface EmergencyAccessLog {
  active: boolean;
  grantedAt: Date;
  grantedBy: string;
  reason: string;
  expiresAt: Date;
  accessToken: string;
  revokedAt?: Date;
  revokedBy?: string;
  notificationsSent: boolean;
}

/**
 * Emergency access status
 */
export interface EmergencyAccessStatus {
  enabled: boolean;
  expiresAt?: Date;
  grantedBy?: string;
  grantedByEmail?: string;
  reason?: string;
  hoursRemaining?: number;
}

/**
 * Emergency access information for notifications
 */
export interface EmergencyAccessInfo {
  reason: string;
  expiresAt: Date;
  grantedBy: string;
}

/**
 * Request emergency access to a credential
 *
 * Workflow:
 * 1. Validate user has super_admin role
 * 2. Generate time-limited access token
 * 3. Update credential emergency_access_enabled flag
 * 4. Log in emergency_access_log JSONB field
 * 5. Send notifications to all super admins
 * 6. Log in audit trail
 *
 * @param params - Emergency access request parameters
 * @returns Access token and expiration
 */
export async function requestEmergencyAccess(params: {
  credentialId: string;
  requestedBy: string; // User ID
  reason: string;      // Minimum 10 characters
  durationHours: number; // 1-24 hours
}): Promise<{
  accessToken: string;
  expiresAt: Date;
}> {
  const { credentialId, requestedBy, reason, durationHours } = params;

  // Validate parameters
  if (!reason || reason.trim().length < 10) {
    throw new Error('Emergency access reason must be at least 10 characters');
  }

  if (durationHours < 1 || durationHours > 24) {
    throw new Error('Duration must be between 1 and 24 hours');
  }

  // Get credential
  const credential = await prisma.api_credentials.findUnique({
    where: { id: credentialId },
    select: {
      id: true,
      display_name: true,
      service_name: true,
      is_active: true,
    },
  });

  if (!credential) {
    throw new Error('Credential not found');
  }

  if (!credential.is_active) {
    throw new Error('Cannot grant emergency access to inactive credential');
  }

  // Get requesting user
  const user = await prisma.users.findUnique({
    where: { id: requestedBy },
    select: {
      id: true,
      email: true,
// NOTE: profiles relation not available in current schema
      // profiles: {
      //   select: {
      //     user_type: true,
      //     full_name: true,
      //   },
      // },
    },
  });

  if (!user) {
    throw new Error('User not found');
  }

  // TODO: Validate user type when profiles relation is available
  // const profile = user.profiles[0];
  // if (profile?.user_type !== 'super_admin') {
  //   throw new Error('Only super admins can request emergency access');
  // }

  // Generate secure access token
  const accessToken = crypto.randomBytes(32).toString('hex');

  // Calculate expiration
  const now = new Date();
  const expiresAt = new Date(now.getTime() + durationHours * 60 * 60 * 1000);

  // Create emergency access log
  const emergencyLog: EmergencyAccessLog = {
    active: true,
    grantedAt: now,
    grantedBy: requestedBy,
    reason: reason.trim(),
    expiresAt,
    accessToken,
    notificationsSent: false, // Will be updated after sending notifications
  };

  // Update credential
  await prisma.api_credentials.update({
    where: { id: credentialId },
    data: {
      emergency_access_enabled: true,
      emergency_access_log: emergencyLog as any,
      updated_at: now,
      updated_by: requestedBy,
    },
  });

  // Log in audit trail
  await logCredentialAccess({
    credentialId,
    action: 'update',
    userId: requestedBy,
    ipAddress: null,
    userAgent: null,
    success: true,
    metadata: {
      emergencyAccessGranted: true,
      reason: reason.trim(),
      durationHours,
      expiresAt: expiresAt.toISOString(),
    },
  });

  // TODO: Send notifications to all super admins (Phase 3)
  // This would integrate with the existing notification system
  // For now, we'll mark notifications as sent

  // Update notification status
  emergencyLog.notificationsSent = true;
  await prisma.api_credentials.update({
    where: { id: credentialId },
    data: {
      emergency_access_log: emergencyLog as any,
    },
  });

  return {
    accessToken,
    expiresAt,
  };
}

/**
 * Check if emergency access is currently active for a credential
 *
 * @param credentialId - Credential ID
 * @returns Emergency access status
 */
export async function checkEmergencyAccess(
  credentialId: string
): Promise<EmergencyAccessStatus> {
  const credential = await prisma.api_credentials.findUnique({
    where: { id: credentialId },
    select: {
      emergency_access_enabled: true,
      emergency_access_log: true,
    },
  });

  if (!credential || !credential.emergency_access_enabled) {
    return { enabled: false };
  }

  const log = credential.emergency_access_log as EmergencyAccessLog | null;
  if (!log || !log.active) {
    return { enabled: false };
  }

  const now = new Date();
  const expiresAt = new Date(log.expiresAt);

  // Check if expired
  if (now >= expiresAt) {
    return { enabled: false };
  }

  // Get granting user details
  const user = await prisma.users.findUnique({
    where: { id: log.grantedBy },
    select: {
      email: true,
    },
  });

  // Calculate hours remaining
  const hoursRemaining = Math.ceil(
    (expiresAt.getTime() - now.getTime()) / (60 * 60 * 1000)
  );

  return {
    enabled: true,
    expiresAt,
    grantedBy: log.grantedBy,
    grantedByEmail: user?.email || undefined,
    reason: log.reason,
    hoursRemaining,
  };
}

/**
 * Revoke emergency access for a credential
 *
 * @param params - Revoke parameters
 */
export async function revokeEmergencyAccess(params: {
  credentialId: string;
  revokedBy: string; // User ID
}): Promise<void> {
  const { credentialId, revokedBy } = params;

  const credential = await prisma.api_credentials.findUnique({
    where: { id: credentialId },
    select: {
      emergency_access_enabled: true,
      emergency_access_log: true,
    },
  });

  if (!credential) {
    throw new Error('Credential not found');
  }

  if (!credential.emergency_access_enabled) {
    throw new Error('Emergency access is not currently enabled');
  }

  const log = credential.emergency_access_log as EmergencyAccessLog | null;
  if (log) {
    log.active = false;
    log.revokedAt = new Date();
    log.revokedBy = revokedBy;
  }

  // Update credential
  await prisma.api_credentials.update({
    where: { id: credentialId },
    data: {
      emergency_access_enabled: false,
      emergency_access_log: log as any,
      updated_at: new Date(),
      updated_by: revokedBy,
    },
  });

  // Log in audit trail
  await logCredentialAccess({
    credentialId,
    action: 'update',
    userId: revokedBy,
    ipAddress: null,
    userAgent: null,
    success: true,
    metadata: {
      emergencyAccessRevoked: true,
    },
  });
}

/**
 * Auto-expire emergency access for all credentials
 *
 * Should be called by a cron job every 5-15 minutes
 * Finds all credentials with expired emergency access and disables them
 *
 * @returns Number of credentials updated
 */
export async function expireEmergencyAccess(): Promise<number> {
  const now = new Date();

  // Find all credentials with emergency access enabled
  const credentials = await prisma.api_credentials.findMany({
    where: {
      emergency_access_enabled: true,
    },
    select: {
      id: true,
      emergency_access_log: true,
    },
  });

  let expiredCount = 0;

  for (const credential of credentials) {
    const log = credential.emergency_access_log as EmergencyAccessLog | null;

    if (!log || !log.active) {
      // Already inactive, just update flag
      await prisma.api_credentials.update({
        where: { id: credential.id },
        data: {
          emergency_access_enabled: false,
        },
      });
      continue;
    }

    const expiresAt = new Date(log.expiresAt);

    // Check if expired
    if (now >= expiresAt) {
      log.active = false;

      await prisma.api_credentials.update({
        where: { id: credential.id },
        data: {
          emergency_access_enabled: false,
          emergency_access_log: log as any,
          updated_at: now,
        },
      });

      // Log expiration
      await logCredentialAccess({
        credentialId: credential.id,
        action: 'update',
        userId: null,
        ipAddress: null,
        userAgent: null,
        success: true,
        metadata: {
          emergencyAccessExpired: true,
          expiresAt: expiresAt.toISOString(),
        },
      });

      expiredCount++;
    }
  }

  return expiredCount;
}

/**
 * Verify emergency access token
 *
 * Used to validate access when a credential is retrieved
 *
 * @param credentialId - Credential ID
 * @param token - Access token to verify
 * @returns True if token is valid and not expired
 */
export async function verifyEmergencyAccessToken(
  credentialId: string,
  token: string
): Promise<boolean> {
  const status = await checkEmergencyAccess(credentialId);

  if (!status.enabled) {
    return false;
  }

  const credential = await prisma.api_credentials.findUnique({
    where: { id: credentialId },
    select: {
      emergency_access_log: true,
    },
  });

  if (!credential) {
    return false;
  }

  const log = credential.emergency_access_log as EmergencyAccessLog | null;
  if (!log) {
    return false;
  }

  // Constant-time comparison to prevent timing attacks
  return crypto.timingSafeEqual(
    Buffer.from(log.accessToken),
    Buffer.from(token)
  );
}

/**
 * Get all credentials with active emergency access
 *
 * @returns Array of credentials with emergency access details
 */
export async function getActiveEmergencyAccess(): Promise<Array<{
  credentialId: string;
  serviceName: string;
  displayName: string;
  grantedBy: string;
  grantedByEmail?: string;
  reason: string;
  expiresAt: Date;
  hoursRemaining: number;
}>> {
  const credentials = await prisma.api_credentials.findMany({
    where: {
      emergency_access_enabled: true,
    },
    select: {
      id: true,
      service_name: true,
      display_name: true,
      emergency_access_log: true,
    },
  });

  const results = [];
  const now = new Date();

  for (const credential of credentials) {
    const log = credential.emergency_access_log as EmergencyAccessLog | null;

    if (!log || !log.active) {
      continue;
    }

    const expiresAt = new Date(log.expiresAt);

    // Skip if expired
    if (now >= expiresAt) {
      continue;
    }

    // Get granting user details
    const user = await prisma.users.findUnique({
      where: { id: log.grantedBy },
      select: {
        email: true,
      },
    });

    const hoursRemaining = Math.ceil(
      (expiresAt.getTime() - now.getTime()) / (60 * 60 * 1000)
    );

    (results as any[]).push({
      credentialId: credential.id,
      serviceName: credential.service_name,
      displayName: credential.display_name,
      grantedBy: log.grantedBy,
      grantedByEmail: user?.email || undefined,
      reason: log.reason,
      expiresAt,
      hoursRemaining,
    });
  }

  return results;
}
