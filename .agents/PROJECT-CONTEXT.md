# Limn Systems Enterprise - Project Context for Agents

**READ THIS FIRST when working on this project**

---

## Project Overview

**Type:** Enterprise furniture manufacturing ERP system  
**Tech Stack:** Next.js 15.5.4 + TypeScript 5.7.3 + Supabase + Prisma + tRPC  
**Status:** Late development, approaching production  
**Location:** `/Users/eko3/limn-systems-enterprise/`

---

## 🚨 PRIME DIRECTIVE: NO SHORTCUTS

Before doing ANYTHING, understand:
- **Quality over speed** - always
- **No assumptions** - verify everything
- **No shortcuts** - build permanent solutions
- **Complete verification** - before claiming done

Full standards: `.claude/claude.md`

---

## Architecture Quick Reference

### Directory Structure
```
src/
├── app/                  # Next.js App Router pages
│   ├── admin/           # Admin portal
│   ├── crm/             # CRM module (contacts, leads, customers)
│   ├── production/      # Manufacturing orders
│   ├── design/          # Design management
│   ├── products/        # Product catalog
│   ├── shipping/        # Logistics
│   ├── financials/      # Finance/invoicing
│   ├── tasks/           # Task management
│   ├── partners/        # Partner management
│   └── portal/          # Multi-portal (customer, designer, factory, QC)
├── components/          # React components
├── server/              # tRPC routers and server logic
├── lib/                 # Utilities, configs
└── types/               # TypeScript types

prisma/
├── schema.prisma        # Main database schema (7,387 lines!)
├── migrations/          # Database migrations
└── seeds/              # Test data generators

tests/
├── *.spec.ts           # 100+ Playwright E2E tests
└── unit/               # Unit tests
```

### Tech Stack Details

**Frontend:**
- Next.js 15.5.4 with App Router
- React 18.3.1
- TypeScript 5.7.3
- Tailwind CSS + Radix UI
- Fabric.js (for flipbook canvas)

**Backend:**
- tRPC 11.5.1 (type-safe APIs)
- Prisma 5.22.0 (ORM)
- Supabase (PostgreSQL + Auth + Realtime)
- Next.js API routes

**Key Libraries:**
- React Hook Form + Zod (forms/validation)
- TanStack Query (data fetching)
- Zustand (state management)
- date-fns (date handling)

---

## Database Architecture

**Size:** 7,387 lines of Prisma schema  
**Schemas:** `auth`, `public`, `flipbook`  
**Key Tables:**
- CRM: contacts, customers, leads
- Production: production_orders, order_items
- Design: materials, material_collections
- Products: products, skus
- Shared: user_profiles, tasks, notifications

**Important:** Always use Prisma for DB access, never raw SQL unless necessary

---

## Coding Patterns & Standards

### File Naming
- Components: `PascalCase.tsx`
- Pages: `page.tsx` (Next.js convention)
- Utils: `camelCase.ts`
- Types: `types.ts` or `schema.ts`

### Component Pattern
```typescript
// src/components/[module]/ComponentName.tsx
'use client'; // Only if needs client-side features

import { useState } from 'react';
import { Button } from '@/components/ui/button';

interface ComponentNameProps {
  // Props typed explicitly
}

export function ComponentName({ ...props }: ComponentNameProps) {
  // Implementation
}
```

### tRPC Router Pattern
```typescript
// src/server/routers/[module].ts
import { z } from 'zod';
import { router, protectedProcedure } from '@/server/trpc';

export const moduleRouter = router({
  list: protectedProcedure
    .input(z.object({ limit: z.number().optional() }))
    .query(async ({ ctx, input }) => {
      // Implementation with ctx.db (Prisma client)
    }),
  
  create: protectedProcedure
    .input(z.object({ /* schema */ }))
    .mutation(async ({ ctx, input }) => {
      // Implementation
    }),
});
```

### Page Pattern
```typescript
// src/app/[module]/page.tsx
import { Suspense } from 'react';
import { ModuleList } from '@/components/module/ModuleList';

export default async function ModulePage() {
  return (
    <div className="container py-6">
      <h1 className="text-3xl font-bold mb-6">Module Title</h1>
      <Suspense fallback={<div>Loading...</div>}>
        <ModuleList />
      </Suspense>
    </div>
  );
}
```

---

## Critical Commands

### Before ANY commit
```bash
npm run type-check   # MUST show 0 errors
npm run lint         # MUST pass
npm run build        # MUST succeed
```

### Pre-deployment
```bash
./scripts/pre-deploy-check.sh  # MUST pass completely
```

### Development
```bash
npm run dev          # Start dev server (port 3000)
npm run test:e2e     # Run Playwright tests
npx prisma studio    # View/edit database
```

---

## Common Locations

**Environment:** `.env.local` (never commit!)  
**Database URL:** Check `.env.local` → `DATABASE_URL`  
**Supabase:** Check `.env.local` → `NEXT_PUBLIC_SUPABASE_URL`  
**Prime Directive:** `.claude/claude.md` (READ THIS!)  
**Main README:** `README.md`

---

## What NOT to Do

❌ Never commit .env files  
❌ Never skip type-checking  
❌ Never use `any` type  
❌ Never ignore build errors  
❌ Never claim "done" without verification  
❌ Never make breaking changes without tests  
❌ Never use raw SQL (use Prisma)  
❌ Never hardcode credentials  

---

## Security Notes

- All API routes need authentication
- Use `protectedProcedure` in tRPC
- RLS (Row Level Security) enabled on database
- User context in `ctx.user` for auth
- Never expose service role keys
