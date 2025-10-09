# Database Schema Mismatches - Test Suite Audit

**Date**: 2025-10-09
**Status**: ❌ CRITICAL - Tests written against assumed schema, NOT actual Supabase database

## Summary

After running `npx prisma db pull` and verifying actual Supabase database structure, we discovered **SIGNIFICANT mismatches** between test expectations and reality.

### Root Cause

Tests were written based on assumptions about what the schema *should* be, rather than verifying what it *actually is* in the production Supabase database.

## Schema Mismatches Found

### 1. **contacts** Table

**Test Expectations** ❌:
- `name` is required
- `email` has unique constraint  
- `status` field exists

**Actual Schema** ✅:
- NO required fields except auto-generated `id`
- ALL fields (`name`, `email`, `phone`, etc.) are nullable
- NO unique constraints on any field
- NO `status` field exists

**Impact**: 2 tests skipped in `60-database-validation-crm.spec.ts`

---

### 2. **partners** Table

**Test Expectations** ❌:
- `partner_name` field exists
- `partner_type` field exists
- `partner_code` field exists (with unique constraint)
- `is_verified` field exists
- Only `partner_name` and `partner_type` are required

**Actual Schema** ✅:
```
REQUIRED FIELDS:
- type (NOT partner_type)
- company_name (NOT partner_name)
- primary_contact
- primary_email
- primary_phone
- address_line1
- city
- postal_code
- country
- currency
- status (auto-default)
- portal_enabled (auto-default)

OPTIONAL FIELDS:
- business_name
- registration_number
- website
- partner_code (NOT unique)
- NO is_verified field
```

**Impact**: Complete rewrite of `67-database-validation-partners.spec.ts` required

---

### 3. **partner_contacts** Table

**Test Expectations** ❌:
- `contact_name` field exists
- `email` is nullable
- Only `partner_id` and `contact_name` are required

**Actual Schema** ✅:
```
REQUIRED FIELDS:
- partner_id
- name (NOT contact_name)
- role  
- email (REQUIRED, NOT nullable!)
- is_primary (boolean, required)
- is_qc (boolean, required)
- is_production (boolean, required)
- is_finance (boolean, required)
- active (boolean, required)

OPTIONAL FIELDS:
- phone
- mobile
- preferred_contact_method
```

**Impact**: All partner_contacts tests failing, complete rewrite required

---

### 4. **clients** (customers) Table

**Test Expectations** ❌:
- `billingAddress`, `billingCity`, `billingState`, `billingZip` fields exist

**Actual Schema** ✅ (TBD - needs verification):
- Likely uses `billing_address_line1`, `billing_city`, etc. (snake_case)

**Impact**: 3 tests failing in `60-database-validation-crm.spec.ts`

---

## Fix Strategy

### ✅ Completed:
1. Ran `npx prisma db pull --force` - introspected 291 models from actual database
2. Ran `npx prisma generate` - regenerated Prisma client with correct types
3. Created verification scripts to query actual database structure
4. Applied snake_case fixes (60+ field transformations)

### 🔄 In Progress:
1. Skip tests that validate non-existent fields/constraints (with explanatory comments)
2. Fix tests to use correct field names (snake_case)
3. Add all required fields to test data creation

### 📋 Next Steps:
1. Audit remaining test files: 61-production, 63-financials, 64-shipping, 65-design, 66-tasks
2. Create helper functions for test data generation (like `createPartnerData()`)
3. Re-run full database validation suite targeting 100% pass rate
4. Document schema in `SCHEMA-AUDIT-SUMMARY.md`

## Lessons Learned

**CRITICAL REQUIREMENT**: ALWAYS verify Prisma schema matches actual database BEFORE writing tests.

Proper workflow:
```bash
# 1. Introspect actual database
npx prisma db pull --force

# 2. Regenerate Prisma client
npx prisma generate

# 3. Verify schema
npx ts-node scripts/verify-database-schema.ts

# 4. THEN write tests based on actual schema
```

**NEVER** write tests based on assumptions about what the schema should be.

---

**Generated**: 2025-10-09
**Tool**: Claude Code + Prisma introspection + Supabase direct SQL queries
