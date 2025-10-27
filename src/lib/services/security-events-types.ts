/**
 * Security Events - Type Definitions
 *
 * Comprehensive type system for security event logging
 * Used by security-events-service.ts
 */

import { z } from 'zod';

// ============================================
// ENUMS
// ============================================

/**
 * Security event categories for classification
 */
export enum SecurityEventCategory {
  AUTHENTICATION = 'authentication',
  AUTHORIZATION = 'authorization',
  DATA_ACCESS = 'data_access',
  DATA_MODIFICATION = 'data_modification',
  RBAC_CHANGE = 'rbac_change',
  ADMIN_ACTION = 'admin_action',
  SECURITY_VIOLATION = 'security_violation',
  SYSTEM_EVENT = 'system_event',
}

/**
 * Security event severity levels
 * Maps to compliance requirements (SOC2, GDPR, etc.)
 */
export enum SecurityEventSeverity {
  INFO = 'info',       // Normal operations, informational
  LOW = 'low',         // Minor events, non-critical
  MEDIUM = 'medium',   // Notable events, requires attention
  HIGH = 'high',       // Serious events, requires immediate attention
  CRITICAL = 'critical', // Critical security events, requires immediate action
}

/**
 * Event type identifiers for specific actions
 */
export enum SecurityEventType {
  // Authentication Events
  LOGIN_SUCCESS = 'login_success',
  LOGIN_FAILURE = 'login_failure',
  LOGOUT = 'logout',
  SESSION_EXPIRED = 'session_expired',
  PASSWORD_RESET = 'password_reset',
  MFA_ENABLED = 'mfa_enabled',
  MFA_DISABLED = 'mfa_disabled',

  // Authorization Events
  PERMISSION_GRANTED = 'permission_granted',
  PERMISSION_DENIED = 'permission_denied',
  ROLE_CHECK_SUCCESS = 'role_check_success',
  ROLE_CHECK_FAILURE = 'role_check_failure',
  UNAUTHORIZED_ACCESS_ATTEMPT = 'unauthorized_access_attempt',

  // RBAC Events
  ROLE_ASSIGNED = 'role_assigned',
  ROLE_REMOVED = 'role_removed',
  PERMISSION_ADDED = 'permission_added',
  PERMISSION_REVOKED = 'permission_revoked',
  USER_ROLES_UPDATED = 'user_roles_updated',

  // Data Access Events
  DATA_VIEWED = 'data_viewed',
  DATA_EXPORTED = 'data_exported',
  SENSITIVE_DATA_ACCESSED = 'sensitive_data_accessed',
  BULK_DATA_ACCESS = 'bulk_data_access',

  // Data Modification Events
  DATA_CREATED = 'data_created',
  DATA_UPDATED = 'data_updated',
  DATA_DELETED = 'data_deleted',
  BULK_DATA_MODIFICATION = 'bulk_data_modification',

  // Admin Actions
  USER_CREATED = 'user_created',
  USER_UPDATED = 'user_updated',
  USER_DELETED = 'user_deleted',
  USER_SUSPENDED = 'user_suspended',
  USER_ACTIVATED = 'user_activated',
  SETTINGS_CHANGED = 'settings_changed',
  CONFIGURATION_UPDATED = 'configuration_updated',

  // Security Violations
  SUSPICIOUS_ACTIVITY = 'suspicious_activity',
  RATE_LIMIT_EXCEEDED = 'rate_limit_exceeded',
  INVALID_TOKEN = 'invalid_token',
  SQL_INJECTION_ATTEMPT = 'sql_injection_attempt',
  XSS_ATTEMPT = 'xss_attempt',
  BRUTE_FORCE_ATTEMPT = 'brute_force_attempt',

  // System Events
  SERVICE_STARTED = 'service_started',
  SERVICE_STOPPED = 'service_stopped',
  ERROR_OCCURRED = 'error_occurred',
  MAINTENANCE_MODE = 'maintenance_mode',
}

// ============================================
// SCHEMAS
// ============================================

/**
 * Base security event schema
 */
export const SecurityEventBaseSchema = z.object({
  eventType: z.nativeEnum(SecurityEventType),
  category: z.nativeEnum(SecurityEventCategory),
  severity: z.nativeEnum(SecurityEventSeverity),
  userId: z.string().uuid().optional(),
  userEmail: z.string().email().optional(),
  action: z.string(),
  success: z.boolean().default(true),
  errorMessage: z.string().optional(),
  ipAddress: z.string().optional(),
  userAgent: z.string().optional(),
  metadata: z.record(z.any()).optional(),
});

/**
 * Security audit log event (goes to security_audit_log table)
 */
export const SecurityAuditEventSchema = SecurityEventBaseSchema.extend({
  tableName: z.string().optional(),
  recordId: z.string().optional(),
  oldData: z.any().optional(),
  newData: z.any().optional(),
});

