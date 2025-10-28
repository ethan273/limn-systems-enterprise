# Authentication Patterns

**Part of Prime Directive** | [Back to Main](../CLAUDE.md)

---

## Authentication Pattern Standard

**MANDATORY REQUIREMENT - Prime Directive Compliance**

### ✅ THE ONE TRUE PATTERN (ALWAYS USE)

```typescript
// Get current user from tRPC (standardized auth pattern)
const { data: currentUser, isLoading: authLoading } = api.userProfile.getCurrentUser.useQuery();
```

**Why This Works:**
- ✅ Reliable - Always returns user data correctly
- ✅ Type-safe - Full TypeScript inference via tRPC
- ✅ Cached - Automatic query caching and refetching
- ✅ Consistent - Same pattern across entire codebase
- ✅ Maintainable - Single source of truth

### ❌ BROKEN PATTERN (NEVER USE)

```typescript
// ❌ DO NOT USE - Returns undefined, causes bugs
import { useAuthContext } from "@/lib/auth/AuthProvider";
const { user } = useAuthContext();
```

**Why This Fails:**
- ❌ Returns undefined user data
- ❌ Causes recurring validation errors
- ❌ Inconsistent behavior
- ❌ No type safety

### Enforcement Rules

1. **ALWAYS** use `api.userProfile.getCurrentUser.useQuery()` for authentication
2. **NEVER** import or use `useAuthContext` in new code
3. **ALWAYS** add `enabled: !!userId` guards when using userId in dependent queries
4. **ALWAYS** extract userId into a const if used multiple times
5. **ALWAYS** check for `isLoading` state when appropriate

### Common Patterns

```typescript
// Pattern 1: Basic User Info
const { data: currentUser } = api.userProfile.getCurrentUser.useQuery();

// Pattern 2: With Loading State
const { data: currentUser, isLoading: authLoading } = api.userProfile.getCurrentUser.useQuery();

// Pattern 3: User ID Extraction
const { data: currentUser } = api.userProfile.getCurrentUser.useQuery();
const userId = currentUser?.id || "";

// Pattern 4: Query Guard (CRITICAL for dependent queries)
const { data: currentUser } = api.userProfile.getCurrentUser.useQuery();
const userId = currentUser?.id || "";

const { data: myData } = api.something.query({
  user_id: userId,
}, {
  enabled: !!userId  // Only run when userId exists
});
```

---

## API Route Authentication Pattern (MANDATORY)

### ✅ THE ONE TRUE PATTERN (ALWAYS USE)

```typescript
import { getUser } from '@/lib/auth/server';

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const user = await getUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized - Please log in' },
        { status: 401 }
      );
    }

    // ... protected logic here
  }
}
```

### ❌ BROKEN PATTERNS (NEVER USE)

```typescript
// ❌ DO NOT USE - Function doesn't exist in this codebase
import { getServerSession } from '@/lib/auth/server'; // WRONG
import { getServerSession } from 'next-auth'; // ALSO WRONG

// ❌ DO NOT USE - Unreliable, returns undefined
import { useAuthContext } from '@/lib/auth/AuthProvider';
const { user } = useAuthContext();
```

### Admin Authorization Pattern

**⚠️ CRITICAL**: Use RBAC system for ALL permission checks (implemented October 26, 2025)

```typescript
import { getUser } from '@/lib/auth/server';
import { hasRole, hasPermission, SYSTEM_ROLES, PERMISSIONS } from '@/lib/services/rbac-service';

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const user = await getUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized - Please log in' },
        { status: 401 }
      );
    }

    // ✅ CORRECT: Check role using RBAC system
    if (!await hasRole(user.id, SYSTEM_ROLES.ADMIN)) {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    // ✅ BETTER: Check specific permission instead of role
    if (!await hasPermission(user.id, PERMISSIONS.ADMIN_MANAGE_USERS)) {
      return NextResponse.json(
        { error: 'Forbidden - Insufficient permissions' },
        { status: 403 }
      );
    }

    // ... admin-only logic here
  }
}
```

