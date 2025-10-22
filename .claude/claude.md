# Prime Directive for Claude Code

## 🚨 CRITICAL: NO SHORTCUTS EVER

**This is the most important rule. It overrides everything else.**

---

## 🔴 CRITICAL: Environment and Database Configuration

### Environment Files Location
**MANDATORY - Always check these files first:**

1. **Development:** `.env` - Contains dev database URL and credentials
2. **Production:** `production-credentials.env` - Contains prod database URL and credentials

**Database URL Variables:**
- DEV: `DEV_DB_URL` in `production-credentials.env`
- PROD: `PROD_DB_URL` in `production-credentials.env`
- Current/Active: `DATABASE_URL` in `.env` (usually points to dev)

**CRITICAL RULE:** When applying database changes, migrations, or indexes:
1. ✅ **ALWAYS** apply to BOTH dev and prod databases
2. ✅ **ALWAYS** check `production-credentials.env` for prod credentials
3. ✅ **ALWAYS** verify both databases have matching changes
4. ✅ **NEVER** assume .env contains prod credentials

**Example:**
```bash
# Get dev URL
grep "DEV_DB_URL" production-credentials.env

# Get prod URL
grep "PROD_DB_URL" production-credentials.env
```

---

## Core Principles

### 1. NO SHORTCUTS
- There are **NO time constraints**
- **Quality is imperative**, not speed
- **Always build the best possible solutions** that are permanent and error-free
- Do not optimize for speed at the expense of correctness
- Do not skip verification steps
- Do not make assumptions without proof

### 2. COMPLETE VERIFICATION REQUIRED
- **Never claim "production ready"** without running `./scripts/pre-deploy-check.sh` successfully
- **Never claim "fixed"** without verifying the fix works
- **Never claim "tested"** without showing test results
- **All builds must complete successfully** - timeouts are blockers, not warnings

### 3. ZERO TOLERANCE FOR:
- ❌ Exposed credentials/secrets
- ❌ Type errors in production code
- ❌ Build failures
- ❌ Unverified claims
- ❌ "It should work" statements without proof
- ❌ Shortcuts that compromise quality

### 4. ALWAYS DO:
- ✅ Run complete verification before claiming success
- ✅ Investigate timeouts and errors thoroughly
- ✅ Scan for secrets in ALL files (including .md)
- ✅ Verify type safety with `npm run type-check`
- ✅ Verify production build with `npm run build`
- ✅ Test fixes manually when possible
- ✅ Be conservative, not optimistic

---

## Production Readiness Definition

An application is **NOT production ready** unless:

1. ✅ `./scripts/pre-deploy-check.sh` passes completely
2. ✅ `npm run build` succeeds (no timeout, no errors)
3. ✅ `npx tsc --noEmit` shows 0 errors
4. ✅ `npm audit` shows 0 critical/high vulnerabilities
5. ✅ No secrets exposed in any committed files
6. ✅ Production server starts and serves pages
7. ✅ Core user flows work in production mode

**Never claim production ready without proof of all 7 items above.**

---

## When Making Claims

### ❌ NEVER SAY:
- "This should work"
- "Probably production ready"
- "Looks good to me"
- "I think it's fixed"
- "The tests pass so it's ready"

### ✅ ALWAYS SAY:
- "I verified X by running Y, here are the results"
- "The build succeeded in X minutes: [output]"
- "I found N errors, here's the plan to fix them"
- "Not production ready: [specific issues]"
- "Production ready: [proof of verification]"

---

## Error Response Protocol

When encountering errors:

1. **STOP** - Do not proceed
2. **INVESTIGATE** - Find root cause
3. **FIX** - Implement proper solution (no workarounds)
4. **VERIFY** - Confirm fix works
5. **DOCUMENT** - Update documentation
6. **PREVENT** - Add checks to prevent recurrence

**Never ignore, skip, or work around errors.**

---

## Build Timeout Protocol

If `npm run build` times out:

1. **DO NOT** assume it's just slow
2. **DO NOT** skip to other checks
3. **DO** investigate why it's timing out
4. **DO** increase timeout and run to completion
5. **DO** treat timeout as a blocker
6. **DO** fix the underlying issue

---