/**
 * Admin audit log event (goes to admin_audit_log table)
 */
export const AdminAuditEventSchema = z.object({
  action: z.string(),
  userId: z.string().uuid().optional(),
  userEmail: z.string().email().optional(),
  resourceType: z.string().optional(),
  resourceId: z.string().optional(),
  metadata: z.record(z.any()).optional(),
  ipAddress: z.string().optional(),
});

/**
 * Admin security event (goes to admin_security_events table)
 */
export const AdminSecurityEventSchema = z.object({
  eventType: z.string(),
  userId: z.string().uuid().optional(),
  ipAddress: z.string().optional(),
  userAgent: z.string().optional(),
  metadata: z.record(z.any()).optional(),
  severity: z.nativeEnum(SecurityEventSeverity).optional(),
});

// ============================================
// TYPES
// ============================================

export type SecurityEventBase = z.infer<typeof SecurityEventBaseSchema>;
export type SecurityAuditEvent = z.infer<typeof SecurityAuditEventSchema>;
export type AdminAuditEvent = z.infer<typeof AdminAuditEventSchema>;
export type AdminSecurityEvent = z.infer<typeof AdminSecurityEventSchema>;

/**
 * Permission denial event metadata
 */
export interface PermissionDenialMetadata {
  requiredPermission: string;
  resource: string;
  action: string;
  userRoles?: string[];
  userPermissions?: string[];
}

/**
 * Role change event metadata
 */
export interface RoleChangeMetadata {
  targetUserId: string;
  targetUserEmail?: string;
  performedBy: string;
  performedByEmail?: string;
  oldRoles: string[];
  newRoles: string[];
  reason?: string;
  rolesAdded?: string[];
  rolesRemoved?: string[];
}

/**
 * Data access event metadata
 */
export interface DataAccessMetadata {
  tableName: string;
  recordId?: string;
  recordCount?: number;
  queryType?: 'read' | 'export' | 'bulk';
  fields?: string[];
  filters?: Record<string, any>;
}

/**
 * Data modification event metadata
 */
export interface DataModificationMetadata {
  tableName: string;
  recordId?: string;
  recordCount?: number;
  operationType: 'create' | 'update' | 'delete' | 'bulk';
  changedFields?: string[];
  oldValues?: Record<string, any>;
  newValues?: Record<string, any>;
}

/**
 * Admin action event metadata
 */
export interface AdminActionMetadata {
  actionType: string;
  targetResource: string;
  targetResourceId?: string;
  changes?: Record<string, any>;
  reason?: string;
}

/**
 * Security violation event metadata
 */
