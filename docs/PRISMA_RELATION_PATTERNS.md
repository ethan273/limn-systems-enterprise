# Prisma Relation Naming Patterns - Quick Reference Guide

**Last Updated:** October 3, 2025
**Purpose:** Quick reference for Prisma-generated relation names to prevent TypeScript errors

---

## 🎯 The Golden Rule

**When a table has multiple foreign keys pointing to the same parent table, Prisma generates unique relation names following this pattern:**

```
{child_table}_{foreign_key_column}To{parent_table}
```

**You CANNOT use generic relation names like `creator`, `author`, `user`, etc.**

---

## 📋 Common Relation Patterns in Our Codebase

### 1. Shop Drawings → Users (Multiple Relations)

**Table:** `shop_drawings`
**Foreign Keys to `users` table:**
- `created_by`
- `limn_approved_by`
- `designer_approved_by`

**❌ WRONG:**
```typescript
include: {
  creator: true,              // ❌ Generic name - will fail
  limn_approver: true,        // ❌ Generic name - will fail
  designer_approver: true,    // ❌ Generic name - will fail
}
```

**✅ CORRECT:**
```typescript
include: {
  users_shop_drawings_created_byTousers: true,
  users_shop_drawings_limn_approved_byTousers: true,
  users_shop_drawings_designer_approved_byTousers: true,
}
```

### 2. Shop Drawing Comments → Users (Multiple Relations)

**Table:** `shop_drawing_comments`
**Foreign Keys to `users` table:**
- `author_id`
- `resolved_by`

**❌ WRONG:**
```typescript
include: {
  author: true,     // ❌ Generic name - will fail
  resolver: true,   // ❌ Generic name - will fail
}
```

**✅ CORRECT:**
```typescript
include: {
  users_shop_drawing_comments_author_idTousers: true,
  users_shop_drawing_comments_resolved_byTousers: true,
}
```

### 3. Shop Drawings → Related Tables

**Table:** `shop_drawings`
**Relations:**
- One-to-many: `shop_drawing_versions`
- One-to-many: `shop_drawing_comments`
- One-to-many: `shop_drawing_approvals`

**❌ WRONG:**
```typescript
include: {
  versions: true,   // ❌ Generic name - will fail
  comments: true,   // ❌ Generic name - will fail
  approvals: true,  // ❌ Generic name - will fail
}
```

**✅ CORRECT:**
```typescript
include: {
  shop_drawing_versions: true,
  shop_drawing_comments: true,
  shop_drawing_approvals: true,
}
```

### 4. Prototypes → Users (Multiple Relations)

**Table:** `prototypes`
**Foreign Keys to `users` table:**
- `created_by`
- `assigned_to`

**✅ CORRECT:**
```typescript
include: {
  users_prototypes_created_byTousers: true,
  users_prototypes_assigned_toTousers: true,
}
```

### 5. Production Orders → Related Tables

**Table:** `production_orders`
**Foreign Key to `partners` table:**
- `factory_id` → `partners`

**❌ WRONG:**
```typescript
include: {
  factory: true,  // ❌ Generic name - will fail
}
```

**✅ CORRECT:**
```typescript
include: {
  partners: true,  // ✅ Prisma-generated relation name
}
```

### 6. Items → Collections

**Table:** `items`
**Foreign Key to `collections` table:**
- `collection_id`

**❌ WRONG:**
```typescript
include: {
  furniture_collections: true,  // ❌ Old name - will fail
}
```

**✅ CORRECT:**
```typescript
include: {
  collections: true,  // ✅ Current relation name
}
```

### 7. Plural Relation Names

**Rule:** One-to-many relations use plural names

**❌ WRONG:**
```typescript
include: {
  base_item: true,     // ❌ Singular - will fail
  prototype: true,     // ❌ Singular - will fail
}
```

**✅ CORRECT:**
```typescript
include: {
  base_items: true,    // ✅ Plural for one-to-many
  prototypes: true,    // ✅ Plural for one-to-many
}
```

---

## 🔍 How to Find the Correct Relation Name

### Method 1: Check Generated Prisma Client

```bash
# Open the generated Prisma types
cat node_modules/.prisma/client/index.d.ts | grep "include"

# Or search for specific table
cat node_modules/.prisma/client/index.d.ts | grep -A 50 "shop_drawings"
```

### Method 2: Use IDE Autocomplete

1. Start typing `include: {`
2. Press `Ctrl + Space` (or `Cmd + Space` on Mac)
3. IDE will show all available relation names
4. Select from autocomplete list

### Method 3: Check Prisma Schema

```bash
# Open schema file
code prisma/schema.prisma

# Find your model and look for relation names
# Example:
model shop_drawings {
  id String @id
  created_by String?
  users_shop_drawings_created_byTousers users? @relation("shop_drawings_created_byTousers", ...)
  #                                      ^^^^^ This is the relation name to use
}
```

### Method 4: Run Prisma Studio

```bash
npx prisma studio

# Explore relations visually
# Click on a record to see related data
# Prisma Studio uses correct relation names
```

---

