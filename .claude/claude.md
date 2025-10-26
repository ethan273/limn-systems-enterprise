# Prime Directive for Claude Code

## 🚨 CRITICAL: NO SHORTCUTS EVER

**This is the most important rule. It overrides everything else.**

---

## 🔴 CRITICAL: Environment and Database Configuration

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

**Example:**
```bash
# Get dev URL
grep "DEV_DB_URL" production-credentials.env

# Get prod URL
grep "PROD_DB_URL" production-credentials.env
```

### Resend Email Service Configuration

**Purpose**: Transactional email service for production (signup confirmations, password resets, notifications)

**Environment Variables Required**:

```bash
# .env (Development)
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Vercel (Production) - Add via Vercel dashboard or CLI
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**Setup Instructions**:

1. **Add to Local .env**:
```bash
# Open .env file
nano .env

# Add this line:
RESEND_API_KEY=re_your_actual_api_key_here

# Save: Ctrl+X, then Y, then Enter
```

2. **Add to Vercel**:
```bash
# Option 1: Via Vercel CLI
vercel env add RESEND_API_KEY

# Option 2: Via Vercel Dashboard
# 1. Go to project settings → Environment Variables
# 2. Add new variable:
#    - Name: RESEND_API_KEY
#    - Value: re_your_actual_api_key_here
#    - Environment: Production, Preview, Development (select all)
```

**API Key Format**:
- Starts with `re_`
- Example: `re_123abc456def789ghi012jkl345mno678`
- Get from: https://resend.com/api-keys

**Verification**:
```bash
# Check if variable is set
grep "RESEND_API_KEY" .env

# Should output:
# RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**Security Notes**:
- ✅ API key is in `.env` (already gitignored)
- ✅ Never commit API keys to git
- ✅ Rotate keys if exposed
- ✅ Use separate keys for dev/staging/prod if needed

**Status**: Ready for configuration (October 22, 2025)

---

## 🔴 CRITICAL: Database/Prisma Schema Synchronization

**MANDATORY REQUIREMENT - Prime Directive Compliance**

### Overview

The Prisma schema **MUST** be 100% synchronized with the actual PostgreSQL database at all times. Code references to database tables that don't exist will cause **runtime crashes**.

**Current State**: 289 models (verified 2025-10-22)

### The Synchronization Problem

**Issue**: Prisma schema can reference tables/models that don't exist in the actual database, causing:
- Runtime crashes when code tries to access missing tables
- TypeScript compilation success but production failures
- Silent failures in development that only appear in production

**Example from Oct 22, 2025**:
- Prisma schema had 289 models
- Database only had 285 tables
- 4 models referenced non-existent tables:
  - `analytics_events` - Used in flipbooks.ts:422
  - `share_link_views` - Used in flipbooks.ts:1280
  - `ai_generation_queue` - Referenced but never used
  - `templates` - Referenced but never used

### Verification Process (Run This Regularly)

#### Step 1: Check Prisma Schema Model Count
```bash
grep "^model " prisma/schema.prisma | wc -l
# Should return: 289 (as of 2025-10-22)
```

#### Step 2: Pull Database Schema
```bash
npx prisma db pull
# This introspects the actual database and updates schema.prisma
# Watch for lines removed - these are models that don't exist in DB
```

#### Step 3: Check for Discrepancies
```bash
git diff prisma/schema.prisma
# Look for removed models (lines starting with -)
# These models existed in code but not in database
```

#### Step 4: Find Code References
```bash
# Search for code using the missing tables
rg "ctx.db.analytics_events" --type ts
rg "ctx.db.share_link_views" --type ts
# etc for each missing model
```

### When Schema Misalignment is Detected

**STOP IMMEDIATELY** - This is a **CRITICAL BLOCKER**

You have two options:

#### Option A: Create Missing Tables (Complete the Feature)
Use this when the tables are needed for features that should work.

**Process**:
1. Create SQL migration file in `prisma/migrations/`
2. Include table definitions with:
   - Primary keys
   - Foreign keys
   - Indexes
   - Column types matching Prisma expectations
   - Any required enums
3. Apply migration to BOTH dev and prod databases
4. Verify with `npx prisma db pull`
5. Regenerate Prisma client: `npx prisma generate`
6. Run type-check: `npx tsc --noEmit`

**Example Migration** (from Oct 22, 2025):
```sql
-- Create enum first
CREATE TYPE public.analytics_event_type AS ENUM (
  'VIEW', 'PAGE_TURN', 'HOTSPOT_CLICK', 'SHARE', 'DOWNLOAD', 'ZOOM', 'SEARCH'
);

-- Create table
CREATE TABLE IF NOT EXISTS public.analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  flipbook_id UUID NOT NULL,
  event_type public.analytics_event_type NOT NULL,
  user_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT fk_analytics_events_flipbook
    FOREIGN KEY (flipbook_id)
    REFERENCES public.flipbooks(id)
    ON DELETE CASCADE
);

-- Create indexes
CREATE INDEX idx_analytics_events_flipbook ON public.analytics_events(flipbook_id);
```

#### Option B: Remove Broken Code (Disable the Feature)
Use this when the feature is incomplete or not needed.

**Process**:
1. Identify all code references to missing tables
2. Remove or comment out the broken code
3. Run `npx prisma db pull` to align schema
4. Regenerate: `npx prisma generate`
5. Verify: `npx tsc --noEmit`
6. Document disabled features

### Migration Application Script

**Always use this pattern** for applying migrations to both databases:

```typescript
// scripts/apply-migrations-sequential.ts
import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';

// Load both dev and prod credentials
const prodCredsPath = path.join(__dirname, '../production-credentials.env');
// ... parse credentials ...

const devUrl = process.env.DEV_DB_URL;
const prodUrl = process.env.PROD_DB_URL;

async function applyMigration(dbName: string, connectionUrl: string, migrationPath: string) {
  const pool = new Pool({
    connectionString: connectionUrl,
    ssl: { rejectUnauthorized: false },
  });

  const client = await pool.connect();
  const sql = fs.readFileSync(migrationPath, 'utf-8');

  try {
    // Parse SQL into statements (handle multi-line statements)
    const statements = parseSQL(sql);

    for (const statement of statements) {
      await client.query(statement);
    }

    console.log(`✅ Migration applied to ${dbName}`);
  } finally {
    client.release();
    await pool.end();
  }
}

// Apply to both databases
await applyMigration('DEV', devUrl, migrationPath);
await applyMigration('PROD', prodUrl, migrationPath);
```

### Post-Migration Verification Checklist

After applying migrations, **ALWAYS** run this checklist:

- [ ] `npx prisma db pull` - Should show "0 changes" or only expected changes
- [ ] `grep "^model " prisma/schema.prisma | wc -l` - Count matches expectations
- [ ] `npx prisma generate` - Should succeed without errors
- [ ] `npx tsc --noEmit` - Should show 0 TypeScript errors
- [ ] `npm run build` - Production build should succeed
- [ ] `git diff prisma/schema.prisma` - Review all schema changes
- [ ] Test affected features manually in dev

