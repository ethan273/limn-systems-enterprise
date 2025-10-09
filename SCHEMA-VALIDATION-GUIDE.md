# Database Schema Validation Guide

**Created: 2025-10-07**
**Purpose: Prevent schema mismatches between Prisma and actual database**

## Problem Encountered

When creating portal test users, code attempted to use fields (`can_place_orders`, `can_view_invoices`, `can_download_documents`) that **do not exist** in the actual database table.

**Root Cause**: Code was written based on assumed schema rather than actual database structure.

## Solution: Always Validate Schema First

### Step 1: Check Actual Database Columns

Before writing any code that creates/updates records, **always verify the actual table structure**:

```bash
node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  const columns = await prisma.\$queryRaw\`
    SELECT column_name, data_type, is_nullable, column_default
    FROM information_schema.columns
    WHERE table_name = 'YOUR_TABLE_NAME'
    ORDER BY ordinal_position
  \`;

  console.log(JSON.stringify(columns, null, 2));
  await prisma.\$disconnect();
})();
"
```

### Step 2: Compare with Prisma Schema

Check `prisma/schema.prisma` to ensure it matches the database:

```bash
grep -A30 "model YOUR_MODEL_NAME" prisma/schema.prisma
```

### Step 3: If Mismatch Found

**Option A: Database is Source of Truth** (Recommended for existing projects)
```bash
# Regenerate Prisma schema from database
npx prisma db pull

# Regenerate Prisma Client
npx prisma generate
```

**Option B: Prisma Schema is Source of Truth** (For new features)
```bash
# Push schema changes to database
npx prisma db push
```

## customer_portal_access Table - Verified Schema

**Last Verified: 2025-10-07**

### Actual Database Columns:
```sql
id                UUID PRIMARY KEY DEFAULT uuid_generate_v4()
customer_id       UUID (FK to customers.id)
user_id           UUID (FK to auth.users.id)
portal_role       VARCHAR(50) DEFAULT 'viewer'
is_active         BOOLEAN DEFAULT true
last_login        TIMESTAMPTZ
login_count       INTEGER DEFAULT 0
invited_by        UUID (FK to auth.users.id)
invited_at        TIMESTAMPTZ
accepted_at       TIMESTAMPTZ
created_at        TIMESTAMPTZ DEFAULT now()
updated_at        TIMESTAMPTZ DEFAULT now()
```

### Fields That DO NOT EXIST:
- ❌ `can_place_orders`
- ❌ `can_view_invoices`
- ❌ `can_download_documents`
- ❌ `can_manage_users`
- ❌ Any other `can_*` permission fields

### Permissions are Controlled By:
- `portal_role` field (values: 'viewer', 'editor', 'admin')
- Application logic based on role
- NOT individual permission flags

## Validation Checklist

Before writing database code:

- [ ] Checked actual table structure with SQL query
- [ ] Compared with Prisma schema model
- [ ] Verified Prisma schema matches database
- [ ] Used only fields that exist in BOTH places
- [ ] Tested with actual database (not assumptions)

## Common Tables to Validate

### Phase 3 Portal Tables:
```bash
# customer_portal_access
# customer_portal_activity
# customer_portal_users (if exists)
# customer_portals (if exists)
```

### Validation Command for All Portal Tables:
```bash
node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  const tables = ['customer_portal_access', 'customer_portal_activity'];

  for (const table of tables) {
    console.log(\`\\n=== \${table} ===\`);
    const columns = await prisma.\$queryRaw\`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = \${table}
      ORDER BY ordinal_position
    \`;
    columns.forEach(c => console.log(\`  \${c.column_name}: \${c.data_type}\`));
  }

  await prisma.\$disconnect();
})();
"
```

## Schema Documentation Process

### When Creating New Tables:
1. Design schema in `prisma/schema.prisma`
2. Run `npx prisma db push` to create in database
3. Document in this file with date
4. Add validation command to test suite

### When Modifying Existing Tables:
1. Update database first (via migration or manual SQL)
2. Run `npx prisma db pull` to update schema
3. Run `npx prisma generate` to update client
4. Update this documentation
5. Update all related code

### When Discovering Mismatch:
1. **STOP** - Do not proceed with incorrect schema
2. Run validation commands above
3. Fix either Prisma schema OR database (choose one source of truth)
4. Document the correction here
5. Update all affected code

## Prevention: Pre-Commit Hook

Add to `.husky/pre-commit`:
```bash
# Validate Prisma schema matches database
echo "Validating Prisma schema..."
npx prisma validate
```

## Testing with Correct Schema

### Creating Portal Access Records (CORRECT):
```javascript
await prisma.$executeRaw`
  INSERT INTO customer_portal_access (customer_id, user_id, is_active, portal_role)
  VALUES (${customerId}::uuid, ${userId}::uuid, true, 'admin')
`;
```

### Creating Portal Access Records (WRONG):
```javascript
// ❌ WRONG - These fields don't exist
await prisma.$executeRaw`
  INSERT INTO customer_portal_access (
    customer_id, user_id, is_active,
    can_place_orders, can_view_invoices, can_download_documents  // ❌ DON'T EXIST!
  ) VALUES (...)
`;
```

## Related Files

- **Prisma Schema**: `/prisma/schema.prisma`
- **Database Connection**: `/src/lib/db.ts`
- **Portal Router**: `/src/server/api/routers/portal.ts`
- **Test Setup**: `/create-portal-access.js`

## Emergency: Schema Completely Out of Sync

If Prisma and database are completely mismatched:

```bash
# 1. Backup database
pg_dump YOUR_DATABASE > backup.sql

# 2. Pull fresh schema from database
npx prisma db pull --force

# 3. Regenerate client
npx prisma generate

# 4. Test all queries
npm run test

# 5. If broken, restore from backup
psql YOUR_DATABASE < backup.sql
```

## Key Principle

**"Trust, but Verify"**

Never assume a field exists. Always validate:
1. Check database structure first
2. Verify Prisma schema matches
3. Only then write code
4. Test with actual database
5. Document any discoveries

---

**Remember**: Schema mismatches cause runtime errors that are hard to debug. Spend 2 minutes validating upfront to save hours of debugging later.
