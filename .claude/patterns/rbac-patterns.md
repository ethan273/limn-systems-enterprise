# RBAC Patterns & Best Practices

**Last Updated**: October 27, 2025
**Status**: Production Implementation Guide

---

## Overview

This document provides patterns and best practices for using the RBAC system in the Limn Systems Enterprise application. All 5 RBAC phases are complete and production-ready.

**For complete system documentation, see**: `/Users/eko3/limn-systems-enterprise-docs/01-CURRENT/RBAC-MASTER-INDEX.md`

---

## Quick Reference

### System Status
- ✅ Phase 1: Core RBAC (Roles & Permissions)
- ✅ Phase 2.1: Scoped Permissions (Resource-based)
- ✅ Phase 2.2: Session Constraints (Security)
- ✅ Phase 2.3: Advanced Permissions (Delegation & Audit)
- ✅ Phase 3: Enterprise Features (Multi-Tenancy & Templates)

### Available Routers
```typescript
api.rbac.*                      // Core RBAC operations
api.sessions.*                  // Session management
api.permissionsAdvanced.*       // Advanced features
api.enterpriseRbac.*            // Multi-tenancy & templates
```

---

## Pattern 1: Basic Permission Checking

### Client-Side (React Components)

```typescript
import { api } from '@/lib/trpc/client';

function MyComponent() {
  // Check if current user has permission
  const { data: hasAccess, isLoading } = api.rbac.hasPermission.useQuery({
    permission: 'orders:edit',
  });

  if (isLoading) return <LoadingSpinner />;
  if (!hasAccess) return <AccessDenied />;

  return <EditOrderForm />;
}
```

### Server-Side (API Routes)

```typescript
import { getUser } from '@/lib/auth/server';
import { hasPermission } from '@/lib/services/rbac-service';

export async function POST(req: Request) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const canEdit = await hasPermission(user.id, 'orders:edit');
  if (!canEdit) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Process request...
}
```

### tRPC Procedures

```typescript
import { protectedProcedure } from '../trpc/init';
import { hasPermission } from '@/lib/services/rbac-service';
import { TRPCError } from '@trpc/server';

export const myRouter = createTRPCRouter({
  editOrder: protectedProcedure
    .input(z.object({ orderId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const canEdit = await hasPermission(ctx.session.user.id, 'orders:edit');

      if (!canEdit) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have permission to edit orders',
        });
      }

      // Process...
    }),
});
```

---

## Pattern 2: Organization-Scoped Permissions

### Check Organization Permission

```typescript
// Client-side
const { data: hasOrgAccess } = api.enterpriseRbac.hasOrganizationPermission.useQuery({
  organizationId: currentOrganizationId,
  permission: 'projects:edit',
  resource: {
    type: 'project',
    id: projectId,
  },
});

// Server-side
import { hasOrganizationPermission } from '@/lib/services/multi-tenancy-service';

const canEditProject = await hasOrganizationPermission(
  userId,
  organizationId,
  'projects:edit',
  {
    resource: {
      type: 'project',
      id: projectId,
    },
  }
);
```

### Add User to Organization

```typescript
// Admin action to add user to organization
await api.enterpriseRbac.addOrganizationMember.mutate({
  organizationId,
  userId: newUserId,
  roles: ['production_manager'],
  isPrimary: false, // Not their default org
});
```

### Grant Organization Permission

```typescript
// Admin action to grant specific permission
await api.enterpriseRbac.grantOrganizationPermission.mutate({
  organizationId,
  userId,
  permissionId, // UUID from permission_definitions
  resourceType: 'project',
  resourceId: specificProjectId,
  expiresAt: new Date('2026-12-31'), // Optional expiration
  reason: 'Temporary access for Project Alpha',
});
```

---

## Pattern 3: Permission Templates

### Apply Template to New Employee

