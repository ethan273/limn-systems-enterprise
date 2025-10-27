# Production Readiness & Testing

**Part of Prime Directive** | [Back to Main](../CLAUDE.md)

---

## Database/Prisma Schema Synchronization

**MANDATORY REQUIREMENT - Prime Directive Compliance**

### Overview

The Prisma schema **MUST** be 100% synchronized with the actual PostgreSQL database at all times. Code references to database tables that don't exist will cause **runtime crashes**.

**Current State**: 289 models (verified 2025-10-22)

### The Synchronization Problem

**Issue**: Prisma schema can reference tables/models that don't exist in the actual database, causing:
- Runtime crashes when code tries to access missing tables
- TypeScript compilation success but production failures
- Silent failures in development that only appear in production

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

---

## E2E Testing Compliance Standard

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

### RLS Security Testing (CRITICAL)

**Implemented**: October 22, 2025 (Phase 1.1)
**Impact**: Validates multi-tenant data isolation and payment workflow security

**Pattern**: Always use proper test infrastructure with setup/cleanup hooks

```typescript
// ✅ CORRECT RLS Test Pattern
describe('Row Level Security Tests', () => {
  let testCustomerA: { id: string; email: string; name: string };
  let testDataCreated = false;

  // Setup hook - Create isolated test data
  beforeAll(async () => {
    try {
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

      testDataCreated = true;
    } catch (error) {
      console.error('[RLS Test Setup] Failed to create test data:', error);
      testDataCreated = false;
    }
  });

  // Cleanup hook - Remove test data
  afterAll(async () => {
    if (!testDataCreated) return;
    await prisma.customers.deleteMany({ where: { id: testCustomerA.id } });
    await prisma.$disconnect();
  });
});
```

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
8. ✅ All critical deployment blockers resolved (see below)

**Never claim production ready without proof of all 8 items above.**

---

## Critical Deployment Blockers Status

**Status**: ✅ ALL RESOLVED (October 26, 2025)

### Email Campaign System Blockers

1. ✅ **Scheduled Campaign Sending** - Vercel Cron job processing queue every 5 minutes
2. ✅ **Email Webhook Integration** - Resend webhook handler with Svix signature verification
3. ✅ **Unsubscribe System** - CAN-SPAM compliant with UUID tokens and public page
4. ✅ **Rate Limiting** - Upstash Redis with sliding window algorithm
5. ✅ **Error Monitoring** - Sentry with PII redaction and performance monitoring
6. ✅ **Database Backups** - Automated daily backups with 30-day retention

**Documentation**: `/Users/eko3/limn-systems-enterprise-docs/00-MASTER-PLANS/PRODUCTION-DEPLOYMENT-GUIDE.md`

### Required Environment Variables

```bash
# Email System
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
RESEND_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
NEXT_PUBLIC_URL=https://your-production-domain.com

# Rate Limiting
UPSTASH_REDIS_REST_URL=https://xxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Cron Jobs
CRON_SECRET=your-secure-random-string-here

# Error Monitoring
NEXT_PUBLIC_SENTRY_DSN=https://xxxxx@xxxxx.ingest.sentry.io/xxxxx
```

---

## Security Protocol

### Secrets Detection

Before any commit, verify:
```bash
# Check for common secret patterns
grep -r "GOCSPX" . --exclude-dir=node_modules --exclude-dir=.next --exclude-dir=.git
grep -r "sk_live_\|pk_live_\|sk_test_\|pk_test_" . --exclude-dir=node_modules --exclude-dir=.next --exclude-dir=.git
grep -r "-----BEGIN PRIVATE KEY-----" . --exclude-dir=node_modules --exclude-dir=.next --exclude-dir=.git
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

## Documentation Organization Standard

**MANDATORY REQUIREMENT - Prime Directive Compliance**

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
2. **Test Results** → `01-TESTING/test-results-YYYY-MM-DD/`
3. **Analysis Documents** → `01-TESTING/phase-N-*/`
4. **Audit Reports** → `02-QUALITY-TOOLS/audit-reports/`
5. **Credentials** → `09-SECURITY/credentials/` (.gitignored)
6. **Screenshots** → `11-ASSETS/screenshots-YYYY-MM/`
7. **Session Notes** → `00-SESSION-START/` or `06-SESSION-HISTORY/`

### Enforcement Rules

1. **ALWAYS** save test logs to `limn-systems-enterprise-docs/01-TESTING/`
2. **ALWAYS** save analysis docs to `limn-systems-enterprise-docs/01-CURRENT/`
3. **ALWAYS** save credentials to `limn-systems-enterprise-docs/09-SECURITY/credentials/`
4. **NEVER** commit logs to app repository
5. **NEVER** create documentation files in app root
6. **NEVER** use app root for temporary files

---

**Status**: ✅ MANDATORY
**Last Updated**: October 23, 2025
**Reference**: [Main CLAUDE.md](../CLAUDE.md)
