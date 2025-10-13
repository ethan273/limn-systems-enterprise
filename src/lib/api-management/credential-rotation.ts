/**
 * Zero-Downtime Credential Rotation System
 *
 * Implements safe credential rotation with dual-credential support
 * to ensure zero downtime during transitions
 */

import { PrismaClient } from '@prisma/client';
import type { Prisma } from '@prisma/client';
import * as crypto from 'crypto';
import { performHealthCheck } from './health-monitor';

const prisma = new PrismaClient();

/**
 * Rotation status
 */
export type RotationStatus =
  | 'idle'
  | 'in_progress'
  | 'grace_period'
  | 'completed'
  | 'failed'
  | 'rolled_back';

/**
 * Rotation session
 */
export interface RotationSession {
  id: string;
  credential_id: string;
  status: RotationStatus;
  old_credential_backup: string | null; // Encrypted backup
  new_credential_preview: string | null; // Last 4 chars for verification
  started_at: Date;
  grace_period_ends_at: Date | null;
  completed_at: Date | null;
  error_message: string | null;
  initiated_by: string;
  metadata: Prisma.JsonValue | null;
}

/**
 * Rotation history entry
 */
export interface RotationHistoryEntry {
  id: string;
  credential_id: string;
  status: RotationStatus;
  started_at: Date;
  completed_at: Date | null;
  initiated_by: string;
  error_message: string | null;
}

/**
 * Rotation configuration
 */
export interface RotationConfig {
  gracePeriodMinutes?: number; // Default: 5 minutes
  healthCheckCount?: number; // Number of health checks to perform
  healthCheckIntervalMs?: number; // Interval between health checks
  autoRollbackOnFailure?: boolean; // Default: true
}

/**
 * Service-specific rotation strategy
 */
interface RotationStrategy {
  name: string;
  supportsRotation: boolean;
  generateNewCredential?: (oldCredential: any) => Promise<{
    newValue: string;
    metadata?: Record<string, unknown>;
  }>;
  deactivateOldCredential?: (oldCredential: any) => Promise<void>;
  rollback?: (oldCredential: any, newCredential: any) => Promise<void>;
}

/**
 * Get rotation strategy for a service type
 */
function getRotationStrategy(serviceType: string): RotationStrategy {
  switch (serviceType.toLowerCase()) {
    case 'stripe':
      return {
        name: 'Stripe API Key Rotation',
        supportsRotation: true,
        generateNewCredential: async (oldCredential) => {
          // Placeholder for Stripe API key rotation
          // In production, this would call Stripe API to create a new key
          console.log('Generating new Stripe API key...');

          // Simulate API call
          await new Promise((resolve) => setTimeout(resolve, 1000));

          // Return placeholder new key
          return {
            newValue: `sk_live_${crypto.randomBytes(24).toString('hex')}`,
            metadata: {
              rotated_at: new Date().toISOString(),
              old_key_prefix: oldCredential.encrypted_value.substring(0, 12),
            },
          };
        },
        deactivateOldCredential: async (oldCredential) => {
          // Placeholder for revoking old Stripe key
          console.log('Deactivating old Stripe API key...');

          // Simulate API call
          await new Promise((resolve) => setTimeout(resolve, 500));
        },
        rollback: async (oldCredential, newCredential) => {
          // Placeholder for rollback - delete new key
          console.log('Rolling back Stripe rotation...');

          // Simulate API call
          await new Promise((resolve) => setTimeout(resolve, 500));
        },
      };

    case 'google_oauth':
      return {
        name: 'Google OAuth Credential Refresh',
        supportsRotation: true,
        generateNewCredential: async (oldCredential) => {
          // Placeholder for Google OAuth refresh
          console.log('Refreshing Google OAuth credentials...');

          // Simulate API call
          await new Promise((resolve) => setTimeout(resolve, 1000));

          return {
            newValue: crypto.randomBytes(32).toString('base64'),
            metadata: {
              rotated_at: new Date().toISOString(),
            },
          };
        },
        deactivateOldCredential: async (oldCredential) => {
          console.log('Revoking old Google OAuth token...');
          await new Promise((resolve) => setTimeout(resolve, 500));
        },
      };

    default:
      return {
        name: 'Manual Rotation Required',
        supportsRotation: false,
      };
  }
}

/**
 * Initiate credential rotation
 *
 * @param credentialId - Credential ID to rotate
 * @param userId - User initiating the rotation
 * @param config - Rotation configuration
 * @returns Rotation session
 */
