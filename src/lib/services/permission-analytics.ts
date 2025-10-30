import { log } from '@/lib/logger';
/**
 * Permission Analytics Service
 *
 * Tracks permission usage for analytics, compliance, and security monitoring.
 * Part of RBAC Phase 2.3 - Advanced Permission Features
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ============================================
// Types and Interfaces
// ============================================

export type UsageResult = 'granted' | 'denied' | 'error';

export interface PermissionUsageLog {
  id: string;
  userId: string;
  permissionId: string;
  resourceType?: string | null;
  resourceId?: string | null;
  action?: string | null;
  result: UsageResult;
  denialReason?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  sessionId?: string | null;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface UsageStats {
  totalUsage: number;
  grantedCount: number;
  deniedCount: number;
  errorCount: number;
  grantRate: number;
  denyRate: number;
  uniqueUsers: number;
  topUsers: Array<{ userId: string; count: number }>;
  usageByHour: Array<{ hour: number; count: number }>;
}

export interface SecurityAlert {
  severity: 'high' | 'medium' | 'low';
  type: string;
  description: string;
  userId?: string;
  permissionId?: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface ComplianceReport {
  period: { start: Date; end: Date };
  totalPermissionChecks: number;
  uniqueUsers: number;
  uniquePermissions: number;
  denialRate: number;
  topDeniedPermissions: Array<{ permissionId: string; count: number }>;
  unusualActivityCount: number;
  complianceScore: number;
}

// ============================================
// Usage Logging
// ============================================

/**
 * Logs a permission usage event
 */
export async function logPermissionUsage(
  userId: string,
  permissionId: string,
  result: UsageResult,
  options?: {
    resourceType?: string;
    resourceId?: string;
    action?: string;
    denialReason?: string;
    ipAddress?: string;
    userAgent?: string;
    sessionId?: string;
    metadata?: Record<string, any>;
  }
): Promise<void> {
  try {
    await prisma.permission_usage_log.create({
      data: {
        user_id: userId,
        permission_id: permissionId,
        resource_type: options?.resourceType,
        resource_id: options?.resourceId,
        action: options?.action,
        result,
        denial_reason: options?.denialReason,
        ip_address: options?.ipAddress,
        user_agent: options?.userAgent,
        session_id: options?.sessionId,
        metadata: options?.metadata || {},
      },
    });
  } catch (error) {
    // Don't throw - logging failures shouldn't block the request
    log.error('[Permission Analytics] Failed to log permission usage:', { error });
  }
}

// ============================================
// Usage Statistics
// ============================================

/**
 * Gets usage statistics for a permission
 */
