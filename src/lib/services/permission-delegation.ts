import { log } from '@/lib/logger';
/**
 * Permission Delegation Service
 *
 * Allows users to temporarily delegate their permissions to others with full audit trail.
 * Part of RBAC Phase 2.3 - Advanced Permission Features
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ============================================
// Types and Interfaces
// ============================================

export type DelegationStatus = 'active' | 'revoked' | 'expired';

export interface DelegationOptions {
  validFrom?: Date;
  validUntil: Date;
  resourceType?: string;
  resourceId?: string;
  reason: string;
}

export interface Delegation {
  id: string;
  delegatorId: string;
  delegateeId: string;
  permissionId: string;
  resourceType?: string | null;
  resourceId?: string | null;
  validFrom: Date;
  validUntil: Date;
  status: DelegationStatus;
  reason: string;
  createdAt: Date;
}

// ============================================
// Delegation Creation
// ============================================

/**
 * Delegates a permission from one user to another
 */
export async function delegatePermission(
  delegatorId: string,
  delegateeId: string,
  permissionId: string,
  options: DelegationOptions
): Promise<Delegation> {
  // Validation
  if (delegatorId === delegateeId) {
    throw new Error('Cannot delegate permission to yourself');
  }

  if (options.validUntil <= new Date()) {
    throw new Error('Delegation expiration must be in the future');
  }

  if (options.validFrom && options.validFrom >= options.validUntil) {
    throw new Error('Delegation start time must be before end time');
  }

  // Check if delegator has the permission
  // This would integrate with the main RBAC service
  // For now, we'll assume validation happens elsewhere

  const delegation = await prisma.permission_delegations.create({
    data: {
      delegator_id: delegatorId,
      delegatee_id: delegateeId,
      permission_id: permissionId,
      resource_type: options.resourceType,
      resource_id: options.resourceId,
      valid_from: options.validFrom || new Date(),
      valid_until: options.validUntil,
      status: 'active',
      delegation_reason: options.reason,
    },
  });

  log.info(`[Permission Delegation] Created delegation ${delegation.id}: ${delegatorId} → ${delegateeId} for permission ${permissionId}`);

  return {
    id: delegation.id,
    delegatorId: delegation.delegator_id,
    delegateeId: delegation.delegatee_id,
    permissionId: delegation.permission_id,
    resourceType: delegation.resource_type,
    resourceId: delegation.resource_id,
    validFrom: delegation.valid_from,
    validUntil: delegation.valid_until,
    status: delegation.status as DelegationStatus,
    reason: delegation.delegation_reason || '',
    createdAt: delegation.created_at,
  };
}

// ============================================
// Delegation Revocation
// ============================================

/**
 * Revokes an active delegation
 */
export async function revokeDelegation(
  delegationId: string,
  revokedBy: string,
  reason: string
): Promise<void> {
  const delegation = await prisma.permission_delegations.findUnique({
    where: { id: delegationId },
  });

  if (!delegation) {
    throw new Error('Delegation not found');
  }

  if (delegation.status !== 'active') {
    throw new Error(`Delegation is already ${delegation.status}`);
  }

  // Only the delegator or an admin can revoke
  // Admin check would happen in the calling layer

  await prisma.permission_delegations.update({
    where: { id: delegationId },
    data: {
      status: 'revoked',
      revoked_at: new Date(),
      revoked_by: revokedBy,
      revoke_reason: reason,
    },
  });

  log.info(`[Permission Delegation] Revoked delegation ${delegationId} by ${revokedBy}: ${reason}`);
}

// ============================================
// Delegation Queries
// ============================================

/**
 * Gets all active delegations for a user (received)
 */
export async function getUserDelegatedPermissions(userId: string): Promise<Delegation[]> {
  const delegations = await prisma.permission_delegations.findMany({
    where: {
      delegatee_id: userId,
      status: 'active',
      valid_from: { lte: new Date() },
      valid_until: { gte: new Date() },
    },
    include: {
      permission_definitions: true,
    },
  });

  return delegations.map(d => ({
    id: d.id,
    delegatorId: d.delegator_id,
    delegateeId: d.delegatee_id,
    permissionId: d.permission_id,
    resourceType: d.resource_type,
    resourceId: d.resource_id,
    validFrom: d.valid_from,
    validUntil: d.valid_until,
    status: d.status as DelegationStatus,
    reason: d.delegation_reason || '',
    createdAt: d.created_at,
  }));
}

/**
 * Gets all delegations given or received by a user
 */
