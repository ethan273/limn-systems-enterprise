/**
 * Permission Approval Service
 *
 * Implements approval workflows for requesting elevated permissions.
 * Part of RBAC Phase 2.3 - Advanced Permission Features
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ============================================
// Types and Interfaces
// ============================================

export type RequestStatus = 'pending' | 'approved' | 'denied' | 'cancelled';

export interface PermissionRequestOptions {
  reason: string;
  durationHours?: number;  // null = permanent
  resourceType?: string;
  resourceId?: string;
  metadata?: Record<string, any>;
}

export interface PermissionRequest {
  id: string;
  requesterId: string;
  permissionId: string;
  resourceType?: string | null;
  resourceId?: string | null;
  requestReason: string;
  durationHours?: number | null;
  status: RequestStatus;
  approverId?: string | null;
  approvedAt?: Date | null;
  deniedAt?: Date | null;
  approvalReason?: string | null;
  autoApproved: boolean;
  requestedAt: Date;
  expiresAt?: Date | null;
}

export interface AutoApprovalRule {
  permissionId: string;
  roleKey?: string;
  maxDurationHours?: number;
  requiresJustification: boolean;
}

// ============================================
// Request Creation
// ============================================

/**
 * Requests a permission (creates an approval workflow)
 */
export async function requestPermission(
  requesterId: string,
  permissionId: string,
  options: PermissionRequestOptions
): Promise<PermissionRequest> {
  // Check for existing pending request
  const existingRequest = await prisma.permission_requests.findFirst({
    where: {
      requester_id: requesterId,
      permission_id: permissionId,
      status: 'pending',
      ...(options.resourceType && { resource_type: options.resourceType }),
      ...(options.resourceId && { resource_id: options.resourceId }),
    },
  });

  if (existingRequest) {
    throw new Error('A pending request for this permission already exists');
  }

  // Check auto-approval rules
  const autoApproval = await checkAutoApprovalRules(
    requesterId,
    permissionId,
    options
  );

  const now = new Date();
  const expiresAt = options.durationHours
    ? new Date(now.getTime() + options.durationHours * 60 * 60 * 1000)
    : null;

  const request = await prisma.permission_requests.create({
    data: {
      requester_id: requesterId,
      permission_id: permissionId,
      resource_type: options.resourceType,
      resource_id: options.resourceId,
      request_reason: options.reason,
      duration_hours: options.durationHours,
      status: autoApproval.approved ? 'approved' : 'pending',
      auto_approved: autoApproval.approved,
      auto_approval_reason: autoApproval.reason,
      approved_at: autoApproval.approved ? now : null,
      expires_at: expiresAt,
      metadata: options.metadata || {},
    },
  });

  if (autoApproval.approved) {
    console.log(`[Permission Approval] Auto-approved request ${request.id}: ${autoApproval.reason}`);
    // TODO: Grant the permission automatically
  } else {
    console.log(`[Permission Approval] Created permission request ${request.id} for ${requesterId}`);
    // TODO: Notify approvers
  }

  return mapRequestToInterface(request);
}

// ============================================
// Auto-Approval Logic
// ============================================

/**
 * Checks if a permission request should be auto-approved
 */
async function checkAutoApprovalRules(
  requesterId: string,
  permissionId: string,
  options: PermissionRequestOptions
): Promise<{ approved: boolean; reason?: string }> {
  // Get user's roles
  // This would integrate with the main RBAC service
  // For now, simplified logic

  // Example auto-approval rules:
  // 1. Requests under 1 hour are auto-approved
  // 2. Certain low-risk permissions are auto-approved
  // 3. Managers auto-approve certain requests

  if (options.durationHours && options.durationHours <= 1) {
    return {
      approved: true,
      reason: 'Short duration request (≤ 1 hour) auto-approved',
    };
  }

  // Add more sophisticated auto-approval logic here

  return { approved: false };
}

// ============================================
// Request Approval/Denial
// ============================================

/**
 * Approves a permission request
 */
export async function approveRequest(
  requestId: string,
  approverId: string,
  reason: string
): Promise<void> {
  const request = await prisma.permission_requests.findUnique({
    where: { id: requestId },
  });

  if (!request) {
    throw new Error('Permission request not found');
  }

  if (request.status !== 'pending') {
    throw new Error(`Request is already ${request.status}`);
  }

  await prisma.permission_requests.update({
    where: { id: requestId },
    data: {
      status: 'approved',
      approver_id: approverId,
      approved_at: new Date(),
      approval_reason: reason,
    },
  });

  console.log(`[Permission Approval] Approved request ${requestId} by ${approverId}`);

  // TODO: Grant the permission
  // This would create a permission_scopes entry or similar
}

/**
 * Denies a permission request
 */