export async function getPermissionUsageStats(
  permissionId: string,
  timeRange: { start: Date; end: Date }
): Promise<UsageStats> {
  const logs = await prisma.permission_usage_log.findMany({
    where: {
      permission_id: permissionId,
      timestamp: {
        gte: timeRange.start,
        lte: timeRange.end,
      },
    },
  });

  const totalUsage = logs.length;
  const grantedCount = logs.filter(l => l.result === 'granted').length;
  const deniedCount = logs.filter(l => l.result === 'denied').length;
  const errorCount = logs.filter(l => l.result === 'error').length;

  // Get unique users
  const uniqueUsers = new Set(logs.map(l => l.user_id)).size;

  // Get top users
  const userCounts = new Map<string, number>();
  logs.forEach(log => {
    userCounts.set(log.user_id, (userCounts.get(log.user_id) || 0) + 1);
  });

  const topUsers = Array.from(userCounts.entries())
    .map(([userId, count]) => ({ userId, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // Get usage by hour
  const hourCounts = new Map<number, number>();
  logs.forEach(log => {
    const hour = new Date(log.timestamp).getHours();
    hourCounts.set(hour, (hourCounts.get(hour) || 0) + 1);
  });

  const usageByHour = Array.from(hourCounts.entries())
    .map(([hour, count]) => ({ hour, count }))
    .sort((a, b) => a.hour - b.hour);

  return {
    totalUsage,
    grantedCount,
    deniedCount,
    errorCount,
    grantRate: totalUsage > 0 ? (grantedCount / totalUsage) * 100 : 0,
    denyRate: totalUsage > 0 ? (deniedCount / totalUsage) * 100 : 0,
    uniqueUsers,
    topUsers,
    usageByHour,
  };
}

/**
 * Gets usage statistics for a user
 */
export async function getUserUsageStats(
  userId: string,
  timeRange: { start: Date; end: Date }
): Promise<UsageStats> {
  const logs = await prisma.permission_usage_log.findMany({
    where: {
      user_id: userId,
      timestamp: {
        gte: timeRange.start,
        lte: timeRange.end,
      },
    },
  });

  const totalUsage = logs.length;
  const grantedCount = logs.filter(l => l.result === 'granted').length;
  const deniedCount = logs.filter(l => l.result === 'denied').length;
  const errorCount = logs.filter(l => l.result === 'error').length;

  // Get unique permissions
  const uniquePermissions = new Set(logs.map(l => l.permission_id)).size;

  // Get top permissions
  const permissionCounts = new Map<string, number>();
  logs.forEach(log => {
    permissionCounts.set(log.permission_id, (permissionCounts.get(log.permission_id) || 0) + 1);
  });

  const topPermissions = Array.from(permissionCounts.entries())
    .map(([permissionId, count]) => ({ userId: permissionId, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // Get usage by hour
  const hourCounts = new Map<number, number>();
  logs.forEach(log => {
    const hour = new Date(log.timestamp).getHours();
    hourCounts.set(hour, (hourCounts.get(hour) || 0) + 1);
  });

  const usageByHour = Array.from(hourCounts.entries())
    .map(([hour, count]) => ({ hour, count }))
    .sort((a, b) => a.hour - b.hour);

  return {
    totalUsage,
    grantedCount,
    deniedCount,
    errorCount,
    grantRate: totalUsage > 0 ? (grantedCount / totalUsage) * 100 : 0,
    denyRate: totalUsage > 0 ? (deniedCount / totalUsage) * 100 : 0,
    uniqueUsers: uniquePermissions,
    topUsers: topPermissions,
    usageByHour,
  };
}

// ============================================
// Unused Permissions Detection
// ============================================

/**
 * Finds permissions that haven't been used in N days
 */
export async function getUnusedPermissions(
  daysInactive: number = 90
): Promise<Array<{ permissionId: string; lastUsed: Date | null; usageCount: number }>> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysInactive);

  // Get all permissions
  const allPermissions = await prisma.permission_definitions.findMany({
    select: { id: true },
  });

  const results = await Promise.all(
    allPermissions.map(async (permission) => {
      const recentUsage = await prisma.permission_usage_log.findFirst({
        where: {
          permission_id: permission.id,
          timestamp: { gte: cutoffDate },
        },
        orderBy: { timestamp: 'desc' },
      });

      const totalUsage = await prisma.permission_usage_log.count({
        where: { permission_id: permission.id },
      });

      return {
        permissionId: permission.id,
        lastUsed: recentUsage?.timestamp || null,
        usageCount: totalUsage,
      };
    })
  );

  return results
    .filter(r => !r.lastUsed)
    .sort((a, b) => a.usageCount - b.usageCount);
}

// ============================================
// Security Alerts
// ============================================

/**
 * Detects and returns security alerts based on usage patterns
 */
export async function getSecurityAlerts(
  severity?: 'high' | 'medium' | 'low'
): Promise<SecurityAlert[]> {
  const alerts: SecurityAlert[] = [];
  const now = new Date();
  const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  // Alert: High denial rate for a user (>50% in last 24h)
  const userDenials = await prisma.permission_usage_log.groupBy({
    by: ['user_id'],
    where: {
      timestamp: { gte: last24Hours },
    },
    _count: {
      result: true,
    },
    having: {
      result: {
        _count: {
          gt: 10,
        },
      },
    },
  });

  for (const userGroup of userDenials) {
    const deniedCount = await prisma.permission_usage_log.count({
      where: {
        user_id: userGroup.user_id,
        result: 'denied',
        timestamp: { gte: last24Hours },
      },
    });

    const totalCount = userGroup._count.result;
    const denialRate = (deniedCount / totalCount) * 100;

    if (denialRate > 50) {
      alerts.push({
        severity: 'high',
        type: 'high_denial_rate',
        description: `User has ${denialRate.toFixed(1)}% permission denial rate in last 24 hours`,
        userId: userGroup.user_id,
        timestamp: now,
        metadata: { denialRate, totalAttempts: totalCount, deniedCount },
      });
    }
  }

  // Filter by severity if specified
  if (severity) {
    return alerts.filter(a => a.severity === severity);
  }

  return alerts;
}

// ============================================
// Compliance Reporting
// ============================================

/**
 * Generates a compliance report for a time period
 */
export async function getComplianceReport(
  timeRange: { start: Date; end: Date }
): Promise<ComplianceReport> {
  const allLogs = await prisma.permission_usage_log.findMany({
    where: {
      timestamp: {
        gte: timeRange.start,
        lte: timeRange.end,
      },
    },
  });

  const totalPermissionChecks = allLogs.length;
  const uniqueUsers = new Set(allLogs.map(l => l.user_id)).size;
  const uniquePermissions = new Set(allLogs.map(l => l.permission_id)).size;

  const deniedCount = allLogs.filter(l => l.result === 'denied').length;
  const denialRate = totalPermissionChecks > 0 ? (deniedCount / totalPermissionChecks) * 100 : 0;

  // Top denied permissions
  const deniedLogs = allLogs.filter(l => l.result === 'denied');
  const permissionDenials = new Map<string, number>();

  deniedLogs.forEach(log => {
    permissionDenials.set(log.permission_id, (permissionDenials.get(log.permission_id) || 0) + 1);
  });

  const topDeniedPermissions = Array.from(permissionDenials.entries())
    .map(([permissionId, count]) => ({ permissionId, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // Unusual activity count (denied errors)
  const unusualActivityCount = allLogs.filter(l => l.result === 'error').length;

  // Calculate compliance score (0-100)
  // Higher score = better compliance
  const baseScore = 100;
  const denialPenalty = denialRate > 5 ? (denialRate - 5) * 2 : 0;
  const errorPenalty = unusualActivityCount > 0 ? Math.min(unusualActivityCount / 10, 20) : 0;

  const complianceScore = Math.max(0, Math.min(100, baseScore - denialPenalty - errorPenalty));

  return {
    period: timeRange,
    totalPermissionChecks,
    uniqueUsers,
    uniquePermissions,
    denialRate,
    topDeniedPermissions,
    unusualActivityCount,
    complianceScore,
  };
}

// ============================================
// Recent Activity
// ============================================

/**
 * Gets recent permission usage activity
 */
export async function getRecentActivity(
  limit: number = 100
): Promise<PermissionUsageLog[]> {
  const logs = await prisma.permission_usage_log.findMany({
    take: limit,
    orderBy: { timestamp: 'desc' },
  });

  return logs.map(l => ({
    id: l.id,
    userId: l.user_id,
    permissionId: l.permission_id,
    resourceType: l.resource_type,
    resourceId: l.resource_id,
    action: l.action,
    result: l.result as UsageResult,
    denialReason: l.denial_reason,
    ipAddress: l.ip_address,
    userAgent: l.user_agent,
    sessionId: l.session_id,
    timestamp: l.timestamp,
    metadata: l.metadata as Record<string, any>,
  }));
}

/**
 * Gets permission usage logs for a specific resource
 */
export async function getResourceActivity(
  resourceType: string,
  resourceId: string,
  limit: number = 50
): Promise<PermissionUsageLog[]> {
  const logs = await prisma.permission_usage_log.findMany({
    where: {
      resource_type: resourceType,
      resource_id: resourceId,
    },
    take: limit,
    orderBy: { timestamp: 'desc' },
  });

  return logs.map(l => ({
    id: l.id,
    userId: l.user_id,
    permissionId: l.permission_id,
    resourceType: l.resource_type,
    resourceId: l.resource_id,
    action: l.action,
    result: l.result as UsageResult,
    denialReason: l.denial_reason,
    ipAddress: l.ip_address,
    userAgent: l.user_agent,
    sessionId: l.session_id,
    timestamp: l.timestamp,
    metadata: l.metadata as Record<string, any>,
  }));
}
