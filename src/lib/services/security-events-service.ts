import { log } from '@/lib/logger';
/**
 * Security Events Service
 *
 * Centralized service for logging security events to appropriate audit tables.
 * Supports automatic categorization, severity assignment, and metadata sanitization.
 *
 * Usage:
 *   await logSecurityEvent({ ... })
 *   await logPermissionDenial({ ... })
 *   await logRoleChange({ ... })
 */

import { db } from '@/lib/db';
import {
  SecurityEventType,
  SecurityEventCategory,
  SecurityEventSeverity,
  getSeverityForEventType,
  getCategoryForEventType,
  shouldLogToAdminSecurityEvents,
  sanitizeMetadata,
  type PermissionDenialMetadata,
  type RoleChangeMetadata,
  type DataAccessMetadata,
  type DataModificationMetadata,
  type AdminActionMetadata,
  type SecurityViolationMetadata,
} from './security-events-types';

// ============================================
// TYPES
// ============================================

/**
 * Base parameters for logging a security event
 */
interface LogSecurityEventParams {
  eventType: SecurityEventType;
  category?: SecurityEventCategory;
  severity?: SecurityEventSeverity;
  userId?: string;
  userEmail?: string;
  action: string;
  tableName?: string;
  recordId?: string;
  oldData?: any;
  newData?: any;
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  success?: boolean;
  errorMessage?: string;
}

/**
 * Parameters for logging permission denial
 */