**Legacy Pattern (DO NOT USE in new code)**:
```typescript
// ❌ DEPRECATED: Checking user_type directly
const userProfile = await prisma.user_profiles.findUnique({
  where: { id: user.id },
  select: { user_type: true },
});

if (userProfile.user_type !== 'admin') {
  // This bypasses the RBAC system!
}
```

### tRPC Procedure Authentication

**ALWAYS use protectedProcedure for authenticated endpoints**:

```typescript
import { createTRPCRouter, protectedProcedure } from '../trpc/init';

export const myRouter = createTRPCRouter({
  // ✅ CORRECT: Requires authentication
  getData: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      // ctx.user is guaranteed to exist
      return await ctx.prisma.data.findMany({
        where: { user_id: ctx.user.id }
      });
    }),

  // ❌ WRONG: Exposes data without authentication
  getData: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      // Anyone can call this!
      return await ctx.prisma.data.findMany();
    }),
});
```

### File Upload Security Pattern

**ALL file upload endpoints MUST have authentication**:

```typescript
import { getUser } from '@/lib/auth/server';

export async function POST(request: NextRequest) {
  try {
    // Check authentication BEFORE accepting files
    const user = await getUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized - Please log in to upload files' },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    // ... file upload logic
  }
}
```

### Enforcement Rules