## 🛠️ Common Errors & Quick Fixes

### Error 1: "Property 'creator' does not exist on type..."

**Cause:** Using generic relation name instead of Prisma-generated name

**Fix:**
```typescript
// Find the correct name:
// 1. Check node_modules/.prisma/client/index.d.ts
// 2. Use IDE autocomplete
// 3. Follow the naming pattern: {table}_{column}To{parent}

// Replace:
creator → users_shop_drawings_created_byTousers
```

### Error 2: "Type '...' is not assignable to type..."

**Cause:** Accessing relation object when only ID is selected

**Fix:**
```typescript
// ❌ BAD - Only ID selected, trying to access object
const items = await prisma.items.findMany({
  select: {
    id: true,
    collection_id: true  // Only ID, not the object
  }
});
console.log(items[0].collections.name);  // ❌ collections is undefined

// ✅ GOOD - Include the full relation
const items = await prisma.items.findMany({
  select: {
    id: true,
    collections: {       // Include full object
      select: { name: true }
    }
  }
});
console.log(items[0].collections.name);  // ✅ Works
```

### Error 3: "Cannot read properties of undefined (reading 'findMany')"

**Cause:** Database client missing model delegation

**Fix:**
```typescript
// In src/lib/db.ts, ensure all models are delegated:
export class DatabaseClient {
  // ... other code ...

  // Add missing delegation:
  documents = prisma.documents;
  shop_drawings = prisma.shop_drawings;
  // etc.
}
```

---

## 📚 Naming Pattern Examples

### Single Foreign Key to Parent

```typescript
// Table: orders
// FK: customer_id → customers

// Relation name: Just the parent table name
include: {
  customers: true  // ✅ Simple, no conflict
}
```

### Multiple Foreign Keys to Same Parent

```typescript
// Table: messages
// FK: sender_id → users
// FK: receiver_id → users

// Relation names: {table}_{fk}To{parent}
include: {
  users_messages_sender_idTousers: true,
  users_messages_receiver_idTousers: true,
}
```

### One-to-Many Relations

```typescript
// Table: users
// Has many: posts

// Relation name: Plural of child table
include: {
  posts: true  // ✅ Plural
}
```

### Many-to-One Relations

```typescript
// Table: posts
// Belongs to: users (via author_id)

// Relation name: Singular or Prisma-generated
include: {
  users_posts_author_idTousers: true  // If multiple user FKs
  // OR
  users: true  // If only one user FK
}
```

---

## ✅ Validation Checklist

Before committing code with Prisma queries:

- [ ] Run `npx prisma generate` to ensure client is up-to-date
- [ ] Use IDE autocomplete to verify relation names
- [ ] Check that include matches select (don't access undefined relations)
- [ ] Test query returns expected data
- [ ] Run `npm run lint` to catch TypeScript errors
- [ ] Check dev server for compilation errors

---

## 🚨 Red Flags

**If you see these patterns, they're likely WRONG:**

```typescript
// ❌ Generic user relation names
creator:
author:
user:
owner:
approver:

// ❌ Singular names for one-to-many
comment:    // Should be: comments
version:    // Should be: versions
item:       // Should be: items

// ❌ Old/deprecated table names
furniture_collections:  // Should be: collections
factory:               // Should be: partners
```

**If you see these patterns, they're likely CORRECT:**

```typescript
// ✅ Prisma-generated relation names with pattern
users_{table}_{column}Tousers:
shop_drawing_versions:
shop_drawing_comments:

// ✅ Plural names for one-to-many
collections:
prototypes:
base_items:

// ✅ Current table names
partners:  // Not "factories"
users:     // Not "user"
```

---

## 🔄 When Schema Changes

### After Adding New Foreign Key

1. **Update schema:**
   ```bash
   # Edit prisma/schema.prisma
   # Add new FK column
   ```

2. **Generate client:**
   ```bash
   npx prisma generate
   ```

3. **Check new relation names:**
   ```bash
   cat node_modules/.prisma/client/index.d.ts | grep "your_table"
   ```

4. **Update all queries** using the table to use new relation names

5. **Test thoroughly:**
   ```bash
   npm run lint
   npm run dev
   # Test affected pages/APIs
   ```

### After Renaming Foreign Key Column

1. **Update schema** with new column name

2. **Regenerate client** - relation name will change!

3. **Search codebase** for old relation name:
   ```bash
   grep -r "old_relation_name" src/
   ```

4. **Replace all occurrences** with new relation name

5. **Validate** all affected files

---

## 📖 Additional Resources

- [Prisma Relations Documentation](https://www.prisma.io/docs/concepts/components/prisma-schema/relations)
- [Generated Prisma Client Location](./node_modules/.prisma/client/index.d.ts)
- [TypeScript Error Resolution Guide](./TYPESCRIPT_ERROR_RESOLUTION_COMPLETE.md)

---

**Remember:** When in doubt, check the generated Prisma client types or use IDE autocomplete. Never guess relation names!

🔴 **CRITICAL:** Always run `npx prisma generate` after schema changes and verify relation names before coding.