interface LogPermissionDenialParams {
  userId: string;
  userEmail?: string;
  requiredPermission: string;
  resource: string;
  action: string;
  userRoles?: string[];
  userPermissions?: string[];
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Parameters for logging role changes
 */
interface LogRoleChangeParams {
  targetUserId: string;
  targetUserEmail?: string;
  performedBy: string;
  performedByEmail?: string;
  oldRoles: string[];
  newRoles: string[];
  reason?: string;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Parameters for logging admin actions
 */
interface LogAdminActionParams {
  userId: string;
  userEmail?: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Parameters for logging data access
 */
interface LogDataAccessParams {
  userId: string;
  userEmail?: string;
  tableName: string;
  recordId?: string;
  recordCount?: number;
  queryType?: 'read' | 'export' | 'bulk';
  fields?: string[];
  filters?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Parameters for logging data modifications
 */
interface LogDataModificationParams {
  userId: string;
  userEmail?: string;
  tableName: string;
  recordId?: string;
  recordCount?: number;
  operationType: 'create' | 'update' | 'delete' | 'bulk';
  changedFields?: string[];
  oldValues?: Record<string, any>;
  newValues?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Parameters for logging security violations
 */
interface LogSecurityViolationParams {
  userId?: string;
  userEmail?: string;
  violationType: string;
  detectionMethod: string;
  requestUrl?: string;
  requestMethod?: string;
  suspiciousPayload?: string;
  ipAddress?: string;
  userAgent?: string;
}

// ============================================
// CORE LOGGING FUNCTIONS
// ============================================

/**
 * Log a security event to the appropriate table(s)
 *
 * Automatically determines:
 * - Severity level (if not provided)
 * - Category (if not provided)
 * - Which table(s) to log to
 * - Metadata sanitization
 *
 * @param params - Event parameters
 * @returns Promise<void>
 */
export async function logSecurityEvent(params: LogSecurityEventParams): Promise<void> {
  try {
    const {
      eventType,
      category = getCategoryForEventType(eventType),
      severity = getSeverityForEventType(eventType),
      userId,
      userEmail,
      action,
      tableName,
      recordId,
      oldData,
      newData,
      metadata = {},
      ipAddress,
      userAgent,
      success = true,
      errorMessage,
    } = params;

    // Sanitize metadata to prevent logging sensitive data
    const sanitizedMetadata = sanitizeMetadata(metadata);

    // Always log to security_audit_log (main audit trail)
    await db.security_audit_log.create({
      data: {
        user_id: userId || null,
        user_email: userEmail || null,
        action,
        table_name: tableName || null,
        record_id: recordId || null,
        old_data: oldData || null,
        new_data: newData || null,
        ip_address: ipAddress || null,
        user_agent: userAgent || null,
        success,
        error_message: errorMessage || null,
      },
    });

    // If high/critical severity, also log to admin_security_events
    if (shouldLogToAdminSecurityEvents(eventType)) {
      await db.admin_security_events.create({
        data: {
          event_type: eventType,
          user_id: userId || null,
          ip_address: ipAddress || null,
          user_agent: userAgent || null,
          metadata: sanitizedMetadata,
          severity,
        },
      });
    }

    // If admin action, also log to admin_audit_log
    if (category === SecurityEventCategory.ADMIN_ACTION) {
      await db.admin_audit_log.create({
        data: {
          action,
          user_id: userId || null,
          user_email: userEmail || null,
          resource_type: tableName || null,
          resource_id: recordId || null,
          metadata: sanitizedMetadata,
          ip_address: ipAddress || null,
        },
      });
    }
  } catch (error) {
    // Log error but don't throw - we don't want audit logging to break the app
    log.error('Failed to log security event:', { error });
  }
}

/**
 * Log a permission denial event
 *
 * Called when a user attempts an action they don't have permission for.
 * Logs to security_audit_log and admin_security_events if repeated attempts.
 *
 * @param params - Permission denial parameters
 * @returns Promise<void>
 */
export async function logPermissionDenial(params: LogPermissionDenialParams): Promise<void> {
  const {
    userId,
    userEmail,
    requiredPermission,
    resource,
    action,
    userRoles = [],
    userPermissions = [],
    ipAddress,
    userAgent,
  } = params;

  const metadata: PermissionDenialMetadata = {
    requiredPermission,
    resource,
    action,
    userRoles,
    userPermissions,
  };

  await logSecurityEvent({
    eventType: SecurityEventType.PERMISSION_DENIED,
    userId,
    userEmail,
    action: `permission_denied: ${requiredPermission}`,
    tableName: resource,
    metadata,
    ipAddress,
    userAgent,
    success: false,
  });
}

/**
 * Log a role change event
 *
 * Called when a user's roles are modified (added or removed).
 * Logs detailed before/after state for audit trail.
 *
 * @param params - Role change parameters
 * @returns Promise<void>
 */
export async function logRoleChange(params: LogRoleChangeParams): Promise<void> {
  const {
    targetUserId,
    targetUserEmail,
    performedBy,
    performedByEmail,
    oldRoles,
    newRoles,
    reason,
    ipAddress,
    userAgent,
  } = params;

  // Calculate which roles were added/removed
  const rolesAdded = newRoles.filter(r => !oldRoles.includes(r));
  const rolesRemoved = oldRoles.filter(r => !newRoles.includes(r));

  const metadata: RoleChangeMetadata = {
    targetUserId,
    targetUserEmail,
    performedBy,
    performedByEmail,
    oldRoles,
    newRoles,
    rolesAdded,
    rolesRemoved,
    reason,
  };

  // Determine event type
  let eventType: SecurityEventType;
  if (rolesAdded.length > 0 && rolesRemoved.length === 0) {
    eventType = SecurityEventType.ROLE_ASSIGNED;
  } else if (rolesRemoved.length > 0 && rolesAdded.length === 0) {
    eventType = SecurityEventType.ROLE_REMOVED;
  } else {
    eventType = SecurityEventType.USER_ROLES_UPDATED;
  }

  await logSecurityEvent({
    eventType,
    userId: performedBy,
    userEmail: performedByEmail,
    action: `role_change: ${targetUserId}`,
    tableName: 'user_roles',
    recordId: targetUserId,
    oldData: { roles: oldRoles },
    newData: { roles: newRoles },
    metadata,
    ipAddress,
    userAgent,
    success: true,
  });
}

/**
 * Log an admin action
 *
 * Called when an admin performs a significant action (user management, settings, etc.)
 * Logs to both admin_audit_log and security_audit_log.
 *
 * @param params - Admin action parameters
 * @returns Promise<void>
 */
export async function logAdminAction(params: LogAdminActionParams): Promise<void> {
  const {
    userId,
    userEmail,
    action,
    resourceType,
    resourceId,
    metadata = {},
    ipAddress,
    userAgent,
  } = params;

  const adminMetadata: AdminActionMetadata = {
    actionType: action,
    targetResource: resourceType,
    targetResourceId: resourceId,
    changes: metadata,
  };

  // Determine event type based on action
  let eventType: SecurityEventType;
  if (action.includes('create')) {
    eventType = SecurityEventType.USER_CREATED;
  } else if (action.includes('update')) {
    eventType = SecurityEventType.USER_UPDATED;
  } else if (action.includes('delete')) {
    eventType = SecurityEventType.USER_DELETED;
  } else if (action.includes('suspend')) {
    eventType = SecurityEventType.USER_SUSPENDED;
  } else if (action.includes('activate')) {
    eventType = SecurityEventType.USER_ACTIVATED;
  } else if (action.includes('settings')) {
    eventType = SecurityEventType.SETTINGS_CHANGED;
  } else {
    eventType = SecurityEventType.CONFIGURATION_UPDATED;
  }

  await logSecurityEvent({
    eventType,
    userId,
    userEmail,
    action,
    tableName: resourceType,
    recordId: resourceId,
    metadata: adminMetadata,
    ipAddress,
    userAgent,
    success: true,
  });
}

/**
 * Log a data access event
 *
 * Called when a user accesses data (view, export, etc.)
 * Useful for compliance and security monitoring.
 *
 * @param params - Data access parameters
 * @returns Promise<void>
 */
export async function logDataAccess(params: LogDataAccessParams): Promise<void> {
  const {
    userId,
    userEmail,
    tableName,
    recordId,
    recordCount,
    queryType = 'read',
    fields = [],
    filters = {},
    ipAddress,
    userAgent,
  } = params;

  const metadata: DataAccessMetadata = {
    tableName,
    recordId,
    recordCount,
    queryType,
    fields,
    filters,
  };

  // Determine event type
  let eventType: SecurityEventType;
  if (queryType === 'export') {
    eventType = SecurityEventType.DATA_EXPORTED;
  } else if (queryType === 'bulk' || (recordCount && recordCount > 100)) {
    eventType = SecurityEventType.BULK_DATA_ACCESS;
  } else {
    eventType = SecurityEventType.DATA_VIEWED;
  }

  await logSecurityEvent({
    eventType,
    userId,
    userEmail,
    action: `data_access: ${tableName}`,
    tableName,
    recordId,
    metadata,
    ipAddress,
    userAgent,
    success: true,
  });
}

/**
 * Log a data modification event
 *
 * Called when data is created, updated, or deleted.
 * Logs before/after values for audit trail.
 *
 * @param params - Data modification parameters
 * @returns Promise<void>
 */
export async function logDataModification(params: LogDataModificationParams): Promise<void> {
  const {
    userId,
    userEmail,
    tableName,
    recordId,
    recordCount,
    operationType,
    changedFields = [],
    oldValues = {},
    newValues = {},
    ipAddress,
    userAgent,
  } = params;

  const metadata: DataModificationMetadata = {
    tableName,
    recordId,
    recordCount,
    operationType,
    changedFields,
    oldValues,
    newValues,
  };

  // Determine event type
  let eventType: SecurityEventType;
  if (operationType === 'create') {
    eventType = SecurityEventType.DATA_CREATED;
  } else if (operationType === 'update') {
    eventType = SecurityEventType.DATA_UPDATED;
  } else if (operationType === 'delete') {
    eventType = SecurityEventType.DATA_DELETED;
  } else {
    eventType = SecurityEventType.BULK_DATA_MODIFICATION;
  }

  await logSecurityEvent({
    eventType,
    userId,
    userEmail,
    action: `data_${operationType}: ${tableName}`,
    tableName,
    recordId,
    oldData: oldValues,
    newData: newValues,
    metadata,
    ipAddress,
    userAgent,
    success: true,
  });
}

/**
 * Log a security violation
 *
 * Called when suspicious activity is detected (SQL injection, XSS, brute force, etc.)
 * Always logs to admin_security_events for immediate admin attention.
 *
 * @param params - Security violation parameters
 * @returns Promise<void>
 */
export async function logSecurityViolation(params: LogSecurityViolationParams): Promise<void> {
  const {
    userId,
    userEmail,
    violationType,
    detectionMethod,
    requestUrl,
    requestMethod,
    suspiciousPayload,
    ipAddress,
    userAgent,
  } = params;

  const metadata: SecurityViolationMetadata = {
    violationType,
    detectionMethod,
    requestUrl,
    requestMethod,
    suspiciousPayload,
    blockedAt: 'middleware',
  };

  // Determine event type
  let eventType: SecurityEventType;
  if (violationType.includes('sql')) {
    eventType = SecurityEventType.SQL_INJECTION_ATTEMPT;
  } else if (violationType.includes('xss')) {
    eventType = SecurityEventType.XSS_ATTEMPT;
  } else if (violationType.includes('brute_force')) {
    eventType = SecurityEventType.BRUTE_FORCE_ATTEMPT;
  } else if (violationType.includes('rate_limit')) {
    eventType = SecurityEventType.RATE_LIMIT_EXCEEDED;
  } else {
    eventType = SecurityEventType.SUSPICIOUS_ACTIVITY;
  }

  await logSecurityEvent({
    eventType,
    userId,
    userEmail,
    action: `security_violation: ${violationType}`,
    metadata,
    ipAddress,
    userAgent,
    success: false,
    errorMessage: `Detected ${violationType} from ${ipAddress}`,
  });
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Extract IP address from request headers
 *
 * Checks X-Forwarded-For, X-Real-IP, and connection.remoteAddress
 */
export function getClientIp(headers: Record<string, string | string[] | undefined>): string | undefined {
  const forwarded = headers['x-forwarded-for'];
  if (forwarded) {
    const ips = Array.isArray(forwarded) ? forwarded[0] : forwarded;
    return ips?.split(',')[0]?.trim();
  }

  const realIp = headers['x-real-ip'];
  if (realIp) {
    return Array.isArray(realIp) ? realIp[0] : realIp;
  }

  return undefined;
}

/**
 * Extract user agent from request headers
 */
export function getUserAgent(headers: Record<string, string | string[] | undefined>): string | undefined {
  const userAgent = headers['user-agent'];
  return Array.isArray(userAgent) ? userAgent[0] : userAgent;
}

/**
 * Get security event statistics for a time period
 *
 * Used by dashboard to show event counts by severity, category, etc.
 */
export async function getSecurityEventStats(days: number = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const [totalEvents, failedEvents, criticalEvents, permissionDenials] = await Promise.all([
    db.security_audit_log.count({
      where: {
        event_time: { gte: startDate },
      },
    }),
    db.security_audit_log.count({
      where: {
        event_time: { gte: startDate },
        success: false,
      },
    }),
    db.admin_security_events.count({
      where: {
        created_at: { gte: startDate },
        severity: { in: ['high', 'critical'] },
      },
    }),
    db.security_audit_log.count({
      where: {
        event_time: { gte: startDate },
        action: { contains: 'permission_denied' },
      },
    }),
  ]);

  return {
    totalEvents,
    failedEvents,
    criticalEvents,
    permissionDenials,
    successRate: totalEvents > 0 ? ((totalEvents - failedEvents) / totalEvents) * 100 : 100,
  };
}