```typescript
// Get available templates
const { data: templates } = api.enterpriseRbac.getPermissionTemplates.useQuery({
  category: 'onboarding',
  isActive: true,
});

// Find the standard new employee template
const newEmployeeTemplate = templates?.find(
  t => t.templateName === 'New Employee - Standard'
);

if (newEmployeeTemplate) {
  // Apply to user
  await api.enterpriseRbac.applyTemplateToUser.mutate({
    templateId: newEmployeeTemplate.id,
    userId: newEmployeeId,
    organizationId: currentOrganizationId,
    reason: 'New hire onboarding - Q4 2025',
  });
}
```

### Batch Apply Template

```typescript
// Apply template to multiple users at once
const result = await api.enterpriseRbac.batchApplyTemplateToUsers.mutate({
  templateId: financeTemplateId,
  userIds: [user1Id, user2Id, user3Id],
  organizationId,
  reason: 'Finance team restructuring',
});

console.log(`Successfully applied to ${result.successful} users`);
console.log(`Failed for ${result.failed} users`);
```

### Create Custom Template

```typescript
// Create organization-specific template
const customTemplate = await api.enterpriseRbac.createPermissionTemplate.mutate({
  templateName: 'Project Alpha - Core Team',
  templateDescription: 'Full access to Project Alpha resources',
  category: 'project',
  isGlobal: false, // Organization-specific
  organizationId,
  permissions: [
    {
      permissionId: projectsViewId,
      resourceType: 'project',
      scopeMetadata: { projectCode: 'ALPHA' },
    },
    {
      permissionId: projectsEditId,
      resourceType: 'project',
      scopeMetadata: { projectCode: 'ALPHA' },
    },
    {
      permissionId: ordersViewId,
    },
  ],
});
```

---

## Pattern 4: Session Management

### Display Active Sessions

```typescript
function SessionsPage() {
  const { data: sessionsData } = api.sessions.getActiveSessions.useQuery();

  return (
    <div>
      <h2>Active Sessions ({sessionsData?.totalCount})</h2>
      {sessionsData?.sessions.map(session => (
        <SessionCard
          key={session.id}
          session={session}
          onTerminate={() => handleTerminate(session.id)}
        />
      ))}
    </div>
  );
}
```

### Terminate Specific Session

```typescript
const terminateSession = api.sessions.terminateSession.useMutation({
  onSuccess: () => {
    // Refresh sessions list
    utils.sessions.getActiveSessions.invalidate();
  },
});

function handleTerminate(sessionTrackingId: string) {
  terminateSession.mutate({
    sessionTrackingId,
    reason: 'User requested termination',
  });
}
```

### Sign Out All Other Devices

```typescript
const signOutOthers = api.sessions.terminateAllOtherSessions.useMutation();

function SecuritySettings() {
  return (
    <button onClick={() => signOutOthers.mutate({ currentSessionId })}>
      Sign Out All Other Devices
    </button>
  );
}
```

### Display Security Stats

```typescript
function SecurityDashboard() {
  const { data: stats } = api.sessions.getSecurityStats.useQuery();

  return (
    <div>
      <StatCard label="Total Sessions" value={stats?.totalSessions} />
      <StatCard label="Active Sessions" value={stats?.activeSessions} />
      <StatCard label="Suspicious Sessions" value={stats?.suspiciousSessions} />
      <StatCard label="Unique IPs" value={stats?.uniqueIPs} />
      <StatCard label="Unique Locations" value={stats?.uniqueLocations} />
    </div>
  );
}
```

---

## Pattern 5: Role Assignment

### Assign Role to User

```typescript
// Admin action to assign role
await api.rbac.assignRole.mutate({
  userId,
  role: 'manager', // One of: super_admin, admin, manager, user, client, guest
  assignedBy: currentUserId,
  reason: 'Promotion to management position',
});
```

### Get User's Roles

```typescript
const { data: userRoles } = api.rbac.getUserRoles.useQuery({ userId });

// Returns array like: ['manager', 'user']
```

### Check if User Has Role

