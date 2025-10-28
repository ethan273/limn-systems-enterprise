/**
 * Session Constraints Service (RBAC Phase 2.2)
 *
 * Handles IP validation, concurrent session limits, and session tracking.
 * Addresses security threats: session hijacking, account sharing, credential theft.
 *
 * @module session-service
 */

import { PrismaClient } from '@prisma/client';
import type { SystemRole } from './rbac-service';

const prisma = new PrismaClient();

// ============================================
// TYPES & ENUMS
// ============================================

export enum IPValidationMode {
  // eslint-disable-next-line no-unused-vars
  STRICT = 'strict',       // Must match exactly (Admin/Super Admin)
  // eslint-disable-next-line no-unused-vars
  FLEXIBLE = 'flexible',   // Allow same subnet (/24) (Regular users)
  // eslint-disable-next-line no-unused-vars
  DISABLED = 'disabled'    // No validation (Dev/Testing only)
}

export interface SessionMetadata {
  ipAddress: string;
  userAgent?: string;
  geoLocation?: {
    city?: string;
    country?: string;
    lat?: number;
    long?: number;
  };
  deviceType?: string;
  browser?: string;
  os?: string;
}

export interface SessionValidationResult {
  valid: boolean;
  reason?: string;
}

export interface ActiveSession {
  id: string;
  session_id: string;
  ip_address: string;
  user_agent: string | null;
  last_activity_at: Date;
  login_at: Date;
  is_suspicious: boolean;
  geo_location?: {
    city?: string;
    country?: string;
    lat?: number;
    long?: number;
  };
}

// ============================================
// CONFIGURATION
// ============================================

/**
 * IP validation mode by role
 * Admin/Super Admin: STRICT (exact IP match)
 * Others: FLEXIBLE (same subnet allowed)
 */
const IP_VALIDATION_BY_ROLE: Record<SystemRole, IPValidationMode> = {
  super_admin: IPValidationMode.STRICT,
  admin: IPValidationMode.STRICT,
  manager: IPValidationMode.FLEXIBLE,
  team_lead: IPValidationMode.FLEXIBLE,
  developer: IPValidationMode.FLEXIBLE,
  designer: IPValidationMode.FLEXIBLE,
  analyst: IPValidationMode.FLEXIBLE,
  user: IPValidationMode.FLEXIBLE,
  viewer: IPValidationMode.FLEXIBLE,
};

/**
 * Maximum concurrent sessions by role
 * Admin/Super Admin: 3 (office + laptop + mobile)
 * Manager/Team Lead: 2 (work device + mobile)
 * Others: 1 (single session)
 */
const MAX_CONCURRENT_SESSIONS: Record<SystemRole, number> = {
  super_admin: 3,
  admin: 3,
  manager: 2,
  team_lead: 2,
  developer: 2,
  designer: 2,
  analyst: 2,
  user: 1,
  viewer: 1,
};

/**
 * Session inactivity timeout (seconds) by role
 * Admin/Super Admin: 30 minutes
 * Manager/Team Lead: 1 hour
 * Developer/Designer/Analyst: 2 hours
 * User: 1 hour
 * Viewer: 30 minutes
 */
const SESSION_INACTIVITY_TIMEOUT: Record<SystemRole, number> = {
  super_admin: 30 * 60,   // 30 minutes
  admin: 30 * 60,
  manager: 60 * 60,       // 1 hour
  team_lead: 60 * 60,
  developer: 120 * 60,    // 2 hours
  designer: 120 * 60,
  analyst: 120 * 60,
  user: 60 * 60,          // 1 hour
  viewer: 30 * 60,        // 30 minutes
};

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Check if two IPs are in the same subnet (/24)
 */
function isSameSubnet(ip1: string, ip2: string): boolean {
  const subnet1 = ip1.split('.').slice(0, 3).join('.');
  const subnet2 = ip2.split('.').slice(0, 3).join('.');
  return subnet1 === subnet2;
}

/**
 * Log security event to admin_security_events table
 *
 * NOTE: The admin_security_events table has a CHECK constraint that only allows:
 * 'login', 'logout', 'password_reset', 'mfa_enabled', 'suspicious_activity', 'permission_change'
 *
 * We map session events to these allowed values until the constraint is removed.
 */
