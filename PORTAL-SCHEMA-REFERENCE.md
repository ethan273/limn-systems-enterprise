# Portal Schema Reference

**Last Updated: 2025-10-07 (Phase 1 Complete)**
**Source of Truth: Actual Database**

## Quick Reference: Portal Tables

### customer_portal_access

**Purpose**: Links Supabase Auth users to ALL portal types (customer/designer/factory/qc)

**Actual Database Columns** (Phase 1 - Multi-Portal Support):
```sql
CREATE TABLE customer_portal_access (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id  UUID REFERENCES customers(id) ON DELETE CASCADE,  -- Kept for backward compatibility
  user_id      UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  portal_role  VARCHAR(50) DEFAULT 'viewer',
  is_active    BOOLEAN DEFAULT true,
  last_login   TIMESTAMPTZ,
  login_count  INTEGER DEFAULT 0,
  invited_by   UUID REFERENCES auth.users(id),
  invited_at   TIMESTAMPTZ,
  accepted_at  TIMESTAMPTZ,
  created_at   TIMESTAMPTZ DEFAULT now(),
  updated_at   TIMESTAMPTZ DEFAULT now(),

  -- ✨ NEW: Multi-Portal Support (Phase 1)
  portal_type  VARCHAR(20) DEFAULT 'customer',  -- 'customer' | 'designer' | 'factory' | 'qc'
  entity_type  VARCHAR(20),                     -- 'customer' | 'partner' | 'qc_tester'
  entity_id    UUID,                            -- Points to customers.id OR partners.id OR qc_testers.id

  UNIQUE(customer_id, user_id)
);
```

**Portal Types** (stored in `portal_type` field):
- `customer` - Client portal access (entity_type='customer', entity_id→customers.id)
- `designer` - Designer partner portal (entity_type='partner', entity_id→partners.id where type='designer')
- `factory` - Factory partner portal (entity_type='partner', entity_id→partners.id where type='manufacturer')
- `qc` - QC tester portal (entity_type='qc_tester', entity_id→qc_testers.id)

**Portal Roles** (stored in `portal_role` field):
- `viewer` - Read-only access
- `editor` - Can modify orders, documents
- `admin` - Full access including user management

**Permission Model**:
- Permissions are NOT stored as individual boolean fields
- Permissions are determined by `portal_role` + `portal_type` in application logic
- Access control in `/src/server/api/routers/portal.ts`

**Creating Access (TypeScript)**:
```typescript
await prisma.$executeRaw`
  INSERT INTO customer_portal_access (customer_id, user_id, is_active, portal_role)
  VALUES (${customerId}::uuid, ${userId}::uuid, true, 'admin')
`;
```

**Creating Access (Prisma - Use Relations)**:
```typescript
// Note: Must use relation names from schema
await prisma.customer_portal_access.create({
  data: {
    is_active: true,
    portal_role: 'admin',
    customers: {
      connect: { id: customerId }
    },
    users_customer_portal_access_user_idTousers: {
      connect: { id: userId }
    }
  }
});
```

---

## Common Mistakes to Avoid

### ❌ WRONG: Assuming Permission Fields
```javascript
// These fields DO NOT EXIST in database
{
  can_place_orders: true,           // ❌ NO
  can_view_invoices: true,          // ❌ NO
  can_download_documents: true,     // ❌ NO
  can_manage_users: true,           // ❌ NO
}
```

### ✅ CORRECT: Use portal_role
```javascript
{
  portal_role: 'admin',  // ✅ YES - this field exists
  is_active: true,       // ✅ YES
}
```

---

## Prisma Schema (Auto-Generated)

From `/prisma/schema.prisma`:

```prisma
model customer_portal_access {
  id                                             String     @id @default(dbgenerated("uuid_generate_v4()")) @db.Uuid
  customer_id                                    String?    @db.Uuid
  user_id                                        String?    @db.Uuid
  portal_role                                    String?    @default("viewer") @db.VarChar(50)
  is_active                                      Boolean?   @default(true)
  last_login                                     DateTime?  @db.Timestamptz(6)
  login_count                                    Int?       @default(0)
  invited_by                                     String?    @db.Uuid
  invited_at                                     DateTime?  @db.Timestamptz(6)
  accepted_at                                    DateTime?  @db.Timestamptz(6)
  created_at                                     DateTime?  @default(now()) @db.Timestamptz(6)
  updated_at                                     DateTime?  @default(now()) @db.Timestamptz(6)
  customers                                      customers? @relation(fields: [customer_id], references: [id], onDelete: Cascade)
  users_customer_portal_access_invited_byTousers users?     @relation("customer_portal_access_invited_byTousers", fields: [invited_by], references: [id])
  users_customer_portal_access_user_idTousers    users?     @relation("customer_portal_access_user_idTousers", fields: [user_id], references: [id], onDelete: Cascade)

  @@unique([customer_id, user_id])
  @@index([invited_by])
  @@index([user_id])
  @@schema("public")
}
```

