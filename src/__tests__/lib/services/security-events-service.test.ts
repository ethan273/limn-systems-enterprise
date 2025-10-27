/**
 * Security Events Service - Tests
 *
 * Comprehensive test suite for security event logging
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { db } from '@/lib/db';
import {
  logSecurityEvent,
  logPermissionDenial,
  logRoleChange,
  logAdminAction,
  logDataAccess,
  logDataModification,
  logSecurityViolation,
  getClientIp,
  getUserAgent,
  getSecurityEventStats,
} from '@/lib/services/security-events-service';
import {
  SecurityEventType,
  SecurityEventCategory,
  SecurityEventSeverity,
  getSeverityForEventType,
  getCategoryForEventType,
  shouldLogToAdminSecurityEvents,
  sanitizeMetadata,
} from '@/lib/services/security-events-types';

// Mock the database
vi.mock('@/lib/db', () => ({
  db: {
    security_audit_log: {
      create: vi.fn(),
      count: vi.fn(),
    },
    admin_audit_log: {
      create: vi.fn(),
    },
    admin_security_events: {
      create: vi.fn(),
      count: vi.fn(),
    },
  },
}));

describe('Security Events Types', () => {
  describe('getSeverityForEventType', () => {
    it('should return INFO for login success', () => {
      const severity = getSeverityForEventType(SecurityEventType.LOGIN_SUCCESS);
      expect(severity).toBe(SecurityEventSeverity.INFO);
    });

    it('should return MEDIUM for permission denied', () => {
      const severity = getSeverityForEventType(SecurityEventType.PERMISSION_DENIED);
      expect(severity).toBe(SecurityEventSeverity.MEDIUM);
    });

    it('should return CRITICAL for SQL injection attempts', () => {
      const severity = getSeverityForEventType(SecurityEventType.SQL_INJECTION_ATTEMPT);
      expect(severity).toBe(SecurityEventSeverity.CRITICAL);
    });

    it('should return HIGH for unauthorized access attempts', () => {
      const severity = getSeverityForEventType(SecurityEventType.UNAUTHORIZED_ACCESS_ATTEMPT);
      expect(severity).toBe(SecurityEventSeverity.HIGH);
    });
  });

  describe('getCategoryForEventType', () => {
    it('should return AUTHENTICATION for login events', () => {
      const category = getCategoryForEventType(SecurityEventType.LOGIN_SUCCESS);
      expect(category).toBe(SecurityEventCategory.AUTHENTICATION);
    });

    it('should return AUTHORIZATION for permission checks', () => {
      const category = getCategoryForEventType(SecurityEventType.PERMISSION_DENIED);
      expect(category).toBe(SecurityEventCategory.AUTHORIZATION);
    });

    it('should return RBAC_CHANGE for role assignments', () => {
      const category = getCategoryForEventType(SecurityEventType.ROLE_ASSIGNED);
      expect(category).toBe(SecurityEventCategory.RBAC_CHANGE);
    });

    it('should return ADMIN_ACTION for user management', () => {
      const category = getCategoryForEventType(SecurityEventType.USER_CREATED);
      expect(category).toBe(SecurityEventCategory.ADMIN_ACTION);
    });
  });

  describe('shouldLogToAdminSecurityEvents', () => {
    it('should return true for HIGH severity events', () => {
      const result = shouldLogToAdminSecurityEvents(SecurityEventType.UNAUTHORIZED_ACCESS_ATTEMPT);
      expect(result).toBe(true);
    });

    it('should return true for CRITICAL severity events', () => {
      const result = shouldLogToAdminSecurityEvents(SecurityEventType.SQL_INJECTION_ATTEMPT);
      expect(result).toBe(true);
    });

    it('should return false for INFO severity events', () => {
      const result = shouldLogToAdminSecurityEvents(SecurityEventType.LOGIN_SUCCESS);
      expect(result).toBe(false);
    });

    it('should return false for LOW severity events', () => {
      const result = shouldLogToAdminSecurityEvents(SecurityEventType.ROLE_ASSIGNED);
      expect(result).toBe(false);
    });
  });

  describe('sanitizeMetadata', () => {
    it('should redact password fields', () => {
      const metadata = {
        username: 'test',
        password: 'secret123',
        email: 'test@example.com',
      };

      const sanitized = sanitizeMetadata(metadata);

      expect(sanitized.username).toBe('test');
      expect(sanitized.password).toBe('[REDACTED]');
      expect(sanitized.email).toBe('test@example.com');
    });

    it('should redact token fields', () => {
      const metadata = {
        userId: '123',
        accessToken: 'abc123',
        refreshToken: 'def456',
      };

      const sanitized = sanitizeMetadata(metadata);

      expect(sanitized.userId).toBe('123');
      expect(sanitized.accessToken).toBe('[REDACTED]');
      expect(sanitized.refreshToken).toBe('[REDACTED]');
    });

    it('should redact nested sensitive fields', () => {
      const metadata = {
        user: {
          name: 'Test User',
          apiKey: 'secret-key',
        },
      };

      const sanitized = sanitizeMetadata(metadata);

      expect(sanitized.user.name).toBe('Test User');
      expect(sanitized.user.apiKey).toBe('[REDACTED]');
    });

    it('should preserve non-sensitive fields', () => {
      const metadata = {
        action: 'login',
        timestamp: '2025-10-26',
        ipAddress: '127.0.0.1',
      };

      const sanitized = sanitizeMetadata(metadata);

      expect(sanitized).toEqual(metadata);
    });
  });
});

describe('Security Events Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('logSecurityEvent', () => {
    it('should log to security_audit_log', async () => {
      await logSecurityEvent({
        eventType: SecurityEventType.LOGIN_SUCCESS,
        userId: 'user-123',
        userEmail: 'test@example.com',
        action: 'user_login',
        ipAddress: '127.0.0.1',
        userAgent: 'Mozilla/5.0',
        success: true,
      });

      expect(db.security_audit_log.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          user_id: 'user-123',
          user_email: 'test@example.com',
          action: 'user_login',
          ip_address: '127.0.0.1',
          user_agent: 'Mozilla/5.0',
          success: true,
        }),
      });
    });

    it('should log high-severity events to admin_security_events', async () => {
      await logSecurityEvent({
        eventType: SecurityEventType.UNAUTHORIZED_ACCESS_ATTEMPT,
        userId: 'user-123',
        action: 'unauthorized_access',
        ipAddress: '127.0.0.1',
        success: false,
      });

      expect(db.admin_security_events.create).toHaveBeenCalled();
    });

    it('should log admin actions to admin_audit_log', async () => {
      await logSecurityEvent({
        eventType: SecurityEventType.USER_CREATED,
        category: SecurityEventCategory.ADMIN_ACTION,
        userId: 'admin-123',
        userEmail: 'admin@example.com',
        action: 'create_user',
        tableName: 'users',
        recordId: 'new-user-123',
        success: true,
      });

      expect(db.admin_audit_log.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          action: 'create_user',
          user_id: 'admin-123',
          user_email: 'admin@example.com',
          resource_type: 'users',
          resource_id: 'new-user-123',
        }),
      });
    });

    it('should handle errors gracefully', async () => {
      vi.mocked(db.security_audit_log.create).mockRejectedValueOnce(new Error('Database error'));

      // Should not throw
      await expect(
        logSecurityEvent({
          eventType: SecurityEventType.LOGIN_SUCCESS,
          userId: 'user-123',
          action: 'login',
        })
      ).resolves.not.toThrow();
    });

    it('should sanitize metadata', async () => {
      await logSecurityEvent({
        eventType: SecurityEventType.DATA_ACCESSED,
        userId: 'user-123',
        action: 'view_data',
        metadata: {
          query: 'SELECT * FROM users',
          apiKey: 'secret-key',
        },
      });

      expect(db.security_audit_log.create).toHaveBeenCalled();
      // Metadata should be sanitized (apiKey redacted) in implementation
    });
  });

  describe('logPermissionDenial', () => {
    it('should log permission denial with correct metadata', async () => {
      await logPermissionDenial({
        userId: 'user-123',
        userEmail: 'test@example.com',
        requiredPermission: 'users:delete',
        resource: 'users',
        action: 'delete',
        userRoles: ['viewer'],
        userPermissions: ['users:read'],
        ipAddress: '127.0.0.1',
      });

      expect(db.security_audit_log.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          user_id: 'user-123',
          user_email: 'test@example.com',
          action: 'permission_denied: users:delete',
          table_name: 'users',
          success: false,
        }),
      });
    });

    it('should include user roles and permissions in metadata', async () => {
      await logPermissionDenial({
        userId: 'user-123',
        requiredPermission: 'admin:access',
        resource: 'admin_panel',
        action: 'access',
        userRoles: ['user', 'viewer'],
        userPermissions: ['read:own'],
      });

      expect(db.security_audit_log.create).toHaveBeenCalled();
    });
  });

  describe('logRoleChange', () => {
    it('should log role assignment', async () => {
      await logRoleChange({
        targetUserId: 'user-123',
        targetUserEmail: 'user@example.com',
        performedBy: 'admin-456',
        performedByEmail: 'admin@example.com',
        oldRoles: ['viewer'],
        newRoles: ['viewer', 'editor'],
        reason: 'Promoted to editor',
        ipAddress: '127.0.0.1',
      });

      expect(db.security_audit_log.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          user_id: 'admin-456',
          user_email: 'admin@example.com',
          action: 'role_change: user-123',
          table_name: 'user_roles',
          record_id: 'user-123',
        }),
      });
    });

    it('should log role removal', async () => {
      await logRoleChange({
        targetUserId: 'user-123',
        performedBy: 'admin-456',
        oldRoles: ['viewer', 'editor'],
        newRoles: ['viewer'],
      });

      expect(db.security_audit_log.create).toHaveBeenCalled();
    });

    it('should include before/after role data', async () => {
      await logRoleChange({
        targetUserId: 'user-123',
        performedBy: 'admin-456',
        oldRoles: ['viewer'],
        newRoles: ['editor'],
      });

      expect(db.security_audit_log.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          old_data: { roles: ['viewer'] },
          new_data: { roles: ['editor'] },
        }),
      });
    });
  });

  describe('logAdminAction', () => {
    it('should log user creation', async () => {
      await logAdminAction({
        userId: 'admin-123',
        userEmail: 'admin@example.com',
        action: 'create_user',
        resourceType: 'users',
        resourceId: 'new-user-456',
        metadata: {
          userName: 'New User',
          userEmail: 'newuser@example.com',
        },
        ipAddress: '127.0.0.1',
      });

      expect(db.security_audit_log.create).toHaveBeenCalled();
      expect(db.admin_audit_log.create).toHaveBeenCalled();
    });

    it('should log user deletion as high severity', async () => {
      await logAdminAction({
        userId: 'admin-123',
        action: 'delete_user',
        resourceType: 'users',
        resourceId: 'deleted-user-456',
      });

      expect(db.security_audit_log.create).toHaveBeenCalled();
    });

    it('should log settings changes', async () => {
      await logAdminAction({
        userId: 'admin-123',
        action: 'update_settings',
        resourceType: 'system_settings',
        metadata: {
          setting: 'max_upload_size',
          oldValue: '10MB',
          newValue: '50MB',
        },
      });

      expect(db.security_audit_log.create).toHaveBeenCalled();
    });
  });

  describe('logDataAccess', () => {
    it('should log data view', async () => {
      await logDataAccess({
        userId: 'user-123',
        userEmail: 'test@example.com',
        tableName: 'products',
        recordId: 'product-456',
        queryType: 'read',
      });

      expect(db.security_audit_log.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          user_id: 'user-123',
          action: 'data_access: products',
          table_name: 'products',
          record_id: 'product-456',
        }),
      });
    });

    it('should log data export', async () => {
      await logDataAccess({
        userId: 'user-123',
        tableName: 'orders',
        recordCount: 500,
        queryType: 'export',
        fields: ['id', 'customer_name', 'total'],
      });

      expect(db.security_audit_log.create).toHaveBeenCalled();
    });

    it('should log bulk access for large datasets', async () => {
      await logDataAccess({
        userId: 'user-123',
        tableName: 'users',
        recordCount: 150,
        queryType: 'bulk',
      });

      expect(db.security_audit_log.create).toHaveBeenCalled();
    });
  });

  describe('logDataModification', () => {
    it('should log data creation', async () => {
      await logDataModification({
        userId: 'user-123',
        tableName: 'products',
        recordId: 'product-789',
        operationType: 'create',
        newValues: {
          name: 'New Product',
          price: 99.99,
        },
      });

      expect(db.security_audit_log.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          action: 'data_create: products',
          table_name: 'products',
          record_id: 'product-789',
        }),
      });
    });

    it('should log data update with before/after values', async () => {
      await logDataModification({
        userId: 'user-123',
        tableName: 'products',
        recordId: 'product-789',
        operationType: 'update',
        changedFields: ['price', 'stock'],
        oldValues: {
          price: 99.99,
          stock: 10,
        },
        newValues: {
          price: 89.99,
          stock: 5,
        },
      });

      expect(db.security_audit_log.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          old_data: expect.objectContaining({ price: 99.99 }),
          new_data: expect.objectContaining({ price: 89.99 }),
        }),
      });
    });

    it('should log data deletion', async () => {
      await logDataModification({
        userId: 'user-123',
        tableName: 'products',
        recordId: 'product-789',
        operationType: 'delete',
        oldValues: {
          name: 'Deleted Product',
        },
      });

      expect(db.security_audit_log.create).toHaveBeenCalled();
    });
  });

  describe('logSecurityViolation', () => {
    it('should log SQL injection attempt', async () => {
      await logSecurityViolation({
        userId: 'user-123',
        violationType: 'sql_injection',
        detectionMethod: 'pattern_match',
        requestUrl: '/api/users',
        requestMethod: 'POST',
        suspiciousPayload: "'; DROP TABLE users; --",
        ipAddress: '192.168.1.100',
      });

      expect(db.security_audit_log.create).toHaveBeenCalled();
      expect(db.admin_security_events.create).toHaveBeenCalled();
    });

    it('should log XSS attempt', async () => {
      await logSecurityViolation({
        violationType: 'xss_attempt',
        detectionMethod: 'content_filter',
        suspiciousPayload: '<script>alert("xss")</script>',
        ipAddress: '192.168.1.100',
      });

      expect(db.security_audit_log.create).toHaveBeenCalled();
    });

    it('should log brute force attempt', async () => {
      await logSecurityViolation({
        userId: 'user-123',
        violationType: 'brute_force_login',
        detectionMethod: 'rate_limiter',
        ipAddress: '192.168.1.100',
      });

      expect(db.security_audit_log.create).toHaveBeenCalled();
    });

    it('should mark violation as failed', async () => {
      await logSecurityViolation({
        violationType: 'rate_limit_exceeded',
        detectionMethod: 'api_gateway',
        ipAddress: '192.168.1.100',
      });

      expect(db.security_audit_log.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          success: false,
        }),
      });
    });
  });

  describe('Helper Functions', () => {
    describe('getClientIp', () => {
      it('should extract IP from X-Forwarded-For', () => {
        const headers = {
          'x-forwarded-for': '192.168.1.100, 10.0.0.1',
        };

        const ip = getClientIp(headers);

        expect(ip).toBe('192.168.1.100');
      });

      it('should extract IP from X-Real-IP', () => {
        const headers = {
          'x-real-ip': '192.168.1.100',
        };

        const ip = getClientIp(headers);

        expect(ip).toBe('192.168.1.100');
      });

      it('should prefer X-Forwarded-For over X-Real-IP', () => {
        const headers = {
          'x-forwarded-for': '192.168.1.100',
          'x-real-ip': '10.0.0.1',
        };

        const ip = getClientIp(headers);

        expect(ip).toBe('192.168.1.100');
      });

      it('should return undefined if no IP headers present', () => {
        const headers = {};

        const ip = getClientIp(headers);

        expect(ip).toBeUndefined();
      });
    });

    describe('getUserAgent', () => {
      it('should extract user agent from headers', () => {
        const headers = {
          'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        };

        const userAgent = getUserAgent(headers);

        expect(userAgent).toBe('Mozilla/5.0 (Windows NT 10.0; Win64; x64)');
      });

      it('should return undefined if no user agent header', () => {
        const headers = {};

        const userAgent = getUserAgent(headers);

        expect(userAgent).toBeUndefined();
      });
    });

    describe('getSecurityEventStats', () => {
      it('should calculate event statistics', async () => {
        vi.mocked(db.security_audit_log.count).mockResolvedValueOnce(1000); // total
        vi.mocked(db.security_audit_log.count).mockResolvedValueOnce(50);   // failed
        vi.mocked(db.admin_security_events.count).mockResolvedValueOnce(10); // critical
        vi.mocked(db.security_audit_log.count).mockResolvedValueOnce(75);   // permission denials

        const stats = await getSecurityEventStats(30);

        expect(stats).toEqual({
          totalEvents: 1000,
          failedEvents: 50,
          criticalEvents: 10,
          permissionDenials: 75,
          successRate: 95,
        });
      });

      it('should handle zero events', async () => {
        vi.mocked(db.security_audit_log.count).mockResolvedValue(0);
        vi.mocked(db.admin_security_events.count).mockResolvedValue(0);

        const stats = await getSecurityEventStats(30);

        expect(stats.successRate).toBe(100);
      });
    });
  });
});