```typescript
const { data: hasManagerRole } = api.rbac.hasRole.useQuery({
  userId,
  role: 'manager',
});

if (hasManagerRole) {
  // Show manager-specific UI
}
```

---

## Pattern 6: Multi-Organization Management

### Get User's Organizations

```typescript
const { data: organizations } = api.enterpriseRbac.getUserOrganizations.useQuery();

// Returns array of organizations with roles and primary flag
organizations?.forEach(org => {
  console.log(`Org: ${org.organizationId}`);
  console.log(`Roles: ${org.roles.join(', ')}`);
  console.log(`Primary: ${org.isPrimary}`);
});
```

### Set Primary Organization

```typescript
// User selects their default organization
await api.enterpriseRbac.setPrimaryOrganization.mutate({
  organizationId: newPrimaryOrgId,
});
```

### Get Organization Members

```typescript
// Admin view of organization members
const { data: members } = api.enterpriseRbac.getOrganizationMembers.useQuery({
  organizationId,
});

members?.forEach(member => {
  console.log(`User: ${member.userId}`);
  console.log(`Roles: ${member.organizationRoles.join(', ')}`);
  console.log(`Status: ${member.status}`);
});
```

### Suspend Organization Member

```typescript
// Admin action to suspend user from organization
await api.enterpriseRbac.suspendOrganizationMember.mutate({
  organizationId,
  userId: memberToSuspend,
  reason: 'Policy violation - unauthorized data access',
});
```

### Reactivate Suspended Member

```typescript
// Admin action to restore suspended user
await api.enterpriseRbac.reactivateOrganizationMember.mutate({
  organizationId,
  userId: memberToReactivate,
});
```

---

## Pattern 7: Conditional Rendering Based on Permissions

### Hide/Show UI Elements

```typescript
function OrderActions({ orderId }: { orderId: string }) {
  const { data: canEdit } = api.rbac.hasPermission.useQuery({
    permission: 'orders:edit',
  });

  const { data: canDelete } = api.rbac.hasPermission.useQuery({
    permission: 'orders:delete',
  });

  const { data: canApprove } = api.rbac.hasPermission.useQuery({
    permission: 'orders:approve',
  });

  return (
    <div>
      <ViewButton orderId={orderId} />
      {canEdit && <EditButton orderId={orderId} />}
      {canDelete && <DeleteButton orderId={orderId} />}
      {canApprove && <ApproveButton orderId={orderId} />}
    </div>
  );
}
```

### Permission-Based Routing

```typescript
function ProtectedRoute({ permission, children }: PropsWithChildren<{ permission: string }>) {
  const { data: hasAccess, isLoading } = api.rbac.hasPermission.useQuery({
    permission,
  });

  if (isLoading) return <LoadingPage />;
  if (!hasAccess) return <Navigate to="/unauthorized" />;

  return <>{children}</>;
}

// Usage
<Route path="/admin" element={
  <ProtectedRoute permission="admin:access">
    <AdminDashboard />
  </ProtectedRoute>
} />
```

---

## Pattern 8: Audit Logging

All permission changes are automatically logged to `permission_audit_log` table when using the RBAC services. No manual logging required.

### View Audit Trail (when implemented)

```typescript
// Future: Query audit log for permission changes
const { data: auditLog } = api.permissionsAdvanced.getPermissionAuditTrail.useQuery({
  userId,
  startDate: new Date('2025-10-01'),
  endDate: new Date('2025-10-31'),
});
```

---

## Common Pitfalls & Solutions

### ❌ DON'T: Check permissions in client-only

```typescript
// BAD: Client-side only check
function EditOrder() {
  const { data: canEdit } = api.rbac.hasPermission.useQuery({
    permission: 'orders:edit',
  });

  if (!canEdit) return null;

  // User can still call API directly!
  return <form onSubmit={directApiCall} />;
}
```

### ✅ DO: Always check on server-side too