export async function denyRequest(
  requestId: string,
  approverId: string,
  reason: string
): Promise<void> {
  const request = await prisma.permission_requests.findUnique({
    where: { id: requestId },
  });

  if (!request) {
    throw new Error('Permission request not found');
  }

  if (request.status !== 'pending') {
    throw new Error(`Request is already ${request.status}`);
  }

  await prisma.permission_requests.update({
    where: { id: requestId },
    data: {
      status: 'denied',
      approver_id: approverId,
      denied_at: new Date(),
      approval_reason: reason,
    },
  });

  console.log(`[Permission Approval] Denied request ${requestId} by ${approverId}: ${reason}`);
}

/**
 * Cancels a permission request (by requester)
 */
export async function cancelRequest(
  requestId: string,
  requesterId: string
): Promise<void> {
  const request = await prisma.permission_requests.findUnique({
    where: { id: requestId },
  });

  if (!request) {
    throw new Error('Permission request not found');
  }

  if (request.requester_id !== requesterId) {
    throw new Error('Only the requester can cancel this request');
  }

  if (request.status !== 'pending') {
    throw new Error(`Request is already ${request.status}`);
  }

  await prisma.permission_requests.update({
    where: { id: requestId },
    data: {
      status: 'cancelled',
    },
  });

  console.log(`[Permission Approval] Cancelled request ${requestId} by requester ${requesterId}`);
}

// ============================================
// Request Queries
// ============================================

/**
 * Gets all pending requests that a user can approve
 */
export async function getPendingRequests(approverId: string): Promise<PermissionRequest[]> {
  // In a full implementation, this would check which permissions
  // the approver has the authority to approve
  // For now, simplified to all pending requests

  const requests = await prisma.permission_requests.findMany({
    where: {
      status: 'pending',
    },
    orderBy: { requested_at: 'desc' },
  });

  return requests.map(mapRequestToInterface);
}

/**
 * Gets all requests made by a user
 */
export async function getUserRequests(userId: string): Promise<PermissionRequest[]> {
  const requests = await prisma.permission_requests.findMany({
    where: {
      requester_id: userId,
    },
    orderBy: { requested_at: 'desc' },
  });

  return requests.map(mapRequestToInterface);
}

/**
 * Gets a single request by ID
 */
export async function getRequest(requestId: string): Promise<PermissionRequest | null> {
  const request = await prisma.permission_requests.findUnique({
    where: { id: requestId },
  });

  if (!request) return null;

  return mapRequestToInterface(request);
}

/**
 * Gets all pending requests for a specific permission
 */
export async function getPendingRequestsByPermission(
  permissionId: string
): Promise<PermissionRequest[]> {
  const requests = await prisma.permission_requests.findMany({
    where: {
      permission_id: permissionId,
      status: 'pending',
    },
    orderBy: { requested_at: 'desc' },
  });

  return requests.map(mapRequestToInterface);
}

// ============================================
// Request Statistics
// ============================================

/**
 * Gets approval statistics for a user
 */
export async function getApprovalStats(userId: string) {
  const [totalRequested, approved, denied, pending] = await Promise.all([
    prisma.permission_requests.count({
      where: { requester_id: userId },
    }),
    prisma.permission_requests.count({
      where: { requester_id: userId, status: 'approved' },
    }),
    prisma.permission_requests.count({
      where: { requester_id: userId, status: 'denied' },
    }),
    prisma.permission_requests.count({
      where: { requester_id: userId, status: 'pending' },
    }),
  ]);

  return {
    totalRequested,
    approved,
    denied,
    pending,
    approvalRate: totalRequested > 0 ? (approved / totalRequested) * 100 : 0,
  };
}

/**
 * Gets statistics for all permission requests
 */
export async function getGlobalApprovalStats() {
  const [total, pending, approved, denied, autoApproved] = await Promise.all([
    prisma.permission_requests.count(),
    prisma.permission_requests.count({ where: { status: 'pending' } }),
    prisma.permission_requests.count({ where: { status: 'approved' } }),
    prisma.permission_requests.count({ where: { status: 'denied' } }),
    prisma.permission_requests.count({ where: { auto_approved: true } }),
  ]);

  return {
    total,
    pending,
    approved,
    denied,
    autoApproved,
    approvalRate: total > 0 ? (approved / total) * 100 : 0,
    autoApprovalRate: approved > 0 ? (autoApproved / approved) * 100 : 0,
  };
}

// ============================================
// Utility Functions
// ============================================

/**
 * Maps database record to interface
 */
function mapRequestToInterface(request: any): PermissionRequest {
  return {
    id: request.id,
    requesterId: request.requester_id,
    permissionId: request.permission_id,
    resourceType: request.resource_type,
    resourceId: request.resource_id,
    requestReason: request.request_reason,
    durationHours: request.duration_hours,
    status: request.status as RequestStatus,
    approverId: request.approver_id,
    approvedAt: request.approved_at,
    deniedAt: request.denied_at,
    approvalReason: request.approval_reason,
    autoApproved: request.auto_approved,
    requestedAt: request.requested_at,
    expiresAt: request.expires_at,
  };
}
