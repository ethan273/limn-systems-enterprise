# Build Patterns

**Part of Prime Directive** | [Back to Main](../CLAUDE.md)

---

## Client/Server Code Separation (CRITICAL)

**MANDATORY REQUIREMENT - Prime Directive Compliance**

### ⚠️ THE PROBLEM: PrismaClient in Browser Bundle

**Symptom**:
```
Error: PrismaClient is unable to run in this browser environment,
or has been bundled for the browser (running in ``).
```

**Root Cause**:
- Client-side components import from files that instantiate PrismaClient
- Next.js bundler includes the entire import chain
- Browser attempts to execute server-only code → crash

**Example of Broken Pattern**:
```typescript
// ❌ BROKEN: rbac-service.ts (server-side file)
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export const SYSTEM_ROLES = { ... }; // Constants
export async function getUserRoles() { ... } // Server functions

// ❌ BROKEN: useRBAC.ts (client-side hook)
import { SYSTEM_ROLES } from '@/lib/services/rbac-service';
// This imports the ENTIRE rbac-service.ts including PrismaClient!
```

---

## ✅ THE SOLUTION: Separate Types from Implementation

### Pattern: Split Server Code into Two Files

**1. Create a Types-Only File** (client-safe):

```typescript
// ✅ CORRECT: rbac-types.ts
// NO server-side imports, NO PrismaClient, NO database code

/**
 * RBAC Types and Constants
 * This file contains NO server-side code and can be imported by client components.
 */

export const SYSTEM_ROLES = {
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin',
  // ... all role constants
} as const;

export type SystemRole = typeof SYSTEM_ROLES[keyof typeof SYSTEM_ROLES];

export const PERMISSIONS = {
  ADMIN_ACCESS: 'admin.access',
  // ... all permission constants
} as const;

export type Permission = typeof PERMISSIONS[keyof typeof PERMISSIONS];

// Pure utility functions (no database access)
export function isHigherRole(roleA: SystemRole, roleB: SystemRole): boolean {
  return ROLE_HIERARCHY[roleA] > ROLE_HIERARCHY[roleB];
}
```

**2. Server Implementation File** (server-only):

```typescript
// ✅ CORRECT: rbac-service.ts
import { PrismaClient } from '@prisma/client';
import { db } from '@/lib/db';
// Re-export types and constants for convenience
export * from './rbac-types';

const prisma = new PrismaClient();

// Server-side functions that use database
export async function getUserRoles(userId: string): Promise<SystemRole[]> {
  const roles = await db.user_roles.findMany({
    where: { user_id: userId },
  });
  return roles.map(r => r.role);
}

export async function hasRole(userId: string, role: SystemRole): Promise<boolean> {
  // Database query implementation
}
```

**3. Client Components Import from Types File**:

```typescript
// ✅ CORRECT: useRBAC.ts (client hook)
'use client';

import { SYSTEM_ROLES, PERMISSIONS } from '@/lib/services/rbac-types';
import type { SystemRole, Permission } from '@/lib/services/rbac-types';
// No server code imported!

export function useUserRoles() {
  // Client-side implementation using tRPC or API routes
}
```

---

## When to Split Files

### Split When:
1. ✅ File contains both constants/types AND database operations
2. ✅ Client components need to import constants but not server functions
3. ✅ File imports PrismaClient, database connections, or server-only packages
4. ✅ Getting "PrismaClient is unable to run in browser" errors

### Examples Requiring Split:

```typescript
// NEEDS SPLIT: Service file with both constants and database code
export const STATUSES = { ... }; // Client needs this
export async function getOrders() { ... } // Server-only, uses db

// SOLUTION: Create two files
// - order-types.ts: STATUSES constant + types
// - order-service.ts: getOrders() + re-export from types
```

---

## File Naming Convention

**Pattern**: `{domain}-types.ts` + `{domain}-service.ts`

**Examples**:
- `rbac-types.ts` + `rbac-service.ts`
- `order-types.ts` + `order-service.ts`
- `email-types.ts` + `email-service.ts`
- `security-types.ts` + `security-service.ts`