```typescript
// GOOD: Server-side enforcement
export const ordersRouter = createTRPCRouter({
  edit: protectedProcedure
    .input(orderSchema)
    .mutation(async ({ ctx, input }) => {
      const canEdit = await hasPermission(ctx.session.user.id, 'orders:edit');
      if (!canEdit) {
        throw new TRPCError({ code: 'FORBIDDEN' });
      }

      // Safe to proceed
    }),
});

// Client uses this tRPC endpoint
```

---

### ❌ DON'T: Forget to check organization membership

```typescript
// BAD: Granting org permission without membership check
await grantOrganizationPermission({
  organizationId,
  userId, // Might not be a member!
  permissionId,
  grantedBy,
});
```

### ✅ DO: Service automatically validates membership

```typescript
// GOOD: Service checks membership first
await grantOrganizationPermission({
  organizationId,
  userId,
  permissionId,
  grantedBy,
});
// Throws error if user is not a member
```

---

### ❌ DON'T: Apply migrations to only one database

```bash
# BAD: Only applying to dev
psql $DEV_DB_URL < migration.sql
```

### ✅ DO: Always apply to BOTH databases

```bash
# GOOD: Apply to both dev and prod
psql $DEV_DB_URL < migration.sql
psql $PROD_DB_URL < migration.sql

# Then sync Prisma
npx prisma db pull
```

---

## System Templates Reference

Use these for quick onboarding:

| Template Name | Category | Use Case |
|--------------|----------|----------|
| New Employee - Standard | onboarding | View-only access for new hires |
| Production Manager | department | Full production team management |
| Finance Team Member | department | Finance operations and reporting |
| Project Team - Read Only | project | Stakeholders and observers |
| Designer - Full Access | department | Complete design permissions |

```typescript
// Get template by name
const template = templates.find(t => t.templateName === 'New Employee - Standard');
```

---

## Environment Variables

No special RBAC environment variables required. Uses existing database connections:

- **Dev**: `DATABASE_URL` in `.env`
- **Prod**: Connection string in `production-credentials.env`

---

## Performance Considerations

### Permission Caching

Permission checks query the database. For high-frequency checks:

```typescript
// Cache user permissions in React Query
const { data: userPermissions } = api.rbac.getUserPermissions.useQuery(
  { userId },
  {
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
  }
);

// Check against cached permissions
const canEdit = userPermissions?.includes('orders:edit');
```

### Batch Operations

Use batch endpoints when available:

```typescript
// GOOD: Batch apply template
await api.enterpriseRbac.batchApplyTemplateToUsers.mutate({
  templateId,
  userIds: [user1, user2, user3, ...],
  organizationId,
});

// BAD: Individual calls in loop
for (const userId of userIds) {
  await api.enterpriseRbac.applyTemplateToUser.mutate({...});
}
```

---

## Testing Patterns

### Test Permission Checks

```typescript
import { hasPermission } from '@/lib/services/rbac-service';

describe('Order Editing', () => {
  it('allows managers to edit orders', async () => {
    const canEdit = await hasPermission(managerUserId, 'orders:edit');
    expect(canEdit).toBe(true);
  });

  it('denies guests from editing orders', async () => {
    const canEdit = await hasPermission(guestUserId, 'orders:edit');
    expect(canEdit).toBe(false);
  });
});
```

---

## Further Reading

- **Complete System Overview**: `/Users/eko3/limn-systems-enterprise-docs/01-CURRENT/RBAC-MASTER-INDEX.md`
- **Phase 3 Implementation**: `/Users/eko3/limn-systems-enterprise-docs/01-CURRENT/RBAC-Phase-3-IMPLEMENTATION-COMPLETE.md`
- **Session Integration**: `/Users/eko3/limn-systems-enterprise-docs/01-CURRENT/RBAC-Phase-2.2-Integration-Guide.md`
- **Database Schema**: `prisma/schema.prisma` (search for "rbac" or specific table names)

---

**Pattern Status**: ✅ Production Ready
**Last Updated**: October 27, 2025
**Maintained By**: Development Team
