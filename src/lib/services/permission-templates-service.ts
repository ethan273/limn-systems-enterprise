/**
 * Permission Templates Service
 *
 * Implements pre-defined permission sets for quick assignment.
 * Part of RBAC Phase 3 - Enterprise Features
 *
 * Features:
 * - Create and manage permission templates
 * - Apply templates to users and roles
 * - System templates for common use cases
 * - Organization-specific templates
 */

import { PrismaClient } from '@prisma/client';
import { grantOrganizationPermission } from './multi-tenancy-service';

const prisma = new PrismaClient();

// ============================================
// Types and Interfaces
// ============================================

export interface PermissionTemplate {
  id: string;
  templateName: string;
  templateDescription?: string;
  isGlobal: boolean;
  organizationId?: string;
  category?: string;
  isSystemTemplate: boolean;
  isActive: boolean;
  createdBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PermissionTemplateItem {
  id: string;
  templateId: string;
  permissionId: string;
  resourceType?: string;
  scopeMetadata?: Record<string, any>;
  createdAt: Date;
}

export interface PermissionTemplateWithPermissions extends PermissionTemplate {
  permissions: Array<{
    permissionId: string;
    permissionKey: string;
    permissionName: string;
    resourceType?: string;
    scopeMetadata?: Record<string, any>;
  }>;
}

// ============================================
// Template Management
// ============================================

/**
 * Create a new permission template
 */
export async function createPermissionTemplate(data: {
  templateName: string;
  templateDescription?: string;
  category?: string;
  isGlobal?: boolean;
  organizationId?: string;
  createdBy: string;
  permissions: Array<{
    permissionId: string;
    resourceType?: string;
    scopeMetadata?: Record<string, any>;
  }>;
}): Promise<PermissionTemplate> {
  try {
    // Validate: global templates can't have organization ID
    if (data.isGlobal && data.organizationId) {
      throw new Error('Global templates cannot have an organization ID');
    }

    // Validate: non-global templates must have organization ID
    if (!data.isGlobal && !data.organizationId) {
      throw new Error('Organization-specific templates must have an organization ID');
    }

    // Create template
    const template = await prisma.permission_templates.create({
      data: {
        template_name: data.templateName,
        template_description: data.templateDescription,
        category: data.category,
        is_global: data.isGlobal ?? true,
        organization_id: data.organizationId,
        is_system_template: false,
        is_active: true,
        created_by: data.createdBy,
      },
    });

    // Add permissions to template
    if (data.permissions.length > 0) {
      await prisma.permission_template_items.createMany({
        data: data.permissions.map((perm) => ({
          template_id: template.id,
          permission_id: perm.permissionId,
          resource_type: perm.resourceType,
          scope_metadata: perm.scopeMetadata as any,
        })),
      });
    }

    console.log(`[Permission Templates] Created template: ${data.templateName} (${template.id})`);

    return {
      id: template.id,
      templateName: template.template_name,
      templateDescription: template.template_description || undefined,
      isGlobal: template.is_global ?? true,
      organizationId: template.organization_id || undefined,
      category: template.category || undefined,
      isSystemTemplate: template.is_system_template ?? false,
      isActive: template.is_active ?? true,
      createdBy: template.created_by || undefined,
      createdAt: template.created_at,
      updatedAt: template.updated_at,
    };
  } catch (error) {
    console.error('[Permission Templates] Error creating template:', error);
    throw new Error('Failed to create permission template');
  }
}

/**
 * Get all permission templates
 */
export async function getPermissionTemplates(options?: {
  category?: string;
  organizationId?: string;
  isActive?: boolean;
  includeSystemTemplates?: boolean;
}): Promise<PermissionTemplate[]> {
  try {
    const where: any = {};

    if (options?.category) {
      where.category = options.category;
    }

    if (options?.organizationId !== undefined) {
      where.organization_id = options.organizationId;
    }

    if (options?.isActive !== undefined) {
      where.is_active = options.isActive;
    }

    if (options?.includeSystemTemplates === false) {
      where.is_system_template = false;
    }

    const templates = await prisma.permission_templates.findMany({
      where,
      orderBy: [
        { is_system_template: 'desc' },
        { created_at: 'desc' },
      ],
    });

    return templates.map((template) => ({
      id: template.id,
      templateName: template.template_name,
      templateDescription: template.template_description || undefined,
      isGlobal: template.is_global ?? true,
      organizationId: template.organization_id || undefined,
      category: template.category || undefined,
      isSystemTemplate: template.is_system_template ?? false,
      isActive: template.is_active ?? true,
      createdBy: template.created_by || undefined,
      createdAt: template.created_at,
      updatedAt: template.updated_at,
    }));
  } catch (error) {
    console.error('[Permission Templates] Error getting templates:', error);
    return [];
  }
}

/**
 * Get template by ID with permissions
 */
export async function getTemplateWithPermissions(
  templateId: string
): Promise<PermissionTemplateWithPermissions | null> {
  try {
    const template = await prisma.permission_templates.findUnique({
      where: { id: templateId },
      include: {
        permission_template_items: {
          include: {
            permission_definitions: true,
          },
        },
      },
    });

    if (!template) {
      return null;
    }

    return {
      id: template.id,
      templateName: template.template_name,
      templateDescription: template.template_description || undefined,
      isGlobal: template.is_global ?? true,
      organizationId: template.organization_id || undefined,
      category: template.category || undefined,
      isSystemTemplate: template.is_system_template ?? false,
      isActive: template.is_active ?? true,
      createdBy: template.created_by || undefined,
      createdAt: template.created_at,
      updatedAt: template.updated_at,
      permissions: template.permission_template_items.map((item) => ({
        permissionId: item.permission_id,
        permissionKey: item.permission_definitions.permission_key,
        permissionName: item.permission_definitions.permission_name,
        resourceType: item.resource_type || undefined,
        scopeMetadata: (item.scope_metadata as Record<string, any>) || undefined,
      })),
    };
  } catch (error) {
    console.error('[Permission Templates] Error getting template with permissions:', error);
    return null;
  }
}

/**
 * Update template permissions
 */
export async function updateTemplatePermissions(
  templateId: string,
  permissions: Array<{
    permissionId: string;
    resourceType?: string;
    scopeMetadata?: Record<string, any>;
  }>,
  updatedBy: string
): Promise<void> {
  try {
    // Check if template is a system template
    const template = await prisma.permission_templates.findUnique({
      where: { id: templateId },
    });

    if (!template) {
      throw new Error('Template not found');
    }

    if (template.is_system_template) {
      throw new Error('System templates cannot be modified');
    }

    // Delete existing template items
    await prisma.permission_template_items.deleteMany({
      where: { template_id: templateId },
    });

    // Add new permissions
    if (permissions.length > 0) {
      await prisma.permission_template_items.createMany({
        data: permissions.map((perm) => ({
          template_id: templateId,
          permission_id: perm.permissionId,
          resource_type: perm.resourceType,
          scope_metadata: perm.scopeMetadata as any,
        })),
      });
    }

    // Update template timestamp
    await prisma.permission_templates.update({
      where: { id: templateId },
      data: { updated_at: new Date() },
    });

    console.log(`[Permission Templates] Updated permissions for template ${templateId} by ${updatedBy}`);
  } catch (error) {
    console.error('[Permission Templates] Error updating template permissions:', error);
    throw new Error('Failed to update template permissions');
  }
}

/**
 * Delete template (soft delete for custom templates, prevent deletion of system templates)
 */
export async function deleteTemplate(
  templateId: string,
  deletedBy: string
): Promise<void> {
  try {
    const template = await prisma.permission_templates.findUnique({
      where: { id: templateId },
    });

    if (!template) {
      throw new Error('Template not found');
    }

    if (template.is_system_template) {
      throw new Error('System templates cannot be deleted');
    }

    // Soft delete: mark as inactive
    await prisma.permission_templates.update({
      where: { id: templateId },
      data: {
        is_active: false,
        updated_at: new Date(),
      },
    });

    console.log(`[Permission Templates] Deleted template ${templateId} by ${deletedBy}`);
  } catch (error) {
    console.error('[Permission Templates] Error deleting template:', error);
    throw new Error('Failed to delete template');
  }
}

// ============================================
// Template Application
// ============================================

/**
 * Apply template to user (global scope)
 */
export async function applyTemplateToUser(
  templateId: string,
  userId: string,
  appliedBy: string,
  options?: {
    organizationId?: string;
    expiresAt?: Date;
    reason?: string;
  }
): Promise<void> {
  try {
    const template = await getTemplateWithPermissions(templateId);

    if (!template) {
      throw new Error('Template not found');
    }

    if (!template.isActive) {
      throw new Error('Template is inactive');
    }

    // Apply organization-scoped template
    if (!options?.organizationId) {
      throw new Error('Organization ID is required to apply templates');
    }

    for (const perm of template.permissions) {
      await grantOrganizationPermission({
        organizationId: options.organizationId,
        userId,
        permissionId: perm.permissionId,
        resourceType: perm.resourceType,
        scopeMetadata: perm.scopeMetadata,
        grantedBy: appliedBy,
        expiresAt: options.expiresAt,
        reason: options.reason || `Applied from template: ${template.templateName}`,
      });
    }

    console.log(`[Permission Templates] Applied template ${template.templateName} to user ${userId} in organization ${options.organizationId}`);
  } catch (error) {
    console.error('[Permission Templates] Error applying template to user:', error);
    throw new Error('Failed to apply template to user');
  }
}

/**
 * Apply template to multiple users in batch
 */
export async function batchApplyTemplateToUsers(
  templateId: string,
  userIds: string[],
  appliedBy: string,
  options?: {
    organizationId?: string;
    expiresAt?: Date;
    reason?: string;
  }
): Promise<{ successful: number; failed: number }> {
  let successful = 0;
  let failed = 0;

  for (const userId of userIds) {
    try {
      await applyTemplateToUser(templateId, userId, appliedBy, options);
      successful++;
    } catch (error) {
      console.error(`[Permission Templates] Failed to apply template to user ${userId}:`, error);
      failed++;
    }
  }

  console.log(`[Permission Templates] Batch application complete: ${successful} successful, ${failed} failed`);

  return { successful, failed };
}

/**
 * Get all users who have been assigned a specific template
 */
export async function getUsersWithTemplate(
  templateId: string,
  organizationId?: string
): Promise<string[]> {
  try {
    const template = await getTemplateWithPermissions(templateId);

    if (!template || template.permissions.length === 0) {
      return [];
    }

    // Get first permission from template to find users who have it
    const firstPermission = template.permissions[0]!;

    if (organizationId) {
      // Organization-scoped
      const orgPerms = await prisma.organization_permissions.findMany({
        where: {
          organization_id: organizationId,
          permission_id: firstPermission.permissionId,
          is_active: true,
        },
        select: {
          user_id: true,
        },
      });

      return [...new Set(orgPerms.map((p) => p.user_id))];
    } else {
      // Global scope
      const scopedPerms = await prisma.permission_scopes.findMany({
        where: {
          permission_key: firstPermission.permissionKey,
          is_active: true,
        },
        select: {
          user_id: true,
        },
      });

      return [...new Set(scopedPerms.map((p) => p.user_id))];
    }
  } catch (error) {
    console.error('[Permission Templates] Error getting users with template:', error);
    return [];
  }
}

/**
 * Clone a template (create a copy)
 */
export async function cloneTemplate(
  templateId: string,
  newName: string,
  clonedBy: string,
  options?: {
    organizationId?: string;
    description?: string;
  }
): Promise<PermissionTemplate> {
  try {
    const original = await getTemplateWithPermissions(templateId);

    if (!original) {
      throw new Error('Template not found');
    }

    // Create new template
    const cloned = await createPermissionTemplate({
      templateName: newName,
      templateDescription: options?.description || `Cloned from: ${original.templateName}`,
      category: original.category,
      isGlobal: options?.organizationId ? false : original.isGlobal,
      organizationId: options?.organizationId,
      createdBy: clonedBy,
      permissions: original.permissions.map((perm) => ({
        permissionId: perm.permissionId,
        resourceType: perm.resourceType,
        scopeMetadata: perm.scopeMetadata,
      })),
    });

    console.log(`[Permission Templates] Cloned template ${templateId} to ${cloned.id} by ${clonedBy}`);

    return cloned;
  } catch (error) {
    console.error('[Permission Templates] Error cloning template:', error);
    throw new Error('Failed to clone template');
  }
}

/**
 * Get template usage statistics
 */
export async function getTemplateUsageStats(
  templateId: string,
  organizationId?: string
): Promise<{
  totalUsers: number;
  activeUsers: number;
  permissionCount: number;
}> {
  try {
    const template = await getTemplateWithPermissions(templateId);

    if (!template) {
      return { totalUsers: 0, activeUsers: 0, permissionCount: 0 };
    }

    const users = await getUsersWithTemplate(templateId, organizationId);

    return {
      totalUsers: users.length,
      activeUsers: users.length, // All returned users are active
      permissionCount: template.permissions.length,
    };
  } catch (error) {
    console.error('[Permission Templates] Error getting template usage stats:', error);
    return { totalUsers: 0, activeUsers: 0, permissionCount: 0 };
  }
}