### Common Issues and Solutions

#### Issue: CREATE TYPE fails with "already exists"
**Solution**: Use DO blocks with IF NOT EXISTS checks:
```sql
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'my_enum_type') THEN
    CREATE TYPE my_enum_type AS ENUM ('VALUE1', 'VALUE2');
  END IF;
END$$;
```

**Better Solution**: Use simple CREATE TYPE (easier to parse):
```sql
CREATE TYPE public.my_enum_type AS ENUM ('VALUE1', 'VALUE2');
```
Then handle "already exists" errors in application code with try/catch.

#### Issue: Migration script can't parse DO blocks
**Solution**: Use single database connection (client) instead of pool for each statement.

#### Issue: Tables exist in one database but not the other
**Solution**: Always apply migrations to BOTH dev and prod in same run. Never apply to just one database.

#### Issue: Prisma pull removes models that should exist
**Solution**: The models don't exist in the database. Create migration to add them, or remove the code that references them.

### Documentation Requirements

When fixing schema misalignment:

1. **Document what was missing**: List all models that were in code but not in database
2. **Document the fix**: Which migrations were created and applied
3. **Document code changes**: Any code that was modified or removed
4. **Document verification**: Results of verification checklist
5. **Update SESSION-START-DOCUMENT.md**: Update model count if it changed

**Save documentation to**:
- `limn-systems-enterprise-docs/01-CURRENT/`
- Include in session completion reports
- Update CLAUDE.md if process changes

### Prevention

**To prevent schema drift**:

1. **Always apply migrations immediately after creation**
2. **Never commit code that references non-existent tables**
3. **Run `npx prisma db pull` regularly during development**
4. **Include schema verification in pre-commit hooks**
5. **Check model count in SESSION-START documentation**

### Schema Verification Command

Add this to your workflow:

```bash
# Quick schema alignment check
echo "Schema models: $(grep '^model ' prisma/schema.prisma | wc -l)"
npx prisma db pull --force && echo "✅ Schema aligned" || echo "❌ Schema sync failed"
npx prisma generate && echo "✅ Client generated" || echo "❌ Generation failed"
npx tsc --noEmit && echo "✅ TypeScript valid" || echo "❌ Type errors found"
```

### Warning Signs of Schema Drift

🚨 **IMMEDIATE INVESTIGATION REQUIRED** if you see:

1. Runtime errors mentioning "relation does not exist"
2. TypeScript compiles but production crashes
3. Prisma db pull removes models
4. New features fail in production but work in dev
5. Database introspection shows different model count than expected

### Historical Context

**October 22, 2025 - Schema Alignment Crisis**:
- Discovered 4-model discrepancy between code and database
- Code referenced non-existent tables causing runtime crashes
- Fixed by creating comprehensive migrations
- Applied migrations to both dev and prod databases
- Verified complete alignment (289 models)
- Created reusable migration application script
- Documented process in CLAUDE.md (this section)

**Lessons Learned**:
1. Schema drift happens when code is written before tables are created
2. TypeScript can't catch missing database tables
3. Verification must check actual database, not just Prisma schema
4. Migrations must be applied to both databases immediately
5. Documentation prevents recurrence

---

## 🔴 CRITICAL: E2E Testing Compliance Standard

**MANDATORY REQUIREMENT - Prime Directive Compliance**

### Overview

**Status**: ✅ 100% COMPLIANCE ACHIEVED (October 23, 2025)
**Total Tests**: 1247 (1208 non-skipped)
**Pass Rate**: 100% (0 permanent failures)
**Portal Tests**: 23/23 passing (100%)

### Test Run Requirements

1. **ALWAYS** achieve 100% E2E test pass rate before deployment
2. **ALWAYS** run full test suite: `npm run test:e2e`
3. **ALWAYS** save test logs to docs folder (NOT app root)
4. **NEVER** deploy with failing tests
5. **NEVER** skip tests to save time

### Test Log Organization

**CRITICAL**: All test logs, results, and artifacts MUST be saved to the documentation repository.

**Correct Location**:
```
limn-systems-enterprise-docs/
├── 01-TESTING/
│   ├── test-runs-YYYY-MM-DD/      # Test execution logs
│   ├── test-results-YYYY-MM-DD/   # Playwright artifacts
│   └── TESTING-INDEX.md           # Comprehensive index
```

**WRONG Location** (Violates Prime Directive):
```
limn-systems-enterprise/          # ❌ NEVER save logs here
├── *.log                         # ❌ Gitignored
├── screenshots/                  # ❌ Gitignored
├── test-results/                 # ❌ Gitignored
```

### Flaky Test Handling

**Definition**: Tests that fail intermittently but pass on retry

**Acceptable**:
- Tests that pass on retry (automatic retry enabled in Playwright)
- ~50 flaky tests identified as of Oct 23, 2025
- Root cause: Timing-related race conditions

**Not Acceptable**:
- Tests that fail permanently
- Tests that fail >50% of the time
- Tests without retry enabled

**Mitigation**:
- Increased Playwright timeouts (implemented)
- Retry mechanism enabled (implemented)
- Monitor flaky tests post-deployment
- Investigate and fix root causes incrementally

### Portal Testing Requirements

**Customer Portal** (`/portal/*`):
- Authentication flow ✅
- Dashboard display ✅
- Order management ✅
- Document access ✅
- Profile management ✅
- Notifications ✅
**Tests**: 23/23 passing (100%)

**Partner Portals** (`/partners/*`):
- Designer portal ✅
- Factory portal ✅
- Sourcing portal ✅
**Tests**: Included in main E2E suite

### Verification Commands

Before claiming E2E compliance, run these commands:

```bash
# Run full E2E test suite
npm run test:e2e

# Expected output:
# - Total tests: 1247
# - Non-skipped: 1208
# - Passing: 1208 (100%)
# - Failures: 0

# Verify test results
ls -la limn-systems-enterprise-docs/01-TESTING/test-runs-*/
```

### Historical Context

**October 23, 2025 - 100% E2E Compliance Achieved**:
- Phase 4 comprehensive fix campaign completed
- All permanent test failures resolved
- Portal tests: 100% pass rate
- Flaky tests: Mitigated with retry mechanism
- Test organization: All logs moved to docs repo

**Lessons Learned**:
1. Systematic debugging beats ad-hoc fixes
2. Test retries handle flaky tests effectively
3. Portal middleware crucial for access control
4. Test data seeding prevents validation errors
5. Documentation organization prevents clutter

**Reference**: See `limn-systems-enterprise-docs/01-TESTING/TESTING-INDEX.md` for complete test documentation.

**Status**: ✅ MANDATORY as of October 23, 2025
**Compliance**: 100% E2E pass rate required before deployment
**Violations**: Block deployment immediately

---

## 🔴 CRITICAL: Documentation Organization Standard

**MANDATORY REQUIREMENT - Prime Directive Compliance**