---

## Permission Checking (Application Logic)

**In Portal Router** (`/src/server/api/routers/portal.ts`):

```typescript
const enforcePortalAccess = async (ctx: Context) => {
  const portalAccess = await prisma.customer_portal_access.findFirst({
    where: {
      user_id: ctx.session.user.id,
      is_active: true,  // ✅ Check active status
    },
    include: {
      customers: true,
    },
  });

  if (!portalAccess) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'You do not have access to the customer portal'
    });
  }

  return {
    customerId: portalAccess.customer_id,
    customer: portalAccess.customers,
    role: portalAccess.portal_role,  // ✅ Return role for app logic
  };
};
```

**Checking Permissions by Role**:
```typescript
const canManageUsers = (role: string) => role === 'admin';
const canEditOrders = (role: string) => ['admin', 'editor'].includes(role);
const canViewOnly = (role: string) => ['admin', 'editor', 'viewer'].includes(role);
```

---

## Test Users Setup

**Created Users** (verified 2025-10-07):

| Email | User ID | Customer ID | Role | Status |
|-------|---------|-------------|------|--------|
| test_customer@example.com | 1032430e-54f1-4f86-98cd-fe3ab6a4781c | (auto) | admin | ✅ Active |
| test_designer@limnsystems.com | f6f06dcc-1683-4d37-a3ef-9cf9029316b4 | (auto) | admin | ✅ Active |
| test_factory@limnsystems.com | 37084f25-c8d6-40cb-9a9c-d1d7f210627b | (auto) | admin | ✅ Active |

**Verification Command**:
```bash
node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
(async () => {
  const access = await prisma.customer_portal_access.findMany({
    where: { is_active: true },
    include: {
      customers: true,
      users_customer_portal_access_user_idTousers: {
        select: { email: true }
      }
    }
  });
  console.log(JSON.stringify(access, null, 2));
  await prisma.\$disconnect();
})();
"
```

---

## Sync Check Command

Run this to verify Prisma schema matches database:

```bash
# Check if schema needs updating
npx prisma db pull --print

# If changes detected, apply them
npx prisma db pull
npx prisma generate

# Validate schema
npx prisma validate
```

---

## qc_testers Table (New in Phase 1)

**Purpose**: Stores QC tester companies/individuals who have portal access for quality inspections

**Actual Database Columns**:
```sql
CREATE TABLE qc_testers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name TEXT NOT NULL,
  primary_contact TEXT,
  primary_email TEXT NOT NULL,
  phone TEXT,
  address_line1 TEXT,
  address_line2 TEXT,
  city TEXT,
  state TEXT,
  postal_code TEXT,
  country TEXT,
  certifications TEXT[],
  specializations TEXT[],
  status TEXT DEFAULT 'active',
  portal_enabled BOOLEAN DEFAULT true,
  portal_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  notes TEXT,
  tags TEXT[],
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

**Link to Portal Access**:
```typescript
// Create QC tester with portal access
const qcTester = await prisma.qc_testers.create({
  data: {
    company_name: 'QC Testing Co.',
    primary_email: 'qc@example.com',
    portal_enabled: true,
    portal_user_id: userId,
  }
});

// Create portal access record
await prisma.customer_portal_access.create({
  data: {
    user_id: userId,
    portal_type: 'qc',
    entity_type: 'qc_tester',
    entity_id: qcTester.id,
    portal_role: 'editor',
    is_active: true,
  }
});
```

---

## Related Documentation

- **Schema Validation**: `/SCHEMA-VALIDATION-GUIDE.md`
- **Memory Management**: `/MEMORY-MANAGEMENT-GUIDE.md`
- **Portal Router**: `/src/server/api/routers/portal.ts`
- **Prisma Schema**: `/prisma/schema.prisma`
