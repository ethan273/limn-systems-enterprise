# NEXT PHASE PLAN - Systematic Completion
**Created**: October 8, 2025
**Current Status**: Customer Portal 100% Complete + Test Data Ready
**Remaining Work**: ~120 hours of systematic fixes and builds

---

## 🎯 PHASE COMPLETE: Customer Portal Build

### ✅ Accomplished This Session
1. **Customer Portal**: 6/6 pages complete with full API (16 procedures)
2. **Test Data**: Working seed script executed successfully
3. **SEKO Integration**: 90% complete (functional)
4. **Documentation**: Comprehensive reports created

### 📊 Current State
- Customer Portal: **100%** ✅
- Designer Portal: **100%** ✅
- Factory Portal: **100%** ✅
- Test Data: **Available** ✅
- Detail Pages: **Need Testing** ⚠️
- Edit/New Pages: **Missing** ❌

---

## 🚀 NEXT PHASE: Systematic Completion (2-3 weeks)

### WEEK 1: Detail Page Testing & Fixes (40 hours)

#### Day 1-2: CRM Detail Pages (5 pages, 16 hours)
**Files to Test:**
- `/src/app/crm/customers/[id]/page.tsx`
- `/src/app/crm/leads/[id]/page.tsx`
- `/src/app/crm/projects/[id]/page.tsx`
- `/src/app/crm/prospects/[id]/page.tsx`
- `/src/app/crm/contacts/[id]/page.tsx`

**Test Steps:**
1. Open dev server: `http://localhost:3000`
2. Navigate to each CRM list page
3. Click into detail page
4. Verify data displays correctly
5. Check for console errors
6. Fix any UI/data issues found

**Common Issues to Fix:**
- Missing null checks
- Broken relationships (foreign keys)
- Empty states not showing
- Date formatting errors
- Permission checks missing

#### Day 3-4: Production Module Detail Pages (10 pages, 16 hours)
**Modules**: Production orders, invoices, shipments, quality checks

**Approach**: Same as CRM pages above

#### Day 5: Products & Collections (5 pages, 8 hours)
**Files**: Product catalog, collections, concepts detail pages

---

### WEEK 2: Missing Edit/New Pages (40 hours)

#### Priority 1: CRM Forms (20 hours)
**Build These Pages:**

1. `/src/app/crm/customers/new/page.tsx` - New customer form
2. `/src/app/crm/customers/[id]/edit/page.tsx` - Edit customer
3. `/src/app/crm/leads/new/page.tsx` - New lead form
4. `/src/app/crm/leads/[id]/edit/page.tsx` - Edit lead
5. `/src/app/crm/contacts/new/page.tsx` - New contact form
6. `/src/app/crm/contacts/[id]/edit/page.tsx` - Edit contact

**Pattern to Follow:**
```typescript
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function CustomerNewPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
  });

  const createMutation = api.customers.create.useMutation({
    onSuccess: (data) => {
      router.push(`/crm/customers/${data.id}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  return (
    <div className="page-container">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="name">Name *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({...formData, name: e.target.value})}
            required
          />
        </div>
        {/* Add more fields */}
        <Button type="submit" disabled={createMutation.isPending}>
          Create Customer
        </Button>
      </form>
    </div>
  );
}
```

#### Priority 2: Product Forms (20 hours)
**Build These Pages:**

1. `/src/app/products/catalog/new/page.tsx` - New catalog item
2. `/src/app/products/catalog/[id]/edit/page.tsx` - Edit item
3. `/src/app/products/collections/new/page.tsx` - New collection
4. `/src/app/products/collections/[id]/edit/page.tsx` - Edit collection
5. `/src/app/products/concepts/new/page.tsx` - New concept
6. `/src/app/products/concepts/[id]/edit/page.tsx` - Edit concept

---

### WEEK 3: Final Fixes & QA (40 hours)

#### Day 1-2: Broken Page Fixes (16 hours)
**From FUNCTIONALITY-STATUS-REPORT.md:**
- Pages with console errors
- Pages with broken relationships
- Pages missing permission checks
- Pages with TypeScript errors

**Systematic Approach:**
1. Run `npm run type-check` - fix all TypeScript errors
2. Run `npm run lint` - fix all ESLint warnings
3. Browse each module manually - fix console errors
4. Test all CRUD operations - fix broken mutations

#### Day 3: SEKO Admin UI (Optional, 8 hours)
**If needed:**
- Create `/src/app/admin/integrations/seko/page.tsx`
- Create `/src/server/api/routers/seko.ts`
- Add seko_settings CRUD operations
- Test connection functionality

#### Day 4-5: Full QA Pass (16 hours)
1. Run all playwright tests: `npx playwright test --workers=2`
2. Manual testing checklist:
   - Test all portal pages
   - Test all CRM pages
   - Test all production pages
   - Test all product pages
   - Verify permissions work
   - Check mobile responsiveness
3. Fix any issues found
4. Final documentation update

---

## 🛠️ TECHNICAL APPROACH

### For Detail Page Fixes

**Step 1: Read the page file**
```bash
# Example
cat src/app/crm/customers/[id]/page.tsx
```

**Step 2: Identify issues**
- Missing null/undefined checks
- Incorrect API calls
- Broken relationships
- Missing error handling

**Step 3: Fix systematically**
```typescript
// BAD
<p>{customer.name}</p>

// GOOD
<p>{customer?.name || '—'}</p>

// BAD
const { data } = api.customers.get.useQuery(id);

// GOOD
const { data, isLoading, error } = api.customers.get.useQuery(
  { id },
  { enabled: !!id }
);