export async function getUserDelegations(
  userId: string,
  type: 'given' | 'received'
): Promise<Delegation[]> {
  const whereClause = type === 'given'
    ? { delegator_id: userId }
    : { delegatee_id: userId };

  const delegations = await prisma.permission_delegations.findMany({
    where: whereClause,
    orderBy: { created_at: 'desc' },
  });

  return delegations.map(d => ({
    id: d.id,
    delegatorId: d.delegator_id,
    delegateeId: d.delegatee_id,
    permissionId: d.permission_id,
    resourceType: d.resource_type,
    resourceId: d.resource_id,
    validFrom: d.valid_from,
    validUntil: d.valid_until,
    status: d.status as DelegationStatus,
    reason: d.delegation_reason || '',
    createdAt: d.created_at,
  }));
}

/**
 * Checks if a user has a specific permission through delegation
 */
export async function hasDelegatedPermission(
  userId: string,
  permissionId: string,
  resourceType?: string,
  resourceId?: string
): Promise<boolean> {
  const now = new Date();

  const delegation = await prisma.permission_delegations.findFirst({
    where: {
      delegatee_id: userId,
      permission_id: permissionId,
      status: 'active',
      valid_from: { lte: now },
      valid_until: { gte: now },
      ...(resourceType && { resource_type: resourceType }),
      ...(resourceId && { resource_id: resourceId }),
    },
  });

  return !!delegation;
}

/**
 * Gets a single delegation by ID
 */
export async function getDelegation(delegationId: string): Promise<Delegation | null> {
  const delegation = await prisma.permission_delegations.findUnique({
    where: { id: delegationId },
  });

  if (!delegation) return null;

  return {
    id: delegation.id,
    delegatorId: delegation.delegator_id,
    delegateeId: delegation.delegatee_id,
    permissionId: delegation.permission_id,
    resourceType: delegation.resource_type,
    resourceId: delegation.resource_id,
    validFrom: delegation.valid_from,
    validUntil: delegation.valid_until,
    status: delegation.status as DelegationStatus,
    reason: delegation.delegation_reason || '',
    createdAt: delegation.created_at,
  };
}

// ============================================
// Expiration Management
// ============================================

/**
 * Marks expired delegations as expired
 * Should be run periodically (e.g., via cron job)
 */
export async function expireOutdatedDelegations(): Promise<number> {
  const result = await prisma.permission_delegations.updateMany({
    where: {
      status: 'active',
      valid_until: { lt: new Date() },
    },
    data: {
      status: 'expired',
    },
  });

  if (result.count > 0) {
    log.info(`[Permission Delegation] Expired ${result.count} outdated delegations`);
  }

  return result.count;
}

/**
 * Gets all delegations expiring soon (within the next N hours)
 */
export async function getDelegationsExpiringSoon(hoursUntilExpiry: number = 24): Promise<Delegation[]> {
  const now = new Date();
  const expiryThreshold = new Date(now.getTime() + hoursUntilExpiry * 60 * 60 * 1000);

  const delegations = await prisma.permission_delegations.findMany({
    where: {
      status: 'active',
      valid_until: {
        gte: now,
        lte: expiryThreshold,
      },
    },
  });

  return delegations.map(d => ({
    id: d.id,
    delegatorId: d.delegator_id,
    delegateeId: d.delegatee_id,
    permissionId: d.permission_id,
    resourceType: d.resource_type,
    resourceId: d.resource_id,
    validFrom: d.valid_from,
    validUntil: d.valid_until,
    status: d.status as DelegationStatus,
    reason: d.delegation_reason || '',
    createdAt: d.created_at,
  }));
}

// ============================================
// Delegation Statistics
// ============================================

/**
 * Gets delegation statistics for a user
 */
export async function getDelegationStats(userId: string) {
  const [givenCount, receivedCount, activeGiven, activeReceived] = await Promise.all([
    prisma.permission_delegations.count({
      where: { delegator_id: userId },
    }),
    prisma.permission_delegations.count({
      where: { delegatee_id: userId },
    }),
    prisma.permission_delegations.count({
      where: {
        delegator_id: userId,
        status: 'active',
        valid_from: { lte: new Date() },
        valid_until: { gte: new Date() },
      },
    }),
    prisma.permission_delegations.count({
      where: {
        delegatee_id: userId,
        status: 'active',
        valid_from: { lte: new Date() },
        valid_until: { gte: new Date() },
      },
    }),
  ]);

  return {
    totalGiven: givenCount,
    totalReceived: receivedCount,
    activeGiven,
    activeReceived,
  };
}