## Security Protocol

### Secrets Detection

Before any commit, verify:
```bash
# Check for common secret patterns
grep -r "GOCSPX" . --exclude-dir=node_modules --exclude-dir=.next --exclude-dir=.git
grep -r "sk_live_\|pk_live_\|sk_test_\|pk_test_" . --exclude-dir=node_modules --exclude-dir=.next --exclude-dir=.git
grep -r "-----BEGIN PRIVATE KEY-----" . --exclude-dir=node_modules --exclude-dir=.next --exclude-dir=.git
grep -r "api_key.*=.*['\"][a-zA-Z0-9]{20,}" . --exclude-dir=node_modules --exclude-dir=.next --exclude-dir=.git
```

Check ALL files including:
- ✅ .md files
- ✅ .txt files
- ✅ Config files
- ✅ Documentation
- ✅ Session notes

### If Secrets Found:

1. **IMMEDIATELY** remove from repository
2. **IMMEDIATELY** add to .gitignore
3. **IMMEDIATELY** commit and push removal
4. **IMMEDIATELY** notify user to rotate credentials
5. **DOCUMENT** in security report

---

## Code Quality Standards

### TypeScript

- **0 errors** required for production
- Warnings are acceptable if documented
- No `any` types without justification
- No `@ts-ignore` without explanation
- Type safety is non-negotiable

### Testing

- Fix failing tests, don't skip them
- >90% pass rate minimum
- Flaky tests must be investigated
- E2E tests must pass for critical flows

### Code Structure

- No commented-out code blocks >10 lines
- No console.log in production (except error handling)
- No TODO in critical paths without tracking
- No hardcoded credentials ever

---

## Database Access Pattern Standard

**MANDATORY REQUIREMENT - Prime Directive Compliance**

### ✅ THE ONE TRUE PATTERN (ALWAYS USE)

```typescript
// In tRPC routers - ALWAYS use ctx.db
export const myRouter = createTRPCRouter({
  myQuery: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input, ctx }) => {
      // ✅ CORRECT: Use ctx.db for ALL database operations
      const data = await ctx.db.my_table.findUnique({
        where: { id: input.id },
        include: { related_table: true },
        select: { field1: true, field2: true }, // Select is supported
      });
      return data;
    }),
});
```

**Why This Works:**
- ✅ Consistent - Same database access method throughout entire codebase
- ✅ Type-safe - Full TypeScript support via DatabaseClient wrapper
- ✅ Complete - Supports findMany, findUnique, create, update, delete, upsert, $queryRaw
- ✅ Prisma-compatible - Supports include, select, where, orderBy, etc.
- ✅ Production-ready - No authentication issues, reliable connection pooling

### ❌ BROKEN PATTERNS (NEVER USE)

```typescript
// ❌ DO NOT USE - Direct Prisma client (causes auth failures)
import { prisma } from '@/lib/db';
const data = await prisma.my_table.findMany();

// ❌ DO NOT USE - Missing ctx parameter
.query(async ({ input }) => {
  const data = await ctx.db.my_table.findMany(); // ctx is undefined!
});

// ❌ DO NOT USE - Supabase direct (inconsistent with rest of codebase)
import { getSupabaseAdmin } from '@/lib/supabase';
const supabase = getSupabaseAdmin();
const { data } = await supabase.from('my_table').select();
```

**Why These Fail:**
- ❌ Direct Prisma causes PostgreSQL authentication failures
- ❌ Missing ctx causes runtime errors
- ❌ Supabase direct queries bypass type safety and are inconsistent
- ❌ Multiple database access patterns = maintenance nightmare

### Enforcement Rules

1. **ALWAYS** use `ctx.db` for database operations in tRPC routers
2. **ALWAYS** include `ctx` parameter in query/mutation handlers: `async ({ input, ctx })`
3. **NEVER** import direct Prisma client (`prisma`) in router files
4. **NEVER** use Supabase client directly in router files
5. **ALWAYS** verify table exists in DatabaseClient before using (check src/lib/db.ts)

### Complete CRUD Operations