### Prime Directive Violation

**Problem**: Storing documentation, logs, and test artifacts in app root folder

**Impact**:
- Cluttered app repository
- Gitignore conflicts
- Lost documentation (files ignored and deleted)
- Confusion about what's essential vs. temporary
- Difficult code reviews (signal vs. noise)

### The One True Location

**ALL documentation, logs, test results, and analysis MUST go here**:

```
/Users/eko3/limn-systems-enterprise-docs/
```

**NEVER store these in app root**:
```
/Users/eko3/limn-systems-enterprise/  # ❌ Only source code here
```

### File Organization Rules

1. **Test Logs** → `01-TESTING/test-runs-YYYY-MM-DD/`
   - E2E test logs
   - Portal validation logs
   - Dev server logs
   - Test execution output

2. **Test Results** → `01-TESTING/test-results-YYYY-MM-DD/`
   - Playwright HTML reports
   - Trace files
   - Test artifacts
   - Coverage reports

3. **Analysis Documents** → `01-TESTING/phase-N-*/`
   - Fix plans
   - Progress reports
   - Test analysis
   - Decision documents

4. **Audit Reports** → `02-QUALITY-TOOLS/audit-reports/`
   - npm audit results
   - Security scans
   - Code quality reports

5. **Credentials** → `09-SECURITY/credentials/` (.gitignored)
   - production-credentials.env
   - API keys (development)
   - Service account files

6. **Screenshots** → `11-ASSETS/screenshots-YYYY-MM/`
   - Test screenshots
   - UI mockups
   - Visual regression artifacts

7. **Session Notes** → `00-SESSION-START/` or `06-SESSION-HISTORY/`
   - Session summaries
   - Completion reports
   - Progress tracking

### App Folder .gitignore Protection

**Implemented**: October 23, 2025

To prevent future clutter, these patterns are gitignored in app root:

```gitignore
# Test Logs (use docs folder instead)
*.log
*-test-*.log
*-validation-*.log
*-results-*.log

# Build Artifacts
tsconfig.tsbuildinfo
.DS_Store

# Test Output Folders (use docs folder instead)
screenshots/
test-results/
```

**Result**: Logs, screenshots, and test results accidentally created in app root will be ignored and not committed.

### Enforcement Rules

1. **ALWAYS** save test logs to `limn-systems-enterprise-docs/01-TESTING/`
2. **ALWAYS** save analysis docs to `limn-systems-enterprise-docs/01-CURRENT/`
3. **ALWAYS** save credentials to `limn-systems-enterprise-docs/09-SECURITY/credentials/`
4. **NEVER** commit logs to app repository
5. **NEVER** create documentation files in app root
6. **NEVER** use app root for temporary files

### Cleanup Completed

**Date**: October 23, 2025
**Files Moved**: 40+ log files, analysis documents, test results, screenshots
**Destination**: Organized structure in `limn-systems-enterprise-docs/`

**App Folder Now Contains Only**:
- Source code (`src/`)
- Tests (`tests/`) - no logs
- Configuration files
- Build scripts (`scripts/`)
- Dependencies (node_modules)
- Essential project files (package.json, tsconfig.json, etc.)

### Future Sessions

**CRITICAL**: All future Claude Code sessions MUST:
1. Save logs directly to docs folder
2. Save analysis directly to docs folder
3. Save test results directly to docs folder
4. Never use app root for documentation

### Reference Documentation

**Test Organization**: `limn-systems-enterprise-docs/01-TESTING/TESTING-INDEX.md`
**Cleanup Procedure**: See Session 8 completion report
**Folder Structure**: `limn-systems-enterprise-docs/README.md`

**Status**: ✅ MANDATORY as of October 23, 2025
**Compliance**: All documentation to docs repo
**Violations**: Will clutter app repo and violate Prime Directive

---

## Core Principles

### 1. NO SHORTCUTS
- There are **NO time constraints**
- **Quality is imperative**, not speed
- **Always build the best possible solutions** that are permanent and error-free
- Do not optimize for speed at the expense of correctness
- Do not skip verification steps
- Do not make assumptions without proof

### 2. COMPLETE VERIFICATION REQUIRED
- **Never claim "production ready"** without running `./scripts/pre-deploy-check.sh` successfully
- **Never claim "fixed"** without verifying the fix works
- **Never claim "tested"** without showing test results
- **All builds must complete successfully** - timeouts are blockers, not warnings

### 3. ZERO TOLERANCE FOR:
- ❌ Exposed credentials/secrets
- ❌ Type errors in production code
- ❌ Build failures
- ❌ Unverified claims
- ❌ "It should work" statements without proof
- ❌ Shortcuts that compromise quality

### 4. ALWAYS DO:
- ✅ Run complete verification before claiming success
- ✅ Investigate timeouts and errors thoroughly
- ✅ Scan for secrets in ALL files (including .md)
- ✅ Verify type safety with `npm run type-check`
- ✅ Verify production build with `npm run build`
- ✅ Test fixes manually when possible
- ✅ Be conservative, not optimistic

---

## Production Readiness Definition

An application is **NOT production ready** unless:

1. ✅ `./scripts/pre-deploy-check.sh` passes completely
2. ✅ `npm run build` succeeds (no timeout, no errors)
3. ✅ `npx tsc --noEmit` shows 0 errors
4. ✅ `npm audit` shows 0 critical/high vulnerabilities
5. ✅ No secrets exposed in any committed files
6. ✅ Production server starts and serves pages
7. ✅ Core user flows work in production mode

**Never claim production ready without proof of all 7 items above.**

---

## When Making Claims

### ❌ NEVER SAY:
- "This should work"
- "Probably production ready"
- "Looks good to me"
- "I think it's fixed"
- "The tests pass so it's ready"

### ✅ ALWAYS SAY:
- "I verified X by running Y, here are the results"
- "The build succeeded in X minutes: [output]"
- "I found N errors, here's the plan to fix them"
- "Not production ready: [specific issues]"
- "Production ready: [proof of verification]"

---

## Error Response Protocol

When encountering errors:

1. **STOP** - Do not proceed
2. **INVESTIGATE** - Find root cause
3. **FIX** - Implement proper solution (no workarounds)
4. **VERIFY** - Confirm fix works
5. **DOCUMENT** - Update documentation
6. **PREVENT** - Add checks to prevent recurrence

**Never ignore, skip, or work around errors.**

---

## Build Timeout Protocol

If `npm run build` times out:

1. **DO NOT** assume it's just slow
2. **DO NOT** skip to other checks
3. **DO** investigate why it's timing out
4. **DO** increase timeout and run to completion
5. **DO** treat timeout as a blocker
6. **DO** fix the underlying issue

---

## Security Protocol

### Secrets Detection

