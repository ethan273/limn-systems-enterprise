# Priority Action Plan - Address Remaining System Gaps

**Date**: 2025-10-08
**Context**: Portal Module Control complete, now addressing known gaps

---

## 🎯 CRITICAL PRIORITY: Customer Portal Completion

**Status**: ❌ 90% MISSING (27.5% complete - only layout exists)
**Impact**: HIGH - Core user-facing functionality
**Effort**: 2-3 days

### Missing Pages (MUST BUILD):

#### 1. `/portal/customer` - Dashboard ⭐ START HERE
**File**: `src/app/portal/customer/page.tsx` (create new)

**Requirements**:
- Overview cards (active orders, pending payments, recent shipments)
- Timeline of recent activity
- Quick actions (view orders, make payment, upload documents)
- Welcome message with customer name

**API Needs**:
- `api.portal.getDashboardStats` - Summary statistics
- `api.portal.getRecentActivity` - Activity timeline
- Reuse existing: `getCustomerOrders`, `getCustomerInvoices`

**Estimated Time**: 4 hours

---

#### 2. `/portal/customer/orders` - Order Listing
**File**: `src/app/portal/customer/orders/page.tsx` (create new)

**Requirements**:
- DataTable with orders (order number, product, quantity, status, date)
- Filters: status, date range, product type
- Search by order number
- Click row to view order detail
- Export to PDF/CSV

**API Needs**:
- Use existing: `api.portal.getCustomerOrders`
- May need pagination enhancement

**Estimated Time**: 3 hours

---

#### 3. `/portal/customer/orders/[id]` - Order Detail
**File**: `src/app/portal/customer/orders/[id]/page.tsx` (create new)

**Requirements**:
- Order header (number, status, dates)
- Item details table
- Production timeline/milestones
- Related documents
- Payment status
- Shipping information
- Contact support button

**API Needs**:
- `api.portal.getOrderDetail` (create new or extend existing)
- Includes: items, payments, documents, shipping, timeline

**Estimated Time**: 5 hours

---

#### 4. `/portal/customer/shipping` - Shipping Status
**File**: `src/app/portal/customer/shipping/page.tsx` (create new)

**Requirements**:
- Active shipments table
- Tracking number links
- Estimated delivery dates
- Shipment status badges
- Map view (optional, nice-to-have)

**API Needs**:
- `api.portal.getCustomerShipments` (create new)
- Link to shipping_quotes, production_orders

**Estimated Time**: 3 hours

---

#### 5. `/portal/customer/financials` - Invoices & Payments
**File**: `src/app/portal/customer/financials/page.tsx` (create new)

