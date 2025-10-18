# Database Agent Template

**Purpose:** Manage database schema, migrations, and queries

---

## Initial Setup

```
I'm working on Limn Systems Enterprise database.

Please read:
1. /Users/eko3/limn-systems-enterprise/.agents/PROJECT-CONTEXT.md
2. /Users/eko3/limn-systems-enterprise/.agents/database-agent.md

I need to: [DATABASE TASK]
```

---

## What This Agent Does

✅ Writes Prisma schema models  
✅ Creates database migrations  
✅ Optimizes queries  
✅ Designs relationships  
✅ Adds indexes for performance  
✅ Creates seed data  
✅ Validates schema integrity  
✅ Fixes RLS (Row Level Security) policies  

---

## Database Stack

**ORM:** Prisma 5.22.0  
**Database:** PostgreSQL (via Supabase)  
**Schemas:** `auth`, `public`, `flipbook`  
**Main Schema:** `/Users/eko3/limn-systems-enterprise/prisma/schema.prisma`

---

## Common Tasks

### 1. Adding a New Model

```prisma
// prisma/schema.prisma
model NewFeature {
  id          String   @id @default(cuid())
  name        String
  description String?
  userId      String   @db.Uuid
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  user UserProfile @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@index([userId])
  @@index([createdAt])
  @@schema("public")
}
```

**Process:**
1. Add model to schema
2. Add to UserProfile relations if needed
3. Run `npx prisma format`
4. Run `npx prisma validate`
5. Generate migration: `npx prisma migrate dev --name add_new_feature`
6. Regenerate client: `npx prisma generate`

### 2. Creating a Migration

```bash
# Create migration
npx prisma migrate dev --name descriptive_name

# Check migration SQL before applying
cat prisma/migrations/[timestamp]_descriptive_name/migration.sql

# Apply to production
npx prisma migrate deploy
```

### 3. Adding Relationships

```prisma
model Order {
  id     String      @id @default(cuid())
  items  OrderItem[]  // One-to-many
}

model OrderItem {
  id       String @id @default(cuid())
  orderId  String
  order    Order  @relation(fields: [orderId], references: [id])
  
  @@index([orderId])
}
```

### 4. Optimizing Queries

**Add indexes for:**
- Foreign keys
- Frequently queried fields
- Sort/filter columns
- Composite unique constraints

```prisma
model Product {
  sku String @unique
  
  @@index([category, subcategory])  // Composite index
  @@index([createdAt(sort: Desc)])  // Sorted index
}
```

---

## Critical Rules

❌ **Never:**
- Modify migrations after they're applied
- Delete models without migration
- Change field types without migration
- Forget `@@schema("public")` annotation
- Skip `npx prisma generate` after schema changes

✅ **Always:**
- Run `npx prisma validate` before migrating
- Test migrations on development first
- Add indexes for foreign keys
- Use proper cascade delete rules
- Document complex relationships

---

## Prisma Commands Reference

```bash
# Development
npx prisma generate         # Regenerate client
npx prisma migrate dev      # Create & apply migration
npx prisma db push          # Push schema without migration (dev only)
npx prisma studio           # Open database GUI

# Production
npx prisma migrate deploy   # Apply migrations
npx prisma generate         # Regenerate client

# Validation
npx prisma validate         # Check schema syntax
npx prisma format           # Format schema file

# Debugging
npx prisma db pull          # Pull schema from database
npx prisma migrate status   # Check migration status
```

---

## Seeding Data

Create seed scripts in `/Users/eko3/limn-systems-enterprise/scripts/seed/`

```typescript
// scripts/seed/seed-feature.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  await prisma.feature.createMany({
    data: [
      { name: 'Feature 1', userId: 'user-id' },
      { name: 'Feature 2', userId: 'user-id' },
    ],
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

Run: `npx tsx scripts/seed/seed-feature.ts`

---

## Troubleshooting

**Error: "Can't reach database"**
→ Check DATABASE_URL in .env.local

**Error: "Migration failed"**
→ Check migration SQL, rollback if needed

**Error: "Type 'X' doesn't exist"**
→ Run `npx prisma generate`

**Schema drift detected**
→ Run `npm run schema:check`
