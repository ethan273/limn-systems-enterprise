# Database Patterns

**Part of Prime Directive** | [Back to Main](../CLAUDE.md)

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

### Enforcement Rules

1. **ALWAYS** use `ctx.db` for database operations in tRPC routers
2. **ALWAYS** include `ctx` parameter in query/mutation handlers: `async ({ input, ctx })`
3. **NEVER** import direct Prisma client (`prisma`) in router files
4. **NEVER** use Supabase client directly in router files
5. **ALWAYS** verify table exists in DatabaseClient before using (check src/lib/db.ts)

### ESLint Enforcement (Automatic)

The ctx.db pattern is **automatically enforced** via ESLint:

**Rule Location**: `.eslintrc.cjs` (lines 39-58)

```javascript
// ❌ This will FAIL ESLint in tRPC routers:
import { PrismaClient } from '@prisma/client';
import { prisma } from '@/lib/db';

// Error: "Do not import PrismaClient in tRPC routers. Use ctx.db instead."
```

**Documented Exceptions** (`.eslintrc.cjs` lines 60-71):
- `src/server/api/routers/orders.ts`
- `src/server/api/routers/production-invoices.ts`
- `src/server/api/routers/production-orders.ts`

**Why Exceptions Exist**: These files require PostgreSQL advisory locks via `$executeRaw`, which is not available in the DatabaseClient wrapper:

```typescript
// ✅ VALID EXCEPTION: PostgreSQL advisory locks for atomic number generation
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function generateOrderNumber(): Promise<string> {
  const lockId = 1234567890;

  // Advisory lock - NOT available in ctx.db
  await prisma.$executeRaw`SELECT pg_advisory_lock(${lockId})`;

  try {
    // ... generate unique number ...
  } finally {
    await prisma.$executeRaw`SELECT pg_advisory_unlock(${lockId})`;
  }
}
```

**When to Request Exception**:
1. Raw SQL queries that need `$executeRaw` or `$queryRaw`
2. PostgreSQL-specific features (advisory locks, LISTEN/NOTIFY)
3. Database operations not supported by DatabaseClient

**How to Add Exception**:
1. Add `@allow-direct-prisma` comment in your file
2. Update `.eslintrc.cjs` to exclude your file
3. Document WHY the exception is needed

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

// DELETE
await ctx.db.my_table.delete({
  where: { id: 'some-id' },
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

---

## Prisma Relation Query Pattern (CRITICAL)

**MANDATORY REQUIREMENT - Prime Directive Compliance**

### ⚠️ THE PROBLEM

**Prisma Limitation**: Cannot use nested `select` for relations when using explicit field selects (due to Unsupported fields in schema).

**Symptoms**:
- Error: `column table_name.relation_name does not exist`
- Trying to select a relation as if it's a column
- Queries fail with "column does not exist" for relation fields

### ✅ THE SOLUTION: 3-Step Query Pattern

When you need to query a table WITH its relations:

**Step 1**: Query base data (scalar fields only)
```typescript
const flipbooksBase = await ctx.db.flipbooks.findMany({
  where: { status: 'active' },
  take: 10,
  orderBy: { created_at: 'desc' },
  select: {
    id: true,
    title: true,
    description: true,
    created_by_id: true,
    // ... ALL scalar fields
    // ❌ NO RELATIONS HERE!
  },
});
```

**Step 2**: Query relations separately using WHERE IN (batch queries)
```typescript
// Get unique IDs for batch query
const creatorIds = [...new Set(flipbooksBase.map(f => f.created_by_id))];
const flipbookIds = flipbooksBase.map(f => f.id);

// Fetch user_profiles separately
const creators = await ctx.db.user_profiles.findMany({
  where: { id: { in: creatorIds } },
  select: { id: true, full_name: true, email: true },
});

// Fetch flipbook_pages separately
const allPages = await ctx.db.flipbook_pages.findMany({
  where: { flipbook_id: { in: flipbookIds } },
  select: { id: true, flipbook_id: true, page_number: true },
  orderBy: { page_number: 'asc' },
});
```

**Step 3**: Combine using Maps for O(1) lookup
```typescript
// Create lookup maps
const creatorsMap = new Map(creators.map(c => [c.id, c]));

const pagesByFlipbook = new Map<string, typeof allPages>();
for (const page of allPages) {
  if (!pagesByFlipbook.has(page.flipbook_id)) {
    pagesByFlipbook.set(page.flipbook_id, []);
  }
  pagesByFlipbook.get(page.flipbook_id)!.push(page);
}

// Define combined type
type FlipbookWithRelations = typeof flipbooksBase[0] & {
  user_profiles: typeof creators[0] | null;
  flipbook_pages: typeof allPages;
};

// Combine data
const flipbooks: FlipbookWithRelations[] = flipbooksBase.map(flipbook => ({
  ...flipbook,
  user_profiles: creatorsMap.get(flipbook.created_by_id) || null,
  flipbook_pages: pagesByFlipbook.get(flipbook.id) || [],
}));

return flipbooks;
```

### Why This Pattern Works

1. ✅ **Avoids Prisma limitation** - No nested selects with Unsupported fields
2. ✅ **Efficient** - Uses WHERE IN for batch queries (2-3 queries total vs N+1)
3. ✅ **Type-safe** - Explicit TypeScript types for combined data
4. ✅ **Performant** - O(1) lookup using Maps instead of nested loops
5. ✅ **Maintainable** - Clear separation of concerns

---

## Database Permissions Standard (CRITICAL)

### Production Database Configuration

**Production Database**: `hwaxogapihsqleyzpqtj` (from `.env.vercel.production`)
**Dev Database**: `gwqkbjymbarkufwvdmar` (from `.env`)

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

---

## Environment and Database Configuration

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

---

**Status**: ✅ MANDATORY
**Last Updated**: October 25, 2025
**Reference**: [Main CLAUDE.md](../CLAUDE.md)