**Requirements**:
- Invoice table (invoice #, date, amount, due date, status)
- Payment history
- Outstanding balance card
- QuickBooks payment button integration (already built!)
- Download invoice PDFs
- Payment receipts

**API Needs**:
- Use existing: `api.portal.getCustomerInvoices`
- Use existing: `api.portal.initiateQuickBooksPayment`
- `api.portal.getPaymentHistory` (may need to create)

**Estimated Time**: 4 hours

---

#### 6. `/portal/customer/documents` - Document Library
**File**: `src/app/portal/customer/documents/page.tsx` (create new)

**Requirements**:
- Document table (name, type, date, size)
- Categories: Contracts, Invoices, Shop Drawings, Photos, Other
- Upload button (if allowed by settings)
- Download/preview documents
- Search and filter

**API Needs**:
- `api.portal.getCustomerDocuments` (create new)
- Use existing file upload architecture (Supabase client-side)
- `api.portal.uploadDocument` (for metadata)

**Estimated Time**: 4 hours

---

#### 7. `/portal/customer/profile` - Customer Profile
**File**: `src/app/portal/customer/profile/page.tsx` (create new)

**Requirements**:
- Company information (read-only)
- Contact details (editable)
- Shipping addresses
- Billing addresses
- Notification preferences (email, SMS)
- Change password

**API Needs**:
- `api.portal.getCustomerProfile` (create new)
- `api.portal.updateContactInfo` (create new)
- `api.portal.updateNotificationPreferences` (may exist)

**Estimated Time**: 3 hours

---

### Customer Portal Summary

**Total Estimated Time**: 26 hours (~3-4 days)
**Priority Order**:
1. Dashboard (get something visible ASAP)
2. Orders listing + detail (core functionality)
3. Financials (payments are critical)
4. Shipping (users want to track)
5. Documents (important but lower urgency)
6. Profile (nice to have, lower priority)

---

## 🎯 HIGH PRIORITY: Detail Pages - Fix Missing/Broken

**Status**: ⚠️ Many exist but have edge cases
**Impact**: MEDIUM-HIGH - Admin usability
**Effort**: 1-2 days

### Pages to Audit & Fix:

#### 1. CRM Detail Pages
**Files to check**:
- `/src/app/crm/customers/[id]/page.tsx`
- `/src/app/crm/leads/[id]/page.tsx`
- `/src/app/crm/projects/[id]/page.tsx`
- `/src/app/crm/prospects/[id]/page.tsx`
- `/src/app/crm/contacts/[id]/page.tsx`

**Common Issues to Fix**:
- Missing fields after schema updates (production_start_date, shipped_date, etc.)
- Broken edit functionality
- Console errors on load
- Missing validation on forms
- Inconsistent styling (ensure using global CSS)

**Testing Checklist per Page**:
- [ ] Page loads without errors
- [ ] All data displays correctly
- [ ] Edit button opens edit mode
- [ ] Save persists changes
- [ ] Cancel reverts changes
- [ ] Delete shows confirmation
- [ ] Related data loads (orders, contacts, etc.)
- [ ] No console errors

**Estimated Time**: 8 hours (1 day)

---

#### 2. Production Detail Pages
**Files to check**:
- `/src/app/production/orders/[id]/page.tsx`
- `/src/app/production/shop-drawings/[id]/page.tsx`
- `/src/app/production/prototypes/[id]/page.tsx`
- `/src/app/production/qc/[id]/page.tsx`
- `/src/app/production/packing/[id]/page.tsx`

**Specific Fixes Needed**:
- Update to use new production_orders fields (production_start_date, etc.)
- Fix shop_drawings project relation (use production_orders.projects)
- Verify timeline displays correctly
- Test document attachments

**Estimated Time**: 6 hours

---

#### 3. Missing Edit Routes
**Files to create**:
- `/src/app/production/orders/[id]/edit/page.tsx` (if missing)
- `/src/app/crm/customers/[id]/edit/page.tsx` (if missing)
- Other edit routes as needed

**Pattern to Follow**:
```typescript
// Read existing detail page
// Copy data structure
// Add form validation with Zod
// Add tRPC mutation for update
// Add success/error handling
// Redirect on save
```

**Estimated Time**: 4 hours

---

### Detail Pages Summary

**Total Estimated Time**: 18 hours (~2 days)
**Priority**: Do this BEFORE building customer portal (foundation must be solid)

---

## 🎯 MEDIUM PRIORITY: Forms & Validation

**Status**: ⚠️ Most CRUD works, validation coverage varies
**Impact**: MEDIUM - Data integrity
**Effort**: 1 day

### Forms to Enhance:

1. **Add Comprehensive Zod Schemas**
   - Review all tRPC procedures
   - Ensure input validation is thorough
   - Add custom error messages
   - Validate relationships (foreign keys exist)

2. **Frontend Form Validation**
   - Use react-hook-form with Zod resolver
   - Display field-level errors
   - Prevent submission with errors
   - Add loading states during save

3. **Common Validation Rules**
   ```typescript
   // Email validation
   email: z.string().email('Invalid email address')

   // Phone validation
   phone: z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number')

   // Required fields
   company_name: z.string().min(1, 'Company name is required')

   // Positive numbers
   quantity: z.number().positive('Quantity must be positive')

   // Date ranges
   end_date: z.date().min(start_date, 'End date must be after start date')
   ```

**Estimated Time**: 8 hours

---

## 🎯 MEDIUM PRIORITY: File Upload Testing

**Status**: ⚠️ Architecture exists, not thoroughly tested
**Impact**: MEDIUM - Document management
**Effort**: 4 hours

### Testing Checklist:

1. **Upload Workflow**:
   - [ ] Select file (PDF, image, etc.)
   - [ ] Upload progress indicator
   - [ ] Success confirmation
   - [ ] File appears in document list
   - [ ] Metadata saved to database

2. **Edge Cases**:
   - [ ] Large files (>10MB)
   - [ ] Invalid file types
   - [ ] Upload errors (network, permissions)
   - [ ] Concurrent uploads
   - [ ] Duplicate file names

3. **Security**:
   - [ ] File type validation (client + server)
   - [ ] Size limits enforced
   - [ ] Malicious file detection
   - [ ] Access control (RLS in Supabase)

4. **Integration Points**:
   - [ ] Documents linked to customers
   - [ ] Documents linked to production orders
   - [ ] Documents linked to projects
   - [ ] Portal document upload (customer portal)

**Estimated Time**: 4 hours

---

## 🎯 LOW PRIORITY: Design Briefs Enhancement

**Status**: ⚠️ Basic implementation, limited testing
**Impact**: LOW - Nice to have
**Effort**: 1 day

**Improvements Needed**:
1. Add form validation
2. Test with real data
3. Add file attachments to briefs
4. Link briefs to projects
5. Add approval workflow

**Estimated Time**: 8 hours

---

## ❌ DEFER: Out of Scope (For Now)

These items are acknowledged but intentionally deferred:

### PWA Features
**Reason**: Requires production build, separate testing environment
**Timeline**: Post-launch, production testing phase

### Real-time Updates
**Reason**: Complex infrastructure, lower ROI
**Timeline**: Phase 2 enhancement (post-launch)

### Email/SMS Notifications
**Reason**: Infrastructure not implemented, external service needed
**Timeline**: Phase 2 enhancement (post-launch)

### Payment Integration (Stripe)
**Reason**: QuickBooks payment already implemented, Stripe is nice-to-have
**Timeline**: Future enhancement if needed

---

## 📊 OVERALL TIMELINE & EFFORT

### Week 1 (High Priority)
**Days 1-2**: Detail Pages Audit & Fixes (18 hours)
- Fix CRM detail pages
- Fix production detail pages
- Create missing edit routes
- Test all detail page functionality

**Days 3-5**: Customer Portal Core (26 hours)
- Build dashboard
- Build orders listing + detail
- Build financials page
- Build shipping page

### Week 2 (Medium Priority)
**Days 1-2**: Customer Portal Completion (10 hours)
- Build documents page
- Build profile page
- Test entire customer portal flow
- Fix any bugs found

**Day 3**: Forms & Validation Enhancement (8 hours)
- Add comprehensive Zod schemas
- Enhance frontend validation
- Test form submissions

**Day 4**: File Upload Testing (4 hours)
- Test upload workflow
- Test edge cases
- Fix any issues found

**Day 5**: Design Briefs & Polish (8 hours)
- Enhance design briefs
- Final QA pass
- Documentation updates

---

## 🚀 IMMEDIATE NEXT STEPS

### Step 1: Clean Up (15 minutes)
```bash
# Kill background processes (already attempted)
ps aux | grep playwright
# Manual cleanup if needed

# Verify dev server
curl -s http://localhost:3000 > /dev/null && echo "✅ Server running"
```

### Step 2: Detail Pages Audit (START HERE)

Create audit script:
```bash
# Create detail-pages-audit.md
# List all detail pages
# Test each one
# Document issues found
```

**Command**:
```bash
find src/app -name "[id]" -type d | grep -E "crm|production" > detail-pages-to-audit.txt
```

### Step 3: Fix First Detail Page

Pick one detail page (e.g., `/crm/customers/[id]`):
1. Open in browser
2. Check console for errors
3. Test all functionality
4. Fix any issues
5. Commit fix
6. Repeat for next page

---

## 📝 RECOMMENDED WORK ORDER

**Most Efficient Path**:

1. ✅ **Portal Module Control** - COMPLETE
2. 🔄 **Detail Pages Audit & Fix** - START NOW (foundation for everything else)
3. 🔄 **Customer Portal Dashboard** - Build basic version
4. 🔄 **Customer Portal Orders** - Core functionality
5. 🔄 **Customer Portal Financials** - Payment integration
6. 🔄 **Customer Portal Shipping** - Tracking functionality
7. 🔄 **Customer Portal Documents** - File management
8. 🔄 **Customer Portal Profile** - User preferences
9. 🔄 **Forms & Validation** - Data integrity
10. 🔄 **File Upload Testing** - Document management
11. 🔄 **Design Briefs Enhancement** - Polish

---

## 🎯 SUCCESS CRITERIA

**Customer Portal Completion**:
- [ ] All 7 pages built and functional
- [ ] Navigation filtered by module settings
- [ ] Real data displays correctly
- [ ] No console errors
- [ ] Mobile responsive
- [ ] Passes manual QA

**Detail Pages Fixed**:
- [ ] All detail pages load without errors
- [ ] Edit functionality works
- [ ] Data persists correctly
- [ ] Related data displays
- [ ] Consistent styling

**Forms & Validation**:
- [ ] All forms have Zod validation
- [ ] Error messages display correctly
- [ ] Cannot submit invalid data
- [ ] Loading states work

**File Upload**:
- [ ] Upload workflow tested
- [ ] Edge cases handled
- [ ] Security validated
- [ ] Integration points work

---

**TOTAL ESTIMATED EFFORT**: ~3-4 weeks full-time
**RECOMMENDED START**: Detail Pages Audit (today)
**HIGH-VALUE TARGET**: Customer Portal completion (this week)

🔴 **SERVER STATUS**: Development server running on http://localhost:3000