if (isLoading) return <LoadingState />;
if (error) return <ErrorState error={error.message} />;
if (!data) return <EmptyState />;
```

### For Edit/New Pages

**Step 1: Check if API procedures exist**
```typescript
// Look in src/server/api/routers/*.ts
// Need: create, update procedures
```

**Step 2: Use component library**
- Input, Label, Button from @/components/ui
- Form validation with react-hook-form
- Error handling with try/catch

**Step 3: Follow existing patterns**
- Look at `/src/app/portal/profile/page.tsx` for form example
- Use same styling classes (page-container, etc.)
- Implement proper loading/error states

---

## 📋 TESTING CHECKLIST

### Before Starting Next Phase

- [x] Customer portal working with test data
- [x] Dev server running on http://localhost:3000
- [x] Test accounts available
- [ ] All detail pages manually tested
- [ ] All edit/new pages built
- [ ] All broken pages fixed
- [ ] Full test suite passing

### After Each Feature

- [ ] No TypeScript errors (`npm run type-check`)
- [ ] No ESLint errors (`npm run lint`)
- [ ] No console errors in browser
- [ ] Data displays correctly
- [ ] Forms validate properly
- [ ] CRUD operations work
- [ ] Permissions enforced
- [ ] Mobile responsive

---

## 🚨 COMMON PITFALLS & SOLUTIONS

### Issue 1: "Property X does not exist on type Y"
**Solution**: Add null checks and optional chaining
```typescript
// BAD
order.customer.name

// GOOD
order?.customer?.name || 'Unknown'
```

### Issue 2: API procedure not found
**Solution**: Check router exports in `/src/server/api/root.ts`
```typescript
export const appRouter = createTRPCRouter({
  customers: customersRouter,
  // Make sure all routers are registered
});
```

### Issue 3: Form doesn't submit
**Solution**: Check mutation and error handling
```typescript
const mutation = api.customers.create.useMutation({
  onSuccess: (data) => router.push(`/crm/customers/${data.id}`),
  onError: (error) => console.error('Failed:', error.message),
});
```

### Issue 4: Page shows "Not Found"
**Solution**: Check route structure and params
```typescript
// For /crm/customers/[id]/page.tsx
export default function CustomerDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params); // Next.js 15 async params
  // ...
}
```

---

## 📊 PROGRESS TRACKING

### Detail Pages (30 total)
- [ ] CRM: customers, leads, projects, prospects, contacts (5)
- [ ] Production: orders, invoices, shipments, quality (4)
- [ ] Products: catalog, collections, concepts, materials (4)
- [ ] Financials: invoices, payments, estimates (3)
- [ ] Admin: users, permissions, roles, analytics (4)
- [ ] Partners: factories, designers detail pages (2)
- [ ] Others: various module detail pages (8)

### Edit/New Pages (14 total)
- [ ] CRM: customers, leads, contacts (6 pages)
- [ ] Products: catalog, collections, concepts (6 pages)
- [ ] Partners: factories, designers (2 pages)

### Broken Pages
- [ ] Run type-check and fix all errors
- [ ] Run lint and fix all warnings
- [ ] Manual browser testing for console errors
- [ ] Fix broken relationships and permissions

---

## 🎯 SUCCESS CRITERIA

### Week 1 Complete
- [ ] All 30 detail pages manually tested
- [ ] All critical issues fixed
- [ ] No console errors on detail pages
- [ ] Data displays correctly everywhere

### Week 2 Complete
- [ ] All 14 edit/new pages built
- [ ] Forms validate properly
- [ ] CRUD operations work end-to-end
- [ ] Proper error handling everywhere

### Week 3 Complete
- [ ] Zero TypeScript errors
- [ ] Zero ESLint warnings
- [ ] All playwright tests passing
- [ ] Manual QA complete
- [ ] Production deployment ready

---

## 💡 RECOMMENDATIONS

### For Maximum Efficiency

1. **Use Task tool for parallel work:**
   ```
   Launch 3 agents simultaneously:
   - Agent 1: CRM detail pages (10 pages)
   - Agent 2: Production detail pages (10 pages)
   - Agent 3: Product detail pages (10 pages)
   ```

2. **Follow systematic approach:**
   - Test → Identify issues → Fix → Verify
   - Don't skip ahead before completing previous step
   - Document any blockers immediately

3. **Leverage existing patterns:**
   - Copy working pages as templates
   - Use component library consistently
   - Follow established naming conventions

4. **Test incrementally:**
   - Test after each fix
   - Don't batch multiple changes
   - Verify in browser, not just type-check

---

## 📞 HANDOFF INFORMATION

### Current Session Results
- **Portal Build**: 100% complete
- **Test Data**: Available and working
- **Documentation**: Comprehensive
- **Server**: Running on http://localhost:3000

### For Next Developer
1. Review `FINAL-BUILD-REPORT.md` for complete status
2. Test customer portal with provided accounts
3. Follow this document for systematic completion
4. Use Task tool for parallel development
5. Estimated 2-3 weeks to 100% completion

### Key Files
- Portal pages: `/src/app/portal/`
- Portal API: `/src/server/api/routers/portal.ts`
- Seed script: `/scripts/seed-portal-test-data.ts`
- Documentation: `/FINAL-BUILD-REPORT.md`

---

**Status**: Ready for Next Phase
**Estimated Completion**: 2-3 weeks with parallel development
**Immediate Next Step**: Test CRM detail pages systematically

🔴 **SERVER STATUS**: Development server running on http://localhost:3000