1. **ALWAYS** use `getUser()` from `@/lib/auth/server` for API routes
2. **NEVER** import `getServerSession` (it doesn't exist in this codebase)
3. **ALWAYS** add authentication check BEFORE any data access or file operations
4. **ALWAYS** use `protectedProcedure` for tRPC endpoints (not `publicProcedure`)
5. **ALWAYS** validate admin role using `user_type` field (not `role` field)

---

## RBAC System (Role-Based Access Control)

**MANDATORY REQUIREMENT** | **Implemented**: October 26, 2025

### The Problem This Solves

**Critical Issue Discovered**: The application had TWO permission systems coexisting:
1. `user_type` field - Basic categorization (employee, customer, etc.)
2. `user_roles` table - Proper RBAC system (admin, manager, developer, etc.)

**The Issue**: `user_roles` table existed but was completely non-functional - roles were assigned but never checked. All permission logic used `user_type` instead.

**Impact**: Limited flexibility, no role hierarchy, no granular permissions.

### The Solution: Industry-Standard RBAC

**Implemented**: Complete Role-Based Access Control system following industry standards (AWS, Google Cloud, GitHub).

---

### Architecture

**Two Systems, Properly Used**:

1. **user_type** (Basic Categorization)
   - Purpose: User categorization and routing ONLY
   - Example: "Route customers to /portal, employees to /dashboard"
   - Set: Automatically during signup
   - **DO NOT use for permissions!**

2. **user_roles** (Permission System)
   - Purpose: ALL permission management
   - Example: "Can this user approve production orders?"
   - Set: Manually via Admin → Role Management
   - **USE THIS for all permission checks!**

---

### Available Roles

**Role Hierarchy** (higher roles inherit permissions from lower):

```
super_admin
├── admin
│   ├── manager
│   │   ├── team_lead
│   │   │   ├── user
│   │   │   │   └── viewer
├── developer
│   └── user
├── designer
│   └── user
├── analyst
    └── user
```

**System Roles**:
- `super_admin` - Full system access, inherits ALL permissions
- `admin` - Administrative access, can manage users and settings
- `manager` - Management access, can approve orders and view analytics
- `team_lead` - Team leadership, can edit content and manage tasks
- `developer` - Development access
- `designer` - Design access
- `analyst` - Analytics and reporting access
- `user` - Standard user access
- `viewer` - Read-only access

---

### Granular Permissions

**Admin Portal**:
- `admin.access` - Can access admin portal
- `admin.manage_users` - Can create/edit/delete users
- `admin.manage_roles` - Can assign/remove roles
- `admin.view_audit` - Can view audit logs
- `admin.manage_settings` - Can change system settings

**Production**:
- `production.view` - Can view production orders
- `production.create` - Can create production orders
- `production.edit` - Can edit production orders
- `production.delete` - Can delete production orders
- `production.approve` - Can approve production orders

**Orders**:
- `orders.view` - Can view orders
- `orders.create` - Can create orders
- `orders.edit` - Can edit orders
- `orders.delete` - Can delete orders
- `orders.approve` - Can approve orders

**Finance**:
- `finance.view` - Can view financial data
- `finance.edit` - Can edit financial data
- `finance.approve` - Can approve financial transactions

**And more** (20+ total permissions)

---

### Usage in React Components

#### 1. Using Hooks

```typescript
import { useUserRoles, useUserPermissions, useIsAdmin } from '@/hooks/useRBAC';
import { SYSTEM_ROLES, PERMISSIONS } from '@/lib/services/rbac-service';

function MyComponent() {
  // Get all user roles
  const { roles, hasRole } = useUserRoles();

  // Get all user permissions
  const { permissions, hasPermission } = useUserPermissions();

  // Check specific role
  if (hasRole(SYSTEM_ROLES.ADMIN)) {
    // Show admin features
  }

  // Check specific permission
  if (hasPermission(PERMISSIONS.PRODUCTION_APPROVE)) {
    // Show approval button
  }

  // Convenience hook for admin check
  const isAdmin = useIsAdmin();
}
```

#### 2. Using Permission Gates

```typescript
import {
  RequireRole,
  RequirePermission,
  RequireAdmin,
  RequireAnyRole,
} from '@/components/rbac/PermissionGate';
import { SYSTEM_ROLES, PERMISSIONS } from '@/lib/services/rbac-service';

function MyComponent() {
  return (
    <>
      {/* Show only to admins */}
      <RequireRole role={SYSTEM_ROLES.ADMIN}>
        <AdminPanel />
      </RequireRole>

      {/* Show only to users with specific permission */}
      <RequirePermission permission={PERMISSIONS.PRODUCTION_APPROVE}>
        <ApproveButton />
      </RequirePermission>

      {/* Show to admins OR managers */}
      <RequireAnyRole roles={[SYSTEM_ROLES.ADMIN, SYSTEM_ROLES.MANAGER]}>
        <ManagementFeatures />
      </RequireAnyRole>

      {/* With fallback content */}
      <RequirePermission
        permission={PERMISSIONS.FINANCE_VIEW}
        fallback={<p>You don't have access to financial data</p>}
      >
        <FinancialDashboard />
      </RequirePermission>
    </>
  );
}
```

#### 3. Server-Side Permission Checks

```typescript
import { hasRole, hasPermission, SYSTEM_ROLES, PERMISSIONS } from '@/lib/services/rbac-service';

// In API routes or server components
export async function GET(request: Request) {
  const user = await getUser();

  // Check role
  if (!await hasRole(user.id, SYSTEM_ROLES.ADMIN)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Check permission
  if (!await hasPermission(user.id, PERMISSIONS.ADMIN_MANAGE_USERS)) {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
  }

  // ... perform action
}
```

---

### Best Practices

#### 1. Always Use Permission Checks, Not Roles

**❌ BAD**:
```typescript
if (hasRole(SYSTEM_ROLES.ADMIN)) {
  // Show financial data
}
```

**✅ GOOD**:
```typescript
if (hasPermission(PERMISSIONS.FINANCE_VIEW)) {
  // Show financial data
}
```

**Why?** Permissions are more granular. A user might have `finance.view` permission without being an admin.

#### 2. Use Permission Gates for UI

**❌ BAD**:
```typescript
{hasPermission(PERMISSIONS.ADMIN_ACCESS) && <AdminPanel />}
```

**✅ GOOD**:
```typescript
<RequirePermission permission={PERMISSIONS.ADMIN_ACCESS}>
  <AdminPanel />
</RequirePermission>
```

**Why?** Permission gates are clearer and handle loading states automatically.

#### 3. Always Check Server-Side for Security

**❌ BAD**:
```typescript
// Client-side only
<RequireAdmin>
  <DeleteUserButton />
</RequireAdmin>
```

**✅ GOOD**:
```typescript
// Client-side UI
<RequirePermission permission={PERMISSIONS.USERS_DELETE}>
  <DeleteUserButton />
</RequirePermission>

// ALSO server-side API check
export async function DELETE(request: Request) {
  if (!await hasPermission(user.id, PERMISSIONS.USERS_DELETE)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  // ... delete user
}
```

**Why?** Never trust the client for security decisions.

---

### Migration from user_type

**Migration Script**: `/scripts/migrate-user-type-to-roles.ts`

```bash
# Preview migration (doesn't make changes)
npx tsx scripts/migrate-user-type-to-roles.ts --dry-run

# Execute migration
npx tsx scripts/migrate-user-type-to-roles.ts
```

**What It Does**:
- Converts all existing `user_type` values to appropriate role assignments
- Preserves existing manual role assignments
- Shows detailed migration plan before executing

**user_type to roles mapping**:
- `super_admin` → `super_admin` role
- `employee` → `user` role
- `customer` → `viewer` role
- `designer` → `designer` role
- `contractor` → `user` role
- `manufacturer` → `user` role
- `factory` → `user` role
- `finance` → `analyst` role
- `qc_tester` → `user` role

---

### Testing

**Comprehensive Test Suite**: `/src/__tests__/server/rbac/rbac-system.test.ts`

**Tests Cover**:
- ✅ Role assignment and removal
- ✅ Role hierarchy and inheritance
- ✅ Permission mappings
- ✅ Permission checking
- ✅ Caching behavior
- ✅ Edge cases
- ✅ Real-world scenarios

**Run Tests**:
```bash
npm run test -- src/__tests__/server/rbac/rbac-system.test.ts
```

---

### Documentation

**Complete Guide**: `/limn-systems-enterprise-docs/07-DEVELOPMENT-GUIDES/RBAC-SYSTEM.md`

**Includes**:
- Architecture explanation
- Available roles and hierarchy
- Permission system details
- Usage examples
- Migration guide
- Best practices
- Troubleshooting
- API reference

---

### Key Files

**Core Implementation**:
- `/src/lib/services/rbac-service.ts` - Core RBAC service (518 lines)
- `/src/hooks/useRBAC.ts` - React hooks (134 lines)
- `/src/components/rbac/PermissionGate.tsx` - Permission gates (257 lines)

**API Endpoints**:
- `/src/app/api/rbac/roles/route.ts` - Get user roles
- `/src/app/api/rbac/permissions/route.ts` - Get user permissions

**Migration**:
- `/scripts/migrate-user-type-to-roles.ts` - Migration script (267 lines)

**Tests**:
- `/src/__tests__/server/rbac/rbac-system.test.ts` - Comprehensive test suite (30 tests)

**Legacy Compatibility**:
- `/src/lib/services/role-service.ts` - Updated to delegate to RBAC system

---

### Enforcement Rules

1. **ALWAYS** use RBAC system for permission checks (not user_type)
2. **ALWAYS** use permission gates in React components
3. **ALWAYS** check permissions server-side for security
4. **NEVER** check user_type directly for permissions in new code
5. **ALWAYS** prefer permission checks over role checks

---

### Status

**Status**: ✅ FULLY IMPLEMENTED (October 26-27, 2025)
**Migration**: ✅ COMPLETED (64 users migrated)
**Tests**: ✅ PASSING (30/30 tests)
**Documentation**: ✅ COMPLETE

---

## RBAC System - All 5 Phases Complete

**MAJOR UPDATE**: October 27, 2025 - Enterprise RBAC fully implemented

### Complete System Status

| Phase | Status | Features |
|-------|--------|----------|
| Phase 1: Core RBAC | ✅ Complete | Roles, permissions, hierarchy |
| Phase 2.1: Scoped Permissions | ✅ Complete | Resource-based permissions |
| Phase 2.2: Session Constraints | ✅ Complete | Session security, IP validation |
| Phase 2.3: Advanced Permissions | ✅ Complete | Delegation, time-based, audit |
| Phase 3: Enterprise Features | ✅ Complete | Multi-tenancy, templates |

### New Capabilities (October 27, 2025)

#### 1. Multi-Organization Support

Users can now belong to multiple organizations with different roles and permissions in each:

```typescript
// Check organization-specific permission
const { data: hasAccess } = api.enterpriseRbac.hasOrganizationPermission.useQuery({
  organizationId,
  permission: 'projects:edit',
  resource: { type: 'project', id: projectId },
});

// Add user to organization
await api.enterpriseRbac.addOrganizationMember.mutate({
  organizationId,
  userId,
  roles: ['production_manager'],
});
```

#### 2. Permission Templates

5 pre-defined templates for quick onboarding:
- **New Employee - Standard** - Basic view permissions
- **Production Manager** - Full production access
- **Finance Team Member** - Finance operations
- **Project Team - Read Only** - Stakeholder access
- **Designer - Full Access** - Complete design permissions

```typescript
// Apply template to new user
const templates = await api.enterpriseRbac.getPermissionTemplates.query({
  category: 'onboarding',
});

await api.enterpriseRbac.applyTemplateToUser.mutate({
  templateId: templates[0].id,
  userId: newEmployeeId,
  organizationId,
  reason: 'New hire onboarding',
});
```

#### 3. Session Management

Users can view and manage their active sessions:

```typescript
// Get active sessions
const { data: sessions } = api.sessions.getActiveSessions.useQuery();

// Terminate specific session
await api.sessions.terminateSession.mutate({
  sessionTrackingId: sessionId,
  reason: 'Suspicious activity',
});

// Sign out all other devices
await api.sessions.terminateAllOtherSessions.mutate();
```

### Available tRPC Routers

```typescript
// Core RBAC (Phase 1)
api.rbac.*
  - hasPermission
  - hasRole
  - getUserPermissions
  - getUserRoles
  - assignRole
  - removeRole

// Sessions (Phase 2.2)
api.sessions.*
  - getActiveSessions
  - terminateSession
  - terminateAllOtherSessions
  - getSecurityStats

// Advanced Permissions (Phase 2.3)
api.permissionsAdvanced.*
  - delegatePermission
  - revokeDelegation
  - getPermissionAuditTrail
  - grantConstrainedPermission

// Enterprise RBAC (Phase 3)
api.enterpriseRbac.*
  // Multi-Tenancy
  - addOrganizationMember
  - removeOrganizationMember
  - getUserOrganizations
  - grantOrganizationPermission
  - hasOrganizationPermission

  // Templates
  - getPermissionTemplates
  - applyTemplateToUser
  - batchApplyTemplateToUsers
  - createPermissionTemplate
```

### Database Tables (17 RBAC Tables)

**Phase 1 - Core (4 tables)**:
- `role_definitions`, `permission_definitions`, `role_permissions`, `user_roles`

**Phase 2.1 - Scoped (1 table)**:
- `permission_scopes`

**Phase 2.2 - Sessions (1 table)**:
- `session_tracking`

**Phase 2.3 - Advanced (3 tables)**:
- `permission_constraints`, `permission_delegation`, `permission_audit_log`

**Phase 3 - Enterprise (4 tables)**:
- `organization_members`, `organization_permissions`, `permission_templates`, `permission_template_items`

### Key Documentation

**Quick Start**: `.claude/patterns/rbac-patterns.md` - Comprehensive usage patterns
**Complete Reference**: `/Users/eko3/limn-systems-enterprise-docs/01-CURRENT/RBAC-MASTER-INDEX.md`
**Current State**: `/Users/eko3/limn-systems-enterprise-docs/00-SESSION-START/APPLICATION-STATE-2025-10-27-RBAC-COMPLETE.md`

### Database Sync Status

**CRITICAL**: 100% dev/prod parity maintained
- ✅ Dev Database: All 17 tables + 60+ indexes
- ✅ Prod Database: All 17 tables + 60+ indexes
- ✅ Both databases synchronized

### Best Practices Update

**1. Organization-Scoped Operations**
```typescript
// Always check org permissions for org-scoped resources
const canEdit = await hasOrganizationPermission(
  userId,
  organizationId,
  'projects:edit',
  { resource: { type: 'project', id: projectId } }
);
```

**2. Quick Onboarding with Templates**
```typescript
// Use templates for consistent permission assignment
await api.enterpriseRbac.applyTemplateToUser.mutate({
  templateId: 'new-employee-template',
  userId: newHireId,
  organizationId,
});
```

**3. Session Security**
```typescript
// Users can manage their own sessions
function SecuritySettings() {
  const { data: sessions } = api.sessions.getActiveSessions.useQuery();

  return sessions?.map(session => (
    <SessionCard
      session={session}
      onTerminate={(id) => terminateSession.mutate({ sessionTrackingId: id })}
    />
  ));
}
```

---

**Status**: ✅ MANDATORY as of October 27, 2025
**All 5 Phases**: ✅ COMPLETE
**Compliance**: All new code MUST use these patterns
**Violations**: Will be rejected in code review
**Reference**: [Main CLAUDE.md](../CLAUDE.md) | [RBAC Patterns](rbac-patterns.md)

---

## Portal Middleware Patterns

**MANDATORY REQUIREMENT** | **Critical for Multi-Portal Applications**

### The Problem This Solves

**Issue Discovered**: October 28, 2025 - GitHub Actions test failures revealed portal middleware misuse causing:
- Session tracking UUID errors (JWT tokens used as UUIDs)
- Designer/factory/QC portals blocked from basic user endpoints
- Cross-portal endpoints using customer-only middleware

### Portal Types in Application

The application supports 4 portal types:
1. **Customer Portal** - External customers viewing their orders
2. **Designer Portal** - Design partners managing projects
3. **Factory Portal** - Manufacturing partners managing production
4. **QC Portal** - Quality control testers managing inspections

---

### Portal Middleware Hierarchy

#### 1. `portalProcedure` ❌ DEPRECATED for cross-portal endpoints

**Location**: `src/server/api/routers/portal.ts:137-147`

**Purpose**: Customer-portal-specific endpoints ONLY

**Middleware**: Calls `enforcePortalAccess` which:
- ✅ Requires `customer_id` to be present
- ❌ Blocks designer/factory/QC portals (they don't have customer_id)

**Context Provided**:
```typescript
ctx.customerId: string
ctx.customer: Customer
```

**Use For**:
- Customer-only endpoints (orders, invoices, shipping addresses)
- Endpoints that explicitly require customer data

**Example**:
```typescript
// ✅ CORRECT: Customer-only endpoint
getCustomerOrders: portalProcedure
  .query(async ({ ctx }) => {
    return ctx.db.production_orders.findMany({
      where: { customer_id: ctx.customerId },  // Uses ctx.customerId
    });
  }),
```

#### 2. `universalPortalProcedure` ✅ USE for cross-portal endpoints

**Location**: `src/server/api/routers/portal.ts:153-170`

**Purpose**: Endpoints that work for ALL portal types

**Middleware**: Calls `enforcePortalAccessByType` which:
- ✅ Works for customer, designer, factory, AND QC portals
- ✅ Provides portal type information
- ✅ Provides backward-compatible customer fields (null for non-customer portals)

**Context Provided**:
```typescript
// New universal fields
ctx.portalType: string        // 'customer' | 'designer' | 'factory' | 'qc'
ctx.entityType: string        // 'customer' | 'partner' | 'qc_tester'
ctx.entityId: string          // UUID of the entity
ctx.entity: any               // Full entity object
ctx.portalRole: string        // Portal role

// Backward compatibility (null for non-customer portals)
ctx.customerId: string | null
ctx.customer: Customer | null
```

**Use For**:
- User profile endpoints (getCurrentUser, updateProfile)
- Notification endpoints (getNotifications, markAsRead)
- Settings endpoints (getSettings, updateSettings)
- Any endpoint that should work across all portals

**Example**:
```typescript
// ✅ CORRECT: Cross-portal endpoint
getCurrentUser: universalPortalProcedure
  .query(async ({ ctx }) => {
    return {
      id: ctx.session.user.id,
      email: ctx.session.user.email,
      portalType: ctx.portalType,  // Works for all portals
    };
  }),

// ✅ CORRECT: Conditional logic based on portal type
getNotifications: universalPortalProcedure
  .query(async ({ ctx, input }) => {
    // Only customers have customer_notifications
    if (!ctx.customerId) {
      return { notifications: [], total: 0, unreadCount: 0 };
    }

    // Customer-specific notifications
    return ctx.db.customer_notifications.findMany({
      where: { customer_id: ctx.customerId },
    });
  }),
```

#### 3. Type-Specific Procedures (Optional)

**Available Procedures**:
- `designerPortalProcedure` - Designer portal only
- `factoryPortalProcedure` - Factory portal only
- `qcPortalProcedure` - QC portal only

**Use For**:
- Endpoints specific to one non-customer portal type
- Rare - most endpoints should be either customer-only or universal

---

### When to Use Which Middleware

#### Decision Tree

```
Is this endpoint for customers ONLY?
├─ YES → Use portalProcedure
│        Example: getCustomerOrders, getShippingAddresses
│
└─ NO → Should it work for all portal types?
         ├─ YES → Use universalPortalProcedure
         │        Example: getCurrentUser, getNotifications, getSettings
         │
         └─ NO → Is it for one specific non-customer portal?
                  └─ YES → Use type-specific procedure
                           Example: designerPortalProcedure for designer-only features
```

#### Common Scenarios

| Endpoint Type | Middleware | Reasoning |
|--------------|------------|-----------|
| Get current user | `universalPortalProcedure` | All portals need user info |
| Get notifications | `universalPortalProcedure` | All portals may have notifications |
| Get user settings | `universalPortalProcedure` | All portals can customize settings |
| Get customer orders | `portalProcedure` | Customer-specific data |
| Get shipping addresses | `portalProcedure` | Customer-specific data |
| Get designer projects | `designerPortalProcedure` | Designer-specific data |
| Get QC inspections | `qcPortalProcedure` | QC-specific data |

---

### Critical Bug Pattern (October 28, 2025)

#### ❌ WRONG: Using portalProcedure for cross-portal endpoint

**Issue**: Blocks non-customer portals from accessing universal functionality

```typescript
// ❌ BLOCKS designer/factory/QC users!
getCurrentUser: portalProcedure
  .query(async ({ ctx }) => {
    return {
      id: ctx.session.user.id,
      email: ctx.session.user.email,
    };
  }),
```

**Error**:
```
tRPC failed on portal.getCurrentUser: This portal type is not a customer portal.
Please use the appropriate portal type.
```

**Impact**: Designer, factory, and QC portal users completely blocked from basic functionality

#### ✅ CORRECT: Using universalPortalProcedure

```typescript
// ✅ Works for ALL portal types
getCurrentUser: universalPortalProcedure
  .query(async ({ ctx }) => {
    return {
      id: ctx.session.user.id,
      email: ctx.session.user.email,
      portalType: ctx.portalType,  // Bonus: Can show which portal they're in
    };
  }),
```

---

### Implementation Guide

#### Step 1: Identify Endpoint Audience

Ask: "Who should be able to call this endpoint?"

- **Only customers** → `portalProcedure`
- **All portal types** → `universalPortalProcedure`
- **One specific non-customer type** → Type-specific procedure

#### Step 2: Use Appropriate Context Properties

```typescript
// With portalProcedure (customer-only)
getData: portalProcedure.query(async ({ ctx }) => {
  // ✅ Available
  ctx.customerId  // Always present
  ctx.customer    // Always present

  // ❌ Not available
  ctx.portalType  // undefined
  ctx.entityType  // undefined
});

// With universalPortalProcedure (all portals)
getData: universalPortalProcedure.query(async ({ ctx }) => {
  // ✅ Available
  ctx.portalType   // Always present
  ctx.entityType   // Always present
  ctx.entityId     // Always present

  // ⚠️ Conditional
  ctx.customerId   // Null for non-customer portals
  ctx.customer     // Null for non-customer portals
});
```

#### Step 3: Handle Conditional Logic

```typescript
// Pattern: Universal endpoint with customer-specific features
getNotifications: universalPortalProcedure
  .query(async ({ ctx, input }) => {
    // Check if customer portal
    if (!ctx.customerId) {
      // Non-customer portal: Return empty or different data
      return { notifications: [], total: 0 };
    }

    // Customer portal: Return customer-specific data
    return {
      notifications: await ctx.db.customer_notifications.findMany({
        where: { customer_id: ctx.customerId },
      }),
      total: await ctx.db.customer_notifications.count({
        where: { customer_id: ctx.customerId },
      }),
    };
  }),
```

---

### Session Tracking Pattern

**CRITICAL**: October 28, 2025 fix

#### ❌ WRONG: Using JWT token as UUID

```typescript
// ❌ JWT tokens are NOT UUIDs!
await trackSessionCreation(data.session.access_token, userId, {
  ipAddress,
  userAgent,
});
```

**Error**:
```
[SESSION] Error tracking session creation: Error [PrismaClientKnownRequestError]:
Inconsistent column data: Error creating UUID, invalid character:
expected an optional prefix of `urn:uuid:` followed by [0-9a-fA-F-], found `y` at 2
```

**Why This Fails**:
- JWT access tokens start with "eyJ" (base64 encoded JSON)
- Database expects RFC 4122 UUID format: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`
- Cannot store JWT in UUID column

#### ✅ CORRECT: Generate proper UUID for session tracking

```typescript
// ✅ Generate proper UUID for session tracking
const sessionTrackingId = crypto.randomUUID();
await trackSessionCreation(sessionTrackingId, userId, {
  ipAddress,
  userAgent,
});
await enforceSessionLimits(userId, roles[0] || 'customer', sessionTrackingId);
```

**Files**: `src/app/auth/callback/route.ts:307-318, 459-470`

---

### Testing Requirements

#### Before Committing Portal Changes

**MANDATORY**: Run comprehensive auth/security tests

```bash
# Run full auth test suite
npx playwright test 00-comprehensive-auth-security

# Or run specific portal tests
npx playwright test 15-customer-portal
npx playwright test --grep "portal"
```

#### Test Coverage Required

When modifying portal endpoints, verify:
1. ✅ Customer portal users can access
2. ✅ Designer portal users can access (if universal)
3. ✅ Factory portal users can access (if universal)
4. ✅ QC portal users can access (if universal)
5. ✅ Unauthenticated users are blocked
6. ✅ Session tracking works correctly

---

### Enforcement Rules

1. **ALWAYS** use `universalPortalProcedure` for cross-portal endpoints
2. **ONLY** use `portalProcedure` for customer-specific data endpoints
3. **ALWAYS** check which portal types should access an endpoint before choosing middleware
4. **NEVER** use JWT tokens as UUIDs for session tracking
5. **ALWAYS** generate proper UUIDs with `crypto.randomUUID()` for session IDs
6. **ALWAYS** run auth tests before committing portal middleware changes

---

### Key Files

**Portal Middleware**:
- `src/server/api/routers/portal.ts:18-130` - Middleware definitions
- `src/server/api/routers/portal.ts:137-147` - `portalProcedure`
- `src/server/api/routers/portal.ts:153-170` - `universalPortalProcedure`

**Session Tracking**:
- `src/app/auth/callback/route.ts:307-318` - Session UUID generation (first occurrence)
- `src/app/auth/callback/route.ts:459-470` - Session UUID generation (second occurrence)
- `src/lib/services/session-service.ts` - Session tracking logic

**Tests**:
- `tests/00-comprehensive-auth-security.spec.ts` - Full auth/security test suite
- `tests/15-customer-portal.spec.ts` - Customer portal specific tests

---

### Lessons Learned (October 28, 2025)

**Critical Failures Fixed**:
1. Session UUID Error - JWT tokens used as UUIDs breaking session tracking
2. Portal Middleware Misuse - Customer-only middleware blocking universal endpoints

**Root Causes**:
1. Insufficient understanding of portal middleware requirements
2. Tests not run before committing portal changes
3. Assumptions about token formats vs database column types

**Prevention**:
1. ✅ Added comprehensive portal middleware documentation
2. ✅ Clarified when to use each middleware type
3. ✅ Mandated running auth tests before portal commits
4. ✅ Documented session UUID pattern

**Reference**: 
- Session file: `/Users/eko3/limn-systems-enterprise-docs/00-SESSION-START/2025-10-28-GITHUB-ACTIONS-TEST-FIXES.md`
- Commit: `42ea35e` - "fix(auth): Fix GitHub Actions test failures for authentication and portal access"

---

**Status**: ✅ MANDATORY as of October 28, 2025
**Compliance**: All portal endpoint code MUST follow these patterns
**Violations**: Will cause test failures and block non-customer portals
**Reference**: [Main CLAUDE.md](../CLAUDE.md) | [Session Documentation](/Users/eko3/limn-systems-enterprise-docs/00-SESSION-START/2025-10-28-GITHUB-ACTIONS-TEST-FIXES.md)
