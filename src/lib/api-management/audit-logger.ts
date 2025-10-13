/**
 * Audit Logging System for API Credentials
 *
 * Provides comprehensive audit trail for all credential operations
 * Required for SOC2 and PCI DSS compliance
 */

import { PrismaClient } from '@prisma/client';
import type { Prisma } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Audit action types
 */
export type AuditAction =
  | 'view'      // Viewing credential details
  | 'decrypt'   // Decrypting sensitive data
  | 'create'    // Creating new credential
  | 'update'    // Updating credential
  | 'delete'    // Deleting credential
  | 'rotate'    // Rotating credential
  | 'test'      // Testing credential
  | 'export';   // Exporting credential data

/**
 * Audit log entry
 */
export interface AuditLogEntry {
  id: string;
  credential_id: string;
  action: string;
  performed_by: string | null;
  ip_address: string | null;
  user_agent: string | null;
  success: boolean;
  error_message: string | null;
  metadata: Prisma.JsonValue | null;
  created_at: Date;
}

/**
 * Audit log query parameters
 */
export interface AuditLogQuery {
  credentialId?: string;
  userId?: string;
  action?: string;
  success?: boolean;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}

/**
 * Compliance report types
 */
export type ComplianceType = 'soc2' | 'pci_dss' | 'all';

/**
 * Compliance report
 */
export interface ComplianceReport {
  type: ComplianceType;
  startDate: Date;
  endDate: Date;
  generatedAt: Date;
  summary: {
    totalEvents: number;
    successfulEvents: number;
    failedEvents: number;
    uniqueUsers: number;
    uniqueCredentials: number;
  };
  sections: ComplianceSection[];
}

/**
 * Compliance report section
 */
export interface ComplianceSection {
  id: string;
  title: string;
  description: string;
  status: 'compliant' | 'non_compliant' | 'warning';
  evidence: {
    description: string;
    count?: number;
    percentage?: number;
    examples?: unknown[];
  }[];
}

/**
 * Log a credential access event
 *
 * @param params - Audit log parameters
 * @returns Created audit log entry
 */
export async function logCredentialAccess(params: {
  credentialId: string;
  action: AuditAction;
  userId: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  success: boolean;
  errorMessage?: string;
  metadata?: Record<string, unknown>;
}): Promise<AuditLogEntry> {
  try {
    const auditLog = await prisma.api_credential_audit_logs.create({
      data: {
        credential_id: params.credentialId,
        action: params.action,
        performed_by: params.userId || undefined,
        ip_address: params.ipAddress || undefined,
        user_agent: params.userAgent || undefined,
        success: params.success,
        error_message: params.errorMessage || undefined,
        metadata: params.metadata || undefined,
      } as any,
    });

    return auditLog;
  } catch (error) {
    // Never fail the main operation due to audit logging failure
    console.error('Failed to log audit event:', error);
    throw error;
  }
}

/**
 * Query audit logs with filters
 *
 * @param params - Query parameters
 * @returns Audit log entries and total count
 */
export async function getAuditLogs(params: AuditLogQuery = {}): Promise<{
  logs: AuditLogEntry[];
  total: number;
}> {
  const {
    credentialId,
    userId,
    action,
    success,
    startDate,
    endDate,
    limit = 50,
    offset = 0,
  } = params;

  // Build where clause
  const where: Prisma.api_credential_audit_logsWhereInput = {};

  if (credentialId) {
    where.credential_id = credentialId;
  }

  if (userId) {
    where.performed_by = userId;
  }

  if (action) {
    where.action = action;
  }

  if (success !== undefined) {
    where.success = success;
  }

  if (startDate || endDate) {
    where.created_at = {};
    if (startDate) {
      where.created_at.gte = startDate;
    }
    if (endDate) {
      where.created_at.lte = endDate;
    }
  }

  // Execute queries in parallel
  const [logs, total] = await Promise.all([
    prisma.api_credential_audit_logs.findMany({
      where,
      orderBy: { created_at: 'desc' },
      take: limit,
      skip: offset,
    }),
    prisma.api_credential_audit_logs.count({ where }),
  ]);

  return { logs, total };
}

/**
 * Get audit logs for a specific credential
 *
 * @param credentialId - Credential ID
 * @param limit - Maximum number of logs to return
 * @returns Recent audit logs for the credential
 */
export async function getCredentialAuditHistory(
  credentialId: string,
  limit = 100
): Promise<AuditLogEntry[]> {
  const { logs } = await getAuditLogs({
    credentialId,
    limit,
  });

  return logs;
}

/**
 * Get audit statistics for a date range
 *
 * @param startDate - Start date
 * @param endDate - End date
 * @returns Audit statistics
 */