Before any commit, verify:
```bash
# Check for common secret patterns
grep -r "GOCSPX" . --exclude-dir=node_modules --exclude-dir=.next --exclude-dir=.git
grep -r "sk_live_\|pk_live_\|sk_test_\|pk_test_" . --exclude-dir=node_modules --exclude-dir=.next --exclude-dir=.git
grep -r "-----BEGIN PRIVATE KEY-----" . --exclude-dir=node_modules --exclude-dir=.next --exclude-dir=.git
grep -r "api_key.*=.*['\"][a-zA-Z0-9]{20,}" . --exclude-dir=node_modules --exclude-dir=.next --exclude-dir=.git
```

Check ALL files including:
- ✅ .md files
- ✅ .txt files
- ✅ Config files
- ✅ Documentation
- ✅ Session notes

### If Secrets Found:

1. **IMMEDIATELY** remove from repository
2. **IMMEDIATELY** add to .gitignore
3. **IMMEDIATELY** commit and push removal
4. **IMMEDIATELY** notify user to rotate credentials
5. **DOCUMENT** in security report

---

## Code Quality Standards

### TypeScript

- **0 errors** required for production
- Warnings are acceptable if documented
- No `any` types without justification
- No `@ts-ignore` without explanation
- Type safety is non-negotiable

### Testing

- Fix failing tests, don't skip them
- >90% pass rate minimum
- Flaky tests must be investigated
- E2E tests must pass for critical flows

### E2E Test Environment Compatibility (CRITICAL)

**Issue Discovered**: October 22, 2025
**Impact**: Blocked ALL 1257 E2E tests from executing

**Problem**: React Server Components features (like `cache()`) are **NOT** available in Playwright's Node.js test environment.

**Solution**: Always use conditional wrappers for React-specific features:

```typescript
// ❌ WRONG - Breaks E2E tests
import { cache } from 'react';
const myFunction = cache(async () => { /* ... */ });

// ✅ CORRECT - Works everywhere
let cacheWrapper: <T extends (...args: any[]) => any>(fn: T) => T;
if (typeof require !== 'undefined') {
  try {
    const react = require('react');
    if (react && typeof react.cache === 'function') {
      cacheWrapper = react.cache;  // Use in production
    } else {
      cacheWrapper = <T extends (...args: any[]) => any>(fn: T): T => fn;  // Pass-through
    }
  } catch {
    cacheWrapper = <T extends (...args: any[]) => any>(fn: T): T => fn;
  }
} else {
  cacheWrapper = <T extends (...args: any[]) => any>(fn: T): T => fn;
}

const myFunction = cacheWrapper(async () => { /* ... */ });
```

**When to Use This Pattern**:
- React `cache()` function
- React Server Components features
- Any Next.js-specific runtime features used in code imported by tests

**Reference**: `/limn-systems-enterprise-docs/01-CURRENT/PRODUCTION-READINESS-2025/E2E-TESTS-CRITICAL-FIX-2025-10-22.md`

**Status**: ✅ Fixed as of commit `ca9ce7c` (October 22, 2025)

### RLS Security Testing (CRITICAL)

**Implemented**: October 22, 2025 (Phase 1.1)
**Impact**: Validates multi-tenant data isolation and payment workflow security

**Pattern**: Always use proper test infrastructure with setup/cleanup hooks

```typescript
// ✅ CORRECT RLS Test Pattern
describe('Row Level Security Tests', () => {
  // Test data variables
  let testCustomerA: { id: string; email: string; name: string };
  let testCustomerB: { id: string; email: string; name: string };
  let testProjectA: { id: string; customer_id: string; name: string };
  let testProjectB: { id: string; customer_id: string; name: string };
  let testDataCreated = false;

  // Setup hook - Create isolated test data
  beforeAll(async () => {
    try {
      // Create unique test customers with timestamp to avoid conflicts
      const customerA = await prisma.customers.create({
        data: {
          name: 'Test Customer A (RLS)',
          email: `rls-test-customer-a-${Date.now()}@test.com`,
          status: 'active',
          company: 'Test Company A',
        },
      });

      testCustomerA = {
        id: customerA.id,
        email: customerA.email || '',
        name: customerA.name,
      };

      // Similar for Customer B...
      testDataCreated = true;
    } catch (error) {
      console.error('[RLS Test Setup] Failed to create test data:', error);
      testDataCreated = false;
    }
  });

  // Cleanup hook - Remove test data
  afterAll(async () => {
    if (!testDataCreated) return;

    try {
      // Delete in reverse dependency order
      await prisma.projects.deleteMany({ where: { id: testProjectA.id } });
      await prisma.customers.deleteMany({ where: { id: testCustomerA.id } });
      await prisma.$disconnect();
    } catch (error) {
      console.error('[RLS Test Cleanup] Failed to cleanup:', error);
    }
  });

  // Test implementation - Relationship-based filtering
  it('should filter data by customer_id via project relationship', async () => {
    if (!testDataCreated) {
      console.warn('[RLS Test] Skipping - test data not created');
      return;
    }

    // Create test record for Customer A
    const recordA = await prisma.production_orders.create({
      data: {
        order_number: `RLS-TEST-${Date.now()}`,
        project_id: testProjectA.id,
        product_type: 'Test Product',
        item_name: 'Test Item',
        quantity: 100,
        unit_price: 10.00,
        total_cost: 1000.00,
        status: 'awaiting_deposit',
      },
    });

    // Query with relationship filter (simulates RLS)
    const recordsForCustomerA = await prisma.production_orders.findMany({
      where: {
        projects: {
          customer_id: testCustomerA.id,
        },
      },
      include: {
        projects: {
          select: { customer_id: true },
        },
      },
    });

    // Verify isolation
    expect(recordsForCustomerA.length).toBeGreaterThanOrEqual(1);
    recordsForCustomerA.forEach((record) => {
      expect(record.projects?.customer_id).toBe(testCustomerA.id);
    });

    // Cleanup
    await prisma.production_orders.deleteMany({
      where: { id: recordA.id },
    });
  });
});
```

**Key RLS Test Patterns**:

1. **Test Data Isolation**
   - Use unique timestamps in test data (`${Date.now()}`)
   - Create complete customer → project → resource hierarchy
   - Always clean up test data in `afterAll` hook

2. **Relationship-Based Filtering**
   - Filter via `projects.customer_id` for multi-tenant tables
   - Use `include` to verify relationship integrity
   - Test both positive (can see own data) and negative (can't see others' data)

3. **Payment Workflow Gates**
   - Verify deposit required before production starts
   - Verify final payment required before shipping
   - Test both blocking conditions and success paths