```typescript
// CREATE
const newRecord = await ctx.db.my_table.create({
  data: { field1: 'value', field2: 123 },
  select: { id: true, field1: true }, // Optional: only return selected fields
});

// READ - Single record
const record = await ctx.db.my_table.findUnique({
  where: { id: 'some-id' },
  include: { related_table: true }, // Include relations
  select: { field1: true, field2: true }, // Or select specific fields
});

// READ - Multiple records
const records = await ctx.db.my_table.findMany({
  where: { status: 'active' },
  orderBy: { created_at: 'desc' },
  take: 10,
  skip: 0,
  include: { related_table: true },
});

// UPDATE
const updated = await ctx.db.my_table.update({
  where: { id: 'some-id' },
  data: { field1: 'new value' },
  select: { id: true, field1: true },
});

// UPSERT (if table supports it - check db.ts)
const upserted = await ctx.db.my_table.upsert({
  where: { unique_field: 'value' },
  create: { field1: 'value', field2: 123 },
  update: { field2: 456 },
});

// DELETE
await ctx.db.my_table.delete({
  where: { id: 'some-id' },
});

// DELETE MANY
await ctx.db.my_table.deleteMany({
  where: { status: 'archived' },
});

// CREATE MANY
await ctx.db.my_table.createMany({
  data: [
    { field1: 'value1' },
    { field1: 'value2' },
  ],
});

// COUNT
const count = await ctx.db.my_table.count({
  where: { status: 'active' },
});

// RAW QUERIES (when needed)
const result = await ctx.db.$queryRaw`
  SELECT * FROM my_table WHERE field1 = ${value}
`;
```

### Common Mistakes to Avoid

**Mistake 1: Missing ctx parameter**
```typescript
// ❌ WRONG
.query(async ({ input }) => {
  const data = await ctx.db.users.findMany(); // ctx is undefined!
});

// ✅ CORRECT
.query(async ({ input, ctx }) => {
  const data = await ctx.db.users.findMany();
});
```

**Mistake 2: Using { ctx: _ctx } rename pattern**
```typescript
// ❌ WRONG
.query(async ({ ctx: _ctx, input }) => {
  const data = await ctx.db.users.findMany(); // ctx is undefined, should be _ctx
});

// ✅ CORRECT
.query(async ({ ctx, input }) => {
  const data = await ctx.db.users.findMany();
});
```

**Mistake 3: Table doesn't exist in DatabaseClient**
```typescript
// ❌ WRONG - Assuming table exists without checking
const data = await ctx.db.some_new_table.findMany(); // TypeScript error!

// ✅ CORRECT - Add table to DatabaseClient first in src/lib/db.ts
// Follow the pattern of existing tables, including all CRUD methods
```

### Available Database Methods

All tables in `ctx.db` support these methods:
- `findMany(options?)` - Query multiple records
- `findUnique({ where, include?, select? })` - Query single record
- `create({ data, include?, select? })` - Create new record
- `update({ where, data, include?, select? })` - Update existing record
- `delete({ where })` - Delete record
- `createMany({ data })` - Bulk create
- `deleteMany({ where })` - Bulk delete
- `count({ where? })` - Count records
- `upsert({ where, create, update })` - Create or update (if table supports it)

Global methods (on `ctx.db` itself):
- `$queryRaw` - Execute raw SQL queries (typed)
- `$queryRawUnsafe` - Execute raw SQL queries (untyped)

### Code Review Checklist

When reviewing PRs or writing database code, verify:
- [ ] Uses `ctx.db` for all database operations
- [ ] All query/mutation handlers include `ctx` parameter
- [ ] No direct Prisma client imports in router files
- [ ] No Supabase client usage in router files
- [ ] Table exists in DatabaseClient (src/lib/db.ts)
- [ ] Proper error handling for database operations
- [ ] Uses appropriate method (findUnique vs findMany, etc.)

### When to Add a New Table to DatabaseClient

If you encounter: `Property 'my_table' does not exist on type 'DatabaseClient'`

**Steps to add a new table:**

1. Open `src/lib/db.ts`
2. Find the DatabaseClient class (around line 479)
3. Add your table following this exact pattern:

```typescript
my_table = {
  findMany: (options?: QueryOptions) => this.findManyGeneric<Record<string, any>>('my_table', options),
  findUnique: (options: { where: Record<string, any>; include?: Record<string, any>; select?: Record<string, any> }) =>
    this.findUniqueGeneric<Record<string, any>>('my_table', options),
  create: (options: { data: Record<string, any>; include?: Record<string, any>; select?: Record<string, any> }) =>
    this.createGeneric<Record<string, any>>('my_table', options),
  update: (options: { where: Record<string, any>; data: Record<string, any>; include?: Record<string, any>; select?: Record<string, any> }) =>
    this.updateGeneric<Record<string, any>>('my_table', options),
  delete: (options: { where: Record<string, any> }) =>
    this.deleteGeneric('my_table', options),
  createMany: (options: { data: Record<string, any>[] }) =>
    this.createManyGeneric('my_table', options),
  deleteMany: (options: { where: Record<string, any> }) =>
    this.deleteManyGeneric('my_table', options),
  count: (options?: { where?: Record<string, any> }) =>
    this.countGeneric('my_table', options),
};
```

4. If the table needs `upsert`, add it after `update`:

```typescript
upsert: async (options: { where: Record<string, any>; create: Record<string, any>; update: Record<string, any> }) => {
  const existing = await this.findUniqueGeneric<any>('my_table', { where: options.where });
  if (existing) {
    return this.updateGeneric<any>('my_table', { where: options.where, data: options.update });
  } else {
    return this.createGeneric<any>('my_table', { data: { ...options.where, ...options.create } });
  }
},
```

### Reference Documentation

- **Database Client**: `/Users/eko3/limn-systems-enterprise/src/lib/db.ts`
- **Hybrid Architecture**: See comments at top of db.ts for full explanation
- **tRPC Routers**: All routers in `src/server/api/routers/` use this pattern

**Status**: ✅ MANDATORY as of October 21, 2025
**Compliance**: All database operations MUST use ctx.db
**Violations**: Will cause TypeScript errors and be rejected in code review
**Commit**: bc56e7c - Complete database client consistency (128 errors → 0)

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

### Code Review Checklist

When reviewing PRs or writing code, verify:
- [ ] No `import { useAuthContext }` statements
- [ ] Uses `api.userProfile.getCurrentUser.useQuery()`
- [ ] Has `enabled` guards on dependent queries
- [ ] Handles loading and undefined states
- [ ] Uses consistent variable naming (`currentUser`)

**Reference**: See `/limn-systems-enterprise-docs/07-DEVELOPMENT-GUIDES/AUTH-PATTERN-STANDARD.md` for complete documentation, usage examples, migration guide, and FAQ.

**Status**: ✅ MANDATORY as of October 19, 2025
**Compliance**: All new code MUST use this pattern
**Violations**: Will be rejected in code review

---

## Logo Usage Pattern (STANDARD CONVENTION)

**MANDATORY REQUIREMENT - Prime Directive Compliance**

### ⚠️ CRITICAL: This is a Recurring Bug

**User Frustration**: "we've fixed this issue a thousand times and it keep reappearing"

**The Problem**: Logo usage keeps getting inverted, causing logos to be invisible against their backgrounds.

### ✅ The Standard File Naming

**What the files are FOR:**
- `Limn_Logo_Dark_Mode.png` = Logo **FOR dark mode** (contains light-colored logo for visibility)
- `Limn_Logo_Light_Mode.png` = Logo **FOR light mode** (contains dark-colored logo for visibility)

**This follows standard convention**:
- `Logo_Dark_Mode.png` = logo FOR dark mode (light colored for visibility on dark background)
- `Logo_Light_Mode.png` = logo FOR light mode (dark colored for visibility on light background)

**Our files follow standard naming: The file name describes what THEME it's for.**

### ❌ WRONG PATTERN (What Keeps Happening)

```typescript
// ❌ DO NOT USE - Shows wrong logo for theme (INVISIBLE!)
resolvedTheme === 'dark'
  ? '/images/Limn_Logo_Light_Mode.png'  // Light mode logo on dark bg = invisible
  : '/images/Limn_Logo_Dark_Mode.png'   // Dark mode logo on light bg = invisible
```

**This is WRONG because it uses the opposite file from what the theme needs.**

### ✅ CORRECT PATTERN (Always Use This)