export async function initiateRotation(
  credentialId: string,
  userId: string,
  config: RotationConfig = {}
): Promise<RotationSession> {
  const {
    gracePeriodMinutes = 5,
    healthCheckCount = 3,
    healthCheckIntervalMs = 30000, // 30 seconds
    autoRollbackOnFailure = true,
  } = config;

  try {
    // Get credential details
    const credential = await prisma.api_credentials.findUnique({
      where: { id: credentialId },
    });

    if (!credential) {
      throw new Error('Credential not found');
    }

    // Check if rotation is already in progress
    const existingSession = await prisma.api_credential_rotations.findFirst({
      where: {
        credential_id: credentialId,
        status: {
          in: ['in_progress', 'grace_period'],
        },
      },
    });

    if (existingSession) {
      throw new Error('Rotation already in progress for this credential');
    }

    // Get rotation strategy
    const strategy = getRotationStrategy(
      credential.service_template || 'custom'
    );

    if (!strategy.supportsRotation || !strategy.generateNewCredential) {
      throw new Error(
        `Automatic rotation not supported for service type: ${credential.service_template || 'custom'}`
      );
    }

    // Create rotation session
    const session = await prisma.api_credential_rotations.create({
      data: {
        credential_id: credentialId,
        status: 'in_progress',
        initiated_by: userId,
        old_credential_backup: credential.credentials, // Backup old credential
        metadata: {
          service_type: credential.service_template || 'custom',
          config: {
            gracePeriodMinutes,
            healthCheckCount,
            healthCheckIntervalMs,
            autoRollbackOnFailure,
          },
        },
      } as any,
    });

    // Generate new credential
    console.log(`Generating new credential for ${credentialId}...`);
    const newCredential = await strategy.generateNewCredential(credential);

    // Update credential with new value (encrypted)
    // In production, this would be properly encrypted
    await prisma.api_credentials.update({
      where: { id: credentialId },
      data: {
        credentials: newCredential.newValue as any,
        last_rotated_at: new Date(),
      },
    });

    // Update session with new credential preview
    const updatedSession = await prisma.api_credential_rotations.update({
      where: { id: session.id },
      data: {
        new_credential_preview: newCredential.newValue.slice(-4),
        metadata: {
          ...(session.metadata as any),
          new_credential_metadata: newCredential.metadata,
        },
      } as any,
    });

    // Start health checks
    console.log(`Starting health checks for rotated credential ${credentialId}...`);
    let allHealthy = true;

    for (let i = 0; i < healthCheckCount; i++) {
      if (i > 0) {
        await new Promise((resolve) => setTimeout(resolve, healthCheckIntervalMs));
      }

      const healthCheck = await performHealthCheck(credentialId);

      if (healthCheck.status === 'unhealthy') {
        allHealthy = false;
        console.error(
          `Health check ${i + 1}/${healthCheckCount} failed:`,
          healthCheck.error_message
        );

        if (autoRollbackOnFailure) {
          console.log('Auto-rollback enabled, reverting to old credential...');
          await rollbackRotation(session.id);
          throw new Error(
            `Rotation failed health check: ${healthCheck.error_message}`
          );
        }

        break;
      }

      console.log(`Health check ${i + 1}/${healthCheckCount} passed`);
    }

    if (!allHealthy && !autoRollbackOnFailure) {
      // Mark as failed but don't rollback
      await prisma.api_credential_rotations.update({
        where: { id: session.id },
        data: {
          status: 'failed',
          error_message: 'Health checks failed, manual intervention required',
        } as any,
      });

      throw new Error('Health checks failed, manual intervention required');
    }

    // Enter grace period
    const gracePeriodEndsAt = new Date(Date.now() + gracePeriodMinutes * 60 * 1000);

    await prisma.api_credential_rotations.update({
      where: { id: session.id },
      data: {
        status: 'grace_period',
        grace_period_ends_at: gracePeriodEndsAt,
      } as any,
    });

    console.log(
      `Rotation in grace period until ${gracePeriodEndsAt.toISOString()}`
    );

    // Schedule completion after grace period
    // In production, this would be handled by a background job
    setTimeout(async () => {
      try {
        await completeRotation(session.id);
      } catch (error) {
        console.error('Failed to complete rotation:', error);
      }
    }, gracePeriodMinutes * 60 * 1000);

    return updatedSession;
  } catch (error) {
    console.error('Rotation failed:', error);
    throw error;
  }
}

/**
 * Complete credential rotation
 *
 * @param sessionId - Rotation session ID
 */