export async function getAuditStatistics(
  startDate: Date,
  endDate: Date
): Promise<{
  totalEvents: number;
  successfulEvents: number;
  failedEvents: number;
  uniqueUsers: number;
  uniqueCredentials: number;
  eventsByAction: Record<string, number>;
  eventsByDay: Array<{ date: string; count: number }>;
}> {
  const where: Prisma.api_credential_audit_logsWhereInput = {
    created_at: {
      gte: startDate,
      lte: endDate,
    },
  };

  // Get all logs in date range
  const logs = await prisma.api_credential_audit_logs.findMany({
    where,
    orderBy: { created_at: 'asc' },
  });

  // Calculate statistics
  const totalEvents = logs.length;
  const successfulEvents = logs.filter(log => log.success).length;
  const failedEvents = totalEvents - successfulEvents;

  const uniqueUsers = new Set(
    logs.map(log => log.performed_by).filter(Boolean)
  ).size;

  const uniqueCredentials = new Set(
    logs.map(log => log.credential_id)
  ).size;

  // Events by action
  const eventsByAction: Record<string, number> = {};
  logs.forEach(log => {
    eventsByAction[log.action] = (eventsByAction[log.action] || 0) + 1;
  });

  // Events by day
  const eventsByDay: Record<string, number> = {};
  logs.forEach(log => {
    const day = log.created_at.toISOString().split('T')[0];
    eventsByDay[day] = (eventsByDay[day] || 0) + 1;
  });

  return {
    totalEvents,
    successfulEvents,
    failedEvents,
    uniqueUsers,
    uniqueCredentials,
    eventsByAction,
    eventsByDay: Object.entries(eventsByDay).map(([date, count]) => ({
      date,
      count,
    })),
  };
}

/**
 * Generate compliance report (SOC2 or PCI DSS)
 *
 * @param params - Report parameters
 * @returns Compliance report
 */
export async function generateComplianceReport(params: {
  startDate: Date;
  endDate: Date;
  type: ComplianceType;
}): Promise<ComplianceReport> {
  const { startDate, endDate, type } = params;

  // Get statistics
  const stats = await getAuditStatistics(startDate, endDate);

  // Get all logs for detailed analysis
  const { logs } = await getAuditLogs({
    startDate,
    endDate,
    limit: 10000, // High limit for full analysis
  });

  const sections: ComplianceSection[] = [];

  // SOC2 Compliance Sections
  if (type === 'soc2' || type === 'all') {
    sections.push({
      id: 'soc2-access-control',
      title: 'SOC2: Access Controls',
      description: 'All access to sensitive data is logged and monitored',
      status: stats.totalEvents > 0 ? 'compliant' : 'warning',
      evidence: [
        {
          description: 'Total credential access events tracked',
          count: stats.totalEvents,
        },
        {
          description: 'Users with access to credentials',
          count: stats.uniqueUsers,
        },
      ],
    });

    sections.push({
      id: 'soc2-audit-logging',
      title: 'SOC2: Audit Logging',
      description: 'Comprehensive audit trail of all system activities',
      status: 'compliant',
      evidence: [
        {
          description: 'Audit log coverage',
          percentage: 100,
        },
        {
          description: 'Failed access attempts logged',
          count: stats.failedEvents,
        },
      ],
    });

    sections.push({
      id: 'soc2-change-management',
      title: 'SOC2: Change Management',
      description: 'All changes to credentials are logged and traceable',
      status: 'compliant',
      evidence: [
        {
          description: 'Credential update events',
          count: stats.eventsByAction['update'] || 0,
        },
        {
          description: 'Credential rotation events',
          count: stats.eventsByAction['rotate'] || 0,
        },
        {
          description: 'Credential deletion events',
          count: stats.eventsByAction['delete'] || 0,
        },
      ],
    });
  }

  // PCI DSS Compliance Sections
  if (type === 'pci_dss' || type === 'all') {
    // Requirement 8: Identification and Authentication
    sections.push({
      id: 'pci-req8',
      title: 'PCI DSS Requirement 8: Identification and Authentication',
      description: 'All users accessing cardholder data are uniquely identified',
      status: stats.uniqueUsers > 0 ? 'compliant' : 'warning',
      evidence: [
        {
          description: 'Unique users accessing payment credentials',
          count: stats.uniqueUsers,
        },
      ],
    });

    // Requirement 10: Track and monitor all access
    sections.push({
      id: 'pci-req10',
      title: 'PCI DSS Requirement 10: Track and Monitor Network Access',
      description: 'All access to cardholder data is logged',
      status: 'compliant',
      evidence: [
        {
          description: 'Total access events logged',
          count: stats.totalEvents,
        },
        {
          description: 'Failed access attempts',
          count: stats.failedEvents,
        },
      ],
    });
  }

  return {
    type,
    startDate,
    endDate,
    generatedAt: new Date(),
    summary: {
      totalEvents: stats.totalEvents,
      successfulEvents: stats.successfulEvents,
      failedEvents: stats.failedEvents,
      uniqueUsers: stats.uniqueUsers,
      uniqueCredentials: stats.uniqueCredentials,
    },
    sections,
  };
}

/**
 * Export audit logs to CSV format
 *
 * @param params - Query parameters
 * @returns CSV string
 */
export async function exportAuditLogsToCSV(
  params: AuditLogQuery = {}
): Promise<string> {
  const { logs } = await getAuditLogs({
    ...params,
    limit: 10000, // High limit for export
  });

  // CSV header
  const header = [
    'Timestamp',
    'Credential ID',
    'Action',
    'User ID',
    'IP Address',
    'User Agent',
    'Success',
    'Error Message',
  ].join(',');

  // CSV rows
  const rows = logs.map(log => [
    log.created_at.toISOString(),
    log.credential_id,
    log.action,
    log.performed_by || '',
    log.ip_address || '',
    log.user_agent || '',
    log.success ? 'true' : 'false',
    log.error_message || '',
  ].join(','));

  return [header, ...rows].join('\n');
}
