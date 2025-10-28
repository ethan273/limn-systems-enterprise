/**
 * Multi-Tenancy Service
 *
 * Implements organization-scoped permissions and membership management.
 * Part of RBAC Phase 3 - Enterprise Features
 *
 * Features:
 * - Organization membership management
 * - Organization-specific roles and permissions
 * - Cross-organization access control
 * - Organization-scoped permission checking
 */

import { PrismaClient } from '@prisma/client';
import { SystemRole, Permission } from './rbac-service';

const prisma = new PrismaClient();

// ============================================
// Types and Interfaces
// ============================================

export interface OrganizationMember {
  id: string;
  organizationId: string;
  userId: string;
  organizationRoles: string[];
  status: 'active' | 'suspended' | 'inactive';
  isPrimaryOrg: boolean;
  joinedAt: Date;
  invitedBy?: string;
  invitationAcceptedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface OrganizationPermission {
  id: string;
  organizationId: string;
  userId: string;
  permissionId: string;
  resourceType?: string;
  resourceId?: string;
  scopeMetadata?: Record<string, any>;
  grantedBy?: string;
  grantedAt: Date;
  expiresAt?: Date;
  reason?: string;
  isActive: boolean;
}

// ============================================
// Organization Membership Management
// ============================================

/**
 * Add user to organization with roles
 */
export async function addOrganizationMember(data: {
  organizationId: string;
  userId: string;
  roles?: SystemRole[];
  invitedBy: string;
  isPrimary?: boolean;
}): Promise<OrganizationMember> {
  try {
    const member = await prisma.organization_members.create({
      data: {
        organization_id: data.organizationId,
        user_id: data.userId,
        organization_roles: data.roles || [],
        invited_by: data.invitedBy,
        invitation_accepted_at: new Date(),
        is_primary_org: data.isPrimary ?? false,
        status: 'active',
      },
    });

    return {
      id: member.id,
      organizationId: member.organization_id,
      userId: member.user_id,
      organizationRoles: member.organization_roles || [],
      status: member.status as 'active' | 'suspended' | 'inactive',
      isPrimaryOrg: member.is_primary_org || false,
      joinedAt: member.joined_at,
      invitedBy: member.invited_by || undefined,
      invitationAcceptedAt: member.invitation_accepted_at || undefined,
      createdAt: member.created_at,
      updatedAt: member.updated_at,
    };
  } catch (error) {
    console.error('[Multi-Tenancy] Error adding organization member:', error);
    throw new Error('Failed to add organization member');
  }
}

/**
 * Remove user from organization
 */
export async function removeOrganizationMember(
  organizationId: string,
  userId: string,
  removedBy: string
): Promise<void> {
  try {
    // Delete organization membership
    await prisma.organization_members.deleteMany({
      where: {
        organization_id: organizationId,
        user_id: userId,
      },
    });

    // Delete organization-specific permissions
    await prisma.organization_permissions.deleteMany({
      where: {
        organization_id: organizationId,
        user_id: userId,
      },
    });

    console.log(`[Multi-Tenancy] User ${userId} removed from organization ${organizationId} by ${removedBy}`);
  } catch (error) {
    console.error('[Multi-Tenancy] Error removing organization member:', error);
    throw new Error('Failed to remove organization member');
  }
}

/**
 * Update user's roles within organization
 */
export async function updateOrganizationMemberRoles(
  organizationId: string,
  userId: string,
  roles: SystemRole[],
  updatedBy: string
): Promise<void> {
  try {
    await prisma.organization_members.updateMany({
      where: {
        organization_id: organizationId,
        user_id: userId,
      },
      data: {
        organization_roles: roles,
        updated_at: new Date(),
      },
    });

    console.log(`[Multi-Tenancy] Updated roles for user ${userId} in organization ${organizationId} by ${updatedBy}`);
  } catch (error) {
    console.error('[Multi-Tenancy] Error updating organization member roles:', error);
    throw new Error('Failed to update organization member roles');
  }
}

/**
 * Get all members of an organization
 */
export async function getOrganizationMembers(
  organizationId: string
): Promise<OrganizationMember[]> {
  try {
    const members = await prisma.organization_members.findMany({
      where: {
        organization_id: organizationId,
      },
      orderBy: {
        joined_at: 'desc',
      },
    });

    return members.map((member) => ({
      id: member.id,
      organizationId: member.organization_id,
      userId: member.user_id,
      organizationRoles: member.organization_roles || [],
      status: member.status as 'active' | 'suspended' | 'inactive',
      isPrimaryOrg: member.is_primary_org || false,
      joinedAt: member.joined_at,
      invitedBy: member.invited_by || undefined,
      invitationAcceptedAt: member.invitation_accepted_at || undefined,
      createdAt: member.created_at,
      updatedAt: member.updated_at,
    }));
  } catch (error) {
    console.error('[Multi-Tenancy] Error getting organization members:', error);
    throw new Error('Failed to get organization members');
  }
}

/**
 * Get all organizations a user belongs to
 */
export async function getUserOrganizations(userId: string) {
  try {
    const memberships = await prisma.organization_members.findMany({
      where: {
        user_id: userId,
        status: 'active',
      },
      orderBy: [
        { is_primary_org: 'desc' },
        { joined_at: 'desc' },
      ],
    });

    return memberships.map((membership) => ({
      organizationId: membership.organization_id,
      roles: membership.organization_roles || [],
      isPrimary: membership.is_primary_org || false,
      joinedAt: membership.joined_at,
    }));
  } catch (error) {
    console.error('[Multi-Tenancy] Error getting user organizations:', error);
    throw new Error('Failed to get user organizations');
  }
}

/**
 * Check if user is member of organization
 */
export async function isOrganizationMember(
  userId: string,
  organizationId: string
): Promise<boolean> {
  try {
    const member = await prisma.organization_members.findFirst({
      where: {
        user_id: userId,
        organization_id: organizationId,
        status: 'active',
      },
    });

    return member !== null;
  } catch (error) {
    console.error('[Multi-Tenancy] Error checking organization membership:', error);
    return false;
  }
}

// ============================================
// Organization-Scoped Permissions
// ============================================

/**
 * Grant permission to user within organization context
 */
export async function grantOrganizationPermission(data: {
  organizationId: string;
  userId: string;
  permissionId: string;
  resourceType?: string;
  resourceId?: string;
  scopeMetadata?: Record<string, any>;
  grantedBy: string;
  expiresAt?: Date;
  reason?: string;
}): Promise<void> {
  try {
    // Verify user is member of organization
    const isMember = await isOrganizationMember(data.userId, data.organizationId);
    if (!isMember) {
      throw new Error('User is not a member of this organization');
    }

    await prisma.organization_permissions.create({
      data: {
        organization_id: data.organizationId,
        user_id: data.userId,
        permission_id: data.permissionId,
        resource_type: data.resourceType,
        resource_id: data.resourceId,
        scope_metadata: data.scopeMetadata as any,
        granted_by: data.grantedBy,
        expires_at: data.expiresAt,
        reason: data.reason,
        is_active: true,
      },
    });

    console.log(`[Multi-Tenancy] Granted permission ${data.permissionId} to user ${data.userId} in organization ${data.organizationId}`);
  } catch (error) {
    console.error('[Multi-Tenancy] Error granting organization permission:', error);
    throw new Error('Failed to grant organization permission');
  }
}

/**
 * Revoke permission from user within organization
 */
export async function revokeOrganizationPermission(
  organizationId: string,
  userId: string,
  permissionId: string,
  revokedBy: string
): Promise<void> {
  try {
    await prisma.organization_permissions.updateMany({
      where: {
        organization_id: organizationId,
        user_id: userId,
        permission_id: permissionId,
      },
      data: {
        is_active: false,
        updated_at: new Date(),
      },
    });

    console.log(`[Multi-Tenancy] Revoked permission ${permissionId} from user ${userId} in organization ${organizationId} by ${revokedBy}`);
  } catch (error) {
    console.error('[Multi-Tenancy] Error revoking organization permission:', error);
    throw new Error('Failed to revoke organization permission');
  }
}

/**
 * Get user's permissions within a specific organization
 */
export async function getUserOrganizationPermissions(
  userId: string,
  organizationId: string
): Promise<string[]> {
  try {
    const permissions = await prisma.organization_permissions.findMany({
      where: {
        user_id: userId,
        organization_id: organizationId,
        is_active: true,
        OR: [
          { expires_at: null },
          { expires_at: { gt: new Date() } },
        ],
      },
      include: {
        permission_definitions: {
          select: {
            permission_key: true,
          },
        },
      },
    });

    return permissions.map((p) => p.permission_definitions.permission_key);
  } catch (error) {
    console.error('[Multi-Tenancy] Error getting user organization permissions:', error);
    return [];
  }
}

/**
 * Get user's roles within a specific organization
 */
export async function getUserOrganizationRoles(
  userId: string,
  organizationId: string
): Promise<SystemRole[]> {
  try {
    const member = await prisma.organization_members.findFirst({
      where: {
        user_id: userId,
        organization_id: organizationId,
        status: 'active',
      },
    });

    return (member?.organization_roles || []) as SystemRole[];
  } catch (error) {
    console.error('[Multi-Tenancy] Error getting user organization roles:', error);
    return [];
  }
}

/**
 * Check if user has permission within organization context
 */
export async function hasOrganizationPermission(
  userId: string,
  organizationId: string,
  permission: Permission,
  options?: {
    resource?: {
      type: string;
      id?: string;
      metadata?: Record<string, any>;
    };
  }
): Promise<boolean> {
  try {
    // First verify user is member of organization
    const isMember = await isOrganizationMember(userId, organizationId);
    if (!isMember) {
      return false;
    }

    // Build permission query
    const where: any = {
      user_id: userId,
      organization_id: organizationId,
      is_active: true,
      permission_definitions: {
        permission_key: permission,
      },
      OR: [
        { expires_at: null },
        { expires_at: { gt: new Date() } },
      ],
    };

    // Add resource filters if provided
    if (options?.resource) {
      where.resource_type = options.resource.type;

      if (options.resource.id) {
        where.resource_id = options.resource.id;
      }
    }

    const orgPermission = await prisma.organization_permissions.findFirst({
      where,
      include: {
        permission_definitions: true,
      },
    });

    if (!orgPermission) {
      return false;
    }

    // Check metadata constraints if present
    if (orgPermission.scope_metadata && options?.resource?.metadata) {
      const scopeMeta = orgPermission.scope_metadata as Record<string, any>;
      const resourceMeta = options.resource.metadata;

      for (const [key, value] of Object.entries(scopeMeta)) {
        const resourceValue = resourceMeta[key];

        // Array matching: check if resource value is in allowed array
        if (Array.isArray(value)) {
          if (!value.includes(resourceValue)) {
            return false;
          }
        }
        // Exact matching
        else if (value !== resourceValue) {
          return false;
        }
      }
    }

    return true;
  } catch (error) {
    console.error('[Multi-Tenancy] Error checking organization permission:', error);
    return false;
  }
}

/**
 * Set user's primary organization
 */
export async function setPrimaryOrganization(
  userId: string,
  organizationId: string
): Promise<void> {
  try {
    // Remove primary flag from all other organizations
    await prisma.organization_members.updateMany({
      where: {
        user_id: userId,
      },
      data: {
        is_primary_org: false,
      },
    });

    // Set new primary organization
    await prisma.organization_members.updateMany({
      where: {
        user_id: userId,
        organization_id: organizationId,
      },
      data: {
        is_primary_org: true,
      },
    });

    console.log(`[Multi-Tenancy] Set primary organization ${organizationId} for user ${userId}`);
  } catch (error) {
    console.error('[Multi-Tenancy] Error setting primary organization:', error);
    throw new Error('Failed to set primary organization');
  }
}

/**
 * Get user's primary organization
 */
export async function getPrimaryOrganization(userId: string): Promise<string | null> {
  try {
    const primary = await prisma.organization_members.findFirst({
      where: {
        user_id: userId,
        is_primary_org: true,
        status: 'active',
      },
    });

    return primary?.organization_id || null;
  } catch (error) {
    console.error('[Multi-Tenancy] Error getting primary organization:', error);
    return null;
  }
}

/**
 * Suspend user's access to organization
 */
export async function suspendOrganizationMember(
  organizationId: string,
  userId: string,
  suspendedBy: string,
  reason: string
): Promise<void> {
  try {
    await prisma.organization_members.updateMany({
      where: {
        organization_id: organizationId,
        user_id: userId,
      },
      data: {
        status: 'suspended',
        updated_at: new Date(),
      },
    });

    // Also deactivate organization permissions
    await prisma.organization_permissions.updateMany({
      where: {
        organization_id: organizationId,
        user_id: userId,
      },
      data: {
        is_active: false,
        updated_at: new Date(),
      },
    });

    console.log(`[Multi-Tenancy] Suspended user ${userId} from organization ${organizationId} by ${suspendedBy}. Reason: ${reason}`);
  } catch (error) {
    console.error('[Multi-Tenancy] Error suspending organization member:', error);
    throw new Error('Failed to suspend organization member');
  }
}

/**
 * Reactivate suspended user
 */
export async function reactivateOrganizationMember(
  organizationId: string,
  userId: string,
  reactivatedBy: string
): Promise<void> {
  try {
    await prisma.organization_members.updateMany({
      where: {
        organization_id: organizationId,
        user_id: userId,
        status: 'suspended',
      },
      data: {
        status: 'active',
        updated_at: new Date(),
      },
    });

    // Reactivate non-expired organization permissions
    await prisma.organization_permissions.updateMany({
      where: {
        organization_id: organizationId,
        user_id: userId,
        OR: [
          { expires_at: null },
          { expires_at: { gt: new Date() } },
        ],
      },
      data: {
        is_active: true,
        updated_at: new Date(),
      },
    });

    console.log(`[Multi-Tenancy] Reactivated user ${userId} in organization ${organizationId} by ${reactivatedBy}`);
  } catch (error) {
    console.error('[Multi-Tenancy] Error reactivating organization member:', error);
    throw new Error('Failed to reactivate organization member');
  }
}

/**
 * Clean up expired organization permissions
 */
export async function cleanupExpiredOrganizationPermissions(): Promise<number> {
  try {
    const result = await prisma.organization_permissions.updateMany({
      where: {
        is_active: true,
        expires_at: {
          lte: new Date(),
        },
      },
      data: {
        is_active: false,
        updated_at: new Date(),
      },
    });

    console.log(`[Multi-Tenancy] Cleaned up ${result.count} expired organization permissions`);
    return result.count;
  } catch (error) {
    console.error('[Multi-Tenancy] Error cleaning up expired permissions:', error);
    return 0;
  }
}