**Types File Contains**:
- Constants (exported objects with `as const`)
- TypeScript type definitions
- Pure utility functions (no I/O, no database, no external dependencies)
- Enums and literal types

**Service File Contains**:
- PrismaClient or database imports
- Async functions that query database
- Server-side business logic
- API integrations
- Re-exports from types file (for convenience)

---

## Alternative: `server-only` Package

**Use Case**: When you CAN'T split the file (too complex, too much refactoring)

```typescript
// ✅ ACCEPTABLE: Use server-only as guard
import 'server-only'; // Must be FIRST import
import { PrismaClient } from '@prisma/client';

export const ROLES = { ... };
export async function getRoles() { ... }
```

**When to Use**:
- File is too large/complex to split immediately
- Temporary solution while planning proper refactor
- File has no client-side consumers yet

**⚠️ WARNING**: This makes the ENTIRE file server-only. If client code tries to import, build will fail with clear error.

---

## Verification Checklist

Before claiming fix complete:

- [ ] Does build succeed? (`npm run build`)
- [ ] No "PrismaClient in browser" errors in browser console?
- [ ] Client components import from `-types.ts` files?
- [ ] Server functions import from `-service.ts` files?
- [ ] Types file has zero database/Prisma imports?
- [ ] Production deployment succeeds?
- [ ] Application loads in browser without errors?

---

## Real-World Example: RBAC System Fix

**Problem (October 27, 2025)**:
```
Error: PrismaClient is unable to run in this browser environment
Import chain: Sidebar.tsx → useRBAC.ts → rbac-service.ts → PrismaClient
```

**Solution**:
1. Created `rbac-types.ts` (153 lines)
   - Moved SYSTEM_ROLES, PERMISSIONS constants
   - Moved SystemRole, Permission types
   - Added utility functions (isHigherRole, getHighestRole)
   - Zero server dependencies

2. Updated `useRBAC.ts`:
   ```typescript
   // Before
   import { SYSTEM_ROLES, PERMISSIONS } from '@/lib/services/rbac-service';

   // After
   import { SYSTEM_ROLES, PERMISSIONS } from '@/lib/services/rbac-types';
   ```

3. Verified:
   - ✅ Build succeeded
   - ✅ No Prisma browser errors
   - ✅ All 193 pages generated
   - ✅ Production deployment successful

**Commit**: `b586c51` - "fix(build): Fix PrismaClient browser environment error"

---

## Common Mistakes

### ❌ Mistake 1: Using `'use server'` Directive
```typescript
'use server'; // ❌ This is for Server Actions, not for fixing imports!
import { PrismaClient } from '@prisma/client';
```
**Why Wrong**: `'use server'` is for Server Actions, not module-level code separation.

### ❌ Mistake 2: Dynamic Imports in Client Components
```typescript
// ❌ Still bundles the module at build time
const { ROLES } = await import('@/lib/services/rbac-service');
```
**Why Wrong**: Build-time bundling still includes server code.

### ❌ Mistake 3: Conditional Imports
```typescript
// ❌ Build-time analysis includes both branches
if (typeof window === 'undefined') {
  import('@/lib/services/rbac-service');
}
```
**Why Wrong**: Webpack/Turbopack analyzes all imports regardless of runtime conditions.

---

## Benefits of Proper Separation

1. ✅ **Clear Architecture**: Client vs server code visually separated
2. ✅ **Type Safety**: Shared types between client and server
3. ✅ **Bundle Size**: Client bundles don't include server code
4. ✅ **Performance**: Faster client-side hydration
5. ✅ **Maintainability**: Easy to understand what's client-safe
6. ✅ **Scalability**: Pattern works for any domain (orders, users, products)

---

## Related Patterns

- **[Database Patterns](database-patterns.md)**: Always use `ctx.db`, never direct Prisma in client code
- **[Auth Patterns](auth-patterns.md)**: Authentication checks must be server-side
- **[Performance](../critical/performance.md)**: Smaller client bundles = faster page loads

---

**Status**: ✅ MANDATORY
**Last Updated**: October 27, 2025
**Reference**: [Main CLAUDE.md](../CLAUDE.md)
