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

For admin-only endpoints, add role validation:

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

    // Check if user has admin or super_admin user_type
    const userProfile = await prisma.user_profiles.findUnique({
      where: { id: user.id },
      select: { user_type: true },
    });

    if (!userProfile || (userProfile.user_type !== 'admin' && userProfile.user_type !== 'super_admin')) {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    // ... admin-only logic here
  }
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

**Status**: ✅ MANDATORY as of October 22, 2025
**Compliance**: All new code MUST use these patterns
**Violations**: Will be rejected in code review
**Reference**: [Main CLAUDE.md](../CLAUDE.md)