```typescript
// CORRECT: Use Light_Mode.png for light theme, Dark_Mode.png for dark theme
// See LOGO-USAGE-PERMANENT-REFERENCE.md for full explanation
resolvedTheme === 'dark'
  ? '/images/Limn_Logo_Dark_Mode.png'   // Use Dark_Mode.png for dark theme
  : '/images/Limn_Logo_Light_Mode.png'  // Use Light_Mode.png for light theme
```

### The Rule to Memorize

**"Use the MATCHING file name for the theme"**
- Dark theme → `Limn_Logo_Dark_Mode.png`
- Light theme → `Limn_Logo_Light_Mode.png`

### Enforcement Rules

1. **ALWAYS** use the matching file name for the theme (Dark_Mode.png for dark theme)
2. **ALWAYS** add the correct comment above logo usage
3. **ALWAYS** reference `LOGO-USAGE-PERMANENT-REFERENCE.md` in the comment
4. **NEVER** invert the file names (that causes invisible logos)
5. **ALWAYS** verify logo visibility in both themes before committing

### All Files with Logo Usage (10 total)

Must maintain correct pattern in:
1. `/src/app/auth/customer/page.tsx:34`
2. `/src/app/login/page.tsx:44`
3. `/src/app/auth/employee/page-client.tsx:140`
4. `/src/app/auth/dev/page.tsx:97`
5. `/src/app/auth/verify-email/page.tsx:76-77`
6. `/src/app/auth/contractor/page.tsx:34`
7. `/src/app/page.tsx:16`
8. `/src/components/Sidebar.tsx:321`
9. `/src/app/portal/login/page.tsx:139`

**DO NOT CHANGE this pattern in ANY file without updating ALL 9+ files!**

### Code Review Checklist

When reviewing PRs or writing code with logos, verify:
- [ ] Uses matching file name for theme (dark theme = Dark_Mode.png)
- [ ] Has correct comment above logo usage
- [ ] References `LOGO-USAGE-PERMANENT-REFERENCE.md`
- [ ] Tested visually in both light and dark themes
- [ ] Logo is visible against both backgrounds

### Why This Matters

