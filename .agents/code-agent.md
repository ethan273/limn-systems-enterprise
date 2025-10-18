# Code Agent Template

**Purpose:** Generate new features, components, API routes, and modules

---

## Initial Setup

When starting a conversation for code generation:

```
I'm working on Limn Systems Enterprise. 

Please read these files first:
1. /Users/eko3/limn-systems-enterprise/.agents/PROJECT-CONTEXT.md
2. /Users/eko3/limn-systems-enterprise/.agents/code-agent.md (this file)

I need help with: [DESCRIBE YOUR FEATURE]
```

---

## What This Agent Does

✅ Creates new React components following project patterns  
✅ Generates tRPC API routes with proper types  
✅ Writes Prisma schema additions/migrations  
✅ Creates form components with React Hook Form + Zod  
✅ Builds page layouts with proper loading states  
✅ Generates TypeScript types and interfaces  
✅ Writes tests alongside code  
✅ Follows project coding standards  

---

## Step-by-Step Workflow

### 1. Understand Requirements
Agent should ask:
- What module is this for? (CRM, production, design, etc.)
- What entities/data models are involved?
- Is this Create, Read, Update, Delete, or List?
- Who can access this? (admin, customer, designer, etc.)

### 2. Check Existing Patterns
Agent should examine:
```bash
# Find similar existing components
ls /Users/eko3/limn-systems-enterprise/src/components/[module]/

# Check tRPC routers for patterns
ls /Users/eko3/limn-systems-enterprise/src/server/routers/

# Review database schema
view /Users/eko3/limn-systems-enterprise/prisma/schema.prisma
```

### 3. Generate Code in Order

**Order matters!** Generate in this sequence:

1. **Database Schema** (if needed)
   - Add to `prisma/schema.prisma`
   - Create migration script

2. **TypeScript Types**
   - Add to `src/types/[module].ts`
   - Use Zod for validation schemas

3. **tRPC Router**
   - Create `src/server/routers/[feature].ts`
   - Add to main router

4. **React Components**
   - List view: `src/components/[module]/[Feature]List.tsx`
   - Form: `src/components/[module]/[Feature]Form.tsx`
   - Detail view: `src/components/[module]/[Feature]Detail.tsx`

5. **Page**
   - Create `src/app/[module]/[feature]/page.tsx`
   - Add to navigation if needed

6. **Tests**
   - Create `tests/[feature].spec.ts`

### 4. Verify Everything

Agent must run:
```bash
# Type check
npm run type-check

# Build check  
npm run build

# Lint
npm run lint
```

---

## Code Generation Templates

### New tRPC Router Example

```typescript
// src/server/routers/feature.ts
import { z } from 'zod';
import { router, protectedProcedure } from '@/server/trpc';
import { TRPCError } from '@trpc/server';

export const featureRouter = router({
  list: protectedProcedure
    .input(z.object({
      limit: z.number().min(1).max(100).default(50),
      offset: z.number().min(0).default(0),
    }))
    .query(async ({ ctx, input }) => {
      const items = await ctx.db.feature.findMany({
        take: input.limit,
        skip: input.offset,
        orderBy: { createdAt: 'desc' },
      });
      
      const total = await ctx.db.feature.count();
      
      return { items, total };
    }),

  getById: protectedProcedure
    .input(z.string())
    .query(async ({ ctx, input }) => {
      const item = await ctx.db.feature.findUnique({
        where: { id: input },
      });
      
      if (!item) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Feature not found',
        });
      }
      
      return item;
    }),

  create: protectedProcedure
    .input(z.object({
      name: z.string().min(1),
      description: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.feature.create({
        data: {
          ...input,
          userId: ctx.user.id,
        },
      });
    }),
});
```

### New Component Example

```typescript
// src/components/feature/FeatureList.tsx
'use client';

import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';

export function FeatureList() {
  const { data, isLoading } = api.feature.list.useQuery({ limit: 50 });

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-4">
      {data?.items.map((item) => (
        <div key={item.id} className="border rounded p-4">
          <h3 className="font-semibold">{item.name}</h3>
          <p className="text-muted-foreground">{item.description}</p>
        </div>
      ))}
    </div>
  );
}
```

---

## Checklist Before Claiming Done

- [ ] All files created in correct locations
- [ ] TypeScript compiles with 0 errors
- [ ] All imports resolve correctly  
- [ ] Code follows project patterns
- [ ] Proper error handling included
- [ ] Loading states handled
- [ ] Authentication/authorization checked
- [ ] Database queries use Prisma
- [ ] Tests written (if applicable)
- [ ] Verified with `npm run type-check`

---

## Common Patterns to Follow

**Form Validation:**
- Use Zod schemas
- Share schemas between client and server
- Validate on both ends

**Error Handling:**
- Use TRPCError for API errors
- Show user-friendly messages
- Log errors properly

**Data Fetching:**
- Use tRPC hooks (`useQuery`, `useMutation`)
- Handle loading/error states
- Optimize with proper pagination

**Styling:**
- Use Tailwind utilities
- Follow existing spacing patterns
- Use shadcn/ui components when possible