async function logSecurityEvent(event: {
  action: string;
  userId: string;
  details: Record<string, any>;
}): Promise<void> {
  // Map session actions to allowed event_type values (constraint-compliant)
  const eventTypeMap: Record<string, string> = {
    'session_created': 'login',
    'session_terminated': 'logout',
    'session_timeout': 'logout',
    'session_ip_mismatch': 'suspicious_activity',
    'session_subnet_change': 'suspicious_activity',
    'session_limit_exceeded': 'suspicious_activity',
    'geo_location_anomaly': 'suspicious_activity',
  };

  const validEventType = eventTypeMap[event.action];

  if (!validEventType) {
    console.warn(`[SESSION] Skipping security event logging for unknown action: ${event.action}`);
    return;
  }

  try {
    await prisma.admin_security_events.create({
      data: {
        user_id: event.userId,
        event_type: validEventType,
        metadata: {
          ...event.details,
          originalAction: event.action,
        },
        severity: 'medium',
        created_at: new Date(),
      },
    });
    console.log(`[SESSION] Security event logged: ${event.action} -> ${validEventType} for user ${event.userId}`);
  } catch (error) {
    console.error('[SESSION] Failed to log security event:', error);
  }
}

/**
 * Get IP validation mode for user's highest role
 */
function getIPValidationMode(userRole: SystemRole): IPValidationMode {
  return IP_VALIDATION_BY_ROLE[userRole] || IPValidationMode.FLEXIBLE;
}

/**
 * Get max concurrent sessions for user's role
 */
function getMaxConcurrentSessions(userRole: SystemRole): number {
  return MAX_CONCURRENT_SESSIONS[userRole] || 1;
}

/**
 * Get session timeout for user's role (in seconds)
 */
function getSessionTimeout(userRole: SystemRole): number {
  return SESSION_INACTIVITY_TIMEOUT[userRole] || 3600; // Default: 1 hour
}

// ============================================
// CORE FUNCTIONS
// ============================================

/**
 * Validate session IP address against stored IP
 *
 * @param sessionId - Session ID from auth.sessions
 * @param currentIP - Current request IP address
 * @param userRole - User's highest role for validation mode
 * @returns Validation result with reason if invalid
 */
export async function validateSessionIP(
  sessionId: string,
  currentIP: string,
  userRole: SystemRole
): Promise<SessionValidationResult> {
  const mode = getIPValidationMode(userRole);

  // Disabled mode: always valid (dev/testing)
  if (mode === IPValidationMode.DISABLED) {
    return { valid: true };
  }

  try {
    // Get session tracking record
    const session = await prisma.session_tracking.findFirst({
      where: { session_id: sessionId },
      select: {
        id: true,
        ip_address: true,
        user_id: true,
      },
    });

    if (!session) {
      // Session tracking not found - might be first request
      // This is not an error, just means tracking not initialized yet
      return { valid: true };
    }

    // STRICT mode: IP must match exactly
    if (mode === IPValidationMode.STRICT) {
      if (session.ip_address !== currentIP) {
        // IP mismatch - invalidate session
        await logSecurityEvent({
          action: 'session_ip_mismatch',
          userId: session.user_id,
          details: {
            sessionId,
            originalIP: session.ip_address,
            currentIP,
            mode: 'strict',
          },
        });
        return { valid: false, reason: 'IP address mismatch' };
      }
    }

    // FLEXIBLE mode: Allow same subnet (/24)
    if (mode === IPValidationMode.FLEXIBLE) {
      if (!isSameSubnet(session.ip_address, currentIP)) {
        // Different subnet - flag as suspicious but allow
        await prisma.session_tracking.update({
          where: { id: session.id },
          data: { is_suspicious: true },
        });

        await logSecurityEvent({
          action: 'session_subnet_change',
          userId: session.user_id,
          details: {
            sessionId,
            originalIP: session.ip_address,
            currentIP,
            mode: 'flexible',
          },
        });
      }
    }

    // Update last activity
    await prisma.session_tracking.update({
      where: { id: session.id },
      data: { last_activity_at: new Date() },
    });

    return { valid: true };
  } catch (error) {
    console.error('[SESSION] Error validating session IP:', error);
    // Fail open: allow request but log error
    return { valid: true };
  }
}

/**
 * Enforce concurrent session limits for user
 *
 * Terminates oldest inactive sessions if limit exceeded.
 *
 * @param userId - User ID
 * @param userRole - User's role for session limit
 * @param newSessionId - New session ID (to preserve)
 */