export interface SecurityViolationMetadata {
  violationType: string;
  detectionMethod: string;
  requestUrl?: string;
  requestMethod?: string;
  requestHeaders?: Record<string, string>;
  suspiciousPayload?: string;
  blockedAt: 'firewall' | 'middleware' | 'handler';
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Determine severity based on event type
 */
export function getSeverityForEventType(eventType: SecurityEventType): SecurityEventSeverity {
  const severityMap: Record<SecurityEventType, SecurityEventSeverity> = {
    // Authentication - INFO to MEDIUM
    [SecurityEventType.LOGIN_SUCCESS]: SecurityEventSeverity.INFO,
    [SecurityEventType.LOGIN_FAILURE]: SecurityEventSeverity.MEDIUM,
    [SecurityEventType.LOGOUT]: SecurityEventSeverity.INFO,
    [SecurityEventType.SESSION_EXPIRED]: SecurityEventSeverity.LOW,
    [SecurityEventType.PASSWORD_RESET]: SecurityEventSeverity.MEDIUM,
    [SecurityEventType.MFA_ENABLED]: SecurityEventSeverity.LOW,
    [SecurityEventType.MFA_DISABLED]: SecurityEventSeverity.MEDIUM,

    // Authorization - MEDIUM to HIGH
    [SecurityEventType.PERMISSION_GRANTED]: SecurityEventSeverity.LOW,
    [SecurityEventType.PERMISSION_DENIED]: SecurityEventSeverity.MEDIUM,
    [SecurityEventType.ROLE_CHECK_SUCCESS]: SecurityEventSeverity.INFO,
    [SecurityEventType.ROLE_CHECK_FAILURE]: SecurityEventSeverity.MEDIUM,
    [SecurityEventType.UNAUTHORIZED_ACCESS_ATTEMPT]: SecurityEventSeverity.HIGH,

    // RBAC - LOW to MEDIUM
    [SecurityEventType.ROLE_ASSIGNED]: SecurityEventSeverity.LOW,
    [SecurityEventType.ROLE_REMOVED]: SecurityEventSeverity.MEDIUM,
    [SecurityEventType.PERMISSION_ADDED]: SecurityEventSeverity.LOW,
    [SecurityEventType.PERMISSION_REVOKED]: SecurityEventSeverity.MEDIUM,
    [SecurityEventType.USER_ROLES_UPDATED]: SecurityEventSeverity.LOW,

    // Data Access - INFO to MEDIUM
    [SecurityEventType.DATA_VIEWED]: SecurityEventSeverity.INFO,
    [SecurityEventType.DATA_EXPORTED]: SecurityEventSeverity.MEDIUM,
    [SecurityEventType.SENSITIVE_DATA_ACCESSED]: SecurityEventSeverity.MEDIUM,
    [SecurityEventType.BULK_DATA_ACCESS]: SecurityEventSeverity.MEDIUM,

    // Data Modification - LOW to HIGH
    [SecurityEventType.DATA_CREATED]: SecurityEventSeverity.LOW,
    [SecurityEventType.DATA_UPDATED]: SecurityEventSeverity.LOW,
    [SecurityEventType.DATA_DELETED]: SecurityEventSeverity.MEDIUM,
    [SecurityEventType.BULK_DATA_MODIFICATION]: SecurityEventSeverity.HIGH,

    // Admin Actions - LOW to HIGH
    [SecurityEventType.USER_CREATED]: SecurityEventSeverity.LOW,
    [SecurityEventType.USER_UPDATED]: SecurityEventSeverity.LOW,
    [SecurityEventType.USER_DELETED]: SecurityEventSeverity.HIGH,
    [SecurityEventType.USER_SUSPENDED]: SecurityEventSeverity.MEDIUM,
    [SecurityEventType.USER_ACTIVATED]: SecurityEventSeverity.LOW,
    [SecurityEventType.SETTINGS_CHANGED]: SecurityEventSeverity.MEDIUM,
    [SecurityEventType.CONFIGURATION_UPDATED]: SecurityEventSeverity.MEDIUM,

    // Security Violations - HIGH to CRITICAL
    [SecurityEventType.SUSPICIOUS_ACTIVITY]: SecurityEventSeverity.HIGH,
    [SecurityEventType.RATE_LIMIT_EXCEEDED]: SecurityEventSeverity.MEDIUM,
    [SecurityEventType.INVALID_TOKEN]: SecurityEventSeverity.MEDIUM,
    [SecurityEventType.SQL_INJECTION_ATTEMPT]: SecurityEventSeverity.CRITICAL,
    [SecurityEventType.XSS_ATTEMPT]: SecurityEventSeverity.CRITICAL,
    [SecurityEventType.BRUTE_FORCE_ATTEMPT]: SecurityEventSeverity.HIGH,

    // System Events - INFO to HIGH
    [SecurityEventType.SERVICE_STARTED]: SecurityEventSeverity.INFO,
    [SecurityEventType.SERVICE_STOPPED]: SecurityEventSeverity.MEDIUM,
    [SecurityEventType.ERROR_OCCURRED]: SecurityEventSeverity.MEDIUM,
    [SecurityEventType.MAINTENANCE_MODE]: SecurityEventSeverity.LOW,
  };

  return severityMap[eventType] || SecurityEventSeverity.MEDIUM;
}

/**
 * Determine category based on event type
 */
export function getCategoryForEventType(eventType: SecurityEventType): SecurityEventCategory {
  const categoryMap: Record<SecurityEventType, SecurityEventCategory> = {
    // Authentication
    [SecurityEventType.LOGIN_SUCCESS]: SecurityEventCategory.AUTHENTICATION,
    [SecurityEventType.LOGIN_FAILURE]: SecurityEventCategory.AUTHENTICATION,
    [SecurityEventType.LOGOUT]: SecurityEventCategory.AUTHENTICATION,
    [SecurityEventType.SESSION_EXPIRED]: SecurityEventCategory.AUTHENTICATION,
    [SecurityEventType.PASSWORD_RESET]: SecurityEventCategory.AUTHENTICATION,
    [SecurityEventType.MFA_ENABLED]: SecurityEventCategory.AUTHENTICATION,
    [SecurityEventType.MFA_DISABLED]: SecurityEventCategory.AUTHENTICATION,

    // Authorization
    [SecurityEventType.PERMISSION_GRANTED]: SecurityEventCategory.AUTHORIZATION,
    [SecurityEventType.PERMISSION_DENIED]: SecurityEventCategory.AUTHORIZATION,
    [SecurityEventType.ROLE_CHECK_SUCCESS]: SecurityEventCategory.AUTHORIZATION,
    [SecurityEventType.ROLE_CHECK_FAILURE]: SecurityEventCategory.AUTHORIZATION,
    [SecurityEventType.UNAUTHORIZED_ACCESS_ATTEMPT]: SecurityEventCategory.AUTHORIZATION,

    // RBAC
    [SecurityEventType.ROLE_ASSIGNED]: SecurityEventCategory.RBAC_CHANGE,
    [SecurityEventType.ROLE_REMOVED]: SecurityEventCategory.RBAC_CHANGE,
    [SecurityEventType.PERMISSION_ADDED]: SecurityEventCategory.RBAC_CHANGE,
    [SecurityEventType.PERMISSION_REVOKED]: SecurityEventCategory.RBAC_CHANGE,
    [SecurityEventType.USER_ROLES_UPDATED]: SecurityEventCategory.RBAC_CHANGE,

    // Data Access
    [SecurityEventType.DATA_VIEWED]: SecurityEventCategory.DATA_ACCESS,
    [SecurityEventType.DATA_EXPORTED]: SecurityEventCategory.DATA_ACCESS,
    [SecurityEventType.SENSITIVE_DATA_ACCESSED]: SecurityEventCategory.DATA_ACCESS,
    [SecurityEventType.BULK_DATA_ACCESS]: SecurityEventCategory.DATA_ACCESS,

    // Data Modification
    [SecurityEventType.DATA_CREATED]: SecurityEventCategory.DATA_MODIFICATION,
    [SecurityEventType.DATA_UPDATED]: SecurityEventCategory.DATA_MODIFICATION,
    [SecurityEventType.DATA_DELETED]: SecurityEventCategory.DATA_MODIFICATION,
    [SecurityEventType.BULK_DATA_MODIFICATION]: SecurityEventCategory.DATA_MODIFICATION,

    // Admin Actions
    [SecurityEventType.USER_CREATED]: SecurityEventCategory.ADMIN_ACTION,
    [SecurityEventType.USER_UPDATED]: SecurityEventCategory.ADMIN_ACTION,
    [SecurityEventType.USER_DELETED]: SecurityEventCategory.ADMIN_ACTION,
    [SecurityEventType.USER_SUSPENDED]: SecurityEventCategory.ADMIN_ACTION,
    [SecurityEventType.USER_ACTIVATED]: SecurityEventCategory.ADMIN_ACTION,
    [SecurityEventType.SETTINGS_CHANGED]: SecurityEventCategory.ADMIN_ACTION,
    [SecurityEventType.CONFIGURATION_UPDATED]: SecurityEventCategory.ADMIN_ACTION,

    // Security Violations
    [SecurityEventType.SUSPICIOUS_ACTIVITY]: SecurityEventCategory.SECURITY_VIOLATION,
    [SecurityEventType.RATE_LIMIT_EXCEEDED]: SecurityEventCategory.SECURITY_VIOLATION,
    [SecurityEventType.INVALID_TOKEN]: SecurityEventCategory.SECURITY_VIOLATION,
    [SecurityEventType.SQL_INJECTION_ATTEMPT]: SecurityEventCategory.SECURITY_VIOLATION,
    [SecurityEventType.XSS_ATTEMPT]: SecurityEventCategory.SECURITY_VIOLATION,
    [SecurityEventType.BRUTE_FORCE_ATTEMPT]: SecurityEventCategory.SECURITY_VIOLATION,

    // System Events
    [SecurityEventType.SERVICE_STARTED]: SecurityEventCategory.SYSTEM_EVENT,
    [SecurityEventType.SERVICE_STOPPED]: SecurityEventCategory.SYSTEM_EVENT,
    [SecurityEventType.ERROR_OCCURRED]: SecurityEventCategory.SYSTEM_EVENT,
    [SecurityEventType.MAINTENANCE_MODE]: SecurityEventCategory.SYSTEM_EVENT,
  };

  return categoryMap[eventType] || SecurityEventCategory.SYSTEM_EVENT;
}

/**
 * Check if event type should be logged to admin_security_events table
 * (High severity events that admins need to see immediately)
 */
export function shouldLogToAdminSecurityEvents(eventType: SecurityEventType): boolean {
  const severity = getSeverityForEventType(eventType);
  return severity === SecurityEventSeverity.HIGH || severity === SecurityEventSeverity.CRITICAL;
}

/**
 * Sanitize metadata to prevent logging sensitive data
 */
export function sanitizeMetadata(metadata: Record<string, any>): Record<string, any> {
  const sensitiveKeys = [
    'password',
    'token',
    'secret',
    'apiKey',
    'api_key',
    'accessToken',
    'access_token',
    'refreshToken',
    'refresh_token',
    'sessionId',
    'session_id',
    'creditCard',
    'credit_card',
    'ssn',
    'bankAccount',
    'bank_account',
  ];

  const sanitized: Record<string, any> = {};

  for (const [key, value] of Object.entries(metadata)) {
    const keyLower = key.toLowerCase();
    const isSensitive = sensitiveKeys.some(sk => keyLower.includes(sk.toLowerCase()));

    if (isSensitive) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      sanitized[key] = sanitizeMetadata(value as Record<string, any>);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}
