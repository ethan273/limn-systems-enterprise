/**
 * Role Determination Service
 *
 * Determines user roles from user_profiles table
 * Used throughout the application where user role context is needed
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export type UserRole = 'limn_team' | 'factory' | 'designer' | 'client' | 'admin' | 'unknown';

/**
 * Get user role from user_profiles table
 */
export async function getUserRole(userId: string): Promise<UserRole> {
  try {
    const userProfile = await prisma.user_profiles.findUnique({
      where: { id: userId },
      select: {
        user_type: true,
        email: true,
      },
    });

    if (!userProfile) {
      console.warn(`User profile not found: ${userId}`);
      return 'unknown';
    }

    // Determine role based on user profile data
    // Priority order: user_type > email domain > default

    // Check user type
    if (userProfile.user_type) {
      return mapUserTypeToRole(userProfile.user_type);
    }

    // Check email domain for role hints
    if (userProfile.email) {
      if (userProfile.email.includes('@limn') || userProfile.email.includes('@limnsystems')) {
        return 'limn_team';
      }
    }

    // Default fallback
    return 'unknown';
  } catch (error) {
    console.error('Error determining user role:', error);
    return 'unknown';
  }
}

/**
 * Map user_type to UserRole
 */
function mapUserTypeToRole(userType: string): UserRole {
  const typeLower = userType.toLowerCase();

  if (typeLower === 'internal' || typeLower === 'employee') return 'limn_team';
  if (typeLower === 'manufacturer' || typeLower === 'factory') return 'factory';
  if (typeLower === 'designer') return 'designer';
  if (typeLower === 'customer' || typeLower === 'client') return 'client';

  return 'unknown';
}

/**
 * Get user role with caching (for same request context)
 * Note: For production, consider Redis or in-memory cache
 */
const roleCache = new Map<string, { role: UserRole; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export async function getUserRoleWithCache(userId: string): Promise<UserRole> {
  const cached = roleCache.get(userId);
  const now = Date.now();

  if (cached && now - cached.timestamp < CACHE_TTL) {
    return cached.role;
  }

  const role = await getUserRole(userId);
  roleCache.set(userId, { role, timestamp: now });

  return role;
}

/**
 * Batch get user roles (for efficiency)
 */
export async function getUserRoles(userIds: string[]): Promise<Record<string, UserRole>> {
  const roles: Record<string, UserRole> = {};

  // Get all user profiles at once
  const userProfiles = await prisma.user_profiles.findMany({
    where: {
      id: { in: userIds },
    },
    select: {
      id: true,
      user_type: true,
      email: true,
    },
  });

  for (const profile of userProfiles) {
    if (profile.user_type) {
      // eslint-disable-next-line security/detect-object-injection
      roles[profile.id] = mapUserTypeToRole(profile.user_type);
    } else if (profile.email) {
      // Check email domain for role hints
      if (profile.email.includes('@limn') || profile.email.includes('@limnsystems')) {
        // eslint-disable-next-line security/detect-object-injection
        roles[profile.id] = 'limn_team';
      } else {
        // eslint-disable-next-line security/detect-object-injection
        roles[profile.id] = 'unknown';
      }
    } else {
      // eslint-disable-next-line security/detect-object-injection
      roles[profile.id] = 'unknown';
    }
  }

  // Fill in unknown for missing users
  for (const userId of userIds) {
    // eslint-disable-next-line security/detect-object-injection
    if (!roles[userId]) {
      // eslint-disable-next-line security/detect-object-injection
      roles[userId] = 'unknown';
    }
  }

  return roles;
}