export async function enforceSessionLimits(
  userId: string,
  userRole: SystemRole,
  newSessionId: string
): Promise<void> {
  const maxSessions = getMaxConcurrentSessions(userRole);

  try {
    // Get all active sessions for user (ordered by last activity)
    const activeSessions = await prisma.session_tracking.findMany({
      where: {
        user_id: userId,
        logout_at: null, // Only active sessions
      },
      orderBy: { last_activity_at: 'desc' },
    });

    // If under limit, nothing to do
    if (activeSessions.length <= maxSessions) {
      return;
    }

    // Terminate oldest sessions exceeding limit
    const sessionsToTerminate = activeSessions.slice(maxSessions);

    for (const session of sessionsToTerminate) {
      // Don't terminate the new session
      if (session.session_id === newSessionId) {
        continue;
      }

      await prisma.session_tracking.update({
        where: { id: session.id },
        data: { logout_at: new Date() },
      });

      await logSecurityEvent({
        action: 'session_limit_exceeded',
        userId,
        details: {
          terminatedSessionId: session.session_id,
          reason: 'Concurrent session limit exceeded',
          maxSessions,
          totalSessions: activeSessions.length,
        },
      });
    }

    console.log(
      `[SESSION] Enforced session limits for user ${userId}: terminated ${sessionsToTerminate.length} sessions (max: ${maxSessions})`
    );
  } catch (error) {
    console.error('[SESSION] Error enforcing session limits:', error);
  }
}

/**
 * Track session creation with metadata
 *
 * Creates session_tracking record for new session.
 *
 * @param sessionId - Session ID from auth.sessions
 * @param userId - User ID
 * @param metadata - Session metadata (IP, user agent, geo, etc.)
 */
export async function trackSessionCreation(
  sessionId: string,
  userId: string,
  metadata: SessionMetadata
): Promise<void> {
  try {
    // Check if tracking already exists (avoid duplicates)
    const existing = await prisma.session_tracking.findFirst({
      where: { session_id: sessionId },
    });

    if (existing) {
      // Update existing tracking
      await prisma.session_tracking.update({
        where: { id: existing.id },
        data: {
          ip_address: metadata.ipAddress,
          user_agent: metadata.userAgent,
          geo_location: metadata.geoLocation,
          last_activity_at: new Date(),
        },
      });
      return;
    }

    // Create new tracking record
    await prisma.session_tracking.create({
      data: {
        session_id: sessionId,
        user_id: userId,
        ip_address: metadata.ipAddress,
        user_agent: metadata.userAgent,
        geo_location: metadata.geoLocation,
        session_metadata: {
          deviceType: metadata.deviceType,
          browser: metadata.browser,
          os: metadata.os,
        },
        login_at: new Date(),
        last_activity_at: new Date(),
      },
    });

    await logSecurityEvent({
      action: 'session_created',
      userId,
      details: {
        sessionId,
        ipAddress: metadata.ipAddress,
        userAgent: metadata.userAgent,
        geoLocation: metadata.geoLocation,
      },
    });

    console.log(`[SESSION] Tracked session creation: ${sessionId} for user ${userId}`);
  } catch (error) {
    console.error('[SESSION] Error tracking session creation:', error);
  }
}

/**
 * Get active sessions for user
 *
 * @param userId - User ID
 * @returns Array of active session data
 */
export async function getUserActiveSessions(userId: string): Promise<ActiveSession[]> {
  try {
    const sessions = await prisma.session_tracking.findMany({
      where: {
        user_id: userId,
        logout_at: null, // Only active sessions
      },
      orderBy: { last_activity_at: 'desc' },
      select: {
        id: true,
        session_id: true,
        ip_address: true,
        user_agent: true,
        last_activity_at: true,
        login_at: true,
        is_suspicious: true,
        geo_location: true,
      },
    });

    return sessions.map(session => ({
      ...session,
      is_suspicious: session.is_suspicious ?? false,
      geo_location: session.geo_location as any,
    }));
  } catch (error) {
    console.error('[SESSION] Error getting active sessions:', error);
    return [];
  }
}

/**
 * Terminate session by ID
 *
 * @param sessionId - Session ID to terminate
 * @param reason - Reason for termination
 */
export async function terminateSession(
  sessionId: string,
  reason: string
): Promise<void> {
  try {
    // Find session tracking record
    const session = await prisma.session_tracking.findFirst({
      where: { session_id: sessionId },
      select: { id: true, user_id: true },
    });

    if (!session) {
      console.warn(`[SESSION] Session tracking not found: ${sessionId}`);
      return;
    }

    // Mark as logged out
    await prisma.session_tracking.update({
      where: { id: session.id },
      data: { logout_at: new Date() },
    });

    await logSecurityEvent({
      action: 'session_terminated',
      userId: session.user_id,
      details: { sessionId, reason },
    });

    console.log(`[SESSION] Terminated session ${sessionId}: ${reason}`);
  } catch (error) {
    console.error('[SESSION] Error terminating session:', error);
  }
}