export async function completeRotation(sessionId: string): Promise<void> {
  try {
    // Get session
    const session = await prisma.api_credential_rotations.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      throw new Error('Rotation session not found');
    }

    if (session.status !== 'grace_period') {
      throw new Error(
        `Cannot complete rotation in status: ${session.status}`
      );
    }

    // Get credential
    const credential = await prisma.api_credentials.findUnique({
      where: { id: session.credential_id },
    });

    if (!credential) {
      throw new Error('Credential not found');
    }

    // Get rotation strategy
    const strategy = getRotationStrategy(
      credential.service_template || 'custom'
    );

    // Deactivate old credential if strategy supports it
    if (strategy.deactivateOldCredential) {
      console.log('Deactivating old credential...');
      await strategy.deactivateOldCredential({
        encrypted_value: session.old_credential_backup,
      });
    }

    // Mark rotation as completed
    await prisma.api_credential_rotations.update({
      where: { id: sessionId },
      data: {
        status: 'completed',
        completed_at: new Date(),
      } as any,
    });

    console.log(`Rotation ${sessionId} completed successfully`);
  } catch (error) {
    console.error('Failed to complete rotation:', error);

    // Mark as failed
    await prisma.api_credential_rotations.update({
      where: { id: sessionId },
      data: {
        status: 'failed',
        error_message: error instanceof Error ? error.message : 'Unknown error',
      } as any,
    });

    throw error;
  }
}

/**
 * Rollback credential rotation
 *
 * @param sessionId - Rotation session ID
 */
export async function rollbackRotation(sessionId: string): Promise<void> {
  try {
    // Get session
    const session = await prisma.api_credential_rotations.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      throw new Error('Rotation session not found');
    }

    if (!['in_progress', 'grace_period', 'failed'].includes(session.status)) {
      throw new Error(
        `Cannot rollback rotation in status: ${session.status}`
      );
    }

    if (!session.old_credential_backup) {
      throw new Error('No backup credential available for rollback');
    }

    // Restore old credential
    await prisma.api_credentials.update({
      where: { id: session.credential_id },
      data: {
        credentials: session.old_credential_backup as any,
      },
    });

    // Mark rotation as rolled back
    await prisma.api_credential_rotations.update({
      where: { id: sessionId },
      data: {
        status: 'rolled_back',
        completed_at: new Date(),
        error_message: 'Rotation rolled back',
      } as any,
    });

    console.log(`Rotation ${sessionId} rolled back successfully`);
  } catch (error) {
    console.error('Failed to rollback rotation:', error);
    throw error;
  }
}

/**
 * Get rotation status for a credential
 *
 * @param credentialId - Credential ID
 * @returns Current rotation status
 */
export async function getRotationStatus(
  credentialId: string
): Promise<{
  status: RotationStatus;
  currentSession: RotationSession | null;
  lastRotation: RotationHistoryEntry | null;
  canRotate: boolean;
}> {
  // Get current session
  const currentSession = await prisma.api_credential_rotations.findFirst({
    where: {
      credential_id: credentialId,
      status: {
        in: ['in_progress', 'grace_period'],
      },
    },
    orderBy: { started_at: 'desc' },
  });

  // Get last completed rotation
  const lastRotation = await prisma.api_credential_rotations.findFirst({
    where: {
      credential_id: credentialId,
      status: {
        in: ['completed', 'failed', 'rolled_back'],
      },
    },
    orderBy: { started_at: 'desc' },
  });

  // Get credential to check service type
  const credential = await prisma.api_credentials.findUnique({
    where: { id: credentialId },
  });

  const strategy = getRotationStrategy(
    credential?.service_template?.service_type || 'custom'
  );

  return {
    status: currentSession?.status as RotationStatus || 'idle',
    currentSession,
    lastRotation,
    canRotate: strategy.supportsRotation && !currentSession,
  };
}

/**
 * Get rotation history for a credential
 *
 * @param credentialId - Credential ID
 * @param limit - Maximum number of history entries
 * @returns Rotation history
 */
export async function getRotationHistory(
  credentialId: string,
  limit = 50
): Promise<RotationHistoryEntry[]> {
  const history = await prisma.api_credential_rotations.findMany({
    where: { credential_id: credentialId },
    orderBy: { started_at: 'desc' },
    take: limit,
  });

  return history;
}

/**
 * Cancel ongoing rotation (only in grace period)
 *
 * @param sessionId - Rotation session ID
 */
export async function cancelRotation(sessionId: string): Promise<void> {
  const session = await prisma.api_credential_rotations.findUnique({
    where: { id: sessionId },
  });

  if (!session) {
    throw new Error('Rotation session not found');
  }

  if (session.status !== 'grace_period') {
    throw new Error(
      `Cannot cancel rotation in status: ${session.status}. Only grace_period rotations can be cancelled.`
    );
  }

  await rollbackRotation(sessionId);
}

/**
 * Check if credential supports automatic rotation
 *
 * @param credentialId - Credential ID
 * @returns Whether rotation is supported
 */
export async function supportsRotation(credentialId: string): Promise<{
  supported: boolean;
  serviceType: string;
  strategy: string;
}> {
  const credential = await prisma.api_credentials.findUnique({
    where: { id: credentialId },
  });

  if (!credential) {
    throw new Error('Credential not found');
  }

  const serviceType = credential.service_template || 'custom';
  const strategy = getRotationStrategy(serviceType);

  return {
    supported: strategy.supportsRotation,
    serviceType,
    strategy: strategy.name,
  };
}