4. **Graceful Degradation**
   - Check `testDataCreated` flag before running tests
   - Skip tests if setup fails (don't fail the suite)
   - Log setup/cleanup failures for debugging

**Critical Test Cases** (From Phase 1.1):
1. ✅ Customer data isolation (cross-tenant access prevention)
2. ✅ Production orders filtering by customer_id via project
3. ✅ Shipments filtering by customer_id via project
4. ✅ Documents filtering by customer_id (direct)
5. ✅ Deposit payment gate (blocks production without deposit)
6. ✅ Final payment gate (blocks shipping without payment)

**Testing Framework**: Vitest (not Jest)
- Use Vitest globals: `describe`, `it`, `expect`, `beforeAll`, `afterAll`
- Do NOT import from `@jest/globals`

**Reference**: `/limn-systems-enterprise-docs/01-CURRENT/PRODUCTION-READINESS-2025/PHASE-1.1-RLS-TESTS-COMPLETION-2025-10-22.md`

**Status**: ✅ Implemented as of commit `96c896d` (October 22, 2025)
**Test File**: `/src/__tests__/server/api/data-isolation.test.ts`
**Results**: 6/6 tests passing (100%)

### Code Structure

- No commented-out code blocks >10 lines
- No console.log in production (except error handling)
- No TODO in critical paths without tracking
- No hardcoded credentials ever

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

**Why These Fail:**
- ❌ Direct Prisma causes PostgreSQL authentication failures
- ❌ Missing ctx causes runtime errors
- ❌ Supabase direct queries bypass type safety and are inconsistent
- ❌ Multiple database access patterns = maintenance nightmare

### Enforcement Rules

1. **ALWAYS** use `ctx.db` for database operations in tRPC routers
2. **ALWAYS** include `ctx` parameter in query/mutation handlers: `async ({ input, ctx })`
3. **NEVER** import direct Prisma client (`prisma`) in router files
4. **NEVER** use Supabase client directly in router files
5. **ALWAYS** verify table exists in DatabaseClient before using (check src/lib/db.ts)

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

// UPSERT (if table supports it - check db.ts)
const upserted = await ctx.db.my_table.upsert({
  where: { unique_field: 'value' },
  create: { field1: 'value', field2: 123 },
  update: { field2: 456 },
});

// DELETE
await ctx.db.my_table.delete({
  where: { id: 'some-id' },
});

// DELETE MANY
await ctx.db.my_table.deleteMany({
  where: { status: 'archived' },
});

// CREATE MANY
await ctx.db.my_table.createMany({
  data: [
    { field1: 'value1' },
    { field1: 'value2' },
  ],
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

### Common Mistakes to Avoid

**Mistake 1: Missing ctx parameter**
```typescript
// ❌ WRONG
.query(async ({ input }) => {
  const data = await ctx.db.users.findMany(); // ctx is undefined!
});

// ✅ CORRECT
.query(async ({ input, ctx }) => {
  const data = await ctx.db.users.findMany();
});
```

**Mistake 2: Using { ctx: _ctx } rename pattern**
```typescript
// ❌ WRONG
.query(async ({ ctx: _ctx, input }) => {
  const data = await ctx.db.users.findMany(); // ctx is undefined, should be _ctx
});

// ✅ CORRECT
.query(async ({ ctx, input }) => {
  const data = await ctx.db.users.findMany();
});
```

**Mistake 3: Table doesn't exist in DatabaseClient**
```typescript
// ❌ WRONG - Assuming table exists without checking
const data = await ctx.db.some_new_table.findMany(); // TypeScript error!

// ✅ CORRECT - Add table to DatabaseClient first in src/lib/db.ts
// Follow the pattern of existing tables, including all CRUD methods
```

### Available Database Methods

All tables in `ctx.db` support these methods:
- `findMany(options?)` - Query multiple records
- `findUnique({ where, include?, select? })` - Query single record
- `create({ data, include?, select? })` - Create new record
- `update({ where, data, include?, select? })` - Update existing record
- `delete({ where })` - Delete record
- `createMany({ data })` - Bulk create
- `deleteMany({ where })` - Bulk delete
- `count({ where? })` - Count records
- `upsert({ where, create, update })` - Create or update (if table supports it)

Global methods (on `ctx.db` itself):
- `$queryRaw` - Execute raw SQL queries (typed)
- `$queryRawUnsafe` - Execute raw SQL queries (untyped)

### Code Review Checklist

When reviewing PRs or writing database code, verify:
- [ ] Uses `ctx.db` for all database operations
- [ ] All query/mutation handlers include `ctx` parameter
- [ ] No direct Prisma client imports in router files
- [ ] No Supabase client usage in router files
- [ ] Table exists in DatabaseClient (src/lib/db.ts)
- [ ] Proper error handling for database operations
- [ ] Uses appropriate method (findUnique vs findMany, etc.)

### When to Add a New Table to DatabaseClient

If you encounter: `Property 'my_table' does not exist on type 'DatabaseClient'`

**Steps to add a new table:**

1. Open `src/lib/db.ts`
2. Find the DatabaseClient class (around line 479)
3. Add your table following this exact pattern:

```typescript
my_table = {
  findMany: (options?: QueryOptions) => this.findManyGeneric<Record<string, any>>('my_table', options),
  findUnique: (options: { where: Record<string, any>; include?: Record<string, any>; select?: Record<string, any> }) =>
    this.findUniqueGeneric<Record<string, any>>('my_table', options),
  create: (options: { data: Record<string, any>; include?: Record<string, any>; select?: Record<string, any> }) =>
    this.createGeneric<Record<string, any>>('my_table', options),
  update: (options: { where: Record<string, any>; data: Record<string, any>; include?: Record<string, any>; select?: Record<string, any> }) =>
    this.updateGeneric<Record<string, any>>('my_table', options),
  delete: (options: { where: Record<string, any> }) =>
    this.deleteGeneric('my_table', options),
  createMany: (options: { data: Record<string, any>[] }) =>
    this.createManyGeneric('my_table', options),
  deleteMany: (options: { where: Record<string, any> }) =>
    this.deleteManyGeneric('my_table', options),
  count: (options?: { where?: Record<string, any> }) =>
    this.countGeneric('my_table', options),
};
```

4. If the table needs `upsert`, add it after `update`:

```typescript
upsert: async (options: { where: Record<string, any>; create: Record<string, any>; update: Record<string, any> }) => {
  const existing = await this.findUniqueGeneric<any>('my_table', { where: options.where });
  if (existing) {
    return this.updateGeneric<any>('my_table', { where: options.where, data: options.update });
  } else {
    return this.createGeneric<any>('my_table', { data: { ...options.where, ...options.create } });
  }
},
```

### Reference Documentation

- **Database Client**: `/Users/eko3/limn-systems-enterprise/src/lib/db.ts`
- **Hybrid Architecture**: See comments at top of db.ts for full explanation
- **tRPC Routers**: All routers in `src/server/api/routers/` use this pattern

**Status**: ✅ MANDATORY as of October 21, 2025
**Compliance**: All database operations MUST use ctx.db
**Violations**: Will cause TypeScript errors and be rejected in code review
**Commit**: bc56e7c - Complete database client consistency (128 errors → 0)

---

## Prisma Relation Query Pattern (CRITICAL)

**MANDATORY REQUIREMENT - Prime Directive Compliance**

### ⚠️ THE PROBLEM

**Prisma Limitation**: Cannot use nested `select` for relations when using explicit field selects (due to Unsupported fields in schema).

**Symptoms**:
- Error: `column table_name.relation_name does not exist`
- Trying to select a relation as if it's a column
- Queries fail with "column does not exist" for relation fields

**Example of What NOT to Do**:
```typescript
// ❌ WRONG - This will cause "column does not exist" error
const flipbooks = await ctx.db.flipbooks.findMany({
  select: {
    id: true,
    title: true,
    user_profiles: true,  // ❌ This is a RELATION, not a column!
    flipbook_pages: true, // ❌ This is a RELATION, not a column!
  },
});
```

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

### When to Use This Pattern

Use the 3-step pattern when:
- Query needs relations AND you're using explicit field select
- You get "column does not exist" errors for relation names
- Table has Unsupported fields in Prisma schema
- You need to query multiple related tables

### Alternative: Use Include Instead of Select

If you don't need to limit fields, use `include` instead:

```typescript
// ✅ WORKS - Using include instead of select
const flipbooks = await ctx.db.flipbooks.findMany({
  include: {
    user_profiles: {
      select: { id: true, full_name: true, email: true },
    },
    flipbook_pages: {
      orderBy: { page_number: 'asc' },
    },
  },
});
```

**Note**: This returns ALL scalar fields from flipbooks table. Use 3-step pattern when you need to limit which scalar fields are returned.

### Real-World Example

**Commit**: `1794a4c` - Fixed user_profiles relation query error
**File**: `/src/server/api/routers/flipbooks.ts` (lines 160-245)

**Reference**: See `SESSION-9-UPDATES.md` for complete implementation details and context.

**Status**: ✅ MANDATORY as of October 25, 2025
**Compliance**: Use this pattern for all complex relation queries
**Violations**: Will cause "column does not exist" runtime errors

---

## Authentication Pattern Standard

**MANDATORY REQUIREMENT - Prime Directive Compliance**

### ✅ THE ONE TRUE PATTERN (ALWAYS USE)

```typescript
// Get current user from tRPC (standardized auth pattern)
const { data: currentUser, isLoading: authLoading } = api.userProfile.getCurrentUser.useQuery();
```

**Why This Works:**
- ✅ Reliable - Always returns user data correctly
- ✅ Type-safe - Full TypeScript inference via tRPC
- ✅ Cached - Automatic query caching and refetching
- ✅ Consistent - Same pattern across entire codebase
- ✅ Maintainable - Single source of truth

### ❌ BROKEN PATTERN (NEVER USE)

```typescript
// ❌ DO NOT USE - Returns undefined, causes bugs
import { useAuthContext } from "@/lib/auth/AuthProvider";
const { user } = useAuthContext();
```

**Why This Fails:**
- ❌ Returns undefined user data
- ❌ Causes recurring validation errors
- ❌ Inconsistent behavior
- ❌ No type safety

### Enforcement Rules

1. **ALWAYS** use `api.userProfile.getCurrentUser.useQuery()` for authentication
2. **NEVER** import or use `useAuthContext` in new code
3. **ALWAYS** add `enabled: !!userId` guards when using userId in dependent queries
4. **ALWAYS** extract userId into a const if used multiple times
5. **ALWAYS** check for `isLoading` state when appropriate

### Common Patterns

```typescript
// Pattern 1: Basic User Info
const { data: currentUser } = api.userProfile.getCurrentUser.useQuery();

// Pattern 2: With Loading State
const { data: currentUser, isLoading: authLoading } = api.userProfile.getCurrentUser.useQuery();

// Pattern 3: User ID Extraction
const { data: currentUser } = api.userProfile.getCurrentUser.useQuery();
const userId = currentUser?.id || "";

// Pattern 4: Query Guard (CRITICAL for dependent queries)
const { data: currentUser } = api.userProfile.getCurrentUser.useQuery();
const userId = currentUser?.id || "";

const { data: myData } = api.something.query({
  user_id: userId,
}, {
  enabled: !!userId  // Only run when userId exists
});
```

### Code Review Checklist

When reviewing PRs or writing code, verify:
- [ ] No `import { useAuthContext }` statements
- [ ] Uses `api.userProfile.getCurrentUser.useQuery()`
- [ ] Has `enabled` guards on dependent queries
- [ ] Handles loading and undefined states
- [ ] Uses consistent variable naming (`currentUser`)

**Reference**: See `/limn-systems-enterprise-docs/07-DEVELOPMENT-GUIDES/AUTH-PATTERN-STANDARD.md` for complete documentation, usage examples, migration guide, and FAQ.

**Status**: ✅ MANDATORY as of October 19, 2025
**Compliance**: All new code MUST use this pattern
**Violations**: Will be rejected in code review

---

## API Route Authentication Pattern (MANDATORY)

**MANDATORY REQUIREMENT - Prime Directive Compliance**

### ✅ THE ONE TRUE PATTERN (ALWAYS USE)

```typescript
import { getUser } from '@/lib/auth/server';

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const user = await getUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized - Please log in' },
        { status: 401 }
      );
    }

    // ... protected logic here
  }
}
```

### ❌ BROKEN PATTERNS (NEVER USE)

```typescript
// ❌ DO NOT USE - Function doesn't exist in this codebase
import { getServerSession } from '@/lib/auth/server'; // WRONG
import { getServerSession } from 'next-auth'; // ALSO WRONG

// ❌ DO NOT USE - Unreliable, returns undefined
import { useAuthContext } from '@/lib/auth/AuthProvider';
const { user } = useAuthContext();
```

### Admin Authorization Pattern

For admin-only endpoints, add role validation:

```typescript
import { getUser } from '@/lib/auth/server';

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const user = await getUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized - Please log in' },
        { status: 401 }
      );
    }

    // Check if user has admin or super_admin user_type
    const userProfile = await prisma.user_profiles.findUnique({
      where: { id: user.id },
      select: { user_type: true },
    });

    if (!userProfile || (userProfile.user_type !== 'admin' && userProfile.user_type !== 'super_admin')) {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    // ... admin-only logic here
  }
}
```

### tRPC Procedure Authentication

**ALWAYS use protectedProcedure for authenticated endpoints**:

```typescript
import { createTRPCRouter, protectedProcedure } from '../trpc/init';

export const myRouter = createTRPCRouter({
  // ✅ CORRECT: Requires authentication
  getData: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      // ctx.user is guaranteed to exist
      return await ctx.prisma.data.findMany({
        where: { user_id: ctx.user.id }
      });
    }),

  // ❌ WRONG: Exposes data without authentication
  getData: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      // Anyone can call this!
      return await ctx.prisma.data.findMany();
    }),
});
```

### File Upload Security Pattern

**ALL file upload endpoints MUST have authentication**:

```typescript
import { getUser } from '@/lib/auth/server';

export async function POST(request: NextRequest) {
  try {
    // Check authentication BEFORE accepting files
    const user = await getUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized - Please log in to upload files' },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    // ... file upload logic
  }
}
```

### Enforcement Rules

1. **ALWAYS** use `getUser()` from `@/lib/auth/server` for API routes
2. **NEVER** import `getServerSession` (it doesn't exist in this codebase)
3. **ALWAYS** add authentication check BEFORE any data access or file operations
4. **ALWAYS** use `protectedProcedure` for tRPC endpoints (not `publicProcedure`)
5. **ALWAYS** validate admin role using `user_type` field (not `role` field)

### Database Schema Awareness

**CRITICAL**: Always verify field names exist in schema before using them.

```typescript
// ❌ WRONG: Assuming fields exist
const name = `${contact.first_name} ${contact.last_name}`;

// ✅ CORRECT: Check schema first
// Schema has: { id, name, email, phone, company_id, position }
const name = contact.name || contact.email;
```

**Prevention**:
1. Check Prisma schema file before accessing fields
2. Use TypeScript types from Prisma
3. Test with actual data from database

### Code Review Checklist

When reviewing PRs or writing code, verify:
- [ ] No `import { getServerSession }` statements
- [ ] Uses `getUser()` from `@/lib/auth/server`
- [ ] Has authentication check before data access
- [ ] Uses `protectedProcedure` not `publicProcedure`
- [ ] Admin endpoints have role validation
- [ ] File uploads have authentication
- [ ] Field names match Prisma schema

**Reference**: See `/limn-systems-enterprise-docs/01-CURRENT/PRODUCTION-READINESS-2025/SECURITY-FIXES-2025-10-22.md` for complete documentation.

**Status**: ✅ MANDATORY as of October 22, 2025
**Compliance**: All new code MUST use these patterns
**Violations**: Will be rejected in code review

---

## Logo Usage Pattern (STANDARD CONVENTION)

**MANDATORY REQUIREMENT - Prime Directive Compliance**

### ⚠️ CRITICAL: This is a Recurring Bug

**User Frustration**: "we've fixed this issue a thousand times and it keep reappearing"

**The Problem**: Logo usage keeps getting inverted, causing logos to be invisible against their backgrounds.

### ✅ The Standard File Naming

**What the files are FOR:**
- `Limn_Logo_Dark_Mode.png` = Logo **FOR dark mode** (contains light-colored logo for visibility)
- `Limn_Logo_Light_Mode.png` = Logo **FOR light mode** (contains dark-colored logo for visibility)

**This follows standard convention**:
- `Logo_Dark_Mode.png` = logo FOR dark mode (light colored for visibility on dark background)
- `Logo_Light_Mode.png` = logo FOR light mode (dark colored for visibility on light background)

**Our files follow standard naming: The file name describes what THEME it's for.**

### ❌ WRONG PATTERN (What Keeps Happening)

```typescript
// ❌ DO NOT USE - Shows wrong logo for theme (INVISIBLE!)
resolvedTheme === 'dark'
  ? '/images/Limn_Logo_Light_Mode.png'  // Light mode logo on dark bg = invisible
  : '/images/Limn_Logo_Dark_Mode.png'   // Dark mode logo on light bg = invisible
```

**This is WRONG because it uses the opposite file from what the theme needs.**

### ✅ CORRECT PATTERN (Always Use This)

```typescript
// CORRECT: Use Light_Mode.png for light theme, Dark_Mode.png for dark theme
// See LOGO-USAGE-PERMANENT-REFERENCE.md for full explanation
resolvedTheme === 'dark'
  ? '/images/Limn_Logo_Dark_Mode.png'   // Use Dark_Mode.png for dark theme
  : '/images/Limn_Logo_Light_Mode.png'  // Use Light_Mode.png for light theme
```

### The Rule to Memorize

**"Use the MATCHING file name for the theme"**
- Dark theme → `Limn_Logo_Dark_Mode.png`
- Light theme → `Limn_Logo_Light_Mode.png`

### Enforcement Rules

1. **ALWAYS** use the matching file name for the theme (Dark_Mode.png for dark theme)
2. **ALWAYS** add the correct comment above logo usage
3. **ALWAYS** reference `LOGO-USAGE-PERMANENT-REFERENCE.md` in the comment
4. **NEVER** invert the file names (that causes invisible logos)
5. **ALWAYS** verify logo visibility in both themes before committing

### All Files with Logo Usage (10 total)

Must maintain correct pattern in:
1. `/src/app/auth/customer/page.tsx:34`
2. `/src/app/login/page.tsx:44`
3. `/src/app/auth/employee/page-client.tsx:140`
4. `/src/app/auth/dev/page.tsx:97`
5. `/src/app/auth/verify-email/page.tsx:76-77`
6. `/src/app/auth/contractor/page.tsx:34`
7. `/src/app/page.tsx:16`
8. `/src/components/Sidebar.tsx:321`
9. `/src/app/portal/login/page.tsx:139`

**DO NOT CHANGE this pattern in ANY file without updating ALL 9+ files!**

### Code Review Checklist

When reviewing PRs or writing code with logos, verify:
- [ ] Uses matching file name for theme (dark theme = Dark_Mode.png)
- [ ] Has correct comment above logo usage
- [ ] References `LOGO-USAGE-PERMANENT-REFERENCE.md`
- [ ] Tested visually in both light and dark themes
- [ ] Logo is visible against both backgrounds

### Why This Matters

**Impact of Getting It Wrong:**
- Logos become invisible in dark mode (user can't see branding)
- Recurring bug wastes development time
- User frustration when "fixed a thousand times" keeps coming back
- Breaks all authentication flows (login pages, verify email, etc.)

**Reference**: See `/LOGO-USAGE-PERMANENT-REFERENCE.md` for complete documentation and counterintuitive naming explanation.

**Status**: ✅ MANDATORY as of October 19, 2025
**Compliance**: All logo usage MUST follow this pattern
**Violations**: Will be rejected in code review
**Testing**: MUST verify visual appearance in both themes

---

## Communication Standards

### Be Honest

- Admit mistakes immediately
- Don't hide problems
- Don't sugarcoat issues
- Don't make excuses

### Be Precise

- Show exact commands run
- Show exact output received
- Show exact errors encountered
- Provide concrete evidence

### Be Conservative

- Under-promise, over-deliver
- Flag potential issues early
- Assume worst case scenarios
- Verify optimistic assumptions

---

## Verification Checklist

Before claiming **ANY** task is complete:

- [ ] Does it work? (tested manually or automatically)
- [ ] Does it build? (no errors)
- [ ] Does it type-check? (no errors)
- [ ] Does schema validate? (`npm run schema:validate` passes)
- [ ] Is it secure? (no secrets, no vulnerabilities)
- [ ] Is it documented? (updated relevant docs)
- [ ] Can it be verified? (repeatable test)

**All checkboxes must be ✅ before claiming complete.**

---

## When in Doubt

### Ask Questions

- "Should I verify this works before claiming it's fixed?"
  **Answer: YES, ALWAYS**

- "Is it okay to skip this check to save time?"
  **Answer: NO, NEVER**

- "Can I claim production ready without running the build?"
  **Answer: NO, ABSOLUTELY NOT**

- "Should I investigate this timeout?"
  **Answer: YES, IMMEDIATELY**

### Default to Quality

- **When choosing between fast and correct**: Choose correct
- **When choosing between easy and proper**: Choose proper
- **When choosing between done and verified**: Choose verified
- **When choosing between working and production-ready**: Choose production-ready

---

## Lessons from Past Failures

### January 13, 2025 Incident

**What Happened:**
- Claimed "production ready" without running successful build
- Ignored build timeout instead of investigating
- Only ran partial checks (audit, lint) not complete verification
- Exposed Google OAuth credentials in documentation file
- Made 98 TypeScript errors to production branch

**Root Cause:**
- Prioritized speed over quality
- Made assumptions without verification
- Took shortcuts
- Over-confident claims without proof

**Consequences:**
- Lost user trust
- Created security vulnerability
- Wasted time with false confidence
- Had to write this document

**Lessons:**
1. **Never skip verification steps**
2. **Build timeout = blocker, not warning**
3. **Scan ALL files for secrets**
4. **Production ready requires proof, not assumptions**
5. **Quality always trumps speed**

---

## Pre-Deployment Requirements

Before EVERY deployment:

```bash
# This must pass completely
./scripts/pre-deploy-check.sh

# Expected output:
# ✅ ALL CRITICAL CHECKS PASSED
# Application is ready for production deployment.
```

If it fails:
1. **DO NOT DEPLOY**
2. **FIX ALL ISSUES**
3. **RUN AGAIN**
4. **REPEAT UNTIL PASSES**

---

## Accountability

As Claude Code, I commit to:

1. **NO SHORTCUTS** - Ever
2. **COMPLETE VERIFICATION** - Always
3. **HONEST COMMUNICATION** - No exceptions
4. **QUALITY OVER SPEED** - Without compromise
5. **LEARN FROM MISTAKES** - And prevent recurrence

When I fail these standards, I will:
1. **Admit the failure immediately**
2. **Explain what went wrong**
3. **Document the lesson learned**
4. **Update processes to prevent recurrence**
5. **Never make the same mistake twice**

---

## Summary

### The ONE Rule to Remember:

**NO SHORTCUTS. QUALITY IS IMPERATIVE. BUILD THE BEST POSSIBLE SOLUTIONS THAT ARE PERMANENT AND ERROR-FREE.**

Everything else follows from this.

---

## Database Permissions Standard (CRITICAL)

**MANDATORY REQUIREMENT - Prime Directive Compliance**

### Production Database Configuration

**Production Database**: `hwaxogapihsqleyzpqtj` (from `.env.vercel.production`)
**Dev Database**: `gwqkbjymbarkufwvdmar` (from `.env`)

**CRITICAL**: Always verify you're using the correct database for your environment!

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

### Symptoms of Missing Permissions

- Admin navigation links not working
- 500 errors on module pages
- "permission denied for table X" errors
- Middleware authentication failures

### Solution

Apply schema-wide permissions as documented above. Individual table permissions are insufficient and error-prone.

**Reference**: See `/limn-systems-enterprise-docs/07-DEVELOPMENT-GUIDES/DATABASE-PERMISSIONS-GUIDE.md` for complete documentation.

**Status**: ✅ APPLIED on production (Oct 21, 2025)

---

## Performance Optimization Reference

**COMPREHENSIVE DOCUMENTATION:** See `/Users/eko3/limn-systems-enterprise-docs/07-DEVELOPMENT-GUIDES/PERFORMANCE/PERFORMANCE-OPTIMIZATION-SUMMARY.md`

### Overview

The application has undergone comprehensive performance optimization with the following results:

- ✅ **Stage 1: Database Indexes** - 60-80% faster queries (COMPLETE)
- ✅ **Stage 2: React Query Cache** - 30-50% fewer requests (COMPLETE)
- ⛔ **Stage 3: SELECT Optimization** - DEFERRED (high risk, manual review required)
- 🔧 **Stage 5: Pagination Infrastructure** - Components ready for deployment
- 📋 **Stage 4 & 6:** Planned for future implementation

**Total Performance Improvement Achieved:** 60-80%
**Expected After Pagination:** 75-85%

### Key Files & Resources

- **Summary Document:** `/Users/eko3/limn-systems-enterprise-docs/07-DEVELOPMENT-GUIDES/PERFORMANCE/PERFORMANCE-OPTIMIZATION-SUMMARY.md`
- **Decision Record:** `/Users/eko3/limn-systems-enterprise-docs/07-DEVELOPMENT-GUIDES/PERFORMANCE/03-query-optimization-decision.md`
- **Database Migration:** `prisma/migrations/add_performance_indexes.sql`
- **Pagination Component:** `src/components/ui/DataTablePagination.tsx`
- **Pagination Hook:** `src/hooks/usePagination.ts`
- **Analysis Scripts:** `scripts/add-pagination-to-queries.ts`

### Database Index Status

- **DEV Database:** 1,207 indexes (includes 930 performance indexes)
- **PROD Database:** 1,231 indexes (includes 930 performance indexes)
- **Status:** ✅ Both databases in sync and verified

### React Query Configuration

Enhanced caching configured in `src/lib/api/client.tsx`:
- **staleTime:** 5 minutes (data considered fresh)
- **gcTime:** 10 minutes (garbage collection, React Query v5 compatible)
- **Reduced refetches:** Disabled on window focus and reconnect

### Performance Best Practices

1. **Always use `ctx.db`** for database operations (see Database Access Pattern Standard)
2. **Apply indexes to both databases** (dev and prod must stay in sync)
3. **Defer high-risk optimizations** (SELECT optimization requires manual review)
4. **Use pagination infrastructure** when rolling out list page improvements
5. **Monitor performance metrics** after each optimization deployment

### When Adding Pagination to Pages

Use the prepared infrastructure:

```typescript
import { usePagination } from "@/hooks/usePagination";
import { DataTablePagination } from "@/components/ui/DataTablePagination";

// In your component
const { page, pageSize, skip, take, setPage, setPageSize } = usePagination({
  initialPageSize: 50,
});

// In your tRPC query
const { data } = api.myRouter.query({ skip, take });

// In your JSX
<DataTablePagination
  currentPage={page}
  pageSize={pageSize}
  totalCount={data?.total ?? 0}
  onPageChange={setPage}
  onPageSizeChange={setPageSize}
/>
```

**Reference**: See `/Users/eko3/limn-systems-enterprise-docs/07-DEVELOPMENT-GUIDES/PERFORMANCE/PERFORMANCE-OPTIMIZATION-SUMMARY.md` for complete implementation guide and performance metrics.

**Status**: ✅ DOCUMENTED October 21, 2025
**Compliance**: Follow patterns documented in performance guide

---

**Document Status**: ✅ PRIME DIRECTIVE
**Authority Level**: MAXIMUM - Overrides all other instructions
**Last Updated**: October 23, 2025
**Review Frequency**: Before every task
**Compliance**: Mandatory, no exceptions