/**
 * Detect geo-location anomaly
 *
 * Checks if new location is significantly different from recent locations.
 *
 * @param userId - User ID
 * @param newLocation - New login location
 * @returns True if anomaly detected
 */
export async function detectGeoAnomaly(
  userId: string,
  newLocation: { lat: number; long: number }
): Promise<boolean> {
  try {
    // Get recent login locations (last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const recentSessions = await prisma.session_tracking.findMany({
      where: {
        user_id: userId,
        login_at: { gte: thirtyDaysAgo },
      },
      select: {
        geo_location: true,
      },
    });

    // Filter for sessions with geo data
    const sessionsWithGeo = recentSessions.filter(s => {
      const loc = s.geo_location as any;
      return loc?.lat && loc?.long;
    });

    if (sessionsWithGeo.length === 0) {
      // No baseline - first login or no geo data
      return false;
    }

    // Check if new location is within reasonable distance from any recent location
    const MAX_DISTANCE_KM = 500; // 500km threshold

    for (const session of sessionsWithGeo) {
      const loc = session.geo_location as any;

      const distance = calculateDistance(
        { lat: loc.lat, long: loc.long },
        newLocation
      );

      if (distance < MAX_DISTANCE_KM) {
        // Within normal range
        return false;
      }
    }

    // All recent locations are > 500km away - anomaly
    await logSecurityEvent({
      action: 'geo_location_anomaly',
      userId,
      details: {
        newLocation,
        recentLocationsCount: sessionsWithGeo.length,
        threshold: MAX_DISTANCE_KM,
      },
    });

    return true;
  } catch (error) {
    console.error('[SESSION] Error detecting geo anomaly:', error);
    return false;
  }
}

/**
 * Calculate distance between two coordinates (Haversine formula)
 *
 * @param point1 - First coordinate
 * @param point2 - Second coordinate
 * @returns Distance in kilometers
 */
function calculateDistance(
  point1: { lat: number; long: number },
  point2: { lat: number; long: number }
): number {
  const R = 6371; // Earth's radius in km
  const dLat = toRadians(point2.lat - point1.lat);
  const dLon = toRadians(point2.long - point1.long);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(point1.lat)) *
      Math.cos(toRadians(point2.lat)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Cleanup inactive sessions (background job)
 *
 * Should be called periodically (e.g., every 5 minutes) to:
 * - Terminate sessions exceeding inactivity timeout
 * - Clean up old session tracking data (> 90 days)
 *
 * @returns Number of sessions terminated
 */
export async function cleanupInactiveSessions(): Promise<number> {
  try {
    const now = new Date();
    let terminatedCount = 0;

    // Get all active sessions
    const activeSessions = await prisma.session_tracking.findMany({
      where: { logout_at: null },
      select: {
        id: true,
        session_id: true,
        user_id: true,
        last_activity_at: true,
      },
    });

    for (const session of activeSessions) {
      // Get user's role to determine timeout
      const userRoles = await prisma.user_roles.findMany({
        where: { user_id: session.user_id, is_active: true },
        select: { role: true },
      });

      if (userRoles.length === 0) continue;

      // Use timeout for highest role (most permissive)
      const highestRole = userRoles[0].role as SystemRole;
      const timeout = getSessionTimeout(highestRole);

      // Check if session exceeded timeout
      const inactiveTime = (now.getTime() - session.last_activity_at.getTime()) / 1000;

      if (inactiveTime > timeout) {
        await prisma.session_tracking.update({
          where: { id: session.id },
          data: { logout_at: now },
        });

        await logSecurityEvent({
          action: 'session_timeout',
          userId: session.user_id,
          details: {
            sessionId: session.session_id,
            inactiveTime,
            timeout,
          },
        });

        terminatedCount++;
      }
    }

    // Clean up old session data (> 90 days)
    const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    await prisma.session_tracking.deleteMany({
      where: {
        logout_at: { not: null, lt: ninetyDaysAgo },
      },
    });

    if (terminatedCount > 0) {
      console.log(`[SESSION] Cleaned up ${terminatedCount} inactive sessions`);
    }

    return terminatedCount;
  } catch (error) {
    console.error('[SESSION] Error cleaning up inactive sessions:', error);
    return 0;
  }
}

// ============================================
// EXPORTS
// ============================================

export {
  IP_VALIDATION_BY_ROLE,
  MAX_CONCURRENT_SESSIONS,
  SESSION_INACTIVITY_TIMEOUT,
};