**Impact of Getting It Wrong:**
- Logos become invisible in dark mode (user can't see branding)
- Recurring bug wastes development time
- User frustration when "fixed a thousand times" keeps coming back
- Breaks all authentication flows (login pages, verify email, etc.)

**Reference**: See `/LOGO-USAGE-PERMANENT-REFERENCE.md` for complete documentation and counterintuitive naming explanation.

**Status**: ✅ MANDATORY as of October 19, 2025
**Compliance**: All logo usage MUST follow this pattern
**Violations**: Will be rejected in code review
**Testing**: MUST verify visual appearance in both themes

---

## Communication Standards

### Be Honest

- Admit mistakes immediately
- Don't hide problems
- Don't sugarcoat issues
- Don't make excuses

### Be Precise

- Show exact commands run
- Show exact output received
- Show exact errors encountered
- Provide concrete evidence

### Be Conservative

- Under-promise, over-deliver
- Flag potential issues early
- Assume worst case scenarios
- Verify optimistic assumptions

---

## Verification Checklist

Before claiming **ANY** task is complete:

- [ ] Does it work? (tested manually or automatically)
- [ ] Does it build? (no errors)
- [ ] Does it type-check? (no errors)
- [ ] Does schema validate? (`npm run schema:validate` passes)
- [ ] Is it secure? (no secrets, no vulnerabilities)
- [ ] Is it documented? (updated relevant docs)
- [ ] Can it be verified? (repeatable test)

**All checkboxes must be ✅ before claiming complete.**

---

## When in Doubt

### Ask Questions

- "Should I verify this works before claiming it's fixed?"
  **Answer: YES, ALWAYS**

- "Is it okay to skip this check to save time?"
  **Answer: NO, NEVER**

- "Can I claim production ready without running the build?"
  **Answer: NO, ABSOLUTELY NOT**

- "Should I investigate this timeout?"
  **Answer: YES, IMMEDIATELY**

### Default to Quality

- **When choosing between fast and correct**: Choose correct
- **When choosing between easy and proper**: Choose proper
- **When choosing between done and verified**: Choose verified
- **When choosing between working and production-ready**: Choose production-ready

---

## Lessons from Past Failures

### January 13, 2025 Incident

**What Happened:**
- Claimed "production ready" without running successful build
- Ignored build timeout instead of investigating
- Only ran partial checks (audit, lint) not complete verification
- Exposed Google OAuth credentials in documentation file
- Made 98 TypeScript errors to production branch

**Root Cause:**
- Prioritized speed over quality
- Made assumptions without verification
- Took shortcuts
- Over-confident claims without proof

**Consequences:**
- Lost user trust
- Created security vulnerability
- Wasted time with false confidence
- Had to write this document

**Lessons:**
1. **Never skip verification steps**
2. **Build timeout = blocker, not warning**
3. **Scan ALL files for secrets**
4. **Production ready requires proof, not assumptions**
5. **Quality always trumps speed**

---

## Pre-Deployment Requirements

Before EVERY deployment:

```bash
# This must pass completely
./scripts/pre-deploy-check.sh

# Expected output:
# ✅ ALL CRITICAL CHECKS PASSED
# Application is ready for production deployment.
```

If it fails:
1. **DO NOT DEPLOY**
2. **FIX ALL ISSUES**
3. **RUN AGAIN**
4. **REPEAT UNTIL PASSES**

---

## Accountability

As Claude Code, I commit to:

1. **NO SHORTCUTS** - Ever
2. **COMPLETE VERIFICATION** - Always
3. **HONEST COMMUNICATION** - No exceptions
4. **QUALITY OVER SPEED** - Without compromise
5. **LEARN FROM MISTAKES** - And prevent recurrence

When I fail these standards, I will:
1. **Admit the failure immediately**
2. **Explain what went wrong**
3. **Document the lesson learned**
4. **Update processes to prevent recurrence**
5. **Never make the same mistake twice**

---

## Summary

### The ONE Rule to Remember:

**NO SHORTCUTS. QUALITY IS IMPERATIVE. BUILD THE BEST POSSIBLE SOLUTIONS THAT ARE PERMANENT AND ERROR-FREE.**

Everything else follows from this.

---

## Database Permissions Standard (CRITICAL)

**MANDATORY REQUIREMENT - Prime Directive Compliance**

### Production Database Configuration

**Production Database**: `hwaxogapihsqleyzpqtj` (from `.env.vercel.production`)
**Dev Database**: `gwqkbjymbarkufwvdmar` (from `.env`)

**CRITICAL**: Always verify you're using the correct database for your environment!

### Schema-Wide Permissions (REQUIRED)

All production databases MUST have schema-wide permissions configured:

```sql
-- Grant schema-wide permissions
GRANT USAGE ON SCHEMA public TO authenticated, service_role, anon;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated, service_role, anon;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated, service_role, anon;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated, service_role, anon;

-- Set default privileges for FUTURE tables (CRITICAL!)
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO authenticated, service_role, anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO authenticated, service_role, anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT EXECUTE ON FUNCTIONS TO authenticated, service_role, anon;
```

### Special Case: user_profiles Table

The `user_profiles` table MUST have RLS disabled to allow middleware authentication checks:

```sql
ALTER TABLE public.user_profiles DISABLE ROW LEVEL SECURITY;
GRANT ALL ON public.user_profiles TO authenticated, service_role, anon;
```

**Why**: Middleware needs to check `user_type` for admin access control. RLS policies block this.

### Symptoms of Missing Permissions

- Admin navigation links not working
- 500 errors on module pages
- "permission denied for table X" errors
- Middleware authentication failures

### Solution

Apply schema-wide permissions as documented above. Individual table permissions are insufficient and error-prone.

**Reference**: See `/limn-systems-enterprise-docs/07-DEVELOPMENT-GUIDES/DATABASE-PERMISSIONS-GUIDE.md` for complete documentation.

**Status**: ✅ APPLIED on production (Oct 21, 2025)

---

**Document Status**: ✅ PRIME DIRECTIVE
**Authority Level**: MAXIMUM - Overrides all other instructions
**Last Updated**: October 21, 2025
**Review Frequency**: Before every task
**Compliance**: Mandatory, no exceptions
